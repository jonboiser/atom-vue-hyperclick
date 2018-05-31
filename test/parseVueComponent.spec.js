const acorn = require('acorn');
const { readFile } = require('fs');
const walk = require('acorn/dist/walk');

function getText() {
  return new Promise((resolve) => {
    readFile(`${__dirname}/testScript.js`, 'utf-8', (err, data) => {
      resolve(data);
    });
  });
}

function isAProxiedProperty(ancestors) {
  return ancestors.find(a => a.type === 'Property' && (a.key.name === 'computed' || a.key.name === 'methods'));
}

(async function run() {
  const functionExprs = [];
  const dataExprs = [];
  const text = await getText();
  // Parsed module
  const parsed = acorn.parse(text, {
    sourceType: 'module',
    locations: true,
  });
  walk.ancestor(parsed, {
    FunctionExpression(node, ancestors) {
      if (isAProxiedProperty(ancestors)) {
        functionExprs.push(node);
      }
    },
    Property(node) {
      if (node.key.name === 'data') {
        // should work for data: {...} and data() {...}
        const dataObject = walk.findNodeAfter(node, node.start + 1, (node) => {
          return node === 'ObjectExpression';
        });
        walk.simple(dataObject.node, {
          Property(node) {
            if (node.key.name === 'name') {
              dataExprs.push(node);
            }
          }
        })
      }
    }
  });
  console.log(dataExprs);
}());
