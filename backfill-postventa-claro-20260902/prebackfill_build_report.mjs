import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "PREBACKFILL");
const data = JSON.parse(await fs.readFile(path.join(outDir, "prebackfill_data.json"), "utf8"));

await fs.mkdir(outDir, { recursive: true });

const workbook = Workbook.create();

function writeTable(sheet, startCell, headers, rows) {
  const matrix = [headers, ...rows.map((row) => headers.map((h) => row[h] ?? ""))];
  sheet.getRange(startCell).writeValues(matrix);
  const range = sheet.getRangeByIndexes(0, 0, matrix.length, headers.length);
  range.format = { font: { name: "Aptos", size: 10 }, wrapText: false };
  sheet.getRangeByIndexes(0, 0, 1, headers.length).format = {
    fill: "#1F4E78",
    font: { bold: true, color: "#FFFFFF" },
    wrapText: true,
  };
  range.format.borders = {
    insideHorizontal: { style: "thin", color: "#E5E7EB" },
    bottom: { style: "thin", color: "#CBD5E1" },
  };
  sheet.tables.add(`A1:${columnName(headers.length)}${matrix.length}`, true, `${sheet.name.replace(/[^A-Za-z0-9]/g, "")}Table`);
  sheet.freezePanes.freezeRows(1);
  sheet.showGridLines = false;
  range.format.autofitColumns();
}

function columnName(n) {
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

const resumen = workbook.worksheets.add("Resumen");
resumen.showGridLines = false;
resumen.getRange("A1:D1").values = [["Prebackfill CLARO", "", "", ""]];
resumen.getRange("A1:D1").merge();
resumen.getRange("A1").format = { fill: "#0F172A", font: { bold: true, color: "#FFFFFF", size: 16 } };
resumen.getRange("A3:B8").values = [
  ["Total pendientes", data.summary.total_pendientes],
  ["Crear desde cero", data.summary.crear_desde_cero],
  ["Actualizar existente", data.summary.actualizar_existente],
  ["Actor", "ADMINISTRADOR (empleado_id=1)"],
  ["Equipo nuevos", "ClaroTeam (id=2)"],
  ["Fuente instalacion", "POSTVENTA_CLARO.xlsx columna K"],
];
resumen.getRange("A3:A8").format = { fill: "#E2E8F0", font: { bold: true } };
resumen.getRange("A3:B8").format.borders = { preset: "all", style: "thin", color: "#CBD5E1" };
resumen.getRange("A10:B10").values = [["Plan confianza", "Cantidad"]];
let r = 11;
for (const [name, count] of Object.entries(data.summary.por_plan_confianza)) {
  resumen.getRange(`A${r}:B${r}`).values = [[name, count]];
  r++;
}
r += 1;
resumen.getRange(`A${r}:B${r}`).values = [["Alertas", "Cantidad"]];
resumen.getRange(`A${r}:B${r}`).format = { fill: "#F59E0B", font: { bold: true, color: "#111827" } };
r++;
for (const [name, count] of Object.entries(data.summary.alertas)) {
  resumen.getRange(`A${r}:B${r}`).values = [[name, count]];
  r++;
}
resumen.getRange("A10:B10").format = { fill: "#1F4E78", font: { bold: true, color: "#FFFFFF" } };
resumen.getUsedRange().format.autofitColumns();

const detalle = workbook.worksheets.add("Detalle_58");
const detailHeaders = Object.keys(data.details[0]);
writeTable(detalle, "A1", detailHeaders, data.details);

const alertas = workbook.worksheets.add("Alertas");
writeTable(alertas, "A1", ["lead", "sot", "alerta"], data.alerts);

const mapeo = workbook.worksheets.add("Mapeo");
const mappingRows = data.mapping.map((r) => ({
  bloque: r[0],
  campo: r[1],
  archivo_fuente: r[2],
  columna_regla: r[3],
  nota: r[4],
}));
writeTable(mapeo, "A1", ["bloque", "campo", "archivo_fuente", "columna_regla", "nota"], mappingRows);

for (const sheetName of ["Resumen", "Detalle_58", "Alertas", "Mapeo"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(
    path.join(outDir, `prebackfill_${sheetName.toLowerCase()}.png`),
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const inspect = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 6000,
  tableMaxRows: 5,
  tableMaxCols: 8,
});
console.log(inspect.ndjson);

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(path.join(outDir, "PREBACKFILL_CLARO_REPORTE.xlsx"));
console.log(path.join(outDir, "PREBACKFILL_CLARO_REPORTE.xlsx"));
