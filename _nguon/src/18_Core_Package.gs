/**
 * 18_Core_Package.gs — PHÒNG THI WEB: phần THUẦN (test được bằng Node)
 *
 *  - Cấu trúc file dữ liệu phòng thi (PhongThi_DuLieu) dùng chung với dự án Apps Script "Phòng thi".
 *  - Đóng gói đề cho thí sinh (KHÔNG chứa đáp án).
 *  - Chuyển bài làm web → định dạng của bộ chấm hiện có (Grade_submission).
 *  - Đọc bài làm trên giấy nhập tay (phương án dự phòng).
 *  - Sinh file cấu hình Safe Exam Browser (.seb, dạng plist XML).
 */

/** Tên sheet trong file dữ liệu phòng thi */
var RSH = { KY_THI: 'KyThi', THI_SINH: 'ThiSinh', GOI_DE: 'GoiDe', BAI_LAM: 'BaiLam', NHAT_KY: 'NhatKy', HUONG_DAN: 'HuongDan', LT_TEST: 'LT_Test', LT_NOP: 'LT_Nop' };

/** Cột ThiSinh: [nhận dạng] + [cột do PHÒNG THI ghi] + [cột do GIÁM THỊ ghi] — hai phía không ghi đè lên nhau */
var R_ST_ID = ['MaKyThi', 'SBD', 'HoTen', 'Lop', 'MaDe', 'MaTruyCap'];
var R_ST_ROOM = ['TrangThai', 'Token', 'BatDau', 'SoLanVao', 'TrinhDuyet', 'SEB', 'NopLuc', 'LanCuoi', 'DaLam', 'ViPham', 'ViPhamMoc', 'LenhDaXuLy', 'SebKey', 'SebVer', 'ManHinh', 'LtDiem', 'NghiTD', 'NghiMuc', 'NghiLyDo'];
var R_ST_ADMIN = ['ThemPhut', 'Lenh', 'LenhGiaTri', 'LenhId', 'GhiChu', 'CamThi', 'LyDoCam', 'DungLuc', 'DungMs', 'VuotHen'];

var RHEADERS = {};
RHEADERS[RSH.KY_THI] = ['MaKyThi', 'TenKyThi', 'DonVi', 'MaMon', 'TrangThai', 'ThoiGianPhut', 'TinhGio', 'MoLuc', 'DongLuc', 'HenDong',
  'MaPhong', 'BatBuocSEB', 'KhoaUA', 'DangNhapLai', 'ViPhamToiDa', 'ThongBao', 'HuongDan', 'PhienBanGoi', 'SoCau', 'TongDiem',
  'ThoatURL', 'SebXml', 'CapNhat', 'SebKeyChuan', 'SebXml2', 'SebXml3', 'SebXml4', 'HenCung', 'ClbTen', 'ClbKhau', 'ClbLogo', 'ClbMau', 'NghiemNgat', 'MaMoKhoa', 'LapTrinh', 'TinHieu', 'ChongAI'];
RHEADERS[RSH.THI_SINH] = R_ST_ID.concat(R_ST_ROOM, R_ST_ADMIN);
RHEADERS[RSH.GOI_DE] = ['MaKyThi', 'MaDe', 'PhienBan', 'Manh', 'DuLieu'];
RHEADERS[RSH.BAI_LAM] = ['ThoiGian', 'MaKyThi', 'SBD', 'MaDe', 'Loai', 'Seq', 'SoCauDaLam', 'TraLoi', 'MaXacNhan', 'TraLoi2'];
RHEADERS[RSH.LT_TEST] = ['MaKyThi', 'MaBai', 'STT', 'Input', 'Output', 'Mau', 'Diem'];
RHEADERS[RSH.LT_NOP] = ['ThoiGian', 'MaKyThi', 'SBD', 'MaBai', 'NgonNgu', 'Loai', 'Code', 'KetQua', 'Diem', 'DiemToiDa'];
RHEADERS[RSH.NHAT_KY] = ['ThoiGian', 'MaKyThi', 'SBD', 'SuKien', 'ChiTiet'];

/** Trạng thái thí sinh trên phòng thi */
var R_TT = { CHUA_VAO: 'CHUA_VAO', CHO: 'CHO', DANG_LAM: 'DANG_LAM', KHOA: 'KHOA', DA_NOP: 'DA_NOP', CAM: 'CAM' };
/** Sự kiện được tính là vi phạm (rời khỏi bài thi) */
var R_VI_PHAM = ['ROI_TAB', 'ROI_CUA_SO', 'THOAT_TOAN_MAN'];
var R_OFFLINE_MS = 150 * 1000;   // không nhận tín hiệu quá 2,5 phút → "mất kết nối"
var R_GRACE_SUBMIT = 5 * 60 * 1000;

function PK_hint(dang) {
  return {
    MOT_DA: 'Chọn 1 đáp án đúng.',
    NHIEU_DA: 'Chọn TẤT CẢ đáp án đúng (đúng đủ mới được điểm).',
    DUNG_SAI: 'Chọn Đúng hoặc Sai cho TỪNG ý (đúng tất cả các ý mới được điểm).',
    GHEP_NOI: 'Với mỗi ý bên trái, chọn số thứ tự của mục bên phải.',
    TRA_LOI_NGAN: 'Chỉ ghi kết quả cuối cùng; số thập phân dùng dấu chấm hoặc phẩy.'
  }[dang] || '';
}

/**
 * Đóng gói một mã đề cho thí sinh.
 * @param o {exRow, cfg, sections, items (dòng DeThi của mã đề), bank, maDe, bilingual, media(ref)->{src}|{err}, withKey}
 * withKey = true chỉ dùng cho bản in của giáo viên (KHÔNG BAO GIỜ gửi bản có đáp án cho phòng thi).
 */
function PK_build(o) {
  var items = o.items.slice().sort(function (a, b) { return Number(a.STT) - Number(b.STT); });
  var bank = o.bank, bi = !!o.bilingual, warnings = [];
  var tr = function (v) { return bi ? U_str(v) : ''; };
  var med = function (refs) {
    return (refs || []).map(function (ref) {
      var r = o.media ? o.media(ref) : { err: 'không tải ảnh' };
      if (r && r.err) warnings.push('Ảnh ' + ref + ': ' + r.err);
      return r && r.src ? { t: 'img', src: r.src } : { t: 'img', err: (r && r.err) || 'lỗi ảnh' };
    });
  };
  var groups = {}, out = [];
  items.forEach(function (it) {
    var q = bank.questions[it.MaCH];
    if (!q) throw new Error('Câu ' + it.MaCH + ' (mã đề ' + o.maDe + ') không còn trong ngân hàng');
    var perm = U_str(it.ThuTu) ? U_str(it.ThuTu).split(',') : q.options.map(function (x) { return x.key; });
    var x = {
      k: 'S' + Number(it.STT), stt: Number(it.STT), phan: U_str(it.Phan), dang: q.dang, vi: q.vi, en: tr(q.en),
      latex: q.latex, media: med(q.hinh), video: U_str(q.video), audio: U_str(q.amThanh), g: q.maNhom || '',
      opts: q.dang === DANG.TRA_LOI_NGAN ? [] : perm.map(function (L) {
        var op = q.options[U_letterIndex(L)] || { vi: '?', en: '' };
        return { vi: op.vi, en: tr(op.en) };
      }),
      right: (q.right || []).map(function (r) { return { vi: r.vi, en: tr(r.en) }; })
    };
    if (o.withKey) { x.key = U_str(it.DapAnMaDe); x.maCH = U_str(it.MaCH); x.mucDo = U_str(it.MucDo); }
    if (q.maNhom && bank.groups[q.maNhom]) {
      var g = groups[q.maNhom];
      if (!g) {
        var gb = bank.groups[q.maNhom];
        g = groups[q.maNhom] = { vi: gb.vi, en: tr(gb.en), latex: gb.latex, media: med(gb.hinh), video: U_str(gb.video), audio: U_str(gb.amThanh), from: x.stt, to: x.stt };
      }
      g.from = Math.min(g.from, x.stt); g.to = Math.max(g.to, x.stt);
    }
    out.push(x);
  });
  var secs = o.sections.map(function (s) {
    var n = out.filter(function (x) { return x.phan === String(s.phan); }).length;
    var dangs = {};
    out.forEach(function (x) { if (x.phan === String(s.phan)) dangs[x.dang] = true; });
    return { phan: String(s.phan), ten: s.ten, diem: Number(s.diem), n: n, moiCau: n ? U_round(Number(s.diem) / n, 3) : 0,
      dangs: Object.keys(dangs) };
  }).filter(function (s) { return s.n > 0; });
  var cfg = o.cfg || {}, ex = o.exRow || {};
  return {
    v: 1, maKyThi: U_str(ex.MaKyThi), ten: U_str(ex.TenKyThi), donVi: U_str(cfg.TEN_DON_VI), maDe: String(o.maDe),
    thoiGian: U_num(ex.ThoiGianPhut, 0), tongDiem: secs.reduce(function (a, s) { return a + s.diem; }, 0), soCau: out.length,
    sections: secs, items: out, groups: groups, hints: Object.keys(DANG).reduce(function (m, k) { m[k] = PK_hint(k); return m; }, {}),
    warnings: warnings
  };
}

/** Cắt chuỗi dài thành các mảnh (ô Google Sheets chứa tối đa 50.000 ký tự) */
function PK_chunks(s, size) {
  s = String(s); size = size || 45000;
  var out = [];
  for (var i = 0; i < s.length; i += size) out.push(s.substring(i, i + size));
  return out.length ? out : [''];
}

/** Dòng DeThi → bản sao dùng khoá câu trả lời 'S<STT>' cho bộ chấm */
function PK_webItems(items) {
  return items.map(function (it) {
    var o = {};
    Object.keys(it).forEach(function (k) { o[k] = it[k]; });
    o.FormItemId = 'S' + Number(it.STT);
    return o;
  });
}

/**
 * Bài làm web (ký hiệu HIỂN THỊ): {S1:'B', S2:['A','C'], S3:['Đ','S',null,'Đ'], S4:[2,1,3], S5:'3,14'}
 * → câu trả lời theo định dạng Google Form mà Grade_toOriginal hiểu được.
 */
function PK_toGradeAnswers(web, items) {
  var a = {};
  web = web || {};
  items.forEach(function (it) {
    var k = 'S' + Number(it.STT), v = web[k];
    if (v === undefined || v === null || v === '') return;
    switch (U_str(it.DangCau)) {
      case DANG.MOT_DA: a[k] = U_upper(Array.isArray(v) ? v[0] : v); break;
      case DANG.NHIEU_DA: a[k] = (Array.isArray(v) ? v : String(v).split(',')).map(U_upper).filter(String); break;
      case DANG.DUNG_SAI: a[k] = (Array.isArray(v) ? v : []).map(function (x) {
        var s = U_upper(x);
        return s === 'Đ' || s === 'D' || s === 'TRUE' ? GR_TRUE_LABEL : (s === 'S' || s === 'FALSE' ? GR_FALSE_LABEL : '');
      }); break;
      case DANG.GHEP_NOI: a[k] = (Array.isArray(v) ? v : []).map(function (x) { return x === null || x === undefined || x === '' ? '' : String(x); }); break;
      case DANG.TRA_LOI_NGAN: a[k] = U_str(v); break;
    }
  });
  return a;
}

/** Bài làm web → chuỗi gọn để đọc / ghi lên giấy: "1A 2BD 3ĐSSĐ 4:2-1-3 5=3,14" */
function PK_answerString(web, items) {
  web = web || {};
  return items.slice().sort(function (a, b) { return Number(a.STT) - Number(b.STT); }).map(function (it) {
    var n = Number(it.STT), v = web['S' + n], d = U_str(it.DangCau);
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.some(function (x) { return x !== null && x !== ''; }))) return n + '-';
    if (d === DANG.MOT_DA) return n + U_upper(v);
    if (d === DANG.NHIEU_DA) return n + v.slice().sort().join('');
    if (d === DANG.DUNG_SAI) return n + v.map(function (x) { return x ? (U_upper(x) === 'S' ? 'S' : 'Đ') : '_'; }).join('');
    if (d === DANG.GHEP_NOI) return n + ':' + v.map(function (x) { return x ? x : '0'; }).join('-');
    return n + '=' + U_str(v).replace(/\s+/g, '');
  }).join(' ');
}

/**
 * Đọc bài làm trên giấy do giám thị gõ lại.
 *  - Dạng đánh số: "1A 2BD 3ĐSSĐ 4:2-1-3 5=3,14"  (cũng chấp nhận "1.A", "1: A", "1 A"; bỏ trống: "6-")
 *  - Dạng chuỗi liền (chỉ khi mọi câu là MOT_DA): "ABCDA-BC…" (dấu - hoặc _ là bỏ trống)
 * @return {answers:{S1:..}, errors:[], count}
 */
function PK_parseManual(text, items) {
  var list = items.slice().sort(function (a, b) { return Number(a.STT) - Number(b.STT); });
  var byStt = {};
  list.forEach(function (it) { byStt[Number(it.STT)] = it; });
  var t = U_str(text).normalize('NFC');
  var answers = {}, errors = [];
  if (!t) return { answers: answers, errors: ['Chưa nhập bài làm'], count: 0 };
  if (!/\d/.test(t)) {
    var chars = t.replace(/\s+/g, '').toUpperCase().split('');
    if (list.some(function (it) { return U_str(it.DangCau) !== DANG.MOT_DA; })) {
      return { answers: {}, errors: ['Đề có câu không phải 1 đáp án — hãy ghi kèm số câu, ví dụ: 1A 2BD 3ĐSSĐ'], count: 0 };
    }
    if (chars.length > list.length) errors.push('Nhập ' + chars.length + ' ký tự nhưng đề chỉ có ' + list.length + ' câu');
    chars.forEach(function (c, i) {
      var it = list[i];
      if (!it) return;
      if (c === '-' || c === '_' || c === '.') return;
      if (!/^[A-J]$/.test(c)) { errors.push('Câu ' + it.STT + ': ký tự "' + c + '" không hợp lệ'); return; }
      if (U_letterIndex(c) >= (U_str(it.ThuTu).split(',').length || 4)) { errors.push('Câu ' + it.STT + ': không có lựa chọn ' + c); return; }
      answers['S' + Number(it.STT)] = c;
    });
    return { answers: answers, errors: errors, count: Object.keys(answers).length };
  }
  // dạng đánh số: mỗi mục "số[.:)=]?đáp_án"; số đứng riêng thì mục kế tiếp là đáp án của nó ("4 213", "1: A")
  var toks = t.split(/[\s;]+/).filter(String), merged = [], pending = null;
  toks.forEach(function (tok) {
    if (pending !== null) { merged.push([pending, tok.replace(/^[.:)=]/, '')]); pending = null; return; }
    var m = tok.match(/^(\d+)[.:)=]?(.*)$/);
    if (!m) { errors.push('Không đọc được "' + tok + '" (cần có số câu phía trước)'); return; }
    if (m[2] === '') pending = m[1]; else merged.push([m[1], m[2]]);
  });
  if (pending !== null) merged.push([pending, '']);
  var seen = {};
  merged.forEach(function (pr) {
    var n = Number(pr[0]), rest = pr[1].trim(), it = byStt[n];
    if (!it) { errors.push('Đề không có câu ' + n); return; }
    if (seen[n]) errors.push('Câu ' + n + ' được nhập 2 lần (lấy lần sau)');
    seen[n] = true;
    var key = 'S' + n, d = U_str(it.DangCau), nOpt = U_str(it.ThuTu) ? U_str(it.ThuTu).split(',').length : 0;
    if (rest === '' || /^[-_?]+$/.test(rest)) { delete answers[key]; return; }
    if (d === DANG.MOT_DA || d === DANG.NHIEU_DA) {
      var L = rest.toUpperCase().replace(/[^A-Z]/g, '').split('');
      var bad = L.filter(function (x) { return U_letterIndex(x) < 0 || U_letterIndex(x) >= (nOpt || 10); });
      if (!L.length || bad.length) { errors.push('Câu ' + n + ': "' + rest + '" không phải lựa chọn hợp lệ'); return; }
      L = L.filter(function (x, i) { return L.indexOf(x) === i; }).sort();
      if (d === DANG.MOT_DA && L.length > 1) { errors.push('Câu ' + n + ' chỉ có 1 đáp án nhưng ghi ' + L.join('')); return; }
      answers[key] = d === DANG.MOT_DA ? L[0] : L;
    } else if (d === DANG.DUNG_SAI) {
      var cs = rest.toUpperCase().replace(/[^ĐDSTF01_\-?]/g, '').split('');
      if (cs.length !== nOpt) { errors.push('Câu ' + n + ' có ' + nOpt + ' ý Đúng/Sai nhưng nhập ' + cs.length + ' ký tự'); return; }
      answers[key] = cs.map(function (c) { return /[ĐDT1]/.test(c) ? 'Đ' : (/[SF0]/.test(c) ? 'S' : null); });
    } else if (d === DANG.GHEP_NOI) {
      var parts = /[-,\/]/.test(rest) ? rest.split(/[-,\/]+/) : rest.split('');
      parts = parts.map(function (p) { var x = parseInt(p, 10); return isNaN(x) || x === 0 ? null : x; });
      if (parts.length !== nOpt) { errors.push('Câu ' + n + ' có ' + nOpt + ' ý cần ghép nhưng nhập ' + parts.length); return; }
      answers[key] = parts;
    } else {
      answers[key] = rest.replace(/^=/, '');
    }
  });
  return { answers: answers, errors: errors, count: Object.keys(answers).length };
}

/**
 * Chọn bài chính thức của một thí sinh trong các dòng BaiLam (phòng thi):
 * GIAY (nhập tay, mới nhất) > NOP / NOP_TRE (lần đầu) > LUU (bản tự lưu có Seq lớn nhất → "tự thu").
 */
function PK_pickFinal(rows) {
  var by = function (type) { return rows.filter(function (r) { return U_upper(r.Loai) === type; }); };
  var num = function (v) { return Number(v) || 0; };
  var giay = by('GIAY').sort(function (a, b) { return num(b.ThoiGian) - num(a.ThoiGian); });
  if (giay.length) return { row: giay[0], kind: 'GIAY' };
  var nop = by('NOP').concat(by('NOP_TRE')).sort(function (a, b) { return num(a.ThoiGian) - num(b.ThoiGian); });
  if (nop.length) return { row: nop[0], kind: U_upper(nop[0].Loai) };
  var luu = by('LUU').sort(function (a, b) { return num(b.Seq) - num(a.Seq) || num(b.ThoiGian) - num(a.ThoiGian); });
  if (luu.length) return { row: luu[0], kind: 'TU_THU' };
  return null;
}

/** Hạn nộp (ms) của một thí sinh — cùng công thức với máy chủ phòng thi */
function PK_pausedMs(st, now) { return U_num(st.DungMs, 0) + (U_num(st.DungLuc, 0) ? Math.max(0, (now || Date.now()) - U_num(st.DungLuc, 0)) : 0); }
function PK_deadline(ex, st) {
  var dur = (U_num(ex.ThoiGianPhut, 0) + U_num(st.ThemPhut, 0)) * 60000;
  // CHUNG: tính từ lúc mở phòng; thí sinh được "làm lại" sau lúc mở thì tính từ lúc em bắt đầu lượt mới (khớp máy chủ phòng thi)
  var m = String(st.GhiChu == null ? '' : st.GhiChu).match(/^RESET:(\d+)/), ra = m ? Number(m[1]) : 0;
  var base = U_upper(ex.TinhGio) === 'CHUNG' && !(ra > U_num(ex.MoLuc, 0)) ? U_num(ex.MoLuc, 0) : U_num(st.BatDau, 0);
  var d = dur > 0 && base ? base + dur + PK_pausedMs(st) : Infinity;
  // HẸN ĐÓNG = mốc chung của phòng; VuotHen = số phút RIÊNG em được vượt mốc (do giám thị cộng giờ / tạm dừng riêng)
  // HenCung = CO: "đồng bộ" — mọi em kết thúc đúng mốc (+ phần vượt riêng), bất kể giờ làm bài còn lại
  if (U_num(ex.HenDong, 0)) {
    var capH = U_num(ex.HenDong, 0) + U_num(st.VuotHen, 0) * 60000;
    d = U_upper(ex.HenCung) === 'CO' ? capH : Math.min(d, capH);
  }
  if (U_upper(ex.TrangThai) === 'DONG' && U_num(ex.DongLuc, 0)) d = Math.min(d, U_num(ex.DongLuc, 0));
  return d;
}

/** Mã truy cập 6 ký tự dễ đọc (không có 0/O, 1/I) */
function PK_code(rnd) {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  rnd = rnd || Math.random;
  for (var i = 0; i < 6; i++) s += chars.charAt(Math.floor(rnd() * chars.length));
  return s;
}

/* ---------------- Safe Exam Browser ---------------- */

function PK_xmlEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function PK_plist(v, ind) {
  ind = ind || '';
  if (v === true) return ind + '<true/>';
  if (v === false) return ind + '<false/>';
  if (typeof v === 'number') return ind + '<integer>' + Math.round(v) + '</integer>';
  if (Array.isArray(v)) return ind + '<array>\n' + v.map(function (x) { return PK_plist(x, ind + '  '); }).join('\n') + '\n' + ind + '</array>';
  if (v && typeof v === 'object') {
    return ind + '<dict>\n' + Object.keys(v).map(function (k) {
      return ind + '  <key>' + PK_xmlEsc(k) + '</key>\n' + PK_plist(v[k], ind + '  ');
    }).join('\n') + '\n' + ind + '</dict>';
  }
  return ind + '<string>' + PK_xmlEsc(v) + '</string>';
}

/**
 * Tạo nội dung file .seb (plist XML, không mã hoá).
 * @param o {startURL, quitURL, quitHash (SHA-256 hex của mật khẩu thoát, có thể rỗng), uaSuffix, urlFilter (bool)}
 */
function PK_sebXml(o) {
  var s = {
    originatorVersion: 'HeThongThi_PhongThiWeb',
    startURL: o.startURL,
    sendBrowserExamKey: false,
    browserUserAgent: o.uaSuffix || '',
    allowQuit: true,
    hashedQuitPassword: o.quitHash || '',
    quitURL: o.quitURL || '',
    quitURLConfirm: true,
    browserViewMode: 1,
    mainBrowserWindowWidth: '100%',
    mainBrowserWindowHeight: '100%',
    showTaskBar: true,
    showTime: true,
    showReloadButton: true,
    browserWindowAllowReload: true,
    showReloadWarning: true,
    newBrowserWindowByLinkPolicy: 1,
    newBrowserWindowByScriptPolicy: 1,
    allowSpellCheck: false,
    allowDictionaryLookup: false,
    allowDictation: false,
    allowDeveloperConsole: false,
    enableRightMouse: false,
    enablePrintScreen: false,
    allowVirtualMachine: false,
    allowedDisplaysMaxNumber: 1,
    allowDisplayMirroring: false,
    enableAppSwitcherCheck: true,
    allowSwitchToApplications: false,
    allowScreenSharing: false,
    examSessionClearCookiesOnStart: true,
    examSessionClearCookiesOnEnd: true,
    allowDownUploads: false,
    allowPDFReaderToolbar: false,
    enableZoomPage: true,
    enableZoomText: true,
    // LỚP 3 — âm thanh: tắt tiếng khi vào thi (tab nghe nhạc / video nền im lặng) và ẩn nút âm lượng
    audioMute: !o.keepAudio,
    audioControlEnabled: !!o.keepAudio,
    audioSetVolumeLevel: !!o.keepAudio,
    audioVolumeLevel: 60,
    // LỚP 1 — khoá máy theo hệ điều hành
    createNewDesktop: true,                // Windows: SEB chạy trên màn hình làm việc MỚI, không với tới cửa sổ nào khác
    killExplorerShell: false,
    lockdownModePolicy: o.macAAC === false ? 0 : 2, // macOS: 2 = BẮT BUỘC Assessment Mode (AAC): mọi app khác mất mạng & không quay được màn hình
    enableMacOSAAC: o.macAAC !== false,
    detectAccessibilityApps: true,         // macOS: app có quyền Trợ năng (điều khiển máy) bị đóng
    URLFilterEnable: !!o.urlFilter,
    URLFilterEnableContentFilter: false,
    allowWlan: true,                       // Windows: hiện điều khiển Wi-Fi trên thanh tác vụ SEB
    showMenuBar: !!o.macMenuBar,           // macOS: hiện thanh menu hệ thống (wifi, pin) — có thể mở menu hệ thống
    monitorProcesses: true                 // luôn giám sát: cửa sổ app không được phép bị ẩn, không ẩn được thì bị đóng
  };
  // LỚP 2 — buộc đóng ngay (không hỏi) các nhóm ứng dụng đã chọn + danh sách tự thêm
  if (o.blockApps !== false) s.prohibitedProcesses = PK_blockedApps(o.groups, o.extraApps, o.forceQuit !== false);
  if (o.urlFilter) {
    var allow = ['script.google.com', '*.google.com', '*.googleusercontent.com', '*.gstatic.com', '*.googleapis.com', 'cdn.jsdelivr.net',
      'fonts.googleapis.com', 'fonts.gstatic.com', 'www.youtube-nocookie.com'].concat(o.extraAllow || []);
    s.URLFilterRules = allow.map(function (e) { return { active: true, regex: false, expression: e, action: 1 }; });
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
    '<plist version="1.0">\n' + PK_plist(s) + '\n</plist>\n';
}

/** Ứng dụng bị SEB đóng khi thi: trình duyệt khác (Meet chạy trong trình duyệt), gọi video, nhắn tin, điều khiển từ xa, trợ lý AI */
/** Nhóm ứng dụng bị chặn: [mã, tên hiển thị, macOS bundle id[], Windows .exe[]] */
var PK_APP_GROUPS = [
  ['TRINH_DUYET', 'Trình duyệt khác (kể cả tab nghe nhạc, Google Meet trên web)',
    ['com.google.Chrome', 'com.google.Chrome.canary', 'com.google.Chrome.beta', 'com.microsoft.edgemac', 'org.mozilla.firefox', 'com.apple.Safari',
      'com.brave.Browser', 'com.operasoftware.Opera', 'com.operasoftware.OperaGX', 'company.thebrowser.Browser', 'com.coccoc.Coccoc', 'com.vivaldi.Vivaldi',
      'org.chromium.Chromium', 'ru.yandex.desktop.yandex-browser'],
    ['chrome.exe', 'msedge.exe', 'firefox.exe', 'opera.exe', 'opera_gx.exe', 'brave.exe', 'browser.exe', 'vivaldi.exe', 'iexplore.exe', 'chromium.exe', 'arc.exe']],
  ['NHAN_TIN', 'Nhắn tin & gọi video (Zalo, Messenger, Meet, Zoom, Teams, Discord, Telegram…)',
    ['com.vng.zalo', 'com.facebook.archon', 'ru.keepcoder.Telegram', 'org.telegram.desktop', 'com.hnc.Discord', 'com.tinyspeck.slackmacgap',
      'net.whatsapp.WhatsApp', 'desktop.WhatsApp', 'com.apple.MobileSMS', 'com.apple.FaceTime', 'com.skype.skype', 'com.viber.osx', 'jp.naver.line.mac',
      'us.zoom.xos', 'com.microsoft.teams2', 'com.microsoft.teams', 'Cisco-Systems.Spark', 'com.cisco.webexmeetingsapp'],
    ['Zalo.exe', 'ZaloCall.exe', 'Messenger.exe', 'Telegram.exe', 'Discord.exe', 'slack.exe', 'WhatsApp.exe', 'Skype.exe', 'Viber.exe', 'LINE.exe',
      'Zoom.exe', 'Teams.exe', 'ms-teams.exe', 'CiscoCollabHost.exe', 'webexmta.exe']],
  ['AI', 'Trợ lý AI (ChatGPT, Claude, Copilot, Gemini, Perplexity…)',
    ['com.openai.chat', 'com.anthropic.claudefordesktop', 'com.microsoft.copilot', 'ai.perplexity.mac', 'com.google.GeminiMacOS'],
    ['ChatGPT.exe', 'claude.exe', 'Copilot.exe', 'M365Copilot.exe', 'Perplexity.exe', 'Gemini.exe']],
  ['TAC_TU_AI', 'Tác tử AI điều khiển máy (Codex, ChatGPT Atlas / Agent, Comet, Claude Code…) & công cụ tự động (Python, Node, AutoHotkey)',
    ['com.openai.codex', 'com.openai.atlas', 'com.openai.chatgpt.atlas', 'ai.perplexity.comet', 'com.anthropic.claude-code', 'org.python.python', 'com.apple.ScriptEditor2',
      'com.apple.Automator', 'com.hegenberg.BetterTouchTool', 'com.stairways.keyboardmaestro.engine'],
    ['codex.exe', 'Codex.exe', 'ChatGPT Atlas.exe', 'Atlas.exe', 'Comet.exe', 'node.exe', 'python.exe', 'pythonw.exe', 'py.exe', 'pyw.exe',
      'AutoHotkey.exe', 'AutoHotkey64.exe', 'AutoHotkeyU64.exe', 'AutoIt3.exe', 'TinyTask.exe']],
  ['DIEU_KHIEN', 'Điều khiển từ xa & quay màn hình (UltraViewer, AnyDesk, TeamViewer, OBS…)',
    ['com.teamviewer.TeamViewer', 'com.philandro.anydesk', 'com.rustdesk.RustDesk', 'com.obsproject.obs-studio', 'com.parsec.www'],
    ['UltraViewer_Desktop.exe', 'UltraViewer_Service.exe', 'AnyDesk.exe', 'TeamViewer.exe', 'rustdesk.exe', 'ToDesk.exe', 'parsecd.exe', 'obs64.exe', 'obs32.exe',
      'quickassist.exe', 'mstsc.exe']],
  ['GAME', 'Game & nền tảng game (Liên Minh, Valorant, Steam, Epic, Roblox…)',
    ['com.riotgames.RiotGames.RiotClient', 'com.riotgames.LeagueofLegends.LeagueClient', 'com.valvesoftware.steam', 'com.epicgames.EpicGamesLauncher', 'com.roblox.RobloxPlayer'],
    ['LeagueClient.exe', 'LeagueClientUx.exe', 'League of Legends.exe', 'RiotClientServices.exe', 'RiotClientUx.exe', 'VALORANT.exe', 'Steam.exe',
      'steamwebhelper.exe', 'EpicGamesLauncher.exe', 'RobloxPlayerBeta.exe', 'Garena.exe', 'GarenaMessenger.exe']],
  ['LAP_TRINH', 'Công cụ lập trình & soạn thảo (VS Code, Cursor, JetBrains, Terminal…)',
    ['com.microsoft.VSCode', 'com.todesktop.230313mzl4w4u92', 'com.jetbrains.intellij', 'com.jetbrains.pycharm', 'com.jetbrains.pycharm.ce', 'com.apple.Terminal',
      'com.googlecode.iterm2', 'com.apple.dt.Xcode', 'com.sublimetext.4', 'com.exafunction.windsurf'],
    ['Code.exe', 'Cursor.exe', 'Windsurf.exe', 'idea64.exe', 'pycharm64.exe', 'devenv.exe', 'WindowsTerminal.exe', 'sublime_text.exe', 'notepad++.exe']],
  ['NHAC_VIDEO', 'Nghe nhạc & xem video (Spotify, VLC, Apple Music…)',
    ['com.spotify.client', 'com.apple.Music', 'org.videolan.vlc', 'com.apple.TV', 'com.apple.QuickTimePlayerX', 'com.apple.podcasts'],
    ['Spotify.exe', 'vlc.exe', 'wmplayer.exe', 'Microsoft.Media.Player.exe', 'PotPlayerMini64.exe', 'foobar2000.exe', 'Music.UI.exe', 'Video.UI.exe']]
];
/** Danh sách cấm cho file .seb. groups: mã nhóm (bỏ trống = tất cả); extra: chuỗi nhiều dòng do giám thị tự thêm */
function PK_blockedApps(groups, extra, force) {
  var want = groups && groups.length ? groups : PK_APP_GROUPS.map(function (g) { return g[0]; });
  var out = [], seen = {};
  function mac(id, name) { if (seen['m' + id]) return; seen['m' + id] = 1; out.push({ active: true, currentUser: true, description: name, executable: name, identifier: id, os: 0, strongKill: !!force }); }
  function win(exe, name) { var k = 'w' + exe.toLowerCase(); if (seen[k]) return; seen[k] = 1; out.push({ active: true, currentUser: true, description: name, executable: exe, identifier: '', originalName: exe, os: 1, strongKill: !!force }); }
  PK_APP_GROUPS.forEach(function (g) {
    if (want.indexOf(g[0]) < 0) return;
    g[2].forEach(function (id) { mac(id, id.split('.').pop()); });
    g[3].forEach(function (e) { win(e, e.replace(/\.exe$/i, '')); });
  });
  String(extra || '').split(/[\n,;]+/).map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (x) {
    if (/\.exe$/i.test(x)) win(x, x.replace(/\.exe$/i, ''));
    else if (/^[\w-]+(\.[\w-]+){2,}$/.test(x)) mac(x, x.split('.').pop());           // dạng com.hang.UngDung → macOS
    else { win(x + '.exe', x); out.push({ active: true, currentUser: true, description: x, executable: x, identifier: '', os: 0, strongKill: !!force }); }
  });
  return out;
}

/** Byte[] (có thể âm như Apps Script trả về) → chuỗi hex */
function PK_hex(bytes) {
  return (bytes || []).map(function (b) { var v = (b + 256) % 256; return (v < 16 ? '0' : '') + v.toString(16); }).join('');
}
