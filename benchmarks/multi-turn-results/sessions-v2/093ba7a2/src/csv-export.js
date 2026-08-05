// Legacy exporter - known-good, writes out/report.csv
const fs = require('fs');
const path = require('path');
function exportCsv(data, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const lines = ['name,value'].concat(data.map(d => d.name + ',' + d.value));
  fs.writeFileSync(path.join(outDir, 'report.csv'), lines.join('\n'));
}
module.exports = { exportCsv };