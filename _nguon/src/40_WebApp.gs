/**
 * 40_WebApp.gs — Menu trong Google Sheets, Web App (doGet) và cổng API cho giao diện
 */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🎓 Hệ thống thi')
    .addItem('Mở bảng điều khiển', 'UI_openDialog')
    .addItem('📝 Nhập câu hỏi nhanh', 'UI_openEditor')
    .addItem('Link Web App (mở ở tab riêng)', 'UI_webAppUrl')
    .addSeparator()
    .addItem('① Khởi tạo / sửa cấu trúc hệ thống', 'UI_setup')
    .addItem('② Tạo dữ liệu mẫu (môn DEMO, kỳ thi KT_DEMO)', 'UI_sample')
    .addItem('Tạo môn học mới…', 'UI_newSubject')
    .addToUi();
}

function UI_setup() {
  var r = Setup_init();
  SpreadsheetApp.getUi().alert('Đã khởi tạo.\n\nThư mục dữ liệu trên Drive:\n' + r.folderUrl +
    '\n\nTiếp theo: menu 🎓 Hệ thống thi › Mở bảng điều khiển.');
}

function UI_sample() {
  var r = Setup_sample();
  SpreadsheetApp.getUi().alert('Đã tạo dữ liệu mẫu.\nNgân hàng môn DEMO: ' + r.bankUrl +
    '\n\nMở bảng điều khiển › Kỳ thi › chọn KT_DEMO › Sinh đề nháp để chạy thử.');
}

function UI_newSubject() {
  var ui = SpreadsheetApp.getUi();
  var a = ui.prompt('Tạo môn mới', 'Nhập: MÃ_MÔN | Tên môn   (ví dụ: ML | Học máy cơ bản)', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  var parts = a.getResponseText().split('|');
  var r = Setup_createSubject(parts[0], (parts[1] || '').trim());
  ui.alert('Đã tạo file ngân hàng môn ' + r.maMon + ':\n' + r.url);
}

function UI_html() {
  var t = HtmlService.createTemplateFromFile('Index');
  t.appName = APP.NAME;
  t.version = APP.VERSION;
  return t.evaluate().setTitle(APP.NAME).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function UI_openDialog() {
  SpreadsheetApp.getUi().showModalDialog(UI_html().setWidth(1500).setHeight(900), APP.NAME);
}

function UI_webAppUrl() {
  var url = '';
  try { url = ScriptApp.getService().getUrl(); } catch (e) { }
  SpreadsheetApp.getUi().alert(url ? 'Link Web App:\n' + url :
    'Chưa triển khai Web App.\nTrong trình soạn Apps Script: Triển khai › Tùy chọn triển khai mới › Loại: Ứng dụng web › ' +
    'Thực thi với tư cách: Tôi › Người có quyền truy cập: Chỉ mình tôi.');
}

/** Web App: /exec → bảng điều khiển ; /exec?p=nhap&mon=AIG → trình nhập câu hỏi nhanh */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.p === 'nhap') return UI_editorHtml(p.mon || '');
  return UI_html();
}

/** Bảng định tuyến API — giao diện gọi google.script.run.API_call(tên, [tham số]) */
var API_ROUTES = {
  state: function () {
    var ready = S_isReady();
    var out = { ready: ready, app: APP.NAME, version: APP.VERSION };
    if (!ready) return out;
    var hub = S_hub();
    out.hubUrl = hub.getUrl();
    try { out.folderUrl = S_rootFolder().getUrl(); } catch (e) { }
    out.subjects = Repo_subjects();
    out.matrices = Repo_matrixList();
    out.exams = ES_examList();
    out.levels = Repo_levels();
    out.dangs = Object.keys(DANG).map(function (k) { return { code: k, name: DANG_TEN[k] }; });
    out.config = Repo_config();
    return out;
  },
  setup: function () { return Setup_init(); },
  sample: function () { return Setup_sample(); },
  createSubject: function (ma, ten) { return Setup_createSubject(ma, ten); },
  bank: function (maMon) {
    Repo_clearCache();
    var b = Repo_bank(maMon);
    var qs = Object.keys(b.questions).map(function (id) {
      var q = b.questions[id];
      return { id: id, maChuDe: q.maChuDe, mucDo: q.mucDo, dang: q.dang, maNhom: q.maNhom, vi: q.vi, en: q.en, latex: q.latex,
        hinh: q.hinh.length, video: q.video, amThanh: q.amThanh, options: q.options, right: q.right, dapAn: q.keyRaw,
        active: q.active, valid: q.valid, loiGiai: q.loiGiaiVi, fixed: q.shuffle.noShuffle ? 'TAT_CA' : q.shuffle.fixed.join(','), row: q.row };
    });
    var groups = Object.keys(b.groups).map(function (k) { var g = b.groups[k]; return { id: g.id, vi: g.vi, en: g.en, latex: g.latex, children: g.children }; });
    return { subject: b.subject, questions: qs, groups: groups, topics: b.topics, issues: b.issues, summary: Bank_summary(b),
      units: b.units.length, levels: b.levels };
  },
  matrix: function (id) { return ES_matrixRaw(id); },
  saveMatrix: function (id, maMon, ten, sections, cells) { return ES_saveMatrix(id, maMon, ten, sections, cells); },
  checkMatrix: function (id, maMon, n, cheDo) { return ES_checkMatrix(id, maMon, n, cheDo); },
  saveExam: function (o) { return ES_saveExam(o); },
  generate: function (ma) { return ES_generate(ma); },
  variants: function (ma) { return ES_variants(ma); },
  swap: function (ma, md, ch) { return ES_swap(ma, md, ch); },
  lock: function (ma, md, ch, v) { return ES_lock(ma, md, ch, v); },
  finalize: function (ma) { return ES_finalize(ma); },
  unfinalize: function (ma) { return ES_unfinalize(ma); },
  students: function (ma) { return EC_students(ma); },
  importStudents: function (ma, text, mode) { return EC_importStudents(ma, text, mode); },
  assign: function (ma, method) { return EC_assign(ma, method); },
  exportVariant: function (ma, md, force) { return FX_exportVariant(ma, md, force); },
  open: function (ma) { return EC_open(ma); },
  close: function (ma) { return EC_close(ma, false); },
  scheduleClose: function (ma, dt) { return EC_scheduleClose(ma, dt); },
  monitor: function (ma) { return EC_monitor(ma); },
  collect: function (ma, md) { return GR_collectVariant(ma, md); },
  regrade: function (ma) { return GR_regradeStored(ma); },
  compile: function (ma) { return GR_compile(ma); },
  report: function (ma) { return GR_report(ma); },
  addReview: function (ma, ch, act, val, why) { return GR_addReview(ma, ch, act, val, why); },
  toggleReview: function (ma, idx, on) { return GR_toggleReview(ma, idx, on); },
  // ---- trình nhập câu hỏi nhanh ----
  /** Từ bảng điều khiển: trong Sheets thì mở hộp thoại nhập; ở Web App thì trả link ?p=nhap */
  openEditor: function (maMon) {
    try { SpreadsheetApp.getUi(); } catch (e) {
      return { url: UI_safeUrl() + '?p=nhap&mon=' + encodeURIComponent(U_upper(maMon || '')) };
    }
    SpreadsheetApp.getUi().showModelessDialog(UI_editorHtml(maMon).setWidth(1480).setHeight(900), '📝 Nhập câu hỏi nhanh');
    return { opened: true };
  },
  subjects: function () { return { subjects: Repo_subjects(), webUrl: UI_safeUrl() }; },
  beInit: function (maMon) { return BE_init(maMon); },
  beSave: function (maMon, rec, origId) { return BE_save(maMon, rec, origId); },
  beSaveMany: function (maMon, recs) { return BE_saveMany(maMon, recs); },
  beStatus: function (maMon, id, st) { return BE_setStatus(maMon, id, st); },
  beDelete: function (maMon, id) { return BE_delete(maMon, id); },
  beGroup: function (maMon, g) { return BE_saveGroup(maMon, g); },
  beUpload: function (maMon, b64, mime, name) { return BE_uploadImage(maMon, b64, mime, name); },
  beTranslate: function (texts, from, to) { return BE_translate(texts, from, to); },
  beProgress: function (maMon, mt, n) { return BE_progress(maMon, mt, n); },
  // ---- phòng thi web ----
  ptState: function (ma) { return PTA_state(ma); },
  ptSetup: function () { return PTA_setupRoom(); },
  ptSetUrl: function (url) { return PTA_setUrl(url); },
  ptPublish: function (ma, o) { return PTA_publish(ma, o); },
  ptSettings: function (ma, o) { return PTA_saveSettings(ma, o); },
  ptOpen: function (ma, force) { return PTA_open(ma, force); },
  ptPush: function () { return PTA_pushCode(null, true); },
  ptPing: function () { return PTA_ping(true); },
  ptBoot: function () { return PTA_bootSource(); },
  ptClose: function (ma) { var r = PTA_close(ma); PTA_signal(ma, null); return r; },
  ptMonitor: function (ma) { return PTA_monitor(ma); },
  ptCommand: function (ma, sbds, cmd, v) { var r = PTA_command(ma, sbds, cmd, v); PTA_signal(ma, sbds); return r; },
  ptReset: function (ma, sbds, nc) { var r = PTA_reset(ma, sbds, nc); PTA_signal(ma, sbds); return r; },
  ptContinue: function (ma, sbds, m) { var r = PTA_continue(ma, sbds, m); PTA_signal(ma, sbds); return r; },
  ptResetExam: function (ma, nc) { var r = PTA_resetExam(ma, nc); PTA_signal(ma, null); return r; },
  ptBan: function (ma, sbds, why) { var r = PTA_ban(ma, sbds, why); PTA_signal(ma, sbds); return r; },
  ptUnban: function (ma, sbds, mode, o) { var r = PTA_unban(ma, sbds, mode, o); PTA_signal(ma, sbds); return r; },
  ptSebRef: function (ma, sbd) { return PTA_sebRef(ma, sbd || ''); },
  ptAppGroups: function () { return PTA_appGroups(); },
  ptPersonal: function (ma, sbds, kieu, nc) { var r = PTA_personal(ma, sbds, kieu === 'MOI' ? 'MOI' : 'TRON', !!nc); PTA_signal(ma, sbds); return r; },
  ptPause: function (ma, sbds, on) { var r = PTA_pause(ma, sbds, on); PTA_signal(ma, sbds); return r; },
  ptCloseIn: function (ma, m, o) { var r = PTA_closeIn(ma, m, o); PTA_signal(ma, null); return r; },
  ptUnlockCode: function (ma, renew) { return PTA_unlockCode(ma, !!renew); },
  ptBrand: function (o) { return PTA_brand(o || null); },
  ptSyncStudents: function (ma) { return PTA_syncStudents(ma); },
  ptCancelClose: function (ma) { var r = PTA_cancelClose(ma); PTA_signal(ma, null); return r; },
  ptPeek: function (ma, sbd) { return PTA_peek(ma, sbd); },
  ptThu: function (ma, o) { return PTA_preview(ma, o || {}); },
  ptThuEnd: function (ma) { return PTA_previewEnd(ma); },
  ptThuPeek: function (ma) { return PTA_previewPeek(ma); },
  ptCheck: function (ma) { return PTA_check(ma); },
  ptEvents: function (ma, sbd) { return PTA_events(ma, sbd); },
  ptCollect: function (ma) { return PTA_collect(ma); },
  // ---- lập trình
  ltList: function () { return LT_list(); },
  ltGet: function (ma) { return LT_get(ma); },
  ltSave: function (o) { return LT_save(o); },
  ltDelete: function (ma) { return LT_delete(ma); },
  ltCopy: function (ma) { return LT_copy(ma); },
  ltSample: function () { return LT_loadSample(); },
  ltJudge: function () { return LT_judgeView(); },
  ltSetJudge: function (o) { return LT_setJudge(o || {}); },
  ltTestJudge: function () { return LT_testJudge(); },
  ltValidate: function (ma, fill) { return LT_validate(ma, fill || ''); },
  ltTry: function (ma, lang, code, custom) { return LT_tryCode(ma, lang, code, custom); },
  ltImpPreview: function (txt) { return LT_importPreview(txt); },
  ltImport: function (txt, o) { return LT_import(txt, o || {}); },
  ltExport: function (mas) { return LT_exportText(mas || []); },
  ltTestFiles: function (files) { return LT_testFiles(files || []); },
  ltGenTests: function (lang, code, n) { return LT_genTests(lang, code, n); },
  ltExamGet: function (ma) { return LT_examGet(ma); },
  ltExamSave: function (ma, o) { return LT_examSave(ma, o || {}); },
  ltReport: function (ma) { return LT_report(ma); },
  ltHistory: function (ma, sbd) { return LT_history(ma, sbd); },
  // ---- dọn dẹp & sao lưu
  sysStats: function () { return DD_stats(); },
  sysCleanLogs: function (o) { return DD_cleanLogs(o || {}); },
  sysCleanAutosave: function (o) { return DD_cleanAutosave(o || {}); },
  sysCompact: function () { return DD_compact(); },
  sysArchive: function (ma, o) { return DD_archiveExam(ma, o || {}); },
  sysBackup: function () { return DD_backup(); },
  sysAutoGet: function () { return DD_autoGet(); },
  sysAutoSet: function (o) { return DD_autoSet(o || {}); },
  sysAutoRun: function () { return DD_autoTick(); },
  ltBoard: function (ma) { return LT_board(ma); },
  ptManual: function (ma, sbd, text, dry) { return PTA_manual(ma, sbd, text, dry); },
  ptSeb: function (ma, o) { return PTA_seb(ma, o); },
  ptCards: function (ma) { return PTA_cards(ma); },
  printData: function (ma, md) { return PTA_printData(ma, md); },
  pdf: function (ma, md, kind) { return PTA_pdf(ma, md, kind); }
};

/**
 * Chỉ chủ hệ thống (hoặc email trong CauHinh!QUAN_TRI_EMAIL) mới gọi được API quản trị.
 * Khách ẩn danh (Session.getActiveUser rỗng) bị chặn — phòng khi Web App quản trị bị triển khai nhầm "Bất kỳ ai".
 */
function API_isAdmin() {
  var a = '', e = '';
  try { a = Session.getActiveUser().getEmail() || ''; } catch (x) { }
  try { e = Session.getEffectiveUser().getEmail() || ''; } catch (x) { }
  if (!a) return false;
  if (a === e) return true;
  var extra = '';
  try { extra = U_str(Repo_config().QUAN_TRI_EMAIL); } catch (x) { }
  return U_splitList(extra).map(function (x) { return x.toLowerCase(); }).indexOf(a.toLowerCase()) >= 0;
}

function UI_safeUrl() { try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; } }

function API_call(name, args) {
  try {
    var fn = API_ROUTES[name];
    if (!fn) throw new Error('API không tồn tại: ' + name);
    if (!API_isAdmin()) throw new Error('Không có quyền quản trị. Hãy mở bằng tài khoản chủ hệ thống (Web App quản trị phải để "Chỉ mình tôi").');
    var data = fn.apply(null, args || []);
    return JSON.stringify({ ok: true, data: data === undefined ? null : data });
  } catch (e) {
    return JSON.stringify({ ok: false, error: (e && e.message) ? e.message : String(e) });
  }
}

function include(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }
