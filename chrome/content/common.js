var _dump = dump;
dump = function(o) {
	if (o instanceof Error) {
		['name', 'message', 'fileName', 'lineNumber', 'stack']
		  .forEach(function(p) { _dump([p, ': ', o[p], '\n'].join('')); });
	} else { _dump(o + '\n\n'); }
};

Number.prototype.zerofill = function(len) {
	return ((1 << len).toString(2) + this).slice(-len);
};

var $s = function(selector, context) { return (context || document).querySelector(selector); };
var $S = function(selector, context) { return (context || document).querySelectorAll(selector); };

var replacer = function(conv) {
	var str = '';
	for (var k in conv) {
		if (conv.hasOwnProperty(k)) {
			str += (str.length ? '|' : '') + k;
		}
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
	return proc;
};

var Ajax = {
	request: function(options, sync) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() { try {
			if (xhr.readyState !== 4 || xhr.status !== 200) { return; }
			if (!options.success) { return; }
			options.success(xhr);
		} catch (e) { dump(e); } };

		options.type = options.type.toUpperCase();

		if (options.data) {
			var pairs = [], data = options.data;
			for (var prop in data) {
				if (data.hasOwnProperty(prop)) {
					pairs.push([prop, encodeURIComponent(data[prop])].join('='));
				}
			}
			options.data = pairs.join('&');
			if (options.type === 'GET') {
				(options.url += '?' + options.data);
			}
		}

		xhr.open(options.type, options.url, !sync);
		if (options.type === 'POST') {
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		}
		xhr.send(options.data || null);
		return xhr;
	}
};

var Element = {
  hasClassName: function(element, className) {
	  return (' ' + element.className + ' ').indexOf(' ' + className + ' ') !== -1;
  },

  addClassName: function(element, className) {
	  element.className += (element.className ? ' ' : '') + className;
	  return element;
  },

  removeClassName: function(element, className) {
	  var regexp = new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)');
	  element.className = element.className.replace(regexp, ' ').trim();
	  return element;
  }
};

var Effects = {
  fadeIn: function(element, sec) {
	  var opacity = 0, gap = 0.1;
	  var tid = setInterval(function() { try {
		  element.style.opacity = opacity = (opacity + gap < 1) ? opacity + gap : 1;
		  if (opacity === 1) {
			  clearInterval(tid);
		  }
	  } catch (e) { dump(e); } }, sec * gap * 1000);
  }
};

var Events = {
	bind: function(element, type, fn, useCapture) {
		element.addEventListener(type, function(event) { try {
			fn.apply(element, [event]);
		} catch (e) { dump(e); } }, useCapture || false);
	}
};
