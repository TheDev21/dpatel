(function () {
  var THEMES = [
    { id: 'peach', label: 'Regular', bg: '#fbeae4', card: '#fffaf7', accent: '#ff5a1f' },
    { id: 'mono', label: 'Black & White', bg: '#efefed', card: '#fcfcfb', accent: '#161616' },
    { id: 'retro', label: 'Retro (pixel)', bg: '#100e1a', card: '#1c1930', accent: '#5ef2a0' }
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
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="7.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="16.2" cy="10.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="14.6" cy="15.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="9.4" cy="15.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="7.8" cy="10.5" r="1.3" fill="currentColor" stroke="none"/></svg><span>Theme</span>';

    var panel = document.createElement('div');
    panel.className = 'theme-picker-panel';
    var title = document.createElement('div');
    title.className = 'theme-picker-title';
    title.textContent = 'pick a theme';
    panel.appendChild(title);

    var list = document.createElement('div');
    list.className = 'theme-option-list';

    THEMES.forEach(function (t) {
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'theme-option' + (t.id === current ? ' active' : '');
      opt.dataset.themeId = t.id;

      var preview = document.createElement('div');
      preview.className = 'theme-preview';
      preview.style.background = t.bg;

      var titleBar = document.createElement('div');
      titleBar.className = 'tp-title';
      titleBar.style.background = t.accent;
      preview.appendChild(titleBar);

      var cardsRow = document.createElement('div');
      cardsRow.className = 'tp-cards';
      for (var i = 0; i < 4; i++) {
        var card = document.createElement('div');
        card.className = 'tp-card';
        card.style.background = t.card;
        card.style.setProperty('--tp-accent', t.accent);
        cardsRow.appendChild(card);
      }
      preview.appendChild(cardsRow);

      var name = document.createElement('span');
      name.className = 'theme-name';
      name.textContent = t.label;

      opt.appendChild(preview);
      opt.appendChild(name);

      opt.addEventListener('click', function () {
        applyTheme(t.id);
        save(t.id);
        list.querySelectorAll('.theme-option').forEach(function (el) { el.classList.remove('active'); });
        opt.classList.add('active');
      });

      list.appendChild(opt);
    });

    panel.appendChild(list);

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
