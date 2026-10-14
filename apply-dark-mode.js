const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
      callback(dirPath);
    }
  });
}

const directory = path.join(__dirname, 'app');

walkDir(directory, function(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Card containers
  content = content.replace(/className="([^"]*\bbg-white[^"]*rounded-xl[^"]*)"/g, (match, classes) => {
    if (classes.includes('dark:bg-[#111111]')) return match;
    return `className="${classes} dark:bg-[#111111] dark:border-zinc-800/50"`.replace('border-gray-100', 'border-gray-100');
  });

  // Headers inside cards
  content = content.replace(/className="([^"]*\bborder-b border-gray-100 *(?:flex)?.*?)"/g, (match, classes) => {
    if (classes.includes('dark:border-zinc-800/50')) return match;
    return `className="${classes.replace('border-gray-100', 'border-gray-100 dark:border-zinc-800/50')}"`;
  });

  // Titles
  content = content.replace(/text-cl font-bold text-\[\#042954\]/g, 'text-xl font-bold text-[#042954] dark:text-white');
  content = content.replace(/text-\[\#042954\]/g, (match, offset, full) => {
      // rough heuristic
      return `text-[#042954] dark:text-white`;
  });

  // Table Heads
  content = content.replace(/bg-gray-50 text-gray-500 border-b border-gray-200/g, 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800/50');
  
  // Table Rows hover
  content = content.replace(/hover:bg-gray-50\/50 transition-colors/g, 'hover:bg-gray-50/50 dark:hover:bg-[#151515] transition-colors dark:text-zinc-300');
  
  // Inputs / Selects
  content = content.replace(/bg-gray-50 border border-gray-200 rounded-lg /g, 'bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-zinc-800 dark:text-zinc-200 rounded-lg ');
  content = content.replace(/bg-white border border-gray-200 rounded-lg /g, 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-zinc-800 dark:text-zinc-200 rounded-lg ');

  // Statut cases: Actif
  content = content.replace(/\.statut === 'Actif'/g, `.statut?.toLowerCase() === 'actif'`);
  content = content.replace(/bg-green-100 text-green-700/g, 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400');
  content = content.replace(/bg-red-100 text-red-700/g, 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400');

  // Text colors
  content = content.replace(/text-\[\#333333\]/g, 'text-[#333333] dark:text-zinc-100');
  content = content.replace(/text-gray-500/g, 'text-gray-500 dark:text-zinc-400');

  // Buttons
  content = content.replace(/text-blue-600 bg-blue-50/g, 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20');
  content = content.replace(/text-red-600 bg-red-50/g, 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20');
  content = content.replace(/hover:bg-blue-100/g, 'hover:bg-blue-100 dark:hover:bg-blue-900/40');
  content = content.replace(/hover:bg-red-100/g, 'hover:bg-red-100 dark:hover:bg-red-900/40');

  // Duplicate checks cleanup
  content = content.replace(/dark:text-white dark:text-white/g, 'dark:text-white');
  content = content.replace(/dark:text-zinc-100 dark:text-zinc-100/g, 'dark:text-zinc-100');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
});

console.log('Patch complete.');
