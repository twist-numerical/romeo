module.exports = {
  lintOnSave: false,
  publicPath: ".",
  pages: {
    index: {
      entry: "src/pages/index.ts"
    },
    julia: {
      entry: "src/pages/julia.ts"
    },
    newton: {
      entry: "src/pages/newton.ts"
    }
  }
};
