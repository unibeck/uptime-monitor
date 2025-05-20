// Script to optimize the OpenNext bundle size
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Handler to optimize the OpenNext handler.mjs file
async function optimizeBundle() {
  console.log('Optimizing OpenNext bundle...');
  const handlerPath = path.join(process.cwd(), '.open-next/server-functions/default/handler.mjs');
  
  // Check if handler exists
  if (!fs.existsSync(handlerPath)) {
    console.error('Handler file not found:', handlerPath);
    return;
  }
  
  // Read the original handler
  let content = fs.readFileSync(handlerPath, 'utf8');
  
  // Get original file size
  const originalSize = Buffer.byteLength(content, 'utf8');
  console.log(`Original size: ${formatBytes(originalSize)}`);
  
  // Apply optimizations
  
  // 1. Remove sourceMappingURL comments which add unnecessary size
  content = content.replace(/\/\/# sourceMappingURL=.+$/gm, '');
  
  // 2. Strip debug code and console.log statements
  content = content.replace(/console\.log\([^)]*\);?/g, '');
  
  // 3. Remove unused imports or code for @scalar/nextjs-openapi if present
  content = content.replace(/import\s+.*?['"]@scalar\/nextjs-openapi['"].*?;/g, '');
  content = content.replace(/require\(['"]@scalar\/nextjs-openapi['"]\)/g, '{}');
  
  // 4. Minify further by removing extra whitespace and comments
  content = content.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
  content = content.replace(/\/\/.*$/gm, ''); // Remove line comments
  content = content.replace(/^\s*[\r\n]/gm, ''); // Remove empty lines
  
  // 5. More aggressive minification with custom replacements
  content = content.replace(/\s{2,}/g, ' '); // Replace multiple spaces with a single space
  content = content.replace(/\s*([{};,=\(\):!\[\]])\s*/g, '$1'); // Remove spaces around punctuation

  // 6. Advanced optimizations to reduce bundled code
  content = content.replace(/function\s*_interop_require_default\(\)\s*\{\s*[^}]*\}/g, 
               'function _interop_require_default(obj){return obj&&obj.__esModule?obj:{default:obj}}');
  
  // 7. Optimize common patterns in the code
  content = content.replace(/const\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*require\(['"]([@a-zA-Z0-9-_/\.]+)['"]\)(;?)/g,
               'const $1=require("$2")$3');

  // 8. Apply gzip compression to check compressed size
  const compressedSize = zlib.gzipSync(content).length;
  console.log(`Compressed size: ${formatBytes(compressedSize)}`);
  
  // Write optimized content back
  fs.writeFileSync(handlerPath, content);
  
  // Get optimized file size
  const optimizedSize = Buffer.byteLength(content, 'utf8');
  console.log(`Optimized size: ${formatBytes(optimizedSize)}`);
  console.log(`Reduced by: ${formatBytes(originalSize - optimizedSize)} (${((1 - optimizedSize/originalSize) * 100).toFixed(2)}%)`);
  
  if (compressedSize <= 3 * 1024 * 1024) {
    console.log('✓ SUCCESS: Bundle size is below 3MB when compressed!');
  } else {
    console.log(`✗ WARNING: Bundle is still ${formatBytes(compressedSize - 3 * 1024 * 1024)} over the 3MB limit when compressed.`);
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// Run the optimization
optimizeBundle().catch(console.error);