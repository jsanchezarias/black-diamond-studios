#!/usr/bin/env node

/**
 * Script para limpiar imports con versiones en archivos TypeScript/React
 * Convierte: import { X } from "package@1.2.3"
 * A: import { X } from "package"
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const directoriesToScan = ['./components', './src'];
let filesFixed = 0;
let importsFixed = 0;

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
    return;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Regex para encontrar imports con versiones
    // Busca: "package@1.2.3" o 'package@1.2.3'
    const regex = /from\s+(['"])([^'"]+)@(\d+\.\d+\.\d+)(['"])/g;
    
    if (!regex.test(content)) {
      return; // No hay nada que arreglar
    }

    // Hacer el reemplazo
    const newContent = content.replace(
      /from\s+(['"])([^'"]+)@(\d+\.\d+\.\d+)(['"])/g,
      (match, quote1, packageName, version, quote2) => {
        importsFixed++;
        console.log(`  ✓ ${packageName}@${version} → ${packageName}`);
        return `from ${quote1}${packageName}${quote2}`;
      }
    );

    // Escribir el archivo actualizado
    writeFileSync(filePath, newContent, 'utf-8');
    filesFixed++;
    console.log(`✅ ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error en ${filePath}:`, error.message);
  }
}

function scanDirectory(directory) {
  try {
    const items = readdirSync(directory);
    
    for (const item of items) {
      const fullPath = join(directory, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursivamente escanear subdirectorios
        scanDirectory(fullPath);
      } else {
        // Procesar archivo
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error escaneando ${directory}:`, error.message);
  }
}

console.log('🔧 Limpiando imports con versiones...\n');

for (const dir of directoriesToScan) {
  console.log(`📁 Escaneando ${dir}...`);
  scanDirectory(dir);
}

console.log('\n✅ COMPLETADO');
console.log(`📊 Archivos corregidos: ${filesFixed}`);
console.log(`🔧 Imports limpiados: ${importsFixed}`);

if (filesFixed === 0) {
  console.log('✨ No se encontraron archivos con imports a corregir');
} else {
  console.log('\n🎯 Siguiente paso: npm install && npm run dev');
}
