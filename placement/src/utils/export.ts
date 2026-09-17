// Export Utilities for CSV, Excel (CSV formatted), and PDF/Print

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(fieldName => {
          let val = row[fieldName] ?? '';
          if (Array.isArray(val)) {
            val = val.join('; ');
          }
          const escaped = ('' + val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(filename: string, rows: Record<string, any>[]) {
  // Generates XML Excel format compatible with MS Excel / LibreOffice
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Report">
  <Table>
   <Row>`;

  headers.forEach(h => {
    xml += `<Cell><Data ss:Type="String">${h}</Data></Cell>`;
  });
  xml += `</Row>`;

  rows.forEach(row => {
    xml += `<Row>`;
    headers.forEach(h => {
      let val = row[h] ?? '';
      if (Array.isArray(val)) val = val.join(', ');
      xml += `<Cell><Data ss:Type="String">${String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`;
    });
    xml += `</Row>`;
  });

  xml += `</Table></Worksheet></Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printToPDF(title: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    alert('No data available for PDF print.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate PDF/Print report.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Adithya Institute of Technology</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 20px; color: #1e3a8a; }
          .header p { margin: 4px 0 0 0; font-size: 13px; color: #64748b; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 30px; text-align: right; font-size: 10px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ADITHYA INSTITUTE OF TECHNOLOGY</h1>
          <p>DEPARTMENT OF PLACEMENT & TRAINING</p>
        </div>
        <div class="title">${title}</div>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${headers.map(h => {
                  let val = row[h] ?? '';
                  if (Array.isArray(val)) val = val.join(', ');
                  return `<td>${val}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          Generated on ${new Date().toLocaleString()} | PRA Portal
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
