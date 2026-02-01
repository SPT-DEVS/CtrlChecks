// Script to verify all node inputs have correct guides
const fs = require('fs');
const path = require('path');

const nodeTypesPath = path.join(__dirname, '../src/components/workflow/nodeTypes.ts');
const nodeGuidesPath = path.join(__dirname, '../src/components/workflow/nodeGuides.ts');
const guideGeneratorPath = path.join(__dirname, '../src/components/workflow/guideGenerator.ts');

// Read node types file
const nodeTypesContent = fs.readFileSync(nodeTypesPath, 'utf8');

// Extract all nodes and their configFields
const nodeMatches = nodeTypesContent.matchAll(/type: '([^']+)',[\s\S]*?configFields: \[([\s\S]*?)\],/g);

const nodes = [];
for (const match of nodeMatches) {
  const nodeType = match[1];
  const configFieldsStr = match[2];
  
  // Extract fields
  const fieldMatches = configFieldsStr.matchAll(/key: '([^']+)',[\s\S]*?label: '([^']+)',[\s\S]*?type: '([^']+)'([\s\S]*?)(?=},|\])/g);
  
  const fields = [];
  for (const fieldMatch of fieldMatches) {
    const key = fieldMatch[1];
    const label = fieldMatch[2];
    const type = fieldMatch[3];
    const rest = fieldMatch[4];
    
    // Extract placeholder and helpText
    const placeholderMatch = rest.match(/placeholder: '([^']*)'/);
    const helpTextMatch = rest.match(/helpText: '([^']*)'/);
    
    fields.push({
      key,
      label,
      type,
      placeholder: placeholderMatch ? placeholderMatch[1] : undefined,
      helpText: helpTextMatch ? helpTextMatch[1] : undefined
    });
  }
  
  nodes.push({ type: nodeType, fields });
}

console.log(`Found ${nodes.length} nodes`);
console.log(`Total fields: ${nodes.reduce((sum, n) => sum + n.fields.length, 0)}`);

// Analyze fields that might need guides
const fieldsNeedingGuides = [];
nodes.forEach(node => {
  node.fields.forEach(field => {
    if (field.type === 'text' || field.type === 'textarea' || field.type === 'json' || field.type === 'number') {
      const needsGuide = 
        !field.helpText || 
        !field.helpText.includes('Step') && !field.helpText.includes('1)') ||
        field.key.toLowerCase().includes('api') ||
        field.key.toLowerCase().includes('token') ||
        field.key.toLowerCase().includes('key') ||
        field.key.toLowerCase().includes('url') ||
        field.key.toLowerCase().includes('credential') ||
        field.key.toLowerCase().includes('secret') ||
        field.key.toLowerCase().includes('password');
      
      if (needsGuide) {
        fieldsNeedingGuides.push({
          nodeType: node.type,
          fieldKey: field.key,
          fieldLabel: field.label,
          fieldType: field.type,
          placeholder: field.placeholder,
          hasHelpText: !!field.helpText
        });
      }
    }
  });
});

console.log(`\nFields that might need better guides: ${fieldsNeedingGuides.length}`);
console.log('\nSample fields needing guides:');
fieldsNeedingGuides.slice(0, 20).forEach(f => {
  console.log(`  ${f.nodeType}.${f.fieldKey} (${f.fieldType}): "${f.fieldLabel}"`);
});

// Write report
const report = {
  totalNodes: nodes.length,
  totalFields: nodes.reduce((sum, n) => sum + n.fields.length, 0),
  fieldsNeedingGuides: fieldsNeedingGuides.length,
  fields: fieldsNeedingGuides
};

fs.writeFileSync(
  path.join(__dirname, '../node-guides-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\nReport written to node-guides-report.json');

