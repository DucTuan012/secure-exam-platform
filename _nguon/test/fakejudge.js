// Máy chấm GIẢ LẬP Wandbox / Judge0 / Piston cho kiểm thử: chạy THẬT python3 / gcc trên máy kiểm thử,
// trả về đúng định dạng JSON của dịch vụ → kiểm thử được toàn bộ đường đi của máy chấm (giới hạn CPU, đo thời gian, lỗi biên dịch…).
const cp = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const SIG = { SIGXCPU: 'CPU time limit exceeded', SIGALRM: 'Alarm clock', SIGKILL: 'Killed', SIGSEGV: 'Segmentation fault', SIGABRT: 'Aborted', SIGFPE: 'Floating point exception' };
const stats = { calls: 0, byProvider: {} };

function runLocal(lang, code, stdin, copts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fj-'));
  try {
    if (lang === 'c') {
      fs.writeFileSync(path.join(dir, 'prog.c'), code);
      const c = cp.spawnSync('gcc', ['prog.c', '-o', 'prog'].concat(copts || ['-O2', '-std=gnu11', '-lm']), { cwd: dir, encoding: 'utf8' });
      if (c.status !== 0) return { compileFail: true, cerr: c.stderr };
      const r = cp.spawnSync('./prog', [], { cwd: dir, input: stdin || '', encoding: 'utf8', timeout: 15000, maxBuffer: 1 << 24 });
      return { out: r.stdout, err: r.stderr, status: r.status, signal: r.signal, cwarn: c.stderr };
    }
    fs.writeFileSync(path.join(dir, 'prog.py'), code);
    const r = cp.spawnSync('python3', ['prog.py'], { cwd: dir, input: stdin || '', encoding: 'utf8', timeout: 15000, maxBuffer: 1 << 24 });
    return { out: r.stdout, err: r.stderr, status: r.status, signal: r.signal };
  } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { } }
}
function resp(code, obj) { const t = typeof obj === 'string' ? obj : JSON.stringify(obj); return { getResponseCode: () => code, getContentText: () => t }; }

function handle(req) {
  const url = typeof req === 'string' ? req : req.url;
  stats.calls++;
  if (/wandbox.*\/api\/list\.json/.test(url)) {
    return resp(200, [{ name: 'gcc-13.2.0-c', version: '13.2.0', language: 'C' }, { name: 'gcc-head-c', version: 'x', language: 'C' }, { name: 'gcc-12.3.0-c', version: '12.3.0', language: 'C' },
      { name: 'cpython-3.13.8', version: '3.13.8', language: 'Python' }, { name: 'cpython-head', version: '', language: 'Python' }, { name: 'cpython-3.12.7', version: '3.12.7', language: 'Python' }]);
  }
  if (/wandbox.*\/api\/compile\.json/.test(url)) {
    if (fakejudge.down) return resp(503, 'down');
    if (fakejudge.oci > 0) { fakejudge.oci--; return resp(200, { status: '1', signal: '', compiler_error: '', program_output: '', program_error: 'Error: OCI runtime error: crun: clone: Resource temporarily unavailable\n' }); }
    const b = JSON.parse(req.payload), lang = /^gcc/.test(b.compiler) ? 'c' : 'py';
    const r = runLocal(lang, b.code, b.stdin, String(b['compiler-option-raw'] || '').split('\n').filter(Boolean));
    if (r.compileFail) return resp(200, { status: '1', compiler_error: r.cerr, compiler_message: r.cerr });
    return resp(200, { status: String(r.status == null ? '' : r.status), signal: r.signal ? (SIG[r.signal] || r.signal) : '', compiler_error: r.cwarn || '',
      program_output: r.out, program_error: r.err, program_message: r.out + r.err });
  }
  if (/\/languages$/.test(url)) return resp(200, [{ id: 50, name: 'C (GCC 9.2.0)' }, { id: 103, name: 'C (GCC 14.1.0)' }, { id: 71, name: 'Python (3.8.1)' }, { id: 100, name: 'Python (3.12.5)' }]);
  if (/\/submissions\?/.test(url)) {
    const b = JSON.parse(req.payload), lang = b.language_id === 103 || b.language_id === 50 ? 'c' : 'py';
    const dec = (s) => Buffer.from(String(s || ''), 'base64').toString('utf8'), enc = (s) => Buffer.from(String(s || ''), 'utf8').toString('base64');
    const t0 = Date.now(), r = runLocal(lang, dec(b.source_code), dec(b.stdin), ['-O2', '-lm']), ms = Date.now() - t0;
    if (r.compileFail) return resp(201, { status: { id: 6, description: 'Compilation Error' }, compile_output: enc(r.cerr) });
    let sid = 3;
    if (r.signal === 'SIGTERM' || ms > b.cpu_time_limit * 1000 + 800) sid = 5; else if (r.signal) sid = 11; else if (r.status !== 0) sid = 12;
    return resp(201, { status: { id: sid, description: sid === 3 ? 'Accepted' : sid === 5 ? 'Time Limit Exceeded' : 'Runtime Error' }, stdout: enc(r.out), stderr: enc(r.err),
      time: String(ms / 1000), memory: 3000, exit_code: r.status });
  }
  if (/\/api\/v2\/execute/.test(url)) {
    const b = JSON.parse(req.payload), lang = b.language === 'c' ? 'c' : 'py';
    const r = runLocal(lang, b.files[0].content, b.stdin);
    if (r.compileFail) return resp(200, { compile: { code: 1, stderr: r.cerr }, run: {} });
    return resp(200, { run: { stdout: r.out, stderr: r.err, code: r.status, signal: r.signal || null } });
  }
  return null;
}

const fakejudge = {
  stats, down: false, oci: 0,
  /** Gắn vào UrlFetchApp giả (giữ nguyên các URL khác) */
  install(UrlFetchApp) {
    const f0 = UrlFetchApp.fetch.bind(UrlFetchApp);
    UrlFetchApp.fetch = (url, opt) => handle(Object.assign({ url }, opt || {})) || f0(url, opt);
    UrlFetchApp.fetchAll = (reqs) => { stats.maxBatch = Math.max(stats.maxBatch || 0, reqs.length); return reqs.map((q) => handle(q) || f0(q.url, q)); };
    return UrlFetchApp;
  }
};
module.exports = fakejudge;
