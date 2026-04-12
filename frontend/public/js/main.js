// Auto-hide flash messages after 4 seconds
document.querySelectorAll('.flash').forEach(el => {
  setTimeout(() => {
    el.style.transition = 'opacity 0.5s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 500);
  }, 4000);
});

// Confirm before dangerous actions
document.querySelectorAll('[data-confirm]').forEach(el => {
  el.addEventListener('click', e => {
    if (!confirm(el.dataset.confirm)) e.preventDefault();
  });
});

// Uppercase discount code input as you type
document.querySelectorAll('input[name="code"]').forEach(input => {
  input.addEventListener('input', () => { input.value = input.value.toUpperCase(); });
});
