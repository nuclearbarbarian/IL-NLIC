/* ============================================================
   APP MODULE — Initialization and layer toggle wiring
   Illinois Nuclear Infrastructure Map
   ============================================================ */

var App = {

  /* Data access date — update when refreshing data sources */
  dataAccessDate: '2026-03-27',

  init: function() {
    MapView.init();
    Sidebar.init();
    this.wireLayerToggles();
    this.wireDetailClose();
    this.setFooterDate();
  },

  onMapReady: function() {
    // Map has loaded — initialize mobile layout now that map is ready
    MobileLayout.init();
  },

  /* --- Inject data access date into footer --- */
  setFooterDate: function() {
    var el = document.getElementById('footer-date');
    if (el) el.textContent = 'Last updated: ' + this.dataAccessDate;
    var spans = document.querySelectorAll('.access-date');
    for (var i = 0; i < spans.length; i++) {
      spans[i].textContent = this.dataAccessDate;
    }
  },

  /* --- Wire checkbox toggles to map layers --- */
  wireLayerToggles: function() {
    var checkboxes = document.querySelectorAll('[data-layer]');
    for (var i = 0; i < checkboxes.length; i++) {
      (function(cb) {
        cb.addEventListener('change', function() {
          var layerKey = cb.getAttribute('data-layer');
          MapView.toggleLayer(layerKey, cb.checked);
          App.updateLegend();
        });
      })(checkboxes[i]);
    }
  },

  /* --- Update legend visibility based on active layers --- */
  updateLegend: function() {
    var transportLayers = ['transmission', 'railroads', 'waterways', 'strahnet'];
    var anyTransportVisible = false;

    transportLayers.forEach(function(key) {
      var cb = document.querySelector('[data-layer="' + key + '"]');
      var legendItem = document.querySelector('[data-legend="' + key + '"]');
      if (cb && legendItem) {
        legendItem.style.display = cb.checked ? 'flex' : 'none';
        if (cb.checked) anyTransportVisible = true;
      }
    });

    var legendTransport = document.getElementById('legend-transport');
    if (legendTransport) {
      legendTransport.style.display = anyTransportVisible ? 'block' : 'none';
    }
  },

  /* --- Wire detail panel close --- */
  wireDetailClose: function() {
    var closeBtn = document.getElementById('detail-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        DetailPanel.hide();
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && DetailPanel.isOpen) {
        DetailPanel.hide();
      }
    });
  }
};

/* --- Start --- */
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});
