# pkgtoc

**Markdown table of contents creator for packages**

Exploring a monorepo can be really tedious and confusing at first glance. Adding a table of packages to your markdown file will improve discoverablility and allow new users to jump directly to the packages they recognize.

## Install & Usage

```
yarn add pkgtoc
yarn pkgtoc
```

## Flags

```
  --columns <n>          Columns to use [2]
  --dry-run              Don't write file [false]
  --file                 File to write table to [README.md]
  --glob <s>             Glob pattern to search for packages [packages/*]
  --lerna                Use lerna.json packages glob [false]
  --shields              Show NPM versions w/ shields.io [false]
  --shields-auto         Create shields using dynamic URL to support private [false]
  --shields-color <s>    Shield hex color [cb3837]
```

## Shields and Versioning

To support private repos, `pkgtoc` auto-constructs shields from [shields.io](https://shields.io/#your-badge). The `--shields` flag will enable this feature.

By default the shields are set to NPM's red color, you can pass a different hex color in with the `--shields-color` flag.

### Private repos

If you have private repos, you can enable the `--shields-auto` flag to dynamically construct a shield based on reading your package.json file.

_Note: Auto-constructing version shields will cause extra churn in your README file._

## Lerna

Passing the `--lerna` flag will instruct `pkgtoc` to read from your `lerna.json` file to grab all of your packages. You can also automate this during releases by the below script to the `version` script in `package.json`.

```
yarn pkgtoc && git add README.md
```

## Custom glob patterns

You can pass a custom glob pattern (e.g. `foo/*`) with `--glob` to point to where you keep your packages. Currently only supports a single glob.

## Table placement

Tables will go to the top of the file if START/END comments are missing. You can move the comments around to move the placement of the table. These comments `<!-- START pkgtoc, keep to allow update -->` are for finding/replacing any table content.

## Example (create-react-app)

```
git clone git@github.com:facebook/create-react-app.git
cd create-react-app
yarn add --dev pkgtoc
yarn pkgtoc --shields
```

| Version                                                                                                                       | Packages                                                                                                                                                |
| :---------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ![babel-plugin-named-asset-import npm badge)](https://img.shields.io/npm/v/babel-plugin-named-asset-import.svg?colorB=cb3837) | **[babel-plugin-named-asset-import](packages/babel-plugin-named-asset-import)** Babel plugin for named asset imports in Create React App                |
| ![babel-preset-react-app npm badge)](https://img.shields.io/npm/v/babel-preset-react-app.svg?colorB=cb3837)                   | **[babel-preset-react-app](packages/babel-preset-react-app)** Babel preset used by Create React App                                                     |
| ![confusing-browser-globals npm badge)](https://img.shields.io/npm/v/confusing-browser-globals.svg?colorB=cb3837)             | **[confusing-browser-globals](packages/confusing-browser-globals)** A list of browser globals that are often used by mistake instead of local variables |
| ![create-react-app npm badge)](https://img.shields.io/npm/v/create-react-app.svg?colorB=cb3837)                               | **[create-react-app](packages/create-react-app)** Create React apps with no build configuration.                                                        |
| ![eslint-config-react-app npm badge)](https://img.shields.io/npm/v/eslint-config-react-app.svg?colorB=cb3837)                 | **[eslint-config-react-app](packages/eslint-config-react-app)** ESLint configuration used by Create React App                                           |
| ![react-dev-utils npm badge)](https://img.shields.io/npm/v/react-dev-utils.svg?colorB=cb3837)                                 | **[react-dev-utils](packages/react-dev-utils)** Webpack utilities used by Create React App                                                              |
| ![react-error-overlay npm badge)](https://img.shields.io/npm/v/react-error-overlay.svg?colorB=cb3837)                         | **[react-error-overlay](packages/react-error-overlay)** An overlay for displaying stack frames.                                                         |
| ![react-scripts npm badge)](https://img.shields.io/npm/v/react-scripts.svg?colorB=cb3837)                                     | **[react-scripts](packages/react-scripts)** Configuration and scripts for Create React App.                                                             |

## Development

`pkgtoc` exports a cli/bin entry point and a named module in `lib/pkgtoc`. The module takes the same flags as above, but camel-cased (e.g. shields-color => shieldsColor). Ideally you want to set `dryRun` to to `true` to avoid writing to file.

`jest` is used for testing.
