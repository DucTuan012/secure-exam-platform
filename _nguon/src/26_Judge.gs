/**
 * 26_Judge.gs — MÁY CHẤM LẬP TRÌNH (dùng chung cho Hệ thống Trung tâm VÀ phòng thi — tools/bundle.js nhúng tệp này vào mã phòng thi).
 *
 * Chạy code Python / C qua dịch vụ biên dịch trực tuyến (Apps Script không tự chạy được Python/C):
 *   - wandbox : miễn phí, không cần khoá (mặc định) — https://wandbox.org
 *   - judge0  : Judge0 CE (tự cài, RapidAPI, Sulu…) — url + khoá
 *   - piston  : Piston tự cài — url
 * Mỗi test là 1 lượt chạy, các test chạy SONG SONG (UrlFetchApp.fetchAll).
 * Giới hạn thời gian / bộ nhớ: Judge0 & Piston tự áp; Wandbox & Piston được chèn thêm 1 đoạn đầu chương trình
 * đặt giới hạn CPU (setrlimit) và in thời gian CPU + bộ nhớ ra stderr (dòng "@@PT ms kb"), máy chấm đọc rồi xoá đi.
 *
 * Chỉ dùng JS thuần + UrlFetchApp + Utilities → chạy được ở cả 2 dự án.
 */

var JD_VERDICT = {
  AC: 'Đúng', WA: 'Sai kết quả', TLE: 'Quá thời gian', MLE: 'Quá bộ nhớ', RE: 'Lỗi khi chạy', CE: 'Lỗi biên dịch',
  OK: 'Đã chạy', IE: 'Lỗi máy chấm'
};
var JD_LANGS = { py: 'Python 3', c: 'C (GCC)' };
var JD_MAX_OUT = 65536;       // giữ tối đa 64 KB output mỗi test
var JD_MAX_CODE = 30000;      // code tối đa 30.000 ký tự

/* ----------------------------------------------------------------- so sánh output */

function JD_norm(s) { return String(s == null ? '' : s).replace(/\r\n?/g, '\n'); }
function JD_tokens(s) { return JD_norm(s).split(/\s+/).filter(function (x) { return x !== ''; }); }
/**
 * So sánh output.
 * mode: TOKEN (mặc định — bỏ qua khác biệt khoảng trắng/xuống dòng) · LINE (từng dòng, bỏ khoảng trắng cuối dòng & dòng trống cuối)
 *       EXACT (đúng từng ký tự) · FLOAT (như TOKEN, số thực sai số eps) · NOCASE (như TOKEN, không phân biệt hoa thường)
 */
function JD_compare(expected, actual, mode, eps) {
  mode = String(mode || 'TOKEN').toUpperCase();
  if (mode === 'EXACT') return JD_norm(expected) === JD_norm(actual);
  if (mode === 'LINE') {
    var cut = function (s) { var a = JD_norm(s).split('\n').map(function (x) { return x.replace(/[ \t]+$/, ''); }); while (a.length && a[a.length - 1] === '') a.pop(); return a; };
    var a = cut(expected), b = cut(actual);
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  var x = JD_tokens(expected), y = JD_tokens(actual);
  if (x.length !== y.length) return false;
  var e = Number(eps); if (!(e > 0)) e = 1e-6;
  for (var j = 0; j < x.length; j++) {
    if (x[j] === y[j]) continue;
    if (mode === 'NOCASE' && x[j].toLowerCase() === y[j].toLowerCase()) continue;
    if (mode === 'FLOAT') {
      var p = Number(x[j]), q = Number(y[j]);
      if (x[j] !== '' && y[j] !== '' && isFinite(p) && isFinite(q) && Math.abs(p - q) <= e * Math.max(1, Math.abs(p))) continue;
    }
    return false;
  }
  return true;
}
/** Vị trí khác đầu tiên (để hiển thị cho thí sinh với test mẫu) */
function JD_firstDiff(expected, actual) {
  var a = JD_norm(expected).split('\n'), b = JD_norm(actual).split('\n');
  for (var i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || '').replace(/\s+$/, '') !== (b[i] || '').replace(/\s+$/, '')) return { line: i + 1, exp: a[i] === undefined ? '(hết)' : a[i], got: b[i] === undefined ? '(hết)' : b[i] };
  }
  return null;
}

/* ----------------------------------------------------------------- đoạn đầu chương trình (đo thời gian / bộ nhớ, giới hạn CPU) */

function JD_wrap(lang, code, tl, mlMb, lib) {
  var t = Math.max(1, Math.ceil(Number(tl) || 2));
  if (lang === 'c') {
    // đoạn đo / giới hạn đặt SAU code thí sinh → số dòng, cột và dòng code trích trong thông báo lỗi khớp đúng code thí sinh.
    // Tên biến đều có tiền tố __pt_ để không đụng #define của thí sinh (VD #define m 1000000007).
    var ml = Math.max(32, Number(mlMb) || 256) * 1048576;
    return String(code).replace(/\s*$/, '\n') + '\n#include <stdio.h>\n#include <stdlib.h>\n#include <unistd.h>\n#include <sys/resource.h>\n' +
      'static void __pt_end(void){struct rusage __pt_u;getrusage(RUSAGE_SELF,&__pt_u);fflush(stdout);fprintf(stderr,"\\n@@PT %ld %ld\\n",' +
      '(long)(__pt_u.ru_utime.tv_sec*1000+__pt_u.ru_utime.tv_usec/1000+__pt_u.ru_stime.tv_sec*1000+__pt_u.ru_stime.tv_usec/1000),(long)__pt_u.ru_maxrss);}\n' +
      '__attribute__((constructor)) static void __pt_init(void){struct rlimit __pt_c={' + t + ',' + (t + 1) + '};setrlimit(RLIMIT_CPU,&__pt_c);' +
      'struct rlimit __pt_m={' + ml + 'UL,' + ml + 'UL};setrlimit(RLIMIT_AS,&__pt_m);alarm(' + (t * 3 + 2) + ');atexit(__pt_end);}\n';
  }
  // Python: đúng 1 dòng đầu → lỗi báo "line N" được trừ lại 1
  return 'import resource as __ptR,atexit as __ptA,sys as __ptS;__ptR.setrlimit(__ptR.RLIMIT_CPU,(' + t + ',' + (t + 1) + '));' +
    '__ptA.register(lambda:(__ptS.stdout.flush(),__ptS.stderr.write("\\n@@PT %d %d\\n"%(int((__ptR.getrusage(__ptR.RUSAGE_SELF).ru_utime+__ptR.getrusage(__ptR.RUSAGE_SELF).ru_stime)*1000),__ptR.getrusage(__ptR.RUSAGE_SELF).ru_maxrss))))' + JD_pyHook(lib) + '\n' + code;
}
/* ----------------------------------------------------------------- KIỂM SOÁT THƯ VIỆN & HÀM CẤM */

/**
 * Quy định thư viện của 1 bài: { py: null (không giới hạn) | ['math','sys'] (chỉ các module này; [] = không import gì),
 *                                c: null | ['stdio.h','math.h'], cam: ['sorted','qsort'] }
 * Chuỗi lưu trong sheet: "TAT_CA" / "" = không giới hạn · "KHONG" = không import gì · "math, sys" = danh sách.
 */
function JD_libRules(py, c, cam) {
  var list = function (s, lower) {
    return String(s || '').split(/[\s,;]+/).map(function (x) { x = x.trim(); return lower ? x.toLowerCase() : x; }).filter(Boolean)
      .filter(function (x, i, a) { return a.indexOf(x) === i; });
  };
  var mode = function (s, isC) {
    var u = String(s || '').trim().toUpperCase();
    if (!u || u === 'TAT_CA' || u === '*') return null;
    if (u === 'KHONG') return [];
    return list(s, true).map(function (x) { return isC ? x.replace(/^[<"]|[>"]$/g, '') : x.replace(/\..*$/, ''); });
  };
  var r = { py: mode(py, false), c: mode(c, true), cam: list(cam, false) };
  return r.py === null && r.c === null && !r.cam.length ? null : r;
}
/** Xoá chú thích + nội dung chuỗi (giữ xuống dòng để tính số dòng). f-string giữ nguyên (biểu thức nằm trong ngoặc nhọn). */
function JD_strip(lang, s) {
  s = String(s || '').replace(/\r\n?/g, '\n');
  var out = '', i = 0, n = s.length;
  var blank = function (t) { return t.replace(/[^\n]/g, ' '); };
  while (i < n) {
    var ch = s[i];
    if (lang === 'py') {
      if (ch === '#') { var e = s.indexOf('\n', i); if (e < 0) e = n; out += blank(s.substring(i, e)); i = e; continue; }
      var m = /^([rRbBuUfF]{0,2})("""|'''|"|')/.exec(s.substring(i, i + 5));
      if (m && (m[1] === '' || !/\w/.test(s[i - 1] || ''))) {
        var q = m[2], st = i + m[0].length, j = st;
        while (j < n) {
          if (s[j] === '\\') { j += 2; continue; }
          if (s.substr(j, q.length) === q) break;
          if (q.length === 1 && s[j] === '\n') break;
          j++;
        }
        var closed = j < n && s[j] !== '\n', body = s.substring(st, Math.min(j, n));
        out += s.substring(i, st) + (/f/i.test(m[1]) ? body : blank(body)) + (closed ? q : '');
        i = closed ? j + q.length : j; continue;
      }
    } else {
      if (s.substr(i, 2) === '//') { var e2 = s.indexOf('\n', i); if (e2 < 0) e2 = n; out += blank(s.substring(i, e2)); i = e2; continue; }
      if (s.substr(i, 2) === '/*') { var e3 = s.indexOf('*/', i + 2); e3 = e3 < 0 ? n : e3 + 2; out += blank(s.substring(i, e3)); i = e3; continue; }
      if (ch === '"' || ch === "'") {
        var k = i + 1;
        while (k < n && s[k] !== ch && s[k] !== '\n') { if (s[k] === '\\') k++; k++; }
        var cl = s[k] === ch;
        out += ch + blank(s.substring(i + 1, Math.min(k, n))) + (cl ? ch : ''); i = cl ? k + 1 : k; continue;
      }
    }
    out += ch; i++;
  }
  return out;
}
/** Python: các đường lách quy định (nạp thư viện gián tiếp, gọi hàm cấm qua chuỗi, lấy lại __import__ gốc…). Cấm khi bài có quy định thư viện / tên cấm. */
var JD_PY_DYN = ['__import__', '__builtins__', 'builtins', '__loader__', '__spec__', 'importlib', 'sys.modules', '_getframe', 'meta_path', 'path_hooks',
  'path_importer_cache', 'load_module', 'exec_module', 'find_spec', 'find_module',
  '__subclasses__', '__globals__', '__closure__', '__defaults__', '__kwdefaults__', '__code__', '__mro__', '__bases__', '__base__', '__class__', '__dict__',
  '__getattribute__', '__self__', '__func__', '__reduce__', '__reduce_ex__', '__traceback__', 'f_globals', 'f_locals', 'f_builtins', 'f_back', 'tb_frame', 'gi_frame', 'cr_frame',
  'getattr', 'eval', 'exec', 'compile', 'globals', 'locals', 'vars', 'breakpoint', 'attrgetter', 'methodcaller', 'get_field', 'pickle', 'marshal', 'ctypes', 'runpy', 'codeop'];
/** C: hàm thư viện chuẩn thường gặp → header. Bài giới hạn header mà code gọi / tự khai báo hàm của header khác → vi phạm (chặn lách bằng prototype tự viết). */
var JD_PY_BARE = ['getattr', 'eval', 'exec', 'compile', 'globals', 'locals', 'vars', 'breakpoint'];   // hàm dựng sẵn: chỉ tính khi gọi trần (re.compile vẫn được)
var JD_C_STD = {
  'stdio.h': 'printf scanf puts gets getchar putchar fgets fputs sprintf snprintf sscanf fprintf fscanf getc putc fopen fclose fread fwrite fflush perror vprintf',
  'stdlib.h': 'qsort bsearch abs labs llabs div ldiv lldiv atoi atol atoll atof strtol strtoll strtoul strtoull strtod strtof malloc calloc realloc free rand srand exit abort system getenv',
  'string.h': 'strlen strcpy strncpy strcat strncat strcmp strncmp strchr strrchr strstr strtok strspn strcspn strpbrk memset memcpy memmove memcmp memchr strdup strrev strupr strlwr',
  'math.h': 'sqrt sqrtf sqrtl pow powf fabs floor ceil round lround llround trunc fmod log log10 log2 log1p exp exp2 sin cos tan asin acos atan atan2 sinh cosh tanh hypot cbrt fmin fmax rint',
  'ctype.h': 'isdigit isalpha isalnum isspace isupper islower ispunct isxdigit isprint toupper tolower',
  'time.h': 'time clock difftime mktime localtime gmtime strftime',
  'search.h': 'lsearch lfind tsearch hsearch'
};
/** Kiểm tra code theo quy định thư viện → null (hợp lệ) hoặc {line, msg} */
function JD_libCheck(lang, code, lib) {
  if (!lib) return null;
  var raw = String(code || '').replace(/\r\n?/g, '\n'), s = JD_strip(lang, raw);
  var lineOf = function (idx) { return raw.substring(0, idx).split('\n').length; };
  var bad = function (idx, msg) { return { line: lineOf(idx), msg: 'Dòng ' + lineOf(idx) + ': ' + msg }; };
  var m, re;
  var hasCam = !!(lib.cam && lib.cam.length);
  if (lang === 'py' && lib.py) {
    var ok = lib.py, okTxt = ok.length ? 'chỉ cho dùng ' + ok.join(', ') : 'không cho import thư viện nào';
    re = /(^|[;\n])([ \t]*)import[ \t]+([^\n;]+)/g;
    while ((m = re.exec(s))) {
      var mods = m[3].replace(/[()\\]/g, ' ').split(',');
      for (var a = 0; a < mods.length; a++) {
        var root = mods[a].trim().split(/\s+/)[0].split('.')[0];
        if (root && ok.indexOf(root.toLowerCase()) < 0) return bad(m.index + m[1].length, 'dùng thư viện «' + root + '» — bài này ' + okTxt + '.');
      }
    }
    re = /(^|[;\n])([ \t]*)from[ \t]+([.\w]+)[ \t]+import\b/g;
    while ((m = re.exec(s))) {
      var r2 = m[3].split('.')[0];
      if (r2 === '__future__') continue;
      if (!r2 || ok.indexOf(r2.toLowerCase()) < 0) return bad(m.index + m[1].length, 'dùng thư viện «' + (r2 || m[3]) + '» — bài này ' + okTxt + '.');
    }
  }
  if (lang === 'py' && (lib.py || hasCam)) {
    // các đường lách: nạp thư viện gián tiếp / gọi hàm cấm qua chuỗi / lấy lại hàm gốc — cấm khi bài có quy định
    var okM = lib.py || [], sneaky = JD_PY_DYN.concat(['__pt']), first = null;
    for (var b = 0; b < sneaky.length; b++) {
      if (okM.indexOf(sneaky[b]) >= 0) continue;
      re = sneaky[b] === '__pt' ? /\b__pt\w*/ : new RegExp('(^|[^\\w' + (JD_PY_BARE.indexOf(sneaky[b]) >= 0 ? '.' : '') + '])(' + sneaky[b].replace(/\./g, '\\s*\\.\\s*') + ')(?!\\w)');
      var mm = re.exec(s);
      if (mm) {
        var at0 = sneaky[b] === '__pt' ? mm.index : mm.index + mm[1].length;
        if (!first || at0 < first.at) first = { at: at0, nm: (sneaky[b] === '__pt' ? mm[0] : mm[2]).replace(/\s+/g, '') };   // báo chỗ xuất hiện sớm nhất
      }
    }
    if (first) return bad(first.at, 'không được dùng «' + first.nm + '» — bài có quy định thư viện nên cấm các cách gọi gián tiếp (eval, exec, getattr, globals, __import__, __class__…).');
  }
  if (lang === 'c') {
    re = /(^|\n)[ \t]*#[ \t]*(include_next|include|import)\b/g;
    while ((m = re.exec(s))) {
      var at = m.index + m[1].length, rest = raw.substring(m.index + m[0].length).split('\n')[0];
      if (m[2] !== 'include' && (lib.c || hasCam)) return bad(at, 'không được dùng #' + m[2] + ' — chỉ dùng #include <tên.h>.');
      var inc = /^\s*[<"]([^>"\s]+)[>"]/.exec(rest);
      if (!inc) return bad(at, '#include phải viết dạng #include <tên.h>.');
      if (lib.c && lib.c.indexOf(inc[1].toLowerCase()) < 0)
        return bad(at, '#include <' + inc[1] + '> không được phép — bài này chỉ cho dùng: ' + (lib.c.join(', ') || '(không thư viện nào)') + '.');
    }
    if (lib.c || hasCam) {
      // lách bằng ghép tên macro (a##b), hợp ngữ, nạp hàm động
      var cTricks = [[/##/, '«##» (ghép tên bằng macro)'], [/(^|[^\w])(asm|__asm__|__asm)(?!\w)/, '«asm» (hợp ngữ)'], [/(^|[^\w])(dlsym|dlopen|dlvsym)(?!\w)/, '«dlsym / dlopen» (nạp hàm động)']];
      if (lib.c) cTricks.push([/(^|[^\w])(__builtin_\w+)/, '«__builtin_…» (hàm dựng sẵn của trình biên dịch)']);
      for (var ct = 0; ct < cTricks.length; ct++) {
        var hm = cTricks[ct][0].exec(s);
        if (hm) return bad(hm.index + (hm[2] !== undefined ? hm[1].length : 0), 'không được dùng ' + cTricks[ct][1] + ' trong bài có quy định thư viện.');
      }
    }
    if (lib.c) {
      // gọi / tự khai báo hàm của header không được phép (VD tự viết prototype của qsort khi chỉ cho stdio.h)
      for (var h in JD_C_STD) {
        if (lib.c.indexOf(h) >= 0) continue;
        var fns = JD_C_STD[h].split(' ');
        for (var q = 0; q < fns.length; q++) {
          var fn = fns[q];
          var use = new RegExp('(^|[^\\w.>])' + fn + '\\s*\\(').exec(s);   // gọi hoặc tự khai báo prototype
          if (!use) continue;
          if (new RegExp('(^|[^\\w])' + fn + '\\s*\\([^;{}]*\\)\\s*\\{').test(s)) continue;   // tự cài đặt hàm cùng tên → hợp lệ
          var ui = use.index + use[1].length;
          return bad(ui, 'dùng «' + fn + '» của <' + h + '> — bài này chỉ cho dùng: ' + (lib.c.join(', ') || '(không thư viện nào)') + '. Muốn dùng hãy tự viết hàm này.');
        }
      }
    }
  }
  for (var c = 0; c < (lib.cam || []).length; c++) {
    var w = lib.cam[c].replace(/^\./, ''), rx = new RegExp('(^|[^\\w])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\w)');
    var hit = rx.exec(s);
    if (hit) return bad(hit.index + hit[1].length, 'không được dùng «' + w + '» trong bài này.');
  }
  return null;
}
/** Python bị giới hạn thư viện → chặn cả import động lúc chạy (exec / __import__ từ chuỗi…). Viết trên CÙNG dòng đầu (số dòng lỗi vẫn đúng). */
function JD_pyHook(lib) {
  if (!lib || !lib.py) return '';
  var ok = lib.py.concat(['encodings', 'codecs']);
  return ';import builtins as __ptB,os as __ptO;__ptOK={' + ok.map(function (x) { return JSON.stringify(x); }).join(',') + '}' +
    ';__ptL=__ptO.path.dirname(__ptO.__file__);__ptI=__ptB.__import__;' +
    '__ptB.__import__=lambda n,g=None,l=None,f=(),lv=0,__i=__ptI:__i(n,g,l,f,lv) if (lv or n.partition(".")[0] in __ptOK or n.startswith("_") or ' +
    '__ptS._getframe(1).f_code.co_filename.startswith((__ptL,"<frozen"))) else (_ for _ in ()).throw(ImportError("Thư viện \'"+n+"\' không được dùng trong bài này"))';
}
/** Tách dòng "@@PT ms kb" khỏi stderr; sửa số dòng lỗi Python (do có 1 dòng chèn thêm) */
function JD_unwrap(lang, err) {
  err = JD_norm(err);
  var m = err.match(/\n?@@PT (\d+) (\d+)\n?/), time = null, mem = null;
  if (m) { time = Number(m[1]); mem = Number(m[2]); err = err.replace(m[0], ''); }
  if (lang === 'py') err = err.replace(/(File "[^"]*", line )(\d+)/g, function (_, a, n) { return a + Math.max(1, Number(n) - 1); });
  if (lang === 'c') err = err.replace(/prog\.c:/g, 'main.c:');
  return { err: err.replace(/\s+$/, ''), time: time, mem: mem };
}
function JD_cut(s, n) { s = String(s == null ? '' : s); n = n || JD_MAX_OUT; return s.length > n ? s.substring(0, n) + '\n…(đã cắt bớt)' : s; }

/* ----------------------------------------------------------------- cấu hình máy chấm */

/** cfg = {p:'wandbox'|'judge0'|'piston', url, key} */
function JD_cfg(c) {
  c = c || {};
  var p = String(c.p || 'wandbox').toLowerCase();
  var url = String(c.url || '').replace(/\/+$/, '');
  if (p === 'wandbox' && !url) url = 'https://wandbox.org';
  if (p === 'judge0' && !url) url = 'https://ce.judge0.com';
  return { p: p, url: url, key: String(c.key || '') };
}
function JD_headers(cfg) {
  var h = {};
  if (cfg.p === 'judge0' && cfg.key) {
    if (/rapidapi\.com/i.test(cfg.url)) { h['X-RapidAPI-Key'] = cfg.key; h['X-RapidAPI-Host'] = cfg.url.replace(/^https?:\/\//, '').split('/')[0]; }
    else h['X-Auth-Token'] = cfg.key;
  }
  if (cfg.p === 'piston' && cfg.key) h.Authorization = cfg.key;
  return h;
}
function JD_cacheGet(k) { try { var s = CacheService.getScriptCache().get(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function JD_cachePut(k, v, sec) { try { CacheService.getScriptCache().put(k, JSON.stringify(v), sec || 21600); } catch (e) { } }

/** Chọn trình biên dịch / ngôn ngữ của dịch vụ (dò 1 lần, đệm 6 giờ) */
function JD_runtime(cfg, lang) {
  var key = 'jdrt|' + cfg.p + '|' + cfg.url + '|' + lang, hit = JD_cacheGet(key);
  if (hit) return hit;
  var rt = null;
  if (cfg.p === 'wandbox') {
    var list = JSON.parse(UrlFetchApp.fetch(cfg.url + '/api/list.json', { muteHttpExceptions: true }).getContentText() || '[]');
    var want = lang === 'c' ? /^gcc-(\d+)\.(\d+)\.(\d+)-c$/ : /^cpython-(\d+)\.(\d+)\.(\d+)$/;
    var best = null, bv = -1;
    list.forEach(function (x) {
      var m = String(x.name || '').match(want);
      if (!m) return;
      var v = Number(m[1]) * 1e6 + Number(m[2]) * 1e3 + Number(m[3]);
      if (v > bv) { bv = v; best = x; }
    });
    if (!best) throw new Error('Wandbox không có trình biên dịch ' + JD_LANGS[lang]);
    rt = { name: best.name, ver: String(best.version || best.name) };
  } else if (cfg.p === 'judge0') {
    var res = UrlFetchApp.fetch(cfg.url + '/languages', { headers: JD_headers(cfg), muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Judge0 trả lỗi ' + res.getResponseCode() + ' khi lấy danh sách ngôn ngữ (kiểm tra url / khoá)');
    var langs = JSON.parse(res.getContentText() || '[]'), pick = null, pv = -1;
    langs.forEach(function (x) {
      var n = String(x.name || ''), m = lang === 'c' ? n.match(/^C \(GCC (\d+)\.(\d+)/) : n.match(/^Python \((3)\.(\d+)/);
      if (!m) return;
      var v = Number(m[1]) * 1000 + Number(m[2]);
      if (v > pv) { pv = v; pick = x; }
    });
    if (!pick) throw new Error('Judge0 không có ' + JD_LANGS[lang]);
    rt = { id: pick.id, ver: pick.name };
  } else {
    rt = { name: lang === 'c' ? 'c' : 'python', ver: '*' };
  }
  JD_cachePut(key, rt);
  return rt;
}

/* ----------------------------------------------------------------- chạy */

/** Dựng yêu cầu HTTP cho 1 test */
function JD_request(cfg, rt, lang, code, stdin, lim) {
  var h = JD_headers(cfg);
  if (cfg.p === 'wandbox') {
    var body = { compiler: rt.name, code: JD_wrap(lang, code, lim.tl, lim.ml, lim.lib), stdin: stdin || '', save: false };
    if (lang === 'c') body['compiler-option-raw'] = '-O2\n-std=gnu11\n-lm' + (lim.lib ? '\n-Werror=implicit-function-declaration' : '');
    return { url: cfg.url + '/api/compile.json', method: 'post', contentType: 'application/json', payload: JSON.stringify(body), headers: h, muteHttpExceptions: true };
  }
  if (cfg.p === 'judge0') {
    var b64 = function (s) { return Utilities.base64Encode(String(s || ''), Utilities.Charset.UTF_8); };
    var j = { language_id: rt.id, source_code: b64(lang === 'py' && lim.lib && lim.lib.py ? 'import sys as __ptS' + JD_pyHook(lim.lib) + '\n' + code : code), stdin: b64(stdin), cpu_time_limit: Math.max(0.5, Number(lim.tl) || 2),
      wall_time_limit: Math.max(2, (Number(lim.tl) || 2) * 3), memory_limit: Math.max(32, Number(lim.ml) || 256) * 1024 };
    if (lang === 'c') j.compiler_options = '-O2 -lm' + (lim.lib ? ' -Werror=implicit-function-declaration' : '');
    return { url: cfg.url + '/submissions?base64_encoded=true&wait=true', method: 'post', contentType: 'application/json', payload: JSON.stringify(j), headers: h, muteHttpExceptions: true };
  }
  var p = { language: rt.name, version: '*', files: [{ name: lang === 'c' ? 'main.c' : 'main.py', content: JD_wrap(lang, code, lim.tl, lim.ml, lim.lib) }],
    stdin: stdin || '', compile_timeout: 10000, run_timeout: Math.round((Number(lim.tl) || 2) * 3000), run_memory_limit: -1 };
  return { url: cfg.url + '/api/v2/execute', method: 'post', contentType: 'application/json', payload: JSON.stringify(p), headers: h, muteHttpExceptions: true };
}

/** Đọc kết quả HTTP → {kind:'CE'|'RUN'|'IE', out, err, exit, signal, time(ms), mem(KB), raw} */
function JD_parse(cfg, lang, resp, lim) {
  var code = resp.getResponseCode(), text = resp.getContentText() || '';
  if (code === 429) return { kind: 'IE', err: 'Máy chấm đang quá tải (429) — thử lại sau vài giây.', busy: true };
  if (code < 200 || code >= 300) return { kind: 'IE', err: 'Máy chấm trả lỗi HTTP ' + code + ': ' + text.substring(0, 300), busy: code >= 500 };
  var j; try { j = JSON.parse(text); } catch (e) { return { kind: 'IE', err: 'Máy chấm trả dữ liệu không đọc được: ' + text.substring(0, 200) }; }
  if (cfg.p === 'wandbox') {
    var hasRun = j.program_output !== undefined || j.program_error !== undefined || /@@PT/.test(String(j.program_error || ''));
    var cerr = String(j.compiler_error || '');
    if (!hasRun && (lang === 'c' && /error/i.test(cerr) || String(j.status) !== '0' && cerr)) return { kind: 'CE', err: cerr.replace(/prog\.c:/g, 'main.c:') };
    var u = JD_unwrap(lang, j.program_error || '');
    return { kind: 'RUN', out: String(j.program_output || ''), err: u.err, exit: Number(j.status || 0), signal: String(j.signal || ''), time: u.time, mem: u.mem };
  }
  if (cfg.p === 'judge0') {
    var d = function (s) { try { return s ? Utilities.newBlob(Utilities.base64Decode(String(s).replace(/\s/g, ''))).getDataAsString('UTF-8') : ''; } catch (e) { return String(s || ''); } };
    var sid = j.status ? Number(j.status.id) : 0;
    if (sid === 6) return { kind: 'CE', err: d(j.compile_output) };
    if (sid === 13 || sid === 14 || sid === 1 || sid === 2) return { kind: 'IE', err: 'Judge0: ' + (j.status && j.status.description || 'lỗi') + ' ' + d(j.message) };
    var e0 = d(j.stderr); if (lang === 'py' && lim && lim.lib && lim.lib.py) e0 = e0.replace(/(File "[^"]*", line )(\d+)/g, function (_, a, n) { return a + Math.max(1, Number(n) - 1); });
    return { kind: 'RUN', out: d(j.stdout), err: e0, exit: sid === 3 || sid === 4 ? 0 : (j.exit_code == null ? 1 : Number(j.exit_code)),
      signal: sid === 5 ? 'TLE' : (sid >= 7 && sid <= 12 ? String(j.status.description || 'RE') : ''), time: j.time == null ? null : Math.round(Number(j.time) * 1000), mem: j.memory == null ? null : Number(j.memory) };
  }
  if (j.compile && Number(j.compile.code) !== 0 && j.compile.code != null) return { kind: 'CE', err: String(j.compile.stderr || j.compile.output || '') };
  var r = j.run || {}, w = JD_unwrap(lang, r.stderr || '');
  if (!j.run && j.message) return { kind: 'IE', err: 'Piston: ' + j.message };
  return { kind: 'RUN', out: String(r.stdout || ''), err: w.err, exit: Number(r.code == null ? 0 : r.code), signal: String(r.signal || ''), time: w.time, mem: w.mem };
}

/** Số test gửi cùng lúc tới mỗi loại máy chấm */
var JD_BATCH = { wandbox: 3, piston: 4, judge0: 6 };
/** Lỗi do HẠ TẦNG máy chấm (không phải do code thí sinh) → chạy lại, không tính là "Lỗi khi chạy" */
function JD_infraErr(r) {
  if (!r) return true;
  if (r.kind === 'IE') return !!r.busy;
  if (r.kind !== 'RUN' || r.out) return false;
  return /OCI runtime|crun:|runc:|clone:|Resource temporarily unavailable|cannot fork|fork: retry|failed to create (task|shim|container)|container .*(not running|failed)|Too many open files/i.test(String(r.err || ''));
}

/**
 * Chạy code trên nhiều test.
 * tests: [{in, out?}]  — out bỏ trống = chỉ chạy (không so sánh)
 * lim: {tl giây, ml MB, cmp, eps}
 * → {ok, rt, results:[{v, out, err, time, mem, msg}], ce?: thông báo biên dịch}
 */
function JD_run(cfgIn, lang, code, tests, lim) {
  lang = lang === 'c' ? 'c' : 'py';
  lim = lim || {};
  var cfg = JD_cfg(cfgIn);
  if (!String(code || '').trim()) throw new Error('Chưa có code');
  if (String(code).length > JD_MAX_CODE) throw new Error('Code dài quá ' + JD_MAX_CODE + ' ký tự');
  // vi phạm quy định thư viện / hàm cấm → báo ngay, không gửi máy chấm
  var lv = JD_libCheck(lang, code, lim.lib);
  if (lv) return { ok: true, rt: '', lib: lv.msg, ce: lv.msg, busy: false, results: tests.map(function () { return { v: 'CE', err: lv.msg }; }) };
  var rt = JD_runtime(cfg, lang);
  // Gửi theo từng đợt nhỏ (máy chấm miễn phí như Wandbox từ chối khi nhận quá nhiều lượt cùng lúc:
  // "OCI runtime error: crun: clone: Resource temporarily unavailable"), lỗi hạ tầng của máy chấm thì tự chạy lại test đó.
  var batch = JD_BATCH[cfg.p] || 4, parsed = new Array(tests.length), todo = tests.map(function (_, i) { return i; });
  for (var round = 0; round < 3 && todo.length; round++) {
    if (round) Utilities.sleep(700 * round + Math.floor(Math.random() * 400));
    var size = round ? Math.max(1, Math.floor(batch / 2)) : batch, again = [];
    for (var s = 0; s < todo.length; s += size) {
      var part = todo.slice(s, s + size), resps;
      try { resps = UrlFetchApp.fetchAll(part.map(function (i) { return JD_request(cfg, rt, lang, code, tests[i].in, lim); })); }
      catch (e) { if (round === 2) throw new Error('Không gọi được máy chấm (' + cfg.p + '): ' + (e.message || e)); again = again.concat(part); continue; }
      resps.forEach(function (resp, k) {
        var r = JD_parse(cfg, lang, resp, lim), i = part[k];
        if (JD_infraErr(r)) { again.push(i); r = { kind: 'IE', err: 'Máy chấm ' + cfg.p + ' tạm thời quá tải: ' + JD_cut(r.err || '', 300), busy: true }; }
        parsed[i] = r;
      });
    }
    todo = again;
  }
  var tl = (Number(lim.tl) || 2) * 1000, mlKb = (Number(lim.ml) || 256) * 1024, ce = null, busy = false;
  var results = tests.map(function (t, i) {
    var r = parsed[i];
    if (r.busy) busy = true;
    if (r.kind === 'CE') { ce = ce || r.err; return { v: 'CE', err: JD_cut(r.err, 8000) }; }
    if (r.kind === 'IE') return { v: 'IE', err: r.err };
    var v;
    // Python: lỗi cú pháp coi như lỗi biên dịch (giống các hệ thống chấm phổ biến)
    if (lang === 'py' && !r.out && /^(\s*File[^\n]*\n)?[\s\S]*?(SyntaxError|IndentationError|TabError)/.test(r.err) && r.exit !== 0) { ce = ce || r.err; return { v: 'CE', err: JD_cut(r.err, 8000) }; }
    if (/TLE|CPU time|Alarm|SIGXCPU|SIGALRM|time limit/i.test(r.signal) || (r.time != null && r.time > tl)) v = 'TLE';
    else if (r.mem != null && r.mem > mlKb) v = 'MLE';
    else if (/Killed|SIGKILL/i.test(r.signal) && r.mem != null && r.mem > mlKb * 0.9) v = 'MLE';
    else if (r.exit !== 0 || r.signal) v = /MemoryError|bad_alloc|Cannot allocate/i.test(r.err) ? 'MLE' : 'RE';
    else if (t.out === undefined || t.out === null) v = 'OK';
    else v = JD_compare(t.out, r.out, lim.cmp, lim.eps) ? 'AC' : 'WA';
    return { v: v, out: JD_cut(r.out), err: JD_cut(r.err, 8000), time: r.time, mem: r.mem, signal: r.signal || '' };
  });
  return { ok: true, rt: rt.ver, results: results, ce: ce ? JD_cut(ce, 8000) : null, busy: busy };
}

/** Điểm 1 bài từ kết quả: cham = 'TUNG_TEST' (theo trọng số test) | 'TAT_CA' (đúng hết mới có điểm) */
function JD_score(results, weights, diem, cham) {
  var tot = 0, got = 0, all = true;
  results.forEach(function (r, i) {
    var w = Number(weights[i]); if (!(w >= 0)) w = 1;
    tot += w;
    if (r.v === 'AC') got += w; else all = false;
  });
  var max = Number(diem) || 0;
  if (String(cham || '').toUpperCase() === 'TAT_CA') return all && results.length ? max : 0;
  return tot > 0 ? Math.round(max * got / tot * 100) / 100 : (all && results.length ? max : 0);
}

/* ----------------------------------------------------------------- phát hiện code giống nhau */

/** Chuẩn hoá code: bỏ chú thích, chuỗi → S, số → N, tên biến → V (giữ từ khoá) → dãy token */
function JD_fingerprint(code, lang) {
  var kw = lang === 'c'
    ? 'int long short char float double void unsigned signed if else for while do return break continue switch case default struct typedef sizeof const static include define printf scanf malloc free'
    : 'def return if elif else for while in and or not is import from as class try except finally with lambda yield pass break continue print input range len int str float list dict set True False None';
  var K = {}; kw.split(' ').forEach(function (w) { K[w] = 1; });
  var s = String(code || '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
  if (lang !== 'c') s = s.replace(/#[^\n]*/g, ' ');
  s = s.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, ' S ');
  var toks = s.match(/[A-Za-z_]\w*|\d+(?:\.\d+)?|==|!=|<=|>=|\+\+|--|&&|\|\||[^\s\w]/g) || [];
  return toks.map(function (t) { return /^\d/.test(t) ? 'N' : /^[A-Za-z_]/.test(t) ? (K[t] ? t : 'V') : t; });
}
/** Độ giống (0..1) giữa 2 code: Jaccard của các dãy 5 token liên tiếp */
function JD_similar(a, b, lang) {
  var g = function (toks) { var m = {}; for (var i = 0; i + 5 <= toks.length; i++) m[toks.slice(i, i + 5).join(' ')] = 1; return m; };
  var A = g(JD_fingerprint(a, lang)), B = g(JD_fingerprint(b, lang));
  var ka = Object.keys(A), kb = Object.keys(B);
  if (ka.length < 8 || kb.length < 8) return 0;
  var inter = 0; ka.forEach(function (k) { if (B[k]) inter++; });
  return inter / (ka.length + kb.length - inter);
}
