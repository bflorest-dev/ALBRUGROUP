#!/usr/bin/env node

/**
 * CSS Conflicts Validator Script
 * Detecta automáticamente conflictos de CSS en la aplicación
 * 
 * Uso: node scripts/validate-css-conflicts.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Clases a monitorear
const WATCH_CLASSES = [
  'dashboard-content',
  'dashboard-header',
  'section-header',
  'stats-grid',
  'header-title'
];

/**
 * Busca definiciones de clases CSS en un archivo
 */
function extractCSSClasses(filePath) {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const matches = [];
  
  // Regex para encontrar definiciones de clases CSS
  const classRegex = /^\.([a-zA-Z][\w-]*)\s*{/gm;
  let match;
  
  while ((match = classRegex.exec(content)) !== null) {
    // Obtener número de línea
    const lineNum = content.substring(0, match.index).split('\n').length;
    matches.push({
      className: match[1],
      selector: match[0].trim().slice(0, -2), // sin {
      lineNumber: lineNum,
      file: filePath
    });
  }
  
  return matches;
}

/**
 * Busca uso de clases en archivos TSX
 */
function findClassUsage(filePath, className) {
  if (!fs.existsSync(filePath) || !filePath.endsWith('.tsx')) return [];
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const matches = [];
  
  // Buscar className="xxx" o className=`xxx`
  const regex = new RegExp(
    `className\\s*=\\s*["\`]([^"` + '`' + `]*${className}[^"` + '`' + `]*)["` + '`' + `]`,
    'g'
  );
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    matches.push({
      usage: match[1],
      lineNumber: lineNum,
      file: filePath
    });
  }
  
  return matches;
}

/**
 * Busca recursivamente archivos
 */
function findFiles(dir, extension) {
  let results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      if (!file.name.startsWith('.') && file.name !== 'node_modules') {
        results = results.concat(findFiles(fullPath, extension));
      }
    } else if (file.name.endsWith(extension)) {
      results.push(fullPath);
    }
  }
  
  return results;
}

/**
 * Analiza conflictos
 */
function analyzeConflicts() {
  console.log('🔍 Escaneando archivos CSS y TSX...\n');
  
  const srcPath = path.join(projectRoot, 'src');
  const cssFiles = findFiles(srcPath, '.css');
  const tsxFiles = findFiles(srcPath, '.tsx');
  
  console.log(`📊 Encontrados: ${cssFiles.length} archivos CSS, ${tsxFiles.length} archivos TSX\n`);
  
  const conflicts = {};
  const definitions = {};
  const usages = {};
  
  // Extraer definiciones de clases CSS
  for (const cssFile of cssFiles) {
    const classes = extractCSSClasses(cssFile);
    for (const cls of classes) {
      if (!definitions[cls.className]) {
        definitions[cls.className] = [];
      }
      definitions[cls.className].push(cls);
    }
  }
  
  // Buscar uso de clases en TSX
  for (const tsx of tsxFiles) {
    for (const className of WATCH_CLASSES) {
      const usage = findClassUsage(tsx, className);
      if (usage.length > 0) {
        if (!usages[className]) {
          usages[className] = [];
        }
        usages[className].push(...usage.map(u => ({
          ...u,
          file: tsx
        })));
      }
    }
  }
  
  // Identificar conflictos
  for (const className of WATCH_CLASSES) {
    const defs = definitions[className] || [];
    const uses = usages[className] || [];
    
    if (defs.length > 1 || (defs.length > 0 && uses.length > 0)) {
      conflicts[className] = {
        definitions: defs,
        usages: uses,
        conflictLevel: defs.length > 1 ? 'HIGH' : (uses.length > 1 ? 'MEDIUM' : 'LOW')
      };
    }
  }
  
  return { conflicts, definitions, usages };
}

/**
 * Genera reporte
 */
function generateReport(data) {
  const { conflicts } = data;
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║          CSS CONFLICTS DETECTION REPORT                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  if (Object.keys(conflicts).length === 0) {
    console.log('✅ No se encontraron conflictos CSS detectables\n');
    return;
  }
  
  for (const [className, conflict] of Object.entries(conflicts)) {
    const icon = conflict.conflictLevel === 'HIGH' ? '🔴' : 
                 conflict.conflictLevel === 'MEDIUM' ? '🟡' : '🟢';
    
    console.log(`${icon} Clase: .${className}`);
    console.log(`   Nivel de riesgo: ${conflict.conflictLevel}`);
    
    if (conflict.definitions.length > 1) {
      console.log(`   ⚠️  Múltiples definiciones (${conflict.definitions.length}):`);
      for (const def of conflict.definitions) {
        const relPath = def.file.replace(projectRoot, '.');
        console.log(`      • ${relPath}:${def.lineNumber}`);
      }
    }
    
    if (conflict.usages.length > 0) {
      console.log(`   📍 Usado en (${conflict.usages.length}):`);
      for (const usage of conflict.usages.slice(0, 3)) {
        const relPath = usage.file.replace(projectRoot, '.');
        console.log(`      • ${relPath}:${usage.lineNumber}`);
      }
      if (conflict.usages.length > 3) {
        console.log(`      ... y ${conflict.usages.length - 3} más`);
      }
    }
    
    console.log();
  }
  
  // Resumen
  const highRisk = Object.values(conflicts).filter(c => c.conflictLevel === 'HIGH').length;
  const mediumRisk = Object.values(conflicts).filter(c => c.conflictLevel === 'MEDIUM').length;
  const lowRisk = Object.values(conflicts).filter(c => c.conflictLevel === 'LOW').length;
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log(`║ 🔴 ALTO: ${highRisk} | 🟡 MEDIO: ${mediumRisk} | 🟢 BAJO: ${lowRisk}            ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log('📝 Para más detalles, revisar:\n');
  console.log('   • CSS_CONFLICTS_ANALYSIS.json');
  console.log('   • CSS_CONFLICTS_DETAILED_REPORT.md\n');
}

// Main
try {
  const results = analyzeConflicts();
  generateReport(results);
} catch (error) {
  console.error('❌ Error durante el análisis:', error.message);
  process.exit(1);
}
