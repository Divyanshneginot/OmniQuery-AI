export function downloadCsv(columns: string[], rows: Record<string, any>[], filenamePrefix = 'omniquery_studio'): void {
  if (!rows.length || !columns.length) return;
  const header = columns.join(',');
  const lines = rows.map(r =>
    columns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${Date.now()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
