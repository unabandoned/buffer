// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

/* eslint-disable required-modules, crypto-check */
'use strict';
const assert = require('assert');
const mustCallChecks = [];

// crypto is available under Node's built-in runtime, so run the real
// crypto-backed assertions instead of skipping them.
exports.hasCrypto = true;

// Callbacks to run once the whole suite has finished. The node:test runner in
// index.js drains these from a final subtest (see drainOnFinish), replacing
// tape's/process-exit-based finalization so a failed deferred mustCall check
// actually fails the run.
const onFinishCallbacks = [];

exports.onFinish = function(cb) {
  onFinishCallbacks.push(cb);
};

exports.drainOnFinish = function() {
  while (onFinishCallbacks.length) {
    onFinishCallbacks.shift()();
  }
};

function runCallChecks(exitCode) {
  if (exitCode !== 0) return;

  const failed = mustCallChecks.filter(function(context) {
    if ('minimum' in context) {
      context.messageSegment = `at least ${context.minimum}`;
      return context.actual < context.minimum;
    } else {
      context.messageSegment = `exactly ${context.exact}`;
      return context.actual !== context.exact;
    }
  });

  failed.forEach(function(context) {
    console.log('Mismatched %s function calls. Expected %s, actual %d.',
                context.name,
                context.messageSegment,
                context.actual);
    console.log(context.stack.split('\n').slice(2).join('\n'));
  });

  assert.strictEqual(failed.length, 0);
}

exports.mustCall = function(fn, exact) {
  return _mustCallInner(fn, exact, 'exact');
};

function _mustCallInner(fn, criteria = 1, field) {
  if (typeof fn === 'number') {
    criteria = fn;
    fn = noop;
  } else if (fn === undefined) {
    fn = noop;
  }

  if (typeof criteria !== 'number')
    throw new TypeError(`Invalid ${field} value: ${criteria}`);

  const context = {
    [field]: criteria,
    actual: 0,
    stack: (new Error()).stack,
    name: fn.name || '<anonymous>'
  };

  // register the drain check only once; index.js runs it in a final subtest
  if (mustCallChecks.length === 0) exports.onFinish(function() { runCallChecks(0); });

  mustCallChecks.push(context);

  return function() {
    context.actual++;
    return fn.apply(this, arguments);
  };
}

exports.printSkipMessage = function(msg) {
  console.log(`1..0 # Skipped: ${msg}`);
};

// Node core's common.skip() aborts the process; under the node:test runner a
// single file's skip must not tear down the whole run, so just log it. In this
// suite skip() is only reached on the (unused) no-crypto branch.
exports.skip = function(msg) {
  console.log(`1..0 # Skipped: ${msg}`);
};

exports.mustNotCall = function(msg) {
  return function mustNotCall() {
    assert.fail(msg || 'function should not have been called');
  };
};

// Useful for testing expected internal/error objects
exports.expectsError = function expectsError(fn, settings, exact) {
  if (typeof fn !== 'function') {
    exact = settings;
    settings = fn;
    fn = undefined;
  }
  function innerFn(error) {
    if ('type' in settings) {
      const type = settings.type;
      if (type !== Error && !Error.isPrototypeOf(type)) {
        throw new TypeError('`settings.type` must inherit from `Error`');
      }
      assert(error instanceof type,
             `${error.name} is not instance of ${type.name}`);
      let typeName = error.constructor.name;
      if (typeName === 'NodeError' && type.name !== 'NodeError') {
        typeName = Object.getPrototypeOf(error.constructor).name;
      }
      assert.strictEqual(typeName, type.name);
    }
    if ('message' in settings) {
      const message = settings.message;
      if (typeof message === 'string') {
        assert.strictEqual(error.message, message);
      } else {
        assert(message.test(error.message),
               `${error.message} does not match ${message}`);
      }
    }
    if ('name' in settings) {
      assert.strictEqual(error.name, settings.name);
    }
    if (error.constructor.name === 'AssertionError') {
      ['generatedMessage', 'actual', 'expected', 'operator'].forEach((key) => {
        if (key in settings) {
          const actual = error[key];
          const expected = settings[key];
          assert.strictEqual(actual, expected,
                             `${key}: expected ${expected}, not ${actual}`);
        }
      });
    }
    return true;
  }
  if (fn) {
    assert.throws(fn, innerFn);
    return;
  }
  return exports.mustCall(innerFn, exact);
};
