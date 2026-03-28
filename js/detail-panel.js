/* ============================================================
   DETAIL PANEL — Click-to-inspect panel for map features
   Illinois Nuclear Infrastructure Map
   ============================================================ */

var DetailPanel = {

  isOpen: false,

  /* --- Photo lookup by short_name --- */
  photos: {
    'Braidwood': { file: 'braidwood.jpg', credit: 'Wikimedia Commons, CC BY-SA 2.0' },
    'Byron': { file: 'byron.jpg', credit: 'Wikimedia Commons, CC BY 2.5' },
    'Clinton': { file: 'clinton.jpg', credit: 'Wikimedia Commons, CC BY 4.0' },
    'Dresden': { file: 'dresden.jpg', credit: 'U.S. DOE, Public Domain' },
    'LaSalle': { file: 'lasalle.jpg', credit: 'Ken Lund / Wikimedia Commons, CC BY-SA 2.0' },
    'Quad Cities': { file: 'quad-cities.jpg', credit: 'Wikimedia Commons, CC BY-SA 4.0' },
    'Zion': { file: 'zion.jpg', credit: 'Wikimedia Commons, CC BY-SA 4.0' },
    'Dresden 1': { file: 'dresden-1.jpg', credit: 'U.S. AEC, Public Domain' },
    'Argonne': { file: 'argonne.jpg', credit: 'Argonne National Laboratory, CC BY-SA 2.0' },
    'Fermilab': { file: 'fermilab.jpg', credit: 'U.S. DOE, Public Domain' },
    'UIUC': { file: 'uiuc.jpg', credit: 'Ken Lund / Wikimedia Commons, CC BY-SA 2.0' },
    'Metropolis Works': { file: 'metropolis-works.jpg', credit: 'Ncollida1106 / Wikimedia Commons, CC BY-SA 3.0' }
  },

  /* --- Parse props and render content into the DOM (shared by desktop + mobile) --- */
  render: function(feature, sourceType) {
    var props = feature.properties;

    // Parse nested JSON if needed (MapLibre stringifies nested objects)
    var units = props.units;
    if (typeof units === 'string') {
      try { units = JSON.parse(units); } catch(e) { units = []; }
    }
    var sourcePlants = props.source_plants;
    if (typeof sourcePlants === 'string') {
      try { sourcePlants = JSON.parse(sourcePlants); } catch(e) { sourcePlants = []; }
    }

    var title = props.name || props.short_name || 'Unknown';
    var type = this.getTypeLabel(sourceType, props);
    var content = '';

    switch (sourceType) {
      case 'reactors':
        content = this.renderReactor(props, units);
        break;
      case 'decommissioned':
        content = this.renderDecommissioned(props, units);
        break;
      case 'isfsi':
        content = this.renderISFSI(props, sourcePlants);
        break;
      case 'labs':
        content = this.renderLab(props);
        break;
      case 'conversion':
        content = this.renderConversion(props);
        break;
      default:
        content = '<p>' + JSON.stringify(props) + '</p>';
    }

    document.getElementById('detail-title').textContent = title;
    document.getElementById('detail-type').textContent = type;
    document.getElementById('detail-content').innerHTML = content;
  },

  show: function(feature, sourceType) {
    this.render(feature, sourceType);

    document.getElementById('app').classList.add('detail-open');
    document.getElementById('detail-panel').style.display = 'block';
    this.isOpen = true;

    // Resize map after panel opens
    setTimeout(function() {
      if (MapView.instance) MapView.instance.resize();
    }, 50);
  },

  hide: function() {
    document.getElementById('app').classList.remove('detail-open');
    document.getElementById('detail-panel').style.display = 'none';
    this.isOpen = false;

    setTimeout(function() {
      if (MapView.instance) MapView.instance.resize();
    }, 50);
  },

  getTypeLabel: function(sourceType, props) {
    switch (sourceType) {
      case 'reactors':
        return 'OPERATING NUCLEAR GENERATING STATION — ' + (props.county || '') + ' COUNTY, IL';
      case 'decommissioned':
        return 'DECOMMISSIONED — ' + (props.county || '') + ' COUNTY, IL';
      case 'isfsi':
        return 'INDEPENDENT SPENT FUEL STORAGE INSTALLATION';
      case 'labs':
        return (props.type || '').toUpperCase();
      case 'conversion':
        return 'FUEL CYCLE FACILITY — ' + (props.county || '') + ' COUNTY, IL';
      default:
        return sourceType.toUpperCase();
    }
  },

  /* --- Render operating reactor detail --- */
  renderReactor: function(props, units) {
    var html = this.renderPhoto(props.short_name);

    // Summary stats
    html += this.renderStatRow([
      { value: props.unit_count || '?', label: 'Units' },
      { value: this.formatNumber(props.total_capacity_mw), label: 'MW net capacity' }
    ]);

    // Unit table
    if (units && units.length > 0) {
      html += '<table class="data-table">';
      html += '<thead><tr><th>Unit</th><th>Type</th><th style="text-align:right">MW</th><th>License exp.</th></tr></thead>';
      html += '<tbody>';
      for (var i = 0; i < units.length; i++) {
        var u = units[i];
        html += '<tr>';
        html += '<td>' + escapeHTML(u.name) + '</td>';
        html += '<td>' + escapeHTML(u.type) + '</td>';
        html += '<td class="numeric">' + this.formatNumber(u.net_capacity_mw) + '</td>';
        html += '<td class="mono" style="font-size:10px">' + this.formatDate(u.license_expiration) + '</td>';
        html += '</tr>';
      }
      html += '</tbody></table>';

      // Design info
      html += '<p style="font-size:10px; color: var(--color-warm-gray); margin-bottom: var(--space-sm);">';
      html += 'Design: ' + units[0].design;
      html += '</p>';
    }

    // Operator
    html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
    html += '<strong>Operator:</strong> ' + escapeHTML(props.operator || 'Unknown');
    html += '</p>';

    // RTO
    if (props.rto) {
      html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
      html += '<strong>Regional Transmission Organization:</strong> ' + escapeHTML(props.rto);
      html += '</p>';
    }

    // ISFSI
    html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
    html += '<strong>On-site spent fuel storage (ISFSI):</strong> ' + (props.isfsi ? 'Yes' : 'No');
    if (props.isfsi) {
      html += '<br><span style="font-size:10px; color: var(--color-warm-gray);">Cask counts and tonnage not published by NRC for plant-site ISFSIs.</span>';
    }
    html += '</p>';

    // Notes
    if (props.notes) {
      html += '<p style="font-size:11px; font-style:italic; color: var(--color-warm-gray); margin-top: var(--space-sm); padding-top: var(--space-sm); border-top: var(--border-hairline);">';
      html += escapeHTML(props.notes);
      html += '</p>';
    }

    // Source
    html += '<div class="table-source" style="margin-top: var(--space-md);">';
    html += 'Source: NRC Reactor Info Finder, WNA Reactor Database. Accessed ' + App.dataAccessDate + '.';
    html += '</div>';

    return html;
  },

  /* --- Render decommissioned site detail --- */
  renderDecommissioned: function(props, units) {
    var html = this.renderPhoto(props.short_name);

    html += this.renderStatRow([
      { value: props.unit_count || '?', label: 'Units (shut down)' },
      { value: this.formatNumber(props.total_capacity_mw), label: 'MW (former)' }
    ]);

    // Status
    html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
    html += '<strong>Status:</strong> ' + escapeHTML(props.status || 'Decommissioned');
    html += '</p>';

    // Unit table
    if (units && units.length > 0) {
      html += '<table class="data-table">';
      html += '<thead><tr><th>Unit</th><th>Type</th><th style="text-align:right">MW</th><th>Shutdown</th></tr></thead>';
      html += '<tbody>';
      for (var i = 0; i < units.length; i++) {
        var u = units[i];
        html += '<tr>';
        html += '<td>' + escapeHTML(u.name) + '</td>';
        html += '<td>' + escapeHTML(u.type) + '</td>';
        html += '<td class="numeric">' + this.formatNumber(u.net_capacity_mw) + '</td>';
        html += '<td class="mono" style="font-size:10px">' + this.formatDate(u.shutdown_date) + '</td>';
        html += '</tr>';
      }
      html += '</tbody></table>';
    }

    // ISFSI
    html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
    html += '<strong>Spent fuel on site:</strong> ' + (props.isfsi ? 'Yes (ISFSI active)' : 'No');
    html += '</p>';

    // NLIC relevance
    if (props.notes) {
      html += this.renderCalloutBox('NLIC RELEVANCE', props.notes);
    }

    html += '<div class="table-source" style="margin-top: var(--space-md);">';
    html += 'Source: NRC Decommissioning Status Reports, WNA Reactor Database. Accessed ' + App.dataAccessDate + '.';
    html += '</div>';

    return html;
  },

  /* --- Render ISFSI detail --- */
  renderISFSI: function(props, sourcePlants) {
    var html = this.renderPhoto(props.short_name);

    html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
    html += '<strong>Type:</strong> ' + (props.type || 'Spent fuel storage');
    html += '</p>';

    html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
    html += '<strong>Operator:</strong> ' + escapeHTML(props.operator || 'Unknown');
    html += '</p>';

    if (props.stored_tonnage_mt) {
      html += this.renderStatRow([
        { value: props.stored_tonnage_mt, label: 'metric tons stored' }
      ]);
    }

    if (sourcePlants && sourcePlants.length > 0) {
      html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
      html += '<strong>Source plants:</strong> ' + sourcePlants.map(escapeHTML).join(', ');
      html += '</p>';
    }

    if (props.nrc_license) {
      html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
      html += '<strong>NRC License:</strong> ' + props.nrc_license + ' (Docket ' + (props.nrc_docket || '?') + ')';
      html += '</p>';
    }

    if (props.license_expiration) {
      html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
      html += '<strong>License expiration:</strong> ' + props.license_expiration;
      html += '</p>';
    }

    if (props.notes) {
      html += this.renderCalloutBox('KEY FINDING', props.notes);
    }

    html += '<div class="table-source" style="margin-top: var(--space-md);">';
    html += 'Source: NRC ISFSI Licensing';
    if (props.nrc_docket === '72-0001') {
      html += ', Federal Register 2022-24993';
    } else {
      html += ', 10 CFR 72 Subpart K, NRC Exemption Documents';
    }
    html += '. Accessed ' + App.dataAccessDate + '.';
    html += '</div>';

    return html;
  },

  /* --- Render national lab detail --- */
  renderLab: function(props) {
    var html = this.renderPhoto(props.short_name);

    html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
    html += '<strong>Location:</strong> ' + (props.city || '') + ', ' + (props.county || '') + ' County, IL';
    html += '</p>';

    if (props.operator) {
      html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
      html += '<strong>Operator:</strong> ' + escapeHTML(props.operator);
      html += '</p>';
    }

    if (props.established) {
      html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
      html += '<strong>Established:</strong> ' + props.established;
      html += '</p>';
    }

    if (props.nlic_relevance) {
      html += this.renderCalloutBox('NLIC RELEVANCE', props.nlic_relevance);
    }

    html += '<div class="table-source" style="margin-top: var(--space-md);">';
    html += 'Source: DOE Office of Science. Accessed ' + App.dataAccessDate + '.';
    html += '</div>';

    return html;
  },

  /* --- Render conversion facility detail --- */
  renderConversion: function(props) {
    var html = this.renderPhoto(props.short_name);

    html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
    html += '<strong>Function:</strong> ' + escapeHTML(props.type || 'Uranium conversion');
    html += '</p>';

    html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
    html += '<strong>Process:</strong> ' + escapeHTML(props.feed || '?') + ' → ' + escapeHTML(props.product || '?');
    html += ' (' + escapeHTML(props.process || '') + ')';
    html += '</p>';

    html += this.renderStatRow([
      { value: this.formatNumber(props.licensed_capacity_mtu_yr), label: 'MTU/year licensed' },
      { value: props.built || '?', label: 'Year built' }
    ]);

    html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
    html += '<strong>Operator:</strong> ' + escapeHTML(props.operator || 'Unknown');
    html += '</p>';

    if (props.marketing) {
      html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
      html += '<strong>Marketing agent:</strong> ' + escapeHTML(props.marketing);
      html += '</p>';
    }

    html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
    html += '<strong>Status:</strong> ' + escapeHTML(props.status || 'Unknown');
    if (props.most_recent_restart) {
      html += ' (restarted ' + this.formatDate(props.most_recent_restart) + ')';
    }
    html += '</p>';

    if (props.nrc_docket) {
      html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
      html += '<strong>NRC Docket:</strong> ' + props.nrc_docket;
      if (props.nrc_license) html += ' (License ' + props.nrc_license + ')';
      html += '</p>';
    }

    if (props.license_expiration) {
      html += '<p style="font-size:11px; margin-bottom: var(--space-sm);">';
      html += '<strong>License expiration:</strong> ' + this.formatDate(props.license_expiration);
      html += '</p>';
    }

    if (props.notes) {
      html += this.renderCalloutBox('NLIC RELEVANCE', props.notes);
    }

    html += '<div class="table-source" style="margin-top: var(--space-md);">';
    html += 'Source: NRC Facility Info Finder, ConverDyn, Solstice Advanced Materials. Accessed ' + App.dataAccessDate + '.';
    html += '</div>';

    return html;
  },

  /* --- Render facility photo --- */
  renderPhoto: function(shortName) {
    var photo = this.photos[shortName];
    if (!photo) return '';
    return '<div class="detail-photo">' +
      '<img src="images/facilities/' + photo.file + '" alt="' + shortName + '" onerror="this.parentElement.style.display=\'none\'">' +
      '<div class="detail-photo-credit">' + photo.credit + '</div>' +
      '</div>';
  },

  /* --- Shared rendering helpers --- */
  renderCalloutBox: function(label, content) {
    return '<div style="margin-top: var(--space-sm); padding: var(--space-sm); border: var(--border-medium); background: var(--color-newsprint);">' +
      '<div style="font-family: var(--font-mono); font-size: 9px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px;">' + label + '</div>' +
      '<p style="font-size: 11px;">' + escapeHTML(content) + '</p>' +
      '</div>';
  },

  renderStatRow: function(cards) {
    var html = '<div class="stat-row">';
    for (var i = 0; i < cards.length; i++) {
      html += '<div class="stat-card"><div class="stat-value">' + cards[i].value + '</div>';
      html += '<div class="stat-label">' + cards[i].label + '</div></div>';
    }
    html += '</div>';
    return html;
  },

  /* --- Formatting helpers --- */
  formatNumber: function(n) {
    if (n === undefined || n === null) return '?';
    return Number(n).toLocaleString();
  },

  formatDate: function(dateStr) {
    if (!dateStr) return '?';
    var parts = dateStr.split('-');
    if (parts.length === 3) {
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return months[parseInt(parts[1], 10) - 1] + ' ' + parts[2] + ', ' + parts[0];
    }
    return dateStr;
  }
};
