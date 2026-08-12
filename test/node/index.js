// Runner for the Node core buffer tests under the built-in node:test harness.
//
// These files (test-buffer*.js) are upstream Node core tests: plain scripts
// that `require('./common')` and assert with node:assert, throwing on failure.
// Under the old pipeline they ran as tape scripts. Here each file is wrapped in
// a node:test subtest so a thrown assertion fails just that file's subtest, and
// the deferred common.mustCall() checks are drained in a FINAL subtest (not an
// after() hook — an after() failure does not set a non-zero exit for the
// programmatic runner, a final test() does). Mirrors events/tests/index.js.

var test = require('node:test');
var common = require('./common');

function run(file) {
  test(file, function() {
    require(file);
  });
}

run('./test-buffer-alloc.js');
run('./test-buffer-arraybuffer.js');
run('./test-buffer-ascii.js');
run('./test-buffer-bad-overload.js');
run('./test-buffer-badhex.js');
run('./test-buffer-bigint64.js');
run('./test-buffer-bytelength.js');
run('./test-buffer-compare-offset.js');
run('./test-buffer-compare.js');
run('./test-buffer-concat.js');
run('./test-buffer-failed-alloc-typed-arrays.js');
run('./test-buffer-fill.js');
run('./test-buffer-from.js');
run('./test-buffer-includes.js');
run('./test-buffer-indexof.js');
run('./test-buffer-inheritance.js');
run('./test-buffer-inspect.js');
run('./test-buffer-isencoding.js');
run('./test-buffer-iterator.js');
run('./test-buffer-new.js');
run('./test-buffer-parent-property.js');
run('./test-buffer-prototype-inspect.js');
run('./test-buffer-safe-unsafe.js');
run('./test-buffer-slice.js');
run('./test-buffer-slow.js');
run('./test-buffer-swap.js');
run('./test-buffer-tojson.js');
run('./test-buffer-tostring.js');
run('./test-buffer-write.js');
run('./test-buffer-zero-fill-cli.js');
run('./test-buffer-zero-fill-reset.js');
run('./test-buffer-zero-fill.js');
run('./test-buffer.js');

// Run the deferred mustCall() checks last. A final test() (rather than an
// after() hook) guarantees a failed deferred check produces a non-zero exit.
test('deferred checks (mustCall)', function() {
  common.drainOnFinish();
});
