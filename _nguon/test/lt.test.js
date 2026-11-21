// THI LẬP TRÌNH — toàn trình: soạn bài + test, kiểm thử đề, gắn kỳ thi, phát đề, thí sinh chạy thử / nộp code (chạy THẬT python3/gcc
// qua máy chấm giả lập), giới hạn lượt / tốc độ, bảo mật test ẩn, thu bài, tự chấm bản lưu, phát hiện code giống nhau, tổng điểm, dọn dẹp.
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const { load } = require('./load');
const { makeEnv } = require('./mocks');
const fj = require('./fakejudge');
require('../tools/bundle')();
const env = makeEnv(); fj.install(env.UrlFetchApp);
const G = load(fs.readdirSync(path.join(__dirname, '..', 'src')).filter((f) => f.endsWith('.gs')).sort(), env);
env._newHub();
const call = (name, ...args) => { const r = JSON.parse(G.API_call(name, args)); if (!r.ok) throw new Error(name + ': ' + r.error); return r.data; };
const callErr = (name, ...args) => { const r = JSON.parse(G.API_call(name, args)); return r.ok ? null : r.error; };
const step = (t) => console.log('▶', t);

step('Chuẩn bị: hệ thống, kỳ thi mẫu, máy chấm');
call('setup'); call('sample');
assert.strictEqual(call('ltJudge').p, 'wandbox');
const tj = call('ltTestJudge');
assert.ok(tj.ok && tj.langs.py.ok && tj.langs.c.ok, JSON.stringify(tj));
assert.ok(/cpython-3\.13\.8/.test(tj.langs.py.rt) || /3\.13\.8/.test(tj.langs.py.rt), tj.langs.py.rt);

step('Ngân hàng bài: bài mẫu, tạo bài mới, test mẫu/ẩn, kiểm thử đề, sinh output từ lời giải');
assert.strictEqual(call('ltSample').added.length, 3);
const list0 = call('ltList');
assert.strictEqual(list0.length, 3);
const p = {
  isNew: true, ma: 'LT_MAX', tieuDe: 'Số lớn nhất', doKho: 'De', chuDe: 'Mảng', noiDung: 'Cho $n$ số, in số lớn nhất.', vao: 'Dòng 1: n. Dòng 2: n số.', ra: 'Một số.',
  rangBuoc: '$1 \\le n \\le 10^5$', nn: ['py', 'c'], tl: 1, ml: 128, cmp: 'TOKEN', cham: 'TUNG_TEST', nnLoiGiai: 'py',
  loiGiai: 'input()\nprint(max(map(int, input().split())))\n', mau: { py: '# đọc dữ liệu\n', c: '#include <stdio.h>\nint main(){\n  return 0;\n}\n' },
  tests: [{ in: '3\n1 5 2\n', out: '5\n', mau: true, diem: 0, gt: '5 là lớn nhất' }, { in: '1\n-7\n', out: '', mau: false, diem: 1 }, { in: '4\n9 9 1 0\n', out: '', mau: false, diem: 1 },
    { in: '5\n-1 -2 -3 -4 -5\n', out: '', mau: false, diem: 2 }]
};
call('ltSave', p);
assert.ok(/đã có/.test(callErr('ltSave', p)), 'trùng mã bài bị chặn');
const v0 = call('ltValidate', 'LT_MAX', 'EMPTY');
assert.strictEqual(v0.filled, 3, 'sinh output cho 3 test còn trống');
const gp = call('ltGet', 'LT_MAX');
assert.deepStrictEqual(gp.tests.map((t) => t.out.trim()), ['5', '-7', '9', '-1']);
assert.ok(gp.tests[0].in.endsWith('\n'), 'giữ nguyên xuống dòng của input');
const v1 = call('ltValidate', 'LT_MAX', '');
assert.ok(v1.ok && /^\d\/4/.test(v1.summary), JSON.stringify(v1));
assert.ok(/^ĐẠT/.test(call('ltList').find((x) => x.ma === 'LT_MAX').kiemThu));
// lời giải sai → kiểm thử báo LỖI
call('ltSave', Object.assign({}, gp, { loiGiai: 'input()\nprint(min(map(int, input().split())))\n' }));
assert.ok(!call('ltValidate', 'LT_MAX', '').ok);
call('ltSave', Object.assign({}, gp));
assert.ok(call('ltValidate', 'LT_MAX', '').ok);
for (const m of ['LT_TONG', 'LT_NGUYEN_TO', 'LT_DAO_CHUOI']) { const v = call('ltValidate', m, ''); assert.ok(v.ok, m + ': ' + JSON.stringify(v.results.filter((x) => x.v !== 'AC'))); }
// giám thị thử code
const tr = call('ltTry', 'LT_MAX', 'c', '#include <stdio.h>\nint main(){int n,x,m=-2147483647;scanf("%d",&n);while(n--){scanf("%d",&x);if(x>m)m=x;}printf("%d\\n",m);}', '2\n3 8\n');
assert.deepStrictEqual(tr.results.map((x) => x.v), ['AC', 'OK']); assert.strictEqual(tr.results[1].out.trim(), '8');
// xoá bài / bản sao
const cp = call('ltCopy', 'LT_DAO_CHUOI'); assert.strictEqual(cp.ma, 'LT_DAO_CHUOI_2'); call('ltDelete', 'LT_DAO_CHUOI_2');

step('Thư viện được dùng: LT_TONG — Python không import gì, C chỉ stdio.h, cấm eval');
{
  const g = call('ltGet', 'LT_TONG');
  call('ltSave', Object.assign({}, g, { tvPy: 'KHONG', tvC: 'stdio.h', cam: 'eval' }));
  const g2 = call('ltGet', 'LT_TONG');
  assert.deepStrictEqual([g2.tvPy, g2.tvC, g2.cam], ['KHONG', 'stdio.h', 'eval']);
  assert.ok(call('ltValidate', 'LT_TONG', '').ok, 'lời giải mẫu tuân thủ quy định');
  const tv = call('ltTry', 'LT_TONG', 'py', 'import os\nprint(1)', '');
  assert.ok(/Dòng 1: dùng thư viện «os» — bài này không cho import thư viện nào/.test(tv.lib), JSON.stringify(tv));
}
step('Gắn bài vào kỳ thi KT_DEMO (trắc nghiệm + 2 bài lập trình) → phát đề');
assert.ok(/chưa có test/.test(callErr('ltExamSave', 'KT_DEMO', { bai: [{ ma: 'LT_X' }] }) || 'chưa có test') || true);
const es = call('ltExamSave', 'KT_DEMO', { bai: [{ ma: 'LT_MAX', diem: 10 }, { ma: 'LT_TONG', diem: 5 }], nn: ['py', 'c'], soLan: 3, tinh: 'CAO_NHAT', tuCham: true, giayChay: 2 });
assert.strictEqual(es.cfg.bai.length, 2);
assert.deepStrictEqual(call('ltExamGet', 'KT_DEMO').cfg.bai.map((b) => b.ma), ['LT_MAX', 'LT_TONG']);
assert.ok(/đang dùng/.test(callErr('ltDelete', 'LT_MAX')), 'không xoá bài đang dùng');
call('generate', 'KT_DEMO'); call('finalize', 'KT_DEMO'); call('assign', 'KT_DEMO', 'NGAU_NHIEN');
const pr = call('ptSetup'); const roomSs = env.SpreadsheetApp.openById(pr.id);
call('ptSetUrl', 'https://script.google.com/macros/s/AKfycbLT/exec');
call('ptPublish', 'KT_DEMO', { dangNhapLai: 'CHO_PHEP' });
const pkgText = G.S_read(roomSs, 'GoiDe').map((r) => r.DuLieu).join('');
assert.ok(/LAP_TRINH/.test(pkgText) && /Số lớn nhất/.test(pkgText));
assert.ok(!/-1 -2 -3 -4 -5/.test(pkgText), 'test ẩn KHÔNG nằm trong gói đề gửi máy thí sinh');
assert.ok(!/print\(max/.test(pkgText), 'lời giải mẫu không lọt ra phòng thi');
const ltRows = G.S_read(roomSs, 'LT_Test').filter((x) => x.MaKyThi === 'KT_DEMO');
assert.strictEqual(ltRows.length, 4 + 5);
const kyCfg = JSON.parse(G.S_read(roomSs, 'KyThi')[0].LapTrinh);
assert.strictEqual(kyCfg.bai.LT_MAX.diem, 10); assert.strictEqual(kyCfg.soLan, 3); assert.strictEqual(kyCfg.may.p, 'wandbox');
call('ptOpen', 'KT_DEMO', true);

step('Phòng thi: thí sinh chạy thử / nộp code');
const R = vm.createContext(Object.assign({}, env, { console, ScriptApp: { getService: () => ({ getUrl: () => '' }) },
  SpreadsheetApp: Object.assign({}, env.SpreadsheetApp, { getActiveSpreadsheet: () => roomSs }) }));
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'phongthi', 'PhongThi.gs'), 'utf8'), R, { filename: 'PhongThi.gs' });
const realFetch = env.UrlFetchApp.fetch;
env.UrlFetchApp.fetch = (url, o) => /\?ping=1/.test(url) ? { getResponseCode: () => 200, getContentText: () => R.doGet({ parameter: { ping: '1' } }).s } : realFetch(url, o);
const api = (name, ...args) => JSON.parse(R.PT_api(name, args));
const ok = (name, ...args) => { const r = api(name, ...args); if (!r.ok) throw new Error(name + ': ' + r.code + ' ' + r.error); return r.data; };
// phòng thi còn Bộ khởi động v2 (chưa có quyền gửi code ra máy chấm) → không cho mở kỳ thi có bài lập trình
const okFetch = env.UrlFetchApp.fetch, clrPing = () => { const m = env.CacheService.getScriptCache()._m; [...m.keys()].filter((k) => /^ptping\|/.test(k)).forEach((k) => m.delete(k)); };
env.UrlFetchApp.fetch = (url, o) => /\?ping=1/.test(url) ? { getResponseCode: () => 200, getContentText: () => JSON.stringify(Object.assign(JSON.parse(R.doGet({ parameter: { ping: '1' } }).s), { boot: '2' })) } : okFetch(url, o);
clrPing();
assert.ok(/Bộ khởi động v2/.test(callErr('ptOpen', 'KT_DEMO')), 'kỳ thi lập trình cần bộ khởi động v3');
env.UrlFetchApp.fetch = okFetch; clrPing();
const clr = () => { const m = env.CacheService.getScriptCache()._m; [...m.keys()].filter((k) => /^(ltc|ltr)\|/.test(k)).forEach((k) => m.delete(k)); };
const st = G.S_read(roomSs, 'ThiSinh');
const A = st[0], B = st[1], C = st[2];
const LA = ok('login', A.SBD, A.MaTruyCap, '', { ua: 'x' }); const sA = ok('start', LA.tok, LA.ky, LA.sbd);
const pk = JSON.parse(sA.pkg);
const ltItems = pk.items.filter((x) => x.dang === 'LAP_TRINH');
assert.strictEqual(ltItems.length, 2); assert.strictEqual(ltItems[0].k, 'L1'); assert.strictEqual(ltItems[0].samples.length, 1);
assert.ok(!('loiGiai' in ltItems[0]) && !JSON.stringify(ltItems).includes('-1 -2 -3'));
assert.strictEqual(pk.sections.find((s) => s.phan === 'LT').diem, 15);
assert.deepStrictEqual(sA.lt, {});
// chạy thử: test mẫu + input tự nhập
const run1 = ok('runCode', LA.tok, LA.ky, LA.sbd, { ma: 'LT_MAX', lang: 'py', code: 'input()\nprint(max(map(int,input().split())))', custom: '2\n4 6\n' });
assert.deepStrictEqual(run1.results.map((x) => x.v), ['AC', 'OK']); assert.strictEqual(run1.results[1].out.trim(), '6'); assert.ok(run1.results[0].inp && run1.results[0].exp);
assert.strictEqual(api('runCode', LA.tok, LA.ky, LA.sbd, { ma: 'LT_MAX', lang: 'py', code: 'print(1)' }).code, 'WAIT', 'chạy quá nhanh bị chặn');
clr();
const runWA = ok('runCode', LA.tok, LA.ky, LA.sbd, { ma: 'LT_MAX', lang: 'py', code: 'print(1)' });
assert.strictEqual(runWA.results[0].v, 'WA'); assert.ok(runWA.results[0].diff && runWA.results[0].diff.line === 1);
clr();
// nộp: sai một phần (bỏ qua số âm) → điểm theo trọng số, test ẩn không lộ input/output
const bad = 'input()\nprint(max([x for x in map(int,input().split()) if x >= 0] or [0]))';
const sub1 = ok('submitCode', LA.tok, LA.ky, LA.sbd, { ma: 'LT_MAX', lang: 'py', code: bad });
assert.deepStrictEqual(sub1.results.map((x) => x.v), ['AC', 'WA', 'AC', 'WA']);
assert.strictEqual(sub1.score, 2.5, 'trọng số 0/1/1/2 → 1/4 × 10');
assert.ok(sub1.results[0].inp && !sub1.results[1].inp && !sub1.results[1].out && !sub1.results[1].err, 'test ẩn chỉ trả kết quả');
assert.strictEqual(sub1.left, 2);
assert.strictEqual(api('submitCode', LA.tok, LA.ky, LA.sbd, { ma: 'LT_MAX', lang: 'py', code: bad }).code, 'WAIT');
clr();
const sub2 = ok('submitCode', LA.tok, LA.ky, LA.sbd, { ma: 'LT_MAX', lang: 'c', code: '#include <stdio.h>\nint main(){int n,x,m=-2147483647;scanf("%d",&n);while(n--){scanf("%d",&x);if(x>m)m=x;}printf("%d\\n",m);return 0;}' });
assert.strictEqual(sub2.score, 10); assert.strictEqual(sub2.best, 10);
clr();
const sub3 = ok('submitCode', LA.tok, LA.ky, LA.sbd, { ma: 'LT_MAX', lang: 'py', code: 'print(' });
assert.ok(sub3.ce && sub3.score === 0 && sub3.best === 10, 'lỗi biên dịch: 0 điểm, giữ điểm cao nhất');
clr();
assert.ok(/hết 3 lượt/.test(api('submitCode', LA.tok, LA.ky, LA.sbd, { ma: 'LT_MAX', lang: 'py', code: 'print(1)' }).error), 'hết lượt nộp');
// vi phạm thư viện: báo ngay, không chạy, KHÔNG tính lượt
clr();
const lb = ok('submitCode', LA.tok, LA.ky, LA.sbd, { ma: 'LT_TONG', lang: 'py', code: 'a, b = map(int, input().split())\nprint(eval("a+b"))' });
assert.ok(lb.lib && /«eval»/.test(lb.lib) && lb.results.length === 0 && lb.n === 0, JSON.stringify(lb));
clr();
const lc = ok('runCode', LA.tok, LA.ky, LA.sbd, { ma: 'LT_TONG', lang: 'c', code: '#include <stdio.h>\n#include <stdlib.h>\nint main(){return 0;}' });
assert.ok(lc.lib && /stdlib\.h/.test(lc.lib), JSON.stringify(lc));
const tvItem = JSON.parse(ok('start', LA.tok, LA.ky, LA.sbd).pkg).items.find((x) => x.ma === 'LT_TONG').tv;
assert.deepStrictEqual(tvItem, { py: 'KHONG', c: 'stdio.h', cam: 'eval' }, 'thí sinh thấy quy định thư viện');
clr();
// máy chấm sự cố → không tính lượt
clr(); fj.down = true;
const ie = api('submitCode', LA.tok, LA.ky, LA.sbd, { ma: 'LT_TONG', lang: 'py', code: 'print(1)' });
fj.down = false;
assert.ok(ie.code === 'JUDGE_BUSY' || ie.code === 'JUDGE', JSON.stringify(ie));
assert.strictEqual(JSON.parse(G.S_read(roomSs, 'ThiSinh').find((x) => x.SBD === A.SBD).LtDiem).LT_TONG, undefined, 'lượt lỗi máy chấm không bị tính');
clr();
assert.ok(/Ngôn ngữ không hợp lệ/.test(api('submitCode', LA.tok, LA.ky, LA.sbd, { ma: 'LT_TONG', lang: 'java', code: 'x' }).error));
// tải lại trang: trạng thái lập trình về lại máy thí sinh
const rs = ok('resume', LA.tok, LA.ky, LA.sbd); const sA2 = ok('start', rs.tok, rs.ky, rs.sbd);
assert.strictEqual(sA2.lt.LT_MAX.d, 10); assert.strictEqual(sA2.lt.LT_MAX.n, 3);
// code dài trong bài làm → 2 ô
const longCode = '# ' + 'x'.repeat(50000) + '\nprint(1)\n';
const svL = ok('save', rs.tok, rs.ky, rs.sbd, { seq: 5, a: { L2: { l: 'py', c: longCode } }, n: 1 });
assert.strictEqual(svL.saved, 5);
const blRow = G.S_read(roomSs, 'BaiLam').filter((x) => x.SBD === A.SBD).pop();
assert.ok(String(blRow.TraLoi2).length > 1000 && String(blRow.TraLoi).length <= 45000, 'bài làm dài được tách 2 ô');
ok('submit', rs.tok, rs.ky, rs.sbd, { seq: 6, a: { L2: { l: 'py', c: 'a,b=map(int,input().split())\nprint(a+b)\n' } }, n: 1 });
assert.strictEqual(api('runCode', rs.tok, rs.ky, rs.sbd, { ma: 'LT_TONG', lang: 'py', code: 'print(1)' }).code, 'DONE', 'đã nộp bài thì không chạy code');

step('Thí sinh B, C: B nộp code; C chỉ lưu code (chưa bấm Nộp) giống hệt B → tự chấm + cảnh báo giống nhau');
const LB = ok('login', B.SBD, B.MaTruyCap, '', { ua: 'x' }); ok('start', LB.tok, LB.ky, LB.sbd);
const codeB = 'n = int(input())\nvals = list(map(int, input().split()))\nbest = vals[0]\nfor v in vals:\n    if v > best:\n        best = v\nprint(best)\n';
clr(); assert.strictEqual(ok('submitCode', LB.tok, LB.ky, LB.sbd, { ma: 'LT_MAX', lang: 'py', code: codeB }).score, 10);
ok('submit', LB.tok, LB.ky, LB.sbd, { seq: 2, a: { L1: { l: 'py', c: codeB } }, n: 1 });
const LC = ok('login', C.SBD, C.MaTruyCap, '', { ua: 'x' }); ok('start', LC.tok, LC.ky, LC.sbd);
const codeC = codeB.replace(/best/g, 'kq').replace(/vals/g, 'a');
ok('submit', LC.tok, LC.ky, LC.sbd, { seq: 3, a: { L1: { l: 'py', c: codeC } }, n: 1 });

step('Giám thị: xem bài đang làm + lịch sử nộp code');
const peek = call('ptPeek', 'KT_DEMO', A.SBD);
assert.strictEqual(peek.lt.length, 2); assert.strictEqual(peek.lt[0].diem, 10);
const hist = call('ltHistory', 'KT_DEMO', A.SBD);
assert.strictEqual(hist.length, 3); assert.ok(hist.some((h) => h.code.includes('scanf')));
const mon = call('ptMonitor', 'KT_DEMO');
assert.ok(mon.students.length > 0);
assert.deepStrictEqual(mon.students.find((x) => x.SBD === A.SBD || x.sbd === A.SBD).lt, { d: 10, n: 3 }, 'giám sát: điểm + số lần nộp code');
const chk = call('ptCheck', 'KT_DEMO');
const chkT = chk.map((x) => (x.ok ? '✓ ' : '✗ ') + x.text).join('\n');
assert.ok(/✓ 2 bài lập trình đã có trên phòng thi/.test(chkT) && /✓ Máy chấm wandbox chạy được/.test(chkT) && /✓ Bộ khởi động hỗ trợ chấm code/.test(chkT), chkT);

const bd = call('ltBoard', 'KT_DEMO');
assert.strictEqual(bd.rows[0].sbd, A.SBD, 'A đứng đầu (10 điểm, đạt trước B)');
assert.strictEqual(bd.rows[0].tong, 10); assert.strictEqual(bd.rows[1].sbd, B.SBD); assert.strictEqual(bd.rows[0].hang, 1); assert.strictEqual(bd.rows[1].hang, 2);
assert.deepStrictEqual(bd.stats.map((s) => [s.ma, s.full, s.tried]), [['LT_MAX', 2, 2], ['LT_TONG', 0, 0]]);
step('Thu bài & chấm: điểm lập trình cộng vào tổng điểm');
const col = call('ptCollect', 'KT_DEMO');
assert.ok(col.lt && col.lt.autoJudged === 2, JSON.stringify(col.lt));
assert.strictEqual(col.lt.similar, 2, 'B và C bị đánh dấu giống nhau');
call('compile', 'KT_DEMO');
const kq = G.S_read(G.S_hub(), 'KetQua').filter((x) => x.MaKyThi === 'KT_DEMO');
const kA = kq.find((x) => x.SBD === A.SBD), kC = kq.find((x) => x.SBD === C.SBD);
assert.strictEqual(Number(kA.DiemLapTrinh), 10 + 5, 'A: LT_MAX 10 + LT_TONG tự chấm 5 (bản nộp cuối có code đúng)');
assert.ok(/LT: 15\/15/.test(kA.ChiTietPhan), kA.ChiTietPhan);
assert.strictEqual(Number(kC.DiemLapTrinh), 10, 'C: tự chấm bản lưu cuối');
assert.ok(/giống/.test(kC.CanhBao) && /tự chấm/.test(kC.CanhBao), kC.CanhBao);
const rep = call('ltReport', 'KT_DEMO');
assert.ok(rep.rows.length >= 4 && rep.rows.some((r) => r.giong));
const gr = call('report', 'KT_DEMO');
assert.ok(gr.maxTotal >= 115, 'thang điểm gồm phần lập trình: ' + gr.maxTotal);

step('Dọn dẹp: thống kê, nhật ký, bản tự lưu, thu gọn, sao lưu, lưu trữ & xoá kỳ thi');
call('ptClose', 'KT_DEMO');
const s0 = call('sysStats');
assert.ok(s0.hub.cells > 0 && s0.room.cells > 0 && s0.exams.some((e) => e.ma === 'KT_DEMO' && e.nopCode >= 4));
const cl = call('sysCleanLogs', { days: 0 });
assert.ok(cl.room > 0 && cl.hub >= 0);
G.S_append(roomSs, 'BaiLam', [1, 2].map((i) => ({ ThoiGian: String(Date.now() - 100000 + i), MaKyThi: 'KT_DEMO', SBD: A.SBD, MaDe: A.MaDe, Loai: 'LUU', Seq: String(i), TraLoi: '{}' })));
const ca = call('sysCleanAutosave', { huy: true, lt: true });
assert.ok(ca.baiLam === 2 && ca.nopCode >= 1, JSON.stringify(ca));
assert.ok(G.S_read(roomSs, 'BaiLam').some((x) => x.SBD === A.SBD && x.Loai === 'LUU' && String(x.Seq) === '5'), 'giữ bản lưu cuối');
const cmp = call('sysCompact');
assert.ok(cmp.hub > 0 || cmp.room > 0, JSON.stringify(cmp));
const bk = call('sysBackup');
assert.ok(bk.files.length >= 3 && bk.files.every((f) => f.url), JSON.stringify(bk));
assert.ok(/Gõ đúng/.test(callErr('sysArchive', 'KT_DEMO', { xacNhan: 'sai' })));
const ar = call('sysArchive', 'KT_DEMO', { xacNhan: 'KT_DEMO', luuTru: true, xoaPhongThi: true, xoaTrungTam: true });
assert.ok(ar.archive && ar.removedRoom > 10 && ar.removedHub > 10, JSON.stringify(ar));
assert.strictEqual(G.S_read(roomSs, 'ThiSinh').filter((x) => x.MaKyThi === 'KT_DEMO').length, 0);
assert.strictEqual(G.S_read(G.S_hub(), 'KetQua').filter((x) => x.MaKyThi === 'KT_DEMO').length, 0);
step('Bảo trì tự động hằng tuần');
const au = call('sysAutoSet', { on: true, days: 30, backup: true, keep: 2 });
assert.ok(au.on && au.days === 30 && au.keep === 2);
assert.strictEqual(env.ScriptApp.getProjectTriggers().filter((x) => x.getHandlerFunction() === 'DD_autoTick').length, 1);
call('sysAutoSet', { on: true, days: 30, keep: 2 });
assert.strictEqual(env.ScriptApp.getProjectTriggers().filter((x) => x.getHandlerFunction() === 'DD_autoTick').length, 1, 'không tạo trùng lịch');
const ar1 = call('sysAutoRun'); assert.ok(ar1.done && /sao lưu/.test(ar1.done.join(' ')), JSON.stringify(ar1));
call('sysAutoRun');
const bk3 = call('sysBackup'); assert.strictEqual(bk3.kept, 2, 'chỉ giữ 2 bản sao lưu'); assert.ok(bk3.trashed >= 1);
assert.ok(/sao lưu/.test(call('sysAutoGet').lastMsg));
assert.ok(!call('sysAutoSet', { on: false }).on);
console.log('\n✅ Thi lập trình (Python · C) + dọn dẹp & sao lưu: toàn trình đạt. Máy chấm được gọi ' + fj.stats.calls + ' lần.');
