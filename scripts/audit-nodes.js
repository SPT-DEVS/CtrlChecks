import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/components/workflow/nodeTypes.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Extract all node definitions
const nodePattern = /\{\s*type:\s*'([^']+)',\s*label:\s*'([^']+)',\s*category:\s*'([^']+)',[\s\S]*?\},(?=\s*(?:\/\/|$|\{))/g;
const nodes = [];
let match;

// More robust pattern matching
const lines = content.split('\n');
let inNodeDefinition = false;
let currentNode = null;
let braceCount = 0;
let nodeStartLine = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if we're starting a new node definition
  if (line.trim().match(/^\{\s*$/)) {
    // Look ahead to find type, label, category
    let j = i + 1;
    let foundType = null, foundLabel = null, foundCategory = null;
    
    while (j < Math.min(i + 20, lines.length)) {
      const nextLine = lines[j];
      
      if (!foundType && nextLine.match(/^\s*type:\s*'([^']+)',/)) {
        foundType = nextLine.match(/^\s*type:\s*'([^']+)',/)[1];
      }
      if (!foundLabel && nextLine.match(/^\s*label:\s*'([^']+)',/)) {
        foundLabel = nextLine.match(/^\s*label:\s*'([^']+)',/)[1];
      }
      if (!foundCategory && nextLine.match(/^\s*category:\s*'([^']+)',/)) {
        foundCategory = nextLine.match(/^\s*category:\s*'([^']+)',/)[1];
      }
      
      if (foundType && foundLabel && foundCategory) {
        // This looks like a node definition (not a configField)
        // Check if it's not inside a configFields array
        if (!nextLine.includes('configFields') && 
            !lines.slice(Math.max(0, i-5), i).some(l => l.includes('configFields'))) {
          nodes.push({
            type: foundType,
            label: foundLabel,
            category: foundCategory,
            line: i + 1
          });
        }
        break;
      }
      j++;
    }
  }
}

// Better approach: look for pattern where type, label, category appear together
// and are not inside configFields
const betterPattern = /type:\s*'([a-z_][a-z0-9_]*)',\s*label:\s*'([^']+)',\s*category:\s*'([^']+)'/g;
const allMatches = [];
let betterMatch;

// Reset regex
betterPattern.lastIndex = 0;
while ((betterMatch = betterPattern.exec(content)) !== null) {
  // Check if this match is inside a configFields array
  const beforeMatch = content.substring(0, betterMatch.index);
  const lastConfigFields = beforeMatch.lastIndexOf('configFields');
  const lastNodeStart = beforeMatch.lastIndexOf('{\n    type:');
  
  // If configFields appears after the last node start, we're inside configFields
  if (lastConfigFields > lastNodeStart) {
    // This is likely a configField, skip it
    continue;
  }
  
  allMatches.push({
    type: betterMatch[1],
    label: betterMatch[2],
    category: betterMatch[3],
    index: betterMatch.index
  });
}

// Get line numbers
allMatches.forEach(match => {
  const beforeMatch = content.substring(0, match.index);
  match.line = beforeMatch.split('\n').length;
});

console.log(JSON.stringify(allMatches, null, 2));

