const fs = require('fs');

const filePath = '/Users/jasonbenjamin/Projects/Chekki-AI-main/components/WorksheetItemCard.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const coachStart = content.indexOf('<div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-5 flex items-center gap-5">');
const accordion1Start = content.indexOf('{/* Accordion 1: Check Understanding / Teaching Guide */}');
const accordion2Start = content.indexOf('{/* Accordion 2: Show Answer & Actions */}');
// The end of accordion 2 is just before the `</>` that closes the fragment for authenticated users.
const fragmentEnd = content.indexOf('</>', accordion2Start);

if (coachStart !== -1 && accordion1Start !== -1 && accordion2Start !== -1 && fragmentEnd !== -1) {
  let coachBlock = content.slice(coachStart, accordion1Start);
  let accordion1Block = content.slice(accordion1Start, accordion2Start);
  let accordion2Block = content.slice(accordion2Start, fragmentEnd);

  // Reword the coach block
  coachBlock = coachBlock.replace(
    /language === 'ko' \? '무료 체험 코치' : 'Free Trial Coach'/g,
    "language === 'ko' ? 'AI 보이스 코치' : 'AI Voice Coach'"
  );
  
  coachBlock = coachBlock.replace(
    /language === 'ko'[\s\S]*?\? "아이의 차례입니다! 버튼을 누르고 말해보세요."[\s\S]*?: "It's your turn! Try speaking."/g,
    "language === 'ko' ? '정답을 직접 말하며 연습해보세요!' : 'Practice speaking the correct answer!'"
  );

  // We need to inject the coach block into Accordion 2's content.
  // Accordion 2 content starts after: <div className="p-5 flex flex-col gap-6">
  const acc2ContentStart = accordion2Block.indexOf('<div className="p-5 flex flex-col gap-6">');
  if (acc2ContentStart !== -1) {
    const insertPos = acc2ContentStart + '<div className="p-5 flex flex-col gap-6">'.length;
    // Inject coachBlock right inside the content of Accordion 2
    accordion2Block = accordion2Block.slice(0, insertPos) + '\n' + coachBlock + accordion2Block.slice(insertPos);
  }

  // Now assemble them: Accordion 2 then Accordion 1
  const newContent = content.slice(0, coachStart) + accordion2Block + '\n' + accordion1Block + content.slice(fragmentEnd);
  
  fs.writeFileSync(filePath, newContent);
  console.log("Successfully reordered and updated WorksheetItemCard.");
} else {
  console.error("Could not find the sections.", {
    coachStart, accordion1Start, accordion2Start, fragmentEnd
  });
}
