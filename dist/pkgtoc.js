#!/usr/bin/env node

/* eslint no-console: 0 */
// Requires
"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var fs = require("fs");

var prettier = require("prettier");

var _require = require("util"),
    promisify = _require.promisify;

var _require2 = require("chalk"),
    green = _require2.green,
    yellow = _require2.yellow,
    red = _require2.red; // Defaults / Constants


var FILE_WRITE = "README.md";
var FILE_PACKAGE = "package.json";
var FILE_LERNA = "lerna.json";
var GLOB_PACKAGES = "packages/*";
var COLUMN_COUNT = 2;
var COLUMN_MAX = 3;
var SHIELDS_COLOR = "cb3837"; // Table bookends

var COMMENT_START = "<!-- START pkgtoc, keep to allow update -->\n\n";
var COMMENT_END = "\n<!-- END pkgtoc, keep to allow update -->\n\n";
var logger = {
  log: function log(action) {
    var _console;

    for (var _len = arguments.length, msgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      msgs[_key - 1] = arguments[_key];
    }

    return (_console = console).log.apply(_console, [green("\u2714 ".concat(action))].concat(msgs));
  },
  warn: function warn(msg) {
    return console.warn(yellow("▵ Warning"), msg);
  },
  error: function error(msg) {
    return console.error(red("✕ Failure"), msg);
  }
}; // Promisified functions

var readFile = promisify(fs.readFile);
var glob = promisify(require("glob"));
var writeFile = promisify(fs.writeFile);
var lstat = promisify(fs.lstat);

var getShield = function getShield(_ref) {
  var name = _ref.name,
      version = _ref.version,
      shieldsColor = _ref.shieldsColor,
      shieldsAuto = _ref.shieldsAuto;
  // Dashes are separators unless duplicated. (e.g. beta-0.1)
  var fixVersion = version.replace("-", "--");
  return "![".concat(name, " npm badge)](").concat(shieldsAuto ? "https://img.shields.io/badge/npm-".concat(fixVersion, "-").concat(shieldsColor, ".svg") : "https://img.shields.io/npm/v/".concat(name, ".svg?colorB=").concat(shieldsColor), ")");
};

var getTitle = function getTitle(_ref2) {
  var name = _ref2.name,
      path = _ref2.path;
  return "**[".concat(name, "](").concat(path, "/)**");
};

var getColumns = function getColumns(_ref3) {
  var _ref3$columns = _ref3.columns,
      columns = _ref3$columns === void 0 ? COLUMN_COUNT : _ref3$columns,
      shields = _ref3.shields;

  if (!columns || Number.isNaN(columns) || columns > COLUMN_MAX || columns <= 0) {
    logger.warn("Only 1-".concat(COLUMN_MAX, " columns supported"));
    logger.warn("Falling back ".concat(COLUMN_COUNT, " columns"));
    return COLUMN_COUNT;
  }

  if (!shields && columns === COLUMN_COUNT + 1) {
    logger.warn("".concat(COLUMN_COUNT + 1, " columns require the --shields flag"));
    logger.warn("Falling back ".concat(COLUMN_COUNT, " columns"));
    return COLUMN_COUNT;
  }

  return columns;
};

var getFormat = function getFormat(_ref4) {
  var columns = _ref4.columns,
      shields = _ref4.shields;

  switch (columns) {
    case 1:
      return {
        head: ["Package"],
        row: function row(_ref5) {
          var _ref5$description = _ref5.description,
              description = _ref5$description === void 0 ? "" : _ref5$description,
              shield = _ref5.shield,
              title = _ref5.title;
          return ["".concat(shields ? "".concat(shield, "<br />") : "").concat(title, "<br />").concat(description)];
        }
      };

    case 2:
      return {
        head: shields ? ["Version", "Package"] : ["Package", "Description"],
        row: function row(_ref6) {
          var _ref6$description = _ref6.description,
              description = _ref6$description === void 0 ? "" : _ref6$description,
              shield = _ref6.shield,
              title = _ref6.title;
          return shields ? [shield, "".concat(title, "<br />").concat(description)] : [title, description];
        }
      };

    default:
      return {
        head: ["Package", "Version", "Description"],
        row: function row(_ref7) {
          var _ref7$description = _ref7.description,
              description = _ref7$description === void 0 ? "" : _ref7$description,
              shield = _ref7.shield,
              title = _ref7.title;
          return [title, shield, description];
        }
      };
  }
};

var reduceArrToRow = function reduceArrToRow(arr) {
  return arr.reduce(function (m, v) {
    return "".concat(m).concat(v, "|");
  }, "|");
};

var reduceArrToDiv = function reduceArrToDiv(arr) {
  return arr.reduce(function (m) {
    return "".concat(m, ":-|");
  }, "|");
};

var packageInformationReducer = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(memo, path) {
    var stat, pkg, result;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return lstat(path);

          case 2:
            stat = _context.sent;

            if (stat.isDirectory()) {
              _context.next = 5;
              break;
            }

            return _context.abrupt("return", memo);

          case 5:
            _context.prev = 5;
            _context.next = 8;
            return readFile("".concat(path, "/").concat(FILE_PACKAGE));

          case 8:
            pkg = _context.sent;
            _context.next = 11;
            return memo;

          case 11:
            result = _context.sent;
            return _context.abrupt("return", result.concat(_objectSpread({
              path: path
            }, JSON.parse(pkg))));

          case 15:
            _context.prev = 15;
            _context.t0 = _context["catch"](5);
            logger.warn("Skipping ".concat(path, " due to error"));
            logger.warn(_context.t0);

          case 19:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[5, 15]]);
  }));

  return function packageInformationReducer(_x, _x2) {
    return _ref8.apply(this, arguments);
  };
}();

var getPackageType = function getPackageType() {
  var filepath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
  var paths = filepath.split("/");
  var folder = paths[paths.length - 2] || "";
  return folder[0].toUpperCase() + folder.slice(1);
};

var formatPackagesToTable = function formatPackagesToTable(packages, flags) {
  var format = getFormat(flags);
  return packages.reduce( /*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(memo, pkgList) {
      var head, table;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              head = format.head;
              _context2.next = 3;
              return pkgList.reduce(packageInformationReducer, []);

            case 3:
              table = _context2.sent;
              _context2.next = 6;
              return memo;

            case 6:
              return _context2.abrupt("return", _context2.sent.concat("**".concat(getPackageType(pkgList[0]), "**\n")).concat(reduceArrToRow(head)).concat(reduceArrToDiv(head)).concat(table.sort(function (a, b) {
                return a.name > b.name ? 1 : -1;
              }).map(function (_ref10) {
                var name = _ref10.name,
                    description = _ref10.description,
                    path = _ref10.path,
                    version = _ref10.version;
                return reduceArrToRow(format.row({
                  shield: getShield(_objectSpread(_objectSpread({}, flags), {}, {
                    name: name,
                    version: version
                  })),
                  title: getTitle({
                    name: name,
                    path: path
                  }),
                  description: description
                }));
              })));

            case 7:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    return function (_x3, _x4) {
      return _ref9.apply(this, arguments);
    };
  }(), []);
};

var getPackagesList = /*#__PURE__*/function () {
  var _ref12 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(_ref11) {
    var isLerna, pattern, globsPackages, json, data;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            isLerna = _ref11.lerna, pattern = _ref11.glob;
            globsPackages = [pattern];

            if (!isLerna) {
              _context4.next = 9;
              break;
            }

            logger.log("Reading", "lerna config...");
            _context4.next = 6;
            return readFile(FILE_LERNA);

          case 6:
            json = _context4.sent;
            data = JSON.parse(json);
            globsPackages = data.packages;

          case 9:
            return _context4.abrupt("return", Promise.all(globsPackages.map( /*#__PURE__*/function () {
              var _ref13 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(globPattern) {
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        logger.log("Reading", globPattern);
                        return _context3.abrupt("return", glob(globPattern));

                      case 2:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3);
              }));

              return function (_x6) {
                return _ref13.apply(this, arguments);
              };
            }())));

          case 10:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function getPackagesList(_x5) {
    return _ref12.apply(this, arguments);
  };
}();

var countPackages = function countPackages(packages) {
  return packages.reduce(function (acc, pkgs) {
    return acc + pkgs.length;
  }, 0);
};

var getFlags = function getFlags(_ref14) {
  var columns = _ref14.columns,
      dryRun = _ref14.dryRun,
      file = _ref14.file,
      pattern = _ref14.glob,
      lerna = _ref14.lerna,
      shields = _ref14.shields,
      shieldsAuto = _ref14.shieldsAuto,
      shieldsColor = _ref14.shieldsColor;
  return {
    columns: getColumns({
      columns: columns,
      shields: shields
    }),
    dryRun: dryRun,
    file: file || FILE_WRITE,
    glob: pattern || GLOB_PACKAGES,
    lerna: lerna,
    shields: shields,
    shieldsAuto: shieldsAuto,
    shieldsColor: shieldsColor || SHIELDS_COLOR
  };
};

var pkgtoc = /*#__PURE__*/function () {
  var _ref15 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
    var _flags,
        flags,
        filename,
        contents,
        packages,
        packagesCount,
        indexStart,
        indexEnd,
        tableStart,
        tableEnd,
        tables,
        tablesPretty,
        _args5 = arguments;

    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _flags = _args5.length > 0 && _args5[0] !== undefined ? _args5[0] : {};
            _context5.prev = 1;
            // Get flag defaults.
            flags = getFlags(_flags); // Get readme and packages

            if (flags.dryRun) {
              logger.warn("Dry run is on, not writing to file");
            }

            logger.log("Setting", "".concat(flags.columns, " column table"));

            if (flags.shields) {
              logger.log("Setting", "shields color to \"#".concat(flags.shieldsColor, "\""));

              if (flags.shieldsAuto) {
                logger.log("Setting", "shields to generate dynamic URLs");
              }
            }

            filename = flags.file;
            _context5.next = 9;
            return readFile(filename, {
              encoding: "utf8"
            });

          case 9:
            contents = _context5.sent;
            _context5.next = 12;
            return getPackagesList(flags);

          case 12:
            packages = _context5.sent;
            packagesCount = countPackages(packages);

            if (!(packagesCount === 0)) {
              _context5.next = 17;
              break;
            }

            logger.error("Pattern \"".concat(flags.glob, "\" glob returns empty"));
            return _context5.abrupt("return");

          case 17:
            // Find comments in README.MD
            indexStart = contents.indexOf(COMMENT_START);
            indexEnd = contents.indexOf(COMMENT_END); // Push table to beginning if no table comments

            tableStart = Math.max(0, indexStart);
            tableEnd = indexEnd > 0 ? indexEnd + COMMENT_END.length : tableStart; // Assemble rows from package.jsons

            _context5.next = 23;
            return formatPackagesToTable(packages, flags);

          case 23:
            tables = _context5.sent;
            tablesPretty = prettier.format(tables.join("\n"), {
              parser: "markdown"
            });
            logger.log("Writing", "".concat(countPackages(packages), " packages to ").concat(filename));

            if (!flags.dryRun) {
              writeFile(filename, contents.slice(0, tableStart).concat(COMMENT_START).concat(tablesPretty).concat(COMMENT_END).concat(contents.slice(tableEnd)));
            } // Return for testing.

            /* eslint consistent-return: 0 */


            return _context5.abrupt("return", tablesPretty);

          case 30:
            _context5.prev = 30;
            _context5.t0 = _context5["catch"](1);
            logger.error(_context5.t0);
            return _context5.abrupt("return", null);

          case 34:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, null, [[1, 30]]);
  }));

  return function pkgtoc() {
    return _ref15.apply(this, arguments);
  };
}();

module.exports = {
  pkgtoc: pkgtoc
};
