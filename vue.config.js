module.exports = {
  lintOnSave: false,
  publicPath: ".",
  pages: {
    index: {
      entry: "src/pages/index.ts",
    },
    julia: {
      entry: "src/pages/julia.ts",
    },
    newton: {
      entry: "src/pages/newton.ts",
    },
  },
  chainWebpack: (config) => {
    config.module
      .rule("import-i18n")
      .test(/^$/)
      .use("val-loader").loader("val-loader");
  },
};
