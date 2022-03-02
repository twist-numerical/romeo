const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

module.exports = (options, loaderContext) => {
  const languages = [];
  fs.readdirSync(__dirname).forEach((file) => {
    if (file.toLowerCase().endsWith(".yml")) {
      const p = path.join(__dirname, file);
      languages.push({
        language: file.substring(0, file.length - 4).toLowerCase(),
        path: p,
        content: yaml.load(fs.readFileSync(p, "utf8")),
      });
    }
  });

  const i18n = {};
  languages.forEach(({ language, content }) => {
    i18n[language] = content;
  });

  return {
    code: "module.exports = " + JSON.stringify(i18n) + ";",
    dependencies: languages.map(({ path }) => path),
    contextDependencies: [__dirname],
  };
};
