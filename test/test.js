'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var toc = require('..');

function read(filepath) {
  return fs.readFileSync(filepath, 'utf8');
}
function fixture(name) {
  return read(path.resolve(__dirname, 'fixtures', name + '.html'));
}
function expected(name) {
  return read(path.resolve(__dirname, 'expected', name + '.html'));
}

describe('html-toc', function() {
  describe('main export', function() {
    it('should export a function', function() {
      assert.equal(typeof toc, 'function');
    });

    it('should throw an error when invalid args are passed', function(cb) {
      try {
        toc();
        cb(new Error('expected an error'));
      } catch (err) {
        assert(err);
        assert.equal(err.message, 'expected a string');
        cb();
      }
    });
  });

  describe('defaults', function() {
    it('should create a single-level toc', function() {
      assert.equal(toc(fixture('one-level')), expected('one-level'));
    });

    it('should support duplicate headings', function() {
      assert.equal(toc(fixture('duplicate-names')), expected('duplicate-names'));
    });
  });

  describe('options', function() {
    it('should support options.id', function() {
      var actual = toc(fixture('options-id'), {id: '#navigation'});
      assert.equal(actual, expected('options-id'));
    });

    it('should support custom selectors for headings', function() {
      var actual = toc(fixture('options-selectors'), {selectors: 'h1,h2,h3'});
      assert.equal(actual, expected('options-selectors'));
    });

    it('should not render anchors when options.anchors is false', function() {
      var actual = toc(fixture('options-anchors'), {anchors: false});
      assert.equal(actual, expected('options-anchors'));
    });

    it('should render custom anchors when anchorTemplate is passed', function() {
      var actual = toc(fixture('options-anchorTemplate'), {
        anchorTemplate: function(str) {
          return '@' + str + '@';
        }
      });
      assert.equal(actual, expected('options-anchorTemplate'));
    });
  });
});
