const fs = require('fs');
const path = require('path');

const DIRECTORIES = ['src', 'components', '.'];
const EXTENSIONS = ['.tsx', '.ts'];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.git' && file !== 'public') {
      processDirectory(fullPath);
    } else if (EXTENSIONS.includes(path.extname(fullPath))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      content = content.replace(/duration-300/g, 'duration-200');
      content = content.replace(/duration-500/g, 'duration-300');
      content = content.replace(/ease-in-out/g, 'ease-[cubic-bezier(0.23,1,0.32,1)]');
      content = content.replace(/active:scale-95/g, 'active:scale-[0.97]');
      content = content.replace(/hover:scale-105/g, 'hover:scale-[1.02]');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

DIRECTORIES.forEach(processDirectory);
console.log('App-Wide Emil UX Audit Complete.');
