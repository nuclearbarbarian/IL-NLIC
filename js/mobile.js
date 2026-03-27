/* ============================================================
   MOBILE MODULE — Additive mobile layout
   Illinois Nuclear Infrastructure Map
   ============================================================
   Wraps existing modules (MapView, DetailPanel, App) without
   modifying them. All mobile state and behavior lives here.
   ============================================================ */

var MobileLayout = {

  _isMobile: false,
  drawerState: 'collapsed',
  _origDetailShow: null,
  _origDetailHide: null,
  _backdrop: null,
  _toastShown: false,
  _scrimShown: false,

  _initialized: false,

  /* --- Entry point --- */
  init: function() {
    if (window.innerWidth > 768) {
      // Still register resize handler even on desktop so we can init on resize-to-mobile
      if (!this._initialized) this.setupResizeHandler();
      return;
    }
    this._isMobile = true;
    this._initialized = true;

    this.createDrawerHandle();
    this.createBackdrop();
    this.createCardGrip();
    this.wrapDetailPanel();
    this.setupDrawerGestures();
    this.setupCardGestures();
    this.setupHistory();
    this.setupResizeHandler();
    this.setState('collapsed');

    // Force map resize after layout change (belt-and-suspenders)
    if (MapView.instance) {
      MapView.instance.resize();
      MapView.instance.triggerRepaint();
      // Also resize after map finishes loading tiles
      MapView.instance.once('idle', function() {
        MapView.instance.resize();
      });
    }

    // Prevent sidebar scroll from propagating to map
    var sidebar = document.getElementById('sidebar');
    sidebar.addEventListener('touchmove', function(e) {
      e.stopPropagation();
    }, { passive: true });

    // Show onboarding toast
    var self = this;
    setTimeout(function() { self.showToast(); }, 2000);
  },

  /* =========================================================
     DRAWER — Sidebar as bottom sheet
     ========================================================= */

  createDrawerHandle: function() {
    var sidebar = document.getElementById('sidebar');
    var handle = document.createElement('div');
    handle.className = 'drawer-handle';
    handle.innerHTML =
      '<div class="drawer-grip"></div>' +
      '<div class="drawer-handle-row">' +
        '<span class="drawer-handle-label">Map Layers</span>' +
        '<button class="drawer-handle-btn" id="drawer-toggle-btn">Expand</button>' +
      '</div>';
    sidebar.insertBefore(handle, sidebar.firstChild);

    var self = this;
    document.getElementById('drawer-toggle-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      if (self.drawerState === 'collapsed') {
        self.setState('peek');
      } else {
        self.setState('collapsed');
      }
    });
  },

  /* --- Drawer state machine --- */
  setState: function(state) {
    var sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('drawer--collapsed', 'drawer--peek', 'drawer--full');
    sidebar.classList.add('drawer--' + state);
    this.drawerState = state;

    // Update button label
    var btn = document.getElementById('drawer-toggle-btn');
    if (btn) {
      btn.textContent = state === 'collapsed' ? 'Expand' : 'Close';
    }

    // Map interaction: disable when drawer is open
    if (MapView.instance) {
      if (state === 'collapsed') {
        MapView.instance.dragPan.enable();
        MapView.instance.touchZoomRotate.enable();
      } else {
        MapView.instance.dragPan.disable();
        MapView.instance.touchZoomRotate.disable();
      }
    }
  },

  /* --- Drawer touch gestures (on handle only) --- */
  setupDrawerGestures: function() {
    var handle = document.querySelector('.drawer-handle');
    if (!handle) return;

    var self = this;
    var startY = 0;
    var startTop = 0;
    var sidebar = document.getElementById('sidebar');

    handle.addEventListener('touchstart', function(e) {
      startY = e.touches[0].clientY;
      startTop = sidebar.getBoundingClientRect().top;
      sidebar.style.transition = 'none';
    }, { passive: true });

    handle.addEventListener('touchmove', function(e) {
      var dy = e.touches[0].clientY - startY;
      var newTop = startTop + dy;
      var headerH = 48;
      var maxTop = window.innerHeight - 72;
      newTop = Math.max(headerH, Math.min(maxTop, newTop));
      sidebar.style.top = newTop + 'px';
    }, { passive: true });

    handle.addEventListener('touchend', function(e) {
      sidebar.style.transition = '';
      sidebar.style.top = '';
      var endY = e.changedTouches[0].clientY;
      var dy = endY - startY;

      if (dy < -80) {
        // Swipe up
        if (self.drawerState === 'collapsed') self.setState('peek');
        else if (self.drawerState === 'peek') self.setState('full');
      } else if (dy > 80) {
        // Swipe down
        if (self.drawerState === 'full') self.setState('peek');
        else if (self.drawerState === 'peek') self.setState('collapsed');
      } else {
        // Snap back to current state
        self.setState(self.drawerState);
      }
    });
  },

  /* =========================================================
     CARD — Detail panel as half-sheet
     ========================================================= */

  createBackdrop: function() {
    var backdrop = document.createElement('div');
    backdrop.className = 'mobile-card-backdrop';
    backdrop.style.display = 'none';
    document.getElementById('app').appendChild(backdrop);
    this._backdrop = backdrop;

    var self = this;
    backdrop.addEventListener('click', function() {
      self.hideCard();
      if (history.state && history.state.cardOpen) {
        history.back();
      }
    });
  },

  createCardGrip: function() {
    var panel = document.getElementById('detail-panel');
    var grip = document.createElement('div');
    grip.className = 'card-grip-bar';
    grip.innerHTML = '<div class="card-grip"></div>';
    panel.insertBefore(grip, panel.firstChild);
  },

  /* --- Wrap DetailPanel.show/hide for mobile card behavior --- */
  wrapDetailPanel: function() {
    var self = this;
    this._origDetailShow = DetailPanel.show.bind(DetailPanel);
    this._origDetailHide = DetailPanel.hide.bind(DetailPanel);

    DetailPanel.show = function(feature, sourceType) {
      if (!self._isMobile) {
        return self._origDetailShow(feature, sourceType);
      }

      // Collapse drawer when card opens
      self.setState('collapsed');

      // Reuse shared render logic (parse JSON, build HTML, populate DOM)
      DetailPanel.render(feature, sourceType);

      // Show as card (NOT as grid column)
      var panel = document.getElementById('detail-panel');
      panel.style.display = 'block';
      panel.classList.remove('card--expanded');
      panel.scrollTop = 0;

      self._backdrop.style.display = 'block';
      DetailPanel.isOpen = true;

      // History: push or replace
      if (history.state && history.state.cardOpen) {
        history.replaceState({ cardOpen: true }, '');
      } else {
        history.pushState({ cardOpen: true }, '');
      }

      // Scrim hint on first card open
      if (!self._scrimShown) {
        self.showScrimHint();
        self._scrimShown = true;
      }
    };

    DetailPanel.hide = function() {
      if (!self._isMobile) {
        return self._origDetailHide();
      }
      self.hideCard();
    };
  },

  hideCard: function() {
    var panel = document.getElementById('detail-panel');
    panel.style.display = 'none';
    panel.classList.remove('card--expanded');
    panel.style.top = '';

    this._backdrop.style.display = 'none';
    DetailPanel.isOpen = false;

    // Ensure desktop grid class is not applied
    document.getElementById('app').classList.remove('detail-open');

    // Remove scrim hint if present
    var hint = document.querySelector('.scrim-hint');
    if (hint) hint.remove();
  },

  /* --- Card touch gestures (on grip only) --- */
  setupCardGestures: function() {
    var self = this;
    var panel = document.getElementById('detail-panel');
    var grip = panel.querySelector('.card-grip-bar');
    if (!grip) return;

    var startY = 0;
    var startTop = 0;

    grip.addEventListener('touchstart', function(e) {
      startY = e.touches[0].clientY;
      startTop = panel.getBoundingClientRect().top;
      panel.style.transition = 'none';
    }, { passive: true });

    grip.addEventListener('touchmove', function(e) {
      var dy = e.touches[0].clientY - startY;
      var newTop = startTop + dy;
      newTop = Math.max(48, newTop);
      panel.style.top = newTop + 'px';
    }, { passive: true });

    grip.addEventListener('touchend', function(e) {
      panel.style.transition = '';
      var endY = e.changedTouches[0].clientY;
      var dy = endY - startY;

      if (dy < -80) {
        // Swipe up — expand card
        panel.style.top = '';
        panel.classList.add('card--expanded');
      } else if (dy > 120) {
        // Large swipe down — dismiss card
        panel.style.top = '';
        self.hideCard();
        if (history.state && history.state.cardOpen) {
          history.back();
        }
      } else if (dy > 40 && panel.classList.contains('card--expanded')) {
        // Small swipe down on expanded — collapse to half-sheet
        panel.style.top = '';
        panel.classList.remove('card--expanded');
      } else {
        // Snap back
        panel.style.top = '';
      }
    });
  },

  /* =========================================================
     HISTORY — Back button integration
     ========================================================= */

  setupHistory: function() {
    var self = this;
    window.addEventListener('popstate', function() {
      if (DetailPanel.isOpen) {
        self.hideCard();
      }
    });
  },

  /* =========================================================
     ONBOARDING — Toast and scrim hint
     ========================================================= */

  showToast: function() {
    if (this._toastShown) return;
    this._toastShown = true;

    var toast = document.createElement('div');
    toast.className = 'mobile-toast';
    toast.textContent = 'Tap a site to see details';
    document.getElementById('app').appendChild(toast);

    // Force reflow, then animate in
    toast.offsetHeight;
    toast.classList.add('mobile-toast--visible');

    setTimeout(function() {
      toast.classList.remove('mobile-toast--visible');
      setTimeout(function() { toast.remove(); }, 400);
    }, 4000);
  },

  showScrimHint: function() {
    var hint = document.createElement('div');
    hint.className = 'scrim-hint';
    hint.textContent = 'Tap here to close';
    this._backdrop.appendChild(hint);

    setTimeout(function() {
      hint.classList.add('scrim-hint--fade');
      setTimeout(function() { hint.remove(); }, 500);
    }, 2500);
  },

  /* =========================================================
     RESIZE — Cross-threshold cleanup
     ========================================================= */

  setupResizeHandler: function() {
    var self = this;
    var timer;
    window.addEventListener('resize', function() {
      clearTimeout(timer);
      timer = setTimeout(function() {
        var wasMobile = self._isMobile;
        var nowMobile = window.innerWidth <= 768;

        if (wasMobile && !nowMobile) {
          // Desktop transition
          self._isMobile = false;

          self.cleanup();
        } else if (!wasMobile && nowMobile) {
          // Desktop-to-mobile transition: full init if never initialized
          if (!self._initialized) {
            self.init();
          } else {
            self._isMobile = true;
            self.setState('collapsed');
          }
        }
      }, 250);
    });
  },

  cleanup: function() {
    var sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('drawer--collapsed', 'drawer--peek', 'drawer--full');
    sidebar.style.top = '';
    sidebar.style.transition = '';

    var panel = document.getElementById('detail-panel');
    panel.classList.remove('card--expanded');
    panel.style.top = '';
    panel.style.display = 'none';

    if (this._backdrop) this._backdrop.style.display = 'none';
    DetailPanel.isOpen = false;

    // Restore original DetailPanel methods (undo monkey-patch)
    if (this._origDetailShow) DetailPanel.show = this._origDetailShow;
    if (this._origDetailHide) DetailPanel.hide = this._origDetailHide;

    document.getElementById('app').classList.remove('detail-open');

    if (MapView.instance) {
      MapView.instance.dragPan.enable();
      MapView.instance.touchZoomRotate.enable();
    }
  }
};

/* --- Init is called by App.onMapReady() after map load completes --- */
