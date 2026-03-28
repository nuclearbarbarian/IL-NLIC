/* ============================================================
   MAP MODULE — MapLibre GL JS setup and layer management
   Illinois Nuclear Infrastructure Map
   ============================================================ */

/* --- Shared HTML escape utility (defense-in-depth for innerHTML) --- */
function escapeHTML(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var MapView = {
  instance: null,
  layers: {},

  /* --- Railroad owner abbreviation lookup --- */
  ownerNames: {
    'UP': 'Union Pacific', 'BNSF': 'BNSF Railway', 'CN': 'Canadian National',
    'NS': 'Norfolk Southern', 'CSXT': 'CSX Transportation', 'CPRS': 'CPKC',
    'BRC': 'Belt Railway of Chicago', 'IHB': 'Indiana Harbor Belt',
    'NIRC': 'Norfolk Southern (IC)', 'TRRA': 'Terminal Railroad Assn.'
  },

  /* --- Color tokens (mirror CSS) --- */
  colors: {
    ink: '#1A1A1A',
    newsprint: '#F5F2E8',
    paper: '#FDFCF9',
    warmGray: '#706B5E',
    blue: '#2B4B6F',
    red: '#8B2B2B',
    yellow: '#C4A035',
    green: '#3D5C3D',
    gray90: '#2D2D2D',
    gray70: '#5C5C5C',
    gray50: '#8A8A8A',
    gray30: '#B8B8B8',
    gray15: '#DCDCDC'
  },

  /* --- Initialize map --- */
  init: function() {
    var self = this;
    var sourceFiles = this._sourceFiles;
    var sourceNames = Object.keys(sourceFiles);

    // Fetch Protomaps style + all GeoJSON data in parallel
    var styleP = fetch('https://api.protomaps.com/styles/v5/light/en.json?key=f1de8450ff699b1a')
      .then(function(r) { return r.json(); });

    var dataPs = sourceNames.map(function(name) {
      return fetch(sourceFiles[name], { cache: 'no-cache' })
        .then(function(r) { return r.json(); })
        .then(function(data) { return { name: name, data: data }; })
        .catch(function() {
          console.error('Failed to load:', sourceFiles[name]);
          return { name: name, data: { type: 'FeatureCollection', features: [] } };
        });
    });

    Promise.all([styleP].concat(dataPs)).then(function(results) {
      var style = results[0];
      delete style.center;
      delete style.zoom;

      var fetchedData = {};
      for (var i = 1; i < results.length; i++) {
        fetchedData[results[i].name] = results[i].data;
      }
      self._fetchedData = fetchedData;
      self._createMap(style);
    }).catch(function(err) {
      console.error('Failed to initialize map:', err);
    });
  },

  _createMap: function(style) {
    var self = this;

    this.instance = new maplibregl.Map({
      container: 'map',
      style: style,
      center: [-89.0, 40.0],
      zoom: 6.2,
      minZoom: 4.7
    });

    this.instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

    this.instance.on('error', function(e) {
      var errMsg = e.error ? e.error.message || '' : '';
      var isDataError = errMsg.indexOf('404') !== -1 || errMsg.indexOf('Failed to fetch') !== -1 ||
          errMsg.indexOf('NetworkError') !== -1 || errMsg.indexOf('JSON') !== -1 ||
          errMsg.indexOf('source') !== -1 || errMsg.indexOf('geojson') !== -1;
      if (isDataError) {
        console.error('Map data error:', e.error);
        var msg = document.getElementById('map-error');
        if (!msg) {
          msg = document.createElement('div');
          msg.id = 'map-error';
          msg.style.cssText = 'position:absolute;top:60px;left:50%;transform:translateX(-50%);' +
            'background:var(--color-paper);border:var(--border-medium);padding:var(--space-sm) var(--space-md);' +
            'font-family:var(--font-mono);font-size:10px;color:var(--color-red);z-index:200;';
          msg.textContent = 'Some map data failed to load. Check your connection and reload.';
          document.getElementById('map').appendChild(msg);
        }
      }
    });

    this.instance.on('load', function() {
      var map = self.instance;
      var data = self._fetchedData;
      var names = Object.keys(data);
      for (var i = 0; i < names.length; i++) {
        map.addSource(names[i], { type: 'geojson', data: data[names[i]] });
      }

      self.addAllLayers();
      self.setupInteractions();

      // Populate sidebar table from pre-fetched data (avoids double-fetch)
      if (typeof Sidebar !== 'undefined' && Sidebar.populateReactorTable) {
        Sidebar.populateReactorTable();
      }

      if (typeof App !== 'undefined' && App.onMapReady) {
        App.onMapReady();
      }
    });
  },

  /* --- Fetch and add data sources --- */
  _sourceFiles: {
    'nlic-boundary':   'data/il_boundary.geojson',
    'nlic-reactors':      'data/reactors.geojson',
    'nlic-decommissioned':'data/decommissioned.geojson',
    'nlic-isfsi':         'data/isfsi.geojson',
    'nlic-labs':          'data/national-labs.geojson',
    'nlic-conversion':    'data/conversion.geojson',
    'nlic-transmission':  'data/transmission/il_transmission_345kv.geojson',
    'nlic-railroads':     'data/transport/il_class1_railroads.geojson',
    'nlic-waterways':     'data/transport/il_waterways.geojson',
    'nlic-strahnet':      'data/transport/il_strahnet.geojson'
  },


  /* --- Add map layers --- */
  addAllLayers: function() {
    var map = this.instance;
    var c = this.colors;

    /* --- Illinois state boundary (bottommost) --- */

    map.addLayer({
      id: 'il-boundary-fill',
      type: 'fill',
      source: 'nlic-boundary',
      paint: {
        'fill-color': c.newsprint,
        'fill-opacity': 0.15
      }
    });

    map.addLayer({
      id: 'il-boundary-line',
      type: 'line',
      source: 'nlic-boundary',
      paint: {
        'line-color': c.ink,
        'line-width': 2.5,
        'line-opacity': 0.8
      }
    });

    /* --- Transport layers (bottom) --- */

    map.addLayer({
      id: 'strahnet-lines',
      type: 'line',
      source: 'nlic-strahnet',
      layout: { visibility: 'none' },
      paint: {
        'line-color': c.red,
        'line-width': 1,
        'line-opacity': 0.35
      }
    });

    map.addLayer({
      id: 'railroads-lines',
      type: 'line',
      source: 'nlic-railroads',
      layout: { visibility: 'none' },
      paint: {
        'line-color': c.gray70,
        'line-width': 1,
        'line-opacity': 0.6
      }
    });

    map.addLayer({
      id: 'waterways-lines',
      type: 'line',
      source: 'nlic-waterways',
      layout: { visibility: 'none' },
      paint: {
        'line-color': c.blue,
        'line-width': 2.5,
        'line-opacity': 0.5
      }
    });

    /* --- Transmission layer --- */

    map.addLayer({
      id: 'transmission-lines',
      type: 'line',
      source: 'nlic-transmission',
      layout: { visibility: 'none' },
      paint: {
        'line-color': c.blue,
        'line-width': 1.5,
        'line-opacity': 0.7
      }
    });

    /* --- Point layers (top) --- */

    // Conversion facility
    map.addLayer({
      id: 'conversion-points',
      type: 'circle',
      source: 'nlic-conversion',
      paint: {
        'circle-radius': 8,
        'circle-color': c.green,
        'circle-stroke-color': c.ink,
        'circle-stroke-width': 1.5
      }
    });

    // ISFSI (smaller radius to distinguish from co-located reactor dots)
    map.addLayer({
      id: 'isfsi-points',
      type: 'circle',
      source: 'nlic-isfsi',
      paint: {
        'circle-radius': 6,
        'circle-color': c.yellow,
        'circle-stroke-color': c.ink,
        'circle-stroke-width': 1.5
      }
    });

    // Decommissioned
    map.addLayer({
      id: 'decommissioned-points',
      type: 'circle',
      source: 'nlic-decommissioned',
      paint: {
        'circle-radius': 8,
        'circle-color': c.gray50,
        'circle-stroke-color': c.ink,
        'circle-stroke-width': 1.5
      }
    });

    // National labs
    map.addLayer({
      id: 'labs-points',
      type: 'circle',
      source: 'nlic-labs',
      paint: {
        'circle-radius': 8,
        'circle-color': c.blue,
        'circle-stroke-color': c.ink,
        'circle-stroke-width': 1.5
      }
    });

    // Operating reactors (topmost)
    map.addLayer({
      id: 'reactors-points',
      type: 'circle',
      source: 'nlic-reactors',
      paint: {
        'circle-radius': 8,
        'circle-color': c.red,
        'circle-stroke-color': c.ink,
        'circle-stroke-width': 1.5
      }
    });

    // Reactor labels
    map.addLayer({
      id: 'reactors-labels',
      type: 'symbol',
      source: 'nlic-reactors',
      layout: {
        'text-field': ['get', 'short_name'],
        'text-font': ['Noto Sans Medium'],
        'text-size': 11,
        'text-offset': [0, -1.8],
        'text-anchor': 'bottom'
      },
      paint: {
        'text-color': c.ink,
        'text-halo-color': c.newsprint,
        'text-halo-width': 2
      }
    });

    // Labs labels
    map.addLayer({
      id: 'labs-labels',
      type: 'symbol',
      source: 'nlic-labs',
      layout: {
        'text-field': ['get', 'short_name'],
        'text-font': ['Noto Sans Medium'],
        'text-size': 10,
        'text-offset': [0, -1.6],
        'text-anchor': 'bottom'
      },
      paint: {
        'text-color': c.blue,
        'text-halo-color': c.newsprint,
        'text-halo-width': 2
      }
    });

    // Conversion labels
    map.addLayer({
      id: 'conversion-labels',
      type: 'symbol',
      source: 'nlic-conversion',
      layout: {
        'text-field': ['get', 'short_name'],
        'text-font': ['Noto Sans Medium'],
        'text-size': 10,
        'text-offset': [0, -1.6],
        'text-anchor': 'bottom'
      },
      paint: {
        'text-color': c.green,
        'text-halo-color': c.newsprint,
        'text-halo-width': 2
      }
    });

    /* --- Build layer-id map for toggle --- */
    this.layers = {
      conversion: ['conversion-points', 'conversion-labels'],
      reactors: ['reactors-points', 'reactors-labels'],
      decommissioned: ['decommissioned-points'],
      isfsi: ['isfsi-points'],
      labs: ['labs-points', 'labs-labels'],
      transmission: ['transmission-lines'],
      railroads: ['railroads-lines'],
      waterways: ['waterways-lines'],
      strahnet: ['strahnet-lines']
    };
  },

  /* --- Build hover tooltip HTML for point features --- */
  buildHoverHTML: function(layerId, props) {
    var s = '<div style="font-family: var(--font-serif); font-size: 11px; line-height: 1.4;">';
    var name = escapeHTML(props.name || props.short_name || 'Unknown');

    if (layerId === 'reactors-points') {
      s += '<strong>' + name + '</strong><br>';
      s += '<span style="color: var(--color-warm-gray); font-size: 10px;">' +
        (props.unit_count || '?') + ' units &middot; ' +
        (props.total_capacity_mw != null ? Number(props.total_capacity_mw).toLocaleString() : '?') + ' MW &middot; ' +
        (props.status || '') + '</span>';
    } else if (layerId === 'decommissioned-points') {
      s += '<strong>' + name + '</strong><br>';
      s += '<span style="color: var(--color-warm-gray); font-size: 10px;">' +
        (props.status || 'Decommissioned') + '</span>';
      if (props.isfsi) s += '<br><span style="color: var(--color-yellow); font-size: 10px;">Spent fuel on site</span>';
    } else if (layerId === 'isfsi-points') {
      s += '<strong>' + name + '</strong><br>';
      s += '<span style="color: var(--color-warm-gray); font-size: 10px;">' + (props.type || 'Spent fuel storage') + '</span>';
      if (props.stored_tonnage_mt) {
        s += '<br><span style="font-size: 10px;">' + props.stored_tonnage_mt + ' MT stored</span>';
      }
    } else if (layerId === 'labs-points') {
      s += '<strong>' + name + '</strong><br>';
      s += '<span style="color: var(--color-warm-gray); font-size: 10px;">' + (props.type || '') + '</span>';

    } else if (layerId === 'conversion-points') {
      s += '<strong>' + name + '</strong><br>';
      s += '<span style="color: var(--color-warm-gray); font-size: 10px;">' + (props.type || 'Fuel cycle facility') + '</span>';
      s += '<br><span style="font-size: 10px;">' + escapeHTML(props.operator) + '</span>';

    } else if (layerId === 'transmission-lines') {
      var txOwner = props.OWNER;
      var txInferred = false;
      if (!txOwner || txOwner === 'NOT AVAILABLE') {
        txOwner = props.INFERRED_OWNER || 'Unknown owner';
        txInferred = !!props.INFERRED_OWNER;
      }
      s += '<strong>' + escapeHTML(txOwner) + '</strong>';
      if (txInferred) s += ' <span style="color: var(--color-warm-gray); font-size: 9px;">(inferred)</span>';
      s += '<br><span style="color: var(--color-warm-gray); font-size: 10px;">' +
        (props.VOLTAGE || '?') + ' kV' +
        (props.VOLT_CLASS ? ' (' + props.VOLT_CLASS + ')' : '') + '</span>';
      if (props.SUB_1 && props.SUB_2) {
        s += '<br><span style="font-size: 10px;">' + escapeHTML(props.SUB_1) + ' → ' + escapeHTML(props.SUB_2) + '</span>';
      }

    } else if (layerId === 'railroads-lines') {
      var owner = props.RROWNER1 || 'Unknown';
      s += '<strong>' + (this.ownerNames[owner] || owner) + '</strong><br>';
      s += '<span style="color: var(--color-warm-gray); font-size: 10px;">Class I Railroad</span>';

    } else if (layerId === 'waterways-lines') {
      s += '<strong>' + (props.RIVERNAME || props.LINKNAME || 'Waterway') + '</strong><br>';
      s += '<span style="color: var(--color-warm-gray); font-size: 10px;">Navigable Waterway (USACE)</span>';
      if (props.LENGTH1) {
        s += '<br><span style="font-size: 10px;">' + Number(props.LENGTH1).toFixed(1) + ' mi segment</span>';
      }

    } else if (layerId === 'strahnet-lines') {
      var routeName = props.LNAME || props.SIGN1 || 'Highway';
      s += '<strong>' + routeName + '</strong>';
      if (props.SIGN1 && props.LNAME) {
        s += '<br><span style="color: var(--color-warm-gray); font-size: 10px;">' + props.SIGN1 + '</span>';
      }
      s += '<br><span style="color: var(--color-warm-gray); font-size: 10px;">STRAHNET — Strategic Highway</span>';
    }

    s += '</div>';
    return s;
  },

  /* --- Toggle layer visibility --- */
  toggleLayer: function(layerKey, visible) {
    var layerIds = this.layers[layerKey];
    if (!layerIds || !this.instance.isStyleLoaded()) return;
    var vis = visible ? 'visible' : 'none';
    for (var i = 0; i < layerIds.length; i++) {
      this.instance.setLayoutProperty(layerIds[i], 'visibility', vis);
    }
  },

  /* --- Setup click interactions --- */
  setupInteractions: function() {
    var map = this.instance;
    var clickableLayers = [
      'reactors-points',
      'decommissioned-points',
      'isfsi-points',
      'labs-points',
      'conversion-points'
    ];

    var hoverPopup = new maplibregl.Popup({
      offset: 12,
      closeButton: false,
      closeOnClick: false,
      maxWidth: '240px'
    });

    for (var i = 0; i < clickableLayers.length; i++) {
      (function(layerId) {
        map.on('click', layerId, function(e) {
          hoverPopup.remove();
          if (e.features && e.features.length > 0) {
            var feature = e.features[0];
            var sourceLayer = layerId.replace('nlic-', '').replace(/-points$|-labels$/, '');
            if (typeof DetailPanel !== 'undefined') {
              DetailPanel.show(feature, sourceLayer);
            }
          }
        });

        map.on('mouseenter', layerId, function(e) {
          map.getCanvas().style.cursor = 'pointer';
          if (e.features && e.features.length > 0) {
            var props = e.features[0].properties;
            var html = MapView.buildHoverHTML(layerId, props);
            hoverPopup.setLngLat(e.lngLat).setHTML(html).addTo(map);
          }
        });

        map.on('mouseleave', layerId, function() {
          map.getCanvas().style.cursor = '';
          hoverPopup.remove();
        });
      })(clickableLayers[i]);
    }

    // Line layers: click, hover, mousemove (with per-layer feature-ID caching)
    var lineLayers = ['transmission-lines', 'railroads-lines', 'waterways-lines', 'strahnet-lines'];
    var lastHoveredKey = null; // "layerId:featureId" to avoid cross-source ID collisions

    for (var j = 0; j < lineLayers.length; j++) {
      (function(lineId) {
        map.on('click', lineId, function(e) {
          if (e.features && e.features.length > 0) {
            var html = MapView.buildHoverHTML(lineId, e.features[0].properties);
            new maplibregl.Popup({ offset: 10, maxWidth: '260px' })
              .setLngLat(e.lngLat)
              .setHTML(html)
              .addTo(map);
          }
        });

        map.on('mouseenter', lineId, function(e) {
          map.getCanvas().style.cursor = 'pointer';
          if (e.features && e.features.length > 0) {
            lastHoveredKey = lineId + ':' + e.features[0].id;
            var html = MapView.buildHoverHTML(lineId, e.features[0].properties);
            hoverPopup.setLngLat(e.lngLat).setHTML(html).addTo(map);
          }
        });

        map.on('mousemove', lineId, function(e) {
          if (e.features && e.features.length > 0) {
            var key = lineId + ':' + e.features[0].id;
            hoverPopup.setLngLat(e.lngLat);
            if (key !== lastHoveredKey) {
              lastHoveredKey = key;
              hoverPopup.setHTML(MapView.buildHoverHTML(lineId, e.features[0].properties));
            }
          }
        });

        map.on('mouseleave', lineId, function() {
          map.getCanvas().style.cursor = '';
          lastHoveredKey = null;
          hoverPopup.remove();
        });
      })(lineLayers[j]);
    }
  }
};
