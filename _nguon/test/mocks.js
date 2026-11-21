// Mô phỏng tối thiểu các dịch vụ Apps Script để chạy thử toàn bộ quy trình bằng Node
let idSeq = 1;
const newId = (p) => p + '_' + String(idSeq++).padStart(28, 'x');

function colToNum(c) { let n = 0; for (const ch of c) n = n * 26 + (ch.charCodeAt(0) - 64); return n; }

class Range {
  constructor(sheet, r, c, nr, nc) { Object.assign(this, { sheet, r, c, nr, nc }); }
  getValues() { const out = []; for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) row.push(this.sheet._get(this.r + i, this.c + j)); out.push(row); } return out; }
  setValues(v) {
    if (v.length !== this.nr || v.some((row) => row.length !== this.nc)) throw new Error(`setValues size mismatch ${v.length}x${v[0] && v[0].length} vs ${this.nr}x${this.nc}`);
    v.forEach((row, i) => row.forEach((x, j) => this.sheet._set(this.r + i, this.c + j, x))); return this;
  }
  clearContent() { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sheet._set(this.r + i, this.c + j, ''); return this; }
}
['setFontWeight', 'setBackground', 'setFontColor', 'setWrap', 'setVerticalAlignment', 'setNumberFormat', 'setDataValidation', 'setNote', 'setFontSize']
  .forEach((m) => (Range.prototype[m] = function () { return this; }));

class Sheet {
  constructor(ss, name) { this.ss = ss; this.name = name; this.data = []; this.maxRows = 1000; this.hidden = false; }
  _get(r, c) { return (this.data[r - 1] && this.data[r - 1][c - 1] !== undefined) ? this.data[r - 1][c - 1] : ''; }
  _set(r, c, v) { if (r > this.maxRows) throw new Error('Row out of range ' + r); while (this.data.length < r) this.data.push([]); this.data[r - 1][c - 1] = v; }
  getName() { return this.name; }
  getLastRow() { for (let i = this.data.length; i > 0; i--) if ((this.data[i - 1] || []).some((x) => x !== '' && x !== undefined)) return i; return 0; }
  getLastColumn() { let m = 0; this.data.forEach((r) => r.forEach((x, j) => { if (x !== '' && x !== undefined) m = Math.max(m, j + 1); })); return m; }
  getMaxRows() { return this.maxRows; }
  getMaxColumns() { return Math.max(26, this.getLastColumn()); }
  deleteRows(r, n) { this.data.splice(r - 1, n); this.maxRows -= n; return this; }
  deleteColumns(c, n) { this.data.forEach((row) => row.splice(c - 1, n)); return this; }
  insertRowsAfter(_, n) { this.maxRows += n; }
  getRange(a, b, c, d) {
    if (typeof a === 'string') {
      const m = a.match(/^([A-Z]+)(\d*)(?::([A-Z]+)(\d*))?$/);
      if (!m) throw new Error('A1 ' + a);
      const r1 = m[2] ? +m[2] : 1, c1 = colToNum(m[1]), c2 = m[3] ? colToNum(m[3]) : c1, r2 = m[4] ? +m[4] : (m[2] ? r1 : this.maxRows);
      return new Range(this, r1, c1, r2 - r1 + 1, c2 - c1 + 1);
    }
    if (a < 1 || b < 1 || (c !== undefined && c < 1) || (d !== undefined && d < 1)) throw new Error(`getRange invalid ${a},${b},${c},${d}`);
    return new Range(this, a, b, c || 1, d || 1);
  }
  setFrozenRows() { return this; } setColumnWidth() { return this; } hideSheet() { this.hidden = true; return this; }
  clear() { this.data = []; return this; }
  deleteRow(r) { this.data.splice(r - 1, 1); return this; }
  appendRow(arr) { const r = this.getLastRow() + 1; if (r > this.maxRows) this.maxRows = r; arr.forEach((v, j) => this._set(r, j + 1, v)); return this; }
  insertColumnsAfter(c, n) { this.data.forEach((row) => { if (row.length > c) row.splice(c, 0, ...Array(n).fill('')); }); return this; }
}

class Spreadsheet {
  constructor(name) { this.id = newId('ss'); this.name = name; this.sheets = [new Sheet(this, 'Sheet1')]; }
  getId() { return this.id; } getUrl() { return 'https://docs.google.com/spreadsheets/d/' + this.id; }
  getSheetByName(n) { return this.sheets.find((s) => s.name === n) || null; }
  insertSheet(n) { if (this.getSheetByName(n)) throw new Error('dup sheet'); const s = new Sheet(this, n); this.sheets.push(s); return s; }
  getSheets() { return this.sheets.slice(); }
  deleteSheet(s) { this.sheets = this.sheets.filter((x) => x !== s); }
  setActiveSheet(s) { this._active = s; return s; } moveActiveSheet() { }
  getRange(a1) { const [sn, r] = a1.split('!'); return this.getSheetByName(sn).getRange(r); }
}

// ---------------- Forms ----------------
class Item {
  constructor(form, type) { this.form = form; this.type = type; this.id = form._nextItemId++; this.title = ''; this.help = ''; this.required = false; }
  getId() { return this.id; } getType() { return this.type; }
  setTitle(t) { if (typeof t !== 'string') throw new Error('title must be string'); this.title = t; return this; }
  setHelpText(t) { this.help = t; return this; }
  setRequired(b) { this.required = !!b; return this; }
  setChoiceValues(v) {
    if (!v.length) throw new Error('no choices');
    if (new Set(v).size !== v.length) throw new Error('Duplicate choice values: ' + v.join('|'));
    if (v.some((x) => !String(x).trim())) throw new Error('empty choice');
    this.choices = v; return this;
  }
  setRows(v) { if (new Set(v).size !== v.length || v.some((x) => !x)) throw new Error('bad rows'); this.rows = v; return this; }
  setColumns(v) { if (new Set(v).size !== v.length || v.some((x) => !x)) throw new Error('bad cols'); this.cols = v; return this; }
  setImage(b) { if (!b || !b.getContentType) throw new Error('bad blob'); this.image = b; return this; }
  setVideoUrl(u) { if (!/youtu/.test(u)) throw new Error('not youtube'); this.video = u; return this; }
  setValidation(v) { this.validation = v; return this; }
  clearValidation() { this.validation = null; return this; }
  setAlignment() { return this; }
  asTextItem() { if (this.type !== 'TEXT') throw new Error('not text'); return this; }
}
class Form {
  constructor(title) { this.id = newId('form'); this.title = title; this.items = []; this._nextItemId = 1000; this.accepting = true; this.published = false; this.responses = []; }
  getId() { return this.id; } getTitle() { return this.title; }
  getEditUrl() { return 'https://docs.google.com/forms/d/' + this.id + '/edit'; }
  getPublishedUrl() { return 'https://docs.google.com/forms/d/e/' + this.id + '/viewform'; }
  setTitle(t) { this.title = t; return this; } setDescription(d) { this.desc = d; return this; }
  setIsQuiz(b) { this.quiz = b; return this; } setAllowResponseEdits() { return this; } setLimitOneResponsePerUser() { return this; }
  setShowLinkToRespondAgain() { return this; } setPublishingSummary() { return this; } setProgressBar() { return this; }
  setShuffleQuestions() { return this; } setConfirmationMessage(m) { this.confirm = m; return this; } setCustomClosedFormMessage() { return this; }
  setCollectEmail() { return this; }
  isPublished() { return this.published; } setPublished(b) { this.published = b; return this; }
  setAcceptingResponses(b) { if (!this.published) throw new Error('form not published'); this.accepting = b; return this; }
  isAcceptingResponses() { return this.accepting; }
  _add(type) { const it = new Item(this, type); this.items.push(it); return it; }
  addTextItem() { return this._add('TEXT'); } addPageBreakItem() { return this._add('PAGE_BREAK'); }
  addSectionHeaderItem() { return this._add('SECTION_HEADER'); } addMultipleChoiceItem() { return this._add('MULTIPLE_CHOICE'); }
  addCheckboxItem() { return this._add('CHECKBOX'); } addGridItem() { return this._add('GRID'); }
  addImageItem() { return this._add('IMAGE'); } addVideoItem() { return this._add('VIDEO'); }
  getItems() { return this.items.slice(); }
  getItemById(id) { return this.items.find((i) => i.id === Number(id)) || null; }
  deleteItem(i) { this.items = this.items.filter((x) => x !== i); }
  getResponses() { return this.responses.slice(); }
  // helper cho test: nộp bài, kiểm tra ràng buộc SBD như Google Form
  _submit(answers, ts) {
    if (!this.accepting) throw new Error('Form closed');
    const sbdItem = this.items.find((i) => i.type === 'TEXT' && /Student ID/.test(i.title));
    if (sbdItem && sbdItem.validation && !new RegExp(sbdItem.validation.pattern).test(answers[sbdItem.id] || '')) throw new Error('SBD validation failed');
    const rid = newId('resp');
    const items = this.items;
    this.responses.push({
      getId: () => rid, getTimestamp: () => ts || new Date(),
      getItemResponses: () => Object.keys(answers).map((k) => ({ getItem: () => items.find((i) => String(i.id) === String(k)), getResponse: () => answers[k] }))
    });
    return rid;
  }
}

function makeEnv() {
  const store = { ss: {}, forms: {}, files: {}, folders: {}, props: {}, triggers: [] };
  let active = null;
  const mkFolder = (name) => {
    const f = { id: newId('fd'), name, files: [], setTrashed() { this.trashed = true; }, getId() { return this.id; }, getUrl() { return 'https://drive.google.com/drive/folders/' + this.id; },
      createFolder: (n) => mkFolder(n), getFilesByName(n) { const l = this.files.filter((x) => x.name === n); let i = 0; return { hasNext: () => i < l.length, next: () => l[i++] }; },
      createFile(blob) { const file = { id: newId('img'), name: blob.getName(), blob, getBlob: () => blob, getId() { return this.id; }, getUrl() { return 'https://drive.google.com/file/d/' + this.id; }, setTrashed: () => { const i = f.files.indexOf(file); if (i >= 0) f.files.splice(i, 1); } }; this.files.push(file); return file; } };
    store.folders[f.id] = f; return f;
  };
  const blob = (type, name) => { let n = name || 'x'; return { getContentType: () => type, setName(v) { n = v; return this; }, getName: () => n, getBytes: () => [137, 80, 78, 71, 1, 2, 3] }; };
  // DocumentApp: chuỗi gọi bất kỳ (body.appendParagraph(...).appendText(...).setBold(...)…)
  const docs = {};
  const chain = (log) => new Proxy(function () { }, {
    get(_, k) {
      if (k === 'getId') return () => 'doc_' + log.id; if (k === 'getUrl') return () => 'https://docs.google.com/document/d/doc_' + log.id;
      if (k === 'getNumChildren') return () => 2; if (k === 'getText') return () => ''; if (k === 'getWidth') return () => 200; if (k === 'getHeight') return () => 40;
      if (k === Symbol.toPrimitive || k === 'then') return undefined;
      return (...a) => { log.calls.push([k, a.map((x) => (typeof x === 'string' ? x : typeof x))]); return chain(log); };
    },
    apply() { return chain(log); }
  });
  const env = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => active,
      openById: (id) => { if (!store.ss[id]) throw new Error('no ss ' + id); return store.ss[id]; },
      create: (n) => { const s = new Spreadsheet(n); store.ss[s.id] = s; return s; },
      newDataValidation: () => { const b = { requireValueInRange: () => b, requireValueInList: () => b, setAllowInvalid: () => b, build: () => ({}) }; return b; }
    },
    FormApp: {
      create: (t) => { const f = new Form(t); store.forms[f.id] = f; return f; },
      openById: (id) => { if (!store.forms[id]) throw new Error('no form ' + id); return store.forms[id]; },
      createTextValidation: () => { const v = {}; const b = { setHelpText: (h) => { v.help = h; return b; }, requireTextMatchesPattern: (p) => { v.pattern = p; return b; }, requireNumber: () => b, build: () => v }; return b; },
      Alignment: { LEFT: 'LEFT' }
    },
    DriveApp: {
      createFolder: (n) => mkFolder(n),
      getFolderById: (id) => { if (!store.folders[id]) throw new Error('no folder'); return store.folders[id]; },
      getFileById: (id) => ({ moveTo: () => { }, getBlob: () => blob('image/png', id), getAs: (m) => blob(m, id), setTrashed: () => { },
        makeCopy: (name, folder) => { const c = { id: newId('cp'), name, getId() { return this.id; }, getUrl() { return 'https://drive.google.com/file/d/' + this.id; }, getName: () => name }; if (folder && folder.files) folder.files.push(c); return c; } })
    },
    DocumentApp: {
      create: (n) => { const log = { id: Object.keys(docs).length + 1, name: n, calls: [] }; docs[n] = log; return chain(log); },
      HorizontalAlignment: { CENTER: 'CENTER', LEFT: 'LEFT' }, ParagraphHeading: { HEADING2: 'H2' }
    },
    CacheService: (() => { const m = new Map(); const c = { get: (k) => (m.has(k) ? m.get(k) : null), put: (k, v) => { if (String(v).length > 100000) throw new Error('cache value too big'); m.set(k, String(v)); },
      putAll: (o) => Object.keys(o).forEach((k) => c.put(k, o[k])), getAll: (ks) => { const r = {}; ks.forEach((k) => { if (m.has(k)) r[k] = m.get(k); }); return r; }, remove: (k) => m.delete(k), _m: m };
      return { getScriptCache: () => c }; })(),
    ContentService: { MimeType: { XML: 'XML', TEXT: 'TEXT' }, createTextOutput: (s) => ({ s, setMimeType() { return this; } }) },
    UrlFetchApp: { calls: 0, fetch(url) { this.calls++; env._lastUrl = url; return { getResponseCode: () => 200, getBlob: () => blob('image/png') }; } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => store.props[k] || null, setProperty: (k, v) => { store.props[k] = v; } }) },
    LockService: { getScriptLock: () => ({ waitLock() { }, releaseLock() { } }) },
    Session: { getActiveUser: () => ({ getEmail: () => 'admin@example.com' }), getEffectiveUser: () => ({ getEmail: () => 'admin@example.com' }) },
    ScriptApp: {
      getProjectTriggers: () => store.triggers.slice(),
      deleteTrigger: (t) => { store.triggers = store.triggers.filter((x) => x !== t); },
      newTrigger: (fn) => { const t = { fn, getHandlerFunction: () => fn }; const b = { at: (d) => { t.at = d; return b; }, everyWeeks: (n) => { t.weeks = n; return b; }, everyDays: (n) => { t.days = n; return b; },
        onWeekDay: (w) => { t.weekDay = w; return b; }, atHour: (h) => { t.hour = h; return b; }, create: () => { store.triggers.push(t); return t; } }; return { timeBased: () => b }; },
      WeekDay: { SUNDAY: 'SUNDAY', MONDAY: 'MONDAY' },
      getService: () => ({ getUrl: () => '' })
    },
    Utilities: {
      sleep() { },
      formatDate(d, tz, fmt) {
        const t = new Date(d.getTime() + 7 * 3600 * 1000); const p = (n) => String(n).padStart(2, '0');
        const s = { yyyy: t.getUTCFullYear(), MM: p(t.getUTCMonth() + 1), dd: p(t.getUTCDate()), HH: p(t.getUTCHours()), mm: p(t.getUTCMinutes()), ss: p(t.getUTCSeconds()) };
        return fmt.replace('yyyy', s.yyyy).replace('MM', s.MM).replace('dd', s.dd).replace('HH', s.HH).replace('mm', s.mm).replace('ss', s.ss);
      },
      base64Decode: (b) => Array.from(Buffer.from(b, 'base64')),
      base64Encode: (a) => (typeof a === 'string' ? Buffer.from(a, 'utf8') : Buffer.from(a.map((x) => (x + 256) % 256))).toString('base64'),
      getUuid: () => require('crypto').randomUUID(),
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (alg, s) => Array.from(require('crypto').createHash(alg).update(String(s), 'utf8').digest()).map((b) => (b > 127 ? b - 256 : b)),
      // đọc file ZIP tối giản (store / deflate) như Utilities.unzip của Apps Script
      unzip(blob) {
        const buf = Buffer.from((typeof blob.bytes === 'string' ? Buffer.from(blob.bytes) : Buffer.from(blob.bytes.map((x) => (x + 256) % 256))));
        let e = buf.length - 22; while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
        if (e < 0) throw new Error('Invalid zip');
        const n = buf.readUInt16LE(e + 10); let p = buf.readUInt32LE(e + 16); const out = [];
        for (let i = 0; i < n; i++) {
          const meth = buf.readUInt16LE(p + 10), csz = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), lo = buf.readUInt32LE(p + 42);
          const name = buf.slice(p + 46, p + 46 + nl).toString('utf8'); p += 46 + nl + xl + cl;
          if (/\/$/.test(name)) continue;
          const ds = lo + 30 + buf.readUInt16LE(lo + 26) + buf.readUInt16LE(lo + 28), raw = buf.slice(ds, ds + csz);
          const data = meth === 8 ? require('zlib').inflateRawSync(raw) : raw;
          out.push({ getName: () => name, getDataAsString: () => data.toString('utf8') });
        }
        return out;
      },
      newBlob: (bytes, type, name) => ({ bytes, getContentType: () => type, getName: () => name, setName() { return this; },
        getDataAsString: () => (typeof bytes === 'string' ? bytes : Buffer.from(bytes.map((x) => (x + 256) % 256)).toString('utf8')) }),
      parseDate(str) { const m = str.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/); return new Date(Date.UTC(+m[1], m[2] - 1, +m[3], m[4] - 7, +m[5], +m[6])); }
    },
    HtmlService: { createHtmlOutput: (h) => ({ html: String(h), getContent() { return this.html; }, setTitle() { return this; }, addMetaTag() { return this; } }) },
    LanguageApp: {
      calls: 0,
      translate(text, from, to) {
        this.calls++;
        // giả lập: giữ nguyên thẻ & phần notranslate, chữ thường thì thêm tiền tố [to]
        return String(text).split(/(<span class="notranslate"[^>]*>[\s\S]*?<\/span>)/).map((part, i) => (i % 2 ? part :
          part.replace(/(^|>)([^<]+)(?=<|$)/g, (m, lead, t) => lead + (t.trim() ? '[' + to + ']' + t : t)))).join('');
      }
    },
    _store: store, _docs: docs,
    _setActive: (s) => { active = s; },
    _newHub: () => { const s = new Spreadsheet('TRUNG TAM'); store.ss[s.id] = s; active = s; return s; }
  };
  return env;
}
module.exports = { makeEnv };
