/**
 * Utility to export telemetry activity logs to CSV or JSON format
 */

export function exportLogsToCSV(logs, filename = 'iot-activity-logs.csv') {
  if (!logs || logs.length === 0) return;

  const headers = ['ID', 'Waktu', 'Tipe', 'Kanal/Sumber', 'Pesan/Payload', 'Latensi (ms)'];
  const rows = logs.map(log => [
    log.id,
    `"${log.timestamp}"`,
    `"${log.type}"`,
    `"${log.channel || '-'}"`,
    `"${(typeof log.payload === 'object' ? JSON.stringify(log.payload) : log.payload || '').replace(/"/g, '""')}"`,
    log.latencyMs !== undefined ? log.latencyMs : '-'
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportLogsToJSON(logs, filename = 'iot-activity-logs.json') {
  if (!logs || logs.length === 0) return;

  const jsonStr = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
