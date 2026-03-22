// ============================================================
// ВІДЖЕТ ВІДГУКІВ ДЛЯ ГОЛОВНОЇ СТОРІНКИ
// Показує всі відгуки з усіх товарів у вигляді списку
// Вставити в T123 блок на головній сторінці Tilda
// ============================================================

// ============================================================
// НАЛАШТУВАННЯ
// ============================================================
var RW_HOME_CONFIG = {
  // Firebase налаштування (ті самі що у reviews-widget.js)
  firebase: {
    apiKey: "AIzaSyCS-7Vn4X_NDxbEGyTrb1JQewf1QCQNffA",
    authDomain: "shop-reviews-3aedd.firebaseapp.com",
    projectId: "shop-reviews-3aedd",
    storageBucket: "shop-reviews-3aedd.firebasestorage.app",
    messagingSenderId: "191060203071",
    appId: "1:191060203071:web:c3025da0b9e7d805948a8a"
  },

  // ID контейнера куди вставляти блок відгуків
  // Залиште як є або змініть якщо потрібно
  containerId: 'rw-home-reviews',

  // Розмір зірочок
  starSize: 15,

  // Розмір фото у відгуку (px)
  photoSize: 80,
};

(function() {
  'use strict';

  // Завантаження Firebase якщо ще не завантажений
  function loadScript(src, cb) {
    if (document.querySelector('script[src*="firebase-app-compat"]') && window.firebase) {
      return cb();
    }
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  // Генерація зірочок
  function starsHTML(rating, size) {
    size = size || 15;
    var html = '<span style="display:inline-flex;gap:2px;vertical-align:middle;">';
    for (var i = 1; i <= 5; i++) {
      var fill = i <= Math.round(rating) ? '#F5A623' : 'none';
      var stroke = '#F5A623';
      html += '<svg width="' + size + '" height="' + size + '" viewBox="0 0 16 16">' +
        '<path fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.2" ' +
        'd="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z"/></svg>';
    }
    return html + '</span>';
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatDate(ts) {
    if (!ts) return '';
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Вставляємо стилі
  function injectStyles() {
    if (document.getElementById('rw-home-styles')) return;
    var style = document.createElement('style');
    style.id = 'rw-home-styles';
    style.textContent = [
      '.rw-home { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; max-width:860px; margin:0 auto; padding:0 16px; box-sizing:border-box; }',
      '.rw-home * { box-sizing:border-box; }',

      // Один відгук
      '.rw-home-item { padding:20px 0; border-bottom:1px solid #f0f0f0; }',
      '.rw-home-item:last-child { border-bottom:none; }',

      // Шапка відгуку (ім'я, зірочки, дата)
      '.rw-home-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px; }',
      '.rw-home-left { display:flex; flex-direction:column; gap:4px; }',
      '.rw-home-author { font-weight:600; font-size:14px; color:#111; }',
      '.rw-home-date { font-size:12px; color:#aaa; }',

      // Назва товару з посиланням
      '.rw-home-product { font-size:12px; margin-top:4px; }',
      '.rw-home-product a { color:#555; text-decoration:none; border-bottom:1px dashed #aaa; }',
      '.rw-home-product a:hover { color:#111; border-bottom-color:#111; }',

      // Текст відгуку
      '.rw-home-text { font-size:14px; line-height:1.6; color:#333; margin:8px 0; }',

      // Фото
      '.rw-home-photos { display:flex; flex-wrap:wrap; gap:8px; margin:10px 0; }',
      '.rw-home-photo { width:' + RW_HOME_CONFIG.photoSize + 'px; height:' + RW_HOME_CONFIG.photoSize + 'px; border-radius:8px; object-fit:cover; cursor:pointer; border:1px solid #eee; transition:transform .15s; }',
      '.rw-home-photo:hover { transform:scale(1.03); }',

      // Відповідь магазину
      '.rw-home-reply { background:#f8f8f8; border-left:3px solid #111; border-radius:0 8px 8px 0; padding:10px 14px; margin-top:10px; }',
      '.rw-home-reply-label { font-size:11px; font-weight:700; color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }',
      '.rw-home-reply-text { font-size:13px; color:#333; line-height:1.5; }',

      // Порожній стан і лоадер
      '.rw-home-empty { text-align:center; padding:32px; color:#aaa; font-size:14px; }',
      '.rw-home-loading { text-align:center; padding:24px; color:#aaa; font-size:14px; }',

      // Мобільні
      '@media(max-width:600px) {',
      '  .rw-home { padding:0 12px; }',
      '  .rw-home-photo { width:60px; height:60px; }',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // Відкриття фото в lightbox
  function openPhoto(idx, photos) {
    var current = idx;

    function render() {
      var lb = document.getElementById('rw-home-lb');
      if (!lb) return;
      var img = lb.querySelector('img');
      var counter = lb.querySelector('.rw-lb-counter');
      img.style.opacity = '0';
      setTimeout(function() {
        img.src = photos[current];
        img.style.opacity = '1';
        if (counter) counter.textContent = (current + 1) + ' / ' + photos.length;
      }, 150);
    }

    if (document.getElementById('rw-home-lb')) {
      render(); return;
    }

    var hasMultiple = photos.length > 1;
    var lb = document.createElement('div');
    lb.id = 'rw-home-lb';
    lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:99999;display:flex;align-items:center;justify-content:center;';
    lb.innerHTML =
      '<span style="position:absolute;top:16px;right:20px;color:#fff;font-size:32px;cursor:pointer;z-index:2;" onclick="document.getElementById(\'rw-home-lb\').remove()">×</span>' +
      (hasMultiple ? '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#fff;font-size:40px;cursor:pointer;padding:16px;background:rgba(0,0,0,.3);border-radius:4px;z-index:2;" id="rw-lb-prev">‹</span>' : '') +
      '<img src="' + photos[current] + '" style="max-width:85vw;max-height:85vh;border-radius:8px;object-fit:contain;transition:opacity .2s;">' +
      (hasMultiple ? '<span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#fff;font-size:40px;cursor:pointer;padding:16px;background:rgba(0,0,0,.3);border-radius:4px;z-index:2;" id="rw-lb-next">›</span>' : '') +
      (hasMultiple ? '<span class="rw-lb-counter" style="position:absolute;bottom:16px;left:50%;transform:translateX(-50%);color:#fff;font-size:14px;background:rgba(0,0,0,.5);padding:4px 12px;border-radius:20px;">' + (current+1) + ' / ' + photos.length + '</span>' : '');

    lb.addEventListener('click', function(e) { if (e.target === lb) lb.remove(); });

    if (hasMultiple) {
      lb.querySelector('#rw-lb-prev').addEventListener('click', function(e) {
        e.stopPropagation();
        current = (current - 1 + photos.length) % photos.length;
        render();
      });
      lb.querySelector('#rw-lb-next').addEventListener('click', function(e) {
        e.stopPropagation();
        current = (current + 1) % photos.length;
        render();
      });
    }

    function onKey(e) {
      if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', onKey); }
      if (e.key === 'ArrowRight' && hasMultiple) { current = (current+1)%photos.length; render(); }
      if (e.key === 'ArrowLeft' && hasMultiple) { current = (current-1+photos.length)%photos.length; render(); }
    }
    document.addEventListener('keydown', onKey);
    document.body.appendChild(lb);
  }

  // Рендер одного відгуку
  function buildItem(r) {
    var ps = RW_HOME_CONFIG.photoSize;
    var html = '<div class="rw-home-item">';
    html += '<div class="rw-home-header">';
    html += '<div class="rw-home-left">';
    html += '<div class="rw-home-author">' + escHtml(r.name || 'Анонім') + '</div>';
    html += '<div class="rw-home-date">' + formatDate(r.createdAt) + '</div>';

    // Назва товару з посиланням
    if (r.productName || r.productUrl) {
      var name = r.productName || 'Переглянути товар';
      var url = r.productUrl || '#';
      html += '<div class="rw-home-product">Товар: <a href="' + escHtml(url) + '">' + escHtml(name) + '</a></div>';
    }

    html += '</div>';
    html += '<div>' + starsHTML(r.rating || 0, RW_HOME_CONFIG.starSize) + '</div>';
    html += '</div>';

    if (r.text) {
      html += '<div class="rw-home-text">' + escHtml(r.text) + '</div>';
    }

    if (r.photos && r.photos.length) {
      var photosJson = JSON.stringify(r.photos);
      html += '<div class="rw-home-photos">';
      r.photos.forEach(function(url, idx) {
        html += '<img class="rw-home-photo" src="' + escHtml(url) + '" loading="lazy" ' +
          'style="width:' + ps + 'px;height:' + ps + 'px;" ' +
          'data-idx="' + idx + '" data-photos="' + escHtml(photosJson) + '">';
      });
      html += '</div>';
    }

    if (r.reply) {
      html += '<div class="rw-home-reply">';
      html += '<div class="rw-home-reply-label">Відповідь магазину</div>';
      html += '<div class="rw-home-reply-text">' + escHtml(r.reply) + '</div>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  // Головна функція — завантажуємо і показуємо відгуки
  function renderHomeReviews() {
    var container = document.getElementById(RW_HOME_CONFIG.containerId);
    if (!container) {
      // Якщо контейнера немає — створюємо і вставляємо після поточного скрипту
      container = document.createElement('div');
      container.id = RW_HOME_CONFIG.containerId;
      container.className = 'rw-home';
      var scripts = document.querySelectorAll('script[src*="reviews-home"]');
      var lastScript = scripts[scripts.length - 1];
      if (lastScript && lastScript.parentNode) {
        lastScript.parentNode.insertBefore(container, lastScript.nextSibling);
      } else {
        document.body.appendChild(container);
      }
    }

    container.innerHTML = '<div class="rw-home-loading">Завантаження відгуків...</div>';

    // Використовуємо вже ініціалізований Firebase з reviews-widget.js
    var firebase = window.firebase;
    var db = firebase.firestore();

    db.collection('reviews')
      .where('status', '==', 'approved')
      .orderBy('createdAt', 'desc')
      .get()
      .then(function(snap) {
        if (snap.empty) {
          container.innerHTML = '<div class="rw-home-empty">Ще немає відгуків</div>';
          return;
        }

        var html = '';
        snap.forEach(function(d) {
          html += buildItem(Object.assign({ id: d.id }, d.data()));
        });
        container.innerHTML = '<div class="rw-home">' + html + '</div>';

        // Обробник кліків на фото
        container.addEventListener('click', function(e) {
          var photo = e.target.closest('.rw-home-photo');
          if (!photo) return;
          var idx = +photo.dataset.idx;
          var photos = JSON.parse(photo.dataset.photos);
          openPhoto(idx, photos);
        });
      })
      .catch(function() {
        // Якщо немає індексу — завантажуємо без сортування
        db.collection('reviews')
          .where('status', '==', 'approved')
          .get()
          .then(function(snap) {
            var reviews = [];
            snap.forEach(function(d) { reviews.push(Object.assign({ id: d.id }, d.data())); });
            reviews.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });

            var html = '';
            reviews.forEach(function(r) { html += buildItem(r); });
            container.innerHTML = '<div class="rw-home">' + html + '</div>';

            container.addEventListener('click', function(e) {
              var photo = e.target.closest('.rw-home-photo');
              if (!photo) return;
              openPhoto(+photo.dataset.idx, JSON.parse(photo.dataset.photos));
            });
          });
      });
  }

  // Старт — чекаємо поки Firebase і Firestore будуть готові
  function start() {
    injectStyles();
    function waitForFirestore() {
      if (window.firebase && window.firebase.firestore) {
        renderHomeReviews();
      } else {
        setTimeout(waitForFirestore, 200);
      }
    }
    waitForFirestore();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
