const assert = require('assert');
const { load } = require('./load');
const C = load(['00_Config.gs', '10_Core_Utils.gs', '11_Core_Latex.gs', '12_Core_Bank.gs', '13_Core_Matrix.gs',
  '14_Core_Generate.gs', '15_Core_Grade.gs', '16_SampleData.gs', '18_Core_Package.gs']);

const eq = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);
let n = 0; const t = (name, fn) => { fn(); n++; console.log('✓', name); };

// ---------- LaTeX ----------
t('latex unicode basics', () => {
  const cases = {
    'x^2 + y^2': 'x² + y²', '3 \\times 4': '3 × 4', '\\frac{1}{6}': '1/6', '\\frac{TP}{TP+FP}': 'TP/(TP+FP)',
    'A^{-1}': 'A⁻¹', 'A^{\\top}': 'Aᵀ', '\\sum_{i=1}^{n} x_i': '∑ᵢ₌₁ⁿ xᵢ', '\\sqrt{x+1}': '√(x+1)', '\\alpha \\le \\beta': 'α ≤ β',
    'x \\in \\mathbb{R}': 'x ∈ ℝ', '\\det(A) \\neq 0': 'det(A) ≠ 0', '\\sin x': 'sin x', 'e^x': 'eˣ', '\\mathcal{N}(0,1)': '𝒩(0,1)',
    '\\frac{\\partial f}{\\partial x}': '∂f/∂x', 'P(X > 0) = 0.5': 'P(X > 0) = 0.5'
  };
  for (const [k, v] of Object.entries(cases)) {
    const r = C.LX_toUnicode(k);
    assert.ok(r.ok, 'ok ' + k);
    assert.strictEqual(r.text, v, k);
  }
  assert.strictEqual(C.LX_toUnicode('\\begin{pmatrix}1&2\\end{pmatrix}').ok, false);
  assert.strictEqual(C.LX_toUnicode('\\binom{n}{k}').ok, false);
});
t('latex segments & forForm', () => {
  const imgs = [];
  const r = C.LX_forForm('Tính $\\det\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$ và $x^2$, giá \\$5 $$\\int_0^1 x dx$$', imgs);
  assert.strictEqual(imgs.length, 2);
  assert.ok(r.text.includes('[CT1]') && r.text.includes('x²') && r.text.includes('$5') && r.text.includes('[CT2]'), r.text);
  assert.ok(C.LX_imageUrl('x^2', 160).startsWith('https://latex.codecogs.com/png.image?%5Cdpi%7B160%7D'));
});


t('forForm: khối code chịu được CRLF và dấu cách thừa (dạng chữ, giữ thụt lề)', () => {
  const F = '```';
  const variants = [F + 'python\nif x:\n    y = 1\n' + F, F + 'python\r\nif x:\r\n    y = 1\r\n' + F, F + 'python \nif x:\n    y = 1\n ' + F];
  variants.forEach((v) => {
    const imgs = [];
    const r = C.LX_forForm('Cho code:\n' + v + '\nKết quả?', imgs);
    assert.strictEqual(imgs.length, 0, JSON.stringify(v));
    assert.ok(r.text.indexOf('```') < 0 && r.text.indexOf('~') < 0, r.text);
    assert.ok(r.text.indexOf('\u2502\u00A0\u00A0\u00A0\u00A0\u00A0y\u00A0=\u00A01') >= 0 || /y.=.1/.test(r.text), r.text);
  });
});
t('code: giải mã &lt; và LaTeX không còn dấu ~', () => {
  const lt = C.LX_codeLatex('if a &lt; b:\n    x = 1');
  assert.ok(lt.indexOf('textless') > 0 && lt.indexOf('&lt;') < 0 && lt.indexOf('~') < 0, lt);
  assert.ok(C.LX_codeText('for i in range(3):\n    print(i)').indexOf('<') < 0);
  assert.ok(C.LX_codeText('a &lt; b').indexOf('a < b') > 0);
});
t('công thức phức tạp luôn thành ảnh, đơn giản vẫn là chữ', () => {
  const imgs = [];
  const r = C.LX_forForm('Tính $\\lim_{x\\to 0}\\frac{1}{x}$ và $x^2$', imgs);
  assert.strictEqual(imgs.length, 1);
  assert.ok(r.text.indexOf('[CT1]') >= 0 && r.text.indexOf('x²') >= 0, r.text);
});

// ---------- Bank ----------
const S = C.Sample_data();
const rows = (arr) => arr.map((o, i) => Object.assign({ __row: i + 2 }, o));
const levels = C.U_parseLevels(C.DEFAULT_CONFIG[1][1]);
const bank = C.Bank_build(rows(S.questions), rows(S.groups), rows(S.topics), levels);
t('bank builds without errors', () => {
  const errs = bank.issues.filter((x) => x.level === 'LOI');
  eq(errs, []);
  assert.strictEqual(Object.keys(bank.questions).length, 24);
  assert.strictEqual(bank.units.length, 22); // 20 câu đơn + 2 nhóm
  assert.strictEqual(bank.questions.Q010.shuffle.noShuffle, true); // "Cả A, B và C" -> không trộn
  eq(Array.from(bank.questions.Q013.key.tf), [true, true, false, true]);
  assert.strictEqual(bank.questions.Q021.dang, 'MOT_DA'); // kế thừa nhóm
});
t('bank detects errors', () => {
  const bad = C.Bank_build(rows([
    { MaCH: 'X1', MaChuDe: 'CD01', MucDo: 'NB', DangCau: 'MOT_DA', NoiDung_VI: 'a', A: '1', B: '2', DapAn: 'C' },
    { MaCH: 'X1', MaChuDe: 'CD01', MucDo: 'NB', DangCau: 'MOT_DA', NoiDung_VI: 'b', A: '1', B: '2', DapAn: 'A' },
    { MaCH: 'X2', MaChuDe: 'CD01', MucDo: 'ZZ', DangCau: 'DUNG_SAI', NoiDung_VI: 'c', A: '1', B: '2', C: '3', D: '4', DapAn: 'Đ,S' },
    { MaCH: 'X3', MaChuDe: 'CD01', MucDo: 'NB', DangCau: 'abc', NoiDung_VI: 'd' }
  ]), [], rows(S.topics), levels);
  const msgs = bad.issues.map((x) => x.ma + ':' + x.msg).join('\n');
  assert.ok(/X1:.*không có nội dung/.test(msgs), msgs);
  assert.ok(/X1:.*trùng/.test(msgs));
  assert.ok(/X2:.*ZZ/.test(msgs) && /X2:.*khác số ý/.test(msgs));
  assert.ok(/X3:.*DangCau/.test(msgs));
  assert.strictEqual(bad.units.length, 0);
});
t('parse keys', () => {
  eq(Array.from(C.Bank_parseKey('NHIEU_DA', 'c, a').key.letters), ['A', 'C']);
  eq(Array.from(C.Bank_parseKey('DUNG_SAI', 'DSDD').key.tf), [true, false, true, true]);
  const sa = C.Bank_parseKey('TRA_LOI_NGAN', '3.14~0.01 | pi').key.answers;
  assert.strictEqual(sa[0].num, 3.14); assert.strictEqual(sa[0].tol, 0.01); assert.strictEqual(sa[1].norm, 'pi');
  assert.strictEqual(C.Bank_parseKey('GHEP_NOI', 'A-2,B-1', { nOpt: 3 }).ok, false);
});

// ---------- Matrix ----------
const mx = C.Mx_build('MT_DEMO', rows(S.matrixPhan), rows(S.matrixCells));
t('matrix counts', () => {
  eq(mx.issues.filter((x) => x.level === 'LOI'), []);
  assert.strictEqual(mx.totalQuestions, 12);
  assert.strictEqual(mx.totalPoints, 100);
  assert.strictEqual(mx.sections[1].cells[0].need, 2);
});
t('percent rounding', () => {
  const m2 = C.Mx_build('M', [{ MaMaTran: 'M', Phan: '1', DiemPhan: 100, TongSoCau: 10 }],
    [{ MaMaTran: 'M', Phan: '1', MucDo: 'NB', TiLe: 33.3 }, { MaMaTran: 'M', Phan: '1', MucDo: 'TH', TiLe: 33.3 }, { MaMaTran: 'M', Phan: '1', MucDo: 'VD', TiLe: 33.4 }]);
  assert.strictEqual(m2.sections[0].cells.reduce((a, c) => a + c.need, 0), 10);
});
t('feasibility', () => {
  const f = C.Mx_feasibility(mx, bank, 2, 'B_KHAC');
  assert.ok(f.every((r) => r.status !== 'THIEU'), JSON.stringify(f));
  assert.ok(f.some((r) => r.status === 'TRUNG')); // Phần II: 3 câu cho 2 mã đề × 2
  const f2 = C.Mx_feasibility(mx, bank, 20, 'B_KHAC');
  assert.ok(f2.some((r) => r.status === 'TRUNG'));
});

// ---------- Generate ----------
const examB = C.Gen_examFromRow(S.exam);
t('generate mode B', () => {
  const g = C.Gen_generate(examB, mx, bank, []);
  eq(g.errors, []);
  assert.strictEqual(g.variants.length, 2);
  g.variants.forEach((v) => {
    assert.strictEqual(v.items.length, 12);
    const pts = v.items.reduce((a, x) => a + x.Diem, 0);
    assert.ok(Math.abs(pts - 100) < 0.01, 'points ' + pts);
    const ids = v.items.map((x) => x.MaCH);
    assert.strictEqual(new Set(ids).size, 12);
    // cụm câu đi liền nhau
    ['G01', 'G02'].forEach((gname) => {
      const pos = v.items.map((x, i) => (x.MaNhom === gname ? i : -1)).filter((i) => i >= 0);
      if (pos.length) assert.strictEqual(pos[pos.length - 1] - pos[0], pos.length - 1);
    });
    // mỗi phần đúng dạng
    v.items.forEach((x) => {
      if (x.Phan === 'I') assert.ok(['MOT_DA', 'NHIEU_DA'].includes(x.DangCau));
      if (x.Phan === 'II') assert.strictEqual(x.DangCau, 'DUNG_SAI');
    });
    // level counts in section I
    const lv = {}; v.items.filter((x) => x.Phan === 'I').forEach((x) => (lv[x.MucDo] = (lv[x.MucDo] || 0) + 1));
    eq([lv.NB, lv.TH, lv.VD], [2, 4, 2]);
    // Q010 không bị trộn đáp án
    const q10 = v.items.find((x) => x.MaCH === 'Q010');
    if (q10) assert.strictEqual(q10.ThuTu, 'A,B,C,D,E');
  });
  const ov = g.stats.overlap[0];
  assert.ok(ov.shared <= 2, 'overlap ' + JSON.stringify(ov)); // chỉ Phần II buộc trùng 1 câu (+ có thể 0 ở chỗ khác)
  // tái lập
  const g2 = C.Gen_generate(examB, mx, bank, []);
  eq(JSON.stringify(g2.variants), JSON.stringify(g.variants));
});
t('generate mode A + locks + swap', () => {
  const examA = Object.assign({}, examB, { cheDo: 'A_TRON', soMaDe: 3, seed: 'X:1' });
  const g = C.Gen_generate(examA, mx, bank, []);
  eq(g.errors, []);
  const sets = g.variants.map((v) => v.items.map((x) => x.MaCH).sort().join());
  assert.ok(sets.every((s) => s === sets[0]));
  const orders = g.variants.map((v) => v.items.map((x) => x.MaCH).join());
  assert.ok(new Set(orders).size > 1, 'thứ tự phải khác nhau');
  // khoá 1 câu rồi sinh lại với hạt giống khác
  const all = [].concat(...g.variants.map((v) => v.items));
  const lockId = all.find((x) => x.Phan === 'I' && !x.MaNhom).MaCH;
  all.forEach((x) => { if (x.MaCH === lockId) x.Khoa = true; });
  const g3 = C.Gen_generate(Object.assign({}, examA, { seed: 'X:2' }), mx, bank, all);
  eq(g3.errors, []);
  g3.variants.forEach((v) => assert.ok(v.items.some((x) => x.MaCH === lockId && x.Khoa === true)));
  // swap
  const all3 = [].concat(...g3.variants.map((v) => v.items));
  const target = all3.find((x) => x.Phan === 'III');
  const sw = C.Gen_swap(Object.assign({}, examA, { seed: 'X:2' }), mx, bank, all3, target.MaDe, target.MaCH, 'salt');
  assert.ok(sw.items, sw.error);
  assert.strictEqual(sw.items.length, all3.length);
  const byV = C.U_groupBy(sw.items, (x) => x.MaDe);
  Object.values(byV).forEach((items) => {
    assert.ok(!items.some((x) => x.MaCH === target.MaCH), 'câu cũ phải biến mất ở mọi mã đề (chế độ A)');
    assert.strictEqual(items.length, 12);
  });
});
t('shortage error', () => {
  const big = C.Mx_build('M', [{ MaMaTran: 'M', Phan: 'I', DiemPhan: 100, TongSoCau: 30, DangCauChoPhep: 'MOT_DA' }], []);
  const g = C.Gen_generate(examB, big, bank, []);
  assert.ok(g.errors.length > 0);
});

// ---------- Grade ----------
t('grading rules', () => {
  const g = C.Gen_generate(Object.assign({}, examB, { seed: 'G:1' }), mx, bank, []);
  const v = g.variants[0];
  v.items.forEach((x, i) => (x.FormItemId = String(1000 + i)));
  const sections = mx.sections.map((s) => ({ phan: s.phan, ten: s.ten, diem: s.diem }));
  // tạo bài làm đúng hoàn toàn theo đáp án hiển thị
  const ans = {};
  v.items.forEach((x) => {
    const k = x.DapAnMaDe;
    if (x.DangCau === 'MOT_DA') ans[x.FormItemId] = k + '. something';
    if (x.DangCau === 'NHIEU_DA') ans[x.FormItemId] = k.split(',').map((L) => L + '. opt');
    if (x.DangCau === 'DUNG_SAI') ans[x.FormItemId] = k.split(',').map((b) => (b === 'Đ' ? C.GR_TRUE_LABEL : C.GR_FALSE_LABEL));
    if (x.DangCau === 'GHEP_NOI') ans[x.FormItemId] = k.split(',').map((p) => p.split('-')[1]);
    if (x.DangCau === 'TRA_LOI_NGAN') ans[x.FormItemId] = k.split('|')[0].trim().replace('.', ',');
  });
  const r = C.Grade_submission(v.items, ans, sections, {});
  assert.strictEqual(r.total, 100, JSON.stringify(r.perItem));
  assert.strictEqual(r.soDung, 12);
  // sai 1 ý Đúng/Sai -> mất cả câu
  const ds = v.items.find((x) => x.DangCau === 'DUNG_SAI');
  const a2 = Object.assign({}, ans);
  a2[ds.FormItemId] = a2[ds.FormItemId].slice(); a2[ds.FormItemId][0] = a2[ds.FormItemId][0] === C.GR_TRUE_LABEL ? C.GR_FALSE_LABEL : C.GR_TRUE_LABEL;
  const r2 = C.Grade_submission(v.items, a2, sections, {});
  assert.strictEqual(r2.total, 85);
  // bỏ trống 1 câu phần I -> -6.25
  const mc = v.items.find((x) => x.Phan === 'I');
  const a3 = Object.assign({}, ans); delete a3[mc.FormItemId];
  assert.strictEqual(C.Grade_submission(v.items, a3, sections, {}).total, 93.75);
  // phúc khảo: LOAI_CAU câu đó -> phần I còn 7 câu, mỗi câu 50/7 => vẫn 100 với bài a3
  const rv = C.Grade_reviewMap([{ MaKyThi: 'KT_DEMO', MaCH: mc.MaCH, HanhDong: 'LOAI_CAU' }], 'KT_DEMO');
  assert.strictEqual(C.Grade_submission(v.items, a3, sections, rv).total, 100);
  // TANG_DIEM
  const rv2 = C.Grade_reviewMap([{ MaKyThi: 'KT_DEMO', MaCH: mc.MaCH, HanhDong: 'TANG_DIEM' }], 'KT_DEMO');
  assert.strictEqual(C.Grade_submission(v.items, a3, sections, rv2).total, 100);
  // DOI_DAP_AN (ký hiệu gốc): đổi sang đáp án khác -> bài đúng cũ thành sai
  if (mc.DangCau === 'MOT_DA') {
    const other = ['A', 'B', 'C', 'D'].find((L) => L !== mc.DapAnGoc);
    const rv3 = C.Grade_reviewMap([{ MaKyThi: 'KT_DEMO', MaCH: mc.MaCH, HanhDong: 'DOI_DAP_AN', GiaTri: other }], 'KT_DEMO');
    assert.strictEqual(C.Grade_submission(v.items, ans, sections, rv3).total, 93.75);
    const rv4 = C.Grade_reviewMap([{ MaKyThi: 'KT_DEMO', MaCH: mc.MaCH, HanhDong: 'THEM_DAP_AN', GiaTri: other }], 'KT_DEMO');
    assert.strictEqual(C.Grade_submission(v.items, ans, sections, rv4).total, 100);
  }
});
t('short answer matching', () => {
  const key = C.Bank_parseKey('TRA_LOI_NGAN', '2.1 | 21/10').key;
  ['2,1', '2.1', ' 2.10 ', '21/10'].forEach((s) => assert.ok(C.Grade_match('TRA_LOI_NGAN', key, { text: s }), s));
  assert.ok(!C.Grade_match('TRA_LOI_NGAN', key, { text: '2.2' }));
  const k2 = C.Bank_parseKey('TRA_LOI_NGAN', 'Gradient Descent').key;
  assert.ok(C.Grade_match('TRA_LOI_NGAN', k2, { text: 'gradient  descent.' }));
  const k3 = C.Bank_parseKey('TRA_LOI_NGAN', '3.14~0.01').key;
  assert.ok(C.Grade_match('TRA_LOI_NGAN', k3, { text: '3,145' }));
  assert.ok(!C.Grade_match('TRA_LOI_NGAN', k3, { text: '3.2' }));
});
t('histogram & describe', () => {
  const h = C.Grade_histogram([0, 9.99, 10, 55, 100], 100);
  assert.strictEqual(h[0].n, 2); assert.strictEqual(h[1].n, 1); assert.strictEqual(h[9].n, 1);
  assert.strictEqual(C.Grade_describe([1, 2, 3, 4]).median, 2.5);
});
t('hạn nộp: tính giờ CHUNG + thí sinh được làm lại sau khi mở phòng', () => {
  assert.ok(C.PK_deadline, 'nạp được PK_deadline');
  const mo = 1000000, ex = { TinhGio: 'CHUNG', MoLuc: String(mo), ThoiGianPhut: '30' };
  assert.strictEqual(C.PK_deadline(ex, { BatDau: String(mo + 5000) }), mo + 30 * 60000, 'cả phòng tính từ lúc mở');
  const st = { GhiChu: 'RESET:' + (mo + 3600000), BatDau: String(mo + 3700000) };
  assert.strictEqual(C.PK_deadline(ex, st), mo + 3700000 + 30 * 60000, 'em làm lại tính từ lúc bắt đầu lượt mới');
  assert.strictEqual(C.PK_deadline(ex, { GhiChu: 'RESET:' + (mo - 10), BatDau: String(mo + 5) }), mo + 30 * 60000, 'làm lại trước khi mở: theo giờ mở');
  assert.strictEqual(C.PK_deadline({ TinhGio: 'RIENG', MoLuc: String(mo), ThoiGianPhut: '30' }, { BatDau: String(mo + 9000) }), mo + 9000 + 30 * 60000);
});
console.log('\nTất cả ' + n + ' nhóm test đều đạt.');
