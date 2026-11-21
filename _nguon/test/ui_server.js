// Máy chủ thử giao diện: phục vụ Index.html + giả lập google.script.run gọi API_call trên môi trường mô phỏng
const http = require('http');
const fs = require('fs');
const path = require('path');
const { load } = require('./load');
const { makeEnv } = require('./mocks');

const vm = require('vm');
require('../tools/bundle')();
const env = makeEnv();
const files = fs.readdirSync(path.join(__dirname, '..', 'src')).filter((f) => f.endsWith('.gs')).sort();
const G = load(files, env);
env._newHub();
const fj = require('./fakejudge'); fj.install(env.UrlFetchApp);   // máy chấm giả lập (chạy python3 / gcc thật)
let R = null; // dự án Phòng thi (ngữ cảnh riêng)
const realFetch = env.UrlFetchApp.fetch.bind(env.UrlFetchApp);
env.UrlFetchApp.fetch = (url, o) => /\?ping=1/.test(url) ? { getResponseCode: () => 200, getContentText: () => room().doGet({ parameter: { ping: '1' } }).s } : realFetch(url, o);
function room() {
  if (R) return R;
  const ss = env.SpreadsheetApp.openById(G.PTA_roomId());
  R = vm.createContext(Object.assign({}, env, { console, ScriptApp: { getService: () => ({ getUrl: () => '' }) }, SpreadsheetApp: Object.assign({}, env.SpreadsheetApp, { getActiveSpreadsheet: () => ss }) }));
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'phongthi', 'PhongThi.gs'), 'utf8'), R);   // bộ khởi động
  return R;
}

const shim = `<script>
window.google = { script: { run: (function mk(ok, fail) {
  return new Proxy({}, { get(_, k) {
    if (k === 'withSuccessHandler') return (f) => mk(f, fail);
    if (k === 'withFailureHandler') return (f) => mk(ok, f);
    return (...args) => fetch('/api', { method: 'POST', body: JSON.stringify({ fn: k, args }) })
      .then((r) => r.text()).then((t) => ok && ok(t)).catch((e) => fail && fail(e));
  } });
})(),
  // giả lập google.script.history / google.script.url (đổi tham số trên địa chỉ trang)
  history: { replace: (st, p) => { const q = new URLSearchParams(p || {}).toString(); window.history.replaceState(null, '', location.pathname + (q ? '?' + q : '')); } },
  url: { getLocation: (cb) => { const o = {}; new URLSearchParams(location.search).forEach((v, k) => (o[k] = v)); setTimeout(() => cb({ parameter: o }), 0); } }
} };
</script>`;

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api') {
    let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
      const { fn, args } = JSON.parse(b);
      if (fn === 'PT_api' && R) R.CacheService.getScriptCache()._m.forEach((v, k) => { if (k.startsWith('ex|')) R.CacheService.getScriptCache()._m.delete(k); });
      const out = fn === 'PT_api' ? room().PT_api.apply(null, args) : G[fn].apply(null, args);
      res.end(out);
    }); return;
  }
  if (req.method === 'POST' && req.url === '/seed-aig') {
    G.Setup_init(); G.Setup_sample();
    const mon = G.Setup_createSubject('AIG', 'Đầu vào AIG');
    const bss = env.SpreadsheetApp.openById(mon.id);
    const names = ['Đại số tuyến tính', 'Giải tích', 'Xác suất thống kê', 'Lập trình Python', 'Nhập môn AI', 'Toán ứng dụng AI'];
    G.S_writeAll(bss, 'DanhMuc', names.map((n, k) => ({ MaChuDe: 'AIG-C' + (k + 1), Khoi_CapDo: 'Đầu vào', Chuong: 'C' + (k + 1) + '. ' + n, ChuDe: n })));
    const hub = G.S_hub();
    const P = (ph, ten, d, n, dg) => ({ MaMaTran: 'MT_AIG1', MaMon: 'AIG', TenMaTran: 'Đầu vào AIG lần 1', Phan: ph, TenPhan: ten, DiemPhan: d, TongSoCau: n, DangCauChoPhep: dg });
    G.S_append(hub, 'MaTran_Phan', [P('I', 'Trắc nghiệm', 60, 24, 'MOT_DA,NHIEU_DA'), P('II', 'Đúng/Sai', 24, 6, 'DUNG_SAI'), P('III', 'Trả lời ngắn', 16, 4, 'TRA_LOI_NGAN')]);
    const cells = [];
    for (let k = 1; k <= 6; k++) cells.push({ Phan: 'I', Chuong: 'C' + k, MucDo: 'NB', SoCau: 1 }, { Phan: 'I', Chuong: 'C' + k, MucDo: 'TH', SoCau: 2 }, { Phan: 'I', Chuong: 'C' + k, MucDo: 'VD', SoCau: 1 }, { Phan: 'II', Chuong: 'C' + k, SoCau: 1 });
    [1, 2, 3, 6].forEach((k) => cells.push({ Phan: 'III', Chuong: 'C' + k, MucDo: 'VD', SoCau: 1 }));
    G.S_append(hub, 'MaTran_ChiTiet', cells.map((c) => Object.assign({ MaMaTran: 'MT_AIG1' }, c)));
    res.end(mon.id); return;
  }
  if (req.method === 'POST' && req.url === '/seed-lt') {
    // kỳ thi KT_DEMO: trắc nghiệm mẫu + 2 bài lập trình (Python & C), phát lên phòng thi và mở
    const call = (n, ...a) => { const r = JSON.parse(G.API_call(n, a)); if (!r.ok) throw new Error(n + ': ' + r.error); return r.data; };
    call('setup'); call('sample'); call('ltSample');
    { const g = call('ltGet', 'LT_TONG'); call('ltSave', Object.assign({}, g, { tvPy: 'KHONG', tvC: 'stdio.h', cam: 'eval' })); }
    call('ltExamSave', 'KT_DEMO', { bai: [{ ma: 'LT_TONG', diem: 5 }, { ma: 'LT_DAO_CHUOI', diem: 5 }], nn: ['py', 'c'], soLan: 5, tinh: 'CAO_NHAT', tuCham: true, giayChay: 2 });
    call('generate', 'KT_DEMO'); call('finalize', 'KT_DEMO'); call('assign', 'KT_DEMO', 'NGAU_NHIEN');
    call('ptSetup'); call('ptSetUrl', 'https://script.google.com/macros/s/AKfycbLTUI/exec');
    call('ptPublish', 'KT_DEMO', { dangNhapLai: 'CHO_PHEP', chongAI: 'BAO' }); call('ptOpen', 'KT_DEMO', true);
    res.end('ok'); return;
  }
  if (req.method === 'GET' && req.url.startsWith('/bank-rows')) {
    const id = G.Repo_subject('AIG').id;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(G.S_read(env.SpreadsheetApp.openById(id), 'CauHoi'))); return;
  }
  if (req.method === 'POST' && req.url === '/submit') {
    // nộp bài thử cho mọi thí sinh: đúng hết với SV001, sai một nửa với người khác
    const items = G.Repo_items('KT_DEMO'), vrows = G.Repo_variantRows('KT_DEMO'), st = G.Repo_students('KT_DEMO');
    st.slice(0, 5).forEach((s, si) => {
      const v = vrows.find((x) => String(x.MaDe) === s.MaDe);
      const a = {}; a[v.ItemIdSBD] = s.SBD; a[v.ItemIdHoTen] = s.HoTen;
      items.filter((x) => x.MaDe === s.MaDe).forEach((x, i) => {
        const k = String(x.DapAnMaDe), wrong = si > 0 && (i + si) % 3 === 0;
        if (x.DangCau === 'MOT_DA') a[x.FormItemId] = (wrong ? (k === 'A' ? 'B' : 'A') : k) + '. t';
        if (x.DangCau === 'NHIEU_DA') a[x.FormItemId] = (wrong ? ['A'] : k.split(',')).map((L) => L + '. t');
        if (x.DangCau === 'DUNG_SAI') a[x.FormItemId] = k.split(',').map((b, j) => ((b === 'Đ') !== (wrong && j === 0) ? G.GR_TRUE_LABEL : G.GR_FALSE_LABEL));
        if (x.DangCau === 'GHEP_NOI') a[x.FormItemId] = k.split(',').map((p) => (wrong ? '9' : p.split('-')[1]));
        if (x.DangCau === 'TRA_LOI_NGAN') a[x.FormItemId] = wrong ? '0' : k.split('|')[0].trim();
      });
      env.FormApp.openById(v.FormId)._submit(a, new Date(Date.now() - (5 - si) * 60000));
    });
    res.end('ok'); return;
  }
  if (req.url === '/room-codes') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(G.S_read(env.SpreadsheetApp.openById(G.PTA_roomId()), 'ThiSinh').map((s) => ({ sbd: s.SBD, code: s.MaTruyCap, md: s.MaDe })))); return;
  }
  if (req.url === '/room-answers') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(G.Repo_items('KT_DEMO').map((x) => ({ md: x.MaDe, stt: x.STT, dang: x.DangCau, key: x.DapAnMaDe })))); return;
  }
  if (req.url.startsWith('/thi')) {
    const page = room().doGet({ parameter: {} });   // HTML do bộ khởi động nạp từ sheet MaNguon (đúng đường đi thật)
    const raw = page.getContent ? page.getContent() : (page.html || page.s || '');
    const html = String(raw).replace("<script>\n'use strict';", shim + "\n<script>\n'use strict';");
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html); return;
  }
  if (req.url.startsWith('/nhap')) {
    const mon = (req.url.match(/mon=(\w+)/) || [])[1] || '';
    const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'NhapCau.html'), 'utf8')
      .replace('<?!= parserSrc ?>', () => G.PQ_clientSource()).replace('<?= mon ?>', mon)
      .replace('<script>\n<?', shim + '\n<script>\n<?').replace('<script>\nvar PQ_MARK', shim + '\n<script>\nvar PQ_MARK');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html); return;
  }
  let html = fs.readFileSync(path.join(__dirname, '..', 'src', 'Index.html'), 'utf8')
    .replace(/<\?= appName \?>/g, 'Hệ thống Ngân hàng đề & Thi trắc nghiệm').replace(/<\?= version \?>/g, '1.0.0')
    .replace('<script>\nconst S =', shim + '\n<script>\nconst S =');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
}).listen(Number(process.env.PORT || 8765), () => console.log('UI test server on ' + (process.env.PORT || 8765)));
