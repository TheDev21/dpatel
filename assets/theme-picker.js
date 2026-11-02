(function () {
  var THEMES = [
    { id: 'peach', label: 'Regular', bg: '#fbeae4', accent: '#ff5a1f' },
    { id: 'mono', label: 'Black & White', bg: '#f0f0ef', accent: '#1a1a1a' },
    { id: 'retro', label: 'Retro', bg: '#f1e4c3', accent: '#d9731f' }
  ];
  var STORAGE_KEY = 'wlg-theme';

  function getSaved() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function save(id) {
    try { localStorage.setItem(STORAGE_KEY, id); } catch (e) {}
  }
  function applyTheme(id) {
    if (id === 'peach') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', id);
    }
  }

  function buildWidget() {
    var current = getSaved() || 'peach';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-picker-btn';
    btn.setAttribute('aria-label', 'change theme');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="7.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="16.2" cy="10.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="14.6" cy="15.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="9.4" cy="15.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="7.8" cy="10.5" r="1.3" fill="currentColor" stroke="none"/></svg>';

    var panel = document.createElement('div');
    panel.className = 'theme-picker-panel';
    var title = document.createElement('div');
    title.className = 'theme-picker-title';
    title.textContent = 'pick a theme';
    panel.appendChild(title);

    var row = document.createElement('div');
    row.className = 'theme-swatch-row';

    THEMES.forEach(function (t) {
      var sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'theme-swatch' + (t.id === current ? ' active' : '');
      sw.style.background = 'linear-gradient(135deg, ' + t.bg + ' 50%, ' + t.accent + ' 50%)';
      sw.setAttribute('aria-label', t.label);
      sw.title = t.label;
      sw.dataset.themeId = t.id;
      sw.addEventListener('click', function () {
        applyTheme(t.id);
        save(t.id);
        row.querySelectorAll('.theme-swatch').forEach(function (el) { el.classList.remove('active'); });
        sw.classList.add('active');
      });
      row.appendChild(sw);
    });

    panel.appendChild(row);

    btn.addEventListener('click', function () {
      panel.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        panel.classList.remove('open');
      }
    });

    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();
