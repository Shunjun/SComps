export default {
  extractCSS: true,
  esm: "babel",
  cjs: "babel",
  umd: {
    name: "scomps",
    sourcemap: true,
    globals: {
      react: "React",
      antd: "antd",
    },
  },
  extraBabelPlugins: [
    ["import", { libraryName: "antd", libraryDirectory: "es", style: true }],
  ],
  entry: "src/index.tsx",
  doc: {
    title: "SComps组件库",
    base: "/scomps/",
    menu: ["首页", "更新日志", "组件"],
  },
};
