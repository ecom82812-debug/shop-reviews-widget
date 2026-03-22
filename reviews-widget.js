// ============================================================
// НАЛАШТУВАННЯ FIREBASE — замінити на свої дані
// ============================================================
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyCS-7Vn4X_NDxbEGyTrb1JQewf1QCQNffA",
  authDomain: "shop-reviews-3aedd.firebaseapp.com",
  projectId: "shop-reviews-3aedd",
  storageBucket: "shop-reviews-3aedd.firebasestorage.app",
  messagingSenderId: "191060203071",
  appId: "1:191060203071:web:c3025da0b9e7d805948a8a"
};

// ============================================================
// НАЛАШТУВАННЯ CLOUDINARY — для зберігання фото відгуків
// ============================================================
var CLOUDINARY_CONFIG = {
  cloudName: "dgrvehr2t",
  uploadPreset: "reviews_unsigned"
};

// ============================================================
// НАЛАШТУВАННЯ РОЗМІРІВ ЗІРОЧОК
// Змінюйте числа під свій дизайн (розмір у пікселях)
// ============================================================
var STAR_CONFIG = {
  // Зірочки під фото товару в каталозі (сторінка зі списком товарів)
  catalog_desktop: 22,
  catalog_mobile: 14,

  // Зірочки над назвою товару на сторінці товару (вгорі в правій колонці)
  product_header_desktop: 24,
  product_header_mobile: 20,

  // Середній рейтинг у блоці відгуків (великі зірочки біля числа 5.0)
  avg_rating_desktop: 28,
  avg_rating_mobile: 22,

  // Зірочки біля кожного окремого відгуку в списку
  review_item_desktop: 16,
  review_item_mobile: 13,
};

// ============================================================
// НАЛАШТУВАННЯ РОЗМІРУ ФОТО У ВІДГУКАХ
// ============================================================
var PHOTO_CONFIG = {
  // Розмір фото у відгуку (в пікселях)
  size_desktop: 120,
  size_mobile: 80,
};

// ============================================================
// ОСНОВНИЙ КОД ВІДЖЕТУ
// ============================================================
(function() {
  'use strict';

  // Визначаємо чи це мобільний пристрій
  function isMobile() {
    return window.innerWidth <= 768;
  }

  // Отримуємо потрібний розмір зірочок залежно від пристрою
  function starSize(key) {
    return isMobile() ? STAR_CONFIG[key + '_mobile'] : STAR_CONFIG[key + '_desktop'];
  }

  // Отримуємо розмір фото залежно від пристрою
  function photoSize() {
    return isMobile() ? PHOTO_CONFIG.size_mobile : PHOTO_CONFIG.size_desktop;
  }

  // Завантаження зовнішнього скрипту
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  // ============================================================
  // ІНІЦІАЛІЗАЦІЯ
  // ============================================================
  function initWidget() {
    var firebase = window.firebase;
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    var db = firebase.firestore();

    // Вставляємо стилі
    injectStyles();

    // Запускаємо рейтинги в каталозі з затримкою
    // (Tilda завантажує картки динамічно тому потрібна затримка)
    setTimeout(function() { renderCatalogRatings(db); }, 800);
    setTimeout(function() { renderCatalogRatings(db); }, 2000);
    setTimeout(function() { renderCatalogRatings(db); }, 4000);

    // Слідкуємо за динамічним завантаженням карток
    var catalogObs = new MutationObserver(function() {
      var newCards = document.querySelectorAll('.t-store__card[data-product-gen-uid]:not([data-rw-done])');
      if (newCards.length) renderCatalogRatings(db);
    });
    catalogObs.observe(document.body, { childList: true, subtree: true });

    // Запускаємо повний віджет на сторінці товару
    var productId = getProductId();
    if (productId) {
      waitForProductPage(db, productId);
    }
  }

  // ============================================================
  // СТИЛІ ВІДЖЕТУ
  // ============================================================
  function injectStyles() {
    if (document.getElementById('rw-styles')) return;
    var ps = photoSize();
    var style = document.createElement('style');
    style.id = 'rw-styles';
    style.textContent = [
      '.rw-stars { display:inline-flex; gap:2px; vertical-align:middle; }',
      '.rw-star { width:14px; height:14px; }',
      '.rw-star-full { fill:#F5A623; }',
      '.rw-star-empty { fill:none; stroke:#F5A623; stroke-width:1.5; }',

      // Рядок з зірочками (в каталозі та над назвою товару)
      '.rw-inline { display:flex; align-items:center; gap:5px; font-family:inherit; font-size:13px; color:#666; margin:4px 0; cursor:pointer; text-decoration:none; }',
      '.rw-inline:hover { opacity:0.8; }',
      '.rw-inline strong { color:#222; font-weight:600; }',

      // Основний блок відгуків
      '.rw-widget { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; max-width:780px; margin:40px auto; padding:0 16px; box-sizing:border-box; }',
      '.rw-widget * { box-sizing:border-box; }',

      // Заголовок блоку відгуків
      '.rw-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #eee; }',
      '.rw-title { font-size:20px; font-weight:700; color:#111; margin:0; }',

      // Середній рейтинг (велике число і зірочки)
      '.rw-avg-block { display:flex; align-items:center; gap:10px; }',
      '.rw-avg-num { font-size:36px; font-weight:800; color:#111; line-height:1; }',
      '.rw-avg-count { font-size:13px; color:#888; margin-top:2px; }',

      // Список відгуків
      '.rw-list { display:flex; flex-direction:column; gap:0; }',
      '.rw-item { padding:20px 0; border-bottom:1px solid #f0f0f0; }',
      '.rw-item:last-child { border-bottom:none; }',
      '.rw-item-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px; }',
      '.rw-item-left { display:flex; flex-direction:column; gap:4px; }',
      '.rw-author { font-weight:600; font-size:14px; color:#111; }',
      '.rw-date { font-size:12px; color:#aaa; }',
      '.rw-text { font-size:14px; line-height:1.6; color:#333; margin:8px 0; }',

      // Фото у відгуку
      '.rw-photos { display:flex; flex-wrap:wrap; gap:8px; margin:10px 0; }',
      '.rw-photo { width:' + ps + 'px; height:' + ps + 'px; border-radius:8px; object-fit:cover; cursor:pointer; border:1px solid #eee; transition:transform .15s; }',
      '.rw-photo:hover { transform:scale(1.03); }',

      // Відповідь магазину
      '.rw-reply { background:#f8f8f8; border-left:3px solid #111; border-radius:0 8px 8px 0; padding:10px 14px; margin-top:10px; }',
      '.rw-reply-label { font-size:11px; font-weight:700; color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }',
      '.rw-reply-text { font-size:13px; color:#333; line-height:1.5; }',

      // Кнопка "написати відгук"
      '.rw-write-btn { display:inline-flex; align-items:center; gap:8px; background:#111; color:#fff; border:none; border-radius:8px; padding:11px 22px; font-size:14px; font-weight:600; cursor:pointer; margin-bottom:24px; transition:background .15s; }',
      '.rw-write-btn:hover { background:#333; }',

      // Форма відгуку
      '.rw-form-wrap { background:#fafafa; border:1px solid #eee; border-radius:12px; padding:24px; margin-top:8px; }',
      '.rw-form-title { font-size:16px; font-weight:700; margin:0 0 18px; color:#111; }',
      '.rw-form-group { margin-bottom:16px; }',
      '.rw-form-label { font-size:13px; color:#555; margin-bottom:6px; display:block; font-weight:500; }',
      '.rw-star-picker { display:flex; gap:6px; }',
      '.rw-star-picker svg { width:28px; height:28px; fill:none; stroke:#F5A623; stroke-width:1.5; cursor:pointer; transition:fill .1s, transform .1s; }',
      '.rw-star-picker svg:hover, .rw-star-picker svg.on { fill:#F5A623; transform:scale(1.15); }',
      '.rw-input, .rw-textarea { width:100%; border:1px solid #ddd; border-radius:8px; padding:10px 12px; font-size:14px; font-family:inherit; color:#111; background:#fff; transition:border-color .15s; outline:none; }',
      '.rw-input:focus, .rw-textarea:focus { border-color:#111; }',
      '.rw-textarea { min-height:90px; resize:vertical; }',
      '.rw-form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }',

      // Завантаження фото у формі
      '.rw-upload-area { border:1.5px dashed #ccc; border-radius:8px; padding:16px; text-align:center; cursor:pointer; color:#888; font-size:13px; transition:border-color .15s, background .15s; }',
      '.rw-upload-area:hover { border-color:#111; background:#f5f5f5; }',
      '.rw-photo-previews { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }',
      '.rw-preview { position:relative; width:64px; height:64px; }',
      '.rw-preview img { width:64px; height:64px; border-radius:6px; object-fit:cover; border:1px solid #eee; }',
      '.rw-preview-del { position:absolute; top:-6px; right:-6px; width:18px; height:18px; background:#111; color:#fff; border:none; border-radius:50%; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1; }',

      // Кнопка відправки
      '.rw-submit { background:#111; color:#fff; border:none; border-radius:8px; padding:12px 28px; font-size:14px; font-weight:600; cursor:pointer; transition:background .15s; margin-top:4px; width:100%; }',
      '.rw-submit:hover { background:#333; }',
      '.rw-submit:disabled { background:#ccc; cursor:not-allowed; }',

      // Повідомлення успіху/помилки
      '.rw-msg { padding:12px 16px; border-radius:8px; font-size:14px; margin-top:12px; }',
      '.rw-msg-ok { background:#e8f5e9; color:#2e7d32; }',
      '.rw-msg-err { background:#ffebee; color:#c62828; }',

      // Порожній стан
      '.rw-empty { text-align:center; padding:32px; color:#aaa; font-size:14px; }',

      // Lightbox — перегляд фото на повний екран з каруселлю
      '.rw-lightbox { position:fixed; inset:0; background:rgba(0,0,0,.9); z-index:99999; display:flex; align-items:center; justify-content:center; }',
      '.rw-lightbox-img { max-width:85vw; max-height:85vh; border-radius:8px; object-fit:contain; transition:opacity .2s; }',
      '.rw-lightbox-close { position:absolute; top:16px; right:20px; color:#fff; font-size:32px; cursor:pointer; line-height:1; z-index:2; }',
      '.rw-lightbox-prev, .rw-lightbox-next { position:absolute; top:50%; transform:translateY(-50%); color:#fff; font-size:40px; cursor:pointer; padding:16px; z-index:2; user-select:none; background:rgba(0,0,0,.3); border-radius:4px; }',
      '.rw-lightbox-prev { left:10px; }',
      '.rw-lightbox-next { right:10px; }',
      '.rw-lightbox-counter { position:absolute; bottom:16px; left:50%; transform:translateX(-50%); color:#fff; font-size:14px; background:rgba(0,0,0,.5); padding:4px 12px; border-radius:20px; }',

      // Скелетон-лоадер
      '.rw-skeleton { background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size:200% 100%; animation:rw-shimmer 1.2s infinite; border-radius:4px; }',
      '@keyframes rw-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }',

      // Адаптив для мобільних
      '@media(max-width:600px) {',
      '  .rw-widget { padding:0 12px; margin:28px auto; }',
      '  .rw-avg-num { font-size:28px; }',
      '  .rw-photo { width:' + PHOTO_CONFIG.size_mobile + 'px; height:' + PHOTO_CONFIG.size_mobile + 'px; }',
      '  .rw-form-wrap { padding:16px; }',
      '  .rw-header { flex-direction:column; align-items:flex-start; }',
      '  .rw-form-row { grid-template-columns:1fr; }',
      '}',
    ].join('\n');
    document.head.appendChild(style);

    // SVG градієнт для половинних зірок
    var svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgDefs.setAttribute('style', 'position:absolute;width:0;height:0');
    svgDefs.innerHTML = '<defs><linearGradient id="rw-half"><stop offset="50%" stop-color="#F5A623"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs>';
    document.body.appendChild(svgDefs);
  }

  // ============================================================
  // ОТРИМАННЯ ID ТОВАРУ З URL
  // Підтримує формат Tilda: /tproduct/ID-назва-товару
  // ============================================================
  function getProductId() {
    // Формат Tilda: /тип/tproduct/288732088332-назва
    var m = window.location.pathname.match(/tproduct\/(\d+)/);
    if (m) return m[1];

    // З URL параметрів
    var url = new URL(window.location.href);
    var id = url.searchParams.get('productid') || url.searchParams.get('product_id') || url.searchParams.get('id');
    if (id) return String(id);

    // З data-атрибуту
    var el = document.querySelector('[data-product-id]');
    if (el) return String(el.dataset.productId);

    // Загальний патерн — число з 10+ цифр у шляху
    var m2 = window.location.pathname.match(/\/(\d{10,})/);
    if (m2) return m2[1];

    return null;
  }

  // ============================================================
  // ГЕНЕРАЦІЯ HTML ЗІРОЧОК
  // rating — число від 0 до 5 (підтримує половинки)
  // size — розмір у пікселях
  // ============================================================
  function starsHTML(rating, size) {
    size = size || 14;
    var html = '<span class="rw-stars">';
    for (var i = 1; i <= 5; i++) {
      var cls = 'rw-star-empty';
      if (i <= Math.floor(rating)) cls = 'rw-star-full';
      else if (i - rating < 1 && i - rating > 0) cls = 'rw-star-half';
      html += '<svg class="rw-star" viewBox="0 0 16 16" width="' + size + '" height="' + size + '">' +
        '<path class="' + cls + '" d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z"/></svg>';
    }
    return html + '</span>';
  }

  // Форматування дати
  function formatDate(ts) {
    if (!ts) return '';
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // ============================================================
  // РЕЙТИНГ В КАТАЛОЗІ ТОВАРІВ
  // Відображає зірочки під назвою кожного товару на сторінці каталогу
  // ============================================================
  function renderCatalogRatings(db) {
    var size = starSize('catalog');

    function processCard(card, pid) {
      if (card.dataset.rwDone) return;
      card.dataset.rwDone = '1';

      db.collection('reviews')
        .where('productId', '==', String(pid))
        .where('status', '==', 'approved')
        .get()
        .then(function(snap) {
          if (snap.empty) return;
          var total = 0;
          snap.forEach(function(d) { total += (d.data().rating || 0); });
          var avg = total / snap.size;

          var el = document.createElement('div');
          el.className = 'rw-inline';
          el.innerHTML = starsHTML(avg, size) + '<strong>' + avg.toFixed(1) + '</strong><span>(' + snap.size + ')</span>';

          // Вставляємо після назви товару
          var insertAfter = card.querySelector('.t-store__card__title, .js-store-prod-name, [class*="title"], h3, h2');
          if (insertAfter && insertAfter.parentNode) {
            insertAfter.parentNode.insertBefore(el, insertAfter.nextSibling);
          } else {
            card.appendChild(el);
          }
        });
    }

    // Знаходимо картки по атрибуту data-product-gen-uid (правильний ID товару в Tilda)
    var cards = document.querySelectorAll('.t-store__card[data-product-gen-uid]');
    cards.forEach(function(card) {
      var pid = card.dataset.productGenUid;
      if (pid) processCard(card, pid);
    });
  }

  // ============================================================
  // ОЧІКУЄМО ЗАВАНТАЖЕННЯ СТОРІНКИ ТОВАРУ
  // ============================================================
  function waitForProductPage(db, productId) {

    // Вставляємо рядок з рейтингом над назвою товару
    function tryInsertHeader() {
      var titleEl = document.querySelector('.t-store__prod-popup__name, .js-store-prod-name');
      if (!titleEl) return false;
      if (document.getElementById('rw-header-' + productId)) return true;

      var wrap = document.createElement('div');
      wrap.id = 'rw-header-' + productId;
      wrap.className = 'rw-inline';
      wrap.innerHTML = '<span class="rw-skeleton" style="width:100px;height:14px;display:inline-block;"></span>';

      // При кліку — прокручуємо до блоку відгуків
      wrap.addEventListener('click', function() {
        var widget = document.getElementById('rw-widget-' + productId);
        if (widget) {
          widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      titleEl.parentNode.insertBefore(wrap, titleEl);
      loadProductRating(db, productId, wrap);
      return true;
    }

    // Вставляємо повний блок відгуків внизу сторінки товару
    function tryInsertWidget() {
      var anchor = document.querySelector('.t-store__prod-snippet__container');
      if (!anchor) return false;
      if (document.getElementById('rw-widget-' + productId)) return true;

      var container = document.createElement('div');
      container.id = 'rw-widget-' + productId;
      container.className = 'rw-widget';

      anchor.parentNode.insertBefore(container, anchor.nextSibling);
      renderFullWidget(db, productId, container);
      return true;
    }

    // Чекаємо поки елементи з'являться в DOM
    if (!tryInsertHeader()) {
      var obs = new MutationObserver(function() {
        if (tryInsertHeader()) obs.disconnect();
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }

    setTimeout(function() { tryInsertHeader(); tryInsertWidget(); }, 500);
    setTimeout(function() { tryInsertHeader(); tryInsertWidget(); }, 1500);
  }

  // ============================================================
  // ЗАВАНТАЖЕННЯ РЕЙТИНГУ ДЛЯ РЯДКА НАД НАЗВОЮ ТОВАРУ
  // ============================================================
  function loadProductRating(db, productId, el) {
    var size = starSize('product_header');

    db.collection('reviews')
      .where('productId', '==', productId)
      .where('status', '==', 'approved')
      .get()
      .then(function(snap) {
        if (snap.empty) {
          el.innerHTML = starsHTML(0, size) + '<span style="color:#aaa;font-size:13px;">Немає відгуків</span>';
          return;
        }
        var total = 0;
        snap.forEach(function(d) { total += d.data().rating || 0; });
        var avg = total / snap.size;
        el.innerHTML = starsHTML(avg, size) +
          '<strong>' + avg.toFixed(1) + '</strong>' +
          '<span>(' + snap.size + ' ' + plural(snap.size, 'відгук', 'відгуки', 'відгуків') + ')</span>';
      });
  }

  // ============================================================
  // ПОВНИЙ БЛОК ВІДГУКІВ НА СТОРІНЦІ ТОВАРУ
  // ============================================================
  function renderFullWidget(db, productId, container) {
    // Показуємо скелетон поки завантажуємо
    container.innerHTML = '<div class="rw-skeleton" style="height:80px;border-radius:12px;margin-bottom:16px;"></div>';

    db.collection('reviews')
      .where('productId', '==', productId)
      .where('status', '==', 'approved')
      .orderBy('createdAt', 'desc')
      .get()
      .then(function(snap) {
        var reviews = [];
        snap.forEach(function(d) { reviews.push(Object.assign({ id: d.id }, d.data())); });
        renderWidget(db, productId, container, reviews);
      })
      .catch(function() {
        // Якщо немає індексу — завантажуємо без сортування
        db.collection('reviews')
          .where('productId', '==', productId)
          .where('status', '==', 'approved')
          .get()
          .then(function(snap) {
            var reviews = [];
            snap.forEach(function(d) { reviews.push(Object.assign({ id: d.id }, d.data())); });
            reviews.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
            renderWidget(db, productId, container, reviews);
          });
      });
  }

  function renderWidget(db, productId, container, reviews) {
    var avgSize = starSize('avg_rating');
    var total = 0;
    reviews.forEach(function(r) { total += r.rating || 0; });
    var avg = reviews.length ? total / reviews.length : 0;

    var html = '<div class="rw-header">';
    html += '<h3 class="rw-title">Відгуки про товар</h3>';
    if (reviews.length) {
      html += '<div class="rw-avg-block">';
      html += '<span class="rw-avg-num">' + avg.toFixed(1) + '</span>';
      html += '<div>' + starsHTML(avg, avgSize);
      html += '<div class="rw-avg-count">' + reviews.length + ' ' + plural(reviews.length, 'відгук', 'відгуки', 'відгуків') + '</div></div>';
      html += '</div>';
    }
    html += '</div>';

    // Кнопка написати відгук
    html += '<button class="rw-write-btn" id="rw-open-form">✏ Написати відгук</button>';

    // Форма відгуку (прихована за замовчуванням)
    html += buildFormHTML();

    // Список відгуків
    html += '<div class="rw-list">';
    if (!reviews.length) {
      html += '<div class="rw-empty">Ще немає відгуків. Будьте першим!</div>';
    } else {
      reviews.forEach(function(r) {
        html += buildReviewHTML(r);
      });
    }
    html += '</div>';

    container.innerHTML = html;
    bindFormEvents(db, productId, container);
  }

  // ============================================================
  // HTML ОДНОГО ВІДГУКУ
  // ============================================================
  function buildReviewHTML(r) {
    var itemSize = starSize('review_item');
    var ps = photoSize();
    var html = '<div class="rw-item">';
    html += '<div class="rw-item-header">';
    html += '<div class="rw-item-left">';
    html += '<div class="rw-author">' + escHtml(r.name || 'Анонім') + '</div>';
    html += '<div class="rw-date">' + formatDate(r.createdAt) + '</div>';
    html += '</div>';
    html += '<div class="rw-item-stars">' + starsHTML(r.rating || 0, itemSize) + '</div>';
    html += '</div>';

    if (r.text) {
      html += '<div class="rw-text">' + escHtml(r.text) + '</div>';
    }

    // Фото відгуку — клік відкриває карусель
    if (r.photos && r.photos.length) {
      html += '<div class="rw-photos">';
      r.photos.forEach(function(url, idx) {
        var allPhotos = JSON.stringify(r.photos).replace(/"/g, '&quot;');
        html += '<img class="rw-photo" src="' + url + '" loading="lazy" ' +
          'style="width:' + ps + 'px;height:' + ps + 'px;" ' +
          'onclick="rwLightbox(' + idx + ', ' + allPhotos + ')">';
      });
      html += '</div>';
    }

    // Відповідь магазину
    if (r.reply) {
      html += '<div class="rw-reply"><div class="rw-reply-label">Відповідь магазину</div>';
      html += '<div class="rw-reply-text">' + escHtml(r.reply) + '</div></div>';
    }

    html += '</div>';
    return html;
  }

  // ============================================================
  // HTML ФОРМИ ВІДГУКУ
  // ============================================================
  function buildFormHTML() {
    return '<div class="rw-form-wrap" id="rw-form-wrap" style="display:none;">' +
      '<div class="rw-form-title">Поділіться своєю думкою</div>' +
      '<div class="rw-form-group">' +
        '<label class="rw-form-label">Загальна оцінка *</label>' +
        '<div class="rw-star-picker" id="rw-star-picker">' +
          [1,2,3,4,5].map(function(i) {
            return '<svg viewBox="0 0 24 24" data-v="' + i + '">' +
              '<path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="rw-form-group">' +
        '<label class="rw-form-label">Відгук</label>' +
        '<textarea class="rw-textarea" id="rw-text" placeholder="Розкажіть про товар..." rows="4"></textarea>' +
      '</div>' +
      '<div class="rw-form-group">' +
        '<label class="rw-form-label">Фото (до 6 штук)</label>' +
        '<div class="rw-upload-area" id="rw-upload-area">+ Додати фото</div>' +
        '<input type="file" id="rw-file-input" accept="image/*" multiple style="display:none">' +
        '<div class="rw-photo-previews" id="rw-photo-previews"></div>' +
      '</div>' +
      '<div class="rw-form-row">' +
        '<div class="rw-form-group">' +
          '<label class="rw-form-label">Ім\'я *</label>' +
          '<input type="text" class="rw-input" id="rw-name" placeholder="Ваше ім\'я">' +
        '</div>' +
        '<div class="rw-form-group">' +
          '<label class="rw-form-label">E-mail</label>' +
          '<input type="email" class="rw-input" id="rw-email" placeholder="email@example.com">' +
        '</div>' +
      '</div>' +
      '<button class="rw-submit" id="rw-submit">Надіслати відгук</button>' +
      '<div id="rw-msg"></div>' +
    '</div>';
  }

  // ============================================================
  // ОБРОБКА ФОРМИ ВІДГУКУ
  // ============================================================
  function bindFormEvents(db, productId, container) {
    var selectedRating = 0;
    var selectedFiles = [];

    // Відкрити/закрити форму
    var openBtn = container.querySelector('#rw-open-form');
    var formWrap = container.querySelector('#rw-form-wrap');
    if (openBtn && formWrap) {
      openBtn.addEventListener('click', function() {
        var isOpen = formWrap.style.display !== 'none';
        formWrap.style.display = isOpen ? 'none' : 'block';
        openBtn.textContent = isOpen ? '✏ Написати відгук' : '✕ Скасувати';
      });
    }

    // Інтерактивний вибір зірочок у формі
    var picker = container.querySelector('#rw-star-picker');
    if (picker) {
      var svgs = picker.querySelectorAll('svg');
      svgs.forEach(function(s) {
        s.addEventListener('mouseenter', function() {
          var v = +s.dataset.v;
          svgs.forEach(function(x) { x.classList.toggle('on', +x.dataset.v <= v); });
        });
        s.addEventListener('mouseleave', function() {
          svgs.forEach(function(x) { x.classList.toggle('on', +x.dataset.v <= selectedRating); });
        });
        s.addEventListener('click', function() {
          selectedRating = +s.dataset.v;
          svgs.forEach(function(x) { x.classList.toggle('on', +x.dataset.v <= selectedRating); });
        });
      });
    }

    // Завантаження фото у форму
    var uploadArea = container.querySelector('#rw-upload-area');
    var fileInput = container.querySelector('#rw-file-input');
    var previewsEl = container.querySelector('#rw-photo-previews');

    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', function() { fileInput.click(); });
      fileInput.addEventListener('change', function() {
        Array.from(fileInput.files).forEach(function(f) {
          if (selectedFiles.length >= 6) return;
          selectedFiles.push(f);
          var reader = new FileReader();
          reader.onload = function(e) {
            var idx = selectedFiles.length - 1;
            var wrap = document.createElement('div');
            wrap.className = 'rw-preview';
            wrap.innerHTML = '<img src="' + e.target.result + '"><button class="rw-preview-del" data-idx="' + idx + '">×</button>';
            previewsEl.appendChild(wrap);
          };
          reader.readAsDataURL(f);
        });
        fileInput.value = '';
      });

      previewsEl.addEventListener('click', function(e) {
        var del = e.target.closest('.rw-preview-del');
        if (!del) return;
        var idx = +del.dataset.idx;
        selectedFiles.splice(idx, 1);
        del.parentNode.remove();
        previewsEl.querySelectorAll('.rw-preview-del').forEach(function(btn, i) {
          btn.dataset.idx = i;
        });
      });
    }

    // Відправка форми
    var submitBtn = container.querySelector('#rw-submit');
    var msgEl = container.querySelector('#rw-msg');

    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        var name = (container.querySelector('#rw-name').value || '').trim();
        var email = (container.querySelector('#rw-email').value || '').trim();
        var text = (container.querySelector('#rw-text').value || '').trim();

        if (!name) return showMsg(msgEl, 'error', 'Введіть ваше ім\'я');
        if (!selectedRating) return showMsg(msgEl, 'error', 'Виберіть оцінку');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Завантажуємо фото...';

        uploadPhotos(selectedFiles).then(function(photoUrls) {
          submitBtn.textContent = 'Надсилаємо...';
          // Беремо назву товару і URL зі сторінки
          var productName = '';
          var productUrl = window.location.href;
          var nameEl = document.querySelector('.t-store__prod-popup__name, .js-store-prod-name');
          if (nameEl) productName = nameEl.textContent.trim();

          return firebase.firestore().collection('reviews').add({
            productId: productId,
            productName: productName,
            productUrl: productUrl,
            name: name,
            email: email,
            text: text,
            rating: selectedRating,
            photos: photoUrls,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }).then(function() {
          showMsg(msgEl, 'ok', 'Дякуємо! Відгук відправлено на модерацію і скоро з\'явиться на сторінці.');
          submitBtn.textContent = 'Надіслано ✓';
          container.querySelector('#rw-name').value = '';
          container.querySelector('#rw-email').value = '';
          container.querySelector('#rw-text').value = '';
          selectedRating = 0;
          selectedFiles = [];
          previewsEl.innerHTML = '';
          if (picker) picker.querySelectorAll('svg').forEach(function(x) { x.classList.remove('on'); });
        }).catch(function(err) {
          console.error(err);
          showMsg(msgEl, 'error', 'Сталася помилка. Спробуйте ще раз.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Надіслати відгук';
        });
      });
    }
  }

  // ============================================================
  // ЗАВАНТАЖЕННЯ ФОТО НА CLOUDINARY
  // ============================================================
  function uploadPhotos(files) {
    if (!files.length) return Promise.resolve([]);
    var promises = files.map(function(file) {
      var fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      fd.append('folder', 'reviews');
      return fetch('https://api.cloudinary.com/v1_1/' + CLOUDINARY_CONFIG.cloudName + '/image/upload', {
        method: 'POST',
        body: fd
      }).then(function(r) { return r.json(); })
        .then(function(data) { return data.secure_url; });
    });
    return Promise.all(promises);
  }

  // ============================================================
  // УТИЛІТИ
  // ============================================================
  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function plural(n, f1, f2, f5) {
    n = Math.abs(n) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) return f5;
    if (n1 > 1 && n1 < 5) return f2;
    if (n1 === 1) return f1;
    return f5;
  }

  function showMsg(el, type, text) {
    el.className = 'rw-msg rw-msg-' + (type === 'ok' ? 'ok' : 'err');
    el.textContent = text;
    el.style.display = 'block';
  }

  // ============================================================
  // СТАРТ
  // ============================================================
  function start() {
    loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js', function() {
      loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js', function() {
        initWidget();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();

// ============================================================
// LIGHTBOX З КАРУСЕЛЛЮ
// Відкриває фото на повний екран з можливістю гортати між фото відгуку
// ============================================================
window.rwLightbox = function(startIdx, photos) {
  var current = startIdx;

  function render() {
    var lb = document.getElementById('rw-lb');
    if (lb) {
      var img = lb.querySelector('.rw-lightbox-img');
      var counter = lb.querySelector('.rw-lightbox-counter');
      img.style.opacity = '0';
      setTimeout(function() {
        img.src = photos[current];
        img.style.opacity = '1';
        if (counter) counter.textContent = (current + 1) + ' / ' + photos.length;
      }, 150);
    }
  }

  // Якщо lightbox вже відкритий — просто оновлюємо
  if (document.getElementById('rw-lb')) {
    render();
    return;
  }

  var lb = document.createElement('div');
  lb.className = 'rw-lightbox';
  lb.id = 'rw-lb';

  var hasMultiple = photos.length > 1;

  lb.innerHTML =
    '<span class="rw-lightbox-close">×</span>' +
    (hasMultiple ? '<span class="rw-lightbox-prev">‹</span>' : '') +
    '<img class="rw-lightbox-img" src="' + photos[current] + '">' +
    (hasMultiple ? '<span class="rw-lightbox-next">›</span>' : '') +
    (hasMultiple ? '<span class="rw-lightbox-counter">' + (current + 1) + ' / ' + photos.length + '</span>' : '');

  // Закрити
  lb.querySelector('.rw-lightbox-close').addEventListener('click', function(e) {
    e.stopPropagation();
    lb.remove();
  });

  // Попереднє фото
  if (hasMultiple) {
    lb.querySelector('.rw-lightbox-prev').addEventListener('click', function(e) {
      e.stopPropagation();
      current = (current - 1 + photos.length) % photos.length;
      render();
    });

    // Наступне фото
    lb.querySelector('.rw-lightbox-next').addEventListener('click', function(e) {
      e.stopPropagation();
      current = (current + 1) % photos.length;
      render();
    });
  }

  // Клік на фон — закрити
  lb.addEventListener('click', function(e) {
    if (e.target === lb) lb.remove();
  });

  // Клавіатура — стрілки і Escape
  function onKey(e) {
    if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', onKey); }
    if (e.key === 'ArrowRight' && hasMultiple) { current = (current + 1) % photos.length; render(); }
    if (e.key === 'ArrowLeft' && hasMultiple) { current = (current - 1 + photos.length) % photos.length; render(); }
  }
  document.addEventListener('keydown', onKey);

  // Свайп для мобільного
  var touchStartX = 0;
  var touchStartY = 0;
  lb.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  lb.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50 && hasMultiple) {
      if (dx < 0) { current = (current + 1) % photos.length; render(); }
      else { current = (current - 1 + photos.length) % photos.length; render(); }
    }
  }, { passive: true });

  document.body.appendChild(lb);
};

// ============================================================
// ПЕРЕМІЩЕННЯ БЛОКІВ НА ПРАВИЛЬНІ ПОЗИЦІЇ
// rw-header — перед назвою товару
// rw-widget — після головного контейнера магазину
// ============================================================
(function() {
  function moveHeader() {
    var header = document.querySelector('.rw-inline[id^="rw-header"]');
    if (!header || header.dataset.movedH) return;
    var titleEl = document.querySelector('.t-store__prod-popup__name, .js-store-prod-name');
    if (!titleEl) return;
    header.dataset.movedH = '1';
    titleEl.parentNode.insertBefore(header, titleEl);
  }

  function moveWidget() {
    var widget = document.querySelector('.rw-widget');
    if (!widget || widget.dataset.moved) return;
    var storeContainer = null;
    var el = widget.parentElement;
    while (el && el !== document.body) {
      if (el.className && el.className.indexOf('t-store__prod-snippet__container') !== -1) {
        storeContainer = el; break;
      }
      el = el.parentElement;
    }
    if (!storeContainer) return;
    widget.dataset.moved = '1';
    storeContainer.parentNode.insertBefore(widget, storeContainer.nextSibling);
  }

  setTimeout(function() { moveHeader(); moveWidget(); }, 600);
  setTimeout(function() { moveHeader(); moveWidget(); }, 1500);
  setTimeout(function() { moveHeader(); moveWidget(); }, 3000);
})();
