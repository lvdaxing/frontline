(function () {
  if (window.__flReader) return;
  window.__flReader = 1;

  function build() {
    if (window.__flDone) return;
    try {
      var doc = document;

      var paras = doc.querySelectorAll('p');
      var cands = [];
      var i, p, t, par, gp;
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
      if (!best) return;

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
        var w = im.getAttribute('width') || im.width;
        var h = im.getAttribute('height') || im.height;
        var srcAttr = im.getAttribute('src') || '';
        if ((w && +w <= 3) || (h && +h <= 3) || srcAttr.indexOf('spacer') > -1 || srcAttr.indexOf('pixel') > -1) {
          if (im.parentNode) im.parentNode.removeChild(im);
        }
      }

      var text = (clone.textContent || '').replace(/\s+/g, '');
      if (text.length < 150) return;

      var h1 = doc.querySelector('h1');
      var title = (h1 ? h1.textContent : doc.title || '').replace(/\s+/g, ' ').trim();
      var source = '';
      try {
        var m = doc.querySelector('meta[property="og:site_name"]');
        if (m && m.content) source = m.content;
      } catch (e) {}
      if (!source) {
        try { source = (doc.domain || '').replace(/^www\./, ''); } catch (e) {}
      }

      var css =
        'html,body{background:#0a0c10!important;color:#e6eaf2!important;margin:0!important;padding:0!important;overflow-x:hidden!important;}' +
        '.fl-bar{position:sticky;top:0;z-index:99;background:rgba(10,12,16,.94);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);padding:11px 16px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:10px;}' +
        '#fl-back{background:none;border:1px solid rgba(245,165,36,.45);color:#f5a524;border-radius:8px;padding:5px 13px;font-size:13px;font-family:inherit;}' +
        '#fl-open{margin-left:auto;color:#6b7484;font-size:11.5px;text-decoration:none;}' +
        '#fl-read{max-width:720px;margin:0 auto;padding:20px 18px 72px;font:16px/1.9 -apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;letter-spacing:.01em;color:#c9d1de;}' +
        '#fl-read h1{font-size:21px;line-height:1.5;font-weight:700;color:#fff;margin:4px 0 8px;}' +
        '#fl-read .fl-src{font-size:11.5px;color:#7b8494;margin-bottom:20px;letter-spacing:.05em;text-transform:uppercase;}' +
        '#fl-read p{margin:0 0 17px;}' +
        '#fl-read h2,#fl-read h3{color:#fff;font-size:16px;margin:24px 0 10px;}' +
        '#fl-read img,#fl-read video{max-width:100%;height:auto;border-radius:10px;margin:14px 0;display:block;background:#151821;}' +
        '#fl-read img[data-fl-fail]{display:none;}' +
        '#fl-read a{color:#f5a524;text-decoration:none;}' +
        '#fl-read blockquote{border-left:3px solid rgba(245,165,36,.5);padding-left:14px;color:#9aa3b2;margin:16px 0;}' +
        '#fl-read ul,#fl-read ol{padding-left:22px;margin:12px 0;}' +
        '#fl-read table{width:100%;border-collapse:collapse;font-size:13px;}' +
        '#fl-read td,#fl-read th{border:1px solid rgba(255,255,255,.1);padding:6px 8px;}' +
        '#fl-read figure{margin:16px 0;}' +
        '#fl-read figcaption{font-size:12px;color:#7b8494;margin-top:6px;text-align:center;}';

      var st = doc.createElement('style');
      st.textContent = css;
      doc.head.appendChild(st);

      var body = doc.body;
      while (body.firstChild) body.removeChild(body.firstChild);

      var bar = doc.createElement('div');
      bar.className = 'fl-bar';
      var back = doc.createElement('button');
      back.id = 'fl-back';
      back.textContent = '\u2039 \u8fd4\u56de';
      bar.appendChild(back);

      var orig = doc.createElement('a');
      orig.id = 'fl-open';
      orig.href = '#';
      orig.textContent = '\u770b\u539f\u6587';
      bar.appendChild(orig);

      var main = doc.createElement('div');
      main.id = 'fl-read';
      var th = doc.createElement('h1');
      th.textContent = title;
      main.appendChild(th);
      if (source) {
        var sf = doc.createElement('div');
        sf.className = 'fl-src';
        sf.textContent = source;
        main.appendChild(sf);
      }
      main.appendChild(clone);

      body.appendChild(bar);
      body.appendChild(main);

      back.addEventListener('click', function () { history.back(); });
      var curUrl = location.href;
      orig.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (window.NativeReader && window.NativeReader.raw) {
          try { window.NativeReader.raw(curUrl); return; } catch (e) {}
        }
        location.href = curUrl;
      });

      var imgs2 = main.querySelectorAll('img');
      for (var n = 0; n < imgs2.length; n++) {
        imgs2[n].addEventListener('error', function () {
          this.setAttribute('data-fl-fail', '1');
        });
      }

      window.__flDone = 1;
    } catch (e) {}
  }

  setTimeout(build, 1100);
  setTimeout(build, 3200);
})();
