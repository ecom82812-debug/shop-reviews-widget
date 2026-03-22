// ============================================================
// ВІДЖЕТ ВІДГУКІВ ДЛЯ ГОЛОВНОЇ СТОРІНКИ
// ============================================================

var RW_HOME_CONFIG = {
  // Firebase налаштування — не змінювати
  firebase: {
    apiKey: "AIzaSyCS-7Vn4X_NDxbEGyTrb1JQewf1QCQNffA",
    authDomain: "shop-reviews-3aedd.firebaseapp.com",
    projectId: "shop-reviews-3aedd",
    storageBucket: "shop-reviews-3aedd.firebasestorage.app",
    messagingSenderId: "191060203071",
    appId: "1:191060203071:web:c3025da0b9e7d805948a8a"
  },

  // ── ПАГІНАЦІЯ ──────────────────────────────────────────────
  // Скільки відгуків показувати одразу при завантаженні
  initialCount: 5,
  // Скільки підвантажувати при кожному натисканні кнопки
  loadMoreCount: 3,
  // Текст кнопки "показати ще"
  loadMoreText: 'Показати ще відгуки',

  // ── РОЗМІРИ ────────────────────────────────────────────────
  // Розмір зірочок (пікселі)
  starSize: 14,
  // Розмір фото у відгуку на десктопі (пікселі)
  photoSize_desktop: 70,
  // Розмір фото у відгуку на мобільному (пікселі)
  photoSize_mobile: 60,

  // ── ДЕСКТОП РОЗМІРИ ────────────────────────────────────────
  // Максимальна ширина всього блоку відгуків
  maxWidth: '90%',
  // Відступи блоку по боках на десктопі (збільшуй/зменшуй)
  paddingDesktop: '0',
  // Відстань між картками на десктопі
  gapDesktop: '24px',
  // Відступ всередині картки
  cardPaddingDesktop: '20px',

  // ── МОБІЛЬНИЙ РОЗМІРИ ──────────────────────────────────────
  // Відступи блоку по боках на мобільному
  paddingMobile: '0 12px',
  // Відступ всередині картки на мобільному
  cardPaddingMobile: '14px',
};

(function() {
  'use strict';

  var allReviews = [];
  var shownCount = 0;

  function isMobile() { return window.innerWidth <= 640; }
  function photoSize() { return isMobile() ? RW_HOME_CONFIG.photoSize_mobile : RW_HOME_CONFIG.photoSize_desktop; }

  // ============================================================
  // СТИЛІ
  // ============================================================
  function injectStyles() {
    if (document.getElementById('rw-home-styles')) return;
    var c = RW_HOME_CONFIG;
    var style = document.createElement('style');
    style.id = 'rw-home-styles';
    style.textContent = [
      // Загальний контейнер
      '.rw-home { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; max-width:' + c.maxWidth + '; margin:0 auto; padding:' + c.paddingDesktop + '; box-sizing:border-box; }',
      '.rw-home * { box-sizing:border-box; }',

      // Сітка — 2 колонки на десктопі
      '.rw-home-grid { display:grid; grid-template-columns:1fr 1fr; gap:' + c.gapDesktop + '; }',

      // Картка відгуку
      '.rw-home-card { background:#fff; border:0.5px solid #e5e5e5; border-radius:10px; padding:' + c.cardPaddingDesktop + '; display:flex; flex-direction:column; gap:8px; }',

      // Шапка: ім'я/дата зліва, зірочки справа
      '.rw-home-header { display:flex; justify-content:space-between; align-items:flex-start; }',
      '.rw-home-left { display:flex; flex-direction:column; gap:2px; }',
      '.rw-home-author { font-weight:600; font-size:14px; color:#111; }',
      '.rw-home-date { font-size:12px; color:#aaa; }',

      // Назва товару з посиланням
      '.rw-home-product { font-size:12px; color:#888; padding-bottom:8px; border-bottom:1px solid #f0f0f0; }',
      '.rw-home-product a { color:#555; text-decoration:none; border-bottom:1px dashed #bbb; transition:color .15s; }',
      '.rw-home-product a:hover { color:#111; border-bottom-color:#111; }',

      // Текст відгуку
      '.rw-home-text { font-size:13px; color:#444; line-height:1.6; flex:1; }',

      // Фото у відгуку
      '.rw-home-photos { display:flex; flex-wrap:wrap; gap:6px; }',
      '.rw-home-photo { border-radius:6px; object-fit:cover; cursor:pointer; border:1px solid #eee; transition:transform .15s; }',
      '.rw-home-photo:hover { transform:scale(1.04); }',

      // Відповідь магазину
      '.rw-home-reply { background:#f8f8f8; border-left:3px solid #111; border-radius:0 6px 6px 0; padding:8px 12px; }',
      '.rw-home-reply-label { font-size:10px; font-weight:700; color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:3px; }',
      '.rw-home-reply-text { font-size:12px; color:#333; line-height:1.5; }',

      // Зірочки
      '.rw-home-stars { display:inline-flex; gap:2px; flex-shrink:0; }',

      // Кнопка "показати ще"
      '.rw-home-more-wrap { text-align:center; margin-top:24px; }',
      '.rw-home-more { display:inline-block; padding:11px 32px; background:#111; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; transition:background .15s; }',
      '.rw-home-more:hover { background:#333; }',

      // Порожній стан і завантаження
      '.rw-home-empty { text-align:center; padding:32px; color:#aaa; font-size:14px; }',

      // ── МОБІЛЬНИЙ ──────────────────────────────────────────
      '@media(max-width:640px) {',
      '  .rw-home { padding:' + c.paddingMobile + '; }',
      '  .rw-home-grid { grid-template-columns:1fr; gap:12px; }',
      '  .rw-home-card { padding:' + c.cardPaddingMobile + '; }',
      '  .rw-home-author { font-size:13px; }',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ============================================================
  // ЗІРОЧКИ
  // ============================================================
  function starsHTML(rating, size) {
    size = size || RW_HOME_CONFIG.starSize;
    var html = '<span class="rw-home-stars">';
    for (var i = 1; i <= 5; i++) {
      var filled = i <= Math.round(rating);
      html += '<svg width="' + size + '" height="' + size + '" viewBox="0 0 16 16">' +
        '<path fill="' + (filled ? '#F5A623' : 'none') + '" stroke="#F5A623" stroke-width="1.2" ' +
        'd="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z"/></svg>';
    }
    return html + '</span>';
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatDate(ts) {
    if (!ts) return '';
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('uk-UA', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  // ============================================================
  // HTML КАРТКИ ВІДГУКУ
  // ============================================================
  function buildCard(r) {
    var ps = photoSize();
    var html = '<div class="rw-home-card">';

    // Шапка: ім'я і дата зліва, зірочки справа
    html += '<div class="rw-home-header">';
    html += '<div class="rw-home-left">';
    html += '<div class="rw-home-author">' + escHtml(r.name || 'Анонім') + '</div>';
    html += '<div class="rw-home-date">' + formatDate(r.createdAt) + '</div>';
    html += '</div>';
    html += starsHTML(r.rating || 0);
    html += '</div>';

    // Назва товару з посиланням
    if (r.productName || r.productUrl) {
      var name = r.productName || 'Переглянути товар';
      var url = r.productUrl || '#';
      html += '<div class="rw-home-product"><a href="' + escHtml(url) + '">' + escHtml(name) + '</a></div>';
    }

    // Текст відгуку
    if (r.text) {
      html += '<div class="rw-home-text">' + escHtml(r.text) + '</div>';
    }

    // Фото — клік відкриває lightbox з каруселлю
    if (r.photos && r.photos.length) {
      var photosJson = JSON.stringify(r.photos).replace(/"/g, '&quot;');
      html += '<div class="rw-home-photos">';
      r.photos.forEach(function(url, idx) {
        html += '<img class="rw-home-photo" src="' + escHtml(url) + '" loading="lazy" ' +
          'width="' + ps + '" height="' + ps + '" ' +
          'style="width:' + ps + 'px;height:' + ps + 'px;" ' +
          'data-idx="' + idx + '" data-photos="' + photosJson + '">';
      });
      html += '</div>';
    }

    // Відповідь магазину
    if (r.reply) {
      html += '<div class="rw-home-reply">';
      html += '<div class="rw-home-reply-label">Відповідь магазину</div>';
      html += '<div class="rw-home-reply-text">' + escHtml(r.reply) + '</div>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  // ============================================================
  // РЕНДЕР СПИСКУ З ПАГІНАЦІЄЮ
  // ============================================================
  function renderList(container) {
    var toShow = allReviews.slice(0, shownCount);
    var remaining = allReviews.length - shownCount;

    var html = '<div class="rw-home-grid">';
    toShow.forEach(function(r) { html += buildCard(r); });
    html += '</div>';

    if (remaining > 0) {
      html += '<div class="rw-home-more-wrap">' +
        '<button class="rw-home-more" id="rw-home-more-btn">' +
        RW_HOME_CONFIG.loadMoreText + ' (' + remaining + ')' +
        '</button></div>';
    }

    container.innerHTML = html;

    // Обробник кнопки "показати ще"
    var moreBtn = container.querySelector('#rw-home-more-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', function() {
        shownCount = Math.min(shownCount + RW_HOME_CONFIG.loadMoreCount, allReviews.length);
        renderList(container);
      });
    }

    // Обробник кліків на фото — відкриває lightbox
    container.addEventListener('click', function(e) {
      var photo = e.target.closest('.rw-home-photo');
      if (!photo) return;
      var idx = +photo.dataset.idx;
      var photos = JSON.parse(photo.dataset.photos.replace(/&quot;/g, '"'));
      openLightbox(idx, photos);
    });
  }

  // ============================================================
  // LIGHTBOX З КАРУСЕЛЛЮ І СВАЙПОМ ДЛЯ МОБІЛЬНОГО
  // ============================================================
  function openLightbox(startIdx, photos) {
    var current = startIdx;
    var hasMultiple = photos.length > 1;

    if (document.getElementById('rw-home-lb')) {
      document.getElementById('rw-home-lb').remove();
    }

    var lb = document.createElement('div');
    lb.id = 'rw-home-lb';
    lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:99999;display:flex;align-items:center;justify-content:center;';

    lb.innerHTML =
      '<span style="position:absolute;top:16px;right:20px;color:#fff;font-size:32px;cursor:pointer;z-index:2;line-height:1;" id="rw-lb-close">×</span>' +
      (hasMultiple ? '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#fff;font-size:40px;cursor:pointer;padding:16px;background:rgba(0,0,0,.3);border-radius:4px;z-index:2;" id="rw-lb-prev">‹</span>' : '') +
      '<img id="rw-lb-img" src="' + photos[current] + '" style="max-width:85vw;max-height:85vh;border-radius:8px;object-fit:contain;transition:opacity .2s;">' +
      (hasMultiple ? '<span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#fff;font-size:40px;cursor:pointer;padding:16px;background:rgba(0,0,0,.3);border-radius:4px;z-index:2;" id="rw-lb-next">›</span>' : '') +
      (hasMultiple ? '<span id="rw-lb-counter" style="position:absolute;bottom:16px;left:50%;transform:translateX(-50%);color:#fff;font-size:14px;background:rgba(0,0,0,.5);padding:4px 12px;border-radius:20px;">' + (current+1) + ' / ' + photos.length + '</span>' : '');

    function update() {
      var img = lb.querySelector('#rw-lb-img');
      var counter = lb.querySelector('#rw-lb-counter');
      img.style.opacity = '0';
      setTimeout(function() {
        img.src = photos[current];
        img.style.opacity = '1';
        if (counter) counter.textContent = (current+1) + ' / ' + photos.length;
      }, 150);
    }

    function next() { if (hasMultiple) { current = (current+1) % photos.length; update(); } }
    function prev() { if (hasMultiple) { current = (current-1+photos.length) % photos.length; update(); } }

    lb.querySelector('#rw-lb-close').addEventListener('click', function(e) { e.stopPropagation(); lb.remove(); });
    lb.addEventListener('click', function(e) { if (e.target === lb) lb.remove(); });

    if (hasMultiple) {
      lb.querySelector('#rw-lb-prev').addEventListener('click', function(e) { e.stopPropagation(); prev(); });
      lb.querySelector('#rw-lb-next').addEventListener('click', function(e) { e.stopPropagation(); next(); });
    }

    // Клавіатура
    function onKey(e) {
      if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', onKey); }
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    }
    document.addEventListener('keydown', onKey);

    // ── СВАЙП ДЛЯ МОБІЛЬНОГО ──────────────────────────────
    var touchStartX = 0;
    var touchStartY = 0;

    lb.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    lb.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      // Свайп тільки якщо горизонтальний (більше ніж вертикальний)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) next(); // свайп вліво — наступне фото
        else prev();        // свайп вправо — попереднє фото
      }
    }, { passive: true });

    document.body.appendChild(lb);
  }

  // ============================================================
  // ЗАВАНТАЖЕННЯ ВІДГУКІВ З FIREBASE
  // ============================================================
  function loadReviews(container) {
    container.innerHTML = '<div class="rw-home-empty">Завантаження...</div>';

    var db = window.firebase.firestore();

    db.collection('reviews')
      .where('status', '==', 'approved')
      .orderBy('createdAt', 'desc')
      .get()
      .then(function(snap) {
        allReviews = [];
        snap.forEach(function(d) { allReviews.push(Object.assign({ id: d.id }, d.data())); });

        if (!allReviews.length) {
          container.innerHTML = '<div class="rw-home-empty">Ще немає відгуків</div>';
          return;
        }
        shownCount = Math.min(RW_HOME_CONFIG.initialCount, allReviews.length);
        renderList(container);
      })
      .catch(function() {
        // Запасний варіант без сортування якщо немає індексу
        db.collection('reviews')
          .where('status', '==', 'approved')
          .get()
          .then(function(snap) {
            allReviews = [];
            snap.forEach(function(d) { allReviews.push(Object.assign({ id: d.id }, d.data())); });
            allReviews.sort(function(a, b) { return (b.createdAt||0) - (a.createdAt||0); });

            if (!allReviews.length) {
              container.innerHTML = '<div class="rw-home-empty">Ще немає відгуків</div>';
              return;
            }
            shownCount = Math.min(RW_HOME_CONFIG.initialCount, allReviews.length);
            renderList(container);
          });
      });
  }

  // ============================================================
  // СТАРТ
  // ============================================================
  function init() {
    injectStyles();

    // Знаходимо або створюємо контейнер
    var container = document.getElementById('rw-home-reviews');
    if (!container) {
      container = document.createElement('div');
      container.id = 'rw-home-reviews';
      container.className = 'rw-home';
      var scripts = document.querySelectorAll('script[src*="reviews-home"]');
      var last = scripts[scripts.length - 1];
      if (last && last.parentNode) {
        last.parentNode.insertBefore(container, last.nextSibling);
      } else {
        document.body.appendChild(container);
      }
    }

    // Чекаємо поки Firebase і Firestore будуть готові
    function waitFirestore() {
      if (window.firebase && window.firebase.firestore) {
        loadReviews(container);
      } else {
        setTimeout(waitFirestore, 300);
      }
    }
    waitFirestore();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
