// Chạy thử TOÀN BỘ quy trình trên môi trường mô phỏng Apps Script
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { load } = require('./load');
const { makeEnv } = require('./mocks');

const env = makeEnv();
const files = fs.readdirSync(path.join(__dirname, '..', 'src')).filter((f) => f.endsWith('.gs')).sort();
const G = load(files, env);
const hub = env._newHub();
const call = (name, ...args) => { const r = JSON.parse(G.API_call(name, args)); if (!r.ok) throw new Error(name + ': ' + r.error); return r.data; };
const step = (t) => console.log('▶', t);

step('Khởi tạo');
call('setup');
assert.ok(hub.getSheetByName('KyThi') && hub.getSheetByName('CauHinh'));
assert.ok(!hub.getSheetByName('Sheet1'));
let st = call('state');
assert.strictEqual(st.ready, true);

step('Dữ liệu mẫu');
call('sample');
st = call('state');
assert.strictEqual(st.subjects.length, 1);
assert.strictEqual(st.exams[0].maKyThi, 'KT_DEMO');

step('Đọc ngân hàng');
const bank = call('bank', 'DEMO');
assert.strictEqual(bank.questions.length, 24);
assert.strictEqual(bank.issues.filter((x) => x.level === 'LOI').length, 0, JSON.stringify(bank.issues));

step('Kiểm tra ma trận');
const chk = call('checkMatrix', 'MT_DEMO', 'DEMO', 2, 'B_KHAC');
assert.strictEqual(chk.trialErrors.length, 0);
assert.strictEqual(chk.totalPoints, 100);

step('Lưu ma trận qua API (round trip)');
const raw = call('matrix', 'MT_DEMO');
const saved = call('saveMatrix', 'MT_DEMO', 'DEMO', 'Ma trận mẫu 12 câu', raw.sections, raw.cells);
assert.strictEqual(saved.totalQuestions, 12);

step('Sinh đề');
let g = call('generate', 'KT_DEMO');
assert.ok(g.ok, JSON.stringify(g));
let V = call('variants', 'KT_DEMO');
assert.strictEqual(V.variants.length, 2);
assert.strictEqual(V.variants[0].items.length, 12);

step('Khoá + đổi câu + sinh lại');
const it0 = V.variants[0].items.find((x) => x.phan === 'I' && !x.maNhom);
call('lock', 'KT_DEMO', '101', it0.maCH, true);
const it1 = V.variants[0].items.find((x) => x.phan === 'III');
call('swap', 'KT_DEMO', '101', it1.maCH);
g = call('generate', 'KT_DEMO');
assert.ok(g.ok);
V = call('variants', 'KT_DEMO');
assert.ok(V.variants[0].items.some((x) => x.maCH === it0.maCH && x.khoa));

step('Chốt & phân đề & xuất Form');
assert.throws(() => call('exportVariant', 'KT_DEMO', '101'));
call('finalize', 'KT_DEMO');
const asg = call('assign', 'KT_DEMO', 'NGAU_NHIEN');
assert.strictEqual(asg.perVariant['101'] + asg.perVariant['102'], 6);
const ex1 = call('exportVariant', 'KT_DEMO', '101');
const ex2 = call('exportVariant', 'KT_DEMO', '102');
assert.ok(ex2.allDone);
console.log('   cảnh báo xuất:', ex1.warnings, ex2.warnings);
assert.ok(env.UrlFetchApp.calls > 0, 'phải render ít nhất 1 công thức thành ảnh');
const form1 = env.FormApp.openById(ex1.formId);
assert.strictEqual(form1.accepting, false);
assert.strictEqual(form1.published, true);
const qItems = form1.items.filter((i) => ['MULTIPLE_CHOICE', 'CHECKBOX', 'GRID', 'TEXT'].includes(i.type));
assert.strictEqual(qItems.length, 12 + 2);
console.log('   Form 101 có', form1.items.length, 'mục:', form1.items.map((i) => i.type[0]).join(''));

step('Xuất lại khi chưa có bài nộp: dùng lại Form');
const ex1b = call('exportVariant', 'KT_DEMO', '101');
assert.strictEqual(ex1b.formId, ex1.formId);
assert.ok(ex1b.reused);

step('Mở thi, thí sinh nộp bài');
call('open', 'KT_DEMO');
assert.strictEqual(env.FormApp.openById(ex1.formId).accepting, true);
const students = call('students', 'KT_DEMO');
const items = G.Repo_items('KT_DEMO');
const vrows = G.Repo_variantRows('KT_DEMO');
function answersFor(md, sbd, name, mode) {
  const v = vrows.find((x) => String(x.MaDe) === md);
  const a = {}; a[v.ItemIdSBD] = sbd; a[v.ItemIdHoTen] = name;
  items.filter((x) => x.MaDe === md).forEach((x, idx) => {
    const k = String(x.DapAnMaDe);
    const wrong = mode === 'half' && idx % 2 === 1;
    if (mode === 'blank') return;
    if (x.DangCau === 'MOT_DA') a[x.FormItemId] = (wrong ? (k === 'A' ? 'B' : 'A') : k) + '. xxx';
    if (x.DangCau === 'NHIEU_DA') a[x.FormItemId] = (wrong ? ['A'] : k.split(',')).map((L) => L + '. y');
    if (x.DangCau === 'DUNG_SAI') a[x.FormItemId] = k.split(',').map((b, i) => ((b === 'Đ') !== (wrong && i === 0) ? G.GR_TRUE_LABEL : G.GR_FALSE_LABEL));
    if (x.DangCau === 'GHEP_NOI') a[x.FormItemId] = k.split(',').map((p) => (wrong ? '9' : p.split('-')[1]));
    if (x.DangCau === 'TRA_LOI_NGAN') a[x.FormItemId] = wrong ? '999' : k.split('|')[0].trim();
  });
  return a;
}
const s0 = students[0], s1 = students[1], s2 = students[2];
const fOf = (md) => env.FormApp.openById(vrows.find((x) => String(x.MaDe) === md).FormId);
fOf(s0.maDe)._submit(answersFor(s0.maDe, s0.sbd, s0.hoTen, 'full'), new Date('2026-11-20T02:10:00Z'));
fOf(s1.maDe)._submit(answersFor(s1.maDe, s1.sbd.toLowerCase(), 'ten khac', 'half'), new Date('2026-11-20T02:12:00Z'));
fOf(s1.maDe)._submit(answersFor(s1.maDe, s1.sbd, s1.hoTen, 'full'), new Date('2026-11-20T02:15:00Z')); // nộp lần 2
fOf(s2.maDe)._submit(answersFor(s2.maDe, s2.sbd, s2.hoTen, 'blank'), new Date('2026-11-20T02:16:00Z'));
// SBD của mã đề khác bị Form chặn
const other = students.find((s) => s.maDe !== s0.maDe);
assert.throws(() => fOf(s0.maDe)._submit(answersFor(s0.maDe, other.sbd, 'x', 'full')), /validation/);
const mon = call('monitor', 'KT_DEMO');
assert.strictEqual(mon.tongBai, 4);

step('Hẹn giờ đóng rồi đóng');
const future = new Date(Date.now() + 3600e3);
const p = (n) => String(n).padStart(2, '0');
const loc = new Date(future.getTime() + 7 * 3600e3);
const ds = loc.getUTCFullYear() + '-' + p(loc.getUTCMonth() + 1) + '-' + p(loc.getUTCDate()) + 'T' + p(loc.getUTCHours()) + ':' + p(loc.getUTCMinutes());
call('scheduleClose', 'KT_DEMO', ds);
assert.strictEqual(env._store.triggers.length, 1);
call('close', 'KT_DEMO');
assert.strictEqual(env.FormApp.openById(ex1.formId).accepting, false);
G.EC_rescheduleTrigger();
assert.strictEqual(env._store.triggers.length, 0, 'đóng thì huỷ hẹn');

step('Thu bài & chấm');
call('collect', 'KT_DEMO', '101'); call('collect', 'KT_DEMO', '102');
const c = call('compile', 'KT_DEMO');
assert.strictEqual(c.submitted, 3);
let R = call('report', 'KT_DEMO');
const r0 = R.results.find((r) => r.SBD === s0.sbd), r1 = R.results.find((r) => r.SBD === s1.sbd), r2 = R.results.find((r) => r.SBD === s2.sbd);
assert.strictEqual(Number(r0.TongDiem), 100, JSON.stringify(r0));
assert.ok(Number(r1.TongDiem) < 100, 'bài đầu tiên (làm sai một nửa) được tính: ' + r1.TongDiem);
assert.ok(/Nộp 2 lần/.test(r1.CanhBao) && /Họ tên khác/.test(r1.CanhBao), r1.CanhBao);
assert.strictEqual(Number(r2.TongDiem), 0);
assert.strictEqual(R.vang, 3);
assert.ok(R.topics.length > 0 && R.questions.length > 0 && R.byClass.length > 0);
console.log('   điểm:', R.results.map((r) => r.SBD + '=' + r.TongDiem).join(', '));
assert.strictEqual(call('state').exams[0].trangThai, 'DA_CHAM');

step('Phúc khảo: tặng điểm 1 câu rồi chấm lại');
const target = items.find((x) => x.MaDe === s2.maDe).MaCH; // câu có trong mã đề của thí sinh bỏ trống
assert.throws(() => call('addReview', 'KT_DEMO', target, 'TANG_DIEM', '', ''), /lý do/);
call('addReview', 'KT_DEMO', target, 'TANG_DIEM', '', 'Đề in lỗi');
call('regrade', 'KT_DEMO'); call('compile', 'KT_DEMO');
R = call('report', 'KT_DEMO');
const r2b = R.results.find((r) => r.SBD === s2.sbd);
assert.ok(Number(r2b.TongDiem) > 0, 'bài bỏ trống được tặng điểm câu ' + target + ': ' + r2b.TongDiem);
call('toggleReview', 'KT_DEMO', 0, false);
call('regrade', 'KT_DEMO'); call('compile', 'KT_DEMO');
assert.strictEqual(Number(call('report', 'KT_DEMO').results.find((r) => r.SBD === s2.sbd).TongDiem), 0);

step('Chặn thao tác sai trạng thái');
assert.throws(() => call('generate', 'KT_DEMO'));
assert.throws(() => call('unfinalize', 'KT_DEMO'));
assert.throws(() => call('exportVariant', 'KT_DEMO', '101'), /Chốt|bài nộp/);

step('Tạo kỳ thi mới chế độ A, 4 mã đề');
call('saveExam', { maKyThi: 'kt-a', ten: 'Thi chế độ A', maMon: 'DEMO', maMaTran: 'MT_DEMO', cheDo: 'A_TRON', soMaDe: 4, maDeBatDau: '201', tronCau: true, tronDapAn: true, tronYDungSai: false, thoiGian: 45 });
g = call('generate', 'KT-A');
assert.ok(g.ok);
V = call('variants', 'KT-A');
assert.strictEqual(V.variants.length, 4);
assert.ok(V.stats.overlap.every((o) => o.pct === 100));
// ý Đúng/Sai không trộn
V.variants.forEach((v) => v.items.filter((x) => x.dang === 'DUNG_SAI').forEach((x) => assert.strictEqual(x.options.map((o) => o.goc).join(''), 'ABCD')));

step('Nhập thí sinh dạng dán từ Excel');
const imp = call('importStudents', 'KT-A', 'SBD\tHọ tên\tLớp\tEmail\nA01\tNgô Bảo\tKHMT2\tb@x.vn\nA02\tLý Chi\tKHMT2\nA01\tTrùng\tX', 'THAY');
assert.strictEqual(imp.count, 2); assert.strictEqual(imp.errors.length, 1);

step('Tạo môn mới');
const ns = call('createSubject', 'ml', 'Học máy');
assert.strictEqual(ns.maMon, 'ML');
assert.ok(env.SpreadsheetApp.openById(ns.id).getSheetByName('CauHoi'));
assert.throws(() => call('createSubject', 'ML', 'x'), /tồn tại/);

console.log('\n✅ Toàn bộ quy trình chạy thông trên môi trường mô phỏng.');
