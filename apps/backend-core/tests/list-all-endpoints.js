const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '..', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

// Also check index.js to see how routers are mounted
const indexContent = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');
const mounts = [];
const mountRegex = /app\.use\(\s*['"]([^'"]+)['"]\s*,\s*([a-zA-Z0-9_]+)\)/g;
let m;
while ((m = mountRegex.exec(indexContent)) !== null) {
  mounts.push({ prefix: m[1], routerVar: m[2] });
}

// Find router variable mappings in index.js
const requireRegex = /const\s+([a-zA-Z0-9_]+)\s*=\s*require\(\s*['"]\.\/routes\/([a-zA-Z0-9_\-\.]+)['"]\)/g;
const varToFile = {};
while ((m = requireRegex.exec(indexContent)) !== null) {
  varToFile[m[1]] = m[2].endsWith('.js') ? m[2] : `${m[2]}.js`;
}

console.log('--- MOUNTED PREFIXES IN index.js ---');
mounts.forEach(mt => {
  const file = varToFile[mt.routerVar] || mt.routerVar;
  console.log(`${mt.prefix.padEnd(25)} -> ${file}`);
});

console.log('\n--- ALL ROUTE HANDLERS BY FILE ---');
let total = 0;
for (const file of files) {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const lines = content.split('\n');
  const found = [];
  const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/gis;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    found.push({ method: match[1].toUpperCase(), path: match[2] });
  }
  console.log(`\n${file} (${found.length} endpoints):`);
  found.forEach(f => console.log(`  [${f.method}] ${f.path}`));
  total += found.length;
}

console.log(`\nTOTAL ROUTE ENDPOINTS DEFINED: ${total}`);
