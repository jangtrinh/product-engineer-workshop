(function () {
  'use strict';

  var stage = document.getElementById('player-stage');
  var viewport = document.getElementById('player-viewport');
  var slidesRoot = document.getElementById('player-slides');
  if (!stage || !viewport || !slidesRoot) {
    return;
  }

  var wraps = Array.prototype.slice.call(slidesRoot.querySelectorAll('.player-slide-wrap'));
  var total = wraps.length;
  if (!total) {
    return;
  }

  var prevBtn = document.querySelector('[data-action="prev"]');
  var nextBtn = document.querySelector('[data-action="next"]');
  var gridBtn = document.querySelector('[data-action="grid"]');
  var fullBtn = document.querySelector('[data-action="fullscreen"]');
  var counterEl = document.querySelector('.player-counter');

  var currentIndex = 1;

  function parseHash() {
    var raw = (window.location.hash || '').replace(/^#/, '').trim();
    if (!raw) {
      return 1;
    }
    var asNum = Number(raw);
    if (Number.isInteger(asNum) && asNum >= 1 && asNum <= total) {
      return asNum;
    }
    for (var i = 0; i < wraps.length; i += 1) {
      if (wraps[i].getAttribute('data-slide-id') === raw) {
        return i + 1;
      }
    }
    return 1;
  }

  function updateScale() {
    var view = document.body.getAttribute('data-view') || 'slide';
    if (view === 'grid') {
      var firstFrame = slidesRoot.querySelector('.player-slide-frame');
      if (firstFrame && firstFrame.clientWidth > 0) {
        slidesRoot.style.setProperty('--thumb-scale', String(firstFrame.clientWidth / 1920));
      }
      return;
    }
    var cs = window.getComputedStyle(stage);
    var padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    var padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    var availW = Math.max(160, stage.clientWidth - padX);
    var availH = Math.max(90, stage.clientHeight - padY);
    var scale = Math.min(availW / 1920, availH / 1080);
    viewport.style.setProperty('--slide-scale', String(scale));
  }

  function setSlide(index, updateHash) {
    var clamped = Math.max(1, Math.min(total, index));
    currentIndex = clamped;
    var view = document.body.getAttribute('data-view') || 'slide';

    for (var i = 0; i < wraps.length; i += 1) {
      var isCurrent = (i + 1) === clamped;
      var wrap = wraps[i];
      var frame = wrap.querySelector('.player-slide-frame');
      var thumbBtn = wrap.querySelector('.player-thumb-btn');
      wrap.classList.toggle('is-active', isCurrent);
      if (frame) {
        if (view === 'grid' || !isCurrent) {
          frame.setAttribute('aria-hidden', 'true');
        } else {
          frame.removeAttribute('aria-hidden');
        }
      }
      if (thumbBtn) {
        if (isCurrent) {
          thumbBtn.setAttribute('aria-current', 'true');
        } else {
          thumbBtn.removeAttribute('aria-current');
        }
      }
    }

    if (counterEl) {
      counterEl.textContent = clamped + ' / ' + total;
    }
    if (prevBtn) {
      prevBtn.disabled = clamped <= 1;
    }
    if (nextBtn) {
      nextBtn.disabled = clamped >= total;
    }
    document.body.setAttribute('data-slide', String(clamped));

    if (updateHash !== false) {
      var targetHash = '#' + clamped;
      if (window.location.hash !== targetHash && window.history && window.history.replaceState) {
        window.history.replaceState(null, '', targetHash);
      }
    }
  }

  function setView(mode) {
    var nextMode = mode === 'grid' ? 'grid' : 'slide';
    document.body.setAttribute('data-view', nextMode);
    if (gridBtn) {
      gridBtn.setAttribute('aria-expanded', nextMode === 'grid' ? 'true' : 'false');
    }
    setSlide(currentIndex, false);
    window.requestAnimationFrame(updateScale);
  }

  function toggleFullscreen() {
    if (!document.fullscreenEnabled && !document.documentElement.requestFullscreen) {
      return;
    }
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(function () {});
      }
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function () {});
    }
  }

  function syncFullscreenButton() {
    if (!fullBtn) {
      return;
    }
    var active = Boolean(document.fullscreenElement);
    var isVi = (document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('vi') === 0;
    fullBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    if (isVi) {
      fullBtn.textContent = active ? 'Thoát toàn màn hình' : 'Toàn màn hình';
    } else {
      fullBtn.textContent = active ? 'Exit fullscreen' : 'Fullscreen';
    }
    window.requestAnimationFrame(updateScale);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      if (document.body.getAttribute('data-view') === 'grid') {
        setView('slide');
      }
      setSlide(currentIndex - 1, true);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      if (document.body.getAttribute('data-view') === 'grid') {
        setView('slide');
      }
      setSlide(currentIndex + 1, true);
    });
  }

  if (gridBtn) {
    gridBtn.addEventListener('click', function () {
      var isGrid = document.body.getAttribute('data-view') === 'grid';
      setView(isGrid ? 'slide' : 'grid');
    });
  }

  if (fullBtn) {
    fullBtn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', syncFullscreenButton);
  }

  slidesRoot.addEventListener('click', function (e) {
    var btn = e.target.closest('.player-thumb-btn');
    if (!btn) {
      return;
    }
    var idx = Number(btn.getAttribute('data-go-slide'));
    if (Number.isInteger(idx) && idx >= 1 && idx <= total) {
      setSlide(idx, true);
      setView('slide');
      stage.focus({ preventScroll: true });
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    var tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) {
      return;
    }

    var view = document.body.getAttribute('data-view') || 'slide';
    var key = e.key;

    if (key === 'Escape' && view === 'grid') {
      e.preventDefault();
      setView('slide');
      if (gridBtn) {
        gridBtn.focus({ preventScroll: true });
      }
      return;
    }

    if (key === 'g' || key === 'G') {
      e.preventDefault();
      setView(view === 'grid' ? 'slide' : 'grid');
      return;
    }

    if (key === 'f' || key === 'F') {
      e.preventDefault();
      toggleFullscreen();
      return;
    }

    if (view === 'grid') {
      return;
    }

    if (key === 'ArrowRight' || key === 'PageDown') {
      e.preventDefault();
      setSlide(currentIndex + 1, true);
    } else if (key === 'ArrowLeft' || key === 'PageUp') {
      e.preventDefault();
      setSlide(currentIndex - 1, true);
    } else if (key === 'Home') {
      e.preventDefault();
      setSlide(1, true);
    } else if (key === 'End') {
      e.preventDefault();
      setSlide(total, true);
    } else if (key === ' ' || key === 'Spacebar') {
      if (e.target && e.target.closest('a, button, summary')) {
        return;
      }
      e.preventDefault();
      setSlide(e.shiftKey ? currentIndex - 1 : currentIndex + 1, true);
    }
  });

  window.addEventListener('hashchange', function () {
    setSlide(parseHash(), false);
  });

  if (typeof window.ResizeObserver === 'function') {
    var ro = new window.ResizeObserver(function () {
      updateScale();
    });
    ro.observe(stage);
    ro.observe(slidesRoot);
  }
  window.addEventListener('resize', updateScale);

  setSlide(parseHash(), false);
  updateScale();
})();
