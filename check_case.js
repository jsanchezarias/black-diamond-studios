import fs from 'fs';
import path from 'path';

const srcDir = 'src';

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      walk(filePath, callback);
    } else {
      callback(filePath);
    }
  }
}

const allFiles = [];
walk(srcDir, (p) => allFiles.push(p.replace(/\\/g, '/')));

const filesMap = new Map();
allFiles.forEach(f => {
    filesMap.set(f.toLowerCase(), f);
});

const importRegex = /from\s+['"]\.{1,2}\/([^'"]+)['"]/g;

let count = 0;
let errors = 0;

walk(srcDir, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    const dir = path.dirname(filePath).replace(/\\/g, '/');
    
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('http') || importPath.startsWith('@/')) continue;
        
        // Resolve path
        let resolvedLocal = path.join(dir, importPath).replace(/\\/g, '/');
        
        // Check variants: .tsx, .ts, /index.tsx, /index.ts, or as is
        const variants = [
            resolvedLocal + '.tsx',
            resolvedLocal + '.ts',
            resolvedLocal + '/index.tsx',
            resolvedLocal + '/index.ts',
            resolvedLocal
        ];
        
        let found = false;
        let mismatch = null;
        
        for (const v of variants) {
            const lowV = v.toLowerCase();
            if (filesMap.has(lowV)) {
                found = true;
                const actual = filesMap.get(lowV);
                if (actual !== v) {
                    mismatch = { expected: v, actual: actual };
                }
                break;
            }
        }
        
        if (found && mismatch) {
            console.log(`CASE MISMATCH in ${filePath}:`);
            console.log(`  Import: ${importPath}`);
            console.log(`  Expected file: ${mismatch.expected}`);
            console.log(`  Actual file:   ${mismatch.actual}`);
            errors++;
        } else if (!found) {
            // Might be a library or alias we missed, but worth checking
            // console.log(`Not found: ${resolvedLocal}`);
        }
        count++;
    }
});

console.log(`Checked ${count} imports. Found ${errors} case mismatches.`);
