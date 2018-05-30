'use babel';

const compiler = require('vue-template-compiler');

function padContent(scriptTag, code) {
  // make sure actual code blocks have preserved position (row, col, charId)
  // matches the block of //\n//\n... at beginning of padded text
  // and divides by 3 chars per line
  const offsetLines = scriptTag.content.match(/^(\/\/\n)+/g)[0].length / 3;
  // compiler adds two lines before JS code
  const offsetChars = (scriptTag.start - offsetLines) + 2;
  return Array(offsetChars).join(' ') +
      Array(offsetLines).join('\n') +
      code.slice(scriptTag.start, scriptTag.end);
}

export default function padCode(code) {
  const output = compiler.parseComponent(code, { pad: 'line' });
  return padContent(output.script, code);
}
