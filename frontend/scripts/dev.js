// Suppress url.parse() deprecation warning before loading Next.js
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning, ...args) {
  // Check if it's the url.parse() deprecation warning
  if (typeof warning === 'string') {
    if (warning.includes('url.parse()') || warning.includes('DEP0169')) {
      return; // Suppress this warning
    }
  } else if (warning && typeof warning === 'object') {
    if (warning.name === 'DeprecationWarning' && 
        warning.message && 
        warning.message.includes('url.parse()')) {
      return; // Suppress this warning
    }
  }
  // Pass through all other warnings
  return originalEmitWarning.apply(process, [warning, ...args]);
};

// Now require Next.js
require('next/dist/bin/next');


