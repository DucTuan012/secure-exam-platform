/**
 * 30_FormExport.gs — Xuất mỗi mã đề thành 1 Google Form
 *
 * - Trang 1: Số báo danh (chỉ chấp nhận SBD được phân mã đề này) + Họ tên.
 * - Mỗi Phần của đề là một trang (hoặc tiêu đề mục) ghi rõ số câu, điểm.
 * - MOT_DA -> trắc nghiệm 1 lựa chọn; NHIEU_DA -> hộp kiểm; DUNG_SAI -> lưới Đúng/Sai;
 *   GHEP_NOI -> lưới (hàng = ý trái, cột = số mục phải); TRA_LOI_NGAN -> ô văn bản ngắn.
 * - Công thức phức tạp / cột LaTeX -> ảnh PNG (lưu đệm trên Drive), hình ảnh Drive, video YouTube.
 * - Form KHÔNG bật Quiz -> thí sinh không thấy điểm/đáp án. Form được xuất ở trạng thái ĐÓNG.
 * - Xuất lại: dùng lại Form cũ (link không đổi) nếu chưa có bài nộp.
 */

function FX_exportVariant(maKyThi, maDe, force) {
  return S_withLock(function () {
    Repo_clearCache();
    maDe = String(maDe);
    var hub = S_hub(), cfg = Repo_config();
    var exRow = Repo_examRow(maKyThi), exam = Gen_examFromRow(exRow);
    var st = U_str(exRow.TrangThai);
    if ([TT_KY_THI.DA_CHOT, TT_KY_THI.DA_XUAT].indexOf(st) < 0) {
      throw new Error('Cần Chốt đề trước khi xuất Form (trạng thái hiện tại: ' + (st || TT_KY_THI.NHAP) + ')');
    }
    var bank = Repo_bank(exam.maMon);
    var sections = Repo_sections(exRow);
    var allItems = Repo_items(maKyThi);
    var items = allItems.filter(function (x) { return x.MaDe === maDe; })
      .sort(function (a, b) { return Number(a.STT) - Number(b.STT); });
    if (!items.length) throw new Error('Mã đề ' + maDe + ' chưa có câu hỏi');
    var vRow = Repo_variantRows(maKyThi).filter(function (v) { return U_str(v.MaDe) === maDe; })[0] || {};
    var warnings = [];

    // Cập nhật bản chụp đáp án theo ngân hàng hiện tại (trước khi Form được dùng để thi)
    FX_snapshot(items, bank, warnings);

    var form = null, reused = false;
    if (U_str(vRow.FormId)) {
      try { form = FormApp.openById(U_str(vRow.FormId)); } catch (e) { form = null; }
    }
    if (form) {
      var nResp = form.getResponses().length;
      if (nResp > 0 && !force) throw new Error('Form mã đề ' + maDe + ' đã có ' + nResp + ' bài nộp — không xuất lại để tránh mất dữ liệu.');
      form.getItems().forEach(function (i) { form.deleteItem(i); });
      reused = true;
    } else {
      form = FormApp.create(FX_title(exRow, maDe));
      try { DriveApp.getFileById(form.getId()).moveTo(FX_examFolder(exRow)); } catch (e) { warnings.push('Không chuyển được Form vào thư mục kỳ thi: ' + e.message); }
    }
    FX_configure(form, exRow, cfg, maDe, sections, items);

    var ctx = { form: form, cfg: cfg, bilingual: U_bool(cfg.SONG_NGU, true), required: U_bool(cfg.BAT_BUOC_TRA_LOI, false),
      warnings: warnings, bank: bank };
    var sbdItem = form.addTextItem().setTitle('Số báo danh / Student ID').setRequired(true)
      .setHelpText('Mã đề / Paper code: ' + maDe);
    var nameItem = form.addTextItem().setTitle('Họ và tên / Full name').setRequired(true);
    var pageBreak = U_bool(cfg.MOI_PHAN_MOT_TRANG, true);

    sections.forEach(function (sec) {
      var secItems = items.filter(function (x) { return x.Phan === String(sec.phan); });
      if (!secItems.length) return;
      var pts = sec.diem / secItems.length;
      var dangs = {};
      secItems.forEach(function (x) { dangs[x.DangCau] = true; });
      var head = 'PHẦN ' + sec.phan + '. ' + sec.ten;
      var help = secItems.length + ' câu · ' + sec.diem + ' điểm · mỗi câu ' + U_round(pts, 2) + ' điểm / ' +
        secItems.length + ' questions · ' + sec.diem + ' points';
      var hints = Object.keys(dangs).map(FX_hint).filter(String);
      if (hints.length) help += '\n' + hints.join('\n');
      if (pageBreak) form.addPageBreakItem().setTitle(head).setHelpText(help);
      else form.addSectionHeaderItem().setTitle(head).setHelpText(help);
      var lastGroup = null;
      secItems.forEach(function (it) {
        var q = bank.questions[it.MaCH];
        if (q.maNhom && q.maNhom !== lastGroup && bank.groups[q.maNhom]) FX_addGroup(ctx, bank.groups[q.maNhom], secItems);
        lastGroup = q.maNhom || null;
        var item = FX_addQuestion(ctx, it, q);
        it.FormItemId = String(item.getId());
      });
    });

    FX_publishClosed(form);
    var sbds = Repo_students(maKyThi).filter(function (s) { return s.MaDe === maDe; }).map(function (s) { return s.SBD; });
    FX_applySbdValidation(sbdItem, sbds);

    var clean = items.map(function (it) { var o = {}; HEADERS[SH.DE_THI].forEach(function (h) { o[h] = it[h]; }); return o; });
    S_replaceWhere(hub, SH.DE_THI, function (o) { return U_str(o.MaKyThi) === exam.maKyThi && U_str(o.MaDe) === maDe; }, clean);
    var pub = form.getPublishedUrl();
    S_upsert(hub, SH.MA_DE, function (o) { return U_str(o.MaKyThi) + '|' + U_str(o.MaDe); }, {
      MaKyThi: exam.maKyThi, MaDe: maDe, SoCau: items.length, TrangThai: 'DA_XUAT', FormId: form.getId(),
      LinkSua: form.getEditUrl(), LinkThi: pub, ItemIdSBD: String(sbdItem.getId()), ItemIdHoTen: String(nameItem.getId()),
      NgayXuat: S_now(), GhiChu: warnings.length ? warnings.length + ' cảnh báo' : ''
    });
    S_update(hub, SH.THI_SINH, function (o) { return U_str(o.MaKyThi) === exam.maKyThi && U_str(o.MaDe) === maDe; }, { LinkThi: pub });
    var allDone = Repo_variantRows(maKyThi).every(function (v) { return U_str(v.TrangThai) === 'DA_XUAT' && U_str(v.FormId); });
    if (allDone) Repo_setExam(maKyThi, { TrangThai: TT_KY_THI.DA_XUAT });
    S_log('XUAT_FORM', maKyThi + ' ' + maDe + (reused ? ' (dùng lại form)' : ''));
    return { maDe: maDe, formId: form.getId(), editUrl: form.getEditUrl(), url: pub, warnings: warnings, reused: reused,
      nCau: items.length, allDone: allDone, nSbd: sbds.length };
  });
}

/** Chụp thứ tự lựa chọn + đáp án theo ngân hàng hiện tại vào các dòng DeThi (dùng cho cả Form và phòng thi web) */
function FX_snapshot(items, bank, warnings) {
  items.forEach(function (it) {
    var q = bank.questions[it.MaCH];
    if (!q || !q.valid) throw new Error('Câu ' + it.MaCH + ' không còn hợp lệ trong ngân hàng — hãy sửa ngân hàng hoặc Mở chốt › Đổi câu');
    var perm = U_str(it.ThuTu) ? U_str(it.ThuTu).split(',') : [];
    var keys = q.options.map(function (o) { return o.key; });
    if (q.dang !== DANG.TRA_LOI_NGAN && (perm.length !== keys.length || perm.some(function (L) { return keys.indexOf(L) < 0; }))) {
      warnings.push('Câu ' + it.MaCH + ': số lựa chọn trong ngân hàng đã đổi — dùng thứ tự gốc');
      perm = keys;
    }
    it.ThuTu = perm.join(',');
    it.DapAnGoc = Bank_keyToString(q.dang, q.key);
    it.DapAnMaDe = Gen_displayKey(q.dang, q.key, perm);
  });
}

function FX_title(exRow, maDe) { return U_str(exRow.TenKyThi) + ' — Mã đề ' + maDe; }

function FX_examFolder(exRow) {
  var id = U_str(exRow.ThuMucId);
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { } }
  var f = S_examFolder().createFolder(U_str(exRow.MaKyThi) + ' — ' + U_str(exRow.TenKyThi));
  Repo_setExam(U_str(exRow.MaKyThi), { ThuMucId: f.getId() });
  return f;
}

function FX_try(fn) { try { fn(); } catch (e) { /* phương thức có thể không có ở mọi phiên bản */ } }

function FX_configure(form, exRow, cfg, maDe, sections, items) {
  form.setTitle(FX_title(exRow, maDe));
  var lines = [];
  if (U_str(cfg.TEN_DON_VI)) lines.push(U_str(cfg.TEN_DON_VI));
  lines.push('Kỳ thi / Exam: ' + U_str(exRow.TenKyThi));
  lines.push('Mã đề / Paper: ' + maDe + (U_num(exRow.ThoiGianPhut, 0) ? '   ·   Thời gian / Time: ' + U_num(exRow.ThoiGianPhut, 0) + ' phút / minutes' : ''));
  lines.push('Cấu trúc / Structure: ' + sections.map(function (s) {
    var n = items.filter(function (x) { return x.Phan === String(s.phan); }).length;
    return 'Phần ' + s.phan + ' (' + n + ' câu – ' + s.diem + ' điểm)';
  }).join('; ') + '. Tổng ' + sections.reduce(function (a, s) { return a + Number(s.diem); }, 0) + ' điểm.');
  lines.push('Quy tắc chấm: sai hoặc bỏ trống không bị trừ điểm; câu nhiều đáp án, Đúng/Sai và ghép nối phải đúng toàn bộ mới được điểm. ' +
    '/ No negative marking; multi-answer, true/false and matching items require all parts correct.');
  if (U_str(cfg.HUONG_DAN_DE)) lines.push(U_str(cfg.HUONG_DAN_DE));
  form.setDescription(lines.join('\n'));
  FX_try(function () { form.setIsQuiz(false); });
  FX_try(function () { form.setCollectEmail(false); });
  FX_try(function () { form.setAllowResponseEdits(false); });
  FX_try(function () { form.setLimitOneResponsePerUser(false); });
  FX_try(function () { form.setShowLinkToRespondAgain(false); });
  FX_try(function () { form.setPublishingSummary(false); });
  FX_try(function () { form.setProgressBar(true); });
  FX_try(function () { form.setShuffleQuestions(false); });
  FX_try(function () { form.setRequireLogin(false); });
  FX_try(function () { form.setConfirmationMessage(U_str(cfg.THONG_BAO_NOP_BAI)); });
  FX_try(function () { form.setCustomClosedFormMessage('Đề thi chưa mở hoặc đã kết thúc. / This exam is not open.'); });
}

function FX_publishClosed(form) {
  FX_try(function () { if (typeof form.isPublished === 'function' && !form.isPublished()) form.setPublished(true); });
  form.setAcceptingResponses(false);
}

function FX_hint(dang) {
  return {
    NHIEU_DA: '☑ Nhiều đáp án: chọn TẤT CẢ đáp án đúng. / Select ALL correct answers.',
    DUNG_SAI: '⚖ Đúng/Sai: chọn Đúng hoặc Sai cho TỪNG ý. / Mark EACH statement True or False.',
    GHEP_NOI: '🔗 Ghép nối: với mỗi ý bên trái chọn số của mục bên phải. / Match each item to a number.',
    TRA_LOI_NGAN: '✎ Trả lời ngắn: chỉ ghi kết quả; số thập phân dùng dấu chấm hoặc phẩy. / Write only the final answer.'
  }[dang] || '';
}

function FX_join() {
  return Array.prototype.slice.call(arguments).filter(function (x) { return U_str(x); }).join('\n');
}

/** Tiêu đề = dòng đầu; phần còn lại + tiếng Anh vào mô tả */
function FX_titleHelp(prefix, vi, en) {
  var lines = U_str(vi).split('\n');
  var first = lines.shift();
  return { title: prefix + first, help: FX_join(lines.join('\n'), en) };
}

function FX_isPureFormula(s) {
  var segs = LX_segments(s).filter(function (x) { return x.type !== 'text' || x.value.trim(); });
  return segs.length === 1 && segs[0].type !== 'text';
}

/** Chuẩn bị nhãn lựa chọn / ý theo thứ tự hiển thị */
function FX_options(ctx, it, q, imgs) {
  var perm = U_str(it.ThuTu) ? U_str(it.ThuTu).split(',') : [];
  var res = { labels: [], imageLatex: '', rightText: '', nRight: 0 };
  if (q.dang === DANG.TRA_LOI_NGAN) return res;
  var prefix = q.dang === DANG.DUNG_SAI ? function (L) { return L.toLowerCase() + ')'; } : function (L) { return L + '.'; };
  var rows = perm.map(function (L, i) { return { disp: APP.LETTERS[i], o: q.options[U_letterIndex(L)] }; });
  var failing = rows.filter(function (r) {
    return LX_segments(r.o.vi).some(LX_needsImage);
  });
  if (failing.length && rows.every(function (r) { return !/```/.test(r.o.vi); })) {
    res.imageLatex = LX_rowsLatex(rows.map(function (r) { return { label: prefix(r.disp), text: r.o.vi }; }));
    res.labels = rows.map(function (r) { return prefix(r.disp); });
  } else {
    res.labels = rows.map(function (r) {
      var t = LX_forForm(r.o.vi, imgs).text;
      if (ctx.bilingual && r.o.en) t += ' / ' + LX_forForm(r.o.en, imgs).text;
      return prefix(r.disp) + ' ' + t;
    });
  }
  if (q.dang === DANG.GHEP_NOI) {
    res.nRight = q.right.length;
    res.rightText = 'Cột phải / Right column:\n' + q.right.map(function (r, i) {
      var t = LX_forForm(r.vi, imgs).text;
      if (ctx.bilingual && r.en) t += ' / ' + LX_forForm(r.en, imgs).text;
      return (i + 1) + '. ' + t;
    }).join('\n');
  }
  return res;
}

function FX_ph(s) { return String(s).replace(/\[CT(\d+)\]/g, '(hình $1)'); }

function FX_addQuestion(ctx, it, q) {
  var form = ctx.form, stt = it.STT, imgs = [];
  var vi = FX_ph(LX_forForm(q.vi, imgs).text);
  var en = ctx.bilingual && q.en ? FX_ph(LX_forForm(q.en, imgs).text) : '';
  var opt = FX_options(ctx, it, q, imgs);
  var media = [];
  q.hinh.forEach(function (ref) { media.push({ kind: 'img', ref: ref }); });
  if (q.latex) media.push({ kind: 'latex', latex: q.latex });
  imgs.forEach(function (lt, i) { media.push(FX_imgMedia(lt, 'Hình ' + (i + 1))); });
  if (opt.imageLatex) media.push({ kind: 'latex', latex: opt.imageLatex, label: 'Các phương án / Options' });
  if (q.video) media.push({ kind: 'video', url: q.video });
  var parts = FX_titleHelp('Câu ' + stt + '. ', vi, en);
  var extra = q.amThanh ? '🎧 Nghe / Listen: ' + q.amThanh : '';
  var qTitle, qHelp;
  if (media.length) {
    media.forEach(function (m, idx) {
      var t = idx === 0 ? parts.title : 'Câu ' + stt + (m.label ? ' — ' + m.label : '');
      var h = idx === 0 ? FX_join(parts.help, extra) : '';
      if (idx > 0 && m.label === undefined && m.kind !== 'video') t = '';
      FX_addMedia(ctx, m, t, h);
    });
    qTitle = '↳ Trả lời câu ' + stt + ' / Answer ' + stt;
    qHelp = opt.rightText;
  } else {
    qTitle = parts.title;
    qHelp = FX_join(parts.help, extra, opt.rightText);
  }
  var item;
  switch (q.dang) {
    case DANG.MOT_DA:
      item = form.addMultipleChoiceItem().setTitle(qTitle).setChoiceValues(opt.labels);
      break;
    case DANG.NHIEU_DA:
      item = form.addCheckboxItem().setTitle(qTitle).setChoiceValues(opt.labels);
      break;
    case DANG.DUNG_SAI:
      item = form.addGridItem().setTitle(qTitle).setRows(opt.labels).setColumns([GR_TRUE_LABEL, GR_FALSE_LABEL]);
      break;
    case DANG.GHEP_NOI:
      var cols = [];
      for (var i = 1; i <= opt.nRight; i++) cols.push(String(i));
      item = form.addGridItem().setTitle(qTitle).setRows(opt.labels).setColumns(cols);
      break;
    case DANG.TRA_LOI_NGAN:
      item = form.addTextItem().setTitle(qTitle);
      break;
    default:
      throw new Error('Dạng câu không hỗ trợ: ' + q.dang);
  }
  if (qHelp) item.setHelpText(qHelp);
  item.setRequired(ctx.required);
  return item;
}

function FX_addGroup(ctx, g, secItems) {
  var members = secItems.filter(function (x) { return U_str(x.MaNhom) === g.id; });
  var a = members[0].STT, b = members[members.length - 1].STT;
  var imgs = [];
  var vi = FX_ph(LX_forForm(g.vi, imgs).text);
  var en = ctx.bilingual && g.en ? FX_ph(LX_forForm(g.en, imgs).text) : '';
  ctx.form.addSectionHeaderItem()
    .setTitle('Dùng thông tin sau để trả lời câu ' + a + (b !== a ? '–' + b : '') + ' / Use the following for questions ' + a + (b !== a ? '–' + b : ''))
    .setHelpText(FX_join(vi, en, g.amThanh ? '🎧 Nghe / Listen: ' + g.amThanh : ''));
  g.hinh.forEach(function (ref) { FX_addMedia(ctx, { kind: 'img', ref: ref }, '', ''); });
  if (g.latex) FX_addMedia(ctx, { kind: 'latex', latex: g.latex }, '', '');
  imgs.forEach(function (lt, i) { FX_addMedia(ctx, FX_imgMedia(lt), 'Hình ' + (i + 1), ''); });
  if (g.video) FX_addMedia(ctx, { kind: 'video', url: g.video }, '', '');
}

/** imgs[] chứa công thức LaTeX hoặc khối code (đánh dấu bằng LX_CODE_TAG) → mô tả media */
function FX_imgMedia(lt, label) {
  if (String(lt).indexOf(LX_CODE_TAG) === 0) {
    var code = String(lt).substring(LX_CODE_TAG.length);
    return { kind: 'latex', latex: LX_codeLatex(code), code: code, label: label };
  }
  return { kind: 'latex', latex: lt, label: label };
}

function FX_isYouTube(url) { return /(youtube\.com|youtu\.be)\//i.test(U_str(url)); }

function FX_addMedia(ctx, m, title, help) {
  try {
    if (m.kind === 'video') {
      if (!FX_isYouTube(m.url)) throw new Error('Google Form chỉ nhúng được video YouTube');
      var v = ctx.form.addVideoItem().setVideoUrl(m.url);
      if (title) v.setTitle(title);
      if (help) v.setHelpText(help);
      return true;
    }
    var blob = m.kind === 'latex' ? FX_latexBlob(m.latex, ctx.cfg) : FX_blobFromRef(m.ref);
    var img = ctx.form.addImageItem().setImage(blob);
    if (title) img.setTitle(title);
    if (help) img.setHelpText(help);
    FX_try(function () { img.setAlignment(FormApp.Alignment.LEFT); });
    return true;
  } catch (e) {
    var what = m.code ? 'code' : m.kind === 'latex' ? 'công thức' : (m.kind === 'video' ? 'video' : 'hình');
    ctx.warnings.push('Không chèn được ' + what + ' (' + (m.ref || m.url || m.latex) + '): ' + e.message);
    var fallback = m.code ? 'Code:\n' + m.code : m.kind === 'latex' ? 'Công thức (LaTeX): ' + m.latex : (m.kind === 'video' ? 'Video: ' + m.url : '[Không tải được hình]');
    ctx.form.addSectionHeaderItem().setTitle(title || ' ').setHelpText(FX_join(help, fallback));
    return false;
  }
}

/** Ảnh PNG cho công thức, lưu đệm trên Drive theo mã băm */
function FX_latexBlob(latex, cfg) {
  var dpi = U_num(cfg.LATEX_DPI, 160);
  var name = 'ct_' + U_hash32(dpi + '|' + latex).toString(16) + '_' + latex.length + '.png';
  var folder = S_latexFolder();
  var found = folder.getFilesByName(name);
  if (found.hasNext()) return found.next().getBlob();
  var url = LX_imageUrl(latex, dpi, U_str(cfg.LATEX_URL) || undefined);
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  if (res.getResponseCode() !== 200) throw new Error('Dịch vụ LaTeX trả mã ' + res.getResponseCode());
  var blob = res.getBlob();
  if (!/^image\//.test(blob.getContentType() || '')) throw new Error('Dịch vụ LaTeX không trả về ảnh (công thức có lỗi cú pháp?)');
  blob.setName(name);
  folder.createFile(blob);
  return blob;
}

function FX_driveId(ref) {
  var s = U_str(ref), m;
  if ((m = s.match(/\/d\/([-\w]{20,})/))) return m[1];
  if ((m = s.match(/[?&]id=([-\w]{20,})/))) return m[1];
  if (/^[-\w]{25,}$/.test(s)) return s;
  return '';
}

function FX_blobFromRef(ref) {
  var id = FX_driveId(ref);
  if (id) return DriveApp.getFileById(id).getBlob();
  if (/^https?:\/\//i.test(U_str(ref))) {
    var r = UrlFetchApp.fetch(U_str(ref), { muteHttpExceptions: true, followRedirects: true });
    if (r.getResponseCode() !== 200) throw new Error('Tải ảnh lỗi mã ' + r.getResponseCode());
    return r.getBlob();
  }
  throw new Error('Không nhận ra ID/đường dẫn ảnh');
}

/** Mẫu regex không phân biệt hoa/thường cho SBD */
function FX_ciPattern(s) {
  return Array.from(U_str(s)).map(function (c) {
    var up = c.toUpperCase(), lo = c.toLowerCase();
    if (up !== lo) return '[' + up + lo + ']';
    return U_escapeRegex(c);
  }).join('');
}

function FX_applySbdValidation(textItem, sbds) {
  if (!sbds.length) { FX_try(function () { textItem.clearValidation(); }); return; }
  var pattern = '^\\s*(' + sbds.map(FX_ciPattern).join('|') + ')\\s*$';
  var v = FormApp.createTextValidation()
    .setHelpText('SBD không thuộc danh sách của mã đề này — kiểm tra lại hoặc báo giám thị. / Student ID not registered for this paper.')
    .requireTextMatchesPattern(pattern).build();
  textItem.setValidation(v);
}
