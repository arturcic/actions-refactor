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

var semverExports$1 = semver$3.exports;

var semver$2 = {exports: {}};

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
} (semver$2, semver$2.exports));

var semverExports = semver$2.exports;

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

export { semverExports as a, semver as b, semverExports$1 as s };
//# sourceMappingURL=semver.js.map
