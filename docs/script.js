(() => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  const copyButton = document.getElementById('copyCloneCommand');
  const cloneCommand = document.getElementById('cloneCommand');
  const toast = document.getElementById('toast');
  const themeKey = 'pemintos-site-theme';
  const themeModes = ['system', 'light', 'dark'];
  let toastTimer = 0;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2400);
  }

  function applyTheme(mode, persist = true) {
    const next = themeModes.includes(mode) ? mode : 'system';
    root.dataset.theme = next;
    if (themeLabel) themeLabel.textContent = next[0].toUpperCase() + next.slice(1);
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', `Color theme: ${next}. Click to change.`);
      themeToggle.title = `Theme: ${next[0].toUpperCase() + next.slice(1)}. Click to change.`;
    }
    if (persist) {
      try { localStorage.setItem(themeKey, next); } catch (error) {
        console.warn('Pemintos website could not store the theme preference.', error);
      }
    }
  }

  let storedTheme = 'system';
  try { storedTheme = localStorage.getItem(themeKey) || 'system'; } catch (error) {
    console.warn('Pemintos website could not read the theme preference.', error);
  }
  applyTheme(storedTheme, false);

  themeToggle?.addEventListener('click', () => {
    const current = themeModes.includes(root.dataset.theme) ? root.dataset.theme : 'system';
    applyTheme(themeModes[(themeModes.indexOf(current) + 1) % themeModes.length]);
  });

  copyButton?.addEventListener('click', async () => {
    const command = cloneCommand?.textContent?.trim() || 'git clone <repository-url>';
    try {
      await navigator.clipboard.writeText(command);
      copyButton.textContent = 'Copied';
      showToast('Clone command copied.');
    } catch (error) {
      // Clipboard access can be unavailable on file:// pages or restricted origins.
      const range = document.createRange();
      if (cloneCommand) {
        range.selectNodeContents(cloneCommand);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      copyButton.textContent = 'Select to copy';
      showToast('Select the command and copy it.');
    }
    window.setTimeout(() => { copyButton.textContent = 'Copy'; }, 2200);
  });

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('visible'));
  }
})();
