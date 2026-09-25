/* YapBoz Mobilya — hero sahnesi, katalog görünümü, teslim fişi, renk seçimi, galeri, çizim, lightbox. Kütüphane yok. */
(function () {
  var d = document;
  var hepsi = function (s, k) { return [].slice.call((k || d).querySelectorAll(s)); };
  var azHareket = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IO = 'IntersectionObserver' in window;

  var yil = d.getElementById('yil');
  if (yil) yil.textContent = new Date().getFullYear();

  /* mobil yapışkan bar: sayfanın ana butonu ekrandan çıkınca görünür (yoksa bir ekran kaydırınca) */
  var bar = d.querySelector('.stickybar'), anchor = d.querySelector('[data-sticky-anchor]');
  if (bar) {
    if (anchor && IO) {
      new IntersectionObserver(function (e) { bar.classList.toggle('is-on', !e[0].isIntersecting); },
        { rootMargin: '0px 0px -20px 0px' }).observe(anchor);
    } else {
      var bak = function () { bar.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.6); };
      window.addEventListener('scroll', bak, { passive: true });
      bak();
    }
  }

  /* ---- hero: evinin eksik parçası — parçalar sırayla yerine oturur ---- */
  var sahne = d.querySelector('.sahne');
  if (sahne) {
    var parcalar = hepsi('.parca', sahne), veri = [], alt = sahne.querySelector('.sahne-alt a');
    var durBtn = sahne.querySelector('.sahne-dur');
    try { veri = JSON.parse(sahne.getAttribute('data-parcalar') || '[]'); } catch (e) {}
    var sira = 0, zaman = null, elle = false, gorunur = true, uzerinde = false;
    var goster = function (i) {
      parcalar.forEach(function (p, k) { p.classList.toggle('is-aktif', k === i); });
      var v = veri[i];
      if (v && alt) {
        alt.href = v.url;
        alt.querySelector('.sahne-no').textContent = 'Parça ' + v.no;
        alt.querySelector('.sahne-ad').textContent = v.ad;
        alt.querySelector('.sahne-olcu').textContent = v.olcu + ' · ' + v.renk;
      }
    };
    goster(0);
    if (!azHareket && parcalar.length > 1) {
      var ileri = function () { sira = (sira + 1) % parcalar.length; goster(sira); };
      var guncelle = function () {
        var calis = !elle && gorunur && !uzerinde && !d.hidden;
        if (calis && !zaman) zaman = setInterval(ileri, 4800);
        if (!calis && zaman) { clearInterval(zaman); zaman = null; }
      };
      guncelle();
      if (IO) new IntersectionObserver(function (e) { gorunur = e[0].isIntersecting; guncelle(); }).observe(sahne);
      /* yalnız fare: dokunmatikte mouseenter tıklamayla tetiklenip sahneyi kalıcı durduruyordu */
      sahne.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { uzerinde = true; guncelle(); } });
      sahne.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { uzerinde = false; guncelle(); } });
      sahne.addEventListener('focusin', function () { uzerinde = true; guncelle(); });
      sahne.addEventListener('focusout', function (e) { if (!sahne.contains(e.relatedTarget)) { uzerinde = false; guncelle(); } });
      d.addEventListener('visibilitychange', guncelle);
      if (durBtn) {
        durBtn.hidden = false;
        durBtn.addEventListener('click', function () {
          elle = !elle;
          durBtn.setAttribute('aria-pressed', String(elle));
          durBtn.querySelector('.sr').textContent = elle ? 'Canlandırmayı başlat' : 'Canlandırmayı durdur';
          guncelle();
        });
      }
    }
  }

  /* ---- katalog: fotoğraf / yan yana ölçekli ---- */
  hepsi('.katalog').forEach(function (k) {
    var btn = hepsi('.gorunum-btn', k);
    btn.forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.getAttribute('data-gorunum');
        k.setAttribute('data-gorunum', g);
        btn.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
  });

  /* ---- görünür olunca bir kez oynayanlar: teslim fişi güzergâhı, kapanıştaki parça ---- */
  hepsi('.yol, .son-urun').forEach(function (el) {
    if (azHareket || !IO) { el.classList.add('is-oyna'); return; }
    var g = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { el.classList.add('is-oyna'); g.disconnect(); }
    }, { threshold: 0.45 });
    g.observe(el);
  });

  /* rehber: içindekiler telefonda kapalı gelir; geniş ekranda yanda açık durur */
  var icd = d.querySelector('.icindekiler');
  if (icd && window.matchMedia && matchMedia('(min-width:1100px)').matches) icd.open = true;

  /* ---- rehber araçları: hangisi sığar, geçiş hesabı (girilen ölçü sayfada kalır, hiçbir yere gönderilmez) ---- */
  var sayi = function (i) { var v = parseFloat(String(i.value).replace(',', '.')); return isFinite(v) && v > 0 ? v : null; };
  hepsi('.arac-sigar').forEach(function (a) {
    var en = a.querySelector('[name=en]'), boy = a.querySelector('[name=boy]'), derin = a.querySelector('[name=derin]');
    var urunler = hepsi('[data-olcu]', a), sonuc = a.querySelector('.arac-sonuc'), liste = a.querySelector('.arac-liste');
    var hesapla = function () {
      var E = sayi(en), B = sayi(boy), D = sayi(derin), sigan = [];
      urunler.forEach(function (u) {
        var o = u.getAttribute('data-olcu').split(',').map(Number);
        var tamam = E !== null || B !== null || D !== null;
        var sigar = tamam && (E === null || o[0] <= E) && (B === null || o[2] <= B) && (D === null || o[1] <= D);
        u.classList.toggle('is-sigar', sigar);
        u.classList.toggle('is-sigmaz', tamam && !sigar);
        if (sigar) sigan.push({ ad: u.getAttribute('data-ad'), url: u.getAttribute('href'), o: o });
      });
      liste.innerHTML = '';
      if (E === null && B === null && D === null) { sonuc.textContent = 'Ölçülerinizi yazın; sığan ürünler çizimde turuncu görünecek.'; return; }
      sonuc.textContent = sigan.length ? sigan.length + ' ürün bu ölçülere sığıyor:' : 'Bu ölçülere sığan ürünümüz yok.';
      sigan.forEach(function (s) {
        var pay = [];
        if (E !== null) pay.push('yanda ' + Math.round(E - s.o[0]) + ' cm');
        if (B !== null) pay.push('üstte ' + Math.round(B - s.o[2]) + ' cm');
        if (D !== null) pay.push('derinlikte ' + Math.round(D - s.o[1]) + ' cm');
        var li = d.createElement('li'), l = d.createElement('a'), k = d.createElement('span');
        l.href = s.url; l.textContent = s.ad;
        k.textContent = s.o[0] + ' × ' + s.o[1] + ' × ' + s.o[2] + ' cm · kalan pay: ' + pay.join(', ');
        li.appendChild(l); li.appendChild(k); liste.appendChild(li);
      });
    };
    [en, boy, derin].forEach(function (i) { if (i) i.addEventListener('input', hesapla); });
    hesapla();
  });
  hepsi('.arac-gecis').forEach(function (a) {
    var gen = a.querySelector('[name=gen]'), satirlar = hepsi('[data-d]', a);
    var hesapla = function () {
      var G = sayi(gen);
      satirlar.forEach(function (s) {
        var dd = Number(s.getAttribute('data-d')), b = s.querySelector('.gl-sonuc'), bar = s.querySelector('.gl-bar i');
        if (G === null) { b.textContent = '—'; bar.style.width = '0'; s.classList.remove('is-dar'); return; }
        var kalan = Math.round(G - dd);
        b.textContent = kalan > 0 ? kalan + ' cm' : 'sığmaz';
        bar.style.width = Math.max(0, Math.min(100, dd / G * 100)) + '%';
        s.classList.toggle('is-dar', kalan <= 0);
      });
    };
    gen.addEventListener('input', hesapla);
    hesapla();
  });

  /* ---- ürün sayfası ---- */
  var gal = d.querySelector('.gallery');
  var kapsamlar = hepsi('[data-renk-kapsam]');
  var renkBtn = hepsi('.renk-btn');
  var slides = gal ? hepsi('.g-slide', gal) : [];
  var noktalar = gal ? hepsi('.g-nokta', gal) : [];
  var kaydirici = gal ? gal.querySelector('.g-main') : null;
  var fotoNot = gal ? gal.querySelector('.g-renk-not') : null;
  var duyuru = d.getElementById('renk-duyuru');
  var aktif = slides[0];
  var gorunenler = function () { return slides.filter(function (s) { return !s.hidden; }); };
  var RENK = { beyaz: 'beyaz', cam: 'çam' };

  var isaretle = function (slide) {
    if (!slide) return;
    aktif = slide;
    noktalar.forEach(function (n) { n.classList.toggle('is-aktif', n.getAttribute('data-for') === slide.id); });
  };

  var okSol = gal && gal.querySelector('.g-ok-sol'), okSag = gal && gal.querySelector('.g-ok-sag');
  var oklar = function () {
    if (!okSol || !kaydirici) return;
    var son = kaydirici.scrollWidth - kaydirici.clientWidth;
    okSol.disabled = kaydirici.scrollLeft < 8;
    okSag.disabled = kaydirici.scrollLeft > son - 8;
  };

  /* renk: galeri (o rengin fotoğrafı varsa) + ölçü çizimi + kapanış çizimi + WhatsApp mesajı birlikte değişir */
  var renkSec = function (c, ilk) {
    renkBtn.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-color') === c)); });
    kapsamlar.forEach(function (k) { k.classList.remove('renk-beyaz', 'renk-cam'); k.classList.add('renk-' + c); });
    hepsi('a[data-urun]').forEach(function (a) {
      var t = 'Merhaba, YapBoz sitesinden yazıyorum. ' + a.getAttribute('data-urun') + ' (' + RENK[c] + ') hakkında bilgi almak istiyorum.';
      a.href = 'https://wa.me/905526663606?text=' + encodeURIComponent(t);
    });
    if (!slides.length) return;
    var var_ = slides.some(function (s) { return s.getAttribute('data-color') === c; });
    var hedef = var_ ? c : 'beyaz';
    slides.forEach(function (s) { s.hidden = s.getAttribute('data-color') !== hedef; });
    noktalar.forEach(function (n) { n.hidden = n.getAttribute('data-color') !== hedef; });
    if (fotoNot) fotoNot.hidden = var_;
    if (kaydirici) kaydirici.scrollLeft = 0;
    isaretle(gorunenler()[0]);
    oklar();
    if (duyuru && !ilk) duyuru.textContent = 'Renk: ' + (c === 'cam' ? 'Çam' : 'Beyaz') + (var_ ? '' : '. Fotoğraflar beyaz renkte; çizim çam renkte.');
  };
  if (renkBtn.length) {
    var istenen = null;
    /* renk adreste #renk=cam olarak gelir (eski ?renk=cam bağlantıları da çalışır); ayrı adres üretmez */
    try { istenen = new URLSearchParams(location.hash.slice(1)).get('renk') || new URLSearchParams(location.search).get('renk'); } catch (e) {}
    renkSec(istenen === 'cam' ? 'cam' : 'beyaz', true);
    /* eski ?renk= adresini temiz adrese çevir (renk #renk=cam olarak kalır) */
    if (/[?&]renk=/.test(location.search)) {
      try { history.replaceState(null, '', location.pathname + (istenen === 'cam' ? '#renk=cam' : '')); } catch (e) {}
    }
    renkBtn.forEach(function (b) {
      b.addEventListener('click', function () {
        var c = b.getAttribute('data-color');
        renkSec(c);
        try { history.replaceState(null, '', location.pathname + (c === 'cam' ? '#renk=cam' : '')); } catch (e) {}
      });
    });
  }

  /* ölçü çizimi: dışı / iç düzen */
  var cizimFig = d.querySelector('.cizim');
  var cizimBtn = hepsi('.cizim-btn');
  cizimBtn.forEach(function (b) {
    b.addEventListener('click', function () {
      cizimBtn.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      if (cizimFig) cizimFig.classList.toggle('goster-ic', b.getAttribute('data-mod') === 'ic');
    });
  });

  if (!gal) return;

  /* galeri: kaydırma, konum noktaları, masaüstü okları */
  var komsuyaGit = function (yon) {
    var liste = gorunenler(), i = liste.indexOf(aktif);
    var hedef = liste[Math.min(liste.length - 1, Math.max(0, i + yon))];
    if (!hedef || hedef === aktif) return;
    isaretle(hedef);
    hedef.scrollIntoView({ behavior: azHareket ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
  };
  if (okSol && okSag) {
    okSol.addEventListener('click', function () { komsuyaGit(-1); });
    okSag.addEventListener('click', function () { komsuyaGit(1); });
  }
  if (kaydirici) {
    var bekle;
    kaydirici.addEventListener('scroll', function () {
      clearTimeout(bekle);
      bekle = setTimeout(function () {
        var orta = kaydirici.scrollLeft + kaydirici.clientWidth / 2;
        gorunenler().forEach(function (s) { if (s.offsetLeft <= orta && s.offsetLeft + s.offsetWidth > orta) isaretle(s); });
        oklar();
      }, 90);
    }, { passive: true });
  }
  if (!renkBtn.length) isaretle(slides[0]);
  oklar();

  /* lightbox */
  var lb = d.getElementById('lb');
  if (!lb) return;
  var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap'), sonOdak;
  var ciz = function () { lbImg.src = aktif.getAttribute('data-full'); lbImg.alt = aktif.getAttribute('data-cap'); lbCap.textContent = aktif.getAttribute('data-cap'); };
  var ac = function (s) { sonOdak = d.activeElement; isaretle(s); ciz(); lb.hidden = false; d.body.style.overflow = 'hidden'; lb.querySelector('.lb-close').focus(); };
  var kapat = function () { lb.hidden = true; lbImg.removeAttribute('src'); d.body.style.overflow = ''; if (sonOdak) sonOdak.focus(); };
  var kaydir = function (yon) { var l = gorunenler(), i = l.indexOf(aktif); isaretle(l[(i + yon + l.length) % l.length]); ciz(); };
  hepsi('.g-zoom', gal).forEach(function (b) { b.addEventListener('click', function () { ac(b.closest('.g-slide')); }); });
  lb.querySelector('.lb-close').addEventListener('click', kapat);
  lb.querySelector('.lb-prev').addEventListener('click', function () { kaydir(-1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { kaydir(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) kapat(); });
  d.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') { kapat(); return; }
    if (e.key === 'ArrowLeft') { kaydir(-1); return; }
    if (e.key === 'ArrowRight') { kaydir(1); return; }
    if (e.key === 'Tab') {
      var f = lb.querySelectorAll('button'), ilk = f[0], son = f[f.length - 1];
      if (e.shiftKey && d.activeElement === ilk) { e.preventDefault(); son.focus(); }
      else if (!e.shiftKey && d.activeElement === son) { e.preventDefault(); ilk.focus(); }
    }
  });
})();
