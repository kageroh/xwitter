dump = (function() {
	var _dump = dump;

	return function(o) {
		if (o instanceof Error) {
			['name', 'message', 'fileName', 'lineNumber', 'stack']
			  .forEach(function(p) { _dump([p, ': ', o[p], '\n'].join('')); });
		} else { _dump(o + '\n\n'); }
	};
})();

Number.prototype.zerofill = function(len) {
	return ((1 << len).toString(2) + this).slice(-len);
};

var $s = function(selector, context) { return (context || document).querySelector(selector); };
var $S = function(selector, context) { return (context || document).querySelectorAll(selector); };

var replacer = function(conv) {
	var str = '';
	for (var k in conv) {
		str += (str.length ? '|' : '') + k;
	}
	var regexp = new RegExp(str, 'g');

	return function(s) {
		return s.replace(regexp, function($_) {
			var a = conv[$_];
			return a || $_;
		});
	};
};

var xsltproc = function(path) {
	var doc = document.implementation.createDocument('', '', null);
	doc.async = false;
	doc.load(path);
	var proc = new XSLTProcessor();
	proc.importStylesheet(doc);
	doc = null;
	return proc;
};

$.ajax = (function() {
	var _ajax = $.ajax;

	return function(options) {
		options.error = (function() {
			var _error = options.error;

			return function(xhr, status, e) {
				xhr = null;
				_error();
				dump(e);
			};
		})();

		return _ajax(options);
	};
})();

var Effects = {
  fadeIn: function(element, ms) {
	  var opacity = 0, gap = 0.1;
	  var tid = setInterval(function() { try {
		  element.style.opacity = opacity = (opacity + gap < 1) ? opacity + gap : 1;
		  if (opacity === 1) {
			  clearInterval(tid);
			  element = null;
		  }
	  } catch (e) { dump(e); } }, ms * gap);
  }
};
