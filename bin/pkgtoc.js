#!/usr/bin/env node

const minimist = require("minimist");
const camelCase = require("camelcase");
const { pkgtoc } = require("../tmp/pkgtoc");

const getAndNormalizeFlags = () => {
  const flags = minimist(process.argv.slice(2), {
    boolean: ["lerna", "help"],
    string: ["shields-color"]
  });

  // Camel-case all flags
  return Object.entries(flags).reduce(
    (memo, [key, val]) => ({ ...memo, [camelCase(key)]: val }),
    {}
  );
};

pkgtoc(getAndNormalizeFlags());
