const fs = require('fs');
const path = require('path');

// Limpiar .next directory
const nextDir = path.join(__dirname, '.next');
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('Cleared .next directory');
}

// Limpiar node_modules/.cache
const cacheDir = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('Cleared node_modules/.cache directory');
}

console.log('Cache cleared successfully!');