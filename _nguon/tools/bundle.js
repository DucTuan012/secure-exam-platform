// Đóng gói mã lõi phòng thi + giao diện thí sinh + bộ khởi động vào src/19_RoomBundle.gs (Trung tâm tự đẩy sang phòng thi)
const fs = require('fs'), path = require('path');
module.exports = function bundle() {
  const dir = path.join(__dirname, '..', 'phongthi');
  // máy chấm lập trình dùng chung với Trung tâm (src/26_Judge.gs) → nhúng vào đầu mã lõi phòng thi
  const judge = fs.readFileSync(path.join(__dirname, '..', 'src', '26_Judge.gs'), 'utf8');
  const code = judge + '\n' + fs.readFileSync(path.join(dir, 'PhongThi_Core.js'), 'utf8');
  const html = fs.readFileSync(path.join(dir, 'ThiSinh.html'), 'utf8');
  const boot = fs.readFileSync(path.join(dir, 'PhongThi.gs'), 'utf8');
  new Function('HTML_', code); new Function(boot);   // kiểm tra cú pháp
  const ver = code.match(/var PT_VERSION = '([\d.]+)'/)[1];
  const bootVer = boot.match(/var BOOT_VERSION = '([\w.]+)'/)[1];
  let h = 0x811c9dc5; const s = code + '\u0000' + html;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  const hash = ver + '-' + (h >>> 0).toString(16);
  const out = '/**\n * 19_RoomBundle.gs — TỰ SINH bởi tools/bundle.js, đừng sửa tay.\n' +
    ' * Mã lõi phòng thi + giao diện thí sinh + bộ khởi động. Trung tâm đẩy sang file PhongThi_DuLieu (sheet MaNguon).\n */\n' +
    'var ROOM_BUNDLE = {\n  version: ' + JSON.stringify(ver) + ',\n  hash: ' + JSON.stringify(hash) + ',\n  bootVersion: ' + JSON.stringify(bootVer) + ',\n' +
    '  code: ' + JSON.stringify(code) + ',\n  html: ' + JSON.stringify(html) + ',\n  boot: ' + JSON.stringify(boot) + '\n};\n';
  const file = path.join(__dirname, '..', 'src', '19_RoomBundle.gs');
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== out) fs.writeFileSync(file, out);
  return { ver, hash, bootVer, bytes: out.length };
};
if (require.main === module) console.log(module.exports());
