/**
 * Geração de .xlsx (exceljs) pros exports do admin. Server-only — importar
 * dinamicamente dentro de server actions pra não entrar em bundle de client.
 *
 * Contrato: cada sheet tem colunas (header + largura) e linhas como arrays
 * na MESMA ordem das colunas. Valores number são escritos como número (Excel
 * soma/filtra); use formatação BRL na coluna via `money: true`.
 */

export type XlsxColumn = { header: string; width?: number; money?: boolean };

export type XlsxSheet = {
  name: string;
  columns: XlsxColumn[];
  rows: Array<Array<string | number | null>>;
};

export async function buildXlsxBase64(sheets: XlsxSheet[]): Promise<string> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  for (const sheet of sheets) {
    // Nome de sheet no Excel: máx 31 chars, sem \ / ? * [ ] :
    const ws = wb.addWorksheet(sheet.name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
    ws.columns = sheet.columns.map((c) => ({ width: c.width ?? 18 }));

    const headerRow = ws.addRow(sheet.columns.map((c) => c.header));
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF4F6F8' },
    };

    for (const row of sheet.rows) {
      const r = ws.addRow(row.map((v) => (v === null ? '' : v)));
      sheet.columns.forEach((c, i) => {
        if (c.money) r.getCell(i + 1).numFmt = '"R$" #,##0.00';
      });
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf).toString('base64');
}
