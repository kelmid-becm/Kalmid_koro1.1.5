import fs from 'fs';

let txt = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = txt.split('\n');

const startIndex = lines.findIndex(l => l.includes('() => {'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('</button>'));

if (startIndex !== -1 && endIndex !== -1) {
  // Let's actually find the second `</div>` and delete till there.
  // Wait, let's just find the index of "() => {" and remove from 2267 to 2277.
  lines.splice(2266, 11);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
  console.log("Deleted 11 lines starting from 2267 (0-indexed 2266)");
}
