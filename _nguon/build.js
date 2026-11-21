// Gộp src/*.gs thành 1 file HeThongThi.gs và đóng gói thư mục dist/HeThongThi_v<ver>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const src = path.join(__dirname, 'src');
// 0) sinh lại src/19_RoomBundle.gs (mã phòng thi + trang thí sinh nhúng vào hệ thống chính, tự đẩy sang phòng thi)
const bundleInfo = require('./tools/bundle')();
const ver = fs.readFileSync(path.join(src, '00_Config.gs'), 'utf8').match(/VERSION: '([\d.]+)'/)[1];
const out = path.join(__dirname, 'dist', 'HeThongThi_v' + ver);
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const gs = fs.readdirSync(src).filter((f) => f.endsWith('.gs')).sort();
let all = `/**\n * HeThongThi.gs — BẢN GỘP để dán vào Apps Script (v${ver}). Nguồn tách file: thư mục src/\n */\n`;
gs.forEach((f) => { all += `\n/* ======================= ${f} ======================= */\n` + fs.readFileSync(path.join(src, f), 'utf8'); });
fs.writeFileSync(path.join(out, 'HeThongThi.gs'), all);
['Index.html', 'NhapCau.html', 'appsscript.json'].forEach((f) => fs.copyFileSync(path.join(src, f), path.join(out, f)));
['README.md', 'HUONG_DAN_SU_DUNG.md'].forEach((f) => { if (fs.existsSync(path.join(__dirname, f))) fs.copyFileSync(path.join(__dirname, f), path.join(out, f)); });
// dự án Phòng thi: CHỈ dán Bộ khởi động (1 lần). Mã phòng thi + trang thí sinh được hệ thống chính tự đẩy sang sheet MaNguon.
fs.mkdirSync(path.join(out, 'PhongThi'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'phongthi', 'PhongThi.gs'), path.join(out, 'PhongThi', 'PhongThi.gs'));
new Function(fs.readFileSync(path.join(__dirname, 'phongthi', 'PhongThi.gs'), 'utf8'));
// mã nguồn đầy đủ + bộ kiểm thử (không cần cho việc dán; để sửa / kiểm tra về sau)
cp.execSync(`mkdir -p "${out}/_nguon" && cp -r src test tools phongthi build.js README.md "${out}/_nguon/" && rm -rf "${out}/_nguon/test/shots"`, { cwd: __dirname });
cp.execSync(`cd dist && rm -f HeThongThi_v${ver}.zip && zip -qr HeThongThi_v${ver}.zip HeThongThi_v${ver}`, { cwd: __dirname });
new Function(all); // kiểm tra cú pháp
console.log('Đã đóng gói', out, '—', all.split('\n').length, 'dòng · mã phòng thi', bundleInfo.hash, '· bộ khởi động v' + bundleInfo.bootVer);
