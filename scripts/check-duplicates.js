/**
 * Script para detectar archivos duplicados en el proyecto
 * Uso: npm run check-duplicates
 * Ignora index.ts ya que son barrel exports obligatorios
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, '../src');
const fileMap = new Map();
const duplicates = [];

/**
 * Recorrer recursivamente el directorio src
 */
function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    // Ignorar node_modules y archivos ocultos
    if (file.startsWith('.') || file === 'node_modules') {
      return;
    }

    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else {
      const fileName = path.basename(file);
      const extension = path.extname(file);

      // Ignorar index.ts/tsx (son barrel exports válidos)
      if (fileName === 'index.ts' || fileName === 'index.tsx') {
        return;
      }

      // Solo verificar archivos TSX, TS, CSS, JSX
      if (!['.tsx', '.ts', '.css', '.jsx', '.js'].includes(extension)) {
        return;
      }

      if (!fileMap.has(fileName)) {
        fileMap.set(fileName, []);
      }
      fileMap.get(fileName).push(fullPath);
    }
  });
}

walkDir(srcPath);

// Encontrar duplicados
fileMap.forEach((paths, fileName) => {
  if (paths.length > 1) {
    duplicates.push({
      fileName,
      count: paths.length,
      paths
    });
  }
});

// Mostrar resultados
console.log('\n' + '='.repeat(70));
console.log('🔍 ANÁLISIS DE ARCHIVOS DUPLICADOS');
console.log('='.repeat(70) + '\n');

if (duplicates.length === 0) {
  console.log('✅ No se encontraron archivos duplicados.\n');
  console.log('='.repeat(70) + '\n');
} else {
  console.log(`⚠️  Se encontraron ${duplicates.length} archivo(s) duplicado(s):\n`);
  
  duplicates.forEach((dup, index) => {
    console.log(`${index + 1}. ${dup.fileName} (${dup.count} copias)`);
    dup.paths.forEach((p, i) => {
      const relativePath = path.relative(path.join(__dirname, '..'), p);
      console.log(`   [${i + 1}] ${relativePath}`);
    });
    console.log('');
  });

  console.log('='.repeat(70));
  console.log('✋ ACCIÓN REQUERIDA:');
  console.log('='.repeat(70));
  console.log('\nRevisar y eliminar los archivos duplicados no utilizados.');
  console.log('Guardar solo la versión que se importa en el código.\n');

  process.exit(1);
}

process.exit(0);
