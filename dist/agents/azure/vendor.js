import require$$0$2 from 'os';
import require$$1 from 'fs';
import require$$0$1 from 'path';
import require$$2 from 'events';
import require$$5 from 'assert';
import require$$0$4 from 'util';
import require$$1$1 from 'child_process';
import require$$0$3 from 'stream';
import require$$2$1 from 'crypto';
import require$$1$2 from 'url';
import require$$2$2 from 'http';
import require$$3$1 from 'https';
import require$$3 from 'zlib';
import 'net';
import require$$1$3 from 'tls';
import require$$3$2 from 'process';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getAugmentedNamespace(n) {
  if (n.__esModule) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			if (this instanceof a) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var task = {};

var shell = {};

var common$1 = {};

var old$1 = {};

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

var pathModule = require$$0$1;
var isWindows$1 = process.platform === 'win32';
var fs$7 = require$$1;

// JavaScript implementation of realpath, ported from node pre-v6

var DEBUG = process.env.NODE_DEBUG && /fs/.test(process.env.NODE_DEBUG);

function rethrow() {
  // Only enable in debug mode. A backtrace uses ~1000 bytes of heap space and
  // is fairly slow to generate.
  var callback;
  if (DEBUG) {
    var backtrace = new Error;
    callback = debugCallback;
  } else
    callback = missingCallback;

  return callback;

  function debugCallback(err) {
    if (err) {
      backtrace.message = err.message;
      err = backtrace;
      missingCallback(err);
    }
  }

  function missingCallback(err) {
    if (err) {
      if (process.throwDeprecation)
        throw err;  // Forgot a callback but don't know where? Use NODE_DEBUG=fs
      else if (!process.noDeprecation) {
        var msg = 'fs: missing callback ' + (err.stack || err.message);
        if (process.traceDeprecation)
          console.trace(msg);
        else
          console.error(msg);
      }
    }
  }
}

function maybeCallback(cb) {
  return typeof cb === 'function' ? cb : rethrow();
}

pathModule.normalize;

// Regexp that finds the next partion of a (partial) path
// result is [base_with_slash, base], e.g. ['somedir/', 'somedir']
if (isWindows$1) {
  var nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
} else {
  var nextPartRe = /(.*?)(?:[\/]+|$)/g;
}

// Regex to find the device root, including trailing slash. E.g. 'c:\\'.
if (isWindows$1) {
  var splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
} else {
  var splitRootRe = /^[\/]*/;
}

old$1.realpathSync = function realpathSync(p, cache) {
  // make p is absolute
  p = pathModule.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return cache[p];
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows$1 && !knownHard[base]) {
      fs$7.lstatSync(base);
      knownHard[base] = true;
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  // NB: p.length changes.
  while (pos < p.length) {
    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      continue;
    }

    var resolvedLink;
    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // some known symbolic link.  no need to stat again.
      resolvedLink = cache[base];
    } else {
      var stat = fs$7.lstatSync(base);
      if (!stat.isSymbolicLink()) {
        knownHard[base] = true;
        if (cache) cache[base] = base;
        continue;
      }

      // read the link if it wasn't read before
      // dev/ino always return 0 on windows, so skip the check.
      var linkTarget = null;
      if (!isWindows$1) {
        var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
        if (seenLinks.hasOwnProperty(id)) {
          linkTarget = seenLinks[id];
        }
      }
      if (linkTarget === null) {
        fs$7.statSync(base);
        linkTarget = fs$7.readlinkSync(base);
      }
      resolvedLink = pathModule.resolve(previous, linkTarget);
      // track this, if given a cache.
      if (cache) cache[base] = resolvedLink;
      if (!isWindows$1) seenLinks[id] = linkTarget;
    }

    // resolve the link, then start over
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }

  if (cache) cache[original] = p;

  return p;
};


old$1.realpath = function realpath(p, cache, cb) {
  if (typeof cb !== 'function') {
    cb = maybeCallback(cache);
    cache = null;
  }

  // make p is absolute
  p = pathModule.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return process.nextTick(cb.bind(null, null, cache[p]));
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows$1 && !knownHard[base]) {
      fs$7.lstat(base, function(err) {
        if (err) return cb(err);
        knownHard[base] = true;
        LOOP();
      });
    } else {
      process.nextTick(LOOP);
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  function LOOP() {
    // stop if scanned past end of path
    if (pos >= p.length) {
      if (cache) cache[original] = p;
      return cb(null, p);
    }

    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      return process.nextTick(LOOP);
    }

    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // known symbolic link.  no need to stat again.
      return gotResolvedLink(cache[base]);
    }

    return fs$7.lstat(base, gotStat);
  }

  function gotStat(err, stat) {
    if (err) return cb(err);

    // if not a symlink, skip to the next path part
    if (!stat.isSymbolicLink()) {
      knownHard[base] = true;
      if (cache) cache[base] = base;
      return process.nextTick(LOOP);
    }

    // stat & read the link if not read before
    // call gotTarget as soon as the link target is known
    // dev/ino always return 0 on windows, so skip the check.
    if (!isWindows$1) {
      var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
      if (seenLinks.hasOwnProperty(id)) {
        return gotTarget(null, seenLinks[id], base);
      }
    }
    fs$7.stat(base, function(err) {
      if (err) return cb(err);

      fs$7.readlink(base, function(err, target) {
        if (!isWindows$1) seenLinks[id] = target;
        gotTarget(err, target);
      });
    });
  }

  function gotTarget(err, target, base) {
    if (err) return cb(err);

    var resolvedLink = pathModule.resolve(previous, target);
    if (cache) cache[base] = resolvedLink;
    gotResolvedLink(resolvedLink);
  }

  function gotResolvedLink(resolvedLink) {
    // resolve the link, then start over
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }
};

var fs_realpath = realpath;
realpath.realpath = realpath;
realpath.sync = realpathSync;
realpath.realpathSync = realpathSync;
realpath.monkeypatch = monkeypatch;
realpath.unmonkeypatch = unmonkeypatch;

var fs$6 = require$$1;
var origRealpath = fs$6.realpath;
var origRealpathSync = fs$6.realpathSync;

var version = process.version;
var ok = /^v[0-5]\./.test(version);
var old = old$1;

function newError (er) {
  return er && er.syscall === 'realpath' && (
    er.code === 'ELOOP' ||
    er.code === 'ENOMEM' ||
    er.code === 'ENAMETOOLONG'
  )
}

function realpath (p, cache, cb) {
  if (ok) {
    return origRealpath(p, cache, cb)
  }

  if (typeof cache === 'function') {
    cb = cache;
    cache = null;
  }
  origRealpath(p, cache, function (er, result) {
    if (newError(er)) {
      old.realpath(p, cache, cb);
    } else {
      cb(er, result);
    }
  });
}

function realpathSync (p, cache) {
  if (ok) {
    return origRealpathSync(p, cache)
  }

  try {
    return origRealpathSync(p, cache)
  } catch (er) {
    if (newError(er)) {
      return old.realpathSync(p, cache)
    } else {
      throw er
    }
  }
}

function monkeypatch () {
  fs$6.realpath = realpath;
  fs$6.realpathSync = realpathSync;
}

function unmonkeypatch () {
  fs$6.realpath = origRealpath;
  fs$6.realpathSync = origRealpathSync;
}

var concatMap$1 = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray$4(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray$4 = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var balancedMatch = balanced$1;
function balanced$1(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);

  var r = range$1(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}

balanced$1.range = range$1;
function range$1(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    if(a===b) {
      return [ai, bi];
    }
    begs = [];
    left = str.length;

    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}

var concatMap = concatMap$1;
var balanced = balancedMatch;

var braceExpansion = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric$1(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balanced('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }

  return expand$2(escapeBraces(str), true).map(unescapeBraces);
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte$4(i, y) {
  return i <= y;
}
function gte$4(i, y) {
  return i >= y;
}

function expand$2(str, isTop) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = m.body.indexOf(',') >= 0;
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*\}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand$2(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand$2(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand$2(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand$2(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric$1(n[0]);
    var y = numeric$1(n[1]);
    var width = Math.max(n[0].length, n[1].length);
    var incr = n.length == 3
      ? Math.abs(numeric$1(n[2]))
      : 1;
    var test = lte$4;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte$4;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand$2(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}

var minimatch_1$1 = minimatch$2;
minimatch$2.Minimatch = Minimatch$2;

var path$8 = (function () { try { return require('path') } catch (e) {}}()) || {
  sep: '/'
};
minimatch$2.sep = path$8.sep;

var GLOBSTAR$1 = minimatch$2.GLOBSTAR = Minimatch$2.GLOBSTAR = {};
var expand$1 = braceExpansion;

var plTypes$1 = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
};

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark$1 = '[^/]';

// * => any number of characters
var star$1 = qmark$1 + '*?';

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot$1 = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?';

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot$1 = '(?:(?!(?:\\\/|^)\\.).)*?';

// characters that need to be escaped in RegExp.
var reSpecials$1 = charSet$1('().*{}+?[]^$\\!');

// "abc" -> { a:true, b:true, c:true }
function charSet$1 (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true;
    return set
  }, {})
}

// normalizes slashes.
var slashSplit$1 = /\/+/;

minimatch$2.filter = filter$1;
function filter$1 (pattern, options) {
  options = options || {};
  return function (p, i, list) {
    return minimatch$2(p, pattern, options)
  }
}

function ext$1 (a, b) {
  b = b || {};
  var t = {};
  Object.keys(a).forEach(function (k) {
    t[k] = a[k];
  });
  Object.keys(b).forEach(function (k) {
    t[k] = b[k];
  });
  return t
}

minimatch$2.defaults = function (def) {
  if (!def || typeof def !== 'object' || !Object.keys(def).length) {
    return minimatch$2
  }

  var orig = minimatch$2;

  var m = function minimatch (p, pattern, options) {
    return orig(p, pattern, ext$1(def, options))
  };

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext$1(def, options))
  };
  m.Minimatch.defaults = function defaults (options) {
    return orig.defaults(ext$1(def, options)).Minimatch
  };

  m.filter = function filter (pattern, options) {
    return orig.filter(pattern, ext$1(def, options))
  };

  m.defaults = function defaults (options) {
    return orig.defaults(ext$1(def, options))
  };

  m.makeRe = function makeRe (pattern, options) {
    return orig.makeRe(pattern, ext$1(def, options))
  };

  m.braceExpand = function braceExpand (pattern, options) {
    return orig.braceExpand(pattern, ext$1(def, options))
  };

  m.match = function (list, pattern, options) {
    return orig.match(list, pattern, ext$1(def, options))
  };

  return m
};

Minimatch$2.defaults = function (def) {
  return minimatch$2.defaults(def).Minimatch
};

function minimatch$2 (p, pattern, options) {
  assertValidPattern$1(pattern);

  if (!options) options = {};

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  return new Minimatch$2(pattern, options).match(p)
}

function Minimatch$2 (pattern, options) {
  if (!(this instanceof Minimatch$2)) {
    return new Minimatch$2(pattern, options)
  }

  assertValidPattern$1(pattern);

  if (!options) options = {};

  pattern = pattern.trim();

  // windows support: need to use /, not \
  if (!options.allowWindowsEscape && path$8.sep !== '/') {
    pattern = pattern.split(path$8.sep).join('/');
  }

  this.options = options;
  this.set = [];
  this.pattern = pattern;
  this.regexp = null;
  this.negate = false;
  this.comment = false;
  this.empty = false;
  this.partial = !!options.partial;

  // make the set of regexps etc.
  this.make();
}

Minimatch$2.prototype.debug = function () {};

Minimatch$2.prototype.make = make$1;
function make$1 () {
  var pattern = this.pattern;
  var options = this.options;

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true;
    return
  }
  if (!pattern) {
    this.empty = true;
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate();

  // step 2: expand braces
  var set = this.globSet = this.braceExpand();

  if (options.debug) this.debug = function debug() { console.error.apply(console, arguments); };

  this.debug(this.pattern, set);

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit$1)
  });

  this.debug(this.pattern, set);

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this);

  this.debug(this.pattern, set);

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  });

  this.debug(this.pattern, set);

  this.set = set;
}

Minimatch$2.prototype.parseNegate = parseNegate$1;
function parseNegate$1 () {
  var pattern = this.pattern;
  var negate = false;
  var options = this.options;
  var negateOffset = 0;

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate;
    negateOffset++;
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset);
  this.negate = negate;
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch$2.braceExpand = function (pattern, options) {
  return braceExpand$1(pattern, options)
};

Minimatch$2.prototype.braceExpand = braceExpand$1;

function braceExpand$1 (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch$2) {
      options = this.options;
    } else {
      options = {};
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern;

  assertValidPattern$1(pattern);

  // Thanks to Yeting Li <https://github.com/yetingli> for
  // improving this regexp to avoid a ReDOS vulnerability.
  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand$1(pattern)
}

var MAX_PATTERN_LENGTH$1 = 1024 * 64;
var assertValidPattern$1 = function (pattern) {
  if (typeof pattern !== 'string') {
    throw new TypeError('invalid pattern')
  }

  if (pattern.length > MAX_PATTERN_LENGTH$1) {
    throw new TypeError('pattern is too long')
  }
};

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch$2.prototype.parse = parse$c;
var SUBPARSE$1 = {};
function parse$c (pattern, isSub) {
  assertValidPattern$1(pattern);

  var options = this.options;

  // shortcuts
  if (pattern === '**') {
    if (!options.noglobstar)
      return GLOBSTAR$1
    else
      pattern = '*';
  }
  if (pattern === '') return ''

  var re = '';
  var hasMagic = !!options.nocase;
  var escaping = false;
  // ? => one single character
  var patternListStack = [];
  var negativeLists = [];
  var stateChar;
  var inClass = false;
  var reClassStart = -1;
  var classStart = -1;
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)';
  var self = this;

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star$1;
          hasMagic = true;
        break
        case '?':
          re += qmark$1;
          hasMagic = true;
        break
        default:
          re += '\\' + stateChar;
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re);
      stateChar = false;
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c);

    // skip over any that are escaped.
    if (escaping && reSpecials$1[c]) {
      re += '\\' + c;
      escaping = false;
      continue
    }

    switch (c) {
      /* istanbul ignore next */
      case '/': {
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false
      }

      case '\\':
        clearStateChar();
        escaping = true;
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c);

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class');
          if (c === '!' && i === classStart + 1) c = '^';
          re += c;
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar);
        clearStateChar();
        stateChar = c;
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar();
      continue

      case '(':
        if (inClass) {
          re += '(';
          continue
        }

        if (!stateChar) {
          re += '\\(';
          continue
        }

        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes$1[stateChar].open,
          close: plTypes$1[stateChar].close
        });
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:';
        this.debug('plType %j %j', stateChar, re);
        stateChar = false;
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)';
          continue
        }

        clearStateChar();
        hasMagic = true;
        var pl = patternListStack.pop();
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        re += pl.close;
        if (pl.type === '!') {
          negativeLists.push(pl);
        }
        pl.reEnd = re.length;
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|';
          escaping = false;
          continue
        }

        clearStateChar();
        re += '|';
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar();

        if (inClass) {
          re += '\\' + c;
          continue
        }

        inClass = true;
        classStart = i;
        reClassStart = re.length;
        re += c;
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c;
          escaping = false;
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        // split where the last [ was, make sure we don't have
        // an invalid re. if so, re-walk the contents of the
        // would-be class to re-translate any characters that
        // were passed through as-is
        // TODO: It would probably be faster to determine this
        // without a try/catch and a new RegExp, but it's tricky
        // to do safely.  For now, this is safe and works.
        var cs = pattern.substring(classStart + 1, i);
        try {
          RegExp('[' + cs + ']');
        } catch (er) {
          // not a valid class!
          var sp = this.parse(cs, SUBPARSE$1);
          re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]';
          hasMagic = hasMagic || sp[1];
          inClass = false;
          continue
        }

        // finish up the class.
        hasMagic = true;
        inClass = false;
        re += c;
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar();

        if (escaping) {
          // no need
          escaping = false;
        } else if (reSpecials$1[c]
          && !(c === '^' && inClass)) {
          re += '\\';
        }

        re += c;

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1);
    sp = this.parse(cs, SUBPARSE$1);
    re = re.substr(0, reClassStart) + '\\[' + sp[0];
    hasMagic = hasMagic || sp[1];
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length);
    this.debug('setting tail', re, pl);
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\';
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    });

    this.debug('tail=%j\n   %s', tail, tail, pl, re);
    var t = pl.type === '*' ? star$1
      : pl.type === '?' ? qmark$1
      : '\\' + pl.type;

    hasMagic = true;
    re = re.slice(0, pl.reStart) + t + '\\(' + tail;
  }

  // handle trailing things that only matter at the very end.
  clearStateChar();
  if (escaping) {
    // trailing \\
    re += '\\\\';
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false;
  switch (re.charAt(0)) {
    case '[': case '.': case '(': addPatternStart = true;
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n];

    var nlBefore = re.slice(0, nl.reStart);
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd);
    var nlAfter = re.slice(nl.reEnd);

    nlLast += nlAfter;

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1;
    var cleanAfter = nlAfter;
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '');
    }
    nlAfter = cleanAfter;

    var dollar = '';
    if (nlAfter === '' && isSub !== SUBPARSE$1) {
      dollar = '$';
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast;
    re = newRe;
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re;
  }

  if (addPatternStart) {
    re = patternStart + re;
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE$1) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape$1(pattern)
  }

  var flags = options.nocase ? 'i' : '';
  try {
    var regExp = new RegExp('^' + re + '$', flags);
  } catch (er) /* istanbul ignore next - should be impossible */ {
    // If it was an invalid regular expression, then it can't match
    // anything.  This trick looks for a character after the end of
    // the string, which is of course impossible, except in multi-line
    // mode, but it's not a /m regex.
    return new RegExp('$.')
  }

  regExp._glob = pattern;
  regExp._src = re;

  return regExp
}

minimatch$2.makeRe = function (pattern, options) {
  return new Minimatch$2(pattern, options || {}).makeRe()
};

Minimatch$2.prototype.makeRe = makeRe$1;
function makeRe$1 () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set;

  if (!set.length) {
    this.regexp = false;
    return this.regexp
  }
  var options = this.options;

  var twoStar = options.noglobstar ? star$1
    : options.dot ? twoStarDot$1
    : twoStarNoDot$1;
  var flags = options.nocase ? 'i' : '';

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR$1) ? twoStar
      : (typeof p === 'string') ? regExpEscape$1(p)
      : p._src
    }).join('\\\/')
  }).join('|');

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$';

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$';

  try {
    this.regexp = new RegExp(re, flags);
  } catch (ex) /* istanbul ignore next - should be impossible */ {
    this.regexp = false;
  }
  return this.regexp
}

minimatch$2.match = function (list, pattern, options) {
  options = options || {};
  var mm = new Minimatch$2(pattern, options);
  list = list.filter(function (f) {
    return mm.match(f)
  });
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list
};

Minimatch$2.prototype.match = function match (f, partial) {
  if (typeof partial === 'undefined') partial = this.partial;
  this.debug('match', f, this.pattern);
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options;

  // windows: need to use /, not \
  if (path$8.sep !== '/') {
    f = f.split(path$8.sep).join('/');
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit$1);
  this.debug(this.pattern, 'split', f);

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set;
  this.debug(this.pattern, 'set', set);

  // Find the basename of the path by looking for the last non-empty segment
  var filename;
  var i;
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i];
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i];
    var file = f;
    if (options.matchBase && pattern.length === 1) {
      file = [filename];
    }
    var hit = this.matchOne(file, pattern, partial);
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
};

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch$2.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options;

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern });

  this.debug('matchOne', file.length, pattern.length);

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop');
    var p = pattern[pi];
    var f = file[fi];

    this.debug(pattern, p, f);

    // should be impossible.
    // some invalid regexp stuff in the set.
    /* istanbul ignore if */
    if (p === false) return false

    if (p === GLOBSTAR$1) {
      this.debug('GLOBSTAR', [pattern, p, f]);

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi;
      var pr = pi + 1;
      if (pr === pl) {
        this.debug('** at the end');
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr];

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee);

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee);
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr);
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue');
          fr++;
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      /* istanbul ignore if */
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr);
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit;
    if (typeof p === 'string') {
      hit = f === p;
      this.debug('string match', p, f, hit);
    } else {
      hit = f.match(p);
      this.debug('pattern match', p, f, hit);
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else /* istanbul ignore else */ if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    return (fi === fl - 1) && (file[fi] === '')
  }

  // should be unreachable.
  /* istanbul ignore next */
  throw new Error('wtf?')
};

// replace stuff like \* with *
function globUnescape$1 (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape$1 (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

var inherits_browser = {exports: {}};

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  inherits_browser.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    }
  };
} else {
  // old school shim for old browsers
  inherits_browser.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function () {};
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    }
  };
}

var inherits_browserExports = inherits_browser.exports;

var pathIsAbsolute = {exports: {}};

function posix(path) {
	return path.charAt(0) === '/';
}

function win32(path) {
	// https://github.com/nodejs/node/blob/b3fcc245fb25539909ef1d5eaa01dbf92e168633/lib/path.js#L56
	var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
	var result = splitDeviceRe.exec(path);
	var device = result[1] || '';
	var isUnc = Boolean(device && device.charAt(1) !== ':');

	// UNC paths are always absolute
	return Boolean(result[2] || isUnc);
}

pathIsAbsolute.exports = process.platform === 'win32' ? win32 : posix;
pathIsAbsolute.exports.posix = posix;
pathIsAbsolute.exports.win32 = win32;

var pathIsAbsoluteExports = pathIsAbsolute.exports;

var common = {};

common.setopts = setopts;
common.ownProp = ownProp;
common.makeAbs = makeAbs;
common.finish = finish;
common.mark = mark;
common.isIgnored = isIgnored;
common.childrenIgnored = childrenIgnored;

function ownProp (obj, field) {
  return Object.prototype.hasOwnProperty.call(obj, field)
}

var fs$5 = require$$1;
var path$7 = require$$0$1;
var minimatch$1 = minimatch_1$1;
var isAbsolute = pathIsAbsoluteExports;
var Minimatch$1 = minimatch$1.Minimatch;

function alphasort (a, b) {
  return a.localeCompare(b, 'en')
}

function setupIgnores (self, options) {
  self.ignore = options.ignore || [];

  if (!Array.isArray(self.ignore))
    self.ignore = [self.ignore];

  if (self.ignore.length) {
    self.ignore = self.ignore.map(ignoreMap);
  }
}

// ignore patterns are always in dot:true mode.
function ignoreMap (pattern) {
  var gmatcher = null;
  if (pattern.slice(-3) === '/**') {
    var gpattern = pattern.replace(/(\/\*\*)+$/, '');
    gmatcher = new Minimatch$1(gpattern, { dot: true });
  }

  return {
    matcher: new Minimatch$1(pattern, { dot: true }),
    gmatcher: gmatcher
  }
}

function setopts (self, pattern, options) {
  if (!options)
    options = {};

  // base-matching: just use globstar for that.
  if (options.matchBase && -1 === pattern.indexOf("/")) {
    if (options.noglobstar) {
      throw new Error("base matching requires globstar")
    }
    pattern = "**/" + pattern;
  }

  self.silent = !!options.silent;
  self.pattern = pattern;
  self.strict = options.strict !== false;
  self.realpath = !!options.realpath;
  self.realpathCache = options.realpathCache || Object.create(null);
  self.follow = !!options.follow;
  self.dot = !!options.dot;
  self.mark = !!options.mark;
  self.nodir = !!options.nodir;
  if (self.nodir)
    self.mark = true;
  self.sync = !!options.sync;
  self.nounique = !!options.nounique;
  self.nonull = !!options.nonull;
  self.nosort = !!options.nosort;
  self.nocase = !!options.nocase;
  self.stat = !!options.stat;
  self.noprocess = !!options.noprocess;
  self.absolute = !!options.absolute;
  self.fs = options.fs || fs$5;

  self.maxLength = options.maxLength || Infinity;
  self.cache = options.cache || Object.create(null);
  self.statCache = options.statCache || Object.create(null);
  self.symlinks = options.symlinks || Object.create(null);

  setupIgnores(self, options);

  self.changedCwd = false;
  var cwd = process.cwd();
  if (!ownProp(options, "cwd"))
    self.cwd = cwd;
  else {
    self.cwd = path$7.resolve(options.cwd);
    self.changedCwd = self.cwd !== cwd;
  }

  self.root = options.root || path$7.resolve(self.cwd, "/");
  self.root = path$7.resolve(self.root);
  if (process.platform === "win32")
    self.root = self.root.replace(/\\/g, "/");

  // TODO: is an absolute `cwd` supposed to be resolved against `root`?
  // e.g. { cwd: '/test', root: __dirname } === path.join(__dirname, '/test')
  self.cwdAbs = isAbsolute(self.cwd) ? self.cwd : makeAbs(self, self.cwd);
  if (process.platform === "win32")
    self.cwdAbs = self.cwdAbs.replace(/\\/g, "/");
  self.nomount = !!options.nomount;

  // disable comments and negation in Minimatch.
  // Note that they are not supported in Glob itself anyway.
  options.nonegate = true;
  options.nocomment = true;
  // always treat \ in patterns as escapes, not path separators
  options.allowWindowsEscape = false;

  self.minimatch = new Minimatch$1(pattern, options);
  self.options = self.minimatch.options;
}

function finish (self) {
  var nou = self.nounique;
  var all = nou ? [] : Object.create(null);

  for (var i = 0, l = self.matches.length; i < l; i ++) {
    var matches = self.matches[i];
    if (!matches || Object.keys(matches).length === 0) {
      if (self.nonull) {
        // do like the shell, and spit out the literal glob
        var literal = self.minimatch.globSet[i];
        if (nou)
          all.push(literal);
        else
          all[literal] = true;
      }
    } else {
      // had matches
      var m = Object.keys(matches);
      if (nou)
        all.push.apply(all, m);
      else
        m.forEach(function (m) {
          all[m] = true;
        });
    }
  }

  if (!nou)
    all = Object.keys(all);

  if (!self.nosort)
    all = all.sort(alphasort);

  // at *some* point we statted all of these
  if (self.mark) {
    for (var i = 0; i < all.length; i++) {
      all[i] = self._mark(all[i]);
    }
    if (self.nodir) {
      all = all.filter(function (e) {
        var notDir = !(/\/$/.test(e));
        var c = self.cache[e] || self.cache[makeAbs(self, e)];
        if (notDir && c)
          notDir = c !== 'DIR' && !Array.isArray(c);
        return notDir
      });
    }
  }

  if (self.ignore.length)
    all = all.filter(function(m) {
      return !isIgnored(self, m)
    });

  self.found = all;
}

function mark (self, p) {
  var abs = makeAbs(self, p);
  var c = self.cache[abs];
  var m = p;
  if (c) {
    var isDir = c === 'DIR' || Array.isArray(c);
    var slash = p.slice(-1) === '/';

    if (isDir && !slash)
      m += '/';
    else if (!isDir && slash)
      m = m.slice(0, -1);

    if (m !== p) {
      var mabs = makeAbs(self, m);
      self.statCache[mabs] = self.statCache[abs];
      self.cache[mabs] = self.cache[abs];
    }
  }

  return m
}

// lotta situps...
function makeAbs (self, f) {
  var abs = f;
  if (f.charAt(0) === '/') {
    abs = path$7.join(self.root, f);
  } else if (isAbsolute(f) || f === '') {
    abs = f;
  } else if (self.changedCwd) {
    abs = path$7.resolve(self.cwd, f);
  } else {
    abs = path$7.resolve(f);
  }

  if (process.platform === 'win32')
    abs = abs.replace(/\\/g, '/');

  return abs
}


// Return true, if pattern ends with globstar '**', for the accompanying parent directory.
// Ex:- If node_modules/** is the pattern, add 'node_modules' to ignore list along with it's contents
function isIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return item.matcher.match(path) || !!(item.gmatcher && item.gmatcher.match(path))
  })
}

function childrenIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return !!(item.gmatcher && item.gmatcher.match(path))
  })
}

var sync$1;
var hasRequiredSync;

function requireSync () {
	if (hasRequiredSync) return sync$1;
	hasRequiredSync = 1;
	sync$1 = globSync;
	globSync.GlobSync = GlobSync;

	var rp = fs_realpath;
	var minimatch = minimatch_1$1;
	minimatch.Minimatch;
	requireGlob().Glob;
	var path = require$$0$1;
	var assert = require$$5;
	var isAbsolute = pathIsAbsoluteExports;
	var common$1 = common;
	var setopts = common$1.setopts;
	var ownProp = common$1.ownProp;
	var childrenIgnored = common$1.childrenIgnored;
	var isIgnored = common$1.isIgnored;

	function globSync (pattern, options) {
	  if (typeof options === 'function' || arguments.length === 3)
	    throw new TypeError('callback provided to sync glob\n'+
	                        'See: https://github.com/isaacs/node-glob/issues/167')

	  return new GlobSync(pattern, options).found
	}

	function GlobSync (pattern, options) {
	  if (!pattern)
	    throw new Error('must provide pattern')

	  if (typeof options === 'function' || arguments.length === 3)
	    throw new TypeError('callback provided to sync glob\n'+
	                        'See: https://github.com/isaacs/node-glob/issues/167')

	  if (!(this instanceof GlobSync))
	    return new GlobSync(pattern, options)

	  setopts(this, pattern, options);

	  if (this.noprocess)
	    return this

	  var n = this.minimatch.set.length;
	  this.matches = new Array(n);
	  for (var i = 0; i < n; i ++) {
	    this._process(this.minimatch.set[i], i, false);
	  }
	  this._finish();
	}

	GlobSync.prototype._finish = function () {
	  assert.ok(this instanceof GlobSync);
	  if (this.realpath) {
	    var self = this;
	    this.matches.forEach(function (matchset, index) {
	      var set = self.matches[index] = Object.create(null);
	      for (var p in matchset) {
	        try {
	          p = self._makeAbs(p);
	          var real = rp.realpathSync(p, self.realpathCache);
	          set[real] = true;
	        } catch (er) {
	          if (er.syscall === 'stat')
	            set[self._makeAbs(p)] = true;
	          else
	            throw er
	        }
	      }
	    });
	  }
	  common$1.finish(this);
	};


	GlobSync.prototype._process = function (pattern, index, inGlobStar) {
	  assert.ok(this instanceof GlobSync);

	  // Get the first [n] parts of pattern that are all strings.
	  var n = 0;
	  while (typeof pattern[n] === 'string') {
	    n ++;
	  }
	  // now n is the index of the first one that is *not* a string.

	  // See if there's anything else
	  var prefix;
	  switch (n) {
	    // if not, then this is rather simple
	    case pattern.length:
	      this._processSimple(pattern.join('/'), index);
	      return

	    case 0:
	      // pattern *starts* with some non-trivial item.
	      // going to readdir(cwd), but not include the prefix in matches.
	      prefix = null;
	      break

	    default:
	      // pattern has some string bits in the front.
	      // whatever it starts with, whether that's 'absolute' like /foo/bar,
	      // or 'relative' like '../baz'
	      prefix = pattern.slice(0, n).join('/');
	      break
	  }

	  var remain = pattern.slice(n);

	  // get the list of entries.
	  var read;
	  if (prefix === null)
	    read = '.';
	  else if (isAbsolute(prefix) ||
	      isAbsolute(pattern.map(function (p) {
	        return typeof p === 'string' ? p : '[*]'
	      }).join('/'))) {
	    if (!prefix || !isAbsolute(prefix))
	      prefix = '/' + prefix;
	    read = prefix;
	  } else
	    read = prefix;

	  var abs = this._makeAbs(read);

	  //if ignored, skip processing
	  if (childrenIgnored(this, read))
	    return

	  var isGlobStar = remain[0] === minimatch.GLOBSTAR;
	  if (isGlobStar)
	    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar);
	  else
	    this._processReaddir(prefix, read, abs, remain, index, inGlobStar);
	};


	GlobSync.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar) {
	  var entries = this._readdir(abs, inGlobStar);

	  // if the abs isn't a dir, then nothing can match!
	  if (!entries)
	    return

	  // It will only match dot entries if it starts with a dot, or if
	  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
	  var pn = remain[0];
	  var negate = !!this.minimatch.negate;
	  var rawGlob = pn._glob;
	  var dotOk = this.dot || rawGlob.charAt(0) === '.';

	  var matchedEntries = [];
	  for (var i = 0; i < entries.length; i++) {
	    var e = entries[i];
	    if (e.charAt(0) !== '.' || dotOk) {
	      var m;
	      if (negate && !prefix) {
	        m = !e.match(pn);
	      } else {
	        m = e.match(pn);
	      }
	      if (m)
	        matchedEntries.push(e);
	    }
	  }

	  var len = matchedEntries.length;
	  // If there are no matched entries, then nothing matches.
	  if (len === 0)
	    return

	  // if this is the last remaining pattern bit, then no need for
	  // an additional stat *unless* the user has specified mark or
	  // stat explicitly.  We know they exist, since readdir returned
	  // them.

	  if (remain.length === 1 && !this.mark && !this.stat) {
	    if (!this.matches[index])
	      this.matches[index] = Object.create(null);

	    for (var i = 0; i < len; i ++) {
	      var e = matchedEntries[i];
	      if (prefix) {
	        if (prefix.slice(-1) !== '/')
	          e = prefix + '/' + e;
	        else
	          e = prefix + e;
	      }

	      if (e.charAt(0) === '/' && !this.nomount) {
	        e = path.join(this.root, e);
	      }
	      this._emitMatch(index, e);
	    }
	    // This was the last one, and no stats were needed
	    return
	  }

	  // now test all matched entries as stand-ins for that part
	  // of the pattern.
	  remain.shift();
	  for (var i = 0; i < len; i ++) {
	    var e = matchedEntries[i];
	    var newPattern;
	    if (prefix)
	      newPattern = [prefix, e];
	    else
	      newPattern = [e];
	    this._process(newPattern.concat(remain), index, inGlobStar);
	  }
	};


	GlobSync.prototype._emitMatch = function (index, e) {
	  if (isIgnored(this, e))
	    return

	  var abs = this._makeAbs(e);

	  if (this.mark)
	    e = this._mark(e);

	  if (this.absolute) {
	    e = abs;
	  }

	  if (this.matches[index][e])
	    return

	  if (this.nodir) {
	    var c = this.cache[abs];
	    if (c === 'DIR' || Array.isArray(c))
	      return
	  }

	  this.matches[index][e] = true;

	  if (this.stat)
	    this._stat(e);
	};


	GlobSync.prototype._readdirInGlobStar = function (abs) {
	  // follow all symlinked directories forever
	  // just proceed as if this is a non-globstar situation
	  if (this.follow)
	    return this._readdir(abs, false)

	  var entries;
	  var lstat;
	  try {
	    lstat = this.fs.lstatSync(abs);
	  } catch (er) {
	    if (er.code === 'ENOENT') {
	      // lstat failed, doesn't exist
	      return null
	    }
	  }

	  var isSym = lstat && lstat.isSymbolicLink();
	  this.symlinks[abs] = isSym;

	  // If it's not a symlink or a dir, then it's definitely a regular file.
	  // don't bother doing a readdir in that case.
	  if (!isSym && lstat && !lstat.isDirectory())
	    this.cache[abs] = 'FILE';
	  else
	    entries = this._readdir(abs, false);

	  return entries
	};

	GlobSync.prototype._readdir = function (abs, inGlobStar) {

	  if (inGlobStar && !ownProp(this.symlinks, abs))
	    return this._readdirInGlobStar(abs)

	  if (ownProp(this.cache, abs)) {
	    var c = this.cache[abs];
	    if (!c || c === 'FILE')
	      return null

	    if (Array.isArray(c))
	      return c
	  }

	  try {
	    return this._readdirEntries(abs, this.fs.readdirSync(abs))
	  } catch (er) {
	    this._readdirError(abs, er);
	    return null
	  }
	};

	GlobSync.prototype._readdirEntries = function (abs, entries) {
	  // if we haven't asked to stat everything, then just
	  // assume that everything in there exists, so we can avoid
	  // having to stat it a second time.
	  if (!this.mark && !this.stat) {
	    for (var i = 0; i < entries.length; i ++) {
	      var e = entries[i];
	      if (abs === '/')
	        e = abs + e;
	      else
	        e = abs + '/' + e;
	      this.cache[e] = true;
	    }
	  }

	  this.cache[abs] = entries;

	  // mark and cache dir-ness
	  return entries
	};

	GlobSync.prototype._readdirError = function (f, er) {
	  // handle errors, and cache the information
	  switch (er.code) {
	    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
	    case 'ENOTDIR': // totally normal. means it *does* exist.
	      var abs = this._makeAbs(f);
	      this.cache[abs] = 'FILE';
	      if (abs === this.cwdAbs) {
	        var error = new Error(er.code + ' invalid cwd ' + this.cwd);
	        error.path = this.cwd;
	        error.code = er.code;
	        throw error
	      }
	      break

	    case 'ENOENT': // not terribly unusual
	    case 'ELOOP':
	    case 'ENAMETOOLONG':
	    case 'UNKNOWN':
	      this.cache[this._makeAbs(f)] = false;
	      break

	    default: // some unusual error.  Treat as failure.
	      this.cache[this._makeAbs(f)] = false;
	      if (this.strict)
	        throw er
	      if (!this.silent)
	        console.error('glob error', er);
	      break
	  }
	};

	GlobSync.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar) {

	  var entries = this._readdir(abs, inGlobStar);

	  // no entries means not a dir, so it can never have matches
	  // foo.txt/** doesn't match foo.txt
	  if (!entries)
	    return

	  // test without the globstar, and with every child both below
	  // and replacing the globstar.
	  var remainWithoutGlobStar = remain.slice(1);
	  var gspref = prefix ? [ prefix ] : [];
	  var noGlobStar = gspref.concat(remainWithoutGlobStar);

	  // the noGlobStar pattern exits the inGlobStar state
	  this._process(noGlobStar, index, false);

	  var len = entries.length;
	  var isSym = this.symlinks[abs];

	  // If it's a symlink, and we're in a globstar, then stop
	  if (isSym && inGlobStar)
	    return

	  for (var i = 0; i < len; i++) {
	    var e = entries[i];
	    if (e.charAt(0) === '.' && !this.dot)
	      continue

	    // these two cases enter the inGlobStar state
	    var instead = gspref.concat(entries[i], remainWithoutGlobStar);
	    this._process(instead, index, true);

	    var below = gspref.concat(entries[i], remain);
	    this._process(below, index, true);
	  }
	};

	GlobSync.prototype._processSimple = function (prefix, index) {
	  // XXX review this.  Shouldn't it be doing the mounting etc
	  // before doing stat?  kinda weird?
	  var exists = this._stat(prefix);

	  if (!this.matches[index])
	    this.matches[index] = Object.create(null);

	  // If it doesn't exist, then just mark the lack of results
	  if (!exists)
	    return

	  if (prefix && isAbsolute(prefix) && !this.nomount) {
	    var trail = /[\/\\]$/.test(prefix);
	    if (prefix.charAt(0) === '/') {
	      prefix = path.join(this.root, prefix);
	    } else {
	      prefix = path.resolve(this.root, prefix);
	      if (trail)
	        prefix += '/';
	    }
	  }

	  if (process.platform === 'win32')
	    prefix = prefix.replace(/\\/g, '/');

	  // Mark this as a match
	  this._emitMatch(index, prefix);
	};

	// Returns either 'DIR', 'FILE', or false
	GlobSync.prototype._stat = function (f) {
	  var abs = this._makeAbs(f);
	  var needDir = f.slice(-1) === '/';

	  if (f.length > this.maxLength)
	    return false

	  if (!this.stat && ownProp(this.cache, abs)) {
	    var c = this.cache[abs];

	    if (Array.isArray(c))
	      c = 'DIR';

	    // It exists, but maybe not how we need it
	    if (!needDir || c === 'DIR')
	      return c

	    if (needDir && c === 'FILE')
	      return false

	    // otherwise we have to stat, because maybe c=true
	    // if we know it exists, but not what it is.
	  }
	  var stat = this.statCache[abs];
	  if (!stat) {
	    var lstat;
	    try {
	      lstat = this.fs.lstatSync(abs);
	    } catch (er) {
	      if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
	        this.statCache[abs] = false;
	        return false
	      }
	    }

	    if (lstat && lstat.isSymbolicLink()) {
	      try {
	        stat = this.fs.statSync(abs);
	      } catch (er) {
	        stat = lstat;
	      }
	    } else {
	      stat = lstat;
	    }
	  }

	  this.statCache[abs] = stat;

	  var c = true;
	  if (stat)
	    c = stat.isDirectory() ? 'DIR' : 'FILE';

	  this.cache[abs] = this.cache[abs] || c;

	  if (needDir && c === 'FILE')
	    return false

	  return c
	};

	GlobSync.prototype._mark = function (p) {
	  return common$1.mark(this, p)
	};

	GlobSync.prototype._makeAbs = function (f) {
	  return common$1.makeAbs(this, f)
	};
	return sync$1;
}

// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
var wrappy_1 = wrappy$2;
function wrappy$2 (fn, cb) {
  if (fn && cb) return wrappy$2(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k];
  });

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    var ret = fn.apply(this, args);
    var cb = args[args.length-1];
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k];
      });
    }
    return ret
  }
}

var once$4 = {exports: {}};

var wrappy$1 = wrappy_1;
once$4.exports = wrappy$1(once$3);
once$4.exports.strict = wrappy$1(onceStrict);

once$3.proto = once$3(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once$3(this)
    },
    configurable: true
  });

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  });
});

function once$3 (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true;
    return f.value = fn.apply(this, arguments)
  };
  f.called = false;
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true;
    return f.value = fn.apply(this, arguments)
  };
  var name = fn.name || 'Function wrapped with `once`';
  f.onceError = name + " shouldn't be called more than once";
  f.called = false;
  return f
}

var onceExports = once$4.exports;

var wrappy = wrappy_1;
var reqs = Object.create(null);
var once$2 = onceExports;

var inflight_1 = wrappy(inflight);

function inflight (key, cb) {
  if (reqs[key]) {
    reqs[key].push(cb);
    return null
  } else {
    reqs[key] = [cb];
    return makeres(key)
  }
}

function makeres (key) {
  return once$2(function RES () {
    var cbs = reqs[key];
    var len = cbs.length;
    var args = slice(arguments);

    // XXX It's somewhat ambiguous whether a new callback added in this
    // pass should be queued for later execution if something in the
    // list of callbacks throws, or if it should just be discarded.
    // However, it's such an edge case that it hardly matters, and either
    // choice is likely as surprising as the other.
    // As it happens, we do go ahead and schedule it for later execution.
    try {
      for (var i = 0; i < len; i++) {
        cbs[i].apply(null, args);
      }
    } finally {
      if (cbs.length > len) {
        // added more in the interim.
        // de-zalgo, just in case, but don't call again.
        cbs.splice(0, len);
        process.nextTick(function () {
          RES.apply(null, args);
        });
      } else {
        delete reqs[key];
      }
    }
  })
}

function slice (args) {
  var length = args.length;
  var array = [];

  for (var i = 0; i < length; i++) array[i] = args[i];
  return array
}

var glob_1;
var hasRequiredGlob;

function requireGlob () {
	if (hasRequiredGlob) return glob_1;
	hasRequiredGlob = 1;
	// Approach:
	//
	// 1. Get the minimatch set
	// 2. For each pattern in the set, PROCESS(pattern, false)
	// 3. Store matches per-set, then uniq them
	//
	// PROCESS(pattern, inGlobStar)
	// Get the first [n] items from pattern that are all strings
	// Join these together.  This is PREFIX.
	//   If there is no more remaining, then stat(PREFIX) and
	//   add to matches if it succeeds.  END.
	//
	// If inGlobStar and PREFIX is symlink and points to dir
	//   set ENTRIES = []
	// else readdir(PREFIX) as ENTRIES
	//   If fail, END
	//
	// with ENTRIES
	//   If pattern[n] is GLOBSTAR
	//     // handle the case where the globstar match is empty
	//     // by pruning it out, and testing the resulting pattern
	//     PROCESS(pattern[0..n] + pattern[n+1 .. $], false)
	//     // handle other cases.
	//     for ENTRY in ENTRIES (not dotfiles)
	//       // attach globstar + tail onto the entry
	//       // Mark that this entry is a globstar match
	//       PROCESS(pattern[0..n] + ENTRY + pattern[n .. $], true)
	//
	//   else // not globstar
	//     for ENTRY in ENTRIES (not dotfiles, unless pattern[n] is dot)
	//       Test ENTRY against pattern[n]
	//       If fails, continue
	//       If passes, PROCESS(pattern[0..n] + item + pattern[n+1 .. $])
	//
	// Caveat:
	//   Cache all stats and readdirs results to minimize syscall.  Since all
	//   we ever care about is existence and directory-ness, we can just keep
	//   `true` for files, and [children,...] for directories, or `false` for
	//   things that don't exist.

	glob_1 = glob;

	var rp = fs_realpath;
	var minimatch = minimatch_1$1;
	minimatch.Minimatch;
	var inherits = inherits_browserExports;
	var EE = require$$2.EventEmitter;
	var path = require$$0$1;
	var assert = require$$5;
	var isAbsolute = pathIsAbsoluteExports;
	var globSync = requireSync();
	var common$1 = common;
	var setopts = common$1.setopts;
	var ownProp = common$1.ownProp;
	var inflight = inflight_1;
	var childrenIgnored = common$1.childrenIgnored;
	var isIgnored = common$1.isIgnored;

	var once = onceExports;

	function glob (pattern, options, cb) {
	  if (typeof options === 'function') cb = options, options = {};
	  if (!options) options = {};

	  if (options.sync) {
	    if (cb)
	      throw new TypeError('callback provided to sync glob')
	    return globSync(pattern, options)
	  }

	  return new Glob(pattern, options, cb)
	}

	glob.sync = globSync;
	var GlobSync = glob.GlobSync = globSync.GlobSync;

	// old api surface
	glob.glob = glob;

	function extend (origin, add) {
	  if (add === null || typeof add !== 'object') {
	    return origin
	  }

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin
	}

	glob.hasMagic = function (pattern, options_) {
	  var options = extend({}, options_);
	  options.noprocess = true;

	  var g = new Glob(pattern, options);
	  var set = g.minimatch.set;

	  if (!pattern)
	    return false

	  if (set.length > 1)
	    return true

	  for (var j = 0; j < set[0].length; j++) {
	    if (typeof set[0][j] !== 'string')
	      return true
	  }

	  return false
	};

	glob.Glob = Glob;
	inherits(Glob, EE);
	function Glob (pattern, options, cb) {
	  if (typeof options === 'function') {
	    cb = options;
	    options = null;
	  }

	  if (options && options.sync) {
	    if (cb)
	      throw new TypeError('callback provided to sync glob')
	    return new GlobSync(pattern, options)
	  }

	  if (!(this instanceof Glob))
	    return new Glob(pattern, options, cb)

	  setopts(this, pattern, options);
	  this._didRealPath = false;

	  // process each pattern in the minimatch set
	  var n = this.minimatch.set.length;

	  // The matches are stored as {<filename>: true,...} so that
	  // duplicates are automagically pruned.
	  // Later, we do an Object.keys() on these.
	  // Keep them as a list so we can fill in when nonull is set.
	  this.matches = new Array(n);

	  if (typeof cb === 'function') {
	    cb = once(cb);
	    this.on('error', cb);
	    this.on('end', function (matches) {
	      cb(null, matches);
	    });
	  }

	  var self = this;
	  this._processing = 0;

	  this._emitQueue = [];
	  this._processQueue = [];
	  this.paused = false;

	  if (this.noprocess)
	    return this

	  if (n === 0)
	    return done()

	  var sync = true;
	  for (var i = 0; i < n; i ++) {
	    this._process(this.minimatch.set[i], i, false, done);
	  }
	  sync = false;

	  function done () {
	    --self._processing;
	    if (self._processing <= 0) {
	      if (sync) {
	        process.nextTick(function () {
	          self._finish();
	        });
	      } else {
	        self._finish();
	      }
	    }
	  }
	}

	Glob.prototype._finish = function () {
	  assert(this instanceof Glob);
	  if (this.aborted)
	    return

	  if (this.realpath && !this._didRealpath)
	    return this._realpath()

	  common$1.finish(this);
	  this.emit('end', this.found);
	};

	Glob.prototype._realpath = function () {
	  if (this._didRealpath)
	    return

	  this._didRealpath = true;

	  var n = this.matches.length;
	  if (n === 0)
	    return this._finish()

	  var self = this;
	  for (var i = 0; i < this.matches.length; i++)
	    this._realpathSet(i, next);

	  function next () {
	    if (--n === 0)
	      self._finish();
	  }
	};

	Glob.prototype._realpathSet = function (index, cb) {
	  var matchset = this.matches[index];
	  if (!matchset)
	    return cb()

	  var found = Object.keys(matchset);
	  var self = this;
	  var n = found.length;

	  if (n === 0)
	    return cb()

	  var set = this.matches[index] = Object.create(null);
	  found.forEach(function (p, i) {
	    // If there's a problem with the stat, then it means that
	    // one or more of the links in the realpath couldn't be
	    // resolved.  just return the abs value in that case.
	    p = self._makeAbs(p);
	    rp.realpath(p, self.realpathCache, function (er, real) {
	      if (!er)
	        set[real] = true;
	      else if (er.syscall === 'stat')
	        set[p] = true;
	      else
	        self.emit('error', er); // srsly wtf right here

	      if (--n === 0) {
	        self.matches[index] = set;
	        cb();
	      }
	    });
	  });
	};

	Glob.prototype._mark = function (p) {
	  return common$1.mark(this, p)
	};

	Glob.prototype._makeAbs = function (f) {
	  return common$1.makeAbs(this, f)
	};

	Glob.prototype.abort = function () {
	  this.aborted = true;
	  this.emit('abort');
	};

	Glob.prototype.pause = function () {
	  if (!this.paused) {
	    this.paused = true;
	    this.emit('pause');
	  }
	};

	Glob.prototype.resume = function () {
	  if (this.paused) {
	    this.emit('resume');
	    this.paused = false;
	    if (this._emitQueue.length) {
	      var eq = this._emitQueue.slice(0);
	      this._emitQueue.length = 0;
	      for (var i = 0; i < eq.length; i ++) {
	        var e = eq[i];
	        this._emitMatch(e[0], e[1]);
	      }
	    }
	    if (this._processQueue.length) {
	      var pq = this._processQueue.slice(0);
	      this._processQueue.length = 0;
	      for (var i = 0; i < pq.length; i ++) {
	        var p = pq[i];
	        this._processing--;
	        this._process(p[0], p[1], p[2], p[3]);
	      }
	    }
	  }
	};

	Glob.prototype._process = function (pattern, index, inGlobStar, cb) {
	  assert(this instanceof Glob);
	  assert(typeof cb === 'function');

	  if (this.aborted)
	    return

	  this._processing++;
	  if (this.paused) {
	    this._processQueue.push([pattern, index, inGlobStar, cb]);
	    return
	  }

	  //console.error('PROCESS %d', this._processing, pattern)

	  // Get the first [n] parts of pattern that are all strings.
	  var n = 0;
	  while (typeof pattern[n] === 'string') {
	    n ++;
	  }
	  // now n is the index of the first one that is *not* a string.

	  // see if there's anything else
	  var prefix;
	  switch (n) {
	    // if not, then this is rather simple
	    case pattern.length:
	      this._processSimple(pattern.join('/'), index, cb);
	      return

	    case 0:
	      // pattern *starts* with some non-trivial item.
	      // going to readdir(cwd), but not include the prefix in matches.
	      prefix = null;
	      break

	    default:
	      // pattern has some string bits in the front.
	      // whatever it starts with, whether that's 'absolute' like /foo/bar,
	      // or 'relative' like '../baz'
	      prefix = pattern.slice(0, n).join('/');
	      break
	  }

	  var remain = pattern.slice(n);

	  // get the list of entries.
	  var read;
	  if (prefix === null)
	    read = '.';
	  else if (isAbsolute(prefix) ||
	      isAbsolute(pattern.map(function (p) {
	        return typeof p === 'string' ? p : '[*]'
	      }).join('/'))) {
	    if (!prefix || !isAbsolute(prefix))
	      prefix = '/' + prefix;
	    read = prefix;
	  } else
	    read = prefix;

	  var abs = this._makeAbs(read);

	  //if ignored, skip _processing
	  if (childrenIgnored(this, read))
	    return cb()

	  var isGlobStar = remain[0] === minimatch.GLOBSTAR;
	  if (isGlobStar)
	    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb);
	  else
	    this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb);
	};

	Glob.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar, cb) {
	  var self = this;
	  this._readdir(abs, inGlobStar, function (er, entries) {
	    return self._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
	  });
	};

	Glob.prototype._processReaddir2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {

	  // if the abs isn't a dir, then nothing can match!
	  if (!entries)
	    return cb()

	  // It will only match dot entries if it starts with a dot, or if
	  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
	  var pn = remain[0];
	  var negate = !!this.minimatch.negate;
	  var rawGlob = pn._glob;
	  var dotOk = this.dot || rawGlob.charAt(0) === '.';

	  var matchedEntries = [];
	  for (var i = 0; i < entries.length; i++) {
	    var e = entries[i];
	    if (e.charAt(0) !== '.' || dotOk) {
	      var m;
	      if (negate && !prefix) {
	        m = !e.match(pn);
	      } else {
	        m = e.match(pn);
	      }
	      if (m)
	        matchedEntries.push(e);
	    }
	  }

	  //console.error('prd2', prefix, entries, remain[0]._glob, matchedEntries)

	  var len = matchedEntries.length;
	  // If there are no matched entries, then nothing matches.
	  if (len === 0)
	    return cb()

	  // if this is the last remaining pattern bit, then no need for
	  // an additional stat *unless* the user has specified mark or
	  // stat explicitly.  We know they exist, since readdir returned
	  // them.

	  if (remain.length === 1 && !this.mark && !this.stat) {
	    if (!this.matches[index])
	      this.matches[index] = Object.create(null);

	    for (var i = 0; i < len; i ++) {
	      var e = matchedEntries[i];
	      if (prefix) {
	        if (prefix !== '/')
	          e = prefix + '/' + e;
	        else
	          e = prefix + e;
	      }

	      if (e.charAt(0) === '/' && !this.nomount) {
	        e = path.join(this.root, e);
	      }
	      this._emitMatch(index, e);
	    }
	    // This was the last one, and no stats were needed
	    return cb()
	  }

	  // now test all matched entries as stand-ins for that part
	  // of the pattern.
	  remain.shift();
	  for (var i = 0; i < len; i ++) {
	    var e = matchedEntries[i];
	    if (prefix) {
	      if (prefix !== '/')
	        e = prefix + '/' + e;
	      else
	        e = prefix + e;
	    }
	    this._process([e].concat(remain), index, inGlobStar, cb);
	  }
	  cb();
	};

	Glob.prototype._emitMatch = function (index, e) {
	  if (this.aborted)
	    return

	  if (isIgnored(this, e))
	    return

	  if (this.paused) {
	    this._emitQueue.push([index, e]);
	    return
	  }

	  var abs = isAbsolute(e) ? e : this._makeAbs(e);

	  if (this.mark)
	    e = this._mark(e);

	  if (this.absolute)
	    e = abs;

	  if (this.matches[index][e])
	    return

	  if (this.nodir) {
	    var c = this.cache[abs];
	    if (c === 'DIR' || Array.isArray(c))
	      return
	  }

	  this.matches[index][e] = true;

	  var st = this.statCache[abs];
	  if (st)
	    this.emit('stat', e, st);

	  this.emit('match', e);
	};

	Glob.prototype._readdirInGlobStar = function (abs, cb) {
	  if (this.aborted)
	    return

	  // follow all symlinked directories forever
	  // just proceed as if this is a non-globstar situation
	  if (this.follow)
	    return this._readdir(abs, false, cb)

	  var lstatkey = 'lstat\0' + abs;
	  var self = this;
	  var lstatcb = inflight(lstatkey, lstatcb_);

	  if (lstatcb)
	    self.fs.lstat(abs, lstatcb);

	  function lstatcb_ (er, lstat) {
	    if (er && er.code === 'ENOENT')
	      return cb()

	    var isSym = lstat && lstat.isSymbolicLink();
	    self.symlinks[abs] = isSym;

	    // If it's not a symlink or a dir, then it's definitely a regular file.
	    // don't bother doing a readdir in that case.
	    if (!isSym && lstat && !lstat.isDirectory()) {
	      self.cache[abs] = 'FILE';
	      cb();
	    } else
	      self._readdir(abs, false, cb);
	  }
	};

	Glob.prototype._readdir = function (abs, inGlobStar, cb) {
	  if (this.aborted)
	    return

	  cb = inflight('readdir\0'+abs+'\0'+inGlobStar, cb);
	  if (!cb)
	    return

	  //console.error('RD %j %j', +inGlobStar, abs)
	  if (inGlobStar && !ownProp(this.symlinks, abs))
	    return this._readdirInGlobStar(abs, cb)

	  if (ownProp(this.cache, abs)) {
	    var c = this.cache[abs];
	    if (!c || c === 'FILE')
	      return cb()

	    if (Array.isArray(c))
	      return cb(null, c)
	  }

	  var self = this;
	  self.fs.readdir(abs, readdirCb(this, abs, cb));
	};

	function readdirCb (self, abs, cb) {
	  return function (er, entries) {
	    if (er)
	      self._readdirError(abs, er, cb);
	    else
	      self._readdirEntries(abs, entries, cb);
	  }
	}

	Glob.prototype._readdirEntries = function (abs, entries, cb) {
	  if (this.aborted)
	    return

	  // if we haven't asked to stat everything, then just
	  // assume that everything in there exists, so we can avoid
	  // having to stat it a second time.
	  if (!this.mark && !this.stat) {
	    for (var i = 0; i < entries.length; i ++) {
	      var e = entries[i];
	      if (abs === '/')
	        e = abs + e;
	      else
	        e = abs + '/' + e;
	      this.cache[e] = true;
	    }
	  }

	  this.cache[abs] = entries;
	  return cb(null, entries)
	};

	Glob.prototype._readdirError = function (f, er, cb) {
	  if (this.aborted)
	    return

	  // handle errors, and cache the information
	  switch (er.code) {
	    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
	    case 'ENOTDIR': // totally normal. means it *does* exist.
	      var abs = this._makeAbs(f);
	      this.cache[abs] = 'FILE';
	      if (abs === this.cwdAbs) {
	        var error = new Error(er.code + ' invalid cwd ' + this.cwd);
	        error.path = this.cwd;
	        error.code = er.code;
	        this.emit('error', error);
	        this.abort();
	      }
	      break

	    case 'ENOENT': // not terribly unusual
	    case 'ELOOP':
	    case 'ENAMETOOLONG':
	    case 'UNKNOWN':
	      this.cache[this._makeAbs(f)] = false;
	      break

	    default: // some unusual error.  Treat as failure.
	      this.cache[this._makeAbs(f)] = false;
	      if (this.strict) {
	        this.emit('error', er);
	        // If the error is handled, then we abort
	        // if not, we threw out of here
	        this.abort();
	      }
	      if (!this.silent)
	        console.error('glob error', er);
	      break
	  }

	  return cb()
	};

	Glob.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar, cb) {
	  var self = this;
	  this._readdir(abs, inGlobStar, function (er, entries) {
	    self._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb);
	  });
	};


	Glob.prototype._processGlobStar2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
	  //console.error('pgs2', prefix, remain[0], entries)

	  // no entries means not a dir, so it can never have matches
	  // foo.txt/** doesn't match foo.txt
	  if (!entries)
	    return cb()

	  // test without the globstar, and with every child both below
	  // and replacing the globstar.
	  var remainWithoutGlobStar = remain.slice(1);
	  var gspref = prefix ? [ prefix ] : [];
	  var noGlobStar = gspref.concat(remainWithoutGlobStar);

	  // the noGlobStar pattern exits the inGlobStar state
	  this._process(noGlobStar, index, false, cb);

	  var isSym = this.symlinks[abs];
	  var len = entries.length;

	  // If it's a symlink, and we're in a globstar, then stop
	  if (isSym && inGlobStar)
	    return cb()

	  for (var i = 0; i < len; i++) {
	    var e = entries[i];
	    if (e.charAt(0) === '.' && !this.dot)
	      continue

	    // these two cases enter the inGlobStar state
	    var instead = gspref.concat(entries[i], remainWithoutGlobStar);
	    this._process(instead, index, true, cb);

	    var below = gspref.concat(entries[i], remain);
	    this._process(below, index, true, cb);
	  }

	  cb();
	};

	Glob.prototype._processSimple = function (prefix, index, cb) {
	  // XXX review this.  Shouldn't it be doing the mounting etc
	  // before doing stat?  kinda weird?
	  var self = this;
	  this._stat(prefix, function (er, exists) {
	    self._processSimple2(prefix, index, er, exists, cb);
	  });
	};
	Glob.prototype._processSimple2 = function (prefix, index, er, exists, cb) {

	  //console.error('ps2', prefix, exists)

	  if (!this.matches[index])
	    this.matches[index] = Object.create(null);

	  // If it doesn't exist, then just mark the lack of results
	  if (!exists)
	    return cb()

	  if (prefix && isAbsolute(prefix) && !this.nomount) {
	    var trail = /[\/\\]$/.test(prefix);
	    if (prefix.charAt(0) === '/') {
	      prefix = path.join(this.root, prefix);
	    } else {
	      prefix = path.resolve(this.root, prefix);
	      if (trail)
	        prefix += '/';
	    }
	  }

	  if (process.platform === 'win32')
	    prefix = prefix.replace(/\\/g, '/');

	  // Mark this as a match
	  this._emitMatch(index, prefix);
	  cb();
	};

	// Returns either 'DIR', 'FILE', or false
	Glob.prototype._stat = function (f, cb) {
	  var abs = this._makeAbs(f);
	  var needDir = f.slice(-1) === '/';

	  if (f.length > this.maxLength)
	    return cb()

	  if (!this.stat && ownProp(this.cache, abs)) {
	    var c = this.cache[abs];

	    if (Array.isArray(c))
	      c = 'DIR';

	    // It exists, but maybe not how we need it
	    if (!needDir || c === 'DIR')
	      return cb(null, c)

	    if (needDir && c === 'FILE')
	      return cb()

	    // otherwise we have to stat, because maybe c=true
	    // if we know it exists, but not what it is.
	  }
	  var stat = this.statCache[abs];
	  if (stat !== undefined) {
	    if (stat === false)
	      return cb(null, stat)
	    else {
	      var type = stat.isDirectory() ? 'DIR' : 'FILE';
	      if (needDir && type === 'FILE')
	        return cb()
	      else
	        return cb(null, type, stat)
	    }
	  }

	  var self = this;
	  var statcb = inflight('stat\0' + abs, lstatcb_);
	  if (statcb)
	    self.fs.lstat(abs, statcb);

	  function lstatcb_ (er, lstat) {
	    if (lstat && lstat.isSymbolicLink()) {
	      // If it's a symlink, then treat it as the target, unless
	      // the target does not exist, then treat it as a file.
	      return self.fs.stat(abs, function (er, stat) {
	        if (er)
	          self._stat2(f, abs, null, lstat, cb);
	        else
	          self._stat2(f, abs, er, stat, cb);
	      })
	    } else {
	      self._stat2(f, abs, er, lstat, cb);
	    }
	  }
	};

	Glob.prototype._stat2 = function (f, abs, er, stat, cb) {
	  if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
	    this.statCache[abs] = false;
	    return cb()
	  }

	  var needDir = f.slice(-1) === '/';
	  this.statCache[abs] = stat;

	  if (abs.slice(-1) === '/' && stat && !stat.isDirectory())
	    return cb(null, false, stat)

	  var c = true;
	  if (stat)
	    c = stat.isDirectory() ? 'DIR' : 'FILE';
	  this.cache[abs] = this.cache[abs] || c;

	  if (needDir && c === 'FILE')
	    return cb()

	  return cb(null, c, stat)
	};
	return glob_1;
}

var hasRequiredCommon;

function requireCommon () {
	if (hasRequiredCommon) return common$1;
	hasRequiredCommon = 1;

	var os = require$$0$2;
	var fs = require$$1;
	var glob = requireGlob();
	var shell = requireShell();

	var shellMethods = Object.create(shell);

	common$1.extend = Object.assign;

	// Check if we're running under electron
	var isElectron = Boolean(process.versions.electron);

	// Module globals (assume no execPath by default)
	var DEFAULT_CONFIG = {
	  fatal: false,
	  globOptions: {},
	  maxdepth: 255,
	  noglob: false,
	  silent: false,
	  verbose: false,
	  execPath: null,
	  bufLength: 64 * 1024, // 64KB
	};

	var config = {
	  reset: function () {
	    Object.assign(this, DEFAULT_CONFIG);
	    if (!isElectron) {
	      this.execPath = process.execPath;
	    }
	  },
	  resetForTesting: function () {
	    this.reset();
	    this.silent = true;
	  },
	};

	config.reset();
	common$1.config = config;

	// Note: commands should generally consider these as read-only values.
	var state = {
	  error: null,
	  errorCode: 0,
	  currentCmd: 'shell.js',
	};
	common$1.state = state;

	delete process.env.OLDPWD; // initially, there's no previous directory

	// Reliably test if something is any sort of javascript object
	function isObject(a) {
	  return typeof a === 'object' && a !== null;
	}
	common$1.isObject = isObject;

	function log() {
	  /* istanbul ignore next */
	  if (!config.silent) {
	    console.error.apply(console, arguments);
	  }
	}
	common$1.log = log;

	// Converts strings to be equivalent across all platforms. Primarily responsible
	// for making sure we use '/' instead of '\' as path separators, but this may be
	// expanded in the future if necessary
	function convertErrorOutput(msg) {
	  if (typeof msg !== 'string') {
	    throw new TypeError('input must be a string');
	  }
	  return msg.replace(/\\/g, '/');
	}
	common$1.convertErrorOutput = convertErrorOutput;

	// An exception class to help propagate command errors (e.g., non-zero exit
	// status) up to the top-level. {@param value} should be a ShellString.
	function CommandError(value) {
	  this.returnValue = value;
	}
	CommandError.prototype = Object.create(Error.prototype);
	CommandError.prototype.constructor = CommandError;
	common$1.CommandError = CommandError; // visible for testing

	// Shows error message. Throws if fatal is true (defaults to config.fatal, overridable with options.fatal)
	function error(msg, _code, options) {
	  // Validate input
	  if (typeof msg !== 'string') throw new Error('msg must be a string');

	  var DEFAULT_OPTIONS = {
	    continue: false,
	    code: 1,
	    prefix: state.currentCmd + ': ',
	    silent: false,
	    fatal: config.fatal,
	  };

	  if (typeof _code === 'number' && isObject(options)) {
	    options.code = _code;
	  } else if (isObject(_code)) { // no 'code'
	    options = _code;
	  } else if (typeof _code === 'number') { // no 'options'
	    options = { code: _code };
	  } else if (typeof _code !== 'number') { // only 'msg'
	    options = {};
	  }
	  options = Object.assign({}, DEFAULT_OPTIONS, options);

	  if (!state.errorCode) state.errorCode = options.code;

	  var logEntry = convertErrorOutput(options.prefix + msg);
	  state.error = state.error ? state.error + '\n' : '';
	  state.error += logEntry;

	  // Throw an error, or log the entry
	  if (options.fatal) throw new Error(logEntry);
	  if (msg.length > 0 && !options.silent) log(logEntry);

	  if (!options.continue) {
	    throw new CommandError(new ShellString('', state.error, state.errorCode));
	  }
	}
	common$1.error = error;

	//@
	//@ ### ShellString(str)
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ var foo = new ShellString('hello world');
	//@ ```
	//@
	//@ This is a dedicated type returned by most ShellJS methods, which wraps a
	//@ string (or array) value. This has all the string (or array) methods, but
	//@ also exposes extra methods: [`.to()`](#shellstringprototypetofile),
	//@ [`.toEnd()`](#shellstringprototypetoendfile), and all the pipe-able methods
	//@ (ex. `.cat()`, `.grep()`, etc.). This can be easily converted into a string
	//@ by calling `.toString()`.
	//@
	//@ This type also exposes the corresponding command's stdout, stderr, and
	//@ return status code via the `.stdout` (string), `.stderr` (string), and
	//@ `.code` (number) properties respectively.
	function ShellString(stdout, stderr, code) {
	  var that;
	  if (stdout instanceof Array) {
	    that = stdout;
	    that.stdout = stdout.join('\n');
	    if (stdout.length > 0) that.stdout += '\n';
	  } else {
	    that = new String(stdout);
	    that.stdout = stdout;
	  }
	  that.stderr = stderr;
	  that.code = code;
	  // A list of all commands that can appear on the right-hand side of a pipe
	  // (populated by calls to common.wrap())
	  pipeMethods.forEach(function (cmd) {
	    that[cmd] = shellMethods[cmd].bind(that);
	  });
	  return that;
	}

	common$1.ShellString = ShellString;

	// Returns {'alice': true, 'bob': false} when passed a string and dictionary as follows:
	//   parseOptions('-a', {'a':'alice', 'b':'bob'});
	// Returns {'reference': 'string-value', 'bob': false} when passed two dictionaries of the form:
	//   parseOptions({'-r': 'string-value'}, {'r':'reference', 'b':'bob'});
	// Throws an error when passed a string that does not start with '-':
	//   parseOptions('a', {'a':'alice'}); // throws
	function parseOptions(opt, map, errorOptions) {
	  errorOptions = errorOptions || {};
	  // Validate input
	  if (typeof opt !== 'string' && !isObject(opt)) {
	    throw new TypeError('options must be strings or key-value pairs');
	  } else if (!isObject(map)) {
	    throw new TypeError('parseOptions() internal error: map must be an object');
	  } else if (!isObject(errorOptions)) {
	    throw new TypeError(
	        'parseOptions() internal error: errorOptions must be object'
	    );
	  }

	  if (opt === '--') {
	    // This means there are no options.
	    return {};
	  }

	  // All options are false by default
	  var options = {};
	  Object.keys(map).forEach(function (letter) {
	    var optName = map[letter];
	    if (optName[0] !== '!') {
	      options[optName] = false;
	    }
	  });

	  if (opt === '') return options; // defaults

	  if (typeof opt === 'string') {
	    if (opt[0] !== '-') {
	      throw new Error("Options string must start with a '-'");
	    }

	    // e.g. chars = ['R', 'f']
	    var chars = opt.slice(1).split('');

	    chars.forEach(function (c) {
	      if (c in map) {
	        var optionName = map[c];
	        if (optionName[0] === '!') {
	          options[optionName.slice(1)] = false;
	        } else {
	          options[optionName] = true;
	        }
	      } else {
	        error('option not recognized: ' + c, errorOptions);
	      }
	    });
	  } else { // opt is an Object
	    Object.keys(opt).forEach(function (key) {
	      if (key[0] === '-') {
	        // key is a string of the form '-r', '-d', etc.
	        var c = key[1];
	        if (c in map) {
	          var optionName = map[c];
	          options[optionName] = opt[key]; // assign the given value
	        } else {
	          error('option not recognized: ' + c, errorOptions);
	        }
	      } else if (key in options) {
	        // key is a "long option", so it should be the same
	        options[key] = opt[key];
	      } else {
	        error('option not recognized: {' + key + ':...}', errorOptions);
	      }
	    });
	  }
	  return options;
	}
	common$1.parseOptions = parseOptions;

	// Expands wildcards with matching (ie. existing) file names.
	// For example:
	//   expand(['file*.js']) = ['file1.js', 'file2.js', ...]
	//   (if the files 'file1.js', 'file2.js', etc, exist in the current dir)
	function expand(list) {
	  if (!Array.isArray(list)) {
	    throw new TypeError('must be an array');
	  }
	  var expanded = [];
	  list.forEach(function (listEl) {
	    // Don't expand non-strings
	    if (typeof listEl !== 'string') {
	      expanded.push(listEl);
	    } else {
	      var ret;
	      try {
	        ret = glob.sync(listEl, config.globOptions);
	        // if nothing matched, interpret the string literally
	        ret = ret.length > 0 ? ret : [listEl];
	      } catch (e) {
	        // if glob fails, interpret the string literally
	        ret = [listEl];
	      }
	      expanded = expanded.concat(ret);
	    }
	  });
	  return expanded;
	}
	common$1.expand = expand;

	// Normalizes Buffer creation, using Buffer.alloc if possible.
	// Also provides a good default buffer length for most use cases.
	var buffer = typeof Buffer.alloc === 'function' ?
	  function (len) {
	    return Buffer.alloc(len || config.bufLength);
	  } :
	  function (len) {
	    return new Buffer(len || config.bufLength);
	  };
	common$1.buffer = buffer;

	// Normalizes _unlinkSync() across platforms to match Unix behavior, i.e.
	// file can be unlinked even if it's read-only, see https://github.com/joyent/node/issues/3006
	function unlinkSync(file) {
	  try {
	    fs.unlinkSync(file);
	  } catch (e) {
	    // Try to override file permission
	    /* istanbul ignore next */
	    if (e.code === 'EPERM') {
	      fs.chmodSync(file, '0666');
	      fs.unlinkSync(file);
	    } else {
	      throw e;
	    }
	  }
	}
	common$1.unlinkSync = unlinkSync;

	// wrappers around common.statFollowLinks and common.statNoFollowLinks that clarify intent
	// and improve readability
	function statFollowLinks() {
	  return fs.statSync.apply(fs, arguments);
	}
	common$1.statFollowLinks = statFollowLinks;

	function statNoFollowLinks() {
	  return fs.lstatSync.apply(fs, arguments);
	}
	common$1.statNoFollowLinks = statNoFollowLinks;

	// e.g. 'shelljs_a5f185d0443ca...'
	function randomFileName() {
	  function randomHash(count) {
	    if (count === 1) {
	      return parseInt(16 * Math.random(), 10).toString(16);
	    }
	    var hash = '';
	    for (var i = 0; i < count; i++) {
	      hash += randomHash(1);
	    }
	    return hash;
	  }

	  return 'shelljs_' + randomHash(20);
	}
	common$1.randomFileName = randomFileName;

	// Common wrapper for all Unix-like commands that performs glob expansion,
	// command-logging, and other nice things
	function wrap(cmd, fn, options) {
	  options = options || {};
	  return function () {
	    var retValue = null;

	    state.currentCmd = cmd;
	    state.error = null;
	    state.errorCode = 0;

	    try {
	      var args = [].slice.call(arguments, 0);

	      // Log the command to stderr, if appropriate
	      if (config.verbose) {
	        console.error.apply(console, [cmd].concat(args));
	      }

	      // If this is coming from a pipe, let's set the pipedValue (otherwise, set
	      // it to the empty string)
	      state.pipedValue = (this && typeof this.stdout === 'string') ? this.stdout : '';

	      if (options.unix === false) { // this branch is for exec()
	        retValue = fn.apply(this, args);
	      } else { // and this branch is for everything else
	        if (isObject(args[0]) && args[0].constructor.name === 'Object') {
	          // a no-op, allowing the syntax `touch({'-r': file}, ...)`
	        } else if (args.length === 0 || typeof args[0] !== 'string' || args[0].length <= 1 || args[0][0] !== '-') {
	          args.unshift(''); // only add dummy option if '-option' not already present
	        }

	        // flatten out arrays that are arguments, to make the syntax:
	        //    `cp([file1, file2, file3], dest);`
	        // equivalent to:
	        //    `cp(file1, file2, file3, dest);`
	        args = args.reduce(function (accum, cur) {
	          if (Array.isArray(cur)) {
	            return accum.concat(cur);
	          }
	          accum.push(cur);
	          return accum;
	        }, []);

	        // Convert ShellStrings (basically just String objects) to regular strings
	        args = args.map(function (arg) {
	          if (isObject(arg) && arg.constructor.name === 'String') {
	            return arg.toString();
	          }
	          return arg;
	        });

	        // Expand the '~' if appropriate
	        var homeDir = os.homedir();
	        args = args.map(function (arg) {
	          if (typeof arg === 'string' && arg.slice(0, 2) === '~/' || arg === '~') {
	            return arg.replace(/^~/, homeDir);
	          }
	          return arg;
	        });

	        // Perform glob-expansion on all arguments after globStart, but preserve
	        // the arguments before it (like regexes for sed and grep)
	        if (!config.noglob && options.allowGlobbing === true) {
	          args = args.slice(0, options.globStart).concat(expand(args.slice(options.globStart)));
	        }

	        try {
	          // parse options if options are provided
	          if (isObject(options.cmdOptions)) {
	            args[0] = parseOptions(args[0], options.cmdOptions);
	          }

	          retValue = fn.apply(this, args);
	        } catch (e) {
	          /* istanbul ignore else */
	          if (e instanceof CommandError) {
	            retValue = e.returnValue;
	          } else {
	            throw e; // this is probably a bug that should be thrown up the call stack
	          }
	        }
	      }
	    } catch (e) {
	      /* istanbul ignore next */
	      if (!state.error) {
	        // If state.error hasn't been set it's an error thrown by Node, not us - probably a bug...
	        e.name = 'ShellJSInternalError';
	        throw e;
	      }
	      if (config.fatal || options.handlesFatalDynamically) throw e;
	    }

	    if (options.wrapOutput &&
	        (typeof retValue === 'string' || Array.isArray(retValue))) {
	      retValue = new ShellString(retValue, state.error, state.errorCode);
	    }

	    state.currentCmd = 'shell.js';
	    return retValue;
	  };
	} // wrap
	common$1.wrap = wrap;

	// This returns all the input that is piped into the current command (or the
	// empty string, if this isn't on the right-hand side of a pipe
	function _readFromPipe() {
	  return state.pipedValue;
	}
	common$1.readFromPipe = _readFromPipe;

	var DEFAULT_WRAP_OPTIONS = {
	  allowGlobbing: true,
	  canReceivePipe: false,
	  cmdOptions: null,
	  globStart: 1,
	  handlesFatalDynamically: false,
	  pipeOnly: false,
	  wrapOutput: true,
	  unix: true,
	};

	// This is populated during plugin registration
	var pipeMethods = [];

	// Register a new ShellJS command
	function _register(name, implementation, wrapOptions) {
	  wrapOptions = wrapOptions || {};

	  // Validate options
	  Object.keys(wrapOptions).forEach(function (option) {
	    if (!DEFAULT_WRAP_OPTIONS.hasOwnProperty(option)) {
	      throw new Error("Unknown option '" + option + "'");
	    }
	    if (typeof wrapOptions[option] !== typeof DEFAULT_WRAP_OPTIONS[option]) {
	      throw new TypeError("Unsupported type '" + typeof wrapOptions[option] +
	        "' for option '" + option + "'");
	    }
	  });

	  // If an option isn't specified, use the default
	  wrapOptions = Object.assign({}, DEFAULT_WRAP_OPTIONS, wrapOptions);

	  if (shell.hasOwnProperty(name)) {
	    throw new Error('Command `' + name + '` already exists');
	  }

	  if (wrapOptions.pipeOnly) {
	    wrapOptions.canReceivePipe = true;
	    shellMethods[name] = wrap(name, implementation, wrapOptions);
	  } else {
	    shell[name] = wrap(name, implementation, wrapOptions);
	  }

	  if (wrapOptions.canReceivePipe) {
	    pipeMethods.push(name);
	  }
	}
	common$1.register = _register;
	return common$1;
}

var cat;
var hasRequiredCat;

function requireCat () {
	if (hasRequiredCat) return cat;
	hasRequiredCat = 1;
	var common = requireCommon();
	var fs = require$$1;

	common.register('cat', _cat, {
	  canReceivePipe: true,
	  cmdOptions: {
	    'n': 'number',
	  },
	});

	//@
	//@ ### cat([options,] file [, file ...])
	//@ ### cat([options,] file_array)
	//@
	//@ Available options:
	//@
	//@ + `-n`: number all output lines
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ var str = cat('file*.txt');
	//@ var str = cat('file1', 'file2');
	//@ var str = cat(['file1', 'file2']); // same as above
	//@ ```
	//@
	//@ Returns a [ShellString](#shellstringstr) containing the given file, or a
	//@ concatenated string containing the files if more than one file is given (a
	//@ new line character is introduced between each file).
	function _cat(options, files) {
	  var cat = common.readFromPipe();

	  if (!files && !cat) common.error('no paths given');

	  files = [].slice.call(arguments, 1);

	  files.forEach(function (file) {
	    if (!fs.existsSync(file)) {
	      common.error('no such file or directory: ' + file);
	    } else if (common.statFollowLinks(file).isDirectory()) {
	      common.error(file + ': Is a directory');
	    }

	    cat += fs.readFileSync(file, 'utf8');
	  });

	  if (options.number) {
	    cat = addNumbers(cat);
	  }

	  return cat;
	}
	cat = _cat;

	function addNumbers(cat) {
	  var lines = cat.split('\n');
	  var lastLine = lines.pop();

	  lines = lines.map(function (line, i) {
	    return numberedLine(i + 1, line);
	  });

	  if (lastLine.length) {
	    lastLine = numberedLine(lines.length + 1, lastLine);
	  }
	  lines.push(lastLine);

	  return lines.join('\n');
	}

	function numberedLine(n, line) {
	  // GNU cat use six pad start number + tab. See http://lingrok.org/xref/coreutils/src/cat.c#57
	  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
	  var number = ('     ' + n).slice(-6) + '\t';
	  return number + line;
	}
	return cat;
}

var cd;
var hasRequiredCd;

function requireCd () {
	if (hasRequiredCd) return cd;
	hasRequiredCd = 1;
	var os = require$$0$2;
	var common = requireCommon();

	common.register('cd', _cd, {});

	//@
	//@ ### cd([dir])
	//@
	//@ Changes to directory `dir` for the duration of the script. Changes to home
	//@ directory if no argument is supplied. Returns a
	//@ [ShellString](#shellstringstr) to indicate success or failure.
	function _cd(options, dir) {
	  if (!dir) dir = os.homedir();

	  if (dir === '-') {
	    if (!process.env.OLDPWD) {
	      common.error('could not find previous directory');
	    } else {
	      dir = process.env.OLDPWD;
	    }
	  }

	  try {
	    var curDir = process.cwd();
	    process.chdir(dir);
	    process.env.OLDPWD = curDir;
	  } catch (e) {
	    // something went wrong, let's figure out the error
	    var err;
	    try {
	      common.statFollowLinks(dir); // if this succeeds, it must be some sort of file
	      err = 'not a directory: ' + dir;
	    } catch (e2) {
	      err = 'no such file or directory: ' + dir;
	    }
	    if (err) common.error(err);
	  }
	  return '';
	}
	cd = _cd;
	return cd;
}

var chmod;
var hasRequiredChmod;

function requireChmod () {
	if (hasRequiredChmod) return chmod;
	hasRequiredChmod = 1;
	var common = requireCommon();
	var fs = require$$1;
	var path = require$$0$1;

	var PERMS = (function (base) {
	  return {
	    OTHER_EXEC: base.EXEC,
	    OTHER_WRITE: base.WRITE,
	    OTHER_READ: base.READ,

	    GROUP_EXEC: base.EXEC << 3,
	    GROUP_WRITE: base.WRITE << 3,
	    GROUP_READ: base.READ << 3,

	    OWNER_EXEC: base.EXEC << 6,
	    OWNER_WRITE: base.WRITE << 6,
	    OWNER_READ: base.READ << 6,

	    // Literal octal numbers are apparently not allowed in "strict" javascript.
	    STICKY: parseInt('01000', 8),
	    SETGID: parseInt('02000', 8),
	    SETUID: parseInt('04000', 8),

	    TYPE_MASK: parseInt('0770000', 8),
	  };
	}({
	  EXEC: 1,
	  WRITE: 2,
	  READ: 4,
	}));

	common.register('chmod', _chmod, {
	});

	//@
	//@ ### chmod([options,] octal_mode || octal_string, file)
	//@ ### chmod([options,] symbolic_mode, file)
	//@
	//@ Available options:
	//@
	//@ + `-v`: output a diagnostic for every file processed//@
	//@ + `-c`: like verbose, but report only when a change is made//@
	//@ + `-R`: change files and directories recursively//@
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ chmod(755, '/Users/brandon');
	//@ chmod('755', '/Users/brandon'); // same as above
	//@ chmod('u+x', '/Users/brandon');
	//@ chmod('-R', 'a-w', '/Users/brandon');
	//@ ```
	//@
	//@ Alters the permissions of a file or directory by either specifying the
	//@ absolute permissions in octal form or expressing the changes in symbols.
	//@ This command tries to mimic the POSIX behavior as much as possible.
	//@ Notable exceptions:
	//@
	//@ + In symbolic modes, `a-r` and `-r` are identical.  No consideration is
	//@   given to the `umask`.
	//@ + There is no "quiet" option, since default behavior is to run silent.
	//@ + Windows OS uses a very different permission model than POSIX. `chmod()`
	//@   does its best on Windows, but there are limits to how file permissions can
	//@   be set. Note that WSL (Windows subsystem for Linux) **does** follow POSIX,
	//@   so cross-platform compatibility should not be a concern there.
	//@
	//@ Returns a [ShellString](#shellstringstr) indicating success or failure.
	function _chmod(options, mode, filePattern) {
	  if (!filePattern) {
	    if (options.length > 0 && options.charAt(0) === '-') {
	      // Special case where the specified file permissions started with - to subtract perms, which
	      // get picked up by the option parser as command flags.
	      // If we are down by one argument and options starts with -, shift everything over.
	      [].unshift.call(arguments, '');
	    } else {
	      common.error('You must specify a file.');
	    }
	  }

	  options = common.parseOptions(options, {
	    'R': 'recursive',
	    'c': 'changes',
	    'v': 'verbose',
	  });

	  filePattern = [].slice.call(arguments, 2);

	  var files;

	  // TODO: replace this with a call to common.expand()
	  if (options.recursive) {
	    files = [];
	    filePattern.forEach(function addFile(expandedFile) {
	      var stat = common.statNoFollowLinks(expandedFile);

	      if (!stat.isSymbolicLink()) {
	        files.push(expandedFile);

	        if (stat.isDirectory()) {  // intentionally does not follow symlinks.
	          fs.readdirSync(expandedFile).forEach(function (child) {
	            addFile(expandedFile + '/' + child);
	          });
	        }
	      }
	    });
	  } else {
	    files = filePattern;
	  }

	  files.forEach(function innerChmod(file) {
	    file = path.resolve(file);
	    if (!fs.existsSync(file)) {
	      common.error('File not found: ' + file);
	    }

	    // When recursing, don't follow symlinks.
	    if (options.recursive && common.statNoFollowLinks(file).isSymbolicLink()) {
	      return;
	    }

	    var stat = common.statFollowLinks(file);
	    var isDir = stat.isDirectory();
	    var perms = stat.mode;
	    var type = perms & PERMS.TYPE_MASK;

	    var newPerms = perms;

	    if (Number.isNaN(parseInt(mode, 8))) {
	      // parse options
	      mode.split(',').forEach(function (symbolicMode) {
	        var pattern = /([ugoa]*)([=+-])([rwxXst]*)/i;
	        var matches = pattern.exec(symbolicMode);

	        if (matches) {
	          var applyTo = matches[1];
	          var operator = matches[2];
	          var change = matches[3];

	          var changeOwner = applyTo.indexOf('u') !== -1 || applyTo === 'a' || applyTo === '';
	          var changeGroup = applyTo.indexOf('g') !== -1 || applyTo === 'a' || applyTo === '';
	          var changeOther = applyTo.indexOf('o') !== -1 || applyTo === 'a' || applyTo === '';

	          var changeRead = change.indexOf('r') !== -1;
	          var changeWrite = change.indexOf('w') !== -1;
	          var changeExec = change.indexOf('x') !== -1;
	          var changeExecDir = change.indexOf('X') !== -1;
	          var changeSticky = change.indexOf('t') !== -1;
	          var changeSetuid = change.indexOf('s') !== -1;

	          if (changeExecDir && isDir) {
	            changeExec = true;
	          }

	          var mask = 0;
	          if (changeOwner) {
	            mask |= (changeRead ? PERMS.OWNER_READ : 0) + (changeWrite ? PERMS.OWNER_WRITE : 0) + (changeExec ? PERMS.OWNER_EXEC : 0) + (changeSetuid ? PERMS.SETUID : 0);
	          }
	          if (changeGroup) {
	            mask |= (changeRead ? PERMS.GROUP_READ : 0) + (changeWrite ? PERMS.GROUP_WRITE : 0) + (changeExec ? PERMS.GROUP_EXEC : 0) + (changeSetuid ? PERMS.SETGID : 0);
	          }
	          if (changeOther) {
	            mask |= (changeRead ? PERMS.OTHER_READ : 0) + (changeWrite ? PERMS.OTHER_WRITE : 0) + (changeExec ? PERMS.OTHER_EXEC : 0);
	          }

	          // Sticky bit is special - it's not tied to user, group or other.
	          if (changeSticky) {
	            mask |= PERMS.STICKY;
	          }

	          switch (operator) {
	            case '+':
	              newPerms |= mask;
	              break;

	            case '-':
	              newPerms &= ~mask;
	              break;

	            case '=':
	              newPerms = type + mask;

	              // According to POSIX, when using = to explicitly set the
	              // permissions, setuid and setgid can never be cleared.
	              if (common.statFollowLinks(file).isDirectory()) {
	                newPerms |= (PERMS.SETUID + PERMS.SETGID) & perms;
	              }
	              break;
	            default:
	              common.error('Could not recognize operator: `' + operator + '`');
	          }

	          if (options.verbose) {
	            console.log(file + ' -> ' + newPerms.toString(8));
	          }

	          if (perms !== newPerms) {
	            if (!options.verbose && options.changes) {
	              console.log(file + ' -> ' + newPerms.toString(8));
	            }
	            fs.chmodSync(file, newPerms);
	            perms = newPerms; // for the next round of changes!
	          }
	        } else {
	          common.error('Invalid symbolic mode change: ' + symbolicMode);
	        }
	      });
	    } else {
	      // they gave us a full number
	      newPerms = type + parseInt(mode, 8);

	      // POSIX rules are that setuid and setgid can only be added using numeric
	      // form, but not cleared.
	      if (common.statFollowLinks(file).isDirectory()) {
	        newPerms |= (PERMS.SETUID + PERMS.SETGID) & perms;
	      }

	      fs.chmodSync(file, newPerms);
	    }
	  });
	  return '';
	}
	chmod = _chmod;
	return chmod;
}

var execa = {exports: {}};

var crossSpawn = {exports: {}};

/**
 * Tries to execute a function and discards any error that occurs.
 * @param {Function} fn - Function that might or might not throw an error.
 * @returns {?*} Return-value of the function when no error occurred.
 */
var src$1 = function(fn) {

	try { return fn() } catch (e) {}

};

var windows;
var hasRequiredWindows;

function requireWindows () {
	if (hasRequiredWindows) return windows;
	hasRequiredWindows = 1;
	windows = isexe;
	isexe.sync = sync;

	var fs = require$$1;

	function checkPathExt (path, options) {
	  var pathext = options.pathExt !== undefined ?
	    options.pathExt : process.env.PATHEXT;

	  if (!pathext) {
	    return true
	  }

	  pathext = pathext.split(';');
	  if (pathext.indexOf('') !== -1) {
	    return true
	  }
	  for (var i = 0; i < pathext.length; i++) {
	    var p = pathext[i].toLowerCase();
	    if (p && path.substr(-p.length).toLowerCase() === p) {
	      return true
	    }
	  }
	  return false
	}

	function checkStat (stat, path, options) {
	  if (!stat.isSymbolicLink() && !stat.isFile()) {
	    return false
	  }
	  return checkPathExt(path, options)
	}

	function isexe (path, options, cb) {
	  fs.stat(path, function (er, stat) {
	    cb(er, er ? false : checkStat(stat, path, options));
	  });
	}

	function sync (path, options) {
	  return checkStat(fs.statSync(path), path, options)
	}
	return windows;
}

var mode;
var hasRequiredMode;

function requireMode () {
	if (hasRequiredMode) return mode;
	hasRequiredMode = 1;
	mode = isexe;
	isexe.sync = sync;

	var fs = require$$1;

	function isexe (path, options, cb) {
	  fs.stat(path, function (er, stat) {
	    cb(er, er ? false : checkStat(stat, options));
	  });
	}

	function sync (path, options) {
	  return checkStat(fs.statSync(path), options)
	}

	function checkStat (stat, options) {
	  return stat.isFile() && checkMode(stat, options)
	}

	function checkMode (stat, options) {
	  var mod = stat.mode;
	  var uid = stat.uid;
	  var gid = stat.gid;

	  var myUid = options.uid !== undefined ?
	    options.uid : process.getuid && process.getuid();
	  var myGid = options.gid !== undefined ?
	    options.gid : process.getgid && process.getgid();

	  var u = parseInt('100', 8);
	  var g = parseInt('010', 8);
	  var o = parseInt('001', 8);
	  var ug = u | g;

	  var ret = (mod & o) ||
	    (mod & g) && gid === myGid ||
	    (mod & u) && uid === myUid ||
	    (mod & ug) && myUid === 0;

	  return ret
	}
	return mode;
}

var core;
if (process.platform === 'win32' || commonjsGlobal.TESTING_WINDOWS) {
  core = requireWindows();
} else {
  core = requireMode();
}

var isexe_1 = isexe$1;
isexe$1.sync = sync;

function isexe$1 (path, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  if (!cb) {
    if (typeof Promise !== 'function') {
      throw new TypeError('callback not provided')
    }

    return new Promise(function (resolve, reject) {
      isexe$1(path, options || {}, function (er, is) {
        if (er) {
          reject(er);
        } else {
          resolve(is);
        }
      });
    })
  }

  core(path, options || {}, function (er, is) {
    // ignore EACCES because that just means we aren't allowed to run it
    if (er) {
      if (er.code === 'EACCES' || options && options.ignoreErrors) {
        er = null;
        is = false;
      }
    }
    cb(er, is);
  });
}

function sync (path, options) {
  // my kingdom for a filtered catch
  try {
    return core.sync(path, options || {})
  } catch (er) {
    if (options && options.ignoreErrors || er.code === 'EACCES') {
      return false
    } else {
      throw er
    }
  }
}

var which_1 = which$2;
which$2.sync = whichSync;

var isWindows = process.platform === 'win32' ||
    process.env.OSTYPE === 'cygwin' ||
    process.env.OSTYPE === 'msys';

var path$6 = require$$0$1;
var COLON = isWindows ? ';' : ':';
var isexe = isexe_1;

function getNotFoundError (cmd) {
  var er = new Error('not found: ' + cmd);
  er.code = 'ENOENT';

  return er
}

function getPathInfo (cmd, opt) {
  var colon = opt.colon || COLON;
  var pathEnv = opt.path || process.env.PATH || '';
  var pathExt = [''];

  pathEnv = pathEnv.split(colon);

  var pathExtExe = '';
  if (isWindows) {
    pathEnv.unshift(process.cwd());
    pathExtExe = (opt.pathExt || process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM');
    pathExt = pathExtExe.split(colon);


    // Always test the cmd itself first.  isexe will check to make sure
    // it's found in the pathExt set.
    if (cmd.indexOf('.') !== -1 && pathExt[0] !== '')
      pathExt.unshift('');
  }

  // If it has a slash, then we don't bother searching the pathenv.
  // just check the file itself, and that's it.
  if (cmd.match(/\//) || isWindows && cmd.match(/\\/))
    pathEnv = [''];

  return {
    env: pathEnv,
    ext: pathExt,
    extExe: pathExtExe
  }
}

function which$2 (cmd, opt, cb) {
  if (typeof opt === 'function') {
    cb = opt;
    opt = {};
  }

  var info = getPathInfo(cmd, opt);
  var pathEnv = info.env;
  var pathExt = info.ext;
  var pathExtExe = info.extExe;
  var found = []

  ;(function F (i, l) {
    if (i === l) {
      if (opt.all && found.length)
        return cb(null, found)
      else
        return cb(getNotFoundError(cmd))
    }

    var pathPart = pathEnv[i];
    if (pathPart.charAt(0) === '"' && pathPart.slice(-1) === '"')
      pathPart = pathPart.slice(1, -1);

    var p = path$6.join(pathPart, cmd);
    if (!pathPart && (/^\.[\\\/]/).test(cmd)) {
      p = cmd.slice(0, 2) + p;
    }
(function E (ii, ll) {
      if (ii === ll) return F(i + 1, l)
      var ext = pathExt[ii];
      isexe(p + ext, { pathExt: pathExtExe }, function (er, is) {
        if (!er && is) {
          if (opt.all)
            found.push(p + ext);
          else
            return cb(null, p + ext)
        }
        return E(ii + 1, ll)
      });
    })(0, pathExt.length);
  })(0, pathEnv.length);
}

function whichSync (cmd, opt) {
  opt = opt || {};

  var info = getPathInfo(cmd, opt);
  var pathEnv = info.env;
  var pathExt = info.ext;
  var pathExtExe = info.extExe;
  var found = [];

  for (var i = 0, l = pathEnv.length; i < l; i ++) {
    var pathPart = pathEnv[i];
    if (pathPart.charAt(0) === '"' && pathPart.slice(-1) === '"')
      pathPart = pathPart.slice(1, -1);

    var p = path$6.join(pathPart, cmd);
    if (!pathPart && /^\.[\\\/]/.test(cmd)) {
      p = cmd.slice(0, 2) + p;
    }
    for (var j = 0, ll = pathExt.length; j < ll; j ++) {
      var cur = p + pathExt[j];
      var is;
      try {
        is = isexe.sync(cur, { pathExt: pathExtExe });
        if (is) {
          if (opt.all)
            found.push(cur);
          else
            return cur
        }
      } catch (ex) {}
    }
  }

  if (opt.all && found.length)
    return found

  if (opt.nothrow)
    return null

  throw getNotFoundError(cmd)
}

var pathKey$1 = opts => {
	opts = opts || {};

	const env = opts.env || process.env;
	const platform = opts.platform || process.platform;

	if (platform !== 'win32') {
		return 'PATH';
	}

	return Object.keys(env).find(x => x.toUpperCase() === 'PATH') || 'Path';
};

const path$5 = require$$0$1;
const which$1 = which_1;
const pathKey = pathKey$1();

function resolveCommandAttempt(parsed, withoutPathExt) {
    const cwd = process.cwd();
    const hasCustomCwd = parsed.options.cwd != null;

    // If a custom `cwd` was specified, we need to change the process cwd
    // because `which` will do stat calls but does not support a custom cwd
    if (hasCustomCwd) {
        try {
            process.chdir(parsed.options.cwd);
        } catch (err) {
            /* Empty */
        }
    }

    let resolved;

    try {
        resolved = which$1.sync(parsed.command, {
            path: (parsed.options.env || process.env)[pathKey],
            pathExt: withoutPathExt ? path$5.delimiter : undefined,
        });
    } catch (e) {
        /* Empty */
    } finally {
        process.chdir(cwd);
    }

    // If we successfully resolved, ensure that an absolute path is returned
    // Note that when a custom `cwd` was used, we need to resolve to an absolute path based on it
    if (resolved) {
        resolved = path$5.resolve(hasCustomCwd ? parsed.options.cwd : '', resolved);
    }

    return resolved;
}

function resolveCommand$1(parsed) {
    return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
}

var resolveCommand_1 = resolveCommand$1;

var _escape = {};

// See http://www.robvanderwoude.com/escapechars.php
const metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;

function escapeCommand(arg) {
    // Escape meta chars
    arg = arg.replace(metaCharsRegExp, '^$1');

    return arg;
}

function escapeArgument(arg, doubleEscapeMetaChars) {
    // Convert to string
    arg = `${arg}`;

    // Algorithm below is based on https://qntm.org/cmd

    // Sequence of backslashes followed by a double quote:
    // double up all the backslashes and escape the double quote
    arg = arg.replace(/(\\*)"/g, '$1$1\\"');

    // Sequence of backslashes followed by the end of the string
    // (which will become a double quote later):
    // double up all the backslashes
    arg = arg.replace(/(\\*)$/, '$1$1');

    // All other backslashes occur literally

    // Quote the whole thing:
    arg = `"${arg}"`;

    // Escape meta chars
    arg = arg.replace(metaCharsRegExp, '^$1');

    // Double escape meta chars if necessary
    if (doubleEscapeMetaChars) {
        arg = arg.replace(metaCharsRegExp, '^$1');
    }

    return arg;
}

_escape.command = escapeCommand;
_escape.argument = escapeArgument;

var shebangRegex$1 = /^#!.*/;

var shebangRegex = shebangRegex$1;

var shebangCommand$1 = function (str) {
	var match = str.match(shebangRegex);

	if (!match) {
		return null;
	}

	var arr = match[0].replace(/#! ?/, '').split(' ');
	var bin = arr[0].split('/').pop();
	var arg = arr[1];

	return (bin === 'env' ?
		arg :
		bin + (arg ? ' ' + arg : '')
	);
};

const fs$4 = require$$1;
const shebangCommand = shebangCommand$1;

function readShebang$1(command) {
    // Read the first 150 bytes from the file
    const size = 150;
    let buffer;

    if (Buffer.alloc) {
        // Node.js v4.5+ / v5.10+
        buffer = Buffer.alloc(size);
    } else {
        // Old Node.js API
        buffer = new Buffer(size);
        buffer.fill(0); // zero-fill
    }

    let fd;

    try {
        fd = fs$4.openSync(command, 'r');
        fs$4.readSync(fd, buffer, 0, size, 0);
        fs$4.closeSync(fd);
    } catch (e) { /* Empty */ }

    // Attempt to extract shebang (null is returned if not a shebang)
    return shebangCommand(buffer.toString());
}

var readShebang_1 = readShebang$1;

var semver$6 = {exports: {}};

(function (module, exports) {
	exports = module.exports = SemVer;

	var debug;
	/* istanbul ignore next */
	if (typeof process === 'object' &&
	    process.env &&
	    process.env.NODE_DEBUG &&
	    /\bsemver\b/i.test(process.env.NODE_DEBUG)) {
	  debug = function () {
	    var args = Array.prototype.slice.call(arguments, 0);
	    args.unshift('SEMVER');
	    console.log.apply(console, args);
	  };
	} else {
	  debug = function () {};
	}

	// Note: this is the semver.org version of the spec that it implements
	// Not necessarily the package version of this code.
	exports.SEMVER_SPEC_VERSION = '2.0.0';

	var MAX_LENGTH = 256;
	var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
	  /* istanbul ignore next */ 9007199254740991;

	// Max safe segment length for coercion.
	var MAX_SAFE_COMPONENT_LENGTH = 16;

	var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;

	// The actual regexps go on exports.re
	var re = exports.re = [];
	var safeRe = exports.safeRe = [];
	var src = exports.src = [];
	var R = 0;

	var LETTERDASHNUMBER = '[a-zA-Z0-9-]';

	// Replace some greedy regex tokens to prevent regex dos issues. These regex are
	// used internally via the safeRe object since all inputs in this library get
	// normalized first to trim and collapse all extra whitespace. The original
	// regexes are exported for userland consumption and lower level usage. A
	// future breaking change could export the safer regex only with a note that
	// all input should have extra whitespace removed.
	var safeRegexReplacements = [
	  ['\\s', 1],
	  ['\\d', MAX_LENGTH],
	  [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH],
	];

	function makeSafeRe (value) {
	  for (var i = 0; i < safeRegexReplacements.length; i++) {
	    var token = safeRegexReplacements[i][0];
	    var max = safeRegexReplacements[i][1];
	    value = value
	      .split(token + '*').join(token + '{0,' + max + '}')
	      .split(token + '+').join(token + '{1,' + max + '}');
	  }
	  return value
	}

	// The following Regular Expressions can be used for tokenizing,
	// validating, and parsing SemVer version strings.

	// ## Numeric Identifier
	// A single `0`, or a non-zero digit followed by zero or more digits.

	var NUMERICIDENTIFIER = R++;
	src[NUMERICIDENTIFIER] = '0|[1-9]\\d*';
	var NUMERICIDENTIFIERLOOSE = R++;
	src[NUMERICIDENTIFIERLOOSE] = '\\d+';

	// ## Non-numeric Identifier
	// Zero or more digits, followed by a letter or hyphen, and then zero or
	// more letters, digits, or hyphens.

	var NONNUMERICIDENTIFIER = R++;
	src[NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-]' + LETTERDASHNUMBER + '*';

	// ## Main Version
	// Three dot-separated numeric identifiers.

	var MAINVERSION = R++;
	src[MAINVERSION] = '(' + src[NUMERICIDENTIFIER] + ')\\.' +
	                   '(' + src[NUMERICIDENTIFIER] + ')\\.' +
	                   '(' + src[NUMERICIDENTIFIER] + ')';

	var MAINVERSIONLOOSE = R++;
	src[MAINVERSIONLOOSE] = '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
	                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
	                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')';

	// ## Pre-release Version Identifier
	// A numeric identifier, or a non-numeric identifier.

	var PRERELEASEIDENTIFIER = R++;
	src[PRERELEASEIDENTIFIER] = '(?:' + src[NUMERICIDENTIFIER] +
	                            '|' + src[NONNUMERICIDENTIFIER] + ')';

	var PRERELEASEIDENTIFIERLOOSE = R++;
	src[PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[NUMERICIDENTIFIERLOOSE] +
	                                 '|' + src[NONNUMERICIDENTIFIER] + ')';

	// ## Pre-release Version
	// Hyphen, followed by one or more dot-separated pre-release version
	// identifiers.

	var PRERELEASE = R++;
	src[PRERELEASE] = '(?:-(' + src[PRERELEASEIDENTIFIER] +
	                  '(?:\\.' + src[PRERELEASEIDENTIFIER] + ')*))';

	var PRERELEASELOOSE = R++;
	src[PRERELEASELOOSE] = '(?:-?(' + src[PRERELEASEIDENTIFIERLOOSE] +
	                       '(?:\\.' + src[PRERELEASEIDENTIFIERLOOSE] + ')*))';

	// ## Build Metadata Identifier
	// Any combination of digits, letters, or hyphens.

	var BUILDIDENTIFIER = R++;
	src[BUILDIDENTIFIER] = LETTERDASHNUMBER + '+';

	// ## Build Metadata
	// Plus sign, followed by one or more period-separated build metadata
	// identifiers.

	var BUILD = R++;
	src[BUILD] = '(?:\\+(' + src[BUILDIDENTIFIER] +
	             '(?:\\.' + src[BUILDIDENTIFIER] + ')*))';

	// ## Full Version String
	// A main version, followed optionally by a pre-release version and
	// build metadata.

	// Note that the only major, minor, patch, and pre-release sections of
	// the version string are capturing groups.  The build metadata is not a
	// capturing group, because it should not ever be used in version
	// comparison.

	var FULL = R++;
	var FULLPLAIN = 'v?' + src[MAINVERSION] +
	                src[PRERELEASE] + '?' +
	                src[BUILD] + '?';

	src[FULL] = '^' + FULLPLAIN + '$';

	// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
	// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
	// common in the npm registry.
	var LOOSEPLAIN = '[v=\\s]*' + src[MAINVERSIONLOOSE] +
	                 src[PRERELEASELOOSE] + '?' +
	                 src[BUILD] + '?';

	var LOOSE = R++;
	src[LOOSE] = '^' + LOOSEPLAIN + '$';

	var GTLT = R++;
	src[GTLT] = '((?:<|>)?=?)';

	// Something like "2.*" or "1.2.x".
	// Note that "x.x" is a valid xRange identifer, meaning "any version"
	// Only the first item is strictly required.
	var XRANGEIDENTIFIERLOOSE = R++;
	src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
	var XRANGEIDENTIFIER = R++;
	src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + '|x|X|\\*';

	var XRANGEPLAIN = R++;
	src[XRANGEPLAIN] = '[v=\\s]*(' + src[XRANGEIDENTIFIER] + ')' +
	                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
	                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
	                   '(?:' + src[PRERELEASE] + ')?' +
	                   src[BUILD] + '?' +
	                   ')?)?';

	var XRANGEPLAINLOOSE = R++;
	src[XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
	                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
	                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
	                        '(?:' + src[PRERELEASELOOSE] + ')?' +
	                        src[BUILD] + '?' +
	                        ')?)?';

	var XRANGE = R++;
	src[XRANGE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAIN] + '$';
	var XRANGELOOSE = R++;
	src[XRANGELOOSE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAINLOOSE] + '$';

	// Coercion.
	// Extract anything that could conceivably be a part of a valid semver
	var COERCE = R++;
	src[COERCE] = '(?:^|[^\\d])' +
	              '(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '})' +
	              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
	              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
	              '(?:$|[^\\d])';

	// Tilde ranges.
	// Meaning is "reasonably at or greater than"
	var LONETILDE = R++;
	src[LONETILDE] = '(?:~>?)';

	var TILDETRIM = R++;
	src[TILDETRIM] = '(\\s*)' + src[LONETILDE] + '\\s+';
	re[TILDETRIM] = new RegExp(src[TILDETRIM], 'g');
	safeRe[TILDETRIM] = new RegExp(makeSafeRe(src[TILDETRIM]), 'g');
	var tildeTrimReplace = '$1~';

	var TILDE = R++;
	src[TILDE] = '^' + src[LONETILDE] + src[XRANGEPLAIN] + '$';
	var TILDELOOSE = R++;
	src[TILDELOOSE] = '^' + src[LONETILDE] + src[XRANGEPLAINLOOSE] + '$';

	// Caret ranges.
	// Meaning is "at least and backwards compatible with"
	var LONECARET = R++;
	src[LONECARET] = '(?:\\^)';

	var CARETTRIM = R++;
	src[CARETTRIM] = '(\\s*)' + src[LONECARET] + '\\s+';
	re[CARETTRIM] = new RegExp(src[CARETTRIM], 'g');
	safeRe[CARETTRIM] = new RegExp(makeSafeRe(src[CARETTRIM]), 'g');
	var caretTrimReplace = '$1^';

	var CARET = R++;
	src[CARET] = '^' + src[LONECARET] + src[XRANGEPLAIN] + '$';
	var CARETLOOSE = R++;
	src[CARETLOOSE] = '^' + src[LONECARET] + src[XRANGEPLAINLOOSE] + '$';

	// A simple gt/lt/eq thing, or just "" to indicate "any version"
	var COMPARATORLOOSE = R++;
	src[COMPARATORLOOSE] = '^' + src[GTLT] + '\\s*(' + LOOSEPLAIN + ')$|^$';
	var COMPARATOR = R++;
	src[COMPARATOR] = '^' + src[GTLT] + '\\s*(' + FULLPLAIN + ')$|^$';

	// An expression to strip any whitespace between the gtlt and the thing
	// it modifies, so that `> 1.2.3` ==> `>1.2.3`
	var COMPARATORTRIM = R++;
	src[COMPARATORTRIM] = '(\\s*)' + src[GTLT] +
	                      '\\s*(' + LOOSEPLAIN + '|' + src[XRANGEPLAIN] + ')';

	// this one has to use the /g flag
	re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], 'g');
	safeRe[COMPARATORTRIM] = new RegExp(makeSafeRe(src[COMPARATORTRIM]), 'g');
	var comparatorTrimReplace = '$1$2$3';

	// Something like `1.2.3 - 1.2.4`
	// Note that these all use the loose form, because they'll be
	// checked against either the strict or loose comparator form
	// later.
	var HYPHENRANGE = R++;
	src[HYPHENRANGE] = '^\\s*(' + src[XRANGEPLAIN] + ')' +
	                   '\\s+-\\s+' +
	                   '(' + src[XRANGEPLAIN] + ')' +
	                   '\\s*$';

	var HYPHENRANGELOOSE = R++;
	src[HYPHENRANGELOOSE] = '^\\s*(' + src[XRANGEPLAINLOOSE] + ')' +
	                        '\\s+-\\s+' +
	                        '(' + src[XRANGEPLAINLOOSE] + ')' +
	                        '\\s*$';

	// Star ranges basically just allow anything at all.
	var STAR = R++;
	src[STAR] = '(<|>)?=?\\s*\\*';

	// Compile to actual regexp objects.
	// All are flag-free, unless they were created above with a flag.
	for (var i = 0; i < R; i++) {
	  debug(i, src[i]);
	  if (!re[i]) {
	    re[i] = new RegExp(src[i]);

	    // Replace all greedy whitespace to prevent regex dos issues. These regex are
	    // used internally via the safeRe object since all inputs in this library get
	    // normalized first to trim and collapse all extra whitespace. The original
	    // regexes are exported for userland consumption and lower level usage. A
	    // future breaking change could export the safer regex only with a note that
	    // all input should have extra whitespace removed.
	    safeRe[i] = new RegExp(makeSafeRe(src[i]));
	  }
	}

	exports.parse = parse;
	function parse (version, options) {
	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }

	  if (version instanceof SemVer) {
	    return version
	  }

	  if (typeof version !== 'string') {
	    return null
	  }

	  if (version.length > MAX_LENGTH) {
	    return null
	  }

	  var r = options.loose ? safeRe[LOOSE] : safeRe[FULL];
	  if (!r.test(version)) {
	    return null
	  }

	  try {
	    return new SemVer(version, options)
	  } catch (er) {
	    return null
	  }
	}

	exports.valid = valid;
	function valid (version, options) {
	  var v = parse(version, options);
	  return v ? v.version : null
	}

	exports.clean = clean;
	function clean (version, options) {
	  var s = parse(version.trim().replace(/^[=v]+/, ''), options);
	  return s ? s.version : null
	}

	exports.SemVer = SemVer;

	function SemVer (version, options) {
	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }
	  if (version instanceof SemVer) {
	    if (version.loose === options.loose) {
	      return version
	    } else {
	      version = version.version;
	    }
	  } else if (typeof version !== 'string') {
	    throw new TypeError('Invalid Version: ' + version)
	  }

	  if (version.length > MAX_LENGTH) {
	    throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters')
	  }

	  if (!(this instanceof SemVer)) {
	    return new SemVer(version, options)
	  }

	  debug('SemVer', version, options);
	  this.options = options;
	  this.loose = !!options.loose;

	  var m = version.trim().match(options.loose ? safeRe[LOOSE] : safeRe[FULL]);

	  if (!m) {
	    throw new TypeError('Invalid Version: ' + version)
	  }

	  this.raw = version;

	  // these are actually numbers
	  this.major = +m[1];
	  this.minor = +m[2];
	  this.patch = +m[3];

	  if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
	    throw new TypeError('Invalid major version')
	  }

	  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
	    throw new TypeError('Invalid minor version')
	  }

	  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
	    throw new TypeError('Invalid patch version')
	  }

	  // numberify any prerelease numeric ids
	  if (!m[4]) {
	    this.prerelease = [];
	  } else {
	    this.prerelease = m[4].split('.').map(function (id) {
	      if (/^[0-9]+$/.test(id)) {
	        var num = +id;
	        if (num >= 0 && num < MAX_SAFE_INTEGER) {
	          return num
	        }
	      }
	      return id
	    });
	  }

	  this.build = m[5] ? m[5].split('.') : [];
	  this.format();
	}

	SemVer.prototype.format = function () {
	  this.version = this.major + '.' + this.minor + '.' + this.patch;
	  if (this.prerelease.length) {
	    this.version += '-' + this.prerelease.join('.');
	  }
	  return this.version
	};

	SemVer.prototype.toString = function () {
	  return this.version
	};

	SemVer.prototype.compare = function (other) {
	  debug('SemVer.compare', this.version, this.options, other);
	  if (!(other instanceof SemVer)) {
	    other = new SemVer(other, this.options);
	  }

	  return this.compareMain(other) || this.comparePre(other)
	};

	SemVer.prototype.compareMain = function (other) {
	  if (!(other instanceof SemVer)) {
	    other = new SemVer(other, this.options);
	  }

	  return compareIdentifiers(this.major, other.major) ||
	         compareIdentifiers(this.minor, other.minor) ||
	         compareIdentifiers(this.patch, other.patch)
	};

	SemVer.prototype.comparePre = function (other) {
	  if (!(other instanceof SemVer)) {
	    other = new SemVer(other, this.options);
	  }

	  // NOT having a prerelease is > having one
	  if (this.prerelease.length && !other.prerelease.length) {
	    return -1
	  } else if (!this.prerelease.length && other.prerelease.length) {
	    return 1
	  } else if (!this.prerelease.length && !other.prerelease.length) {
	    return 0
	  }

	  var i = 0;
	  do {
	    var a = this.prerelease[i];
	    var b = other.prerelease[i];
	    debug('prerelease compare', i, a, b);
	    if (a === undefined && b === undefined) {
	      return 0
	    } else if (b === undefined) {
	      return 1
	    } else if (a === undefined) {
	      return -1
	    } else if (a === b) {
	      continue
	    } else {
	      return compareIdentifiers(a, b)
	    }
	  } while (++i)
	};

	// preminor will bump the version up to the next minor release, and immediately
	// down to pre-release. premajor and prepatch work the same way.
	SemVer.prototype.inc = function (release, identifier) {
	  switch (release) {
	    case 'premajor':
	      this.prerelease.length = 0;
	      this.patch = 0;
	      this.minor = 0;
	      this.major++;
	      this.inc('pre', identifier);
	      break
	    case 'preminor':
	      this.prerelease.length = 0;
	      this.patch = 0;
	      this.minor++;
	      this.inc('pre', identifier);
	      break
	    case 'prepatch':
	      // If this is already a prerelease, it will bump to the next version
	      // drop any prereleases that might already exist, since they are not
	      // relevant at this point.
	      this.prerelease.length = 0;
	      this.inc('patch', identifier);
	      this.inc('pre', identifier);
	      break
	    // If the input is a non-prerelease version, this acts the same as
	    // prepatch.
	    case 'prerelease':
	      if (this.prerelease.length === 0) {
	        this.inc('patch', identifier);
	      }
	      this.inc('pre', identifier);
	      break

	    case 'major':
	      // If this is a pre-major version, bump up to the same major version.
	      // Otherwise increment major.
	      // 1.0.0-5 bumps to 1.0.0
	      // 1.1.0 bumps to 2.0.0
	      if (this.minor !== 0 ||
	          this.patch !== 0 ||
	          this.prerelease.length === 0) {
	        this.major++;
	      }
	      this.minor = 0;
	      this.patch = 0;
	      this.prerelease = [];
	      break
	    case 'minor':
	      // If this is a pre-minor version, bump up to the same minor version.
	      // Otherwise increment minor.
	      // 1.2.0-5 bumps to 1.2.0
	      // 1.2.1 bumps to 1.3.0
	      if (this.patch !== 0 || this.prerelease.length === 0) {
	        this.minor++;
	      }
	      this.patch = 0;
	      this.prerelease = [];
	      break
	    case 'patch':
	      // If this is not a pre-release version, it will increment the patch.
	      // If it is a pre-release it will bump up to the same patch version.
	      // 1.2.0-5 patches to 1.2.0
	      // 1.2.0 patches to 1.2.1
	      if (this.prerelease.length === 0) {
	        this.patch++;
	      }
	      this.prerelease = [];
	      break
	    // This probably shouldn't be used publicly.
	    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
	    case 'pre':
	      if (this.prerelease.length === 0) {
	        this.prerelease = [0];
	      } else {
	        var i = this.prerelease.length;
	        while (--i >= 0) {
	          if (typeof this.prerelease[i] === 'number') {
	            this.prerelease[i]++;
	            i = -2;
	          }
	        }
	        if (i === -1) {
	          // didn't increment anything
	          this.prerelease.push(0);
	        }
	      }
	      if (identifier) {
	        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
	        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
	        if (this.prerelease[0] === identifier) {
	          if (isNaN(this.prerelease[1])) {
	            this.prerelease = [identifier, 0];
	          }
	        } else {
	          this.prerelease = [identifier, 0];
	        }
	      }
	      break

	    default:
	      throw new Error('invalid increment argument: ' + release)
	  }
	  this.format();
	  this.raw = this.version;
	  return this
	};

	exports.inc = inc;
	function inc (version, release, loose, identifier) {
	  if (typeof (loose) === 'string') {
	    identifier = loose;
	    loose = undefined;
	  }

	  try {
	    return new SemVer(version, loose).inc(release, identifier).version
	  } catch (er) {
	    return null
	  }
	}

	exports.diff = diff;
	function diff (version1, version2) {
	  if (eq(version1, version2)) {
	    return null
	  } else {
	    var v1 = parse(version1);
	    var v2 = parse(version2);
	    var prefix = '';
	    if (v1.prerelease.length || v2.prerelease.length) {
	      prefix = 'pre';
	      var defaultResult = 'prerelease';
	    }
	    for (var key in v1) {
	      if (key === 'major' || key === 'minor' || key === 'patch') {
	        if (v1[key] !== v2[key]) {
	          return prefix + key
	        }
	      }
	    }
	    return defaultResult // may be undefined
	  }
	}

	exports.compareIdentifiers = compareIdentifiers;

	var numeric = /^[0-9]+$/;
	function compareIdentifiers (a, b) {
	  var anum = numeric.test(a);
	  var bnum = numeric.test(b);

	  if (anum && bnum) {
	    a = +a;
	    b = +b;
	  }

	  return a === b ? 0
	    : (anum && !bnum) ? -1
	    : (bnum && !anum) ? 1
	    : a < b ? -1
	    : 1
	}

	exports.rcompareIdentifiers = rcompareIdentifiers;
	function rcompareIdentifiers (a, b) {
	  return compareIdentifiers(b, a)
	}

	exports.major = major;
	function major (a, loose) {
	  return new SemVer(a, loose).major
	}

	exports.minor = minor;
	function minor (a, loose) {
	  return new SemVer(a, loose).minor
	}

	exports.patch = patch;
	function patch (a, loose) {
	  return new SemVer(a, loose).patch
	}

	exports.compare = compare;
	function compare (a, b, loose) {
	  return new SemVer(a, loose).compare(new SemVer(b, loose))
	}

	exports.compareLoose = compareLoose;
	function compareLoose (a, b) {
	  return compare(a, b, true)
	}

	exports.rcompare = rcompare;
	function rcompare (a, b, loose) {
	  return compare(b, a, loose)
	}

	exports.sort = sort;
	function sort (list, loose) {
	  return list.sort(function (a, b) {
	    return exports.compare(a, b, loose)
	  })
	}

	exports.rsort = rsort;
	function rsort (list, loose) {
	  return list.sort(function (a, b) {
	    return exports.rcompare(a, b, loose)
	  })
	}

	exports.gt = gt;
	function gt (a, b, loose) {
	  return compare(a, b, loose) > 0
	}

	exports.lt = lt;
	function lt (a, b, loose) {
	  return compare(a, b, loose) < 0
	}

	exports.eq = eq;
	function eq (a, b, loose) {
	  return compare(a, b, loose) === 0
	}

	exports.neq = neq;
	function neq (a, b, loose) {
	  return compare(a, b, loose) !== 0
	}

	exports.gte = gte;
	function gte (a, b, loose) {
	  return compare(a, b, loose) >= 0
	}

	exports.lte = lte;
	function lte (a, b, loose) {
	  return compare(a, b, loose) <= 0
	}

	exports.cmp = cmp;
	function cmp (a, op, b, loose) {
	  switch (op) {
	    case '===':
	      if (typeof a === 'object')
	        a = a.version;
	      if (typeof b === 'object')
	        b = b.version;
	      return a === b

	    case '!==':
	      if (typeof a === 'object')
	        a = a.version;
	      if (typeof b === 'object')
	        b = b.version;
	      return a !== b

	    case '':
	    case '=':
	    case '==':
	      return eq(a, b, loose)

	    case '!=':
	      return neq(a, b, loose)

	    case '>':
	      return gt(a, b, loose)

	    case '>=':
	      return gte(a, b, loose)

	    case '<':
	      return lt(a, b, loose)

	    case '<=':
	      return lte(a, b, loose)

	    default:
	      throw new TypeError('Invalid operator: ' + op)
	  }
	}

	exports.Comparator = Comparator;
	function Comparator (comp, options) {
	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }

	  if (comp instanceof Comparator) {
	    if (comp.loose === !!options.loose) {
	      return comp
	    } else {
	      comp = comp.value;
	    }
	  }

	  if (!(this instanceof Comparator)) {
	    return new Comparator(comp, options)
	  }

	  comp = comp.trim().split(/\s+/).join(' ');
	  debug('comparator', comp, options);
	  this.options = options;
	  this.loose = !!options.loose;
	  this.parse(comp);

	  if (this.semver === ANY) {
	    this.value = '';
	  } else {
	    this.value = this.operator + this.semver.version;
	  }

	  debug('comp', this);
	}

	var ANY = {};
	Comparator.prototype.parse = function (comp) {
	  var r = this.options.loose ? safeRe[COMPARATORLOOSE] : safeRe[COMPARATOR];
	  var m = comp.match(r);

	  if (!m) {
	    throw new TypeError('Invalid comparator: ' + comp)
	  }

	  this.operator = m[1];
	  if (this.operator === '=') {
	    this.operator = '';
	  }

	  // if it literally is just '>' or '' then allow anything.
	  if (!m[2]) {
	    this.semver = ANY;
	  } else {
	    this.semver = new SemVer(m[2], this.options.loose);
	  }
	};

	Comparator.prototype.toString = function () {
	  return this.value
	};

	Comparator.prototype.test = function (version) {
	  debug('Comparator.test', version, this.options.loose);

	  if (this.semver === ANY) {
	    return true
	  }

	  if (typeof version === 'string') {
	    version = new SemVer(version, this.options);
	  }

	  return cmp(version, this.operator, this.semver, this.options)
	};

	Comparator.prototype.intersects = function (comp, options) {
	  if (!(comp instanceof Comparator)) {
	    throw new TypeError('a Comparator is required')
	  }

	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }

	  var rangeTmp;

	  if (this.operator === '') {
	    rangeTmp = new Range(comp.value, options);
	    return satisfies(this.value, rangeTmp, options)
	  } else if (comp.operator === '') {
	    rangeTmp = new Range(this.value, options);
	    return satisfies(comp.semver, rangeTmp, options)
	  }

	  var sameDirectionIncreasing =
	    (this.operator === '>=' || this.operator === '>') &&
	    (comp.operator === '>=' || comp.operator === '>');
	  var sameDirectionDecreasing =
	    (this.operator === '<=' || this.operator === '<') &&
	    (comp.operator === '<=' || comp.operator === '<');
	  var sameSemVer = this.semver.version === comp.semver.version;
	  var differentDirectionsInclusive =
	    (this.operator === '>=' || this.operator === '<=') &&
	    (comp.operator === '>=' || comp.operator === '<=');
	  var oppositeDirectionsLessThan =
	    cmp(this.semver, '<', comp.semver, options) &&
	    ((this.operator === '>=' || this.operator === '>') &&
	    (comp.operator === '<=' || comp.operator === '<'));
	  var oppositeDirectionsGreaterThan =
	    cmp(this.semver, '>', comp.semver, options) &&
	    ((this.operator === '<=' || this.operator === '<') &&
	    (comp.operator === '>=' || comp.operator === '>'));

	  return sameDirectionIncreasing || sameDirectionDecreasing ||
	    (sameSemVer && differentDirectionsInclusive) ||
	    oppositeDirectionsLessThan || oppositeDirectionsGreaterThan
	};

	exports.Range = Range;
	function Range (range, options) {
	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }

	  if (range instanceof Range) {
	    if (range.loose === !!options.loose &&
	        range.includePrerelease === !!options.includePrerelease) {
	      return range
	    } else {
	      return new Range(range.raw, options)
	    }
	  }

	  if (range instanceof Comparator) {
	    return new Range(range.value, options)
	  }

	  if (!(this instanceof Range)) {
	    return new Range(range, options)
	  }

	  this.options = options;
	  this.loose = !!options.loose;
	  this.includePrerelease = !!options.includePrerelease;

	  // First reduce all whitespace as much as possible so we do not have to rely
	  // on potentially slow regexes like \s*. This is then stored and used for
	  // future error messages as well.
	  this.raw = range
	    .trim()
	    .split(/\s+/)
	    .join(' ');

	  // First, split based on boolean or ||
	  this.set = this.raw.split('||').map(function (range) {
	    return this.parseRange(range.trim())
	  }, this).filter(function (c) {
	    // throw out any that are not relevant for whatever reason
	    return c.length
	  });

	  if (!this.set.length) {
	    throw new TypeError('Invalid SemVer Range: ' + this.raw)
	  }

	  this.format();
	}

	Range.prototype.format = function () {
	  this.range = this.set.map(function (comps) {
	    return comps.join(' ').trim()
	  }).join('||').trim();
	  return this.range
	};

	Range.prototype.toString = function () {
	  return this.range
	};

	Range.prototype.parseRange = function (range) {
	  var loose = this.options.loose;
	  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
	  var hr = loose ? safeRe[HYPHENRANGELOOSE] : safeRe[HYPHENRANGE];
	  range = range.replace(hr, hyphenReplace);
	  debug('hyphen replace', range);
	  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
	  range = range.replace(safeRe[COMPARATORTRIM], comparatorTrimReplace);
	  debug('comparator trim', range, safeRe[COMPARATORTRIM]);

	  // `~ 1.2.3` => `~1.2.3`
	  range = range.replace(safeRe[TILDETRIM], tildeTrimReplace);

	  // `^ 1.2.3` => `^1.2.3`
	  range = range.replace(safeRe[CARETTRIM], caretTrimReplace);

	  // At this point, the range is completely trimmed and
	  // ready to be split into comparators.
	  var compRe = loose ? safeRe[COMPARATORLOOSE] : safeRe[COMPARATOR];
	  var set = range.split(' ').map(function (comp) {
	    return parseComparator(comp, this.options)
	  }, this).join(' ').split(/\s+/);
	  if (this.options.loose) {
	    // in loose mode, throw out any that are not valid comparators
	    set = set.filter(function (comp) {
	      return !!comp.match(compRe)
	    });
	  }
	  set = set.map(function (comp) {
	    return new Comparator(comp, this.options)
	  }, this);

	  return set
	};

	Range.prototype.intersects = function (range, options) {
	  if (!(range instanceof Range)) {
	    throw new TypeError('a Range is required')
	  }

	  return this.set.some(function (thisComparators) {
	    return thisComparators.every(function (thisComparator) {
	      return range.set.some(function (rangeComparators) {
	        return rangeComparators.every(function (rangeComparator) {
	          return thisComparator.intersects(rangeComparator, options)
	        })
	      })
	    })
	  })
	};

	// Mostly just for testing and legacy API reasons
	exports.toComparators = toComparators;
	function toComparators (range, options) {
	  return new Range(range, options).set.map(function (comp) {
	    return comp.map(function (c) {
	      return c.value
	    }).join(' ').trim().split(' ')
	  })
	}

	// comprised of xranges, tildes, stars, and gtlt's at this point.
	// already replaced the hyphen ranges
	// turn into a set of JUST comparators.
	function parseComparator (comp, options) {
	  debug('comp', comp, options);
	  comp = replaceCarets(comp, options);
	  debug('caret', comp);
	  comp = replaceTildes(comp, options);
	  debug('tildes', comp);
	  comp = replaceXRanges(comp, options);
	  debug('xrange', comp);
	  comp = replaceStars(comp, options);
	  debug('stars', comp);
	  return comp
	}

	function isX (id) {
	  return !id || id.toLowerCase() === 'x' || id === '*'
	}

	// ~, ~> --> * (any, kinda silly)
	// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
	// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
	// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
	// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
	// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
	function replaceTildes (comp, options) {
	  return comp.trim().split(/\s+/).map(function (comp) {
	    return replaceTilde(comp, options)
	  }).join(' ')
	}

	function replaceTilde (comp, options) {
	  var r = options.loose ? safeRe[TILDELOOSE] : safeRe[TILDE];
	  return comp.replace(r, function (_, M, m, p, pr) {
	    debug('tilde', comp, _, M, m, p, pr);
	    var ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
	    } else if (isX(p)) {
	      // ~1.2 == >=1.2.0 <1.3.0
	      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
	    } else if (pr) {
	      debug('replaceTilde pr', pr);
	      ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
	            ' <' + M + '.' + (+m + 1) + '.0';
	    } else {
	      // ~1.2.3 == >=1.2.3 <1.3.0
	      ret = '>=' + M + '.' + m + '.' + p +
	            ' <' + M + '.' + (+m + 1) + '.0';
	    }

	    debug('tilde return', ret);
	    return ret
	  })
	}

	// ^ --> * (any, kinda silly)
	// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
	// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
	// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
	// ^1.2.3 --> >=1.2.3 <2.0.0
	// ^1.2.0 --> >=1.2.0 <2.0.0
	function replaceCarets (comp, options) {
	  return comp.trim().split(/\s+/).map(function (comp) {
	    return replaceCaret(comp, options)
	  }).join(' ')
	}

	function replaceCaret (comp, options) {
	  debug('caret', comp, options);
	  var r = options.loose ? safeRe[CARETLOOSE] : safeRe[CARET];
	  return comp.replace(r, function (_, M, m, p, pr) {
	    debug('caret', comp, _, M, m, p, pr);
	    var ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
	    } else if (isX(p)) {
	      if (M === '0') {
	        ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
	      } else {
	        ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
	      }
	    } else if (pr) {
	      debug('replaceCaret pr', pr);
	      if (M === '0') {
	        if (m === '0') {
	          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
	                ' <' + M + '.' + m + '.' + (+p + 1);
	        } else {
	          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
	                ' <' + M + '.' + (+m + 1) + '.0';
	        }
	      } else {
	        ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
	              ' <' + (+M + 1) + '.0.0';
	      }
	    } else {
	      debug('no pr');
	      if (M === '0') {
	        if (m === '0') {
	          ret = '>=' + M + '.' + m + '.' + p +
	                ' <' + M + '.' + m + '.' + (+p + 1);
	        } else {
	          ret = '>=' + M + '.' + m + '.' + p +
	                ' <' + M + '.' + (+m + 1) + '.0';
	        }
	      } else {
	        ret = '>=' + M + '.' + m + '.' + p +
	              ' <' + (+M + 1) + '.0.0';
	      }
	    }

	    debug('caret return', ret);
	    return ret
	  })
	}

	function replaceXRanges (comp, options) {
	  debug('replaceXRanges', comp, options);
	  return comp.split(/\s+/).map(function (comp) {
	    return replaceXRange(comp, options)
	  }).join(' ')
	}

	function replaceXRange (comp, options) {
	  comp = comp.trim();
	  var r = options.loose ? safeRe[XRANGELOOSE] : safeRe[XRANGE];
	  return comp.replace(r, function (ret, gtlt, M, m, p, pr) {
	    debug('xRange', comp, ret, gtlt, M, m, p, pr);
	    var xM = isX(M);
	    var xm = xM || isX(m);
	    var xp = xm || isX(p);
	    var anyX = xp;

	    if (gtlt === '=' && anyX) {
	      gtlt = '';
	    }

	    if (xM) {
	      if (gtlt === '>' || gtlt === '<') {
	        // nothing is allowed
	        ret = '<0.0.0';
	      } else {
	        // nothing is forbidden
	        ret = '*';
	      }
	    } else if (gtlt && anyX) {
	      // we know patch is an x, because we have any x at all.
	      // replace X with 0
	      if (xm) {
	        m = 0;
	      }
	      p = 0;

	      if (gtlt === '>') {
	        // >1 => >=2.0.0
	        // >1.2 => >=1.3.0
	        // >1.2.3 => >= 1.2.4
	        gtlt = '>=';
	        if (xm) {
	          M = +M + 1;
	          m = 0;
	          p = 0;
	        } else {
	          m = +m + 1;
	          p = 0;
	        }
	      } else if (gtlt === '<=') {
	        // <=0.7.x is actually <0.8.0, since any 0.7.x should
	        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
	        gtlt = '<';
	        if (xm) {
	          M = +M + 1;
	        } else {
	          m = +m + 1;
	        }
	      }

	      ret = gtlt + M + '.' + m + '.' + p;
	    } else if (xm) {
	      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
	    } else if (xp) {
	      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
	    }

	    debug('xRange return', ret);

	    return ret
	  })
	}

	// Because * is AND-ed with everything else in the comparator,
	// and '' means "any version", just remove the *s entirely.
	function replaceStars (comp, options) {
	  debug('replaceStars', comp, options);
	  // Looseness is ignored here.  star is always as loose as it gets!
	  return comp.trim().replace(safeRe[STAR], '')
	}

	// This function is passed to string.replace(safeRe[HYPHENRANGE])
	// M, m, patch, prerelease, build
	// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
	// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
	// 1.2 - 3.4 => >=1.2.0 <3.5.0
	function hyphenReplace ($0,
	  from, fM, fm, fp, fpr, fb,
	  to, tM, tm, tp, tpr, tb) {
	  if (isX(fM)) {
	    from = '';
	  } else if (isX(fm)) {
	    from = '>=' + fM + '.0.0';
	  } else if (isX(fp)) {
	    from = '>=' + fM + '.' + fm + '.0';
	  } else {
	    from = '>=' + from;
	  }

	  if (isX(tM)) {
	    to = '';
	  } else if (isX(tm)) {
	    to = '<' + (+tM + 1) + '.0.0';
	  } else if (isX(tp)) {
	    to = '<' + tM + '.' + (+tm + 1) + '.0';
	  } else if (tpr) {
	    to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
	  } else {
	    to = '<=' + to;
	  }

	  return (from + ' ' + to).trim()
	}

	// if ANY of the sets match ALL of its comparators, then pass
	Range.prototype.test = function (version) {
	  if (!version) {
	    return false
	  }

	  if (typeof version === 'string') {
	    version = new SemVer(version, this.options);
	  }

	  for (var i = 0; i < this.set.length; i++) {
	    if (testSet(this.set[i], version, this.options)) {
	      return true
	    }
	  }
	  return false
	};

	function testSet (set, version, options) {
	  for (var i = 0; i < set.length; i++) {
	    if (!set[i].test(version)) {
	      return false
	    }
	  }

	  if (version.prerelease.length && !options.includePrerelease) {
	    // Find the set of versions that are allowed to have prereleases
	    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
	    // That should allow `1.2.3-pr.2` to pass.
	    // However, `1.2.4-alpha.notready` should NOT be allowed,
	    // even though it's within the range set by the comparators.
	    for (i = 0; i < set.length; i++) {
	      debug(set[i].semver);
	      if (set[i].semver === ANY) {
	        continue
	      }

	      if (set[i].semver.prerelease.length > 0) {
	        var allowed = set[i].semver;
	        if (allowed.major === version.major &&
	            allowed.minor === version.minor &&
	            allowed.patch === version.patch) {
	          return true
	        }
	      }
	    }

	    // Version has a -pre, but it's not one of the ones we like.
	    return false
	  }

	  return true
	}

	exports.satisfies = satisfies;
	function satisfies (version, range, options) {
	  try {
	    range = new Range(range, options);
	  } catch (er) {
	    return false
	  }
	  return range.test(version)
	}

	exports.maxSatisfying = maxSatisfying;
	function maxSatisfying (versions, range, options) {
	  var max = null;
	  var maxSV = null;
	  try {
	    var rangeObj = new Range(range, options);
	  } catch (er) {
	    return null
	  }
	  versions.forEach(function (v) {
	    if (rangeObj.test(v)) {
	      // satisfies(v, range, options)
	      if (!max || maxSV.compare(v) === -1) {
	        // compare(max, v, true)
	        max = v;
	        maxSV = new SemVer(max, options);
	      }
	    }
	  });
	  return max
	}

	exports.minSatisfying = minSatisfying;
	function minSatisfying (versions, range, options) {
	  var min = null;
	  var minSV = null;
	  try {
	    var rangeObj = new Range(range, options);
	  } catch (er) {
	    return null
	  }
	  versions.forEach(function (v) {
	    if (rangeObj.test(v)) {
	      // satisfies(v, range, options)
	      if (!min || minSV.compare(v) === 1) {
	        // compare(min, v, true)
	        min = v;
	        minSV = new SemVer(min, options);
	      }
	    }
	  });
	  return min
	}

	exports.minVersion = minVersion;
	function minVersion (range, loose) {
	  range = new Range(range, loose);

	  var minver = new SemVer('0.0.0');
	  if (range.test(minver)) {
	    return minver
	  }

	  minver = new SemVer('0.0.0-0');
	  if (range.test(minver)) {
	    return minver
	  }

	  minver = null;
	  for (var i = 0; i < range.set.length; ++i) {
	    var comparators = range.set[i];

	    comparators.forEach(function (comparator) {
	      // Clone to avoid manipulating the comparator's semver object.
	      var compver = new SemVer(comparator.semver.version);
	      switch (comparator.operator) {
	        case '>':
	          if (compver.prerelease.length === 0) {
	            compver.patch++;
	          } else {
	            compver.prerelease.push(0);
	          }
	          compver.raw = compver.format();
	          /* fallthrough */
	        case '':
	        case '>=':
	          if (!minver || gt(minver, compver)) {
	            minver = compver;
	          }
	          break
	        case '<':
	        case '<=':
	          /* Ignore maximum versions */
	          break
	        /* istanbul ignore next */
	        default:
	          throw new Error('Unexpected operation: ' + comparator.operator)
	      }
	    });
	  }

	  if (minver && range.test(minver)) {
	    return minver
	  }

	  return null
	}

	exports.validRange = validRange;
	function validRange (range, options) {
	  try {
	    // Return '*' instead of '' so that truthiness works.
	    // This will throw if it's invalid anyway
	    return new Range(range, options).range || '*'
	  } catch (er) {
	    return null
	  }
	}

	// Determine if version is less than all the versions possible in the range
	exports.ltr = ltr;
	function ltr (version, range, options) {
	  return outside(version, range, '<', options)
	}

	// Determine if version is greater than all the versions possible in the range.
	exports.gtr = gtr;
	function gtr (version, range, options) {
	  return outside(version, range, '>', options)
	}

	exports.outside = outside;
	function outside (version, range, hilo, options) {
	  version = new SemVer(version, options);
	  range = new Range(range, options);

	  var gtfn, ltefn, ltfn, comp, ecomp;
	  switch (hilo) {
	    case '>':
	      gtfn = gt;
	      ltefn = lte;
	      ltfn = lt;
	      comp = '>';
	      ecomp = '>=';
	      break
	    case '<':
	      gtfn = lt;
	      ltefn = gte;
	      ltfn = gt;
	      comp = '<';
	      ecomp = '<=';
	      break
	    default:
	      throw new TypeError('Must provide a hilo val of "<" or ">"')
	  }

	  // If it satisifes the range it is not outside
	  if (satisfies(version, range, options)) {
	    return false
	  }

	  // From now on, variable terms are as if we're in "gtr" mode.
	  // but note that everything is flipped for the "ltr" function.

	  for (var i = 0; i < range.set.length; ++i) {
	    var comparators = range.set[i];

	    var high = null;
	    var low = null;

	    comparators.forEach(function (comparator) {
	      if (comparator.semver === ANY) {
	        comparator = new Comparator('>=0.0.0');
	      }
	      high = high || comparator;
	      low = low || comparator;
	      if (gtfn(comparator.semver, high.semver, options)) {
	        high = comparator;
	      } else if (ltfn(comparator.semver, low.semver, options)) {
	        low = comparator;
	      }
	    });

	    // If the edge version comparator has a operator then our version
	    // isn't outside it
	    if (high.operator === comp || high.operator === ecomp) {
	      return false
	    }

	    // If the lowest version comparator has an operator and our version
	    // is less than it then it isn't higher than the range
	    if ((!low.operator || low.operator === comp) &&
	        ltefn(version, low.semver)) {
	      return false
	    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
	      return false
	    }
	  }
	  return true
	}

	exports.prerelease = prerelease;
	function prerelease (version, options) {
	  var parsed = parse(version, options);
	  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null
	}

	exports.intersects = intersects;
	function intersects (r1, r2, options) {
	  r1 = new Range(r1, options);
	  r2 = new Range(r2, options);
	  return r1.intersects(r2)
	}

	exports.coerce = coerce;
	function coerce (version) {
	  if (version instanceof SemVer) {
	    return version
	  }

	  if (typeof version !== 'string') {
	    return null
	  }

	  var match = version.match(safeRe[COERCE]);

	  if (match == null) {
	    return null
	  }

	  return parse(match[1] +
	    '.' + (match[2] || '0') +
	    '.' + (match[3] || '0'))
	} 
} (semver$6, semver$6.exports));

var semverExports$2 = semver$6.exports;

const path$4 = require$$0$1;
const niceTry = src$1;
const resolveCommand = resolveCommand_1;
const escape$2 = _escape;
const readShebang = readShebang_1;
const semver$5 = semverExports$2;

const isWin$2 = process.platform === 'win32';
const isExecutableRegExp = /\.(?:com|exe)$/i;
const isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;

// `options.shell` is supported in Node ^4.8.0, ^5.7.0 and >= 6.0.0
const supportsShellOption = niceTry(() => semver$5.satisfies(process.version, '^4.8.0 || ^5.7.0 || >= 6.0.0', true)) || false;

function detectShebang(parsed) {
    parsed.file = resolveCommand(parsed);

    const shebang = parsed.file && readShebang(parsed.file);

    if (shebang) {
        parsed.args.unshift(parsed.file);
        parsed.command = shebang;

        return resolveCommand(parsed);
    }

    return parsed.file;
}

function parseNonShell(parsed) {
    if (!isWin$2) {
        return parsed;
    }

    // Detect & add support for shebangs
    const commandFile = detectShebang(parsed);

    // We don't need a shell if the command filename is an executable
    const needsShell = !isExecutableRegExp.test(commandFile);

    // If a shell is required, use cmd.exe and take care of escaping everything correctly
    // Note that `forceShell` is an hidden option used only in tests
    if (parsed.options.forceShell || needsShell) {
        // Need to double escape meta chars if the command is a cmd-shim located in `node_modules/.bin/`
        // The cmd-shim simply calls execute the package bin file with NodeJS, proxying any argument
        // Because the escape of metachars with ^ gets interpreted when the cmd.exe is first called,
        // we need to double escape them
        const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);

        // Normalize posix paths into OS compatible paths (e.g.: foo/bar -> foo\bar)
        // This is necessary otherwise it will always fail with ENOENT in those cases
        parsed.command = path$4.normalize(parsed.command);

        // Escape command & arguments
        parsed.command = escape$2.command(parsed.command);
        parsed.args = parsed.args.map((arg) => escape$2.argument(arg, needsDoubleEscapeMetaChars));

        const shellCommand = [parsed.command].concat(parsed.args).join(' ');

        parsed.args = ['/d', '/s', '/c', `"${shellCommand}"`];
        parsed.command = process.env.comspec || 'cmd.exe';
        parsed.options.windowsVerbatimArguments = true; // Tell node's spawn that the arguments are already escaped
    }

    return parsed;
}

function parseShell(parsed) {
    // If node supports the shell option, there's no need to mimic its behavior
    if (supportsShellOption) {
        return parsed;
    }

    // Mimic node shell option
    // See https://github.com/nodejs/node/blob/b9f6a2dc059a1062776133f3d4fd848c4da7d150/lib/child_process.js#L335
    const shellCommand = [parsed.command].concat(parsed.args).join(' ');

    if (isWin$2) {
        parsed.command = typeof parsed.options.shell === 'string' ? parsed.options.shell : process.env.comspec || 'cmd.exe';
        parsed.args = ['/d', '/s', '/c', `"${shellCommand}"`];
        parsed.options.windowsVerbatimArguments = true; // Tell node's spawn that the arguments are already escaped
    } else {
        if (typeof parsed.options.shell === 'string') {
            parsed.command = parsed.options.shell;
        } else if (process.platform === 'android') {
            parsed.command = '/system/bin/sh';
        } else {
            parsed.command = '/bin/sh';
        }

        parsed.args = ['-c', shellCommand];
    }

    return parsed;
}

function parse$b(command, args, options) {
    // Normalize arguments, similar to nodejs
    if (args && !Array.isArray(args)) {
        options = args;
        args = null;
    }

    args = args ? args.slice(0) : []; // Clone array to avoid changing the original
    options = Object.assign({}, options); // Clone object to avoid changing the original

    // Build our parsed object
    const parsed = {
        command,
        args,
        options,
        file: undefined,
        original: {
            command,
            args,
        },
    };

    // Delegate further parsing to shell or non-shell
    return options.shell ? parseShell(parsed) : parseNonShell(parsed);
}

var parse_1$1 = parse$b;

const isWin$1 = process.platform === 'win32';

function notFoundError(original, syscall) {
    return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
        code: 'ENOENT',
        errno: 'ENOENT',
        syscall: `${syscall} ${original.command}`,
        path: original.command,
        spawnargs: original.args,
    });
}

function hookChildProcess(cp, parsed) {
    if (!isWin$1) {
        return;
    }

    const originalEmit = cp.emit;

    cp.emit = function (name, arg1) {
        // If emitting "exit" event and exit code is 1, we need to check if
        // the command exists and emit an "error" instead
        // See https://github.com/IndigoUnited/node-cross-spawn/issues/16
        if (name === 'exit') {
            const err = verifyENOENT(arg1, parsed);

            if (err) {
                return originalEmit.call(cp, 'error', err);
            }
        }

        return originalEmit.apply(cp, arguments); // eslint-disable-line prefer-rest-params
    };
}

function verifyENOENT(status, parsed) {
    if (isWin$1 && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, 'spawn');
    }

    return null;
}

function verifyENOENTSync(status, parsed) {
    if (isWin$1 && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, 'spawnSync');
    }

    return null;
}

var enoent$1 = {
    hookChildProcess,
    verifyENOENT,
    verifyENOENTSync,
    notFoundError,
};

const cp$1 = require$$1$1;
const parse$a = parse_1$1;
const enoent = enoent$1;

function spawn(command, args, options) {
    // Parse the arguments
    const parsed = parse$a(command, args, options);

    // Spawn the child process
    const spawned = cp$1.spawn(parsed.command, parsed.args, parsed.options);

    // Hook into child process "exit" event to emit an error if the command
    // does not exists, see: https://github.com/IndigoUnited/node-cross-spawn/issues/16
    enoent.hookChildProcess(spawned, parsed);

    return spawned;
}

function spawnSync(command, args, options) {
    // Parse the arguments
    const parsed = parse$a(command, args, options);

    // Spawn the child process
    const result = cp$1.spawnSync(parsed.command, parsed.args, parsed.options);

    // Analyze if the command does not exist, see: https://github.com/IndigoUnited/node-cross-spawn/issues/16
    result.error = result.error || enoent.verifyENOENTSync(result.status, parsed);

    return result;
}

crossSpawn.exports = spawn;
crossSpawn.exports.spawn = spawn;
crossSpawn.exports.sync = spawnSync;

crossSpawn.exports._parse = parse$a;
crossSpawn.exports._enoent = enoent;

var crossSpawnExports = crossSpawn.exports;

var stripEof = function (x) {
	var lf = typeof x === 'string' ? '\n' : '\n'.charCodeAt();
	var cr = typeof x === 'string' ? '\r' : '\r'.charCodeAt();

	if (x[x.length - 1] === lf) {
		x = x.slice(0, x.length - 1);
	}

	if (x[x.length - 1] === cr) {
		x = x.slice(0, x.length - 1);
	}

	return x;
};

var npmRunPath = {exports: {}};

npmRunPath.exports;

(function (module) {
	const path = require$$0$1;
	const pathKey = pathKey$1;

	module.exports = opts => {
		opts = Object.assign({
			cwd: process.cwd(),
			path: process.env[pathKey()]
		}, opts);

		let prev;
		let pth = path.resolve(opts.cwd);
		const ret = [];

		while (prev !== pth) {
			ret.push(path.join(pth, 'node_modules/.bin'));
			prev = pth;
			pth = path.resolve(pth, '..');
		}

		// ensure the running `node` binary is used
		ret.push(path.dirname(process.execPath));

		return ret.concat(opts.path).join(path.delimiter);
	};

	module.exports.env = opts => {
		opts = Object.assign({
			env: process.env
		}, opts);

		const env = Object.assign({}, opts.env);
		const path = pathKey({env});

		opts.path = env[path];
		env[path] = module.exports(opts);

		return env;
	}; 
} (npmRunPath));

var npmRunPathExports = npmRunPath.exports;

var isStream$1 = {exports: {}};

var isStream = isStream$1.exports = function (stream) {
	return stream !== null && typeof stream === 'object' && typeof stream.pipe === 'function';
};

isStream.writable = function (stream) {
	return isStream(stream) && stream.writable !== false && typeof stream._write === 'function' && typeof stream._writableState === 'object';
};

isStream.readable = function (stream) {
	return isStream(stream) && stream.readable !== false && typeof stream._read === 'function' && typeof stream._readableState === 'object';
};

isStream.duplex = function (stream) {
	return isStream.writable(stream) && isStream.readable(stream);
};

isStream.transform = function (stream) {
	return isStream.duplex(stream) && typeof stream._transform === 'function' && typeof stream._transformState === 'object';
};

var isStreamExports = isStream$1.exports;

var getStream$1 = {exports: {}};

var once$1 = onceExports;

var noop$1 = function() {};

var isRequest$1 = function(stream) {
	return stream.setHeader && typeof stream.abort === 'function';
};

var isChildProcess = function(stream) {
	return stream.stdio && Array.isArray(stream.stdio) && stream.stdio.length === 3
};

var eos$1 = function(stream, opts, callback) {
	if (typeof opts === 'function') return eos$1(stream, null, opts);
	if (!opts) opts = {};

	callback = once$1(callback || noop$1);

	var ws = stream._writableState;
	var rs = stream._readableState;
	var readable = opts.readable || (opts.readable !== false && stream.readable);
	var writable = opts.writable || (opts.writable !== false && stream.writable);
	var cancelled = false;

	var onlegacyfinish = function() {
		if (!stream.writable) onfinish();
	};

	var onfinish = function() {
		writable = false;
		if (!readable) callback.call(stream);
	};

	var onend = function() {
		readable = false;
		if (!writable) callback.call(stream);
	};

	var onexit = function(exitCode) {
		callback.call(stream, exitCode ? new Error('exited with error code: ' + exitCode) : null);
	};

	var onerror = function(err) {
		callback.call(stream, err);
	};

	var onclose = function() {
		process.nextTick(onclosenexttick);
	};

	var onclosenexttick = function() {
		if (cancelled) return;
		if (readable && !(rs && (rs.ended && !rs.destroyed))) return callback.call(stream, new Error('premature close'));
		if (writable && !(ws && (ws.ended && !ws.destroyed))) return callback.call(stream, new Error('premature close'));
	};

	var onrequest = function() {
		stream.req.on('finish', onfinish);
	};

	if (isRequest$1(stream)) {
		stream.on('complete', onfinish);
		stream.on('abort', onclose);
		if (stream.req) onrequest();
		else stream.on('request', onrequest);
	} else if (writable && !ws) { // legacy streams
		stream.on('end', onlegacyfinish);
		stream.on('close', onlegacyfinish);
	}

	if (isChildProcess(stream)) stream.on('exit', onexit);

	stream.on('end', onend);
	stream.on('finish', onfinish);
	if (opts.error !== false) stream.on('error', onerror);
	stream.on('close', onclose);

	return function() {
		cancelled = true;
		stream.removeListener('complete', onfinish);
		stream.removeListener('abort', onclose);
		stream.removeListener('request', onrequest);
		if (stream.req) stream.req.removeListener('finish', onfinish);
		stream.removeListener('end', onlegacyfinish);
		stream.removeListener('close', onlegacyfinish);
		stream.removeListener('finish', onfinish);
		stream.removeListener('exit', onexit);
		stream.removeListener('end', onend);
		stream.removeListener('error', onerror);
		stream.removeListener('close', onclose);
	};
};

var endOfStream = eos$1;

var once = onceExports;
var eos = endOfStream;
var fs$3 = require$$1; // we only need fs to get the ReadStream and WriteStream prototypes

var noop = function () {};
var ancient = /^v?\.0/.test(process.version);

var isFn = function (fn) {
  return typeof fn === 'function'
};

var isFS = function (stream) {
  if (!ancient) return false // newer node version do not need to care about fs is a special way
  if (!fs$3) return false // browser
  return (stream instanceof (fs$3.ReadStream || noop) || stream instanceof (fs$3.WriteStream || noop)) && isFn(stream.close)
};

var isRequest = function (stream) {
  return stream.setHeader && isFn(stream.abort)
};

var destroyer = function (stream, reading, writing, callback) {
  callback = once(callback);

  var closed = false;
  stream.on('close', function () {
    closed = true;
  });

  eos(stream, {readable: reading, writable: writing}, function (err) {
    if (err) return callback(err)
    closed = true;
    callback();
  });

  var destroyed = false;
  return function (err) {
    if (closed) return
    if (destroyed) return
    destroyed = true;

    if (isFS(stream)) return stream.close(noop) // use close for fs streams to avoid fd leaks
    if (isRequest(stream)) return stream.abort() // request.destroy just do .end - .abort is what we want

    if (isFn(stream.destroy)) return stream.destroy()

    callback(err || new Error('stream was destroyed'));
  }
};

var call = function (fn) {
  fn();
};

var pipe = function (from, to) {
  return from.pipe(to)
};

var pump$1 = function () {
  var streams = Array.prototype.slice.call(arguments);
  var callback = isFn(streams[streams.length - 1] || noop) && streams.pop() || noop;

  if (Array.isArray(streams[0])) streams = streams[0];
  if (streams.length < 2) throw new Error('pump requires two streams per minimum')

  var error;
  var destroys = streams.map(function (stream, i) {
    var reading = i < streams.length - 1;
    var writing = i > 0;
    return destroyer(stream, reading, writing, function (err) {
      if (!error) error = err;
      if (err) destroys.forEach(call);
      if (reading) return
      destroys.forEach(call);
      callback(error);
    })
  });

  return streams.reduce(pipe)
};

var pump_1 = pump$1;

const {PassThrough} = require$$0$3;

var bufferStream$1 = options => {
	options = Object.assign({}, options);

	const {array} = options;
	let {encoding} = options;
	const buffer = encoding === 'buffer';
	let objectMode = false;

	if (array) {
		objectMode = !(encoding || buffer);
	} else {
		encoding = encoding || 'utf8';
	}

	if (buffer) {
		encoding = null;
	}

	let len = 0;
	const ret = [];
	const stream = new PassThrough({objectMode});

	if (encoding) {
		stream.setEncoding(encoding);
	}

	stream.on('data', chunk => {
		ret.push(chunk);

		if (objectMode) {
			len = ret.length;
		} else {
			len += chunk.length;
		}
	});

	stream.getBufferedValue = () => {
		if (array) {
			return ret;
		}

		return buffer ? Buffer.concat(ret, len) : ret.join('');
	};

	stream.getBufferedLength = () => len;

	return stream;
};

const pump = pump_1;
const bufferStream = bufferStream$1;

class MaxBufferError extends Error {
	constructor() {
		super('maxBuffer exceeded');
		this.name = 'MaxBufferError';
	}
}

function getStream(inputStream, options) {
	if (!inputStream) {
		return Promise.reject(new Error('Expected a stream'));
	}

	options = Object.assign({maxBuffer: Infinity}, options);

	const {maxBuffer} = options;

	let stream;
	return new Promise((resolve, reject) => {
		const rejectPromise = error => {
			if (error) { // A null check
				error.bufferedData = stream.getBufferedValue();
			}
			reject(error);
		};

		stream = pump(inputStream, bufferStream(options), error => {
			if (error) {
				rejectPromise(error);
				return;
			}

			resolve();
		});

		stream.on('data', () => {
			if (stream.getBufferedLength() > maxBuffer) {
				rejectPromise(new MaxBufferError());
			}
		});
	}).then(() => stream.getBufferedValue());
}

getStream$1.exports = getStream;
getStream$1.exports.buffer = (stream, options) => getStream(stream, Object.assign({}, options, {encoding: 'buffer'}));
getStream$1.exports.array = (stream, options) => getStream(stream, Object.assign({}, options, {array: true}));
getStream$1.exports.MaxBufferError = MaxBufferError;

var getStreamExports = getStream$1.exports;

var pFinally = (promise, onFinally) => {
	onFinally = onFinally || (() => {});

	return promise.then(
		val => new Promise(resolve => {
			resolve(onFinally());
		}).then(() => val),
		err => new Promise(resolve => {
			resolve(onFinally());
		}).then(() => {
			throw err;
		})
	);
};

var signalExit = {exports: {}};

var signals$1 = {exports: {}};

var hasRequiredSignals;

function requireSignals () {
	if (hasRequiredSignals) return signals$1.exports;
	hasRequiredSignals = 1;
	(function (module) {
		// This is not the set of all possible signals.
		//
		// It IS, however, the set of all signals that trigger
		// an exit on either Linux or BSD systems.  Linux is a
		// superset of the signal names supported on BSD, and
		// the unknown signals just fail to register, so we can
		// catch that easily enough.
		//
		// Don't bother with SIGKILL.  It's uncatchable, which
		// means that we can't fire any callbacks anyway.
		//
		// If a user does happen to register a handler on a non-
		// fatal signal like SIGWINCH or something, and then
		// exit, it'll end up firing `process.emit('exit')`, so
		// the handler will be fired anyway.
		//
		// SIGBUS, SIGFPE, SIGSEGV and SIGILL, when not raised
		// artificially, inherently leave the process in a
		// state from which it is not safe to try and enter JS
		// listeners.
		module.exports = [
		  'SIGABRT',
		  'SIGALRM',
		  'SIGHUP',
		  'SIGINT',
		  'SIGTERM'
		];

		if (process.platform !== 'win32') {
		  module.exports.push(
		    'SIGVTALRM',
		    'SIGXCPU',
		    'SIGXFSZ',
		    'SIGUSR2',
		    'SIGTRAP',
		    'SIGSYS',
		    'SIGQUIT',
		    'SIGIOT'
		    // should detect profiler and enable/disable accordingly.
		    // see #21
		    // 'SIGPROF'
		  );
		}

		if (process.platform === 'linux') {
		  module.exports.push(
		    'SIGIO',
		    'SIGPOLL',
		    'SIGPWR',
		    'SIGSTKFLT',
		    'SIGUNUSED'
		  );
		} 
	} (signals$1));
	return signals$1.exports;
}

// Note: since nyc uses this module to output coverage, any lines
// that are in the direct sync flow of nyc's outputCoverage are
// ignored, since we can never get coverage for them.
// grab a reference to node's real process object right away
var process$2 = commonjsGlobal.process;

const processOk = function (process) {
  return process &&
    typeof process === 'object' &&
    typeof process.removeListener === 'function' &&
    typeof process.emit === 'function' &&
    typeof process.reallyExit === 'function' &&
    typeof process.listeners === 'function' &&
    typeof process.kill === 'function' &&
    typeof process.pid === 'number' &&
    typeof process.on === 'function'
};

// some kind of non-node environment, just no-op
/* istanbul ignore if */
if (!processOk(process$2)) {
  signalExit.exports = function () {
    return function () {}
  };
} else {
  var assert = require$$5;
  var signals = requireSignals();
  var isWin = /^win/i.test(process$2.platform);

  var EE = require$$2;
  /* istanbul ignore if */
  if (typeof EE !== 'function') {
    EE = EE.EventEmitter;
  }

  var emitter;
  if (process$2.__signal_exit_emitter__) {
    emitter = process$2.__signal_exit_emitter__;
  } else {
    emitter = process$2.__signal_exit_emitter__ = new EE();
    emitter.count = 0;
    emitter.emitted = {};
  }

  // Because this emitter is a global, we have to check to see if a
  // previous version of this library failed to enable infinite listeners.
  // I know what you're about to say.  But literally everything about
  // signal-exit is a compromise with evil.  Get used to it.
  if (!emitter.infinite) {
    emitter.setMaxListeners(Infinity);
    emitter.infinite = true;
  }

  signalExit.exports = function (cb, opts) {
    /* istanbul ignore if */
    if (!processOk(commonjsGlobal.process)) {
      return function () {}
    }
    assert.equal(typeof cb, 'function', 'a callback must be provided for exit handler');

    if (loaded === false) {
      load();
    }

    var ev = 'exit';
    if (opts && opts.alwaysLast) {
      ev = 'afterexit';
    }

    var remove = function () {
      emitter.removeListener(ev, cb);
      if (emitter.listeners('exit').length === 0 &&
          emitter.listeners('afterexit').length === 0) {
        unload();
      }
    };
    emitter.on(ev, cb);

    return remove
  };

  var unload = function unload () {
    if (!loaded || !processOk(commonjsGlobal.process)) {
      return
    }
    loaded = false;

    signals.forEach(function (sig) {
      try {
        process$2.removeListener(sig, sigListeners[sig]);
      } catch (er) {}
    });
    process$2.emit = originalProcessEmit;
    process$2.reallyExit = originalProcessReallyExit;
    emitter.count -= 1;
  };
  signalExit.exports.unload = unload;

  var emit = function emit (event, code, signal) {
    /* istanbul ignore if */
    if (emitter.emitted[event]) {
      return
    }
    emitter.emitted[event] = true;
    emitter.emit(event, code, signal);
  };

  // { <signal>: <listener fn>, ... }
  var sigListeners = {};
  signals.forEach(function (sig) {
    sigListeners[sig] = function listener () {
      /* istanbul ignore if */
      if (!processOk(commonjsGlobal.process)) {
        return
      }
      // If there are no other listeners, an exit is coming!
      // Simplest way: remove us and then re-send the signal.
      // We know that this will kill the process, so we can
      // safely emit now.
      var listeners = process$2.listeners(sig);
      if (listeners.length === emitter.count) {
        unload();
        emit('exit', null, sig);
        /* istanbul ignore next */
        emit('afterexit', null, sig);
        /* istanbul ignore next */
        if (isWin && sig === 'SIGHUP') {
          // "SIGHUP" throws an `ENOSYS` error on Windows,
          // so use a supported signal instead
          sig = 'SIGINT';
        }
        /* istanbul ignore next */
        process$2.kill(process$2.pid, sig);
      }
    };
  });

  signalExit.exports.signals = function () {
    return signals
  };

  var loaded = false;

  var load = function load () {
    if (loaded || !processOk(commonjsGlobal.process)) {
      return
    }
    loaded = true;

    // This is the number of onSignalExit's that are in play.
    // It's important so that we can count the correct number of
    // listeners on signals, and don't wait for the other one to
    // handle it instead of us.
    emitter.count += 1;

    signals = signals.filter(function (sig) {
      try {
        process$2.on(sig, sigListeners[sig]);
        return true
      } catch (er) {
        return false
      }
    });

    process$2.emit = processEmit;
    process$2.reallyExit = processReallyExit;
  };
  signalExit.exports.load = load;

  var originalProcessReallyExit = process$2.reallyExit;
  var processReallyExit = function processReallyExit (code) {
    /* istanbul ignore if */
    if (!processOk(commonjsGlobal.process)) {
      return
    }
    process$2.exitCode = code || /* istanbul ignore next */ 0;
    emit('exit', process$2.exitCode, null);
    /* istanbul ignore next */
    emit('afterexit', process$2.exitCode, null);
    /* istanbul ignore next */
    originalProcessReallyExit.call(process$2, process$2.exitCode);
  };

  var originalProcessEmit = process$2.emit;
  var processEmit = function processEmit (ev, arg) {
    if (ev === 'exit' && processOk(commonjsGlobal.process)) {
      /* istanbul ignore else */
      if (arg !== undefined) {
        process$2.exitCode = arg;
      }
      var ret = originalProcessEmit.apply(this, arguments);
      /* istanbul ignore next */
      emit('exit', process$2.exitCode, null);
      /* istanbul ignore next */
      emit('afterexit', process$2.exitCode, null);
      /* istanbul ignore next */
      return ret
    } else {
      return originalProcessEmit.apply(this, arguments)
    }
  };
}

var signalExitExports = signalExit.exports;

var errname$1 = {exports: {}};

// Older verions of Node.js might not have `util.getSystemErrorName()`.
// In that case, fall back to a deprecated internal.
const util = require$$0$4;

let uv;

if (typeof util.getSystemErrorName === 'function') {
	errname$1.exports = util.getSystemErrorName;
} else {
	try {
		uv = process.binding('uv');

		if (typeof uv.errname !== 'function') {
			throw new TypeError('uv.errname is not a function');
		}
	} catch (err) {
		console.error('execa/lib/errname: unable to establish process.binding(\'uv\')', err);
		uv = null;
	}

	errname$1.exports = code => errname(uv, code);
}

// Used for testing the fallback behavior
errname$1.exports.__test__ = errname;

function errname(uv, code) {
	if (uv) {
		return uv.errname(code);
	}

	if (!(code < 0)) {
		throw new Error('err >= 0');
	}

	return `Unknown system error ${code}`;
}

var errnameExports = errname$1.exports;

const alias = ['stdin', 'stdout', 'stderr'];

const hasAlias = opts => alias.some(x => Boolean(opts[x]));

var stdio = opts => {
	if (!opts) {
		return null;
	}

	if (opts.stdio && hasAlias(opts)) {
		throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${alias.map(x => `\`${x}\``).join(', ')}`);
	}

	if (typeof opts.stdio === 'string') {
		return opts.stdio;
	}

	const stdio = opts.stdio || [];

	if (!Array.isArray(stdio)) {
		throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
	}

	const result = [];
	const len = Math.max(stdio.length, alias.length);

	for (let i = 0; i < len; i++) {
		let value = null;

		if (stdio[i] !== undefined) {
			value = stdio[i];
		} else if (opts[alias[i]] !== undefined) {
			value = opts[alias[i]];
		}

		result[i] = value;
	}

	return result;
};

execa.exports;

(function (module) {
	const path = require$$0$1;
	const childProcess = require$$1$1;
	const crossSpawn = crossSpawnExports;
	const stripEof$1 = stripEof;
	const npmRunPath = npmRunPathExports;
	const isStream = isStreamExports;
	const _getStream = getStreamExports;
	const pFinally$1 = pFinally;
	const onExit = signalExitExports;
	const errname = errnameExports;
	const stdio$1 = stdio;

	const TEN_MEGABYTES = 1000 * 1000 * 10;

	function handleArgs(cmd, args, opts) {
		let parsed;

		opts = Object.assign({
			extendEnv: true,
			env: {}
		}, opts);

		if (opts.extendEnv) {
			opts.env = Object.assign({}, process.env, opts.env);
		}

		if (opts.__winShell === true) {
			delete opts.__winShell;
			parsed = {
				command: cmd,
				args,
				options: opts,
				file: cmd,
				original: {
					cmd,
					args
				}
			};
		} else {
			parsed = crossSpawn._parse(cmd, args, opts);
		}

		opts = Object.assign({
			maxBuffer: TEN_MEGABYTES,
			buffer: true,
			stripEof: true,
			preferLocal: true,
			localDir: parsed.options.cwd || process.cwd(),
			encoding: 'utf8',
			reject: true,
			cleanup: true
		}, parsed.options);

		opts.stdio = stdio$1(opts);

		if (opts.preferLocal) {
			opts.env = npmRunPath.env(Object.assign({}, opts, {cwd: opts.localDir}));
		}

		if (opts.detached) {
			// #115
			opts.cleanup = false;
		}

		if (process.platform === 'win32' && path.basename(parsed.command) === 'cmd.exe') {
			// #116
			parsed.args.unshift('/q');
		}

		return {
			cmd: parsed.command,
			args: parsed.args,
			opts,
			parsed
		};
	}

	function handleInput(spawned, input) {
		if (input === null || input === undefined) {
			return;
		}

		if (isStream(input)) {
			input.pipe(spawned.stdin);
		} else {
			spawned.stdin.end(input);
		}
	}

	function handleOutput(opts, val) {
		if (val && opts.stripEof) {
			val = stripEof$1(val);
		}

		return val;
	}

	function handleShell(fn, cmd, opts) {
		let file = '/bin/sh';
		let args = ['-c', cmd];

		opts = Object.assign({}, opts);

		if (process.platform === 'win32') {
			opts.__winShell = true;
			file = process.env.comspec || 'cmd.exe';
			args = ['/s', '/c', `"${cmd}"`];
			opts.windowsVerbatimArguments = true;
		}

		if (opts.shell) {
			file = opts.shell;
			delete opts.shell;
		}

		return fn(file, args, opts);
	}

	function getStream(process, stream, {encoding, buffer, maxBuffer}) {
		if (!process[stream]) {
			return null;
		}

		let ret;

		if (!buffer) {
			// TODO: Use `ret = util.promisify(stream.finished)(process[stream]);` when targeting Node.js 10
			ret = new Promise((resolve, reject) => {
				process[stream]
					.once('end', resolve)
					.once('error', reject);
			});
		} else if (encoding) {
			ret = _getStream(process[stream], {
				encoding,
				maxBuffer
			});
		} else {
			ret = _getStream.buffer(process[stream], {maxBuffer});
		}

		return ret.catch(err => {
			err.stream = stream;
			err.message = `${stream} ${err.message}`;
			throw err;
		});
	}

	function makeError(result, options) {
		const {stdout, stderr} = result;

		let err = result.error;
		const {code, signal} = result;

		const {parsed, joinedCmd} = options;
		const timedOut = options.timedOut || false;

		if (!err) {
			let output = '';

			if (Array.isArray(parsed.opts.stdio)) {
				if (parsed.opts.stdio[2] !== 'inherit') {
					output += output.length > 0 ? stderr : `\n${stderr}`;
				}

				if (parsed.opts.stdio[1] !== 'inherit') {
					output += `\n${stdout}`;
				}
			} else if (parsed.opts.stdio !== 'inherit') {
				output = `\n${stderr}${stdout}`;
			}

			err = new Error(`Command failed: ${joinedCmd}${output}`);
			err.code = code < 0 ? errname(code) : code;
		}

		err.stdout = stdout;
		err.stderr = stderr;
		err.failed = true;
		err.signal = signal || null;
		err.cmd = joinedCmd;
		err.timedOut = timedOut;

		return err;
	}

	function joinCmd(cmd, args) {
		let joinedCmd = cmd;

		if (Array.isArray(args) && args.length > 0) {
			joinedCmd += ' ' + args.join(' ');
		}

		return joinedCmd;
	}

	module.exports = (cmd, args, opts) => {
		const parsed = handleArgs(cmd, args, opts);
		const {encoding, buffer, maxBuffer} = parsed.opts;
		const joinedCmd = joinCmd(cmd, args);

		let spawned;
		try {
			spawned = childProcess.spawn(parsed.cmd, parsed.args, parsed.opts);
		} catch (err) {
			return Promise.reject(err);
		}

		let removeExitHandler;
		if (parsed.opts.cleanup) {
			removeExitHandler = onExit(() => {
				spawned.kill();
			});
		}

		let timeoutId = null;
		let timedOut = false;

		const cleanup = () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}

			if (removeExitHandler) {
				removeExitHandler();
			}
		};

		if (parsed.opts.timeout > 0) {
			timeoutId = setTimeout(() => {
				timeoutId = null;
				timedOut = true;
				spawned.kill(parsed.opts.killSignal);
			}, parsed.opts.timeout);
		}

		const processDone = new Promise(resolve => {
			spawned.on('exit', (code, signal) => {
				cleanup();
				resolve({code, signal});
			});

			spawned.on('error', err => {
				cleanup();
				resolve({error: err});
			});

			if (spawned.stdin) {
				spawned.stdin.on('error', err => {
					cleanup();
					resolve({error: err});
				});
			}
		});

		function destroy() {
			if (spawned.stdout) {
				spawned.stdout.destroy();
			}

			if (spawned.stderr) {
				spawned.stderr.destroy();
			}
		}

		const handlePromise = () => pFinally$1(Promise.all([
			processDone,
			getStream(spawned, 'stdout', {encoding, buffer, maxBuffer}),
			getStream(spawned, 'stderr', {encoding, buffer, maxBuffer})
		]).then(arr => {
			const result = arr[0];
			result.stdout = arr[1];
			result.stderr = arr[2];

			if (result.error || result.code !== 0 || result.signal !== null) {
				const err = makeError(result, {
					joinedCmd,
					parsed,
					timedOut
				});

				// TODO: missing some timeout logic for killed
				// https://github.com/nodejs/node/blob/master/lib/child_process.js#L203
				// err.killed = spawned.killed || killed;
				err.killed = err.killed || spawned.killed;

				if (!parsed.opts.reject) {
					return err;
				}

				throw err;
			}

			return {
				stdout: handleOutput(parsed.opts, result.stdout),
				stderr: handleOutput(parsed.opts, result.stderr),
				code: 0,
				failed: false,
				killed: false,
				signal: null,
				cmd: joinedCmd,
				timedOut: false
			};
		}), destroy);

		crossSpawn._enoent.hookChildProcess(spawned, parsed.parsed);

		handleInput(spawned, parsed.opts.input);

		spawned.then = (onfulfilled, onrejected) => handlePromise().then(onfulfilled, onrejected);
		spawned.catch = onrejected => handlePromise().catch(onrejected);

		return spawned;
	};

	// TODO: set `stderr: 'ignore'` when that option is implemented
	module.exports.stdout = (...args) => module.exports(...args).then(x => x.stdout);

	// TODO: set `stdout: 'ignore'` when that option is implemented
	module.exports.stderr = (...args) => module.exports(...args).then(x => x.stderr);

	module.exports.shell = (cmd, opts) => handleShell(module.exports, cmd, opts);

	module.exports.sync = (cmd, args, opts) => {
		const parsed = handleArgs(cmd, args, opts);
		const joinedCmd = joinCmd(cmd, args);

		if (isStream(parsed.opts.input)) {
			throw new TypeError('The `input` option cannot be a stream in sync mode');
		}

		const result = childProcess.spawnSync(parsed.cmd, parsed.args, parsed.opts);
		result.code = result.status;

		if (result.error || result.status !== 0 || result.signal !== null) {
			const err = makeError(result, {
				joinedCmd,
				parsed
			});

			if (!parsed.opts.reject) {
				return err;
			}

			throw err;
		}

		return {
			stdout: handleOutput(parsed.opts, result.stdout),
			stderr: handleOutput(parsed.opts, result.stderr),
			code: 0,
			failed: false,
			signal: null,
			cmd: joinedCmd,
			timedOut: false
		};
	};

	module.exports.shellSync = (cmd, opts) => handleShell(module.exports.sync, cmd, opts); 
} (execa));

var execaExports = execa.exports;

var cmd;
var hasRequiredCmd;

function requireCmd () {
	if (hasRequiredCmd) return cmd;
	hasRequiredCmd = 1;
	var common = requireCommon();
	var execa = execaExports;

	var DEFAULT_MAXBUFFER_SIZE = 20 * 1024 * 1024;
	var COMMAND_NOT_FOUND_ERROR_CODE = 127;

	common.register('cmd', _cmd, {
	  cmdOptions: null,
	  globStart: 1,
	  canReceivePipe: true,
	  wrapOutput: true,
	});

	function commandNotFound(execaResult) {
	  if (process.platform === 'win32') {
	    var str = 'is not recognized as an internal or external command';
	    return execaResult.code && execaResult.stderr.includes(str);
	  } else {
	    return execaResult.code &&
	      execaResult.stdout === null && execaResult.stderr === null;
	  }
	}

	function _cmd(options, command, commandArgs, userOptions) {
	  if (!command) {
	    common.error('Must specify a non-empty string as a command');
	  }

	  // `options` will usually not have a value: it's added by our commandline flag
	  // parsing engine.
	  commandArgs = [].slice.call(arguments, 2);

	  // `userOptions` may or may not be provided. We need to check the last
	  // argument. If it's an object, assume it's meant to be passed as
	  // userOptions (since ShellStrings are already flattened to strings).
	  if (commandArgs.length === 0) {
	    userOptions = {};
	  } else {
	    var lastArg = commandArgs.pop();
	    if (common.isObject(lastArg)) {
	      userOptions = lastArg;
	    } else {
	      userOptions = {};
	      commandArgs.push(lastArg);
	    }
	  }

	  var pipe = common.readFromPipe();

	  // Some of our defaults differ from execa's defaults. These can be overridden
	  // by the user.
	  var defaultOptions = {
	    maxBuffer: DEFAULT_MAXBUFFER_SIZE,
	    stripEof: false, // Preserve trailing newlines for consistency with unix.
	    reject: false, // Use ShellJS's error handling system.
	  };

	  // For other options, we forbid the user from overriding them (either for
	  // correctness or security).
	  var requiredOptions = {
	    input: pipe,
	    shell: false,
	  };

	  var execaOptions =
	    Object.assign(defaultOptions, userOptions, requiredOptions);

	  var result = execa.sync(command, commandArgs, execaOptions);
	  var stdout;
	  var stderr;
	  var code;
	  if (commandNotFound(result)) {
	    // This can happen if `command` is not an executable binary, or possibly
	    // under other conditions.
	    stdout = '';
	    stderr = "'" + command + "': command not found";
	    code = COMMAND_NOT_FOUND_ERROR_CODE;
	  } else {
	    stdout = result.stdout.toString();
	    stderr = result.stderr.toString();
	    code = result.code;
	  }

	  // Pass `continue: true` so we can specify a value for stdout.
	  if (code) common.error(stderr, code, { silent: true, continue: true });
	  return new common.ShellString(stdout, stderr, code);
	}
	cmd = _cmd;
	return cmd;
}

var cp;
var hasRequiredCp;

function requireCp () {
	if (hasRequiredCp) return cp;
	hasRequiredCp = 1;
	var fs = require$$1;
	var path = require$$0$1;
	var common = requireCommon();

	common.register('cp', _cp, {
	  cmdOptions: {
	    'f': '!no_force',
	    'n': 'no_force',
	    'u': 'update',
	    'R': 'recursive',
	    'r': 'recursive',
	    'L': 'followsymlink',
	    'P': 'noFollowsymlink',
	    'p': 'preserve',
	  },
	  wrapOutput: false,
	});

	// Buffered file copy, synchronous
	// (Using readFileSync() + writeFileSync() could easily cause a memory overflow
	//  with large files)
	function copyFileSync(srcFile, destFile, options) {
	  if (!fs.existsSync(srcFile)) {
	    common.error('copyFileSync: no such file or directory: ' + srcFile);
	  }

	  var isWindows = process.platform === 'win32';

	  // Check the mtimes of the files if the '-u' flag is provided
	  try {
	    if (options.update && common.statFollowLinks(srcFile).mtime < fs.statSync(destFile).mtime) {
	      return;
	    }
	  } catch (e) {
	    // If we're here, destFile probably doesn't exist, so just do a normal copy
	  }

	  if (common.statNoFollowLinks(srcFile).isSymbolicLink() && !options.followsymlink) {
	    try {
	      common.statNoFollowLinks(destFile);
	      common.unlinkSync(destFile); // re-link it
	    } catch (e) {
	      // it doesn't exist, so no work needs to be done
	    }

	    var symlinkFull = fs.readlinkSync(srcFile);
	    fs.symlinkSync(symlinkFull, destFile, isWindows ? 'junction' : null);
	  } else {
	    var buf = common.buffer();
	    var bufLength = buf.length;
	    var bytesRead = bufLength;
	    var pos = 0;
	    var fdr = null;
	    var fdw = null;
	    var srcStat = common.statFollowLinks(srcFile);

	    try {
	      fdr = fs.openSync(srcFile, 'r');
	    } catch (e) {
	      /* istanbul ignore next */
	      common.error('copyFileSync: could not read src file (' + srcFile + ')');
	    }

	    try {
	      fdw = fs.openSync(destFile, 'w', srcStat.mode);
	    } catch (e) {
	      /* istanbul ignore next */
	      common.error('copyFileSync: could not write to dest file (code=' + e.code + '):' + destFile);
	    }

	    while (bytesRead === bufLength) {
	      bytesRead = fs.readSync(fdr, buf, 0, bufLength, pos);
	      fs.writeSync(fdw, buf, 0, bytesRead);
	      pos += bytesRead;
	    }

	    if (options.preserve) {
	      fs.fchownSync(fdw, srcStat.uid, srcStat.gid);
	      // Note: utimesSync does not work (rounds to seconds), but futimesSync has
	      // millisecond precision.
	      fs.futimesSync(fdw, srcStat.atime, srcStat.mtime);
	    }

	    fs.closeSync(fdr);
	    fs.closeSync(fdw);
	  }
	}

	// Recursively copies 'sourceDir' into 'destDir'
	// Adapted from https://github.com/ryanmcgrath/wrench-js
	//
	// Copyright (c) 2010 Ryan McGrath
	// Copyright (c) 2012 Artur Adib
	//
	// Licensed under the MIT License
	// http://www.opensource.org/licenses/mit-license.php
	function cpdirSyncRecursive(sourceDir, destDir, currentDepth, opts) {
	  if (!opts) opts = {};

	  // Ensure there is not a run away recursive copy
	  if (currentDepth >= common.config.maxdepth) return;
	  currentDepth++;

	  var isWindows = process.platform === 'win32';

	  // Create the directory where all our junk is moving to; read the mode/etc. of
	  // the source directory (we'll set this on the destDir at the end).
	  var checkDir = common.statFollowLinks(sourceDir);
	  try {
	    fs.mkdirSync(destDir);
	  } catch (e) {
	    // if the directory already exists, that's okay
	    if (e.code !== 'EEXIST') throw e;
	  }

	  var files = fs.readdirSync(sourceDir);

	  for (var i = 0; i < files.length; i++) {
	    var srcFile = sourceDir + '/' + files[i];
	    var destFile = destDir + '/' + files[i];
	    var srcFileStat = common.statNoFollowLinks(srcFile);

	    var symlinkFull;
	    if (opts.followsymlink) {
	      if (cpcheckcycle(sourceDir, srcFile)) {
	        // Cycle link found.
	        console.error('Cycle link found.');
	        symlinkFull = fs.readlinkSync(srcFile);
	        fs.symlinkSync(symlinkFull, destFile, isWindows ? 'junction' : null);
	        continue;
	      }
	    }
	    if (srcFileStat.isDirectory()) {
	      /* recursion this thing right on back. */
	      cpdirSyncRecursive(srcFile, destFile, currentDepth, opts);
	    } else if (srcFileStat.isSymbolicLink() && !opts.followsymlink) {
	      symlinkFull = fs.readlinkSync(srcFile);
	      try {
	        common.statNoFollowLinks(destFile);
	        common.unlinkSync(destFile); // re-link it
	      } catch (e) {
	        // it doesn't exist, so no work needs to be done
	      }
	      fs.symlinkSync(symlinkFull, destFile, isWindows ? 'junction' : null);
	    } else if (srcFileStat.isSymbolicLink() && opts.followsymlink) {
	      srcFileStat = common.statFollowLinks(srcFile);
	      if (srcFileStat.isDirectory()) {
	        cpdirSyncRecursive(srcFile, destFile, currentDepth, opts);
	      } else {
	        copyFileSync(srcFile, destFile, opts);
	      }
	    } else if (fs.existsSync(destFile) && opts.no_force) {
	      common.log('skipping existing file: ' + files[i]);
	    } else {
	      copyFileSync(srcFile, destFile, opts);
	    }
	  } // for files

	  // finally change the mode for the newly created directory (otherwise, we
	  // couldn't add files to a read-only directory).
	  // var checkDir = common.statFollowLinks(sourceDir);
	  if (opts.preserve) {
	    fs.utimesSync(destDir, checkDir.atime, checkDir.mtime);
	  }
	  fs.chmodSync(destDir, checkDir.mode);
	} // cpdirSyncRecursive

	// Checks if cureent file was created recently
	function checkRecentCreated(sources, index) {
	  var lookedSource = sources[index];
	  return sources.slice(0, index).some(function (src) {
	    return path.basename(src) === path.basename(lookedSource);
	  });
	}

	function cpcheckcycle(sourceDir, srcFile) {
	  var srcFileStat = common.statNoFollowLinks(srcFile);
	  if (srcFileStat.isSymbolicLink()) {
	    // Do cycle check. For example:
	    //   $ mkdir -p 1/2/3/4
	    //   $ cd  1/2/3/4
	    //   $ ln -s ../../3 link
	    //   $ cd ../../../..
	    //   $ cp -RL 1 copy
	    var cyclecheck = common.statFollowLinks(srcFile);
	    if (cyclecheck.isDirectory()) {
	      var sourcerealpath = fs.realpathSync(sourceDir);
	      var symlinkrealpath = fs.realpathSync(srcFile);
	      var re = new RegExp(symlinkrealpath);
	      if (re.test(sourcerealpath)) {
	        return true;
	      }
	    }
	  }
	  return false;
	}

	//@
	//@ ### cp([options,] source [, source ...], dest)
	//@ ### cp([options,] source_array, dest)
	//@
	//@ Available options:
	//@
	//@ + `-f`: force (default behavior)
	//@ + `-n`: no-clobber
	//@ + `-u`: only copy if `source` is newer than `dest`
	//@ + `-r`, `-R`: recursive
	//@ + `-L`: follow symlinks
	//@ + `-P`: don't follow symlinks
	//@ + `-p`: preserve file mode, ownership, and timestamps
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ cp('file1', 'dir1');
	//@ cp('-R', 'path/to/dir/', '~/newCopy/');
	//@ cp('-Rf', '/tmp/*', '/usr/local/*', '/home/tmp');
	//@ cp('-Rf', ['/tmp/*', '/usr/local/*'], '/home/tmp'); // same as above
	//@ ```
	//@
	//@ Copies files. Returns a [ShellString](#shellstringstr) indicating success
	//@ or failure.
	function _cp(options, sources, dest) {
	  // If we're missing -R, it actually implies -L (unless -P is explicit)
	  if (options.followsymlink) {
	    options.noFollowsymlink = false;
	  }
	  if (!options.recursive && !options.noFollowsymlink) {
	    options.followsymlink = true;
	  }

	  // Get sources, dest
	  if (arguments.length < 3) {
	    common.error('missing <source> and/or <dest>');
	  } else {
	    sources = [].slice.call(arguments, 1, arguments.length - 1);
	    dest = arguments[arguments.length - 1];
	  }

	  var destExists = fs.existsSync(dest);
	  var destStat = destExists && common.statFollowLinks(dest);

	  // Dest is not existing dir, but multiple sources given
	  if ((!destExists || !destStat.isDirectory()) && sources.length > 1) {
	    common.error('dest is not a directory (too many sources)');
	  }

	  // Dest is an existing file, but -n is given
	  if (destExists && destStat.isFile() && options.no_force) {
	    return new common.ShellString('', '', 0);
	  }

	  sources.forEach(function (src, srcIndex) {
	    if (!fs.existsSync(src)) {
	      if (src === '') src = "''"; // if src was empty string, display empty string
	      common.error('no such file or directory: ' + src, { continue: true });
	      return; // skip file
	    }
	    var srcStat = common.statFollowLinks(src);
	    if (!options.noFollowsymlink && srcStat.isDirectory()) {
	      if (!options.recursive) {
	        // Non-Recursive
	        common.error("omitting directory '" + src + "'", { continue: true });
	      } else {
	        // Recursive
	        // 'cp /a/source dest' should create 'source' in 'dest'
	        var newDest = (destStat && destStat.isDirectory()) ?
	            path.join(dest, path.basename(src)) :
	            dest;

	        try {
	          common.statFollowLinks(path.dirname(dest));
	          cpdirSyncRecursive(src, newDest, 0, options);
	        } catch (e) {
	          /* istanbul ignore next */
	          common.error("cannot create directory '" + dest + "': No such file or directory");
	        }
	      }
	    } else {
	      // If here, src is a file

	      // When copying to '/path/dir':
	      //    thisDest = '/path/dir/file1'
	      var thisDest = dest;
	      if (destStat && destStat.isDirectory()) {
	        thisDest = path.normalize(dest + '/' + path.basename(src));
	      }

	      var thisDestExists = fs.existsSync(thisDest);
	      if (thisDestExists && checkRecentCreated(sources, srcIndex)) {
	        // cannot overwrite file created recently in current execution, but we want to continue copying other files
	        if (!options.no_force) {
	          common.error("will not overwrite just-created '" + thisDest + "' with '" + src + "'", { continue: true });
	        }
	        return;
	      }

	      if (thisDestExists && options.no_force) {
	        return; // skip file
	      }

	      if (path.relative(src, thisDest) === '') {
	        // a file cannot be copied to itself, but we want to continue copying other files
	        common.error("'" + thisDest + "' and '" + src + "' are the same file", { continue: true });
	        return;
	      }

	      copyFileSync(src, thisDest, options);
	    }
	  }); // forEach(src)

	  return new common.ShellString('', common.state.error, common.state.errorCode);
	}
	cp = _cp;
	return cp;
}

var dirs = {};

var hasRequiredDirs;

function requireDirs () {
	if (hasRequiredDirs) return dirs;
	hasRequiredDirs = 1;
	var common = requireCommon();
	var _cd = requireCd();
	var path = require$$0$1;

	common.register('dirs', _dirs, {
	  wrapOutput: false,
	});
	common.register('pushd', _pushd, {
	  wrapOutput: false,
	});
	common.register('popd', _popd, {
	  wrapOutput: false,
	});

	// Pushd/popd/dirs internals
	var _dirStack = [];

	function _isStackIndex(index) {
	  return (/^[-+]\d+$/).test(index);
	}

	function _parseStackIndex(index) {
	  if (_isStackIndex(index)) {
	    if (Math.abs(index) < _dirStack.length + 1) { // +1 for pwd
	      return (/^-/).test(index) ? Number(index) - 1 : Number(index);
	    }
	    common.error(index + ': directory stack index out of range');
	  } else {
	    common.error(index + ': invalid number');
	  }
	}

	function _actualDirStack() {
	  return [process.cwd()].concat(_dirStack);
	}

	//@
	//@ ### pushd([options,] [dir | '-N' | '+N'])
	//@
	//@ Available options:
	//@
	//@ + `-n`: Suppresses the normal change of directory when adding directories to the stack, so that only the stack is manipulated.
	//@ + `-q`: Suppresses output to the console.
	//@
	//@ Arguments:
	//@
	//@ + `dir`: Sets the current working directory to the top of the stack, then executes the equivalent of `cd dir`.
	//@ + `+N`: Brings the Nth directory (counting from the left of the list printed by dirs, starting with zero) to the top of the list by rotating the stack.
	//@ + `-N`: Brings the Nth directory (counting from the right of the list printed by dirs, starting with zero) to the top of the list by rotating the stack.
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ // process.cwd() === '/usr'
	//@ pushd('/etc'); // Returns /etc /usr
	//@ pushd('+1');   // Returns /usr /etc
	//@ ```
	//@
	//@ Save the current directory on the top of the directory stack and then `cd` to `dir`. With no arguments, `pushd` exchanges the top two directories. Returns an array of paths in the stack.
	function _pushd(options, dir) {
	  if (_isStackIndex(options)) {
	    dir = options;
	    options = '';
	  }

	  options = common.parseOptions(options, {
	    'n': 'no-cd',
	    'q': 'quiet',
	  });

	  var dirs = _actualDirStack();

	  if (dir === '+0') {
	    return dirs; // +0 is a noop
	  } else if (!dir) {
	    if (dirs.length > 1) {
	      dirs = dirs.splice(1, 1).concat(dirs);
	    } else {
	      return common.error('no other directory');
	    }
	  } else if (_isStackIndex(dir)) {
	    var n = _parseStackIndex(dir);
	    dirs = dirs.slice(n).concat(dirs.slice(0, n));
	  } else if (options['no-cd']) {
	    dirs.splice(1, 0, dir);
	  } else {
	    dirs.unshift(dir);
	  }

	  if (options['no-cd']) {
	    dirs = dirs.slice(1);
	  } else {
	    dir = path.resolve(dirs.shift());
	    _cd('', dir);
	  }

	  _dirStack = dirs;
	  return _dirs(options.quiet ? '-q' : '');
	}
	dirs.pushd = _pushd;

	//@
	//@
	//@ ### popd([options,] ['-N' | '+N'])
	//@
	//@ Available options:
	//@
	//@ + `-n`: Suppress the normal directory change when removing directories from the stack, so that only the stack is manipulated.
	//@ + `-q`: Supresses output to the console.
	//@
	//@ Arguments:
	//@
	//@ + `+N`: Removes the Nth directory (counting from the left of the list printed by dirs), starting with zero.
	//@ + `-N`: Removes the Nth directory (counting from the right of the list printed by dirs), starting with zero.
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ echo(process.cwd()); // '/usr'
	//@ pushd('/etc');       // '/etc /usr'
	//@ echo(process.cwd()); // '/etc'
	//@ popd();              // '/usr'
	//@ echo(process.cwd()); // '/usr'
	//@ ```
	//@
	//@ When no arguments are given, `popd` removes the top directory from the stack and performs a `cd` to the new top directory. The elements are numbered from 0, starting at the first directory listed with dirs (i.e., `popd` is equivalent to `popd +0`). Returns an array of paths in the stack.
	function _popd(options, index) {
	  if (_isStackIndex(options)) {
	    index = options;
	    options = '';
	  }

	  options = common.parseOptions(options, {
	    'n': 'no-cd',
	    'q': 'quiet',
	  });

	  if (!_dirStack.length) {
	    return common.error('directory stack empty');
	  }

	  index = _parseStackIndex(index || '+0');

	  if (options['no-cd'] || index > 0 || _dirStack.length + index === 0) {
	    index = index > 0 ? index - 1 : index;
	    _dirStack.splice(index, 1);
	  } else {
	    var dir = path.resolve(_dirStack.shift());
	    _cd('', dir);
	  }

	  return _dirs(options.quiet ? '-q' : '');
	}
	dirs.popd = _popd;

	//@
	//@
	//@ ### dirs([options | '+N' | '-N'])
	//@
	//@ Available options:
	//@
	//@ + `-c`: Clears the directory stack by deleting all of the elements.
	//@ + `-q`: Supresses output to the console.
	//@
	//@ Arguments:
	//@
	//@ + `+N`: Displays the Nth directory (counting from the left of the list printed by dirs when invoked without options), starting with zero.
	//@ + `-N`: Displays the Nth directory (counting from the right of the list printed by dirs when invoked without options), starting with zero.
	//@
	//@ Display the list of currently remembered directories. Returns an array of paths in the stack, or a single path if `+N` or `-N` was specified.
	//@
	//@ See also: `pushd`, `popd`
	function _dirs(options, index) {
	  if (_isStackIndex(options)) {
	    index = options;
	    options = '';
	  }

	  options = common.parseOptions(options, {
	    'c': 'clear',
	    'q': 'quiet',
	  });

	  if (options.clear) {
	    _dirStack = [];
	    return _dirStack;
	  }

	  var stack = _actualDirStack();

	  if (index) {
	    index = _parseStackIndex(index);

	    if (index < 0) {
	      index = stack.length + index;
	    }

	    if (!options.quiet) {
	      common.log(stack[index]);
	    }
	    return stack[index];
	  }

	  if (!options.quiet) {
	    common.log(stack.join(' '));
	  }

	  return stack;
	}
	dirs.dirs = _dirs;
	return dirs;
}

var echo;
var hasRequiredEcho;

function requireEcho () {
	if (hasRequiredEcho) return echo;
	hasRequiredEcho = 1;
	var format = require$$0$4.format;

	var common = requireCommon();

	common.register('echo', _echo, {
	  allowGlobbing: false,
	});

	//@
	//@ ### echo([options,] string [, string ...])
	//@
	//@ Available options:
	//@
	//@ + `-e`: interpret backslash escapes (default)
	//@ + `-n`: remove trailing newline from output
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ echo('hello world');
	//@ var str = echo('hello world');
	//@ echo('-n', 'no newline at end');
	//@ ```
	//@
	//@ Prints `string` to stdout, and returns a [ShellString](#shellstringstr).
	function _echo(opts) {
	  // allow strings starting with '-', see issue #20
	  var messages = [].slice.call(arguments, opts ? 0 : 1);
	  var options = {};

	  // If the first argument starts with '-', parse it as options string.
	  // If parseOptions throws, it wasn't an options string.
	  try {
	    options = common.parseOptions(messages[0], {
	      'e': 'escapes',
	      'n': 'no_newline',
	    }, {
	      silent: true,
	    });

	    // Allow null to be echoed
	    if (messages[0]) {
	      messages.shift();
	    }
	  } catch (_) {
	    // Clear out error if an error occurred
	    common.state.error = null;
	  }

	  var output = format.apply(null, messages);

	  // Add newline if -n is not passed.
	  if (!options.no_newline) {
	    output += '\n';
	  }

	  process.stdout.write(output);

	  return output;
	}

	echo = _echo;
	return echo;
}

var error_1;
var hasRequiredError;

function requireError () {
	if (hasRequiredError) return error_1;
	hasRequiredError = 1;
	var common = requireCommon();

	//@
	//@ ### error()
	//@
	//@ Tests if error occurred in the last command. Returns a truthy value if an
	//@ error returned, or a falsy value otherwise.
	//@
	//@ **Note**: do not rely on the
	//@ return value to be an error message. If you need the last error message, use
	//@ the `.stderr` attribute from the last command's return value instead.
	function error() {
	  return common.state.error;
	}
	error_1 = error;
	return error_1;
}

var errorCode_1;
var hasRequiredErrorCode;

function requireErrorCode () {
	if (hasRequiredErrorCode) return errorCode_1;
	hasRequiredErrorCode = 1;
	var common = requireCommon();

	//@
	//@ ### errorCode()
	//@
	//@ Returns the error code from the last command.
	function errorCode() {
	  return common.state.errorCode;
	}
	errorCode_1 = errorCode;
	return errorCode_1;
}

var tempdir = {};

var hasRequiredTempdir;

function requireTempdir () {
	if (hasRequiredTempdir) return tempdir;
	hasRequiredTempdir = 1;
	var common = requireCommon();
	var os = require$$0$2;
	var fs = require$$1;

	common.register('tempdir', _tempDir, {
	  allowGlobbing: false,
	  wrapOutput: false,
	});

	// Returns false if 'dir' is not a writeable directory, 'dir' otherwise
	function writeableDir(dir) {
	  if (!dir || !fs.existsSync(dir)) return false;

	  if (!common.statFollowLinks(dir).isDirectory()) return false;

	  var testFile = dir + '/' + common.randomFileName();
	  try {
	    fs.writeFileSync(testFile, ' ');
	    common.unlinkSync(testFile);
	    return dir;
	  } catch (e) {
	    /* istanbul ignore next */
	    return false;
	  }
	}

	// Variable to cache the tempdir value for successive lookups.
	var cachedTempDir;

	//@
	//@ ### tempdir()
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ var tmp = tempdir(); // "/tmp" for most *nix platforms
	//@ ```
	//@
	//@ Searches and returns string containing a writeable, platform-dependent temporary directory.
	//@ Follows Python's [tempfile algorithm](http://docs.python.org/library/tempfile.html#tempfile.tempdir).
	function _tempDir() {
	  if (cachedTempDir) return cachedTempDir;

	  cachedTempDir = writeableDir(os.tmpdir()) ||
	                  writeableDir(process.env.TMPDIR) ||
	                  writeableDir(process.env.TEMP) ||
	                  writeableDir(process.env.TMP) ||
	                  writeableDir(process.env.Wimp$ScrapDir) || // RiscOS
	                  writeableDir('C:\\TEMP') || // Windows
	                  writeableDir('C:\\TMP') || // Windows
	                  writeableDir('\\TEMP') || // Windows
	                  writeableDir('\\TMP') || // Windows
	                  writeableDir('/tmp') ||
	                  writeableDir('/var/tmp') ||
	                  writeableDir('/usr/tmp') ||
	                  writeableDir('.'); // last resort

	  return cachedTempDir;
	}

	// Indicates if the tempdir value is currently cached. This is exposed for tests
	// only. The return value should only be tested for truthiness.
	function isCached() {
	  return cachedTempDir;
	}

	// Clears the cached tempDir value, if one is cached. This is exposed for tests
	// only.
	function clearCache() {
	  cachedTempDir = undefined;
	}

	tempdir.tempDir = _tempDir;
	tempdir.isCached = isCached;
	tempdir.clearCache = clearCache;
	return tempdir;
}

var pwd;
var hasRequiredPwd;

function requirePwd () {
	if (hasRequiredPwd) return pwd;
	hasRequiredPwd = 1;
	var path = require$$0$1;
	var common = requireCommon();

	common.register('pwd', _pwd, {
	  allowGlobbing: false,
	});

	//@
	//@ ### pwd()
	//@
	//@ Returns the current directory as a [ShellString](#shellstringstr).
	function _pwd() {
	  var pwd = path.resolve(process.cwd());
	  return pwd;
	}
	pwd = _pwd;
	return pwd;
}

var exec;
var hasRequiredExec;

function requireExec () {
	if (hasRequiredExec) return exec;
	hasRequiredExec = 1;
	var common = requireCommon();
	var _tempDir = requireTempdir().tempDir;
	var _pwd = requirePwd();
	var path = require$$0$1;
	var fs = require$$1;
	var child = require$$1$1;

	var DEFAULT_MAXBUFFER_SIZE = 20 * 1024 * 1024;
	var DEFAULT_ERROR_CODE = 1;

	common.register('exec', _exec, {
	  unix: false,
	  canReceivePipe: true,
	  wrapOutput: false,
	  handlesFatalDynamically: true,
	});

	// We use this function to run `exec` synchronously while also providing realtime
	// output.
	function execSync(cmd, opts, pipe) {
	  if (!common.config.execPath) {
	    try {
	        common.error('Unable to find a path to the node binary. Please manually set config.execPath');
	    } catch (e) {
	      if (opts.fatal) {
	        throw e;
	      }

	      return;
	    }
	  }

	  var tempDir = _tempDir();
	  var paramsFile = path.join(tempDir, common.randomFileName());
	  var stderrFile = path.join(tempDir, common.randomFileName());
	  var stdoutFile = path.join(tempDir, common.randomFileName());

	  opts = common.extend({
	    silent: common.config.silent,
	    fatal: common.config.fatal, // TODO(nfischer): this and the line above are probably unnecessary
	    cwd: _pwd().toString(),
	    env: process.env,
	    maxBuffer: DEFAULT_MAXBUFFER_SIZE,
	    encoding: 'utf8',
	  }, opts);

	  if (fs.existsSync(paramsFile)) common.unlinkSync(paramsFile);
	  if (fs.existsSync(stderrFile)) common.unlinkSync(stderrFile);
	  if (fs.existsSync(stdoutFile)) common.unlinkSync(stdoutFile);

	  opts.cwd = path.resolve(opts.cwd);

	  var paramsToSerialize = {
	    command: cmd,
	    execOptions: opts,
	    pipe: pipe,
	    stdoutFile: stdoutFile,
	    stderrFile: stderrFile,
	  };

	  // Create the files and ensure these are locked down (for read and write) to
	  // the current user. The main concerns here are:
	  //
	  // * If we execute a command which prints sensitive output, then
	  //   stdoutFile/stderrFile must not be readable by other users.
	  // * paramsFile must not be readable by other users, or else they can read it
	  //   to figure out the path for stdoutFile/stderrFile and create these first
	  //   (locked down to their own access), which will crash exec() when it tries
	  //   to write to the files.
	  function writeFileLockedDown(filePath, data) {
	    fs.writeFileSync(filePath, data, {
	      encoding: 'utf8',
	      mode: parseInt('600', 8),
	    });
	  }
	  writeFileLockedDown(stdoutFile, '');
	  writeFileLockedDown(stderrFile, '');
	  writeFileLockedDown(paramsFile, JSON.stringify(paramsToSerialize));

	  var execArgs = [
	    path.join(__dirname, 'exec-child.js'),
	    paramsFile,
	  ];

	  /* istanbul ignore else */
	  if (opts.silent) {
	    opts.stdio = 'ignore';
	  } else {
	    opts.stdio = [0, 1, 2];
	  }

	  var code = 0;

	  // Welcome to the future
	  try {
	    // Bad things if we pass in a `shell` option to child_process.execFileSync,
	    // so we need to explicitly remove it here.
	    delete opts.shell;

	    child.execFileSync(common.config.execPath, execArgs, opts);
	  } catch (e) {
	    // Commands with non-zero exit code raise an exception.
	    code = e.status || DEFAULT_ERROR_CODE;
	  }

	  // fs.readFileSync uses buffer encoding by default, so call
	  // it without the encoding option if the encoding is 'buffer'.
	  // Also, if the exec timeout is too short for node to start up,
	  // the files will not be created, so these calls will throw.
	  var stdout = '';
	  var stderr = '';
	  if (opts.encoding === 'buffer') {
	    stdout = fs.readFileSync(stdoutFile);
	    stderr = fs.readFileSync(stderrFile);
	  } else {
	    stdout = fs.readFileSync(stdoutFile, opts.encoding);
	    stderr = fs.readFileSync(stderrFile, opts.encoding);
	  }

	  // No biggie if we can't erase the files now -- they're in a temp dir anyway
	  // and we locked down permissions (see the note above).
	  try { common.unlinkSync(paramsFile); } catch (e) {}
	  try { common.unlinkSync(stderrFile); } catch (e) {}
	  try { common.unlinkSync(stdoutFile); } catch (e) {}

	  if (code !== 0) {
	    // Note: `silent` should be unconditionally true to avoid double-printing
	    // the command's stderr, and to avoid printing any stderr when the user has
	    // set `shell.config.silent`.
	    common.error(stderr, code, { continue: true, silent: true, fatal: opts.fatal });
	  }
	  var obj = common.ShellString(stdout, stderr, code);
	  return obj;
	} // execSync()

	// Wrapper around exec() to enable echoing output to console in real time
	function execAsync(cmd, opts, pipe, callback) {
	  opts = common.extend({
	    silent: common.config.silent,
	    fatal: common.config.fatal, // TODO(nfischer): this and the line above are probably unnecessary
	    cwd: _pwd().toString(),
	    env: process.env,
	    maxBuffer: DEFAULT_MAXBUFFER_SIZE,
	    encoding: 'utf8',
	  }, opts);

	  var c = child.exec(cmd, opts, function (err, stdout, stderr) {
	    if (callback) {
	      if (!err) {
	        callback(0, stdout, stderr);
	      } else if (err.code === undefined) {
	        // See issue #536
	        /* istanbul ignore next */
	        callback(1, stdout, stderr);
	      } else {
	        callback(err.code, stdout, stderr);
	      }
	    }
	  });

	  if (pipe) c.stdin.end(pipe);

	  if (!opts.silent) {
	    c.stdout.pipe(process.stdout);
	    c.stderr.pipe(process.stderr);
	  }

	  return c;
	}

	//@
	//@ ### exec(command [, options] [, callback])
	//@
	//@ Available options:
	//@
	//@ + `async`: Asynchronous execution. If a callback is provided, it will be set to
	//@   `true`, regardless of the passed value (default: `false`).
	//@ + `fatal`: Exit upon error (default: `false`).
	//@ + `silent`: Do not echo program output to console (default: `false`).
	//@ + `encoding`: Character encoding to use. Affects the values returned to stdout and stderr, and
	//@   what is written to stdout and stderr when not in silent mode (default: `'utf8'`).
	//@ + and any option available to Node.js's
	//@   [`child_process.exec()`](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ var version = exec('node --version', {silent:true}).stdout;
	//@
	//@ var child = exec('some_long_running_process', {async:true});
	//@ child.stdout.on('data', function(data) {
	//@   /* ... do something with data ... */
	//@ });
	//@
	//@ exec('some_long_running_process', function(code, stdout, stderr) {
	//@   console.log('Exit code:', code);
	//@   console.log('Program output:', stdout);
	//@   console.log('Program stderr:', stderr);
	//@ });
	//@ ```
	//@
	//@ Executes the given `command` _synchronously_, unless otherwise specified.
	//@ When in synchronous mode, this returns a [ShellString](#shellstringstr).
	//@ Otherwise, this returns the child process object, and the `callback`
	//@ receives the arguments `(code, stdout, stderr)`.
	//@
	//@ Not seeing the behavior you want? `exec()` runs everything through `sh`
	//@ by default (or `cmd.exe` on Windows), which differs from `bash`. If you
	//@ need bash-specific behavior, try out the `{shell: 'path/to/bash'}` option.
	//@
	//@ **Security note:** as `shell.exec()` executes an arbitrary string in the
	//@ system shell, it is **critical** to properly sanitize user input to avoid
	//@ **command injection**. For more context, consult the [Security
	//@ Guidelines](https://github.com/shelljs/shelljs/wiki/Security-guidelines).
	function _exec(command, options, callback) {
	  options = options || {};

	  var pipe = common.readFromPipe();

	  // Callback is defined instead of options.
	  if (typeof options === 'function') {
	    callback = options;
	    options = { async: true };
	  }

	  // Callback is defined with options.
	  if (typeof options === 'object' && typeof callback === 'function') {
	    options.async = true;
	  }

	  options = common.extend({
	    silent: common.config.silent,
	    fatal: common.config.fatal,
	    async: false,
	  }, options);

	  if (!command) {
	    try {
	      common.error('must specify command');
	    } catch (e) {
	      if (options.fatal) {
	        throw e;
	      }

	      return;
	    }
	  }

	  if (options.async) {
	    return execAsync(command, options, pipe, callback);
	  } else {
	    return execSync(command, options, pipe);
	  }
	}
	exec = _exec;
	return exec;
}

var ls;
var hasRequiredLs;

function requireLs () {
	if (hasRequiredLs) return ls;
	hasRequiredLs = 1;
	var path = require$$0$1;
	var fs = require$$1;
	var common = requireCommon();
	var glob = requireGlob();

	var globPatternRecursive = path.sep + '**';

	common.register('ls', _ls, {
	  cmdOptions: {
	    'R': 'recursive',
	    'A': 'all',
	    'L': 'link',
	    'a': 'all_deprecated',
	    'd': 'directory',
	    'l': 'long',
	  },
	});

	//@
	//@ ### ls([options,] [path, ...])
	//@ ### ls([options,] path_array)
	//@
	//@ Available options:
	//@
	//@ + `-R`: recursive
	//@ + `-A`: all files (include files beginning with `.`, except for `.` and `..`)
	//@ + `-L`: follow symlinks
	//@ + `-d`: list directories themselves, not their contents
	//@ + `-l`: provides more details for each file. Specifically, each file is
	//@         represented by a structured object with separate fields for file
	//@         metadata (see
	//@         [`fs.Stats`](https://nodejs.org/api/fs.html#fs_class_fs_stats)). The
	//@         return value also overrides `.toString()` to resemble `ls -l`'s
	//@         output format for human readability, but programmatic usage should
	//@         depend on the stable object format rather than the `.toString()`
	//@         representation.
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ ls('projs/*.js');
	//@ ls('projs/**/*.js'); // Find all js files recursively in projs
	//@ ls('-R', '/users/me', '/tmp');
	//@ ls('-R', ['/users/me', '/tmp']); // same as above
	//@ ls('-l', 'file.txt'); // { name: 'file.txt', mode: 33188, nlink: 1, ...}
	//@ ```
	//@
	//@ Returns a [ShellString](#shellstringstr) (with array-like properties) of all
	//@ the files in the given `path`, or files in the current directory if no
	//@ `path` is  provided.
	function _ls(options, paths) {
	  if (options.all_deprecated) {
	    // We won't support the -a option as it's hard to image why it's useful
	    // (it includes '.' and '..' in addition to '.*' files)
	    // For backwards compatibility we'll dump a deprecated message and proceed as before
	    common.log('ls: Option -a is deprecated. Use -A instead');
	    options.all = true;
	  }

	  if (!paths) {
	    paths = ['.'];
	  } else {
	    paths = [].slice.call(arguments, 1);
	  }

	  var list = [];

	  function pushFile(abs, relName, stat) {
	    if (process.platform === 'win32') {
	      relName = relName.replace(/\\/g, '/');
	    }
	    if (options.long) {
	      stat = stat || (options.link ? common.statFollowLinks(abs) : common.statNoFollowLinks(abs));
	      list.push(addLsAttributes(relName, stat));
	    } else {
	      // list.push(path.relative(rel || '.', file));
	      list.push(relName);
	    }
	  }

	  paths.forEach(function (p) {
	    var stat;

	    try {
	      stat = options.link ? common.statFollowLinks(p) : common.statNoFollowLinks(p);
	      // follow links to directories by default
	      if (stat.isSymbolicLink()) {
	        /* istanbul ignore next */
	        // workaround for https://github.com/shelljs/shelljs/issues/795
	        // codecov seems to have a bug that miscalculate this block as uncovered.
	        // but according to nyc report this block does get covered.
	        try {
	          var _stat = common.statFollowLinks(p);
	          if (_stat.isDirectory()) {
	            stat = _stat;
	          }
	        } catch (_) {} // bad symlink, treat it like a file
	      }
	    } catch (e) {
	      common.error('no such file or directory: ' + p, 2, { continue: true });
	      return;
	    }

	    // If the stat succeeded
	    if (stat.isDirectory() && !options.directory) {
	      if (options.recursive) {
	        // use glob, because it's simple
	        glob.sync(p + globPatternRecursive, { dot: options.all, follow: options.link })
	          .forEach(function (item) {
	            // Glob pattern returns the directory itself and needs to be filtered out.
	            if (path.relative(p, item)) {
	              pushFile(item, path.relative(p, item));
	            }
	          });
	      } else if (options.all) {
	        // use fs.readdirSync, because it's fast
	        fs.readdirSync(p).forEach(function (item) {
	          pushFile(path.join(p, item), item);
	        });
	      } else {
	        // use fs.readdirSync and then filter out secret files
	        fs.readdirSync(p).forEach(function (item) {
	          if (item[0] !== '.') {
	            pushFile(path.join(p, item), item);
	          }
	        });
	      }
	    } else {
	      pushFile(p, p, stat);
	    }
	  });

	  // Add methods, to make this more compatible with ShellStrings
	  return list;
	}

	function addLsAttributes(pathName, stats) {
	  // Note: this object will contain more information than .toString() returns
	  stats.name = pathName;
	  stats.toString = function () {
	    // Return a string resembling unix's `ls -l` format
	    return [this.mode, this.nlink, this.uid, this.gid, this.size, this.mtime, this.name].join(' ');
	  };
	  return stats;
	}

	ls = _ls;
	return ls;
}

var find;
var hasRequiredFind;

function requireFind () {
	if (hasRequiredFind) return find;
	hasRequiredFind = 1;
	var path = require$$0$1;
	var common = requireCommon();
	var _ls = requireLs();

	common.register('find', _find, {
	  cmdOptions: {
	    'L': 'link',
	  },
	});

	//@
	//@ ### find(path [, path ...])
	//@ ### find(path_array)
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ find('src', 'lib');
	//@ find(['src', 'lib']); // same as above
	//@ find('.').filter(function(file) { return file.match(/\.js$/); });
	//@ ```
	//@
	//@ Returns a [ShellString](#shellstringstr) (with array-like properties) of all
	//@ files (however deep) in the given paths.
	//@
	//@ The main difference from `ls('-R', path)` is that the resulting file names
	//@ include the base directories (e.g., `lib/resources/file1` instead of just `file1`).
	function _find(options, paths) {
	  if (!paths) {
	    common.error('no path specified');
	  } else if (typeof paths === 'string') {
	    paths = [].slice.call(arguments, 1);
	  }

	  var list = [];

	  function pushFile(file) {
	    if (process.platform === 'win32') {
	      file = file.replace(/\\/g, '/');
	    }
	    list.push(file);
	  }

	  // why not simply do `ls('-R', paths)`? because the output wouldn't give the base dirs
	  // to get the base dir in the output, we need instead `ls('-R', 'dir/*')` for every directory

	  paths.forEach(function (file) {
	    var stat;
	    try {
	      stat = common.statFollowLinks(file);
	    } catch (e) {
	      common.error('no such file or directory: ' + file);
	    }

	    pushFile(file);

	    if (stat.isDirectory()) {
	      _ls({ recursive: true, all: true, link: options.link }, file).forEach(function (subfile) {
	        pushFile(path.join(file, subfile));
	      });
	    }
	  });

	  return list;
	}
	find = _find;
	return find;
}

var grep;
var hasRequiredGrep;

function requireGrep () {
	if (hasRequiredGrep) return grep;
	hasRequiredGrep = 1;
	var common = requireCommon();
	var fs = require$$1;

	common.register('grep', _grep, {
	  globStart: 2, // don't glob-expand the regex
	  canReceivePipe: true,
	  cmdOptions: {
	    'v': 'inverse',
	    'l': 'nameOnly',
	    'i': 'ignoreCase',
	    'n': 'lineNumber',
	  },
	});

	//@
	//@ ### grep([options,] regex_filter, file [, file ...])
	//@ ### grep([options,] regex_filter, file_array)
	//@
	//@ Available options:
	//@
	//@ + `-v`: Invert `regex_filter` (only print non-matching lines).
	//@ + `-l`: Print only filenames of matching files.
	//@ + `-i`: Ignore case.
	//@ + `-n`: Print line numbers.
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ grep('-v', 'GLOBAL_VARIABLE', '*.js');
	//@ grep('GLOBAL_VARIABLE', '*.js');
	//@ ```
	//@
	//@ Reads input string from given files and returns a
	//@ [ShellString](#shellstringstr) containing all lines of the @ file that match
	//@ the given `regex_filter`.
	function _grep(options, regex, files) {
	  // Check if this is coming from a pipe
	  var pipe = common.readFromPipe();

	  if (!files && !pipe) common.error('no paths given', 2);

	  files = [].slice.call(arguments, 2);

	  if (pipe) {
	    files.unshift('-');
	  }

	  var grep = [];
	  if (options.ignoreCase) {
	    regex = new RegExp(regex, 'i');
	  }
	  files.forEach(function (file) {
	    if (!fs.existsSync(file) && file !== '-') {
	      common.error('no such file or directory: ' + file, 2, { continue: true });
	      return;
	    }

	    var contents = file === '-' ? pipe : fs.readFileSync(file, 'utf8');
	    if (options.nameOnly) {
	      if (contents.match(regex)) {
	        grep.push(file);
	      }
	    } else {
	      var lines = contents.split('\n');
	      lines.forEach(function (line, index) {
	        var matched = line.match(regex);
	        if ((options.inverse && !matched) || (!options.inverse && matched)) {
	          var result = line;
	          if (options.lineNumber) {
	            result = '' + (index + 1) + ':' + line;
	          }
	          grep.push(result);
	        }
	      });
	    }
	  });

	  if (grep.length === 0 && common.state.errorCode !== 2) {
	    // We didn't hit the error above, but pattern didn't match
	    common.error('', { silent: true });
	  }
	  return grep.join('\n') + '\n';
	}
	grep = _grep;
	return grep;
}

var head;
var hasRequiredHead;

function requireHead () {
	if (hasRequiredHead) return head;
	hasRequiredHead = 1;
	var common = requireCommon();
	var fs = require$$1;

	common.register('head', _head, {
	  canReceivePipe: true,
	  cmdOptions: {
	    'n': 'numLines',
	  },
	});

	// Reads |numLines| lines or the entire file, whichever is less.
	function readSomeLines(file, numLines) {
	  var buf = common.buffer();
	  var bufLength = buf.length;
	  var bytesRead = bufLength;
	  var pos = 0;

	  var fdr = fs.openSync(file, 'r');
	  var numLinesRead = 0;
	  var ret = '';
	  while (bytesRead === bufLength && numLinesRead < numLines) {
	    bytesRead = fs.readSync(fdr, buf, 0, bufLength, pos);
	    var bufStr = buf.toString('utf8', 0, bytesRead);
	    numLinesRead += bufStr.split('\n').length - 1;
	    ret += bufStr;
	    pos += bytesRead;
	  }

	  fs.closeSync(fdr);
	  return ret;
	}

	//@
	//@ ### head([{'-n': \<num\>},] file [, file ...])
	//@ ### head([{'-n': \<num\>},] file_array)
	//@
	//@ Available options:
	//@
	//@ + `-n <num>`: Show the first `<num>` lines of the files
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ var str = head({'-n': 1}, 'file*.txt');
	//@ var str = head('file1', 'file2');
	//@ var str = head(['file1', 'file2']); // same as above
	//@ ```
	//@
	//@ Read the start of a `file`. Returns a [ShellString](#shellstringstr).
	function _head(options, files) {
	  var head = [];
	  var pipe = common.readFromPipe();

	  if (!files && !pipe) common.error('no paths given');

	  var idx = 1;
	  if (options.numLines === true) {
	    idx = 2;
	    options.numLines = Number(arguments[1]);
	  } else if (options.numLines === false) {
	    options.numLines = 10;
	  }
	  files = [].slice.call(arguments, idx);

	  if (pipe) {
	    files.unshift('-');
	  }

	  var shouldAppendNewline = false;
	  files.forEach(function (file) {
	    if (file !== '-') {
	      if (!fs.existsSync(file)) {
	        common.error('no such file or directory: ' + file, { continue: true });
	        return;
	      } else if (common.statFollowLinks(file).isDirectory()) {
	        common.error("error reading '" + file + "': Is a directory", {
	          continue: true,
	        });
	        return;
	      }
	    }

	    var contents;
	    if (file === '-') {
	      contents = pipe;
	    } else if (options.numLines < 0) {
	      contents = fs.readFileSync(file, 'utf8');
	    } else {
	      contents = readSomeLines(file, options.numLines);
	    }

	    var lines = contents.split('\n');
	    var hasTrailingNewline = (lines[lines.length - 1] === '');
	    if (hasTrailingNewline) {
	      lines.pop();
	    }
	    shouldAppendNewline = (hasTrailingNewline || options.numLines < lines.length);

	    head = head.concat(lines.slice(0, options.numLines));
	  });

	  if (shouldAppendNewline) {
	    head.push(''); // to add a trailing newline once we join
	  }
	  return head.join('\n');
	}
	head = _head;
	return head;
}

var ln;
var hasRequiredLn;

function requireLn () {
	if (hasRequiredLn) return ln;
	hasRequiredLn = 1;
	var fs = require$$1;
	var path = require$$0$1;
	var common = requireCommon();

	common.register('ln', _ln, {
	  cmdOptions: {
	    's': 'symlink',
	    'f': 'force',
	  },
	});

	//@
	//@ ### ln([options,] source, dest)
	//@
	//@ Available options:
	//@
	//@ + `-s`: symlink
	//@ + `-f`: force
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ ln('file', 'newlink');
	//@ ln('-sf', 'file', 'existing');
	//@ ```
	//@
	//@ Links `source` to `dest`. Use `-f` to force the link, should `dest` already
	//@ exist. Returns a [ShellString](#shellstringstr) indicating success or
	//@ failure.
	function _ln(options, source, dest) {
	  if (!source || !dest) {
	    common.error('Missing <source> and/or <dest>');
	  }

	  source = String(source);
	  var sourcePath = path.normalize(source).replace(RegExp(path.sep + '$'), '');
	  var isAbsolute = (path.resolve(source) === sourcePath);
	  dest = path.resolve(process.cwd(), String(dest));

	  if (fs.existsSync(dest)) {
	    if (!options.force) {
	      common.error('Destination file exists', { continue: true });
	    }

	    fs.unlinkSync(dest);
	  }

	  if (options.symlink) {
	    var isWindows = process.platform === 'win32';
	    var linkType = isWindows ? 'file' : null;
	    var resolvedSourcePath = isAbsolute ? sourcePath : path.resolve(process.cwd(), path.dirname(dest), source);
	    if (!fs.existsSync(resolvedSourcePath)) {
	      common.error('Source file does not exist', { continue: true });
	    } else if (isWindows && common.statFollowLinks(resolvedSourcePath).isDirectory()) {
	      linkType = 'junction';
	    }

	    try {
	      fs.symlinkSync(linkType === 'junction' ? resolvedSourcePath : source, dest, linkType);
	    } catch (err) {
	      common.error(err.message);
	    }
	  } else {
	    if (!fs.existsSync(source)) {
	      common.error('Source file does not exist', { continue: true });
	    }
	    try {
	      fs.linkSync(source, dest);
	    } catch (err) {
	      common.error(err.message);
	    }
	  }
	  return '';
	}
	ln = _ln;
	return ln;
}

var mkdir;
var hasRequiredMkdir;

function requireMkdir () {
	if (hasRequiredMkdir) return mkdir;
	hasRequiredMkdir = 1;
	var common = requireCommon();
	var fs = require$$1;
	var path = require$$0$1;

	common.register('mkdir', _mkdir, {
	  cmdOptions: {
	    'p': 'fullpath',
	  },
	});

	// Recursively creates `dir`
	function mkdirSyncRecursive(dir) {
	  var baseDir = path.dirname(dir);

	  // Prevents some potential problems arising from malformed UNCs or
	  // insufficient permissions.
	  /* istanbul ignore next */
	  if (baseDir === dir) {
	    common.error('dirname() failed: [' + dir + ']');
	  }

	  // Base dir does not exist, go recursive
	  if (!fs.existsSync(baseDir)) {
	    mkdirSyncRecursive(baseDir);
	  }

	  try {
	    // Base dir created, can create dir
	    fs.mkdirSync(dir, parseInt('0777', 8));
	  } catch (e) {
	    // swallow error if dir already exists
	    if (e.code !== 'EEXIST' || common.statNoFollowLinks(dir).isFile()) { throw e; }
	  }
	}

	//@
	//@ ### mkdir([options,] dir [, dir ...])
	//@ ### mkdir([options,] dir_array)
	//@
	//@ Available options:
	//@
	//@ + `-p`: full path (and create intermediate directories, if necessary)
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ mkdir('-p', '/tmp/a/b/c/d', '/tmp/e/f/g');
	//@ mkdir('-p', ['/tmp/a/b/c/d', '/tmp/e/f/g']); // same as above
	//@ ```
	//@
	//@ Creates directories. Returns a [ShellString](#shellstringstr) indicating
	//@ success or failure.
	function _mkdir(options, dirs) {
	  if (!dirs) common.error('no paths given');

	  if (typeof dirs === 'string') {
	    dirs = [].slice.call(arguments, 1);
	  }
	  // if it's array leave it as it is

	  dirs.forEach(function (dir) {
	    try {
	      var stat = common.statNoFollowLinks(dir);
	      if (!options.fullpath) {
	        common.error('path already exists: ' + dir, { continue: true });
	      } else if (stat.isFile()) {
	        common.error('cannot create directory ' + dir + ': File exists', { continue: true });
	      }
	      return; // skip dir
	    } catch (e) {
	      // do nothing
	    }

	    // Base dir does not exist, and no -p option given
	    var baseDir = path.dirname(dir);
	    if (!fs.existsSync(baseDir) && !options.fullpath) {
	      common.error('no such file or directory: ' + baseDir, { continue: true });
	      return; // skip dir
	    }

	    try {
	      if (options.fullpath) {
	        mkdirSyncRecursive(path.resolve(dir));
	      } else {
	        fs.mkdirSync(dir, parseInt('0777', 8));
	      }
	    } catch (e) {
	      var reason;
	      if (e.code === 'EACCES') {
	        reason = 'Permission denied';
	      } else if (e.code === 'ENOTDIR' || e.code === 'ENOENT') {
	        reason = 'Not a directory';
	      } else {
	        /* istanbul ignore next */
	        throw e;
	      }
	      common.error('cannot create directory ' + dir + ': ' + reason, { continue: true });
	    }
	  });
	  return '';
	} // man arraykdir
	mkdir = _mkdir;
	return mkdir;
}

var rm;
var hasRequiredRm;

function requireRm () {
	if (hasRequiredRm) return rm;
	hasRequiredRm = 1;
	var common = requireCommon();
	var fs = require$$1;

	common.register('rm', _rm, {
	  cmdOptions: {
	    'f': 'force',
	    'r': 'recursive',
	    'R': 'recursive',
	  },
	});

	// Recursively removes 'dir'
	// Adapted from https://github.com/ryanmcgrath/wrench-js
	//
	// Copyright (c) 2010 Ryan McGrath
	// Copyright (c) 2012 Artur Adib
	//
	// Licensed under the MIT License
	// http://www.opensource.org/licenses/mit-license.php
	function rmdirSyncRecursive(dir, force, fromSymlink) {
	  var files;

	  files = fs.readdirSync(dir);

	  // Loop through and delete everything in the sub-tree after checking it
	  for (var i = 0; i < files.length; i++) {
	    var file = dir + '/' + files[i];
	    var currFile = common.statNoFollowLinks(file);

	    if (currFile.isDirectory()) { // Recursive function back to the beginning
	      rmdirSyncRecursive(file, force);
	    } else if (force || isWriteable(file)) {
	      // Assume it's a file - perhaps a try/catch belongs here?
	      try {
	        common.unlinkSync(file);
	      } catch (e) {
	        /* istanbul ignore next */
	        common.error('could not remove file (code ' + e.code + '): ' + file, {
	          continue: true,
	        });
	      }
	    }
	  }

	  // if was directory was referenced through a symbolic link,
	  // the contents should be removed, but not the directory itself
	  if (fromSymlink) return;

	  // Now that we know everything in the sub-tree has been deleted, we can delete the main directory.
	  // Huzzah for the shopkeep.

	  var result;
	  try {
	    // Retry on windows, sometimes it takes a little time before all the files in the directory are gone
	    var start = Date.now();

	    // TODO: replace this with a finite loop
	    for (;;) {
	      try {
	        result = fs.rmdirSync(dir);
	        if (fs.existsSync(dir)) throw { code: 'EAGAIN' };
	        break;
	      } catch (er) {
	        /* istanbul ignore next */
	        // In addition to error codes, also check if the directory still exists and loop again if true
	        if (process.platform === 'win32' && (er.code === 'ENOTEMPTY' || er.code === 'EBUSY' || er.code === 'EPERM' || er.code === 'EAGAIN')) {
	          if (Date.now() - start > 1000) throw er;
	        } else if (er.code === 'ENOENT') {
	          // Directory did not exist, deletion was successful
	          break;
	        } else {
	          throw er;
	        }
	      }
	    }
	  } catch (e) {
	    common.error('could not remove directory (code ' + e.code + '): ' + dir, { continue: true });
	  }

	  return result;
	} // rmdirSyncRecursive

	// Hack to determine if file has write permissions for current user
	// Avoids having to check user, group, etc, but it's probably slow
	function isWriteable(file) {
	  var writePermission = true;
	  try {
	    var __fd = fs.openSync(file, 'a');
	    fs.closeSync(__fd);
	  } catch (e) {
	    writePermission = false;
	  }

	  return writePermission;
	}

	function handleFile(file, options) {
	  if (options.force || isWriteable(file)) {
	    // -f was passed, or file is writable, so it can be removed
	    common.unlinkSync(file);
	  } else {
	    common.error('permission denied: ' + file, { continue: true });
	  }
	}

	function handleDirectory(file, options) {
	  if (options.recursive) {
	    // -r was passed, so directory can be removed
	    rmdirSyncRecursive(file, options.force);
	  } else {
	    common.error('path is a directory', { continue: true });
	  }
	}

	function handleSymbolicLink(file, options) {
	  var stats;
	  try {
	    stats = common.statFollowLinks(file);
	  } catch (e) {
	    // symlink is broken, so remove the symlink itself
	    common.unlinkSync(file);
	    return;
	  }

	  if (stats.isFile()) {
	    common.unlinkSync(file);
	  } else if (stats.isDirectory()) {
	    if (file[file.length - 1] === '/') {
	      // trailing separator, so remove the contents, not the link
	      if (options.recursive) {
	        // -r was passed, so directory can be removed
	        var fromSymlink = true;
	        rmdirSyncRecursive(file, options.force, fromSymlink);
	      } else {
	        common.error('path is a directory', { continue: true });
	      }
	    } else {
	      // no trailing separator, so remove the link
	      common.unlinkSync(file);
	    }
	  }
	}

	function handleFIFO(file) {
	  common.unlinkSync(file);
	}

	//@
	//@ ### rm([options,] file [, file ...])
	//@ ### rm([options,] file_array)
	//@
	//@ Available options:
	//@
	//@ + `-f`: force
	//@ + `-r, -R`: recursive
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ rm('-rf', '/tmp/*');
	//@ rm('some_file.txt', 'another_file.txt');
	//@ rm(['some_file.txt', 'another_file.txt']); // same as above
	//@ ```
	//@
	//@ Removes files. Returns a [ShellString](#shellstringstr) indicating success
	//@ or failure.
	function _rm(options, files) {
	  if (!files) common.error('no paths given');

	  // Convert to array
	  files = [].slice.call(arguments, 1);

	  files.forEach(function (file) {
	    var lstats;
	    try {
	      var filepath = (file[file.length - 1] === '/')
	        ? file.slice(0, -1) // remove the '/' so lstatSync can detect symlinks
	        : file;
	      lstats = common.statNoFollowLinks(filepath); // test for existence
	    } catch (e) {
	      // Path does not exist, no force flag given
	      if (!options.force) {
	        common.error('no such file or directory: ' + file, { continue: true });
	      }
	      return; // skip file
	    }

	    // If here, path exists
	    if (lstats.isFile()) {
	      handleFile(file, options);
	    } else if (lstats.isDirectory()) {
	      handleDirectory(file, options);
	    } else if (lstats.isSymbolicLink()) {
	      handleSymbolicLink(file, options);
	    } else if (lstats.isFIFO()) {
	      handleFIFO(file);
	    }
	  }); // forEach(file)
	  return '';
	} // rm
	rm = _rm;
	return rm;
}

var mv;
var hasRequiredMv;

function requireMv () {
	if (hasRequiredMv) return mv;
	hasRequiredMv = 1;
	var fs = require$$1;
	var path = require$$0$1;
	var common = requireCommon();
	var cp = requireCp();
	var rm = requireRm();

	common.register('mv', _mv, {
	  cmdOptions: {
	    'f': '!no_force',
	    'n': 'no_force',
	  },
	});

	// Checks if cureent file was created recently
	function checkRecentCreated(sources, index) {
	  var lookedSource = sources[index];
	  return sources.slice(0, index).some(function (src) {
	    return path.basename(src) === path.basename(lookedSource);
	  });
	}

	//@
	//@ ### mv([options ,] source [, source ...], dest')
	//@ ### mv([options ,] source_array, dest')
	//@
	//@ Available options:
	//@
	//@ + `-f`: force (default behavior)
	//@ + `-n`: no-clobber
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ mv('-n', 'file', 'dir/');
	//@ mv('file1', 'file2', 'dir/');
	//@ mv(['file1', 'file2'], 'dir/'); // same as above
	//@ ```
	//@
	//@ Moves `source` file(s) to `dest`. Returns a [ShellString](#shellstringstr)
	//@ indicating success or failure.
	function _mv(options, sources, dest) {
	  // Get sources, dest
	  if (arguments.length < 3) {
	    common.error('missing <source> and/or <dest>');
	  } else if (arguments.length > 3) {
	    sources = [].slice.call(arguments, 1, arguments.length - 1);
	    dest = arguments[arguments.length - 1];
	  } else if (typeof sources === 'string') {
	    sources = [sources];
	  } else {
	    // TODO(nate): figure out if we actually need this line
	    common.error('invalid arguments');
	  }

	  var exists = fs.existsSync(dest);
	  var stats = exists && common.statFollowLinks(dest);

	  // Dest is not existing dir, but multiple sources given
	  if ((!exists || !stats.isDirectory()) && sources.length > 1) {
	    common.error('dest is not a directory (too many sources)');
	  }

	  // Dest is an existing file, but no -f given
	  if (exists && stats.isFile() && options.no_force) {
	    common.error('dest file already exists: ' + dest);
	  }

	  sources.forEach(function (src, srcIndex) {
	    if (!fs.existsSync(src)) {
	      common.error('no such file or directory: ' + src, { continue: true });
	      return; // skip file
	    }

	    // If here, src exists

	    // When copying to '/path/dir':
	    //    thisDest = '/path/dir/file1'
	    var thisDest = dest;
	    if (fs.existsSync(dest) && common.statFollowLinks(dest).isDirectory()) {
	      thisDest = path.normalize(dest + '/' + path.basename(src));
	    }

	    var thisDestExists = fs.existsSync(thisDest);

	    if (thisDestExists && checkRecentCreated(sources, srcIndex)) {
	      // cannot overwrite file created recently in current execution, but we want to continue copying other files
	      if (!options.no_force) {
	        common.error("will not overwrite just-created '" + thisDest + "' with '" + src + "'", { continue: true });
	      }
	      return;
	    }

	    if (fs.existsSync(thisDest) && options.no_force) {
	      common.error('dest file already exists: ' + thisDest, { continue: true });
	      return; // skip file
	    }

	    if (path.resolve(src) === path.dirname(path.resolve(thisDest))) {
	      common.error('cannot move to self: ' + src, { continue: true });
	      return; // skip file
	    }

	    try {
	      fs.renameSync(src, thisDest);
	    } catch (e) {
	      /* istanbul ignore next */
	      if (e.code === 'EXDEV') {
	        // If we're trying to `mv` to an external partition, we'll actually need
	        // to perform a copy and then clean up the original file. If either the
	        // copy or the rm fails with an exception, we should allow this
	        // exception to pass up to the top level.
	        cp({ recursive: true }, src, thisDest);
	        rm({ recursive: true, force: true }, src);
	      }
	    }
	  }); // forEach(src)
	  return '';
	} // mv
	mv = _mv;
	return mv;
}

var sed;
var hasRequiredSed;

function requireSed () {
	if (hasRequiredSed) return sed;
	hasRequiredSed = 1;
	var common = requireCommon();
	var fs = require$$1;

	common.register('sed', _sed, {
	  globStart: 3, // don't glob-expand regexes
	  canReceivePipe: true,
	  cmdOptions: {
	    'i': 'inplace',
	  },
	});

	//@
	//@ ### sed([options,] search_regex, replacement, file [, file ...])
	//@ ### sed([options,] search_regex, replacement, file_array)
	//@
	//@ Available options:
	//@
	//@ + `-i`: Replace contents of `file` in-place. _Note that no backups will be created!_
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ sed('-i', 'PROGRAM_VERSION', 'v0.1.3', 'source.js');
	//@ ```
	//@
	//@ Reads an input string from `file`s, line by line, and performs a JavaScript `replace()` on
	//@ each of the lines from the input string using the given `search_regex` and `replacement` string or
	//@ function. Returns the new [ShellString](#shellstringstr) after replacement.
	//@
	//@ Note:
	//@
	//@ Like unix `sed`, ShellJS `sed` supports capture groups. Capture groups are specified
	//@ using the `$n` syntax:
	//@
	//@ ```javascript
	//@ sed(/(\w+)\s(\w+)/, '$2, $1', 'file.txt');
	//@ ```
	//@
	//@ Also, like unix `sed`, ShellJS `sed` runs replacements on each line from the input file
	//@ (split by '\n') separately, so `search_regex`es that span more than one line (or inlclude '\n')
	//@ will not match anything and nothing will be replaced.
	function _sed(options, regex, replacement, files) {
	  // Check if this is coming from a pipe
	  var pipe = common.readFromPipe();

	  if (typeof replacement !== 'string' && typeof replacement !== 'function') {
	    if (typeof replacement === 'number') {
	      replacement = replacement.toString(); // fallback
	    } else {
	      common.error('invalid replacement string');
	    }
	  }

	  // Convert all search strings to RegExp
	  if (typeof regex === 'string') {
	    regex = RegExp(regex);
	  }

	  if (!files && !pipe) {
	    common.error('no files given');
	  }

	  files = [].slice.call(arguments, 3);

	  if (pipe) {
	    files.unshift('-');
	  }

	  var sed = [];
	  files.forEach(function (file) {
	    if (!fs.existsSync(file) && file !== '-') {
	      common.error('no such file or directory: ' + file, 2, { continue: true });
	      return;
	    }

	    var contents = file === '-' ? pipe : fs.readFileSync(file, 'utf8');
	    var lines = contents.split('\n');
	    var result = lines.map(function (line) {
	      return line.replace(regex, replacement);
	    }).join('\n');

	    sed.push(result);

	    if (options.inplace) {
	      fs.writeFileSync(file, result, 'utf8');
	    }
	  });

	  if (options.inplace) {
	    return '';
	  } else {
	    return sed.join('\n');
	  }
	}
	sed = _sed;
	return sed;
}

var set;
var hasRequiredSet;

function requireSet () {
	if (hasRequiredSet) return set;
	hasRequiredSet = 1;
	var common = requireCommon();

	common.register('set', _set, {
	  allowGlobbing: false,
	  wrapOutput: false,
	});

	//@
	//@ ### set(options)
	//@
	//@ Available options:
	//@
	//@ + `+/-e`: exit upon error (`config.fatal`)
	//@ + `+/-v`: verbose: show all commands (`config.verbose`)
	//@ + `+/-f`: disable filename expansion (globbing)
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ set('-e'); // exit upon first error
	//@ set('+e'); // this undoes a "set('-e')"
	//@ ```
	//@
	//@ Sets global configuration variables.
	function _set(options) {
	  if (!options) {
	    var args = [].slice.call(arguments, 0);
	    if (args.length < 2) common.error('must provide an argument');
	    options = args[1];
	  }
	  var negate = (options[0] === '+');
	  if (negate) {
	    options = '-' + options.slice(1); // parseOptions needs a '-' prefix
	  }
	  options = common.parseOptions(options, {
	    'e': 'fatal',
	    'v': 'verbose',
	    'f': 'noglob',
	  });

	  if (negate) {
	    Object.keys(options).forEach(function (key) {
	      options[key] = !options[key];
	    });
	  }

	  Object.keys(options).forEach(function (key) {
	    // Only change the global config if `negate` is false and the option is true
	    // or if `negate` is true and the option is false (aka negate !== option)
	    if (negate !== options[key]) {
	      common.config[key] = options[key];
	    }
	  });
	}
	set = _set;
	return set;
}

var sort$2;
var hasRequiredSort;

function requireSort () {
	if (hasRequiredSort) return sort$2;
	hasRequiredSort = 1;
	var common = requireCommon();
	var fs = require$$1;

	common.register('sort', _sort, {
	  canReceivePipe: true,
	  cmdOptions: {
	    'r': 'reverse',
	    'n': 'numerical',
	  },
	});

	// parse out the number prefix of a line
	function parseNumber(str) {
	  var match = str.match(/^\s*(\d*)\s*(.*)$/);
	  return { num: Number(match[1]), value: match[2] };
	}

	// compare two strings case-insensitively, but examine case for strings that are
	// case-insensitive equivalent
	function unixCmp(a, b) {
	  var aLower = a.toLowerCase();
	  var bLower = b.toLowerCase();
	  return (aLower === bLower ?
	      -1 * a.localeCompare(b) : // unix sort treats case opposite how javascript does
	      aLower.localeCompare(bLower));
	}

	// compare two strings in the fashion that unix sort's -n option works
	function numericalCmp(a, b) {
	  var objA = parseNumber(a);
	  var objB = parseNumber(b);
	  if (objA.hasOwnProperty('num') && objB.hasOwnProperty('num')) {
	    return ((objA.num !== objB.num) ?
	        (objA.num - objB.num) :
	        unixCmp(objA.value, objB.value));
	  } else {
	    return unixCmp(objA.value, objB.value);
	  }
	}

	//@
	//@ ### sort([options,] file [, file ...])
	//@ ### sort([options,] file_array)
	//@
	//@ Available options:
	//@
	//@ + `-r`: Reverse the results
	//@ + `-n`: Compare according to numerical value
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ sort('foo.txt', 'bar.txt');
	//@ sort('-r', 'foo.txt');
	//@ ```
	//@
	//@ Return the contents of the `file`s, sorted line-by-line as a
	//@ [ShellString](#shellstringstr). Sorting multiple files mixes their content
	//@ (just as unix `sort` does).
	function _sort(options, files) {
	  // Check if this is coming from a pipe
	  var pipe = common.readFromPipe();

	  if (!files && !pipe) common.error('no files given');

	  files = [].slice.call(arguments, 1);

	  if (pipe) {
	    files.unshift('-');
	  }

	  var lines = files.reduce(function (accum, file) {
	    if (file !== '-') {
	      if (!fs.existsSync(file)) {
	        common.error('no such file or directory: ' + file, { continue: true });
	        return accum;
	      } else if (common.statFollowLinks(file).isDirectory()) {
	        common.error('read failed: ' + file + ': Is a directory', {
	          continue: true,
	        });
	        return accum;
	      }
	    }

	    var contents = file === '-' ? pipe : fs.readFileSync(file, 'utf8');
	    return accum.concat(contents.trimRight().split('\n'));
	  }, []);

	  var sorted = lines.sort(options.numerical ? numericalCmp : unixCmp);

	  if (options.reverse) {
	    sorted = sorted.reverse();
	  }

	  return sorted.join('\n') + '\n';
	}

	sort$2 = _sort;
	return sort$2;
}

var tail;
var hasRequiredTail;

function requireTail () {
	if (hasRequiredTail) return tail;
	hasRequiredTail = 1;
	var common = requireCommon();
	var fs = require$$1;

	common.register('tail', _tail, {
	  canReceivePipe: true,
	  cmdOptions: {
	    'n': 'numLines',
	  },
	});

	//@
	//@ ### tail([{'-n': \<num\>},] file [, file ...])
	//@ ### tail([{'-n': \<num\>},] file_array)
	//@
	//@ Available options:
	//@
	//@ + `-n <num>`: Show the last `<num>` lines of `file`s
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ var str = tail({'-n': 1}, 'file*.txt');
	//@ var str = tail('file1', 'file2');
	//@ var str = tail(['file1', 'file2']); // same as above
	//@ ```
	//@
	//@ Read the end of a `file`. Returns a [ShellString](#shellstringstr).
	function _tail(options, files) {
	  var tail = [];
	  var pipe = common.readFromPipe();

	  if (!files && !pipe) common.error('no paths given');

	  var idx = 1;
	  var plusOption = false;
	  if (options.numLines === true) {
	    idx = 2;
	    if (arguments[1][0] === '+') {
	      plusOption = true;
	    }
	    options.numLines = Number(arguments[1]);
	  } else if (options.numLines === false) {
	    options.numLines = 10;
	  }
	  // arguments[0] is a json object
	  if (arguments[0].numLines[0] === '+') {
	    plusOption = true;
	  }
	  options.numLines = -1 * Math.abs(options.numLines);
	  files = [].slice.call(arguments, idx);

	  if (pipe) {
	    files.unshift('-');
	  }

	  var shouldAppendNewline = false;
	  files.forEach(function (file) {
	    if (file !== '-') {
	      if (!fs.existsSync(file)) {
	        common.error('no such file or directory: ' + file, { continue: true });
	        return;
	      } else if (common.statFollowLinks(file).isDirectory()) {
	        common.error("error reading '" + file + "': Is a directory", {
	          continue: true,
	        });
	        return;
	      }
	    }

	    var contents = file === '-' ? pipe : fs.readFileSync(file, 'utf8');

	    var lines = contents.split('\n');
	    if (lines[lines.length - 1] === '') {
	      lines.pop();
	      shouldAppendNewline = true;
	    } else {
	      shouldAppendNewline = false;
	    }

	    tail = tail.concat(plusOption ? lines.slice(-options.numLines - 1) : lines.slice(options.numLines));
	  });

	  if (shouldAppendNewline) {
	    tail.push(''); // to add a trailing newline once we join
	  }

	  return tail.join('\n');
	}

	tail = _tail;
	return tail;
}

var test$1;
var hasRequiredTest;

function requireTest () {
	if (hasRequiredTest) return test$1;
	hasRequiredTest = 1;
	var common = requireCommon();
	var fs = require$$1;

	common.register('test', _test, {
	  cmdOptions: {
	    'b': 'block',
	    'c': 'character',
	    'd': 'directory',
	    'e': 'exists',
	    'f': 'file',
	    'L': 'link',
	    'p': 'pipe',
	    'S': 'socket',
	  },
	  wrapOutput: false,
	  allowGlobbing: false,
	});


	//@
	//@ ### test(expression)
	//@
	//@ Available expression primaries:
	//@
	//@ + `'-b', 'path'`: true if path is a block device
	//@ + `'-c', 'path'`: true if path is a character device
	//@ + `'-d', 'path'`: true if path is a directory
	//@ + `'-e', 'path'`: true if path exists
	//@ + `'-f', 'path'`: true if path is a regular file
	//@ + `'-L', 'path'`: true if path is a symbolic link
	//@ + `'-p', 'path'`: true if path is a pipe (FIFO)
	//@ + `'-S', 'path'`: true if path is a socket
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ if (test('-d', path)) { /* do something with dir */ };
	//@ if (!test('-f', path)) continue; // skip if it's not a regular file
	//@ ```
	//@
	//@ Evaluates `expression` using the available primaries and returns
	//@ corresponding boolean value.
	function _test(options, path) {
	  if (!path) common.error('no path given');

	  var canInterpret = false;
	  Object.keys(options).forEach(function (key) {
	    if (options[key] === true) {
	      canInterpret = true;
	    }
	  });

	  if (!canInterpret) common.error('could not interpret expression');

	  if (options.link) {
	    try {
	      return common.statNoFollowLinks(path).isSymbolicLink();
	    } catch (e) {
	      return false;
	    }
	  }

	  if (!fs.existsSync(path)) return false;

	  if (options.exists) return true;

	  var stats = common.statFollowLinks(path);

	  if (options.block) return stats.isBlockDevice();

	  if (options.character) return stats.isCharacterDevice();

	  if (options.directory) return stats.isDirectory();

	  if (options.file) return stats.isFile();

	  /* istanbul ignore next */
	  if (options.pipe) return stats.isFIFO();

	  /* istanbul ignore next */
	  if (options.socket) return stats.isSocket();

	  /* istanbul ignore next */
	  return false; // fallback
	} // test
	test$1 = _test;
	return test$1;
}

var to;
var hasRequiredTo;

function requireTo () {
	if (hasRequiredTo) return to;
	hasRequiredTo = 1;
	var common = requireCommon();
	var fs = require$$1;
	var path = require$$0$1;

	common.register('to', _to, {
	  pipeOnly: true,
	  wrapOutput: false,
	});

	//@
	//@ ### ShellString.prototype.to(file)
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ cat('input.txt').to('output.txt');
	//@ ```
	//@
	//@ Analogous to the redirection operator `>` in Unix, but works with
	//@ `ShellStrings` (such as those returned by `cat`, `grep`, etc.). _Like Unix
	//@ redirections, `to()` will overwrite any existing file!_ Returns the same
	//@ [ShellString](#shellstringstr) this operated on, to support chaining.
	function _to(options, file) {
	  if (!file) common.error('wrong arguments');

	  if (!fs.existsSync(path.dirname(file))) {
	    common.error('no such file or directory: ' + path.dirname(file));
	  }

	  try {
	    fs.writeFileSync(file, this.stdout || this.toString(), 'utf8');
	    return this;
	  } catch (e) {
	    /* istanbul ignore next */
	    common.error('could not write to file (code ' + e.code + '): ' + file, { continue: true });
	  }
	}
	to = _to;
	return to;
}

var toEnd;
var hasRequiredToEnd;

function requireToEnd () {
	if (hasRequiredToEnd) return toEnd;
	hasRequiredToEnd = 1;
	var common = requireCommon();
	var fs = require$$1;
	var path = require$$0$1;

	common.register('toEnd', _toEnd, {
	  pipeOnly: true,
	  wrapOutput: false,
	});

	//@
	//@ ### ShellString.prototype.toEnd(file)
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ cat('input.txt').toEnd('output.txt');
	//@ ```
	//@
	//@ Analogous to the redirect-and-append operator `>>` in Unix, but works with
	//@ `ShellStrings` (such as those returned by `cat`, `grep`, etc.). Returns the
	//@ same [ShellString](#shellstringstr) this operated on, to support chaining.
	function _toEnd(options, file) {
	  if (!file) common.error('wrong arguments');

	  if (!fs.existsSync(path.dirname(file))) {
	    common.error('no such file or directory: ' + path.dirname(file));
	  }

	  try {
	    fs.appendFileSync(file, this.stdout || this.toString(), 'utf8');
	    return this;
	  } catch (e) {
	    /* istanbul ignore next */
	    common.error('could not append to file (code ' + e.code + '): ' + file, { continue: true });
	  }
	}
	toEnd = _toEnd;
	return toEnd;
}

var touch;
var hasRequiredTouch;

function requireTouch () {
	if (hasRequiredTouch) return touch;
	hasRequiredTouch = 1;
	var common = requireCommon();
	var fs = require$$1;

	common.register('touch', _touch, {
	  cmdOptions: {
	    'a': 'atime_only',
	    'c': 'no_create',
	    'd': 'date',
	    'm': 'mtime_only',
	    'r': 'reference',
	  },
	});

	//@
	//@ ### touch([options,] file [, file ...])
	//@ ### touch([options,] file_array)
	//@
	//@ Available options:
	//@
	//@ + `-a`: Change only the access time
	//@ + `-c`: Do not create any files
	//@ + `-m`: Change only the modification time
	//@ + `{'-d': someDate}`, `{date: someDate}`: Use a `Date` instance (ex. `someDate`)
	//@   instead of current time
	//@ + `{'-r': file}`, `{reference: file}`: Use `file`'s times instead of current
	//@   time
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ touch('source.js');
	//@ touch('-c', 'path/to/file.js');
	//@ touch({ '-r': 'referenceFile.txt' }, 'path/to/file.js');
	//@ touch({ '-d': new Date('December 17, 1995 03:24:00'), '-m': true }, 'path/to/file.js');
	//@ touch({ date: new Date('December 17, 1995 03:24:00') }, 'path/to/file.js');
	//@ ```
	//@
	//@ Update the access and modification times of each file to the current time.
	//@ A file argument that does not exist is created empty, unless `-c` is supplied.
	//@ This is a partial implementation of
	//@ [`touch(1)`](http://linux.die.net/man/1/touch). Returns a
	//@ [ShellString](#shellstringstr) indicating success or failure.
	function _touch(opts, files) {
	  if (!files) {
	    common.error('no files given');
	  } else if (typeof files === 'string') {
	    files = [].slice.call(arguments, 1);
	  } else {
	    common.error('file arg should be a string file path or an Array of string file paths');
	  }

	  files.forEach(function (f) {
	    touchFile(opts, f);
	  });
	  return '';
	}

	function touchFile(opts, file) {
	  var stat = tryStatFile(file);

	  if (stat && stat.isDirectory()) {
	    // don't error just exit
	    return;
	  }

	  // if the file doesn't already exist and the user has specified --no-create then
	  // this script is finished
	  if (!stat && opts.no_create) {
	    return;
	  }

	  // open the file and then close it. this will create it if it doesn't exist but will
	  // not truncate the file
	  fs.closeSync(fs.openSync(file, 'a'));

	  //
	  // Set timestamps
	  //

	  // setup some defaults
	  var now = new Date();
	  var mtime = opts.date || now;
	  var atime = opts.date || now;

	  // use reference file
	  if (opts.reference) {
	    var refStat = tryStatFile(opts.reference);
	    if (!refStat) {
	      common.error('failed to get attributess of ' + opts.reference);
	    }
	    mtime = refStat.mtime;
	    atime = refStat.atime;
	  } else if (opts.date) {
	    mtime = opts.date;
	    atime = opts.date;
	  }

	  if (opts.atime_only && opts.mtime_only) ; else if (opts.atime_only) {
	    mtime = stat.mtime;
	  } else if (opts.mtime_only) {
	    atime = stat.atime;
	  }

	  fs.utimesSync(file, atime, mtime);
	}

	touch = _touch;

	function tryStatFile(filePath) {
	  try {
	    return common.statFollowLinks(filePath);
	  } catch (e) {
	    return null;
	  }
	}
	return touch;
}

var uniq;
var hasRequiredUniq;

function requireUniq () {
	if (hasRequiredUniq) return uniq;
	hasRequiredUniq = 1;
	var common = requireCommon();
	var fs = require$$1;

	// add c spaces to the left of str
	function lpad(c, str) {
	  var res = '' + str;
	  if (res.length < c) {
	    res = Array((c - res.length) + 1).join(' ') + res;
	  }
	  return res;
	}

	common.register('uniq', _uniq, {
	  canReceivePipe: true,
	  cmdOptions: {
	    'i': 'ignoreCase',
	    'c': 'count',
	    'd': 'duplicates',
	  },
	});

	//@
	//@ ### uniq([options,] [input, [output]])
	//@
	//@ Available options:
	//@
	//@ + `-i`: Ignore case while comparing
	//@ + `-c`: Prefix lines by the number of occurrences
	//@ + `-d`: Only print duplicate lines, one for each group of identical lines
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ uniq('foo.txt');
	//@ uniq('-i', 'foo.txt');
	//@ uniq('-cd', 'foo.txt', 'bar.txt');
	//@ ```
	//@
	//@ Filter adjacent matching lines from `input`. Returns a
	//@ [ShellString](#shellstringstr).
	function _uniq(options, input, output) {
	  // Check if this is coming from a pipe
	  var pipe = common.readFromPipe();

	  if (!pipe) {
	    if (!input) common.error('no input given');

	    if (!fs.existsSync(input)) {
	      common.error(input + ': No such file or directory');
	    } else if (common.statFollowLinks(input).isDirectory()) {
	      common.error("error reading '" + input + "'");
	    }
	  }
	  if (output && fs.existsSync(output) && common.statFollowLinks(output).isDirectory()) {
	    common.error(output + ': Is a directory');
	  }

	  var lines = (input ? fs.readFileSync(input, 'utf8') : pipe)
	              .trimRight()
	              .split('\n');

	  var compare = function (a, b) {
	    return options.ignoreCase ?
	           a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()) :
	           a.localeCompare(b);
	  };
	  var uniqed = lines.reduceRight(function (res, e) {
	    // Perform uniq -c on the input
	    if (res.length === 0) {
	      return [{ count: 1, ln: e }];
	    } else if (compare(res[0].ln, e) === 0) {
	      return [{ count: res[0].count + 1, ln: e }].concat(res.slice(1));
	    } else {
	      return [{ count: 1, ln: e }].concat(res);
	    }
	  }, []).filter(function (obj) {
	                 // Do we want only duplicated objects?
	    return options.duplicates ? obj.count > 1 : true;
	  }).map(function (obj) {
	                 // Are we tracking the counts of each line?
	    return (options.count ? (lpad(7, obj.count) + ' ') : '') + obj.ln;
	  }).join('\n') + '\n';

	  if (output) {
	    (new common.ShellString(uniqed)).to(output);
	    // if uniq writes to output, nothing is passed to the next command in the pipeline (if any)
	    return '';
	  } else {
	    return uniqed;
	  }
	}

	uniq = _uniq;
	return uniq;
}

var which;
var hasRequiredWhich;

function requireWhich () {
	if (hasRequiredWhich) return which;
	hasRequiredWhich = 1;
	var common = requireCommon();
	var fs = require$$1;
	var path = require$$0$1;

	common.register('which', _which, {
	  allowGlobbing: false,
	  cmdOptions: {
	    'a': 'all',
	  },
	});

	// XP's system default value for `PATHEXT` system variable, just in case it's not
	// set on Windows.
	var XP_DEFAULT_PATHEXT = '.com;.exe;.bat;.cmd;.vbs;.vbe;.js;.jse;.wsf;.wsh';

	// For earlier versions of NodeJS that doesn't have a list of constants (< v6)
	var FILE_EXECUTABLE_MODE = 1;

	function isWindowsPlatform() {
	  return process.platform === 'win32';
	}

	// Cross-platform method for splitting environment `PATH` variables
	function splitPath(p) {
	  return p ? p.split(path.delimiter) : [];
	}

	// Tests are running all cases for this func but it stays uncovered by codecov due to unknown reason
	/* istanbul ignore next */
	function isExecutable(pathName) {
	  try {
	    // TODO(node-support): replace with fs.constants.X_OK once remove support for node < v6
	    fs.accessSync(pathName, FILE_EXECUTABLE_MODE);
	  } catch (err) {
	    return false;
	  }
	  return true;
	}

	function checkPath(pathName) {
	  return fs.existsSync(pathName) && !common.statFollowLinks(pathName).isDirectory()
	    && (isWindowsPlatform() || isExecutable(pathName));
	}

	//@
	//@ ### which(command)
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ var nodeExec = which('node');
	//@ ```
	//@
	//@ Searches for `command` in the system's `PATH`. On Windows, this uses the
	//@ `PATHEXT` variable to append the extension if it's not already executable.
	//@ Returns a [ShellString](#shellstringstr) containing the absolute path to
	//@ `command`.
	function _which(options, cmd) {
	  if (!cmd) common.error('must specify command');

	  var isWindows = isWindowsPlatform();
	  var pathArray = splitPath(process.env.PATH);

	  var queryMatches = [];

	  // No relative/absolute paths provided?
	  if (cmd.indexOf('/') === -1) {
	    // Assume that there are no extensions to append to queries (this is the
	    // case for unix)
	    var pathExtArray = [''];
	    if (isWindows) {
	      // In case the PATHEXT variable is somehow not set (e.g.
	      // child_process.spawn with an empty environment), use the XP default.
	      var pathExtEnv = process.env.PATHEXT || XP_DEFAULT_PATHEXT;
	      pathExtArray = splitPath(pathExtEnv.toUpperCase());
	    }

	    // Search for command in PATH
	    for (var k = 0; k < pathArray.length; k++) {
	      // already found it
	      if (queryMatches.length > 0 && !options.all) break;

	      var attempt = path.resolve(pathArray[k], cmd);

	      if (isWindows) {
	        attempt = attempt.toUpperCase();
	      }

	      var match = attempt.match(/\.[^<>:"/|?*.]+$/);
	      if (match && pathExtArray.indexOf(match[0]) >= 0) { // this is Windows-only
	        // The user typed a query with the file extension, like
	        // `which('node.exe')`
	        if (checkPath(attempt)) {
	          queryMatches.push(attempt);
	          break;
	        }
	      } else { // All-platforms
	        // Cycle through the PATHEXT array, and check each extension
	        // Note: the array is always [''] on Unix
	        for (var i = 0; i < pathExtArray.length; i++) {
	          var ext = pathExtArray[i];
	          var newAttempt = attempt + ext;
	          if (checkPath(newAttempt)) {
	            queryMatches.push(newAttempt);
	            break;
	          }
	        }
	      }
	    }
	  } else if (checkPath(cmd)) { // a valid absolute or relative path
	    queryMatches.push(path.resolve(cmd));
	  }

	  if (queryMatches.length > 0) {
	    return options.all ? queryMatches : queryMatches[0];
	  }
	  return options.all ? [] : null;
	}
	which = _which;
	return which;
}

var hasRequiredShell;

function requireShell () {
	if (hasRequiredShell) return shell;
	hasRequiredShell = 1;
	//
	// ShellJS
	// Unix shell commands on top of Node's API
	//
	// Copyright (c) 2012 Artur Adib
	// http://github.com/shelljs/shelljs
	//

	var common = requireCommon();

	//@
	//@ All commands run synchronously, unless otherwise stated.
	//@ All commands accept standard bash globbing characters (`*`, `?`, etc.),
	//@ compatible with the [node `glob` module](https://github.com/isaacs/node-glob).
	//@
	//@ For less-commonly used commands and features, please check out our [wiki
	//@ page](https://github.com/shelljs/shelljs/wiki).
	//@

	// Include the docs for all the default commands
	//@commands

	// Load all default commands
	requireCat();
	requireCd();
	requireChmod();
	requireCmd();
	requireCommon();
	requireCp();
	requireDirs();
	requireEcho();
	requireError();
	requireErrorCode();
	// require('./src/exec-child'); excluded since it is for commandline only
	requireExec();
	requireFind();
	requireGrep();
	requireHead();
	requireLn();
	requireLs();
	requireMkdir();
	requireMv();


	requirePwd();
	requireRm();
	requireSed();
	requireSet();
	requireSort();
	requireTail();
	requireTempdir();
	requireTest();
	requireTo();
	requireToEnd();
	requireTouch();
	requireUniq();
	requireWhich();

	//@
	//@ ### exit(code)
	//@
	//@ Exits the current process with the given exit `code`.
	shell.exit = process.exit;

	//@include ./src/error.js
	shell.error = requireError();

	//@include ./src/errorCode.js
	shell.errorCode = requireErrorCode();

	//@include ./src/common.js
	shell.ShellString = common.ShellString;

	//@
	//@ ### env['VAR_NAME']
	//@
	//@ Object containing environment variables (both getter and setter). Shortcut
	//@ to `process.env`.
	shell.env = process.env;

	//@
	//@ ### Pipes
	//@
	//@ Examples:
	//@
	//@ ```javascript
	//@ grep('foo', 'file1.txt', 'file2.txt').sed(/o/g, 'a').to('output.txt');
	//@ echo('files with o\'s in the name:\n' + ls().grep('o'));
	//@ cat('test.js').exec('node'); // pipe to exec() call
	//@ ```
	//@
	//@ Commands can send their output to another command in a pipe-like fashion.
	//@ `sed`, `grep`, `cat`, `exec`, `to`, and `toEnd` can appear on the right-hand
	//@ side of a pipe. Pipes can be chained.

	//@
	//@ ## Configuration
	//@

	shell.config = common.config;

	//@
	//@ ### config.silent
	//@
	//@ Example:
	//@
	//@ ```javascript
	//@ var sh = require('shelljs');
	//@ var silentState = sh.config.silent; // save old silent state
	//@ sh.config.silent = true;
	//@ /* ... */
	//@ sh.config.silent = silentState; // restore old silent state
	//@ ```
	//@
	//@ Suppresses all command output if `true`, except for `echo()` calls.
	//@ Default is `false`.

	//@
	//@ ### config.fatal
	//@
	//@ Example:
	//@
	//@ ```javascript
	//@ require('shelljs/global');
	//@ config.fatal = true; // or set('-e');
	//@ cp('this_file_does_not_exist', '/dev/null'); // throws Error here
	//@ /* more commands... */
	//@ ```
	//@
	//@ If `true`, the script will throw a Javascript error when any shell.js
	//@ command encounters an error. Default is `false`. This is analogous to
	//@ Bash's `set -e`.

	//@
	//@ ### config.verbose
	//@
	//@ Example:
	//@
	//@ ```javascript
	//@ config.verbose = true; // or set('-v');
	//@ cd('dir/');
	//@ rm('-rf', 'foo.txt', 'bar.txt');
	//@ exec('echo hello');
	//@ ```
	//@
	//@ Will print each command as follows:
	//@
	//@ ```
	//@ cd dir/
	//@ rm -rf foo.txt bar.txt
	//@ exec echo hello
	//@ ```

	//@
	//@ ### config.globOptions
	//@
	//@ Example:
	//@
	//@ ```javascript
	//@ config.globOptions = {nodir: true};
	//@ ```
	//@
	//@ Use this value for calls to `glob.sync()` instead of the default options.

	//@
	//@ ### config.reset()
	//@
	//@ Example:
	//@
	//@ ```javascript
	//@ var shell = require('shelljs');
	//@ // Make changes to shell.config, and do stuff...
	//@ /* ... */
	//@ shell.config.reset(); // reset to original state
	//@ // Do more stuff, but with original settings
	//@ /* ... */
	//@ ```
	//@
	//@ Reset `shell.config` to the defaults:
	//@
	//@ ```javascript
	//@ {
	//@   fatal: false,
	//@   globOptions: {},
	//@   maxdepth: 255,
	//@   noglob: false,
	//@   silent: false,
	//@   verbose: false,
	//@ }
	//@ ```
	return shell;
}

var minimatch_1 = minimatch;
minimatch.Minimatch = Minimatch;

const path$3 = (() => { try { return require('path') } catch (e) {}})() || {
  sep: '/'
};
minimatch.sep = path$3.sep;

const GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {};
const expand = braceExpansion;

const plTypes = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
};

// any single thing other than /
// don't need to escape / when using new RegExp()
const qmark = '[^/]';

// * => any number of characters
const star = qmark + '*?';

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
const twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?';

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
const twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?';

// characters that need to be escaped in RegExp.
const reSpecials = charSet('().*{}+?[]^$\\!');

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true;
    return set
  }, {})
}

// normalizes slashes.
const slashSplit = /\/+/;

minimatch.filter = filter;
function filter (pattern, options) {
  options = options || {};
  return function (p, i, list) {
    return minimatch(p, pattern, options)
  }
}

function ext (a, b) {
  a = a || {};
  b = b || {};
  const t = {};
  Object.keys(a).forEach(function (k) {
    t[k] = a[k];
  });
  Object.keys(b).forEach(function (k) {
    t[k] = b[k];
  });
  return t
}

minimatch.defaults = function (def) {
  if (!def || typeof def !== 'object' || !Object.keys(def).length) {
    return minimatch
  }

  const orig = minimatch;

  const m = function minimatch (p, pattern, options) {
    return orig(p, pattern, ext(def, options))
  };

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  };
  m.Minimatch.defaults = options => {
    return orig.defaults(ext(def, options)).Minimatch
  };

  m.filter = function filter (pattern, options) {
    return orig.filter(pattern, ext(def, options))
  };

  m.defaults = function defaults (options) {
    return orig.defaults(ext(def, options))
  };

  m.makeRe = function makeRe (pattern, options) {
    return orig.makeRe(pattern, ext(def, options))
  };

  m.braceExpand = function braceExpand (pattern, options) {
    return orig.braceExpand(pattern, ext(def, options))
  };

  m.match = function (list, pattern, options) {
    return orig.match(list, pattern, ext(def, options))
  };

  return m
};

Minimatch.defaults = function (def) {
  return minimatch.defaults(def).Minimatch
};

function minimatch (p, pattern, options) {
  assertValidPattern(pattern);

  if (!options) options = {};

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  // "" only matches ""
  if (pattern.trim() === '') return p === ''

  return new Minimatch(pattern, options).match(p)
}

function Minimatch (pattern, options) {
  if (!(this instanceof Minimatch)) {
    return new Minimatch(pattern, options)
  }

  assertValidPattern(pattern);

  if (!options) options = {};
  pattern = pattern.trim();

  // windows support: need to use /, not \
  if (path$3.sep !== '/') {
    pattern = pattern.split(path$3.sep).join('/');
  }

  this.options = options;
  this.set = [];
  this.pattern = pattern;
  this.regexp = null;
  this.negate = false;
  this.comment = false;
  this.empty = false;

  // make the set of regexps etc.
  this.make();
}

Minimatch.prototype.debug = function () {};

Minimatch.prototype.make = make;
function make () {
  // don't do it more than once.
  if (this._made) return

  var pattern = this.pattern;
  var options = this.options;

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true;
    return
  }
  if (!pattern) {
    this.empty = true;
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate();

  // step 2: expand braces
  var set = this.globSet = this.braceExpand();

  if (options.debug) this.debug = console.error;

  this.debug(this.pattern, set);

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  });

  this.debug(this.pattern, set);

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this);

  this.debug(this.pattern, set);

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  });

  this.debug(this.pattern, set);

  this.set = set;
}

Minimatch.prototype.parseNegate = parseNegate;
function parseNegate () {
  var pattern = this.pattern;
  var negate = false;
  var options = this.options;
  var negateOffset = 0;

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate;
    negateOffset++;
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset);
  this.negate = negate;
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
};

Minimatch.prototype.braceExpand = braceExpand;

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch) {
      options = this.options;
    } else {
      options = {};
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern;

  assertValidPattern(pattern);

  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand(pattern)
}

const MAX_PATTERN_LENGTH = 1024 * 64;
const assertValidPattern = pattern => {
  if (typeof pattern !== 'string') {
    throw new TypeError('invalid pattern')
  }

  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new TypeError('pattern is too long')
  }
};

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch.prototype.parse = parse$9;
const SUBPARSE = {};
function parse$9 (pattern, isSub) {
  assertValidPattern(pattern);

  var options = this.options;

  // shortcuts
  if (!options.noglobstar && pattern === '**') return GLOBSTAR
  if (pattern === '') return ''

  var re = '';
  var hasMagic = false;
  var escaping = false;
  // ? => one single character
  var patternListStack = [];
  var negativeLists = [];
  var stateChar;
  var inClass = false;
  var reClassStart = -1;
  var classStart = -1;
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)';
  var self = this;

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star;
          hasMagic = true;
        break
        case '?':
          re += qmark;
          hasMagic = true;
        break
        default:
          re += '\\' + stateChar;
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re);
      stateChar = false;
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c);

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c;
      escaping = false;
      continue
    }

    switch (c) {
      case '/': /* istanbul ignore next */ {
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false
      }

      case '\\':
        clearStateChar();
        escaping = true;
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c);

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class');
          if (c === '!' && i === classStart + 1) c = '^';
          re += c;
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar);
        clearStateChar();
        stateChar = c;
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar();
      continue

      case '(':
        if (inClass) {
          re += '(';
          continue
        }

        if (!stateChar) {
          re += '\\(';
          continue
        }

        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes[stateChar].open,
          close: plTypes[stateChar].close
        });
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:';
        this.debug('plType %j %j', stateChar, re);
        stateChar = false;
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)';
          continue
        }

        clearStateChar();
        hasMagic = true;
        var pl = patternListStack.pop();
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        re += pl.close;
        if (pl.type === '!') {
          negativeLists.push(pl);
        }
        pl.reEnd = re.length;
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|';
          escaping = false;
          continue
        }

        clearStateChar();
        re += '|';
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar();

        if (inClass) {
          re += '\\' + c;
          continue
        }

        inClass = true;
        classStart = i;
        reClassStart = re.length;
        re += c;
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c;
          escaping = false;
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        if (inClass) {
          // split where the last [ was, make sure we don't have
          // an invalid re. if so, re-walk the contents of the
          // would-be class to re-translate any characters that
          // were passed through as-is
          // TODO: It would probably be faster to determine this
          // without a try/catch and a new RegExp, but it's tricky
          // to do safely.  For now, this is safe and works.
          var cs = pattern.substring(classStart + 1, i);
          try {
            RegExp('[' + cs + ']');
          } catch (er) {
            // not a valid class!
            var sp = this.parse(cs, SUBPARSE);
            re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]';
            hasMagic = hasMagic || sp[1];
            inClass = false;
            continue
          }
        }

        // finish up the class.
        hasMagic = true;
        inClass = false;
        re += c;
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar();

        if (escaping) {
          // no need
          escaping = false;
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\';
        }

        re += c;

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1);
    sp = this.parse(cs, SUBPARSE);
    re = re.substr(0, reClassStart) + '\\[' + sp[0];
    hasMagic = hasMagic || sp[1];
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length);
    this.debug('setting tail', re, pl);
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\';
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    });

    this.debug('tail=%j\n   %s', tail, tail, pl, re);
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type;

    hasMagic = true;
    re = re.slice(0, pl.reStart) + t + '\\(' + tail;
  }

  // handle trailing things that only matter at the very end.
  clearStateChar();
  if (escaping) {
    // trailing \\
    re += '\\\\';
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false;
  switch (re.charAt(0)) {
    case '.':
    case '[':
    case '(': addPatternStart = true;
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n];

    var nlBefore = re.slice(0, nl.reStart);
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd);
    var nlAfter = re.slice(nl.reEnd);

    nlLast += nlAfter;

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1;
    var cleanAfter = nlAfter;
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '');
    }
    nlAfter = cleanAfter;

    var dollar = '';
    if (nlAfter === '' && isSub !== SUBPARSE) {
      dollar = '$';
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast;
    re = newRe;
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re;
  }

  if (addPatternStart) {
    re = patternStart + re;
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : '';
  try {
    var regExp = new RegExp('^' + re + '$', flags);
  } catch (er) /* istanbul ignore next - should be impossible */ {
    // If it was an invalid regular expression, then it can't match
    // anything.  This trick looks for a character after the end of
    // the string, which is of course impossible, except in multi-line
    // mode, but it's not a /m regex.
    return new RegExp('$.')
  }

  regExp._glob = pattern;
  regExp._src = re;

  return regExp
}

minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe()
};

Minimatch.prototype.makeRe = makeRe;
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set;

  if (!set.length) {
    this.regexp = false;
    return this.regexp
  }
  var options = this.options;

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot;
  var flags = options.nocase ? 'i' : '';

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|');

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$';

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$';

  try {
    this.regexp = new RegExp(re, flags);
  } catch (ex) /* istanbul ignore next - should be impossible */ {
    this.regexp = false;
  }
  return this.regexp
}

minimatch.match = function (list, pattern, options) {
  options = options || {};
  const mm = new Minimatch(pattern, options);
  list = list.filter(function (f) {
    return mm.match(f)
  });
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list
};

Minimatch.prototype.match = match;
function match (f, partial) {
  this.debug('match', f, this.pattern);
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options;

  // windows: need to use /, not \
  if (path$3.sep !== '/') {
    f = f.split(path$3.sep).join('/');
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit);
  this.debug(this.pattern, 'split', f);

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set;
  this.debug(this.pattern, 'set', set);

  // Find the basename of the path by looking for the last non-empty segment
  var filename;
  var i;
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i];
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i];
    var file = f;
    if (options.matchBase && pattern.length === 1) {
      file = [filename];
    }
    var hit = this.matchOne(file, pattern, partial);
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
}

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options;

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern });

  this.debug('matchOne', file.length, pattern.length);

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop');
    var p = pattern[pi];
    var f = file[fi];

    this.debug(pattern, p, f);

    // should be impossible.
    // some invalid regexp stuff in the set.
    /* istanbul ignore if */
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f]);

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi;
      var pr = pi + 1;
      if (pr === pl) {
        this.debug('** at the end');
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr];

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee);

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee);
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr);
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue');
          fr++;
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      /* istanbul ignore if */
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr);
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit;
    if (typeof p === 'string') {
      if (options.nocase) {
        hit = f.toLowerCase() === p.toLowerCase();
      } else {
        hit = f === p;
      }
      this.debug('string match', p, f, hit);
    } else {
      hit = f.match(p);
      this.debug('pattern match', p, f, hit);
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else /* istanbul ignore else */ if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    return (fi === fl - 1) && (file[fi] === '')
  }

  // should be unreachable.
  /* istanbul ignore next */
  throw new Error('wtf?')
};

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

function commonjsRequire(path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

var internal = {};

var taskcommand = {};

Object.defineProperty(taskcommand, "__esModule", { value: true });
taskcommand.commandFromString = taskcommand.TaskCommand = void 0;
//
// Command Format:
//    ##vso[artifact.command key=value;key=value]user message
//    
// Examples:
//    ##vso[task.progress value=58]
//    ##vso[task.issue type=warning;]This is the user warning message
//
var CMD_PREFIX = '##vso[';
var TaskCommand = /** @class */ (function () {
    function TaskCommand(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    TaskCommand.prototype.toString = function () {
        var cmdStr = CMD_PREFIX + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            for (var key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    var val = this.properties[key];
                    if (val) {
                        // safely append the val - avoid blowing up when attempting to
                        // call .replace() if message is not a string for some reason
                        cmdStr += key + '=' + escape$1('' + (val || '')) + ';';
                    }
                }
            }
        }
        cmdStr += ']';
        // safely append the message - avoid blowing up when attempting to
        // call .replace() if message is not a string for some reason
        var message = '' + (this.message || '');
        cmdStr += escapedata(message);
        return cmdStr;
    };
    return TaskCommand;
}());
taskcommand.TaskCommand = TaskCommand;
function commandFromString(commandLine) {
    var lbPos = commandLine.indexOf('[');
    var rbPos = commandLine.indexOf(']');
    if (lbPos == -1 || rbPos == -1 || rbPos - lbPos < 3) {
        throw new Error('Invalid command brackets');
    }
    var cmdInfo = commandLine.substring(lbPos + 1, rbPos);
    var spaceIdx = cmdInfo.indexOf(' ');
    var command = cmdInfo;
    var properties = {};
    if (spaceIdx > 0) {
        command = cmdInfo.trim().substring(0, spaceIdx);
        var propSection = cmdInfo.trim().substring(spaceIdx + 1);
        var propLines = propSection.split(';');
        propLines.forEach(function (propLine) {
            propLine = propLine.trim();
            if (propLine.length > 0) {
                var eqIndex = propLine.indexOf('=');
                if (eqIndex == -1) {
                    throw new Error('Invalid property: ' + propLine);
                }
                var key = propLine.substring(0, eqIndex);
                var val = propLine.substring(eqIndex + 1);
                properties[key] = unescape$1(val);
            }
        });
    }
    var msg = unescapedata(commandLine.substring(rbPos + 1));
    var cmd = new TaskCommand(command, properties, msg);
    return cmd;
}
taskcommand.commandFromString = commandFromString;
function escapedata(s) {
    return s.replace(/%/g, '%AZP25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
function unescapedata(s) {
    return s.replace(/%0D/g, '\r')
        .replace(/%0A/g, '\n')
        .replace(/%AZP25/g, '%');
}
function escape$1(s) {
    return s.replace(/%/g, '%AZP25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/]/g, '%5D')
        .replace(/;/g, '%3B');
}
function unescape$1(s) {
    return s.replace(/%0D/g, '\r')
        .replace(/%0A/g, '\n')
        .replace(/%5D/g, ']')
        .replace(/%3B/g, ';')
        .replace(/%AZP25/g, '%');
}

var vault = {};

var rngBrowser = {exports: {}};

// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection

// getRandomValues needs to be invoked in a context where "this" is a Crypto
// implementation. Also, find the complete implementation of crypto on IE11.
var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
                      (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

if (getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

  rngBrowser.exports = function whatwgRNG() {
    getRandomValues(rnds8);
    return rnds8;
  };
} else {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);

  rngBrowser.exports = function mathRNG() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

var rngBrowserExports = rngBrowser.exports;

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid$1(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
  return ([
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]]
  ]).join('');
}

var bytesToUuid_1 = bytesToUuid$1;

var rng = rngBrowserExports;
var bytesToUuid = bytesToUuid_1;

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

var v4_1 = v4;

Object.defineProperty(vault, "__esModule", { value: true });
vault.Vault = void 0;
var fs$2 = require$$1;
var path$2 = require$$0$1;
var crypto$1 = require$$2$1;
var uuidV4$1 = v4_1;
var algorithm = "aes-256-ctr";
var encryptEncoding = 'hex';
var unencryptedEncoding = 'utf8';
//
// Store sensitive data in proc.
// Main goal: Protects tasks which would dump envvars from leaking secrets inadvertently
//            the task lib clears after storing.
// Also protects against a dump of a process getting the secrets
// The secret is generated and stored externally for the lifetime of the task.
//
var Vault = /** @class */ (function () {
    function Vault(keyPath) {
        this._keyFile = path$2.join(keyPath, '.taskkey');
        this._store = {};
        this.genKey();
    }
    Vault.prototype.initialize = function () {
    };
    Vault.prototype.storeSecret = function (name, data) {
        if (!name || name.length == 0) {
            return false;
        }
        name = name.toLowerCase();
        if (!data || data.length == 0) {
            if (this._store.hasOwnProperty(name)) {
                delete this._store[name];
            }
            return false;
        }
        var key = this.getKey();
        var iv = crypto$1.randomBytes(16);
        var cipher = crypto$1.createCipheriv(algorithm, key, iv);
        var crypted = cipher.update(data, unencryptedEncoding, encryptEncoding);
        var cryptedFinal = cipher.final(encryptEncoding);
        this._store[name] = iv.toString(encryptEncoding) + crypted + cryptedFinal;
        return true;
    };
    Vault.prototype.retrieveSecret = function (name) {
        var secret;
        name = (name || '').toLowerCase();
        if (this._store.hasOwnProperty(name)) {
            var key = this.getKey();
            var data = this._store[name];
            var ivDataBuffer = Buffer.from(data, encryptEncoding);
            var iv = ivDataBuffer.slice(0, 16);
            var encryptedText = ivDataBuffer.slice(16);
            var decipher = crypto$1.createDecipheriv(algorithm, key, iv);
            var dec = decipher.update(encryptedText);
            var decFinal = decipher.final(unencryptedEncoding);
            secret = dec + decFinal;
        }
        return secret;
    };
    Vault.prototype.getKey = function () {
        var key = fs$2.readFileSync(this._keyFile).toString('utf8');
        // Key needs to be hashed to correct length to match algorithm (aes-256-ctr)
        return crypto$1.createHash('sha256').update(key).digest();
    };
    Vault.prototype.genKey = function () {
        fs$2.writeFileSync(this._keyFile, uuidV4$1(), { encoding: 'utf8' });
    };
    return Vault;
}());
vault.Vault = Vault;

var semver$4 = {exports: {}};

(function (module, exports) {
	exports = module.exports = SemVer;

	var debug;
	/* istanbul ignore next */
	if (typeof process === 'object' &&
	    process.env &&
	    process.env.NODE_DEBUG &&
	    /\bsemver\b/i.test(process.env.NODE_DEBUG)) {
	  debug = function () {
	    var args = Array.prototype.slice.call(arguments, 0);
	    args.unshift('SEMVER');
	    console.log.apply(console, args);
	  };
	} else {
	  debug = function () {};
	}

	// Note: this is the semver.org version of the spec that it implements
	// Not necessarily the package version of this code.
	exports.SEMVER_SPEC_VERSION = '2.0.0';

	var MAX_LENGTH = 256;
	var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
	  /* istanbul ignore next */ 9007199254740991;

	// Max safe segment length for coercion.
	var MAX_SAFE_COMPONENT_LENGTH = 16;

	var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;

	// The actual regexps go on exports.re
	var re = exports.re = [];
	var safeRe = exports.safeRe = [];
	var src = exports.src = [];
	var R = 0;

	var LETTERDASHNUMBER = '[a-zA-Z0-9-]';

	// Replace some greedy regex tokens to prevent regex dos issues. These regex are
	// used internally via the safeRe object since all inputs in this library get
	// normalized first to trim and collapse all extra whitespace. The original
	// regexes are exported for userland consumption and lower level usage. A
	// future breaking change could export the safer regex only with a note that
	// all input should have extra whitespace removed.
	var safeRegexReplacements = [
	  ['\\s', 1],
	  ['\\d', MAX_LENGTH],
	  [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH],
	];

	function makeSafeRe (value) {
	  for (var i = 0; i < safeRegexReplacements.length; i++) {
	    var token = safeRegexReplacements[i][0];
	    var max = safeRegexReplacements[i][1];
	    value = value
	      .split(token + '*').join(token + '{0,' + max + '}')
	      .split(token + '+').join(token + '{1,' + max + '}');
	  }
	  return value
	}

	// The following Regular Expressions can be used for tokenizing,
	// validating, and parsing SemVer version strings.

	// ## Numeric Identifier
	// A single `0`, or a non-zero digit followed by zero or more digits.

	var NUMERICIDENTIFIER = R++;
	src[NUMERICIDENTIFIER] = '0|[1-9]\\d*';
	var NUMERICIDENTIFIERLOOSE = R++;
	src[NUMERICIDENTIFIERLOOSE] = '\\d+';

	// ## Non-numeric Identifier
	// Zero or more digits, followed by a letter or hyphen, and then zero or
	// more letters, digits, or hyphens.

	var NONNUMERICIDENTIFIER = R++;
	src[NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-]' + LETTERDASHNUMBER + '*';

	// ## Main Version
	// Three dot-separated numeric identifiers.

	var MAINVERSION = R++;
	src[MAINVERSION] = '(' + src[NUMERICIDENTIFIER] + ')\\.' +
	                   '(' + src[NUMERICIDENTIFIER] + ')\\.' +
	                   '(' + src[NUMERICIDENTIFIER] + ')';

	var MAINVERSIONLOOSE = R++;
	src[MAINVERSIONLOOSE] = '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
	                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
	                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')';

	// ## Pre-release Version Identifier
	// A numeric identifier, or a non-numeric identifier.

	var PRERELEASEIDENTIFIER = R++;
	src[PRERELEASEIDENTIFIER] = '(?:' + src[NUMERICIDENTIFIER] +
	                            '|' + src[NONNUMERICIDENTIFIER] + ')';

	var PRERELEASEIDENTIFIERLOOSE = R++;
	src[PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[NUMERICIDENTIFIERLOOSE] +
	                                 '|' + src[NONNUMERICIDENTIFIER] + ')';

	// ## Pre-release Version
	// Hyphen, followed by one or more dot-separated pre-release version
	// identifiers.

	var PRERELEASE = R++;
	src[PRERELEASE] = '(?:-(' + src[PRERELEASEIDENTIFIER] +
	                  '(?:\\.' + src[PRERELEASEIDENTIFIER] + ')*))';

	var PRERELEASELOOSE = R++;
	src[PRERELEASELOOSE] = '(?:-?(' + src[PRERELEASEIDENTIFIERLOOSE] +
	                       '(?:\\.' + src[PRERELEASEIDENTIFIERLOOSE] + ')*))';

	// ## Build Metadata Identifier
	// Any combination of digits, letters, or hyphens.

	var BUILDIDENTIFIER = R++;
	src[BUILDIDENTIFIER] = LETTERDASHNUMBER + '+';

	// ## Build Metadata
	// Plus sign, followed by one or more period-separated build metadata
	// identifiers.

	var BUILD = R++;
	src[BUILD] = '(?:\\+(' + src[BUILDIDENTIFIER] +
	             '(?:\\.' + src[BUILDIDENTIFIER] + ')*))';

	// ## Full Version String
	// A main version, followed optionally by a pre-release version and
	// build metadata.

	// Note that the only major, minor, patch, and pre-release sections of
	// the version string are capturing groups.  The build metadata is not a
	// capturing group, because it should not ever be used in version
	// comparison.

	var FULL = R++;
	var FULLPLAIN = 'v?' + src[MAINVERSION] +
	                src[PRERELEASE] + '?' +
	                src[BUILD] + '?';

	src[FULL] = '^' + FULLPLAIN + '$';

	// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
	// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
	// common in the npm registry.
	var LOOSEPLAIN = '[v=\\s]*' + src[MAINVERSIONLOOSE] +
	                 src[PRERELEASELOOSE] + '?' +
	                 src[BUILD] + '?';

	var LOOSE = R++;
	src[LOOSE] = '^' + LOOSEPLAIN + '$';

	var GTLT = R++;
	src[GTLT] = '((?:<|>)?=?)';

	// Something like "2.*" or "1.2.x".
	// Note that "x.x" is a valid xRange identifer, meaning "any version"
	// Only the first item is strictly required.
	var XRANGEIDENTIFIERLOOSE = R++;
	src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
	var XRANGEIDENTIFIER = R++;
	src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + '|x|X|\\*';

	var XRANGEPLAIN = R++;
	src[XRANGEPLAIN] = '[v=\\s]*(' + src[XRANGEIDENTIFIER] + ')' +
	                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
	                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
	                   '(?:' + src[PRERELEASE] + ')?' +
	                   src[BUILD] + '?' +
	                   ')?)?';

	var XRANGEPLAINLOOSE = R++;
	src[XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
	                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
	                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
	                        '(?:' + src[PRERELEASELOOSE] + ')?' +
	                        src[BUILD] + '?' +
	                        ')?)?';

	var XRANGE = R++;
	src[XRANGE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAIN] + '$';
	var XRANGELOOSE = R++;
	src[XRANGELOOSE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAINLOOSE] + '$';

	// Coercion.
	// Extract anything that could conceivably be a part of a valid semver
	var COERCE = R++;
	src[COERCE] = '(?:^|[^\\d])' +
	              '(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '})' +
	              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
	              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
	              '(?:$|[^\\d])';

	// Tilde ranges.
	// Meaning is "reasonably at or greater than"
	var LONETILDE = R++;
	src[LONETILDE] = '(?:~>?)';

	var TILDETRIM = R++;
	src[TILDETRIM] = '(\\s*)' + src[LONETILDE] + '\\s+';
	re[TILDETRIM] = new RegExp(src[TILDETRIM], 'g');
	safeRe[TILDETRIM] = new RegExp(makeSafeRe(src[TILDETRIM]), 'g');
	var tildeTrimReplace = '$1~';

	var TILDE = R++;
	src[TILDE] = '^' + src[LONETILDE] + src[XRANGEPLAIN] + '$';
	var TILDELOOSE = R++;
	src[TILDELOOSE] = '^' + src[LONETILDE] + src[XRANGEPLAINLOOSE] + '$';

	// Caret ranges.
	// Meaning is "at least and backwards compatible with"
	var LONECARET = R++;
	src[LONECARET] = '(?:\\^)';

	var CARETTRIM = R++;
	src[CARETTRIM] = '(\\s*)' + src[LONECARET] + '\\s+';
	re[CARETTRIM] = new RegExp(src[CARETTRIM], 'g');
	safeRe[CARETTRIM] = new RegExp(makeSafeRe(src[CARETTRIM]), 'g');
	var caretTrimReplace = '$1^';

	var CARET = R++;
	src[CARET] = '^' + src[LONECARET] + src[XRANGEPLAIN] + '$';
	var CARETLOOSE = R++;
	src[CARETLOOSE] = '^' + src[LONECARET] + src[XRANGEPLAINLOOSE] + '$';

	// A simple gt/lt/eq thing, or just "" to indicate "any version"
	var COMPARATORLOOSE = R++;
	src[COMPARATORLOOSE] = '^' + src[GTLT] + '\\s*(' + LOOSEPLAIN + ')$|^$';
	var COMPARATOR = R++;
	src[COMPARATOR] = '^' + src[GTLT] + '\\s*(' + FULLPLAIN + ')$|^$';

	// An expression to strip any whitespace between the gtlt and the thing
	// it modifies, so that `> 1.2.3` ==> `>1.2.3`
	var COMPARATORTRIM = R++;
	src[COMPARATORTRIM] = '(\\s*)' + src[GTLT] +
	                      '\\s*(' + LOOSEPLAIN + '|' + src[XRANGEPLAIN] + ')';

	// this one has to use the /g flag
	re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], 'g');
	safeRe[COMPARATORTRIM] = new RegExp(makeSafeRe(src[COMPARATORTRIM]), 'g');
	var comparatorTrimReplace = '$1$2$3';

	// Something like `1.2.3 - 1.2.4`
	// Note that these all use the loose form, because they'll be
	// checked against either the strict or loose comparator form
	// later.
	var HYPHENRANGE = R++;
	src[HYPHENRANGE] = '^\\s*(' + src[XRANGEPLAIN] + ')' +
	                   '\\s+-\\s+' +
	                   '(' + src[XRANGEPLAIN] + ')' +
	                   '\\s*$';

	var HYPHENRANGELOOSE = R++;
	src[HYPHENRANGELOOSE] = '^\\s*(' + src[XRANGEPLAINLOOSE] + ')' +
	                        '\\s+-\\s+' +
	                        '(' + src[XRANGEPLAINLOOSE] + ')' +
	                        '\\s*$';

	// Star ranges basically just allow anything at all.
	var STAR = R++;
	src[STAR] = '(<|>)?=?\\s*\\*';

	// Compile to actual regexp objects.
	// All are flag-free, unless they were created above with a flag.
	for (var i = 0; i < R; i++) {
	  debug(i, src[i]);
	  if (!re[i]) {
	    re[i] = new RegExp(src[i]);

	    // Replace all greedy whitespace to prevent regex dos issues. These regex are
	    // used internally via the safeRe object since all inputs in this library get
	    // normalized first to trim and collapse all extra whitespace. The original
	    // regexes are exported for userland consumption and lower level usage. A
	    // future breaking change could export the safer regex only with a note that
	    // all input should have extra whitespace removed.
	    safeRe[i] = new RegExp(makeSafeRe(src[i]));
	  }
	}

	exports.parse = parse;
	function parse (version, options) {
	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }

	  if (version instanceof SemVer) {
	    return version
	  }

	  if (typeof version !== 'string') {
	    return null
	  }

	  if (version.length > MAX_LENGTH) {
	    return null
	  }

	  var r = options.loose ? safeRe[LOOSE] : safeRe[FULL];
	  if (!r.test(version)) {
	    return null
	  }

	  try {
	    return new SemVer(version, options)
	  } catch (er) {
	    return null
	  }
	}

	exports.valid = valid;
	function valid (version, options) {
	  var v = parse(version, options);
	  return v ? v.version : null
	}

	exports.clean = clean;
	function clean (version, options) {
	  var s = parse(version.trim().replace(/^[=v]+/, ''), options);
	  return s ? s.version : null
	}

	exports.SemVer = SemVer;

	function SemVer (version, options) {
	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }
	  if (version instanceof SemVer) {
	    if (version.loose === options.loose) {
	      return version
	    } else {
	      version = version.version;
	    }
	  } else if (typeof version !== 'string') {
	    throw new TypeError('Invalid Version: ' + version)
	  }

	  if (version.length > MAX_LENGTH) {
	    throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters')
	  }

	  if (!(this instanceof SemVer)) {
	    return new SemVer(version, options)
	  }

	  debug('SemVer', version, options);
	  this.options = options;
	  this.loose = !!options.loose;

	  var m = version.trim().match(options.loose ? safeRe[LOOSE] : safeRe[FULL]);

	  if (!m) {
	    throw new TypeError('Invalid Version: ' + version)
	  }

	  this.raw = version;

	  // these are actually numbers
	  this.major = +m[1];
	  this.minor = +m[2];
	  this.patch = +m[3];

	  if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
	    throw new TypeError('Invalid major version')
	  }

	  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
	    throw new TypeError('Invalid minor version')
	  }

	  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
	    throw new TypeError('Invalid patch version')
	  }

	  // numberify any prerelease numeric ids
	  if (!m[4]) {
	    this.prerelease = [];
	  } else {
	    this.prerelease = m[4].split('.').map(function (id) {
	      if (/^[0-9]+$/.test(id)) {
	        var num = +id;
	        if (num >= 0 && num < MAX_SAFE_INTEGER) {
	          return num
	        }
	      }
	      return id
	    });
	  }

	  this.build = m[5] ? m[5].split('.') : [];
	  this.format();
	}

	SemVer.prototype.format = function () {
	  this.version = this.major + '.' + this.minor + '.' + this.patch;
	  if (this.prerelease.length) {
	    this.version += '-' + this.prerelease.join('.');
	  }
	  return this.version
	};

	SemVer.prototype.toString = function () {
	  return this.version
	};

	SemVer.prototype.compare = function (other) {
	  debug('SemVer.compare', this.version, this.options, other);
	  if (!(other instanceof SemVer)) {
	    other = new SemVer(other, this.options);
	  }

	  return this.compareMain(other) || this.comparePre(other)
	};

	SemVer.prototype.compareMain = function (other) {
	  if (!(other instanceof SemVer)) {
	    other = new SemVer(other, this.options);
	  }

	  return compareIdentifiers(this.major, other.major) ||
	         compareIdentifiers(this.minor, other.minor) ||
	         compareIdentifiers(this.patch, other.patch)
	};

	SemVer.prototype.comparePre = function (other) {
	  if (!(other instanceof SemVer)) {
	    other = new SemVer(other, this.options);
	  }

	  // NOT having a prerelease is > having one
	  if (this.prerelease.length && !other.prerelease.length) {
	    return -1
	  } else if (!this.prerelease.length && other.prerelease.length) {
	    return 1
	  } else if (!this.prerelease.length && !other.prerelease.length) {
	    return 0
	  }

	  var i = 0;
	  do {
	    var a = this.prerelease[i];
	    var b = other.prerelease[i];
	    debug('prerelease compare', i, a, b);
	    if (a === undefined && b === undefined) {
	      return 0
	    } else if (b === undefined) {
	      return 1
	    } else if (a === undefined) {
	      return -1
	    } else if (a === b) {
	      continue
	    } else {
	      return compareIdentifiers(a, b)
	    }
	  } while (++i)
	};

	// preminor will bump the version up to the next minor release, and immediately
	// down to pre-release. premajor and prepatch work the same way.
	SemVer.prototype.inc = function (release, identifier) {
	  switch (release) {
	    case 'premajor':
	      this.prerelease.length = 0;
	      this.patch = 0;
	      this.minor = 0;
	      this.major++;
	      this.inc('pre', identifier);
	      break
	    case 'preminor':
	      this.prerelease.length = 0;
	      this.patch = 0;
	      this.minor++;
	      this.inc('pre', identifier);
	      break
	    case 'prepatch':
	      // If this is already a prerelease, it will bump to the next version
	      // drop any prereleases that might already exist, since they are not
	      // relevant at this point.
	      this.prerelease.length = 0;
	      this.inc('patch', identifier);
	      this.inc('pre', identifier);
	      break
	    // If the input is a non-prerelease version, this acts the same as
	    // prepatch.
	    case 'prerelease':
	      if (this.prerelease.length === 0) {
	        this.inc('patch', identifier);
	      }
	      this.inc('pre', identifier);
	      break

	    case 'major':
	      // If this is a pre-major version, bump up to the same major version.
	      // Otherwise increment major.
	      // 1.0.0-5 bumps to 1.0.0
	      // 1.1.0 bumps to 2.0.0
	      if (this.minor !== 0 ||
	          this.patch !== 0 ||
	          this.prerelease.length === 0) {
	        this.major++;
	      }
	      this.minor = 0;
	      this.patch = 0;
	      this.prerelease = [];
	      break
	    case 'minor':
	      // If this is a pre-minor version, bump up to the same minor version.
	      // Otherwise increment minor.
	      // 1.2.0-5 bumps to 1.2.0
	      // 1.2.1 bumps to 1.3.0
	      if (this.patch !== 0 || this.prerelease.length === 0) {
	        this.minor++;
	      }
	      this.patch = 0;
	      this.prerelease = [];
	      break
	    case 'patch':
	      // If this is not a pre-release version, it will increment the patch.
	      // If it is a pre-release it will bump up to the same patch version.
	      // 1.2.0-5 patches to 1.2.0
	      // 1.2.0 patches to 1.2.1
	      if (this.prerelease.length === 0) {
	        this.patch++;
	      }
	      this.prerelease = [];
	      break
	    // This probably shouldn't be used publicly.
	    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
	    case 'pre':
	      if (this.prerelease.length === 0) {
	        this.prerelease = [0];
	      } else {
	        var i = this.prerelease.length;
	        while (--i >= 0) {
	          if (typeof this.prerelease[i] === 'number') {
	            this.prerelease[i]++;
	            i = -2;
	          }
	        }
	        if (i === -1) {
	          // didn't increment anything
	          this.prerelease.push(0);
	        }
	      }
	      if (identifier) {
	        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
	        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
	        if (this.prerelease[0] === identifier) {
	          if (isNaN(this.prerelease[1])) {
	            this.prerelease = [identifier, 0];
	          }
	        } else {
	          this.prerelease = [identifier, 0];
	        }
	      }
	      break

	    default:
	      throw new Error('invalid increment argument: ' + release)
	  }
	  this.format();
	  this.raw = this.version;
	  return this
	};

	exports.inc = inc;
	function inc (version, release, loose, identifier) {
	  if (typeof (loose) === 'string') {
	    identifier = loose;
	    loose = undefined;
	  }

	  try {
	    return new SemVer(version, loose).inc(release, identifier).version
	  } catch (er) {
	    return null
	  }
	}

	exports.diff = diff;
	function diff (version1, version2) {
	  if (eq(version1, version2)) {
	    return null
	  } else {
	    var v1 = parse(version1);
	    var v2 = parse(version2);
	    var prefix = '';
	    if (v1.prerelease.length || v2.prerelease.length) {
	      prefix = 'pre';
	      var defaultResult = 'prerelease';
	    }
	    for (var key in v1) {
	      if (key === 'major' || key === 'minor' || key === 'patch') {
	        if (v1[key] !== v2[key]) {
	          return prefix + key
	        }
	      }
	    }
	    return defaultResult // may be undefined
	  }
	}

	exports.compareIdentifiers = compareIdentifiers;

	var numeric = /^[0-9]+$/;
	function compareIdentifiers (a, b) {
	  var anum = numeric.test(a);
	  var bnum = numeric.test(b);

	  if (anum && bnum) {
	    a = +a;
	    b = +b;
	  }

	  return a === b ? 0
	    : (anum && !bnum) ? -1
	    : (bnum && !anum) ? 1
	    : a < b ? -1
	    : 1
	}

	exports.rcompareIdentifiers = rcompareIdentifiers;
	function rcompareIdentifiers (a, b) {
	  return compareIdentifiers(b, a)
	}

	exports.major = major;
	function major (a, loose) {
	  return new SemVer(a, loose).major
	}

	exports.minor = minor;
	function minor (a, loose) {
	  return new SemVer(a, loose).minor
	}

	exports.patch = patch;
	function patch (a, loose) {
	  return new SemVer(a, loose).patch
	}

	exports.compare = compare;
	function compare (a, b, loose) {
	  return new SemVer(a, loose).compare(new SemVer(b, loose))
	}

	exports.compareLoose = compareLoose;
	function compareLoose (a, b) {
	  return compare(a, b, true)
	}

	exports.rcompare = rcompare;
	function rcompare (a, b, loose) {
	  return compare(b, a, loose)
	}

	exports.sort = sort;
	function sort (list, loose) {
	  return list.sort(function (a, b) {
	    return exports.compare(a, b, loose)
	  })
	}

	exports.rsort = rsort;
	function rsort (list, loose) {
	  return list.sort(function (a, b) {
	    return exports.rcompare(a, b, loose)
	  })
	}

	exports.gt = gt;
	function gt (a, b, loose) {
	  return compare(a, b, loose) > 0
	}

	exports.lt = lt;
	function lt (a, b, loose) {
	  return compare(a, b, loose) < 0
	}

	exports.eq = eq;
	function eq (a, b, loose) {
	  return compare(a, b, loose) === 0
	}

	exports.neq = neq;
	function neq (a, b, loose) {
	  return compare(a, b, loose) !== 0
	}

	exports.gte = gte;
	function gte (a, b, loose) {
	  return compare(a, b, loose) >= 0
	}

	exports.lte = lte;
	function lte (a, b, loose) {
	  return compare(a, b, loose) <= 0
	}

	exports.cmp = cmp;
	function cmp (a, op, b, loose) {
	  switch (op) {
	    case '===':
	      if (typeof a === 'object')
	        a = a.version;
	      if (typeof b === 'object')
	        b = b.version;
	      return a === b

	    case '!==':
	      if (typeof a === 'object')
	        a = a.version;
	      if (typeof b === 'object')
	        b = b.version;
	      return a !== b

	    case '':
	    case '=':
	    case '==':
	      return eq(a, b, loose)

	    case '!=':
	      return neq(a, b, loose)

	    case '>':
	      return gt(a, b, loose)

	    case '>=':
	      return gte(a, b, loose)

	    case '<':
	      return lt(a, b, loose)

	    case '<=':
	      return lte(a, b, loose)

	    default:
	      throw new TypeError('Invalid operator: ' + op)
	  }
	}

	exports.Comparator = Comparator;
	function Comparator (comp, options) {
	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }

	  if (comp instanceof Comparator) {
	    if (comp.loose === !!options.loose) {
	      return comp
	    } else {
	      comp = comp.value;
	    }
	  }

	  if (!(this instanceof Comparator)) {
	    return new Comparator(comp, options)
	  }

	  comp = comp.trim().split(/\s+/).join(' ');
	  debug('comparator', comp, options);
	  this.options = options;
	  this.loose = !!options.loose;
	  this.parse(comp);

	  if (this.semver === ANY) {
	    this.value = '';
	  } else {
	    this.value = this.operator + this.semver.version;
	  }

	  debug('comp', this);
	}

	var ANY = {};
	Comparator.prototype.parse = function (comp) {
	  var r = this.options.loose ? safeRe[COMPARATORLOOSE] : safeRe[COMPARATOR];
	  var m = comp.match(r);

	  if (!m) {
	    throw new TypeError('Invalid comparator: ' + comp)
	  }

	  this.operator = m[1];
	  if (this.operator === '=') {
	    this.operator = '';
	  }

	  // if it literally is just '>' or '' then allow anything.
	  if (!m[2]) {
	    this.semver = ANY;
	  } else {
	    this.semver = new SemVer(m[2], this.options.loose);
	  }
	};

	Comparator.prototype.toString = function () {
	  return this.value
	};

	Comparator.prototype.test = function (version) {
	  debug('Comparator.test', version, this.options.loose);

	  if (this.semver === ANY) {
	    return true
	  }

	  if (typeof version === 'string') {
	    version = new SemVer(version, this.options);
	  }

	  return cmp(version, this.operator, this.semver, this.options)
	};

	Comparator.prototype.intersects = function (comp, options) {
	  if (!(comp instanceof Comparator)) {
	    throw new TypeError('a Comparator is required')
	  }

	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }

	  var rangeTmp;

	  if (this.operator === '') {
	    rangeTmp = new Range(comp.value, options);
	    return satisfies(this.value, rangeTmp, options)
	  } else if (comp.operator === '') {
	    rangeTmp = new Range(this.value, options);
	    return satisfies(comp.semver, rangeTmp, options)
	  }

	  var sameDirectionIncreasing =
	    (this.operator === '>=' || this.operator === '>') &&
	    (comp.operator === '>=' || comp.operator === '>');
	  var sameDirectionDecreasing =
	    (this.operator === '<=' || this.operator === '<') &&
	    (comp.operator === '<=' || comp.operator === '<');
	  var sameSemVer = this.semver.version === comp.semver.version;
	  var differentDirectionsInclusive =
	    (this.operator === '>=' || this.operator === '<=') &&
	    (comp.operator === '>=' || comp.operator === '<=');
	  var oppositeDirectionsLessThan =
	    cmp(this.semver, '<', comp.semver, options) &&
	    ((this.operator === '>=' || this.operator === '>') &&
	    (comp.operator === '<=' || comp.operator === '<'));
	  var oppositeDirectionsGreaterThan =
	    cmp(this.semver, '>', comp.semver, options) &&
	    ((this.operator === '<=' || this.operator === '<') &&
	    (comp.operator === '>=' || comp.operator === '>'));

	  return sameDirectionIncreasing || sameDirectionDecreasing ||
	    (sameSemVer && differentDirectionsInclusive) ||
	    oppositeDirectionsLessThan || oppositeDirectionsGreaterThan
	};

	exports.Range = Range;
	function Range (range, options) {
	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }

	  if (range instanceof Range) {
	    if (range.loose === !!options.loose &&
	        range.includePrerelease === !!options.includePrerelease) {
	      return range
	    } else {
	      return new Range(range.raw, options)
	    }
	  }

	  if (range instanceof Comparator) {
	    return new Range(range.value, options)
	  }

	  if (!(this instanceof Range)) {
	    return new Range(range, options)
	  }

	  this.options = options;
	  this.loose = !!options.loose;
	  this.includePrerelease = !!options.includePrerelease;

	  // First reduce all whitespace as much as possible so we do not have to rely
	  // on potentially slow regexes like \s*. This is then stored and used for
	  // future error messages as well.
	  this.raw = range
	    .trim()
	    .split(/\s+/)
	    .join(' ');

	  // First, split based on boolean or ||
	  this.set = this.raw.split('||').map(function (range) {
	    return this.parseRange(range.trim())
	  }, this).filter(function (c) {
	    // throw out any that are not relevant for whatever reason
	    return c.length
	  });

	  if (!this.set.length) {
	    throw new TypeError('Invalid SemVer Range: ' + this.raw)
	  }

	  this.format();
	}

	Range.prototype.format = function () {
	  this.range = this.set.map(function (comps) {
	    return comps.join(' ').trim()
	  }).join('||').trim();
	  return this.range
	};

	Range.prototype.toString = function () {
	  return this.range
	};

	Range.prototype.parseRange = function (range) {
	  var loose = this.options.loose;
	  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
	  var hr = loose ? safeRe[HYPHENRANGELOOSE] : safeRe[HYPHENRANGE];
	  range = range.replace(hr, hyphenReplace);
	  debug('hyphen replace', range);
	  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
	  range = range.replace(safeRe[COMPARATORTRIM], comparatorTrimReplace);
	  debug('comparator trim', range, safeRe[COMPARATORTRIM]);

	  // `~ 1.2.3` => `~1.2.3`
	  range = range.replace(safeRe[TILDETRIM], tildeTrimReplace);

	  // `^ 1.2.3` => `^1.2.3`
	  range = range.replace(safeRe[CARETTRIM], caretTrimReplace);

	  // At this point, the range is completely trimmed and
	  // ready to be split into comparators.
	  var compRe = loose ? safeRe[COMPARATORLOOSE] : safeRe[COMPARATOR];
	  var set = range.split(' ').map(function (comp) {
	    return parseComparator(comp, this.options)
	  }, this).join(' ').split(/\s+/);
	  if (this.options.loose) {
	    // in loose mode, throw out any that are not valid comparators
	    set = set.filter(function (comp) {
	      return !!comp.match(compRe)
	    });
	  }
	  set = set.map(function (comp) {
	    return new Comparator(comp, this.options)
	  }, this);

	  return set
	};

	Range.prototype.intersects = function (range, options) {
	  if (!(range instanceof Range)) {
	    throw new TypeError('a Range is required')
	  }

	  return this.set.some(function (thisComparators) {
	    return thisComparators.every(function (thisComparator) {
	      return range.set.some(function (rangeComparators) {
	        return rangeComparators.every(function (rangeComparator) {
	          return thisComparator.intersects(rangeComparator, options)
	        })
	      })
	    })
	  })
	};

	// Mostly just for testing and legacy API reasons
	exports.toComparators = toComparators;
	function toComparators (range, options) {
	  return new Range(range, options).set.map(function (comp) {
	    return comp.map(function (c) {
	      return c.value
	    }).join(' ').trim().split(' ')
	  })
	}

	// comprised of xranges, tildes, stars, and gtlt's at this point.
	// already replaced the hyphen ranges
	// turn into a set of JUST comparators.
	function parseComparator (comp, options) {
	  debug('comp', comp, options);
	  comp = replaceCarets(comp, options);
	  debug('caret', comp);
	  comp = replaceTildes(comp, options);
	  debug('tildes', comp);
	  comp = replaceXRanges(comp, options);
	  debug('xrange', comp);
	  comp = replaceStars(comp, options);
	  debug('stars', comp);
	  return comp
	}

	function isX (id) {
	  return !id || id.toLowerCase() === 'x' || id === '*'
	}

	// ~, ~> --> * (any, kinda silly)
	// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
	// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
	// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
	// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
	// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
	function replaceTildes (comp, options) {
	  return comp.trim().split(/\s+/).map(function (comp) {
	    return replaceTilde(comp, options)
	  }).join(' ')
	}

	function replaceTilde (comp, options) {
	  var r = options.loose ? safeRe[TILDELOOSE] : safeRe[TILDE];
	  return comp.replace(r, function (_, M, m, p, pr) {
	    debug('tilde', comp, _, M, m, p, pr);
	    var ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
	    } else if (isX(p)) {
	      // ~1.2 == >=1.2.0 <1.3.0
	      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
	    } else if (pr) {
	      debug('replaceTilde pr', pr);
	      ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
	            ' <' + M + '.' + (+m + 1) + '.0';
	    } else {
	      // ~1.2.3 == >=1.2.3 <1.3.0
	      ret = '>=' + M + '.' + m + '.' + p +
	            ' <' + M + '.' + (+m + 1) + '.0';
	    }

	    debug('tilde return', ret);
	    return ret
	  })
	}

	// ^ --> * (any, kinda silly)
	// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
	// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
	// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
	// ^1.2.3 --> >=1.2.3 <2.0.0
	// ^1.2.0 --> >=1.2.0 <2.0.0
	function replaceCarets (comp, options) {
	  return comp.trim().split(/\s+/).map(function (comp) {
	    return replaceCaret(comp, options)
	  }).join(' ')
	}

	function replaceCaret (comp, options) {
	  debug('caret', comp, options);
	  var r = options.loose ? safeRe[CARETLOOSE] : safeRe[CARET];
	  return comp.replace(r, function (_, M, m, p, pr) {
	    debug('caret', comp, _, M, m, p, pr);
	    var ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
	    } else if (isX(p)) {
	      if (M === '0') {
	        ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
	      } else {
	        ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
	      }
	    } else if (pr) {
	      debug('replaceCaret pr', pr);
	      if (M === '0') {
	        if (m === '0') {
	          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
	                ' <' + M + '.' + m + '.' + (+p + 1);
	        } else {
	          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
	                ' <' + M + '.' + (+m + 1) + '.0';
	        }
	      } else {
	        ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
	              ' <' + (+M + 1) + '.0.0';
	      }
	    } else {
	      debug('no pr');
	      if (M === '0') {
	        if (m === '0') {
	          ret = '>=' + M + '.' + m + '.' + p +
	                ' <' + M + '.' + m + '.' + (+p + 1);
	        } else {
	          ret = '>=' + M + '.' + m + '.' + p +
	                ' <' + M + '.' + (+m + 1) + '.0';
	        }
	      } else {
	        ret = '>=' + M + '.' + m + '.' + p +
	              ' <' + (+M + 1) + '.0.0';
	      }
	    }

	    debug('caret return', ret);
	    return ret
	  })
	}

	function replaceXRanges (comp, options) {
	  debug('replaceXRanges', comp, options);
	  return comp.split(/\s+/).map(function (comp) {
	    return replaceXRange(comp, options)
	  }).join(' ')
	}

	function replaceXRange (comp, options) {
	  comp = comp.trim();
	  var r = options.loose ? safeRe[XRANGELOOSE] : safeRe[XRANGE];
	  return comp.replace(r, function (ret, gtlt, M, m, p, pr) {
	    debug('xRange', comp, ret, gtlt, M, m, p, pr);
	    var xM = isX(M);
	    var xm = xM || isX(m);
	    var xp = xm || isX(p);
	    var anyX = xp;

	    if (gtlt === '=' && anyX) {
	      gtlt = '';
	    }

	    if (xM) {
	      if (gtlt === '>' || gtlt === '<') {
	        // nothing is allowed
	        ret = '<0.0.0';
	      } else {
	        // nothing is forbidden
	        ret = '*';
	      }
	    } else if (gtlt && anyX) {
	      // we know patch is an x, because we have any x at all.
	      // replace X with 0
	      if (xm) {
	        m = 0;
	      }
	      p = 0;

	      if (gtlt === '>') {
	        // >1 => >=2.0.0
	        // >1.2 => >=1.3.0
	        // >1.2.3 => >= 1.2.4
	        gtlt = '>=';
	        if (xm) {
	          M = +M + 1;
	          m = 0;
	          p = 0;
	        } else {
	          m = +m + 1;
	          p = 0;
	        }
	      } else if (gtlt === '<=') {
	        // <=0.7.x is actually <0.8.0, since any 0.7.x should
	        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
	        gtlt = '<';
	        if (xm) {
	          M = +M + 1;
	        } else {
	          m = +m + 1;
	        }
	      }

	      ret = gtlt + M + '.' + m + '.' + p;
	    } else if (xm) {
	      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
	    } else if (xp) {
	      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
	    }

	    debug('xRange return', ret);

	    return ret
	  })
	}

	// Because * is AND-ed with everything else in the comparator,
	// and '' means "any version", just remove the *s entirely.
	function replaceStars (comp, options) {
	  debug('replaceStars', comp, options);
	  // Looseness is ignored here.  star is always as loose as it gets!
	  return comp.trim().replace(safeRe[STAR], '')
	}

	// This function is passed to string.replace(safeRe[HYPHENRANGE])
	// M, m, patch, prerelease, build
	// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
	// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
	// 1.2 - 3.4 => >=1.2.0 <3.5.0
	function hyphenReplace ($0,
	  from, fM, fm, fp, fpr, fb,
	  to, tM, tm, tp, tpr, tb) {
	  if (isX(fM)) {
	    from = '';
	  } else if (isX(fm)) {
	    from = '>=' + fM + '.0.0';
	  } else if (isX(fp)) {
	    from = '>=' + fM + '.' + fm + '.0';
	  } else {
	    from = '>=' + from;
	  }

	  if (isX(tM)) {
	    to = '';
	  } else if (isX(tm)) {
	    to = '<' + (+tM + 1) + '.0.0';
	  } else if (isX(tp)) {
	    to = '<' + tM + '.' + (+tm + 1) + '.0';
	  } else if (tpr) {
	    to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
	  } else {
	    to = '<=' + to;
	  }

	  return (from + ' ' + to).trim()
	}

	// if ANY of the sets match ALL of its comparators, then pass
	Range.prototype.test = function (version) {
	  if (!version) {
	    return false
	  }

	  if (typeof version === 'string') {
	    version = new SemVer(version, this.options);
	  }

	  for (var i = 0; i < this.set.length; i++) {
	    if (testSet(this.set[i], version, this.options)) {
	      return true
	    }
	  }
	  return false
	};

	function testSet (set, version, options) {
	  for (var i = 0; i < set.length; i++) {
	    if (!set[i].test(version)) {
	      return false
	    }
	  }

	  if (version.prerelease.length && !options.includePrerelease) {
	    // Find the set of versions that are allowed to have prereleases
	    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
	    // That should allow `1.2.3-pr.2` to pass.
	    // However, `1.2.4-alpha.notready` should NOT be allowed,
	    // even though it's within the range set by the comparators.
	    for (i = 0; i < set.length; i++) {
	      debug(set[i].semver);
	      if (set[i].semver === ANY) {
	        continue
	      }

	      if (set[i].semver.prerelease.length > 0) {
	        var allowed = set[i].semver;
	        if (allowed.major === version.major &&
	            allowed.minor === version.minor &&
	            allowed.patch === version.patch) {
	          return true
	        }
	      }
	    }

	    // Version has a -pre, but it's not one of the ones we like.
	    return false
	  }

	  return true
	}

	exports.satisfies = satisfies;
	function satisfies (version, range, options) {
	  try {
	    range = new Range(range, options);
	  } catch (er) {
	    return false
	  }
	  return range.test(version)
	}

	exports.maxSatisfying = maxSatisfying;
	function maxSatisfying (versions, range, options) {
	  var max = null;
	  var maxSV = null;
	  try {
	    var rangeObj = new Range(range, options);
	  } catch (er) {
	    return null
	  }
	  versions.forEach(function (v) {
	    if (rangeObj.test(v)) {
	      // satisfies(v, range, options)
	      if (!max || maxSV.compare(v) === -1) {
	        // compare(max, v, true)
	        max = v;
	        maxSV = new SemVer(max, options);
	      }
	    }
	  });
	  return max
	}

	exports.minSatisfying = minSatisfying;
	function minSatisfying (versions, range, options) {
	  var min = null;
	  var minSV = null;
	  try {
	    var rangeObj = new Range(range, options);
	  } catch (er) {
	    return null
	  }
	  versions.forEach(function (v) {
	    if (rangeObj.test(v)) {
	      // satisfies(v, range, options)
	      if (!min || minSV.compare(v) === 1) {
	        // compare(min, v, true)
	        min = v;
	        minSV = new SemVer(min, options);
	      }
	    }
	  });
	  return min
	}

	exports.minVersion = minVersion;
	function minVersion (range, loose) {
	  range = new Range(range, loose);

	  var minver = new SemVer('0.0.0');
	  if (range.test(minver)) {
	    return minver
	  }

	  minver = new SemVer('0.0.0-0');
	  if (range.test(minver)) {
	    return minver
	  }

	  minver = null;
	  for (var i = 0; i < range.set.length; ++i) {
	    var comparators = range.set[i];

	    comparators.forEach(function (comparator) {
	      // Clone to avoid manipulating the comparator's semver object.
	      var compver = new SemVer(comparator.semver.version);
	      switch (comparator.operator) {
	        case '>':
	          if (compver.prerelease.length === 0) {
	            compver.patch++;
	          } else {
	            compver.prerelease.push(0);
	          }
	          compver.raw = compver.format();
	          /* fallthrough */
	        case '':
	        case '>=':
	          if (!minver || gt(minver, compver)) {
	            minver = compver;
	          }
	          break
	        case '<':
	        case '<=':
	          /* Ignore maximum versions */
	          break
	        /* istanbul ignore next */
	        default:
	          throw new Error('Unexpected operation: ' + comparator.operator)
	      }
	    });
	  }

	  if (minver && range.test(minver)) {
	    return minver
	  }

	  return null
	}

	exports.validRange = validRange;
	function validRange (range, options) {
	  try {
	    // Return '*' instead of '' so that truthiness works.
	    // This will throw if it's invalid anyway
	    return new Range(range, options).range || '*'
	  } catch (er) {
	    return null
	  }
	}

	// Determine if version is less than all the versions possible in the range
	exports.ltr = ltr;
	function ltr (version, range, options) {
	  return outside(version, range, '<', options)
	}

	// Determine if version is greater than all the versions possible in the range.
	exports.gtr = gtr;
	function gtr (version, range, options) {
	  return outside(version, range, '>', options)
	}

	exports.outside = outside;
	function outside (version, range, hilo, options) {
	  version = new SemVer(version, options);
	  range = new Range(range, options);

	  var gtfn, ltefn, ltfn, comp, ecomp;
	  switch (hilo) {
	    case '>':
	      gtfn = gt;
	      ltefn = lte;
	      ltfn = lt;
	      comp = '>';
	      ecomp = '>=';
	      break
	    case '<':
	      gtfn = lt;
	      ltefn = gte;
	      ltfn = gt;
	      comp = '<';
	      ecomp = '<=';
	      break
	    default:
	      throw new TypeError('Must provide a hilo val of "<" or ">"')
	  }

	  // If it satisifes the range it is not outside
	  if (satisfies(version, range, options)) {
	    return false
	  }

	  // From now on, variable terms are as if we're in "gtr" mode.
	  // but note that everything is flipped for the "ltr" function.

	  for (var i = 0; i < range.set.length; ++i) {
	    var comparators = range.set[i];

	    var high = null;
	    var low = null;

	    comparators.forEach(function (comparator) {
	      if (comparator.semver === ANY) {
	        comparator = new Comparator('>=0.0.0');
	      }
	      high = high || comparator;
	      low = low || comparator;
	      if (gtfn(comparator.semver, high.semver, options)) {
	        high = comparator;
	      } else if (ltfn(comparator.semver, low.semver, options)) {
	        low = comparator;
	      }
	    });

	    // If the edge version comparator has a operator then our version
	    // isn't outside it
	    if (high.operator === comp || high.operator === ecomp) {
	      return false
	    }

	    // If the lowest version comparator has an operator and our version
	    // is less than it then it isn't higher than the range
	    if ((!low.operator || low.operator === comp) &&
	        ltefn(version, low.semver)) {
	      return false
	    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
	      return false
	    }
	  }
	  return true
	}

	exports.prerelease = prerelease;
	function prerelease (version, options) {
	  var parsed = parse(version, options);
	  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null
	}

	exports.intersects = intersects;
	function intersects (r1, r2, options) {
	  r1 = new Range(r1, options);
	  r2 = new Range(r2, options);
	  return r1.intersects(r2)
	}

	exports.coerce = coerce;
	function coerce (version) {
	  if (version instanceof SemVer) {
	    return version
	  }

	  if (typeof version !== 'string') {
	    return null
	  }

	  var match = version.match(safeRe[COERCE]);

	  if (match == null) {
	    return null
	  }

	  return parse(match[1] +
	    '.' + (match[2] || '0') +
	    '.' + (match[3] || '0'))
	} 
} (semver$4, semver$4.exports));

var semverExports$1 = semver$4.exports;

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports._exposeCertSettings = exports._exposeProxySettings = exports._normalizeSeparators = exports._isRooted = exports._getDirectoryName = exports._ensureRooted = exports._isUncPath = exports._loadData = exports._ensurePatternRooted = exports._getFindInfoFromPattern = exports._cloneMatchOptions = exports._legacyFindFiles_convertPatternToRegExp = exports._which = exports._checkPath = exports._exist = exports._debug = exports._error = exports._warning = exports._command = exports._getVariableKey = exports._getVariable = exports._loc = exports._setResourcePath = exports._setErrStream = exports._setStdStream = exports._writeLine = exports._endsWith = exports._startsWith = exports.IssueSource = exports._vault = exports._knownVariableMap = void 0;
	var fs = require$$1;
	var path = require$$0$1;
	var os = require$$0$2;
	var minimatch = minimatch_1;
	var util = require$$0$4;
	var tcm = taskcommand;
	var vm = vault;
	var semver = semverExports$1;
	var crypto = require$$2$1;
	/**
	 * Hash table of known variable info. The formatted env var name is the lookup key.
	 *
	 * The purpose of this hash table is to keep track of known variables. The hash table
	 * needs to be maintained for multiple reasons:
	 *  1) to distinguish between env vars and job vars
	 *  2) to distinguish between secret vars and public
	 *  3) to know the real variable name and not just the formatted env var name.
	 */
	exports._knownVariableMap = {};
	//-----------------------------------------------------
	// Enums
	//-----------------------------------------------------
	var IssueSource;
	(function (IssueSource) {
	    IssueSource["CustomerScript"] = "CustomerScript";
	    IssueSource["TaskInternal"] = "TaskInternal";
	})(IssueSource = exports.IssueSource || (exports.IssueSource = {}));
	//-----------------------------------------------------
	// Validation Checks
	//-----------------------------------------------------
	// async await needs generators in node 4.x+
	if (semver.lt(process.versions.node, '4.2.0')) {
	    _warning('Tasks require a new agent.  Upgrade your agent or node to 4.2.0 or later', IssueSource.TaskInternal);
	}
	//-----------------------------------------------------
	// String convenience
	//-----------------------------------------------------
	function _startsWith(str, start) {
	    return str.slice(0, start.length) == start;
	}
	exports._startsWith = _startsWith;
	function _endsWith(str, end) {
	    return str.slice(-end.length) == end;
	}
	exports._endsWith = _endsWith;
	//-----------------------------------------------------
	// General Helpers
	//-----------------------------------------------------
	var _outStream = process.stdout;
	process.stderr;
	function _writeLine(str) {
	    _outStream.write(str + os.EOL);
	}
	exports._writeLine = _writeLine;
	function _setStdStream(stdStream) {
	    _outStream = stdStream;
	}
	exports._setStdStream = _setStdStream;
	function _setErrStream(errStream) {
	}
	exports._setErrStream = _setErrStream;
	//-----------------------------------------------------
	// Loc Helpers
	//-----------------------------------------------------
	var _locStringCache = {};
	var _resourceFiles = {};
	var _libResourceFileLoaded = false;
	var _resourceCulture = 'en-US';
	function _loadResJson(resjsonFile) {
	    var resJson;
	    if (_exist(resjsonFile)) {
	        var resjsonContent = fs.readFileSync(resjsonFile, 'utf8').toString();
	        // remove BOM
	        if (resjsonContent.indexOf('\uFEFF') == 0) {
	            resjsonContent = resjsonContent.slice(1);
	        }
	        try {
	            resJson = JSON.parse(resjsonContent);
	        }
	        catch (err) {
	            _debug('unable to parse resjson with err: ' + err.message);
	        }
	    }
	    else {
	        _debug('.resjson file not found: ' + resjsonFile);
	    }
	    return resJson;
	}
	function _loadLocStrings(resourceFile, culture) {
	    var locStrings = {};
	    if (_exist(resourceFile)) {
	        var resourceJson = commonjsRequire(resourceFile);
	        if (resourceJson && resourceJson.hasOwnProperty('messages')) {
	            var locResourceJson;
	            // load up resource resjson for different culture
	            var localizedResourceFile = path.join(path.dirname(resourceFile), 'Strings', 'resources.resjson');
	            var upperCulture = culture.toUpperCase();
	            var cultures = [];
	            try {
	                cultures = fs.readdirSync(localizedResourceFile);
	            }
	            catch (ex) { }
	            for (var i = 0; i < cultures.length; i++) {
	                if (cultures[i].toUpperCase() == upperCulture) {
	                    localizedResourceFile = path.join(localizedResourceFile, cultures[i], 'resources.resjson');
	                    if (_exist(localizedResourceFile)) {
	                        locResourceJson = _loadResJson(localizedResourceFile);
	                    }
	                    break;
	                }
	            }
	            for (var key in resourceJson.messages) {
	                if (locResourceJson && locResourceJson.hasOwnProperty('loc.messages.' + key)) {
	                    locStrings[key] = locResourceJson['loc.messages.' + key];
	                }
	                else {
	                    locStrings[key] = resourceJson.messages[key];
	                }
	            }
	        }
	    }
	    else {
	        _warning('LIB_ResourceFile does not exist', IssueSource.TaskInternal);
	    }
	    return locStrings;
	}
	/**
	 * Sets the location of the resources json.  This is typically the task.json file.
	 * Call once at the beginning of the script before any calls to loc.
	 * @param     path      Full path to the json.
	 * @param     ignoreWarnings  Won't throw warnings if path already set.
	 * @returns   void
	 */
	function _setResourcePath(path, ignoreWarnings) {
	    if (ignoreWarnings === void 0) { ignoreWarnings = false; }
	    if (process.env['TASKLIB_INPROC_UNITS']) {
	        _resourceFiles = {};
	        _libResourceFileLoaded = false;
	        _locStringCache = {};
	        _resourceCulture = 'en-US';
	    }
	    if (!_resourceFiles[path]) {
	        _checkPath(path, 'resource file path');
	        _resourceFiles[path] = path;
	        _debug('adding resource file: ' + path);
	        _resourceCulture = _getVariable('system.culture') || _resourceCulture;
	        var locStrs = _loadLocStrings(path, _resourceCulture);
	        for (var key in locStrs) {
	            //cache loc string
	            _locStringCache[key] = locStrs[key];
	        }
	    }
	    else {
	        if (ignoreWarnings) {
	            _debug(_loc('LIB_ResourceFileAlreadySet', path));
	        }
	        else {
	            _warning(_loc('LIB_ResourceFileAlreadySet', path), IssueSource.TaskInternal);
	        }
	    }
	}
	exports._setResourcePath = _setResourcePath;
	/**
	 * Gets the localized string from the json resource file.  Optionally formats with additional params.
	 *
	 * @param     key      key of the resources string in the resource file
	 * @param     param    additional params for formatting the string
	 * @returns   string
	 */
	function _loc(key) {
	    var param = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        param[_i - 1] = arguments[_i];
	    }
	    if (!_libResourceFileLoaded) {
	        // merge loc strings from azure-pipelines-task-lib.
	        var libResourceFile = path.join(__dirname, 'lib.json');
	        var libLocStrs = _loadLocStrings(libResourceFile, _resourceCulture);
	        for (var libKey in libLocStrs) {
	            //cache azure-pipelines-task-lib loc string
	            _locStringCache[libKey] = libLocStrs[libKey];
	        }
	        _libResourceFileLoaded = true;
	    }
	    var locString;
	    if (_locStringCache.hasOwnProperty(key)) {
	        locString = _locStringCache[key];
	    }
	    else {
	        if (Object.keys(_resourceFiles).length <= 0) {
	            _warning("Resource file haven't been set, can't find loc string for key: " + key, IssueSource.TaskInternal);
	        }
	        else {
	            _warning("Can't find loc string for key: " + key);
	        }
	        locString = key;
	    }
	    if (param.length > 0) {
	        return util.format.apply(this, [locString].concat(param));
	    }
	    else {
	        return locString;
	    }
	}
	exports._loc = _loc;
	//-----------------------------------------------------
	// Input Helpers
	//-----------------------------------------------------
	/**
	 * Gets a variable value that is defined on the build/release definition or set at runtime.
	 *
	 * @param     name     name of the variable to get
	 * @returns   string
	 */
	function _getVariable(name) {
	    var varval;
	    // get the metadata
	    var info;
	    var key = _getVariableKey(name);
	    if (exports._knownVariableMap.hasOwnProperty(key)) {
	        info = exports._knownVariableMap[key];
	    }
	    if (info && info.secret) {
	        // get the secret value
	        varval = exports._vault.retrieveSecret('SECRET_' + key);
	    }
	    else {
	        // get the public value
	        varval = process.env[key];
	        // fallback for pre 2.104.1 agent
	        if (!varval && name.toUpperCase() == 'AGENT.JOBSTATUS') {
	            varval = process.env['agent.jobstatus'];
	        }
	    }
	    _debug(name + '=' + varval);
	    return varval;
	}
	exports._getVariable = _getVariable;
	function _getVariableKey(name) {
	    if (!name) {
	        throw new Error(_loc('LIB_ParameterIsRequired', 'name'));
	    }
	    return name.replace(/\./g, '_').replace(/ /g, '_').toUpperCase();
	}
	exports._getVariableKey = _getVariableKey;
	//-----------------------------------------------------
	// Cmd Helpers
	//-----------------------------------------------------
	function _command(command, properties, message) {
	    var taskCmd = new tcm.TaskCommand(command, properties, message);
	    _writeLine(taskCmd.toString());
	}
	exports._command = _command;
	function _warning(message, source) {
	    _command('task.issue', { 'type': 'warning', 'source': source }, message);
	}
	exports._warning = _warning;
	function _error(message, source) {
	    _command('task.issue', { 'type': 'error', 'source': source }, message);
	}
	exports._error = _error;
	function _debug(message) {
	    _command('task.debug', null, message);
	}
	exports._debug = _debug;
	// //-----------------------------------------------------
	// // Disk Functions
	// //-----------------------------------------------------
	/**
	 * Returns whether a path exists.
	 *
	 * @param     path      path to check
	 * @returns   boolean
	 */
	function _exist(path) {
	    var exist = false;
	    try {
	        exist = !!(path && fs.statSync(path) != null);
	    }
	    catch (err) {
	        if (err && err.code === 'ENOENT') {
	            exist = false;
	        }
	        else {
	            throw err;
	        }
	    }
	    return exist;
	}
	exports._exist = _exist;
	/**
	 * Checks whether a path exists.
	 * If the path does not exist, it will throw.
	 *
	 * @param     p         path to check
	 * @param     name      name only used in error message to identify the path
	 * @returns   void
	 */
	function _checkPath(p, name) {
	    _debug('check path : ' + p);
	    if (!_exist(p)) {
	        throw new Error(_loc('LIB_PathNotFound', name, p));
	    }
	}
	exports._checkPath = _checkPath;
	/**
	 * Returns path of a tool had the tool actually been invoked.  Resolves via paths.
	 * If you check and the tool does not exist, it will throw.
	 *
	 * @param     tool       name of the tool
	 * @param     check      whether to check if tool exists
	 * @returns   string
	 */
	function _which(tool, check) {
	    if (!tool) {
	        throw new Error('parameter \'tool\' is required');
	    }
	    // recursive when check=true
	    if (check) {
	        var result = _which(tool, false);
	        if (result) {
	            return result;
	        }
	        else {
	            if (process.platform == 'win32') {
	                throw new Error(_loc('LIB_WhichNotFound_Win', tool));
	            }
	            else {
	                throw new Error(_loc('LIB_WhichNotFound_Linux', tool));
	            }
	        }
	    }
	    _debug("which '" + tool + "'");
	    try {
	        // build the list of extensions to try
	        var extensions = [];
	        if (process.platform == 'win32' && process.env['PATHEXT']) {
	            for (var _i = 0, _a = process.env['PATHEXT'].split(path.delimiter); _i < _a.length; _i++) {
	                var extension = _a[_i];
	                if (extension) {
	                    extensions.push(extension);
	                }
	            }
	        }
	        // if it's rooted, return it if exists. otherwise return empty.
	        if (_isRooted(tool)) {
	            var filePath = _tryGetExecutablePath(tool, extensions);
	            if (filePath) {
	                _debug("found: '" + filePath + "'");
	                return filePath;
	            }
	            _debug('not found');
	            return '';
	        }
	        // if any path separators, return empty
	        if (tool.indexOf('/') >= 0 || (process.platform == 'win32' && tool.indexOf('\\') >= 0)) {
	            _debug('not found');
	            return '';
	        }
	        // build the list of directories
	        //
	        // Note, technically "where" checks the current directory on Windows. From a task lib perspective,
	        // it feels like we should not do this. Checking the current directory seems like more of a use
	        // case of a shell, and the which() function exposed by the task lib should strive for consistency
	        // across platforms.
	        var directories = [];
	        if (process.env['PATH']) {
	            for (var _b = 0, _c = process.env['PATH'].split(path.delimiter); _b < _c.length; _b++) {
	                var p = _c[_b];
	                if (p) {
	                    directories.push(p);
	                }
	            }
	        }
	        // return the first match
	        for (var _d = 0, directories_1 = directories; _d < directories_1.length; _d++) {
	            var directory = directories_1[_d];
	            var filePath = _tryGetExecutablePath(directory + path.sep + tool, extensions);
	            if (filePath) {
	                _debug("found: '" + filePath + "'");
	                return filePath;
	            }
	        }
	        _debug('not found');
	        return '';
	    }
	    catch (err) {
	        throw new Error(_loc('LIB_OperationFailed', 'which', err.message));
	    }
	}
	exports._which = _which;
	/**
	 * Best effort attempt to determine whether a file exists and is executable.
	 * @param filePath    file path to check
	 * @param extensions  additional file extensions to try
	 * @return if file exists and is executable, returns the file path. otherwise empty string.
	 */
	function _tryGetExecutablePath(filePath, extensions) {
	    try {
	        // test file exists
	        var stats = fs.statSync(filePath);
	        if (stats.isFile()) {
	            if (process.platform == 'win32') {
	                // on Windows, test for valid extension
	                var isExecutable = false;
	                var fileName = path.basename(filePath);
	                var dotIndex = fileName.lastIndexOf('.');
	                if (dotIndex >= 0) {
	                    var upperExt_1 = fileName.substr(dotIndex).toUpperCase();
	                    if (extensions.some(function (validExt) { return validExt.toUpperCase() == upperExt_1; })) {
	                        return filePath;
	                    }
	                }
	            }
	            else {
	                if (isUnixExecutable(stats)) {
	                    return filePath;
	                }
	            }
	        }
	    }
	    catch (err) {
	        if (err.code != 'ENOENT') {
	            _debug("Unexpected error attempting to determine if executable file exists '" + filePath + "': " + err);
	        }
	    }
	    // try each extension
	    var originalFilePath = filePath;
	    for (var _i = 0, extensions_1 = extensions; _i < extensions_1.length; _i++) {
	        var extension = extensions_1[_i];
	        var filePath_1 = originalFilePath + extension;
	        try {
	            var stats = fs.statSync(filePath_1);
	            if (stats.isFile()) {
	                if (process.platform == 'win32') {
	                    // preserve the case of the actual file (since an extension was appended)
	                    try {
	                        var directory = path.dirname(filePath_1);
	                        var upperName = path.basename(filePath_1).toUpperCase();
	                        for (var _a = 0, _b = fs.readdirSync(directory); _a < _b.length; _a++) {
	                            var actualName = _b[_a];
	                            if (upperName == actualName.toUpperCase()) {
	                                filePath_1 = path.join(directory, actualName);
	                                break;
	                            }
	                        }
	                    }
	                    catch (err) {
	                        _debug("Unexpected error attempting to determine the actual case of the file '" + filePath_1 + "': " + err);
	                    }
	                    return filePath_1;
	                }
	                else {
	                    if (isUnixExecutable(stats)) {
	                        return filePath_1;
	                    }
	                }
	            }
	        }
	        catch (err) {
	            if (err.code != 'ENOENT') {
	                _debug("Unexpected error attempting to determine if executable file exists '" + filePath_1 + "': " + err);
	            }
	        }
	    }
	    return '';
	}
	// on Mac/Linux, test the execute bit
	//     R   W  X  R  W X R W X
	//   256 128 64 32 16 8 4 2 1
	function isUnixExecutable(stats) {
	    return (stats.mode & 1) > 0 || ((stats.mode & 8) > 0 && stats.gid === process.getgid()) || ((stats.mode & 64) > 0 && stats.uid === process.getuid());
	}
	function _legacyFindFiles_convertPatternToRegExp(pattern) {
	    pattern = (process.platform == 'win32' ? pattern.replace(/\\/g, '/') : pattern) // normalize separator on Windows
	        .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // regex escape - from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
	        .replace(/\\\/\\\*\\\*\\\//g, '((\/.+/)|(\/))') // replace directory globstar, e.g. /hello/**/world
	        .replace(/\\\*\\\*/g, '.*') // replace remaining globstars with a wildcard that can span directory separators, e.g. /hello/**dll
	        .replace(/\\\*/g, '[^\/]*') // replace asterisks with a wildcard that cannot span directory separators, e.g. /hello/*.dll
	        .replace(/\\\?/g, '[^\/]'); // replace single character wildcards, e.g. /hello/log?.dll
	    pattern = "^" + pattern + "$";
	    var flags = process.platform == 'win32' ? 'i' : '';
	    return new RegExp(pattern, flags);
	}
	exports._legacyFindFiles_convertPatternToRegExp = _legacyFindFiles_convertPatternToRegExp;
	function _cloneMatchOptions(matchOptions) {
	    return {
	        debug: matchOptions.debug,
	        nobrace: matchOptions.nobrace,
	        noglobstar: matchOptions.noglobstar,
	        dot: matchOptions.dot,
	        noext: matchOptions.noext,
	        nocase: matchOptions.nocase,
	        nonull: matchOptions.nonull,
	        matchBase: matchOptions.matchBase,
	        nocomment: matchOptions.nocomment,
	        nonegate: matchOptions.nonegate,
	        flipNegate: matchOptions.flipNegate
	    };
	}
	exports._cloneMatchOptions = _cloneMatchOptions;
	function _getFindInfoFromPattern(defaultRoot, pattern, matchOptions) {
	    // parameter validation
	    if (!defaultRoot) {
	        throw new Error('getFindRootFromPattern() parameter defaultRoot cannot be empty');
	    }
	    if (!pattern) {
	        throw new Error('getFindRootFromPattern() parameter pattern cannot be empty');
	    }
	    if (!matchOptions.nobrace) {
	        throw new Error('getFindRootFromPattern() expected matchOptions.nobrace to be true');
	    }
	    // for the sake of determining the findPath, pretend nocase=false
	    matchOptions = _cloneMatchOptions(matchOptions);
	    matchOptions.nocase = false;
	    // check if basename only and matchBase=true
	    if (matchOptions.matchBase &&
	        !_isRooted(pattern) &&
	        (process.platform == 'win32' ? pattern.replace(/\\/g, '/') : pattern).indexOf('/') < 0) {
	        return {
	            adjustedPattern: pattern,
	            findPath: defaultRoot,
	            statOnly: false,
	        };
	    }
	    // the technique applied by this function is to use the information on the Minimatch object determine
	    // the findPath. Minimatch breaks the pattern into path segments, and exposes information about which
	    // segments are literal vs patterns.
	    //
	    // note, the technique currently imposes a limitation for drive-relative paths with a glob in the
	    // first segment, e.g. C:hello*/world. it's feasible to overcome this limitation, but is left unsolved
	    // for now.
	    var minimatchObj = new minimatch.Minimatch(pattern, matchOptions);
	    // the "set" property is an array of arrays of parsed path segment info. the outer array should only
	    // contain one item, otherwise something went wrong. brace expansion can result in multiple arrays,
	    // but that should be turned off by the time this function is reached.
	    if (minimatchObj.set.length != 1) {
	        throw new Error('getFindRootFromPattern() expected Minimatch(...).set.length to be 1. Actual: ' + minimatchObj.set.length);
	    }
	    var literalSegments = [];
	    for (var _i = 0, _a = minimatchObj.set[0]; _i < _a.length; _i++) {
	        var parsedSegment = _a[_i];
	        if (typeof parsedSegment == 'string') {
	            // the item is a string when the original input for the path segment does not contain any
	            // unescaped glob characters.
	            //
	            // note, the string here is already unescaped (i.e. glob escaping removed), so it is ready
	            // to pass to find() as-is. for example, an input string 'hello\\*world' => 'hello*world'.
	            literalSegments.push(parsedSegment);
	            continue;
	        }
	        break;
	    }
	    // join the literal segments back together. Minimatch converts '\' to '/' on Windows, then squashes
	    // consequetive slashes, and finally splits on slash. this means that UNC format is lost, but can
	    // be detected from the original pattern.
	    var joinedSegments = literalSegments.join('/');
	    if (joinedSegments && process.platform == 'win32' && _startsWith(pattern.replace(/\\/g, '/'), '//')) {
	        joinedSegments = '/' + joinedSegments; // restore UNC format
	    }
	    // determine the find path
	    var findPath;
	    if (_isRooted(pattern)) { // the pattern was rooted
	        findPath = joinedSegments;
	    }
	    else if (joinedSegments) { // the pattern was not rooted, and literal segments were found
	        findPath = _ensureRooted(defaultRoot, joinedSegments);
	    }
	    else { // the pattern was not rooted, and no literal segments were found
	        findPath = defaultRoot;
	    }
	    // clean up the path
	    if (findPath) {
	        findPath = _getDirectoryName(_ensureRooted(findPath, '_')); // hack to remove unnecessary trailing slash
	        findPath = _normalizeSeparators(findPath); // normalize slashes
	    }
	    return {
	        adjustedPattern: _ensurePatternRooted(defaultRoot, pattern),
	        findPath: findPath,
	        statOnly: literalSegments.length == minimatchObj.set[0].length,
	    };
	}
	exports._getFindInfoFromPattern = _getFindInfoFromPattern;
	function _ensurePatternRooted(root, p) {
	    if (!root) {
	        throw new Error('ensurePatternRooted() parameter "root" cannot be empty');
	    }
	    if (!p) {
	        throw new Error('ensurePatternRooted() parameter "p" cannot be empty');
	    }
	    if (_isRooted(p)) {
	        return p;
	    }
	    // normalize root
	    root = _normalizeSeparators(root);
	    // escape special glob characters
	    root = (process.platform == 'win32' ? root : root.replace(/\\/g, '\\\\')) // escape '\' on OSX/Linux
	        .replace(/(\[)(?=[^\/]+\])/g, '[[]') // escape '[' when ']' follows within the path segment
	        .replace(/\?/g, '[?]') // escape '?'
	        .replace(/\*/g, '[*]') // escape '*'
	        .replace(/\+\(/g, '[+](') // escape '+('
	        .replace(/@\(/g, '[@](') // escape '@('
	        .replace(/!\(/g, '[!]('); // escape '!('
	    return _ensureRooted(root, p);
	}
	exports._ensurePatternRooted = _ensurePatternRooted;
	//-------------------------------------------------------------------
	// Populate the vault with sensitive data.  Inputs and Endpoints
	//-------------------------------------------------------------------
	function _loadData() {
	    // in agent, prefer TempDirectory then workFolder.
	    // In interactive dev mode, it won't be
	    var keyPath = _getVariable("agent.TempDirectory") || _getVariable("agent.workFolder") || process.cwd();
	    exports._vault = new vm.Vault(keyPath);
	    exports._knownVariableMap = {};
	    _debug('loading inputs and endpoints');
	    var loaded = 0;
	    for (var envvar in process.env) {
	        if (_startsWith(envvar, 'INPUT_') ||
	            _startsWith(envvar, 'ENDPOINT_AUTH_') ||
	            _startsWith(envvar, 'SECUREFILE_TICKET_') ||
	            _startsWith(envvar, 'SECRET_') ||
	            _startsWith(envvar, 'VSTS_TASKVARIABLE_')) {
	            // Record the secret variable metadata. This is required by getVariable to know whether
	            // to retrieve the value from the vault. In a 2.104.1 agent or higher, this metadata will
	            // be overwritten when the VSTS_SECRET_VARIABLES env var is processed below.
	            if (_startsWith(envvar, 'SECRET_')) {
	                var variableName = envvar.substring('SECRET_'.length);
	                if (variableName) {
	                    // This is technically not the variable name (has underscores instead of dots),
	                    // but it's good enough to make getVariable work in a pre-2.104.1 agent where
	                    // the VSTS_SECRET_VARIABLES env var is not defined.
	                    exports._knownVariableMap[_getVariableKey(variableName)] = { name: variableName, secret: true };
	                }
	            }
	            // store the secret
	            var value = process.env[envvar];
	            if (value) {
	                ++loaded;
	                _debug('loading ' + envvar);
	                exports._vault.storeSecret(envvar, value);
	                delete process.env[envvar];
	            }
	        }
	    }
	    _debug('loaded ' + loaded);
	    // store public variable metadata
	    var names;
	    try {
	        names = JSON.parse(process.env['VSTS_PUBLIC_VARIABLES'] || '[]');
	    }
	    catch (err) {
	        throw new Error('Failed to parse VSTS_PUBLIC_VARIABLES as JSON. ' + err); // may occur during interactive testing
	    }
	    names.forEach(function (name) {
	        exports._knownVariableMap[_getVariableKey(name)] = { name: name, secret: false };
	    });
	    delete process.env['VSTS_PUBLIC_VARIABLES'];
	    // store secret variable metadata
	    try {
	        names = JSON.parse(process.env['VSTS_SECRET_VARIABLES'] || '[]');
	    }
	    catch (err) {
	        throw new Error('Failed to parse VSTS_SECRET_VARIABLES as JSON. ' + err); // may occur during interactive testing
	    }
	    names.forEach(function (name) {
	        exports._knownVariableMap[_getVariableKey(name)] = { name: name, secret: true };
	    });
	    delete process.env['VSTS_SECRET_VARIABLES'];
	    // avoid loading twice (overwrites .taskkey)
	    commonjsGlobal['_vsts_task_lib_loaded'] = true;
	}
	exports._loadData = _loadData;
	//--------------------------------------------------------------------------------
	// Internal path helpers.
	//--------------------------------------------------------------------------------
	/**
	 * Defines if path is unc-path.
	 *
	 * @param path  a path to a file.
	 * @returns     true if path starts with double backslash, otherwise returns false.
	 */
	function _isUncPath(path) {
	    return /^\\\\[^\\]/.test(path);
	}
	exports._isUncPath = _isUncPath;
	function _ensureRooted(root, p) {
	    if (!root) {
	        throw new Error('ensureRooted() parameter "root" cannot be empty');
	    }
	    if (!p) {
	        throw new Error('ensureRooted() parameter "p" cannot be empty');
	    }
	    if (_isRooted(p)) {
	        return p;
	    }
	    if (process.platform == 'win32' && root.match(/^[A-Z]:$/i)) { // e.g. C:
	        return root + p;
	    }
	    // ensure root ends with a separator
	    if (_endsWith(root, '/') || (process.platform == 'win32' && _endsWith(root, '\\'))) ;
	    else {
	        root += path.sep; // append separator
	    }
	    return root + p;
	}
	exports._ensureRooted = _ensureRooted;
	/**
	 * Determines the parent path and trims trailing slashes (when safe). Path separators are normalized
	 * in the result. This function works similar to the .NET System.IO.Path.GetDirectoryName() method.
	 * For example, C:\hello\world\ returns C:\hello\world (trailing slash removed). Returns empty when
	 * no higher directory can be determined.
	 */
	function _getDirectoryName(p) {
	    // short-circuit if empty
	    if (!p) {
	        return '';
	    }
	    // normalize separators
	    p = _normalizeSeparators(p);
	    // on Windows, the goal of this function is to match the behavior of
	    // [System.IO.Path]::GetDirectoryName(), e.g.
	    //      C:/             =>
	    //      C:/hello        => C:\
	    //      C:/hello/       => C:\hello
	    //      C:/hello/world  => C:\hello
	    //      C:/hello/world/ => C:\hello\world
	    //      C:              =>
	    //      C:hello         => C:
	    //      C:hello/        => C:hello
	    //      /               =>
	    //      /hello          => \
	    //      /hello/         => \hello
	    //      //hello         =>
	    //      //hello/        =>
	    //      //hello/world   =>
	    //      //hello/world/  => \\hello\world
	    //
	    // unfortunately, path.dirname() can't simply be used. for example, on Windows
	    // it yields different results from Path.GetDirectoryName:
	    //      C:/             => C:/
	    //      C:/hello        => C:/
	    //      C:/hello/       => C:/
	    //      C:/hello/world  => C:/hello
	    //      C:/hello/world/ => C:/hello
	    //      C:              => C:
	    //      C:hello         => C:
	    //      C:hello/        => C:
	    //      /               => /
	    //      /hello          => /
	    //      /hello/         => /
	    //      //hello         => /
	    //      //hello/        => /
	    //      //hello/world   => //hello/world
	    //      //hello/world/  => //hello/world/
	    //      //hello/world/again => //hello/world/
	    //      //hello/world/again/ => //hello/world/
	    //      //hello/world/again/again => //hello/world/again
	    //      //hello/world/again/again/ => //hello/world/again
	    if (process.platform == 'win32') {
	        if (/^[A-Z]:\\?[^\\]+$/i.test(p)) { // e.g. C:\hello or C:hello
	            return p.charAt(2) == '\\' ? p.substring(0, 3) : p.substring(0, 2);
	        }
	        else if (/^[A-Z]:\\?$/i.test(p)) { // e.g. C:\ or C:
	            return '';
	        }
	        var lastSlashIndex = p.lastIndexOf('\\');
	        if (lastSlashIndex < 0) { // file name only
	            return '';
	        }
	        else if (p == '\\') { // relative root
	            return '';
	        }
	        else if (lastSlashIndex == 0) { // e.g. \\hello
	            return '\\';
	        }
	        else if (/^\\\\[^\\]+(\\[^\\]*)?$/.test(p)) { // UNC root, e.g. \\hello or \\hello\ or \\hello\world
	            return '';
	        }
	        return p.substring(0, lastSlashIndex); // e.g. hello\world => hello or hello\world\ => hello\world
	        // note, this means trailing slashes for non-root directories
	        // (i.e. not C:\, \, or \\unc\) will simply be removed.
	    }
	    // OSX/Linux
	    if (p.indexOf('/') < 0) { // file name only
	        return '';
	    }
	    else if (p == '/') {
	        return '';
	    }
	    else if (_endsWith(p, '/')) {
	        return p.substring(0, p.length - 1);
	    }
	    return path.dirname(p);
	}
	exports._getDirectoryName = _getDirectoryName;
	/**
	 * On OSX/Linux, true if path starts with '/'. On Windows, true for paths like:
	 * \, \hello, \\hello\share, C:, and C:\hello (and corresponding alternate separator cases).
	 */
	function _isRooted(p) {
	    p = _normalizeSeparators(p);
	    if (!p) {
	        throw new Error('isRooted() parameter "p" cannot be empty');
	    }
	    if (process.platform == 'win32') {
	        return _startsWith(p, '\\') || // e.g. \ or \hello or \\hello
	            /^[A-Z]:/i.test(p); // e.g. C: or C:\hello
	    }
	    return _startsWith(p, '/'); // e.g. /hello
	}
	exports._isRooted = _isRooted;
	function _normalizeSeparators(p) {
	    p = p || '';
	    if (process.platform == 'win32') {
	        // convert slashes on Windows
	        p = p.replace(/\//g, '\\');
	        // remove redundant slashes
	        var isUnc = /^\\\\+[^\\]/.test(p); // e.g. \\hello
	        return (isUnc ? '\\' : '') + p.replace(/\\\\+/g, '\\'); // preserve leading // for UNC
	    }
	    // remove redundant slashes
	    return p.replace(/\/\/+/g, '/');
	}
	exports._normalizeSeparators = _normalizeSeparators;
	//-----------------------------------------------------
	// Expose proxy information to vsts-node-api
	//-----------------------------------------------------
	function _exposeProxySettings() {
	    var proxyUrl = _getVariable('Agent.ProxyUrl');
	    if (proxyUrl && proxyUrl.length > 0) {
	        var proxyUsername = _getVariable('Agent.ProxyUsername');
	        var proxyPassword = _getVariable('Agent.ProxyPassword');
	        var proxyBypassHostsJson = _getVariable('Agent.ProxyBypassList');
	        commonjsGlobal['_vsts_task_lib_proxy_url'] = proxyUrl;
	        commonjsGlobal['_vsts_task_lib_proxy_username'] = proxyUsername;
	        commonjsGlobal['_vsts_task_lib_proxy_bypass'] = proxyBypassHostsJson;
	        commonjsGlobal['_vsts_task_lib_proxy_password'] = _exposeTaskLibSecret('proxy', proxyPassword || '');
	        _debug('expose agent proxy configuration.');
	        commonjsGlobal['_vsts_task_lib_proxy'] = true;
	    }
	}
	exports._exposeProxySettings = _exposeProxySettings;
	//-----------------------------------------------------
	// Expose certificate information to vsts-node-api
	//-----------------------------------------------------
	function _exposeCertSettings() {
	    var ca = _getVariable('Agent.CAInfo');
	    if (ca) {
	        commonjsGlobal['_vsts_task_lib_cert_ca'] = ca;
	    }
	    var clientCert = _getVariable('Agent.ClientCert');
	    if (clientCert) {
	        var clientCertKey = _getVariable('Agent.ClientCertKey');
	        var clientCertArchive = _getVariable('Agent.ClientCertArchive');
	        var clientCertPassword = _getVariable('Agent.ClientCertPassword');
	        commonjsGlobal['_vsts_task_lib_cert_clientcert'] = clientCert;
	        commonjsGlobal['_vsts_task_lib_cert_key'] = clientCertKey;
	        commonjsGlobal['_vsts_task_lib_cert_archive'] = clientCertArchive;
	        commonjsGlobal['_vsts_task_lib_cert_passphrase'] = _exposeTaskLibSecret('cert', clientCertPassword || '');
	    }
	    if (ca || clientCert) {
	        _debug('expose agent certificate configuration.');
	        commonjsGlobal['_vsts_task_lib_cert'] = true;
	    }
	    var skipCertValidation = _getVariable('Agent.SkipCertValidation') || 'false';
	    if (skipCertValidation) {
	        commonjsGlobal['_vsts_task_lib_skip_cert_validation'] = skipCertValidation.toUpperCase() === 'TRUE';
	    }
	}
	exports._exposeCertSettings = _exposeCertSettings;
	// We store the encryption key on disk and hold the encrypted content and key file in memory
	// return base64encoded<keyFilePath>:base64encoded<encryptedContent>
	// downstream vsts-node-api will retrieve the secret later
	function _exposeTaskLibSecret(keyFile, secret) {
	    if (secret) {
	        var encryptKey = crypto.randomBytes(256);
	        var cipher = crypto.createCipher("aes-256-ctr", encryptKey);
	        var encryptedContent = cipher.update(secret, "utf8", "hex");
	        encryptedContent += cipher.final("hex");
	        var storageFile = path.join(_getVariable('Agent.TempDirectory') || _getVariable("agent.workFolder") || process.cwd(), keyFile);
	        fs.writeFileSync(storageFile, encryptKey.toString('base64'), { encoding: 'utf8' });
	        return new Buffer(storageFile).toString('base64') + ':' + new Buffer(encryptedContent).toString('base64');
	    }
	} 
} (internal));

var toolrunner = {};

var q = {exports: {}};

(function (module, exports) {
	// vim:ts=4:sts=4:sw=4:
	/*!
	 *
	 * Copyright 2009-2017 Kris Kowal under the terms of the MIT
	 * license found at https://github.com/kriskowal/q/blob/v1/LICENSE
	 *
	 * With parts by Tyler Close
	 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
	 * at http://www.opensource.org/licenses/mit-license.html
	 * Forked at ref_send.js version: 2009-05-11
	 *
	 * With parts by Mark Miller
	 * Copyright (C) 2011 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 * http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 *
	 */

	(function (definition) {

	    // This file will function properly as a <script> tag, or a module
	    // using CommonJS and NodeJS or RequireJS module formats.  In
	    // Common/Node/RequireJS, the module exports the Q API and when
	    // executed as a simple <script>, it creates a Q global instead.

	    // Montage Require
	    if (typeof bootstrap === "function") {
	        bootstrap("promise", definition);

	    // CommonJS
	    } else {
	        module.exports = definition();

	    // RequireJS
	    }

	})(function () {

	var hasStacks = false;
	try {
	    throw new Error();
	} catch (e) {
	    hasStacks = !!e.stack;
	}

	// All code after this point will be filtered from stack traces reported
	// by Q.
	var qStartingLine = captureLine();
	var qFileName;

	// shims

	// used for fallback in "allResolved"
	var noop = function () {};

	// Use the fastest possible means to execute a task in a future turn
	// of the event loop.
	var nextTick =(function () {
	    // linked list of tasks (single, with head node)
	    var head = {task: void 0, next: null};
	    var tail = head;
	    var flushing = false;
	    var requestTick = void 0;
	    var isNodeJS = false;
	    // queue for late tasks, used by unhandled rejection tracking
	    var laterQueue = [];

	    function flush() {
	        /* jshint loopfunc: true */
	        var task, domain;

	        while (head.next) {
	            head = head.next;
	            task = head.task;
	            head.task = void 0;
	            domain = head.domain;

	            if (domain) {
	                head.domain = void 0;
	                domain.enter();
	            }
	            runSingle(task, domain);

	        }
	        while (laterQueue.length) {
	            task = laterQueue.pop();
	            runSingle(task);
	        }
	        flushing = false;
	    }
	    // runs a single function in the async queue
	    function runSingle(task, domain) {
	        try {
	            task();

	        } catch (e) {
	            if (isNodeJS) {
	                // In node, uncaught exceptions are considered fatal errors.
	                // Re-throw them synchronously to interrupt flushing!

	                // Ensure continuation if the uncaught exception is suppressed
	                // listening "uncaughtException" events (as domains does).
	                // Continue in next event to avoid tick recursion.
	                if (domain) {
	                    domain.exit();
	                }
	                setTimeout(flush, 0);
	                if (domain) {
	                    domain.enter();
	                }

	                throw e;

	            } else {
	                // In browsers, uncaught exceptions are not fatal.
	                // Re-throw them asynchronously to avoid slow-downs.
	                setTimeout(function () {
	                    throw e;
	                }, 0);
	            }
	        }

	        if (domain) {
	            domain.exit();
	        }
	    }

	    nextTick = function (task) {
	        tail = tail.next = {
	            task: task,
	            domain: isNodeJS && process.domain,
	            next: null
	        };

	        if (!flushing) {
	            flushing = true;
	            requestTick();
	        }
	    };

	    if (typeof process === "object" &&
	        process.toString() === "[object process]" && process.nextTick) {
	        // Ensure Q is in a real Node environment, with a `process.nextTick`.
	        // To see through fake Node environments:
	        // * Mocha test runner - exposes a `process` global without a `nextTick`
	        // * Browserify - exposes a `process.nexTick` function that uses
	        //   `setTimeout`. In this case `setImmediate` is preferred because
	        //    it is faster. Browserify's `process.toString()` yields
	        //   "[object Object]", while in a real Node environment
	        //   `process.toString()` yields "[object process]".
	        isNodeJS = true;

	        requestTick = function () {
	            process.nextTick(flush);
	        };

	    } else if (typeof setImmediate === "function") {
	        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
	        if (typeof window !== "undefined") {
	            requestTick = setImmediate.bind(window, flush);
	        } else {
	            requestTick = function () {
	                setImmediate(flush);
	            };
	        }

	    } else if (typeof MessageChannel !== "undefined") {
	        // modern browsers
	        // http://www.nonblocking.io/2011/06/windownexttick.html
	        var channel = new MessageChannel();
	        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
	        // working message ports the first time a page loads.
	        channel.port1.onmessage = function () {
	            requestTick = requestPortTick;
	            channel.port1.onmessage = flush;
	            flush();
	        };
	        var requestPortTick = function () {
	            // Opera requires us to provide a message payload, regardless of
	            // whether we use it.
	            channel.port2.postMessage(0);
	        };
	        requestTick = function () {
	            setTimeout(flush, 0);
	            requestPortTick();
	        };

	    } else {
	        // old browsers
	        requestTick = function () {
	            setTimeout(flush, 0);
	        };
	    }
	    // runs a task after all other tasks have been run
	    // this is useful for unhandled rejection tracking that needs to happen
	    // after all `then`d tasks have been run.
	    nextTick.runAfter = function (task) {
	        laterQueue.push(task);
	        if (!flushing) {
	            flushing = true;
	            requestTick();
	        }
	    };
	    return nextTick;
	})();

	// Attempt to make generics safe in the face of downstream
	// modifications.
	// There is no situation where this is necessary.
	// If you need a security guarantee, these primordials need to be
	// deeply frozen anyway, and if you don’t need a security guarantee,
	// this is just plain paranoid.
	// However, this **might** have the nice side-effect of reducing the size of
	// the minified code by reducing x.call() to merely x()
	// See Mark Miller’s explanation of what this does.
	// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
	var call = Function.call;
	function uncurryThis(f) {
	    return function () {
	        return call.apply(f, arguments);
	    };
	}
	// This is equivalent, but slower:
	// uncurryThis = Function_bind.bind(Function_bind.call);
	// http://jsperf.com/uncurrythis

	var array_slice = uncurryThis(Array.prototype.slice);

	var array_reduce = uncurryThis(
	    Array.prototype.reduce || function (callback, basis) {
	        var index = 0,
	            length = this.length;
	        // concerning the initial value, if one is not provided
	        if (arguments.length === 1) {
	            // seek to the first value in the array, accounting
	            // for the possibility that is is a sparse array
	            do {
	                if (index in this) {
	                    basis = this[index++];
	                    break;
	                }
	                if (++index >= length) {
	                    throw new TypeError();
	                }
	            } while (1);
	        }
	        // reduce
	        for (; index < length; index++) {
	            // account for the possibility that the array is sparse
	            if (index in this) {
	                basis = callback(basis, this[index], index);
	            }
	        }
	        return basis;
	    }
	);

	var array_indexOf = uncurryThis(
	    Array.prototype.indexOf || function (value) {
	        // not a very good shim, but good enough for our one use of it
	        for (var i = 0; i < this.length; i++) {
	            if (this[i] === value) {
	                return i;
	            }
	        }
	        return -1;
	    }
	);

	var array_map = uncurryThis(
	    Array.prototype.map || function (callback, thisp) {
	        var self = this;
	        var collect = [];
	        array_reduce(self, function (undefined$1, value, index) {
	            collect.push(callback.call(thisp, value, index, self));
	        }, void 0);
	        return collect;
	    }
	);

	var object_create = Object.create || function (prototype) {
	    function Type() { }
	    Type.prototype = prototype;
	    return new Type();
	};

	var object_defineProperty = Object.defineProperty || function (obj, prop, descriptor) {
	    obj[prop] = descriptor.value;
	    return obj;
	};

	var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

	var object_keys = Object.keys || function (object) {
	    var keys = [];
	    for (var key in object) {
	        if (object_hasOwnProperty(object, key)) {
	            keys.push(key);
	        }
	    }
	    return keys;
	};

	var object_toString = uncurryThis(Object.prototype.toString);

	function isObject(value) {
	    return value === Object(value);
	}

	// generator related shims

	// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
	function isStopIteration(exception) {
	    return (
	        object_toString(exception) === "[object StopIteration]" ||
	        exception instanceof QReturnValue
	    );
	}

	// FIXME: Remove this helper and Q.return once ES6 generators are in
	// SpiderMonkey.
	var QReturnValue;
	if (typeof ReturnValue !== "undefined") {
	    QReturnValue = ReturnValue;
	} else {
	    QReturnValue = function (value) {
	        this.value = value;
	    };
	}

	// long stack traces

	var STACK_JUMP_SEPARATOR = "From previous event:";

	function makeStackTraceLong(error, promise) {
	    // If possible, transform the error stack trace by removing Node and Q
	    // cruft, then concatenating with the stack trace of `promise`. See #57.
	    if (hasStacks &&
	        promise.stack &&
	        typeof error === "object" &&
	        error !== null &&
	        error.stack
	    ) {
	        var stacks = [];
	        for (var p = promise; !!p; p = p.source) {
	            if (p.stack && (!error.__minimumStackCounter__ || error.__minimumStackCounter__ > p.stackCounter)) {
	                object_defineProperty(error, "__minimumStackCounter__", {value: p.stackCounter, configurable: true});
	                stacks.unshift(p.stack);
	            }
	        }
	        stacks.unshift(error.stack);

	        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
	        var stack = filterStackString(concatedStacks);
	        object_defineProperty(error, "stack", {value: stack, configurable: true});
	    }
	}

	function filterStackString(stackString) {
	    var lines = stackString.split("\n");
	    var desiredLines = [];
	    for (var i = 0; i < lines.length; ++i) {
	        var line = lines[i];

	        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
	            desiredLines.push(line);
	        }
	    }
	    return desiredLines.join("\n");
	}

	function isNodeFrame(stackLine) {
	    return stackLine.indexOf("(module.js:") !== -1 ||
	           stackLine.indexOf("(node.js:") !== -1;
	}

	function getFileNameAndLineNumber(stackLine) {
	    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
	    // In IE10 function name can have spaces ("Anonymous function") O_o
	    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
	    if (attempt1) {
	        return [attempt1[1], Number(attempt1[2])];
	    }

	    // Anonymous functions: "at filename:lineNumber:columnNumber"
	    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
	    if (attempt2) {
	        return [attempt2[1], Number(attempt2[2])];
	    }

	    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
	    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
	    if (attempt3) {
	        return [attempt3[1], Number(attempt3[2])];
	    }
	}

	function isInternalFrame(stackLine) {
	    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

	    if (!fileNameAndLineNumber) {
	        return false;
	    }

	    var fileName = fileNameAndLineNumber[0];
	    var lineNumber = fileNameAndLineNumber[1];

	    return fileName === qFileName &&
	        lineNumber >= qStartingLine &&
	        lineNumber <= qEndingLine;
	}

	// discover own file name and line number range for filtering stack
	// traces
	function captureLine() {
	    if (!hasStacks) {
	        return;
	    }

	    try {
	        throw new Error();
	    } catch (e) {
	        var lines = e.stack.split("\n");
	        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
	        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
	        if (!fileNameAndLineNumber) {
	            return;
	        }

	        qFileName = fileNameAndLineNumber[0];
	        return fileNameAndLineNumber[1];
	    }
	}

	function deprecate(callback, name, alternative) {
	    return function () {
	        if (typeof console !== "undefined" &&
	            typeof console.warn === "function") {
	            console.warn(name + " is deprecated, use " + alternative +
	                         " instead.", new Error("").stack);
	        }
	        return callback.apply(callback, arguments);
	    };
	}

	// end of shims
	// beginning of real work

	/**
	 * Constructs a promise for an immediate reference, passes promises through, or
	 * coerces promises from different systems.
	 * @param value immediate reference or promise
	 */
	function Q(value) {
	    // If the object is already a Promise, return it directly.  This enables
	    // the resolve function to both be used to created references from objects,
	    // but to tolerably coerce non-promises to promises.
	    if (value instanceof Promise) {
	        return value;
	    }

	    // assimilate thenables
	    if (isPromiseAlike(value)) {
	        return coerce(value);
	    } else {
	        return fulfill(value);
	    }
	}
	Q.resolve = Q;

	/**
	 * Performs a task in a future turn of the event loop.
	 * @param {Function} task
	 */
	Q.nextTick = nextTick;

	/**
	 * Controls whether or not long stack traces will be on
	 */
	Q.longStackSupport = false;

	/**
	 * The counter is used to determine the stopping point for building
	 * long stack traces. In makeStackTraceLong we walk backwards through
	 * the linked list of promises, only stacks which were created before
	 * the rejection are concatenated.
	 */
	var longStackCounter = 1;

	// enable long stacks if Q_DEBUG is set
	if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
	    Q.longStackSupport = true;
	}

	/**
	 * Constructs a {promise, resolve, reject} object.
	 *
	 * `resolve` is a callback to invoke with a more resolved value for the
	 * promise. To fulfill the promise, invoke `resolve` with any value that is
	 * not a thenable. To reject the promise, invoke `resolve` with a rejected
	 * thenable, or invoke `reject` with the reason directly. To resolve the
	 * promise to another thenable, thus putting it in the same state, invoke
	 * `resolve` with that other thenable.
	 */
	Q.defer = defer;
	function defer() {
	    // if "messages" is an "Array", that indicates that the promise has not yet
	    // been resolved.  If it is "undefined", it has been resolved.  Each
	    // element of the messages array is itself an array of complete arguments to
	    // forward to the resolved promise.  We coerce the resolution value to a
	    // promise using the `resolve` function because it handles both fully
	    // non-thenable values and other thenables gracefully.
	    var messages = [], progressListeners = [], resolvedPromise;

	    var deferred = object_create(defer.prototype);
	    var promise = object_create(Promise.prototype);

	    promise.promiseDispatch = function (resolve, op, operands) {
	        var args = array_slice(arguments);
	        if (messages) {
	            messages.push(args);
	            if (op === "when" && operands[1]) { // progress operand
	                progressListeners.push(operands[1]);
	            }
	        } else {
	            Q.nextTick(function () {
	                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
	            });
	        }
	    };

	    // XXX deprecated
	    promise.valueOf = function () {
	        if (messages) {
	            return promise;
	        }
	        var nearerValue = nearer(resolvedPromise);
	        if (isPromise(nearerValue)) {
	            resolvedPromise = nearerValue; // shorten chain
	        }
	        return nearerValue;
	    };

	    promise.inspect = function () {
	        if (!resolvedPromise) {
	            return { state: "pending" };
	        }
	        return resolvedPromise.inspect();
	    };

	    if (Q.longStackSupport && hasStacks) {
	        try {
	            throw new Error();
	        } catch (e) {
	            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
	            // accessor around; that causes memory leaks as per GH-111. Just
	            // reify the stack trace as a string ASAP.
	            //
	            // At the same time, cut off the first line; it's always just
	            // "[object Promise]\n", as per the `toString`.
	            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
	            promise.stackCounter = longStackCounter++;
	        }
	    }

	    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
	    // consolidating them into `become`, since otherwise we'd create new
	    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

	    function become(newPromise) {
	        resolvedPromise = newPromise;

	        if (Q.longStackSupport && hasStacks) {
	            // Only hold a reference to the new promise if long stacks
	            // are enabled to reduce memory usage
	            promise.source = newPromise;
	        }

	        array_reduce(messages, function (undefined$1, message) {
	            Q.nextTick(function () {
	                newPromise.promiseDispatch.apply(newPromise, message);
	            });
	        }, void 0);

	        messages = void 0;
	        progressListeners = void 0;
	    }

	    deferred.promise = promise;
	    deferred.resolve = function (value) {
	        if (resolvedPromise) {
	            return;
	        }

	        become(Q(value));
	    };

	    deferred.fulfill = function (value) {
	        if (resolvedPromise) {
	            return;
	        }

	        become(fulfill(value));
	    };
	    deferred.reject = function (reason) {
	        if (resolvedPromise) {
	            return;
	        }

	        become(reject(reason));
	    };
	    deferred.notify = function (progress) {
	        if (resolvedPromise) {
	            return;
	        }

	        array_reduce(progressListeners, function (undefined$1, progressListener) {
	            Q.nextTick(function () {
	                progressListener(progress);
	            });
	        }, void 0);
	    };

	    return deferred;
	}

	/**
	 * Creates a Node-style callback that will resolve or reject the deferred
	 * promise.
	 * @returns a nodeback
	 */
	defer.prototype.makeNodeResolver = function () {
	    var self = this;
	    return function (error, value) {
	        if (error) {
	            self.reject(error);
	        } else if (arguments.length > 2) {
	            self.resolve(array_slice(arguments, 1));
	        } else {
	            self.resolve(value);
	        }
	    };
	};

	/**
	 * @param resolver {Function} a function that returns nothing and accepts
	 * the resolve, reject, and notify functions for a deferred.
	 * @returns a promise that may be resolved with the given resolve and reject
	 * functions, or rejected by a thrown exception in resolver
	 */
	Q.Promise = promise; // ES6
	Q.promise = promise;
	function promise(resolver) {
	    if (typeof resolver !== "function") {
	        throw new TypeError("resolver must be a function.");
	    }
	    var deferred = defer();
	    try {
	        resolver(deferred.resolve, deferred.reject, deferred.notify);
	    } catch (reason) {
	        deferred.reject(reason);
	    }
	    return deferred.promise;
	}

	promise.race = race; // ES6
	promise.all = all; // ES6
	promise.reject = reject; // ES6
	promise.resolve = Q; // ES6

	// XXX experimental.  This method is a way to denote that a local value is
	// serializable and should be immediately dispatched to a remote upon request,
	// instead of passing a reference.
	Q.passByCopy = function (object) {
	    //freeze(object);
	    //passByCopies.set(object, true);
	    return object;
	};

	Promise.prototype.passByCopy = function () {
	    //freeze(object);
	    //passByCopies.set(object, true);
	    return this;
	};

	/**
	 * If two promises eventually fulfill to the same value, promises that value,
	 * but otherwise rejects.
	 * @param x {Any*}
	 * @param y {Any*}
	 * @returns {Any*} a promise for x and y if they are the same, but a rejection
	 * otherwise.
	 *
	 */
	Q.join = function (x, y) {
	    return Q(x).join(y);
	};

	Promise.prototype.join = function (that) {
	    return Q([this, that]).spread(function (x, y) {
	        if (x === y) {
	            // TODO: "===" should be Object.is or equiv
	            return x;
	        } else {
	            throw new Error("Q can't join: not the same: " + x + " " + y);
	        }
	    });
	};

	/**
	 * Returns a promise for the first of an array of promises to become settled.
	 * @param answers {Array[Any*]} promises to race
	 * @returns {Any*} the first promise to be settled
	 */
	Q.race = race;
	function race(answerPs) {
	    return promise(function (resolve, reject) {
	        // Switch to this once we can assume at least ES5
	        // answerPs.forEach(function (answerP) {
	        //     Q(answerP).then(resolve, reject);
	        // });
	        // Use this in the meantime
	        for (var i = 0, len = answerPs.length; i < len; i++) {
	            Q(answerPs[i]).then(resolve, reject);
	        }
	    });
	}

	Promise.prototype.race = function () {
	    return this.then(Q.race);
	};

	/**
	 * Constructs a Promise with a promise descriptor object and optional fallback
	 * function.  The descriptor contains methods like when(rejected), get(name),
	 * set(name, value), post(name, args), and delete(name), which all
	 * return either a value, a promise for a value, or a rejection.  The fallback
	 * accepts the operation name, a resolver, and any further arguments that would
	 * have been forwarded to the appropriate method above had a method been
	 * provided with the proper name.  The API makes no guarantees about the nature
	 * of the returned object, apart from that it is usable whereever promises are
	 * bought and sold.
	 */
	Q.makePromise = Promise;
	function Promise(descriptor, fallback, inspect) {
	    if (fallback === void 0) {
	        fallback = function (op) {
	            return reject(new Error(
	                "Promise does not support operation: " + op
	            ));
	        };
	    }
	    if (inspect === void 0) {
	        inspect = function () {
	            return {state: "unknown"};
	        };
	    }

	    var promise = object_create(Promise.prototype);

	    promise.promiseDispatch = function (resolve, op, args) {
	        var result;
	        try {
	            if (descriptor[op]) {
	                result = descriptor[op].apply(promise, args);
	            } else {
	                result = fallback.call(promise, op, args);
	            }
	        } catch (exception) {
	            result = reject(exception);
	        }
	        if (resolve) {
	            resolve(result);
	        }
	    };

	    promise.inspect = inspect;

	    // XXX deprecated `valueOf` and `exception` support
	    if (inspect) {
	        var inspected = inspect();
	        if (inspected.state === "rejected") {
	            promise.exception = inspected.reason;
	        }

	        promise.valueOf = function () {
	            var inspected = inspect();
	            if (inspected.state === "pending" ||
	                inspected.state === "rejected") {
	                return promise;
	            }
	            return inspected.value;
	        };
	    }

	    return promise;
	}

	Promise.prototype.toString = function () {
	    return "[object Promise]";
	};

	Promise.prototype.then = function (fulfilled, rejected, progressed) {
	    var self = this;
	    var deferred = defer();
	    var done = false;   // ensure the untrusted promise makes at most a
	                        // single call to one of the callbacks

	    function _fulfilled(value) {
	        try {
	            return typeof fulfilled === "function" ? fulfilled(value) : value;
	        } catch (exception) {
	            return reject(exception);
	        }
	    }

	    function _rejected(exception) {
	        if (typeof rejected === "function") {
	            makeStackTraceLong(exception, self);
	            try {
	                return rejected(exception);
	            } catch (newException) {
	                return reject(newException);
	            }
	        }
	        return reject(exception);
	    }

	    function _progressed(value) {
	        return typeof progressed === "function" ? progressed(value) : value;
	    }

	    Q.nextTick(function () {
	        self.promiseDispatch(function (value) {
	            if (done) {
	                return;
	            }
	            done = true;

	            deferred.resolve(_fulfilled(value));
	        }, "when", [function (exception) {
	            if (done) {
	                return;
	            }
	            done = true;

	            deferred.resolve(_rejected(exception));
	        }]);
	    });

	    // Progress propagator need to be attached in the current tick.
	    self.promiseDispatch(void 0, "when", [void 0, function (value) {
	        var newValue;
	        var threw = false;
	        try {
	            newValue = _progressed(value);
	        } catch (e) {
	            threw = true;
	            if (Q.onerror) {
	                Q.onerror(e);
	            } else {
	                throw e;
	            }
	        }

	        if (!threw) {
	            deferred.notify(newValue);
	        }
	    }]);

	    return deferred.promise;
	};

	Q.tap = function (promise, callback) {
	    return Q(promise).tap(callback);
	};

	/**
	 * Works almost like "finally", but not called for rejections.
	 * Original resolution value is passed through callback unaffected.
	 * Callback may return a promise that will be awaited for.
	 * @param {Function} callback
	 * @returns {Q.Promise}
	 * @example
	 * doSomething()
	 *   .then(...)
	 *   .tap(console.log)
	 *   .then(...);
	 */
	Promise.prototype.tap = function (callback) {
	    callback = Q(callback);

	    return this.then(function (value) {
	        return callback.fcall(value).thenResolve(value);
	    });
	};

	/**
	 * Registers an observer on a promise.
	 *
	 * Guarantees:
	 *
	 * 1. that fulfilled and rejected will be called only once.
	 * 2. that either the fulfilled callback or the rejected callback will be
	 *    called, but not both.
	 * 3. that fulfilled and rejected will not be called in this turn.
	 *
	 * @param value      promise or immediate reference to observe
	 * @param fulfilled  function to be called with the fulfilled value
	 * @param rejected   function to be called with the rejection exception
	 * @param progressed function to be called on any progress notifications
	 * @return promise for the return value from the invoked callback
	 */
	Q.when = when;
	function when(value, fulfilled, rejected, progressed) {
	    return Q(value).then(fulfilled, rejected, progressed);
	}

	Promise.prototype.thenResolve = function (value) {
	    return this.then(function () { return value; });
	};

	Q.thenResolve = function (promise, value) {
	    return Q(promise).thenResolve(value);
	};

	Promise.prototype.thenReject = function (reason) {
	    return this.then(function () { throw reason; });
	};

	Q.thenReject = function (promise, reason) {
	    return Q(promise).thenReject(reason);
	};

	/**
	 * If an object is not a promise, it is as "near" as possible.
	 * If a promise is rejected, it is as "near" as possible too.
	 * If it’s a fulfilled promise, the fulfillment value is nearer.
	 * If it’s a deferred promise and the deferred has been resolved, the
	 * resolution is "nearer".
	 * @param object
	 * @returns most resolved (nearest) form of the object
	 */

	// XXX should we re-do this?
	Q.nearer = nearer;
	function nearer(value) {
	    if (isPromise(value)) {
	        var inspected = value.inspect();
	        if (inspected.state === "fulfilled") {
	            return inspected.value;
	        }
	    }
	    return value;
	}

	/**
	 * @returns whether the given object is a promise.
	 * Otherwise it is a fulfilled value.
	 */
	Q.isPromise = isPromise;
	function isPromise(object) {
	    return object instanceof Promise;
	}

	Q.isPromiseAlike = isPromiseAlike;
	function isPromiseAlike(object) {
	    return isObject(object) && typeof object.then === "function";
	}

	/**
	 * @returns whether the given object is a pending promise, meaning not
	 * fulfilled or rejected.
	 */
	Q.isPending = isPending;
	function isPending(object) {
	    return isPromise(object) && object.inspect().state === "pending";
	}

	Promise.prototype.isPending = function () {
	    return this.inspect().state === "pending";
	};

	/**
	 * @returns whether the given object is a value or fulfilled
	 * promise.
	 */
	Q.isFulfilled = isFulfilled;
	function isFulfilled(object) {
	    return !isPromise(object) || object.inspect().state === "fulfilled";
	}

	Promise.prototype.isFulfilled = function () {
	    return this.inspect().state === "fulfilled";
	};

	/**
	 * @returns whether the given object is a rejected promise.
	 */
	Q.isRejected = isRejected;
	function isRejected(object) {
	    return isPromise(object) && object.inspect().state === "rejected";
	}

	Promise.prototype.isRejected = function () {
	    return this.inspect().state === "rejected";
	};

	//// BEGIN UNHANDLED REJECTION TRACKING

	// This promise library consumes exceptions thrown in handlers so they can be
	// handled by a subsequent promise.  The exceptions get added to this array when
	// they are created, and removed when they are handled.  Note that in ES6 or
	// shimmed environments, this would naturally be a `Set`.
	var unhandledReasons = [];
	var unhandledRejections = [];
	var reportedUnhandledRejections = [];
	var trackUnhandledRejections = true;

	function resetUnhandledRejections() {
	    unhandledReasons.length = 0;
	    unhandledRejections.length = 0;

	    if (!trackUnhandledRejections) {
	        trackUnhandledRejections = true;
	    }
	}

	function trackRejection(promise, reason) {
	    if (!trackUnhandledRejections) {
	        return;
	    }
	    if (typeof process === "object" && typeof process.emit === "function") {
	        Q.nextTick.runAfter(function () {
	            if (array_indexOf(unhandledRejections, promise) !== -1) {
	                process.emit("unhandledRejection", reason, promise);
	                reportedUnhandledRejections.push(promise);
	            }
	        });
	    }

	    unhandledRejections.push(promise);
	    if (reason && typeof reason.stack !== "undefined") {
	        unhandledReasons.push(reason.stack);
	    } else {
	        unhandledReasons.push("(no stack) " + reason);
	    }
	}

	function untrackRejection(promise) {
	    if (!trackUnhandledRejections) {
	        return;
	    }

	    var at = array_indexOf(unhandledRejections, promise);
	    if (at !== -1) {
	        if (typeof process === "object" && typeof process.emit === "function") {
	            Q.nextTick.runAfter(function () {
	                var atReport = array_indexOf(reportedUnhandledRejections, promise);
	                if (atReport !== -1) {
	                    process.emit("rejectionHandled", unhandledReasons[at], promise);
	                    reportedUnhandledRejections.splice(atReport, 1);
	                }
	            });
	        }
	        unhandledRejections.splice(at, 1);
	        unhandledReasons.splice(at, 1);
	    }
	}

	Q.resetUnhandledRejections = resetUnhandledRejections;

	Q.getUnhandledReasons = function () {
	    // Make a copy so that consumers can't interfere with our internal state.
	    return unhandledReasons.slice();
	};

	Q.stopUnhandledRejectionTracking = function () {
	    resetUnhandledRejections();
	    trackUnhandledRejections = false;
	};

	resetUnhandledRejections();

	//// END UNHANDLED REJECTION TRACKING

	/**
	 * Constructs a rejected promise.
	 * @param reason value describing the failure
	 */
	Q.reject = reject;
	function reject(reason) {
	    var rejection = Promise({
	        "when": function (rejected) {
	            // note that the error has been handled
	            if (rejected) {
	                untrackRejection(this);
	            }
	            return rejected ? rejected(reason) : this;
	        }
	    }, function fallback() {
	        return this;
	    }, function inspect() {
	        return { state: "rejected", reason: reason };
	    });

	    // Note that the reason has not been handled.
	    trackRejection(rejection, reason);

	    return rejection;
	}

	/**
	 * Constructs a fulfilled promise for an immediate reference.
	 * @param value immediate reference
	 */
	Q.fulfill = fulfill;
	function fulfill(value) {
	    return Promise({
	        "when": function () {
	            return value;
	        },
	        "get": function (name) {
	            return value[name];
	        },
	        "set": function (name, rhs) {
	            value[name] = rhs;
	        },
	        "delete": function (name) {
	            delete value[name];
	        },
	        "post": function (name, args) {
	            // Mark Miller proposes that post with no name should apply a
	            // promised function.
	            if (name === null || name === void 0) {
	                return value.apply(void 0, args);
	            } else {
	                return value[name].apply(value, args);
	            }
	        },
	        "apply": function (thisp, args) {
	            return value.apply(thisp, args);
	        },
	        "keys": function () {
	            return object_keys(value);
	        }
	    }, void 0, function inspect() {
	        return { state: "fulfilled", value: value };
	    });
	}

	/**
	 * Converts thenables to Q promises.
	 * @param promise thenable promise
	 * @returns a Q promise
	 */
	function coerce(promise) {
	    var deferred = defer();
	    Q.nextTick(function () {
	        try {
	            promise.then(deferred.resolve, deferred.reject, deferred.notify);
	        } catch (exception) {
	            deferred.reject(exception);
	        }
	    });
	    return deferred.promise;
	}

	/**
	 * Annotates an object such that it will never be
	 * transferred away from this process over any promise
	 * communication channel.
	 * @param object
	 * @returns promise a wrapping of that object that
	 * additionally responds to the "isDef" message
	 * without a rejection.
	 */
	Q.master = master;
	function master(object) {
	    return Promise({
	        "isDef": function () {}
	    }, function fallback(op, args) {
	        return dispatch(object, op, args);
	    }, function () {
	        return Q(object).inspect();
	    });
	}

	/**
	 * Spreads the values of a promised array of arguments into the
	 * fulfillment callback.
	 * @param fulfilled callback that receives variadic arguments from the
	 * promised array
	 * @param rejected callback that receives the exception if the promise
	 * is rejected.
	 * @returns a promise for the return value or thrown exception of
	 * either callback.
	 */
	Q.spread = spread;
	function spread(value, fulfilled, rejected) {
	    return Q(value).spread(fulfilled, rejected);
	}

	Promise.prototype.spread = function (fulfilled, rejected) {
	    return this.all().then(function (array) {
	        return fulfilled.apply(void 0, array);
	    }, rejected);
	};

	/**
	 * The async function is a decorator for generator functions, turning
	 * them into asynchronous generators.  Although generators are only part
	 * of the newest ECMAScript 6 drafts, this code does not cause syntax
	 * errors in older engines.  This code should continue to work and will
	 * in fact improve over time as the language improves.
	 *
	 * ES6 generators are currently part of V8 version 3.19 with the
	 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
	 * for longer, but under an older Python-inspired form.  This function
	 * works on both kinds of generators.
	 *
	 * Decorates a generator function such that:
	 *  - it may yield promises
	 *  - execution will continue when that promise is fulfilled
	 *  - the value of the yield expression will be the fulfilled value
	 *  - it returns a promise for the return value (when the generator
	 *    stops iterating)
	 *  - the decorated function returns a promise for the return value
	 *    of the generator or the first rejected promise among those
	 *    yielded.
	 *  - if an error is thrown in the generator, it propagates through
	 *    every following yield until it is caught, or until it escapes
	 *    the generator function altogether, and is translated into a
	 *    rejection for the promise returned by the decorated generator.
	 */
	Q.async = async;
	function async(makeGenerator) {
	    return function () {
	        // when verb is "send", arg is a value
	        // when verb is "throw", arg is an exception
	        function continuer(verb, arg) {
	            var result;

	            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
	            // engine that has a deployed base of browsers that support generators.
	            // However, SM's generators use the Python-inspired semantics of
	            // outdated ES6 drafts.  We would like to support ES6, but we'd also
	            // like to make it possible to use generators in deployed browsers, so
	            // we also support Python-style generators.  At some point we can remove
	            // this block.

	            if (typeof StopIteration === "undefined") {
	                // ES6 Generators
	                try {
	                    result = generator[verb](arg);
	                } catch (exception) {
	                    return reject(exception);
	                }
	                if (result.done) {
	                    return Q(result.value);
	                } else {
	                    return when(result.value, callback, errback);
	                }
	            } else {
	                // SpiderMonkey Generators
	                // FIXME: Remove this case when SM does ES6 generators.
	                try {
	                    result = generator[verb](arg);
	                } catch (exception) {
	                    if (isStopIteration(exception)) {
	                        return Q(exception.value);
	                    } else {
	                        return reject(exception);
	                    }
	                }
	                return when(result, callback, errback);
	            }
	        }
	        var generator = makeGenerator.apply(this, arguments);
	        var callback = continuer.bind(continuer, "next");
	        var errback = continuer.bind(continuer, "throw");
	        return callback();
	    };
	}

	/**
	 * The spawn function is a small wrapper around async that immediately
	 * calls the generator and also ends the promise chain, so that any
	 * unhandled errors are thrown instead of forwarded to the error
	 * handler. This is useful because it's extremely common to run
	 * generators at the top-level to work with libraries.
	 */
	Q.spawn = spawn;
	function spawn(makeGenerator) {
	    Q.done(Q.async(makeGenerator)());
	}

	// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
	/**
	 * Throws a ReturnValue exception to stop an asynchronous generator.
	 *
	 * This interface is a stop-gap measure to support generator return
	 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
	 * generators like Chromium 29, just use "return" in your generator
	 * functions.
	 *
	 * @param value the return value for the surrounding generator
	 * @throws ReturnValue exception with the value.
	 * @example
	 * // ES6 style
	 * Q.async(function* () {
	 *      var foo = yield getFooPromise();
	 *      var bar = yield getBarPromise();
	 *      return foo + bar;
	 * })
	 * // Older SpiderMonkey style
	 * Q.async(function () {
	 *      var foo = yield getFooPromise();
	 *      var bar = yield getBarPromise();
	 *      Q.return(foo + bar);
	 * })
	 */
	Q["return"] = _return;
	function _return(value) {
	    throw new QReturnValue(value);
	}

	/**
	 * The promised function decorator ensures that any promise arguments
	 * are settled and passed as values (`this` is also settled and passed
	 * as a value).  It will also ensure that the result of a function is
	 * always a promise.
	 *
	 * @example
	 * var add = Q.promised(function (a, b) {
	 *     return a + b;
	 * });
	 * add(Q(a), Q(B));
	 *
	 * @param {function} callback The function to decorate
	 * @returns {function} a function that has been decorated.
	 */
	Q.promised = promised;
	function promised(callback) {
	    return function () {
	        return spread([this, all(arguments)], function (self, args) {
	            return callback.apply(self, args);
	        });
	    };
	}

	/**
	 * sends a message to a value in a future turn
	 * @param object* the recipient
	 * @param op the name of the message operation, e.g., "when",
	 * @param args further arguments to be forwarded to the operation
	 * @returns result {Promise} a promise for the result of the operation
	 */
	Q.dispatch = dispatch;
	function dispatch(object, op, args) {
	    return Q(object).dispatch(op, args);
	}

	Promise.prototype.dispatch = function (op, args) {
	    var self = this;
	    var deferred = defer();
	    Q.nextTick(function () {
	        self.promiseDispatch(deferred.resolve, op, args);
	    });
	    return deferred.promise;
	};

	/**
	 * Gets the value of a property in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of property to get
	 * @return promise for the property value
	 */
	Q.get = function (object, key) {
	    return Q(object).dispatch("get", [key]);
	};

	Promise.prototype.get = function (key) {
	    return this.dispatch("get", [key]);
	};

	/**
	 * Sets the value of a property in a future turn.
	 * @param object    promise or immediate reference for object object
	 * @param name      name of property to set
	 * @param value     new value of property
	 * @return promise for the return value
	 */
	Q.set = function (object, key, value) {
	    return Q(object).dispatch("set", [key, value]);
	};

	Promise.prototype.set = function (key, value) {
	    return this.dispatch("set", [key, value]);
	};

	/**
	 * Deletes a property in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of property to delete
	 * @return promise for the return value
	 */
	Q.del = // XXX legacy
	Q["delete"] = function (object, key) {
	    return Q(object).dispatch("delete", [key]);
	};

	Promise.prototype.del = // XXX legacy
	Promise.prototype["delete"] = function (key) {
	    return this.dispatch("delete", [key]);
	};

	/**
	 * Invokes a method in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of method to invoke
	 * @param value     a value to post, typically an array of
	 *                  invocation arguments for promises that
	 *                  are ultimately backed with `resolve` values,
	 *                  as opposed to those backed with URLs
	 *                  wherein the posted value can be any
	 *                  JSON serializable object.
	 * @return promise for the return value
	 */
	// bound locally because it is used by other methods
	Q.mapply = // XXX As proposed by "Redsandro"
	Q.post = function (object, name, args) {
	    return Q(object).dispatch("post", [name, args]);
	};

	Promise.prototype.mapply = // XXX As proposed by "Redsandro"
	Promise.prototype.post = function (name, args) {
	    return this.dispatch("post", [name, args]);
	};

	/**
	 * Invokes a method in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of method to invoke
	 * @param ...args   array of invocation arguments
	 * @return promise for the return value
	 */
	Q.send = // XXX Mark Miller's proposed parlance
	Q.mcall = // XXX As proposed by "Redsandro"
	Q.invoke = function (object, name /*...args*/) {
	    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
	};

	Promise.prototype.send = // XXX Mark Miller's proposed parlance
	Promise.prototype.mcall = // XXX As proposed by "Redsandro"
	Promise.prototype.invoke = function (name /*...args*/) {
	    return this.dispatch("post", [name, array_slice(arguments, 1)]);
	};

	/**
	 * Applies the promised function in a future turn.
	 * @param object    promise or immediate reference for target function
	 * @param args      array of application arguments
	 */
	Q.fapply = function (object, args) {
	    return Q(object).dispatch("apply", [void 0, args]);
	};

	Promise.prototype.fapply = function (args) {
	    return this.dispatch("apply", [void 0, args]);
	};

	/**
	 * Calls the promised function in a future turn.
	 * @param object    promise or immediate reference for target function
	 * @param ...args   array of application arguments
	 */
	Q["try"] =
	Q.fcall = function (object /* ...args*/) {
	    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
	};

	Promise.prototype.fcall = function (/*...args*/) {
	    return this.dispatch("apply", [void 0, array_slice(arguments)]);
	};

	/**
	 * Binds the promised function, transforming return values into a fulfilled
	 * promise and thrown errors into a rejected one.
	 * @param object    promise or immediate reference for target function
	 * @param ...args   array of application arguments
	 */
	Q.fbind = function (object /*...args*/) {
	    var promise = Q(object);
	    var args = array_slice(arguments, 1);
	    return function fbound() {
	        return promise.dispatch("apply", [
	            this,
	            args.concat(array_slice(arguments))
	        ]);
	    };
	};
	Promise.prototype.fbind = function (/*...args*/) {
	    var promise = this;
	    var args = array_slice(arguments);
	    return function fbound() {
	        return promise.dispatch("apply", [
	            this,
	            args.concat(array_slice(arguments))
	        ]);
	    };
	};

	/**
	 * Requests the names of the owned properties of a promised
	 * object in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @return promise for the keys of the eventually settled object
	 */
	Q.keys = function (object) {
	    return Q(object).dispatch("keys", []);
	};

	Promise.prototype.keys = function () {
	    return this.dispatch("keys", []);
	};

	/**
	 * Turns an array of promises into a promise for an array.  If any of
	 * the promises gets rejected, the whole array is rejected immediately.
	 * @param {Array*} an array (or promise for an array) of values (or
	 * promises for values)
	 * @returns a promise for an array of the corresponding values
	 */
	// By Mark Miller
	// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
	Q.all = all;
	function all(promises) {
	    return when(promises, function (promises) {
	        var pendingCount = 0;
	        var deferred = defer();
	        array_reduce(promises, function (undefined$1, promise, index) {
	            var snapshot;
	            if (
	                isPromise(promise) &&
	                (snapshot = promise.inspect()).state === "fulfilled"
	            ) {
	                promises[index] = snapshot.value;
	            } else {
	                ++pendingCount;
	                when(
	                    promise,
	                    function (value) {
	                        promises[index] = value;
	                        if (--pendingCount === 0) {
	                            deferred.resolve(promises);
	                        }
	                    },
	                    deferred.reject,
	                    function (progress) {
	                        deferred.notify({ index: index, value: progress });
	                    }
	                );
	            }
	        }, void 0);
	        if (pendingCount === 0) {
	            deferred.resolve(promises);
	        }
	        return deferred.promise;
	    });
	}

	Promise.prototype.all = function () {
	    return all(this);
	};

	/**
	 * Returns the first resolved promise of an array. Prior rejected promises are
	 * ignored.  Rejects only if all promises are rejected.
	 * @param {Array*} an array containing values or promises for values
	 * @returns a promise fulfilled with the value of the first resolved promise,
	 * or a rejected promise if all promises are rejected.
	 */
	Q.any = any;

	function any(promises) {
	    if (promises.length === 0) {
	        return Q.resolve();
	    }

	    var deferred = Q.defer();
	    var pendingCount = 0;
	    array_reduce(promises, function (prev, current, index) {
	        var promise = promises[index];

	        pendingCount++;

	        when(promise, onFulfilled, onRejected, onProgress);
	        function onFulfilled(result) {
	            deferred.resolve(result);
	        }
	        function onRejected(err) {
	            pendingCount--;
	            if (pendingCount === 0) {
	                var rejection = err || new Error("" + err);

	                rejection.message = ("Q can't get fulfillment value from any promise, all " +
	                    "promises were rejected. Last error message: " + rejection.message);

	                deferred.reject(rejection);
	            }
	        }
	        function onProgress(progress) {
	            deferred.notify({
	                index: index,
	                value: progress
	            });
	        }
	    }, undefined);

	    return deferred.promise;
	}

	Promise.prototype.any = function () {
	    return any(this);
	};

	/**
	 * Waits for all promises to be settled, either fulfilled or
	 * rejected.  This is distinct from `all` since that would stop
	 * waiting at the first rejection.  The promise returned by
	 * `allResolved` will never be rejected.
	 * @param promises a promise for an array (or an array) of promises
	 * (or values)
	 * @return a promise for an array of promises
	 */
	Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
	function allResolved(promises) {
	    return when(promises, function (promises) {
	        promises = array_map(promises, Q);
	        return when(all(array_map(promises, function (promise) {
	            return when(promise, noop, noop);
	        })), function () {
	            return promises;
	        });
	    });
	}

	Promise.prototype.allResolved = function () {
	    return allResolved(this);
	};

	/**
	 * @see Promise#allSettled
	 */
	Q.allSettled = allSettled;
	function allSettled(promises) {
	    return Q(promises).allSettled();
	}

	/**
	 * Turns an array of promises into a promise for an array of their states (as
	 * returned by `inspect`) when they have all settled.
	 * @param {Array[Any*]} values an array (or promise for an array) of values (or
	 * promises for values)
	 * @returns {Array[State]} an array of states for the respective values.
	 */
	Promise.prototype.allSettled = function () {
	    return this.then(function (promises) {
	        return all(array_map(promises, function (promise) {
	            promise = Q(promise);
	            function regardless() {
	                return promise.inspect();
	            }
	            return promise.then(regardless, regardless);
	        }));
	    });
	};

	/**
	 * Captures the failure of a promise, giving an oportunity to recover
	 * with a callback.  If the given promise is fulfilled, the returned
	 * promise is fulfilled.
	 * @param {Any*} promise for something
	 * @param {Function} callback to fulfill the returned promise if the
	 * given promise is rejected
	 * @returns a promise for the return value of the callback
	 */
	Q.fail = // XXX legacy
	Q["catch"] = function (object, rejected) {
	    return Q(object).then(void 0, rejected);
	};

	Promise.prototype.fail = // XXX legacy
	Promise.prototype["catch"] = function (rejected) {
	    return this.then(void 0, rejected);
	};

	/**
	 * Attaches a listener that can respond to progress notifications from a
	 * promise's originating deferred. This listener receives the exact arguments
	 * passed to ``deferred.notify``.
	 * @param {Any*} promise for something
	 * @param {Function} callback to receive any progress notifications
	 * @returns the given promise, unchanged
	 */
	Q.progress = progress;
	function progress(object, progressed) {
	    return Q(object).then(void 0, void 0, progressed);
	}

	Promise.prototype.progress = function (progressed) {
	    return this.then(void 0, void 0, progressed);
	};

	/**
	 * Provides an opportunity to observe the settling of a promise,
	 * regardless of whether the promise is fulfilled or rejected.  Forwards
	 * the resolution to the returned promise when the callback is done.
	 * The callback can return a promise to defer completion.
	 * @param {Any*} promise
	 * @param {Function} callback to observe the resolution of the given
	 * promise, takes no arguments.
	 * @returns a promise for the resolution of the given promise when
	 * ``fin`` is done.
	 */
	Q.fin = // XXX legacy
	Q["finally"] = function (object, callback) {
	    return Q(object)["finally"](callback);
	};

	Promise.prototype.fin = // XXX legacy
	Promise.prototype["finally"] = function (callback) {
	    if (!callback || typeof callback.apply !== "function") {
	        throw new Error("Q can't apply finally callback");
	    }
	    callback = Q(callback);
	    return this.then(function (value) {
	        return callback.fcall().then(function () {
	            return value;
	        });
	    }, function (reason) {
	        // TODO attempt to recycle the rejection with "this".
	        return callback.fcall().then(function () {
	            throw reason;
	        });
	    });
	};

	/**
	 * Terminates a chain of promises, forcing rejections to be
	 * thrown as exceptions.
	 * @param {Any*} promise at the end of a chain of promises
	 * @returns nothing
	 */
	Q.done = function (object, fulfilled, rejected, progress) {
	    return Q(object).done(fulfilled, rejected, progress);
	};

	Promise.prototype.done = function (fulfilled, rejected, progress) {
	    var onUnhandledError = function (error) {
	        // forward to a future turn so that ``when``
	        // does not catch it and turn it into a rejection.
	        Q.nextTick(function () {
	            makeStackTraceLong(error, promise);
	            if (Q.onerror) {
	                Q.onerror(error);
	            } else {
	                throw error;
	            }
	        });
	    };

	    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
	    var promise = fulfilled || rejected || progress ?
	        this.then(fulfilled, rejected, progress) :
	        this;

	    if (typeof process === "object" && process && process.domain) {
	        onUnhandledError = process.domain.bind(onUnhandledError);
	    }

	    promise.then(void 0, onUnhandledError);
	};

	/**
	 * Causes a promise to be rejected if it does not get fulfilled before
	 * some milliseconds time out.
	 * @param {Any*} promise
	 * @param {Number} milliseconds timeout
	 * @param {Any*} custom error message or Error object (optional)
	 * @returns a promise for the resolution of the given promise if it is
	 * fulfilled before the timeout, otherwise rejected.
	 */
	Q.timeout = function (object, ms, error) {
	    return Q(object).timeout(ms, error);
	};

	Promise.prototype.timeout = function (ms, error) {
	    var deferred = defer();
	    var timeoutId = setTimeout(function () {
	        if (!error || "string" === typeof error) {
	            error = new Error(error || "Timed out after " + ms + " ms");
	            error.code = "ETIMEDOUT";
	        }
	        deferred.reject(error);
	    }, ms);

	    this.then(function (value) {
	        clearTimeout(timeoutId);
	        deferred.resolve(value);
	    }, function (exception) {
	        clearTimeout(timeoutId);
	        deferred.reject(exception);
	    }, deferred.notify);

	    return deferred.promise;
	};

	/**
	 * Returns a promise for the given value (or promised value), some
	 * milliseconds after it resolved. Passes rejections immediately.
	 * @param {Any*} promise
	 * @param {Number} milliseconds
	 * @returns a promise for the resolution of the given promise after milliseconds
	 * time has elapsed since the resolution of the given promise.
	 * If the given promise rejects, that is passed immediately.
	 */
	Q.delay = function (object, timeout) {
	    if (timeout === void 0) {
	        timeout = object;
	        object = void 0;
	    }
	    return Q(object).delay(timeout);
	};

	Promise.prototype.delay = function (timeout) {
	    return this.then(function (value) {
	        var deferred = defer();
	        setTimeout(function () {
	            deferred.resolve(value);
	        }, timeout);
	        return deferred.promise;
	    });
	};

	/**
	 * Passes a continuation to a Node function, which is called with the given
	 * arguments provided as an array, and returns a promise.
	 *
	 *      Q.nfapply(FS.readFile, [__filename])
	 *      .then(function (content) {
	 *      })
	 *
	 */
	Q.nfapply = function (callback, args) {
	    return Q(callback).nfapply(args);
	};

	Promise.prototype.nfapply = function (args) {
	    var deferred = defer();
	    var nodeArgs = array_slice(args);
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.fapply(nodeArgs).fail(deferred.reject);
	    return deferred.promise;
	};

	/**
	 * Passes a continuation to a Node function, which is called with the given
	 * arguments provided individually, and returns a promise.
	 * @example
	 * Q.nfcall(FS.readFile, __filename)
	 * .then(function (content) {
	 * })
	 *
	 */
	Q.nfcall = function (callback /*...args*/) {
	    var args = array_slice(arguments, 1);
	    return Q(callback).nfapply(args);
	};

	Promise.prototype.nfcall = function (/*...args*/) {
	    var nodeArgs = array_slice(arguments);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.fapply(nodeArgs).fail(deferred.reject);
	    return deferred.promise;
	};

	/**
	 * Wraps a NodeJS continuation passing function and returns an equivalent
	 * version that returns a promise.
	 * @example
	 * Q.nfbind(FS.readFile, __filename)("utf-8")
	 * .then(console.log)
	 * .done()
	 */
	Q.nfbind =
	Q.denodeify = function (callback /*...args*/) {
	    if (callback === undefined) {
	        throw new Error("Q can't wrap an undefined function");
	    }
	    var baseArgs = array_slice(arguments, 1);
	    return function () {
	        var nodeArgs = baseArgs.concat(array_slice(arguments));
	        var deferred = defer();
	        nodeArgs.push(deferred.makeNodeResolver());
	        Q(callback).fapply(nodeArgs).fail(deferred.reject);
	        return deferred.promise;
	    };
	};

	Promise.prototype.nfbind =
	Promise.prototype.denodeify = function (/*...args*/) {
	    var args = array_slice(arguments);
	    args.unshift(this);
	    return Q.denodeify.apply(void 0, args);
	};

	Q.nbind = function (callback, thisp /*...args*/) {
	    var baseArgs = array_slice(arguments, 2);
	    return function () {
	        var nodeArgs = baseArgs.concat(array_slice(arguments));
	        var deferred = defer();
	        nodeArgs.push(deferred.makeNodeResolver());
	        function bound() {
	            return callback.apply(thisp, arguments);
	        }
	        Q(bound).fapply(nodeArgs).fail(deferred.reject);
	        return deferred.promise;
	    };
	};

	Promise.prototype.nbind = function (/*thisp, ...args*/) {
	    var args = array_slice(arguments, 0);
	    args.unshift(this);
	    return Q.nbind.apply(void 0, args);
	};

	/**
	 * Calls a method of a Node-style object that accepts a Node-style
	 * callback with a given array of arguments, plus a provided callback.
	 * @param object an object that has the named method
	 * @param {String} name name of the method of object
	 * @param {Array} args arguments to pass to the method; the callback
	 * will be provided by Q and appended to these arguments.
	 * @returns a promise for the value or error
	 */
	Q.nmapply = // XXX As proposed by "Redsandro"
	Q.npost = function (object, name, args) {
	    return Q(object).npost(name, args);
	};

	Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
	Promise.prototype.npost = function (name, args) {
	    var nodeArgs = array_slice(args || []);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
	    return deferred.promise;
	};

	/**
	 * Calls a method of a Node-style object that accepts a Node-style
	 * callback, forwarding the given variadic arguments, plus a provided
	 * callback argument.
	 * @param object an object that has the named method
	 * @param {String} name name of the method of object
	 * @param ...args arguments to pass to the method; the callback will
	 * be provided by Q and appended to these arguments.
	 * @returns a promise for the value or error
	 */
	Q.nsend = // XXX Based on Mark Miller's proposed "send"
	Q.nmcall = // XXX Based on "Redsandro's" proposal
	Q.ninvoke = function (object, name /*...args*/) {
	    var nodeArgs = array_slice(arguments, 2);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
	    return deferred.promise;
	};

	Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
	Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
	Promise.prototype.ninvoke = function (name /*...args*/) {
	    var nodeArgs = array_slice(arguments, 1);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
	    return deferred.promise;
	};

	/**
	 * If a function would like to support both Node continuation-passing-style and
	 * promise-returning-style, it can end its internal promise chain with
	 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
	 * elects to use a nodeback, the result will be sent there.  If they do not
	 * pass a nodeback, they will receive the result promise.
	 * @param object a result (or a promise for a result)
	 * @param {Function} nodeback a Node.js-style callback
	 * @returns either the promise or nothing
	 */
	Q.nodeify = nodeify;
	function nodeify(object, nodeback) {
	    return Q(object).nodeify(nodeback);
	}

	Promise.prototype.nodeify = function (nodeback) {
	    if (nodeback) {
	        this.then(function (value) {
	            Q.nextTick(function () {
	                nodeback(null, value);
	            });
	        }, function (error) {
	            Q.nextTick(function () {
	                nodeback(error);
	            });
	        });
	    } else {
	        return this;
	    }
	};

	Q.noConflict = function() {
	    throw new Error("Q.noConflict only works when Q is used as a global");
	};

	// All code before this point will be filtered from stack traces.
	var qEndingLine = captureLine();

	return Q;

	}); 
} (q));

var qExports = q.exports;

var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(toolrunner, "__esModule", { value: true });
toolrunner.ToolRunner = void 0;
var Q = qExports;
var os$1 = require$$0$2;
var events = require$$2;
var child = require$$1$1;
var im = internal;
var fs$1 = require$$1;
var ToolRunner = /** @class */ (function (_super) {
    __extends(ToolRunner, _super);
    function ToolRunner(toolPath) {
        var _this = _super.call(this) || this;
        _this.cmdSpecialChars = [' ', '\t', '&', '(', ')', '[', ']', '{', '}', '^', '=', ';', '!', '\'', '+', ',', '`', '~', '|', '<', '>', '"'];
        if (!toolPath) {
            throw new Error('Parameter \'toolPath\' cannot be null or empty.');
        }
        _this.toolPath = im._which(toolPath, true);
        _this.args = [];
        _this._debug('toolRunner toolPath: ' + toolPath);
        return _this;
    }
    ToolRunner.prototype._debug = function (message) {
        this.emit('debug', message);
    };
    ToolRunner.prototype._argStringToArray = function (argString) {
        var args = [];
        var inQuotes = false;
        var escaped = false;
        var lastCharWasSpace = true;
        var arg = '';
        var append = function (c) {
            // we only escape double quotes.
            if (escaped) {
                if (c !== '"') {
                    arg += '\\';
                }
                else {
                    arg.slice(0, -1);
                }
            }
            arg += c;
            escaped = false;
        };
        for (var i = 0; i < argString.length; i++) {
            var c = argString.charAt(i);
            if (c === ' ' && !inQuotes) {
                if (!lastCharWasSpace) {
                    args.push(arg);
                    arg = '';
                }
                lastCharWasSpace = true;
                continue;
            }
            else {
                lastCharWasSpace = false;
            }
            if (c === '"') {
                if (!escaped) {
                    inQuotes = !inQuotes;
                }
                else {
                    append(c);
                }
                continue;
            }
            if (c === "\\" && escaped) {
                append(c);
                continue;
            }
            if (c === "\\" && inQuotes) {
                escaped = true;
                continue;
            }
            append(c);
            lastCharWasSpace = false;
        }
        if (!lastCharWasSpace) {
            args.push(arg.trim());
        }
        return args;
    };
    ToolRunner.prototype._getCommandString = function (options, noPrefix) {
        var _this = this;
        var toolPath = this._getSpawnFileName();
        var args = this._getSpawnArgs(options);
        var cmd = noPrefix ? '' : '[command]'; // omit prefix when piped to a second tool
        var commandParts = [];
        if (process.platform == 'win32') {
            // Windows + cmd file
            if (this._isCmdFile()) {
                commandParts.push(toolPath);
                commandParts = commandParts.concat(args);
            }
            // Windows + verbatim
            else if (options.windowsVerbatimArguments) {
                commandParts.push("\"" + toolPath + "\"");
                commandParts = commandParts.concat(args);
            }
            else if (options.shell) {
                commandParts.push(this._windowsQuoteCmdArg(toolPath));
                commandParts = commandParts.concat(args);
            }
            // Windows (regular)
            else {
                commandParts.push(this._windowsQuoteCmdArg(toolPath));
                commandParts = commandParts.concat(args.map(function (arg) { return _this._windowsQuoteCmdArg(arg); }));
            }
        }
        else {
            // OSX/Linux - this can likely be improved with some form of quoting.
            // creating processes on Unix is fundamentally different than Windows.
            // on Unix, execvp() takes an arg array.
            commandParts.push(toolPath);
            commandParts = commandParts.concat(args);
        }
        cmd += commandParts.join(' ');
        // append second tool
        if (this.pipeOutputToTool) {
            cmd += ' | ' + this.pipeOutputToTool._getCommandString(options, /*noPrefix:*/ true);
        }
        return cmd;
    };
    ToolRunner.prototype._processLineBuffer = function (data, strBuffer, onLine) {
        try {
            var s = strBuffer + data.toString();
            var n = s.indexOf(os$1.EOL);
            while (n > -1) {
                var line = s.substring(0, n);
                onLine(line);
                // the rest of the string ...
                s = s.substring(n + os$1.EOL.length);
                n = s.indexOf(os$1.EOL);
            }
            strBuffer = s;
        }
        catch (err) {
            // streaming lines to console is best effort.  Don't fail a build.
            this._debug('error processing line');
        }
    };
    /**
     * Wraps an arg string with specified char if it's not already wrapped
     * @returns {string} Arg wrapped with specified char
     * @param {string} arg Input argument string
     * @param {string} wrapChar A char input string should be wrapped with
     */
    ToolRunner.prototype._wrapArg = function (arg, wrapChar) {
        if (!this._isWrapped(arg, wrapChar)) {
            return "" + wrapChar + arg + wrapChar;
        }
        return arg;
    };
    /**
     * Unwraps an arg string wrapped with specified char
     * @param arg Arg wrapped with specified char
     * @param wrapChar A char to be removed
     */
    ToolRunner.prototype._unwrapArg = function (arg, wrapChar) {
        if (this._isWrapped(arg, wrapChar)) {
            var pattern = new RegExp("(^\\\\?" + wrapChar + ")|(\\\\?" + wrapChar + "$)", 'g');
            return arg.trim().replace(pattern, '');
        }
        return arg;
    };
    /**
     * Determine if arg string is wrapped with specified char
     * @param arg Input arg string
     */
    ToolRunner.prototype._isWrapped = function (arg, wrapChar) {
        var pattern = new RegExp("^\\\\?" + wrapChar + ".+\\\\?" + wrapChar + "$");
        return pattern.test(arg.trim());
    };
    ToolRunner.prototype._getSpawnFileName = function (options) {
        if (process.platform == 'win32') {
            if (this._isCmdFile()) {
                return process.env['COMSPEC'] || 'cmd.exe';
            }
        }
        if (options && options.shell) {
            return this._wrapArg(this.toolPath, '"');
        }
        return this.toolPath;
    };
    ToolRunner.prototype._getSpawnArgs = function (options) {
        var _this = this;
        if (process.platform == 'win32') {
            if (this._isCmdFile()) {
                var argline = "/D /S /C \"" + this._windowsQuoteCmdArg(this.toolPath);
                for (var i = 0; i < this.args.length; i++) {
                    argline += ' ';
                    argline += options.windowsVerbatimArguments ? this.args[i] : this._windowsQuoteCmdArg(this.args[i]);
                }
                argline += '"';
                return [argline];
            }
            if (options.windowsVerbatimArguments) {
                // note, in Node 6.x options.argv0 can be used instead of overriding args.slice and args.unshift.
                // for more details, refer to https://github.com/nodejs/node/blob/v6.x/lib/child_process.js
                var args_1 = this.args.slice(0); // copy the array
                // override slice to prevent Node from creating a copy of the arg array.
                // we need Node to use the "unshift" override below.
                args_1.slice = function () {
                    if (arguments.length != 1 || arguments[0] != 0) {
                        throw new Error('Unexpected arguments passed to args.slice when windowsVerbatimArguments flag is set.');
                    }
                    return args_1;
                };
                // override unshift
                //
                // when using the windowsVerbatimArguments option, Node does not quote the tool path when building
                // the cmdline parameter for the win32 function CreateProcess(). an unquoted space in the tool path
                // causes problems for tools when attempting to parse their own command line args. tools typically
                // assume their arguments begin after arg 0.
                //
                // by hijacking unshift, we can quote the tool path when it pushed onto the args array. Node builds
                // the cmdline parameter from the args array.
                //
                // note, we can't simply pass a quoted tool path to Node for multiple reasons:
                //   1) Node verifies the file exists (calls win32 function GetFileAttributesW) and the check returns
                //      false if the path is quoted.
                //   2) Node passes the tool path as the application parameter to CreateProcess, which expects the
                //      path to be unquoted.
                //
                // also note, in addition to the tool path being embedded within the cmdline parameter, Node also
                // passes the tool path to CreateProcess via the application parameter (optional parameter). when
                // present, Windows uses the application parameter to determine which file to run, instead of
                // interpreting the file from the cmdline parameter.
                args_1.unshift = function () {
                    if (arguments.length != 1) {
                        throw new Error('Unexpected arguments passed to args.unshift when windowsVerbatimArguments flag is set.');
                    }
                    return Array.prototype.unshift.call(args_1, "\"" + arguments[0] + "\""); // quote the file name
                };
                return args_1;
            }
            else if (options.shell) {
                var args = [];
                for (var _i = 0, _a = this.args; _i < _a.length; _i++) {
                    var arg = _a[_i];
                    if (this._needQuotesForCmd(arg, '%')) {
                        args.push(this._wrapArg(arg, '"'));
                    }
                    else {
                        args.push(arg);
                    }
                }
                return args;
            }
        }
        else if (options.shell) {
            return this.args.map(function (arg) {
                if (_this._isWrapped(arg, "'")) {
                    return arg;
                }
                // remove wrapping double quotes to avoid escaping
                arg = _this._unwrapArg(arg, '"');
                arg = _this._escapeChar(arg, '"');
                return _this._wrapArg(arg, '"');
            });
        }
        return this.args;
    };
    /**
     * Escape specified character.
     * @param arg String to escape char in
     * @param charToEscape Char should be escaped
     */
    ToolRunner.prototype._escapeChar = function (arg, charToEscape) {
        var escChar = "\\";
        var output = '';
        var charIsEscaped = false;
        for (var _i = 0, arg_1 = arg; _i < arg_1.length; _i++) {
            var char = arg_1[_i];
            if (char === charToEscape && !charIsEscaped) {
                output += escChar + char;
            }
            else {
                output += char;
            }
            charIsEscaped = char === escChar && !charIsEscaped;
        }
        return output;
    };
    ToolRunner.prototype._isCmdFile = function () {
        var upperToolPath = this.toolPath.toUpperCase();
        return im._endsWith(upperToolPath, '.CMD') || im._endsWith(upperToolPath, '.BAT');
    };
    /**
     * Determine whether the cmd arg needs to be quoted. Returns true if arg contains any of special chars array.
     * @param arg The cmd command arg.
     * @param additionalChars Additional chars which should be also checked.
     */
    ToolRunner.prototype._needQuotesForCmd = function (arg, additionalChars) {
        var specialChars = this.cmdSpecialChars;
        if (additionalChars) {
            specialChars = this.cmdSpecialChars.concat(additionalChars);
        }
        var _loop_1 = function (char) {
            if (specialChars.some(function (x) { return x === char; })) {
                return { value: true };
            }
        };
        for (var _i = 0, arg_2 = arg; _i < arg_2.length; _i++) {
            var char = arg_2[_i];
            var state_1 = _loop_1(char);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return false;
    };
    ToolRunner.prototype._windowsQuoteCmdArg = function (arg) {
        // for .exe, apply the normal quoting rules that libuv applies
        if (!this._isCmdFile()) {
            return this._uv_quote_cmd_arg(arg);
        }
        // otherwise apply quoting rules specific to the cmd.exe command line parser.
        // the libuv rules are generic and are not designed specifically for cmd.exe
        // command line parser.
        //
        // for a detailed description of the cmd.exe command line parser, refer to
        // http://stackoverflow.com/questions/4094699/how-does-the-windows-command-interpreter-cmd-exe-parse-scripts/7970912#7970912
        // need quotes for empty arg
        if (!arg) {
            return '""';
        }
        // determine whether the arg needs to be quoted
        var needsQuotes = this._needQuotesForCmd(arg);
        // short-circuit if quotes not needed
        if (!needsQuotes) {
            return arg;
        }
        // the following quoting rules are very similar to the rules that by libuv applies.
        //
        // 1) wrap the string in quotes
        //
        // 2) double-up quotes - i.e. " => ""
        //
        //    this is different from the libuv quoting rules. libuv replaces " with \", which unfortunately
        //    doesn't work well with a cmd.exe command line.
        //
        //    note, replacing " with "" also works well if the arg is passed to a downstream .NET console app.
        //    for example, the command line:
        //          foo.exe "myarg:""my val"""
        //    is parsed by a .NET console app into an arg array:
        //          [ "myarg:\"my val\"" ]
        //    which is the same end result when applying libuv quoting rules. although the actual
        //    command line from libuv quoting rules would look like:
        //          foo.exe "myarg:\"my val\""
        //
        // 3) double-up slashes that preceed a quote,
        //    e.g.  hello \world    => "hello \world"
        //          hello\"world    => "hello\\""world"
        //          hello\\"world   => "hello\\\\""world"
        //          hello world\    => "hello world\\"
        //
        //    technically this is not required for a cmd.exe command line, or the batch argument parser.
        //    the reasons for including this as a .cmd quoting rule are:
        //
        //    a) this is optimized for the scenario where the argument is passed from the .cmd file to an
        //       external program. many programs (e.g. .NET console apps) rely on the slash-doubling rule.
        //
        //    b) it's what we've been doing previously (by deferring to node default behavior) and we
        //       haven't heard any complaints about that aspect.
        //
        // note, a weakness of the quoting rules chosen here, is that % is not escaped. in fact, % cannot be
        // escaped when used on the command line directly - even though within a .cmd file % can be escaped
        // by using %%.
        //
        // the saving grace is, on the command line, %var% is left as-is if var is not defined. this contrasts
        // the line parsing rules within a .cmd file, where if var is not defined it is replaced with nothing.
        //
        // one option that was explored was replacing % with ^% - i.e. %var% => ^%var^%. this hack would
        // often work, since it is unlikely that var^ would exist, and the ^ character is removed when the
        // variable is used. the problem, however, is that ^ is not removed when %* is used to pass the args
        // to an external program.
        //
        // an unexplored potential solution for the % escaping problem, is to create a wrapper .cmd file.
        // % can be escaped within a .cmd file.
        var reverse = '"';
        var quote_hit = true;
        for (var i = arg.length; i > 0; i--) { // walk the string in reverse
            reverse += arg[i - 1];
            if (quote_hit && arg[i - 1] == '\\') {
                reverse += '\\'; // double the slash
            }
            else if (arg[i - 1] == '"') {
                quote_hit = true;
                reverse += '"'; // double the quote
            }
            else {
                quote_hit = false;
            }
        }
        reverse += '"';
        return reverse.split('').reverse().join('');
    };
    ToolRunner.prototype._uv_quote_cmd_arg = function (arg) {
        // Tool runner wraps child_process.spawn() and needs to apply the same quoting as
        // Node in certain cases where the undocumented spawn option windowsVerbatimArguments
        // is used.
        //
        // Since this function is a port of quote_cmd_arg from Node 4.x (technically, lib UV,
        // see https://github.com/nodejs/node/blob/v4.x/deps/uv/src/win/process.c for details),
        // pasting copyright notice from Node within this function:
        //
        //      Copyright Joyent, Inc. and other Node contributors. All rights reserved.
        //
        //      Permission is hereby granted, free of charge, to any person obtaining a copy
        //      of this software and associated documentation files (the "Software"), to
        //      deal in the Software without restriction, including without limitation the
        //      rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
        //      sell copies of the Software, and to permit persons to whom the Software is
        //      furnished to do so, subject to the following conditions:
        //
        //      The above copyright notice and this permission notice shall be included in
        //      all copies or substantial portions of the Software.
        //
        //      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        //      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        //      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        //      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
        //      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
        //      FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
        //      IN THE SOFTWARE.
        if (!arg) {
            // Need double quotation for empty argument
            return '""';
        }
        if (arg.indexOf(' ') < 0 && arg.indexOf('\t') < 0 && arg.indexOf('"') < 0) {
            // No quotation needed
            return arg;
        }
        if (arg.indexOf('"') < 0 && arg.indexOf('\\') < 0) {
            // No embedded double quotes or backslashes, so I can just wrap
            // quote marks around the whole thing.
            return "\"" + arg + "\"";
        }
        // Expected input/output:
        //   input : hello"world
        //   output: "hello\"world"
        //   input : hello""world
        //   output: "hello\"\"world"
        //   input : hello\world
        //   output: hello\world
        //   input : hello\\world
        //   output: hello\\world
        //   input : hello\"world
        //   output: "hello\\\"world"
        //   input : hello\\"world
        //   output: "hello\\\\\"world"
        //   input : hello world\
        //   output: "hello world\\" - note the comment in libuv actually reads "hello world\"
        //                             but it appears the comment is wrong, it should be "hello world\\"
        var reverse = '"';
        var quote_hit = true;
        for (var i = arg.length; i > 0; i--) { // walk the string in reverse
            reverse += arg[i - 1];
            if (quote_hit && arg[i - 1] == '\\') {
                reverse += '\\';
            }
            else if (arg[i - 1] == '"') {
                quote_hit = true;
                reverse += '\\';
            }
            else {
                quote_hit = false;
            }
        }
        reverse += '"';
        return reverse.split('').reverse().join('');
    };
    ToolRunner.prototype._cloneExecOptions = function (options) {
        options = options || {};
        var result = {
            cwd: options.cwd || process.cwd(),
            env: options.env || process.env,
            silent: options.silent || false,
            failOnStdErr: options.failOnStdErr || false,
            ignoreReturnCode: options.ignoreReturnCode || false,
            windowsVerbatimArguments: options.windowsVerbatimArguments || false,
            shell: options.shell || false
        };
        result.outStream = options.outStream || process.stdout;
        result.errStream = options.errStream || process.stderr;
        return result;
    };
    ToolRunner.prototype._getSpawnOptions = function (options) {
        options = options || {};
        var result = {};
        result.cwd = options.cwd;
        result.env = options.env;
        result.shell = options.shell;
        result['windowsVerbatimArguments'] = options.windowsVerbatimArguments || this._isCmdFile();
        return result;
    };
    ToolRunner.prototype._getSpawnSyncOptions = function (options) {
        var result = {};
        result.maxBuffer = 1024 * 1024 * 1024;
        result.cwd = options.cwd;
        result.env = options.env;
        result.shell = options.shell;
        result['windowsVerbatimArguments'] = options.windowsVerbatimArguments || this._isCmdFile();
        return result;
    };
    ToolRunner.prototype.execWithPipingAsync = function (pipeOutputToTool, options) {
        var _this = this;
        this._debug('exec tool: ' + this.toolPath);
        this._debug('arguments:');
        this.args.forEach(function (arg) {
            _this._debug('   ' + arg);
        });
        var success = true;
        var optionsNonNull = this._cloneExecOptions(options);
        if (!optionsNonNull.silent) {
            optionsNonNull.outStream.write(this._getCommandString(optionsNonNull) + os$1.EOL);
        }
        var cp;
        var toolPath = pipeOutputToTool.toolPath;
        var toolPathFirst;
        var successFirst = true;
        var returnCodeFirst;
        var fileStream;
        var waitingEvents = 0; // number of process or stream events we are waiting on to complete
        var returnCode = 0;
        var error;
        toolPathFirst = this.toolPath;
        // Following node documentation example from this link on how to pipe output of one process to another
        // https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
        //start the child process for both tools
        waitingEvents++;
        var cpFirst = child.spawn(this._getSpawnFileName(optionsNonNull), this._getSpawnArgs(optionsNonNull), this._getSpawnOptions(optionsNonNull));
        waitingEvents++;
        cp = child.spawn(pipeOutputToTool._getSpawnFileName(optionsNonNull), pipeOutputToTool._getSpawnArgs(optionsNonNull), pipeOutputToTool._getSpawnOptions(optionsNonNull));
        fileStream = this.pipeOutputToFile ? fs$1.createWriteStream(this.pipeOutputToFile) : null;
        return new Promise(function (resolve, reject) {
            var _a, _b, _c, _d;
            if (fileStream) {
                waitingEvents++;
                fileStream.on('finish', function () {
                    waitingEvents--; //file write is complete
                    fileStream = null;
                    if (waitingEvents == 0) {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(returnCode);
                        }
                    }
                });
                fileStream.on('error', function (err) {
                    waitingEvents--; //there were errors writing to the file, write is done
                    _this._debug("Failed to pipe output of " + toolPathFirst + " to file " + _this.pipeOutputToFile + ". Error = " + err);
                    fileStream = null;
                    if (waitingEvents == 0) {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(returnCode);
                        }
                    }
                });
            }
            //pipe stdout of first tool to stdin of second tool
            (_a = cpFirst.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                var _a;
                try {
                    if (fileStream) {
                        fileStream.write(data);
                    }
                    (_a = cp.stdin) === null || _a === void 0 ? void 0 : _a.write(data);
                }
                catch (err) {
                    _this._debug('Failed to pipe output of ' + toolPathFirst + ' to ' + toolPath);
                    _this._debug(toolPath + ' might have exited due to errors prematurely. Verify the arguments passed are valid.');
                }
            });
            (_b = cpFirst.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                if (fileStream) {
                    fileStream.write(data);
                }
                successFirst = !optionsNonNull.failOnStdErr;
                if (!optionsNonNull.silent) {
                    var s = optionsNonNull.failOnStdErr ? optionsNonNull.errStream : optionsNonNull.outStream;
                    s.write(data);
                }
            });
            cpFirst.on('error', function (err) {
                var _a;
                waitingEvents--; //first process is complete with errors
                if (fileStream) {
                    fileStream.end();
                }
                (_a = cp.stdin) === null || _a === void 0 ? void 0 : _a.end();
                error = new Error(toolPathFirst + ' failed. ' + err.message);
                if (waitingEvents == 0) {
                    reject(error);
                }
            });
            cpFirst.on('close', function (code, signal) {
                var _a;
                waitingEvents--; //first process is complete
                if (code != 0 && !optionsNonNull.ignoreReturnCode) {
                    successFirst = false;
                    returnCodeFirst = code;
                    returnCode = returnCodeFirst;
                }
                _this._debug('success of first tool:' + successFirst);
                if (fileStream) {
                    fileStream.end();
                }
                (_a = cp.stdin) === null || _a === void 0 ? void 0 : _a.end();
                if (waitingEvents == 0) {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(returnCode);
                    }
                }
            });
            var stdbuffer = '';
            (_c = cp.stdout) === null || _c === void 0 ? void 0 : _c.on('data', function (data) {
                _this.emit('stdout', data);
                if (!optionsNonNull.silent) {
                    optionsNonNull.outStream.write(data);
                }
                _this._processLineBuffer(data, stdbuffer, function (line) {
                    _this.emit('stdline', line);
                });
            });
            var errbuffer = '';
            (_d = cp.stderr) === null || _d === void 0 ? void 0 : _d.on('data', function (data) {
                _this.emit('stderr', data);
                success = !optionsNonNull.failOnStdErr;
                if (!optionsNonNull.silent) {
                    var s = optionsNonNull.failOnStdErr ? optionsNonNull.errStream : optionsNonNull.outStream;
                    s.write(data);
                }
                _this._processLineBuffer(data, errbuffer, function (line) {
                    _this.emit('errline', line);
                });
            });
            cp.on('error', function (err) {
                waitingEvents--; //process is done with errors
                error = new Error(toolPath + ' failed. ' + err.message);
                if (waitingEvents == 0) {
                    reject(error);
                }
            });
            cp.on('close', function (code, signal) {
                waitingEvents--; //process is complete
                _this._debug('rc:' + code);
                returnCode = code;
                if (stdbuffer.length > 0) {
                    _this.emit('stdline', stdbuffer);
                }
                if (errbuffer.length > 0) {
                    _this.emit('errline', errbuffer);
                }
                if (code != 0 && !optionsNonNull.ignoreReturnCode) {
                    success = false;
                }
                _this._debug('success:' + success);
                if (!successFirst) { //in the case output is piped to another tool, check exit code of both tools
                    error = new Error(toolPathFirst + ' failed with return code: ' + returnCodeFirst);
                }
                else if (!success) {
                    error = new Error(toolPath + ' failed with return code: ' + code);
                }
                if (waitingEvents == 0) {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(returnCode);
                    }
                }
            });
        });
    };
    ToolRunner.prototype.execWithPiping = function (pipeOutputToTool, options) {
        var _this = this;
        var _a, _b, _c, _d;
        var defer = Q.defer();
        this._debug('exec tool: ' + this.toolPath);
        this._debug('arguments:');
        this.args.forEach(function (arg) {
            _this._debug('   ' + arg);
        });
        var success = true;
        var optionsNonNull = this._cloneExecOptions(options);
        if (!optionsNonNull.silent) {
            optionsNonNull.outStream.write(this._getCommandString(optionsNonNull) + os$1.EOL);
        }
        var cp;
        var toolPath = pipeOutputToTool.toolPath;
        var toolPathFirst;
        var successFirst = true;
        var returnCodeFirst;
        var fileStream;
        var waitingEvents = 0; // number of process or stream events we are waiting on to complete
        var returnCode = 0;
        var error;
        toolPathFirst = this.toolPath;
        // Following node documentation example from this link on how to pipe output of one process to another
        // https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
        //start the child process for both tools
        waitingEvents++;
        var cpFirst = child.spawn(this._getSpawnFileName(optionsNonNull), this._getSpawnArgs(optionsNonNull), this._getSpawnOptions(optionsNonNull));
        waitingEvents++;
        cp = child.spawn(pipeOutputToTool._getSpawnFileName(optionsNonNull), pipeOutputToTool._getSpawnArgs(optionsNonNull), pipeOutputToTool._getSpawnOptions(optionsNonNull));
        fileStream = this.pipeOutputToFile ? fs$1.createWriteStream(this.pipeOutputToFile) : null;
        if (fileStream) {
            waitingEvents++;
            fileStream.on('finish', function () {
                waitingEvents--; //file write is complete
                fileStream = null;
                if (waitingEvents == 0) {
                    if (error) {
                        defer.reject(error);
                    }
                    else {
                        defer.resolve(returnCode);
                    }
                }
            });
            fileStream.on('error', function (err) {
                waitingEvents--; //there were errors writing to the file, write is done
                _this._debug("Failed to pipe output of " + toolPathFirst + " to file " + _this.pipeOutputToFile + ". Error = " + err);
                fileStream = null;
                if (waitingEvents == 0) {
                    if (error) {
                        defer.reject(error);
                    }
                    else {
                        defer.resolve(returnCode);
                    }
                }
            });
        }
        //pipe stdout of first tool to stdin of second tool
        (_a = cpFirst.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
            var _a;
            try {
                if (fileStream) {
                    fileStream.write(data);
                }
                (_a = cp.stdin) === null || _a === void 0 ? void 0 : _a.write(data);
            }
            catch (err) {
                _this._debug('Failed to pipe output of ' + toolPathFirst + ' to ' + toolPath);
                _this._debug(toolPath + ' might have exited due to errors prematurely. Verify the arguments passed are valid.');
            }
        });
        (_b = cpFirst.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
            if (fileStream) {
                fileStream.write(data);
            }
            successFirst = !optionsNonNull.failOnStdErr;
            if (!optionsNonNull.silent) {
                var s = optionsNonNull.failOnStdErr ? optionsNonNull.errStream : optionsNonNull.outStream;
                s.write(data);
            }
        });
        cpFirst.on('error', function (err) {
            var _a;
            waitingEvents--; //first process is complete with errors
            if (fileStream) {
                fileStream.end();
            }
            (_a = cp.stdin) === null || _a === void 0 ? void 0 : _a.end();
            error = new Error(toolPathFirst + ' failed. ' + err.message);
            if (waitingEvents == 0) {
                defer.reject(error);
            }
        });
        cpFirst.on('close', function (code, signal) {
            var _a;
            waitingEvents--; //first process is complete
            if (code != 0 && !optionsNonNull.ignoreReturnCode) {
                successFirst = false;
                returnCodeFirst = code;
                returnCode = returnCodeFirst;
            }
            _this._debug('success of first tool:' + successFirst);
            if (fileStream) {
                fileStream.end();
            }
            (_a = cp.stdin) === null || _a === void 0 ? void 0 : _a.end();
            if (waitingEvents == 0) {
                if (error) {
                    defer.reject(error);
                }
                else {
                    defer.resolve(returnCode);
                }
            }
        });
        var stdbuffer = '';
        (_c = cp.stdout) === null || _c === void 0 ? void 0 : _c.on('data', function (data) {
            _this.emit('stdout', data);
            if (!optionsNonNull.silent) {
                optionsNonNull.outStream.write(data);
            }
            _this._processLineBuffer(data, stdbuffer, function (line) {
                _this.emit('stdline', line);
            });
        });
        var errbuffer = '';
        (_d = cp.stderr) === null || _d === void 0 ? void 0 : _d.on('data', function (data) {
            _this.emit('stderr', data);
            success = !optionsNonNull.failOnStdErr;
            if (!optionsNonNull.silent) {
                var s = optionsNonNull.failOnStdErr ? optionsNonNull.errStream : optionsNonNull.outStream;
                s.write(data);
            }
            _this._processLineBuffer(data, errbuffer, function (line) {
                _this.emit('errline', line);
            });
        });
        cp.on('error', function (err) {
            waitingEvents--; //process is done with errors
            error = new Error(toolPath + ' failed. ' + err.message);
            if (waitingEvents == 0) {
                defer.reject(error);
            }
        });
        cp.on('close', function (code, signal) {
            waitingEvents--; //process is complete
            _this._debug('rc:' + code);
            returnCode = code;
            if (stdbuffer.length > 0) {
                _this.emit('stdline', stdbuffer);
            }
            if (errbuffer.length > 0) {
                _this.emit('errline', errbuffer);
            }
            if (code != 0 && !optionsNonNull.ignoreReturnCode) {
                success = false;
            }
            _this._debug('success:' + success);
            if (!successFirst) { //in the case output is piped to another tool, check exit code of both tools
                error = new Error(toolPathFirst + ' failed with return code: ' + returnCodeFirst);
            }
            else if (!success) {
                error = new Error(toolPath + ' failed with return code: ' + code);
            }
            if (waitingEvents == 0) {
                if (error) {
                    defer.reject(error);
                }
                else {
                    defer.resolve(returnCode);
                }
            }
        });
        return defer.promise;
    };
    /**
     * Add argument
     * Append an argument or an array of arguments
     * returns ToolRunner for chaining
     *
     * @param     val        string cmdline or array of strings
     * @returns   ToolRunner
     */
    ToolRunner.prototype.arg = function (val) {
        if (!val) {
            return this;
        }
        if (val instanceof Array) {
            this._debug(this.toolPath + ' arg: ' + JSON.stringify(val));
            this.args = this.args.concat(val);
        }
        else if (typeof (val) === 'string') {
            this._debug(this.toolPath + ' arg: ' + val);
            this.args = this.args.concat(val.trim());
        }
        return this;
    };
    /**
     * Parses an argument line into one or more arguments
     * e.g. .line('"arg one" two -z') is equivalent to .arg(['arg one', 'two', '-z'])
     * returns ToolRunner for chaining
     *
     * @param     val        string argument line
     * @returns   ToolRunner
     */
    ToolRunner.prototype.line = function (val) {
        if (!val) {
            return this;
        }
        this._debug(this.toolPath + ' arg: ' + val);
        this.args = this.args.concat(this._argStringToArray(val));
        return this;
    };
    /**
     * Add argument(s) if a condition is met
     * Wraps arg().  See arg for details
     * returns ToolRunner for chaining
     *
     * @param     condition     boolean condition
     * @param     val     string cmdline or array of strings
     * @returns   ToolRunner
     */
    ToolRunner.prototype.argIf = function (condition, val) {
        if (condition) {
            this.arg(val);
        }
        return this;
    };
    /**
     * Pipe output of exec() to another tool
     * @param tool
     * @param file  optional filename to additionally stream the output to.
     * @returns {ToolRunner}
     */
    ToolRunner.prototype.pipeExecOutputToTool = function (tool, file) {
        this.pipeOutputToTool = tool;
        this.pipeOutputToFile = file;
        return this;
    };
    /**
     * Exec a tool.
     * Output will be streamed to the live console.
     * Returns promise with return code
     *
     * @param     tool     path to tool to exec
     * @param     options  optional exec options.  See IExecOptions
     * @returns   number
     */
    ToolRunner.prototype.execAsync = function (options) {
        var _this = this;
        var _a, _b, _c;
        if (this.pipeOutputToTool) {
            return this.execWithPipingAsync(this.pipeOutputToTool, options);
        }
        this._debug('exec tool: ' + this.toolPath);
        this._debug('arguments:');
        this.args.forEach(function (arg) {
            _this._debug('   ' + arg);
        });
        var optionsNonNull = this._cloneExecOptions(options);
        if (!optionsNonNull.silent) {
            optionsNonNull.outStream.write(this._getCommandString(optionsNonNull) + os$1.EOL);
        }
        var state = new ExecState(optionsNonNull, this.toolPath);
        state.on('debug', function (message) {
            _this._debug(message);
        });
        var cp = child.spawn(this._getSpawnFileName(options), this._getSpawnArgs(optionsNonNull), this._getSpawnOptions(options));
        this.childProcess = cp;
        // it is possible for the child process to end its last line without a new line.
        // because stdout is buffered, this causes the last line to not get sent to the parent
        // stream. Adding this event forces a flush before the child streams are closed.
        (_a = cp.stdout) === null || _a === void 0 ? void 0 : _a.on('finish', function () {
            if (!optionsNonNull.silent) {
                optionsNonNull.outStream.write(os$1.EOL);
            }
        });
        var stdbuffer = '';
        (_b = cp.stdout) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
            _this.emit('stdout', data);
            if (!optionsNonNull.silent) {
                optionsNonNull.outStream.write(data);
            }
            _this._processLineBuffer(data, stdbuffer, function (line) {
                _this.emit('stdline', line);
            });
        });
        var errbuffer = '';
        (_c = cp.stderr) === null || _c === void 0 ? void 0 : _c.on('data', function (data) {
            state.processStderr = true;
            _this.emit('stderr', data);
            if (!optionsNonNull.silent) {
                var s = optionsNonNull.failOnStdErr ? optionsNonNull.errStream : optionsNonNull.outStream;
                s.write(data);
            }
            _this._processLineBuffer(data, errbuffer, function (line) {
                _this.emit('errline', line);
            });
        });
        cp.on('error', function (err) {
            state.processError = err.message;
            state.processExited = true;
            state.processClosed = true;
            state.CheckComplete();
        });
        cp.on('exit', function (code, signal) {
            state.processExitCode = code;
            state.processExited = true;
            _this._debug("Exit code " + code + " received from tool '" + _this.toolPath + "'");
            state.CheckComplete();
        });
        cp.on('close', function (code, signal) {
            state.processExitCode = code;
            state.processExited = true;
            state.processClosed = true;
            _this._debug("STDIO streams have closed for tool '" + _this.toolPath + "'");
            state.CheckComplete();
        });
        return new Promise(function (resolve, reject) {
            state.on('done', function (error, exitCode) {
                if (stdbuffer.length > 0) {
                    _this.emit('stdline', stdbuffer);
                }
                if (errbuffer.length > 0) {
                    _this.emit('errline', errbuffer);
                }
                cp.removeAllListeners();
                if (error) {
                    reject(error);
                }
                else {
                    resolve(exitCode);
                }
            });
        });
    };
    /**
     * Exec a tool.
     * Output will be streamed to the live console.
     * Returns promise with return code
     *
     * @deprecated Use the `execAsync` method that returns a native Javascript promise instead
     * @param     tool     path to tool to exec
     * @param     options  optional exec options.  See IExecOptions
     * @returns   number
     */
    ToolRunner.prototype.exec = function (options) {
        var _this = this;
        var _a, _b, _c;
        if (this.pipeOutputToTool) {
            return this.execWithPiping(this.pipeOutputToTool, options);
        }
        var defer = Q.defer();
        this._debug('exec tool: ' + this.toolPath);
        this._debug('arguments:');
        this.args.forEach(function (arg) {
            _this._debug('   ' + arg);
        });
        var optionsNonNull = this._cloneExecOptions(options);
        if (!optionsNonNull.silent) {
            optionsNonNull.outStream.write(this._getCommandString(optionsNonNull) + os$1.EOL);
        }
        var state = new ExecState(optionsNonNull, this.toolPath);
        state.on('debug', function (message) {
            _this._debug(message);
        });
        var cp = child.spawn(this._getSpawnFileName(options), this._getSpawnArgs(optionsNonNull), this._getSpawnOptions(options));
        this.childProcess = cp;
        // it is possible for the child process to end its last line without a new line.
        // because stdout is buffered, this causes the last line to not get sent to the parent
        // stream. Adding this event forces a flush before the child streams are closed.
        (_a = cp.stdout) === null || _a === void 0 ? void 0 : _a.on('finish', function () {
            if (!optionsNonNull.silent) {
                optionsNonNull.outStream.write(os$1.EOL);
            }
        });
        var stdbuffer = '';
        (_b = cp.stdout) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
            _this.emit('stdout', data);
            if (!optionsNonNull.silent) {
                optionsNonNull.outStream.write(data);
            }
            _this._processLineBuffer(data, stdbuffer, function (line) {
                _this.emit('stdline', line);
            });
        });
        var errbuffer = '';
        (_c = cp.stderr) === null || _c === void 0 ? void 0 : _c.on('data', function (data) {
            state.processStderr = true;
            _this.emit('stderr', data);
            if (!optionsNonNull.silent) {
                var s = optionsNonNull.failOnStdErr ? optionsNonNull.errStream : optionsNonNull.outStream;
                s.write(data);
            }
            _this._processLineBuffer(data, errbuffer, function (line) {
                _this.emit('errline', line);
            });
        });
        cp.on('error', function (err) {
            state.processError = err.message;
            state.processExited = true;
            state.processClosed = true;
            state.CheckComplete();
        });
        cp.on('exit', function (code, signal) {
            state.processExitCode = code;
            state.processExited = true;
            _this._debug("Exit code " + code + " received from tool '" + _this.toolPath + "'");
            state.CheckComplete();
        });
        cp.on('close', function (code, signal) {
            state.processExitCode = code;
            state.processExited = true;
            state.processClosed = true;
            _this._debug("STDIO streams have closed for tool '" + _this.toolPath + "'");
            state.CheckComplete();
        });
        state.on('done', function (error, exitCode) {
            if (stdbuffer.length > 0) {
                _this.emit('stdline', stdbuffer);
            }
            if (errbuffer.length > 0) {
                _this.emit('errline', errbuffer);
            }
            cp.removeAllListeners();
            if (error) {
                defer.reject(error);
            }
            else {
                defer.resolve(exitCode);
            }
        });
        return defer.promise;
    };
    /**
     * Exec a tool synchronously.
     * Output will be *not* be streamed to the live console.  It will be returned after execution is complete.
     * Appropriate for short running tools
     * Returns IExecSyncResult with output and return code
     *
     * @param     tool     path to tool to exec
     * @param     options  optional exec options.  See IExecSyncOptions
     * @returns   IExecSyncResult
     */
    ToolRunner.prototype.execSync = function (options) {
        var _this = this;
        this._debug('exec tool: ' + this.toolPath);
        this._debug('arguments:');
        this.args.forEach(function (arg) {
            _this._debug('   ' + arg);
        });
        options = this._cloneExecOptions(options);
        if (!options.silent) {
            options.outStream.write(this._getCommandString(options) + os$1.EOL);
        }
        var r = child.spawnSync(this._getSpawnFileName(options), this._getSpawnArgs(options), this._getSpawnSyncOptions(options));
        if (!options.silent && r.stdout && r.stdout.length > 0) {
            options.outStream.write(r.stdout);
        }
        if (!options.silent && r.stderr && r.stderr.length > 0) {
            options.errStream.write(r.stderr);
        }
        var res = { code: r.status, error: r.error };
        res.stdout = (r.stdout) ? r.stdout.toString() : '';
        res.stderr = (r.stderr) ? r.stderr.toString() : '';
        return res;
    };
    /**
     * Used to close child process by sending SIGNINT signal.
     * It allows executed script to have some additional logic on SIGINT, before exiting.
     */
    ToolRunner.prototype.killChildProcess = function () {
        if (this.childProcess) {
            this.childProcess.kill();
        }
    };
    return ToolRunner;
}(events.EventEmitter));
toolrunner.ToolRunner = ToolRunner;
var ExecState = /** @class */ (function (_super) {
    __extends(ExecState, _super);
    function ExecState(options, toolPath) {
        var _this = _super.call(this) || this;
        _this.delay = 10000; // 10 seconds
        _this.timeout = null;
        if (!toolPath) {
            throw new Error('toolPath must not be empty');
        }
        _this.options = options;
        _this.toolPath = toolPath;
        var delay = process.env['TASKLIB_TEST_TOOLRUNNER_EXITDELAY'];
        if (delay) {
            _this.delay = parseInt(delay);
        }
        return _this;
    }
    ExecState.prototype.CheckComplete = function () {
        if (this.done) {
            return;
        }
        if (this.processClosed) {
            this._setResult();
        }
        else if (this.processExited) {
            this.timeout = setTimeout(ExecState.HandleTimeout, this.delay, this);
        }
    };
    ExecState.prototype._debug = function (message) {
        this.emit('debug', message);
    };
    ExecState.prototype._setResult = function () {
        // determine whether there is an error
        var error;
        if (this.processExited) {
            if (this.processError) {
                error = new Error(im._loc('LIB_ProcessError', this.toolPath, this.processError));
            }
            else if (this.processExitCode != 0 && !this.options.ignoreReturnCode) {
                error = new Error(im._loc('LIB_ProcessExitCode', this.toolPath, this.processExitCode));
            }
            else if (this.processStderr && this.options.failOnStdErr) {
                error = new Error(im._loc('LIB_ProcessStderr', this.toolPath));
            }
        }
        // clear the timeout
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.done = true;
        this.emit('done', error, this.processExitCode);
    };
    ExecState.HandleTimeout = function (state) {
        if (state.done) {
            return;
        }
        if (!state.processClosed && state.processExited) {
            console.log(im._loc('LIB_StdioNotClosed', state.delay / 1000, state.toolPath));
            state._debug(im._loc('LIB_StdioNotClosed', state.delay / 1000, state.toolPath));
        }
        state._setResult();
    };
    return ExecState;
}(events.EventEmitter));

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.updateReleaseName = exports.addBuildTag = exports.updateBuildNumber = exports.uploadBuildLog = exports.associateArtifact = exports.uploadArtifact = exports.logIssue = exports.logDetail = exports.setProgress = exports.setEndpoint = exports.addAttachment = exports.uploadSummary = exports.prependPath = exports.uploadFile = exports.CodeCoverageEnabler = exports.CodeCoveragePublisher = exports.TestPublisher = exports.getHttpCertConfiguration = exports.getHttpProxyConfiguration = exports.findMatch = exports.filter = exports.match = exports.tool = exports.execSync = exports.exec = exports.execAsync = exports.rmRF = exports.legacyFindFiles = exports.find = exports.retry = exports.mv = exports.cp = exports.ls = exports.which = exports.resolve = exports.mkdirP = exports.popd = exports.pushd = exports.cd = exports.checkPath = exports.cwd = exports.getAgentMode = exports.getNodeMajorVersion = exports.getPlatform = exports.osType = exports.writeFile = exports.exist = exports.stats = exports.debug = exports.error = exports.warning = exports.command = exports.setTaskVariable = exports.getTaskVariable = exports.getSecureFileTicket = exports.getSecureFileName = exports.getEndpointAuthorization = exports.getEndpointAuthorizationParameterRequired = exports.getEndpointAuthorizationParameter = exports.getEndpointAuthorizationSchemeRequired = exports.getEndpointAuthorizationScheme = exports.getEndpointDataParameterRequired = exports.getEndpointDataParameter = exports.getEndpointUrlRequired = exports.getEndpointUrl = exports.getPathInputRequired = exports.getPathInput = exports.filePathSupplied = exports.getDelimitedInput = exports.getPipelineFeature = exports.getBoolFeatureFlag = exports.getBoolInput = exports.getInputRequired = exports.getInput = exports.setSecret = exports.setVariable = exports.getVariables = exports.assertAgent = exports.getVariable = exports.loc = exports.setResourcePath = exports.setResult = exports.setErrStream = exports.setStdStream = exports.AgentHostedMode = exports.Platform = exports.IssueSource = exports.FieldType = exports.ArtifactType = exports.IssueType = exports.TaskState = exports.TaskResult = void 0;
	var shell = requireShell();
	var childProcess = require$$1$1;
	var fs = require$$1;
	var path = require$$0$1;
	var os = require$$0$2;
	var minimatch = minimatch_1;
	var im = internal;
	var tcm = taskcommand;
	var trm = toolrunner;
	var semver = semverExports$1;
	var TaskResult;
	(function (TaskResult) {
	    TaskResult[TaskResult["Succeeded"] = 0] = "Succeeded";
	    TaskResult[TaskResult["SucceededWithIssues"] = 1] = "SucceededWithIssues";
	    TaskResult[TaskResult["Failed"] = 2] = "Failed";
	    TaskResult[TaskResult["Cancelled"] = 3] = "Cancelled";
	    TaskResult[TaskResult["Skipped"] = 4] = "Skipped";
	})(TaskResult = exports.TaskResult || (exports.TaskResult = {}));
	var TaskState;
	(function (TaskState) {
	    TaskState[TaskState["Unknown"] = 0] = "Unknown";
	    TaskState[TaskState["Initialized"] = 1] = "Initialized";
	    TaskState[TaskState["InProgress"] = 2] = "InProgress";
	    TaskState[TaskState["Completed"] = 3] = "Completed";
	})(TaskState = exports.TaskState || (exports.TaskState = {}));
	var IssueType;
	(function (IssueType) {
	    IssueType[IssueType["Error"] = 0] = "Error";
	    IssueType[IssueType["Warning"] = 1] = "Warning";
	})(IssueType = exports.IssueType || (exports.IssueType = {}));
	var ArtifactType;
	(function (ArtifactType) {
	    ArtifactType[ArtifactType["Container"] = 0] = "Container";
	    ArtifactType[ArtifactType["FilePath"] = 1] = "FilePath";
	    ArtifactType[ArtifactType["VersionControl"] = 2] = "VersionControl";
	    ArtifactType[ArtifactType["GitRef"] = 3] = "GitRef";
	    ArtifactType[ArtifactType["TfvcLabel"] = 4] = "TfvcLabel";
	})(ArtifactType = exports.ArtifactType || (exports.ArtifactType = {}));
	var FieldType;
	(function (FieldType) {
	    FieldType[FieldType["AuthParameter"] = 0] = "AuthParameter";
	    FieldType[FieldType["DataParameter"] = 1] = "DataParameter";
	    FieldType[FieldType["Url"] = 2] = "Url";
	})(FieldType = exports.FieldType || (exports.FieldType = {}));
	exports.IssueSource = im.IssueSource;
	/** Platforms supported by our build agent */
	var Platform;
	(function (Platform) {
	    Platform[Platform["Windows"] = 0] = "Windows";
	    Platform[Platform["MacOS"] = 1] = "MacOS";
	    Platform[Platform["Linux"] = 2] = "Linux";
	})(Platform = exports.Platform || (exports.Platform = {}));
	var AgentHostedMode;
	(function (AgentHostedMode) {
	    AgentHostedMode[AgentHostedMode["Unknown"] = 0] = "Unknown";
	    AgentHostedMode[AgentHostedMode["SelfHosted"] = 1] = "SelfHosted";
	    AgentHostedMode[AgentHostedMode["MsHosted"] = 2] = "MsHosted";
	})(AgentHostedMode = exports.AgentHostedMode || (exports.AgentHostedMode = {}));
	//-----------------------------------------------------
	// General Helpers
	//-----------------------------------------------------
	exports.setStdStream = im._setStdStream;
	exports.setErrStream = im._setErrStream;
	function setResult(result, message, done) {
	    exports.debug('task result: ' + TaskResult[result]);
	    // add an error issue
	    if (result == TaskResult.Failed && message) {
	        exports.error(message, exports.IssueSource.TaskInternal);
	    }
	    else if (result == TaskResult.SucceededWithIssues && message) {
	        exports.warning(message, exports.IssueSource.TaskInternal);
	    }
	    // task.complete
	    var properties = { 'result': TaskResult[result] };
	    if (done) {
	        properties['done'] = 'true';
	    }
	    exports.command('task.complete', properties, message);
	}
	exports.setResult = setResult;
	//
	// Catching all exceptions
	//
	process.on('uncaughtException', function (err) {
	    setResult(TaskResult.Failed, exports.loc('LIB_UnhandledEx', err.message));
	    exports.error(String(err.stack), im.IssueSource.TaskInternal);
	});
	//
	// Catching unhandled rejections from promises and rethrowing them as exceptions
	// For example, a promise that is rejected but not handled by a .catch() handler in node 10 
	// doesn't cause an uncaughtException but causes in Node 16.
	// For types definitions(Error | Any) see https://nodejs.org/docs/latest-v16.x/api/process.html#event-unhandledrejection
	//
	process.on('unhandledRejection', function (reason) {
	    if (reason instanceof Error) {
	        throw reason;
	    }
	    else {
	        throw new Error(reason);
	    }
	});
	//-----------------------------------------------------
	// Loc Helpers
	//-----------------------------------------------------
	exports.setResourcePath = im._setResourcePath;
	exports.loc = im._loc;
	//-----------------------------------------------------
	// Input Helpers
	//-----------------------------------------------------
	exports.getVariable = im._getVariable;
	/**
	 * Asserts the agent version is at least the specified minimum.
	 *
	 * @param    minimum    minimum version version - must be 2.104.1 or higher
	 */
	function assertAgent(minimum) {
	    if (semver.lt(minimum, '2.104.1')) {
	        throw new Error('assertAgent() requires the parameter to be 2.104.1 or higher');
	    }
	    var agent = exports.getVariable('Agent.Version');
	    if (agent && semver.lt(agent, minimum)) {
	        throw new Error("Agent version " + minimum + " or higher is required");
	    }
	}
	exports.assertAgent = assertAgent;
	/**
	 * Gets a snapshot of the current state of all job variables available to the task.
	 * Requires a 2.104.1 agent or higher for full functionality.
	 *
	 * Limitations on an agent prior to 2.104.1:
	 *  1) The return value does not include all public variables. Only public variables
	 *     that have been added using setVariable are returned.
	 *  2) The name returned for each secret variable is the formatted environment variable
	 *     name, not the actual variable name (unless it was set explicitly at runtime using
	 *     setVariable).
	 *
	 * @returns VariableInfo[]
	 */
	function getVariables() {
	    return Object.keys(im._knownVariableMap)
	        .map(function (key) {
	        var info = im._knownVariableMap[key];
	        return { name: info.name, value: exports.getVariable(info.name), secret: info.secret };
	    });
	}
	exports.getVariables = getVariables;
	/**
	 * Sets a variable which will be available to subsequent tasks as well.
	 *
	 * @param     name     name of the variable to set
	 * @param     val      value to set
	 * @param     secret   whether variable is secret.  Multi-line secrets are not allowed.  Optional, defaults to false
	 * @param     isOutput whether variable is an output variable.  Optional, defaults to false
	 * @returns   void
	 */
	function setVariable(name, val, secret, isOutput) {
	    if (secret === void 0) { secret = false; }
	    if (isOutput === void 0) { isOutput = false; }
	    // once a secret always a secret
	    var key = im._getVariableKey(name);
	    if (im._knownVariableMap.hasOwnProperty(key)) {
	        secret = secret || im._knownVariableMap[key].secret;
	    }
	    // store the value
	    var varValue = val || '';
	    exports.debug('set ' + name + '=' + (secret && varValue ? '********' : varValue));
	    if (secret) {
	        if (varValue && varValue.match(/\r|\n/) && ("" + process.env['SYSTEM_UNSAFEALLOWMULTILINESECRET']).toUpperCase() != 'TRUE') {
	            throw new Error(exports.loc('LIB_MultilineSecret'));
	        }
	        im._vault.storeSecret('SECRET_' + key, varValue);
	        delete process.env[key];
	    }
	    else {
	        process.env[key] = varValue;
	    }
	    // store the metadata
	    im._knownVariableMap[key] = { name: name, secret: secret };
	    // write the setvariable command
	    exports.command('task.setvariable', { 'variable': name || '', isOutput: (isOutput || false).toString(), 'issecret': (secret || false).toString() }, varValue);
	}
	exports.setVariable = setVariable;
	/**
	 * Registers a value with the logger, so the value will be masked from the logs.  Multi-line secrets are not allowed.
	 *
	 * @param val value to register
	 */
	function setSecret(val) {
	    if (val) {
	        if (val.match(/\r|\n/) && ("" + process.env['SYSTEM_UNSAFEALLOWMULTILINESECRET']).toUpperCase() !== 'TRUE') {
	            throw new Error(exports.loc('LIB_MultilineSecret'));
	        }
	        exports.command('task.setsecret', {}, val);
	    }
	}
	exports.setSecret = setSecret;
	/**
	 * Gets the value of an input.
	 * If required is true and the value is not set, it will throw.
	 *
	 * @param     name     name of the input to get
	 * @param     required whether input is required.  optional, defaults to false
	 * @returns   string
	 */
	function getInput(name, required) {
	    var inval = im._vault.retrieveSecret('INPUT_' + im._getVariableKey(name));
	    if (required && !inval) {
	        throw new Error(exports.loc('LIB_InputRequired', name));
	    }
	    exports.debug(name + '=' + inval);
	    return inval;
	}
	exports.getInput = getInput;
	/**
	 * Gets the value of an input.
	 * If the value is not set, it will throw.
	 *
	 * @param     name     name of the input to get
	 * @returns   string
	 */
	function getInputRequired(name) {
	    return getInput(name, true);
	}
	exports.getInputRequired = getInputRequired;
	/**
	 * Gets the value of an input and converts to a bool.  Convenience.
	 * If required is true and the value is not set, it will throw.
	 * If required is false and the value is not set, returns false.
	 *
	 * @param     name     name of the bool input to get
	 * @param     required whether input is required.  optional, defaults to false
	 * @returns   boolean
	 */
	function getBoolInput(name, required) {
	    return (getInput(name, required) || '').toUpperCase() == "TRUE";
	}
	exports.getBoolInput = getBoolInput;
	/**
	 * Gets the value of an feature flag and converts to a bool.
	 * @IMPORTANT This method is only for internal Microsoft development. Do not use it for external tasks.
	 * @param     name     name of the feature flag to get.
	 * @param     defaultValue default value of the feature flag in case it's not found in env. (optional. Default value = false)
	 * @returns   boolean
	 * @deprecated Don't use this for new development. Use getPipelineFeature instead.
	 */
	function getBoolFeatureFlag(ffName, defaultValue) {
	    if (defaultValue === void 0) { defaultValue = false; }
	    var ffValue = process.env[ffName];
	    if (!ffValue) {
	        exports.debug("Feature flag " + ffName + " not found. Returning " + defaultValue + " as default.");
	        return defaultValue;
	    }
	    exports.debug("Feature flag " + ffName + " = " + ffValue);
	    return ffValue.toLowerCase() === "true";
	}
	exports.getBoolFeatureFlag = getBoolFeatureFlag;
	/**
	 * Gets the value of an task feature and converts to a bool.
	 * @IMPORTANT This method is only for internal Microsoft development. Do not use it for external tasks.
	 * @param     name     name of the feature to get.
	 * @returns   boolean
	 */
	function getPipelineFeature(featureName) {
	    var variableName = im._getVariableKey("DistributedTask.Tasks." + featureName);
	    var featureValue = process.env[variableName];
	    if (!featureValue) {
	        exports.debug("Feature '" + featureName + "' not found. Returning false as default.");
	        return false;
	    }
	    var boolValue = featureValue.toLowerCase() === "true";
	    exports.debug("Feature '" + featureName + "' = '" + featureValue + "'. Processed as '" + boolValue + "'.");
	    return boolValue;
	}
	exports.getPipelineFeature = getPipelineFeature;
	/**
	 * Gets the value of an input and splits the value using a delimiter (space, comma, etc).
	 * Empty values are removed.  This function is useful for splitting an input containing a simple
	 * list of items - such as build targets.
	 * IMPORTANT: Do not use this function for splitting additional args!  Instead use argString(), which
	 * follows normal argument splitting rules and handles values encapsulated by quotes.
	 * If required is true and the value is not set, it will throw.
	 *
	 * @param     name     name of the input to get
	 * @param     delim    delimiter to split on
	 * @param     required whether input is required.  optional, defaults to false
	 * @returns   string[]
	 */
	function getDelimitedInput(name, delim, required) {
	    var inputVal = getInput(name, required);
	    if (!inputVal) {
	        return [];
	    }
	    var result = [];
	    inputVal.split(delim).forEach(function (x) {
	        if (x) {
	            result.push(x);
	        }
	    });
	    return result;
	}
	exports.getDelimitedInput = getDelimitedInput;
	/**
	 * Checks whether a path inputs value was supplied by the user
	 * File paths are relative with a picker, so an empty path is the root of the repo.
	 * Useful if you need to condition work (like append an arg) if a value was supplied
	 *
	 * @param     name      name of the path input to check
	 * @returns   boolean
	 */
	function filePathSupplied(name) {
	    // normalize paths
	    var pathValue = this.resolve(this.getPathInput(name) || '');
	    var repoRoot = this.resolve(exports.getVariable('build.sourcesDirectory') || exports.getVariable('system.defaultWorkingDirectory') || '');
	    var supplied = pathValue !== repoRoot;
	    exports.debug(name + 'path supplied :' + supplied);
	    return supplied;
	}
	exports.filePathSupplied = filePathSupplied;
	/**
	 * Gets the value of a path input
	 * It will be quoted for you if it isn't already and contains spaces
	 * If required is true and the value is not set, it will throw.
	 * If check is true and the path does not exist, it will throw.
	 *
	 * @param     name      name of the input to get
	 * @param     required  whether input is required.  optional, defaults to false
	 * @param     check     whether path is checked.  optional, defaults to false
	 * @returns   string
	 */
	function getPathInput(name, required, check) {
	    var inval = getInput(name, required);
	    if (inval) {
	        if (check) {
	            exports.checkPath(inval, name);
	        }
	    }
	    return inval;
	}
	exports.getPathInput = getPathInput;
	/**
	 * Gets the value of a path input
	 * It will be quoted for you if it isn't already and contains spaces
	 * If the value is not set, it will throw.
	 * If check is true and the path does not exist, it will throw.
	 *
	 * @param     name      name of the input to get
	 * @param     check     whether path is checked.  optional, defaults to false
	 * @returns   string
	 */
	function getPathInputRequired(name, check) {
	    return getPathInput(name, true, check);
	}
	exports.getPathInputRequired = getPathInputRequired;
	//-----------------------------------------------------
	// Endpoint Helpers
	//-----------------------------------------------------
	/**
	 * Gets the url for a service endpoint
	 * If the url was not set and is not optional, it will throw.
	 *
	 * @param     id        name of the service endpoint
	 * @param     optional  whether the url is optional
	 * @returns   string
	 */
	function getEndpointUrl(id, optional) {
	    var urlval = process.env['ENDPOINT_URL_' + id];
	    if (!optional && !urlval) {
	        throw new Error(exports.loc('LIB_EndpointNotExist', id));
	    }
	    exports.debug(id + '=' + urlval);
	    return urlval;
	}
	exports.getEndpointUrl = getEndpointUrl;
	/**
	 * Gets the url for a service endpoint
	 * If the url was not set, it will throw.
	 *
	 * @param     id        name of the service endpoint
	 * @returns   string
	 */
	function getEndpointUrlRequired(id) {
	    return getEndpointUrl(id, false);
	}
	exports.getEndpointUrlRequired = getEndpointUrlRequired;
	/*
	 * Gets the endpoint data parameter value with specified key for a service endpoint
	 * If the endpoint data parameter was not set and is not optional, it will throw.
	 *
	 * @param id name of the service endpoint
	 * @param key of the parameter
	 * @param optional whether the endpoint data is optional
	 * @returns {string} value of the endpoint data parameter
	 */
	function getEndpointDataParameter(id, key, optional) {
	    var dataParamVal = process.env['ENDPOINT_DATA_' + id + '_' + key.toUpperCase()];
	    if (!optional && !dataParamVal) {
	        throw new Error(exports.loc('LIB_EndpointDataNotExist', id, key));
	    }
	    exports.debug(id + ' data ' + key + ' = ' + dataParamVal);
	    return dataParamVal;
	}
	exports.getEndpointDataParameter = getEndpointDataParameter;
	/*
	 * Gets the endpoint data parameter value with specified key for a service endpoint
	 * If the endpoint data parameter was not set, it will throw.
	 *
	 * @param id name of the service endpoint
	 * @param key of the parameter
	 * @returns {string} value of the endpoint data parameter
	 */
	function getEndpointDataParameterRequired(id, key) {
	    return getEndpointDataParameter(id, key, false);
	}
	exports.getEndpointDataParameterRequired = getEndpointDataParameterRequired;
	/**
	 * Gets the endpoint authorization scheme for a service endpoint
	 * If the endpoint authorization scheme is not set and is not optional, it will throw.
	 *
	 * @param id name of the service endpoint
	 * @param optional whether the endpoint authorization scheme is optional
	 * @returns {string} value of the endpoint authorization scheme
	 */
	function getEndpointAuthorizationScheme(id, optional) {
	    var authScheme = im._vault.retrieveSecret('ENDPOINT_AUTH_SCHEME_' + id);
	    if (!optional && !authScheme) {
	        throw new Error(exports.loc('LIB_EndpointAuthNotExist', id));
	    }
	    exports.debug(id + ' auth scheme = ' + authScheme);
	    return authScheme;
	}
	exports.getEndpointAuthorizationScheme = getEndpointAuthorizationScheme;
	/**
	 * Gets the endpoint authorization scheme for a service endpoint
	 * If the endpoint authorization scheme is not set, it will throw.
	 *
	 * @param id name of the service endpoint
	 * @returns {string} value of the endpoint authorization scheme
	 */
	function getEndpointAuthorizationSchemeRequired(id) {
	    return getEndpointAuthorizationScheme(id, false);
	}
	exports.getEndpointAuthorizationSchemeRequired = getEndpointAuthorizationSchemeRequired;
	/**
	 * Gets the endpoint authorization parameter value for a service endpoint with specified key
	 * If the endpoint authorization parameter is not set and is not optional, it will throw.
	 *
	 * @param id name of the service endpoint
	 * @param key key to find the endpoint authorization parameter
	 * @param optional optional whether the endpoint authorization scheme is optional
	 * @returns {string} value of the endpoint authorization parameter value
	 */
	function getEndpointAuthorizationParameter(id, key, optional) {
	    var authParam = im._vault.retrieveSecret('ENDPOINT_AUTH_PARAMETER_' + id + '_' + key.toUpperCase());
	    if (!optional && !authParam) {
	        throw new Error(exports.loc('LIB_EndpointAuthNotExist', id));
	    }
	    exports.debug(id + ' auth param ' + key + ' = ' + authParam);
	    return authParam;
	}
	exports.getEndpointAuthorizationParameter = getEndpointAuthorizationParameter;
	/**
	 * Gets the endpoint authorization parameter value for a service endpoint with specified key
	 * If the endpoint authorization parameter is not set, it will throw.
	 *
	 * @param id name of the service endpoint
	 * @param key key to find the endpoint authorization parameter
	 * @returns {string} value of the endpoint authorization parameter value
	 */
	function getEndpointAuthorizationParameterRequired(id, key) {
	    return getEndpointAuthorizationParameter(id, key, false);
	}
	exports.getEndpointAuthorizationParameterRequired = getEndpointAuthorizationParameterRequired;
	/**
	 * Gets the authorization details for a service endpoint
	 * If the authorization was not set and is not optional, it will set the task result to Failed.
	 *
	 * @param     id        name of the service endpoint
	 * @param     optional  whether the url is optional
	 * @returns   string
	 */
	function getEndpointAuthorization(id, optional) {
	    var aval = im._vault.retrieveSecret('ENDPOINT_AUTH_' + id);
	    if (!optional && !aval) {
	        setResult(TaskResult.Failed, exports.loc('LIB_EndpointAuthNotExist', id));
	    }
	    exports.debug(id + ' exists ' + (!!aval));
	    var auth;
	    try {
	        if (aval) {
	            auth = JSON.parse(aval);
	        }
	    }
	    catch (err) {
	        throw new Error(exports.loc('LIB_InvalidEndpointAuth', aval));
	    }
	    return auth;
	}
	exports.getEndpointAuthorization = getEndpointAuthorization;
	//-----------------------------------------------------
	// SecureFile Helpers
	//-----------------------------------------------------
	/**
	 * Gets the name for a secure file
	 *
	 * @param     id        secure file id
	 * @returns   string
	 */
	function getSecureFileName(id) {
	    var name = process.env['SECUREFILE_NAME_' + id];
	    exports.debug('secure file name for id ' + id + ' = ' + name);
	    return name;
	}
	exports.getSecureFileName = getSecureFileName;
	/**
	  * Gets the secure file ticket that can be used to download the secure file contents
	  *
	  * @param id name of the secure file
	  * @returns {string} secure file ticket
	  */
	function getSecureFileTicket(id) {
	    var ticket = im._vault.retrieveSecret('SECUREFILE_TICKET_' + id);
	    exports.debug('secure file ticket for id ' + id + ' = ' + ticket);
	    return ticket;
	}
	exports.getSecureFileTicket = getSecureFileTicket;
	//-----------------------------------------------------
	// Task Variable Helpers
	//-----------------------------------------------------
	/**
	 * Gets a variable value that is set by previous step from the same wrapper task.
	 * Requires a 2.115.0 agent or higher.
	 *
	 * @param     name     name of the variable to get
	 * @returns   string
	 */
	function getTaskVariable(name) {
	    assertAgent('2.115.0');
	    var inval = im._vault.retrieveSecret('VSTS_TASKVARIABLE_' + im._getVariableKey(name));
	    if (inval) {
	        inval = inval.trim();
	    }
	    exports.debug('task variable: ' + name + '=' + inval);
	    return inval;
	}
	exports.getTaskVariable = getTaskVariable;
	/**
	 * Sets a task variable which will only be available to subsequent steps belong to the same wrapper task.
	 * Requires a 2.115.0 agent or higher.
	 *
	 * @param     name    name of the variable to set
	 * @param     val     value to set
	 * @param     secret  whether variable is secret.  optional, defaults to false
	 * @returns   void
	 */
	function setTaskVariable(name, val, secret) {
	    if (secret === void 0) { secret = false; }
	    assertAgent('2.115.0');
	    var key = im._getVariableKey(name);
	    // store the value
	    var varValue = val || '';
	    exports.debug('set task variable: ' + name + '=' + (secret && varValue ? '********' : varValue));
	    im._vault.storeSecret('VSTS_TASKVARIABLE_' + key, varValue);
	    delete process.env[key];
	    // write the command
	    exports.command('task.settaskvariable', { 'variable': name || '', 'issecret': (secret || false).toString() }, varValue);
	}
	exports.setTaskVariable = setTaskVariable;
	//-----------------------------------------------------
	// Cmd Helpers
	//-----------------------------------------------------
	exports.command = im._command;
	exports.warning = im._warning;
	exports.error = im._error;
	exports.debug = im._debug;
	//-----------------------------------------------------
	// Disk Functions
	//-----------------------------------------------------
	function _checkShell(cmd, continueOnError) {
	    var se = shell.error();
	    if (se) {
	        exports.debug(cmd + ' failed');
	        var errMsg = exports.loc('LIB_OperationFailed', cmd, se);
	        exports.debug(errMsg);
	        if (!continueOnError) {
	            throw new Error(errMsg);
	        }
	    }
	}
	/**
	 * Get's stat on a path.
	 * Useful for checking whether a file or directory.  Also getting created, modified and accessed time.
	 * see [fs.stat](https://nodejs.org/api/fs.html#fs_class_fs_stats)
	 *
	 * @param     path      path to check
	 * @returns   fsStat
	 */
	function stats(path) {
	    return fs.statSync(path);
	}
	exports.stats = stats;
	exports.exist = im._exist;
	function writeFile(file, data, options) {
	    if (typeof (options) === 'string') {
	        fs.writeFileSync(file, data, { encoding: options });
	    }
	    else {
	        fs.writeFileSync(file, data, options);
	    }
	}
	exports.writeFile = writeFile;
	/**
	 * @deprecated Use `getPlatform`
	 * Useful for determining the host operating system.
	 * see [os.type](https://nodejs.org/api/os.html#os_os_type)
	 *
	 * @return      the name of the operating system
	 */
	function osType() {
	    return os.type();
	}
	exports.osType = osType;
	/**
	 * Determine the operating system the build agent is running on.
	 * @returns {Platform}
	 * @throws {Error} Platform is not supported by our agent
	 */
	function getPlatform() {
	    switch (process.platform) {
	        case 'win32': return Platform.Windows;
	        case 'darwin': return Platform.MacOS;
	        case 'linux': return Platform.Linux;
	        default: throw Error(exports.loc('LIB_PlatformNotSupported', process.platform));
	    }
	}
	exports.getPlatform = getPlatform;
	/**
	 * Resolves major version of Node.js engine used by the agent.
	 * @returns {Number} Node's major version.
	 */
	function getNodeMajorVersion() {
	    var _a;
	    var version = (_a = process === null || process === void 0 ? void 0 : process.versions) === null || _a === void 0 ? void 0 : _a.node;
	    if (!version) {
	        throw new Error(exports.loc('LIB_UndefinedNodeVersion'));
	    }
	    var parts = version.split('.').map(Number);
	    if (parts.length < 1) {
	        return NaN;
	    }
	    return parts[0];
	}
	exports.getNodeMajorVersion = getNodeMajorVersion;
	/**
	 * Return hosted type of Agent
	 * @returns {AgentHostedMode}
	 */
	function getAgentMode() {
	    var agentCloudId = exports.getVariable('Agent.CloudId');
	    if (agentCloudId === undefined)
	        return AgentHostedMode.Unknown;
	    if (agentCloudId)
	        return AgentHostedMode.MsHosted;
	    return AgentHostedMode.SelfHosted;
	}
	exports.getAgentMode = getAgentMode;
	/**
	 * Returns the process's current working directory.
	 * see [process.cwd](https://nodejs.org/api/process.html#process_process_cwd)
	 *
	 * @return      the path to the current working directory of the process
	 */
	function cwd() {
	    return process.cwd();
	}
	exports.cwd = cwd;
	exports.checkPath = im._checkPath;
	/**
	 * Change working directory.
	 *
	 * @param     path      new working directory path
	 * @returns   void
	 */
	function cd(path) {
	    if (path) {
	        shell.cd(path);
	        _checkShell('cd');
	    }
	}
	exports.cd = cd;
	/**
	 * Change working directory and push it on the stack
	 *
	 * @param     path      new working directory path
	 * @returns   void
	 */
	function pushd(path) {
	    shell.pushd(path);
	    _checkShell('pushd');
	}
	exports.pushd = pushd;
	/**
	 * Change working directory back to previously pushed directory
	 *
	 * @returns   void
	 */
	function popd() {
	    shell.popd();
	    _checkShell('popd');
	}
	exports.popd = popd;
	/**
	 * Make a directory.  Creates the full path with folders in between
	 * Will throw if it fails
	 *
	 * @param     p       path to create
	 * @returns   void
	 */
	function mkdirP(p) {
	    if (!p) {
	        throw new Error(exports.loc('LIB_ParameterIsRequired', 'p'));
	    }
	    // build a stack of directories to create
	    var stack = [];
	    var testDir = p;
	    while (true) {
	        // validate the loop is not out of control
	        if (stack.length >= Number(process.env['TASKLIB_TEST_MKDIRP_FAILSAFE'] || 1000)) {
	            // let the framework throw
	            exports.debug('loop is out of control');
	            fs.mkdirSync(p);
	            return;
	        }
	        exports.debug("testing directory '" + testDir + "'");
	        var stats_1 = void 0;
	        try {
	            stats_1 = fs.statSync(testDir);
	        }
	        catch (err) {
	            if (err.code == 'ENOENT') {
	                // validate the directory is not the drive root
	                var parentDir = path.dirname(testDir);
	                if (testDir == parentDir) {
	                    throw new Error(exports.loc('LIB_MkdirFailedInvalidDriveRoot', p, testDir)); // Unable to create directory '{p}'. Root directory does not exist: '{testDir}'
	                }
	                // push the dir and test the parent
	                stack.push(testDir);
	                testDir = parentDir;
	                continue;
	            }
	            else if (err.code == 'UNKNOWN') {
	                throw new Error(exports.loc('LIB_MkdirFailedInvalidShare', p, testDir)); // Unable to create directory '{p}'. Unable to verify the directory exists: '{testDir}'. If directory is a file share, please verify the share name is correct, the share is online, and the current process has permission to access the share.
	            }
	            else {
	                throw err;
	            }
	        }
	        if (!stats_1.isDirectory()) {
	            throw new Error(exports.loc('LIB_MkdirFailedFileExists', p, testDir)); // Unable to create directory '{p}'. Conflicting file exists: '{testDir}'
	        }
	        // testDir exists
	        break;
	    }
	    // create each directory
	    while (stack.length) {
	        var dir = stack.pop(); // non-null because `stack.length` was truthy
	        exports.debug("mkdir '" + dir + "'");
	        try {
	            fs.mkdirSync(dir);
	        }
	        catch (err) {
	            throw new Error(exports.loc('LIB_MkdirFailed', p, err.message)); // Unable to create directory '{p}'. {err.message}
	        }
	    }
	}
	exports.mkdirP = mkdirP;
	/**
	 * Resolves a sequence of paths or path segments into an absolute path.
	 * Calls node.js path.resolve()
	 * Allows L0 testing with consistent path formats on Mac/Linux and Windows in the mock implementation
	 * @param pathSegments
	 * @returns {string}
	 */
	function resolve() {
	    var pathSegments = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        pathSegments[_i] = arguments[_i];
	    }
	    var absolutePath = path.resolve.apply(this, pathSegments);
	    exports.debug('Absolute path for pathSegments: ' + pathSegments + ' = ' + absolutePath);
	    return absolutePath;
	}
	exports.resolve = resolve;
	exports.which = im._which;
	/**
	 * Returns array of files in the given path, or in current directory if no path provided.  See shelljs.ls
	 * @param  {string}   options  Available options: -R (recursive), -A (all files, include files beginning with ., except for . and ..)
	 * @param  {string[]} paths    Paths to search.
	 * @return {string[]}          An array of files in the given path(s).
	 */
	function ls(options, paths) {
	    if (options) {
	        return shell.ls(options, paths);
	    }
	    else {
	        return shell.ls(paths);
	    }
	}
	exports.ls = ls;
	/**
	 * Copies a file or folder.
	 *
	 * @param     source     source path
	 * @param     dest       destination path
	 * @param     options    string -r, -f or -rf for recursive and force
	 * @param     continueOnError optional. whether to continue on error
	 * @param     retryCount optional. Retry count to copy the file. It might help to resolve intermittent issues e.g. with UNC target paths on a remote host.
	 */
	function cp(source, dest, options, continueOnError, retryCount) {
	    if (retryCount === void 0) { retryCount = 0; }
	    while (retryCount >= 0) {
	        try {
	            if (options) {
	                shell.cp(options, source, dest);
	            }
	            else {
	                shell.cp(source, dest);
	            }
	            _checkShell('cp', false);
	            break;
	        }
	        catch (e) {
	            if (retryCount <= 0) {
	                if (continueOnError) {
	                    exports.warning(e, exports.IssueSource.TaskInternal);
	                    break;
	                }
	                else {
	                    throw e;
	                }
	            }
	            else {
	                console.log(exports.loc('LIB_CopyFileFailed', retryCount));
	                retryCount--;
	            }
	        }
	    }
	}
	exports.cp = cp;
	/**
	 * Moves a path.
	 *
	 * @param     source     source path
	 * @param     dest       destination path
	 * @param     options    string -f or -n for force and no clobber
	 * @param     continueOnError optional. whether to continue on error
	 */
	function mv(source, dest, options, continueOnError) {
	    if (options) {
	        shell.mv(options, source, dest);
	    }
	    else {
	        shell.mv(source, dest);
	    }
	    _checkShell('mv', continueOnError);
	}
	exports.mv = mv;
	/**
	 * Tries to execute a function a specified number of times.
	 *
	 * @param   func            a function to be executed.
	 * @param   args            executed function arguments array.
	 * @param   retryOptions    optional. Defaults to { continueOnError: false, retryCount: 0 }.
	 * @returns the same as the usual function.
	 */
	function retry(func, args, retryOptions) {
	    if (retryOptions === void 0) { retryOptions = { continueOnError: false, retryCount: 0 }; }
	    while (retryOptions.retryCount >= 0) {
	        try {
	            return func.apply(void 0, args);
	        }
	        catch (e) {
	            if (retryOptions.retryCount <= 0) {
	                if (retryOptions.continueOnError) {
	                    exports.warning(e, exports.IssueSource.TaskInternal);
	                    break;
	                }
	                else {
	                    throw e;
	                }
	            }
	            else {
	                exports.debug("Attempt to execute function \"" + (func === null || func === void 0 ? void 0 : func.name) + "\" failed, retries left: " + retryOptions.retryCount);
	                retryOptions.retryCount--;
	            }
	        }
	    }
	}
	exports.retry = retry;
	/**
	 * Gets info about item stats.
	 *
	 * @param path                      a path to the item to be processed.
	 * @param followSymbolicLink        indicates whether to traverse descendants of symbolic link directories.
	 * @param allowBrokenSymbolicLinks  when true, broken symbolic link will not cause an error.
	 * @returns fs.Stats
	 */
	function _getStats(path, followSymbolicLink, allowBrokenSymbolicLinks) {
	    // stat returns info about the target of a symlink (or symlink chain),
	    // lstat returns info about a symlink itself
	    var stats;
	    if (followSymbolicLink) {
	        try {
	            // use stat (following symlinks)
	            stats = fs.statSync(path);
	        }
	        catch (err) {
	            if (err.code == 'ENOENT' && allowBrokenSymbolicLinks) {
	                // fallback to lstat (broken symlinks allowed)
	                stats = fs.lstatSync(path);
	                exports.debug("  " + path + " (broken symlink)");
	            }
	            else {
	                throw err;
	            }
	        }
	    }
	    else {
	        // use lstat (not following symlinks)
	        stats = fs.lstatSync(path);
	    }
	    return stats;
	}
	/**
	 * Recursively finds all paths a given path. Returns an array of paths.
	 *
	 * @param     findPath  path to search
	 * @param     options   optional. defaults to { followSymbolicLinks: true }. following soft links is generally appropriate unless deleting files.
	 * @returns   string[]
	 */
	function find(findPath, options) {
	    if (!findPath) {
	        exports.debug('no path specified');
	        return [];
	    }
	    // normalize the path, otherwise the first result is inconsistently formatted from the rest of the results
	    // because path.join() performs normalization.
	    findPath = path.normalize(findPath);
	    // debug trace the parameters
	    exports.debug("findPath: '" + findPath + "'");
	    options = options || _getDefaultFindOptions();
	    _debugFindOptions(options);
	    // return empty if not exists
	    try {
	        fs.lstatSync(findPath);
	    }
	    catch (err) {
	        if (err.code == 'ENOENT') {
	            exports.debug('0 results');
	            return [];
	        }
	        throw err;
	    }
	    try {
	        var result = [];
	        // push the first item
	        var stack = [new _FindItem(findPath, 1)];
	        var traversalChain = []; // used to detect cycles
	        var _loop_1 = function () {
	            // pop the next item and push to the result array
	            var item = stack.pop(); // non-null because `stack.length` was truthy
	            var stats_2 = void 0;
	            try {
	                // `item.path` equals `findPath` for the first item to be processed, when the `result` array is empty
	                var isPathToSearch = !result.length;
	                // following specified symlinks only if current path equals specified path
	                var followSpecifiedSymbolicLink = options.followSpecifiedSymbolicLink && isPathToSearch;
	                // following all symlinks or following symlink for the specified path
	                var followSymbolicLink = options.followSymbolicLinks || followSpecifiedSymbolicLink;
	                // stat the item. The stat info is used further below to determine whether to traverse deeper
	                stats_2 = _getStats(item.path, followSymbolicLink, options.allowBrokenSymbolicLinks);
	            }
	            catch (err) {
	                if (err.code == 'ENOENT' && options.skipMissingFiles) {
	                    exports.warning("No such file or directory: \"" + item.path + "\" - skipping.", exports.IssueSource.TaskInternal);
	                    return "continue";
	                }
	                throw err;
	            }
	            result.push(item.path);
	            // note, isDirectory() returns false for the lstat of a symlink
	            if (stats_2.isDirectory()) {
	                exports.debug("  " + item.path + " (directory)");
	                if (options.followSymbolicLinks) {
	                    // get the realpath
	                    var realPath_1;
	                    if (im._isUncPath(item.path)) {
	                        // Sometimes there are spontaneous issues when working with unc-paths, so retries have been added for them.
	                        realPath_1 = retry(fs.realpathSync, [item.path], { continueOnError: false, retryCount: 5 });
	                    }
	                    else {
	                        realPath_1 = fs.realpathSync(item.path);
	                    }
	                    // fixup the traversal chain to match the item level
	                    while (traversalChain.length >= item.level) {
	                        traversalChain.pop();
	                    }
	                    // test for a cycle
	                    if (traversalChain.some(function (x) { return x == realPath_1; })) {
	                        exports.debug('    cycle detected');
	                        return "continue";
	                    }
	                    // update the traversal chain
	                    traversalChain.push(realPath_1);
	                }
	                // push the child items in reverse onto the stack
	                var childLevel_1 = item.level + 1;
	                var childItems = fs.readdirSync(item.path)
	                    .map(function (childName) { return new _FindItem(path.join(item.path, childName), childLevel_1); });
	                for (var i = childItems.length - 1; i >= 0; i--) {
	                    stack.push(childItems[i]);
	                }
	            }
	            else {
	                exports.debug("  " + item.path + " (file)");
	            }
	        };
	        while (stack.length) {
	            _loop_1();
	        }
	        exports.debug(result.length + " results");
	        return result;
	    }
	    catch (err) {
	        throw new Error(exports.loc('LIB_OperationFailed', 'find', err.message));
	    }
	}
	exports.find = find;
	var _FindItem = /** @class */ (function () {
	    function _FindItem(path, level) {
	        this.path = path;
	        this.level = level;
	    }
	    return _FindItem;
	}());
	function _debugFindOptions(options) {
	    exports.debug("findOptions.allowBrokenSymbolicLinks: '" + options.allowBrokenSymbolicLinks + "'");
	    exports.debug("findOptions.followSpecifiedSymbolicLink: '" + options.followSpecifiedSymbolicLink + "'");
	    exports.debug("findOptions.followSymbolicLinks: '" + options.followSymbolicLinks + "'");
	    exports.debug("findOptions.skipMissingFiles: '" + options.skipMissingFiles + "'");
	}
	function _getDefaultFindOptions() {
	    return {
	        allowBrokenSymbolicLinks: false,
	        followSpecifiedSymbolicLink: true,
	        followSymbolicLinks: true,
	        skipMissingFiles: false
	    };
	}
	/**
	 * Prefer tl.find() and tl.match() instead. This function is for backward compatibility
	 * when porting tasks to Node from the PowerShell or PowerShell3 execution handler.
	 *
	 * @param    rootDirectory      path to root unrooted patterns with
	 * @param    pattern            include and exclude patterns
	 * @param    includeFiles       whether to include files in the result. defaults to true when includeFiles and includeDirectories are both false
	 * @param    includeDirectories whether to include directories in the result
	 * @returns  string[]
	 */
	function legacyFindFiles(rootDirectory, pattern, includeFiles, includeDirectories) {
	    if (!pattern) {
	        throw new Error('pattern parameter cannot be empty');
	    }
	    exports.debug("legacyFindFiles rootDirectory: '" + rootDirectory + "'");
	    exports.debug("pattern: '" + pattern + "'");
	    exports.debug("includeFiles: '" + includeFiles + "'");
	    exports.debug("includeDirectories: '" + includeDirectories + "'");
	    if (!includeFiles && !includeDirectories) {
	        includeFiles = true;
	    }
	    // organize the patterns into include patterns and exclude patterns
	    var includePatterns = [];
	    var excludePatterns = [];
	    pattern = pattern.replace(/;;/g, '\0');
	    for (var _i = 0, _a = pattern.split(';'); _i < _a.length; _i++) {
	        var pat = _a[_i];
	        if (!pat) {
	            continue;
	        }
	        pat = pat.replace(/\0/g, ';');
	        // determine whether include pattern and remove any include/exclude prefix.
	        // include patterns start with +: or anything other than -:
	        // exclude patterns start with -:
	        var isIncludePattern = void 0;
	        if (im._startsWith(pat, '+:')) {
	            pat = pat.substring(2);
	            isIncludePattern = true;
	        }
	        else if (im._startsWith(pat, '-:')) {
	            pat = pat.substring(2);
	            isIncludePattern = false;
	        }
	        else {
	            isIncludePattern = true;
	        }
	        // validate pattern does not end with a slash
	        if (im._endsWith(pat, '/') || (process.platform == 'win32' && im._endsWith(pat, '\\'))) {
	            throw new Error(exports.loc('LIB_InvalidPattern', pat));
	        }
	        // root the pattern
	        if (rootDirectory && !path.isAbsolute(pat)) {
	            pat = path.join(rootDirectory, pat);
	            // remove trailing slash sometimes added by path.join() on Windows, e.g.
	            //      path.join('\\\\hello', 'world') => '\\\\hello\\world\\'
	            //      path.join('//hello', 'world') => '\\\\hello\\world\\'
	            if (im._endsWith(pat, '\\')) {
	                pat = pat.substring(0, pat.length - 1);
	            }
	        }
	        if (isIncludePattern) {
	            includePatterns.push(pat);
	        }
	        else {
	            excludePatterns.push(im._legacyFindFiles_convertPatternToRegExp(pat));
	        }
	    }
	    var result = _legacyFindFiles_getMatchingItems(includePatterns, excludePatterns, !!includeFiles, !!includeDirectories);
	    exports.debug('all matches:');
	    for (var _b = 0, result_1 = result; _b < result_1.length; _b++) {
	        var resultItem = result_1[_b];
	        exports.debug(' ' + resultItem);
	    }
	    exports.debug('total matched: ' + result.length);
	    return result;
	}
	exports.legacyFindFiles = legacyFindFiles;
	function _legacyFindFiles_getMatchingItems(includePatterns, excludePatterns, includeFiles, includeDirectories) {
	    exports.debug('getMatchingItems()');
	    for (var _i = 0, includePatterns_1 = includePatterns; _i < includePatterns_1.length; _i++) {
	        var pattern = includePatterns_1[_i];
	        exports.debug("includePattern: '" + pattern + "'");
	    }
	    for (var _a = 0, excludePatterns_1 = excludePatterns; _a < excludePatterns_1.length; _a++) {
	        var pattern = excludePatterns_1[_a];
	        exports.debug("excludePattern: " + pattern);
	    }
	    exports.debug('includeFiles: ' + includeFiles);
	    exports.debug('includeDirectories: ' + includeDirectories);
	    var allFiles = {};
	    var _loop_2 = function (pattern) {
	        // determine the directory to search
	        //
	        // note, getDirectoryName removes redundant path separators
	        var findPath = void 0;
	        var starIndex = pattern.indexOf('*');
	        var questionIndex = pattern.indexOf('?');
	        if (starIndex < 0 && questionIndex < 0) {
	            // if no wildcards are found, use the directory name portion of the path.
	            // if there is no directory name (file name only in pattern or drive root),
	            // this will return empty string.
	            findPath = im._getDirectoryName(pattern);
	        }
	        else {
	            // extract the directory prior to the first wildcard
	            var index = Math.min(starIndex >= 0 ? starIndex : questionIndex, questionIndex >= 0 ? questionIndex : starIndex);
	            findPath = im._getDirectoryName(pattern.substring(0, index));
	        }
	        // note, due to this short-circuit and the above usage of getDirectoryName, this
	        // function has the same limitations regarding drive roots as the powershell
	        // implementation.
	        //
	        // also note, since getDirectoryName eliminates slash redundancies, some additional
	        // work may be required if removal of this limitation is attempted.
	        if (!findPath) {
	            return "continue";
	        }
	        var patternRegex = im._legacyFindFiles_convertPatternToRegExp(pattern);
	        // find files/directories
	        find(findPath, { followSymbolicLinks: true })
	            .filter(function (item) {
	            if (includeFiles && includeDirectories) {
	                return true;
	            }
	            var isDir = fs.statSync(item).isDirectory();
	            return (includeFiles && !isDir) || (includeDirectories && isDir);
	        })
	            .forEach(function (item) {
	            var normalizedPath = process.platform == 'win32' ? item.replace(/\\/g, '/') : item; // normalize separators
	            // **/times/** will not match C:/fun/times because there isn't a trailing slash
	            // so try both if including directories
	            var alternatePath = normalizedPath + "/"; // potential bug: it looks like this will result in a false
	            // positive if the item is a regular file and not a directory
	            var isMatch = false;
	            if (patternRegex.test(normalizedPath) || (includeDirectories && patternRegex.test(alternatePath))) {
	                isMatch = true;
	                // test whether the path should be excluded
	                for (var _i = 0, excludePatterns_2 = excludePatterns; _i < excludePatterns_2.length; _i++) {
	                    var regex = excludePatterns_2[_i];
	                    if (regex.test(normalizedPath) || (includeDirectories && regex.test(alternatePath))) {
	                        isMatch = false;
	                        break;
	                    }
	                }
	            }
	            if (isMatch) {
	                allFiles[item] = item;
	            }
	        });
	    };
	    for (var _b = 0, includePatterns_2 = includePatterns; _b < includePatterns_2.length; _b++) {
	        var pattern = includePatterns_2[_b];
	        _loop_2(pattern);
	    }
	    return Object.keys(allFiles).sort();
	}
	/**
	 * Remove a path recursively with force
	 *
	 * @param     inputPath path to remove
	 * @throws    when the file or directory exists but could not be deleted.
	 */
	function rmRF(inputPath) {
	    exports.debug('rm -rf ' + inputPath);
	    if (getPlatform() == Platform.Windows) {
	        // Node doesn't provide a delete operation, only an unlink function. This means that if the file is being used by another
	        // program (e.g. antivirus), it won't be deleted. To address this, we shell out the work to rd/del.
	        try {
	            if (fs.statSync(inputPath).isDirectory()) {
	                exports.debug('removing directory ' + inputPath);
	                childProcess.execSync("rd /s /q \"" + inputPath + "\"");
	            }
	            else {
	                exports.debug('removing file ' + inputPath);
	                childProcess.execSync("del /f /a \"" + inputPath + "\"");
	            }
	        }
	        catch (err) {
	            // if you try to delete a file that doesn't exist, desired result is achieved
	            // other errors are valid
	            if (err.code != 'ENOENT') {
	                throw new Error(exports.loc('LIB_OperationFailed', 'rmRF', err.message));
	            }
	        }
	        // Shelling out fails to remove a symlink folder with missing source, this unlink catches that
	        try {
	            fs.unlinkSync(inputPath);
	        }
	        catch (err) {
	            // if you try to delete a file that doesn't exist, desired result is achieved
	            // other errors are valid
	            if (err.code != 'ENOENT') {
	                throw new Error(exports.loc('LIB_OperationFailed', 'rmRF', err.message));
	            }
	        }
	    }
	    else {
	        // get the lstats in order to workaround a bug in shelljs@0.3.0 where symlinks
	        // with missing targets are not handled correctly by "rm('-rf', path)"
	        var lstats = void 0;
	        try {
	            lstats = fs.lstatSync(inputPath);
	        }
	        catch (err) {
	            // if you try to delete a file that doesn't exist, desired result is achieved
	            // other errors are valid
	            if (err.code == 'ENOENT') {
	                return;
	            }
	            throw new Error(exports.loc('LIB_OperationFailed', 'rmRF', err.message));
	        }
	        if (lstats.isDirectory()) {
	            exports.debug('removing directory');
	            shell.rm('-rf', inputPath);
	            var errMsg = shell.error();
	            if (errMsg) {
	                throw new Error(exports.loc('LIB_OperationFailed', 'rmRF', errMsg));
	            }
	            return;
	        }
	        exports.debug('removing file');
	        try {
	            fs.unlinkSync(inputPath);
	        }
	        catch (err) {
	            throw new Error(exports.loc('LIB_OperationFailed', 'rmRF', err.message));
	        }
	    }
	}
	exports.rmRF = rmRF;
	/**
	 * Exec a tool.  Convenience wrapper over ToolRunner to exec with args in one call.
	 * Output will be streamed to the live console.
	 * Returns promise with return code
	 *
	 * @param     tool     path to tool to exec
	 * @param     args     an arg string or array of args
	 * @param     options  optional exec options.  See IExecOptions
	 * @returns   number
	 */
	function execAsync(tool, args, options) {
	    var tr = this.tool(tool);
	    tr.on('debug', function (data) {
	        exports.debug(data);
	    });
	    if (args) {
	        if (args instanceof Array) {
	            tr.arg(args);
	        }
	        else if (typeof (args) === 'string') {
	            tr.line(args);
	        }
	    }
	    return tr.execAsync(options);
	}
	exports.execAsync = execAsync;
	/**
	 * Exec a tool.  Convenience wrapper over ToolRunner to exec with args in one call.
	 * Output will be streamed to the live console.
	 * Returns promise with return code
	 *
	 * @deprecated Use the {@link execAsync} method that returns a native Javascript Promise instead
	 * @param     tool     path to tool to exec
	 * @param     args     an arg string or array of args
	 * @param     options  optional exec options.  See IExecOptions
	 * @returns   number
	 */
	function exec(tool, args, options) {
	    var tr = this.tool(tool);
	    tr.on('debug', function (data) {
	        exports.debug(data);
	    });
	    if (args) {
	        if (args instanceof Array) {
	            tr.arg(args);
	        }
	        else if (typeof (args) === 'string') {
	            tr.line(args);
	        }
	    }
	    return tr.exec(options);
	}
	exports.exec = exec;
	/**
	 * Exec a tool synchronously.  Convenience wrapper over ToolRunner to execSync with args in one call.
	 * Output will be *not* be streamed to the live console.  It will be returned after execution is complete.
	 * Appropriate for short running tools
	 * Returns IExecResult with output and return code
	 *
	 * @param     tool     path to tool to exec
	 * @param     args     an arg string or array of args
	 * @param     options  optional exec options.  See IExecSyncOptions
	 * @returns   IExecSyncResult
	 */
	function execSync(tool, args, options) {
	    var tr = this.tool(tool);
	    tr.on('debug', function (data) {
	        exports.debug(data);
	    });
	    if (args) {
	        if (args instanceof Array) {
	            tr.arg(args);
	        }
	        else if (typeof (args) === 'string') {
	            tr.line(args);
	        }
	    }
	    return tr.execSync(options);
	}
	exports.execSync = execSync;
	/**
	 * Convenience factory to create a ToolRunner.
	 *
	 * @param     tool     path to tool to exec
	 * @returns   ToolRunner
	 */
	function tool(tool) {
	    var tr = new trm.ToolRunner(tool);
	    tr.on('debug', function (message) {
	        exports.debug(message);
	    });
	    return tr;
	}
	exports.tool = tool;
	/**
	 * Applies glob patterns to a list of paths. Supports interleaved exclude patterns.
	 *
	 * @param  list         array of paths
	 * @param  patterns     patterns to apply. supports interleaved exclude patterns.
	 * @param  patternRoot  optional. default root to apply to unrooted patterns. not applied to basename-only patterns when matchBase:true.
	 * @param  options      optional. defaults to { dot: true, nobrace: true, nocase: process.platform == 'win32' }.
	 */
	function match(list, patterns, patternRoot, options) {
	    // trace parameters
	    exports.debug("patternRoot: '" + patternRoot + "'");
	    options = options || _getDefaultMatchOptions(); // default match options
	    _debugMatchOptions(options);
	    // convert pattern to an array
	    if (typeof patterns == 'string') {
	        patterns = [patterns];
	    }
	    // hashtable to keep track of matches
	    var map = {};
	    var originalOptions = options;
	    for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
	        var pattern = patterns_1[_i];
	        exports.debug("pattern: '" + pattern + "'");
	        // trim and skip empty
	        pattern = (pattern || '').trim();
	        if (!pattern) {
	            exports.debug('skipping empty pattern');
	            continue;
	        }
	        // clone match options
	        var options_1 = im._cloneMatchOptions(originalOptions);
	        // skip comments
	        if (!options_1.nocomment && im._startsWith(pattern, '#')) {
	            exports.debug('skipping comment');
	            continue;
	        }
	        // set nocomment - brace expansion could result in a leading '#'
	        options_1.nocomment = true;
	        // determine whether pattern is include or exclude
	        var negateCount = 0;
	        if (!options_1.nonegate) {
	            while (pattern.charAt(negateCount) == '!') {
	                negateCount++;
	            }
	            pattern = pattern.substring(negateCount); // trim leading '!'
	            if (negateCount) {
	                exports.debug("trimmed leading '!'. pattern: '" + pattern + "'");
	            }
	        }
	        var isIncludePattern = negateCount == 0 ||
	            (negateCount % 2 == 0 && !options_1.flipNegate) ||
	            (negateCount % 2 == 1 && options_1.flipNegate);
	        // set nonegate - brace expansion could result in a leading '!'
	        options_1.nonegate = true;
	        options_1.flipNegate = false;
	        // expand braces - required to accurately root patterns
	        var expanded = void 0;
	        var preExpanded = pattern;
	        if (options_1.nobrace) {
	            expanded = [pattern];
	        }
	        else {
	            // convert slashes on Windows before calling braceExpand(). unfortunately this means braces cannot
	            // be escaped on Windows, this limitation is consistent with current limitations of minimatch (3.0.3).
	            exports.debug('expanding braces');
	            var convertedPattern = process.platform == 'win32' ? pattern.replace(/\\/g, '/') : pattern;
	            expanded = minimatch.braceExpand(convertedPattern);
	        }
	        // set nobrace
	        options_1.nobrace = true;
	        for (var _a = 0, expanded_1 = expanded; _a < expanded_1.length; _a++) {
	            var pattern_1 = expanded_1[_a];
	            if (expanded.length != 1 || pattern_1 != preExpanded) {
	                exports.debug("pattern: '" + pattern_1 + "'");
	            }
	            // trim and skip empty
	            pattern_1 = (pattern_1 || '').trim();
	            if (!pattern_1) {
	                exports.debug('skipping empty pattern');
	                continue;
	            }
	            // root the pattern when all of the following conditions are true:
	            if (patternRoot && // patternRoot supplied
	                !im._isRooted(pattern_1) && // AND pattern not rooted
	                // AND matchBase:false or not basename only
	                (!options_1.matchBase || (process.platform == 'win32' ? pattern_1.replace(/\\/g, '/') : pattern_1).indexOf('/') >= 0)) {
	                pattern_1 = im._ensureRooted(patternRoot, pattern_1);
	                exports.debug("rooted pattern: '" + pattern_1 + "'");
	            }
	            if (isIncludePattern) {
	                // apply the pattern
	                exports.debug('applying include pattern against original list');
	                var matchResults = minimatch.match(list, pattern_1, options_1);
	                exports.debug(matchResults.length + ' matches');
	                // union the results
	                for (var _b = 0, matchResults_1 = matchResults; _b < matchResults_1.length; _b++) {
	                    var matchResult = matchResults_1[_b];
	                    map[matchResult] = true;
	                }
	            }
	            else {
	                // apply the pattern
	                exports.debug('applying exclude pattern against original list');
	                var matchResults = minimatch.match(list, pattern_1, options_1);
	                exports.debug(matchResults.length + ' matches');
	                // substract the results
	                for (var _c = 0, matchResults_2 = matchResults; _c < matchResults_2.length; _c++) {
	                    var matchResult = matchResults_2[_c];
	                    delete map[matchResult];
	                }
	            }
	        }
	    }
	    // return a filtered version of the original list (preserves order and prevents duplication)
	    var result = list.filter(function (item) { return map.hasOwnProperty(item); });
	    exports.debug(result.length + ' final results');
	    return result;
	}
	exports.match = match;
	/**
	 * Filter to apply glob patterns
	 *
	 * @param  pattern  pattern to apply
	 * @param  options  optional. defaults to { dot: true, nobrace: true, nocase: process.platform == 'win32' }.
	 */
	function filter(pattern, options) {
	    options = options || _getDefaultMatchOptions();
	    return minimatch.filter(pattern, options);
	}
	exports.filter = filter;
	function _debugMatchOptions(options) {
	    exports.debug("matchOptions.debug: '" + options.debug + "'");
	    exports.debug("matchOptions.nobrace: '" + options.nobrace + "'");
	    exports.debug("matchOptions.noglobstar: '" + options.noglobstar + "'");
	    exports.debug("matchOptions.dot: '" + options.dot + "'");
	    exports.debug("matchOptions.noext: '" + options.noext + "'");
	    exports.debug("matchOptions.nocase: '" + options.nocase + "'");
	    exports.debug("matchOptions.nonull: '" + options.nonull + "'");
	    exports.debug("matchOptions.matchBase: '" + options.matchBase + "'");
	    exports.debug("matchOptions.nocomment: '" + options.nocomment + "'");
	    exports.debug("matchOptions.nonegate: '" + options.nonegate + "'");
	    exports.debug("matchOptions.flipNegate: '" + options.flipNegate + "'");
	}
	function _getDefaultMatchOptions() {
	    return {
	        debug: false,
	        nobrace: true,
	        noglobstar: false,
	        dot: true,
	        noext: false,
	        nocase: process.platform == 'win32',
	        nonull: false,
	        matchBase: false,
	        nocomment: false,
	        nonegate: false,
	        flipNegate: false
	    };
	}
	/**
	 * Determines the find root from a list of patterns. Performs the find and then applies the glob patterns.
	 * Supports interleaved exclude patterns. Unrooted patterns are rooted using defaultRoot, unless
	 * matchOptions.matchBase is specified and the pattern is a basename only. For matchBase cases, the
	 * defaultRoot is used as the find root.
	 *
	 * @param  defaultRoot   default path to root unrooted patterns. falls back to System.DefaultWorkingDirectory or process.cwd().
	 * @param  patterns      pattern or array of patterns to apply
	 * @param  findOptions   defaults to { followSymbolicLinks: true }. following soft links is generally appropriate unless deleting files.
	 * @param  matchOptions  defaults to { dot: true, nobrace: true, nocase: process.platform == 'win32' }
	 */
	function findMatch(defaultRoot, patterns, findOptions, matchOptions) {
	    // apply defaults for parameters and trace
	    defaultRoot = defaultRoot || this.getVariable('system.defaultWorkingDirectory') || process.cwd();
	    exports.debug("defaultRoot: '" + defaultRoot + "'");
	    patterns = patterns || [];
	    patterns = typeof patterns == 'string' ? [patterns] : patterns;
	    findOptions = findOptions || _getDefaultFindOptions();
	    _debugFindOptions(findOptions);
	    matchOptions = matchOptions || _getDefaultMatchOptions();
	    _debugMatchOptions(matchOptions);
	    // normalize slashes for root dir
	    defaultRoot = im._normalizeSeparators(defaultRoot);
	    var results = {};
	    var originalMatchOptions = matchOptions;
	    for (var _i = 0, _a = (patterns || []); _i < _a.length; _i++) {
	        var pattern = _a[_i];
	        exports.debug("pattern: '" + pattern + "'");
	        // trim and skip empty
	        pattern = (pattern || '').trim();
	        if (!pattern) {
	            exports.debug('skipping empty pattern');
	            continue;
	        }
	        // clone match options
	        var matchOptions_1 = im._cloneMatchOptions(originalMatchOptions);
	        // skip comments
	        if (!matchOptions_1.nocomment && im._startsWith(pattern, '#')) {
	            exports.debug('skipping comment');
	            continue;
	        }
	        // set nocomment - brace expansion could result in a leading '#'
	        matchOptions_1.nocomment = true;
	        // determine whether pattern is include or exclude
	        var negateCount = 0;
	        if (!matchOptions_1.nonegate) {
	            while (pattern.charAt(negateCount) == '!') {
	                negateCount++;
	            }
	            pattern = pattern.substring(negateCount); // trim leading '!'
	            if (negateCount) {
	                exports.debug("trimmed leading '!'. pattern: '" + pattern + "'");
	            }
	        }
	        var isIncludePattern = negateCount == 0 ||
	            (negateCount % 2 == 0 && !matchOptions_1.flipNegate) ||
	            (negateCount % 2 == 1 && matchOptions_1.flipNegate);
	        // set nonegate - brace expansion could result in a leading '!'
	        matchOptions_1.nonegate = true;
	        matchOptions_1.flipNegate = false;
	        // expand braces - required to accurately interpret findPath
	        var expanded = void 0;
	        var preExpanded = pattern;
	        if (matchOptions_1.nobrace) {
	            expanded = [pattern];
	        }
	        else {
	            // convert slashes on Windows before calling braceExpand(). unfortunately this means braces cannot
	            // be escaped on Windows, this limitation is consistent with current limitations of minimatch (3.0.3).
	            exports.debug('expanding braces');
	            var convertedPattern = process.platform == 'win32' ? pattern.replace(/\\/g, '/') : pattern;
	            expanded = minimatch.braceExpand(convertedPattern);
	        }
	        // set nobrace
	        matchOptions_1.nobrace = true;
	        for (var _b = 0, expanded_2 = expanded; _b < expanded_2.length; _b++) {
	            var pattern_2 = expanded_2[_b];
	            if (expanded.length != 1 || pattern_2 != preExpanded) {
	                exports.debug("pattern: '" + pattern_2 + "'");
	            }
	            // trim and skip empty
	            pattern_2 = (pattern_2 || '').trim();
	            if (!pattern_2) {
	                exports.debug('skipping empty pattern');
	                continue;
	            }
	            if (isIncludePattern) {
	                // determine the findPath
	                var findInfo = im._getFindInfoFromPattern(defaultRoot, pattern_2, matchOptions_1);
	                var findPath = findInfo.findPath;
	                exports.debug("findPath: '" + findPath + "'");
	                if (!findPath) {
	                    exports.debug('skipping empty path');
	                    continue;
	                }
	                // perform the find
	                exports.debug("statOnly: '" + findInfo.statOnly + "'");
	                var findResults = [];
	                if (findInfo.statOnly) {
	                    // simply stat the path - all path segments were used to build the path
	                    try {
	                        fs.statSync(findPath);
	                        findResults.push(findPath);
	                    }
	                    catch (err) {
	                        if (err.code != 'ENOENT') {
	                            throw err;
	                        }
	                        exports.debug('ENOENT');
	                    }
	                }
	                else {
	                    findResults = find(findPath, findOptions);
	                }
	                exports.debug("found " + findResults.length + " paths");
	                // apply the pattern
	                exports.debug('applying include pattern');
	                if (findInfo.adjustedPattern != pattern_2) {
	                    exports.debug("adjustedPattern: '" + findInfo.adjustedPattern + "'");
	                    pattern_2 = findInfo.adjustedPattern;
	                }
	                var matchResults = minimatch.match(findResults, pattern_2, matchOptions_1);
	                exports.debug(matchResults.length + ' matches');
	                // union the results
	                for (var _c = 0, matchResults_3 = matchResults; _c < matchResults_3.length; _c++) {
	                    var matchResult = matchResults_3[_c];
	                    var key = process.platform == 'win32' ? matchResult.toUpperCase() : matchResult;
	                    results[key] = matchResult;
	                }
	            }
	            else {
	                // check if basename only and matchBase=true
	                if (matchOptions_1.matchBase &&
	                    !im._isRooted(pattern_2) &&
	                    (process.platform == 'win32' ? pattern_2.replace(/\\/g, '/') : pattern_2).indexOf('/') < 0) {
	                    // do not root the pattern
	                    exports.debug('matchBase and basename only');
	                }
	                else {
	                    // root the exclude pattern
	                    pattern_2 = im._ensurePatternRooted(defaultRoot, pattern_2);
	                    exports.debug("after ensurePatternRooted, pattern: '" + pattern_2 + "'");
	                }
	                // apply the pattern
	                exports.debug('applying exclude pattern');
	                var matchResults = minimatch.match(Object.keys(results).map(function (key) { return results[key]; }), pattern_2, matchOptions_1);
	                exports.debug(matchResults.length + ' matches');
	                // substract the results
	                for (var _d = 0, matchResults_4 = matchResults; _d < matchResults_4.length; _d++) {
	                    var matchResult = matchResults_4[_d];
	                    var key = process.platform == 'win32' ? matchResult.toUpperCase() : matchResult;
	                    delete results[key];
	                }
	            }
	        }
	    }
	    var finalResult = Object.keys(results)
	        .map(function (key) { return results[key]; })
	        .sort();
	    exports.debug(finalResult.length + ' final results');
	    return finalResult;
	}
	exports.findMatch = findMatch;
	/**
	 * Build Proxy URL in the following format: protocol://username:password@hostname:port
	 * @param proxyUrl Url address of the proxy server (eg: http://example.com)
	 * @param proxyUsername Proxy username (optional)
	 * @param proxyPassword Proxy password (optional)
	 * @returns string
	 */
	function getProxyFormattedUrl(proxyUrl, proxyUsername, proxyPassword) {
	    var parsedUrl = new URL(proxyUrl);
	    var proxyAddress = parsedUrl.protocol + "//" + parsedUrl.host;
	    if (proxyUsername) {
	        proxyAddress = parsedUrl.protocol + "//" + proxyUsername + ":" + proxyPassword + "@" + parsedUrl.host;
	    }
	    return proxyAddress;
	}
	/**
	 * Gets http proxy configuration used by Build/Release agent
	 *
	 * @return  ProxyConfiguration
	 */
	function getHttpProxyConfiguration(requestUrl) {
	    var proxyUrl = exports.getVariable('Agent.ProxyUrl');
	    if (proxyUrl && proxyUrl.length > 0) {
	        var proxyUsername = exports.getVariable('Agent.ProxyUsername');
	        var proxyPassword = exports.getVariable('Agent.ProxyPassword');
	        var proxyBypassHosts = JSON.parse(exports.getVariable('Agent.ProxyBypassList') || '[]');
	        var bypass_1 = false;
	        if (requestUrl) {
	            proxyBypassHosts.forEach(function (bypassHost) {
	                if (new RegExp(bypassHost, 'i').test(requestUrl)) {
	                    bypass_1 = true;
	                }
	            });
	        }
	        if (bypass_1) {
	            return null;
	        }
	        else {
	            var proxyAddress = getProxyFormattedUrl(proxyUrl, proxyUsername, proxyPassword);
	            return {
	                proxyUrl: proxyUrl,
	                proxyUsername: proxyUsername,
	                proxyPassword: proxyPassword,
	                proxyBypassHosts: proxyBypassHosts,
	                proxyFormattedUrl: proxyAddress
	            };
	        }
	    }
	    else {
	        return null;
	    }
	}
	exports.getHttpProxyConfiguration = getHttpProxyConfiguration;
	/**
	 * Gets http certificate configuration used by Build/Release agent
	 *
	 * @return  CertConfiguration
	 */
	function getHttpCertConfiguration() {
	    var ca = exports.getVariable('Agent.CAInfo');
	    var clientCert = exports.getVariable('Agent.ClientCert');
	    if (ca || clientCert) {
	        var certConfig = {};
	        certConfig.caFile = ca;
	        certConfig.certFile = clientCert;
	        if (clientCert) {
	            var clientCertKey = exports.getVariable('Agent.ClientCertKey');
	            var clientCertArchive = exports.getVariable('Agent.ClientCertArchive');
	            var clientCertPassword = exports.getVariable('Agent.ClientCertPassword');
	            certConfig.keyFile = clientCertKey;
	            certConfig.certArchiveFile = clientCertArchive;
	            certConfig.passphrase = clientCertPassword;
	        }
	        return certConfig;
	    }
	    else {
	        return null;
	    }
	}
	exports.getHttpCertConfiguration = getHttpCertConfiguration;
	//-----------------------------------------------------
	// Test Publisher
	//-----------------------------------------------------
	var TestPublisher = /** @class */ (function () {
	    function TestPublisher(testRunner) {
	        this.testRunner = testRunner;
	    }
	    TestPublisher.prototype.publish = function (resultFiles, mergeResults, platform, config, runTitle, publishRunAttachments, testRunSystem) {
	        // Could have used an initializer, but wanted to avoid reordering parameters when converting to strict null checks
	        // (A parameter cannot both be optional and have an initializer)
	        testRunSystem = testRunSystem || "VSTSTask";
	        var properties = {};
	        properties['type'] = this.testRunner;
	        if (mergeResults) {
	            properties['mergeResults'] = mergeResults;
	        }
	        if (platform) {
	            properties['platform'] = platform;
	        }
	        if (config) {
	            properties['config'] = config;
	        }
	        if (runTitle) {
	            properties['runTitle'] = runTitle;
	        }
	        if (publishRunAttachments) {
	            properties['publishRunAttachments'] = publishRunAttachments;
	        }
	        if (resultFiles) {
	            properties['resultFiles'] = Array.isArray(resultFiles) ? resultFiles.join() : resultFiles;
	        }
	        properties['testRunSystem'] = testRunSystem;
	        exports.command('results.publish', properties, '');
	    };
	    return TestPublisher;
	}());
	exports.TestPublisher = TestPublisher;
	//-----------------------------------------------------
	// Code coverage Publisher
	//-----------------------------------------------------
	var CodeCoveragePublisher = /** @class */ (function () {
	    function CodeCoveragePublisher() {
	    }
	    CodeCoveragePublisher.prototype.publish = function (codeCoverageTool, summaryFileLocation, reportDirectory, additionalCodeCoverageFiles) {
	        var properties = {};
	        if (codeCoverageTool) {
	            properties['codecoveragetool'] = codeCoverageTool;
	        }
	        if (summaryFileLocation) {
	            properties['summaryfile'] = summaryFileLocation;
	        }
	        if (reportDirectory) {
	            properties['reportdirectory'] = reportDirectory;
	        }
	        if (additionalCodeCoverageFiles) {
	            properties['additionalcodecoveragefiles'] = Array.isArray(additionalCodeCoverageFiles) ? additionalCodeCoverageFiles.join() : additionalCodeCoverageFiles;
	        }
	        exports.command('codecoverage.publish', properties, "");
	    };
	    return CodeCoveragePublisher;
	}());
	exports.CodeCoveragePublisher = CodeCoveragePublisher;
	//-----------------------------------------------------
	// Code coverage Publisher
	//-----------------------------------------------------
	var CodeCoverageEnabler = /** @class */ (function () {
	    function CodeCoverageEnabler(buildTool, ccTool) {
	        this.buildTool = buildTool;
	        this.ccTool = ccTool;
	    }
	    CodeCoverageEnabler.prototype.enableCodeCoverage = function (buildProps) {
	        buildProps['buildtool'] = this.buildTool;
	        buildProps['codecoveragetool'] = this.ccTool;
	        exports.command('codecoverage.enable', buildProps, "");
	    };
	    return CodeCoverageEnabler;
	}());
	exports.CodeCoverageEnabler = CodeCoverageEnabler;
	//-----------------------------------------------------
	// Task Logging Commands
	//-----------------------------------------------------
	/**
	 * Upload user interested file as additional log information
	 * to the current timeline record.
	 *
	 * The file shall be available for download along with task logs.
	 *
	 * @param path      Path to the file that should be uploaded.
	 * @returns         void
	 */
	function uploadFile(path) {
	    exports.command("task.uploadfile", null, path);
	}
	exports.uploadFile = uploadFile;
	/**
	 * Instruction for the agent to update the PATH environment variable.
	 * The specified directory is prepended to the PATH.
	 * The updated environment variable will be reflected in subsequent tasks.
	 *
	 * @param path      Local directory path.
	 * @returns         void
	 */
	function prependPath(path) {
	    assertAgent("2.115.0");
	    exports.command("task.prependpath", null, path);
	}
	exports.prependPath = prependPath;
	/**
	 * Upload and attach summary markdown to current timeline record.
	 * This summary shall be added to the build/release summary and
	 * not available for download with logs.
	 *
	 * @param path      Local directory path.
	 * @returns         void
	 */
	function uploadSummary(path) {
	    exports.command("task.uploadsummary", null, path);
	}
	exports.uploadSummary = uploadSummary;
	/**
	 * Upload and attach attachment to current timeline record.
	 * These files are not available for download with logs.
	 * These can only be referred to by extensions using the type or name values.
	 *
	 * @param type      Attachment type.
	 * @param name      Attachment name.
	 * @param path      Attachment path.
	 * @returns         void
	 */
	function addAttachment(type, name, path) {
	    exports.command("task.addattachment", { "type": type, "name": name }, path);
	}
	exports.addAttachment = addAttachment;
	/**
	 * Set an endpoint field with given value.
	 * Value updated will be retained in the endpoint for
	 * the subsequent tasks that execute within the same job.
	 *
	 * @param id      Endpoint id.
	 * @param field   FieldType enum of AuthParameter, DataParameter or Url.
	 * @param key     Key.
	 * @param value   Value for key or url.
	 * @returns       void
	 */
	function setEndpoint(id, field, key, value) {
	    exports.command("task.setendpoint", { "id": id, "field": FieldType[field].toLowerCase(), "key": key }, value);
	}
	exports.setEndpoint = setEndpoint;
	/**
	 * Set progress and current operation for current task.
	 *
	 * @param percent           Percentage of completion.
	 * @param currentOperation  Current pperation.
	 * @returns                 void
	 */
	function setProgress(percent, currentOperation) {
	    exports.command("task.setprogress", { "value": "" + percent }, currentOperation);
	}
	exports.setProgress = setProgress;
	/**
	 * Indicates whether to write the logging command directly to the host or to the output pipeline.
	 *
	 * @param id            Timeline record Guid.
	 * @param parentId      Parent timeline record Guid.
	 * @param recordType    Record type.
	 * @param recordName    Record name.
	 * @param order         Order of timeline record.
	 * @param startTime     Start time.
	 * @param finishTime    End time.
	 * @param progress      Percentage of completion.
	 * @param state         TaskState enum of Unknown, Initialized, InProgress or Completed.
	 * @param result        TaskResult enum of Succeeded, SucceededWithIssues, Failed, Cancelled or Skipped.
	 * @param message       current operation
	 * @returns             void
	 */
	function logDetail(id, message, parentId, recordType, recordName, order, startTime, finishTime, progress, state, result) {
	    var properties = {
	        "id": id,
	        "parentid": parentId,
	        "type": recordType,
	        "name": recordName,
	        "order": order ? order.toString() : undefined,
	        "starttime": startTime,
	        "finishtime": finishTime,
	        "progress": progress ? progress.toString() : undefined,
	        "state": state ? TaskState[state] : undefined,
	        "result": result ? TaskResult[result] : undefined
	    };
	    exports.command("task.logdetail", properties, message);
	}
	exports.logDetail = logDetail;
	/**
	 * Log error or warning issue to timeline record of current task.
	 *
	 * @param type          IssueType enum of Error or Warning.
	 * @param sourcePath    Source file location.
	 * @param lineNumber    Line number.
	 * @param columnNumber  Column number.
	 * @param code          Error or warning code.
	 * @param message       Error or warning message.
	 * @returns             void
	 */
	function logIssue(type, message, sourcePath, lineNumber, columnNumber, errorCode) {
	    var properties = {
	        "type": IssueType[type].toLowerCase(),
	        "code": errorCode,
	        "sourcepath": sourcePath,
	        "linenumber": lineNumber ? lineNumber.toString() : undefined,
	        "columnnumber": columnNumber ? columnNumber.toString() : undefined,
	    };
	    exports.command("task.logissue", properties, message);
	}
	exports.logIssue = logIssue;
	//-----------------------------------------------------
	// Artifact Logging Commands
	//-----------------------------------------------------
	/**
	 * Upload user interested file as additional log information
	 * to the current timeline record.
	 *
	 * The file shall be available for download along with task logs.
	 *
	 * @param containerFolder   Folder that the file will upload to, folder will be created if needed.
	 * @param path              Path to the file that should be uploaded.
	 * @param name              Artifact name.
	 * @returns                 void
	 */
	function uploadArtifact(containerFolder, path, name) {
	    exports.command("artifact.upload", { "containerfolder": containerFolder, "artifactname": name }, path);
	}
	exports.uploadArtifact = uploadArtifact;
	/**
	 * Create an artifact link, artifact location is required to be
	 * a file container path, VC path or UNC share path.
	 *
	 * The file shall be available for download along with task logs.
	 *
	 * @param name              Artifact name.
	 * @param path              Path to the file that should be associated.
	 * @param artifactType      ArtifactType enum of Container, FilePath, VersionControl, GitRef or TfvcLabel.
	 * @returns                 void
	 */
	function associateArtifact(name, path, artifactType) {
	    exports.command("artifact.associate", { "type": ArtifactType[artifactType].toLowerCase(), "artifactname": name }, path);
	}
	exports.associateArtifact = associateArtifact;
	//-----------------------------------------------------
	// Build Logging Commands
	//-----------------------------------------------------
	/**
	 * Upload user interested log to build’s container “logs\tool” folder.
	 *
	 * @param path      Path to the file that should be uploaded.
	 * @returns         void
	 */
	function uploadBuildLog(path) {
	    exports.command("build.uploadlog", null, path);
	}
	exports.uploadBuildLog = uploadBuildLog;
	/**
	 * Update build number for current build.
	 *
	 * @param value     Value to be assigned as the build number.
	 * @returns         void
	 */
	function updateBuildNumber(value) {
	    exports.command("build.updatebuildnumber", null, value);
	}
	exports.updateBuildNumber = updateBuildNumber;
	/**
	 * Add a tag for current build.
	 *
	 * @param value     Tag value.
	 * @returns         void
	 */
	function addBuildTag(value) {
	    exports.command("build.addbuildtag", null, value);
	}
	exports.addBuildTag = addBuildTag;
	//-----------------------------------------------------
	// Release Logging Commands
	//-----------------------------------------------------
	/**
	 * Update release name for current release.
	 *
	 * @param value     Value to be assigned as the release name.
	 * @returns         void
	 */
	function updateReleaseName(name) {
	    assertAgent("2.132.0");
	    exports.command("release.updatereleasename", null, name);
	}
	exports.updateReleaseName = updateReleaseName;
	//-----------------------------------------------------
	// Tools
	//-----------------------------------------------------
	exports.TaskCommand = tcm.TaskCommand;
	exports.commandFromString = tcm.commandFromString;
	exports.ToolRunner = trm.ToolRunner;
	//-----------------------------------------------------
	// Validation Checks
	//-----------------------------------------------------
	// async await needs generators in node 4.x+
	if (semver.lt(process.versions.node, '4.2.0')) {
	    exports.warning('Tasks require a new agent.  Upgrade your agent or node to 4.2.0 or later', exports.IssueSource.TaskInternal);
	}
	//-------------------------------------------------------------------
	// Populate the vault with sensitive data.  Inputs and Endpoints
	//-------------------------------------------------------------------
	// avoid loading twice (overwrites .taskkey)
	if (!commonjsGlobal['_vsts_task_lib_loaded']) {
	    im._loadData();
	    im._exposeProxySettings();
	    im._exposeCertSettings();
	} 
} (task));

var tool = {};

var HttpClient = {};

var Util = {};

/* eslint complexity: [2, 18], max-statements: [2, 33] */
var shams = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = shams;

var hasSymbols$1 = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

var test = {
	foo: {}
};

var $Object = Object;

var hasProto$1 = function hasProto() {
	return { __proto__: test }.foo === test.foo && !({ __proto__: null } instanceof $Object);
};

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var toStr$1 = Object.prototype.toString;
var max = Math.max;
var funcType = '[object Function]';

var concatty = function concatty(a, b) {
    var arr = [];

    for (var i = 0; i < a.length; i += 1) {
        arr[i] = a[i];
    }
    for (var j = 0; j < b.length; j += 1) {
        arr[j + a.length] = b[j];
    }

    return arr;
};

var slicy = function slicy(arrLike, offset) {
    var arr = [];
    for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
        arr[j] = arrLike[i];
    }
    return arr;
};

var joiny = function (arr, joiner) {
    var str = '';
    for (var i = 0; i < arr.length; i += 1) {
        str += arr[i];
        if (i + 1 < arr.length) {
            str += joiner;
        }
    }
    return str;
};

var implementation$1 = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr$1.apply(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slicy(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                concatty(args, arguments)
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        }
        return target.apply(
            that,
            concatty(args, arguments)
        );

    };

    var boundLength = max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs[i] = '$' + i;
    }

    bound = Function('binder', 'return function (' + joiny(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

var implementation = implementation$1;

var functionBind = Function.prototype.bind || implementation;

var bind$1 = functionBind;

var src = bind$1.call(Function.call, Object.prototype.hasOwnProperty);

var undefined$1;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError$1 = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError$1();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = hasSymbols$1();
var hasProto = hasProto$1();

var getProto = Object.getPrototypeOf || (
	hasProto
		? function (x) { return x.__proto__; } // eslint-disable-line no-proto
		: null
);

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' || !getProto ? undefined$1 : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$1 : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined$1,
	'%AsyncFromSyncIteratorPrototype%': undefined$1,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined$1 : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined$1 : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined$1 : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$1 : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols || !getProto ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols || !getProto ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols && getProto ? getProto(''[Symbol.iterator]()) : undefined$1,
	'%Symbol%': hasSymbols ? Symbol : undefined$1,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError$1,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$1 : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet
};

if (getProto) {
	try {
		null.error; // eslint-disable-line no-unused-expressions
	} catch (e) {
		// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
		var errorProto = getProto(getProto(e));
		INTRINSICS['%Error.prototype%'] = errorProto;
	}
}

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen && getProto) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = functionBind;
var hasOwn$1 = src;
var $concat$1 = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace$1 = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);
var $exec = bind.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace$1(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace$1(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn$1(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn$1(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError$1('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

var getIntrinsic = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError$1('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError$1('"allowMissing" argument must be a boolean');
	}

	if ($exec(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat$1([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn$1(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError$1('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined$1;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn$1(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

var callBind$1 = {exports: {}};

(function (module) {

	var bind = functionBind;
	var GetIntrinsic = getIntrinsic;

	var $apply = GetIntrinsic('%Function.prototype.apply%');
	var $call = GetIntrinsic('%Function.prototype.call%');
	var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

	var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
	var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
	var $max = GetIntrinsic('%Math.max%');

	if ($defineProperty) {
		try {
			$defineProperty({}, 'a', { value: 1 });
		} catch (e) {
			// IE 8 has a broken defineProperty
			$defineProperty = null;
		}
	}

	module.exports = function callBind(originalFunction) {
		var func = $reflectApply(bind, $call, arguments);
		if ($gOPD && $defineProperty) {
			var desc = $gOPD(func, 'length');
			if (desc.configurable) {
				// original length, plus the receiver, minus any additional arguments (after the receiver)
				$defineProperty(
					func,
					'length',
					{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
				);
			}
		}
		return func;
	};

	var applyBind = function applyBind() {
		return $reflectApply(bind, $apply, arguments);
	};

	if ($defineProperty) {
		$defineProperty(module.exports, 'apply', { value: applyBind });
	} else {
		module.exports.apply = applyBind;
	} 
} (callBind$1));

var callBindExports = callBind$1.exports;

var GetIntrinsic$1 = getIntrinsic;

var callBind = callBindExports;

var $indexOf = callBind(GetIntrinsic$1('String.prototype.indexOf'));

var callBound$1 = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic$1(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

const __viteBrowserExternal = {};

const __viteBrowserExternal$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: __viteBrowserExternal
}, Symbol.toStringTag, { value: 'Module' }));

const require$$0 = /*@__PURE__*/getAugmentedNamespace(__viteBrowserExternal$1);

var hasMap = typeof Map === 'function' && Map.prototype;
var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
var mapForEach = hasMap && Map.prototype.forEach;
var hasSet = typeof Set === 'function' && Set.prototype;
var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
var setForEach = hasSet && Set.prototype.forEach;
var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
var booleanValueOf = Boolean.prototype.valueOf;
var objectToString = Object.prototype.toString;
var functionToString = Function.prototype.toString;
var $match = String.prototype.match;
var $slice = String.prototype.slice;
var $replace = String.prototype.replace;
var $toUpperCase = String.prototype.toUpperCase;
var $toLowerCase = String.prototype.toLowerCase;
var $test = RegExp.prototype.test;
var $concat = Array.prototype.concat;
var $join = Array.prototype.join;
var $arrSlice = Array.prototype.slice;
var $floor = Math.floor;
var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
var gOPS = Object.getOwnPropertySymbols;
var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
// ie, `has-tostringtag/shams
var toStringTag = typeof Symbol === 'function' && Symbol.toStringTag && (typeof Symbol.toStringTag === hasShammedSymbols ? 'object' : 'symbol')
    ? Symbol.toStringTag
    : null;
var isEnumerable = Object.prototype.propertyIsEnumerable;

var gPO = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
    [].__proto__ === Array.prototype // eslint-disable-line no-proto
        ? function (O) {
            return O.__proto__; // eslint-disable-line no-proto
        }
        : null
);

function addNumericSeparator(num, str) {
    if (
        num === Infinity
        || num === -Infinity
        || num !== num
        || (num && num > -1000 && num < 1000)
        || $test.call(/e/, str)
    ) {
        return str;
    }
    var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
    if (typeof num === 'number') {
        var int = num < 0 ? -$floor(-num) : $floor(num); // trunc(num)
        if (int !== num) {
            var intStr = String(int);
            var dec = $slice.call(str, intStr.length + 1);
            return $replace.call(intStr, sepRegex, '$&_') + '.' + $replace.call($replace.call(dec, /([0-9]{3})/g, '$&_'), /_$/, '');
        }
    }
    return $replace.call(str, sepRegex, '$&_');
}

var utilInspect = require$$0;
var inspectCustom = utilInspect.custom;
var inspectSymbol = isSymbol(inspectCustom) ? inspectCustom : null;

var objectInspect = function inspect_(obj, options, depth, seen) {
    var opts = options || {};

    if (has$3(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
    }
    if (
        has$3(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
            ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
            : opts.maxStringLength !== null
        )
    ) {
        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    }
    var customInspect = has$3(opts, 'customInspect') ? opts.customInspect : true;
    if (typeof customInspect !== 'boolean' && customInspect !== 'symbol') {
        throw new TypeError('option "customInspect", if provided, must be `true`, `false`, or `\'symbol\'`');
    }

    if (
        has$3(opts, 'indent')
        && opts.indent !== null
        && opts.indent !== '\t'
        && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
    ) {
        throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
    }
    if (has$3(opts, 'numericSeparator') && typeof opts.numericSeparator !== 'boolean') {
        throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
    }
    var numericSeparator = opts.numericSeparator;

    if (typeof obj === 'undefined') {
        return 'undefined';
    }
    if (obj === null) {
        return 'null';
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false';
    }

    if (typeof obj === 'string') {
        return inspectString(obj, opts);
    }
    if (typeof obj === 'number') {
        if (obj === 0) {
            return Infinity / obj > 0 ? '0' : '-0';
        }
        var str = String(obj);
        return numericSeparator ? addNumericSeparator(obj, str) : str;
    }
    if (typeof obj === 'bigint') {
        var bigIntStr = String(obj) + 'n';
        return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr;
    }

    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
    if (typeof depth === 'undefined') { depth = 0; }
    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
        return isArray$3(obj) ? '[Array]' : '[Object]';
    }

    var indent = getIndent(opts, depth);

    if (typeof seen === 'undefined') {
        seen = [];
    } else if (indexOf(seen, obj) >= 0) {
        return '[Circular]';
    }

    function inspect(value, from, noIndent) {
        if (from) {
            seen = $arrSlice.call(seen);
            seen.push(from);
        }
        if (noIndent) {
            var newOpts = {
                depth: opts.depth
            };
            if (has$3(opts, 'quoteStyle')) {
                newOpts.quoteStyle = opts.quoteStyle;
            }
            return inspect_(value, newOpts, depth + 1, seen);
        }
        return inspect_(value, opts, depth + 1, seen);
    }

    if (typeof obj === 'function' && !isRegExp$1(obj)) { // in older engines, regexes are callable
        var name = nameOf(obj);
        var keys = arrObjKeys(obj, inspect);
        return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + $join.call(keys, ', ') + ' }' : '');
    }
    if (isSymbol(obj)) {
        var symString = hasShammedSymbols ? $replace.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
        return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
    }
    if (isElement(obj)) {
        var s = '<' + $toLowerCase.call(String(obj.nodeName));
        var attrs = obj.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
            s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
        }
        s += '>';
        if (obj.childNodes && obj.childNodes.length) { s += '...'; }
        s += '</' + $toLowerCase.call(String(obj.nodeName)) + '>';
        return s;
    }
    if (isArray$3(obj)) {
        if (obj.length === 0) { return '[]'; }
        var xs = arrObjKeys(obj, inspect);
        if (indent && !singleLineValues(xs)) {
            return '[' + indentedJoin(xs, indent) + ']';
        }
        return '[ ' + $join.call(xs, ', ') + ' ]';
    }
    if (isError(obj)) {
        var parts = arrObjKeys(obj, inspect);
        if (!('cause' in Error.prototype) && 'cause' in obj && !isEnumerable.call(obj, 'cause')) {
            return '{ [' + String(obj) + '] ' + $join.call($concat.call('[cause]: ' + inspect(obj.cause), parts), ', ') + ' }';
        }
        if (parts.length === 0) { return '[' + String(obj) + ']'; }
        return '{ [' + String(obj) + '] ' + $join.call(parts, ', ') + ' }';
    }
    if (typeof obj === 'object' && customInspect) {
        if (inspectSymbol && typeof obj[inspectSymbol] === 'function' && utilInspect) {
            return utilInspect(obj, { depth: maxDepth - depth });
        } else if (customInspect !== 'symbol' && typeof obj.inspect === 'function') {
            return obj.inspect();
        }
    }
    if (isMap(obj)) {
        var mapParts = [];
        if (mapForEach) {
            mapForEach.call(obj, function (value, key) {
                mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
            });
        }
        return collectionOf('Map', mapSize.call(obj), mapParts, indent);
    }
    if (isSet(obj)) {
        var setParts = [];
        if (setForEach) {
            setForEach.call(obj, function (value) {
                setParts.push(inspect(value, obj));
            });
        }
        return collectionOf('Set', setSize.call(obj), setParts, indent);
    }
    if (isWeakMap(obj)) {
        return weakCollectionOf('WeakMap');
    }
    if (isWeakSet(obj)) {
        return weakCollectionOf('WeakSet');
    }
    if (isWeakRef(obj)) {
        return weakCollectionOf('WeakRef');
    }
    if (isNumber(obj)) {
        return markBoxed(inspect(Number(obj)));
    }
    if (isBigInt(obj)) {
        return markBoxed(inspect(bigIntValueOf.call(obj)));
    }
    if (isBoolean(obj)) {
        return markBoxed(booleanValueOf.call(obj));
    }
    if (isString(obj)) {
        return markBoxed(inspect(String(obj)));
    }
    if (!isDate(obj) && !isRegExp$1(obj)) {
        var ys = arrObjKeys(obj, inspect);
        var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
        var protoTag = obj instanceof Object ? '' : 'null prototype';
        var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? $slice.call(toStr(obj), 8, -1) : protoTag ? 'Object' : '';
        var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
        var tag = constructorTag + (stringTag || protoTag ? '[' + $join.call($concat.call([], stringTag || [], protoTag || []), ': ') + '] ' : '');
        if (ys.length === 0) { return tag + '{}'; }
        if (indent) {
            return tag + '{' + indentedJoin(ys, indent) + '}';
        }
        return tag + '{ ' + $join.call(ys, ', ') + ' }';
    }
    return String(obj);
};

function wrapQuotes(s, defaultStyle, opts) {
    var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
    return quoteChar + s + quoteChar;
}

function quote(s) {
    return $replace.call(String(s), /"/g, '&quot;');
}

function isArray$3(obj) { return toStr(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isDate(obj) { return toStr(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isRegExp$1(obj) { return toStr(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isError(obj) { return toStr(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isString(obj) { return toStr(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isNumber(obj) { return toStr(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isBoolean(obj) { return toStr(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

// Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
function isSymbol(obj) {
    if (hasShammedSymbols) {
        return obj && typeof obj === 'object' && obj instanceof Symbol;
    }
    if (typeof obj === 'symbol') {
        return true;
    }
    if (!obj || typeof obj !== 'object' || !symToString) {
        return false;
    }
    try {
        symToString.call(obj);
        return true;
    } catch (e) {}
    return false;
}

function isBigInt(obj) {
    if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
        return false;
    }
    try {
        bigIntValueOf.call(obj);
        return true;
    } catch (e) {}
    return false;
}

var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
function has$3(obj, key) {
    return hasOwn.call(obj, key);
}

function toStr(obj) {
    return objectToString.call(obj);
}

function nameOf(f) {
    if (f.name) { return f.name; }
    var m = $match.call(functionToString.call(f), /^function\s*([\w$]+)/);
    if (m) { return m[1]; }
    return null;
}

function indexOf(xs, x) {
    if (xs.indexOf) { return xs.indexOf(x); }
    for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) { return i; }
    }
    return -1;
}

function isMap(x) {
    if (!mapSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        mapSize.call(x);
        try {
            setSize.call(x);
        } catch (s) {
            return true;
        }
        return x instanceof Map; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakMap(x) {
    if (!weakMapHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakMapHas.call(x, weakMapHas);
        try {
            weakSetHas.call(x, weakSetHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakRef(x) {
    if (!weakRefDeref || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakRefDeref.call(x);
        return true;
    } catch (e) {}
    return false;
}

function isSet(x) {
    if (!setSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        setSize.call(x);
        try {
            mapSize.call(x);
        } catch (m) {
            return true;
        }
        return x instanceof Set; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakSet(x) {
    if (!weakSetHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakSetHas.call(x, weakSetHas);
        try {
            weakMapHas.call(x, weakMapHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isElement(x) {
    if (!x || typeof x !== 'object') { return false; }
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
        return true;
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
}

function inspectString(str, opts) {
    if (str.length > opts.maxStringLength) {
        var remaining = str.length - opts.maxStringLength;
        var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
        return inspectString($slice.call(str, 0, opts.maxStringLength), opts) + trailer;
    }
    // eslint-disable-next-line no-control-regex
    var s = $replace.call($replace.call(str, /(['\\])/g, '\\$1'), /[\x00-\x1f]/g, lowbyte);
    return wrapQuotes(s, 'single', opts);
}

function lowbyte(c) {
    var n = c.charCodeAt(0);
    var x = {
        8: 'b',
        9: 't',
        10: 'n',
        12: 'f',
        13: 'r'
    }[n];
    if (x) { return '\\' + x; }
    return '\\x' + (n < 0x10 ? '0' : '') + $toUpperCase.call(n.toString(16));
}

function markBoxed(str) {
    return 'Object(' + str + ')';
}

function weakCollectionOf(type) {
    return type + ' { ? }';
}

function collectionOf(type, size, entries, indent) {
    var joinedEntries = indent ? indentedJoin(entries, indent) : $join.call(entries, ', ');
    return type + ' (' + size + ') {' + joinedEntries + '}';
}

function singleLineValues(xs) {
    for (var i = 0; i < xs.length; i++) {
        if (indexOf(xs[i], '\n') >= 0) {
            return false;
        }
    }
    return true;
}

function getIndent(opts, depth) {
    var baseIndent;
    if (opts.indent === '\t') {
        baseIndent = '\t';
    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
        baseIndent = $join.call(Array(opts.indent + 1), ' ');
    } else {
        return null;
    }
    return {
        base: baseIndent,
        prev: $join.call(Array(depth + 1), baseIndent)
    };
}

function indentedJoin(xs, indent) {
    if (xs.length === 0) { return ''; }
    var lineJoiner = '\n' + indent.prev + indent.base;
    return lineJoiner + $join.call(xs, ',' + lineJoiner) + '\n' + indent.prev;
}

function arrObjKeys(obj, inspect) {
    var isArr = isArray$3(obj);
    var xs = [];
    if (isArr) {
        xs.length = obj.length;
        for (var i = 0; i < obj.length; i++) {
            xs[i] = has$3(obj, i) ? inspect(obj[i], obj) : '';
        }
    }
    var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
    var symMap;
    if (hasShammedSymbols) {
        symMap = {};
        for (var k = 0; k < syms.length; k++) {
            symMap['$' + syms[k]] = syms[k];
        }
    }

    for (var key in obj) { // eslint-disable-line no-restricted-syntax
        if (!has$3(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
            // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
            continue; // eslint-disable-line no-restricted-syntax, no-continue
        } else if ($test.call(/[^\w$]/, key)) {
            xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
        } else {
            xs.push(key + ': ' + inspect(obj[key], obj));
        }
    }
    if (typeof gOPS === 'function') {
        for (var j = 0; j < syms.length; j++) {
            if (isEnumerable.call(obj, syms[j])) {
                xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
            }
        }
    }
    return xs;
}

var GetIntrinsic = getIntrinsic;
var callBound = callBound$1;
var inspect = objectInspect;

var $TypeError = GetIntrinsic('%TypeError%');
var $WeakMap = GetIntrinsic('%WeakMap%', true);
var $Map = GetIntrinsic('%Map%', true);

var $weakMapGet = callBound('WeakMap.prototype.get', true);
var $weakMapSet = callBound('WeakMap.prototype.set', true);
var $weakMapHas = callBound('WeakMap.prototype.has', true);
var $mapGet = callBound('Map.prototype.get', true);
var $mapSet = callBound('Map.prototype.set', true);
var $mapHas = callBound('Map.prototype.has', true);

/*
 * This function traverses the list returning the node corresponding to the
 * given key.
 *
 * That node is also moved to the head of the list, so that if it's accessed
 * again we don't need to traverse the whole list. By doing so, all the recently
 * used nodes can be accessed relatively quickly.
 */
var listGetNode = function (list, key) { // eslint-disable-line consistent-return
	for (var prev = list, curr; (curr = prev.next) !== null; prev = curr) {
		if (curr.key === key) {
			prev.next = curr.next;
			curr.next = list.next;
			list.next = curr; // eslint-disable-line no-param-reassign
			return curr;
		}
	}
};

var listGet = function (objects, key) {
	var node = listGetNode(objects, key);
	return node && node.value;
};
var listSet = function (objects, key, value) {
	var node = listGetNode(objects, key);
	if (node) {
		node.value = value;
	} else {
		// Prepend the new node to the beginning of the list
		objects.next = { // eslint-disable-line no-param-reassign
			key: key,
			next: objects.next,
			value: value
		};
	}
};
var listHas = function (objects, key) {
	return !!listGetNode(objects, key);
};

var sideChannel = function getSideChannel() {
	var $wm;
	var $m;
	var $o;
	var channel = {
		assert: function (key) {
			if (!channel.has(key)) {
				throw new $TypeError('Side channel does not contain ' + inspect(key));
			}
		},
		get: function (key) { // eslint-disable-line consistent-return
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapGet($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapGet($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listGet($o, key);
				}
			}
		},
		has: function (key) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapHas($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapHas($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listHas($o, key);
				}
			}
			return false;
		},
		set: function (key, value) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if (!$wm) {
					$wm = new $WeakMap();
				}
				$weakMapSet($wm, key, value);
			} else if ($Map) {
				if (!$m) {
					$m = new $Map();
				}
				$mapSet($m, key, value);
			} else {
				if (!$o) {
					/*
					 * Initialize the linked list as an empty node, so that we don't have
					 * to special-case handling of the first node: we can always refer to
					 * it as (previous node).next, instead of something like (list).head
					 */
					$o = { key: {}, next: null };
				}
				listSet($o, key, value);
			}
		}
	};
	return channel;
};

var replace = String.prototype.replace;
var percentTwenties = /%20/g;

var Format = {
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

var formats$3 = {
    'default': Format.RFC3986,
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return String(value);
        }
    },
    RFC1738: Format.RFC1738,
    RFC3986: Format.RFC3986
};

var formats$2 = formats$3;

var has$2 = Object.prototype.hasOwnProperty;
var isArray$2 = Array.isArray;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

var compactQueue = function compactQueue(queue) {
    while (queue.length > 1) {
        var item = queue.pop();
        var obj = item.obj[item.prop];

        if (isArray$2(obj)) {
            var compacted = [];

            for (var j = 0; j < obj.length; ++j) {
                if (typeof obj[j] !== 'undefined') {
                    compacted.push(obj[j]);
                }
            }

            item.obj[item.prop] = compacted;
        }
    }
};

var arrayToObject = function arrayToObject(source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

var merge = function merge(target, source, options) {
    /* eslint no-param-reassign: 0 */
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (isArray$2(target)) {
            target.push(source);
        } else if (target && typeof target === 'object') {
            if ((options && (options.plainObjects || options.allowPrototypes)) || !has$2.call(Object.prototype, source)) {
                target[source] = true;
            }
        } else {
            return [target, source];
        }

        return target;
    }

    if (!target || typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (isArray$2(target) && !isArray$2(source)) {
        mergeTarget = arrayToObject(target, options);
    }

    if (isArray$2(target) && isArray$2(source)) {
        source.forEach(function (item, i) {
            if (has$2.call(target, i)) {
                var targetItem = target[i];
                if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                    target[i] = merge(targetItem, item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (has$2.call(acc, key)) {
            acc[key] = merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

var assign = function assignSingleSource(target, source) {
    return Object.keys(source).reduce(function (acc, key) {
        acc[key] = source[key];
        return acc;
    }, target);
};

var decode = function (str, decoder, charset) {
    var strWithoutPlus = str.replace(/\+/g, ' ');
    if (charset === 'iso-8859-1') {
        // unescape never throws, no try...catch needed:
        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
    }
    // utf-8
    try {
        return decodeURIComponent(strWithoutPlus);
    } catch (e) {
        return strWithoutPlus;
    }
};

var encode = function encode(str, defaultEncoder, charset, kind, format) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = str;
    if (typeof str === 'symbol') {
        string = Symbol.prototype.toString.call(str);
    } else if (typeof str !== 'string') {
        string = String(str);
    }

    if (charset === 'iso-8859-1') {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
            return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
        });
    }

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D // -
            || c === 0x2E // .
            || c === 0x5F // _
            || c === 0x7E // ~
            || (c >= 0x30 && c <= 0x39) // 0-9
            || (c >= 0x41 && c <= 0x5A) // a-z
            || (c >= 0x61 && c <= 0x7A) // A-Z
            || (format === formats$2.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        /* eslint operator-linebreak: [2, "before"] */
        out += hexTable[0xF0 | (c >> 18)]
            + hexTable[0x80 | ((c >> 12) & 0x3F)]
            + hexTable[0x80 | ((c >> 6) & 0x3F)]
            + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

var compact = function compact(value) {
    var queue = [{ obj: { o: value }, prop: 'o' }];
    var refs = [];

    for (var i = 0; i < queue.length; ++i) {
        var item = queue[i];
        var obj = item.obj[item.prop];

        var keys = Object.keys(obj);
        for (var j = 0; j < keys.length; ++j) {
            var key = keys[j];
            var val = obj[key];
            if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                queue.push({ obj: obj, prop: key });
                refs.push(val);
            }
        }
    }

    compactQueue(queue);

    return value;
};

var isRegExp = function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var isBuffer = function isBuffer(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

var combine = function combine(a, b) {
    return [].concat(a, b);
};

var maybeMap = function maybeMap(val, fn) {
    if (isArray$2(val)) {
        var mapped = [];
        for (var i = 0; i < val.length; i += 1) {
            mapped.push(fn(val[i]));
        }
        return mapped;
    }
    return fn(val);
};

var utils$2 = {
    arrayToObject: arrayToObject,
    assign: assign,
    combine: combine,
    compact: compact,
    decode: decode,
    encode: encode,
    isBuffer: isBuffer,
    isRegExp: isRegExp,
    maybeMap: maybeMap,
    merge: merge
};

var getSideChannel = sideChannel;
var utils$1 = utils$2;
var formats$1 = formats$3;
var has$1 = Object.prototype.hasOwnProperty;

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    comma: 'comma',
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var isArray$1 = Array.isArray;
var push$1 = Array.prototype.push;
var pushToArray = function (arr, valueOrArray) {
    push$1.apply(arr, isArray$1(valueOrArray) ? valueOrArray : [valueOrArray]);
};

var toISO = Date.prototype.toISOString;

var defaultFormat = formats$1['default'];
var defaults$1 = {
    addQueryPrefix: false,
    allowDots: false,
    charset: 'utf-8',
    charsetSentinel: false,
    delimiter: '&',
    encode: true,
    encoder: utils$1.encode,
    encodeValuesOnly: false,
    format: defaultFormat,
    formatter: formats$1.formatters[defaultFormat],
    // deprecated
    indices: false,
    serializeDate: function serializeDate(date) {
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
    return typeof v === 'string'
        || typeof v === 'number'
        || typeof v === 'boolean'
        || typeof v === 'symbol'
        || typeof v === 'bigint';
};

var sentinel = {};

var stringify$1 = function stringify(
    object,
    prefix,
    generateArrayPrefix,
    commaRoundTrip,
    strictNullHandling,
    skipNulls,
    encoder,
    filter,
    sort,
    allowDots,
    serializeDate,
    format,
    formatter,
    encodeValuesOnly,
    charset,
    sideChannel
) {
    var obj = object;

    var tmpSc = sideChannel;
    var step = 0;
    var findFlag = false;
    while ((tmpSc = tmpSc.get(sentinel)) !== void undefined && !findFlag) {
        // Where object last appeared in the ref tree
        var pos = tmpSc.get(object);
        step += 1;
        if (typeof pos !== 'undefined') {
            if (pos === step) {
                throw new RangeError('Cyclic object value');
            } else {
                findFlag = true; // Break while
            }
        }
        if (typeof tmpSc.get(sentinel) === 'undefined') {
            step = 0;
        }
    }

    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (generateArrayPrefix === 'comma' && isArray$1(obj)) {
        obj = utils$1.maybeMap(obj, function (value) {
            if (value instanceof Date) {
                return serializeDate(value);
            }
            return value;
        });
    }

    if (obj === null) {
        if (strictNullHandling) {
            return encoder && !encodeValuesOnly ? encoder(prefix, defaults$1.encoder, charset, 'key', format) : prefix;
        }

        obj = '';
    }

    if (isNonNullishPrimitive(obj) || utils$1.isBuffer(obj)) {
        if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults$1.encoder, charset, 'key', format);
            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults$1.encoder, charset, 'value', format))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (generateArrayPrefix === 'comma' && isArray$1(obj)) {
        // we need to join elements in
        if (encodeValuesOnly && encoder) {
            obj = utils$1.maybeMap(obj, encoder);
        }
        objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : void undefined }];
    } else if (isArray$1(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    var adjustedPrefix = commaRoundTrip && isArray$1(obj) && obj.length === 1 ? prefix + '[]' : prefix;

    for (var j = 0; j < objKeys.length; ++j) {
        var key = objKeys[j];
        var value = typeof key === 'object' && typeof key.value !== 'undefined' ? key.value : obj[key];

        if (skipNulls && value === null) {
            continue;
        }

        var keyPrefix = isArray$1(obj)
            ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(adjustedPrefix, key) : adjustedPrefix
            : adjustedPrefix + (allowDots ? '.' + key : '[' + key + ']');

        sideChannel.set(object, step);
        var valueSideChannel = getSideChannel();
        valueSideChannel.set(sentinel, sideChannel);
        pushToArray(values, stringify(
            value,
            keyPrefix,
            generateArrayPrefix,
            commaRoundTrip,
            strictNullHandling,
            skipNulls,
            generateArrayPrefix === 'comma' && encodeValuesOnly && isArray$1(obj) ? null : encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            format,
            formatter,
            encodeValuesOnly,
            charset,
            valueSideChannel
        ));
    }

    return values;
};

var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
    if (!opts) {
        return defaults$1;
    }

    if (opts.encoder !== null && typeof opts.encoder !== 'undefined' && typeof opts.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    var charset = opts.charset || defaults$1.charset;
    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }

    var format = formats$1['default'];
    if (typeof opts.format !== 'undefined') {
        if (!has$1.call(formats$1.formatters, opts.format)) {
            throw new TypeError('Unknown format option provided.');
        }
        format = opts.format;
    }
    var formatter = formats$1.formatters[format];

    var filter = defaults$1.filter;
    if (typeof opts.filter === 'function' || isArray$1(opts.filter)) {
        filter = opts.filter;
    }

    return {
        addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults$1.addQueryPrefix,
        allowDots: typeof opts.allowDots === 'undefined' ? defaults$1.allowDots : !!opts.allowDots,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults$1.charsetSentinel,
        delimiter: typeof opts.delimiter === 'undefined' ? defaults$1.delimiter : opts.delimiter,
        encode: typeof opts.encode === 'boolean' ? opts.encode : defaults$1.encode,
        encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults$1.encoder,
        encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults$1.encodeValuesOnly,
        filter: filter,
        format: format,
        formatter: formatter,
        serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults$1.serializeDate,
        skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults$1.skipNulls,
        sort: typeof opts.sort === 'function' ? opts.sort : null,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults$1.strictNullHandling
    };
};

var stringify_1 = function (object, opts) {
    var obj = object;
    var options = normalizeStringifyOptions(opts);

    var objKeys;
    var filter;

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (isArray$1(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (opts && opts.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = opts.arrayFormat;
    } else if (opts && 'indices' in opts) {
        arrayFormat = opts.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];
    if (opts && 'commaRoundTrip' in opts && typeof opts.commaRoundTrip !== 'boolean') {
        throw new TypeError('`commaRoundTrip` must be a boolean, or absent');
    }
    var commaRoundTrip = generateArrayPrefix === 'comma' && opts && opts.commaRoundTrip;

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (options.sort) {
        objKeys.sort(options.sort);
    }

    var sideChannel = getSideChannel();
    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (options.skipNulls && obj[key] === null) {
            continue;
        }
        pushToArray(keys, stringify$1(
            obj[key],
            key,
            generateArrayPrefix,
            commaRoundTrip,
            options.strictNullHandling,
            options.skipNulls,
            options.encode ? options.encoder : null,
            options.filter,
            options.sort,
            options.allowDots,
            options.serializeDate,
            options.format,
            options.formatter,
            options.encodeValuesOnly,
            options.charset,
            sideChannel
        ));
    }

    var joined = keys.join(options.delimiter);
    var prefix = options.addQueryPrefix === true ? '?' : '';

    if (options.charsetSentinel) {
        if (options.charset === 'iso-8859-1') {
            // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
            prefix += 'utf8=%26%2310003%3B&';
        } else {
            // encodeURIComponent('✓')
            prefix += 'utf8=%E2%9C%93&';
        }
    }

    return joined.length > 0 ? prefix + joined : '';
};

var utils = utils$2;

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    allowSparse: false,
    arrayLimit: 20,
    charset: 'utf-8',
    charsetSentinel: false,
    comma: false,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    ignoreQueryPrefix: false,
    interpretNumericEntities: false,
    parameterLimit: 1000,
    parseArrays: true,
    plainObjects: false,
    strictNullHandling: false
};

var interpretNumericEntities = function (str) {
    return str.replace(/&#(\d+);/g, function ($0, numberStr) {
        return String.fromCharCode(parseInt(numberStr, 10));
    });
};

var parseArrayValue = function (val, options) {
    if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
        return val.split(',');
    }

    return val;
};

// This is what browsers will submit when the ✓ character occurs in an
// application/x-www-form-urlencoded body and the encoding of the page containing
// the form is iso-8859-1, or when the submitted form has an accept-charset
// attribute of iso-8859-1. Presumably also with other charsets that do not contain
// the ✓ character, such as us-ascii.
var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

var parseValues = function parseQueryStringValues(str, options) {
    var obj = { __proto__: null };

    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
    var parts = cleanStr.split(options.delimiter, limit);
    var skipIndex = -1; // Keep track of where the utf8 sentinel was found
    var i;

    var charset = options.charset;
    if (options.charsetSentinel) {
        for (i = 0; i < parts.length; ++i) {
            if (parts[i].indexOf('utf8=') === 0) {
                if (parts[i] === charsetSentinel) {
                    charset = 'utf-8';
                } else if (parts[i] === isoSentinel) {
                    charset = 'iso-8859-1';
                }
                skipIndex = i;
                i = parts.length; // The eslint settings do not allow break;
            }
        }
    }

    for (i = 0; i < parts.length; ++i) {
        if (i === skipIndex) {
            continue;
        }
        var part = parts[i];

        var bracketEqualsPos = part.indexOf(']=');
        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part, defaults.decoder, charset, 'key');
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder, charset, 'key');
            val = utils.maybeMap(
                parseArrayValue(part.slice(pos + 1), options),
                function (encodedVal) {
                    return options.decoder(encodedVal, defaults.decoder, charset, 'value');
                }
            );
        }

        if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
            val = interpretNumericEntities(val);
        }

        if (part.indexOf('[]=') > -1) {
            val = isArray(val) ? [val] : val;
        }

        if (has.call(obj, key)) {
            obj[key] = utils.combine(obj[key], val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function (chain, val, options, valuesParsed) {
    var leaf = valuesParsed ? val : parseArrayValue(val, options);

    for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];

        if (root === '[]' && options.parseArrays) {
            obj = [].concat(leaf);
        } else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
            var index = parseInt(cleanRoot, 10);
            if (!options.parseArrays && cleanRoot === '') {
                obj = { 0: leaf };
            } else if (
                !isNaN(index)
                && root !== cleanRoot
                && String(index) === cleanRoot
                && index >= 0
                && (options.parseArrays && index <= options.arrayLimit)
            ) {
                obj = [];
                obj[index] = leaf;
            } else if (cleanRoot !== '__proto__') {
                obj[cleanRoot] = leaf;
            }
        }

        leaf = obj;
    }

    return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var brackets = /(\[[^[\]]*])/;
    var child = /(\[[^[\]]*])/g;

    // Get the parent

    var segment = options.depth > 0 && brackets.exec(key);
    var parent = segment ? key.slice(0, segment.index) : key;

    // Stash the parent if it exists

    var keys = [];
    if (parent) {
        // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(parent);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
            if (!options.allowPrototypes) {
                return;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options, valuesParsed);
};

var normalizeParseOptions = function normalizeParseOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }
    var charset = typeof opts.charset === 'undefined' ? defaults.charset : opts.charset;

    return {
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults.allowPrototypes,
        allowSparse: typeof opts.allowSparse === 'boolean' ? opts.allowSparse : defaults.allowSparse,
        arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults.arrayLimit,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        comma: typeof opts.comma === 'boolean' ? opts.comma : defaults.comma,
        decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults.decoder,
        delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
        // eslint-disable-next-line no-implicit-coercion, no-extra-parens
        depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults.depth,
        ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
        interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
        parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults.parameterLimit,
        parseArrays: opts.parseArrays !== false,
        plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults.plainObjects,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

var parse$8 = function (str, opts) {
    var options = normalizeParseOptions(opts);

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
        obj = utils.merge(obj, newObj, options);
    }

    if (options.allowSparse === true) {
        return obj;
    }

    return utils.compact(obj);
};

var stringify = stringify_1;
var parse$7 = parse$8;
var formats = formats$3;

var lib = {
    formats: formats,
    parse: parse$7,
    stringify: stringify
};

// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
var __awaiter$1 = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(Util, "__esModule", { value: true });
const qs = lib;
const url = require$$1$2;
const path$1 = require$$0$1;
const zlib = require$$3;
/**
 * creates an url from a request url and optional base url (http://server:8080)
 * @param {string} resource - a fully qualified url or relative path
 * @param {string} baseUrl - an optional baseUrl (http://server:8080)
 * @param {IRequestOptions} options - an optional options object, could include QueryParameters e.g.
 * @return {string} - resultant url
 */
function getUrl(resource, baseUrl, queryParams) {
    const pathApi = path$1.posix || path$1;
    let requestUrl = '';
    if (!baseUrl) {
        requestUrl = resource;
    }
    else if (!resource) {
        requestUrl = baseUrl;
    }
    else {
        const base = url.parse(baseUrl);
        const resultantUrl = url.parse(resource);
        // resource (specific per request) elements take priority
        resultantUrl.protocol = resultantUrl.protocol || base.protocol;
        resultantUrl.auth = resultantUrl.auth || base.auth;
        resultantUrl.host = resultantUrl.host || base.host;
        resultantUrl.pathname = pathApi.resolve(base.pathname, resultantUrl.pathname);
        if (!resultantUrl.pathname.endsWith('/') && resource.endsWith('/')) {
            resultantUrl.pathname += '/';
        }
        requestUrl = url.format(resultantUrl);
    }
    return queryParams ?
        getUrlWithParsedQueryParams(requestUrl, queryParams) :
        requestUrl;
}
Util.getUrl = getUrl;
/**
 *
 * @param {string} requestUrl
 * @param {IRequestQueryParams} queryParams
 * @return {string} - Request's URL with Query Parameters appended/parsed.
 */
function getUrlWithParsedQueryParams(requestUrl, queryParams) {
    const url = requestUrl.replace(/\?$/g, ''); // Clean any extra end-of-string "?" character
    const parsedQueryParams = qs.stringify(queryParams.params, buildParamsStringifyOptions(queryParams));
    return `${url}${parsedQueryParams}`;
}
/**
 * Build options for QueryParams Stringifying.
 *
 * @param {IRequestQueryParams} queryParams
 * @return {object}
 */
function buildParamsStringifyOptions(queryParams) {
    let options = {
        addQueryPrefix: true,
        delimiter: (queryParams.options || {}).separator || '&',
        allowDots: (queryParams.options || {}).shouldAllowDots || false,
        arrayFormat: (queryParams.options || {}).arrayFormat || 'repeat',
        encodeValuesOnly: (queryParams.options || {}).shouldOnlyEncodeValues || true
    };
    return options;
}
/**
 * Decompress/Decode gzip encoded JSON
 * Using Node.js built-in zlib module
 *
 * @param {Buffer} buffer
 * @param {string} charset? - optional; defaults to 'utf-8'
 * @return {Promise<string>}
 */
function decompressGzippedContent(buffer, charset) {
    return __awaiter$1(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter$1(this, void 0, void 0, function* () {
            zlib.gunzip(buffer, function (error, buffer) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(buffer.toString(charset || 'utf-8'));
                }
            });
        }));
    });
}
Util.decompressGzippedContent = decompressGzippedContent;
/**
 * Builds a RegExp to test urls against for deciding
 * wether to bypass proxy from an entry of the
 * environment variable setting NO_PROXY
 *
 * @param {string} bypass
 * @return {RegExp}
 */
function buildProxyBypassRegexFromEnv(bypass) {
    try {
        // We need to keep this around for back-compat purposes
        return new RegExp(bypass, 'i');
    }
    catch (err) {
        if (err instanceof SyntaxError && (bypass || "").startsWith("*")) {
            let wildcardEscaped = bypass.replace('*', '(.*)');
            return new RegExp(wildcardEscaped, 'i');
        }
        throw err;
    }
}
Util.buildProxyBypassRegexFromEnv = buildProxyBypassRegexFromEnv;
/**
 * Obtain Response's Content Charset.
 * Through inspecting `content-type` response header.
 * It Returns 'utf-8' if NO charset specified/matched.
 *
 * @param {IHttpClientResponse} response
 * @return {string} - Content Encoding Charset; Default=utf-8
 */
function obtainContentCharset(response) {
    // Find the charset, if specified.
    // Search for the `charset=CHARSET` string, not including `;,\r\n`
    // Example: content-type: 'application/json;charset=utf-8'
    // |__ matches would be ['charset=utf-8', 'utf-8', index: 18, input: 'application/json; charset=utf-8']
    // |_____ matches[1] would have the charset :tada: , in our example it's utf-8
    // However, if the matches Array was empty or no charset found, 'utf-8' would be returned by default.
    const nodeSupportedEncodings = ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'binary', 'hex'];
    const contentType = response.message.headers['content-type'] || '';
    const matches = contentType.match(/charset=([^;,\r\n]+)/i);
    return (matches && matches[1] && nodeSupportedEncodings.indexOf(matches[1]) != -1) ? matches[1] : 'utf-8';
}
Util.obtainContentCharset = obtainContentCharset;

var tunnel$1 = {};

var hasRequiredTunnel$1;

function requireTunnel$1 () {
	if (hasRequiredTunnel$1) return tunnel$1;
	hasRequiredTunnel$1 = 1;
	var tls = require$$1$3;
	var http = require$$2$2;
	var https = require$$3$1;
	var events = require$$2;
	var util = require$$0$4;


	tunnel$1.httpOverHttp = httpOverHttp;
	tunnel$1.httpsOverHttp = httpsOverHttp;
	tunnel$1.httpOverHttps = httpOverHttps;
	tunnel$1.httpsOverHttps = httpsOverHttps;


	function httpOverHttp(options) {
	  var agent = new TunnelingAgent(options);
	  agent.request = http.request;
	  return agent;
	}

	function httpsOverHttp(options) {
	  var agent = new TunnelingAgent(options);
	  agent.request = http.request;
	  agent.createSocket = createSecureSocket;
	  agent.defaultPort = 443;
	  return agent;
	}

	function httpOverHttps(options) {
	  var agent = new TunnelingAgent(options);
	  agent.request = https.request;
	  return agent;
	}

	function httpsOverHttps(options) {
	  var agent = new TunnelingAgent(options);
	  agent.request = https.request;
	  agent.createSocket = createSecureSocket;
	  agent.defaultPort = 443;
	  return agent;
	}


	function TunnelingAgent(options) {
	  var self = this;
	  self.options = options || {};
	  self.proxyOptions = self.options.proxy || {};
	  self.maxSockets = self.options.maxSockets || http.Agent.defaultMaxSockets;
	  self.requests = [];
	  self.sockets = [];

	  self.on('free', function onFree(socket, host, port, localAddress) {
	    var options = toOptions(host, port, localAddress);
	    for (var i = 0, len = self.requests.length; i < len; ++i) {
	      var pending = self.requests[i];
	      if (pending.host === options.host && pending.port === options.port) {
	        // Detect the request to connect same origin server,
	        // reuse the connection.
	        self.requests.splice(i, 1);
	        pending.request.onSocket(socket);
	        return;
	      }
	    }
	    socket.destroy();
	    self.removeSocket(socket);
	  });
	}
	util.inherits(TunnelingAgent, events.EventEmitter);

	TunnelingAgent.prototype.addRequest = function addRequest(req, host, port, localAddress) {
	  var self = this;
	  var options = mergeOptions({request: req}, self.options, toOptions(host, port, localAddress));

	  if (self.sockets.length >= this.maxSockets) {
	    // We are over limit so we'll add it to the queue.
	    self.requests.push(options);
	    return;
	  }

	  // If we are under maxSockets create a new one.
	  self.createSocket(options, function(socket) {
	    socket.on('free', onFree);
	    socket.on('close', onCloseOrRemove);
	    socket.on('agentRemove', onCloseOrRemove);
	    req.onSocket(socket);

	    function onFree() {
	      self.emit('free', socket, options);
	    }

	    function onCloseOrRemove(err) {
	      self.removeSocket(socket);
	      socket.removeListener('free', onFree);
	      socket.removeListener('close', onCloseOrRemove);
	      socket.removeListener('agentRemove', onCloseOrRemove);
	    }
	  });
	};

	TunnelingAgent.prototype.createSocket = function createSocket(options, cb) {
	  var self = this;
	  var placeholder = {};
	  self.sockets.push(placeholder);

	  var connectOptions = mergeOptions({}, self.proxyOptions, {
	    method: 'CONNECT',
	    path: options.host + ':' + options.port,
	    agent: false,
	    headers: {
	      host: options.host + ':' + options.port
	    }
	  });
	  if (options.localAddress) {
	    connectOptions.localAddress = options.localAddress;
	  }
	  if (connectOptions.proxyAuth) {
	    connectOptions.headers = connectOptions.headers || {};
	    connectOptions.headers['Proxy-Authorization'] = 'Basic ' +
	        new Buffer(connectOptions.proxyAuth).toString('base64');
	  }

	  debug('making CONNECT request');
	  var connectReq = self.request(connectOptions);
	  connectReq.useChunkedEncodingByDefault = false; // for v0.6
	  connectReq.once('response', onResponse); // for v0.6
	  connectReq.once('upgrade', onUpgrade);   // for v0.6
	  connectReq.once('connect', onConnect);   // for v0.7 or later
	  connectReq.once('error', onError);
	  connectReq.end();

	  function onResponse(res) {
	    // Very hacky. This is necessary to avoid http-parser leaks.
	    res.upgrade = true;
	  }

	  function onUpgrade(res, socket, head) {
	    // Hacky.
	    process.nextTick(function() {
	      onConnect(res, socket, head);
	    });
	  }

	  function onConnect(res, socket, head) {
	    connectReq.removeAllListeners();
	    socket.removeAllListeners();

	    if (res.statusCode !== 200) {
	      debug('tunneling socket could not be established, statusCode=%d',
	        res.statusCode);
	      socket.destroy();
	      var error = new Error('tunneling socket could not be established, ' +
	        'statusCode=' + res.statusCode);
	      error.code = 'ECONNRESET';
	      options.request.emit('error', error);
	      self.removeSocket(placeholder);
	      return;
	    }
	    if (head.length > 0) {
	      debug('got illegal response body from proxy');
	      socket.destroy();
	      var error = new Error('got illegal response body from proxy');
	      error.code = 'ECONNRESET';
	      options.request.emit('error', error);
	      self.removeSocket(placeholder);
	      return;
	    }
	    debug('tunneling connection has established');
	    self.sockets[self.sockets.indexOf(placeholder)] = socket;
	    return cb(socket);
	  }

	  function onError(cause) {
	    connectReq.removeAllListeners();

	    debug('tunneling socket could not be established, cause=%s\n',
	          cause.message, cause.stack);
	    var error = new Error('tunneling socket could not be established, ' +
	                          'cause=' + cause.message);
	    error.code = 'ECONNRESET';
	    options.request.emit('error', error);
	    self.removeSocket(placeholder);
	  }
	};

	TunnelingAgent.prototype.removeSocket = function removeSocket(socket) {
	  var pos = this.sockets.indexOf(socket);
	  if (pos === -1) {
	    return;
	  }
	  this.sockets.splice(pos, 1);

	  var pending = this.requests.shift();
	  if (pending) {
	    // If we have pending requests and a socket gets closed a new one
	    // needs to be created to take over in the pool for the one that closed.
	    this.createSocket(pending, function(socket) {
	      pending.request.onSocket(socket);
	    });
	  }
	};

	function createSecureSocket(options, cb) {
	  var self = this;
	  TunnelingAgent.prototype.createSocket.call(self, options, function(socket) {
	    var hostHeader = options.request.getHeader('host');
	    var tlsOptions = mergeOptions({}, self.options, {
	      socket: socket,
	      servername: hostHeader ? hostHeader.replace(/:.*$/, '') : options.host
	    });

	    // 0 is dummy port for v0.6
	    var secureSocket = tls.connect(0, tlsOptions);
	    self.sockets[self.sockets.indexOf(socket)] = secureSocket;
	    cb(secureSocket);
	  });
	}


	function toOptions(host, port, localAddress) {
	  if (typeof host === 'string') { // since v0.10
	    return {
	      host: host,
	      port: port,
	      localAddress: localAddress
	    };
	  }
	  return host; // for v0.11 or later
	}

	function mergeOptions(target) {
	  for (var i = 1, len = arguments.length; i < len; ++i) {
	    var overrides = arguments[i];
	    if (typeof overrides === 'object') {
	      var keys = Object.keys(overrides);
	      for (var j = 0, keyLen = keys.length; j < keyLen; ++j) {
	        var k = keys[j];
	        if (overrides[k] !== undefined) {
	          target[k] = overrides[k];
	        }
	      }
	    }
	  }
	  return target;
	}


	var debug;
	if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) {
	  debug = function() {
	    var args = Array.prototype.slice.call(arguments);
	    if (typeof args[0] === 'string') {
	      args[0] = 'TUNNEL: ' + args[0];
	    } else {
	      args.unshift('TUNNEL:');
	    }
	    console.error.apply(console, args);
	  };
	} else {
	  debug = function() {};
	}
	tunnel$1.debug = debug; // for test
	return tunnel$1;
}

var tunnel;
var hasRequiredTunnel;

function requireTunnel () {
	if (hasRequiredTunnel) return tunnel;
	hasRequiredTunnel = 1;
	tunnel = requireTunnel$1();
	return tunnel;
}

(function (exports) {
	// Copyright (c) Microsoft. All rights reserved.
	// Licensed under the MIT license. See LICENSE file in the project root for full license information.
	var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	const url = require$$1$2;
	const http = require$$2$2;
	const https = require$$3$1;
	const util = Util;
	let fs;
	let tunnel;
	var HttpCodes;
	(function (HttpCodes) {
	    HttpCodes[HttpCodes["OK"] = 200] = "OK";
	    HttpCodes[HttpCodes["MultipleChoices"] = 300] = "MultipleChoices";
	    HttpCodes[HttpCodes["MovedPermanently"] = 301] = "MovedPermanently";
	    HttpCodes[HttpCodes["ResourceMoved"] = 302] = "ResourceMoved";
	    HttpCodes[HttpCodes["SeeOther"] = 303] = "SeeOther";
	    HttpCodes[HttpCodes["NotModified"] = 304] = "NotModified";
	    HttpCodes[HttpCodes["UseProxy"] = 305] = "UseProxy";
	    HttpCodes[HttpCodes["SwitchProxy"] = 306] = "SwitchProxy";
	    HttpCodes[HttpCodes["TemporaryRedirect"] = 307] = "TemporaryRedirect";
	    HttpCodes[HttpCodes["PermanentRedirect"] = 308] = "PermanentRedirect";
	    HttpCodes[HttpCodes["BadRequest"] = 400] = "BadRequest";
	    HttpCodes[HttpCodes["Unauthorized"] = 401] = "Unauthorized";
	    HttpCodes[HttpCodes["PaymentRequired"] = 402] = "PaymentRequired";
	    HttpCodes[HttpCodes["Forbidden"] = 403] = "Forbidden";
	    HttpCodes[HttpCodes["NotFound"] = 404] = "NotFound";
	    HttpCodes[HttpCodes["MethodNotAllowed"] = 405] = "MethodNotAllowed";
	    HttpCodes[HttpCodes["NotAcceptable"] = 406] = "NotAcceptable";
	    HttpCodes[HttpCodes["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
	    HttpCodes[HttpCodes["RequestTimeout"] = 408] = "RequestTimeout";
	    HttpCodes[HttpCodes["Conflict"] = 409] = "Conflict";
	    HttpCodes[HttpCodes["Gone"] = 410] = "Gone";
	    HttpCodes[HttpCodes["TooManyRequests"] = 429] = "TooManyRequests";
	    HttpCodes[HttpCodes["InternalServerError"] = 500] = "InternalServerError";
	    HttpCodes[HttpCodes["NotImplemented"] = 501] = "NotImplemented";
	    HttpCodes[HttpCodes["BadGateway"] = 502] = "BadGateway";
	    HttpCodes[HttpCodes["ServiceUnavailable"] = 503] = "ServiceUnavailable";
	    HttpCodes[HttpCodes["GatewayTimeout"] = 504] = "GatewayTimeout";
	})(HttpCodes = exports.HttpCodes || (exports.HttpCodes = {}));
	const HttpRedirectCodes = [HttpCodes.MovedPermanently, HttpCodes.ResourceMoved, HttpCodes.SeeOther, HttpCodes.TemporaryRedirect, HttpCodes.PermanentRedirect];
	const HttpResponseRetryCodes = [HttpCodes.BadGateway, HttpCodes.ServiceUnavailable, HttpCodes.GatewayTimeout];
	const NetworkRetryErrors = ['ECONNRESET', 'ENOTFOUND', 'ESOCKETTIMEDOUT', 'ETIMEDOUT', 'ECONNREFUSED'];
	const RetryableHttpVerbs = ['OPTIONS', 'GET', 'DELETE', 'HEAD'];
	const ExponentialBackoffCeiling = 10;
	const ExponentialBackoffTimeSlice = 5;
	class HttpClientResponse {
	    constructor(message) {
	        this.message = message;
	    }
	    readBody() {
	        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
	            const chunks = [];
	            const encodingCharset = util.obtainContentCharset(this);
	            // Extract Encoding from header: 'content-encoding'
	            // Match `gzip`, `gzip, deflate` variations of GZIP encoding
	            const contentEncoding = this.message.headers['content-encoding'] || '';
	            const isGzippedEncoded = new RegExp('(gzip$)|(gzip, *deflate)').test(contentEncoding);
	            this.message.on('data', function (data) {
	                const chunk = (typeof data === 'string') ? Buffer.from(data, encodingCharset) : data;
	                chunks.push(chunk);
	            }).on('end', function () {
	                return __awaiter(this, void 0, void 0, function* () {
	                    const buffer = Buffer.concat(chunks);
	                    if (isGzippedEncoded) { // Process GZipped Response Body HERE
	                        const gunzippedBody = yield util.decompressGzippedContent(buffer, encodingCharset);
	                        resolve(gunzippedBody);
	                    }
	                    else {
	                        resolve(buffer.toString(encodingCharset));
	                    }
	                });
	            }).on('error', function (err) {
	                reject(err);
	            });
	        }));
	    }
	}
	exports.HttpClientResponse = HttpClientResponse;
	function isHttps(requestUrl) {
	    let parsedUrl = url.parse(requestUrl);
	    return parsedUrl.protocol === 'https:';
	}
	exports.isHttps = isHttps;
	var EnvironmentVariables;
	(function (EnvironmentVariables) {
	    EnvironmentVariables["HTTP_PROXY"] = "HTTP_PROXY";
	    EnvironmentVariables["HTTPS_PROXY"] = "HTTPS_PROXY";
	    EnvironmentVariables["NO_PROXY"] = "NO_PROXY";
	})(EnvironmentVariables || (EnvironmentVariables = {}));
	class HttpClient {
	    constructor(userAgent, handlers, requestOptions) {
	        this._ignoreSslError = false;
	        this._allowRedirects = true;
	        this._allowRedirectDowngrade = false;
	        this._maxRedirects = 50;
	        this._allowRetries = false;
	        this._maxRetries = 1;
	        this._keepAlive = false;
	        this._disposed = false;
	        this.userAgent = userAgent;
	        this.handlers = handlers || [];
	        let no_proxy = process.env[EnvironmentVariables.NO_PROXY];
	        if (no_proxy) {
	            this._httpProxyBypassHosts = [];
	            no_proxy.split(',').forEach(bypass => {
	                this._httpProxyBypassHosts.push(util.buildProxyBypassRegexFromEnv(bypass));
	            });
	        }
	        this.requestOptions = requestOptions;
	        if (requestOptions) {
	            if (requestOptions.ignoreSslError != null) {
	                this._ignoreSslError = requestOptions.ignoreSslError;
	            }
	            this._socketTimeout = requestOptions.socketTimeout;
	            this._httpProxy = requestOptions.proxy;
	            if (requestOptions.proxy && requestOptions.proxy.proxyBypassHosts) {
	                this._httpProxyBypassHosts = [];
	                requestOptions.proxy.proxyBypassHosts.forEach(bypass => {
	                    this._httpProxyBypassHosts.push(new RegExp(bypass, 'i'));
	                });
	            }
	            this._certConfig = requestOptions.cert;
	            if (this._certConfig) {
	                // If using cert, need fs
	                fs = require$$1;
	                // cache the cert content into memory, so we don't have to read it from disk every time
	                if (this._certConfig.caFile && fs.existsSync(this._certConfig.caFile)) {
	                    this._ca = fs.readFileSync(this._certConfig.caFile, 'utf8');
	                }
	                if (this._certConfig.certFile && fs.existsSync(this._certConfig.certFile)) {
	                    this._cert = fs.readFileSync(this._certConfig.certFile, 'utf8');
	                }
	                if (this._certConfig.keyFile && fs.existsSync(this._certConfig.keyFile)) {
	                    this._key = fs.readFileSync(this._certConfig.keyFile, 'utf8');
	                }
	            }
	            if (requestOptions.allowRedirects != null) {
	                this._allowRedirects = requestOptions.allowRedirects;
	            }
	            if (requestOptions.allowRedirectDowngrade != null) {
	                this._allowRedirectDowngrade = requestOptions.allowRedirectDowngrade;
	            }
	            if (requestOptions.maxRedirects != null) {
	                this._maxRedirects = Math.max(requestOptions.maxRedirects, 0);
	            }
	            if (requestOptions.keepAlive != null) {
	                this._keepAlive = requestOptions.keepAlive;
	            }
	            if (requestOptions.allowRetries != null) {
	                this._allowRetries = requestOptions.allowRetries;
	            }
	            if (requestOptions.maxRetries != null) {
	                this._maxRetries = requestOptions.maxRetries;
	            }
	        }
	    }
	    options(requestUrl, additionalHeaders) {
	        return this.request('OPTIONS', requestUrl, null, additionalHeaders || {});
	    }
	    get(requestUrl, additionalHeaders) {
	        return this.request('GET', requestUrl, null, additionalHeaders || {});
	    }
	    del(requestUrl, additionalHeaders) {
	        return this.request('DELETE', requestUrl, null, additionalHeaders || {});
	    }
	    post(requestUrl, data, additionalHeaders) {
	        return this.request('POST', requestUrl, data, additionalHeaders || {});
	    }
	    patch(requestUrl, data, additionalHeaders) {
	        return this.request('PATCH', requestUrl, data, additionalHeaders || {});
	    }
	    put(requestUrl, data, additionalHeaders) {
	        return this.request('PUT', requestUrl, data, additionalHeaders || {});
	    }
	    head(requestUrl, additionalHeaders) {
	        return this.request('HEAD', requestUrl, null, additionalHeaders || {});
	    }
	    sendStream(verb, requestUrl, stream, additionalHeaders) {
	        return this.request(verb, requestUrl, stream, additionalHeaders);
	    }
	    /**
	     * Makes a raw http request.
	     * All other methods such as get, post, patch, and request ultimately call this.
	     * Prefer get, del, post and patch
	     */
	    request(verb, requestUrl, data, headers) {
	        return __awaiter(this, void 0, void 0, function* () {
	            if (this._disposed) {
	                throw new Error("Client has already been disposed.");
	            }
	            let parsedUrl = url.parse(requestUrl);
	            let info = this._prepareRequest(verb, parsedUrl, headers);
	            // Only perform retries on reads since writes may not be idempotent.
	            let maxTries = (this._allowRetries && RetryableHttpVerbs.indexOf(verb) != -1) ? this._maxRetries + 1 : 1;
	            let numTries = 0;
	            let response;
	            while (numTries < maxTries) {
	                try {
	                    response = yield this.requestRaw(info, data);
	                }
	                catch (err) {
	                    numTries++;
	                    if (err && err.code && NetworkRetryErrors.indexOf(err.code) > -1 && numTries < maxTries) {
	                        yield this._performExponentialBackoff(numTries);
	                        continue;
	                    }
	                    throw err;
	                }
	                // Check if it's an authentication challenge
	                if (response && response.message && response.message.statusCode === HttpCodes.Unauthorized) {
	                    let authenticationHandler;
	                    for (let i = 0; i < this.handlers.length; i++) {
	                        if (this.handlers[i].canHandleAuthentication(response)) {
	                            authenticationHandler = this.handlers[i];
	                            break;
	                        }
	                    }
	                    if (authenticationHandler) {
	                        return authenticationHandler.handleAuthentication(this, info, data);
	                    }
	                    else {
	                        // We have received an unauthorized response but have no handlers to handle it.
	                        // Let the response return to the caller.
	                        return response;
	                    }
	                }
	                let redirectsRemaining = this._maxRedirects;
	                while (HttpRedirectCodes.indexOf(response.message.statusCode) != -1
	                    && this._allowRedirects
	                    && redirectsRemaining > 0) {
	                    const redirectUrl = response.message.headers["location"];
	                    if (!redirectUrl) {
	                        // if there's no location to redirect to, we won't
	                        break;
	                    }
	                    let parsedRedirectUrl = url.parse(redirectUrl);
	                    if (parsedUrl.protocol == 'https:' && parsedUrl.protocol != parsedRedirectUrl.protocol && !this._allowRedirectDowngrade) {
	                        throw new Error("Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.");
	                    }
	                    // we need to finish reading the response before reassigning response
	                    // which will leak the open socket.
	                    yield response.readBody();
	                    // let's make the request with the new redirectUrl
	                    info = this._prepareRequest(verb, parsedRedirectUrl, headers);
	                    response = yield this.requestRaw(info, data);
	                    redirectsRemaining--;
	                }
	                if (HttpResponseRetryCodes.indexOf(response.message.statusCode) == -1) {
	                    // If not a retry code, return immediately instead of retrying
	                    return response;
	                }
	                numTries += 1;
	                if (numTries < maxTries) {
	                    yield response.readBody();
	                    yield this._performExponentialBackoff(numTries);
	                }
	            }
	            return response;
	        });
	    }
	    /**
	     * Needs to be called if keepAlive is set to true in request options.
	     */
	    dispose() {
	        if (this._agent) {
	            this._agent.destroy();
	        }
	        this._disposed = true;
	    }
	    /**
	     * Raw request.
	     * @param info
	     * @param data
	     */
	    requestRaw(info, data) {
	        return new Promise((resolve, reject) => {
	            let callbackForResult = function (err, res) {
	                if (err) {
	                    reject(err);
	                }
	                resolve(res);
	            };
	            this.requestRawWithCallback(info, data, callbackForResult);
	        });
	    }
	    /**
	     * Raw request with callback.
	     * @param info
	     * @param data
	     * @param onResult
	     */
	    requestRawWithCallback(info, data, onResult) {
	        let socket;
	        if (typeof (data) === 'string') {
	            info.options.headers["Content-Length"] = Buffer.byteLength(data, 'utf8');
	        }
	        let callbackCalled = false;
	        let handleResult = (err, res) => {
	            if (!callbackCalled) {
	                callbackCalled = true;
	                onResult(err, res);
	            }
	        };
	        let req = info.httpModule.request(info.options, (msg) => {
	            let res = new HttpClientResponse(msg);
	            handleResult(null, res);
	        });
	        req.on('socket', (sock) => {
	            socket = sock;
	        });
	        // If we ever get disconnected, we want the socket to timeout eventually
	        req.setTimeout(this._socketTimeout || 3 * 60000, () => {
	            if (socket) {
	                socket.destroy();
	            }
	            handleResult(new Error('Request timeout: ' + info.options.path), null);
	        });
	        req.on('error', function (err) {
	            // err has statusCode property
	            // res should have headers
	            handleResult(err, null);
	        });
	        if (data && typeof (data) === 'string') {
	            req.write(data, 'utf8');
	        }
	        if (data && typeof (data) !== 'string') {
	            data.on('close', function () {
	                req.end();
	            });
	            data.pipe(req);
	        }
	        else {
	            req.end();
	        }
	    }
	    _prepareRequest(method, requestUrl, headers) {
	        const info = {};
	        info.parsedUrl = requestUrl;
	        const usingSsl = info.parsedUrl.protocol === 'https:';
	        info.httpModule = usingSsl ? https : http;
	        const defaultPort = usingSsl ? 443 : 80;
	        info.options = {};
	        info.options.host = info.parsedUrl.hostname;
	        info.options.port = info.parsedUrl.port ? parseInt(info.parsedUrl.port) : defaultPort;
	        info.options.path = (info.parsedUrl.pathname || '') + (info.parsedUrl.search || '');
	        info.options.method = method;
	        info.options.timeout = (this.requestOptions && this.requestOptions.socketTimeout) || this._socketTimeout;
	        this._socketTimeout = info.options.timeout;
	        info.options.headers = this._mergeHeaders(headers);
	        if (this.userAgent != null) {
	            info.options.headers["user-agent"] = this.userAgent;
	        }
	        info.options.agent = this._getAgent(info.parsedUrl);
	        // gives handlers an opportunity to participate
	        if (this.handlers && !this._isPresigned(url.format(requestUrl))) {
	            this.handlers.forEach((handler) => {
	                handler.prepareRequest(info.options);
	            });
	        }
	        return info;
	    }
	    _isPresigned(requestUrl) {
	        if (this.requestOptions && this.requestOptions.presignedUrlPatterns) {
	            const patterns = this.requestOptions.presignedUrlPatterns;
	            for (let i = 0; i < patterns.length; i++) {
	                if (requestUrl.match(patterns[i])) {
	                    return true;
	                }
	            }
	        }
	        return false;
	    }
	    _mergeHeaders(headers) {
	        const lowercaseKeys = obj => Object.keys(obj).reduce((c, k) => (c[k.toLowerCase()] = obj[k], c), {});
	        if (this.requestOptions && this.requestOptions.headers) {
	            return Object.assign({}, lowercaseKeys(this.requestOptions.headers), lowercaseKeys(headers));
	        }
	        return lowercaseKeys(headers || {});
	    }
	    _getAgent(parsedUrl) {
	        let agent;
	        let proxy = this._getProxy(parsedUrl);
	        let useProxy = proxy.proxyUrl && proxy.proxyUrl.hostname && !this._isMatchInBypassProxyList(parsedUrl);
	        if (this._keepAlive && useProxy) {
	            agent = this._proxyAgent;
	        }
	        if (this._keepAlive && !useProxy) {
	            agent = this._agent;
	        }
	        // if agent is already assigned use that agent.
	        if (!!agent) {
	            return agent;
	        }
	        const usingSsl = parsedUrl.protocol === 'https:';
	        let maxSockets = 100;
	        if (!!this.requestOptions) {
	            maxSockets = this.requestOptions.maxSockets || http.globalAgent.maxSockets;
	        }
	        if (useProxy) {
	            // If using proxy, need tunnel
	            if (!tunnel) {
	                tunnel = requireTunnel();
	            }
	            const agentOptions = {
	                maxSockets: maxSockets,
	                keepAlive: this._keepAlive,
	                proxy: {
	                    proxyAuth: proxy.proxyAuth,
	                    host: proxy.proxyUrl.hostname,
	                    port: proxy.proxyUrl.port
	                },
	            };
	            let tunnelAgent;
	            const overHttps = proxy.proxyUrl.protocol === 'https:';
	            if (usingSsl) {
	                tunnelAgent = overHttps ? tunnel.httpsOverHttps : tunnel.httpsOverHttp;
	            }
	            else {
	                tunnelAgent = overHttps ? tunnel.httpOverHttps : tunnel.httpOverHttp;
	            }
	            agent = tunnelAgent(agentOptions);
	            this._proxyAgent = agent;
	        }
	        // if reusing agent across request and tunneling agent isn't assigned create a new agent
	        if (this._keepAlive && !agent) {
	            const options = { keepAlive: this._keepAlive, maxSockets: maxSockets };
	            agent = usingSsl ? new https.Agent(options) : new http.Agent(options);
	            this._agent = agent;
	        }
	        // if not using private agent and tunnel agent isn't setup then use global agent
	        if (!agent) {
	            agent = usingSsl ? https.globalAgent : http.globalAgent;
	        }
	        if (usingSsl && this._ignoreSslError) {
	            // we don't want to set NODE_TLS_REJECT_UNAUTHORIZED=0 since that will affect request for entire process
	            // http.RequestOptions doesn't expose a way to modify RequestOptions.agent.options
	            // we have to cast it to any and change it directly
	            agent.options = Object.assign(agent.options || {}, { rejectUnauthorized: false });
	        }
	        if (usingSsl && this._certConfig) {
	            agent.options = Object.assign(agent.options || {}, { ca: this._ca, cert: this._cert, key: this._key, passphrase: this._certConfig.passphrase });
	        }
	        return agent;
	    }
	    _getProxy(parsedUrl) {
	        let usingSsl = parsedUrl.protocol === 'https:';
	        let proxyConfig = this._httpProxy;
	        // fallback to http_proxy and https_proxy env
	        let https_proxy = process.env[EnvironmentVariables.HTTPS_PROXY];
	        let http_proxy = process.env[EnvironmentVariables.HTTP_PROXY];
	        if (!proxyConfig) {
	            if (https_proxy && usingSsl) {
	                proxyConfig = {
	                    proxyUrl: https_proxy
	                };
	            }
	            else if (http_proxy) {
	                proxyConfig = {
	                    proxyUrl: http_proxy
	                };
	            }
	        }
	        let proxyUrl;
	        let proxyAuth;
	        if (proxyConfig) {
	            if (proxyConfig.proxyUrl.length > 0) {
	                proxyUrl = url.parse(proxyConfig.proxyUrl);
	            }
	            if (proxyConfig.proxyUsername || proxyConfig.proxyPassword) {
	                proxyAuth = proxyConfig.proxyUsername + ":" + proxyConfig.proxyPassword;
	            }
	        }
	        return { proxyUrl: proxyUrl, proxyAuth: proxyAuth };
	    }
	    _isMatchInBypassProxyList(parsedUrl) {
	        if (!this._httpProxyBypassHosts) {
	            return false;
	        }
	        let bypass = false;
	        this._httpProxyBypassHosts.forEach(bypassHost => {
	            if (bypassHost.test(parsedUrl.href)) {
	                bypass = true;
	            }
	        });
	        return bypass;
	    }
	    _performExponentialBackoff(retryNumber) {
	        retryNumber = Math.min(ExponentialBackoffCeiling, retryNumber);
	        const ms = ExponentialBackoffTimeSlice * Math.pow(2, retryNumber);
	        return new Promise(resolve => setTimeout(() => resolve(), ms));
	    }
	}
	exports.HttpClient = HttpClient; 
} (HttpClient));

var semver$3 = {exports: {}};

(function (module, exports) {
	exports = module.exports = SemVer;

	var debug;
	/* istanbul ignore next */
	if (typeof process === 'object' &&
	    process.env &&
	    process.env.NODE_DEBUG &&
	    /\bsemver\b/i.test(process.env.NODE_DEBUG)) {
	  debug = function () {
	    var args = Array.prototype.slice.call(arguments, 0);
	    args.unshift('SEMVER');
	    console.log.apply(console, args);
	  };
	} else {
	  debug = function () {};
	}

	// Note: this is the semver.org version of the spec that it implements
	// Not necessarily the package version of this code.
	exports.SEMVER_SPEC_VERSION = '2.0.0';

	var MAX_LENGTH = 256;
	var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
	  /* istanbul ignore next */ 9007199254740991;

	// Max safe segment length for coercion.
	var MAX_SAFE_COMPONENT_LENGTH = 16;

	var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;

	// The actual regexps go on exports.re
	var re = exports.re = [];
	var safeRe = exports.safeRe = [];
	var src = exports.src = [];
	var R = 0;

	var LETTERDASHNUMBER = '[a-zA-Z0-9-]';

	// Replace some greedy regex tokens to prevent regex dos issues. These regex are
	// used internally via the safeRe object since all inputs in this library get
	// normalized first to trim and collapse all extra whitespace. The original
	// regexes are exported for userland consumption and lower level usage. A
	// future breaking change could export the safer regex only with a note that
	// all input should have extra whitespace removed.
	var safeRegexReplacements = [
	  ['\\s', 1],
	  ['\\d', MAX_LENGTH],
	  [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH],
	];

	function makeSafeRe (value) {
	  for (var i = 0; i < safeRegexReplacements.length; i++) {
	    var token = safeRegexReplacements[i][0];
	    var max = safeRegexReplacements[i][1];
	    value = value
	      .split(token + '*').join(token + '{0,' + max + '}')
	      .split(token + '+').join(token + '{1,' + max + '}');
	  }
	  return value
	}

	// The following Regular Expressions can be used for tokenizing,
	// validating, and parsing SemVer version strings.

	// ## Numeric Identifier
	// A single `0`, or a non-zero digit followed by zero or more digits.

	var NUMERICIDENTIFIER = R++;
	src[NUMERICIDENTIFIER] = '0|[1-9]\\d*';
	var NUMERICIDENTIFIERLOOSE = R++;
	src[NUMERICIDENTIFIERLOOSE] = '\\d+';

	// ## Non-numeric Identifier
	// Zero or more digits, followed by a letter or hyphen, and then zero or
	// more letters, digits, or hyphens.

	var NONNUMERICIDENTIFIER = R++;
	src[NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-]' + LETTERDASHNUMBER + '*';

	// ## Main Version
	// Three dot-separated numeric identifiers.

	var MAINVERSION = R++;
	src[MAINVERSION] = '(' + src[NUMERICIDENTIFIER] + ')\\.' +
	                   '(' + src[NUMERICIDENTIFIER] + ')\\.' +
	                   '(' + src[NUMERICIDENTIFIER] + ')';

	var MAINVERSIONLOOSE = R++;
	src[MAINVERSIONLOOSE] = '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
	                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
	                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')';

	// ## Pre-release Version Identifier
	// A numeric identifier, or a non-numeric identifier.

	var PRERELEASEIDENTIFIER = R++;
	src[PRERELEASEIDENTIFIER] = '(?:' + src[NUMERICIDENTIFIER] +
	                            '|' + src[NONNUMERICIDENTIFIER] + ')';

	var PRERELEASEIDENTIFIERLOOSE = R++;
	src[PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[NUMERICIDENTIFIERLOOSE] +
	                                 '|' + src[NONNUMERICIDENTIFIER] + ')';

	// ## Pre-release Version
	// Hyphen, followed by one or more dot-separated pre-release version
	// identifiers.

	var PRERELEASE = R++;
	src[PRERELEASE] = '(?:-(' + src[PRERELEASEIDENTIFIER] +
	                  '(?:\\.' + src[PRERELEASEIDENTIFIER] + ')*))';

	var PRERELEASELOOSE = R++;
	src[PRERELEASELOOSE] = '(?:-?(' + src[PRERELEASEIDENTIFIERLOOSE] +
	                       '(?:\\.' + src[PRERELEASEIDENTIFIERLOOSE] + ')*))';

	// ## Build Metadata Identifier
	// Any combination of digits, letters, or hyphens.

	var BUILDIDENTIFIER = R++;
	src[BUILDIDENTIFIER] = LETTERDASHNUMBER + '+';

	// ## Build Metadata
	// Plus sign, followed by one or more period-separated build metadata
	// identifiers.

	var BUILD = R++;
	src[BUILD] = '(?:\\+(' + src[BUILDIDENTIFIER] +
	             '(?:\\.' + src[BUILDIDENTIFIER] + ')*))';

	// ## Full Version String
	// A main version, followed optionally by a pre-release version and
	// build metadata.

	// Note that the only major, minor, patch, and pre-release sections of
	// the version string are capturing groups.  The build metadata is not a
	// capturing group, because it should not ever be used in version
	// comparison.

	var FULL = R++;
	var FULLPLAIN = 'v?' + src[MAINVERSION] +
	                src[PRERELEASE] + '?' +
	                src[BUILD] + '?';

	src[FULL] = '^' + FULLPLAIN + '$';

	// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
	// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
	// common in the npm registry.
	var LOOSEPLAIN = '[v=\\s]*' + src[MAINVERSIONLOOSE] +
	                 src[PRERELEASELOOSE] + '?' +
	                 src[BUILD] + '?';

	var LOOSE = R++;
	src[LOOSE] = '^' + LOOSEPLAIN + '$';

	var GTLT = R++;
	src[GTLT] = '((?:<|>)?=?)';

	// Something like "2.*" or "1.2.x".
	// Note that "x.x" is a valid xRange identifer, meaning "any version"
	// Only the first item is strictly required.
	var XRANGEIDENTIFIERLOOSE = R++;
	src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
	var XRANGEIDENTIFIER = R++;
	src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + '|x|X|\\*';

	var XRANGEPLAIN = R++;
	src[XRANGEPLAIN] = '[v=\\s]*(' + src[XRANGEIDENTIFIER] + ')' +
	                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
	                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
	                   '(?:' + src[PRERELEASE] + ')?' +
	                   src[BUILD] + '?' +
	                   ')?)?';

	var XRANGEPLAINLOOSE = R++;
	src[XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
	                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
	                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
	                        '(?:' + src[PRERELEASELOOSE] + ')?' +
	                        src[BUILD] + '?' +
	                        ')?)?';

	var XRANGE = R++;
	src[XRANGE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAIN] + '$';
	var XRANGELOOSE = R++;
	src[XRANGELOOSE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAINLOOSE] + '$';

	// Coercion.
	// Extract anything that could conceivably be a part of a valid semver
	var COERCE = R++;
	src[COERCE] = '(?:^|[^\\d])' +
	              '(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '})' +
	              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
	              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
	              '(?:$|[^\\d])';

	// Tilde ranges.
	// Meaning is "reasonably at or greater than"
	var LONETILDE = R++;
	src[LONETILDE] = '(?:~>?)';

	var TILDETRIM = R++;
	src[TILDETRIM] = '(\\s*)' + src[LONETILDE] + '\\s+';
	re[TILDETRIM] = new RegExp(src[TILDETRIM], 'g');
	safeRe[TILDETRIM] = new RegExp(makeSafeRe(src[TILDETRIM]), 'g');
	var tildeTrimReplace = '$1~';

	var TILDE = R++;
	src[TILDE] = '^' + src[LONETILDE] + src[XRANGEPLAIN] + '$';
	var TILDELOOSE = R++;
	src[TILDELOOSE] = '^' + src[LONETILDE] + src[XRANGEPLAINLOOSE] + '$';

	// Caret ranges.
	// Meaning is "at least and backwards compatible with"
	var LONECARET = R++;
	src[LONECARET] = '(?:\\^)';

	var CARETTRIM = R++;
	src[CARETTRIM] = '(\\s*)' + src[LONECARET] + '\\s+';
	re[CARETTRIM] = new RegExp(src[CARETTRIM], 'g');
	safeRe[CARETTRIM] = new RegExp(makeSafeRe(src[CARETTRIM]), 'g');
	var caretTrimReplace = '$1^';

	var CARET = R++;
	src[CARET] = '^' + src[LONECARET] + src[XRANGEPLAIN] + '$';
	var CARETLOOSE = R++;
	src[CARETLOOSE] = '^' + src[LONECARET] + src[XRANGEPLAINLOOSE] + '$';

	// A simple gt/lt/eq thing, or just "" to indicate "any version"
	var COMPARATORLOOSE = R++;
	src[COMPARATORLOOSE] = '^' + src[GTLT] + '\\s*(' + LOOSEPLAIN + ')$|^$';
	var COMPARATOR = R++;
	src[COMPARATOR] = '^' + src[GTLT] + '\\s*(' + FULLPLAIN + ')$|^$';

	// An expression to strip any whitespace between the gtlt and the thing
	// it modifies, so that `> 1.2.3` ==> `>1.2.3`
	var COMPARATORTRIM = R++;
	src[COMPARATORTRIM] = '(\\s*)' + src[GTLT] +
	                      '\\s*(' + LOOSEPLAIN + '|' + src[XRANGEPLAIN] + ')';

	// this one has to use the /g flag
	re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], 'g');
	safeRe[COMPARATORTRIM] = new RegExp(makeSafeRe(src[COMPARATORTRIM]), 'g');
	var comparatorTrimReplace = '$1$2$3';

	// Something like `1.2.3 - 1.2.4`
	// Note that these all use the loose form, because they'll be
	// checked against either the strict or loose comparator form
	// later.
	var HYPHENRANGE = R++;
	src[HYPHENRANGE] = '^\\s*(' + src[XRANGEPLAIN] + ')' +
	                   '\\s+-\\s+' +
	                   '(' + src[XRANGEPLAIN] + ')' +
	                   '\\s*$';

	var HYPHENRANGELOOSE = R++;
	src[HYPHENRANGELOOSE] = '^\\s*(' + src[XRANGEPLAINLOOSE] + ')' +
	                        '\\s+-\\s+' +
	                        '(' + src[XRANGEPLAINLOOSE] + ')' +
	                        '\\s*$';

	// Star ranges basically just allow anything at all.
	var STAR = R++;
	src[STAR] = '(<|>)?=?\\s*\\*';

	// Compile to actual regexp objects.
	// All are flag-free, unless they were created above with a flag.
	for (var i = 0; i < R; i++) {
	  debug(i, src[i]);
	  if (!re[i]) {
	    re[i] = new RegExp(src[i]);

	    // Replace all greedy whitespace to prevent regex dos issues. These regex are
	    // used internally via the safeRe object since all inputs in this library get
	    // normalized first to trim and collapse all extra whitespace. The original
	    // regexes are exported for userland consumption and lower level usage. A
	    // future breaking change could export the safer regex only with a note that
	    // all input should have extra whitespace removed.
	    safeRe[i] = new RegExp(makeSafeRe(src[i]));
	  }
	}

	exports.parse = parse;
	function parse (version, options) {
	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }

	  if (version instanceof SemVer) {
	    return version
	  }

	  if (typeof version !== 'string') {
	    return null
	  }

	  if (version.length > MAX_LENGTH) {
	    return null
	  }

	  var r = options.loose ? safeRe[LOOSE] : safeRe[FULL];
	  if (!r.test(version)) {
	    return null
	  }

	  try {
	    return new SemVer(version, options)
	  } catch (er) {
	    return null
	  }
	}

	exports.valid = valid;
	function valid (version, options) {
	  var v = parse(version, options);
	  return v ? v.version : null
	}

	exports.clean = clean;
	function clean (version, options) {
	  var s = parse(version.trim().replace(/^[=v]+/, ''), options);
	  return s ? s.version : null
	}

	exports.SemVer = SemVer;

	function SemVer (version, options) {
	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }
	  if (version instanceof SemVer) {
	    if (version.loose === options.loose) {
	      return version
	    } else {
	      version = version.version;
	    }
	  } else if (typeof version !== 'string') {
	    throw new TypeError('Invalid Version: ' + version)
	  }

	  if (version.length > MAX_LENGTH) {
	    throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters')
	  }

	  if (!(this instanceof SemVer)) {
	    return new SemVer(version, options)
	  }

	  debug('SemVer', version, options);
	  this.options = options;
	  this.loose = !!options.loose;

	  var m = version.trim().match(options.loose ? safeRe[LOOSE] : safeRe[FULL]);

	  if (!m) {
	    throw new TypeError('Invalid Version: ' + version)
	  }

	  this.raw = version;

	  // these are actually numbers
	  this.major = +m[1];
	  this.minor = +m[2];
	  this.patch = +m[3];

	  if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
	    throw new TypeError('Invalid major version')
	  }

	  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
	    throw new TypeError('Invalid minor version')
	  }

	  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
	    throw new TypeError('Invalid patch version')
	  }

	  // numberify any prerelease numeric ids
	  if (!m[4]) {
	    this.prerelease = [];
	  } else {
	    this.prerelease = m[4].split('.').map(function (id) {
	      if (/^[0-9]+$/.test(id)) {
	        var num = +id;
	        if (num >= 0 && num < MAX_SAFE_INTEGER) {
	          return num
	        }
	      }
	      return id
	    });
	  }

	  this.build = m[5] ? m[5].split('.') : [];
	  this.format();
	}

	SemVer.prototype.format = function () {
	  this.version = this.major + '.' + this.minor + '.' + this.patch;
	  if (this.prerelease.length) {
	    this.version += '-' + this.prerelease.join('.');
	  }
	  return this.version
	};

	SemVer.prototype.toString = function () {
	  return this.version
	};

	SemVer.prototype.compare = function (other) {
	  debug('SemVer.compare', this.version, this.options, other);
	  if (!(other instanceof SemVer)) {
	    other = new SemVer(other, this.options);
	  }

	  return this.compareMain(other) || this.comparePre(other)
	};

	SemVer.prototype.compareMain = function (other) {
	  if (!(other instanceof SemVer)) {
	    other = new SemVer(other, this.options);
	  }

	  return compareIdentifiers(this.major, other.major) ||
	         compareIdentifiers(this.minor, other.minor) ||
	         compareIdentifiers(this.patch, other.patch)
	};

	SemVer.prototype.comparePre = function (other) {
	  if (!(other instanceof SemVer)) {
	    other = new SemVer(other, this.options);
	  }

	  // NOT having a prerelease is > having one
	  if (this.prerelease.length && !other.prerelease.length) {
	    return -1
	  } else if (!this.prerelease.length && other.prerelease.length) {
	    return 1
	  } else if (!this.prerelease.length && !other.prerelease.length) {
	    return 0
	  }

	  var i = 0;
	  do {
	    var a = this.prerelease[i];
	    var b = other.prerelease[i];
	    debug('prerelease compare', i, a, b);
	    if (a === undefined && b === undefined) {
	      return 0
	    } else if (b === undefined) {
	      return 1
	    } else if (a === undefined) {
	      return -1
	    } else if (a === b) {
	      continue
	    } else {
	      return compareIdentifiers(a, b)
	    }
	  } while (++i)
	};

	// preminor will bump the version up to the next minor release, and immediately
	// down to pre-release. premajor and prepatch work the same way.
	SemVer.prototype.inc = function (release, identifier) {
	  switch (release) {
	    case 'premajor':
	      this.prerelease.length = 0;
	      this.patch = 0;
	      this.minor = 0;
	      this.major++;
	      this.inc('pre', identifier);
	      break
	    case 'preminor':
	      this.prerelease.length = 0;
	      this.patch = 0;
	      this.minor++;
	      this.inc('pre', identifier);
	      break
	    case 'prepatch':
	      // If this is already a prerelease, it will bump to the next version
	      // drop any prereleases that might already exist, since they are not
	      // relevant at this point.
	      this.prerelease.length = 0;
	      this.inc('patch', identifier);
	      this.inc('pre', identifier);
	      break
	    // If the input is a non-prerelease version, this acts the same as
	    // prepatch.
	    case 'prerelease':
	      if (this.prerelease.length === 0) {
	        this.inc('patch', identifier);
	      }
	      this.inc('pre', identifier);
	      break

	    case 'major':
	      // If this is a pre-major version, bump up to the same major version.
	      // Otherwise increment major.
	      // 1.0.0-5 bumps to 1.0.0
	      // 1.1.0 bumps to 2.0.0
	      if (this.minor !== 0 ||
	          this.patch !== 0 ||
	          this.prerelease.length === 0) {
	        this.major++;
	      }
	      this.minor = 0;
	      this.patch = 0;
	      this.prerelease = [];
	      break
	    case 'minor':
	      // If this is a pre-minor version, bump up to the same minor version.
	      // Otherwise increment minor.
	      // 1.2.0-5 bumps to 1.2.0
	      // 1.2.1 bumps to 1.3.0
	      if (this.patch !== 0 || this.prerelease.length === 0) {
	        this.minor++;
	      }
	      this.patch = 0;
	      this.prerelease = [];
	      break
	    case 'patch':
	      // If this is not a pre-release version, it will increment the patch.
	      // If it is a pre-release it will bump up to the same patch version.
	      // 1.2.0-5 patches to 1.2.0
	      // 1.2.0 patches to 1.2.1
	      if (this.prerelease.length === 0) {
	        this.patch++;
	      }
	      this.prerelease = [];
	      break
	    // This probably shouldn't be used publicly.
	    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
	    case 'pre':
	      if (this.prerelease.length === 0) {
	        this.prerelease = [0];
	      } else {
	        var i = this.prerelease.length;
	        while (--i >= 0) {
	          if (typeof this.prerelease[i] === 'number') {
	            this.prerelease[i]++;
	            i = -2;
	          }
	        }
	        if (i === -1) {
	          // didn't increment anything
	          this.prerelease.push(0);
	        }
	      }
	      if (identifier) {
	        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
	        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
	        if (this.prerelease[0] === identifier) {
	          if (isNaN(this.prerelease[1])) {
	            this.prerelease = [identifier, 0];
	          }
	        } else {
	          this.prerelease = [identifier, 0];
	        }
	      }
	      break

	    default:
	      throw new Error('invalid increment argument: ' + release)
	  }
	  this.format();
	  this.raw = this.version;
	  return this
	};

	exports.inc = inc;
	function inc (version, release, loose, identifier) {
	  if (typeof (loose) === 'string') {
	    identifier = loose;
	    loose = undefined;
	  }

	  try {
	    return new SemVer(version, loose).inc(release, identifier).version
	  } catch (er) {
	    return null
	  }
	}

	exports.diff = diff;
	function diff (version1, version2) {
	  if (eq(version1, version2)) {
	    return null
	  } else {
	    var v1 = parse(version1);
	    var v2 = parse(version2);
	    var prefix = '';
	    if (v1.prerelease.length || v2.prerelease.length) {
	      prefix = 'pre';
	      var defaultResult = 'prerelease';
	    }
	    for (var key in v1) {
	      if (key === 'major' || key === 'minor' || key === 'patch') {
	        if (v1[key] !== v2[key]) {
	          return prefix + key
	        }
	      }
	    }
	    return defaultResult // may be undefined
	  }
	}

	exports.compareIdentifiers = compareIdentifiers;

	var numeric = /^[0-9]+$/;
	function compareIdentifiers (a, b) {
	  var anum = numeric.test(a);
	  var bnum = numeric.test(b);

	  if (anum && bnum) {
	    a = +a;
	    b = +b;
	  }

	  return a === b ? 0
	    : (anum && !bnum) ? -1
	    : (bnum && !anum) ? 1
	    : a < b ? -1
	    : 1
	}

	exports.rcompareIdentifiers = rcompareIdentifiers;
	function rcompareIdentifiers (a, b) {
	  return compareIdentifiers(b, a)
	}

	exports.major = major;
	function major (a, loose) {
	  return new SemVer(a, loose).major
	}

	exports.minor = minor;
	function minor (a, loose) {
	  return new SemVer(a, loose).minor
	}

	exports.patch = patch;
	function patch (a, loose) {
	  return new SemVer(a, loose).patch
	}

	exports.compare = compare;
	function compare (a, b, loose) {
	  return new SemVer(a, loose).compare(new SemVer(b, loose))
	}

	exports.compareLoose = compareLoose;
	function compareLoose (a, b) {
	  return compare(a, b, true)
	}

	exports.rcompare = rcompare;
	function rcompare (a, b, loose) {
	  return compare(b, a, loose)
	}

	exports.sort = sort;
	function sort (list, loose) {
	  return list.sort(function (a, b) {
	    return exports.compare(a, b, loose)
	  })
	}

	exports.rsort = rsort;
	function rsort (list, loose) {
	  return list.sort(function (a, b) {
	    return exports.rcompare(a, b, loose)
	  })
	}

	exports.gt = gt;
	function gt (a, b, loose) {
	  return compare(a, b, loose) > 0
	}

	exports.lt = lt;
	function lt (a, b, loose) {
	  return compare(a, b, loose) < 0
	}

	exports.eq = eq;
	function eq (a, b, loose) {
	  return compare(a, b, loose) === 0
	}

	exports.neq = neq;
	function neq (a, b, loose) {
	  return compare(a, b, loose) !== 0
	}

	exports.gte = gte;
	function gte (a, b, loose) {
	  return compare(a, b, loose) >= 0
	}

	exports.lte = lte;
	function lte (a, b, loose) {
	  return compare(a, b, loose) <= 0
	}

	exports.cmp = cmp;
	function cmp (a, op, b, loose) {
	  switch (op) {
	    case '===':
	      if (typeof a === 'object')
	        a = a.version;
	      if (typeof b === 'object')
	        b = b.version;
	      return a === b

	    case '!==':
	      if (typeof a === 'object')
	        a = a.version;
	      if (typeof b === 'object')
	        b = b.version;
	      return a !== b

	    case '':
	    case '=':
	    case '==':
	      return eq(a, b, loose)

	    case '!=':
	      return neq(a, b, loose)

	    case '>':
	      return gt(a, b, loose)

	    case '>=':
	      return gte(a, b, loose)

	    case '<':
	      return lt(a, b, loose)

	    case '<=':
	      return lte(a, b, loose)

	    default:
	      throw new TypeError('Invalid operator: ' + op)
	  }
	}

	exports.Comparator = Comparator;
	function Comparator (comp, options) {
	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }

	  if (comp instanceof Comparator) {
	    if (comp.loose === !!options.loose) {
	      return comp
	    } else {
	      comp = comp.value;
	    }
	  }

	  if (!(this instanceof Comparator)) {
	    return new Comparator(comp, options)
	  }

	  comp = comp.trim().split(/\s+/).join(' ');
	  debug('comparator', comp, options);
	  this.options = options;
	  this.loose = !!options.loose;
	  this.parse(comp);

	  if (this.semver === ANY) {
	    this.value = '';
	  } else {
	    this.value = this.operator + this.semver.version;
	  }

	  debug('comp', this);
	}

	var ANY = {};
	Comparator.prototype.parse = function (comp) {
	  var r = this.options.loose ? safeRe[COMPARATORLOOSE] : safeRe[COMPARATOR];
	  var m = comp.match(r);

	  if (!m) {
	    throw new TypeError('Invalid comparator: ' + comp)
	  }

	  this.operator = m[1];
	  if (this.operator === '=') {
	    this.operator = '';
	  }

	  // if it literally is just '>' or '' then allow anything.
	  if (!m[2]) {
	    this.semver = ANY;
	  } else {
	    this.semver = new SemVer(m[2], this.options.loose);
	  }
	};

	Comparator.prototype.toString = function () {
	  return this.value
	};

	Comparator.prototype.test = function (version) {
	  debug('Comparator.test', version, this.options.loose);

	  if (this.semver === ANY) {
	    return true
	  }

	  if (typeof version === 'string') {
	    version = new SemVer(version, this.options);
	  }

	  return cmp(version, this.operator, this.semver, this.options)
	};

	Comparator.prototype.intersects = function (comp, options) {
	  if (!(comp instanceof Comparator)) {
	    throw new TypeError('a Comparator is required')
	  }

	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }

	  var rangeTmp;

	  if (this.operator === '') {
	    rangeTmp = new Range(comp.value, options);
	    return satisfies(this.value, rangeTmp, options)
	  } else if (comp.operator === '') {
	    rangeTmp = new Range(this.value, options);
	    return satisfies(comp.semver, rangeTmp, options)
	  }

	  var sameDirectionIncreasing =
	    (this.operator === '>=' || this.operator === '>') &&
	    (comp.operator === '>=' || comp.operator === '>');
	  var sameDirectionDecreasing =
	    (this.operator === '<=' || this.operator === '<') &&
	    (comp.operator === '<=' || comp.operator === '<');
	  var sameSemVer = this.semver.version === comp.semver.version;
	  var differentDirectionsInclusive =
	    (this.operator === '>=' || this.operator === '<=') &&
	    (comp.operator === '>=' || comp.operator === '<=');
	  var oppositeDirectionsLessThan =
	    cmp(this.semver, '<', comp.semver, options) &&
	    ((this.operator === '>=' || this.operator === '>') &&
	    (comp.operator === '<=' || comp.operator === '<'));
	  var oppositeDirectionsGreaterThan =
	    cmp(this.semver, '>', comp.semver, options) &&
	    ((this.operator === '<=' || this.operator === '<') &&
	    (comp.operator === '>=' || comp.operator === '>'));

	  return sameDirectionIncreasing || sameDirectionDecreasing ||
	    (sameSemVer && differentDirectionsInclusive) ||
	    oppositeDirectionsLessThan || oppositeDirectionsGreaterThan
	};

	exports.Range = Range;
	function Range (range, options) {
	  if (!options || typeof options !== 'object') {
	    options = {
	      loose: !!options,
	      includePrerelease: false
	    };
	  }

	  if (range instanceof Range) {
	    if (range.loose === !!options.loose &&
	        range.includePrerelease === !!options.includePrerelease) {
	      return range
	    } else {
	      return new Range(range.raw, options)
	    }
	  }

	  if (range instanceof Comparator) {
	    return new Range(range.value, options)
	  }

	  if (!(this instanceof Range)) {
	    return new Range(range, options)
	  }

	  this.options = options;
	  this.loose = !!options.loose;
	  this.includePrerelease = !!options.includePrerelease;

	  // First reduce all whitespace as much as possible so we do not have to rely
	  // on potentially slow regexes like \s*. This is then stored and used for
	  // future error messages as well.
	  this.raw = range
	    .trim()
	    .split(/\s+/)
	    .join(' ');

	  // First, split based on boolean or ||
	  this.set = this.raw.split('||').map(function (range) {
	    return this.parseRange(range.trim())
	  }, this).filter(function (c) {
	    // throw out any that are not relevant for whatever reason
	    return c.length
	  });

	  if (!this.set.length) {
	    throw new TypeError('Invalid SemVer Range: ' + this.raw)
	  }

	  this.format();
	}

	Range.prototype.format = function () {
	  this.range = this.set.map(function (comps) {
	    return comps.join(' ').trim()
	  }).join('||').trim();
	  return this.range
	};

	Range.prototype.toString = function () {
	  return this.range
	};

	Range.prototype.parseRange = function (range) {
	  var loose = this.options.loose;
	  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
	  var hr = loose ? safeRe[HYPHENRANGELOOSE] : safeRe[HYPHENRANGE];
	  range = range.replace(hr, hyphenReplace);
	  debug('hyphen replace', range);
	  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
	  range = range.replace(safeRe[COMPARATORTRIM], comparatorTrimReplace);
	  debug('comparator trim', range, safeRe[COMPARATORTRIM]);

	  // `~ 1.2.3` => `~1.2.3`
	  range = range.replace(safeRe[TILDETRIM], tildeTrimReplace);

	  // `^ 1.2.3` => `^1.2.3`
	  range = range.replace(safeRe[CARETTRIM], caretTrimReplace);

	  // At this point, the range is completely trimmed and
	  // ready to be split into comparators.
	  var compRe = loose ? safeRe[COMPARATORLOOSE] : safeRe[COMPARATOR];
	  var set = range.split(' ').map(function (comp) {
	    return parseComparator(comp, this.options)
	  }, this).join(' ').split(/\s+/);
	  if (this.options.loose) {
	    // in loose mode, throw out any that are not valid comparators
	    set = set.filter(function (comp) {
	      return !!comp.match(compRe)
	    });
	  }
	  set = set.map(function (comp) {
	    return new Comparator(comp, this.options)
	  }, this);

	  return set
	};

	Range.prototype.intersects = function (range, options) {
	  if (!(range instanceof Range)) {
	    throw new TypeError('a Range is required')
	  }

	  return this.set.some(function (thisComparators) {
	    return thisComparators.every(function (thisComparator) {
	      return range.set.some(function (rangeComparators) {
	        return rangeComparators.every(function (rangeComparator) {
	          return thisComparator.intersects(rangeComparator, options)
	        })
	      })
	    })
	  })
	};

	// Mostly just for testing and legacy API reasons
	exports.toComparators = toComparators;
	function toComparators (range, options) {
	  return new Range(range, options).set.map(function (comp) {
	    return comp.map(function (c) {
	      return c.value
	    }).join(' ').trim().split(' ')
	  })
	}

	// comprised of xranges, tildes, stars, and gtlt's at this point.
	// already replaced the hyphen ranges
	// turn into a set of JUST comparators.
	function parseComparator (comp, options) {
	  debug('comp', comp, options);
	  comp = replaceCarets(comp, options);
	  debug('caret', comp);
	  comp = replaceTildes(comp, options);
	  debug('tildes', comp);
	  comp = replaceXRanges(comp, options);
	  debug('xrange', comp);
	  comp = replaceStars(comp, options);
	  debug('stars', comp);
	  return comp
	}

	function isX (id) {
	  return !id || id.toLowerCase() === 'x' || id === '*'
	}

	// ~, ~> --> * (any, kinda silly)
	// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
	// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
	// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
	// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
	// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
	function replaceTildes (comp, options) {
	  return comp.trim().split(/\s+/).map(function (comp) {
	    return replaceTilde(comp, options)
	  }).join(' ')
	}

	function replaceTilde (comp, options) {
	  var r = options.loose ? safeRe[TILDELOOSE] : safeRe[TILDE];
	  return comp.replace(r, function (_, M, m, p, pr) {
	    debug('tilde', comp, _, M, m, p, pr);
	    var ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
	    } else if (isX(p)) {
	      // ~1.2 == >=1.2.0 <1.3.0
	      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
	    } else if (pr) {
	      debug('replaceTilde pr', pr);
	      ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
	            ' <' + M + '.' + (+m + 1) + '.0';
	    } else {
	      // ~1.2.3 == >=1.2.3 <1.3.0
	      ret = '>=' + M + '.' + m + '.' + p +
	            ' <' + M + '.' + (+m + 1) + '.0';
	    }

	    debug('tilde return', ret);
	    return ret
	  })
	}

	// ^ --> * (any, kinda silly)
	// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
	// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
	// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
	// ^1.2.3 --> >=1.2.3 <2.0.0
	// ^1.2.0 --> >=1.2.0 <2.0.0
	function replaceCarets (comp, options) {
	  return comp.trim().split(/\s+/).map(function (comp) {
	    return replaceCaret(comp, options)
	  }).join(' ')
	}

	function replaceCaret (comp, options) {
	  debug('caret', comp, options);
	  var r = options.loose ? safeRe[CARETLOOSE] : safeRe[CARET];
	  return comp.replace(r, function (_, M, m, p, pr) {
	    debug('caret', comp, _, M, m, p, pr);
	    var ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
	    } else if (isX(p)) {
	      if (M === '0') {
	        ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
	      } else {
	        ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
	      }
	    } else if (pr) {
	      debug('replaceCaret pr', pr);
	      if (M === '0') {
	        if (m === '0') {
	          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
	                ' <' + M + '.' + m + '.' + (+p + 1);
	        } else {
	          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
	                ' <' + M + '.' + (+m + 1) + '.0';
	        }
	      } else {
	        ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
	              ' <' + (+M + 1) + '.0.0';
	      }
	    } else {
	      debug('no pr');
	      if (M === '0') {
	        if (m === '0') {
	          ret = '>=' + M + '.' + m + '.' + p +
	                ' <' + M + '.' + m + '.' + (+p + 1);
	        } else {
	          ret = '>=' + M + '.' + m + '.' + p +
	                ' <' + M + '.' + (+m + 1) + '.0';
	        }
	      } else {
	        ret = '>=' + M + '.' + m + '.' + p +
	              ' <' + (+M + 1) + '.0.0';
	      }
	    }

	    debug('caret return', ret);
	    return ret
	  })
	}

	function replaceXRanges (comp, options) {
	  debug('replaceXRanges', comp, options);
	  return comp.split(/\s+/).map(function (comp) {
	    return replaceXRange(comp, options)
	  }).join(' ')
	}

	function replaceXRange (comp, options) {
	  comp = comp.trim();
	  var r = options.loose ? safeRe[XRANGELOOSE] : safeRe[XRANGE];
	  return comp.replace(r, function (ret, gtlt, M, m, p, pr) {
	    debug('xRange', comp, ret, gtlt, M, m, p, pr);
	    var xM = isX(M);
	    var xm = xM || isX(m);
	    var xp = xm || isX(p);
	    var anyX = xp;

	    if (gtlt === '=' && anyX) {
	      gtlt = '';
	    }

	    if (xM) {
	      if (gtlt === '>' || gtlt === '<') {
	        // nothing is allowed
	        ret = '<0.0.0';
	      } else {
	        // nothing is forbidden
	        ret = '*';
	      }
	    } else if (gtlt && anyX) {
	      // we know patch is an x, because we have any x at all.
	      // replace X with 0
	      if (xm) {
	        m = 0;
	      }
	      p = 0;

	      if (gtlt === '>') {
	        // >1 => >=2.0.0
	        // >1.2 => >=1.3.0
	        // >1.2.3 => >= 1.2.4
	        gtlt = '>=';
	        if (xm) {
	          M = +M + 1;
	          m = 0;
	          p = 0;
	        } else {
	          m = +m + 1;
	          p = 0;
	        }
	      } else if (gtlt === '<=') {
	        // <=0.7.x is actually <0.8.0, since any 0.7.x should
	        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
	        gtlt = '<';
	        if (xm) {
	          M = +M + 1;
	        } else {
	          m = +m + 1;
	        }
	      }

	      ret = gtlt + M + '.' + m + '.' + p;
	    } else if (xm) {
	      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
	    } else if (xp) {
	      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
	    }

	    debug('xRange return', ret);

	    return ret
	  })
	}

	// Because * is AND-ed with everything else in the comparator,
	// and '' means "any version", just remove the *s entirely.
	function replaceStars (comp, options) {
	  debug('replaceStars', comp, options);
	  // Looseness is ignored here.  star is always as loose as it gets!
	  return comp.trim().replace(safeRe[STAR], '')
	}

	// This function is passed to string.replace(safeRe[HYPHENRANGE])
	// M, m, patch, prerelease, build
	// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
	// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
	// 1.2 - 3.4 => >=1.2.0 <3.5.0
	function hyphenReplace ($0,
	  from, fM, fm, fp, fpr, fb,
	  to, tM, tm, tp, tpr, tb) {
	  if (isX(fM)) {
	    from = '';
	  } else if (isX(fm)) {
	    from = '>=' + fM + '.0.0';
	  } else if (isX(fp)) {
	    from = '>=' + fM + '.' + fm + '.0';
	  } else {
	    from = '>=' + from;
	  }

	  if (isX(tM)) {
	    to = '';
	  } else if (isX(tm)) {
	    to = '<' + (+tM + 1) + '.0.0';
	  } else if (isX(tp)) {
	    to = '<' + tM + '.' + (+tm + 1) + '.0';
	  } else if (tpr) {
	    to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
	  } else {
	    to = '<=' + to;
	  }

	  return (from + ' ' + to).trim()
	}

	// if ANY of the sets match ALL of its comparators, then pass
	Range.prototype.test = function (version) {
	  if (!version) {
	    return false
	  }

	  if (typeof version === 'string') {
	    version = new SemVer(version, this.options);
	  }

	  for (var i = 0; i < this.set.length; i++) {
	    if (testSet(this.set[i], version, this.options)) {
	      return true
	    }
	  }
	  return false
	};

	function testSet (set, version, options) {
	  for (var i = 0; i < set.length; i++) {
	    if (!set[i].test(version)) {
	      return false
	    }
	  }

	  if (version.prerelease.length && !options.includePrerelease) {
	    // Find the set of versions that are allowed to have prereleases
	    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
	    // That should allow `1.2.3-pr.2` to pass.
	    // However, `1.2.4-alpha.notready` should NOT be allowed,
	    // even though it's within the range set by the comparators.
	    for (i = 0; i < set.length; i++) {
	      debug(set[i].semver);
	      if (set[i].semver === ANY) {
	        continue
	      }

	      if (set[i].semver.prerelease.length > 0) {
	        var allowed = set[i].semver;
	        if (allowed.major === version.major &&
	            allowed.minor === version.minor &&
	            allowed.patch === version.patch) {
	          return true
	        }
	      }
	    }

	    // Version has a -pre, but it's not one of the ones we like.
	    return false
	  }

	  return true
	}

	exports.satisfies = satisfies;
	function satisfies (version, range, options) {
	  try {
	    range = new Range(range, options);
	  } catch (er) {
	    return false
	  }
	  return range.test(version)
	}

	exports.maxSatisfying = maxSatisfying;
	function maxSatisfying (versions, range, options) {
	  var max = null;
	  var maxSV = null;
	  try {
	    var rangeObj = new Range(range, options);
	  } catch (er) {
	    return null
	  }
	  versions.forEach(function (v) {
	    if (rangeObj.test(v)) {
	      // satisfies(v, range, options)
	      if (!max || maxSV.compare(v) === -1) {
	        // compare(max, v, true)
	        max = v;
	        maxSV = new SemVer(max, options);
	      }
	    }
	  });
	  return max
	}

	exports.minSatisfying = minSatisfying;
	function minSatisfying (versions, range, options) {
	  var min = null;
	  var minSV = null;
	  try {
	    var rangeObj = new Range(range, options);
	  } catch (er) {
	    return null
	  }
	  versions.forEach(function (v) {
	    if (rangeObj.test(v)) {
	      // satisfies(v, range, options)
	      if (!min || minSV.compare(v) === 1) {
	        // compare(min, v, true)
	        min = v;
	        minSV = new SemVer(min, options);
	      }
	    }
	  });
	  return min
	}

	exports.minVersion = minVersion;
	function minVersion (range, loose) {
	  range = new Range(range, loose);

	  var minver = new SemVer('0.0.0');
	  if (range.test(minver)) {
	    return minver
	  }

	  minver = new SemVer('0.0.0-0');
	  if (range.test(minver)) {
	    return minver
	  }

	  minver = null;
	  for (var i = 0; i < range.set.length; ++i) {
	    var comparators = range.set[i];

	    comparators.forEach(function (comparator) {
	      // Clone to avoid manipulating the comparator's semver object.
	      var compver = new SemVer(comparator.semver.version);
	      switch (comparator.operator) {
	        case '>':
	          if (compver.prerelease.length === 0) {
	            compver.patch++;
	          } else {
	            compver.prerelease.push(0);
	          }
	          compver.raw = compver.format();
	          /* fallthrough */
	        case '':
	        case '>=':
	          if (!minver || gt(minver, compver)) {
	            minver = compver;
	          }
	          break
	        case '<':
	        case '<=':
	          /* Ignore maximum versions */
	          break
	        /* istanbul ignore next */
	        default:
	          throw new Error('Unexpected operation: ' + comparator.operator)
	      }
	    });
	  }

	  if (minver && range.test(minver)) {
	    return minver
	  }

	  return null
	}

	exports.validRange = validRange;
	function validRange (range, options) {
	  try {
	    // Return '*' instead of '' so that truthiness works.
	    // This will throw if it's invalid anyway
	    return new Range(range, options).range || '*'
	  } catch (er) {
	    return null
	  }
	}

	// Determine if version is less than all the versions possible in the range
	exports.ltr = ltr;
	function ltr (version, range, options) {
	  return outside(version, range, '<', options)
	}

	// Determine if version is greater than all the versions possible in the range.
	exports.gtr = gtr;
	function gtr (version, range, options) {
	  return outside(version, range, '>', options)
	}

	exports.outside = outside;
	function outside (version, range, hilo, options) {
	  version = new SemVer(version, options);
	  range = new Range(range, options);

	  var gtfn, ltefn, ltfn, comp, ecomp;
	  switch (hilo) {
	    case '>':
	      gtfn = gt;
	      ltefn = lte;
	      ltfn = lt;
	      comp = '>';
	      ecomp = '>=';
	      break
	    case '<':
	      gtfn = lt;
	      ltefn = gte;
	      ltfn = gt;
	      comp = '<';
	      ecomp = '<=';
	      break
	    default:
	      throw new TypeError('Must provide a hilo val of "<" or ">"')
	  }

	  // If it satisifes the range it is not outside
	  if (satisfies(version, range, options)) {
	    return false
	  }

	  // From now on, variable terms are as if we're in "gtr" mode.
	  // but note that everything is flipped for the "ltr" function.

	  for (var i = 0; i < range.set.length; ++i) {
	    var comparators = range.set[i];

	    var high = null;
	    var low = null;

	    comparators.forEach(function (comparator) {
	      if (comparator.semver === ANY) {
	        comparator = new Comparator('>=0.0.0');
	      }
	      high = high || comparator;
	      low = low || comparator;
	      if (gtfn(comparator.semver, high.semver, options)) {
	        high = comparator;
	      } else if (ltfn(comparator.semver, low.semver, options)) {
	        low = comparator;
	      }
	    });

	    // If the edge version comparator has a operator then our version
	    // isn't outside it
	    if (high.operator === comp || high.operator === ecomp) {
	      return false
	    }

	    // If the lowest version comparator has an operator and our version
	    // is less than it then it isn't higher than the range
	    if ((!low.operator || low.operator === comp) &&
	        ltefn(version, low.semver)) {
	      return false
	    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
	      return false
	    }
	  }
	  return true
	}

	exports.prerelease = prerelease;
	function prerelease (version, options) {
	  var parsed = parse(version, options);
	  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null
	}

	exports.intersects = intersects;
	function intersects (r1, r2, options) {
	  r1 = new Range(r1, options);
	  r2 = new Range(r2, options);
	  return r1.intersects(r2)
	}

	exports.coerce = coerce;
	function coerce (version) {
	  if (version instanceof SemVer) {
	    return version
	  }

	  if (typeof version !== 'string') {
	    return null
	  }

	  var match = version.match(safeRe[COERCE]);

	  if (match == null) {
	    return null
	  }

	  return parse(match[1] +
	    '.' + (match[2] || '0') +
	    '.' + (match[3] || '0'))
	} 
} (semver$3, semver$3.exports));

var semverExports = semver$3.exports;

var semverCompare = function cmp (a, b) {
    var pa = a.split('.');
    var pb = b.split('.');
    for (var i = 0; i < 3; i++) {
        var na = Number(pa[i]);
        var nb = Number(pb[i]);
        if (na > nb) return 1;
        if (nb > na) return -1;
        if (!isNaN(na) && isNaN(nb)) return 1;
        if (isNaN(na) && !isNaN(nb)) return -1;
    }
    return 0;
};

var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(tool, "__esModule", { value: true });
tool.scrape = tool.extractZip = tool.extractTar = tool.extract7z = tool.cacheFile = tool.cacheDir = tool.downloadToolWithRetries = tool.downloadTool = tool.findLocalToolVersions = tool.findLocalTool = tool.evaluateVersions = tool.cleanVersion = tool.isExplicitVersion = prependPath_1 = tool.prependPath = tool.debug = void 0;
const httpm = HttpClient;
const path = require$$0$1;
const os = require$$0$2;
const process$1 = require$$3$2;
const fs = require$$1;
const semver$2 = semverExports;
const tl = task;
const cmp$2 = semverCompare;
const uuidV4 = v4_1;
let pkg = commonjsRequire(path.join(__dirname, 'package.json'));
let userAgent = 'vsts-task-installer/' + pkg.version;
let requestOptions = {
    // ignoreSslError: true,
    proxy: tl.getHttpProxyConfiguration(),
    cert: tl.getHttpCertConfiguration(),
    allowRedirects: true,
    allowRetries: true,
    maxRetries: 2
};
tl.setResourcePath(path.join(__dirname, 'lib.json'));
function debug$2(message) {
    tl.debug(message);
}
tool.debug = debug$2;
function prependPath(toolPath) {
    tl.assertAgent('2.115.0');
    if (!toolPath) {
        throw new Error('Parameter toolPath must not be null or empty');
    }
    else if (!tl.exist(toolPath) || !tl.stats(toolPath).isDirectory()) {
        throw new Error('Directory does not exist: ' + toolPath);
    }
    // todo: add a test for path
    console.log(tl.loc('TOOL_LIB_PrependPath', toolPath));
    let newPath = toolPath + path.delimiter + process$1.env['PATH'];
    tl.debug('new Path: ' + newPath);
    process$1.env['PATH'] = newPath;
    // instruct the agent to set this path on future tasks
    console.log('##vso[task.prependpath]' + toolPath);
}
var prependPath_1 = tool.prependPath = prependPath;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//-----------------------------
// Version Functions
//-----------------------------
/**
 * Checks if a version spec is an explicit version (e.g. 1.0.1 or v1.0.1)
 * As opposed to a version spec like 1.x
 *
 * @param versionSpec
 */
function isExplicitVersion(versionSpec) {
    let c = semver$2.clean(versionSpec);
    tl.debug('isExplicit: ' + c);
    let valid = semver$2.valid(c) != null;
    tl.debug('explicit? ' + valid);
    return valid;
}
tool.isExplicitVersion = isExplicitVersion;
/**
 * Returns cleaned (removed leading/trailing whitespace, remove '=v' prefix)
 * and parsed version, or null if version is invalid.
 */
function cleanVersion(version) {
    tl.debug('cleaning: ' + version);
    return semver$2.clean(version);
}
tool.cleanVersion = cleanVersion;
/**
 * evaluates a list of versions and returns the latest version matching the version spec
 *
 * @param versions      an array of versions to evaluate
 * @param versionSpec   a version spec (e.g. 1.x)
 */
function evaluateVersions(versions, versionSpec) {
    let version;
    tl.debug('evaluating ' + versions.length + ' versions');
    versions = versions.sort(cmp$2);
    for (let i = versions.length - 1; i >= 0; i--) {
        let potential = versions[i];
        let satisfied = semver$2.satisfies(potential, versionSpec);
        if (satisfied) {
            version = potential;
            break;
        }
    }
    if (version) {
        tl.debug('matched: ' + version);
    }
    else {
        tl.debug('match not found');
    }
    return version;
}
tool.evaluateVersions = evaluateVersions;
//-----------------------------
// Local Tool Cache Functions
//-----------------------------
/**
 * finds the path to a tool in the local installed tool cache
 *
 * @param toolName      name of the tool
 * @param versionSpec   version of the tool
 * @param arch          optional arch.  defaults to arch of computer
 */
function findLocalTool(toolName, versionSpec, arch) {
    if (!toolName) {
        throw new Error('toolName parameter is required');
    }
    if (!versionSpec) {
        throw new Error('versionSpec parameter is required');
    }
    arch = arch || os.arch();
    // attempt to resolve an explicit version
    if (!isExplicitVersion(versionSpec)) {
        let localVersions = findLocalToolVersions(toolName, arch);
        let match = evaluateVersions(localVersions, versionSpec);
        versionSpec = match;
    }
    // check for the explicit version in the cache
    let toolPath;
    if (versionSpec) {
        versionSpec = semver$2.clean(versionSpec);
        let cacheRoot = _getCacheRoot();
        let cachePath = path.join(cacheRoot, toolName, versionSpec, arch);
        tl.debug('checking cache: ' + cachePath);
        if (tl.exist(cachePath) && tl.exist(`${cachePath}.complete`)) {
            console.log(tl.loc('TOOL_LIB_FoundInCache', toolName, versionSpec, arch));
            toolPath = cachePath;
        }
        else {
            tl.debug('not found');
        }
    }
    return toolPath;
}
tool.findLocalTool = findLocalTool;
/**
 * Retrieves the versions of a tool that is intalled in the local tool cache
 *
 * @param toolName  name of the tool
 * @param arch      optional arch.  defaults to arch of computer
 */
function findLocalToolVersions(toolName, arch) {
    let versions = [];
    arch = arch || os.arch();
    let toolPath = path.join(_getCacheRoot(), toolName);
    if (tl.exist(toolPath)) {
        let children = tl.ls('', [toolPath]);
        children.forEach((child) => {
            if (isExplicitVersion(child)) {
                let fullPath = path.join(toolPath, child, arch);
                if (tl.exist(fullPath) && tl.exist(`${fullPath}.complete`)) {
                    versions.push(child);
                }
            }
        });
    }
    return versions;
}
tool.findLocalToolVersions = findLocalToolVersions;
//---------------------
// Download Functions
//---------------------
//
// TODO: keep extension intact
//
/**
 * Download a tool from an url and stream it into a file
 *
 * @param url                url of tool to download
 * @param fileName           optional fileName.  Should typically not use (will be a guid for reliability). Can pass fileName with an absolute path.
 * @param handlers           optional handlers array.  Auth handlers to pass to the HttpClient for the tool download.
 * @param additionalHeaders  optional custom HTTP headers.  This is passed to the REST client that downloads the tool.
 */
function downloadTool(url, fileName, handlers, additionalHeaders) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                handlers = handlers || null;
                let http = new httpm.HttpClient(userAgent, handlers, requestOptions);
                tl.debug(fileName);
                fileName = fileName || uuidV4();
                // check if it's an absolute path already
                var destPath;
                if (path.isAbsolute(fileName)) {
                    destPath = fileName;
                }
                else {
                    destPath = path.join(_getAgentTemp(), fileName);
                }
                // make sure that the folder exists
                tl.mkdirP(path.dirname(destPath));
                console.log(tl.loc('TOOL_LIB_Downloading', url.replace(/sig=[^&]*/, "sig=-REDACTED-")));
                tl.debug('destination ' + destPath);
                if (fs.existsSync(destPath)) {
                    throw new Error("Destination file path already exists");
                }
                tl.debug('downloading');
                let response = yield http.get(url, additionalHeaders);
                if (response.message.statusCode != 200) {
                    let err = new Error('Unexpected HTTP response: ' + response.message.statusCode);
                    err['httpStatusCode'] = response.message.statusCode;
                    tl.debug(`Failed to download "${fileName}" from "${url}". Code(${response.message.statusCode}) Message(${response.message.statusMessage})`);
                    throw err;
                }
                let downloadedContentLength = _getContentLengthOfDownloadedFile(response);
                if (!isNaN(downloadedContentLength)) {
                    tl.debug(`Content-Length of downloaded file: ${downloadedContentLength}`);
                }
                else {
                    tl.debug(`Content-Length header missing`);
                }
                tl.debug('creating stream');
                const file = fs.createWriteStream(destPath);
                file
                    .on('open', (fd) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        response.message
                            .on('error', (err) => {
                            file.end();
                            reject(err);
                        })
                            .on('aborted', () => {
                            // this block is for Node10 compatibility since it doesn't emit 'error' event after 'aborted' one
                            file.end();
                            reject(new Error('Aborted'));
                        })
                            .pipe(file);
                    }
                    catch (err) {
                        reject(err);
                    }
                }))
                    .on('close', () => {
                    tl.debug('download complete');
                    let fileSizeInBytes;
                    try {
                        fileSizeInBytes = _getFileSizeOnDisk(destPath);
                    }
                    catch (err) {
                        fileSizeInBytes = NaN;
                        tl.warning(`Unable to check file size of ${destPath} due to error: ${err.Message}`);
                    }
                    if (!isNaN(fileSizeInBytes)) {
                        tl.debug(`Downloaded file size: ${fileSizeInBytes} bytes`);
                    }
                    else {
                        tl.debug(`File size on disk was not found`);
                    }
                    if (!isNaN(downloadedContentLength) &&
                        !isNaN(fileSizeInBytes) &&
                        fileSizeInBytes !== downloadedContentLength) {
                        tl.warning(`Content-Length (${downloadedContentLength} bytes) did not match downloaded file size (${fileSizeInBytes} bytes).`);
                    }
                    resolve(destPath);
                })
                    .on('error', (err) => {
                    file.end();
                    reject(err);
                });
            }
            catch (error) {
                reject(error);
            }
        }));
    });
}
tool.downloadTool = downloadTool;
function downloadToolWithRetries(url, fileName, handlers, additionalHeaders, maxAttempts = 3, retryInterval = 500) {
    return __awaiter(this, void 0, void 0, function* () {
        let attempt = 1;
        let destinationPath = '';
        while (attempt <= maxAttempts && destinationPath == '') {
            try {
                destinationPath = yield downloadTool(url, fileName, handlers, additionalHeaders);
            }
            catch (err) {
                if (attempt === maxAttempts)
                    throw err;
                const attemptInterval = attempt * retryInterval;
                // Error will be shown in downloadTool.
                tl.debug(`Attempt ${attempt} failed. Retrying after ${attemptInterval} ms`);
                yield delay(attemptInterval);
                attempt++;
            }
        }
        return destinationPath;
    });
}
tool.downloadToolWithRetries = downloadToolWithRetries;
//---------------------
// Size functions
//---------------------
/**
 * Gets size of downloaded file from "Content-Length" header
 *
 * @param response    response for request to get the file
 * @returns number if the 'content-length' is not empty, otherwise NaN
 */
function _getContentLengthOfDownloadedFile(response) {
    let contentLengthHeader = response.message.headers['content-length'];
    let parsedContentLength = parseInt(contentLengthHeader);
    return parsedContentLength;
}
/**
 * Gets size of file saved to disk
 *
 * @param filePath    the path to the file, saved to the disk
 * @returns size of file saved to disk
 */
function _getFileSizeOnDisk(filePath) {
    let fileStats = fs.statSync(filePath);
    let fileSizeInBytes = fileStats.size;
    return fileSizeInBytes;
}
//---------------------
// Install Functions
//---------------------
function _createToolPath(tool, version, arch) {
    // todo: add test for clean
    let folderPath = path.join(_getCacheRoot(), tool, semver$2.clean(version), arch);
    tl.debug('destination ' + folderPath);
    let markerPath = `${folderPath}.complete`;
    tl.rmRF(folderPath);
    tl.rmRF(markerPath);
    tl.mkdirP(folderPath);
    return folderPath;
}
function _completeToolPath(tool, version, arch) {
    let folderPath = path.join(_getCacheRoot(), tool, semver$2.clean(version), arch);
    let markerPath = `${folderPath}.complete`;
    tl.writeFile(markerPath, '');
    tl.debug('finished caching tool');
}
/**
 * Caches a directory and installs it into the tool cacheDir
 *
 * @param sourceDir    the directory to cache into tools
 * @param tool          tool name
 * @param version       version of the tool.  semver format
 * @param arch          architecture of the tool.  Optional.  Defaults to machine architecture
 */
function cacheDir(sourceDir, tool, version, arch) {
    return __awaiter(this, void 0, void 0, function* () {
        version = semver$2.clean(version);
        arch = arch || os.arch();
        console.log(tl.loc('TOOL_LIB_CachingTool', tool, version, arch));
        tl.debug('source dir: ' + sourceDir);
        if (!tl.stats(sourceDir).isDirectory()) {
            throw new Error('sourceDir is not a directory');
        }
        // create the tool dir
        let destPath = _createToolPath(tool, version, arch);
        // copy each child item. do not move. move can fail on Windows
        // due to anti-virus software having an open handle on a file.
        for (let itemName of fs.readdirSync(sourceDir)) {
            let s = path.join(sourceDir, itemName);
            tl.cp(s, destPath + '/', '-r');
        }
        // write .complete
        _completeToolPath(tool, version, arch);
        return destPath;
    });
}
tool.cacheDir = cacheDir;
/**
 * Caches a downloaded file (GUID) and installs it
 * into the tool cache with a given targetName
 *
 * @param sourceFile    the file to cache into tools.  Typically a result of downloadTool which is a guid.
 * @param targetFile    the name of the file name in the tools directory
 * @param tool          tool name
 * @param version       version of the tool.  semver format
 * @param arch          architecture of the tool.  Optional.  Defaults to machine architecture
 */
function cacheFile(sourceFile, targetFile, tool, version, arch) {
    return __awaiter(this, void 0, void 0, function* () {
        version = semver$2.clean(version);
        arch = arch || os.arch();
        console.log(tl.loc('TOOL_LIB_CachingTool', tool, version, arch));
        tl.debug('source file:' + sourceFile);
        if (!tl.stats(sourceFile).isFile()) {
            throw new Error('sourceFile is not a file');
        }
        // create the tool dir
        let destFolder = _createToolPath(tool, version, arch);
        // copy instead of move. move can fail on Windows due to
        // anti-virus software having an open handle on a file.
        let destPath = path.join(destFolder, targetFile);
        tl.debug('destination file' + destPath);
        tl.cp(sourceFile, destPath);
        // write .complete
        _completeToolPath(tool, version, arch);
        return destFolder;
    });
}
tool.cacheFile = cacheFile;
//---------------------
// Extract Functions
//---------------------
/**
 * Extract a .7z file
 *
 * @param file     path to the .7z file
 * @param dest     destination directory. Optional.
 * @param _7zPath  path to 7zr.exe. Optional, for long path support. Most .7z archives do not have this
 * problem. If your .7z archive contains very long paths, you can pass the path to 7zr.exe which will
 * gracefully handle long paths. By default 7z.exe is used because it is a very small program and is
 * bundled with the tool lib. However it does not support long paths. 7z.exe is the reduced command line
 * interface, it is smaller than the full command line interface, and it does support long paths. At the
 * time of this writing, it is freely available from the LZMA SDK that is available on the 7zip website.
 * Be sure to check the current license agreement. If 7z.exe is bundled with your task, then the path
 * to 7z.exe can be pass to this function.
 * @param overwriteDest Overwrite files in destination catalog. Optional.
 * @returns        path to the destination directory
 */
function extract7z(file, dest, _7zPath, overwriteDest) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process$1.platform != 'win32') {
            throw new Error('extract7z() not supported on current OS');
        }
        if (!file) {
            throw new Error("parameter 'file' is required");
        }
        console.log(tl.loc('TOOL_LIB_ExtractingArchive'));
        dest = _createExtractFolder(dest);
        let originalCwd = process$1.cwd();
        try {
            process$1.chdir(dest);
            if (_7zPath) {
                // extract
                const _7z = tl.tool(_7zPath);
                if (overwriteDest) {
                    _7z.arg('-aoa');
                }
                _7z.arg('x') // eXtract files with full paths
                    .arg('-bb1') // -bb[0-3] : set output log level
                    .arg('-bd') // disable progress indicator
                    .arg('-sccUTF-8') // set charset for for console input/output
                    .arg(file);
                yield _7z.exec();
            }
            else {
                // extract
                let escapedScript = path.join(__dirname, 'Invoke-7zdec.ps1').replace(/'/g, "''").replace(/"|\n|\r/g, ''); // double-up single quotes, remove double quotes and newlines
                let escapedFile = file.replace(/'/g, "''").replace(/"|\n|\r/g, '');
                let escapedTarget = dest.replace(/'/g, "''").replace(/"|\n|\r/g, '');
                const overrideDestDirectory = overwriteDest ? 1 : 0;
                const command = `& '${escapedScript}' -Source '${escapedFile}' -Target '${escapedTarget}' -OverrideDestDirectory ${overrideDestDirectory}`;
                let powershellPath = tl.which('powershell', true);
                let powershell = tl.tool(powershellPath)
                    .line('-NoLogo -Sta -NoProfile -NonInteractive -ExecutionPolicy Unrestricted -Command')
                    .arg(command);
                powershell.on('stdout', (buffer) => {
                    process$1.stdout.write(buffer);
                });
                powershell.on('stderr', (buffer) => {
                    process$1.stderr.write(buffer);
                });
                yield powershell.exec({ silent: true });
            }
        }
        finally {
            process$1.chdir(originalCwd);
        }
        return dest;
    });
}
tool.extract7z = extract7z;
/**
 * installs a tool from a tar by extracting the tar and installing it into the tool cache
 *
 * @param file      file path of the tar
 * @param tool      name of tool in the tool cache
 * @param version   version of the tool
 * @param arch      arch of the tool.  optional.  defaults to the arch of the machine
 * @param options   IExtractOptions
 * @param destination   destination directory. optional.
 */
function extractTar(file, destination) {
    return __awaiter(this, void 0, void 0, function* () {
        // mkdir -p node/4.7.0/x64
        // tar xzC ./node/4.7.0/x64 -f node-v4.7.0-darwin-x64.tar.gz --strip-components 1
        console.log(tl.loc('TOOL_LIB_ExtractingArchive'));
        let dest = _createExtractFolder(destination);
        let tr = tl.tool('tar');
        tr.arg(['xC', dest, '-f', file]);
        yield tr.exec();
        return dest;
    });
}
tool.extractTar = extractTar;
function extractZip(file, destination) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!file) {
            throw new Error("parameter 'file' is required");
        }
        console.log(tl.loc('TOOL_LIB_ExtractingArchive'));
        let dest = _createExtractFolder(destination);
        if (process$1.platform == 'win32') {
            // build the powershell command
            let escapedFile = file.replace(/'/g, "''").replace(/"|\n|\r/g, ''); // double-up single quotes, remove double quotes and newlines
            let escapedDest = dest.replace(/'/g, "''").replace(/"|\n|\r/g, '');
            let command = `$ErrorActionPreference = 'Stop' ; try { Add-Type -AssemblyName System.IO.Compression.FileSystem } catch { } ; [System.IO.Compression.ZipFile]::ExtractToDirectory('${escapedFile}', '${escapedDest}')`;
            // change the console output code page to UTF-8.
            // TODO: FIX WHICH: let chcpPath = tl.which('chcp.com', true);
            let chcpPath = path.join(process$1.env.windir, "system32", "chcp.com");
            yield tl.exec(chcpPath, '65001');
            // run powershell
            let powershell = tl.tool('powershell')
                .line('-NoLogo -Sta -NoProfile -NonInteractive -ExecutionPolicy Unrestricted -Command')
                .arg(command);
            yield powershell.exec();
        }
        else {
            let unzip = tl.tool('unzip')
                .arg(file);
            yield unzip.exec({ cwd: dest });
        }
        return dest;
    });
}
tool.extractZip = extractZip;
function _createExtractFolder(dest) {
    if (!dest) {
        // create a temp dir
        dest = path.join(_getAgentTemp(), uuidV4());
    }
    tl.mkdirP(dest);
    return dest;
}
//---------------------
// Query Functions
//---------------------
//       default input will be >= LTS version.  drop label different than value.
//       v4 (LTS) would have a value of 4.x
//       option to always download?  (not cache), TTL?
/**
 * Scrape a web page for versions by regex
 *
 * @param url       url to scrape
 * @param regex     regex to use for version matches
 * @param handlers  optional handlers array.  Auth handlers to pass to the HttpClient for the tool download.
 */
function scrape(url, regex, handlers) {
    return __awaiter(this, void 0, void 0, function* () {
        handlers = handlers || null;
        let http = new httpm.HttpClient(userAgent, handlers, requestOptions);
        let output = yield (yield http.get(url)).readBody();
        let matches = output.match(regex);
        let seen = {};
        let versions = [];
        for (let i = 0; i < matches.length; i++) {
            let ver = semver$2.clean(matches[i]);
            if (!seen.hasOwnProperty(ver)) {
                seen[ver] = true;
                versions.push(ver);
            }
        }
        return versions;
    });
}
tool.scrape = scrape;
function _getCacheRoot() {
    tl.assertAgent('2.115.0');
    let cacheRoot = tl.getVariable('Agent.ToolsDirectory');
    if (!cacheRoot) {
        throw new Error('Agent.ToolsDirectory is not set');
    }
    return cacheRoot;
}
function _getAgentTemp() {
    tl.assertAgent('2.115.0');
    let tempDirectory = tl.getVariable('Agent.TempDirectory');
    if (!tempDirectory) {
        throw new Error('Agent.TempDirectory is not set');
    }
    return tempDirectory;
}

var re$2 = {exports: {}};

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
const SEMVER_SPEC_VERSION = '2.0.0';

const MAX_LENGTH$1 = 256;
const MAX_SAFE_INTEGER$1 = Number.MAX_SAFE_INTEGER ||
/* istanbul ignore next */ 9007199254740991;

// Max safe segment length for coercion.
const MAX_SAFE_COMPONENT_LENGTH = 16;

// Max safe length for a build identifier. The max length minus 6 characters for
// the shortest version with a build 0.0.0+BUILD.
const MAX_SAFE_BUILD_LENGTH = MAX_LENGTH$1 - 6;

const RELEASE_TYPES = [
  'major',
  'premajor',
  'minor',
  'preminor',
  'patch',
  'prepatch',
  'prerelease',
];

var constants$1 = {
  MAX_LENGTH: MAX_LENGTH$1,
  MAX_SAFE_COMPONENT_LENGTH,
  MAX_SAFE_BUILD_LENGTH,
  MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$1,
  RELEASE_TYPES,
  SEMVER_SPEC_VERSION,
  FLAG_INCLUDE_PRERELEASE: 0b001,
  FLAG_LOOSE: 0b010,
};

const debug$1 = (
  typeof process === 'object' &&
  process.env &&
  process.env.NODE_DEBUG &&
  /\bsemver\b/i.test(process.env.NODE_DEBUG)
) ? (...args) => console.error('SEMVER', ...args)
  : () => {};

var debug_1 = debug$1;

(function (module, exports) {
	const {
	  MAX_SAFE_COMPONENT_LENGTH,
	  MAX_SAFE_BUILD_LENGTH,
	  MAX_LENGTH,
	} = constants$1;
	const debug = debug_1;
	exports = module.exports = {};

	// The actual regexps go on exports.re
	const re = exports.re = [];
	const safeRe = exports.safeRe = [];
	const src = exports.src = [];
	const t = exports.t = {};
	let R = 0;

	const LETTERDASHNUMBER = '[a-zA-Z0-9-]';

	// Replace some greedy regex tokens to prevent regex dos issues. These regex are
	// used internally via the safeRe object since all inputs in this library get
	// normalized first to trim and collapse all extra whitespace. The original
	// regexes are exported for userland consumption and lower level usage. A
	// future breaking change could export the safer regex only with a note that
	// all input should have extra whitespace removed.
	const safeRegexReplacements = [
	  ['\\s', 1],
	  ['\\d', MAX_LENGTH],
	  [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH],
	];

	const makeSafeRegex = (value) => {
	  for (const [token, max] of safeRegexReplacements) {
	    value = value
	      .split(`${token}*`).join(`${token}{0,${max}}`)
	      .split(`${token}+`).join(`${token}{1,${max}}`);
	  }
	  return value
	};

	const createToken = (name, value, isGlobal) => {
	  const safe = makeSafeRegex(value);
	  const index = R++;
	  debug(name, index, value);
	  t[name] = index;
	  src[index] = value;
	  re[index] = new RegExp(value, isGlobal ? 'g' : undefined);
	  safeRe[index] = new RegExp(safe, isGlobal ? 'g' : undefined);
	};

	// The following Regular Expressions can be used for tokenizing,
	// validating, and parsing SemVer version strings.

	// ## Numeric Identifier
	// A single `0`, or a non-zero digit followed by zero or more digits.

	createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*');
	createToken('NUMERICIDENTIFIERLOOSE', '\\d+');

	// ## Non-numeric Identifier
	// Zero or more digits, followed by a letter or hyphen, and then zero or
	// more letters, digits, or hyphens.

	createToken('NONNUMERICIDENTIFIER', `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);

	// ## Main Version
	// Three dot-separated numeric identifiers.

	createToken('MAINVERSION', `(${src[t.NUMERICIDENTIFIER]})\\.` +
	                   `(${src[t.NUMERICIDENTIFIER]})\\.` +
	                   `(${src[t.NUMERICIDENTIFIER]})`);

	createToken('MAINVERSIONLOOSE', `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
	                        `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
	                        `(${src[t.NUMERICIDENTIFIERLOOSE]})`);

	// ## Pre-release Version Identifier
	// A numeric identifier, or a non-numeric identifier.

	createToken('PRERELEASEIDENTIFIER', `(?:${src[t.NUMERICIDENTIFIER]
	}|${src[t.NONNUMERICIDENTIFIER]})`);

	createToken('PRERELEASEIDENTIFIERLOOSE', `(?:${src[t.NUMERICIDENTIFIERLOOSE]
	}|${src[t.NONNUMERICIDENTIFIER]})`);

	// ## Pre-release Version
	// Hyphen, followed by one or more dot-separated pre-release version
	// identifiers.

	createToken('PRERELEASE', `(?:-(${src[t.PRERELEASEIDENTIFIER]
	}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);

	createToken('PRERELEASELOOSE', `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]
	}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);

	// ## Build Metadata Identifier
	// Any combination of digits, letters, or hyphens.

	createToken('BUILDIDENTIFIER', `${LETTERDASHNUMBER}+`);

	// ## Build Metadata
	// Plus sign, followed by one or more period-separated build metadata
	// identifiers.

	createToken('BUILD', `(?:\\+(${src[t.BUILDIDENTIFIER]
	}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);

	// ## Full Version String
	// A main version, followed optionally by a pre-release version and
	// build metadata.

	// Note that the only major, minor, patch, and pre-release sections of
	// the version string are capturing groups.  The build metadata is not a
	// capturing group, because it should not ever be used in version
	// comparison.

	createToken('FULLPLAIN', `v?${src[t.MAINVERSION]
	}${src[t.PRERELEASE]}?${
	  src[t.BUILD]}?`);

	createToken('FULL', `^${src[t.FULLPLAIN]}$`);

	// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
	// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
	// common in the npm registry.
	createToken('LOOSEPLAIN', `[v=\\s]*${src[t.MAINVERSIONLOOSE]
	}${src[t.PRERELEASELOOSE]}?${
	  src[t.BUILD]}?`);

	createToken('LOOSE', `^${src[t.LOOSEPLAIN]}$`);

	createToken('GTLT', '((?:<|>)?=?)');

	// Something like "2.*" or "1.2.x".
	// Note that "x.x" is a valid xRange identifer, meaning "any version"
	// Only the first item is strictly required.
	createToken('XRANGEIDENTIFIERLOOSE', `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
	createToken('XRANGEIDENTIFIER', `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);

	createToken('XRANGEPLAIN', `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})` +
	                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
	                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
	                   `(?:${src[t.PRERELEASE]})?${
	                     src[t.BUILD]}?` +
	                   `)?)?`);

	createToken('XRANGEPLAINLOOSE', `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})` +
	                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
	                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
	                        `(?:${src[t.PRERELEASELOOSE]})?${
	                          src[t.BUILD]}?` +
	                        `)?)?`);

	createToken('XRANGE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
	createToken('XRANGELOOSE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);

	// Coercion.
	// Extract anything that could conceivably be a part of a valid semver
	createToken('COERCEPLAIN', `${'(^|[^\\d])' +
	              '(\\d{1,'}${MAX_SAFE_COMPONENT_LENGTH}})` +
	              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
	              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
	createToken('COERCE', `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
	createToken('COERCEFULL', src[t.COERCEPLAIN] +
	              `(?:${src[t.PRERELEASE]})?` +
	              `(?:${src[t.BUILD]})?` +
	              `(?:$|[^\\d])`);
	createToken('COERCERTL', src[t.COERCE], true);
	createToken('COERCERTLFULL', src[t.COERCEFULL], true);

	// Tilde ranges.
	// Meaning is "reasonably at or greater than"
	createToken('LONETILDE', '(?:~>?)');

	createToken('TILDETRIM', `(\\s*)${src[t.LONETILDE]}\\s+`, true);
	exports.tildeTrimReplace = '$1~';

	createToken('TILDE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
	createToken('TILDELOOSE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);

	// Caret ranges.
	// Meaning is "at least and backwards compatible with"
	createToken('LONECARET', '(?:\\^)');

	createToken('CARETTRIM', `(\\s*)${src[t.LONECARET]}\\s+`, true);
	exports.caretTrimReplace = '$1^';

	createToken('CARET', `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
	createToken('CARETLOOSE', `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);

	// A simple gt/lt/eq thing, or just "" to indicate "any version"
	createToken('COMPARATORLOOSE', `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
	createToken('COMPARATOR', `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);

	// An expression to strip any whitespace between the gtlt and the thing
	// it modifies, so that `> 1.2.3` ==> `>1.2.3`
	createToken('COMPARATORTRIM', `(\\s*)${src[t.GTLT]
	}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
	exports.comparatorTrimReplace = '$1$2$3';

	// Something like `1.2.3 - 1.2.4`
	// Note that these all use the loose form, because they'll be
	// checked against either the strict or loose comparator form
	// later.
	createToken('HYPHENRANGE', `^\\s*(${src[t.XRANGEPLAIN]})` +
	                   `\\s+-\\s+` +
	                   `(${src[t.XRANGEPLAIN]})` +
	                   `\\s*$`);

	createToken('HYPHENRANGELOOSE', `^\\s*(${src[t.XRANGEPLAINLOOSE]})` +
	                        `\\s+-\\s+` +
	                        `(${src[t.XRANGEPLAINLOOSE]})` +
	                        `\\s*$`);

	// Star ranges basically just allow anything at all.
	createToken('STAR', '(<|>)?=?\\s*\\*');
	// >=0.0.0 is like a star
	createToken('GTE0', '^\\s*>=\\s*0\\.0\\.0\\s*$');
	createToken('GTE0PRE', '^\\s*>=\\s*0\\.0\\.0-0\\s*$'); 
} (re$2, re$2.exports));

var reExports = re$2.exports;

// parse out just the options we care about
const looseOption = Object.freeze({ loose: true });
const emptyOpts = Object.freeze({ });
const parseOptions$1 = options => {
  if (!options) {
    return emptyOpts
  }

  if (typeof options !== 'object') {
    return looseOption
  }

  return options
};
var parseOptions_1 = parseOptions$1;

const numeric = /^[0-9]+$/;
const compareIdentifiers$1 = (a, b) => {
  const anum = numeric.test(a);
  const bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return a === b ? 0
    : (anum && !bnum) ? -1
    : (bnum && !anum) ? 1
    : a < b ? -1
    : 1
};

const rcompareIdentifiers = (a, b) => compareIdentifiers$1(b, a);

var identifiers$1 = {
  compareIdentifiers: compareIdentifiers$1,
  rcompareIdentifiers,
};

const debug = debug_1;
const { MAX_LENGTH, MAX_SAFE_INTEGER } = constants$1;
const { safeRe: re$1, t: t$1 } = reExports;

const parseOptions = parseOptions_1;
const { compareIdentifiers } = identifiers$1;
let SemVer$d = class SemVer {
  constructor (version, options) {
    options = parseOptions(options);

    if (version instanceof SemVer) {
      if (version.loose === !!options.loose &&
          version.includePrerelease === !!options.includePrerelease) {
        return version
      } else {
        version = version.version;
      }
    } else if (typeof version !== 'string') {
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`)
    }

    if (version.length > MAX_LENGTH) {
      throw new TypeError(
        `version is longer than ${MAX_LENGTH} characters`
      )
    }

    debug('SemVer', version, options);
    this.options = options;
    this.loose = !!options.loose;
    // this isn't actually relevant for versions, but keep it so that we
    // don't run into trouble passing this.options around.
    this.includePrerelease = !!options.includePrerelease;

    const m = version.trim().match(options.loose ? re$1[t$1.LOOSE] : re$1[t$1.FULL]);

    if (!m) {
      throw new TypeError(`Invalid Version: ${version}`)
    }

    this.raw = version;

    // these are actually numbers
    this.major = +m[1];
    this.minor = +m[2];
    this.patch = +m[3];

    if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
      throw new TypeError('Invalid major version')
    }

    if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
      throw new TypeError('Invalid minor version')
    }

    if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
      throw new TypeError('Invalid patch version')
    }

    // numberify any prerelease numeric ids
    if (!m[4]) {
      this.prerelease = [];
    } else {
      this.prerelease = m[4].split('.').map((id) => {
        if (/^[0-9]+$/.test(id)) {
          const num = +id;
          if (num >= 0 && num < MAX_SAFE_INTEGER) {
            return num
          }
        }
        return id
      });
    }

    this.build = m[5] ? m[5].split('.') : [];
    this.format();
  }

  format () {
    this.version = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease.length) {
      this.version += `-${this.prerelease.join('.')}`;
    }
    return this.version
  }

  toString () {
    return this.version
  }

  compare (other) {
    debug('SemVer.compare', this.version, this.options, other);
    if (!(other instanceof SemVer)) {
      if (typeof other === 'string' && other === this.version) {
        return 0
      }
      other = new SemVer(other, this.options);
    }

    if (other.version === this.version) {
      return 0
    }

    return this.compareMain(other) || this.comparePre(other)
  }

  compareMain (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    return (
      compareIdentifiers(this.major, other.major) ||
      compareIdentifiers(this.minor, other.minor) ||
      compareIdentifiers(this.patch, other.patch)
    )
  }

  comparePre (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    // NOT having a prerelease is > having one
    if (this.prerelease.length && !other.prerelease.length) {
      return -1
    } else if (!this.prerelease.length && other.prerelease.length) {
      return 1
    } else if (!this.prerelease.length && !other.prerelease.length) {
      return 0
    }

    let i = 0;
    do {
      const a = this.prerelease[i];
      const b = other.prerelease[i];
      debug('prerelease compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers(a, b)
      }
    } while (++i)
  }

  compareBuild (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    let i = 0;
    do {
      const a = this.build[i];
      const b = other.build[i];
      debug('prerelease compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers(a, b)
      }
    } while (++i)
  }

  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc (release, identifier, identifierBase) {
    switch (release) {
      case 'premajor':
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor = 0;
        this.major++;
        this.inc('pre', identifier, identifierBase);
        break
      case 'preminor':
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor++;
        this.inc('pre', identifier, identifierBase);
        break
      case 'prepatch':
        // If this is already a prerelease, it will bump to the next version
        // drop any prereleases that might already exist, since they are not
        // relevant at this point.
        this.prerelease.length = 0;
        this.inc('patch', identifier, identifierBase);
        this.inc('pre', identifier, identifierBase);
        break
      // If the input is a non-prerelease version, this acts the same as
      // prepatch.
      case 'prerelease':
        if (this.prerelease.length === 0) {
          this.inc('patch', identifier, identifierBase);
        }
        this.inc('pre', identifier, identifierBase);
        break

      case 'major':
        // If this is a pre-major version, bump up to the same major version.
        // Otherwise increment major.
        // 1.0.0-5 bumps to 1.0.0
        // 1.1.0 bumps to 2.0.0
        if (
          this.minor !== 0 ||
          this.patch !== 0 ||
          this.prerelease.length === 0
        ) {
          this.major++;
        }
        this.minor = 0;
        this.patch = 0;
        this.prerelease = [];
        break
      case 'minor':
        // If this is a pre-minor version, bump up to the same minor version.
        // Otherwise increment minor.
        // 1.2.0-5 bumps to 1.2.0
        // 1.2.1 bumps to 1.3.0
        if (this.patch !== 0 || this.prerelease.length === 0) {
          this.minor++;
        }
        this.patch = 0;
        this.prerelease = [];
        break
      case 'patch':
        // If this is not a pre-release version, it will increment the patch.
        // If it is a pre-release it will bump up to the same patch version.
        // 1.2.0-5 patches to 1.2.0
        // 1.2.0 patches to 1.2.1
        if (this.prerelease.length === 0) {
          this.patch++;
        }
        this.prerelease = [];
        break
      // This probably shouldn't be used publicly.
      // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
      case 'pre': {
        const base = Number(identifierBase) ? 1 : 0;

        if (!identifier && identifierBase === false) {
          throw new Error('invalid increment argument: identifier is empty')
        }

        if (this.prerelease.length === 0) {
          this.prerelease = [base];
        } else {
          let i = this.prerelease.length;
          while (--i >= 0) {
            if (typeof this.prerelease[i] === 'number') {
              this.prerelease[i]++;
              i = -2;
            }
          }
          if (i === -1) {
            // didn't increment anything
            if (identifier === this.prerelease.join('.') && identifierBase === false) {
              throw new Error('invalid increment argument: identifier already exists')
            }
            this.prerelease.push(base);
          }
        }
        if (identifier) {
          // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
          // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
          let prerelease = [identifier, base];
          if (identifierBase === false) {
            prerelease = [identifier];
          }
          if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
            if (isNaN(this.prerelease[1])) {
              this.prerelease = prerelease;
            }
          } else {
            this.prerelease = prerelease;
          }
        }
        break
      }
      default:
        throw new Error(`invalid increment argument: ${release}`)
    }
    this.raw = this.format();
    if (this.build.length) {
      this.raw += `+${this.build.join('.')}`;
    }
    return this
  }
};

var semver$1 = SemVer$d;

const SemVer$c = semver$1;
const parse$6 = (version, options, throwErrors = false) => {
  if (version instanceof SemVer$c) {
    return version
  }
  try {
    return new SemVer$c(version, options)
  } catch (er) {
    if (!throwErrors) {
      return null
    }
    throw er
  }
};

var parse_1 = parse$6;

const parse$5 = parse_1;
const valid$2 = (version, options) => {
  const v = parse$5(version, options);
  return v ? v.version : null
};
var valid_1 = valid$2;

const parse$4 = parse_1;
const clean$1 = (version, options) => {
  const s = parse$4(version.trim().replace(/^[=v]+/, ''), options);
  return s ? s.version : null
};
var clean_1 = clean$1;

const SemVer$b = semver$1;

const inc$1 = (version, release, options, identifier, identifierBase) => {
  if (typeof (options) === 'string') {
    identifierBase = identifier;
    identifier = options;
    options = undefined;
  }

  try {
    return new SemVer$b(
      version instanceof SemVer$b ? version.version : version,
      options
    ).inc(release, identifier, identifierBase).version
  } catch (er) {
    return null
  }
};
var inc_1 = inc$1;

const parse$3 = parse_1;

const diff$1 = (version1, version2) => {
  const v1 = parse$3(version1, null, true);
  const v2 = parse$3(version2, null, true);
  const comparison = v1.compare(v2);

  if (comparison === 0) {
    return null
  }

  const v1Higher = comparison > 0;
  const highVersion = v1Higher ? v1 : v2;
  const lowVersion = v1Higher ? v2 : v1;
  const highHasPre = !!highVersion.prerelease.length;
  const lowHasPre = !!lowVersion.prerelease.length;

  if (lowHasPre && !highHasPre) {
    // Going from prerelease -> no prerelease requires some special casing

    // If the low version has only a major, then it will always be a major
    // Some examples:
    // 1.0.0-1 -> 1.0.0
    // 1.0.0-1 -> 1.1.1
    // 1.0.0-1 -> 2.0.0
    if (!lowVersion.patch && !lowVersion.minor) {
      return 'major'
    }

    // Otherwise it can be determined by checking the high version

    if (highVersion.patch) {
      // anything higher than a patch bump would result in the wrong version
      return 'patch'
    }

    if (highVersion.minor) {
      // anything higher than a minor bump would result in the wrong version
      return 'minor'
    }

    // bumping major/minor/patch all have same result
    return 'major'
  }

  // add the `pre` prefix if we are going to a prerelease version
  const prefix = highHasPre ? 'pre' : '';

  if (v1.major !== v2.major) {
    return prefix + 'major'
  }

  if (v1.minor !== v2.minor) {
    return prefix + 'minor'
  }

  if (v1.patch !== v2.patch) {
    return prefix + 'patch'
  }

  // high and low are preleases
  return 'prerelease'
};

var diff_1 = diff$1;

const SemVer$a = semver$1;
const major$1 = (a, loose) => new SemVer$a(a, loose).major;
var major_1 = major$1;

const SemVer$9 = semver$1;
const minor$1 = (a, loose) => new SemVer$9(a, loose).minor;
var minor_1 = minor$1;

const SemVer$8 = semver$1;
const patch$1 = (a, loose) => new SemVer$8(a, loose).patch;
var patch_1 = patch$1;

const parse$2 = parse_1;
const prerelease$1 = (version, options) => {
  const parsed = parse$2(version, options);
  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null
};
var prerelease_1 = prerelease$1;

const SemVer$7 = semver$1;
const compare$b = (a, b, loose) =>
  new SemVer$7(a, loose).compare(new SemVer$7(b, loose));

var compare_1 = compare$b;

const compare$a = compare_1;
const rcompare$1 = (a, b, loose) => compare$a(b, a, loose);
var rcompare_1 = rcompare$1;

const compare$9 = compare_1;
const compareLoose$1 = (a, b) => compare$9(a, b, true);
var compareLoose_1 = compareLoose$1;

const SemVer$6 = semver$1;
const compareBuild$3 = (a, b, loose) => {
  const versionA = new SemVer$6(a, loose);
  const versionB = new SemVer$6(b, loose);
  return versionA.compare(versionB) || versionA.compareBuild(versionB)
};
var compareBuild_1 = compareBuild$3;

const compareBuild$2 = compareBuild_1;
const sort$1 = (list, loose) => list.sort((a, b) => compareBuild$2(a, b, loose));
var sort_1 = sort$1;

const compareBuild$1 = compareBuild_1;
const rsort$1 = (list, loose) => list.sort((a, b) => compareBuild$1(b, a, loose));
var rsort_1 = rsort$1;

const compare$8 = compare_1;
const gt$4 = (a, b, loose) => compare$8(a, b, loose) > 0;
var gt_1 = gt$4;

const compare$7 = compare_1;
const lt$3 = (a, b, loose) => compare$7(a, b, loose) < 0;
var lt_1 = lt$3;

const compare$6 = compare_1;
const eq$2 = (a, b, loose) => compare$6(a, b, loose) === 0;
var eq_1 = eq$2;

const compare$5 = compare_1;
const neq$2 = (a, b, loose) => compare$5(a, b, loose) !== 0;
var neq_1 = neq$2;

const compare$4 = compare_1;
const gte$3 = (a, b, loose) => compare$4(a, b, loose) >= 0;
var gte_1 = gte$3;

const compare$3 = compare_1;
const lte$3 = (a, b, loose) => compare$3(a, b, loose) <= 0;
var lte_1 = lte$3;

const eq$1 = eq_1;
const neq$1 = neq_1;
const gt$3 = gt_1;
const gte$2 = gte_1;
const lt$2 = lt_1;
const lte$2 = lte_1;

const cmp$1 = (a, op, b, loose) => {
  switch (op) {
    case '===':
      if (typeof a === 'object') {
        a = a.version;
      }
      if (typeof b === 'object') {
        b = b.version;
      }
      return a === b

    case '!==':
      if (typeof a === 'object') {
        a = a.version;
      }
      if (typeof b === 'object') {
        b = b.version;
      }
      return a !== b

    case '':
    case '=':
    case '==':
      return eq$1(a, b, loose)

    case '!=':
      return neq$1(a, b, loose)

    case '>':
      return gt$3(a, b, loose)

    case '>=':
      return gte$2(a, b, loose)

    case '<':
      return lt$2(a, b, loose)

    case '<=':
      return lte$2(a, b, loose)

    default:
      throw new TypeError(`Invalid operator: ${op}`)
  }
};
var cmp_1 = cmp$1;

const SemVer$5 = semver$1;
const parse$1 = parse_1;
const { safeRe: re, t } = reExports;

const coerce$1 = (version, options) => {
  if (version instanceof SemVer$5) {
    return version
  }

  if (typeof version === 'number') {
    version = String(version);
  }

  if (typeof version !== 'string') {
    return null
  }

  options = options || {};

  let match = null;
  if (!options.rtl) {
    match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
  } else {
    // Find the right-most coercible string that does not share
    // a terminus with a more left-ward coercible string.
    // Eg, '1.2.3.4' wants to coerce '2.3.4', not '3.4' or '4'
    // With includePrerelease option set, '1.2.3.4-rc' wants to coerce '2.3.4-rc', not '2.3.4'
    //
    // Walk through the string checking with a /g regexp
    // Manually set the index so as to pick up overlapping matches.
    // Stop when we get a match that ends at the string end, since no
    // coercible string can be more right-ward without the same terminus.
    const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
    let next;
    while ((next = coerceRtlRegex.exec(version)) &&
        (!match || match.index + match[0].length !== version.length)
    ) {
      if (!match ||
            next.index + next[0].length !== match.index + match[0].length) {
        match = next;
      }
      coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
    }
    // leave it in a clean state
    coerceRtlRegex.lastIndex = -1;
  }

  if (match === null) {
    return null
  }

  const major = match[2];
  const minor = match[3] || '0';
  const patch = match[4] || '0';
  const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : '';
  const build = options.includePrerelease && match[6] ? `+${match[6]}` : '';

  return parse$1(`${major}.${minor}.${patch}${prerelease}${build}`, options)
};
var coerce_1 = coerce$1;

var iterator;
var hasRequiredIterator;

function requireIterator () {
	if (hasRequiredIterator) return iterator;
	hasRequiredIterator = 1;
	iterator = function (Yallist) {
	  Yallist.prototype[Symbol.iterator] = function* () {
	    for (let walker = this.head; walker; walker = walker.next) {
	      yield walker.value;
	    }
	  };
	};
	return iterator;
}

var yallist = Yallist$1;

Yallist$1.Node = Node;
Yallist$1.create = Yallist$1;

function Yallist$1 (list) {
  var self = this;
  if (!(self instanceof Yallist$1)) {
    self = new Yallist$1();
  }

  self.tail = null;
  self.head = null;
  self.length = 0;

  if (list && typeof list.forEach === 'function') {
    list.forEach(function (item) {
      self.push(item);
    });
  } else if (arguments.length > 0) {
    for (var i = 0, l = arguments.length; i < l; i++) {
      self.push(arguments[i]);
    }
  }

  return self
}

Yallist$1.prototype.removeNode = function (node) {
  if (node.list !== this) {
    throw new Error('removing node which does not belong to this list')
  }

  var next = node.next;
  var prev = node.prev;

  if (next) {
    next.prev = prev;
  }

  if (prev) {
    prev.next = next;
  }

  if (node === this.head) {
    this.head = next;
  }
  if (node === this.tail) {
    this.tail = prev;
  }

  node.list.length--;
  node.next = null;
  node.prev = null;
  node.list = null;

  return next
};

Yallist$1.prototype.unshiftNode = function (node) {
  if (node === this.head) {
    return
  }

  if (node.list) {
    node.list.removeNode(node);
  }

  var head = this.head;
  node.list = this;
  node.next = head;
  if (head) {
    head.prev = node;
  }

  this.head = node;
  if (!this.tail) {
    this.tail = node;
  }
  this.length++;
};

Yallist$1.prototype.pushNode = function (node) {
  if (node === this.tail) {
    return
  }

  if (node.list) {
    node.list.removeNode(node);
  }

  var tail = this.tail;
  node.list = this;
  node.prev = tail;
  if (tail) {
    tail.next = node;
  }

  this.tail = node;
  if (!this.head) {
    this.head = node;
  }
  this.length++;
};

Yallist$1.prototype.push = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    push(this, arguments[i]);
  }
  return this.length
};

Yallist$1.prototype.unshift = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    unshift(this, arguments[i]);
  }
  return this.length
};

Yallist$1.prototype.pop = function () {
  if (!this.tail) {
    return undefined
  }

  var res = this.tail.value;
  this.tail = this.tail.prev;
  if (this.tail) {
    this.tail.next = null;
  } else {
    this.head = null;
  }
  this.length--;
  return res
};

Yallist$1.prototype.shift = function () {
  if (!this.head) {
    return undefined
  }

  var res = this.head.value;
  this.head = this.head.next;
  if (this.head) {
    this.head.prev = null;
  } else {
    this.tail = null;
  }
  this.length--;
  return res
};

Yallist$1.prototype.forEach = function (fn, thisp) {
  thisp = thisp || this;
  for (var walker = this.head, i = 0; walker !== null; i++) {
    fn.call(thisp, walker.value, i, this);
    walker = walker.next;
  }
};

Yallist$1.prototype.forEachReverse = function (fn, thisp) {
  thisp = thisp || this;
  for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
    fn.call(thisp, walker.value, i, this);
    walker = walker.prev;
  }
};

Yallist$1.prototype.get = function (n) {
  for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
    // abort out of the list early if we hit a cycle
    walker = walker.next;
  }
  if (i === n && walker !== null) {
    return walker.value
  }
};

Yallist$1.prototype.getReverse = function (n) {
  for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
    // abort out of the list early if we hit a cycle
    walker = walker.prev;
  }
  if (i === n && walker !== null) {
    return walker.value
  }
};

Yallist$1.prototype.map = function (fn, thisp) {
  thisp = thisp || this;
  var res = new Yallist$1();
  for (var walker = this.head; walker !== null;) {
    res.push(fn.call(thisp, walker.value, this));
    walker = walker.next;
  }
  return res
};

Yallist$1.prototype.mapReverse = function (fn, thisp) {
  thisp = thisp || this;
  var res = new Yallist$1();
  for (var walker = this.tail; walker !== null;) {
    res.push(fn.call(thisp, walker.value, this));
    walker = walker.prev;
  }
  return res
};

Yallist$1.prototype.reduce = function (fn, initial) {
  var acc;
  var walker = this.head;
  if (arguments.length > 1) {
    acc = initial;
  } else if (this.head) {
    walker = this.head.next;
    acc = this.head.value;
  } else {
    throw new TypeError('Reduce of empty list with no initial value')
  }

  for (var i = 0; walker !== null; i++) {
    acc = fn(acc, walker.value, i);
    walker = walker.next;
  }

  return acc
};

Yallist$1.prototype.reduceReverse = function (fn, initial) {
  var acc;
  var walker = this.tail;
  if (arguments.length > 1) {
    acc = initial;
  } else if (this.tail) {
    walker = this.tail.prev;
    acc = this.tail.value;
  } else {
    throw new TypeError('Reduce of empty list with no initial value')
  }

  for (var i = this.length - 1; walker !== null; i--) {
    acc = fn(acc, walker.value, i);
    walker = walker.prev;
  }

  return acc
};

Yallist$1.prototype.toArray = function () {
  var arr = new Array(this.length);
  for (var i = 0, walker = this.head; walker !== null; i++) {
    arr[i] = walker.value;
    walker = walker.next;
  }
  return arr
};

Yallist$1.prototype.toArrayReverse = function () {
  var arr = new Array(this.length);
  for (var i = 0, walker = this.tail; walker !== null; i++) {
    arr[i] = walker.value;
    walker = walker.prev;
  }
  return arr
};

Yallist$1.prototype.slice = function (from, to) {
  to = to || this.length;
  if (to < 0) {
    to += this.length;
  }
  from = from || 0;
  if (from < 0) {
    from += this.length;
  }
  var ret = new Yallist$1();
  if (to < from || to < 0) {
    return ret
  }
  if (from < 0) {
    from = 0;
  }
  if (to > this.length) {
    to = this.length;
  }
  for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
    walker = walker.next;
  }
  for (; walker !== null && i < to; i++, walker = walker.next) {
    ret.push(walker.value);
  }
  return ret
};

Yallist$1.prototype.sliceReverse = function (from, to) {
  to = to || this.length;
  if (to < 0) {
    to += this.length;
  }
  from = from || 0;
  if (from < 0) {
    from += this.length;
  }
  var ret = new Yallist$1();
  if (to < from || to < 0) {
    return ret
  }
  if (from < 0) {
    from = 0;
  }
  if (to > this.length) {
    to = this.length;
  }
  for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
    walker = walker.prev;
  }
  for (; walker !== null && i > from; i--, walker = walker.prev) {
    ret.push(walker.value);
  }
  return ret
};

Yallist$1.prototype.splice = function (start, deleteCount, ...nodes) {
  if (start > this.length) {
    start = this.length - 1;
  }
  if (start < 0) {
    start = this.length + start;
  }

  for (var i = 0, walker = this.head; walker !== null && i < start; i++) {
    walker = walker.next;
  }

  var ret = [];
  for (var i = 0; walker && i < deleteCount; i++) {
    ret.push(walker.value);
    walker = this.removeNode(walker);
  }
  if (walker === null) {
    walker = this.tail;
  }

  if (walker !== this.head && walker !== this.tail) {
    walker = walker.prev;
  }

  for (var i = 0; i < nodes.length; i++) {
    walker = insert(this, walker, nodes[i]);
  }
  return ret;
};

Yallist$1.prototype.reverse = function () {
  var head = this.head;
  var tail = this.tail;
  for (var walker = head; walker !== null; walker = walker.prev) {
    var p = walker.prev;
    walker.prev = walker.next;
    walker.next = p;
  }
  this.head = tail;
  this.tail = head;
  return this
};

function insert (self, node, value) {
  var inserted = node === self.head ?
    new Node(value, null, node, self) :
    new Node(value, node, node.next, self);

  if (inserted.next === null) {
    self.tail = inserted;
  }
  if (inserted.prev === null) {
    self.head = inserted;
  }

  self.length++;

  return inserted
}

function push (self, item) {
  self.tail = new Node(item, self.tail, null, self);
  if (!self.head) {
    self.head = self.tail;
  }
  self.length++;
}

function unshift (self, item) {
  self.head = new Node(item, null, self.head, self);
  if (!self.tail) {
    self.tail = self.head;
  }
  self.length++;
}

function Node (value, prev, next, list) {
  if (!(this instanceof Node)) {
    return new Node(value, prev, next, list)
  }

  this.list = list;
  this.value = value;

  if (prev) {
    prev.next = this;
    this.prev = prev;
  } else {
    this.prev = null;
  }

  if (next) {
    next.prev = this;
    this.next = next;
  } else {
    this.next = null;
  }
}

try {
  // add if support for Symbol.iterator is present
  requireIterator()(Yallist$1);
} catch (er) {}

// A linked list to keep track of recently-used-ness
const Yallist = yallist;

const MAX = Symbol('max');
const LENGTH = Symbol('length');
const LENGTH_CALCULATOR = Symbol('lengthCalculator');
const ALLOW_STALE = Symbol('allowStale');
const MAX_AGE = Symbol('maxAge');
const DISPOSE = Symbol('dispose');
const NO_DISPOSE_ON_SET = Symbol('noDisposeOnSet');
const LRU_LIST = Symbol('lruList');
const CACHE = Symbol('cache');
const UPDATE_AGE_ON_GET = Symbol('updateAgeOnGet');

const naiveLength = () => 1;

// lruList is a yallist where the head is the youngest
// item, and the tail is the oldest.  the list contains the Hit
// objects as the entries.
// Each Hit object has a reference to its Yallist.Node.  This
// never changes.
//
// cache is a Map (or PseudoMap) that matches the keys to
// the Yallist.Node object.
class LRUCache {
  constructor (options) {
    if (typeof options === 'number')
      options = { max: options };

    if (!options)
      options = {};

    if (options.max && (typeof options.max !== 'number' || options.max < 0))
      throw new TypeError('max must be a non-negative number')
    // Kind of weird to have a default max of Infinity, but oh well.
    this[MAX] = options.max || Infinity;

    const lc = options.length || naiveLength;
    this[LENGTH_CALCULATOR] = (typeof lc !== 'function') ? naiveLength : lc;
    this[ALLOW_STALE] = options.stale || false;
    if (options.maxAge && typeof options.maxAge !== 'number')
      throw new TypeError('maxAge must be a number')
    this[MAX_AGE] = options.maxAge || 0;
    this[DISPOSE] = options.dispose;
    this[NO_DISPOSE_ON_SET] = options.noDisposeOnSet || false;
    this[UPDATE_AGE_ON_GET] = options.updateAgeOnGet || false;
    this.reset();
  }

  // resize the cache when the max changes.
  set max (mL) {
    if (typeof mL !== 'number' || mL < 0)
      throw new TypeError('max must be a non-negative number')

    this[MAX] = mL || Infinity;
    trim(this);
  }
  get max () {
    return this[MAX]
  }

  set allowStale (allowStale) {
    this[ALLOW_STALE] = !!allowStale;
  }
  get allowStale () {
    return this[ALLOW_STALE]
  }

  set maxAge (mA) {
    if (typeof mA !== 'number')
      throw new TypeError('maxAge must be a non-negative number')

    this[MAX_AGE] = mA;
    trim(this);
  }
  get maxAge () {
    return this[MAX_AGE]
  }

  // resize the cache when the lengthCalculator changes.
  set lengthCalculator (lC) {
    if (typeof lC !== 'function')
      lC = naiveLength;

    if (lC !== this[LENGTH_CALCULATOR]) {
      this[LENGTH_CALCULATOR] = lC;
      this[LENGTH] = 0;
      this[LRU_LIST].forEach(hit => {
        hit.length = this[LENGTH_CALCULATOR](hit.value, hit.key);
        this[LENGTH] += hit.length;
      });
    }
    trim(this);
  }
  get lengthCalculator () { return this[LENGTH_CALCULATOR] }

  get length () { return this[LENGTH] }
  get itemCount () { return this[LRU_LIST].length }

  rforEach (fn, thisp) {
    thisp = thisp || this;
    for (let walker = this[LRU_LIST].tail; walker !== null;) {
      const prev = walker.prev;
      forEachStep(this, fn, walker, thisp);
      walker = prev;
    }
  }

  forEach (fn, thisp) {
    thisp = thisp || this;
    for (let walker = this[LRU_LIST].head; walker !== null;) {
      const next = walker.next;
      forEachStep(this, fn, walker, thisp);
      walker = next;
    }
  }

  keys () {
    return this[LRU_LIST].toArray().map(k => k.key)
  }

  values () {
    return this[LRU_LIST].toArray().map(k => k.value)
  }

  reset () {
    if (this[DISPOSE] &&
        this[LRU_LIST] &&
        this[LRU_LIST].length) {
      this[LRU_LIST].forEach(hit => this[DISPOSE](hit.key, hit.value));
    }

    this[CACHE] = new Map(); // hash of items by key
    this[LRU_LIST] = new Yallist(); // list of items in order of use recency
    this[LENGTH] = 0; // length of items in the list
  }

  dump () {
    return this[LRU_LIST].map(hit =>
      isStale(this, hit) ? false : {
        k: hit.key,
        v: hit.value,
        e: hit.now + (hit.maxAge || 0)
      }).toArray().filter(h => h)
  }

  dumpLru () {
    return this[LRU_LIST]
  }

  set (key, value, maxAge) {
    maxAge = maxAge || this[MAX_AGE];

    if (maxAge && typeof maxAge !== 'number')
      throw new TypeError('maxAge must be a number')

    const now = maxAge ? Date.now() : 0;
    const len = this[LENGTH_CALCULATOR](value, key);

    if (this[CACHE].has(key)) {
      if (len > this[MAX]) {
        del(this, this[CACHE].get(key));
        return false
      }

      const node = this[CACHE].get(key);
      const item = node.value;

      // dispose of the old one before overwriting
      // split out into 2 ifs for better coverage tracking
      if (this[DISPOSE]) {
        if (!this[NO_DISPOSE_ON_SET])
          this[DISPOSE](key, item.value);
      }

      item.now = now;
      item.maxAge = maxAge;
      item.value = value;
      this[LENGTH] += len - item.length;
      item.length = len;
      this.get(key);
      trim(this);
      return true
    }

    const hit = new Entry(key, value, len, now, maxAge);

    // oversized objects fall out of cache automatically.
    if (hit.length > this[MAX]) {
      if (this[DISPOSE])
        this[DISPOSE](key, value);

      return false
    }

    this[LENGTH] += hit.length;
    this[LRU_LIST].unshift(hit);
    this[CACHE].set(key, this[LRU_LIST].head);
    trim(this);
    return true
  }

  has (key) {
    if (!this[CACHE].has(key)) return false
    const hit = this[CACHE].get(key).value;
    return !isStale(this, hit)
  }

  get (key) {
    return get(this, key, true)
  }

  peek (key) {
    return get(this, key, false)
  }

  pop () {
    const node = this[LRU_LIST].tail;
    if (!node)
      return null

    del(this, node);
    return node.value
  }

  del (key) {
    del(this, this[CACHE].get(key));
  }

  load (arr) {
    // reset the cache
    this.reset();

    const now = Date.now();
    // A previous serialized cache has the most recent items first
    for (let l = arr.length - 1; l >= 0; l--) {
      const hit = arr[l];
      const expiresAt = hit.e || 0;
      if (expiresAt === 0)
        // the item was created without expiration in a non aged cache
        this.set(hit.k, hit.v);
      else {
        const maxAge = expiresAt - now;
        // dont add already expired items
        if (maxAge > 0) {
          this.set(hit.k, hit.v, maxAge);
        }
      }
    }
  }

  prune () {
    this[CACHE].forEach((value, key) => get(this, key, false));
  }
}

const get = (self, key, doUse) => {
  const node = self[CACHE].get(key);
  if (node) {
    const hit = node.value;
    if (isStale(self, hit)) {
      del(self, node);
      if (!self[ALLOW_STALE])
        return undefined
    } else {
      if (doUse) {
        if (self[UPDATE_AGE_ON_GET])
          node.value.now = Date.now();
        self[LRU_LIST].unshiftNode(node);
      }
    }
    return hit.value
  }
};

const isStale = (self, hit) => {
  if (!hit || (!hit.maxAge && !self[MAX_AGE]))
    return false

  const diff = Date.now() - hit.now;
  return hit.maxAge ? diff > hit.maxAge
    : self[MAX_AGE] && (diff > self[MAX_AGE])
};

const trim = self => {
  if (self[LENGTH] > self[MAX]) {
    for (let walker = self[LRU_LIST].tail;
      self[LENGTH] > self[MAX] && walker !== null;) {
      // We know that we're about to delete this one, and also
      // what the next least recently used key will be, so just
      // go ahead and set it now.
      const prev = walker.prev;
      del(self, walker);
      walker = prev;
    }
  }
};

const del = (self, node) => {
  if (node) {
    const hit = node.value;
    if (self[DISPOSE])
      self[DISPOSE](hit.key, hit.value);

    self[LENGTH] -= hit.length;
    self[CACHE].delete(hit.key);
    self[LRU_LIST].removeNode(node);
  }
};

class Entry {
  constructor (key, value, length, now, maxAge) {
    this.key = key;
    this.value = value;
    this.length = length;
    this.now = now;
    this.maxAge = maxAge || 0;
  }
}

const forEachStep = (self, fn, node, thisp) => {
  let hit = node.value;
  if (isStale(self, hit)) {
    del(self, node);
    if (!self[ALLOW_STALE])
      hit = undefined;
  }
  if (hit)
    fn.call(thisp, hit.value, hit.key, self);
};

var lruCache = LRUCache;

var range;
var hasRequiredRange;

function requireRange () {
	if (hasRequiredRange) return range;
	hasRequiredRange = 1;
	// hoisted class for cyclic dependency
	class Range {
	  constructor (range, options) {
	    options = parseOptions(options);

	    if (range instanceof Range) {
	      if (
	        range.loose === !!options.loose &&
	        range.includePrerelease === !!options.includePrerelease
	      ) {
	        return range
	      } else {
	        return new Range(range.raw, options)
	      }
	    }

	    if (range instanceof Comparator) {
	      // just put it in the set and return
	      this.raw = range.value;
	      this.set = [[range]];
	      this.format();
	      return this
	    }

	    this.options = options;
	    this.loose = !!options.loose;
	    this.includePrerelease = !!options.includePrerelease;

	    // First reduce all whitespace as much as possible so we do not have to rely
	    // on potentially slow regexes like \s*. This is then stored and used for
	    // future error messages as well.
	    this.raw = range
	      .trim()
	      .split(/\s+/)
	      .join(' ');

	    // First, split on ||
	    this.set = this.raw
	      .split('||')
	      // map the range to a 2d array of comparators
	      .map(r => this.parseRange(r.trim()))
	      // throw out any comparator lists that are empty
	      // this generally means that it was not a valid range, which is allowed
	      // in loose mode, but will still throw if the WHOLE range is invalid.
	      .filter(c => c.length);

	    if (!this.set.length) {
	      throw new TypeError(`Invalid SemVer Range: ${this.raw}`)
	    }

	    // if we have any that are not the null set, throw out null sets.
	    if (this.set.length > 1) {
	      // keep the first one, in case they're all null sets
	      const first = this.set[0];
	      this.set = this.set.filter(c => !isNullSet(c[0]));
	      if (this.set.length === 0) {
	        this.set = [first];
	      } else if (this.set.length > 1) {
	        // if we have any that are *, then the range is just *
	        for (const c of this.set) {
	          if (c.length === 1 && isAny(c[0])) {
	            this.set = [c];
	            break
	          }
	        }
	      }
	    }

	    this.format();
	  }

	  format () {
	    this.range = this.set
	      .map((comps) => comps.join(' ').trim())
	      .join('||')
	      .trim();
	    return this.range
	  }

	  toString () {
	    return this.range
	  }

	  parseRange (range) {
	    // memoize range parsing for performance.
	    // this is a very hot path, and fully deterministic.
	    const memoOpts =
	      (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) |
	      (this.options.loose && FLAG_LOOSE);
	    const memoKey = memoOpts + ':' + range;
	    const cached = cache.get(memoKey);
	    if (cached) {
	      return cached
	    }

	    const loose = this.options.loose;
	    // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
	    const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
	    range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
	    debug('hyphen replace', range);

	    // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
	    range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
	    debug('comparator trim', range);

	    // `~ 1.2.3` => `~1.2.3`
	    range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
	    debug('tilde trim', range);

	    // `^ 1.2.3` => `^1.2.3`
	    range = range.replace(re[t.CARETTRIM], caretTrimReplace);
	    debug('caret trim', range);

	    // At this point, the range is completely trimmed and
	    // ready to be split into comparators.

	    let rangeList = range
	      .split(' ')
	      .map(comp => parseComparator(comp, this.options))
	      .join(' ')
	      .split(/\s+/)
	      // >=0.0.0 is equivalent to *
	      .map(comp => replaceGTE0(comp, this.options));

	    if (loose) {
	      // in loose mode, throw out any that are not valid comparators
	      rangeList = rangeList.filter(comp => {
	        debug('loose invalid filter', comp, this.options);
	        return !!comp.match(re[t.COMPARATORLOOSE])
	      });
	    }
	    debug('range list', rangeList);

	    // if any comparators are the null set, then replace with JUST null set
	    // if more than one comparator, remove any * comparators
	    // also, don't include the same comparator more than once
	    const rangeMap = new Map();
	    const comparators = rangeList.map(comp => new Comparator(comp, this.options));
	    for (const comp of comparators) {
	      if (isNullSet(comp)) {
	        return [comp]
	      }
	      rangeMap.set(comp.value, comp);
	    }
	    if (rangeMap.size > 1 && rangeMap.has('')) {
	      rangeMap.delete('');
	    }

	    const result = [...rangeMap.values()];
	    cache.set(memoKey, result);
	    return result
	  }

	  intersects (range, options) {
	    if (!(range instanceof Range)) {
	      throw new TypeError('a Range is required')
	    }

	    return this.set.some((thisComparators) => {
	      return (
	        isSatisfiable(thisComparators, options) &&
	        range.set.some((rangeComparators) => {
	          return (
	            isSatisfiable(rangeComparators, options) &&
	            thisComparators.every((thisComparator) => {
	              return rangeComparators.every((rangeComparator) => {
	                return thisComparator.intersects(rangeComparator, options)
	              })
	            })
	          )
	        })
	      )
	    })
	  }

	  // if ANY of the sets match ALL of its comparators, then pass
	  test (version) {
	    if (!version) {
	      return false
	    }

	    if (typeof version === 'string') {
	      try {
	        version = new SemVer(version, this.options);
	      } catch (er) {
	        return false
	      }
	    }

	    for (let i = 0; i < this.set.length; i++) {
	      if (testSet(this.set[i], version, this.options)) {
	        return true
	      }
	    }
	    return false
	  }
	}

	range = Range;

	const LRU = lruCache;
	const cache = new LRU({ max: 1000 });

	const parseOptions = parseOptions_1;
	const Comparator = requireComparator();
	const debug = debug_1;
	const SemVer = semver$1;
	const {
	  safeRe: re,
	  t,
	  comparatorTrimReplace,
	  tildeTrimReplace,
	  caretTrimReplace,
	} = reExports;
	const { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = constants$1;

	const isNullSet = c => c.value === '<0.0.0-0';
	const isAny = c => c.value === '';

	// take a set of comparators and determine whether there
	// exists a version which can satisfy it
	const isSatisfiable = (comparators, options) => {
	  let result = true;
	  const remainingComparators = comparators.slice();
	  let testComparator = remainingComparators.pop();

	  while (result && remainingComparators.length) {
	    result = remainingComparators.every((otherComparator) => {
	      return testComparator.intersects(otherComparator, options)
	    });

	    testComparator = remainingComparators.pop();
	  }

	  return result
	};

	// comprised of xranges, tildes, stars, and gtlt's at this point.
	// already replaced the hyphen ranges
	// turn into a set of JUST comparators.
	const parseComparator = (comp, options) => {
	  debug('comp', comp, options);
	  comp = replaceCarets(comp, options);
	  debug('caret', comp);
	  comp = replaceTildes(comp, options);
	  debug('tildes', comp);
	  comp = replaceXRanges(comp, options);
	  debug('xrange', comp);
	  comp = replaceStars(comp, options);
	  debug('stars', comp);
	  return comp
	};

	const isX = id => !id || id.toLowerCase() === 'x' || id === '*';

	// ~, ~> --> * (any, kinda silly)
	// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
	// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
	// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
	// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
	// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
	// ~0.0.1 --> >=0.0.1 <0.1.0-0
	const replaceTildes = (comp, options) => {
	  return comp
	    .trim()
	    .split(/\s+/)
	    .map((c) => replaceTilde(c, options))
	    .join(' ')
	};

	const replaceTilde = (comp, options) => {
	  const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
	  return comp.replace(r, (_, M, m, p, pr) => {
	    debug('tilde', comp, _, M, m, p, pr);
	    let ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
	    } else if (isX(p)) {
	      // ~1.2 == >=1.2.0 <1.3.0-0
	      ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
	    } else if (pr) {
	      debug('replaceTilde pr', pr);
	      ret = `>=${M}.${m}.${p}-${pr
	      } <${M}.${+m + 1}.0-0`;
	    } else {
	      // ~1.2.3 == >=1.2.3 <1.3.0-0
	      ret = `>=${M}.${m}.${p
	      } <${M}.${+m + 1}.0-0`;
	    }

	    debug('tilde return', ret);
	    return ret
	  })
	};

	// ^ --> * (any, kinda silly)
	// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
	// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
	// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
	// ^1.2.3 --> >=1.2.3 <2.0.0-0
	// ^1.2.0 --> >=1.2.0 <2.0.0-0
	// ^0.0.1 --> >=0.0.1 <0.0.2-0
	// ^0.1.0 --> >=0.1.0 <0.2.0-0
	const replaceCarets = (comp, options) => {
	  return comp
	    .trim()
	    .split(/\s+/)
	    .map((c) => replaceCaret(c, options))
	    .join(' ')
	};

	const replaceCaret = (comp, options) => {
	  debug('caret', comp, options);
	  const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
	  const z = options.includePrerelease ? '-0' : '';
	  return comp.replace(r, (_, M, m, p, pr) => {
	    debug('caret', comp, _, M, m, p, pr);
	    let ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
	    } else if (isX(p)) {
	      if (M === '0') {
	        ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
	      } else {
	        ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
	      }
	    } else if (pr) {
	      debug('replaceCaret pr', pr);
	      if (M === '0') {
	        if (m === '0') {
	          ret = `>=${M}.${m}.${p}-${pr
	          } <${M}.${m}.${+p + 1}-0`;
	        } else {
	          ret = `>=${M}.${m}.${p}-${pr
	          } <${M}.${+m + 1}.0-0`;
	        }
	      } else {
	        ret = `>=${M}.${m}.${p}-${pr
	        } <${+M + 1}.0.0-0`;
	      }
	    } else {
	      debug('no pr');
	      if (M === '0') {
	        if (m === '0') {
	          ret = `>=${M}.${m}.${p
	          }${z} <${M}.${m}.${+p + 1}-0`;
	        } else {
	          ret = `>=${M}.${m}.${p
	          }${z} <${M}.${+m + 1}.0-0`;
	        }
	      } else {
	        ret = `>=${M}.${m}.${p
	        } <${+M + 1}.0.0-0`;
	      }
	    }

	    debug('caret return', ret);
	    return ret
	  })
	};

	const replaceXRanges = (comp, options) => {
	  debug('replaceXRanges', comp, options);
	  return comp
	    .split(/\s+/)
	    .map((c) => replaceXRange(c, options))
	    .join(' ')
	};

	const replaceXRange = (comp, options) => {
	  comp = comp.trim();
	  const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
	  return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
	    debug('xRange', comp, ret, gtlt, M, m, p, pr);
	    const xM = isX(M);
	    const xm = xM || isX(m);
	    const xp = xm || isX(p);
	    const anyX = xp;

	    if (gtlt === '=' && anyX) {
	      gtlt = '';
	    }

	    // if we're including prereleases in the match, then we need
	    // to fix this to -0, the lowest possible prerelease value
	    pr = options.includePrerelease ? '-0' : '';

	    if (xM) {
	      if (gtlt === '>' || gtlt === '<') {
	        // nothing is allowed
	        ret = '<0.0.0-0';
	      } else {
	        // nothing is forbidden
	        ret = '*';
	      }
	    } else if (gtlt && anyX) {
	      // we know patch is an x, because we have any x at all.
	      // replace X with 0
	      if (xm) {
	        m = 0;
	      }
	      p = 0;

	      if (gtlt === '>') {
	        // >1 => >=2.0.0
	        // >1.2 => >=1.3.0
	        gtlt = '>=';
	        if (xm) {
	          M = +M + 1;
	          m = 0;
	          p = 0;
	        } else {
	          m = +m + 1;
	          p = 0;
	        }
	      } else if (gtlt === '<=') {
	        // <=0.7.x is actually <0.8.0, since any 0.7.x should
	        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
	        gtlt = '<';
	        if (xm) {
	          M = +M + 1;
	        } else {
	          m = +m + 1;
	        }
	      }

	      if (gtlt === '<') {
	        pr = '-0';
	      }

	      ret = `${gtlt + M}.${m}.${p}${pr}`;
	    } else if (xm) {
	      ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
	    } else if (xp) {
	      ret = `>=${M}.${m}.0${pr
	      } <${M}.${+m + 1}.0-0`;
	    }

	    debug('xRange return', ret);

	    return ret
	  })
	};

	// Because * is AND-ed with everything else in the comparator,
	// and '' means "any version", just remove the *s entirely.
	const replaceStars = (comp, options) => {
	  debug('replaceStars', comp, options);
	  // Looseness is ignored here.  star is always as loose as it gets!
	  return comp
	    .trim()
	    .replace(re[t.STAR], '')
	};

	const replaceGTE0 = (comp, options) => {
	  debug('replaceGTE0', comp, options);
	  return comp
	    .trim()
	    .replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], '')
	};

	// This function is passed to string.replace(re[t.HYPHENRANGE])
	// M, m, patch, prerelease, build
	// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
	// 1.2.3 - 3.4 => >=1.2.0 <3.5.0-0 Any 3.4.x will do
	// 1.2 - 3.4 => >=1.2.0 <3.5.0-0
	const hyphenReplace = incPr => ($0,
	  from, fM, fm, fp, fpr, fb,
	  to, tM, tm, tp, tpr, tb) => {
	  if (isX(fM)) {
	    from = '';
	  } else if (isX(fm)) {
	    from = `>=${fM}.0.0${incPr ? '-0' : ''}`;
	  } else if (isX(fp)) {
	    from = `>=${fM}.${fm}.0${incPr ? '-0' : ''}`;
	  } else if (fpr) {
	    from = `>=${from}`;
	  } else {
	    from = `>=${from}${incPr ? '-0' : ''}`;
	  }

	  if (isX(tM)) {
	    to = '';
	  } else if (isX(tm)) {
	    to = `<${+tM + 1}.0.0-0`;
	  } else if (isX(tp)) {
	    to = `<${tM}.${+tm + 1}.0-0`;
	  } else if (tpr) {
	    to = `<=${tM}.${tm}.${tp}-${tpr}`;
	  } else if (incPr) {
	    to = `<${tM}.${tm}.${+tp + 1}-0`;
	  } else {
	    to = `<=${to}`;
	  }

	  return `${from} ${to}`.trim()
	};

	const testSet = (set, version, options) => {
	  for (let i = 0; i < set.length; i++) {
	    if (!set[i].test(version)) {
	      return false
	    }
	  }

	  if (version.prerelease.length && !options.includePrerelease) {
	    // Find the set of versions that are allowed to have prereleases
	    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
	    // That should allow `1.2.3-pr.2` to pass.
	    // However, `1.2.4-alpha.notready` should NOT be allowed,
	    // even though it's within the range set by the comparators.
	    for (let i = 0; i < set.length; i++) {
	      debug(set[i].semver);
	      if (set[i].semver === Comparator.ANY) {
	        continue
	      }

	      if (set[i].semver.prerelease.length > 0) {
	        const allowed = set[i].semver;
	        if (allowed.major === version.major &&
	            allowed.minor === version.minor &&
	            allowed.patch === version.patch) {
	          return true
	        }
	      }
	    }

	    // Version has a -pre, but it's not one of the ones we like.
	    return false
	  }

	  return true
	};
	return range;
}

var comparator;
var hasRequiredComparator;

function requireComparator () {
	if (hasRequiredComparator) return comparator;
	hasRequiredComparator = 1;
	const ANY = Symbol('SemVer ANY');
	// hoisted class for cyclic dependency
	class Comparator {
	  static get ANY () {
	    return ANY
	  }

	  constructor (comp, options) {
	    options = parseOptions(options);

	    if (comp instanceof Comparator) {
	      if (comp.loose === !!options.loose) {
	        return comp
	      } else {
	        comp = comp.value;
	      }
	    }

	    comp = comp.trim().split(/\s+/).join(' ');
	    debug('comparator', comp, options);
	    this.options = options;
	    this.loose = !!options.loose;
	    this.parse(comp);

	    if (this.semver === ANY) {
	      this.value = '';
	    } else {
	      this.value = this.operator + this.semver.version;
	    }

	    debug('comp', this);
	  }

	  parse (comp) {
	    const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
	    const m = comp.match(r);

	    if (!m) {
	      throw new TypeError(`Invalid comparator: ${comp}`)
	    }

	    this.operator = m[1] !== undefined ? m[1] : '';
	    if (this.operator === '=') {
	      this.operator = '';
	    }

	    // if it literally is just '>' or '' then allow anything.
	    if (!m[2]) {
	      this.semver = ANY;
	    } else {
	      this.semver = new SemVer(m[2], this.options.loose);
	    }
	  }

	  toString () {
	    return this.value
	  }

	  test (version) {
	    debug('Comparator.test', version, this.options.loose);

	    if (this.semver === ANY || version === ANY) {
	      return true
	    }

	    if (typeof version === 'string') {
	      try {
	        version = new SemVer(version, this.options);
	      } catch (er) {
	        return false
	      }
	    }

	    return cmp(version, this.operator, this.semver, this.options)
	  }

	  intersects (comp, options) {
	    if (!(comp instanceof Comparator)) {
	      throw new TypeError('a Comparator is required')
	    }

	    if (this.operator === '') {
	      if (this.value === '') {
	        return true
	      }
	      return new Range(comp.value, options).test(this.value)
	    } else if (comp.operator === '') {
	      if (comp.value === '') {
	        return true
	      }
	      return new Range(this.value, options).test(comp.semver)
	    }

	    options = parseOptions(options);

	    // Special cases where nothing can possibly be lower
	    if (options.includePrerelease &&
	      (this.value === '<0.0.0-0' || comp.value === '<0.0.0-0')) {
	      return false
	    }
	    if (!options.includePrerelease &&
	      (this.value.startsWith('<0.0.0') || comp.value.startsWith('<0.0.0'))) {
	      return false
	    }

	    // Same direction increasing (> or >=)
	    if (this.operator.startsWith('>') && comp.operator.startsWith('>')) {
	      return true
	    }
	    // Same direction decreasing (< or <=)
	    if (this.operator.startsWith('<') && comp.operator.startsWith('<')) {
	      return true
	    }
	    // same SemVer and both sides are inclusive (<= or >=)
	    if (
	      (this.semver.version === comp.semver.version) &&
	      this.operator.includes('=') && comp.operator.includes('=')) {
	      return true
	    }
	    // opposite directions less than
	    if (cmp(this.semver, '<', comp.semver, options) &&
	      this.operator.startsWith('>') && comp.operator.startsWith('<')) {
	      return true
	    }
	    // opposite directions greater than
	    if (cmp(this.semver, '>', comp.semver, options) &&
	      this.operator.startsWith('<') && comp.operator.startsWith('>')) {
	      return true
	    }
	    return false
	  }
	}

	comparator = Comparator;

	const parseOptions = parseOptions_1;
	const { safeRe: re, t } = reExports;
	const cmp = cmp_1;
	const debug = debug_1;
	const SemVer = semver$1;
	const Range = requireRange();
	return comparator;
}

const Range$9 = requireRange();
const satisfies$4 = (version, range, options) => {
  try {
    range = new Range$9(range, options);
  } catch (er) {
    return false
  }
  return range.test(version)
};
var satisfies_1 = satisfies$4;

const Range$8 = requireRange();

// Mostly just for testing and legacy API reasons
const toComparators$1 = (range, options) =>
  new Range$8(range, options).set
    .map(comp => comp.map(c => c.value).join(' ').trim().split(' '));

var toComparators_1 = toComparators$1;

const SemVer$4 = semver$1;
const Range$7 = requireRange();

const maxSatisfying$1 = (versions, range, options) => {
  let max = null;
  let maxSV = null;
  let rangeObj = null;
  try {
    rangeObj = new Range$7(range, options);
  } catch (er) {
    return null
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!max || maxSV.compare(v) === -1) {
        // compare(max, v, true)
        max = v;
        maxSV = new SemVer$4(max, options);
      }
    }
  });
  return max
};
var maxSatisfying_1 = maxSatisfying$1;

const SemVer$3 = semver$1;
const Range$6 = requireRange();
const minSatisfying$1 = (versions, range, options) => {
  let min = null;
  let minSV = null;
  let rangeObj = null;
  try {
    rangeObj = new Range$6(range, options);
  } catch (er) {
    return null
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!min || minSV.compare(v) === 1) {
        // compare(min, v, true)
        min = v;
        minSV = new SemVer$3(min, options);
      }
    }
  });
  return min
};
var minSatisfying_1 = minSatisfying$1;

const SemVer$2 = semver$1;
const Range$5 = requireRange();
const gt$2 = gt_1;

const minVersion$1 = (range, loose) => {
  range = new Range$5(range, loose);

  let minver = new SemVer$2('0.0.0');
  if (range.test(minver)) {
    return minver
  }

  minver = new SemVer$2('0.0.0-0');
  if (range.test(minver)) {
    return minver
  }

  minver = null;
  for (let i = 0; i < range.set.length; ++i) {
    const comparators = range.set[i];

    let setMin = null;
    comparators.forEach((comparator) => {
      // Clone to avoid manipulating the comparator's semver object.
      const compver = new SemVer$2(comparator.semver.version);
      switch (comparator.operator) {
        case '>':
          if (compver.prerelease.length === 0) {
            compver.patch++;
          } else {
            compver.prerelease.push(0);
          }
          compver.raw = compver.format();
          /* fallthrough */
        case '':
        case '>=':
          if (!setMin || gt$2(compver, setMin)) {
            setMin = compver;
          }
          break
        case '<':
        case '<=':
          /* Ignore maximum versions */
          break
        /* istanbul ignore next */
        default:
          throw new Error(`Unexpected operation: ${comparator.operator}`)
      }
    });
    if (setMin && (!minver || gt$2(minver, setMin))) {
      minver = setMin;
    }
  }

  if (minver && range.test(minver)) {
    return minver
  }

  return null
};
var minVersion_1 = minVersion$1;

const Range$4 = requireRange();
const validRange$1 = (range, options) => {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return new Range$4(range, options).range || '*'
  } catch (er) {
    return null
  }
};
var valid$1 = validRange$1;

const SemVer$1 = semver$1;
const Comparator$2 = requireComparator();
const { ANY: ANY$1 } = Comparator$2;
const Range$3 = requireRange();
const satisfies$3 = satisfies_1;
const gt$1 = gt_1;
const lt$1 = lt_1;
const lte$1 = lte_1;
const gte$1 = gte_1;

const outside$3 = (version, range, hilo, options) => {
  version = new SemVer$1(version, options);
  range = new Range$3(range, options);

  let gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case '>':
      gtfn = gt$1;
      ltefn = lte$1;
      ltfn = lt$1;
      comp = '>';
      ecomp = '>=';
      break
    case '<':
      gtfn = lt$1;
      ltefn = gte$1;
      ltfn = gt$1;
      comp = '<';
      ecomp = '<=';
      break
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"')
  }

  // If it satisfies the range it is not outside
  if (satisfies$3(version, range, options)) {
    return false
  }

  // From now on, variable terms are as if we're in "gtr" mode.
  // but note that everything is flipped for the "ltr" function.

  for (let i = 0; i < range.set.length; ++i) {
    const comparators = range.set[i];

    let high = null;
    let low = null;

    comparators.forEach((comparator) => {
      if (comparator.semver === ANY$1) {
        comparator = new Comparator$2('>=0.0.0');
      }
      high = high || comparator;
      low = low || comparator;
      if (gtfn(comparator.semver, high.semver, options)) {
        high = comparator;
      } else if (ltfn(comparator.semver, low.semver, options)) {
        low = comparator;
      }
    });

    // If the edge version comparator has a operator then our version
    // isn't outside it
    if (high.operator === comp || high.operator === ecomp) {
      return false
    }

    // If the lowest version comparator has an operator and our version
    // is less than it then it isn't higher than the range
    if ((!low.operator || low.operator === comp) &&
        ltefn(version, low.semver)) {
      return false
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false
    }
  }
  return true
};

var outside_1 = outside$3;

// Determine if version is greater than all the versions possible in the range.
const outside$2 = outside_1;
const gtr$1 = (version, range, options) => outside$2(version, range, '>', options);
var gtr_1 = gtr$1;

const outside$1 = outside_1;
// Determine if version is less than all the versions possible in the range
const ltr$1 = (version, range, options) => outside$1(version, range, '<', options);
var ltr_1 = ltr$1;

const Range$2 = requireRange();
const intersects$1 = (r1, r2, options) => {
  r1 = new Range$2(r1, options);
  r2 = new Range$2(r2, options);
  return r1.intersects(r2, options)
};
var intersects_1 = intersects$1;

// given a set of versions and a range, create a "simplified" range
// that includes the same versions that the original range does
// If the original range is shorter than the simplified one, return that.
const satisfies$2 = satisfies_1;
const compare$2 = compare_1;
var simplify = (versions, range, options) => {
  const set = [];
  let first = null;
  let prev = null;
  const v = versions.sort((a, b) => compare$2(a, b, options));
  for (const version of v) {
    const included = satisfies$2(version, range, options);
    if (included) {
      prev = version;
      if (!first) {
        first = version;
      }
    } else {
      if (prev) {
        set.push([first, prev]);
      }
      prev = null;
      first = null;
    }
  }
  if (first) {
    set.push([first, null]);
  }

  const ranges = [];
  for (const [min, max] of set) {
    if (min === max) {
      ranges.push(min);
    } else if (!max && min === v[0]) {
      ranges.push('*');
    } else if (!max) {
      ranges.push(`>=${min}`);
    } else if (min === v[0]) {
      ranges.push(`<=${max}`);
    } else {
      ranges.push(`${min} - ${max}`);
    }
  }
  const simplified = ranges.join(' || ');
  const original = typeof range.raw === 'string' ? range.raw : String(range);
  return simplified.length < original.length ? simplified : range
};

const Range$1 = requireRange();
const Comparator$1 = requireComparator();
const { ANY } = Comparator$1;
const satisfies$1 = satisfies_1;
const compare$1 = compare_1;

// Complex range `r1 || r2 || ...` is a subset of `R1 || R2 || ...` iff:
// - Every simple range `r1, r2, ...` is a null set, OR
// - Every simple range `r1, r2, ...` which is not a null set is a subset of
//   some `R1, R2, ...`
//
// Simple range `c1 c2 ...` is a subset of simple range `C1 C2 ...` iff:
// - If c is only the ANY comparator
//   - If C is only the ANY comparator, return true
//   - Else if in prerelease mode, return false
//   - else replace c with `[>=0.0.0]`
// - If C is only the ANY comparator
//   - if in prerelease mode, return true
//   - else replace C with `[>=0.0.0]`
// - Let EQ be the set of = comparators in c
// - If EQ is more than one, return true (null set)
// - Let GT be the highest > or >= comparator in c
// - Let LT be the lowest < or <= comparator in c
// - If GT and LT, and GT.semver > LT.semver, return true (null set)
// - If any C is a = range, and GT or LT are set, return false
// - If EQ
//   - If GT, and EQ does not satisfy GT, return true (null set)
//   - If LT, and EQ does not satisfy LT, return true (null set)
//   - If EQ satisfies every C, return true
//   - Else return false
// - If GT
//   - If GT.semver is lower than any > or >= comp in C, return false
//   - If GT is >=, and GT.semver does not satisfy every C, return false
//   - If GT.semver has a prerelease, and not in prerelease mode
//     - If no C has a prerelease and the GT.semver tuple, return false
// - If LT
//   - If LT.semver is greater than any < or <= comp in C, return false
//   - If LT is <=, and LT.semver does not satisfy every C, return false
//   - If GT.semver has a prerelease, and not in prerelease mode
//     - If no C has a prerelease and the LT.semver tuple, return false
// - Else return true

const subset$1 = (sub, dom, options = {}) => {
  if (sub === dom) {
    return true
  }

  sub = new Range$1(sub, options);
  dom = new Range$1(dom, options);
  let sawNonNull = false;

  OUTER: for (const simpleSub of sub.set) {
    for (const simpleDom of dom.set) {
      const isSub = simpleSubset(simpleSub, simpleDom, options);
      sawNonNull = sawNonNull || isSub !== null;
      if (isSub) {
        continue OUTER
      }
    }
    // the null set is a subset of everything, but null simple ranges in
    // a complex range should be ignored.  so if we saw a non-null range,
    // then we know this isn't a subset, but if EVERY simple range was null,
    // then it is a subset.
    if (sawNonNull) {
      return false
    }
  }
  return true
};

const minimumVersionWithPreRelease = [new Comparator$1('>=0.0.0-0')];
const minimumVersion = [new Comparator$1('>=0.0.0')];

const simpleSubset = (sub, dom, options) => {
  if (sub === dom) {
    return true
  }

  if (sub.length === 1 && sub[0].semver === ANY) {
    if (dom.length === 1 && dom[0].semver === ANY) {
      return true
    } else if (options.includePrerelease) {
      sub = minimumVersionWithPreRelease;
    } else {
      sub = minimumVersion;
    }
  }

  if (dom.length === 1 && dom[0].semver === ANY) {
    if (options.includePrerelease) {
      return true
    } else {
      dom = minimumVersion;
    }
  }

  const eqSet = new Set();
  let gt, lt;
  for (const c of sub) {
    if (c.operator === '>' || c.operator === '>=') {
      gt = higherGT(gt, c, options);
    } else if (c.operator === '<' || c.operator === '<=') {
      lt = lowerLT(lt, c, options);
    } else {
      eqSet.add(c.semver);
    }
  }

  if (eqSet.size > 1) {
    return null
  }

  let gtltComp;
  if (gt && lt) {
    gtltComp = compare$1(gt.semver, lt.semver, options);
    if (gtltComp > 0) {
      return null
    } else if (gtltComp === 0 && (gt.operator !== '>=' || lt.operator !== '<=')) {
      return null
    }
  }

  // will iterate one or zero times
  for (const eq of eqSet) {
    if (gt && !satisfies$1(eq, String(gt), options)) {
      return null
    }

    if (lt && !satisfies$1(eq, String(lt), options)) {
      return null
    }

    for (const c of dom) {
      if (!satisfies$1(eq, String(c), options)) {
        return false
      }
    }

    return true
  }

  let higher, lower;
  let hasDomLT, hasDomGT;
  // if the subset has a prerelease, we need a comparator in the superset
  // with the same tuple and a prerelease, or it's not a subset
  let needDomLTPre = lt &&
    !options.includePrerelease &&
    lt.semver.prerelease.length ? lt.semver : false;
  let needDomGTPre = gt &&
    !options.includePrerelease &&
    gt.semver.prerelease.length ? gt.semver : false;
  // exception: <1.2.3-0 is the same as <1.2.3
  if (needDomLTPre && needDomLTPre.prerelease.length === 1 &&
      lt.operator === '<' && needDomLTPre.prerelease[0] === 0) {
    needDomLTPre = false;
  }

  for (const c of dom) {
    hasDomGT = hasDomGT || c.operator === '>' || c.operator === '>=';
    hasDomLT = hasDomLT || c.operator === '<' || c.operator === '<=';
    if (gt) {
      if (needDomGTPre) {
        if (c.semver.prerelease && c.semver.prerelease.length &&
            c.semver.major === needDomGTPre.major &&
            c.semver.minor === needDomGTPre.minor &&
            c.semver.patch === needDomGTPre.patch) {
          needDomGTPre = false;
        }
      }
      if (c.operator === '>' || c.operator === '>=') {
        higher = higherGT(gt, c, options);
        if (higher === c && higher !== gt) {
          return false
        }
      } else if (gt.operator === '>=' && !satisfies$1(gt.semver, String(c), options)) {
        return false
      }
    }
    if (lt) {
      if (needDomLTPre) {
        if (c.semver.prerelease && c.semver.prerelease.length &&
            c.semver.major === needDomLTPre.major &&
            c.semver.minor === needDomLTPre.minor &&
            c.semver.patch === needDomLTPre.patch) {
          needDomLTPre = false;
        }
      }
      if (c.operator === '<' || c.operator === '<=') {
        lower = lowerLT(lt, c, options);
        if (lower === c && lower !== lt) {
          return false
        }
      } else if (lt.operator === '<=' && !satisfies$1(lt.semver, String(c), options)) {
        return false
      }
    }
    if (!c.operator && (lt || gt) && gtltComp !== 0) {
      return false
    }
  }

  // if there was a < or >, and nothing in the dom, then must be false
  // UNLESS it was limited by another range in the other direction.
  // Eg, >1.0.0 <1.0.1 is still a subset of <2.0.0
  if (gt && hasDomLT && !lt && gtltComp !== 0) {
    return false
  }

  if (lt && hasDomGT && !gt && gtltComp !== 0) {
    return false
  }

  // we needed a prerelease range in a specific tuple, but didn't get one
  // then this isn't a subset.  eg >=1.2.3-pre is not a subset of >=1.0.0,
  // because it includes prereleases in the 1.2.3 tuple
  if (needDomGTPre || needDomLTPre) {
    return false
  }

  return true
};

// >=1.2.3 is lower than >1.2.3
const higherGT = (a, b, options) => {
  if (!a) {
    return b
  }
  const comp = compare$1(a.semver, b.semver, options);
  return comp > 0 ? a
    : comp < 0 ? b
    : b.operator === '>' && a.operator === '>=' ? b
    : a
};

// <=1.2.3 is higher than <1.2.3
const lowerLT = (a, b, options) => {
  if (!a) {
    return b
  }
  const comp = compare$1(a.semver, b.semver, options);
  return comp < 0 ? a
    : comp > 0 ? b
    : b.operator === '<' && a.operator === '<=' ? b
    : a
};

var subset_1 = subset$1;

// just pre-load all the stuff that index.js lazily exports
const internalRe = reExports;
const constants = constants$1;
const SemVer = semver$1;
const identifiers = identifiers$1;
const parse = parse_1;
const valid = valid_1;
const clean = clean_1;
const inc = inc_1;
const diff = diff_1;
const major = major_1;
const minor = minor_1;
const patch = patch_1;
const prerelease = prerelease_1;
const compare = compare_1;
const rcompare = rcompare_1;
const compareLoose = compareLoose_1;
const compareBuild = compareBuild_1;
const sort = sort_1;
const rsort = rsort_1;
const gt = gt_1;
const lt = lt_1;
const eq = eq_1;
const neq = neq_1;
const gte = gte_1;
const lte = lte_1;
const cmp = cmp_1;
const coerce = coerce_1;
const Comparator = requireComparator();
const Range = requireRange();
const satisfies = satisfies_1;
const toComparators = toComparators_1;
const maxSatisfying = maxSatisfying_1;
const minSatisfying = minSatisfying_1;
const minVersion = minVersion_1;
const validRange = valid$1;
const outside = outside_1;
const gtr = gtr_1;
const ltr = ltr_1;
const intersects = intersects_1;
const simplifyRange = simplify;
const subset = subset_1;
var semver = {
  parse,
  valid,
  clean,
  inc,
  diff,
  major,
  minor,
  patch,
  prerelease,
  compare,
  rcompare,
  compareLoose,
  compareBuild,
  sort,
  rsort,
  gt,
  lt,
  eq,
  neq,
  gte,
  lte,
  cmp,
  coerce,
  Comparator,
  Range,
  satisfies,
  toComparators,
  maxSatisfying,
  minSatisfying,
  minVersion,
  validRange,
  outside,
  gtr,
  ltr,
  intersects,
  simplifyRange,
  subset,
  SemVer,
  re: internalRe.re,
  src: internalRe.src,
  tokens: internalRe.t,
  SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: constants.RELEASE_TYPES,
  compareIdentifiers: identifiers.compareIdentifiers,
  rcompareIdentifiers: identifiers.rcompareIdentifiers,
};

export { prependPath_1 as p, semver as s, task as t };
//# sourceMappingURL=vendor.js.map
