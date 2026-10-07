/* ==========================================================================
   SHAZAY — main.js
   Lightweight, dependency-free interactions:
   header state, mobile nav, scroll reveals, subtle parallax, newsletter form
   ========================================================================== */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- boot ---- */
  window.addEventListener('load', function () {
    document.body.classList.add('is-ready');
  });
  // fallback in case load event already fired / is slow
  setTimeout(function () { document.body.classList.add('is-ready'); }, 1800);

  /* ---- header: scrolled state ---- */
  var header = document.getElementById('siteHeader');
  var lastY = window.scrollY;

  function updateHeader() {
    if (!header) return;
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40 || document.body.classList.contains('page-legal'));
    lastY = y;
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  /* ---- mobile nav toggle ---- */
  var burger = document.getElementById('burgerBtn');
  var nav = document.getElementById('siteNav');

  if (burger && nav && header) {
    function closeMenu() {
      header.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    // make sure the menu always starts closed
    closeMenu();

    burger.addEventListener('click', function () {
      var open = header.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Escape closes the menu
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    // widening past the mobile breakpoint must never leave the panel open
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeMenu();
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });
  }

  /* ---- scroll reveal ---- */
  var revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reducedMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- subtle parallax on hero + divider bands ---- */
  var parallaxEls = document.querySelectorAll('[data-parallax] img, [data-parallax]');
  if (!reducedMotion && parallaxEls.length) {
    var targets = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var vh = window.innerHeight;
        targets.forEach(function (wrap) {
          var img = wrap.tagName === 'IMG' ? wrap : wrap.querySelector('img');
          if (!img) return;
          var rect = wrap.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > vh) return;
          var progress = (rect.top) / vh; // -1..1 roughly
          var shift = Math.max(-24, Math.min(24, progress * 22));
          img.style.transform = 'translateY(' + shift.toFixed(1) + 'px) scale(1.06)';
        });
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- smooth-scroll offset correction for fixed header ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = 84;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---- product galleries (arrows, dots, swipe) ---- */
  document.querySelectorAll('[data-gallery]').forEach(function (gal) {
    var slides = gal.querySelectorAll('.gallery__track img');
    var prev = gal.querySelector('.gallery__nav--prev');
    var next = gal.querySelector('.gallery__nav--next');
    var dotWrap = gal.querySelector('.gallery__dots');

    // a single photo needs no controls
    if (slides.length < 2) {
      if (prev) prev.style.display = 'none';
      if (next) next.style.display = 'none';
      if (dotWrap) dotWrap.style.display = 'none';
      return;
    }

    var index = 0;
    var dots = [];

    if (dotWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'gallery__dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Фото ' + (i + 1));
        dot.addEventListener('click', function () { show(i); });
        dotWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (img, n) {
        img.classList.toggle('is-active', n === index);
      });
      dots.forEach(function (dot, n) {
        dot.classList.toggle('is-active', n === index);
      });
    }

    if (prev) prev.addEventListener('click', function () { show(index - 1); });
    if (next) next.addEventListener('click', function () { show(index + 1); });

    // keyboard support once a control inside the gallery has focus
    gal.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(index - 1); }
      else if (e.key === 'ArrowRight') { show(index + 1); }
    });

    // horizontal swipe on touch screens
    var startX = 0, startY = 0, tracking = false;
    gal.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    gal.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var touch = e.changedTouches[0];
      var dx = touch.clientX - startX;
      var dy = touch.clientY - startY;
      // ignore mostly-vertical moves so page scrolling still works
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        show(dx < 0 ? index + 1 : index - 1);
      }
    }, { passive: true });
  });

  /* ---- newsletter form (static demo — no backend) ---- */
  var form = document.getElementById('subscribeForm');
  var note = document.getElementById('subscribeNote');

  if (form && note) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      if (input && input.value) {
        note.textContent = 'Дякуємо! Перевір свою поштову скриньку, щоб підтвердити підписку.';
        form.reset();
      }
    });
  }

  /* ---- payment requisites: open from footer link + copy buttons ---- */
  var req = document.getElementById('rekvizyty');
  if (req) {
    function openReq() { req.open = true; }
    if (location.hash === '#rekvizyty') openReq();
    window.addEventListener('hashchange', function () {
      if (location.hash === '#rekvizyty') openReq();
    });
    document.querySelectorAll('[data-open-requisites]').forEach(function (a) {
      a.addEventListener('click', openReq);
    });

    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }

    req.querySelectorAll('.requisites__copy').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.parentNode.querySelector('span').textContent.trim();
        var done = function () {
          btn.textContent = 'Скопійовано';
          btn.classList.add('is-copied');
          setTimeout(function () {
            btn.textContent = 'Копіювати';
            btn.classList.remove('is-copied');
          }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
        } else { fallbackCopy(text); done(); }
      });
    });
  }

  /* ---- buy modal: choose volume -> LiqPay link (or order by email/Instagram) ---- */
  var buyButtons = document.querySelectorAll('[data-buy]');
  if (buyButtons.length) {
    var LINKS = window.SHAZAY_PAY_LINKS || {};
    var CONTACT = window.SHAZAY_ORDER_CONTACT || { email: 'shazayukraine@gmail.com', instagram: 'https://www.instagram.com/shazay.ua' };

    var modal = document.createElement('div');
    modal.className = 'buy-modal';
    modal.setAttribute('hidden', '');
    modal.innerHTML =
      '<div class="buy-modal__backdrop" data-close></div>' +
      '<div class="buy-modal__panel" role="dialog" aria-modal="true" aria-labelledby="buyTitle">' +
        '<button type="button" class="buy-modal__close" data-close aria-label="Закрити">×</button>' +
        '<span class="eyebrow buy-modal__kind"></span>' +
        '<h3 id="buyTitle" class="buy-modal__title"></h3>' +
        '<fieldset class="buy-modal__options"><legend class="visually-hidden">Оберіть об’єм</legend></fieldset>' +
        '<p class="buy-modal__salon" hidden></p>' +
        '<button type="button" class="btn buy-modal__pay"></button>' +
        '<div class="buy-modal__order" hidden>' +
          '<p>Онлайн-оплата карткою незабаром з’явиться на сайті. Щоб оформити замовлення вже зараз, напишіть нам — ми підтвердимо наявність і надішлемо реквізити для оплати.</p>' +
          '<div class="buy-modal__order-links">' +
            '<a class="btn buy-modal__mail" href="#">Замовити поштою</a>' +
            '<a class="buy-modal__ig" href="#" target="_blank" rel="noopener">Написати в Instagram</a>' +
          '</div>' +
        '</div>' +
        '<p class="buy-modal__terms">Оплачуючи замовлення, ви погоджуєтеся з умовами <a href="oplata-i-dostavka.html">оплати і доставки</a> та <a href="povernennia-ta-obmin.html">повернення та обміну</a>. Оплата карткою Visa / Mastercard, Apple Pay або Google Pay через захищену сторінку LiqPay.</p>' +
        '<img class="liqpay-logo" src="liqpay-logo-dark.png" alt="LiqPay" width="106" height="22">' +
      '</div>';
    document.body.appendChild(modal);

    var mKind = modal.querySelector('.buy-modal__kind');
    var mTitle = modal.querySelector('.buy-modal__title');
    var mOpts = modal.querySelector('.buy-modal__options');
    var mSalon = modal.querySelector('.buy-modal__salon');
    var mPay = modal.querySelector('.buy-modal__pay');
    var mOrder = modal.querySelector('.buy-modal__order');
    var mMail = modal.querySelector('.buy-modal__mail');
    var mIg = modal.querySelector('.buy-modal__ig');
    var current = null, lastFocus = null;

    function selected() {
      var r = mOpts.querySelector('input:checked');
      return r ? current.variants[+r.value] : null;
    }
    function refresh() {
      var v = selected();
      mOrder.hidden = true;
      mPay.hidden = false;
      mPay.textContent = v ? 'Оплатити ' + v.price : 'Оплатити';
    }
    function openModal(card, trigger) {
      var slug = card.getAttribute('data-product');
      var name = (card.querySelector('h3') || {}).textContent || '';
      var kind = (card.querySelector('.product-card__vol') || {}).textContent || '';
      var variants = [], salon = [];
      card.querySelectorAll('.price-table tbody tr').forEach(function (tr) {
        var vol = (tr.querySelector('.vol') || {}).textContent;
        var cell = tr.querySelector('.retail');
        if (!vol || !cell) return;
        vol = vol.trim();
        if (cell.classList.contains('salon')) { salon.push(vol); return; }
        variants.push({ vol: vol, price: cell.textContent.trim(), link: (LINKS[slug] || {})[vol] || '' });
      });
      current = { slug: slug, name: name.trim(), variants: variants };
      mKind.textContent = kind.trim();
      mTitle.textContent = current.name;
      mOpts.querySelectorAll('label').forEach(function (l) { l.remove(); });
      variants.forEach(function (v, i) {
        var l = document.createElement('label');
        l.className = 'buy-modal__opt';
        l.innerHTML = '<input type="radio" name="buyVol" value="' + i + '"' + (i === 0 ? ' checked' : '') + '>' +
          '<span class="buy-modal__vol"></span><span class="buy-modal__price"></span>';
        l.querySelector('.buy-modal__vol').textContent = v.vol;
        l.querySelector('.buy-modal__price').textContent = v.price;
        mOpts.appendChild(l);
      });
      if (salon.length) {
        mSalon.hidden = false;
        mSalon.innerHTML = 'Об’єм ' + salon.join(', ') + ' — для салонів. Замовлення через менеджера: <a href="mailto:' + CONTACT.email + '">' + CONTACT.email + '</a>';
      } else { mSalon.hidden = true; }
      refresh();
      lastFocus = trigger;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { modal.classList.add('is-open'); });
      var first = mOpts.querySelector('input'); if (first) first.focus();
    }
    function closeModal() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(function () { modal.hidden = true; }, 250);
      if (lastFocus) lastFocus.focus();
    }

    mOpts.addEventListener('change', refresh);
    modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

    mPay.addEventListener('click', function () {
      var v = selected(); if (!v) return;
      if (v.link) { window.location.href = v.link; return; }
      var subject = 'Замовлення: ' + current.name + ', ' + v.vol;
      var body = 'Вітаю! Хочу замовити:\n' + current.name + ' — ' + v.vol + ' — ' + v.price +
        '\n\nПІБ отримувача:\nТелефон:\nМісто та відділення «Нової пошти»:\n';
      mMail.href = 'mailto:' + CONTACT.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      mIg.href = CONTACT.instagram;
      mPay.hidden = true;
      mOrder.hidden = false;
    });

    buyButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        var card = b.closest('[data-product]');
        if (card) openModal(card, b);
      });
    });
  }
})();
