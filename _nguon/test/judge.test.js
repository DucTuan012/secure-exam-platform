// Kiểm thử MÁY CHẤM: chạy thật Python / C qua máy chấm giả lập (định dạng Wandbox, Judge0, Piston)
const assert = require('assert');
const { load } = require('./load');
const { makeEnv } = require('./mocks');
const fj = require('./fakejudge');
const env = makeEnv(); fj.install(env.UrlFetchApp);
const J = load(['00_Config.gs', '10_Core_Utils.gs', '26_Judge.gs'], env);
let n = 0; const t = (name, fn) => { fn(); n++; console.log('  ✓', name); };

const SUM_PY = 'a, b = map(int, input().split())\nprint(a + b)\n';
const SUM_C = '#include <stdio.h>\nint main(){long a,b;scanf("%ld %ld",&a,&b);printf("%ld\\n",a+b);return 0;}\n';
const tests = [{ in: '1 2\n', out: '3\n' }, { in: '10 -4\n', out: '6' }, { in: '5 5', out: '11\n' }];

for (const p of ['wandbox', 'judge0', 'piston']) {
  const cfg = { p, url: p === 'wandbox' ? '' : p === 'judge0' ? 'https://j0.example' : 'https://piston.example' };
  t(p + ': Python AC/WA + thời gian', () => {
    const r = J.JD_run(cfg, 'py', SUM_PY, tests, { tl: 2, ml: 256 });
    assert.deepStrictEqual(r.results.map((x) => x.v), ['AC', 'AC', 'WA'], JSON.stringify(r.results));
    if (p !== 'judge0') assert.ok(r.results[0].time != null && r.results[0].mem > 0, 'đo được thời gian/bộ nhớ');
  });
  t(p + ': C AC/WA', () => {
    const r = J.JD_run(cfg, 'c', SUM_C, tests, { tl: 2, ml: 256 });
    assert.deepStrictEqual(r.results.map((x) => x.v), ['AC', 'AC', 'WA'], JSON.stringify(r.results.map((x) => x.err)));
  });
  t(p + ': lỗi biên dịch C', () => {
    const r = J.JD_run(cfg, 'c', 'int main(){ return x; }', tests.slice(0, 1), {});
    assert.strictEqual(r.results[0].v, 'CE'); assert.ok(/error/.test(r.ce), r.ce);
  });
}
t('Python: lỗi cú pháp = lỗi biên dịch, số dòng đúng', () => {
  const r = J.JD_run({}, 'py', 'x = 1\nif x\n  print(x)\n', [{ in: '', out: '1' }], {});
  assert.strictEqual(r.results[0].v, 'CE'); assert.ok(/line 2/.test(r.ce), r.ce);
});
t('Python: lỗi khi chạy (RE) báo đúng dòng', () => {
  const r = J.JD_run({}, 'py', 'a = [1]\nprint(a[5])\n', [{ in: '', out: '1' }], {});
  assert.strictEqual(r.results[0].v, 'RE'); assert.ok(/line 2/.test(r.results[0].err) && /IndexError/.test(r.results[0].err), r.results[0].err);
  assert.ok(!/@@PT/.test(r.results[0].err));
});
t('Python: vòng lặp vô hạn → TLE', () => {
  const r = J.JD_run({}, 'py', 'while True: pass\n', [{ in: '', out: '' }], { tl: 1 });
  assert.strictEqual(r.results[0].v, 'TLE', JSON.stringify(r.results[0]));
});
t('C: lỗi biên dịch chỉ đúng dòng + trích đúng dòng code của thí sinh; #define của thí sinh không phá đoạn đo', () => {
  const r = J.JD_run({}, 'c', '#include <stdio.h>\nint main(){ int x = 1\n  return x; }\n', [{ in: '', out: '' }], {});
  assert.strictEqual(r.results[0].v, 'CE'); assert.ok(/main\.c:3:3:/.test(r.ce) && /3 \|   return x;/.test(r.ce) && !/stdlib|__pt_/.test(r.ce), r.ce);
  const ok = J.JD_run({}, 'c', '#include <stdio.h>\n#define m 1000000007\n#define c 3\n#define u 7\nint main(){ printf("%d\\n", (int)(m % 1000) + c + u); return 0; }', [{ in: '', out: '17' }], {});
  assert.strictEqual(ok.results[0].v, 'AC', JSON.stringify(ok.results[0]));
  assert.ok(ok.results[0].time != null && ok.results[0].mem > 0, 'vẫn đo được thời gian / bộ nhớ');
});
t('Wandbox quá tải ("OCI runtime error: crun: clone") → gửi từng đợt nhỏ + tự chạy lại, không báo "Lỗi khi chạy"', () => {
  const tests = Array.from({ length: 12 }, (_, i) => ({ in: i + ' ' + i + '\n', out: String(2 * i) }));
  fj.stats.maxBatch = 0; fj.oci = 5;
  const r = J.JD_run({}, 'py', 'a,b=map(int,input().split())\nprint(a+b)', tests, {});
  assert.deepStrictEqual(r.results.map((x) => x.v), tests.map(() => 'AC'), JSON.stringify(r.results.map((x) => x.v)));
  assert.ok(fj.stats.maxBatch <= 3, 'mỗi đợt ≤ 3 lượt: ' + fj.stats.maxBatch);
  fj.oci = 1000;   // máy chấm hỏng hẳn → Lỗi máy chấm (IE, không tính lượt), không phải RE
  const r2 = J.JD_run({}, 'py', 'print(1)', tests.slice(0, 2), {});
  assert.deepStrictEqual(r2.results.map((x) => x.v), ['IE', 'IE']); assert.ok(r2.busy);
  fj.oci = 0;
});
t('Thư viện: đọc quy định', () => {
  assert.strictEqual(J.JD_libRules('', 'TAT_CA', ''), null);
  const r = J.JD_libRules('math, sys collections.abc', 'stdio.h <math.h>', 'sorted, qsort');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r)), { py: ['math', 'sys', 'collections'], c: ['stdio.h', 'math.h'], cam: ['sorted', 'qsort'] });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(J.JD_libRules('KHONG', '', ''))).py, []);
});
t('Thư viện Python: kiểm tra tĩnh (bỏ qua chú thích, chuỗi; bắt import gián tiếp, hàm cấm)', () => {
  const L = J.JD_libRules('math', '', 'sorted');
  const chk = (code) => { const x = J.JD_libCheck('py', code, L); return x ? x.msg : null; };
  assert.strictEqual(chk('import math\nfrom math import sqrt\nprint(sqrt(4))'), null);
  assert.ok(/Dòng 2: dùng thư viện «itertools» — bài này chỉ cho dùng math/.test(chk('import math\nimport itertools as it')), chk('import math\nimport itertools as it'));
  assert.ok(/«os»/.test(chk('import math, os')));
  assert.ok(/Dòng 3: .*«collections»/.test(chk('x = 1\nif x:\n    from collections import Counter')));
  assert.strictEqual(chk('# import os\ns = "import os; sorted(x)"\nprint(s)'), null, 'chú thích và chuỗi không tính');
  assert.ok(/«__import__»/.test(chk('m = __import__("os")')));
  assert.ok(/«sys\.modules»|«importlib»/.test(chk('import importlib')));
  assert.ok(/Dòng 1: không được dùng «sorted»/.test(chk('print(sorted([3,1]))')));
  assert.ok(/«sorted»/.test(chk('print(f"{sorted([3,1])}")')), 'f-string vẫn bị kiểm tra');
  assert.strictEqual(J.JD_libCheck('py', 'a.sorted_list = 1\nmy_sorted = 2', L), null, 'chỉ khớp đúng tên');
  assert.ok(/không cho import thư viện nào/.test(J.JD_libCheck('py', 'import math', J.JD_libRules('KHONG', '', '')).msg));
});
t('Thư viện Python: chặn mọi đường lách (eval/getattr/__class__/khung gọi…), không bắt nhầm', () => {
  const L = J.JD_libRules('math, re, sys', '', '');
  const chk = (code, lib) => { const x = J.JD_libCheck('py', code, lib || L); return x ? x.msg : null; };
  for (const [code, name] of [['x = eval(input())', 'eval'], ['getattr(math, "sq" + "rt")(4)', 'getattr'], ['print(().__class__.__mro__)', '__class__'],
    ['object.__subclasses__()', '__subclasses__'], ['f = sys._getframe(0)', '_getframe'], ['sys.meta_path[0].load_module("itertools")', 'meta_path'],
    ['globals()["x"]', 'globals'], ['print(vars())', 'vars'], ['def f(): pass\nf.__globals__', '__globals__'], ['import pickle', 'pickle'], ['__ptB = 1', '__ptB']]) {
    const m = chk(code); assert.ok(m && m.includes('«' + name + '»'), code + ' → ' + m);
  }
  assert.strictEqual(chk('import re\np = re.compile(r"\\d+")\nif __name__ == "__main__":\n    print(p)'), null, 're.compile và __name__ hợp lệ');
  assert.strictEqual(chk('from __future__ import annotations\nimport math'), null, '__future__ hợp lệ');
  // chỉ cấm hàm (thư viện tự do) → vẫn chặn đường lách gọi hàm cấm qua chuỗi
  const C = J.JD_libRules('', '', 'sorted');
  assert.ok(/«eval»/.test(chk('f = eval("sor" + "ted")', C)) && /«__builtins__»/.test(chk('__builtins__.__dict__["sor" + "ted"]', C)));
  assert.strictEqual(chk('import itertools\nprint(1)', C), null, 'không giới hạn thư viện thì import tự do');
  assert.strictEqual(J.JD_libCheck('py', 'x = eval("1+1")', null), null, 'bài không có quy định: không chặn gì');
});
t('Thư viện Python: chặn cả import động lúc chạy, thư viện chuẩn bên trong vẫn chạy', () => {
  const L = J.JD_libRules('math, collections, datetime', '', '');
  const ok = J.JD_run({}, 'py', 'import math, collections, datetime\nfrom collections import Counter\nprint(Counter("aab")["a"], math.isqrt(17), datetime.date(2024,1,2).isoformat())', [{ in: '', out: '2 4 2024-01-02' }], { lib: L });
  assert.strictEqual(ok.results[0].v, 'AC', JSON.stringify(ok.results[0]));
  assert.ok(/«exec»/.test(J.JD_libCheck('py', 'g = {}\nexec("import itertools", g)', L).msg), 'exec bị chặn ngay từ kiểm tra tĩnh');
  // lớp 2 (lúc chạy): giả sử kiểm tra tĩnh bị lọt → chốt import vẫn chặn
  const keep = J.JD_libCheck; J.JD_libCheck = () => null;
  let dyn; try { dyn = J.JD_run({}, 'py', 'g = {"__name__": "khac"}\nexec("import itertools", g)\nprint(1)', [{ in: '', out: '1' }], { lib: L }); } finally { J.JD_libCheck = keep; }
  assert.strictEqual(dyn.results[0].v, 'RE', JSON.stringify(dyn.results[0])); assert.ok(/itertools.*không được dùng/.test(dyn.results[0].err) && /line 2/.test(dyn.results[0].err), dyn.results[0].err);
  const bad = J.JD_run({}, 'py', 'import itertools\nprint(1)', [{ in: '', out: '1' }, { in: '', out: '1' }], { lib: L });
  assert.deepStrictEqual(bad.results.map((x) => x.v), ['CE', 'CE']); assert.ok(bad.lib && /Dòng 1/.test(bad.ce));
  const none = J.JD_run({}, 'py', 'a, b = map(int, input().split())\nprint(a + b)', [{ in: '2 3', out: '5' }], { lib: J.JD_libRules('KHONG', '', '') });
  assert.strictEqual(none.results[0].v, 'AC', JSON.stringify(none.results[0]));
});
t('Thư viện C: header cho phép, hàm cấm, cấm gọi hàm chưa khai báo (lách #include)', () => {
  const L = J.JD_libRules('', 'stdio.h, string.h', 'qsort');
  const ok = J.JD_run({}, 'c', '#include <stdio.h>\n#include <string.h>\nint main(void){ char s[9]="abc"; printf("%d\\n",(int)strlen(s)); return 0; }', [{ in: '', out: '3' }], { lib: L });
  assert.strictEqual(ok.results[0].v, 'AC', JSON.stringify(ok.results[0]));
  const h = J.JD_libCheck('c', '#include <stdio.h>\n// #include <math.h>\n#include <stdlib.h>\nint main(){}', L);
  assert.ok(h && /Dòng 3: #include <stdlib.h> không được phép/.test(h.msg), JSON.stringify(h));
  assert.ok(/«qsort»/.test(J.JD_libCheck('c', '#include <stdio.h>\nint main(){ qsort(0,0,0,0); }', L).msg));
  const sneak = J.JD_run({}, 'c', '#include <stdio.h>\nint main(void){ int *p = malloc(4); printf("%d\\n", p != 0); return 0; }', [{ in: '', out: '1' }], { lib: L });
  assert.strictEqual(sneak.results[0].v, 'CE', 'gọi malloc mà không #include <stdlib.h> → lỗi biên dịch'); assert.ok(/implicit|malloc/.test(sneak.ce), sneak.ce);
  assert.ok(/«malloc» của <stdlib.h>/.test(sneak.ce), 'kiểm tra tĩnh nhận ra hàm của header không được phép: ' + sneak.ce);
  // lớp 2: giả sử kiểm tra tĩnh lọt → trình biên dịch vẫn báo lỗi gọi hàm chưa khai báo
  const keep = J.JD_libCheck; J.JD_libCheck = () => null;
  try { const s2 = J.JD_run({}, 'c', '#include <stdio.h>\nint main(void){ int *p = malloc(4); printf("%d\\n", p != 0); return 0; }', [{ in: '', out: '1' }], { lib: L });
    assert.strictEqual(s2.results[0].v, 'CE'); assert.ok(/implicit/.test(s2.ce), s2.ce); } finally { J.JD_libCheck = keep; }
  assert.ok(/#include phải viết dạng/.test(J.JD_libCheck('c', '#define H <stdlib.h>\n#include H\nint main(){}', L).msg));
  const c = (code, lib) => { const x = J.JD_libCheck('c', code, lib || L); return x ? x.msg : null; };
  assert.ok(/«qsort» của <stdlib.h>/.test(c('#include <stdio.h>\nvoid qsort(void*, unsigned long, unsigned long, int (*)(const void*, const void*));\nint main(){}')), 'tự viết prototype để lách');
  assert.ok(/##/.test(c('#include <stdio.h>\n#define J(a,b) a##b\nint main(){}')) && /#import/.test(c('#import <stdlib.h>\nint main(){}')));
  assert.ok(/__builtin_/.test(c('#include <stdio.h>\nint main(){ return __builtin_popcount(5); }')) && /asm/.test(c('#include <stdio.h>\nint main(){ asm("nop"); }')));
  assert.strictEqual(c('#include <stdio.h>\nint abs(int x){ return x < 0 ? -x : x; }\nint main(){ int time = 3, exp = 2; printf("%d qsort(", abs(-time) * exp); }'), null, 'tự cài hàm cùng tên, biến tên time/exp, chuỗi: hợp lệ');
});
t('C: vòng lặp vô hạn → TLE', () => {
  const r = J.JD_run({}, 'c', 'int main(){ volatile long i=0; for(;;) i++; }', [{ in: '', out: '' }], { tl: 1 });
  assert.strictEqual(r.results[0].v, 'TLE', JSON.stringify(r.results[0]));
});
t('C: chia cho 0 / truy cập sai bộ nhớ → RE', () => {
  const r = J.JD_run({}, 'c', '#include <stdio.h>\nint main(){ int *p=0; *p=1; printf("x"); }', [{ in: '', out: 'x' }], {});
  assert.strictEqual(r.results[0].v, 'RE');
});
t('C: cấp phát quá bộ nhớ → MLE/RE', () => {
  const r = J.JD_run({}, 'c', '#include <stdlib.h>\n#include <string.h>\nint main(){ char*p=malloc(600u<<20); if(!p) return 3; memset(p,1,600u<<20); return 0; }', [{ in: '', out: '' }], { ml: 128 });
  assert.ok(['MLE', 'RE'].includes(r.results[0].v), r.results[0].v);
});
t('Chỉ chạy (không có output mong đợi) → OK + output', () => {
  const r = J.JD_run({}, 'py', 'print(input()[::-1])', [{ in: 'abc' }], {});
  assert.strictEqual(r.results[0].v, 'OK'); assert.strictEqual(r.results[0].out.trim(), 'cba');
});
t('So sánh output: TOKEN / LINE / EXACT / FLOAT / NOCASE', () => {
  assert.ok(J.JD_compare('1 2\n3\n', '1  2 3', 'TOKEN'));
  assert.ok(!J.JD_compare('1 2\n3\n', '1 2 3', 'LINE'));
  assert.ok(J.JD_compare('a b \n\n', 'a b', 'LINE'));
  assert.ok(!J.JD_compare('a\n', 'a', 'EXACT'));
  assert.ok(J.JD_compare('3.14159265', '3.1415927', 'FLOAT', 1e-6));
  assert.ok(!J.JD_compare('3.14', '3.15', 'FLOAT', 1e-6));
  assert.ok(J.JD_compare('YES', 'yes', 'NOCASE'));
});
t('Tính điểm theo trọng số test / tất cả', () => {
  const R = [{ v: 'AC' }, { v: 'WA' }, { v: 'AC' }];
  assert.strictEqual(J.JD_score(R, [0, 2, 2], 10, 'TUNG_TEST'), 5);
  assert.strictEqual(J.JD_score(R, [1, 1, 1], 10, 'TAT_CA'), 0);
  assert.strictEqual(J.JD_score([{ v: 'AC' }], [1], 10, 'TAT_CA'), 10);
});
t('Phát hiện code giống nhau (đổi tên biến vẫn bắt được)', () => {
  const a = 'n = int(input())\ns = 0\nfor i in range(1, n + 1):\n    if i % 3 == 0 or i % 5 == 0:\n        s += i\nprint(s)\n';
  const b = 'k = int(input())\ntong = 0\nfor x in range(1, k + 1):\n    if x % 3 == 0 or x % 5 == 0:\n        tong += x  # cộng\nprint(tong)\n';
  const c = 'import sys\ndata = sys.stdin.read().split()\nprint(sum(int(v) for v in data if int(v) > 0))\n';
  assert.ok(J.JD_similar(a, b, 'py') > 0.8, J.JD_similar(a, b, 'py'));
  assert.ok(J.JD_similar(a, c, 'py') < 0.3);
});
t('Máy chấm lỗi mạng → IE (không làm hỏng bài)', () => {
  fj.down = true;
  const r = J.JD_run({}, 'py', 'print(1)', [{ in: '', out: '1' }], {});
  fj.down = false;
  assert.strictEqual(r.results[0].v, 'IE'); assert.ok(r.busy);
});
console.log('\n✅ Máy chấm: ' + n + ' nhóm kiểm thử đều đạt (Wandbox · Judge0 · Piston; Python · C).');
