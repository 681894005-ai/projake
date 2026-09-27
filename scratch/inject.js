const fs = require('fs');

const freshProducePath = 'c:/Users/PC/Documents/Projeak/js/components/freshProduce.js';
const newMethodsPath = 'c:/Users/PC/Documents/Projeak/scratch/new_methods.js';

let freshProduceCode = fs.readFileSync(freshProducePath, 'utf8');
let newMethodsCode = fs.readFileSync(newMethodsPath, 'utf8');

// Extract everything between the backticks
const firstTick = newMethodsCode.indexOf('`');
const lastTick = newMethodsCode.lastIndexOf('`');
const renderFunctions = newMethodsCode.slice(firstTick + 1, lastTick);

const startIdx = freshProduceCode.indexOf('  render() {');
const endIdx = freshProduceCode.indexOf('  init() {');

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find start or end indices");
  process.exit(1);
}

const newCode = freshProduceCode.slice(0, startIdx) + renderFunctions.trim() + '\n\n  ' + freshProduceCode.slice(endIdx);
fs.writeFileSync(freshProducePath, newCode, 'utf8');
console.log("Successfully replaced render methods.");
