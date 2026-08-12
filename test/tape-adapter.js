// Minimal tape-compatible adapter backed by node:test + node:assert.
//
// The buffer test suite (test/*.js) was written for tape:
//
//   var test = require('tape')
//   test('name', function (t) { t.equal(a, b); ...; t.end() })
//
// Rather than rewrite every assertion, each test file now requires this
// adapter instead of 'tape'. It registers a node:test test() per tape test
// and exposes a `t` object implementing the tape assertion methods actually
// used by this suite (see `grep -rhoE 't\.[a-zA-Z]+' test/*.js`).
//
// Async handling: tape signals completion via t.end() (or t.plan(n) counting
// down). The node:test callback returns a promise that resolves when the test
// body calls t.end() / satisfies its plan, so asynchronous tape tests are
// awaited correctly. Synchronous bodies that call t.end() at the tail resolve
// immediately.

var nodeTest = require('node:test')
var assert = require('node:assert')

function makeT (resolve, reject) {
  var planned = null
  var count = 0
  var ended = false

  function bump () {
    count++
    if (planned !== null && count >= planned) finish()
  }

  function finish () {
    if (ended) return
    ended = true
    resolve()
  }

  var t = {
    equal: function (actual, expected, msg) { assert.strictEqual(actual, expected, msg); bump() },
    equals: function (actual, expected, msg) { assert.strictEqual(actual, expected, msg); bump() },
    strictEqual: function (actual, expected, msg) { assert.strictEqual(actual, expected, msg); bump() },
    notEqual: function (actual, expected, msg) { assert.notStrictEqual(actual, expected, msg); bump() },
    notStrictEqual: function (actual, expected, msg) { assert.notStrictEqual(actual, expected, msg); bump() },
    deepEqual: function (actual, expected, msg) { assert.deepStrictEqual(actual, expected, msg); bump() },
    same: function (actual, expected, msg) { assert.deepStrictEqual(actual, expected, msg); bump() },
    deepLooseEqual: function (actual, expected, msg) { assert.deepEqual(actual, expected, msg); bump() },
    looseEqual: function (actual, expected, msg) { assert.deepEqual(actual, expected, msg); bump() },
    notDeepEqual: function (actual, expected, msg) { assert.notDeepStrictEqual(actual, expected, msg); bump() },
    ok: function (value, msg) { assert.ok(value, msg); bump() },
    true: function (value, msg) { assert.ok(value, msg); bump() },
    notOk: function (value, msg) { assert.ok(!value, msg); bump() },
    false: function (value, msg) { assert.ok(!value, msg); bump() },
    throws: function (fn, expected, msg) { assert.throws(fn, expected, msg); bump() },
    doesNotThrow: function (fn, expected, msg) { assert.doesNotThrow(fn, expected, msg); bump() },
    pass: function (msg) { assert.ok(true, msg); bump() },
    fail: function (msg) { assert.fail(msg || 'fail') },
    comment: function (msg) { console.log('# ' + msg) },
    plan: function (n) {
      planned = n
      if (count >= planned) finish()
    },
    end: function (err) {
      if (err) { reject(err); return }
      finish()
    }
  }

  return t
}

function test (name, cb) {
  nodeTest(name, function () {
    return new Promise(function (resolve, reject) {
      var t = makeT(resolve, reject)
      try {
        cb(t)
      } catch (err) {
        reject(err)
      }
    })
  })
}

module.exports = test
module.exports.test = test
