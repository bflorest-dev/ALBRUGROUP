#!/usr/bin/env node

/**
 * Script de Validación de Tipos
 * 
 * Analiza el código en busca de usos de 'any' y genera un reporte
 * de deuda técnica relacionada con tipos.
 * 
 * Uso:
 *   node scripts/validate-types.cjs
 *   node scripts/validate-types.cjs --json
 *   node scripts/validate-types.cjs --path src/shared
 */

const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  targetDirs: ['src/shared/ui', 'src/shared/hooks'],
  extensions: ['.ts', '.tsx'],
  excludePatterns: [
    'node_modules',
    'dist',
    'build',
    '.test.',
    '.spec.',
  ],
  anyPatterns: [
    /:\s*any\b/g,                    // : any
    /as\s+any\b/g,                   // as any
    /<any>/g,                        // <any>
    /Array<any>/g,                   // Array<any>
    /Record<string,\s*any>/g,        // Record<string, any>
    /\[\s*key:\s*string\s*\]:\s*any/g, // [key: string]: any
  ],
};

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Resultados
const results = {
  totalFiles: 0,
  filesWithAny: 0,
  totalAnyUsages: 0,
  details: [],
};

/**
 * Obtener todos los archivos recursivamente
 */
function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Excluir patrones
    if (CONFIG.excludePatterns.some((pattern) => filePath.includes(pattern))) {
      return;
    }

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (CONFIG.extensions.some((ext) => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Analizar un archivo en busca de 'any'
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const matches = [];

  lines.forEach((line, index) => {
    CONFIG.anyPatterns.forEach((pattern) => {
      const lineMatches = line.match(pattern);
      if (lineMatches) {
        lineMatches.forEach((match) => {
          matches.push({
            line: index + 1,
            content: line.trim(),
            match: match.trim(),
          });
        });
      }
    });
  });

  return matches;
}

/**
 * Generar reporte
 */
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log(colors.cyan + '📊 REPORTE DE DEUDA DE TIPOS' + colors.reset);
  console.log('='.repeat(80) + '\n');

  // Resumen
  console.log(colors.blue + '📈 RESUMEN GENERAL' + colors.reset);
  console.log(`   Archivos analizados:     ${results.totalFiles}`);
  console.log(`   Archivos con 'any':      ${results.filesWithAny} ${getStatusIcon(results.filesWithAny)}`);
  console.log(`   Usos totales de 'any':   ${results.totalAnyUsages} ${getStatusIcon(results.totalAnyUsages)}`);
  console.log(`   Cobertura de tipos:      ${calculateCoverage()}%\n`);

  // Detalles por archivo
  if (results.filesWithAny > 0) {
    console.log(colors.yellow + '⚠️  ARCHIVOS CON PROBLEMAS' + colors.reset + '\n');

    results.details.forEach((detail, index) => {
      console.log(`${colors.red}${index + 1}. ${detail.file}${colors.reset}`);
      console.log(`   Usos de 'any': ${detail.matches.length}`);
      console.log(`   Severidad: ${getSeverityBadge(detail.severity)}\n`);

      detail.matches.forEach((match) => {
        console.log(`   ${colors.yellow}Línea ${match.line}:${colors.reset}`);
        console.log(`   ${colors.magenta}${match.content}${colors.reset}`);
        console.log(`   ${colors.cyan}↑ ${match.match}${colors.reset}\n`);
      });
    });
  } else {
    console.log(colors.green + '✅ ¡No se encontraron usos de "any"!' + colors.reset + '\n');
  }

  // Recomendaciones
  if (results.filesWithAny > 0) {
    console.log(colors.blue + '💡 RECOMENDACIONES' + colors.reset + '\n');
    console.log('   1. Revisa el documento: doc/DEUDA_TIPOS_SHARED.md');
    console.log('   2. Consulta ejemplos: doc/REFACTORING_TIPOS_EJEMPLOS.md');
    console.log('   3. Usa "unknown" en lugar de "any" cuando sea posible');
    console.log('   4. Implementa type guards para validación en runtime');
    console.log('   5. Considera usar genéricos para componentes reutilizables\n');
  }

  // Estado final
  console.log('='.repeat(80));
  if (results.filesWithAny === 0) {
    console.log(colors.green + '✅ VALIDACIÓN EXITOSA' + colors.reset);
  } else {
    console.log(colors.red + '❌ VALIDACIÓN FALLIDA - Se encontraron usos de "any"' + colors.reset);
  }
  console.log('='.repeat(80) + '\n');

  // Exit code
  process.exit(results.filesWithAny > 0 ? 1 : 0);
}

/**
 * Calcular severidad basada en el contexto
 */
function calculateSeverity(filePath, matches) {
  const fileName = path.basename(filePath);
  const matchCount = matches.length;

  // Alta severidad
  if (fileName === 'Form.tsx' || fileName === 'Table.tsx') {
    return 'ALTA';
  }

  // Media severidad
  if (matchCount > 2 || matches.some(m => m.content.includes('Record<string, any>'))) {
    return 'MEDIA';
  }

  // Baja severidad
  return 'BAJA';
}

/**
 * Helpers de visualización
 */
function getStatusIcon(count) {
  if (count === 0) return '✅';
  if (count <= 2) return '🟡';
  return '🔴';
}

function getSeverityBadge(severity) {
  const badges = {
    ALTA: colors.red + '🔴 ALTA' + colors.reset,
    MEDIA: colors.yellow + '🟡 MEDIA' + colors.reset,
    BAJA: colors.green + '🟢 BAJA' + colors.reset,
  };
  return badges[severity] || severity;
}

function calculateCoverage() {
  if (results.totalFiles === 0) return 100;
  const cleanFiles = results.totalFiles - results.filesWithAny;
  return Math.round((cleanFiles / results.totalFiles) * 100);
}

/**
 * Generar reporte JSON
 */
function generateJsonReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.totalFiles,
      filesWithAny: results.filesWithAny,
      totalAnyUsages: results.totalAnyUsages,
      coverage: calculateCoverage(),
    },
    details: results.details.map(detail => ({
      file: detail.file,
      severity: detail.severity,
      usages: detail.matches.length,
      matches: detail.matches,
    })),
  };

  const reportPath = path.join(__dirname, '..', 'type-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(colors.green + `\n📄 Reporte JSON generado: ${reportPath}` + colors.reset);
}

/**
 * Main
 */
function main() {
  console.log(colors.cyan + '\n🔍 Analizando archivos...\n' + colors.reset);

  // Obtener todos los archivos
  const allFiles = [];
  CONFIG.targetDirs.forEach((dir) => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      getAllFiles(dirPath, allFiles);
    }
  });

  results.totalFiles = allFiles.length;

  // Analizar cada archivo
  allFiles.forEach((filePath) => {
    const matches = analyzeFile(filePath);

    if (matches.length > 0) {
      results.filesWithAny++;
      results.totalAnyUsages += matches.length;

      const relativePath = path.relative(process.cwd(), filePath);
      const severity = calculateSeverity(filePath, matches);

      results.details.push({
        file: relativePath,
        matches,
        severity,
      });
    }
  });

  // Ordenar por severidad
  const severityOrder = { ALTA: 0, MEDIA: 1, BAJA: 2 };
  results.details.sort((a, b) => {
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  // Generar reportes
  generateReport();
  
  // Generar JSON si se solicita
  if (process.argv.includes('--json')) {
    generateJsonReport();
  }
}

// Ejecutar
main();
