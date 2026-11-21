// Bấm thử tab ⑧ LẬP TRÌNH + ⚙ HỆ THỐNG trên Chrome thật: máy chấm, ngân hàng bài, soạn bài kiểu HackerRank (đề, test, lời giải,
// kiểm thử đề, sinh output, nhập nhiều test, thử code), gắn vào kỳ thi, giám sát điểm code, kết quả + code giống nhau, dọn dẹp & lưu trữ.
const { chromium } = require('playwright');
const path = require('path');
const BASE = 'http://localhost:' + (process.env.PORT || 8772);
(async () => {
  const errors = [], ok = (c, m) => { if (!c) errors.push(m); };
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const a = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  await a.route(/katex|fonts\./, (r) => r.abort());
  a.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const shot = (n) => a.screenshot({ path: path.join(__dirname, 'shots', n + '.png') });
  const idle = async () => { await a.waitForTimeout(120); await a.waitForFunction(() => getComputedStyle(document.getElementById('busy')).display === 'none', null, { timeout: 60000 }); };
  const yes = async () => { await a.waitForSelector('#modal', { state: 'visible' }); await a.click('#modalYes'); };
  const txt = (s) => a.textContent(s);
  const api = (n, ...args) => a.evaluate(([n, args]) => api(n, ...args), [n, args]);

  await a.goto(BASE + '/'); await idle();
  await a.click('text=① Khởi tạo hệ thống'); await idle();
  await a.click('text=② Tạo dữ liệu mẫu'); await yes(); await idle(); await a.waitForTimeout(300); await idle();

  // ---- ⑧ máy chấm + ngân hàng ----
  await a.click('nav >> text=⑧ Lập trình'); await idle();
  ok(/Wandbox/.test(await txt('#jdHint')), 'gợi ý máy chấm Wandbox');
  await a.click('text=🔍 Kiểm tra máy chấm'); await idle();
  const jm = await txt('#jdMsg');
  ok(/✅ Python 3/.test(jm) && /✅ C \(GCC\)/.test(jm), 'kiểm tra máy chấm: ' + jm);
  await a.click('text=Nạp 3 bài mẫu'); await idle(); await a.waitForTimeout(300); await idle();
  ok((await a.$$('#ltTbl tr')).length === 4, 'ngân hàng có 3 bài mẫu');
  await a.fill('#ltFind', 'xâu'); ok((await a.$$('#ltTbl tr')).length === 2, 'tìm theo chủ đề'); await a.fill('#ltFind', '');

  // ---- soạn bài mới kiểu HackerRank ----
  await a.click('text=＋ Bài mới'); await idle();
  await a.fill('#lpMa', 'LT_CHAN'); await a.fill('#lpTen', 'Đếm số chẵn');
  await a.fill('#lpNd', 'Cho $n$ số nguyên. Đếm xem có bao nhiêu số **chẵn**.\n\nVí dụ dùng `n % 2 == 0`.');
  await a.fill('#lpVao', 'Dòng 1: $n$. Dòng 2: $n$ số nguyên.'); await a.fill('#lpRa', 'Một số nguyên.'); await a.fill('#lpRb', '$1 \\le n \\le 10^5$');
  ok(/Đếm số chẵn/.test(await txt('#lpPrev')) && (await a.$$('#lpPrev code.ic')).length === 1 && (await a.$$('#lpPrev b')).length >= 1, 'xem trước đề bài');
  await a.click('#ltEdTabs >> text=2. Test cases');
  await a.fill('#tc0 textarea[data-k="in"]', '4\n1 2 3 4\n'); await a.fill('#tc0 textarea[data-k="out"]', '2\n');
  await a.fill('#tc0 input[data-k="gt"]', 'Có 2 và 4 là số chẵn');
  await a.fill('#tc1 textarea[data-k="in"]', '3\n7 9 11\n');
  await a.click('text=⇪ Dán nhiều test');
  await a.fill('#bkTxt', '5\n2 4 6 8 10\n---\n1\n0\n===\n1\n---\n2\n-2 -3');
  await a.click('#modalYes'); await idle();
  ok((await a.$$('#ltTests .lt-test')).length === 5, 'nhập nhiều test → 5 test');
  await a.click('#ltEdTabs >> text=3. Lời giải');
  await a.fill('#lpLg', 'input()\nprint(sum(1 for x in input().split() if int(x) % 2 == 0))\n');
  await a.click('#ltEdTabs >> text=2. Test cases');
  await a.click('text=⚙ Điền output trống từ lời giải'); await idle(); await a.waitForTimeout(300); await idle();
  const outs = await a.$$eval('#ltTests textarea[data-k="out"]', (l) => l.map((x) => x.value.trim()));
  ok(JSON.stringify(outs) === JSON.stringify(['2', '0', '5', '1', '1']), 'sinh output từ lời giải: ' + JSON.stringify(outs));
  await a.click('text=▶ Kiểm thử đề'); await idle(); await a.waitForTimeout(200);
  ok(/✅ Kiểm thử đạt: 5\/5/.test(await txt('#ltVal')), 'kiểm thử đề: ' + (await txt('#ltVal')).slice(0, 160));
  ok(/ĐẠT/.test(await txt('#ltEdState')), 'trạng thái ĐẠT');
  await shot('a8_editor_tests');
  // lời giải sai → kiểm thử báo lỗi, chỉ ra test sai
  await a.click('#ltEdTabs >> text=3. Lời giải');
  await a.fill('#lpLg', 'input()\nprint(sum(1 for x in input().split() if int(x) % 2 == 1))\n');
  await a.click('text=▶ Kiểm thử đề'); await idle(); await a.waitForTimeout(200);
  ok(/❌ Kiểm thử chưa đạt/.test(await txt('#ltVal')) && /Sai kết quả/.test(await txt('#ltVal')), 'kiểm thử báo sai');
  await a.fill('#lpLg', 'input()\nprint(sum(1 for x in input().split() if int(x) % 2 == 0))\n');
  await a.click('text=▶ Kiểm thử đề'); await idle(); await a.waitForTimeout(200);
  // thử code C
  await a.click('#ltEdTabs >> text=5. Thử code');
  await a.selectOption('#lpTryL', 'c');
  await a.fill('#lpTry', '#include <stdio.h>\nint main(){int n,x,c=0;scanf("%d",&n);while(n--){scanf("%d",&x);if(x%2==0)c++;}printf("%d\\n",c);}');
  await a.fill('#lpTryIn', '3\n2 2 2\n'); await a.click('text=▶ Chạy'); await idle();
  const tv = await txt('#ltVal');
  ok(/Đúng/.test(tv) && /Đã chạy/.test(tv) && /\b3\b/.test(tv), 'thử code C: ' + tv.slice(0, 200));
  await a.click('#ltEdTabs >> text=4. Chấm điểm');
  await a.selectOption('#lpCmp', 'FLOAT'); ok(await a.isVisible('#lpEpsW'), 'hiện ô sai số khi so sánh số thực'); await a.selectOption('#lpCmp', 'TOKEN');
  // thư viện được dùng: Python chỉ math, cấm sorted
  await a.selectOption('#lpTvPyM', 'LIST'); await a.click('#lpTvPyC >> text=+ math'); await a.click('#lpCamC >> text=+ sorted');
  ok(/chỉ math/.test(await txt('#lpTvPrev')) && /sorted/.test(await txt('#lpTvPrev')), 'xem trước quy định thư viện: ' + await txt('#lpTvPrev'));
  ok(/Thư viện được dùng/.test(await txt('#lpPrev')), 'đề xem trước có khung thư viện');
  await a.locator('#ltp-cfg').screenshot({ path: path.join(__dirname, 'shots', 'a8_lib.png') });
  await a.uncheck('#lpC'); await a.click('text=💾 Lưu bài'); await idle(); await a.waitForTimeout(300); await idle();
  ok(/Python 3/.test(await txt('#ltTbl')) && /LT_CHAN/.test(await txt('#ltTbl')), 'bài mới trong ngân hàng');
  const gl = await api('ltGet', 'LT_CHAN');
  ok(gl.tvPy === 'math' && gl.cam === 'sorted', 'lưu quy định thư viện: ' + JSON.stringify([gl.tvPy, gl.tvC, gl.cam]));
  await a.click('#ltEdTabs >> text=5. Thử code'); await a.selectOption('#lpTryL', 'py');
  await a.fill('#lpTry', 'import itertools\nprint(1)'); await a.fill('#lpTryIn', ''); await a.click('text=▶ Chạy'); await idle();
  ok(/Vi phạm quy định thư viện/.test(await txt('#ltVal')) && /itertools/.test(await txt('#ltVal')), 'thử code vi phạm thư viện: ' + (await txt('#ltVal')).slice(0, 160));
  await shot('a8_bank');

  // ---- gắn vào kỳ thi ----
  await a.selectOption('#lxAdd', 'LT_CHAN'); await a.click('#lxBox >> text=＋ Thêm');
  await a.selectOption('#lxAdd', 'LT_TONG'); await a.click('#lxBox >> text=＋ Thêm');
  await a.fill('#lxBox tr:nth-child(3) input[type=number]', '5'); await a.dispatchEvent('#lxBox tr:nth-child(3) input[type=number]', 'change');
  await a.fill('#lxSoLan', '4');
  await a.click('#lxBox >> text=💾 Lưu cấu hình'); await idle();
  ok(/2 bài lập trình, tổng 15 điểm/.test(await txt('#lxMsg')), 'lưu cấu hình kỳ thi: ' + await txt('#lxMsg'));
  await shot('a8_exam');
  // phát đề + 2 thí sinh nộp code giống nhau (qua API phòng thi)
  for (const [n, ...x] of [['generate', 'KT_DEMO'], ['finalize', 'KT_DEMO'], ['assign', 'KT_DEMO', 'NGAU_NHIEN'], ['ptSetup'], ['ptSetUrl', 'https://script.google.com/macros/s/AKfycbADM/exec'], ['ptPublish', 'KT_DEMO', {}], ['ptOpen', 'KT_DEMO', true]]) await api(n, ...x);
  const codes = await fetch(BASE + '/room-codes').then((r) => r.json());
  const room = (n, ...args) => a.evaluate(([n, args]) => new Promise((res) => google.script.run.withSuccessHandler((s) => res(JSON.parse(s))).PT_api(n, args)), [n, args]);
  const code = 'n = int(input())\nprint(sum(1 for v in input().split() if int(v) % 2 == 0))\n';
  for (const c of codes.slice(0, 2)) {
    const L = (await room('login', c.sbd, c.code, '', {})).data; await room('start', L.tok, L.ky, L.sbd);
    const r = await room('submitCode', L.tok, L.ky, L.sbd, { ma: 'LT_CHAN', lang: 'py', code: code.replace(/v/g, c.sbd === codes[0].sbd ? 'v' : 'w') });
    ok(r.ok && r.data.score === 10, 'nộp code ' + c.sbd + ': ' + JSON.stringify(r).slice(0, 200));
    await room('submit', L.tok, L.ky, L.sbd, { seq: 1, a: { L1: { l: 'py', c: code } }, n: 1 });
  }
  // ---- ⑧ bảng xếp hạng trực tiếp ----
  await a.click('nav >> text=⑧ Lập trình'); await idle();
  await a.click('#t-lt >> text=⟳ Cập nhật'); await idle();
  const lb = await txt('#lbBox');
  ok(/2\/2/.test(lb) && /LT_CHAN/.test(lb) && (await a.$$('#lbBox tr')).length >= 3, 'bảng xếp hạng: ' + lb.slice(0, 200));
  await a.locator('#lbBox').scrollIntoViewIfNeeded(); await shot('a8_board');
  // ---- ⑤ giám sát: cột điểm code + bảng điều khiển ----
  await a.click('nav >> text=⑤ Phòng thi web'); await idle(); await a.waitForTimeout(400); await idle();
  await a.waitForSelector('#ptMon table', { timeout: 15000 });
  ok(/<\/> 10đ · 1 lần/.test(await txt('#ptMon')), 'giám sát hiện điểm code');
  await a.click('#ptMon >> tr:has-text("' + codes[0].sbd + '") >> text=⚙ Điều khiển'); await idle();
  ok(/Lập trình/.test(await txt('#modalText')) && /LT_CHAN/.test(await txt('#modalText')), 'bảng điều khiển có phần lập trình');
  await a.click('#modalText >> text=📜 Lịch sử nộp code'); await idle();
  ok(/Đúng/.test(await txt('#ltPkBox')), 'lịch sử nộp code');
  await a.click('#ltPkBox >> text=Code'); ok(/sum\(1 for v/.test(await txt('#ltPkCodeH')), 'xem code lần nộp');
  await shot('a5_panel_lt');
  await a.click('#modalYes');
  // ---- ⑦ thu bài → ⑧ kết quả ----
  await a.click('nav >> text=⑦ Chấm điểm'); await idle();
  await a.click('text=📥 Thu bài phòng thi web & chấm'); await a.waitForTimeout(300); if (await a.isVisible('#modal')) await a.click('#modalYes'); await idle(); await a.waitForTimeout(300); await idle();
  await a.click('nav >> text=⑧ Lập trình'); await idle();
  await a.click('text=Tải kết quả'); await idle();
  const rep = await txt('#lrBox');
  ok(/LT_CHAN/.test(rep) && /giống/i.test(rep), 'kết quả lập trình + nghi giống: ' + rep.slice(0, 300));
  await a.check('#lrSim'); ok((await a.$$('#lrBox tr')).length === 3, 'lọc bài nghi giống');
  await a.click('#lrBox >> text=Xem code >> nth=0'); ok(/sum\(1 for/.test(await txt('#modalText')), 'xem code'); await a.click('#modalYes');
  await shot('a8_report');

  // ---- ⚙ hệ thống ----
  await api('ptClose', 'KT_DEMO');
  await a.click('nav >> text=⚙ Hệ thống'); await idle();
  ok(/File Trung tâm/.test(await txt('#sysKpi')) && /KT_DEMO/.test(await txt('#sysEx')), 'thống kê dung lượng');
  await shot('a9_sys');
  await a.fill('#sysDays', '0'); await a.click('#t-sys button:text-is("Dọn nhật ký")'); await yes(); await idle(); await a.waitForTimeout(200); await idle();
  ok(/Đã xoá \d+ dòng nhật ký Trung tâm, [1-9]\d* dòng nhật ký Phòng thi/.test(await txt('#sysMsg')), 'dọn nhật ký: ' + await txt('#sysMsg'));
  await a.click('#t-sys button:text-is("Dọn bản tự lưu")'); await yes(); await idle(); await a.waitForTimeout(200); await idle();
  ok(/Đã xoá \d+ bản tự lưu/.test(await txt('#sysMsg')), 'dọn tự lưu');
  await a.click('#t-sys button:text-is("Thu gọn")'); await idle(); await a.waitForTimeout(200); await idle();
  ok(/giải phóng/.test(await txt('#sysMsg')), 'thu gọn');
  await a.check('#auOn'); await a.fill('#auKeep', '3'); await a.click('#t-sys >> text=💾 Lưu'); await idle(); await a.waitForTimeout(150);
  ok(/đang bật/.test(await txt('#auLast')), 'bật bảo trì tự động');
  await a.click('text=💾 Sao lưu ngay'); await idle();
  ok(/SaoLuu/.test(await txt('#sysBk')), 'sao lưu');
  await a.click('#sysEx >> tr:has-text("KT_DEMO") >> text=Lưu trữ & xoá…');
  await a.fill('#arOk', 'sai'); await a.click('#modalYes'); await idle(); await a.waitForTimeout(200);
  ok(await a.isVisible('#toast .msg.err'), 'gõ sai mã → báo lỗi');
  await a.click('#sysEx >> tr:has-text("KT_DEMO") >> text=Lưu trữ & xoá…');
  await a.fill('#arOk', 'KT_DEMO'); await a.check('#arHub'); await a.click('#modalYes'); await idle(); await a.waitForTimeout(400); await idle();
  ok(/đã lưu trữ/.test(await txt('#sysMsg')), 'lưu trữ & xoá: ' + await txt('#sysMsg'));
  ok(!/KT_DEMO/.test(await txt('#sysEx')), 'kỳ thi đã xoá khỏi danh sách');
  await browser.close();
  if (errors.length) { console.log('❌ ' + errors.length + ' lỗi:\n - ' + errors.join('\n - ')); process.exit(1); }
  console.log('✅ Quản trị lập trình + hệ thống (Chrome): máy chấm, soạn bài, test, kiểm thử đề, gắn kỳ thi, giám sát, kết quả, dọn dẹp, lưu trữ đều đạt.');
})().catch((e) => { console.error(e); process.exit(1); });
