// Nạp các file .gs vào một ngữ cảnh chung (giống Apps Script: mọi file chung global scope)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load(files, extra) {
  const ctx = vm.createContext(Object.assign({ console }, extra || {}));
  const dir = path.join(__dirname, '..', 'src');
  files.forEach((f) => {
    const code = fs.readFileSync(path.join(dir, f), 'utf8');
    vm.runInContext(code, ctx, { filename: f });
  });
  return ctx;
}
module.exports = { load };
