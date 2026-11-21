// Kiểm thử bộ phân tích văn bản dán (17_Core_Parse.gs)
const assert = require('assert');
const { load } = require('./load');
const G = load(['17_Core_Parse.gs']);
const eq = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);
let n = 0;
function t(name, fn) { fn(); n++; console.log('  ✓ ' + name); }

t('nhiều câu, đáp án từng câu, lời giải, mức độ, bảng đáp án', () => {
  const r = G.PQ_parse(`Câu 1 (NB): Định thức của ma trận $\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$ là
A. -2
B. 2
C. 10
D. -10
Đáp án: A
Lời giải: det = 1·4 − 2·3 = −2.
Câu 2: Đạo hàm của $x^2$ là: A. $x$   B. $2x$   C. $x^2$   D. $2$
Câu 3 (Thông hiểu). Xét tính đúng sai của các mệnh đề sau:
a) Ma trận đơn vị khả nghịch
b) Mọi ma trận vuông đều khả nghịch
c) det(AB)=det(A)det(B)
d) rank(A) ≤ min(m,n)
Đáp án: a) Đ b) S c) Đ d) Đ
Câu 4: Tính $\\int_0^1 2x\\,dx$.
Đáp án: 1
Câu 5: Which of the following are supervised learning algorithms?
A. Linear regression
B. K-means
C. Decision tree
D. PCA
Answer: A, C
BẢNG ĐÁP ÁN
2.B   9.C`);
  eq(r.length, 5);
  eq([r[0].dang, r[0].mucDo, r[0].correct, r[0].options.length], ['MOT_DA', 'NB', [0], 4]);
  eq(r[0].loiGiai, 'det = 1·4 − 2·3 = −2.');
  eq([r[1].stem, r[1].options, r[1].correct], ['Đạo hàm của $x^2$ là:', ['$x$', '$2x$', '$x^2$', '$2$'], [1]]);
  eq([r[2].dang, r[2].mucDo, r[2].tf], ['DUNG_SAI', 'TH', [true, false, true, true]]);
  eq([r[3].dang, r[3].answerText], ['TRA_LOI_NGAN', '1']);
  eq([r[4].dang, r[4].correct, r[4].lang], ['NHIEU_DA', [0, 2], 'en']);
});

t('đánh dấu * và dòng "Chọn B", đáp án nằm cùng giải thích', () => {
  const a = G.PQ_parse(`Thủ đô của Việt Nam là gì?\nA. TP.HCM\n*B. Hà Nội\nC. Đà Nẵng\nD. Huế`)[0];
  eq([a.correct, a.options[1]], [[1], 'Hà Nội']);
  const b = G.PQ_parse(`Python là ngôn ngữ\nA) biên dịch\nB) thông dịch\nC) máy\nD) assembly\nChọn B. Vì Python chạy qua trình thông dịch.`)[0];
  eq([b.correct, b.loiGiai], [[1], 'Vì Python chạy qua trình thông dịch.']);
  const c = G.PQ_parse(`Kết quả của 2+2?\nA. 3\nB. 4 (đúng)\nC. 5\nD. 6`)[0];
  eq([c.correct, c.options[1]], [[1], '4']);
  const d = G.PQ_parse(`Hàm kích hoạt nào phi tuyến?\nA. ReLU\nB. Sigmoid\nC. Đồng nhất\nD. Tanh\nĐáp án đúng là A, B và D`)[0];
  eq([d.dang, d.correct], ['NHIEU_DA', [0, 1, 3]]);
});

t('không nhầm "Đáp án nào…?" / "Giải phương trình" trong nội dung', () => {
  const a = G.PQ_parse(`Cho hàm số f(x) = x^2.\nĐáp án nào sau đây đúng?\nA. f đồng biến\nB. f có cực tiểu\nC. f lẻ\nD. f tuần hoàn\nĐáp án: B`)[0];
  eq([a.stem, a.correct], ['Cho hàm số f(x) = x^2.\nĐáp án nào sau đây đúng?', [1]]);
  const b = G.PQ_parse(`Xét bài toán sau.\nGiải phương trình x^2 = 4, nghiệm dương là\nĐáp số: 2`)[0];
  eq([b.dang, b.answerText], ['TRA_LOI_NGAN', '2']);
  eq(b.stem, 'Xét bài toán sau.\nGiải phương trình x^2 = 4, nghiệm dương là');
});

t('đánh số 1. 2. 3. liên tiếp + bảng đáp án không tiêu đề', () => {
  const r = G.PQ_parse(`1. Kỳ vọng của biến Bernoulli(p) là
A. p   B. 1-p   C. p(1-p)   D. 1
2. Phương sai của Bernoulli(p) là
A. p   B. 1-p   C. p(1-p)   D. p^2
3. Trung vị của dãy 1, 3, 5 là
A. 1   B. 3   C. 5   D. 9
1.A 2.C 3.B`);
  eq(r.length, 3);
  eq(r.map((q) => q.correct[0]), [0, 2, 1]);
  eq(r[2].stem, 'Trung vị của dãy 1, 3, 5 là');
});

t('lựa chọn xuống dòng sau nhãn, lựa chọn nhiều dòng', () => {
  const q = G.PQ_parse(`Đoạn mã sau in ra gì?\nfor i in range(3):\n    print(i)\nA.\n0 1 2\nB.\n1 2 3\nC. 0 1 2 3\nD. Lỗi\nĐáp án: A`)[0];
  eq(q.options, ['0 1 2', '1 2 3', '0 1 2 3', 'Lỗi']);
  eq(q.stem, 'Đoạn mã sau in ra gì?\nfor i in range(3):\n    print(i)');
});

t('Đúng/Sai: (Đ)/(S) cuối mỗi ý, và chuỗi "ĐSĐS"', () => {
  const a = G.PQ_parse(`Các mệnh đề sau đúng hay sai?\na) 2 là số nguyên tố (Đ)\nb) 1 là số nguyên tố (S)\nc) 9 là số chính phương (Đ)\nd) 0 là số dương (S)`)[0];
  eq([a.dang, a.tf, a.options[0]], ['DUNG_SAI', [true, false, true, false], '2 là số nguyên tố']);
  const b = G.PQ_parse(`Xét các mệnh đề:\na) A\nb) B\nc) C\nd) D\nĐáp án: Đúng, Sai, Sai, Đúng`)[0];
  eq(b.tf, [true, false, false, true]);
});

t('ký hiệu nhấn mạnh khi dán HTML (in đậm đáp án đúng)', () => {
  const M = '';
  const q = G.PQ_parse(`Thuật toán nào là học không giám sát?\nA. SVM\nB. ${M}K-means\nC. Hồi quy logistic\nD. Cây quyết định`)[0];
  eq([q.correct, q.options[1]], [[1], 'K-means']);
  assert(q.warnings.some((w) => /in đậm/.test(w)));
  const all = G.PQ_parse(`${M}Câu hỏi in đậm?\n${M}A. 1\n${M}B. 2\n${M}C. 3\nĐáp án: C`)[0];
  eq(all.correct, [2]);
});

t('PQ_toRecord, PQ_similarity, PQ_lang', () => {
  const q = G.PQ_parse(`Câu 1 (VD): 1+1=?\nA. 1\nB. 2\nC. 3\nD. 4\nĐáp án: B`)[0];
  const r = G.PQ_toRecord(q);
  eq([r.DangCau, r.MucDo, r.NoiDung_VI, r.A, r.D, r.DapAn], ['MOT_DA', 'VD', '1+1=?', '1', '4', 'B']);
  const s1 = G.PQ_shingles('Định thức của ma trận đơn vị cấp 3 bằng bao nhiêu?');
  const s2 = G.PQ_shingles('Định thức của ma trận đơn vị cấp 3 bằng bao nhiêu ?');
  const s3 = G.PQ_shingles('Phương sai của phân phối chuẩn tắc là');
  assert(G.PQ_similarity(s1, s2) > 0.95 && G.PQ_similarity(s1, s3) < 0.1);
  eq([G.PQ_lang('What is the derivative of x squared?'), G.PQ_lang('Đạo hàm của x bình phương là gì?')], ['en', 'vi']);
});

t('PQ_clientSource chạy độc lập trong trình duyệt', () => {
  const vm = require('vm');
  const ctx = vm.createContext({});
  vm.runInContext(G.PQ_clientSource(), ctx);
  const r = ctx.PQ_parse('Câu 1: 2+3=?\nA. 4\nB. 5\nĐáp án: B');
  eq(r[0].correct, [1]);
});
console.log(`Parser: ${n} nhóm kiểm thử đều đạt.`);
t('nhãn "Câu N" in đậm khi dán HTML', () => {
  const M = '';
  const r = G.PQ_parse(`${M}Câu 1:${M} 1+1?\nA. 1\nB. ${M}2\nC. 3\nD. 4\n${M}Câu 2.${M} 2+2?\nA. 4\nB. 3\nC. 2\nD. 1\nĐáp án: A`);
  eq(r.length, 2); eq([r[0].stem, r[0].correct, r[1].correct], ['1+1?', [1], [0]]);
});
console.log('Nhóm bổ sung đạt.');
t('tối đa 10 lựa chọn A–J, "A hoặc C" không bị đọc nhầm chữ H', () => {
  const q = G.PQ_parse(`Câu 1: Hàm nào tuần hoàn?\nA. sin x\nB. x^2\nC. cos 2x\nD. e^x\nE. tan x\nF. arcsin(sin x)\nG. ln x\nH. |x|\nI. sin x + cos x\nJ. x sin x\nĐáp án: A, C, E, F, I`)[0];
  eq([q.options.length, q.dang, q.correct], [10, 'NHIEU_DA', [0, 2, 4, 5, 8]]);
  eq(G.PQ_toRecord(q).J, 'x sin x');
  eq(G.PQ_parseLetters('A hoặc C'), ['A', 'C']);
  const inl = G.PQ_parse('Chọn số nguyên tố: A. 2  B. 4  C. 5  D. 6  E. 7  F. 9  G. 11\nĐáp án: A, C, E, G')[0];
  eq([inl.options.length, inl.correct], [7, [0, 2, 4, 6]]);
});
console.log('Nhóm 10 lựa chọn đạt.');

// ---- khối code (v1.3) ----
(function () {
  const assert = require('assert');
  const { load } = require('./load');
  const G = load(['17_Core_Parse.gs']);
  const txt = 'Câu 1 (NB): Giá trị grade?\n```python\nscore = 85\nif score >= 90:\n    grade = "A"\n\nA. giữ nguyên dòng giống lựa chọn\nĐáp án: Z\n```\nA. A\nB. B\nC. C\nD. D\nĐáp án: B\n\nCâu 2 (TH): Không có code\nA. 1\nB. 2\nĐáp án: A';
  const r = G.PQ_parse(txt);
  assert.strictEqual(r.length, 2);
  assert.strictEqual(JSON.stringify(r[0].options), '["A","B","C","D"]');
  assert.strictEqual(JSON.stringify(r[0].correct), '[1]');
  assert.ok(r[0].stem.includes('    grade = "A"') && r[0].stem.includes('A. giữ nguyên dòng giống lựa chọn') && r[0].stem.includes('Đáp án: Z'));
  assert.ok(/^```python\n/m.test(r[0].stem) && /\n```$/.test(r[0].stem));
  assert.strictEqual(r[1].stem, 'Không có code');
  const open = G.PQ_parse('Câu 1: x\n```\nabc\nA. 1\nB. 2\nĐáp án: A');
  assert.ok(open.length >= 1); // thiếu dòng đóng ``` → coi như chữ thường, không lỗi
  console.log('Khối code đạt.');
})();

// ---- rich() phía trình duyệt chịu CRLF / dấu cách thừa (v1.3.1) ----
(function () {
  const fs = require('fs'), path = require('path');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  ['Index.html', 'NhapCau.html'].forEach((f) => {
    const line = fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8').split('\n').find((l) => l.startsWith('const rich'));
    const rich = new Function('esc', line.replace('const rich = ', 'return ') + ';')(esc);
    const F = '```', base = 'Cho code:\n\n' + F + 'python\nx = 1\n' + F;
    [base, base.replace(/\n/g, '\r\n'), base.replace(F + 'python', F + 'python '), base + ' ', base.replace('x = 1\n' + F, 'x = 1\n ' + F)].forEach((v, i) => {
      const h = rich(v);
      assert.ok(h.indexOf('<pre class="code" data-lang="python"><code>x = 1</code></pre>') >= 0, f + ' biến thể ' + i + ': ' + h);
      assert.ok(h.indexOf('```') < 0, f + ' còn dấu ``` ở biến thể ' + i);
    });
  });
  console.log('rich() chịu CRLF/dấu cách đạt.');
})();
