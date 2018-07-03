'use babel';

import padCode from './parse-code';

function isAProxiedProperty(node, ancestors) {
  return (
    node.value.type === 'FunctionExpression' &&
    ancestors.find(a => a.type === 'Property' && (a.key.name === 'computed' || a.key.name === 'methods'))
  );
}

function isADataBinding(node, ancestors) {
  return (
    ancestors.find(a => a.type === 'Property' && a.key.name === 'data') &&
    ancestors.find(a => a.type === 'ReturnStatement')
  );
}

// Looks to match symbols in <template> with symbols in <script>
export default function findMatchesInsideComponent(textEditor, text, range) {
  const acorn = require('acorn'); // eslint-disable-line
  const walk = require('acorn/dist/walk'); // eslint-disable-line
  const componentText = textEditor.getText();
  const scriptTagText = padCode(componentText);
  const textRe = new RegExp(text);

  // Do a first pass without parsing the script tag
  if (textRe.test(scriptTagText)) {
    try {
      const functionExprs = [];
      const parsed = acorn.parse(scriptTagText, {
        sourceType: 'module',
        locations: true,
        ecmaVersion: 9,
      });

      // TODO see if there is a way to stop the walk once a single match
      // has been found
      walk.ancestor(parsed, {
        Property(node, ancestors) {
          if (text === node.key.name && isADataBinding(node, ancestors)) {
            functionExprs.push(node);
          }
          if (text === node.key.name && isAProxiedProperty(node, ancestors)) {
            functionExprs.push(node);
          }
        },
      });

      if (functionExprs.length > 0) {
        return {
          range,
          callback() {
            textEditor.setCursorBufferPosition({
              row: functionExprs[0].loc.start.line,
              column: functionExprs[0].loc.start.column,
            });
          },
        };
      }
    } catch (err) {
      console.error(err); // eslint-disable-line
    }
  }

  return null;
}
