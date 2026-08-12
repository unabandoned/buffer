// Single entrypoint for the whole suite on Node's built-in node:test runner.
//
// Requiring a file that registers node:test tests is enough to schedule them;
// node:test runs them automatically and sets a non-zero process exit code on
// any failure, so `node test/index.js` is a self-contained `npm test`.
//
// Two groups:
//   - the tape-style files in test/*.js, which register via ./tape-adapter
//   - the Node core buffer tests, wrapped by ./node/index.js

// tape-style suite
require('./base64.js');
require('./basic.js');
require('./compare.js');
require('./constructor.js');
require('./from-string.js');
require('./is-buffer.js');
require('./methods.js');
require('./slice.js');
require('./static.js');
require('./to-string.js');
require('./typing.js');
require('./write-hex.js');
require('./write.js');
require('./write_infinity.js');

// Node core buffer tests
require('./node/index.js');
