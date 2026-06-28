const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'components');
const targetFiles = [
  'BillingModal.tsx',
  'PaywallModal.tsx',
  'PremiumUpsellModal.tsx',
  'CloneWorksheetModal.tsx',
  'FeedbackModal.tsx',
  'RefineModal.tsx',
  'CommunityModal.tsx',
  'LegalModal.tsx',
  'ConfirmDialog.tsx',
  'SuccessDialog.tsx',
  'FlyerModal.tsx',
  'AskChekkiBar.tsx'
];

let updatedFiles = 0;

for (const file of targetFiles) {
  const filePath = path.join(componentsDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  if (file === 'AskChekkiBar.tsx' || file === 'LegalModal.tsx') {
    console.log(`Skipping ${file} for manual update.`);
    continue;
  }

  // Find the exact opening tag string
  let match = content.match(/<div[^>]*className=\{?`?[^>]*animate-fade-in-up[^>]*>/);
  if (!match) {
    match = content.match(/<div[^>]*className=\{?`?[^>]*modal-enter[^>]*>/);
  }
  if (match) {
    let openingTag = match[0];
    
    // Check if it already has the double-bezel "p-1.5" indicator
    if (openingTag.includes('p-1.5 bg-white/5')) {
      console.log(`Skipping ${file} - already updated.`);
      continue;
    }
    
    let maxWClasses = openingTag.match(/max-w-[a-z0-9\-]+/g) || [];
    let mxClasses = openingTag.match(/mx-[a-z0-9\-]+/g) || ['mx-4'];
    let wFull = openingTag.match(/w-full/g) ? 'w-full' : '';
    
    let outerShell = `<div className="relative p-1.5 bg-white/5 border border-white/10 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] modal-enter flex flex-col max-h-[95vh] ${wFull} ${maxWClasses.join(' ')} ${mxClasses.join(' ')}">
        <div className={\`relative w-full h-full rounded-[calc(2rem-0.375rem)] \${isNight ? 'bg-[#050505]' : 'bg-white'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden\`}>`;

    content = content.replace(openingTag, outerShell);
    
    // Replace closing tag. Most modals have:
    //       </div>
    //     </div>
    //   );
    // };
    // Let's do a more robust regex for the end of a React component
    if (file === 'SuccessDialog.tsx') {
      content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\)/, '</div>\n      </div>\n    </div>\n  )');
    } else {
      let replacedEnd = false;
      content = content.replace(/<\/div>\s*<\/div>\s*\);\s*};/, () => {
        replacedEnd = true;
        return '</div>\n      </div>\n    </div>\n  );\n};';
      });
      if (!replacedEnd) {
        content = content.replace(/<\/div>\s*<\/div>\s*\);\s*}/, '</div>\n      </div>\n    </div>\n  );\n}');
      }
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file}`);
      updatedFiles++;
    } else {
      console.log(`Failed to update ${file} automatically.`);
    }
  }
}

console.log(`Phase 2 High End Update: Updated ${updatedFiles} files.`);
