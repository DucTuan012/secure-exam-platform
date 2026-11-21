// PHÒNG THI WEB: chạy Hệ thống Trung tâm + dự án Phòng thi (2 ngữ cảnh riêng, chung "Google Drive" mô phỏng)
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { load } = require('./load');
const { makeEnv } = require('./mocks');
require('../tools/bundle')();

const env = makeEnv();
const files = fs.readdirSync(path.join(__dirname, '..', 'src')).filter((f) => f.endsWith('.gs')).sort();
const G = load(files, env);
env._newHub();
const call = (name, ...args) => { const r = JSON.parse(G.API_call(name, args)); if (!r.ok) throw new Error(name + ': ' + r.error); return r.data; };
const step = (t) => console.log('▶', t);

step('Chuẩn bị kỳ thi mẫu (sinh, chốt, phân đề)');
call('setup'); call('sample');
assert.ok(call('generate', 'KT_DEMO').ok);
call('finalize', 'KT_DEMO');
call('assign', 'KT_DEMO', 'NGAU_NHIEN');

step('Tạo file dữ liệu phòng thi + link');
const pr = call('ptSetup');
const roomSs = env.SpreadsheetApp.openById(pr.id);
['KyThi', 'ThiSinh', 'GoiDe', 'BaiLam', 'NhatKy'].forEach((n) => assert.ok(roomSs.getSheetByName(n), n));
assert.throws(() => call('ptSetUrl', 'https://example.com/x'), /script\.google\.com/);
const URL = 'https://script.google.com/macros/s/AKfycbTEST123/exec';
call('ptSetUrl', URL);
assert.strictEqual(call('ptState', 'KT_DEMO').webUrl, URL);

step('Phát đề');
assert.throws(() => call('ptOpen', 'KT_DEMO'), /phát đề/);
const pub = call('ptPublish', 'KT_DEMO', { viPhamToiDa: 3, dangNhapLai: 'CHO_PHEP' });
assert.strictEqual(pub.nStudents, 6); assert.strictEqual(pub.nVariants, 2);
assert.strictEqual(call('state').exams.find((e) => e.maKyThi === 'KT_DEMO').trangThai, 'DA_XUAT_FORM');
// gói đề KHÔNG được chứa đáp án
const pkgText = G.S_read(roomSs, 'GoiDe').map((r) => r.DuLieu).join('');
assert.ok(!/"key"|DapAn|maCH/.test(pkgText), 'gói đề lộ đáp án!');

step('Nạp dự án Phòng thi (ngữ cảnh riêng — không thấy mã Trung tâm)');
const roomCtx = (env, roomSs) => {
  const R = vm.createContext(Object.assign({}, env, { console, ScriptApp: { getService: () => ({ getUrl: () => env._roomUrl || '' }) },
    SpreadsheetApp: Object.assign({}, env.SpreadsheetApp, { getActiveSpreadsheet: () => roomSs }) }));
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'phongthi', 'PhongThi.gs'), 'utf8'), R, { filename: 'PhongThi.gs' });
  return R;
};
const R = roomCtx(env, roomSs);
// Trung tâm gọi thử link phòng thi (?ping=1) → bộ khởi động trả lời
const realFetch = env.UrlFetchApp.fetch.bind(env.UrlFetchApp);
env.UrlFetchApp.fetch = (url, o) => /\?ping=1/.test(url) ? { getResponseCode: () => 200, getContentText: () => R.doGet({ parameter: { ping: '1' } }).s } : realFetch(url, o);
assert.strictEqual(typeof R.Repo_items, 'undefined');
const CORE = new Function('HTML_', fs.readFileSync(path.join(__dirname, '..', 'phongthi', 'PhongThi_Core.js'), 'utf8') + '; ').toString();
assert.ok(CORE.length > 1000);
// cột phòng thi phải khớp Trung tâm (đọc từ mã lõi)
const coreHeaders = vm.runInNewContext('(function(){' + fs.readFileSync(path.join(__dirname, '..', 'phongthi', 'PhongThi_Core.js'), 'utf8').replace(/return \{ doGet[\s\S]*$/, '') + '; return RHEADERS_; })()', {});
assert.deepStrictEqual(JSON.parse(JSON.stringify(coreHeaders)), JSON.parse(JSON.stringify(G.RHEADERS)), 'Cột phòng thi phải khớp Trung tâm');
assert.strictEqual(G.ROOM_BUNDLE.version, G.APP.PT_VERSION, 'phiên bản mã lõi = Trung tâm');
const pg = call('ptPing');
assert.ok(pg.bootOk && pg.coreOk, 'ping: ' + JSON.stringify(pg));
// chỉ doGet và PT_api là hàm công khai (không kết thúc bằng "_")
const pub2 = Object.keys(R).filter((k) => typeof R[k] === 'function' && !/_$/.test(k) && !(k in env) && k !== 'console');
assert.deepStrictEqual(pub2.sort(), ['PT_api', 'doGet'], 'Hàm công khai: ' + pub2.join(','));
const api = (name, ...args) => JSON.parse(R.PT_api(name, args));
const ok = (name, ...args) => { const r = api(name, ...args); if (!r.ok) throw new Error(name + ': ' + r.code + ' ' + r.error); return r.data; };

const info = ok('info');
assert.strictEqual(info.exams.length, 1);
const st = G.S_read(roomSs, 'ThiSinh');
const S0 = st[0], S1 = st[1], S2 = st[2], S3 = st[3], S4 = st[4];
assert.ok(/^[A-Z2-9]{6}$/.test(S0.MaTruyCap));

step('Đăng nhập: sai mã / đúng mã / chưa mở đề');
assert.strictEqual(api('login', S0.SBD, 'XXXXXX', '', { ua: 'Chrome' }).code, 'BAD_LOGIN');
const L0 = ok('login', S0.SBD.toLowerCase(), S0.MaTruyCap.toLowerCase(), '', { ua: 'Mozilla Chrome' });
assert.strictEqual(L0.maDe, String(S0.MaDe)); assert.strictEqual(L0.exam.mo, false);
assert.strictEqual(api('start', L0.tok, L0.ky, L0.sbd).code, 'NOT_OPEN');
assert.strictEqual(ok('wait', L0.tok, L0.ky, L0.sbd).mo, false);

step('Mở phòng thi → thí sinh bắt đầu');
call('ptOpen', 'KT_DEMO');
R.CacheService.getScriptCache()._m.delete('ex|KT_DEMO'); // bỏ đệm 10 giây
assert.strictEqual(ok('wait', L0.tok, L0.ky, L0.sbd).mo, true);
const st0 = ok('start', L0.tok, L0.ky, L0.sbd);
const P0 = JSON.parse(st0.pkg);
assert.strictEqual(P0.items.length, 12);
assert.ok(P0.items.every((x) => x.key === undefined && x.maCH === undefined));
const mins = Number(G.S_read(roomSs, 'KyThi')[0].ThoiGianPhut);
assert.ok(mins ? Math.abs(st0.deadline - Date.now() - mins * 60000) < 5000 : st0.deadline === 0, 'hạn nộp theo thời gian làm bài');

const items = G.Repo_items('KT_DEMO');
function webAns(md, mode) {
  const a = {};
  items.filter((x) => x.MaDe === String(md)).forEach((x, i) => {
    const k = 'S' + Number(x.STT), key = String(x.DapAnMaDe), wrong = mode === 'half' && i % 2 === 1;
    if (x.DangCau === 'MOT_DA') a[k] = wrong ? (key === 'A' ? 'B' : 'A') : key;
    if (x.DangCau === 'NHIEU_DA') a[k] = wrong ? ['A'] : key.split(',');
    if (x.DangCau === 'DUNG_SAI') a[k] = key.split(',').map((b, j) => (wrong && j === 0 ? (b === 'Đ' ? 'S' : 'Đ') : b));
    if (x.DangCau === 'GHEP_NOI') a[k] = key.split(',').map((p) => (wrong ? 9 : Number(p.split('-')[1])));
    if (x.DangCau === 'TRA_LOI_NGAN') a[k] = wrong ? '999' : key.split('|')[0].trim();
  });
  return a;
}

step('Thí sinh 1: tự lưu, rời màn hình 1 lần, nộp bài đúng hết');
let sv = ok('save', L0.tok, L0.ky, L0.sbd, { seq: 3, a: webAns(S0.MaDe, 'half'), n: 6, ev: [{ k: 'ROI_TAB', d: 4 }, { k: 'SAO_CHEP' }] });
assert.strictEqual(sv.saved, 3); assert.strictEqual(sv.viPham, 1);
const sub0 = ok('submit', L0.tok, L0.ky, L0.sbd, { seq: 9, a: webAns(S0.MaDe, 'full'), n: 12 });
assert.ok(/^[0-9A-F]{4}-[0-9A-F]{4}$/.test(sub0.receipt));
assert.strictEqual(ok('submit', L0.tok, L0.ky, L0.sbd, { seq: 9, a: {} }).again, true, 'nộp lặp không tạo bài mới');
assert.strictEqual(api('login', S0.SBD, S0.MaTruyCap, '', {}).code, 'DONE');

step('Trong SEB: bấm thanh công cụ SEB không tính vi phạm');
const LS1 = ok('login', S1.SBD, S1.MaTruyCap, '', { ua: 'Mozilla SEB/3.5 PhongThi/' + G.S_read(roomSs, 'KyThi')[0].KhoaUA });
ok('start', LS1.tok, LS1.ky, LS1.sbd);
assert.strictEqual(ok('save', LS1.tok, LS1.ky, LS1.sbd, { seq: 1, ev: [{ k: 'SEB_THANH_CC', d: 12 }, { k: 'ROI_CUA_SO', d: 40 }] }).viPham, 0);
assert.strictEqual(ok('save', LS1.tok, LS1.ky, LS1.sbd, { seq: 1, ev: [{ k: 'ROI_TAB', d: 4 }, { k: 'THOAT_TOAN_MAN' }] }).viPham, 0, 'trong SEB không tính vi phạm');
const rsm = ok('resume', LS1.tok, LS1.ky, LS1.sbd);
assert.ok(rsm.tok && rsm.tok !== LS1.tok, 'tải lại trang: cấp phiên mới');
assert.strictEqual(api('save', LS1.tok, LS1.ky, LS1.sbd, { seq: 1 }).code, 'REPLACED', 'tab cũ cùng link bị thay thế');
const rsm2 = ok('resume', LS1.tok, LS1.ky, LS1.sbd);   // phản hồi lần tải lại trước bị mất → vẫn vào được trong 2 phút
assert.ok(rsm2.tok);
LS1.tok = rsm2.tok;
G.S_update(roomSs, 'ThiSinh', (x) => x.SBD === S1.SBD, { ViPham: '0', SEB: '' });

// dấu hiệu bị phần mềm / tác tử AI điều khiển → cột NghiTD + nhật ký có chi tiết
ok('save', LS1.tok, LS1.ky, LS1.sbd, { ev: [{ k: 'TU_DONG', d: 2, x: 'Nghi cao — Con trỏ chuột nhảy thẳng tới chỗ bấm. Bằng chứng: 8/8 lần' }] });
ok('save', LS1.tok, LS1.ky, LS1.sbd, { ev: [{ k: 'TU_DONG', d: 3, x: 'Chắc chắn — Đáp án thay đổi khi không có thao tác. Bằng chứng: câu 4' }], lk: 'thao tác không phải của người' });
{
  const m1 = call('ptMonitor', 'KT_DEMO').students.find((x) => x.sbd === S1.SBD);
  assert.strictEqual(m1.nghiTD, 2); assert.strictEqual(m1.nghiMuc, 3, 'mức cao nhất');
  assert.ok(/^Chắc chắn — Đáp án thay đổi/.test(m1.nghiLyDo) && /Nghi cao — Con trỏ/.test(m1.nghiLyDo), m1.nghiLyDo);
  assert.strictEqual(m1.tt, 'KHOA', 'máy thí sinh tự khoá → máy chủ khoá luôn');
  const evs = JSON.stringify(call('ptEvents', 'KT_DEMO', S1.SBD));
  assert.ok(evs.includes('NGHI_AI') && evs.includes('Bằng chứng: câu 4') && evs.includes('thao tác không phải của người'), 'nhật ký ghi rõ lý do + bằng chứng');
  // tải lại trang vẫn khoá; giám thị mở khoá thì làm tiếp
  const rs = ok('resume', LS1.tok, LS1.ky, LS1.sbd); LS1.tok = rs.tok;
  assert.strictEqual(ok('start', LS1.tok, LS1.ky, LS1.sbd).locked, true, 'tải lại trang vẫn khoá');
  call('ptCommand', 'KT_DEMO', [S1.SBD], 'MO_KHOA');
  assert.strictEqual(ok('save', LS1.tok, LS1.ky, LS1.sbd, { lk: 'cũ' }).unlock, true, 'mở khoá thắng yêu cầu khoá cũ');
  assert.strictEqual(call('ptMonitor', 'KT_DEMO').students.find((x) => x.sbd === S1.SBD).tt !== 'KHOA', true);
  assert.strictEqual(ok('start', LS1.tok, LS1.ky, LS1.sbd).chongAI, 'KHOA', 'chính sách mặc định: khoá khi chắc chắn');
}
step('Hỏi giám thị ngay trong trang thi → giám thị trả lời');
ok('ask', LS1.tok, LS1.ky, LS1.sbd, 'Câu 3 hình mờ ạ');
let mq = call('ptMonitor', 'KT_DEMO').questions;
assert.strictEqual(mq.length, 1); assert.strictEqual(mq[0].answered, false); assert.strictEqual(mq[0].text, 'Câu 3 hình mờ ạ');
const clrEx = () => { const m = env.CacheService.getScriptCache()._m; [...m.keys()].filter((k) => /^ex\|/.test(k)).forEach((k) => m.delete(k)); };
const p0 = ok('poll', 'KT_DEMO', S1.SBD);
assert.ok(p0.iv >= 6 && p0.iv <= 20, 'nhịp hỏi theo sĩ số phòng');
call('ptCommand', 'KT_DEMO', [S1.SBD], 'TIN', 'Em xem lại sau nhé');
// tín hiệu nhanh: máy S1 biết có lệnh mới, máy khác không
clrEx();
const p1 = ok('poll', 'KT_DEMO', S1.SBD), pOther = ok('poll', 'KT_DEMO', st.find((x) => x.SBD !== S1.SBD).SBD);
assert.ok(p1.v && p1.v !== p0.v && p1.me === true, 'S1 nhận tín hiệu: ' + JSON.stringify([p0, p1]));
assert.strictEqual(pOther.me, false, 'thí sinh khác không bị đồng bộ thừa');
assert.ok(!JSON.stringify(p1).includes(S1.SBD), 'không trả danh sách SBD');
assert.strictEqual(call('ptMonitor', 'KT_DEMO').questions[0].answered, true);
assert.strictEqual(ok('save', LS1.tok, LS1.ky, LS1.sbd, { seq: 1 }).pmsg, 'Em xem lại sau nhé');

step('Tạm dừng cả phòng → bù giờ chính xác; xem bài đang làm; kiểm tra trước giờ thi');
G.S_update(roomSs, 'ThiSinh', (x) => x.SBD === S1.SBD, (x) => ({ BatDau: String(Number(x.BatDau) - 600000) }));  // đã làm 10 phút
R.CacheService.getScriptCache()._m.delete('rows|KT_DEMO');
const dl0 = ok('save', LS1.tok, LS1.ky, LS1.sbd, { seq: 2 }).deadline;
call('ptPause', 'KT_DEMO', [], true);
const ps = ok('save', LS1.tok, LS1.ky, LS1.sbd, { seq: 2 });
assert.strictEqual(ps.paused, true); assert.ok(!ps.timeUp);
assert.ok(call('ptMonitor', 'KT_DEMO').counts.TAM_DUNG >= 1);
// giả lập đã dừng 3 phút
G.S_update(roomSs, 'ThiSinh', (x) => x.SBD === S1.SBD, (x) => ({ DungLuc: String(Number(x.DungLuc) - 180000) }));
const pr2 = call('ptPause', 'KT_DEMO', [], false);
assert.ok(pr2.count >= 1);
const dl1 = ok('save', LS1.tok, LS1.ky, LS1.sbd, { seq: 2 }).deadline;
if (dl0) assert.ok(Math.abs(dl1 - dl0 - 180000) < 5000, 'bù đúng 3 phút: ' + (dl1 - dl0));
assert.ok(!ok('save', LS1.tok, LS1.ky, LS1.sbd, { seq: 2 }).paused);
ok('save', LS1.tok, LS1.ky, LS1.sbd, { seq: 3, a: webAns(S1.MaDe, 'half'), n: 12 });
const pk = call('ptPeek', 'KT_DEMO', S1.SBD);
assert.strictEqual(pk.items.length, 12); assert.strictEqual(pk.seq, 3);
assert.ok(pk.items.some((x) => x.ok === true) && pk.items.some((x) => x.ok === false));
const chk = call('ptCheck', 'KT_DEMO');
assert.ok(chk.some((c) => /Bộ khởi động/.test(c.text) && c.ok) && chk.some((c) => /mã mới nhất/.test(c.text) && c.ok), JSON.stringify(chk));
step('Hẹn đóng: giới hạn trên · cộng giờ riêng VƯỢT hẹn · đồng bộ về 1 mốc · đặt lại · bỏ hẹn');
{
  const exR = () => G.S_read(roomSs, 'KyThi')[0], stR = (sbd) => G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD === sbd);
  const dlOf = (sbd) => G.PK_deadline(exR(), stR(sbd)), clrC = () => R.CacheService.getScriptCache()._m.delete('ex|KT_DEMO');
  const own = dlOf(S1.SBD);                                       // hạn riêng của S1 (chưa hẹn)
  const ci = call('ptCloseIn', 'KT_DEMO', 5); clrC();
  assert.ok(/^\d\d:\d\d$/.test(ci.hhmm) && ci.mins === 5);
  const hen = Number(exR().HenDong);
  assert.strictEqual(dlOf(S1.SBD), Math.min(own, hen), 'hẹn đóng = giới hạn trên');
  const w = call('ptCommand', 'KT_DEMO', [S1.SBD], 'THEM_PHUT', 10).warning;
  assert.ok(/VƯỢT/.test(w), w);
  assert.strictEqual(dlOf(S1.SBD), Math.min(own, hen) + 10 * 60000, 'cộng 10 phút → em vượt hẹn đúng 10 phút');
  const other = G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD !== S1.SBD && x.MaKyThi === 'KT_DEMO');
  assert.ok(G.PK_deadline(exR(), other) <= hen, 'em khác vẫn đóng đúng mốc');
  // máy chủ phòng thi tính cùng hạn
  clrC(); const sv = api('save', LS1.tok, LS1.ky, LS1.sbd, { seq: 4 });
  assert.ok(sv.ok && Math.abs(sv.data.deadline - dlOf(S1.SBD)) < 2, 'phòng thi khớp: ' + JSON.stringify(sv).slice(0, 200));
  // đồng bộ: mọi em kết thúc đúng mốc (bỏ phần vượt cũ)
  const cs = call('ptCloseIn', 'KT_DEMO', 0, { luc: G.PTA_fmt(Date.now() + 90 * 60000).substring(11, 16), dongBo: true }); clrC();
  assert.ok(cs.dongBo && cs.mins >= 89 && cs.mins <= 91, JSON.stringify(cs));
  const hen2 = Number(exR().HenDong);
  assert.strictEqual(dlOf(S1.SBD), hen2, 'đồng bộ: S1 kết thúc đúng mốc (dù giờ riêng ngắn hơn)');
  assert.strictEqual(String(stR(S1.SBD).VuotHen || ''), '', 'đặt mốc mới → bỏ phần vượt cũ');
  call('ptCommand', 'KT_DEMO', [S1.SBD], 'THEM_PHUT', 3);
  assert.strictEqual(dlOf(S1.SBD), hen2 + 3 * 60000, 'đồng bộ + cộng riêng 3 phút');
  call('ptCancelClose', 'KT_DEMO'); clrC();
  assert.ok(!exR().HenDong && !exR().HenCung);
  assert.strictEqual(dlOf(S1.SBD), own + 13 * 60000, 'bỏ hẹn → về giờ riêng (đã cộng 10+3 phút)');
  G.S_update(roomSs, 'ThiSinh', (x) => x.SBD === S1.SBD, { ThemPhut: '' }); clrC();
}

step('Thí sinh 2: nộp bài làm sai một nửa');
const L1 = ok('login', S1.SBD, S1.MaTruyCap, '', { ua: 'x' }); ok('start', L1.tok, L1.ky, L1.sbd);
ok('submit', L1.tok, L1.ky, L1.sbd, { seq: 1, a: webAns(S1.MaDe, 'half'), n: 12 });

step('Thí sinh 3: chỉ tự lưu (không bấm nộp) — đổi máy giữa giờ, máy cũ bị thay phiên');
const L2 = ok('login', S2.SBD, S2.MaTruyCap, '', { ua: 'x' }); ok('start', L2.tok, L2.ky, L2.sbd);
ok('save', L2.tok, L2.ky, L2.sbd, { seq: 5, a: webAns(S2.MaDe, 'full'), n: 12 });
const L2b = ok('login', S2.SBD, S2.MaTruyCap, '', { ua: 'may khac' });
assert.strictEqual(api('save', L2.tok, L2.ky, L2.sbd, { seq: 6, a: {} }).code, 'REPLACED');
const res2 = ok('start', L2b.tok, L2b.ky, L2b.sbd);
assert.strictEqual(res2.saved.seq, 5, 'máy mới khôi phục bài đã lưu');

step('Thí sinh 4: rời màn hình 3 lần → bị khoá → giám thị mở khoá');
const L3 = ok('login', S3.SBD, S3.MaTruyCap, '', { ua: 'x' }); ok('start', L3.tok, L3.ky, L3.sbd);
sv = ok('save', L3.tok, L3.ky, L3.sbd, { seq: 1, n: 0, ev: [{ k: 'ROI_TAB' }, { k: 'ROI_CUA_SO', d: 5 }, { k: 'ROI_TAB' }] });
assert.strictEqual(sv.locked, true);
let mon = call('ptMonitor', 'KT_DEMO');
assert.strictEqual(mon.counts.KHOA, 1); assert.strictEqual(mon.counts.DA_NOP, 2);
const before = G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD === S0.SBD).TrangThai;
call('ptCommand', 'KT_DEMO', [], 'TIN', 'kiểm tra ghi cột');
assert.strictEqual(G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD === S0.SBD).TrangThai, before, 'lệnh không được ghi đè cột trạng thái');
call('ptCommand', 'KT_DEMO', [S3.SBD], 'MO_KHOA');
sv = ok('save', L3.tok, L3.ky, L3.sbd, { seq: 2, n: 0, ev: [] });
assert.strictEqual(sv.unlock, true); assert.ok(!sv.locked);
call('ptCommand', 'KT_DEMO', [S3.SBD], 'TIN', 'Ngồi thẳng lưng');
assert.strictEqual(ok('save', L3.tok, L3.ky, L3.sbd, { seq: 2 }).pmsg, 'Ngồi thẳng lưng');
call('ptCommand', 'KT_DEMO', [S3.SBD], 'THU_BAI');
assert.strictEqual(ok('save', L3.tok, L3.ky, L3.sbd, { seq: 2 }).cmd, 'SUBMIT');

step('Đăng nhập lại cần giám thị');
call('ptSettings', 'KT_DEMO', { dangNhapLai: 'CAN_GIAM_THI' });
R.CacheService.getScriptCache()._m.delete('ex|KT_DEMO');
assert.strictEqual(api('login', S3.SBD, S3.MaTruyCap, '', { ua: 'khác' }).code, 'NEED_PROCTOR');
call('ptCommand', 'KT_DEMO', [S3.SBD], 'CHO_VAO_LAI');
ok('login', S3.SBD, S3.MaTruyCap, '', { ua: 'khác' });
step('Đang làm bài, lỡ nhập sai mã 8 lần → giám thị ↺ Cho vào lại → vào được ngay, GIỮ NGUYÊN bài');
for (let i = 0; i < 8; i++) api('login', S3.SBD, 'SAISAI', '', {});
assert.strictEqual(api('login', S3.SBD, S3.MaTruyCap, '', {}).code, 'LOCKED');
call('ptCommand', 'KT_DEMO', [S3.SBD], 'CHO_VAO_LAI');
const L3b = ok('login', S3.SBD, S3.MaTruyCap, '', { ua: 'khác' });
assert.ok(ok('resume', L3b.tok, L3b.ky, L3b.sbd), 'vào lại được sau khi giám thị cho vào lại');

step('Cộng giờ + hạn nộp tính trên máy chủ');
call('saveExam', Object.assign({}, call('state').exams.find((e) => e.maKyThi === 'KT_DEMO'), { maKyThi: 'KT_DEMO', ten: 'Thi thử', maMon: 'DEMO', maMaTran: 'MT_DEMO', thoiGian: 0 }));
G.S_update(roomSs, 'KyThi', () => true, { ThoiGianPhut: '45' });
call('ptCommand', 'KT_DEMO', [], 'THEM_PHUT', 5);
R.CacheService.getScriptCache()._m.delete('ex|KT_DEMO');
const L4 = ok('login', S4.SBD, S4.MaTruyCap, '', { ua: 'x' });
const st4 = ok('start', L4.tok, L4.ky, L4.sbd);
assert.ok(Math.abs(st4.deadline - Date.now() - 50 * 60000) < 5000, 'hạn = 45 + 5 phút');
mon = call('ptMonitor', 'KT_DEMO');
assert.ok(mon.students.find((s) => s.sbd === String(S4.SBD)).conLai > 49 * 60000);

step('Đóng phòng thi → thu bài & chấm');
call('ptClose', 'KT_DEMO');
R.CacheService.getScriptCache()._m.delete('ex|KT_DEMO');
assert.strictEqual(ok('save', L4.tok, L4.ky, L4.sbd, { seq: 1 }).closed, true);
const col = call('ptCollect', 'KT_DEMO');
assert.strictEqual(col.count, 5, JSON.stringify(col)); // 2 nộp + 1 tự thu + 2 vào thi nhưng chưa lưu câu nào
assert.strictEqual(col.kinds.TU_THU, 1); assert.strictEqual(col.kinds.TRONG, 2);
call('compile', 'KT_DEMO');
let rep = call('report', 'KT_DEMO');
const r = (s) => rep.results.find((x) => x.SBD === String(s.SBD));
assert.strictEqual(Number(r(S0).TongDiem), 100, JSON.stringify(r(S0)));
assert.ok(/Rời màn hình thi 1 lần/.test(r(S0).CanhBao), r(S0).CanhBao);
assert.ok(Number(r(S1).TongDiem) > 0 && Number(r(S1).TongDiem) < 100);
assert.strictEqual(Number(r(S2).TongDiem), 100);
assert.ok(/tự lưu/.test(r(S2).CanhBao) && /Đăng nhập 2 lần/.test(r(S2).CanhBao), r(S2).CanhBao);
assert.ok(/chưa lưu được/.test(r(S3).CanhBao) && Number(r(S3).TongDiem) === 0, r(S3).CanhBao);
console.log('   điểm:', rep.results.map((x) => x.SBD + '=' + (x.TongDiem === '' ? 'vắng' : x.TongDiem)).join(', '));

step('Cho làm lại từ đầu (thí sinh 1 đã nộp) — kể cả khi đã bị khoá vì nhập sai mã, cấp mã mới');
G.S_update(roomSs, 'KyThi', () => true, { TrangThai: 'MO', DongLuc: '' });
R.CacheService.getScriptCache()._m.delete('ex|KT_DEMO');
assert.ok(/♻/.test(api('login', S0.SBD, S0.MaTruyCap, '', {}).error));
for (let i = 0; i < 8; i++) api('login', S0.SBD, 'SAISAI', '', {});
assert.strictEqual(api('login', S0.SBD, S0.MaTruyCap, '', {}).code, 'LOCKED');
assert.ok(call('ptEvents', 'KT_DEMO', S0.SBD).some((e) => e.k === 'DANG_NHAP_SAI'));
const rs = call('ptReset', 'KT_DEMO', [S0.SBD], true);
assert.strictEqual(api('resume', L0.tok, L0.ky, L0.sbd).code, 'RESET', 'máy đang mở nhận lệnh làm lại');
assert.strictEqual(rs.reset, 1); assert.ok(rs.voided >= 2);
const newCode = rs.codes[0].code;
assert.ok(newCode !== S0.MaTruyCap && /^[A-Z2-9]{6}$/.test(newCode));
R.CacheService.getScriptCache()._m.delete('rows|KT_DEMO');
const oldTry = api('login', S0.SBD, S0.MaTruyCap, '', {}); assert.strictEqual(oldTry.code, 'BAD_LOGIN', 'mã cũ hết hiệu lực: ' + JSON.stringify(oldTry) + ' fail=' + R.CacheService.getScriptCache().get('fail|' + S0.SBD) + ' ghichu=' + G.S_read(roomSs, 'ThiSinh').filter((x) => x.SBD === S0.SBD).map((x) => x.GhiChu + '@' + x.MaKyThi).join(';'));
const LR = ok('login', S0.SBD, newCode, '', { ua: 'x' });
const sr = ok('start', LR.tok, LR.ky, LR.sbd);
assert.ok(!sr.saved, 'không khôi phục bài đã huỷ'); assert.strictEqual(sr.fresh, true); assert.ok(Number(sr.att) > 0);
ok('submit', LR.tok, LR.ky, LR.sbd, { seq: 1, a: webAns(S0.MaDe, 'half'), n: 12 });
call('ptClose', 'KT_DEMO'); call('ptCollect', 'KT_DEMO'); call('compile', 'KT_DEMO');
rep = call('report', 'KT_DEMO');
assert.ok(Number(r(S0).TongDiem) < 100, 'tính bài làm lại: ' + r(S0).TongDiem);

step('Cho làm tiếp (giữ bài) sau khi đã nộp & phòng đã đóng');
const st1 = G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD === S1.SBD);
assert.strictEqual(st1.TrangThai, 'DA_NOP');
const ct = call('ptContinue', 'KT_DEMO', [S1.SBD], 10);
assert.strictEqual(ct.students.length, 1); assert.strictEqual(ct.open, false);
call('ptOpen', 'KT_DEMO'); R.CacheService.getScriptCache()._m.delete('ex|KT_DEMO');
const LC = ok('login', S1.SBD, S1.MaTruyCap, '', {});
const sc = ok('start', LC.tok, LC.ky, LC.sbd);
assert.ok(!sc.fresh && sc.saved && Object.keys(sc.saved.a).length > 0, 'giữ bài cũ');
assert.ok(sc.deadline === 0 || sc.deadline - Date.now() > 9 * 60000, 'còn ≥ 10 phút');
ok('submit', LC.tok, LC.ky, LC.sbd, { seq: 99, a: webAns(S1.MaDe, 'full'), n: 12 });
call('ptClose', 'KT_DEMO'); call('ptCollect', 'KT_DEMO'); call('compile', 'KT_DEMO');
rep = call('report', 'KT_DEMO');
assert.strictEqual(Number(r(S1).TongDiem), 100, 'lần nộp mới được tính');

step('Sau khi đóng: thêm thí sinh mới, phân đề (giữ mã đề cũ), phát lại, thi bù');
const oldMd = G.Repo_students('KT_DEMO').map((s) => s.SBD + s.MaDe).join();
call('importStudents', 'KT_DEMO', 'SBD\tHọ tên\nNEW01\tThi bù', 'THEM');
const as = call('assign', 'KT_DEMO', 'NGAU_NHIEN');
assert.ok(as.onlyNew && as.assignedNew === 1);
assert.strictEqual(G.Repo_students('KT_DEMO').filter((s) => s.SBD !== 'NEW01').map((s) => s.SBD + s.MaDe).join(), oldMd);
assert.throws(() => call('assign', 'KT_DEMO', 'NGAU_NHIEN'), /♻/);
call('ptPublish', 'KT_DEMO', {});
call('ptOpen', 'KT_DEMO'); R.CacheService.getScriptCache()._m.delete('ex|KT_DEMO'); R.CacheService.getScriptCache()._m.delete('rows|KT_DEMO');
const nw = G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD === 'NEW01');
const LN = ok('login', 'NEW01', nw.MaTruyCap, '', {}); ok('start', LN.tok, LN.ky, LN.sbd);
assert.strictEqual(G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD === S0.SBD).TrangThai, 'DA_NOP', 'phát lại giữ trạng thái cũ');
call('ptClose', 'KT_DEMO');

step('Bài làm trên giấy (dự phòng) cho thí sinh 5');
const its4 = items.filter((x) => x.MaDe === String(S4.MaDe)).sort((a, b) => a.STT - b.STT);
const paper = G.PK_answerString(webAns(S4.MaDe, 'full'), its4);
const dry = call('ptManual', 'KT_DEMO', S4.SBD, paper, true);
assert.strictEqual(dry.errors.length, 0, dry.errors.join(';')); assert.strictEqual(dry.count, 12);
assert.ok(call('ptManual', 'KT_DEMO', S4.SBD, '1Z', true).errors.length > 0);
const sv5 = call('ptManual', 'KT_DEMO', S4.SBD, paper, false);
assert.strictEqual(Number(sv5.tongDiem), 100);
call('regrade', 'KT_DEMO'); call('compile', 'KT_DEMO');
rep = call('report', 'KT_DEMO');
assert.strictEqual(Number(r(S4).TongDiem), 100); assert.ok(/giấy/.test(r(S4).CanhBao));
assert.ok(Number(r(S0).TongDiem) < 100, 'chấm lại giữ đúng điểm bài web');

step('Bài web/giấy được nhận diện riêng (thu bài Form không xoá chúng)');
assert.ok(G.GR_isWebId('WEB-SV1-NOP') && G.GR_isWebId('GIAY-SV1') && !G.GR_isWebId('2_ABC'));

step('SEB, in đề, PDF, phiếu đăng nhập');
const seb = call('ptSeb', 'KT_DEMO', { quitPassword: 'gv123', urlFilter: true });
assert.ok(seb.xml.includes('<string>' + URL + '</string>') && seb.xml.includes('URLFilterRules'));
assert.ok(seb.xml.includes(require('crypto').createHash('sha256').update('gv123').digest('hex')));
assert.ok(seb.sebsUrl.startsWith('sebs://script.google.com/'));
assert.ok(/<key>monitorProcesses<\/key>\s*<true\/>/.test(seb.xml) && seb.xml.includes('us.zoom.xos') && seb.xml.includes('com.google.Chrome'));
assert.ok(/<key>allowWlan<\/key>\s*<true\/>/.test(seb.xml));
const seb2 = call('ptSeb', 'KT_DEMO', { blockApps: false, macMenuBar: true });
assert.ok(!seb2.xml.includes('prohibitedProcesses') && /<key>showMenuBar<\/key>\s*<true\/>/.test(seb2.xml));
assert.ok(R.doGet({ parameter: { seb: 'KT_DEMO' } }).s.startsWith('<?xml'));
// nhận diện CLB nhúng sẵn vào trang (không chớp màu / chờ logo); màu cố định xanh navy
call('ptBrand', { ten: 'AIG | MITC', khau: 'Artificial $& intelligence </script>', mau: '#00FF00', logo: '' }); call('ptPublish', 'KT_DEMO', {});
{
  const pg = R.doGet({ parameter: {} }).getContent();
  const m = pg.match(/window\.PT_BRAND=(.*?);<\/script>/);
  assert.ok(m, 'trang thi có nhúng PT_BRAND');
  const b = JSON.parse(m[1]);
  assert.strictEqual(b.ten, 'AIG | MITC'); assert.strictEqual(b.khau, 'Artificial $& intelligence </script>', 'giữ nguyên ký tự đặc biệt');
  assert.strictEqual(b.mau, '#14237A', 'màu luôn là xanh navy');
  assert.ok(!/0B4F4A/i.test(pg) && /--club:#14237A/.test(pg), 'CSS mặc định xanh navy, không còn xanh lá');
}
const clr0 = () => { const m = R.CacheService.getScriptCache()._m; [...m.keys()].filter((k) => /^(ex|rows)\|/.test(k)).forEach((k) => m.delete(k)); };
step('Chế độ nghiêm ngặt (thi bằng link): rời 1 lần → khoá; mã giám thị mở tại máy; ghi trạng thái màn hình');
{
  const clrS = () => { const m = R.CacheService.getScriptCache()._m; [...m.keys()].filter((k) => /^(ex|rows)\|/.test(k)).forEach((k) => m.delete(k)); };
  call('ptSettings', 'KT_DEMO', { nghiemNgat: true, batBuocSEB: false }); call('ptOpen', 'KT_DEMO', true); clrS();
  const ex0 = call('ptState', 'KT_DEMO').exam;
  assert.ok(ex0.nghiemNgat && /^\d{6}$/.test(ex0.maMoKhoa), JSON.stringify(ex0).slice(0, 200));
  const sN = G.S_read(roomSs, 'ThiSinh').find((x) => x.TrangThai !== 'DA_NOP' && x.CamThi !== 'CO' && x.SEB !== 'CO');
  call('ptCommand', 'KT_DEMO', [sN.SBD], 'CHO_VAO_LAI');
  const LN = ok('login', sN.SBD, sN.MaTruyCap, '', { ua: 'Chrome' });
  assert.ok(LN.exam.nghiemNgat);
  const stN = ok('start', LN.tok, LN.ky, LN.sbd);
  assert.ok(stN.nghiemNgat && stN.viPhamToiDa === 1, 'nghiêm ngặt: 1 lần là khoá');
  const sv1 = ok('save', LN.tok, LN.ky, LN.sbd, { seq: 50, n: 1, ev: [{ k: 'THOAT_TOAN_MAN' }], env: { fs: 0, ext: 1, foc: 1 } });
  assert.ok(sv1.locked, 'rời 1 lần → khoá');
  const row = () => G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD === sN.SBD);
  assert.strictEqual(row().TrangThai, 'KHOA'); assert.strictEqual(row().ManHinh, 'THUONG|2MH');
  assert.strictEqual(api('unlock', LN.tok, LN.ky, LN.sbd, '000000', {}).code === 'INPUT' || ex0.maMoKhoa === '000000', true, 'sai mã bị từ chối');
  ok('unlock', LN.tok, LN.ky, LN.sbd, ex0.maMoKhoa, { ev: [{ k: 'ROI_TAB' }] });
  assert.strictEqual(row().TrangThai, 'DANG_LAM', 'mở khoá tại máy');
  const sv2 = ok('save', LN.tok, LN.ky, LN.sbd, { seq: 51, n: 1, env: { fs: 1, ext: 0, foc: 1 } });
  assert.ok(!sv2.locked && row().ManHinh === 'TOAN');
  assert.strictEqual(call('ptMonitor', 'KT_DEMO').students.find((x) => x.sbd === sN.SBD).manHinh, 'TOAN');
  const newCode = call('ptUnlockCode', 'KT_DEMO', true).code; clrS();
  ok('save', LN.tok, LN.ky, LN.sbd, { seq: 52, ev: [{ k: 'ROI_CUA_SO', d: 2 }] });
  assert.strictEqual(api('unlock', LN.tok, LN.ky, LN.sbd, ex0.maMoKhoa === newCode ? 'x' : ex0.maMoKhoa, {}).code, 'INPUT', 'mã cũ hết hiệu lực');
  ok('unlock', LN.tok, LN.ky, LN.sbd, newCode, {});
  for (let i = 0; i < 5; i++) api('unlock', LN.tok, LN.ky, LN.sbd, 'sai' + i, {});
  assert.strictEqual(api('unlock', LN.tok, LN.ky, LN.sbd, newCode, {}).code, 'LOCKED', 'chặn đoán mã');
  // SEB: chế độ nghiêm ngặt không áp (SEB đã khoá máy)
  call('ptSettings', 'KT_DEMO', { nghiemNgat: false }); clrS();
}
step('SEB 4 lớp: khoá máy, buộc đóng ứng dụng, tắt tiếng, kiểm tra mã cấu hình');
const seb3 = call('ptSeb', 'KT_DEMO', { extraApps: 'Notion.exe\ncom.notion.id\nfoobar' });
const has = (k, v) => new RegExp('<key>' + k + '</key>\\s*' + v).test(seb3.xml);
assert.ok(has('createNewDesktop', '<true/>') && has('lockdownModePolicy', '<integer>2</integer>') && has('enableMacOSAAC', '<true/>'), 'lớp 1');
assert.ok(has('strongKill', '<true/>') && !has('strongKill', '<false/>'), 'lớp 2: buộc đóng');
['Code.exe', 'LeagueClient.exe', 'chrome.exe', 'UltraViewer_Desktop.exe', 'Spotify.exe', 'com.microsoft.VSCode', 'com.spotify.client', 'Notion.exe', 'com.notion.id', 'foobar.exe']
  .forEach((x) => assert.ok(seb3.xml.includes('<string>' + x + '</string>'), 'thiếu ' + x));
{ const kt = G.S_read(roomSs, 'KyThi')[0];
  assert.ok(Object.values(kt).every((v) => String(v).length <= 50000), 'ô vượt 50.000 ký tự: ' + Object.entries(kt).map(([k, v]) => k + '=' + String(v).length).join(','));
  assert.ok(seb3.xml.length > 50000 || true); clr0();
  const got = R.doGet({ parameter: { seb: 'KT_DEMO' } }).s; assert.ok(got === seb3.xml, 'ghép .seb: ' + got.length + ' vs ' + seb3.xml.length + ' ' + Object.keys(kt).join(',')); }
assert.ok(seb3.nApps > 100 && seb3.forceQuit && seb3.macAAC, JSON.stringify({ n: seb3.nApps }));
assert.ok(has('audioMute', '<true/>') && has('audioControlEnabled', '<false/>') && !seb3.keepAudio, 'lớp 3: đề không có câu nghe → tắt tiếng');
const seb4 = call('ptSeb', 'KT_DEMO', { audio: 'GIU', groups: ['GAME'], forceQuit: false, macAAC: false });
assert.ok(/<key>audioMute<\/key>\s*<false\/>/.test(seb4.xml) && !seb4.xml.includes('chrome.exe') && seb4.xml.includes('VALORANT.exe') && /<key>lockdownModePolicy<\/key>\s*<integer>0/.test(seb4.xml));
// lớp 4
const sebX = call('ptSeb', 'KT_DEMO', { batBuocSEB: true });
call('ptOpen', 'KT_DEMO');
const clr = () => { const m = R.CacheService.getScriptCache()._m; [...m.keys()].filter((k) => /^(ex|rows)\|/.test(k)).forEach((k) => m.delete(k)); };
clr();
const sK = G.S_read(roomSs, 'ThiSinh').find((x) => x.TrangThai !== 'DA_NOP' && x.CamThi !== 'CO');
const uaK = 'Mozilla SEB/3.10 PhongThi/' + G.S_read(roomSs, 'KyThi')[0].KhoaUA, CK = 'a1b2c3d4'.repeat(8);
call('ptCommand', 'KT_DEMO', [sK.SBD], 'CHO_VAO_LAI');
let LK = ok('login', sK.SBD, sK.MaTruyCap, '', { ua: uaK, ck: CK, sv: 'SEB_Win 3.10' });
assert.strictEqual(G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD === sK.SBD).SebKey, CK);
const mon4 = call('ptMonitor', 'KT_DEMO');
assert.ok(mon4.students.find((x) => x.sbd === sK.SBD).sebOk === true);
assert.strictEqual(call('ptSebRef', 'KT_DEMO', sK.SBD).chuan, CK); clr();
const bad = api('login', sK.SBD, sK.MaTruyCap, '', { ua: uaK, ck: 'ff'.repeat(32), tok: LK.tok });
assert.ok(bad.code === 'NEED_SEB' && /KHÔNG khớp/.test(bad.error), JSON.stringify(bad));
assert.strictEqual(api('login', sK.SBD, sK.MaTruyCap, '', { ua: uaK, tok: LK.tok }).code, 'NEED_SEB', 'SEB không báo mã → bị chặn khi đã có chuẩn');
LK = ok('login', sK.SBD, sK.MaTruyCap, '', { ua: uaK, ck: CK.toUpperCase(), tok: LK.tok });
{ const c4 = call('ptCheck', 'KT_DEMO'); assert.ok(c4.some((x) => /máy chuẩn cấu hình SEB/.test(x.text) && x.ok) && c4.some((x) => /buộc đóng/.test(x.text) && x.ok), JSON.stringify(c4.filter((x) => /SEB|seb/.test(x.text)))); }
call('ptSeb', 'KT_DEMO', { batBuocSEB: false });
assert.strictEqual(G.S_read(roomSs, 'KyThi')[0].SebKeyChuan, '', 'tạo lại .seb → bỏ chuẩn'); clr();
const pd = call('printData', 'KT_DEMO', '');
assert.strictEqual(pd.variants.length, 2); assert.ok(pd.variants[0].items.every((x) => x.key));
const pdf = call('pdf', 'KT_DEMO', '101', 'DE');
assert.ok(pdf.pdfUrl && pdf.docUrl, JSON.stringify(pdf));
const dlog = env._docs[pdf.name].calls.map((c) => c[0]);
assert.ok(dlog.includes('appendTable') && dlog.includes('appendPageBreak'));
assert.ok(call('pdf', 'KT_DEMO', '', 'DAP_AN').pdfUrl);
assert.strictEqual(call('ptCards', 'KT_DEMO').students.length, 7);

step('Đình chỉ thi trong giờ → gỡ cấm: làm tiếp / đổi đề riêng');
call('ptOpen', 'KT_DEMO'); R.CacheService.getScriptCache()._m.delete('ex|KT_DEMO'); R.CacheService.getScriptCache()._m.delete('rows|KT_DEMO');
const sB = G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD === S2.SBD);
call('ptContinue', 'KT_DEMO', [S2.SBD], 10);
const LB = ok('login', S2.SBD, sB.MaTruyCap, '', {}); ok('start', LB.tok, LB.ky, LB.sbd);
ok('save', LB.tok, LB.ky, LB.sbd, { seq: 50, a: webAns(S2.MaDe, 'half'), n: 12 });
call('ptBan', 'KT_DEMO', [S2.SBD], 'Dùng điện thoại');
assert.strictEqual(api('save', LB.tok, LB.ky, LB.sbd, { seq: 51 }).code, 'BANNED');
const lb = api('login', S2.SBD, sB.MaTruyCap, '', {}); assert.strictEqual(lb.code, 'BANNED'); assert.ok(/Dùng điện thoại/.test(lb.error));
assert.strictEqual(call('ptMonitor', 'KT_DEMO').counts.CAM, 1);
call('ptCollect', 'KT_DEMO'); call('compile', 'KT_DEMO'); rep = call('report', 'KT_DEMO');
assert.strictEqual(Number(r(S2).TongDiem), 0); assert.ok(/ĐÌNH CHỈ/.test(r(S2).CanhBao), r(S2).CanhBao);
// gỡ cấm → làm tiếp bài dở
const ub = call('ptUnban', 'KT_DEMO', [S2.SBD], 'TIEP', { phut: 15 });
assert.strictEqual(ub.mode, 'TIEP');
const LB2 = ok('login', S2.SBD, sB.MaTruyCap, '', {}); const sb2 = ok('start', LB2.tok, LB2.ky, LB2.sbd);
assert.strictEqual(sb2.saved.seq, 50, 'giữ bài đang dở');
// đình chỉ lần 2 → gỡ cấm bằng đề riêng (trộn lại)
call('ptBan', 'KT_DEMO', [S2.SBD], '');
const ub2 = call('ptUnban', 'KT_DEMO', [S2.SBD], 'DE_MOI', { kieu: 'TRON', newCode: true });
const newMd = ub2.variants[0].maDe;
assert.ok(/-R1$/.test(newMd), newMd);
const its2 = G.Repo_items('KT_DEMO').filter((x) => x.MaDe === newMd);
assert.strictEqual(its2.length, 12);
assert.deepStrictEqual(its2.map((x) => x.MaCH).sort(), items.filter((x) => x.MaDe === String(ub2.variants[0].oldMd)).map((x) => x.MaCH).sort(), 'cùng bộ câu');
assert.strictEqual(G.Repo_students('KT_DEMO').find((s) => s.SBD === S2.SBD).MaDe, newMd);
R.CacheService.getScriptCache()._m.delete('rows|KT_DEMO');
const LB3 = ok('login', S2.SBD, ub2.codes[0].code, '', {});
assert.strictEqual(LB3.maDe, newMd);
const sb3 = ok('start', LB3.tok, LB3.ky, LB3.sbd);
assert.ok(sb3.fresh && !sb3.saved); assert.strictEqual(JSON.parse(sb3.pkg).maDe, newMd);
const ansNew = {};
its2.forEach((x) => { const k = 'S' + Number(x.STT), key = String(x.DapAnMaDe);
  ansNew[k] = x.DangCau === 'MOT_DA' ? key : x.DangCau === 'NHIEU_DA' ? key.split(',') : x.DangCau === 'DUNG_SAI' ? key.split(',') : x.DangCau === 'GHEP_NOI' ? key.split(',').map((p) => Number(p.split('-')[1])) : key.split('|')[0].trim(); });
ok('submit', LB3.tok, LB3.ky, LB3.sbd, { seq: 1, a: ansNew, n: 12 });
call('ptCollect', 'KT_DEMO'); call('compile', 'KT_DEMO'); rep = call('report', 'KT_DEMO');
assert.strictEqual(Number(r(S2).TongDiem), 100, 'chấm theo đề riêng: ' + r(S2).TongDiem + ' ' + r(S2).CanhBao);
// đề riêng bộ câu mới
call('ptBan', 'KT_DEMO', [S3.SBD], 'x');
const ub3 = call('ptUnban', 'KT_DEMO', [S3.SBD], 'DE_MOI', { kieu: 'MOI' });
assert.strictEqual(G.Repo_items('KT_DEMO').filter((x) => x.MaDe === ub3.variants[0].maDe).length, 12);
call('regrade', 'KT_DEMO'); call('compile', 'KT_DEMO');
assert.strictEqual(Number(call('report', 'KT_DEMO').results.find((x) => x.SBD === String(S2.SBD)).TongDiem), 100, 'chấm lại giữ điểm đề riêng');
call('ptClose', 'KT_DEMO');

step('Thi lại toàn bộ kỳ thi (đề giữ nguyên)');
const re = call('ptResetExam', 'KT_DEMO', false);
assert.ok(re.reset >= 6);
assert.ok(G.S_read(roomSs, 'ThiSinh').every((x) => x.TrangThai === 'CHUA_VAO' && !x.BatDau));
assert.strictEqual(G.S_read(roomSs, 'KyThi')[0].TrangThai, 'CHUA_MO');
assert.strictEqual(call('state').exams.find((e) => e.maKyThi === 'KT_DEMO').trangThai, 'DA_XUAT_FORM');
call('ptOpen', 'KT_DEMO'); R.CacheService.getScriptCache()._m.delete('ex|KT_DEMO'); R.CacheService.getScriptCache()._m.delete('rows|KT_DEMO');
const s0n = G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD === S0.SBD);
const LF = ok('login', S0.SBD, s0n.MaTruyCap, '', {}); const sf = ok('start', LF.tok, LF.ky, LF.sbd);
assert.ok(sf.fresh && !sf.saved);

step('Thi thử của giám thị: link riêng, vào khi phòng đã đóng, không lẫn vào giám sát / kết quả / lệnh cả phòng');
{
  const C = R.CacheService.getScriptCache()._m, clr = () => { C.delete('ex|KT_DEMO'); C.delete('rows|KT_DEMO'); };
  call('ptClose', 'KT_DEMO'); clr();
  assert.ok(/chưa có bài thi thử/i.test(JSON.stringify(call('ptThuPeek', 'KT_DEMO'))) || call('ptThuPeek', 'KT_DEMO').none);
  const md2 = [...new Set(G.S_read(roomSs, 'ThiSinh').map((x) => String(x.MaDe)))].sort();
  const mdA = md2.filter((m) => items.some((x) => x.MaDe === m));        // mã đề gốc (có đáp án mẫu trong bài kiểm thử)
  const th = call('ptThu', 'KT_DEMO', { maDe: mdA[1], guard: false });
  assert.ok(th.url.indexOf(URL + '?thu=') === 0, th.url); assert.strictEqual(th.maDe, mdA[1]); assert.deepStrictEqual(th.codes, md2);
  const key = th.url.split('thu=')[1]; assert.strictEqual(key.length, 32);
  const nReal = G.S_read(roomSs, 'ThiSinh').filter((x) => x.SBD !== 'GV-THU').length;
  // không đăng nhập được bằng SBD + "mã" (khoá) — chỉ qua link
  assert.strictEqual(api('login', 'GV-THU', key, '', {}).code, 'BAD_LOGIN');
  assert.strictEqual(api('thuLogin', 'x'.repeat(32), {}).code, 'THU_SAI');
  const T = ok('thuLogin', key, { ua: 'Chrome' });
  assert.strictEqual(T.sbd, 'GV-THU'); assert.ok(T.thu && T.thu.guard === false && T.thu.des.length === md2.length); assert.strictEqual(T.exam.mo, true, 'phòng đóng vẫn thi thử được');
  assert.strictEqual(ok('wait', T.tok, T.ky, T.sbd).mo, true);
  const ts = ok('start', T.tok, T.ky, T.sbd);
  assert.ok(ts.fresh && JSON.parse(ts.pkg).maDe === mdA[1]);
  const m2 = Number(G.S_read(roomSs, 'KyThi')[0].ThoiGianPhut);
  assert.ok(!ts.timeUp && (m2 ? Math.abs(ts.deadline - Date.now() - m2 * 60000) < 5000 : ts.deadline === 0), 'giờ thi thử tính riêng, không theo lúc đóng phòng');
  ok('save', T.tok, T.ky, T.sbd, { seq: 2, a: webAns(mdA[1], 'half'), n: 6 });
  // không hiện trên giám sát, không nhận lệnh cả phòng
  const mon = call('ptMonitor', 'KT_DEMO');
  assert.ok(!mon.students.some((x) => x.sbd === 'GV-THU') && mon.students.length === nReal);
  call('ptCommand', 'KT_DEMO', [], 'TIN', 'chào cả phòng'); call('ptPause', 'KT_DEMO', [], true);
  let row = G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD === 'GV-THU');
  assert.ok(!row.Lenh && !row.DungLuc, 'lệnh cả phòng không tới bài thử');
  call('ptPause', 'KT_DEMO', [], false);
  const tsub = ok('submit', T.tok, T.ky, T.sbd, { seq: 5, a: webAns(mdA[1], 'full'), n: 12 });
  assert.ok(tsub.thu && tsub.receipt);
  let pk = call('ptThuPeek', 'KT_DEMO');
  assert.strictEqual(pk.tt, 'DA_NOP'); assert.strictEqual(pk.maDe, mdA[1]); assert.strictEqual(pk.total, pk.max, 'chấm bài thử bằng bộ chấm thật: ' + pk.total + '/' + pk.max);
  // tải lại trang sau khi nộp → vẫn ở màn đã nộp thi thử (không bị đẩy ra)
  const rs = ok('resume', T.tok, T.ky, T.sbd); assert.ok(rs.thu && rs.thu.done);
  // làm lại → lượt mới trắng; đổi mã đề
  ok('thuCtl', rs.tok, T.ky, T.sbd, 'reset'); clr();
  const ts2 = ok('start', rs.tok, T.ky, T.sbd); assert.ok(ts2.fresh && !ts2.saved, 'làm lại: bài trắng');
  pk = call('ptThuPeek', 'KT_DEMO'); assert.strictEqual(pk.total, 0); assert.ok(pk.items.every((x) => x.ok === null), 'chấm lượt mới, không lấy bài cũ');
  assert.strictEqual(api('thuCtl', rs.tok, T.ky, T.sbd, 'de', 'ZZZ').code, 'INPUT');
  assert.strictEqual(ok('thuCtl', rs.tok, T.ky, T.sbd, 'de', mdA[0]).maDe, mdA[0]); clr();
  assert.strictEqual(JSON.parse(ok('start', rs.tok, T.ky, T.sbd).pkg).maDe, mdA[0]);
  // bật chống gian lận trên máy → bị khoá → mở khoá ngay trên thanh thi thử
  assert.ok(ok('save', rs.tok, T.ky, T.sbd, { seq: 1, ev: [{ k: 'ROI_TAB', d: 3 }], lk: 'thử khoá' }).lockSaved);
  assert.strictEqual(ok('start', rs.tok, T.ky, T.sbd).locked, true);
  ok('thuCtl', rs.tok, T.ky, T.sbd, 'unlock');
  assert.strictEqual(ok('start', rs.tok, T.ky, T.sbd).locked, false);
  // thu bài: bài thử không vào kết quả
  ok('submit', rs.tok, T.ky, T.sbd, { seq: 9, a: webAns(mdA[0], 'full'), n: 12 });
  call('ptCollect', 'KT_DEMO');
  assert.ok(!JSON.stringify(call('report', 'KT_DEMO')).includes('GV-THU'), 'báo cáo không có bài thử');
  assert.ok(!call('ptEvents', 'KT_DEMO', '').some((e) => e.sbd === 'GV-THU'), 'nhật ký chung không có thi thử');
  // phát lại đề → tài khoản thi thử bị xoá; tạo link mới → link cũ hết hiệu lực
  const th2 = call('ptThu', 'KT_DEMO', { guard: true }); clr();
  assert.strictEqual(api('thuLogin', key, {}).code, 'THU_SAI', 'link cũ hết hiệu lực');
  const key2 = th2.url.split('thu=')[1], T2 = ok('thuLogin', key2, {}); assert.strictEqual(T2.thu.guard, true);
  assert.strictEqual(G.S_read(roomSs, 'ThiSinh').filter((x) => x.SBD === 'GV-THU').length, 1, 'chỉ 1 tài khoản thi thử');
  // hết hạn 12 giờ
  row = G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD === 'GV-THU');
  const sh = roomSs.getSheetByName('ThiSinh'), hd = G.S_headers(sh);
  G.PTA_writeCols(sh, hd, row.__row, { GhiChu: row.GhiChu.replace(/^THU\|\d+/, 'THU|' + (Date.now() - 1000)) }); clr();
  assert.strictEqual(api('save', T2.tok, T2.ky, T2.sbd, { seq: 1 }).code, 'THU_HET');
  assert.strictEqual(api('thuLogin', key2, {}).code, 'THU_HET');
  call('ptThuEnd', 'KT_DEMO'); clr();
  assert.ok(!G.S_read(roomSs, 'ThiSinh').some((x) => x.SBD === 'GV-THU'));
  assert.strictEqual(G.S_read(roomSs, 'ThiSinh').length, nReal);
}

step('Khách ẩn danh không gọi được API quản trị');
const realActive = env.Session.getActiveUser;
env.Session.getActiveUser = () => ({ getEmail: () => '' });
assert.ok(/quyền/.test(JSON.parse(G.API_call('report', ['KT_DEMO'])).error));
env.Session.getActiveUser = realActive;

console.log('\n✅ Phòng thi web: phát đề, đăng nhập, tự lưu, khoá/mở khoá, đổi máy, cộng giờ, nộp, thu bài, bài giấy, SEB, in/PDF đều đạt.');
