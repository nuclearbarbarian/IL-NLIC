/* ============================================================
   SIDEBAR MODULE — Populate dynamic sidebar content
   Illinois Nuclear Infrastructure Map
   ============================================================ */

var Sidebar = {

  /* --- Populate reactor summary table from pre-fetched data --- */
  populateReactorTable: function() {
    var data = MapView._fetchedData && MapView._fetchedData['nlic-reactors'];
    if (!data) return;

    var tbody = document.getElementById('reactor-table-body');
    if (!tbody) return;

    var totalMW = 0;
    var totalUnits = 0;
    var html = '';

    data.features.forEach(function(f) {
      var p = f.properties;
      var latestLicense = '';

      if (p.units && p.units.length > 0) {
        var dates = p.units.map(function(u) { return u.license_expiration; }).sort();
        latestLicense = dates[dates.length - 1];
      }

      var types = [];
      if (p.units) {
        p.units.forEach(function(u) {
          if (types.indexOf(u.type) === -1) types.push(u.type);
        });
      }

      // Extract just the year from the latest license date
      var licenseYear = latestLicense ? latestLicense.split('-')[0] : '?';

      html += '<tr>';
      html += '<td>' + escapeHTML(p.short_name || p.name) + '</td>';
      html += '<td>' + escapeHTML(types.join('/')) + '</td>';
      html += '<td class="numeric">' + Number(p.total_capacity_mw).toLocaleString() + '</td>';
      html += '<td class="mono" style="font-size:10px">' + escapeHTML(licenseYear) + '</td>';
      html += '</tr>';

      totalMW += (p.total_capacity_mw || 0);
      totalUnits += (p.unit_count || 0);
    });

    // Total row
    html += '<tr class="total-row">';
    html += '<td colspan="2">TOTAL (' + totalUnits + ' units)</td>';
    html += '<td class="numeric">' + totalMW.toLocaleString() + '</td>';
    html += '<td></td>';
    html += '</tr>';

    tbody.innerHTML = html;
  }
};
