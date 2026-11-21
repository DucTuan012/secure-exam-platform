/**
 * 11_Core_Latex.gs — Xử lý công thức (THUẦN, test được bằng Node)
 *
 * Quy ước nhập liệu trong ngân hàng:
 *   $...$    công thức trong dòng. Hệ thống cố gắng đổi sang ký tự Unicode (x², √x, ∑, α, ≤ …)
 *            để hiển thị trực tiếp trên Google Form. Nếu công thức quá phức tạp (ma trận, tích phân
 *            nhiều tầng…) sẽ tự chuyển thành ẢNH và để ký hiệu [CT1] trong câu.
 *   $$...$$  công thức hiển thị riêng -> luôn chuyển thành ẢNH chèn ngay trước câu hỏi.
 *   \$       ký tự đô-la thường.
 *   Cột LaTeX của câu hỏi: công thức lớn (không cần $), luôn thành ảnh.
 */

var LX_SYM = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ',
  vartheta: 'ϑ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', varpi: 'ϖ', rho: 'ρ',
  varrho: 'ϱ', sigma: 'σ', varsigma: 'ς', tau: 'τ', upsilon: 'υ', phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  times: '×', cdot: '·', div: '÷', pm: '±', mp: '∓', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠',
  approx: '≈', equiv: '≡', sim: '∼', simeq: '≃', cong: '≅', propto: '∝', infty: '∞', partial: '∂', nabla: '∇',
  sum: '∑', prod: '∏', int: '∫', iint: '∬', iiint: '∭', oint: '∮', in: '∈', notin: '∉', ni: '∋', subset: '⊂',
  subseteq: '⊆', supset: '⊃', supseteq: '⊇', cup: '∪', cap: '∩', setminus: '∖', emptyset: '∅', varnothing: '∅',
  forall: '∀', exists: '∃', nexists: '∄', neg: '¬', lnot: '¬', land: '∧', wedge: '∧', lor: '∨', vee: '∨',
  to: '→', rightarrow: '→', leftarrow: '←', gets: '←', Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔',
  leftrightarrow: '↔', iff: '⇔', implies: '⇒', mapsto: '↦', uparrow: '↑', downarrow: '↓',
  ldots: '…', cdots: '⋯', dots: '…', vdots: '⋮', ddots: '⋱', circ: '∘', bullet: '•', degree: '°', angle: '∠',
  perp: '⊥', parallel: '∥', top: 'ᵀ', star: '⋆', ast: '∗', oplus: '⊕', otimes: '⊗', odot: '⊙',
  langle: '⟨', rangle: '⟩', lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉', mid: '|', vert: '|', Vert: '‖',
  ll: '≪', gg: '≫', prime: '′', hbar: 'ℏ', ell: 'ℓ', Re: 'ℜ', Im: 'ℑ', aleph: 'ℵ', therefore: '∴', because: '∵',
  '|': '‖', '{': '{', '}': '}', '%': '%', '$': '$', '_': '_', '&': '&', '#': '#',
  quad: ' ', qquad: '  ', ',': ' ', ';': ' ', ':': ' ', '>': ' ', '!': '', ' ': ' ',
  left: '', right: '', big: '', Big: '', bigg: '', Bigg: '', bigl: '', bigr: '', Bigl: '', Bigr: '',
  displaystyle: '', textstyle: '', limits: '', nolimits: ''
};

/** Toán tử dạng chữ: \sin, \log, … */
var LX_WORDS = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
  'log', 'ln', 'lg', 'exp', 'lim', 'max', 'min', 'sup', 'inf', 'det', 'arg', 'dim', 'ker', 'deg', 'gcd', 'Pr',
  'mod', 'bmod', 'argmax', 'argmin', 'tr', 'rank', 'sgn', 'var', 'Var', 'cov', 'Cov', 'diag'];

var LX_SUP = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
  'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ',
  'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ', 'A': 'ᴬ', 'B': 'ᴮ',
  'D': 'ᴰ', 'E': 'ᴱ', 'G': 'ᴳ', 'H': 'ᴴ', 'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ', 'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ',
  'P': 'ᴾ', 'R': 'ᴿ', 'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ', 'ᵀ': 'ᵀ', '*': '*', '′': '′', ' ': '',
  'β': 'ᵝ', 'γ': 'ᵞ', 'δ': 'ᵟ', 'θ': 'ᶿ', 'φ': 'ᵠ', 'χ': 'ᵡ', '∞': '^∞', ',': '˒'
};
var LX_SUB = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '−': '₋', '=': '₌', '(': '₍', ')': '₎', 'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
  'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ',
  'x': 'ₓ', 'β': 'ᵦ', 'γ': 'ᵧ', 'ρ': 'ᵨ', 'φ': 'ᵩ', 'χ': 'ᵪ', ' ': '', ',': ','
};

var LX_ACCENT = { hat: '̂', widehat: '̂', bar: '̄', overline: '̅', tilde: '̃', widetilde: '̃',
  vec: '⃗', dot: '̇', ddot: '̈', underline: '̲' };

var LX_PLAIN1 = ['mathbf', 'boldsymbol', 'bm', 'mathrm', 'text', 'textrm', 'textbf', 'textit', 'mathit', 'mathsf',
  'mathtt', 'texttt', 'operatorname', 'mbox', 'emph'];

function LX_bb(ch) {
  var m = { R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ', P: 'ℙ', H: 'ℍ', E: '𝔼', '1': '𝟙' };
  return m[ch] || ch;
}
function LX_cal(ch) {
  var hole = { B: 0x212C, E: 0x2130, F: 0x2131, H: 0x210B, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211B };
  if (hole[ch]) return String.fromCodePoint(hole[ch]);
  if (/[A-Z]/.test(ch)) return String.fromCodePoint(0x1D49C + ch.charCodeAt(0) - 65);
  return ch;
}

/** Đọc một "đối số": {…} hoặc 1 ký tự hoặc 1 lệnh \cmd. Trả {raw, end} */
function LX_readArg(s, i) {
  while (i < s.length && s[i] === ' ') i++;
  if (i >= s.length) return { raw: '', end: i, ok: false };
  if (s[i] === '{') {
    var depth = 0, j = i;
    for (; j < s.length; j++) {
      if (s[j] === '\\') { j++; continue; }
      if (s[j] === '{') depth++;
      else if (s[j] === '}') { depth--; if (depth === 0) break; }
    }
    if (j >= s.length) return { raw: s.substring(i + 1), end: s.length, ok: false };
    return { raw: s.substring(i + 1, j), end: j + 1, ok: true };
  }
  if (s[i] === '\\') {
    var m = s.substring(i).match(/^\\([A-Za-z]+|.)/);
    return { raw: m[0], end: i + m[0].length, ok: true };
  }
  return { raw: s[i], end: i + 1, ok: true };
}

function LX_isSimple(t) {
  return /^[^\s+\-−*\/=<>,;:()|±×·÷]+$/.test(t) || Array.from(t).length === 1;
}
function LX_wrap(t) { return LX_isSimple(t) ? t : '(' + t + ')'; }

function LX_script(content, map, mark) {
  var chars = Array.from(content);
  var ok = chars.every(function (c) { return map[c] !== undefined; });
  if (ok && chars.length) return chars.map(function (c) { return map[c]; }).join('');
  return mark + LX_wrap(content);
}

/**
 * Đổi công thức LaTeX (trong dòng) sang chuỗi Unicode.
 * @return {{text:string, ok:boolean}} ok=false nếu gặp lệnh không hỗ trợ -> nên dùng ảnh.
 */
function LX_toUnicode(src) {
  var state = { ok: true };
  var out = LX_conv(String(src), state);
  out = out.replace(/\s+/g, ' ').trim();
  return { text: out, ok: state.ok };
}

function LX_conv(s, st) {
  var out = '', i = 0;
  while (i < s.length) {
    var c = s[i];
    if (c === '\\') {
      var m = s.substring(i).match(/^\\([A-Za-z]+|.)/);
      if (!m) { out += c; i++; continue; }
      var cmd = m[1];
      i += m[0].length;
      if (cmd === '\\' || cmd === 'begin' || cmd === 'end' || cmd === 'binom' || cmd === 'matrix' ||
        cmd === 'pmatrix' || cmd === 'cases' || cmd === 'stackrel' || cmd === 'overset' || cmd === 'underset' ||
        cmd === 'substack' || cmd === 'xrightarrow') {
        st.ok = false; out += '\\' + cmd; continue;
      }
      if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') {
        var a = LX_readArg(s, i); var b = LX_readArg(s, a.end); i = b.end;
        if (!a.ok || !b.ok) st.ok = false;
        out += LX_wrap(LX_conv(a.raw, st).trim()) + '/' + LX_wrap(LX_conv(b.raw, st).trim());
        continue;
      }
      if (cmd === 'sqrt') {
        var n = '';
        while (s[i] === ' ') i++;
        if (s[i] === '[') { var k = s.indexOf(']', i); n = s.substring(i + 1, k).trim(); i = k + 1; }
        var r = LX_readArg(s, i); i = r.end;
        var inner = LX_conv(r.raw, st).trim();
        var root = n === '' ? '√' : (n === '3' ? '∛' : (n === '4' ? '∜' : LX_script(n, LX_SUP, '') + '√'));
        out += root + LX_wrap(inner);
        continue;
      }
      if (LX_ACCENT[cmd]) {
        var ac = LX_readArg(s, i); i = ac.end;
        var t = Array.from(LX_conv(ac.raw, st).trim());
        out += t.map(function (ch) { return ch + LX_ACCENT[cmd]; }).join('');
        continue;
      }
      if (cmd === 'mathbb' || cmd === 'mathcal' || cmd === 'mathscr') {
        var bb = LX_readArg(s, i); i = bb.end;
        out += Array.from(bb.raw.trim()).map(cmd === 'mathbb' ? LX_bb : LX_cal).join('');
        continue;
      }
      if (LX_PLAIN1.indexOf(cmd) >= 0) {
        var p = LX_readArg(s, i); i = p.end;
        out += (cmd.indexOf('text') === 0 || cmd === 'mbox') ? p.raw : LX_conv(p.raw, st);
        continue;
      }
      if (LX_WORDS.indexOf(cmd) >= 0) {
        var nxt = s.substring(i).replace(/^\s+/, '');
        out += cmd + (/^[A-Za-z0-9\\]/.test(nxt) ? ' ' : '');
        continue;
      }
      if (LX_SYM.hasOwnProperty(cmd)) {
        out += LX_SYM[cmd];
        if (['partial', 'nabla', 'neg', 'lnot'].indexOf(cmd) >= 0) { while (s[i] === ' ') i++; continue; }
        if (/^[A-Za-z]+$/.test(cmd) && LX_SYM[cmd].length && /^\s*[A-Za-z0-9]/.test(s.substring(i)) &&
          ['sum', 'prod', 'int', 'top', 'prime', 'partial', 'nabla', 'neg', 'lnot'].indexOf(cmd) < 0) out += ' ';
        continue;
      }
      st.ok = false; out += '\\' + cmd;
      continue;
    }
    if (c === '^' || c === '_') {
      var g = LX_readArg(s, i + 1); i = g.end;
      if (!g.ok) st.ok = false;
      var content = LX_conv(g.raw, st).trim();
      if (c === '^' && (content === 'ᵀ' || content === 'T')) { out += 'ᵀ'; continue; }
      if (c === '^' && (content === '′' || content === "'")) { out += '′'; continue; }
      out += LX_script(content, c === '^' ? LX_SUP : LX_SUB, c);
      continue;
    }
    if (c === '{' || c === '}') { i++; continue; }
    if (c === '&') { st.ok = false; out += c; i++; continue; }
    if (c === '~') { out += ' '; i++; continue; }
    if (c === '-' ) { out += '−'; i++; continue; }
    if (c === "'") { out += '′'; i++; continue; }
    out += c; i++;
  }
  return out;
}

/** Tách văn bản thành các đoạn: text / inline ($…$) / display ($$…$$) */
function LX_segments(s) {
  s = U_str(s);
  var segs = [], buf = '', i = 0;
  while (i < s.length) {
    if (s[i] === '\\' && s[i + 1] === '$') { buf += '$'; i += 2; continue; }
    if (s[i] === '$') {
      var dbl = s[i + 1] === '$';
      var close = dbl ? s.indexOf('$$', i + 2) : LX_findClose(s, i + 1);
      if (close < 0) { buf += s[i]; i++; continue; }
      if (buf) { segs.push({ type: 'text', value: buf }); buf = ''; }
      segs.push({ type: dbl ? 'display' : 'inline', value: s.substring(i + (dbl ? 2 : 1), close).trim() });
      i = close + (dbl ? 2 : 1);
      continue;
    }
    buf += s[i]; i++;
  }
  if (buf) segs.push({ type: 'text', value: buf });
  return segs;
}
function LX_findClose(s, from) {
  for (var j = from; j < s.length; j++) {
    if (s[j] === '\\') { j++; continue; }
    if (s[j] === '$') return j;
  }
  return -1;
}

function LX_hasMath(s) { return LX_segments(s).some(function (x) { return x.type !== 'text'; }); }

/**
 * Chuẩn bị văn bản cho Google Form.
 * @param {string} s văn bản có thể chứa $…$ / $$…$$
 * @param {Array} images mảng (dùng chung cho cả câu) để thêm công thức cần chuyển thành ảnh
 * @return {{text:string, ok:boolean}} ok=false nếu có công thức phải chuyển thành ảnh
 */
var LX_CODE_TAG = '\u0001CODE\u0001';

/** Cách hiển thị khối code / công thức trên Google Form (đặt từ CauHinh khi xuất Form) */
var LX_CODE_AS_IMAGE = false;   // false: code hiện dạng chữ (giữ thụt lề); true: ảnh PNG (thử nghiệm)
var LX_IMG_COMPLEX = true;      // true: công thức phân số/giới hạn/tổng/tích phân/căn… luôn thành ảnh

/** Giải mã thực thể HTML thường gặp khi code được dán từ trang web (&lt; &gt; &amp; …) */
function LX_decodeEntities(s) {
  return String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

/** Công thức "đơn giản" mới đổi sang chữ Unicode được; còn lại nên là ảnh */
function LX_isSimpleFormula(src) {
  var s = String(src);
  if (s.length > 40) return false;
  return !/\\(frac|dfrac|tfrac|lim|sum|prod|int|oint|sqrt|binom|begin|end|overline|underline|vec|hat|bar|widehat|widetilde|left|right|cdots|ldots|over|choose)(?![A-Za-z])|\\\\/.test(s);
}

/** Đoạn $…$ có phải chuyển thành ảnh không? (sg: phần tử của LX_segments) */
function LX_needsImage(sg) {
  if (sg.type === 'display') return true;
  if (sg.type !== 'inline') return false;
  var r = LX_toUnicode(sg.value);
  if (!r.ok) return true;
  return LX_IMG_COMPLEX && !LX_isSimpleFormula(sg.value);
}

/** Khối code → chữ thường (giữ thụt lề bằng khoảng trắng không ngắt dòng, có vạch dọc bên trái) */
function LX_codeText(code, lang) {
  var NB = ' ';
  var lines = LX_decodeEntities(code).replace(/\r/g, '').replace(/\t/g, '    ').split('\n').map(function (l) {
    l = l.replace(/\s+$/, '');
    var lead = l.match(/^ */)[0].length;
    var rest = l.substring(lead).replace(/ {2,}/g, function (m) { return new Array(m.length + 1).join(NB); });
    return '│' + NB + new Array(lead + 1).join(NB) + rest;
  });
  return (lang ? '▸ Code (' + lang + '):\n' : '▸ Code:\n') + lines.join('\n');
}

/** Khối code ``` … ``` → LaTeX (chữ đều, giữ thụt lề) để render thành ảnh PNG (chế độ thử nghiệm) */
function LX_codeLatex(code) {
  var esc = function (ch) {
    return ({ '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '$': '\\$', '%': '\\%', '&': '\\&', '#': '\\#', '_': '\\_',
      '^': '\\textasciicircum{}', '~': '\\textasciitilde{}', ' ': '\\ ', '<': '\\textless{}', '>': '\\textgreater{}', '|': '\\textbar{}' })[ch] || ch;
  };
  var lines = LX_decodeEntities(code).replace(/\t/g, '    ').split('\n').map(function (l) {
    return l ? '\\texttt{' + l.split('').map(esc).join('') + '}' : '\\texttt{\\ }';
  });
  return '\\begin{array}{l}' + lines.join('\\\\') + '\\end{array}';
}

function LX_forForm(s, images) {
  s = U_str(s).replace(/```([\w+#.-]*)[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```/g, function (m, lang, body) {
    if (LX_CODE_AS_IMAGE) {
      images.push(LX_CODE_TAG + body);
      return '[CT' + images.length + ']';
    }
    return '\n' + LX_codeText(body, lang) + '\n';
  });
  var segs = LX_segments(s), out = '', allOk = true;
  segs.forEach(function (sg) {
    if (sg.type === 'text') { out += sg.value; return; }
    if (!LX_needsImage(sg)) { out += LX_toUnicode(sg.value).text; return; }
    allOk = false;
    images.push(sg.value);
    out += '[CT' + images.length + ']';
  });
  return { text: out, ok: allOk };
}

/** Văn bản thuần không còn ký hiệu $ (dùng khi cần so sánh / xem trước) */
function LX_plain(s) {
  return LX_segments(s).map(function (sg) {
    return sg.type === 'text' ? sg.value : LX_toUnicode(sg.value).text;
  }).join('');
}

/** URL ảnh PNG của công thức */
function LX_imageUrl(latex, dpi, base) {
  base = base || 'https://latex.codecogs.com/png.image?';
  return base + encodeURIComponent('\\dpi{' + (dpi || 160) + '} ' + latex);
}

/**
 * Ghép danh sách lựa chọn thành MỘT công thức dạng bảng để render 1 ảnh
 * (dùng khi đáp án chứa công thức phức tạp mà Google Form không hiển thị được).
 * @param {Array<{label:string, text:string}>} rows
 */
function LX_rowsLatex(rows) {
  var lines = rows.map(function (r) {
    var body = LX_segments(r.text).map(function (sg) {
      if (sg.type === 'text') return sg.value.trim() ? '\\text{' + sg.value.replace(/([{}%#&_])/g, '\\$1') + '}' : '';
      return sg.value;
    }).join('\\ ');
    return '\\textbf{' + r.label + '}\\quad ' + body;
  });
  return '\\begin{array}{l}' + lines.join('\\\\[6pt]') + '\\end{array}';
}
