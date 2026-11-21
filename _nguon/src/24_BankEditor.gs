/**
 * 24_BankEditor.gs — Máy chủ cho trình "📝 Nhập câu hỏi nhanh" (NhapCau.html).
 *
 * Trình nhập ghi thẳng vào sheet CauHoi / Nhom của file NganHang_<MaMon> theo TÊN CỘT,
 * tự cấp mã câu (<MaChuDe>-001…), kiểm tra lỗi bằng chính bộ kiểm tra của ngân hàng (Bank_build),
 * tải ảnh dán từ bộ nhớ tạm lên Drive, dịch Việt ⇄ Anh bằng Google Dịch (LanguageApp, miễn phí),
 * và báo tiến độ so với ma trận đề (còn thiếu bao nhiêu câu ở ô nào).
 */

var BE_TEXT_FIELDS = HEADERS[BSH.CAU_HOI];

function BE_ctx(maMon) {
  Repo_clearCache();
  var s = Repo_subject(maMon);
  var ss = S_open(s.id);
  Setup_bankColumns(ss);
  return {
    subject: s, ss: ss, rows: S_read(ss, BSH.CAU_HOI), groups: S_read(ss, BSH.NHOM), topics: S_read(ss, BSH.DANH_MUC),
    levels: Repo_levels()
  };
}

/** Dữ liệu ban đầu cho trình nhập */
function BE_init(maMon) {
  var c = BE_ctx(maMon);
  var bank = Bank_build(c.rows, c.groups, c.topics, c.levels);
  var issues = {};
  bank.issues.forEach(function (x) {
    if (x.level !== 'LOI') return;
    (issues[x.ma] = issues[x.ma] || []).push(x.msg);
  });
  var today = S_now().substring(0, 10);
  return {
    subject: { maMon: c.subject.maMon, ten: c.subject.ten, url: c.subject.url },
    topics: c.topics.map(function (t) {
      return { code: U_str(t.MaChuDe), chuong: U_str(t.Chuong), chuDe: U_str(t.ChuDe), khoi: U_str(t.Khoi_CapDo) };
    }).filter(function (t) { return t.code; }),
    groups: c.groups.map(function (g) {
      return { id: U_str(g.MaNhom), maChuDe: U_str(g.MaChuDe), mucDo: U_str(g.MucDo), dang: U_str(g.DangCau),
        vi: U_str(g.NoiDung_VI), en: U_str(g.NoiDung_EN), n: (bank.groups[U_str(g.MaNhom)] || { children: [] }).children.length };
    }).filter(function (g) { return g.id; }),
    rows: c.rows.map(BE_rowOut),
    issues: issues,
    levels: c.levels,
    dangs: Object.keys(DANG).map(function (k) { return { code: k, name: DANG_TEN[k] }; }),
    songNgu: U_bool(Repo_config().SONG_NGU, true),
    matrices: Repo_matrixList().filter(function (m) { return m.maMon === c.subject.maMon; }),
    today: today,
    valid: bank.units.reduce(function (a, u) { return a + u.size; }, 0)
  };
}

function BE_rowOut(r) {
  var o = { _row: r.__row };
  BE_TEXT_FIELDS.forEach(function (h) {
    var v = r[h];
    if (v instanceof Date) v = Utilities.formatDate(v, APP.TZ, 'yyyy-MM-dd HH:mm:ss');
    o[h] = v === null || v === undefined ? '' : String(v);
  });
  return o;
}

/** Làm sạch bản ghi gửi lên: chỉ giữ cột hợp lệ, chuẩn hoá Unicode, chặn chuỗi bị hiểu là công thức */
function BE_clean(rec) {
  var r = {};
  BE_TEXT_FIELDS.forEach(function (h) {
    if (rec[h] === undefined || rec[h] === null) return;
    var v = String(rec[h]).normalize('NFC').replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').replace(/^\n+|\s+$/g, '');
    r[h] = v;
  });
  r.MaChuDe = U_str(r.MaChuDe);
  r.MucDo = U_upper(r.MucDo);
  r.DangCau = U_normDang(r.DangCau) || U_str(r.DangCau);
  if (r.DapAn && r.DangCau) {
    var nOpt = APP.LETTERS.filter(function (L) { return U_str(r[L]); }).length;
    var nRight = U_str(r.CotGhep) ? U_str(r.CotGhep).split('|').filter(function (x) { return x.trim(); }).length : 0;
    var pk = Bank_parseKey(r.DangCau, r.DapAn, { nOpt: r.DangCau === DANG.TRA_LOI_NGAN ? 0 : nOpt, nRight: nRight });
    if (pk.ok) r.DapAn = Bank_keyToString(r.DangCau, pk.key);
  }
  return r;
}

/** Ghi ra sheet: chuỗi bắt đầu bằng "=" được thêm dấu ' để Google Sheets không coi là công thức */
function BE_sheetSafe(r) {
  var o = {};
  Object.keys(r).forEach(function (k) {
    var v = r[k];
    o[k] = (typeof v === 'string' && /^[=]/.test(v)) ? "'" + v : v;
  });
  return o;
}

/** Mã câu kế tiếp: <MaChuDe>-001, <MaChuDe>-002… (hoặc <MaMon>-001 nếu chưa chọn chủ đề) */
function BE_nextId(ids, prefix) {
  var p = U_str(prefix).replace(/\s+/g, '') || 'CH';
  var re = new RegExp('^' + U_escapeRegex(p) + '-(\\d+)$');
  var max = 0;
  ids.forEach(function (id) { var m = U_str(id).match(re); if (m) max = Math.max(max, Number(m[1])); });
  var n = String(max + 1);
  while (n.length < 3) n = '0' + n;
  return p + '-' + n;
}

function BE_validate(ctx, r) {
  var probe = {};
  Object.keys(r).forEach(function (k) { probe[k] = r[k]; });
  probe.__row = 0;
  var b = Bank_build([probe], ctx.groups, ctx.topics, ctx.levels);
  var mine = b.issues.filter(function (x) { return x.ma === r.MaCH || x.ma === '(dòng 0)'; });
  return {
    errors: mine.filter(function (x) { return x.level === 'LOI'; }).map(function (x) { return x.msg; }),
    warnings: mine.filter(function (x) { return x.level !== 'LOI'; }).map(function (x) { return x.msg; })
  };
}

/**
 * Lưu một câu (thêm mới hoặc sửa).
 * @param {string} maMon
 * @param {Object} rec bản ghi theo tên cột sheet CauHoi
 * @param {string} origId mã câu đang sửa ('' = thêm mới)
 */
function BE_save(maMon, rec, origId) {
  return S_withLock(function () {
    var ctx = BE_ctx(maMon);
    var r = BE_clean(rec || {});
    var ids = ctx.rows.map(function (x) { return U_str(x.MaCH); });
    var existing = null;
    origId = U_str(origId);
    if (origId) {
      existing = ctx.rows.filter(function (x) { return U_str(x.MaCH) === origId; })[0];
      if (!existing) throw new Error('Không tìm thấy câu ' + origId + ' trong ngân hàng (có thể đã bị xoá).');
      r.MaCH = origId;
      r.NgayTao = U_str(existing.NgayTao) || S_now();
    } else {
      if (r.MaCH && ids.indexOf(r.MaCH) >= 0) return { ok: false, errors: ['Mã câu ' + r.MaCH + ' đã tồn tại'] };
      if (!r.MaCH) r.MaCH = BE_nextId(ids, r.MaChuDe || maMon);
      r.NgayTao = S_now();
    }
    if (!r.TrangThai) r.TrangThai = 'DUNG';
    var v = BE_validate(ctx, r);
    if (v.errors.length) return { ok: false, errors: v.errors, warnings: v.warnings };
    if (existing) {
      // xoá giá trị cột không gửi lên (ví dụ bỏ lựa chọn E) — ghi đè toàn bộ các cột đã biết
      var patch = {};
      BE_TEXT_FIELDS.forEach(function (h) { patch[h] = r[h] !== undefined ? r[h] : ''; });
      S_update(ctx.ss, BSH.CAU_HOI, function (o) { return U_str(o.MaCH) === origId; }, BE_sheetSafe(patch));
    } else {
      S_append(ctx.ss, BSH.CAU_HOI, [BE_sheetSafe(r)]);
    }
    S_log(existing ? 'SUA_CAU' : 'THEM_CAU', maMon + ' ' + r.MaCH);
    var out = {};
    BE_TEXT_FIELDS.forEach(function (h) { out[h] = r[h] !== undefined ? r[h] : ''; });
    return { ok: true, id: r.MaCH, row: out, warnings: v.warnings, created: !existing };
  });
}

/** Lưu nhiều câu một lần (chế độ Dán nhiều câu). Câu lỗi bị bỏ qua, câu đúng được ghi một lượt. */
function BE_saveMany(maMon, recs) {
  return S_withLock(function () {
    var ctx = BE_ctx(maMon);
    var ids = ctx.rows.map(function (x) { return U_str(x.MaCH); });
    var now = S_now(), good = [], results = [];
    (recs || []).forEach(function (rec, i) {
      var r = BE_clean(rec || {});
      if (r.MaCH && ids.indexOf(r.MaCH) >= 0) { results.push({ i: i, ok: false, errors: ['Mã câu ' + r.MaCH + ' đã tồn tại'] }); return; }
      if (!r.MaCH) r.MaCH = BE_nextId(ids, r.MaChuDe || maMon);
      r.NgayTao = now;
      if (!r.TrangThai) r.TrangThai = 'DUNG';
      var v = BE_validate(ctx, r);
      if (v.errors.length) { results.push({ i: i, ok: false, errors: v.errors, warnings: v.warnings }); return; }
      ids.push(r.MaCH);
      good.push(r);
      var out = {};
      BE_TEXT_FIELDS.forEach(function (h) { out[h] = r[h] !== undefined ? r[h] : ''; });
      results.push({ i: i, ok: true, id: r.MaCH, row: out, warnings: v.warnings });
    });
    if (good.length) S_append(ctx.ss, BSH.CAU_HOI, good.map(BE_sheetSafe));
    S_log('THEM_NHIEU_CAU', maMon + ': ' + good.length + ' câu');
    return { saved: good.length, results: results };
  });
}

/** Ẩn / dùng lại một câu */
function BE_setStatus(maMon, id, status) {
  var ctx = BE_ctx(maMon);
  var st = U_upper(status) === 'AN' ? 'AN' : 'DUNG';
  var n = S_update(ctx.ss, BSH.CAU_HOI, function (o) { return U_str(o.MaCH) === U_str(id); }, { TrangThai: st });
  if (!n) throw new Error('Không tìm thấy câu ' + id);
  return { id: id, TrangThai: st };
}

/** Xoá hẳn một câu — chỉ khi câu chưa từng nằm trong mã đề nào (nếu đã dùng thì chỉ cho Ẩn) */
function BE_delete(maMon, id) {
  return S_withLock(function () {
    id = U_str(id);
    var used = S_read(S_hub(), SH.DE_THI).filter(function (r) { return U_str(r.MaCH) === id; });
    if (used.length) throw new Error('Câu ' + id + ' đã nằm trong đề của kỳ thi ' + U_str(used[0].MaKyThi) + ' — chỉ có thể Ẩn, không xoá.');
    var ctx = BE_ctx(maMon);
    var row = ctx.rows.filter(function (o) { return U_str(o.MaCH) === id; })[0];
    if (!row) throw new Error('Không tìm thấy câu ' + id);
    ctx.ss.getSheetByName(BSH.CAU_HOI).deleteRow(row.__row);
    S_log('XOA_CAU', maMon + ' ' + id);
    return { id: id };
  });
}

/** Tạo / sửa nhóm câu chùm (đoạn dẫn chung) */
function BE_saveGroup(maMon, g) {
  return S_withLock(function () {
    var ctx = BE_ctx(maMon);
    var r = {
      MaNhom: U_str(g.MaNhom), MaChuDe: U_str(g.MaChuDe), MucDo: U_upper(g.MucDo), DangCau: U_normDang(g.DangCau) || '',
      NoiDung_VI: U_str(g.NoiDung_VI), NoiDung_EN: U_str(g.NoiDung_EN), LaTeX: U_str(g.LaTeX), HinhAnh: U_str(g.HinhAnh),
      TrangThai: 'DUNG'
    };
    if (!r.NoiDung_VI && !r.NoiDung_EN && !r.HinhAnh) throw new Error('Nhóm cần có đoạn dẫn chung (nội dung) hoặc hình ảnh');
    var ids = ctx.groups.map(function (x) { return U_str(x.MaNhom); });
    if (!r.MaNhom) r.MaNhom = BE_nextId(ids, 'N-' + (r.MaChuDe || maMon));
    S_upsert(ctx.ss, BSH.NHOM, function (o) { return U_str(o.MaNhom); }, BE_sheetSafe(r));
    return { id: r.MaNhom, vi: r.NoiDung_VI, en: r.NoiDung_EN, maChuDe: r.MaChuDe, mucDo: r.MucDo, dang: r.DangCau };
  });
}

/** Tải ảnh (dán từ bộ nhớ tạm / kéo thả) lên thư mục HinhAnh_<MaMon> trên Drive. Trả ID file. */
function BE_uploadImage(maMon, b64, mime, name) {
  if (!b64) throw new Error('Không có dữ liệu ảnh');
  if (b64.length > 14 * 1024 * 1024) throw new Error('Ảnh quá lớn (tối đa ~10 MB)');
  var folder = S_folder('IMG_FOLDER_' + U_upper(maMon), 'HinhAnh_' + U_upper(maMon));
  mime = mime || 'image/png';
  var ext = (mime.split('/')[1] || 'png').replace('jpeg', 'jpg');
  var fname = U_str(name) || (U_upper(maMon) + '_' + Utilities.formatDate(new Date(), APP.TZ, 'yyyyMMdd_HHmmss') + '.' + ext);
  var file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(b64), mime, fname));
  return { id: file.getId(), name: fname };
}

/**
 * Dịch nhiều đoạn văn (giữ nguyên công thức $…$, $$…$$ và `mã`) bằng Google Dịch.
 * @param {Array<string>} texts
 * @param {string} from 'vi' | 'en'
 * @param {string} to   'en' | 'vi'
 */
function BE_translate(texts, from, to) {
  texts = (texts || []).map(U_str);
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function protect(s) {
    var out = '', re = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|`[^`]+`/g, last = 0, m;
    while ((m = re.exec(s))) {
      out += esc(s.substring(last, m.index)) + '<span class="notranslate" translate="no">' + esc(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    return (out + esc(s.substring(last))).replace(/\n/g, '<br>');
  }
  function unhtml(h) {
    return String(h).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/[ \t]+\n/g, '\n').trim();
  }
  var idx = [], parts = [];
  texts.forEach(function (t, i) { if (t) { idx.push(i); parts.push(protect(t)); } });
  var out = texts.map(function () { return ''; });
  if (!parts.length) return out;
  var joined = parts.map(function (p, k) { return '<div id="t' + k + '">' + p + '</div>'; }).join('');
  var res = LanguageApp.translate(joined, from, to, { contentType: 'html' });
  var pieces = [];
  var re2 = /<div id="?t(\d+)"?[^>]*>([\s\S]*?)<\/div>/gi, m2;
  while ((m2 = re2.exec(res))) pieces[Number(m2[1])] = unhtml(m2[2]);
  idx.forEach(function (i, k) {
    out[i] = pieces[k] !== undefined ? pieces[k] : unhtml(LanguageApp.translate(parts[k], from, to, { contentType: 'html' }));
  });
  return out;
}

/** Tiến độ ngân hàng so với ma trận: mỗi ô cần bao nhiêu (× số mã đề nếu khác câu), đang có bao nhiêu */
function BE_progress(maMon, maMaTran, nCodes) {
  Repo_clearCache();
  var bank = Repo_bank(maMon);
  var mx = Repo_matrix(maMaTran);
  var n = Math.max(1, U_num(nCodes, 1));
  var cells = [];
  mx.sections.forEach(function (sec) {
    sec.cells.forEach(function (cell) {
      var have = bank.units.filter(function (u) { return Mx_matches(u, cell, sec); })
        .reduce(function (a, u) { return a + u.size; }, 0);
      cells.push({
        phan: sec.phan, secTen: sec.ten, allowed: sec.allowed, chuong: cell.chuong, maChuDe: cell.maChuDe, mucDo: cell.mucDo,
        dang: cell.dang, need: cell.need, target: cell.need * n, have: have, label: Mx_cellLabel(sec, cell)
      });
    });
  });
  return { id: mx.id, ten: mx.ten, n: n, cells: cells, issues: mx.issues, totalQuestions: mx.totalQuestions };
}

/** Trang trình nhập (dùng cho menu và Web App ?p=nhap) */
function UI_editorHtml(maMon) {
  var t = HtmlService.createTemplateFromFile('NhapCau');
  t.appName = APP.NAME;
  t.mon = U_upper(maMon || '');
  t.parserSrc = PQ_clientSource();
  return t.evaluate().setTitle('Nhập câu hỏi nhanh').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function UI_openEditor() {
  SpreadsheetApp.getUi().showModelessDialog(UI_editorHtml('').setWidth(1480).setHeight(900), '📝 Nhập câu hỏi nhanh');
}
