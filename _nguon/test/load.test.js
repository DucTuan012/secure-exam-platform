// Mô phỏng 50 thí sinh thi 60 phút: kiểm tra toàn vẹn dữ liệu + đo số thao tác Google Sheets / lượt gọi
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { load } = require('./load');
const { makeEnv } = require('./mocks');
require('../tools/bundle')();

const env = makeEnv();
const G = load(fs.readdirSync(path.join(__dirname, '..', 'src')).filter((f) => f.endsWith('.gs')).sort(), env);
env._newHub();
const call = (n, ...a) => { const r = JSON.parse(G.API_call(n, a)); if (!r.ok) throw new Error(n + ': ' + r.error); return r.data; };
call('setup'); call('sample');
const N = 50;
const list = ['SBD\tHọ tên\tLớp'].concat(Array.from({ length: N }, (_, i) => 'T' + String(i + 1).padStart(3, '0') + '\tThí sinh ' + (i + 1) + '\tL' + (i % 3))).join('\n');
call('importStudents', 'KT_DEMO', list, 'THAY');
call('generate', 'KT_DEMO'); call('finalize', 'KT_DEMO'); call('assign', 'KT_DEMO', 'NGAU_NHIEN');
const room = env.SpreadsheetApp.openById(call('ptSetup').id);
call('ptSetUrl', 'https://script.google.com/macros/s/AKfycbLOAD/exec');
call('ptPublish', 'KT_DEMO', { viPhamToiDa: 0 });
G.S_update(room, 'KyThi', () => true, { ThoiGianPhut: '60' });
call('ptOpen', 'KT_DEMO', true);

// đếm thao tác Sheets trong ngữ cảnh phòng thi
const ops = { read: 0, write: 0, append: 0 };
const proto = Object.getPrototypeOf(room.getSheetByName('ThiSinh').getRange(1, 1));
const sProto = Object.getPrototypeOf(room.getSheetByName('ThiSinh'));
const gv = proto.getValues, sv = proto.setValues, ap = sProto.appendRow;
proto.getValues = function () { ops.read++; return gv.apply(this, arguments); };
proto.setValues = function () { ops.write++; return sv.apply(this, arguments); };
sProto.appendRow = function () { ops.append++; return ap.apply(this, arguments); };

const R = vm.createContext(Object.assign({}, env, { console, ScriptApp: { getService: () => ({ getUrl: () => '' }) }, SpreadsheetApp: Object.assign({}, env.SpreadsheetApp, { getActiveSpreadsheet: () => room }) }));
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'phongthi', 'PhongThi.gs'), 'utf8'), R);   // bộ khởi động; mã lõi nạp từ sheet MaNguon
const stat = {};
const api = (n, ...a) => {
  const b = Object.assign({}, ops), t = process.hrtime.bigint();
  const r = JSON.parse(R.PT_api(n, a));
  const s = stat[n] = stat[n] || { calls: 0, read: 0, write: 0, append: 0, ms: 0 };
  s.calls++; s.read += ops.read - b.read; s.write += ops.write - b.write; s.append += ops.append - b.append; s.ms += Number(process.hrtime.bigint() - t) / 1e6;
  if (!r.ok) throw new Error(n + ': ' + r.code + ' ' + r.error);
  return r.data;
};
const st = G.S_read(room, 'ThiSinh');
const items = G.Repo_items('KT_DEMO');
const ses = st.map((s) => ({ s, L: api('login', s.SBD, s.MaTruyCap, '', { ua: 'SEB/3.7 PhongThi/x' }) }));
ses.forEach((x) => { x.P = JSON.parse(api('start', x.L.tok, x.L.ky, x.L.sbd).pkg); });
// 60 phút: mỗi phút ~1,7 lượt/TS (tự lưu khi có thay đổi + nhịp tim)
let seq = 0;
for (let minute = 0; minute < 60; minute++) {
  ses.forEach((x, i) => {
    const its = items.filter((it) => it.MaDe === String(x.s.MaDe));
    const it = its[(minute + i) % its.length];
    x.ans = x.ans || {};
    if (minute % 2 === 0 && it.DangCau === 'MOT_DA') x.ans['S' + it.STT] = 'ABCD'[(minute + i) % 4];
    for (let k = 0; k < 7; k++) api('poll', x.L.ky, x.L.sbd);   // tín hiệu nhanh ~ mỗi 8 giây
    api('save', x.L.tok, x.L.ky, x.L.sbd, { seq: ++seq, a: minute % 2 === 0 ? x.ans : null, n: Object.keys(x.ans).length, ev: minute === 30 && i % 10 === 0 ? [{ k: 'ROI_TAB', d: 3 }] : [] });
  });
}
// 45 nộp, 5 không nộp (tự thu)
ses.forEach((x, i) => { if (i < 45) api('submit', x.L.tok, x.L.ky, x.L.sbd, { seq: ++seq, a: x.ans, n: Object.keys(x.ans).length, auto: i % 2 === 0 }); });
call('ptClose', 'KT_DEMO');
const col = call('ptCollect', 'KT_DEMO');
assert.strictEqual(col.count, N); assert.strictEqual(col.kinds.NOP, 45); assert.strictEqual(col.kinds.TU_THU, 5);
call('compile', 'KT_DEMO');
const rep = call('report', 'KT_DEMO');
assert.strictEqual(rep.results.filter((r) => r.TrangThai !== 'VANG').length, N);
// điểm chấm từ bài web phải khớp chấm trực tiếp bằng bộ chấm
const secs = G.Repo_sections(G.Repo_examRow('KT_DEMO'));
ses.forEach((x) => {
  const its = items.filter((it) => it.MaDe === String(x.s.MaDe));
  const g = G.Grade_submission(G.PK_webItems(its), G.PK_toGradeAnswers(x.ans, its), secs, {}, 2);
  assert.strictEqual(Number(rep.results.find((r) => r.SBD === String(x.s.SBD)).TongDiem), g.total, x.s.SBD);
});
const mon = call('ptMonitor', 'KT_DEMO');
assert.strictEqual(mon.counts.DA_NOP, 45);
assert.strictEqual(mon.students.filter((s) => s.viPham).length, 5);

console.log('Thao tác Google Sheets trung bình mỗi lượt gọi (máy chủ phòng thi):');
Object.keys(stat).forEach((k) => { const s = stat[k]; console.log('  ' + k.padEnd(7) + ' ' + String(s.calls).padStart(5) + ' lượt · đọc ' + (s.read / s.calls).toFixed(1) + ' · ghi ' + (s.write / s.calls).toFixed(1) + ' · thêm dòng ' + (s.append / s.calls).toFixed(1)); });
const sv2 = stat.save, perCall = (sv2.read + sv2.write + sv2.append) / sv2.calls;
// ước lượng: ~120 ms / thao tác Sheets + 150 ms khởi động lượt gọi
const estMs = 150 + perCall * 120, rate = N * 3 / 60;   // ~3 lượt/phút/thí sinh (tự lưu 12–20 s khi có thay đổi, nhịp tim 20–30 s)
console.log('Ước lượng lượt "save": ~' + Math.round(estMs) + ' ms · ' + N + ' TS ≈ ' + rate.toFixed(1) + ' lượt/giây → trung bình ' + (rate * estMs / 1000).toFixed(1) + ' lượt chạy đồng thời (giới hạn Google: 30).');
const subMs = 150 + ((stat.submit.read + stat.submit.write + stat.submit.append) / stat.submit.calls) * 120;
console.log('Đỉnh khi hết giờ: ' + N + ' bài tự nộp dàn trong ~7 giây → ≈ ' + (N / 7 * subMs / 1000).toFixed(1) + ' lượt đồng thời; vượt ngưỡng thì máy thí sinh tự thử lại.');
const pl = stat.poll, pollOps = (pl.read + pl.write + pl.append) / pl.calls, pollMs = 150 + pollOps * 120, prate = N / 8;
console.log('Tín hiệu nhanh "poll": ' + pollOps.toFixed(2) + ' thao tác Sheets / lượt (đọc từ bộ đệm) · ~' + Math.round(pollMs) + ' ms · ' + prate.toFixed(1) + ' lượt/giây → ' + (prate * pollMs / 1000).toFixed(1) + ' lượt đồng thời.');
assert.ok(pollOps < 0.3, 'poll phải gần như không đụng Sheets');
assert.ok(rate * estMs / 1000 + prate * pollMs / 1000 < 8, 'tổng tải đồng thời');
assert.ok(rate * estMs / 1000 < 5);
console.log('\n✅ Mô phỏng ' + N + ' thí sinh × 60 phút: không mất bài, điểm khớp bộ chấm, tải thấp hơn nhiều giới hạn.');
