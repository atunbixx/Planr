const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript/JavaScript files
const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', {
  cwd: process.cwd(),
  absolute: true
});

let fixedCount = 0;

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Comment out Supabase imports
    if (content.includes('@supabase/')) {
      content = content.replace(
        /^import .* from ['"]@supabase\/[^'"]+['"]/gm,
        '// $&'
      );
      
      // Also comment out type imports
      content = content.replace(
        /^import type .* from ['"]@supabase\/[^'"]+['"]/gm,
        '// $&'
      );

      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      fixedCount++;
      console.log(`Fixed: ${path.relative(process.cwd(), file)}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log(`\nFixed ${fixedCount} files with Supabase imports`);