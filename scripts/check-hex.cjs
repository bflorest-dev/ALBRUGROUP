const fs = require('fs');
const path = require('path');
const rx = /(^|[^&])#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})(?![0-9A-Fa-f])/;

const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.tsx')) {
      const txt = fs.readFileSync(p, 'utf8');
      if (rx.test(txt)) {
        console.error('❌ Hex colors found in', p);
        process.exit(1);
      }
    }
  }
};

walk(path.join(__dirname, '..', 'src'));
console.log('✅ No hex colors');
