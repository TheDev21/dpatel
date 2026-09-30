/* Weird Little Games - like/dislike widget for the homepage grid.
   Overlays a small vote pill on the top-left and top-right corner of
   each game card thumbnail. Reads its slug from the card's own href,
   so no per-card markup changes are needed. */
(function () {
  'use strict';

  // Point this at your deployed API once it's live.
  var API_BASE = 'https://api.weirdlittlegames.lol';

  var VOTER_KEY = 'wlg-voter-id';

  function getVoterId() {
    try {
      var id = localStorage.getItem(VOTER_KEY);
      if (id) return id;
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : fallbackUuid();
      localStorage.setItem(VOTER_KEY, id);
      return id;
    } catch (e) {
      return fallbackUuid();
    }
  }
  function fallbackUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function slugFromHref(href) {
    var m = href.match(/games\/([^\/]+)\/?/);
    return m ? m[1] : null;
  }

  var THUMB_ICON = '<svg viewBox="0 0 20 20" width="12" height="12"><path d="M7 9 L7 18 L3 18 L3 9 Z M7 9 L9 2 Q10 1 11 2 L11 6 L16 6 Q18 6 17 8 L15 15 Q14 18 11 18 L7 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  function injectStyles() {
    if (document.getElementById('wlg-vote-styles')) return;
    var style = document.createElement('style');
    style.id = 'wlg-vote-styles';
    style.textContent =
      '.wlg-vote-btn{position:absolute;top:9px;z-index:5;display:flex;align-items:center;gap:4px;' +
      'padding:4px 8px;border-radius:20px;border:1.5px solid rgba(35,32,29,0.25);' +
      'background:rgba(255,255,255,0.88);backdrop-filter:blur(2px);' +
      'font-family:"DM Mono",monospace;font-size:11px;color:#23201d;cursor:pointer;' +
      'transition:transform 0.12s ease,background 0.12s ease,border-color 0.12s ease;line-height:1;}' +
      '.wlg-vote-btn:hover{transform:translateY(-1px);background:#fff;}' +
      '.wlg-vote-btn.wlg-like{left:9px;}' +
      '.wlg-vote-btn.wlg-dislike{right:9px;}' +
      '.wlg-vote-btn.wlg-dislike svg{transform:rotate(180deg);}' +
      '.wlg-vote-btn.wlg-active.wlg-like{background:#3a8a4a;border-color:#3a8a4a;color:#fff;}' +
      '.wlg-vote-btn.wlg-active.wlg-dislike{background:#ff2d55;border-color:#ff2d55;color:#fff;}' +
      '.wlg-vote-count{min-width:11px;text-align:left;}';
    document.head.appendChild(style);
  }

  function render(card, slug) {
    var thumb = card.querySelector('.thumb');
    if (!thumb) return;
    thumb.style.position = thumb.style.position || 'relative';

    var likeBtn = document.createElement('button');
    likeBtn.type = 'button';
    likeBtn.className = 'wlg-vote-btn wlg-like';
    likeBtn.innerHTML = THUMB_ICON + '<span class="wlg-vote-count">&ndash;</span>';

    var dislikeBtn = document.createElement('button');
    dislikeBtn.type = 'button';
    dislikeBtn.className = 'wlg-vote-btn wlg-dislike';
    dislikeBtn.innerHTML = THUMB_ICON + '<span class="wlg-vote-count">&ndash;</span>';

    thumb.appendChild(likeBtn);
    thumb.appendChild(dislikeBtn);

    var voterId = getVoterId();
    var state = { likes: null, dislikes: null, userVote: null };

    function paint() {
      likeBtn.querySelector('.wlg-vote-count').textContent = state.likes === null ? '–' : state.likes;
      dislikeBtn.querySelector('.wlg-vote-count').textContent = state.dislikes === null ? '–' : state.dislikes;
      likeBtn.classList.toggle('wlg-active', state.userVote === 'like');
      dislikeBtn.classList.toggle('wlg-active', state.userVote === 'dislike');
    }

    function loadTotals() {
      fetch(API_BASE + '/api/games/' + slug + '/votes?voterId=' + encodeURIComponent(voterId))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data) return;
          state.likes = data.likes;
          state.dislikes = data.dislikes;
          state.userVote = data.userVote || null;
          paint();
        })
        .catch(function () { /* API not reachable yet -- stay blank, no crash */ });
    }

    function castVote(vote) {
      fetch(API_BASE + '/api/games/' + slug + '/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: vote, voterId: voterId })
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data) return;
          state.likes = data.likes;
          state.dislikes = data.dislikes;
          state.userVote = data.userVote || null;
          paint();
        })
        .catch(function () {});
    }

    function onClick(e, vote) {
      e.preventDefault();
      e.stopPropagation();
      castVote(vote);
    }

    likeBtn.addEventListener('click', function (e) { onClick(e, 'like'); });
    dislikeBtn.addEventListener('click', function (e) { onClick(e, 'dislike'); });

    loadTotals();
  }

  function init() {
    injectStyles();
    var cards = document.querySelectorAll('.grid .card[href]');
    cards.forEach(function (card) {
      var href = card.getAttribute('href') || '';
      var slug = slugFromHref(href);
      if (slug) render(card, slug);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
