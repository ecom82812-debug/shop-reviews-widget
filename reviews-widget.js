// ============================================================
// НАЛАШТУВАННЯ — замінити на свої дані
// ============================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCS-7Vn4X_NDxbEGyTrb1JQewf1QCQNffA",
  authDomain: "shop-reviews-3aedd.firebaseapp.com",
  projectId: "shop-reviews-3aedd",
  storageBucket: "shop-reviews-3aedd.firebasestorage.app",
  messagingSenderId: "191060203071",
  appId: "1:191060203071:web:c3025da0b9e7d805948a8a"
};

const CLOUDINARY_CONFIG = {
  cloudName: "dgrvehr2t",
  uploadPreset: "reviews_unsigned" // створимо на Cloudinary
};

// ============================================================
// ІНІЦІАЛІЗАЦІЯ FIREBASE
// ============================================================
(function() {
  'use strict';

  // Підключаємо Firebase SDK
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  function initWidget() {
    var firebase = window.firebase;
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    var db = firebase.firestore();

    // Стилі віджету
    injectStyles();

    // Запускаємо рейтинги в каталозі
    renderCatalogRatings(db);

    // Запускаємо повний віджет на сторінках товарів
    var productId = getProductId();
    if (productId) {
      waitForProductPage(db, productId);
    }
  }

  // ============================================================
  // СТИЛІ
  // ============================================================
  function injectStyles() {
    if (document.getElementById('rw-styles')) return;
    var style = document.createElement('style');
    style.id = 'rw-styles';
    style.textContent = `
      .rw-stars { display:inline-flex; gap:2px; vertical-align:middle; }
      .rw-star { width:14px; height:14px; }
      .rw-star-full { fill:#F5A623; }
      .rw-star-empty { fill:none; stroke:#F5A623; stroke-width:1.5; }
      .rw-star-half { fill:url(#rw-half); }

      .rw-inline { display:flex; align-items:center; gap:5px; font-family:inherit; font-size:13px; color:#666; margin:4px 0; cursor:pointer; }
      .rw-inline strong { color:#222; font-weight:600; }

      /* Блок відгуків на сторінці товару */
      .rw-widget { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:780px; margin:40px auto; padding:0 16px; box-sizing:border-box; }
      .rw-widget * { box-sizing:border-box; }

      /* Заголовок і середній рейтинг */
      .rw-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #eee; }
      .rw-title { font-size:20px; font-weight:700; color:#111; margin:0; }
      .rw-avg-block { display:flex; align-items:center; gap:10px; }
      .rw-avg-num { font-size:36px; font-weight:800; color:#111; line-height:1; }
      .rw-avg-stars .rw-star { width:18px; height:18px; }
      .rw-avg-count { font-size:13px; color:#888; margin-top:2px; }

      /* Список відгуків */
      .rw-list { display:flex; flex-direction:column; gap:0; }
      .rw-item { padding:20px 0; border-bottom:1px solid #f0f0f0; }
      .rw-item:last-child { border-bottom:none; }
      .rw-item-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px; }
      .rw-item-left { display:flex; flex-direction:column; gap:4px; }
      .rw-author { font-weight:600; font-size:14px; color:#111; }
      .rw-date { font-size:12px; color:#aaa; }
      .rw-item-stars .rw-star { width:13px; height:13px; }
      .rw-text { font-size:14px; line-height:1.6; color:#333; margin:8px 0; }

      /* Фото у відгуку */
      .rw-photos { display:flex; flex-wrap:wrap; gap:8px; margin:10px 0; }
      .rw-photo { width:72px; height:72px; border-radius:8px; object-fit:cover; cursor:pointer; border:1px solid #eee; transition:transform .15s; }
      .rw-photo:hover { transform:scale(1.05); }

      /* Відповідь магазину */
      .rw-reply { background:#f8f8f8; border-left:3px solid #111; border-radius:0 8px 8px 0; padding:10px 14px; margin-top:10px; }
      .rw-reply-label { font-size:11px; font-weight:700; color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }
      .rw-reply-text { font-size:13px; color:#333; line-height:1.5; }

      /* Кнопка "написати відгук" */
      .rw-write-btn { display:inline-flex; align-items:center; gap:8px; background:#111; color:#fff; border:none; border-radius:8px; padding:11px 22px; font-size:14px; font-weight:600; cursor:pointer; margin-bottom:24px; transition:background .15s; }
      .rw-write-btn:hover { background:#333; }

      /* Форма відгуку */
      .rw-form-wrap { background:#fafafa; border:1px solid #eee; border-radius:12px; padding:24px; margin-top:8px; }
      .rw-form-title { font-size:16px; font-weight:700; margin:0 0 18px; color:#111; }
      .rw-form-group { margin-bottom:16px; }
      .rw-form-label { font-size:13px; color:#555; margin-bottom:6px; display:block; font-weight:500; }
      .rw-star-picker { display:flex; gap:6px; }
      .rw-star-picker svg { width:28px; height:28px; fill:none; stroke:#F5A623; stroke-width:1.5; cursor:pointer; transition:fill .1s, transform .1s; }
      .rw-star-picker svg:hover, .rw-star-picker svg.on { fill:#F5A623; transform:scale(1.15); }
      .rw-input, .rw-textarea { width:100%; border:1px solid #ddd; border-radius:8px; padding:10px 12px; font-size:14px; font-family:inherit; color:#111; background:#fff; transition:border-color .15s; outline:none; }
      .rw-input:focus, .rw-textarea:focus { border-color:#111; }
      .rw-textarea { min-height:90px; resize:vertical; }
      .rw-form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      @media(max-width:500px) { .rw-form-row { grid-template-columns:1fr; } }

      /* Завантаження фото */
      .rw-upload-area { border:1.5px dashed #ccc; border-radius:8px; padding:16px; text-align:center; cursor:pointer; color:#888; font-size:13px; transition:border-color .15s, background .15s; }
      .rw-upload-area:hover { border-color:#111; background:#f5f5f5; }
      .rw-photo-previews { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
      .rw-preview { position:relative; width:64px; height:64px; }
      .rw-preview img { width:64px; height:64px; border-radius:6px; object-fit:cover; border:1px solid #eee; }
      .rw-preview-del { position:absolute; top:-6px; right:-6px; width:18px; height:18px; background:#111; color:#fff; border:none; border-radius:50%; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1; }

      /* Кнопка відправки */
      .rw-submit { background:#111; color:#fff; border:none; border-radius:8px; padding:12px 28px; font-size:14px; font-weight:600; cursor:pointer; transition:background .15s; margin-top:4px; width:100%; }
      .rw-submit:hover { background:#333; }
      .rw-submit:disabled { background:#ccc; cursor:not-allowed; }

      /* Повідомлення */
      .rw-msg { padding:12px 16px; border-radius:8px; font-size:14px; margin-top:12px; }
      .rw-msg-ok { background:#e8f5e9; color:#2e7d32; }
      .rw-msg-err { background:#ffebee; color:#c62828; }

      /* Порожній стан */
      .rw-empty { text-align:center; padding:32px; color:#aaa; font-size:14px; }

      /* Lightbox для фото */
      .rw-lightbox { position:fixed; inset:0; background:rgba(0,0,0,.85); z-index:99999; display:flex; align-items:center; justify-content:center; cursor:zoom-out; }
      .rw-lightbox img { max-width:90vw; max-height:90vh; border-radius:8px; object-fit:contain; }
      .rw-lightbox-close { position:absolute; top:16px; right:20px; color:#fff; font-size:28px; cursor:pointer; line-height:1; }

      /* Скелетон-лоадер */
      .rw-skeleton { background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size:200% 100%; animation:rw-shimmer 1.2s infinite; border-radius:4px; }
      @keyframes rw-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

      /* Мобільні */
      @media(max-width:600px) {
        .rw-widget { padding:0 12px; margin:28px auto; }
        .rw-avg-num { font-size:28px; }
        .rw-photo { width:60px; height:60px; }
        .rw-form-wrap { padding:16px; }
        .rw-header { flex-direction:column; align-items:flex-start; }
      }
    `;
    document.head.appendChild(style);

    // SVG градієнт для половинок зірок
    var svgDefs = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svgDefs.setAttribute('style','position:absolute;width:0;height:0');
    svgDefs.innerHTML = '<defs><linearGradient id="rw-half"><stop offset="50%" stop-color="#F5A623"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs>';
    document.body.appendChild(svgDefs);
  }

  // ============================================================
  // УТИЛІТИ
  // ============================================================
  function getProductId() {
    // Формат Tilda: /tproduct/288732088332-nazva-tovaru
    var tproductMatch = window.location.pathname.match(/tproduct\/(\d+)/);
    if (tproductMatch) return tproductMatch[1];

    // З URL параметра
    var url = new URL(window.location.href);
    var id = url.searchParams.get('productid') || url.searchParams.get('product_id') || url.searchParams.get('id');
    if (id) return String(id);

    // З data-атрибута на сторінці Tilda
    var el = document.querySelector('[data-product-id]');
    if (el) return String(el.dataset.productId);

    // Загальний патерн з pathname
    var match = window.location.pathname.match(/\/(\d{10,})/);
    if (match) return match[1];

    return null;
  }

  function starsHTML(rating, size) {
    size = size || 14;
    var html = '<span class="rw-stars">';
    for (var i = 1; i <= 5; i++) {
      var cls = 'rw-star-empty';
      if (i <= Math.floor(rating)) cls = 'rw-star-full';
      else if (i - rating < 1 && i - rating > 0) cls = 'rw-star-half';
      html += '<svg class="rw-star" viewBox="0 0 16 16" width="'+size+'" height="'+size+'"><defs><linearGradient id="rw-half-'+i+'"><stop offset="50%" stop-color="#F5A623"/><stop offset="50%" stop-color="transparent" stop-opacity="1"/></linearGradient></defs><path class="'+cls+'" d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z"/></svg>';
    }
    return html + '</span>';
  }

  function formatDate(ts) {
    if (!ts) return '';
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('uk-UA', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  // ============================================================
  // РЕЙТИНГ В КАТАЛОЗІ
  // ============================================================
  function renderCatalogRatings(db) {
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
          el.innerHTML = starsHTML(avg, 13) + '<strong>' + avg.toFixed(1) + '</strong><span>(' + snap.size + ')</span>';
          // Вставляємо після назви товару
          var insertAfter = card.querySelector('.t-store__card__title, .js-store-prod-name, [class*="title"], h3, h2');
          if (insertAfter && insertAfter.parentNode) {
            insertAfter.parentNode.insertBefore(el, insertAfter.nextSibling);
          } else {
            card.appendChild(el);
          }
        });
    }

    // Tilda Store картки з data-product-gen-uid (головний ID товару)
    var cards = document.querySelectorAll('.t-store__card[data-product-gen-uid], .t-store__card[data-product-uid]');
    cards.forEach(function(card) {
      var pid = card.dataset.productGenUid || card.dataset.productUid;
      if (pid) processCard(card, pid);
    });

    // Запасний варіант через посилання
    if (!cards.length) {
      document.querySelectorAll('a[href*="tproduct"]').forEach(function(link) {
        var m = link.href.match(/tproduct\/(\d+)/);
        if (!m) return;
        var pid = m[1];
        var card = link.closest('.t-store__card, [class*="card"], [class*="item"]');
        if (card) processCard(card, pid);
      });
    }
  }

  // ============================================================
  // ОЧІКУЄМО ЗАВАНТАЖЕННЯ СТОРІНКИ ТОВАРУ
  // ============================================================
  function waitForProductPage(db, productId) {
    // Вставляємо рейтинг над назвою товару (popup або сторінка)
    function tryInsertHeader() {
      // Назва товару в Tilda Store
      var titleEl = document.querySelector(
        '.t-store__prod-popup__name, .js-store-prod-name, .js-product-name, ' +
        '.t-product__title, h1.t-title, .t-col h1'
      );
      if (!titleEl) return false;
      if (document.getElementById('rw-header-'+productId)) return true;

      var wrap = document.createElement('div');
      wrap.id = 'rw-header-'+productId;
      wrap.className = 'rw-inline';
      wrap.innerHTML = '<span class="rw-skeleton" style="width:90px;height:14px;display:inline-block;"></span>';
      // Вставляємо ПЕРЕД назвою товару
      titleEl.parentNode.insertBefore(wrap, titleEl);
      loadProductRating(db, productId, wrap);
      return true;
    }

    // Вставляємо блок відгуків внизу
    function tryInsertWidget() {
      var anchor = document.querySelector('.t-product__description-wrapper, .t-store__product-description, .js-product-popup-description, .t-col .t-text, .t-container .t-col:last-child, [class*="product-description"]');
      if (!anchor) {
        // Запасний варіант — вставляємо в кінець основного контенту сторінки
        anchor = document.querySelector('.t-body, #allrecords, .t-records');
      }
      if (!anchor) return false;
      if (document.getElementById('rw-widget-'+productId)) return true;

      var container = document.createElement('div');
      container.id = 'rw-widget-'+productId;
      container.className = 'rw-widget';

      anchor.parentNode.insertBefore(container, anchor.nextSibling);
      renderFullWidget(db, productId, container);
      return true;
    }

    if (!tryInsertHeader()) {
      var obs = new MutationObserver(function() {
        if (tryInsertHeader()) obs.disconnect();
      });
      obs.observe(document.body, { childList:true, subtree:true });
    }

    // Для popup чекаємо відкриття
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-product-popup], .t-store__card-btn-detail, .js-product-detail-btn');
      if (btn) {
        setTimeout(function() {
          tryInsertHeader();
          tryInsertWidget();
        }, 300);
      }
    });

    // Також відразу для сторінки товару
    setTimeout(function() {
      tryInsertHeader();
      tryInsertWidget();
    }, 500);
  }

  function loadProductRating(db, productId, el) {
    db.collection('reviews')
      .where('productId', '==', productId)
      .where('status', '==', 'approved')
      .get()
      .then(function(snap) {
        if (snap.empty) {
          el.innerHTML = starsHTML(0, 14) + '<span style="color:#aaa;font-size:13px;">Немає відгуків</span>';
          return;
        }
        var total = 0;
        snap.forEach(function(d) { total += d.data().rating || 0; });
        var avg = total / snap.size;
        el.innerHTML = starsHTML(avg, 14) + '<strong>' + avg.toFixed(1) + '</strong><span>(' + snap.size + ' відгуків)</span>';
      });
  }

  // ============================================================
  // ПОВНИЙ БЛОК ВІДГУКІВ
  // ============================================================
  function renderFullWidget(db, productId, container) {
    container.innerHTML = '<div class="rw-skeleton" style="height:80px;border-radius:12px;margin-bottom:16px;"></div><div class="rw-skeleton" style="height:120px;border-radius:12px;"></div>';

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
        // Firestore може ще не мати індексу — грузимо без сортування
        db.collection('reviews')
          .where('productId', '==', productId)
          .where('status', '==', 'approved')
          .get()
          .then(function(snap) {
            var reviews = [];
            snap.forEach(function(d) { reviews.push(Object.assign({ id: d.id }, d.data())); });
            reviews.sort(function(a,b) { return (b.createdAt||0) - (a.createdAt||0); });
            renderWidget(db, productId, container, reviews);
          });
      });
  }

  function renderWidget(db, productId, container, reviews) {
    var total = 0;
    reviews.forEach(function(r) { total += r.rating || 0; });
    var avg = reviews.length ? total / reviews.length : 0;

    var html = '<div class="rw-header">';
    html += '<h3 class="rw-title">Відгуки про товар</h3>';
    if (reviews.length) {
      html += '<div class="rw-avg-block">';
      html += '<span class="rw-avg-num">' + avg.toFixed(1) + '</span>';
      html += '<div><div class="rw-avg-stars">' + starsHTML(avg, 18) + '</div>';
      html += '<div class="rw-avg-count">' + reviews.length + ' ' + plural(reviews.length, 'відгук','відгуки','відгуків') + '</div></div>';
      html += '</div>';
    }
    html += '</div>';

    // Кнопка написати відгук
    html += '<button class="rw-write-btn" id="rw-open-form">✏ Написати відгук</button>';

    // Форма (прихована по дефолту — показуємо JS-ом)
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
    bindFormEvents(db, productId, container, reviews);
  }

  function buildReviewHTML(r) {
    var html = '<div class="rw-item">';
    html += '<div class="rw-item-header">';
    html += '<div class="rw-item-left">';
    html += '<div class="rw-author">' + escHtml(r.name || 'Анонім') + '</div>';
    html += '<div class="rw-date">' + formatDate(r.createdAt) + '</div>';
    html += '</div>';
    html += '<div class="rw-item-stars">' + starsHTML(r.rating || 0, 13) + '</div>';
    html += '</div>';

    if (r.text) {
      html += '<div class="rw-text">' + escHtml(r.text) + '</div>';
    }

    if (r.photos && r.photos.length) {
      html += '<div class="rw-photos">';
      r.photos.forEach(function(url) {
        html += '<img class="rw-photo" src="' + url + '" loading="lazy" onclick="rwLightbox(this.src)">';
      });
      html += '</div>';
    }

    if (r.reply) {
      html += '<div class="rw-reply"><div class="rw-reply-label">Відповідь магазину</div>';
      html += '<div class="rw-reply-text">' + escHtml(r.reply) + '</div></div>';
    }

    html += '</div>';
    return html;
  }

  function buildFormHTML() {
    return '<div class="rw-form-wrap" id="rw-form-wrap" style="display:none;">' +
      '<div class="rw-form-title">Поділіться своєю думкою</div>' +
      '<div class="rw-form-group">' +
        '<label class="rw-form-label">Загальна оцінка *</label>' +
        '<div class="rw-star-picker" id="rw-star-picker">' +
          [1,2,3,4,5].map(function(i) {
            return '<svg viewBox="0 0 24 24" data-v="'+i+'"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>';
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
  // ОБРОБКА ФОРМИ
  // ============================================================
  function bindFormEvents(db, productId, container, reviews) {
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

    // Зірочки у формі
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

    // Завантаження фото
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
            wrap.innerHTML = '<img src="'+e.target.result+'"><button class="rw-preview-del" data-idx="'+idx+'">×</button>';
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
        // Перенумеровуємо
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
          return db.collection('reviews').add({
            productId: productId,
            name: name,
            email: email,
            text: text,
            rating: selectedRating,
            photos: photoUrls,
            status: 'pending', // потребує модерації
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }).then(function() {
          showMsg(msgEl, 'ok', 'Дякуємо! Відгук відправлено на модерацію і скоро з\'явиться на сторінці.');
          submitBtn.textContent = 'Надіслано ✓';
          // Скидаємо форму
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
  // LIGHTBOX
  // ============================================================
  window.rwLightbox = function(src) {
    var lb = document.createElement('div');
    lb.className = 'rw-lightbox';
    lb.innerHTML = '<span class="rw-lightbox-close">×</span><img src="'+src+'">';
    lb.addEventListener('click', function() { lb.remove(); });
    document.body.appendChild(lb);
  };

  // ============================================================
  // УТИЛІТИ
  // ============================================================
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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

// Патч: перемістити rw-header і rw-widget на правильні позиції
(function() {
  function moveHeader() {
    var header = document.querySelector('.rw-inline[id^="rw-header"]');
    if (!header || header.dataset.movedH) return;

    // Знаходимо правильне місце — перед назвою товару
    var titleEl = document.querySelector('.t-store__prod-popup__name, .js-store-prod-name');
    if (!titleEl) return;

    header.dataset.movedH = '1';
    // Вставляємо прямо перед назвою товару
    titleEl.parentNode.insertBefore(header, titleEl);
  }

  function moveWidget() {
    var widget = document.querySelector('.rw-widget');
    if (!widget || widget.dataset.moved) return;

    // Знаходимо головний контейнер магазину
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
    // Вставляємо після головного контейнера магазину
    storeContainer.parentNode.insertBefore(widget, storeContainer.nextSibling);
  }

  setTimeout(function() { moveHeader(); moveWidget(); }, 600);
  setTimeout(function() { moveHeader(); moveWidget(); }, 1500);
  setTimeout(function() { moveHeader(); moveWidget(); }, 3000);
})();
