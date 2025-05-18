// vocab-global.js
// This file should be loaded first among vocab files.
// It ensures the allVocabulary object exists.
if (typeof window.allVocabulary === 'undefined') {
    window.allVocabulary = {};
}