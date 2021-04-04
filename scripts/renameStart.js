const path = require("path");
const fs = require("fs");

try {
  const srcPath = path.resolve(__dirname, "../src");
  const componentsPath = path.resolve(__dirname, "../components");

  fs.renameSync(componentsPath, srcPath);
  console.log("Successfully renamed the directory.");
} catch (err) {
  console.log(err);
}
