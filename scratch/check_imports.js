const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/Users/DELL/Desktop/Black damion/black-diamond-studios/src');

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('useState') && !content.includes("import { useState") && !content.includes("import {useState") && !content.includes("import React, { useState") && !content.includes("import React, {useState") && !content.includes("React.useState")) {
        console.log(`Missing useState import in: ${file}`);
    }
});
