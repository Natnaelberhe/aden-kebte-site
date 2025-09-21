(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const toastEl = $('#toast');
  const form = $('#contactForm');
  const interestSelect = $('#interest');

  // Year in footer
  (function year() {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  })();

  // Mobile nav toggle with focus management
  (function nav() {
    const toggle = $('.nav-toggle');
    const nav = $('#site-nav');
    if (!toggle || !nav) return;

    const firstLink = () => nav.querySelector('a,button');

    function openNav() {
      nav.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      const link = firstLink();
      if (link) link.focus();
    }
    function closeNav() {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('open');
      if (isOpen) closeNav(); else openNav();
    });

    // Close when clicking a link
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeNav();
    });
  })();

  // Show toast helper
  function showToast(msg, { success = false } = {}) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('visible');
    toastEl.classList.toggle('success', !!success);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      toastEl.classList.remove('visible');
      toastEl.classList.remove('success');
    }, 4200);
  }
  // Expose for Apollo callback usage in snippet and tests
  window.showToast = showToast;

  // Prefill hidden attribution + URL params
  (function attribution() {
    const params = new URLSearchParams(window.location.search || '');
    const setVal = (id, val) => { const el = $('#' + id); if (el) el.value = val || ''; };

    setVal('url', window.location.href);
    setVal('lead_source', 'Website');
    setVal('utm_source', params.get('utm_source'));
    setVal('utm_medium', params.get('utm_medium'));
    setVal('utm_campaign', params.get('utm_campaign'));
  })();

  // CTA buttons: prefill "interest" and scroll to target (works for <a> or <button>)
  (function ctas() {
    const scrollTo = (sel) => {
      if (!sel) return;
      const el = document.querySelector(sel);
      if (el) el.scrollIntoView({ block: 'start' }); // immediate; CSS controls smoothness
    };

    $$('.js-cta').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute('data-interest');
        if (value && interestSelect) interestSelect.value = value;

        const targetSel = btn.getAttribute('data-target') || btn.getAttribute('href') || '#contact';
        if (targetSel.startsWith('#')) scrollTo(targetSel);

        // Focus the first field shortly after scroll
        setTimeout(() => {
          const focusable = $('#name');
          if (focusable) focusable.focus({ preventScroll: true });
        }, 0);
      });
    });
  })();

  // Form submit handler with Apollo integration + honeypot + graceful fallback
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const hp = $('#hp_field');
      if (hp && hp.value.trim() !== '') {
        // Bot likely – pretend success to avoid clueing them in.
        showToast("Thanks! We’ll reach out shortly.");
        form.reset();
        return;
      }

      // Basic client-side checks for required fields
      const requiredOk = ['name', 'email', 'interest'].every(id => {
        const el = $('#' + id);
        if (!el) return false;
        const valid = el.value && (id !== 'email' || /\S+@\S+\.\S+/.test(el.value));
        el.setAttribute('aria-invalid', valid ? 'false' : 'true');
        return valid;
      });
      if (!requiredOk) {
        showToast("Please complete the required fields.");
        return;
      }

      try {
        if (window.ApolloMeetings && typeof window.ApolloMeetings.submit === 'function') {
          window.ApolloMeetings.submit({
            formId: 'contactForm',
            onSuccess: () => {
              showToast("Scheduled! We’ll follow up shortly.", { success: true });
              form.reset();
            },
            onError: () => {
              showToast("Thanks! We’ll reach out shortly.");
              form.reset();
            }
          });
        } else {
          // Graceful fallback – no errors thrown if Apollo is not present
          showToast("Thanks! We’ll reach out shortly.");
          form.reset();
        }
      } catch (_err) {
        showToast("Thanks! We’ll reach out shortly.");
        form.reset();
      }
    });
  }

  // Export small helper for tests
  window.__aden = { prefillInterest: (v) => { if (interestSelect) interestSelect.value = v; } };
})();
