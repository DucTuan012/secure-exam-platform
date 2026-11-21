// Kiểm thử máy chủ của trình "Nhập câu hỏi nhanh" (24_BankEditor.gs) trên môi trường mô phỏng
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { load } = require('./load');
const { makeEnv } = require('./mocks');

const env = makeEnv();
const files = fs.readdirSync(path.join(__dirname, '..', 'src')).filter((f) => f.endsWith('.gs')).sort();
const G = load(files, env);
env._newHub();
const call = (name, ...args) => { const r = JSON.parse(G.API_call(name, args)); if (!r.ok) throw new Error(name + ': ' + r.error); return r.data; };
const fail = (name, ...args) => { const r = JSON.parse(G.API_call(name, args)); assert.strictEqual(r.ok, false, name + ' lẽ ra phải lỗi'); return r.error; };
const step = (t) => console.log('▶', t);

call('setup');
call('sample');

step('Tạo môn AIG + danh mục 6 chương + ma trận MT_AIG1');
const mon = call('createSubject', 'AIG', 'Đầu vào AIG');
const bss = env.SpreadsheetApp.openById(mon.id);
G.S_writeAll(bss, 'DanhMuc', [1, 2, 3, 4, 5, 6].map((k) => ({ MaChuDe: 'AIG-C' + k, Khoi_CapDo: 'Đầu vào', Chuong: 'C' + k + '. Chương ' + k, ChuDe: 'Chủ đề ' + k })));
const hub = G.S_hub();
G.S_append(hub, 'MaTran_Phan', [
  { MaMaTran: 'MT_AIG1', MaMon: 'AIG', TenMaTran: 'Đầu vào AIG lần 1', Phan: 'I', TenPhan: 'Trắc nghiệm', DiemPhan: 60, TongSoCau: 24, DangCauChoPhep: 'MOT_DA,NHIEU_DA' },
  { MaMaTran: 'MT_AIG1', MaMon: 'AIG', TenMaTran: 'Đầu vào AIG lần 1', Phan: 'II', TenPhan: 'Đúng/Sai', DiemPhan: 24, TongSoCau: 6, DangCauChoPhep: 'DUNG_SAI' },
  { MaMaTran: 'MT_AIG1', MaMon: 'AIG', TenMaTran: 'Đầu vào AIG lần 1', Phan: 'III', TenPhan: 'Trả lời ngắn', DiemPhan: 16, TongSoCau: 4, DangCauChoPhep: 'TRA_LOI_NGAN' }]);
const cells = [];
for (let k = 1; k <= 6; k++) { cells.push({ Phan: 'I', Chuong: 'C' + k, MucDo: 'NB', SoCau: 1 }, { Phan: 'I', Chuong: 'C' + k, MucDo: 'TH', SoCau: 2 }, { Phan: 'I', Chuong: 'C' + k, MucDo: 'VD', SoCau: 1 }, { Phan: 'II', Chuong: 'C' + k, SoCau: 1 }); }
[1, 2, 3, 6].forEach((k) => cells.push({ Phan: 'III', Chuong: 'C' + k, MucDo: 'VD', SoCau: 1 }));
G.S_append(hub, 'MaTran_ChiTiet', cells.map((c) => Object.assign({ MaMaTran: 'MT_AIG1' }, c)));

step('Nâng cấp file ngân hàng cũ (chưa có cột F–J): chèn ngay sau cột E');
const qsh = bss.getSheetByName('CauHoi');
const oldHead = G.HEADERS.CauHoi.filter((h) => !['F', 'G', 'H', 'I', 'J'].includes(h));
qsh.clear(); qsh.getRange(1, 1, 1, oldHead.length).setValues([oldHead]);
qsh.getRange(2, 1, 1, oldHead.length).setValues([oldHead.map((h) => ({ MaCH: 'OLD-1', MaChuDe: 'AIG-C1', MucDo: 'NB', DangCau: 'MOT_DA', NoiDung_VI: 'Câu cũ', A: 'x', B: 'y', E: 'z', C: 'u', D: 'v', DapAn: 'E' }[h] || ''))]);
let init = call('beInit', 'AIG');
let head = G.S_headers(qsh);
assert.deepStrictEqual(head.slice(head.indexOf('A'), head.indexOf('A') + 11), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'CotGhep']);
assert.strictEqual(G.S_read(bss, 'CauHoi')[0].DapAn, 'E', 'dữ liệu cũ không bị lệch cột');
assert.strictEqual(G.S_read(bss, 'CauHoi')[0].CotGhep, '');
G.S_writeAll(bss, 'CauHoi', []);
step('beInit');
init = call('beInit', 'AIG');
assert.strictEqual(init.topics.length, 6);
assert.strictEqual(init.rows.length, 0);
assert.deepStrictEqual(init.matrices.map((m) => m.id), ['MT_AIG1']);
assert.ok(init.levels.find((l) => l.code === 'VDC'));

step('beSave: câu một đáp án, tự cấp mã AIG-C1-001, chuẩn hoá đáp án');
let r = call('beSave', 'AIG', { MaChuDe: 'AIG-C1', MucDo: 'nb', DangCau: 'MOT_DA', NoiDung_VI: 'Định thức của $I_3$ là', A: '0', B: '1', C: '3', D: '=9', DapAn: 'b' }, '');
assert.strictEqual(r.ok, true, JSON.stringify(r));
assert.strictEqual(r.id, 'AIG-C1-001');
assert.strictEqual(r.row.DapAn, 'B');
assert.strictEqual(r.row.MucDo, 'NB');
let rows = G.S_read(bss, 'CauHoi');
assert.strictEqual(rows.length, 1);
assert.strictEqual(rows[0].D, "'=9", 'chuỗi bắt đầu bằng = phải được thêm dấu \'');

step('beSave: lỗi được trả về, không ghi');
r = call('beSave', 'AIG', { MaChuDe: 'AIG-C1', MucDo: 'NB', DangCau: 'MOT_DA', NoiDung_VI: 'Thiếu đáp án', A: '1', B: '2' }, '');
assert.strictEqual(r.ok, false);
assert.ok(r.errors.some((e) => /đáp án/i.test(e)));
r = call('beSave', 'AIG', { MaChuDe: 'AIG-C1', MucDo: 'XYZ', DangCau: 'MOT_DA', NoiDung_VI: 'Sai mức', A: '1', B: '2', DapAn: 'A' }, '');
assert.ok(!r.ok && r.errors.some((e) => /Mức độ/.test(e)));
assert.strictEqual(G.S_read(bss, 'CauHoi').length, 1);

step('beSave: mã tiếp theo theo từng chủ đề, sửa câu giữ mã & ngày tạo, xoá lựa chọn E');
r = call('beSave', 'AIG', { MaChuDe: 'AIG-C1', MucDo: 'TH', DangCau: 'NHIEU_DA', NoiDung_VI: 'Ma trận nào khả nghịch?', A: 'I', B: '0', C: '2I', D: 'J', E: 'K', DapAn: 'C,A' }, '');
assert.strictEqual(r.id, 'AIG-C1-002'); assert.strictEqual(r.row.DapAn, 'A,C');
const created = r.row.NgayTao;
r = call('beSave', 'AIG', { MaChuDe: 'AIG-C1', MucDo: 'TH', DangCau: 'NHIEU_DA', NoiDung_VI: 'Ma trận nào khả nghịch? (sửa)', A: 'I', B: '0', C: '2I', D: 'J', DapAn: 'A,C' }, 'AIG-C1-002');
assert.strictEqual(r.ok, true); assert.strictEqual(r.created, false); assert.strictEqual(r.row.NgayTao, created);
rows = G.S_read(bss, 'CauHoi');
assert.strictEqual(rows.length, 2);
assert.strictEqual(rows[1].E, '');
assert.ok(/sửa/.test(rows[1].NoiDung_VI));
r = call('beSave', 'AIG', { MaChuDe: 'AIG-C2', MucDo: 'VD', DangCau: 'TRA_LOI_NGAN', NoiDung_VI: 'Tính $\\int_0^1 2x\\,dx$', DapAn: '1' }, '');
assert.strictEqual(r.id, 'AIG-C2-001');

step('beSave: câu 10 lựa chọn A–J, nhiều đáp án');
r = call('beSave', 'AIG', { MaChuDe: 'AIG-C2', MucDo: 'TH', DangCau: 'NHIEU_DA', NoiDung_VI: 'Hàm nào tuần hoàn?',
  A: 'sin x', B: 'x^2', C: 'cos 2x', D: 'e^x', E: 'tan x', F: 'arcsin(sin x)', G: 'ln x', H: '|x|', I: 'sin x + cos x', J: 'x sin x', DapAn: 'J, a, c, f' }, '');
assert.strictEqual(r.ok, true, JSON.stringify(r));
assert.strictEqual(r.row.DapAn, 'A,C,F,J');
assert.strictEqual(G.S_read(bss, 'CauHoi').find((x) => x.MaCH === r.id).J, 'x sin x');
r = call('beSave', 'AIG', { MaChuDe: 'AIG-C2', MucDo: 'TH', DangCau: 'MOT_DA', NoiDung_VI: 'Trống giữa', A: '1', B: '2', D: '4', DapAn: 'A' }, '');
assert.ok(!r.ok && r.errors.some((e) => /liên tiếp/.test(e)));
const tenId = 'AIG-C2-002';

step('beSaveMany: dán nhiều câu (từ bộ phân tích) — câu lỗi bị bỏ qua');
const parsed = G.PQ_parse(`Câu 1 (NB): Kỳ vọng của Bernoulli(p)?\nA. p\nB. 1-p\nC. p(1-p)\nD. 1\nĐáp án: A
Câu 2 (TH): Các mệnh đề sau đúng hay sai?\na) E[X+Y]=E[X]+E[Y]\nb) Var(2X)=2Var(X)\nc) Var(X)≥0\nd) E[c]=c\nĐáp án: Đ S Đ Đ
Câu 3: Câu thiếu đáp án\nA. 1\nB. 2`);
assert.strictEqual(parsed.length, 3);
const recs = parsed.map((q) => Object.assign(G.PQ_toRecord(q), { MaChuDe: 'AIG-C3', MucDo: q.mucDo || 'VD' }));
const many = call('beSaveMany', 'AIG', recs);
assert.strictEqual(many.saved, 2);
assert.deepStrictEqual(many.results.map((x) => x.ok), [true, true, false]);
assert.deepStrictEqual(many.results.filter((x) => x.ok).map((x) => x.id), ['AIG-C3-001', 'AIG-C3-002']);
assert.strictEqual(many.results[1].row.DapAn, 'Đ,S,Đ,Đ');
assert.strictEqual(G.S_read(bss, 'CauHoi').length, 6);

step('beStatus / beDelete');
call('beStatus', 'AIG', 'AIG-C3-002', 'AN');
assert.strictEqual(G.S_read(bss, 'CauHoi').find((x) => x.MaCH === 'AIG-C3-002').TrangThai, 'AN');
call('beDelete', 'AIG', 'AIG-C3-002');
assert.strictEqual(G.S_read(bss, 'CauHoi').length, 5);
// câu đã nằm trong đề DEMO thì không được xoá
call('generate', 'KT_DEMO');
const usedId = G.S_read(hub, 'DeThi')[0].MaCH;
assert.ok(/chỉ có thể Ẩn/.test(fail('beDelete', 'DEMO', usedId)));

step('beGroup: tạo nhóm câu chùm, câu con gắn nhóm');
const g = call('beGroup', 'AIG', { MaChuDe: 'AIG-C4', MucDo: 'TH', DangCau: 'MOT_DA', NoiDung_VI: 'Cho đoạn mã:\nx = [1, 2, 3]' });
assert.strictEqual(g.id, 'N-AIG-C4-001');
r = call('beSave', 'AIG', { MaChuDe: 'AIG-C4', MucDo: 'TH', DangCau: 'MOT_DA', MaNhom: g.id, NoiDung_VI: 'len(x) = ?', A: '2', B: '3', DapAn: 'B' }, '');
assert.strictEqual(r.ok, true, JSON.stringify(r));

step('beUpload: ảnh dán lên Drive');
const up = call('beUpload', 'AIG', Buffer.from('PNGDATA').toString('base64'), 'image/png', '');
assert.ok(up.id && /^AIG_\d{8}_\d{6}\.png$/.test(up.name));

step('beTranslate: giữ nguyên công thức');
const tr = call('beTranslate', ['Đạo hàm của $x^2$ là', '', 'Dòng 1\nDòng 2 `len(x)`'], 'vi', 'en');
assert.strictEqual(tr[1], '');
assert.ok(tr[0].includes('$x^2$') && tr[0].startsWith('[en]'), tr[0]);
assert.ok(tr[2].includes('\n') && tr[2].includes('`len(x)`'), tr[2]);

step('beProgress: so với ma trận MT_AIG1 (2 mã đề)');
const pg = call('beProgress', 'AIG', 'MT_AIG1', 2);
assert.strictEqual(pg.cells.length, 28);
const c1nb = pg.cells.find((c) => c.phan === 'I' && c.chuong[0] === 'C1' && c.mucDo[0] === 'NB');
assert.deepStrictEqual([c1nb.need, c1nb.target, c1nb.have], [1, 2, 1]);
const c1th = pg.cells.find((c) => c.phan === 'I' && c.chuong[0] === 'C1' && c.mucDo[0] === 'TH');
assert.strictEqual(c1th.have, 1);
const c3ds = pg.cells.find((c) => c.phan === 'II' && c.chuong[0] === 'C3');
assert.strictEqual(c3ds.have, 0, 'câu Đ/S đã bị xoá');
const c2tln = pg.cells.find((c) => c.phan === 'III' && c.chuong[0] === 'C2');
assert.strictEqual(c2tln.have, 1);

step('beInit sau khi nhập');
init = call('beInit', 'AIG');
assert.strictEqual(init.rows.length, 6);
assert.strictEqual(init.groups.length, 1);
assert.strictEqual(init.groups[0].n, 1);
assert.strictEqual(init.valid, 6);
assert.deepStrictEqual(init.issues, {});

step('Sinh đề + xuất Form + chấm với câu 10 lựa chọn');
G.S_append(hub, 'MaTran_Phan', [{ MaMaTran: 'MT_10', MaMon: 'AIG', TenMaTran: 'Thử 10 lựa chọn', Phan: 'I', TenPhan: 'TN', DiemPhan: 10, TongSoCau: 1, DangCauChoPhep: 'NHIEU_DA' }]);
G.S_append(hub, 'MaTran_ChiTiet', [{ MaMaTran: 'MT_10', Phan: 'I', Chuong: 'C2', SoCau: 1 }]);
call('saveExam', { maKyThi: 'KT_10', ten: 'Thử', maMon: 'AIG', maMaTran: 'MT_10', cheDo: 'A_TRON', soMaDe: 1, maDeBatDau: '1', tronCau: true, tronDapAn: true, thoiGianPhut: 10 });
call('generate', 'KT_10');
const it10 = G.S_read(hub, 'DeThi').find((x) => x.MaKyThi === 'KT_10');
assert.strictEqual(it10.MaCH, tenId);
assert.strictEqual(String(it10.ThuTu).split(',').length, 10);
call('finalize', 'KT_10');
call('importStudents', 'KT_10', 'SV01\tNguyễn Văn A\tL1\nSV02\tTrần B\tL1', 'THAY');
call('assign', 'KT_10', 'NGAU_NHIEN');
call('exportVariant', 'KT_10', '1');
const vr10 = G.Repo_variantRows('KT_10')[0], q10 = G.Repo_items('KT_10')[0];
const form10 = env.FormApp.openById(vr10.FormId);
const fi = form10.items.find((x) => String(x.id) === String(q10.FormItemId));
assert.strictEqual(fi.choices.length, 10, 'Form phải có đủ 10 lựa chọn');
assert.ok(fi.choices[9].startsWith('J.'), fi.choices[9]);
const k10 = String(q10.DapAnMaDe).split(',');
assert.strictEqual(k10.length, 4);
call('open', 'KT_10');
const sub = (sbd, name, letters) => { const a = {}; a[vr10.ItemIdSBD] = sbd; a[vr10.ItemIdHoTen] = name; a[q10.FormItemId] = letters.map((L) => L + '. y'); form10._submit(a, new Date()); };
sub('SV01', 'Nguyễn Văn A', k10);
sub('SV02', 'Trần B', k10.slice(0, 3));
call('close', 'KT_10');
call('collect', 'KT_10', '1'); call('compile', 'KT_10');
const kq = G.S_read(hub, 'KetQua').filter((x) => x.MaKyThi === 'KT_10');
assert.strictEqual(Number(kq.find((x) => x.SBD === 'SV01').TongDiem), 10, 'chọn đủ 4 đáp án đúng (' + k10 + ') → trọn điểm');
assert.strictEqual(Number(kq.find((x) => x.SBD === 'SV02').TongDiem), 0, 'thiếu 1 đáp án → 0 điểm');

console.log('✅ Trình nhập câu hỏi: mọi kiểm thử máy chủ đều đạt.');
