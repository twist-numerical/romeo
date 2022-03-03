const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

module.exports = (options, loaderContext) => {
  const languages = [];
  let errorCode = "";
  fs.readdirSync(__dirname).forEach((file) => {
    if (file.toLowerCase().endsWith(".yml")) {
      const p = path.join(__dirname, file);
      let content;
      try {
        content = yaml.load(fs.readFileSync(p, "utf8"));
      } catch (e) {
        content = {};
        errorCode += `console.error(${JSON.stringify(
          "Error in language file '" + file + "':"
        )}, ${JSON.stringify(e.message)});`;
      }
      languages.push({
        language: file.substring(0, file.length - 4).toLowerCase(),
        path: p,
        content: content,
      });
    }
  });

  const i18n = {};
  languages.forEach(({ language, content }) => {
    i18n[language] = content;
  });

  return {
    code: errorCode + " module.exports = " + JSON.stringify(i18n) + ";",
    dependencies: languages.map(({ path }) => path),
    contextDependencies: [__dirname],
  };
};
