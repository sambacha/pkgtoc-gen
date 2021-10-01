#!/usr/bin/env node
/* eslint no-console: 0 */

// Requires
const fs = require("fs");
const prettier = require("prettier");
const { promisify } = require("util");
const { green, yellow, red } = require("chalk");

// Defaults / Constants
const FILE_WRITE = "README.md";
const FILE_PACKAGE = "package.json";
const FILE_LERNA = "lerna.json";
const GLOB_PACKAGES = "packages/*";
const COLUMN_COUNT = 2;
const COLUMN_MAX = 3;
const SHIELDS_COLOR = "cb3837";

// Table bookends
const COMMENT_START = "<!-- START pkgtoc, keep to allow update -->\n\n";
const COMMENT_END = "\n<!-- END pkgtoc, keep to allow update -->\n\n";

const logger = {
  log: (action, ...msgs) => console.log(green(`✔ ${action}`), ...msgs),
  warn: msg => console.warn(yellow("▵ Warning"), msg),
  error: msg => console.error(red("✕ Failure"), msg)
};

// Promisified functions
const readFile = promisify(fs.readFile);
const glob = promisify(require("glob"));

const writeFile = promisify(fs.writeFile);
const lstat = promisify(fs.lstat);

const getShield = ({ name, version, shieldsColor, shieldsAuto }) => {
  // Dashes are separators unless duplicated. (e.g. beta-0.1)
  const fixVersion = version.replace("-", "--");
  return `![${name} npm badge)](${
    shieldsAuto
      ? `https://img.shields.io/badge/npm-${fixVersion}-${shieldsColor}.svg`
      : `https://img.shields.io/npm/v/${name}.svg?colorB=${shieldsColor}`
  })`;
};

const getTitle = ({ name, path }) => `**[${name}](${path}/)**`;

const getColumns = ({ columns = COLUMN_COUNT, shields }) => {
  if (
    !columns ||
    Number.isNaN(columns) ||
    columns > COLUMN_MAX ||
    columns <= 0
  ) {
    logger.warn(`Only 1-${COLUMN_MAX} columns supported`);
    logger.warn(`Falling back ${COLUMN_COUNT} columns`);
    return COLUMN_COUNT;
  }

  if (!shields && columns === COLUMN_COUNT + 1) {
    logger.warn(`${COLUMN_COUNT + 1} columns require the --shields flag`);
    logger.warn(`Falling back ${COLUMN_COUNT} columns`);
    return COLUMN_COUNT;
  }

  return columns;
};

const getFormat = ({ columns, shields }) => {
  switch (columns) {
    case 1:
      return {
        head: ["Package"],
        row: ({ description = "", shield, title }) => [
          `${shields ? `${shield}<br />` : ""}${title}<br />${description}`
        ]
      };
    case 2:
      return {
        head: shields ? ["Version", "Package"] : ["Package", "Description"],
        row: ({ description = "", shield, title }) =>
          shields
            ? [shield, `${title}<br />${description}`]
            : [title, description]
      };
    default:
      return {
        head: ["Package", "Version", "Description"],
        row: ({ description = "", shield, title }) => [
          title,
          shield,
          description
        ]
      };
  }
};

const reduceArrToRow = arr => arr.reduce((m, v) => `${m}${v}|`, "|");
const reduceArrToDiv = arr => arr.reduce(m => `${m}:-|`, "|");

const packageInformationReducer = async (memo, path) => {
  const stat = await lstat(path);

  if (!stat.isDirectory()) {
    return memo;
  }

  try {
    const pkg = await readFile(`${path}/${FILE_PACKAGE}`);
    const result = await memo;
    return result.concat({ path, ...JSON.parse(pkg) });
  } catch (err) {
    logger.warn(`Skipping ${path} due to error`);
    logger.warn(err);
  }
};

const getPackageType = (filepath = "") => {
  const paths = filepath.split("/");
  const folder = paths[paths.length - 2] || "";
  return folder[0].toUpperCase() + folder.slice(1);
};

const formatPackagesToTable = (packages, flags) => {
  const format = getFormat(flags);
  return packages.reduce(async (memo, pkgList) => {
    const { head } = format;
    const table = await pkgList.reduce(packageInformationReducer, []);

    return (await memo)
      .concat(`**${getPackageType(pkgList[0])}**\n`)
      .concat(reduceArrToRow(head))
      .concat(reduceArrToDiv(head))
      .concat(
        table
          .sort((a, b) => (a.name > b.name ? 1 : -1))
          .map(({ name, description, path, version }) =>
            reduceArrToRow(
              format.row({
                shield: getShield({ ...flags, name, version }),
                title: getTitle({ name, path }),
                description
              })
            )
          )
      );
  }, []);
};

const getPackagesList = async ({ lerna: isLerna, glob: pattern }) => {
  let globsPackages = [pattern];
  if (isLerna) {
    logger.log("Reading", "lerna config...");
    const json = await readFile(FILE_LERNA);
    const data = JSON.parse(json);
    globsPackages = data.packages;
  }

  return Promise.all(
    globsPackages.map(async globPattern => {
      logger.log("Reading", globPattern);
      return glob(globPattern);
    })
  );
};

const countPackages = packages =>
  packages.reduce((acc, pkgs) => acc + pkgs.length, 0);

const getFlags = ({
  columns,
  dryRun,
  file,
  glob: pattern,
  lerna,
  shields,
  shieldsAuto,
  shieldsColor
}) => ({
  columns: getColumns({ columns, shields }),
  dryRun,
  file: file || FILE_WRITE,
  glob: pattern || GLOB_PACKAGES,
  lerna,
  shields,
  shieldsAuto,
  shieldsColor: shieldsColor || SHIELDS_COLOR
});

const pkgtoc = async (_flags = {}) => {
  try {
    // Get flag defaults.
    const flags = getFlags(_flags);

    // Get readme and packages
    if (flags.dryRun) {
      logger.warn("Dry run is on, not writing to file");
    }

    logger.log("Setting", `${flags.columns} column table`);

    if (flags.shields) {
      logger.log("Setting", `shields color to "#${flags.shieldsColor}"`);
      if (flags.shieldsAuto) {
        logger.log("Setting", "shields to generate dynamic URLs");
      }
    }

    const filename = flags.file;
    const contents = await readFile(filename, { encoding: "utf8" });
    const packages = await getPackagesList(flags);

    const packagesCount = countPackages(packages);

    if (packagesCount === 0) {
      logger.error(`Pattern "${flags.glob}" glob returns empty`);
      return;
    }

    // Find comments in README.MD
    const indexStart = contents.indexOf(COMMENT_START);
    const indexEnd = contents.indexOf(COMMENT_END);

    // Push table to beginning if no table comments
    const tableStart = Math.max(0, indexStart);
    const tableEnd = indexEnd > 0 ? indexEnd + COMMENT_END.length : tableStart;

    // Assemble rows from package.jsons
    const tables = await formatPackagesToTable(packages, flags);
    const tablesPretty = prettier.format(tables.join("\n"), {
      parser: "markdown"
    });

    logger.log("Writing", `${countPackages(packages)} packages to ${filename}`);

    if (!flags.dryRun) {
      writeFile(
        filename,
        contents
          .slice(0, tableStart)
          .concat(COMMENT_START)
          .concat(tablesPretty)
          .concat(COMMENT_END)
          .concat(contents.slice(tableEnd))
      );
    }

    // Return for testing.
    /* eslint consistent-return: 0 */
    return tablesPretty;
  } catch (err) {
    logger.error(err);
    return null;
  }
};

module.exports = {
  pkgtoc
};
