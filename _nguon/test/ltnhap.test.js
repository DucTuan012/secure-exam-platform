// NHẬP NHANH BÀI LẬP TRÌNH: văn bản kiểu AI trả về (nhiều bài, dấu ```, tiêu đề có / không dấu), JSON, xuất → nhập lại giữ nguyên,
// trùng mã (đổi mã / ghi đè / bỏ qua), test từ ZIP & file lẻ (Themis, .in/.out, input/output, Codeforces), sinh test bằng code + điền output, kiểm thử.
const assert = require('assert'), fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const { load } = require('./load');
const { makeEnv } = require('./mocks');
const fj = require('./fakejudge');
const env = makeEnv(); fj.install(env.UrlFetchApp);
const G = load(fs.readdirSync(path.join(__dirname, '..', 'src')).filter((f) => f.endsWith('.gs')).sort(), env);
env._newHub();
const call = (name, ...args) => { const r = JSON.parse(G.API_call(name, args)); if (!r.ok) throw new Error(name + ': ' + r.error); return r.data; };
const callErr = (name, ...args) => { const r = JSON.parse(G.API_call(name, args)); return r.ok ? null : r.error; };
const step = (t) => console.log('▶', t);
call('setup');
const PI = (t) => JSON.parse(JSON.stringify(G.LT_parseImport(t)));     // mảng từ vm → mảng thường

// ---------------------------------------------------------------- 1. văn bản kiểu AI
const AI = `Dưới đây là bài đã soạn theo đúng mẫu:

### BÀI: LT_TAM_GIAC | Tam giác vuông | Trung bình | Hình học, Số học
### ĐỀ BÀI
Cho ba số nguyên dương $a, b, c$. Kiểm tra ba số có phải độ dài ba cạnh của **tam giác vuông** không.

### INPUT
Một dòng gồm ba số nguyên $a, b, c$.
### OUTPUT
In \`YES\` nếu là tam giác vuông, ngược lại in \`NO\`.
### RÀNG BUỘC
$1 \\le a, b, c \\le 10^9$
### NGÔN NGỮ: Python, C
### GIỚI HẠN: 1 giây, 128 MB
### SO SÁNH: theo từ, không phân biệt hoa thường
### THƯ VIỆN PYTHON: chỉ math, sys
### THƯ VIỆN C: stdio.h
### KHÔNG ĐƯỢC DÙNG: sorted
### LỜI GIẢI: Python
\`\`\`python
### dòng chú thích bắt đầu bằng ### trong code không được hiểu là mục mới
a, b, c = map(int, input().split())
x = [a, b, c]
x.sort()
print("YES" if x[0] * x[0] + x[1] * x[1] == x[2] * x[2] else "NO")
\`\`\`
### CODE KHỞI TẠO C
\`\`\`c
#include <stdio.h>

int main(void) {
    long long a, b, c;
    scanf("%lld %lld %lld", &a, &b, &c);
    return 0;
}
\`\`\`
### TEST MẪU | 3 4 5 là bộ ba Pythagore
3 4 5
===
YES
### TEST MẪU
\`\`\`
1 1 1
===
NO
\`\`\`
### TEST | 2
5 12 13
===
YES
### TEST
1000000000 1000000000 1000000000
### Test ẩn | 1
6 8 10

## BÀI: LT_DEM_CHU | Đếm chữ | De
## De bai
Đếm số chữ cái trong xâu.
## Input
Một dòng.
## Output
Một số.
## Test mau
abc d
=== OUTPUT ===
4
## TEST
xin chao
`;
step('Đọc văn bản kiểu AI: 2 bài, ``` trong mục, tiêu đề không dấu / ##, test mẫu / ẩn / trọng số / thiếu output');
let pv = call('ltImpPreview', AI);
assert.deepStrictEqual(pv.errors, []);
assert.strictEqual(pv.items.length, 2, JSON.stringify(pv.items.map((x) => x.ma)));
let a = pv.items[0];
assert.strictEqual(a.ma, 'LT_TAM_GIAC'); assert.strictEqual(a.tieuDe, 'Tam giác vuông'); assert.strictEqual(a.doKho, 'TB');
assert.deepStrictEqual([a.nMau, a.nAn, a.noOut, a.sol, a.nnLoiGiai, a.tl, a.ml, a.cmp], [2, 3, 2, true, 'py', 1, 128, 'NOCASE']);
assert.deepStrictEqual(a.tv, { py: 'math, sys', c: 'stdio.h', cam: 'sorted' });
assert.deepStrictEqual(a.errs, []);
assert.strictEqual(pv.items[1].ma, 'LT_DEM_CHU'); assert.strictEqual(pv.items[1].doKho, 'DE');
assert.ok(pv.items[1].warns.some((w) => /chưa có lời giải/.test(w)), 'cảnh báo không có lời giải');
const parsed = PI(AI).items[0].p;
assert.ok(/^### dòng chú thích/.test(parsed.loiGiai) && /x\.sort\(\)/.test(parsed.loiGiai), 'code giữ nguyên, ### trong code không tách mục');
assert.ok(/^#include <stdio.h>/.test(parsed.mau.c) && !/```/.test(parsed.mau.c));
assert.deepStrictEqual(parsed.tests.map((t) => [t.in, t.out, t.mau, t.diem, t.gt]), [
  ['3 4 5\n', 'YES\n', true, 0, '3 4 5 là bộ ba Pythagore'], ['1 1 1\n', 'NO\n', true, 0, ''], ['5 12 13\n', 'YES\n', false, 2, ''],
  ['1000000000 1000000000 1000000000\n', '', false, 1, ''], ['6 8 10\n', '', false, 1, '']]);
assert.ok(/\*\*tam giác vuông\*\*/.test(parsed.noiDung) && /\$1 \\le/.test(parsed.rangBuoc));
assert.deepStrictEqual(PI(AI).items[1].p.tests.map((t) => [t.in, t.out]), [['abc d\n', '4\n'], ['xin chao\n', '']]);
// lời giải mẫu vi phạm quy định thư viện của chính bài → cảnh báo
const bad = AI.replace('x.sort()', 'x = sorted(x)');
assert.ok(call('ltImpPreview', bad).items[0].warns.some((w) => /vi phạm quy định thư viện/.test(w) && /sorted/.test(w)));

step('AI bọc cả câu trả lời trong ```markdown, có lời chào sau "### HẾT"');
const wrapped = '```markdown\n' + AI.split('\n## BÀI')[0].replace('Dưới đây là bài đã soạn theo đúng mẫu:\n\n', '') + '### HẾT\n```\nChúc thầy cô dạy tốt! Cần thêm test thì cứ nói nhé.\n';
const wp = PI(wrapped);
assert.strictEqual(wp.items.length, 1); assert.strictEqual(wp.items[0].p.tests.length, 5);
assert.strictEqual(wp.items[0].p.tests[4].in, '6 8 10\n', 'chữ thừa sau ### HẾT không lọt vào test cuối');
step('Gemini: "input↵===" bị hiển thị thành tiêu đề → sao chép ra "# input" (mất ===)');
const gem = PI(fs.readFileSync(path.join(__dirname, 'fixture_gemini.txt'), 'utf8')).items[0].p;
assert.deepStrictEqual(gem.tests.map((t) => [t.in, t.out, t.mau, t.diem]), [['36 100\n', '22 14\n', true, 0], ['10 25\n', '-1\n', true, 1], ['1000000000 3000000000\n', '500000000 500000000\n', false, 9], ['999999999 2000000000\n', '999999998 1\n', false, 11]]);
step('Lỗi chặn nhập: thiếu tên / đề; mã tự sinh từ tên; văn bản rác');
pv = call('ltImpPreview', '### TÊN: Bài không đề\n### TEST\n1\n');
assert.ok(pv.items[0].errs.some((e) => /thiếu đề bài/.test(e)));
pv = call('ltImpPreview', '### TÊN: Số chính phương\n### ĐỀ BÀI\nKiểm tra $n$ có là số chính phương.\n');
assert.strictEqual(pv.items[0].ma, 'LT_SO_CHINH_PHUONG');
assert.ok(call('ltImpPreview', 'xin chào, không có gì').errors.length);

step('Nhập vào ngân hàng: 2 bài, bài có lời giải → điền output trống + kiểm thử đạt');
let im = call('ltImport', AI, {});
assert.deepStrictEqual(im.saved.map((x) => [x.ma, x.nTest, x.noOut, x.sol]), [['LT_TAM_GIAC', 5, 2, true], ['LT_DEM_CHU', 2, 1, false]]);
let g = call('ltGet', 'LT_TAM_GIAC');
assert.deepStrictEqual([g.tvPy, g.tvC, g.cam, g.cmp, g.tl, g.ml, g.nn.join(',')], ['math, sys', 'stdio.h', 'sorted', 'NOCASE', 1, 128, 'py,c']);
let v = call('ltValidate', 'LT_TAM_GIAC', 'EMPTY');
assert.ok(v.ok && v.filled === 2, JSON.stringify(v.summary));
g = call('ltGet', 'LT_TAM_GIAC');
assert.deepStrictEqual(g.tests.map((t) => t.out), ['YES\n', 'NO\n', 'YES\n', 'NO\n', 'YES\n']);
assert.ok(/^ĐẠT/.test(call('ltList').find((x) => x.ma === 'LT_TAM_GIAC').kiemThu));

step('Trùng mã: đổi mã (mặc định) · ghi đè · bỏ qua');
im = call('ltImport', AI, {});
assert.deepStrictEqual(im.saved.map((x) => x.ma), ['LT_TAM_GIAC_2', 'LT_DEM_CHU_2']);
im = call('ltImport', AI.replace('Tam giác vuông', 'Tam giác vuông (sửa)'), { dup: 'GHI_DE' });
assert.ok(im.saved[0].ghiDe && call('ltGet', 'LT_TAM_GIAC').tieuDe === 'Tam giác vuông (sửa)');
assert.strictEqual(call('ltGet', 'LT_TAM_GIAC').kiemThu, 'CẦN KIỂM THỬ LẠI', 'ghi đè → cần kiểm thử lại');
im = call('ltImport', AI, { dup: 'BO_QUA' });
assert.strictEqual(im.saved.length, 0); assert.strictEqual(im.skipped.length, 2);

step('JSON (1 bài / mảng / {bai:[…]}) với tên trường tiếng Anh');
im = call('ltImport', JSON.stringify({ bai: [{ code: 'LT_JSON', title: 'Bình phương', statement: 'In $n^2$.', input: 'n', output: 'n^2', languages: ['python'],
  solution: 'n = int(input())\nprint(n * n)', difficulty: 'easy', tests: [{ input: '3', output: '9', sample: true }, { input: '12' }, { input: '-4', weight: 3 }] }] }), {});
g = call('ltGet', 'LT_JSON');
assert.deepStrictEqual([g.tieuDe, g.doKho, g.nn.join(','), g.tests.length, g.tests[0].mau, g.tests[0].diem, g.tests[2].diem, g.tests[1].out], ['Bình phương', 'DE', 'py', 3, true, 0, 3, '']);
assert.ok(call('ltValidate', 'LT_JSON', 'EMPTY').ok);
assert.ok(/JSON không hợp lệ/.test(callErr('ltImport', '{ sai json', {})));

step('Xuất → nhập lại: giữ nguyên mọi trường (cả test có dòng "===", code có ```)');
call('ltSample');
const tricky = call('ltGet', 'LT_DAO_CHUOI');
tricky.tests.push({ in: '===\n### a\n', out: '### a ===\n', mau: false, diem: 2, gt: '' });
tricky.loiGiai = '# ``` trong chuỗi\n' + tricky.loiGiai; tricky.testsChanged = true; call('ltSave', tricky);
const ex = call('ltExport', ['LT_TONG', 'LT_NGUYEN_TO', 'LT_DAO_CHUOI', 'LT_TAM_GIAC']);
assert.strictEqual(ex.n, 4);
const back = PI(ex.text);
assert.deepStrictEqual(back.errors, []); assert.strictEqual(back.items.length, 4);
const strip = (p) => { const o = JSON.parse(JSON.stringify(p)); ['kiemThuLuc', 'kiemThu', 'capNhat', 'isNew', 'testsChanged'].forEach((k) => delete o[k]); o.tests.forEach((t) => { t.in = t.in.replace(/\n+$/, '\n'); t.out = t.out.replace(/\n+$/, '\n'); }); return o; };
back.items.forEach((x) => {
  const orig = strip(call('ltGet', x.p.ma));
  assert.deepStrictEqual(x.errs, [], x.p.ma + ' ' + x.errs);
  assert.strictEqual(x.p.doKho, String(orig.doKho).toUpperCase(), x.p.ma + '.doKho');
  for (const k of ['ma', 'tieuDe', 'chuDe', 'nn', 'tl', 'ml', 'cmp', 'cham', 'nnLoiGiai', 'tvPy', 'tvC', 'cam']) assert.deepStrictEqual(x.p[k], orig[k], x.p.ma + '.' + k);
  for (const k of ['noiDung', 'vao', 'ra', 'rangBuoc', 'loiGiai']) assert.strictEqual(x.p[k].replace(/\n+$/, ''), orig[k].replace(/\n+$/, ''), x.p.ma + '.' + k);
  assert.strictEqual(x.p.mau.c.replace(/\n+$/, ''), orig.mau.c.replace(/\n+$/, ''), x.p.ma + '.mau.c');
  assert.deepStrictEqual(x.p.tests.map((t) => [t.in, t.out, t.mau, t.diem, t.gt]), orig.tests.map((t) => [t.in, t.out, t.mau, t.diem, t.gt]), x.p.ma + '.tests');
});
assert.ok(/### TEST \| 2\n```text\n===\n### a\n```/.test(ex.text), 'test có dòng đặc biệt được bọc ```');

step('Test từ file lẻ: .in/.out · .inp/.out · input01.txt/output01.txt · Codeforces 01/01.a · sắp tự nhiên');
let tf = call('ltTestFiles', [{ name: '10.in', text: 'x10' }, { name: '2.in', text: 'x2\r\n' }, { name: '2.out', text: 'y2' }, { name: '10.out', text: 'y10\n' }, { name: 'ghichu.txt', text: '?' }]);
assert.deepStrictEqual(tf.tests.map((t) => [t.name, t.in, t.out]), [['2', 'x2\n', 'y2\n'], ['10', 'x10\n', 'y10\n']]);
assert.deepStrictEqual(tf.unpaired, ['ghichu.txt']);
tf = call('ltTestFiles', [{ name: 'input/input01.txt', text: 'a' }, { name: 'output/output01.txt', text: 'b' }, { name: 'input/input02.txt', text: 'c' }]);
assert.deepStrictEqual(tf.tests.map((t) => [t.in, t.out]), [['a\n', 'b\n'], ['c\n', '']]);
tf = call('ltTestFiles', [{ name: 'tests/01', text: '5' }, { name: 'tests/01.a', text: '25' }, { name: 'tests/02', text: '6' }, { name: 'tests/02.a', text: '36' }]);
assert.deepStrictEqual(tf.tests.map((t) => [t.in, t.out]), [['5\n', '25\n'], ['6\n', '36\n']]);

step('Test từ ZIP: kiểu Themis (Test01/BAI.INP + BAI.OUT), có thư mục rác macOS');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ltzip-'));
const zipPath = path.join(dir, 't.zip');
execFileSync('python3', ['-I', '-c', `
import zipfile, sys
z = zipfile.ZipFile(sys.argv[1], 'w', zipfile.ZIP_DEFLATED)
for i in (1, 2, 10):
    z.writestr('BAI/Test%02d/BAI.INP' % i, '%d %d\\n' % (i, i + 1))
    z.writestr('BAI/Test%02d/BAI.OUT' % i, '%d\\n' % (2 * i + 1))
z.writestr('__MACOSX/BAI/._Test01', 'rac')
z.writestr('BAI/Test03/BAI.INP', '7 8\\n')
z.close()`, zipPath]);
tf = call('ltTestFiles', [{ name: 't.zip', b64: fs.readFileSync(zipPath).toString('base64') }]);
assert.deepStrictEqual(tf.tests.map((t) => [t.name, t.in, t.out]), [['BAI/Test01/BAI', '1 2\n', '3\n'], ['BAI/Test02/BAI', '2 3\n', '5\n'], ['BAI/Test03/BAI', '7 8\n', ''], ['BAI/Test10/BAI', '10 11\n', '21\n']]);
assert.ok(/Không mở được file ZIP/.test(callErr('ltTestFiles', [{ name: 'hong.zip', b64: Buffer.from('khong phai zip').toString('base64') }])));

step('Sinh test bằng code (Python & C) → điền output bằng lời giải → kiểm thử đạt');
const gen = 'import random\nt = int(input())\nrandom.seed(t)\nn = random.randint(1, 5 * t)\nprint(n)\nprint(*[random.randint(-100, 100) for _ in range(n)])\n';
const gt = call('ltGenTests', 'py', gen, 8);
assert.strictEqual(gt.tests.length, 8); assert.deepStrictEqual(gt.errs, []);
assert.ok(gt.tests.every((t, i) => t.in.split('\n')[1].trim().split(/\s+/).length === Number(t.in.split('\n')[0])), 'input hợp lệ');
assert.notStrictEqual(gt.tests[0].in, gt.tests[1].in, 'mỗi test khác nhau (seed = số thứ tự)');
assert.deepStrictEqual(call('ltGenTests', 'py', gen, 3).tests.map((t) => t.in), gt.tests.slice(0, 3).map((t) => t.in), 'sinh lại cho cùng kết quả');
const genC = '#include <stdio.h>\nint main(void){ int t; scanf("%d", &t); printf("%d %d\\n", t, t * 7); return 0; }\n';
assert.deepStrictEqual(call('ltGenTests', 'c', genC, 3).tests.map((t) => t.in), ['1 7\n', '2 14\n', '3 21\n']);
const ge = call('ltGenTests', 'py', 'import sys\nt = int(input())\nif t == 2: sys.exit(3)\nprint(t)\n', 3);
assert.deepStrictEqual([ge.tests.length, ge.errs.map((e) => e.t)], [2, [2]], 'test lỗi được báo riêng');
assert.ok(call('ltGenTests', 'c', 'int main( {', 2).ce, 'lỗi biên dịch');
const lm = call('ltGet', 'LT_TONG');
lm.tests = lm.tests.filter((t) => t.mau).concat(call('ltGenTests', 'py', 'import random\nt=int(input())\nrandom.seed(t)\nprint(random.randint(-10**18,10**18), random.randint(-10**18,10**18))\n', 6).tests);
lm.testsChanged = true; call('ltSave', lm);
v = call('ltValidate', 'LT_TONG', 'EMPTY');
assert.ok(v.ok && v.filled === 6, v.summary);
assert.ok(call('ltGet', 'LT_TONG').tests.every((t) => t.out.trim()), 'mọi test có output');

step('Output lời giải quá 1 ô Sheets: bỏ qua đúng test đó, vẫn điền các test khác');
call('ltImport', '### BÀI: LT_DAI | Dài | Dễ\n### ĐỀ BÀI\nIn n dòng.\n### LỜI GIẢI: Python\nn = int(input())\nprint("x" * n)\n### TEST MẪU\n3\n### TEST\n5\n### TEST\n60000\n### HẾT', {});
const vd = call('ltValidate', 'LT_DAI', 'EMPTY');
assert.strictEqual(vd.filled, 2); assert.strictEqual(vd.results[2].v, 'QUA_DAI'); assert.ok(/Test 3: output/.test(vd.warnings[0]), vd.warnings[0]);
assert.deepStrictEqual(call('ltGet', 'LT_DAI').tests.map((t) => t.out.length), [4, 6, 0]);
console.log('✅ Nhập nhanh bài lập trình: văn bản AI, JSON, xuất ↔ nhập, trùng mã, test từ ZIP / file, sinh test bằng code đều đạt.');
