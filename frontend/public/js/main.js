/* ── Flash Messages ─────────────────────────────────── */
document.querySelectorAll('.flash').forEach(el => {
  setTimeout(() => {
    el.style.transition = 'opacity 0.5s, transform 0.5s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => el.remove(), 500);
  }, 4500);
});

/* ── Confirm dialogs ─────────────────────────────────── */
document.querySelectorAll('[data-confirm]').forEach(el => {
  el.addEventListener('click', e => {
    if (!confirm(el.dataset.confirm)) e.preventDefault();
  });
});

/* ── Uppercase discount code input ─────────────────────────────────── */
document.querySelectorAll('input[name="code"]').forEach(input => {
  input.addEventListener('input', () => { input.value = input.value.toUpperCase(); });
});

/* ── Navbar: add scrolled class for glassmorphism effect ─────────────────────────────────── */
(function () {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  const update = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
})();

/* ── Mobile hamburger menu ─────────────────────────────────── */
(function () {
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on link click
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
})();

/* ── Quantity Stepper (+/- buttons) ─────────────────────────────────── */
(function () {
  document.querySelectorAll('.qty-stepper').forEach(stepper => {
    const input = stepper.querySelector('input[type="number"]');
    const minusBtn = stepper.querySelector('.qty-btn[data-action="minus"]');
    const plusBtn  = stepper.querySelector('.qty-btn[data-action="plus"]');
    if (!input) return;

    const update = () => {
      const val = parseInt(input.value) || 0;
      const min = parseInt(input.min) || 0;
      const max = parseInt(input.max) || Infinity;
      if (minusBtn) minusBtn.disabled = val <= min;
      if (plusBtn)  plusBtn.disabled  = val >= max;
    };

    if (minusBtn) {
      minusBtn.addEventListener('click', () => {
        const val = parseInt(input.value) || 0;
        const min = parseInt(input.min) || 0;
        if (val > min) { input.value = val - 1; input.dispatchEvent(new Event('change')); }
        update();
      });
    }
    if (plusBtn) {
      plusBtn.addEventListener('click', () => {
        const val = parseInt(input.value) || 0;
        const max = parseInt(input.max) || Infinity;
        if (val < max) { input.value = val + 1; input.dispatchEvent(new Event('change')); }
        update();
      });
    }
    input.addEventListener('input', update);
    update();
  });
})();

/* ── Cart qty: auto-submit on change (optional, after debounce) ─────────────────────────────────── */
(function () {
  document.querySelectorAll('.cart-qty-form').forEach(form => {
    const input = form.querySelector('input[type="number"]');
    if (!input) return;
    let timer;
    input.addEventListener('change', () => {
      clearTimeout(timer);
      timer = setTimeout(() => form.submit(), 500);
    });
  });
})();

/* ── Button loading state on form submit ─────────────────────────────────── */
(function () {
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => {
      const btn = form.querySelector('button[type="submit"]:not([data-no-load])');
      if (btn && !btn.disabled) {
        const original = btn.innerHTML;
        btn.disabled = true;
        btn.dataset.original = original;
        btn.innerHTML = '<span style="opacity:0.7">Processing…</span>';
        setTimeout(() => {
          if (btn.dataset.original) {
            btn.innerHTML = btn.dataset.original;
            btn.disabled = false;
          }
        }, 8000);
      }
    });
  });
})();

/* ── Sale price field toggle in admin product form ─────────────────────────────────── */
(function () {
  const onSaleCheckbox = document.querySelector('input[name="on_sale"]');
  const salePriceGroup = document.querySelector('.sale-price-group');
  if (!onSaleCheckbox || !salePriceGroup) return;

  const toggle = () => {
    salePriceGroup.style.display = onSaleCheckbox.checked ? '' : 'none';
  };
  toggle();
  onSaleCheckbox.addEventListener('change', toggle);
})();

/* ── Image preview on file input ─────────────────────────────────── */
(function () {
  document.querySelectorAll('input[type="file"][accept*="image"]').forEach(input => {
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        let preview = input.parentElement.querySelector('.img-preview');
        if (!preview) {
          preview = document.createElement('img');
          preview.className = 'img-preview current-image';
          preview.style.marginTop = '0.5rem';
          input.parentElement.insertBefore(preview, input);
        }
        preview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  });
})();
