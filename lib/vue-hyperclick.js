'use babel';

import camelcase from 'lodash.camelcase';
import { CompositeDisposable } from 'atom'; // eslint-disable-line
import padCode from './parse-code';
import findMatchesInsideComponent from './matchers';

const isVueGrammar = grammar => grammar.scopeName === 'text.html.vue';

const patchedEditors = new WeakMap();
function patchEditor(textEditor) {
  if (patchedEditors.has(textEditor)) {
    return patchedEditors.get(textEditor);
  }

  function patchGetGrammar(...args) {
    // force js-hyperclick to accept vue file
    const grammar = textEditor.getGrammar(...args);
    if (isVueGrammar(grammar)) {
      return {
        ...grammar,
        scopeName: 'source.js',
      };
    }
    return grammar;
  }

  function patchGetText(...args) {
    // strip vue files to plain javascript for  js-hyperclick
    const text = textEditor.getText(...args);
    const isVue = isVueGrammar(textEditor.getGrammar());
    if (isVue) {
      return padCode(text);
    }
    return text;
  }

  const patched = new Proxy(textEditor, {
    get(target, key) {
      if (key === 'getGrammar') {
        return patchGetGrammar;
      } else if (key === 'getText') {
        return patchGetText;
      }
      return target[key];
    },
  });

  patchedEditors.set(textEditor, patched);
  return patched;
}

function getScopesAtWord(textEditor, pos) {
  return textEditor.scopeDescriptorForBufferPosition(pos).getScopesArray();
}

function isHtmlAttribute(textEditor, range) {
  return getScopesAtWord(textEditor, range.start).includes('entity.other.attribute-name.html');
}

function makeProvider(ctx) {
  const jsHyperclick = require('../../js-hyperclick'); // eslint-disable-line
  const provider = jsHyperclick.getProvider.call(ctx);

  return {
    ...provider,
    wordRegExp: /[$0-9\w-]+/g,
    priority: 2, // larger than js-hyperclick
    providerName: 'vue-hyperclick',
    getSuggestionForWord(textEditor, text, range) {
      let result;
      const patchedEditor = patchEditor(textEditor);
      if (text.includes('-')) {
        /* eslint-disable no-param-reassign */
        const camelText = camelcase(text);
        const pascalText = camelText[0].toUpperCase() + camelText.slice(1);
        range.end.column -= 1;
        result = result || provider.getSuggestionForWord(patchedEditor, pascalText, range);
        result = result || provider.getSuggestionForWord(patchedEditor, camelText, range);
      } else if (!isHtmlAttribute(textEditor, range)) {
        const insideResult = findMatchesInsideComponent(textEditor, text, range);
        if (insideResult) {
          return insideResult;
        }
      } 

      result = provider.getSuggestionForWord(patchedEditor, text, range);

      if (result && result.callback) {
        // patch editor returned from async atom.workspace.open
        return {
          ...result,
          callback(...args) {
            const origOpen = atom.workspace.open;
            try {
              atom.workspace.open = function openCb(...openCbArgs) {
                return origOpen.apply(this, openCbArgs).then(patchEditor);
              };
              const ret = result.callback.apply(this, args);
              return ret;
            } finally {
              atom.workspace.open = origOpen;
            }
          },
        };
      }

      return result;
    },
  };
}

module.exports = {
  activate() {
    this.subscriptions = new CompositeDisposable();
  },
  getProvider() {
    if (atom.packages.isPackageLoaded('js-hyperclick')) {
      return makeProvider(this);
    }

    atom.notifications.addError('vue-hyperclick: This package requires js-hyperclick to function.');
    return null;
  },
  deactivate() {
    this.subscriptions.dispose();
  },
};
