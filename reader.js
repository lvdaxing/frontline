(function () {
  if (window.__flReader) return;
  window.__flReader = 1;
  window.__flVer = '1.7';

  var VERSION = 'v1.7';
  var SPEAK_CHARS = 3200;
  var KW = ['\u6253\u51fb','\u88ad\u51fb','\u7a7a\u88ad','\u5bfc\u5f39','\u65e0\u4eba\u673a','\u90e8\u961f','\u519b\u65b9','\u56fd\u9632','\u6218\u573a','\u4f24\u4ea1',
            '\u8c08\u5224','\u534f\u8bae','\u5236\u88c1','\u90e8\u7f72','\u519b\u6f14','\u62e6\u622a','\u64a4\u79bb','\u58f0\u660e','\u5ba3\u5e03',
            '\u653f\u5e9c','\u603b\u7edf','\u5b89\u5168','\u8fb9\u5883','\u51b2\u7a81','\u505c\u706b','\u6b66\u5668','\u822a\u6bcd','\u7ecf\u6d4e','\u9009\u4e3e'];

  function splitSentences(text) {
    var raw = text.replace(/\s+/g, ' ');
    var parts = raw.match(/[^\u3002\uff01\uff1f\uff1b]+[\u3002\uff01\uff1f\uff1b]?/g) || [raw];
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var s = parts[i].trim();
      if (s.length >= 12 && s.length <= 120) out.push(s);
    }
    return out;
  }

  function summarize(text) {
    var sents = splitSentences(text);
    if (!sents.length) return '';
    var scored = [];
    var start = sents.length > 2 ? 1 : 0;
    for (var i = start; i < sents.length; i++) {
      var s = sents[i], score = 0;
      score += Math.max(0, 6 - i) * 1.2;
      for (var k = 0; k < KW.length; k++) if (s.indexOf(KW[k]) > -1) score += 2.2;
      if (/[0-9]/.test(s)) score += 1.6;
      if (s.length > 22 && s.length < 90) score += 1.2;
      scored.push({ s: s, v: score, i: i });
    }
    scored.sort(function (a, b) { return b.v - a.v; });
    var top = scored.slice(0, 3).sort(function (a, b) { return a.i - b.i; });
    return top.map(function (x) { return x.s; }).join(' ');
  }

  function extract() {
    try {
      var doc = document;
      var paras = doc.querySelectorAll('p');
      var cands = [], i, p, t, par, gp;
      for (i = 0; i < paras.length; i++) {
        p = paras[i];
        t = (p.textContent || '').trim();
        if (t.length < 25) continue;
        par = p.parentElement;
        if (!par) continue;
        if (!par.__flIdx) { par.__flIdx = cands.length + 1; cands.push(par); }
        par.__flScore = (par.__flScore || 0) + t.length;
        gp = par.parentElement;
        if (gp) {
          if (!gp.__flIdx) { gp.__flIdx = cands.length + 1; cands.push(gp); }
          gp.__flScore = (gp.__flScore || 0) + t.length * 0.45;
        }
      }
      cands.sort(function (a, b) { return (b.__flScore || 0) - (a.__flScore || 0); });
      var best = cands[0];
      if (!best) return null;

      var clone = best.cloneNode(true);
      var kill = clone.querySelectorAll(
        'script,iframe,noscript,style,embed,object,form,button,aside,nav,footer,header,' +
        '[class*="advert"],[id*="advert"],[class*="share"],[class*="social"],[class*="comment"],' +
        '[class*="related"],[class*="recommend"],[class*="sidebar"],[class*="banner"],' +
        '[class*="popup"],[class*="cookie"],[class*="subscribe"],[class*="newsletter"]'
      );
      for (var k = kill.length - 1; k >= 0; k--) {
        if (kill[k].parentNode) kill[k].parentNode.removeChild(kill[k]);
      }

      var imgs = clone.querySelectorAll('img');
      for (var j = 0; j < imgs.length; j++) {
        var im = imgs[j];
        var ds = im.getAttribute('data-src') || im.getAttribute('data-original') ||
                 im.getAttribute('data-lazy-src') || im.getAttribute('data-url') ||
                 im.getAttribute('data-actualsrc');
        if (ds && (!im.src || im.src.indexOf('data:') === 0)) im.src = ds;
        im.removeAttribute('srcset');
        im.removeAttribute('width');
        im.removeAttribute('height');
        im.style.maxWidth = '100%';
        im.style.height = 'auto';
        var srcAttr = im.getAttribute('src') || '';
        if (srcAttr.indexOf('spacer') > -1 || srcAttr.indexOf('pixel') > -1) {
          if (im.parentNode) im.parentNode.removeChild(im);
        }
      }

      var plist = clone.querySelectorAll('p');
      var lines = [];
      for (var q = 0; q < plist.length; q++) {
        var tx = (plist[q].textContent || '').replace(/\s+/g, ' ').trim();
        if (tx.length >= 12) lines.push(tx);
      }
      var plain = lines.join(' ');
      if (!plain) plain = (clone.textContent || '').replace(/\s+/g, ' ').trim();
      if (plain.replace(/\s+/g, '').length < 150) return null;

      var h1 = doc.querySelector('h1');
      var title = (h1 ? h1.textContent : doc.title || '').replace(/\s+/g, ' ').trim();
      var source = '';
      try {
        var m = doc.querySelector('meta[property="og:site_name"]');
        if (m && m.content) source = m.content;
      } catch (e) {}
      if (!source) { try { source = (doc.domain || '').replace(/^www\./, ''); } catch (e) {} }

      return { title: title, source: source, clone: clone, plain: plain, brief: summarize(plain) };
    } catch (e) { return null; }
  }

  var CSS =
    '#fl-theme-dark{--bgb:#0a0c10;--fg:#c9d1de;--hd:#fff;--mut:#7b8494;--bar:rgba(10,12,16,.94);--ln:rgba(255,255,255,.08);}' +
    '#fl-theme-light{--bgb:#fbfbfa;--fg:#2c3038;--hd:#12141a;--mut:#8b93a1;--bar:rgba(251,251,250,.95);--ln:rgba(0,0,0,.08);}' +
    'html,body{background:var(--bgb)!important;color:var(--fg)!important;margin:0!important;padding:0!important;overflow-x:hidden!important;}' +
    '.fl-bar{position:fixed;left:0;right:0;top:0;z-index:2147483000;background:var(--bar);' +
    '-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);padding:9px 12px;' +
    'border-bottom:1px solid var(--ln);display:flex;align-items:center;gap:7px;' +
    'font:12.5px/1.4 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;}' +
    '.fl-btn{background:none;border:1px solid rgba(245,165,36,.45);color:#dd9014;border-radius:8px;' +
    'padding:5px 10px;font-size:12px;font-family:inherit;line-height:1.4;}' +
    '.fl-btn.on{background:rgba(245,165,36,.16);}' +
    '.fl-ver{font-size:9.5px;color:#6c7484;letter-spacing:.04em;margin-left:auto;}' +
    '.fl-open{color:#6c7484;font-size:11px;text-decoration:none;}' +
    '#fl-read{max-width:720px;margin:0 auto;padding:58px 18px 76px;' +
    'font:16px/1.9 -apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;color:var(--fg);}' +
    '#fl-read h1{font-size:21px;line-height:1.5;font-weight:700;color:var(--hd);margin:2px 0 8px;}' +
    '#fl-read .fl-src{font-size:11.5px;color:var(--mut);margin-bottom:16px;letter-spacing:.05em;text-transform:uppercase;}' +
    '#fl-brief{background:rgba(245,165,36,.08);border:1px solid rgba(245,165,36,.22);' +
    'border-radius:11px;padding:13px 14px;margin:0 0 22px;}' +
    '#fl-brief b{display:block;font-size:10.5px;letter-spacing:.14em;color:#dd9014;margin-bottom:7px;}' +
    '#fl-brief p{margin:0;font-size:13.5px;line-height:1.75;}' +
    '#fl-read p{margin:0 0 17px;}' +
    '#fl-read h2,#fl-read h3{color:var(--hd);font-size:16px;margin:24px 0 10px;}' +
    '#fl-read img,#fl-read video{max-width:100%;height:auto;border-radius:10px;margin:14px 0;display:block;}' +
    '#fl-read img[data-fl-fail]{display:none;}' +
    '#fl-read a{color:#cf8a12;text-decoration:none;}' +
    '#fl-read blockquote{border-left:3px solid rgba(245,165,36,.5);padding-left:14px;color:var(--mut);margin:16px 0;}' +
    '#fl-read ul,#fl-read ol{padding-left:22px;margin:12px 0;}' +
    '#fl-read table{width:100%;border-collapse:collapse;font-size:13px;}' +
    '#fl-read td,#fl-read th{border:1px solid var(--ln);padding:6px 8px;}' +
    '#fl-read figure{margin:16px 0;}' +
    '#fl-read figcaption{font-size:12px;color:var(--mut);margin-top:6px;text-align:center;}';

  function injectCss() {
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function callAloud(text) {
    try { window.NativeReader.aloud(text); return true; } catch (e) { return false; }
  }
  function callStop() {
    try { window.NativeReader.stopAloud(); } catch (e) {}
  }

  function fallbackBar() {
    var bar = document.createElement('div');
    bar.className = 'fl-bar';
    var back = document.createElement('button');
    back.className = 'fl-btn';
    back.textContent = '\u2039 \u8fd4\u56de';
    back.onclick = function () { history.back(); };

    var info = document.createElement('span');
    info.style.cssText = 'color:#6c7484;font-size:11px;';
    info.textContent = '\u6b63\u6587\u672a\u8bc6\u522b';

    var raw = document.createElement('button');
    raw.className = 'fl-btn';
    raw.textContent = '\u770b\u539f\u6587';
    raw.onclick = function () { try { window.NativeReader.raw(location.href); } catch (e) {} };

    var ver = document.createElement('span');
    ver.className = 'fl-ver';
    ver.textContent = VERSION;

    bar.appendChild(back);
    bar.appendChild(info);
    bar.appendChild(raw);
    bar.appendChild(ver);
    document.body.appendChild(bar);
  }

  function render(res) {
    injectCss();
    var doc = document;
    var body = doc.body;
    body.id = 'fl-theme-dark';
    while (body.firstChild) body.removeChild(body.firstChild);

    var bar = doc.createElement('div');
    bar.className = 'fl-bar';

    var back = doc.createElement('button');
    back.className = 'fl-btn';
    back.textContent = '\u2039 \u8fd4\u56de';
    bar.appendChild(back);

    var speak = doc.createElement('button');
    speak.className = 'fl-btn';
    speak.textContent = '\u25b6 \u8bfb\u5168\u6587';
    bar.appendChild(speak);

    var voice = doc.createElement('button');
    voice.className = 'fl-btn';
    voice.textContent = '\u8bed\u97f3';
    bar.appendChild(voice);

    var theme = doc.createElement('button');
    theme.className = 'fl-btn';
    theme.textContent = '\u65e5\u95f4';
    bar.appendChild(theme);

    var ver = doc.createElement('span');
    ver.className = 'fl-ver';
    ver.textContent = VERSION;
    bar.appendChild(ver);

    var orig = doc.createElement('a');
    orig.className = 'fl-open';
    orig.href = '#';
    orig.textContent = '\u770b\u539f\u6587';
    bar.appendChild(orig);

    var main = doc.createElement('div');
    main.id = 'fl-read';
    var th = doc.createElement('h1');
    th.textContent = res.title;
    main.appendChild(th);

    if (res.source) {
      var sf = doc.createElement('div');
      sf.className = 'fl-src';
      sf.textContent = res.source;
      main.appendChild(sf);
    }

    if (res.brief) {
      var bx = doc.createElement('div');
      bx.id = 'fl-brief';
      var bb = doc.createElement('b');
      bb.textContent = '\u8981\u70b9';
      var bp = doc.createElement('p');
      bp.textContent = res.brief;
      bx.appendChild(bb); bx.appendChild(bp);
      main.appendChild(bx);
    }

    main.appendChild(res.clone);
    body.appendChild(bar);
    body.appendChild(main);

    window.__flText = res.title + '\u3002' + (res.brief || '') + ' ' + res.plain;

    back.onclick = function () { history.back(); };

    var speaking = false;
    speak.onclick = function () {
      if (speaking) {
        callStop();
        speaking = false;
        speak.textContent = '\u25b6 \u8bfb\u5168\u6587';
        speak.className = 'fl-btn';
        return;
      }
      var txt = (window.__flText || '').slice(0, SPEAK_CHARS);
      if (callAloud(txt)) {
        speaking = true;
        speak.textContent = '\u25a0 \u505c\u6b62';
        speak.className = 'fl-btn on';
      } else {
        speak.textContent = '\u8bfb\u4e0d\u4e86';
      }
    };

    voice.onclick = function () { try { window.NativeReader.voice(); } catch (e) {} };

    var light = false;
    theme.onclick = function () {
      light = !light;
      body.id = light ? 'fl-theme-light' : 'fl-theme-dark';
      theme.textContent = light ? '\u591c\u95f4' : '\u65e5\u95f4';
    };

    var curUrl = location.href;
    orig.onclick = function (ev) {
      ev.preventDefault();
      try { window.NativeReader.raw(curUrl); } catch (e) { location.href = curUrl; }
    };

    var imgs = main.querySelectorAll('img');
    for (var n = 0; n < imgs.length; n++) {
      imgs[n].onerror = function () { this.setAttribute('data-fl-fail', '1'); };
    }
  }

  function build() {
    if (window.__flDone) return;
    var res = extract();
    if (!res) {
      if (!document.querySelector('.fl-bar')) {
        injectCss();
        fallbackBar();
      }
      return;
    }
    try {
      render(res);
      window.__flDone = 1;
    } catch (e) {}
  }

  setTimeout(build, 900);
  setTimeout(build, 2600);
  setTimeout(build, 5000);
})();
