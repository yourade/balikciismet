/* Balıkçı İsmet - site davranışları. Bağımlılık yok. */
(function () {
  'use strict';

  /* ── 1. Mevsim rayı ───────────────────────────────────────────
     Ay işaretleri HTML'de hazır gelir, JS yoksa ray yine görünür,
     sadece içinde bulunulan ay vurgulanmaz. */
  (function rail() {
    var rail = document.getElementById('ar-rail');
    if (!rail) return;
    var now = new Date(), m = now.getMonth(), d = now.getDate();
    var months = rail.querySelectorAll('.ar-month');
    for (var i = 0; i < months.length; i++) {
      var el = months[i], idx = Number(el.getAttribute('data-m'));
      /* Av yasağı 15 Nisan - 1 Eylül. Nisan yalnızca 15'inden sonra kapalı. */
      if (idx === 3) el.classList.toggle('is-closed', d >= 15 || m > 3);
      if (idx === m) {
        el.classList.add('is-now');
        el.setAttribute('aria-current', 'date');
      }
    }
  })();

  /* ── 2. Mobil menü ── */
  (function nav() {
    var btn = document.querySelector('.nav-toggle');
    var panel = document.getElementById('m-nav');
    if (!btn || !panel) return;
    var en = document.documentElement.lang !== 'tr';
    function setOpen(open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', en ? (open ? 'Close menu' : 'Open menu') : (open ? 'Menüyü kapat' : 'Menüyü aç'));
      panel.classList.toggle('hidden', !open);
    }
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setOpen(false); btn.focus(); }
    });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    window.matchMedia('(min-width:1280px)').addEventListener('change', function (e) { if(e.matches) setOpen(false); });

  })();

  /* ── Dil seçici: yerel açılır liste, seçilen dilin sayfasına gider ── */
  [].forEach.call(document.querySelectorAll('.lang-select'), function (s) {
    s.addEventListener('change', function () { location.href = s.value; });
  });

  /* ── 3. Çerez onayı ───────────────────────────────────────────
     Analitik, onay verilmeden yüklenmez; reddedilirse yüklenmez.
     Onay geldiğinde window.arLoadAnalytics varsa çağrılır. */
  (function consent() {
    /* Analitik kurulmadıysa sorulacak çerez de yok: bar gösterilmez. */
    if (typeof window.arLoadAnalytics !== 'function') return;
    var en = document.documentElement.lang !== 'tr';
    var KEY = 'ar-consent';
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* gizli sekme */ }
    if (saved === 'yes') { grant(); return; }
    if (saved === 'no') return;

    var bar = document.createElement('div');
    bar.className = 'cc is-on';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', en ? 'Cookie preference' : 'Çerez tercihi');
    bar.innerHTML = en
      ? '<div class="cc-in"><p>We use cookies only for visit statistics. ' +
        'If you decline, no analytics cookies are loaded. ' +
        '<a href="/en/privacy/" style="color:#ffb1c2">Privacy</a></p>' +
        '<button type="button" data-a="no">Decline</button>' +
        '<button type="button" class="primary" data-a="yes">Accept</button></div>'
      : '<div class="cc-in"><p>Bu sitede yalnızca ziyaret istatistikleri için çerez kullanıyoruz. ' +
        'Reddederseniz hiçbir analitik çerez yüklenmez. ' +
        '<a href="/tr/gizlilik/" style="color:#ffb1c2">Gizlilik</a></p>' +
        '<button type="button" data-a="no">Reddet</button>' +
        '<button type="button" class="primary" data-a="yes">Kabul et</button></div>';
    document.body.appendChild(bar);
    bar.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a');
      if (!a) return;
      try { localStorage.setItem(KEY, a); } catch (err) { /* yoksay */ }
      bar.remove();
      if (a === 'yes') grant();
    });

    function grant() {
      if (typeof window.arLoadAnalytics === 'function') window.arLoadAnalytics();
    }
  })();

  // Hero videosu: her cihazda kendiliğinden oynasın. iOS düşük güç modu
  // otomatik oynatmayı engellerse ilk dokunuş/kaydırmada başlat.
  (function () {
    var v = document.querySelector('.hero-video');
    if (!v) return;
    /* Azaltılmış hareket: video durur, poster görünür. */
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      v.removeAttribute('autoplay'); v.pause(); return;
    }
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    function tryPlay() {
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* engellendi, etkileşim bekle */ });
    }
    var evs = ['touchstart', 'pointerdown', 'scroll', 'keydown'];
    function onInteract() {
      tryPlay();
      evs.forEach(function (e) { window.removeEventListener(e, onInteract); });
    }
    evs.forEach(function (e) { window.addEventListener(e, onInteract, { passive: true }); });
    tryPlay();
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tryPlay(); });
  })();

  /* ── Balık takviminde "bu ay" vurgusu: Stitch Eylül'ü sabit işaretlemişti ── */
  (function calMonth() {
    var cols = document.querySelectorAll('[data-cal-m]');
    if (cols.length !== 12) return;
    var from = cols[8], to = cols[new Date().getMonth()];
    /* Ana sayfa şeridi (h-48 kartlar): Stitch vurgusu build'de kaldırıldı, bu ay burada işaretlenir. */
    if (to.classList.contains('h-48')) {
      var tag = document.createElement('span');
      tag.className = 'cal-now-tag';
      tag.textContent = document.documentElement.lang === 'en' ? 'NOW' : 'ŞİMDİ';
      to.classList.add('is-now');
      to.setAttribute('aria-current', 'date');
      to.replaceChild(tag, to.lastElementChild);
      return;
    }
    if (from === to) return;
    var line = from.querySelector('.bg-primary-container');
    var fl = from.querySelector('span'), tl = to.querySelector('span');
    if (!fl || !tl) return;
    from.classList.remove('bg-surface-container-high/40');
    to.classList.add('bg-surface-container-high/40', 'relative');
    fl.classList.remove('text-on-surface', 'font-bold'); fl.classList.add('text-secondary');
    tl.classList.remove('text-secondary'); tl.classList.add('text-on-surface', 'font-bold');
    to.firstElementChild.classList.add('relative');
    if (line) to.firstElementChild.appendChild(line);
  })();

  /* ── Balık takviminde güncel durum: av yasağı 15 Nisan - 1 Eylül ── */
  (function season() {
    var el = document.querySelector('[data-season]');
    if (!el) return;
    var now = new Date(), m = now.getMonth(), d = now.getDate();
    var closed = (m === 3 && d >= 15) || (m > 3 && m < 8);
    var en = document.documentElement.lang === 'en';
    var spring = m < 3 || (m === 3 && d < 15);
    el.textContent = closed
      ? (en ? 'TRAWL AND PURSE-SEINE BAN (15 APRIL – 31 AUGUST)' : 'TROL VE GIRGIR YASAĞI (15 NİSAN – 31 AĞUSTOS)')
      : spring
        ? (en ? 'SEASON OPEN (WINTER FISHING)' : 'AV SEZONU AÇIK (KIŞ AV DÖNEMİ)')
        : (en ? 'SEASON OPEN (AUTUMN FISHING)' : 'AV SEZONU AÇIK (GÜZ AV DÖNEMİ)');
  })();

  /* ── "Bu ay masada" kutusu: bu ayın balıkları, yasağın misafir için anlamı, sıradaki ay.
     Ana sayfa listeyi kartların data-fish'inden (build/c7.js), takvim sayfası sütunlardan okur. ── */
  (function monthNow() {
    var cols = document.querySelectorAll('[data-cal-m]');
    if (cols.length !== 12) return;
    var en = document.documentElement.lang === 'en';
    var now = new Date(), m = now.getMonth(), d = now.getDate(), n = (m + 1) % 12;
    var closed = (m === 3 && d >= 15) || (m > 3 && m < 8);
    function fish(i) {
      var c = cols[i];
      if (c.hasAttribute('data-fish')) return c.getAttribute('data-fish');
      return [].map.call(c.querySelectorAll('li:not([class])'), function (li) {
        return li.firstChild.textContent.trim();
      }).join(' · ');
    }
    var IN = en
      ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      : ['Ocak\'ta', 'Şubat\'ta', 'Mart\'ta', 'Nisan\'da', 'Mayıs\'ta', 'Haziran\'da', 'Temmuz\'da', 'Ağustos\'ta', 'Eylül\'de', 'Ekim\'de', 'Kasım\'da', 'Aralık\'ta'];
    var txt = en
      ? (closed
        ? 'Trawl and purse-seine ban (15 April – 31 August): purse-seine and trawl fishing stop while the fish spawn. The counter is smaller in these months, so ask what came in before you come.' + (m === 7 ? ' The season opens on 1 September.' : '')
        : 'Fishing season is open (1 September – 15 April). The calendar shows the season; what is on the counter each day depends on the sea and the weather.' + (m === 3 ? ' The closed season starts on 15 April.' : ''))
      : (closed
        ? 'Trol ve gırgır yasağı sürüyor (15 Nisan – 31 Ağustos): balık ürerken gırgır ve trol avı durur. Tezgâh bu aylarda daha dar; o günün balığını gelmeden sorun.' + (m === 7 ? ' 1 Eylül\'de av sezonu açılıyor.' : '')
        : 'Av sezonu açık (1 Eylül – 15 Nisan). Takvim mevsimi gösterir; o günün tezgâhı denize ve havaya bağlıdır.' + (m === 3 ? ' 15 Nisan\'da av yasağı başlıyor.' : ''));

    var box = document.createElement('div');
    box.className = 'cal-now';
    function add(tag, cls, text) {
      var el = document.createElement(tag);
      el.className = cls; el.textContent = text; box.appendChild(el); return el;
    }
    add('p', 'cal-now-k', en ? 'On the table in ' + IN[m] : IN[m].toLocaleUpperCase('tr') + ' MASADA');
    add('p', 'cal-now-fish', fish(m));
    add('p', 'cal-now-txt', txt);
    var next = add('p', 'cal-now-next', ' ' + fish(n));
    var lbl = document.createElement('span');
    lbl.textContent = en ? 'Coming in ' + IN[n] + ':' : IN[n].toLocaleUpperCase('tr') + ' SIRADA:';
    next.insertBefore(lbl, next.firstChild);
    /* Numara sayfadaki WhatsApp bağlantısından: tek kaynak build/partials.js */
    var wa = document.querySelector('a[href*="wa.me/"]');
    var num = wa && wa.getAttribute('href').match(/wa\.me\/(\d+)/);
    if (num) {
      var a = add('a', 'cal-now-cta', en ? 'What came in today? Ask on WhatsApp ↗' : 'Bugün ne var? WhatsApp\'tan sorun ↗');
      a.href = 'https://wa.me/' + num[1] + '?text=' + encodeURIComponent(en ? 'Hello, which fish do you have today?' : 'Merhaba, bugün hangi balıklar var?');
      a.target = '_blank'; a.rel = 'noopener';
    }
    var strip = document.querySelector('.cal-strip');
    var bar = document.querySelector('[data-season]');
    var at = strip || (bar && bar.closest('.border-b'));
    if (at) at.insertAdjacentElement('afterend', box);
  })();
})();
