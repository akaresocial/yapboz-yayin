/* YapBoz Mobilya — Sümbül Dolap seçici. Kütüphane yok, yalnız sumbul-dolap.html'de yüklenir.
   Üç adım: 1) kaç kapılı  2) bölme düzeni (kapı sayısına göre izinli 1–2 düzen)  3) her bölmenin içi (resimden).
   Çizim parçaları, seçenek kartları ve fiyatlar sayfadaki #sb-veri'den gelir (_araclar/sumbul.py üretir);
   burada yalnız yan yana dizilir. Seçim adreste #d=S160-T6-C3-T6 olarak durur (WhatsApp mesajındaki bağlantı). */
(function () {
  'use strict';
  var d = document;
  var kok = d.getElementById('kur'), veriEl = d.getElementById('sb-veri');
  if (!kok || !veriEl) return;
  var V;
  try { V = JSON.parse(veriEl.textContent); } catch (e) { return; }

  var WA = 'https://wa.me/905526663606?text=';
  var ADRES = 'https://yapbozmobilya.com.tr/sumbul-dolap.html';
  var azHareket = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, k) { return (k || d).querySelector(s); };
  var $$ = function (s, k) { return [].slice.call((k || d).querySelectorAll(s)); };

  var cizimKap = $('.sb-cizim-kap'), numaralar = $('.sb-numaralar'), antet = $('.sb-antet');
  var kapiBtn = $$('.sb-kapi'), duzenKap = $('.sb-duzenler'), satirKap = $('.sb-satirlar');
  var fisAlt = $('.sb-fis-alt'), fisListe = $('.sb-fis-liste'), fiyatEl = $('.sb-fiyat');
  var gonderler = $$('.sb-gonder'), k1 = $('.sb-k1'), k2 = $('.sb-k2'), canli = $('#sb-canli');

  /* durum: kapı sayısı, düzen sırası, soldan sağa bölmelerin içi */
  var durum = { k: V.varsayilan / 40, dz: 0, m: V.duzenler[V.varsayilan / 40][0].ic.slice() };
  var degisti = false;      /* adres temiz kalır; ilk seçimden (ya da seçimli bağlantıyla gelindiyse) sonra #d= yazılır */

  var birim = function (kd) { return V.m[kd].birim; };
  var tur = function (kd) { return birim(kd) === 2 ? 'çift kapı' : 'tek kapı'; };
  var gen = function (x) { return x.k * 40; };
  var kod = function (x) { return 'S' + gen(x) + '-' + x.m.join('-'); };
  var tl = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' TL'; };
  var ayni = function (a, b) { return a.join('-') === b.join('-'); };
  var tipi = function (m) { return m.map(function (kd) { return birim(kd) === 2 ? 'C' : 'T'; }).join(''); };

  function fiyat(x) {
    var h = V.hazir[gen(x)];
    if (h && ayni(x.m, h.m) && h.fiyat != null) return h.fiyat;
    var t = V.altlik[gen(x)].fiyat;
    if (t == null) return null;
    for (var i = 0; i < x.m.length; i++) {
      var f = V.m[x.m[i]].fiyat;
      if (f == null) return null;
      t += f;
    }
    return t;
  }

  /* düzen değişince bölmelerin içi aynı türdeki bölmelerden sırayla taşınır (seçimler kaybolmasın), yoksa varsayılan */
  function yeniDuzen(k, dz, onceki) {
    var D = V.duzenler[k][dz], havuz = { T: [], C: [] };
    if (onceki) onceki.forEach(function (kd) { havuz[birim(kd) === 2 ? 'C' : 'T'].push(kd); });
    return { k: k, dz: dz, m: D.ic.map(function (v, i) { var t = D.tip.charAt(i); return havuz[t].length ? havuz[t].shift() : v; }) };
  }

  /* adresten seçim: #d=S200-C3-C3-T6 (ya da ?d=). Kapı sayısına uymayan düzen yerine o kapının ilk düzeni açılır. */
  function coz(ham) {
    var s = String(ham || '');
    try { s = decodeURIComponent(s); } catch (e) {}
    s = s.replace(/\s/g, '').toUpperCase().replace(/Ç/g, 'C');
    var p = s.split('-').filter(Boolean), k = parseInt((p.shift() || '').replace(/^S/, ''), 10) / 40;
    if (!V.duzenler[k]) return null;
    if (p.every(function (kd) { return V.m[kd]; })) {
      var t = tipi(p);
      for (var j = 0; j < V.duzenler[k].length; j++) if (V.duzenler[k][j].tip === t) return { k: k, dz: j, m: p };
    }
    return { k: k, dz: 0, m: V.duzenler[k][0].ic.slice() };
  }
  function adrestenOku() {
    var v = null;
    try { v = new URLSearchParams(location.hash.slice(1)).get('d') || new URLSearchParams(location.search).get('d'); } catch (e) {}
    return v ? coz(v) : null;
  }
  function adresYaz() {
    var ara = '';
    try { var q = new URLSearchParams(location.search); q.delete('d'); ara = q.toString() ? '?' + q.toString() : ''; } catch (e) {}
    try { history.replaceState(history.state, '', location.pathname + ara + '#d=' + kod(durum)); } catch (e) {}
  }

  function mesaj(x) {
    var al = V.altlik[gen(x)], f = fiyat(x), s = ['Merhaba, YapBoz sitesinden yazıyorum.', 'Sümbül Dolap seçimim (' + V.renk + '):',
      x.k + ' Kapılı, ' + gen(x) + ' x ' + V.derinlik + ' x ' + V.yukseklik + ' cm, ' + al.cekmece + ' çekmeceli'];
    x.m.forEach(function (kd, i) { s.push((i + 1) + '. bölme (' + tur(kd) + '): ' + V.m[kd].kisa + ' (' + V.m[kd].ad + ')'); });
    if (f != null) {
      var ek = [V.tarih, V.not_].filter(Boolean).join(', ');
      s.push('Sitedeki fiyat: ' + tl(f) + (ek ? ' (' + ek + ')' : ''));
    }
    s.push('Seçimim: ' + ADRES + '#d=' + kod(x));
    s.push((f != null ? 'Sipariş vermek istiyorum.' : 'Fiyatını öğrenmek istiyorum.') + ' Teslimat ilçem: ');
    return s.join('\n');
  }

  /* ---------------------------------------------------------------- çizim */
  function svg(x, yeni) {
    var g = gen(x), o = '', xx = 0;
    x.m.forEach(function (kd, i) {
      o += '<g transform="translate(' + xx + ' 0)"><g' + (yeni && yeni[i] ? ' class="sb-oturan"' : '') + '>' + V.m[kd].ic + '</g></g>';
      xx += birim(kd) * 40;
    });
    o += '<g transform="translate(0 ' + V.govde + ')">' + V.altlik[g].frag + '</g>';
    return '<svg class="cz sb-cizim" viewBox="-5 -1 ' + (g + 10) + ' 206" style="--vbw:' + (g + 10) + '" aria-hidden="true" focusable="false">' +
      '<g class="renk-beyaz"><rect x="-4" y="200" width="' + (g + 8) + '" height="3.2" class="cz-zemin"/>' +
      '<line x1="-4" y1="200" x2="' + (g + 4) + '" y2="200" class="cz-zemin-cizgi"/>' + o + '</g></svg>';
  }
  function numaraHTML(x) {
    var w = gen(x) + 10, xx = 0;
    return x.m.map(function (kd, i) {
      var b = birim(kd) * 40, h = '<a class="sb-no" href="#sb-b' + (i + 1) + '" style="left:' + ((xx + b / 2 + 5) / w * 100).toFixed(3) + '%" aria-label="' +
        (i + 1) + '. bölme: ' + tur(kd) + ', ' + V.m[kd].kisa + '">' + (i + 1) + '</a>';
      xx += b;
      return h;
    }).join('');
  }
  function siluet(tip) {
    var o = '', x = 0, u = 0, top = tip.split('').reduce(function (t, c) { return t + (c === 'C' ? 2 : 1); }, 0);
    tip.split('').forEach(function (c) {
      var w = c === 'C' ? 24 : 12;
      o += '<rect x="' + x + '" y="0" width="' + w + '" height="34" rx="1" class="sb-sl"/>';
      if (c === 'C') o += '<line x1="' + (x + 12) + '" y1="0" x2="' + (x + 12) + '" y2="34" class="sb-sl-c"/>' +
        '<circle cx="' + (x + 9.5) + '" cy="17" r="1.3" class="sb-sl-k"/><circle cx="' + (x + 14.5) + '" cy="17" r="1.3" class="sb-sl-k"/>';
      else o += '<circle cx="' + ((u + 0.5) < top / 2 ? x + 9.5 : x + 2.5) + '" cy="17" r="1.3" class="sb-sl-k"/>';
      u += c === 'C' ? 2 : 1;
      x += w + 4;
    });
    return '<svg class="sb-siluet" viewBox="-1 -1 ' + (x - 2) + ' 36" aria-hidden="true" focusable="false">' + o + '</svg>';
  }
  /* seçili kart satırın görünen kısmında değilse satır yana kaydırılır (seçim gözden kaçmasın) */
  function seciliyiGoster(satir) {
    var kap = $('.sb-secenekler', satir), b = $('.sb-sec[aria-pressed="true"]', satir);
    if (!kap || !b || kap.scrollWidth <= kap.clientWidth) return;
    var sol = b.getBoundingClientRect().left - kap.getBoundingClientRect().left + kap.scrollLeft, sag = sol + b.offsetWidth, pay = 18;
    if (sol < kap.scrollLeft + pay || sag > kap.scrollLeft + kap.clientWidth - 30) kap.scrollLeft = Math.max(0, sol - pay);
  }

  /* ---------------------------------------------------------------- ekrana yansıtma */
  function ciz(onceki, yapi) {
    var x = durum, g = gen(x), al = V.altlik[g], f = fiyat(x);
    var yeni = onceki && !azHareket ? x.m.map(function (kd, i) { return onceki.m[i] !== kd || onceki.k !== x.k; }) : null;
    cizimKap.style.setProperty('--vbw', g + 10);
    var eski = $('svg.sb-cizim', cizimKap);
    eski.insertAdjacentHTML('afterend', svg(x, yeni));
    eski.parentNode.removeChild(eski);
    numaralar.innerHTML = numaraHTML(x);
    antet.innerHTML = '<b>' + x.k + ' Kapılı</b> · ' + g + ' × 50 × 200 cm · ' + al.cekmece + ' çekmece';
    kapiBtn.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-k') === x.k)); });
    if (yapi) {
      /* kapı sayısı ya da düzen değişti: düzen kartları ve bölme satırları yeniden kurulur */
      duzenKap.innerHTML = V.duzenler[x.k].map(function (D, j) {
        return '<button type="button" class="sb-duzen" data-d="' + j + '" aria-pressed="' + (j === x.dz) + '">' + siluet(D.tip) + '<span>' + D.ad + '</span></button>';
      }).join('');
      satirKap.innerHTML = x.m.map(function (kd, i) {
        var t = birim(kd) === 2 ? 'C' : 'T';
        return '<div class="sb-satir" id="sb-b' + (i + 1) + '" data-i="' + i + '"><p class="sb-satir-bas" id="sb-b' + (i + 1) + '-bas"><b>' + (i + 1) +
          '. bölme</b> · ' + tur(kd) + '</p><div class="sb-secenekler" role="group" aria-labelledby="sb-b' + (i + 1) + '-bas">' + V.sablon[t] +
          '</div><p class="sb-secili"></p></div>';
      }).join('');
    }
    duzenKap.classList.toggle('sb-tek-duzen', V.duzenler[x.k].length === 1);
    $$('.sb-duzen', duzenKap).forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-d') === x.dz)); });
    $$('.sb-satir', satirKap).forEach(function (s, i) {
      var kd = x.m[i];
      $$('.sb-sec', s).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-kod') === kd)); });
      $('.sb-secili', s).innerHTML = '<b>' + V.m[kd].kisa + ':</b> ' + V.aciklama[kd];
      seciliyiGoster(s);
    });
    /* seçiminiz + kasa */
    fisAlt.innerHTML = '<b>Sümbül Dolap · ' + x.k + ' Kapılı</b> · ' + g + ' × 50 × 200 cm · ' + al.cekmece + ' çekmece · ' + V.renk;
    fisListe.innerHTML = x.m.map(function (kd, i) {
      return '<li><span>' + (i + 1) + '. bölme · ' + tur(kd) + '</span><b>' + V.m[kd].kisa + '</b></li>';
    }).join('');
    var notlar = [V.not_, V.tarih ? V.tarih + ' fiyatı' : ''].filter(Boolean).join(' · ');
    fiyatEl.innerHTML = f != null ? '<p class="sb-toplam"><span>Toplam</span><b>' + tl(f) + '</b></p>' + (notlar ? '<p class="sb-fiyat-not">' + notlar + '</p>' : '')
      : '';
    k1.textContent = f != null ? x.k + ' Kapılı · Toplam' : 'Sümbül Dolap';
    k2.textContent = f != null ? tl(f) : x.k + ' Kapılı';
    var u = WA + encodeURIComponent(mesaj(x));
    gonderler.forEach(function (a) {
      a.href = u;
      a.setAttribute('data-kod', kod(x));
      if (a.closest('.sb-kasa')) a.querySelector('span').textContent = f != null ? 'Sipariş verin' : 'Fiyatını sorun';
    });
    if (degisti) adresYaz();
  }

  function sec(yeni, duyuru) {
    var onceki = durum, yapi = yeni.k !== durum.k || yeni.dz !== durum.dz;
    durum = yeni;
    degisti = true;
    ciz(onceki, yapi);
    if (duyuru) {
      var f = fiyat(durum);
      canli.textContent = duyuru + (f != null ? ' Toplam ' + tl(f).replace(' TL', ' lira') + '.' : '');
    }
  }

  /* ---------------------------------------------------------------- olaylar */
  kapiBtn.forEach(function (b) {
    b.addEventListener('click', function () {
      var k = +b.getAttribute('data-k');
      if (k === durum.k) return;
      sec(yeniDuzen(k, 0, durum.m), k + ' kapılı. Bölmeler: ' + V.duzenler[k][0].ad + '.');
    });
  });
  duzenKap.addEventListener('click', function (e) {
    var b = e.target.closest('.sb-duzen');
    if (!b) return;
    var dz = +b.getAttribute('data-d');
    if (dz === durum.dz) return;
    sec(yeniDuzen(durum.k, dz, durum.m), 'Bölmeler: ' + V.duzenler[durum.k][dz].ad + '.');
  });
  satirKap.addEventListener('click', function (e) {
    var b = e.target.closest('.sb-sec'), s = b && b.closest('.sb-satir');
    if (!s) return;
    var i = +s.getAttribute('data-i'), kd = b.getAttribute('data-kod');
    if (durum.m[i] === kd) return;
    var y = { k: durum.k, dz: durum.dz, m: durum.m.slice() };
    y.m[i] = kd;
    sec(y, (i + 1) + '. bölme: ' + V.m[kd].kisa + '.');
  });
  /* çizimdeki numara: o bölmenin satırına kaydır */
  numaralar.addEventListener('click', function (e) {
    var a = e.target.closest('.sb-no');
    if (!a) return;
    e.preventDefault();
    var s = d.getElementById(a.getAttribute('href').slice(1));
    if (!s) return;
    s.scrollIntoView({ behavior: azHareket ? 'auto' : 'smooth', block: 'start' });
    s.classList.remove('sb-vurgu');
    void s.offsetWidth;
    s.classList.add('sb-vurgu');
  });
  /* katalogdaki modeller: "Bunu seçin" */
  $$('.sb-bunu').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var c = coz(a.getAttribute('data-kod'));
      if (!c) return;
      sec(c, c.k + ' kapılı, katalogdaki model seçildi.');
      kok.scrollIntoView({ behavior: azHareket ? 'auto' : 'smooth', block: 'start' });
    });
  });
  /* adrese elle yazılan ya da geri tuşuyla gelen başka bir seçim */
  var adresiUygula = function () {
    var c = adrestenOku();
    if (c && kod(c) !== kod(durum)) sec(c, '');
    else if (!c && degisti && /(^|[#&?])d=/.test(location.hash + location.search)) adresYaz();
  };
  window.addEventListener('hashchange', adresiUygula);
  window.addEventListener('popstate', adresiUygula);

  /* açılış */
  var gelen = adrestenOku();
  if (gelen) { durum = gelen; degisti = true; ciz(null, true); }
  else ciz(null, false);
  kok.classList.add('sb-hazir');
})();
