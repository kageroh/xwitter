var xwitter = function() {
	var that = {};

	var _name = 'xwitter';

	var _statuses = [];
	var _in_reply = '';

	var _box = $s('box');
	var _textbox = $s('textbox');

	var _query = {
		status      : 'section',
		marker      : 'header',
		created_at  : 'time',
		screen_name : 'h1',
		text        : 'p'
	};

	var _cmds = {
	  rate       : 'api',
	  destroy    : 'del',
	  fav        : 'fav',
	  findUrl    : 'url',
	  flee       : 'flee',
	  list       : 'list',
	  mention    : 'men',
	  quoteTweet : 'qt',
	  reply      : '@',
	  reTweet    : 'rt',
	  tl         : 'tl',
	  user       : 'user',
	  test       : 'test'
	};

	var _matchCmd = (function() {
		var arr = [], obj = _cmds;
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				arr.push(obj[prop]);
			}
		}
		return new RegExp('^(:)(' + arr.join('|') + '|.*)(?:\\s+(\\d+))?(?:\\s+(.+))?$');
	})();

	// ================================================================================================================================

	var _parseTimeOffset = function(str) {
		var match = /^([+\-])(\d{2}):(\d{2})$/.exec(str) || [];
		if (match[1] && match[2] && match[3]) {
			var sign = match[1], time = (parseInt(match[2], 10) + parseInt(match[3], 10) / 60) * 3600;
			switch (sign) {
			  case '+' : return +time;
			  case '-' : return -time;
			  default  : return 0;
			}
		} else {
			return 0;
		}
	};

	var _parseHighlight = function(str) {
		return str ? new RegExp(str.replace(/\W/g, '\\$&'), 'g') : null;
	};

	var _timeOffset = _parseTimeOffset(nsPreferences.copyUnicharPref('xwitter.timeOffset', ''));
	var _highlight = _parseHighlight(nsPreferences.copyUnicharPref('xwitter.highlight', ''));
	var _logSave = nsPreferences.getBoolPref('xwitter.log.save');

	// ================================================================================================================================

	var _modes = {
	  tl      : 'tl',
	  mention : 'mention',
	  user    : 'user',
	  list    : 'list',
	  test    : 'test'
	};
	var _mode; // _modes.xxx
	var _modeUrl;

	var _changeMode = (function() {
		var attrTitle = document.documentElement.getAttributeNode('title');

		return function(mode, param) {
			_mode = mode;

			switch (mode) {
			  case _modes.tl:
				attrTitle.nodeValue = _name;
				_modeUrl = 'https://api.twitter.com/1/statuses/home_timeline.xml';
				return;
			  case _modes.mention:
				attrTitle.nodeValue = [_name, 'mention'].join(' - ');
				_modeUrl = 'https://api.twitter.com/1/statuses/mentions.xml';
				return;
			  case _modes.test:
				attrTitle.nodeValue = [_name, 'test'].join(' - ');
				test.run();
				return;
			}

			if (!param) { return; }

			attrTitle.nodeValue = [_name, param].join(' - ');
			switch (mode) {
			  case _modes.user:
				_modeUrl = 'https://api.twitter.com/1/statuses/user_timeline/' + param + '.xml';
				return;
			  case _modes.list:
				var arr = param.split('/');
				_modeUrl = ['https://api.twitter.com/1', arr[0], 'lists', arr[1], 'statuses.xml'].join('/');
				return;
			}
		};
	})();

	var _refresh = (function() {
		var since_id = {};
		var myXsltproc = xsltproc('chrome://xwitter/content/xwitter.xsl');

		return function() {
			var data, mode = _mode, url = _modeUrl;

			if (since_id[url]) {
				data = {
				  count    : mode === _modes.list ? '' : '200',
				  since_id : since_id[url]
				};
			} else {
				since_id[url] = '';
			}

			var message = _message({
			  type : 'GET',
			  url  : url,
			  data : data
			});
			Ajax.request({
			  type : message.method,
			  url  : message.action,
			  data : OAuth.getParameterMap(message.parameters),
			  success: function(xhr) {
				  var df = myXsltproc.transformToFragment(xhr.responseXML, document);

				  if (!(df.firstChild instanceof HTMLBodyElement)) { return; }
				  _transform(df);

				  since_id[url] = _statuses[_statuses.length - 1].title;
				  _box.insertBefore(df, _box.firstChild);
				  Effects.fadeIn(_box.firstChild, 0.5);

				  if (_logSave) {
					  _save(xhr.responseXML);
				  }
			  }
			});
		};
	})();

	var _transform = function(df) {
		var element, elements = $S(_query.status, df.firstChild);
		for (var i = elements.length; i--;) {
			element = elements[i];

			$s(_query.marker, element).title = _statuses.length.toString(10);

			var created_at = $s(_query.created_at, element);
			created_at.textContent = _dateParse(created_at.textContent);

			var text = $s(_query.text, element);
			text.textContent = _refChar(text.textContent);

			var worker = new Worker('replace.js');
			worker.onmessage = (function() {
				var mytext = text;
				return function(event) {
					mytext.innerHTML = event.data.
					  replace(_highlight, '<em class="highlight">$&</em>');
				};
			})();
			worker.postMessage(text.innerHTML);

			_statuses.push(element);
		}
	};

	var _dateParse = function(created_at) {
		var arr = created_at.split(/\s/);
		var date = new Date([arr[1], arr[2] + ',', arr[5], arr[3]].join(' '));
		date.setSeconds(date.getSeconds() + _timeOffset);
		return [date.getHours().zerofill(2), date.getMinutes().zerofill(2)].join(':');
	};

	var _refChar = (function() {
		var myReplacer = replacer({
			'&lt;'  : '<',
			'&gt;'  : '>',
			'&amp;' : '&'
		  });

		return function(str) {
			str = str.replace(/&#(\d+);/g, function(_, dec) {
				return String.fromCharCode(dec);
			});
			return myReplacer(str);
		};
	})();

	var _tokenize = function(value) {
		var match = _matchCmd.exec(value) || [];
		var colon = match[1];
		var cmd   = match[2];
		var index = match[3];
		var text  = match[4];

		if (!colon) { return false; }

		if (index) {
			index = parseInt(index, 10);
			if (index >= _statuses.length) { return true; }

			var element = _statuses[index], status_id = element.title;
			switch (cmd) {
			  case _cmds.destroy    : _destroy    ( element, status_id ); return true;
			  case _cmds.fav        : _fav        ( element, status_id ); return true;
			  case _cmds.findUrl    : _findUrl    ( element            ); return true;
			  case _cmds.quoteTweet : _quoteTweet ( element, status_id ); return true;
			  case _cmds.reply      : _reply      ( element, status_id ); return true;
			  case _cmds.reTweet    : _reTweet    (          status_id ); return true;
			}
		} else {
			switch (cmd) {
			  case _cmds.tl      : _changeMode ( _modes.tl            ); return true;
			  case _cmds.mention : _changeMode ( _modes.mention       ); return true;
			  case _cmds.user    : _changeMode ( _modes.user,    text ); return true;
			  case _cmds.list    : _changeMode ( _modes.list,    text ); return true;
			  case _cmds.test    : _changeMode ( _modes.test          ); return true;
			  case _cmds.rate    : _rate(); return true;
			  case _cmds.flee    : _flee(); return true;
			}
		}
		return true;
	};

	var _update = function(value) {
		if (!value || _tokenize(value)) { return; }

		var data = {
		  status : value
		};
		if (_in_reply !== '') {
			data.in_reply_to_status_id = _in_reply;
			_in_reply = '';
		}

		var message = _message({
		  type : 'POST',
		  url  : 'https://api.twitter.com/1/statuses/update.json',
		  data : data
		});
		Ajax.request({
		  type : message.method,
		  url  : message.action,
		  data : OAuth.getParameterMap(message.parameters)
		});
	};

	var _destroy = function(element, status_id) {
		var message = _message({
		  type : 'POST',
		  url  : ['https://api.twitter.com/1/statuses/destroy/', status_id, '.json'].join('')
		});
		Ajax.request({
		  type : message.method,
		  url  : message.action,
		  data : OAuth.getParameterMap(message.parameters),
		  success: function() {
			  element.parentNode.removeChild(element);
		  }
		});
	};

	var _fav = function(element, status_id) {
		element = $s(_query.text, element);
		var className = 'favorited', favorited = Element.hasClassName(element, className);

		var message = _message({
		  type : 'POST',
		  url  : ['https://api.twitter.com/1/favorites/', favorited ? 'destroy' : 'create', '/', status_id, '.json'].join('')
		});
		Ajax.request({
		  type : message.method,
		  url  : message.action,
		  data : OAuth.getParameterMap(message.parameters),
		  success: function() {
			  if (favorited) {
				  Element.removeClassName(element, className);
			  } else {
				  Element.addClassName(element, className);
			  }
		  }
		});
	};

	var _findUrl = function(element) {
		var matchUrl = /(https?:\/\/[\-_.!~*\'()\w;\/?:\@&=+\$,%#]+)/;
		var url = (matchUrl.exec($s(_query.text, element).textContent) || [])[1];
		if (!url) { return; }

		Ajax.request({
		  type : 'GET',
		  url  : 'http://ss-o.net/api/reurl.json?url=' + encodeURIComponent(url),
		  success: function(xhr) {
			  _textbox.value = JSON.parse(xhr.responseText).url || url;
			  _textbox.select();
		  }
		});
	};

	var _quoteTweet = function(element, status_id) {
		_in_reply = status_id;
		_textbox.value = ' QT @' + $s(_query.screen_name, element).textContent + ': ' + $s(_query.text, element).textContent;
		_textbox.focus();
	};

	var _reply = function(element, status_id) {
		_in_reply = status_id;
		_textbox.value = '@' + $s(_query.screen_name, element).textContent + ' ';
		_textbox.focus();
	};

	var _reTweet = function(status_id) {
		var message = _message({
		  type : 'POST',
		  url  : ['https://api.twitter.com/1/statuses/retweet/', status_id, '.json'].join('')
		});
		Ajax.request({
		  type : message.method,
		  url  : message.action,
		  data : OAuth.getParameterMap(message.parameters)
		});
	};

	var _rate = function() {
		var message = _message({
		  type : 'GET',
		  url  : 'https://api.twitter.com/1/account/rate_limit_status.json'
		});
		Ajax.request({
		  type : message.method,
		  url  : message.action,
		  data : OAuth.getParameterMap(message.parameters),
		  success: function(xhr) {
			  var json = JSON.parse(xhr.responseText);
			  _textbox.value = [
				  json.remaining_hits,
				  json.hourly_limit
				  ].join('/');
		  }
		});
	};

	var _flee = function() {
		_statuses.length = 0;

		var nodes = [], node = _box.firstChild;
		do {
			nodes.push(node);
		} while (node = node.nextSibling);

		function aloop (n, f) {
			var i = 0, ret = null;
			return Deferred.next(function () {
				var t = (new Date()).getTime();
			  divide: {
				  do {
					  if (i >= n) { break divide; }
					  ret = f(i++);
				  } while ((new Date()).getTime() - t < 20);
				  return Deferred.call(arguments.callee);
			  }
			});
		}

		aloop(nodes.length, function(i) {
			_box.removeChild(nodes[i]);
			nodes[i] = null;
		}).
		  next(function() {
			  nodes.length = 0;
		  }).
			error(function(e) {
				dump(e);
			});
	};

	var _save = function(xml) {
		var cc = Components.classes, ci = Components.interfaces, charset = 'utf-8';
		var file = cc['@mozilla.org/file/directory_service;1'].getService(ci.nsIProperties).get('CurProcD', ci.nsIFile);
		file = FileIO.open(FileIO.path(file).replace(/^file:\/\/\/?/, '').replace(new RegExp('/', 'g'), '\\') + '\\statuses.xml');
		var str = file.exists() ? FileIO.read(file, charset) : '<statuses type="array"></statuses>';
		var range = document.createRange(), oldDf = range.createContextualFragment(str); range.detach();
		var newDf = xsltproc('chrome://xwitter/content/statuses.xsl').transformToFragment(xml, document);
		var root = oldDf.firstChild;
		root.insertBefore(newDf, root.firstChild);
		FileIO.write(file, new XMLSerializer().serializeToString(root), null, charset);
	};

	// ================================================================================================================================

	_changeMode(_modes.tl);

	Events.bind(window, 'keydown', function(event) {
		if (event.ctrlKey) {
			switch (event.keyCode) {
			  case KeyEvent.DOM_VK_W:
				window.close();
				return;
			}
		}
	});

	Events.bind(_box, 'mousedown', function() {
		this.focus();
	});

	Events.bind(_textbox, 'keypress', function(event) {
		switch (event.keyCode) {
		  case KeyEvent.DOM_VK_RETURN:
		  case KeyEvent.DOM_VK_ENTER:
			var value = this.value;
			this.value = '';
			_update(value);
			return;
		  case KeyEvent.DOM_VK_TAB:
			_textbox.blur();
			_box.focus();
			event.preventDefault();
			return;
		}
	});

	var _consumer_token = 'A6PRSyZO5Rsp5CE70y53ow';
	var _consumer_token_secret = 'S5tYZ02TcqDS8MwvJFzPU6BbBV7ozxvQDMl5IBMLo';
	var _pref_access_token = 'xwitter.access_token';
	var _pref_access_token_secret = 'xwitter.access_token_secret';
	var _oauth_token = nsPreferences.copyUnicharPref(_pref_access_token, '');
	var _oauth_token_secret = nsPreferences.copyUnicharPref(_pref_access_token_secret, '');

	var _message = function(spec) {
		var that = {};

		that.action = spec.url;
		that.method = spec.type;
		that.parameters = [];

		OAuth.setParameter(that, 'oauth_consumer_key', _consumer_token);
		if (_oauth_token) {
			OAuth.setParameter(that, 'oauth_token', _oauth_token);
		}
		var data = spec.data;
		for (var prop in data) {
			if (data.hasOwnProperty(prop)) {
				OAuth.setParameter(that, prop, data[prop]);
			}
		}

		OAuth.setTimestampAndNonce(that);
		OAuth.SignatureMethod.sign(that, {
		  consumerSecret : _consumer_token_secret,
		  tokenSecret    : _oauth_token_secret
		});

		return that;
	};

	var _init = function() {
		var ms = 15 * 1000;
		var fn = function() {
			_refresh();
			setTimeout(fn, ms);
		};
		fn();
	};

	(function() {
		if (_oauth_token && _oauth_token_secret) {
			_init();
			return;
		}

		var re_token        = /oauth_token=([^&]+)/;
		var re_token_secret = /oauth_token_secret=([^&]+)/;

		var message = _message({
		  type : 'GET',
		  url  : 'https://api.twitter.com/oauth/request_token'
		});
		Ajax.request({
		  type : message.method,
		  url  : message.action,
		  data : OAuth.getParameterMap(message.parameters),
		  success: function(xhr) {
			  var res = xhr.responseText;
			  _oauth_token        = ( re_token.exec(res)        || [] )[1];
			  _oauth_token_secret = ( re_token_secret.exec(res) || [] )[1];

			  var message = _message({
				type : 'GET',
				url  : 'https://api.twitter.com/oauth/authorize'
			  });
			  var win = window.open(OAuth.addToURL(message.action, message.parameters));
			  var oauth_verifier = prompt('PIN').trim(); win.close();

			  var message = _message({
				type : 'POST',
				url  : 'https://api.twitter.com/oauth/access_token',
				data : { 'oauth_verifier': oauth_verifier }
			  });
			  Ajax.request({
				type : message.method,
				url  : message.action,
				data : OAuth.getParameterMap(message.parameters),
				success: function(xhr) {
					var res = xhr.responseText;
					_oauth_token        = ( re_token.exec(res)        || [] )[1];
					_oauth_token_secret = ( re_token_secret.exec(res) || [] )[1];
					nsPreferences.setUnicharPref(_pref_access_token, _oauth_token);
					nsPreferences.setUnicharPref(_pref_access_token_secret, _oauth_token_secret);
					_init();
				}
			  });
		  }
		});
	})();

	// ================================================================================================================================

	var test = {};

	test.ok = function(comment, val1, val2) {
		var node = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
		node.className = val1 === val2 ? 'test-ok' : 'test-ng';
		node.innerHTML = comment;
		_box.appendChild(node);
	};
	test.ok.disable = true;

	test.run = function() {
		for (var prop in test) {
			if (test.hasOwnProperty(prop) && !test[prop].disable) {
				test[prop]();
			}
		}
	};
	test.run.disable = true;

	test.parseTimeOffset = function() {
		test.ok('_parseTimeOffset 1', _parseTimeOffset('+09:00'), +9.00 * 3600);
		test.ok('_parseTimeOffset 2', _parseTimeOffset('-00:45'), -0.75 * 3600);
		test.ok('_parseTimeOffset 3', _parseTimeOffset('foobar'), 0);
	};

	test.parseHighlight = function() {
		test.ok('_parseHighlight 1', _parseHighlight('\\r\\n').test('\r\n'), false);
		test.ok('_parseHighlight 2', _parseHighlight(''), null);
	};

	test.changeMode = function() {
		var param = 'foo/bar';
		var attrTitle = document.documentElement.getAttributeNode('title');
		var arr = param.split('/');

		_changeMode(_modes.tl, param);
		test.ok('_changeMode 1', _mode, _modes.tl);
		test.ok('_changeMode 2', attrTitle.nodeValue, _name);
		test.ok('_changeMode 3', _modeUrl, 'https://api.twitter.com/1/statuses/friends_timeline.xml');

		_changeMode(_modes.mention, param);
		test.ok('_changeMode 4', _mode, _modes.mention);
		test.ok('_changeMode 5', attrTitle.nodeValue, [_name, 'mention'].join(' - '));
		test.ok('_changeMode 6', _modeUrl, 'https://api.twitter.com/1/statuses/mentions.xml');

		_changeMode(_modes.user, param);
		test.ok('_changeMode 7', _mode, _modes.user);
		test.ok('_changeMode 8', attrTitle.nodeValue, [_name, param].join(' - '));
		test.ok('_changeMode 9', _modeUrl, 'https://api.twitter.com/1/statuses/user_timeline/' + param + '.xml');

		_changeMode(_modes.list, param);
		test.ok('_changeMode a', _mode, _modes.list);
		test.ok('_changeMode b', attrTitle.nodeValue, [_name, param].join(' - '));
		test.ok('_changeMode c', _modeUrl, ['https://api.twitter.com/1', arr[0], 'lists', arr[1], 'statuses.xml'].join('/'));
	};

	test.refresh = function() {
		_modeUrl = 'http://kgr.s56.xrea.com/xwitter/test.xml';
		_refresh();
	};

	test.transform = function() {
		_highlight = _parseHighlight('i');
		_modeUrl = 'http://kgr.s56.xrea.com/xwitter/test.xml';
		_refresh();
	};

	test.dateParse = function() {
		_timeOffset = _parseTimeOffset('');
		test.ok('_dateParse', '22:52', _dateParse('Tue Apr 07 22:52:51 +0000 2009'));
	};

	test.refChar = function() {
		test.ok('_refChar', '<>&quot;', _refChar('&lt;&gt;&amp;quo&#116;;'));
	};

	test.tokenize = function() {
		_changeMode(_modes.tl);
		test.ok('_tokenize 1', false, _tokenize('foo:bar'));
		test.ok('_tokenize 2', true, _tokenize(':baz 9999') && _mode === _modes.tl);
		test.ok('_tokenize 3', true, _tokenize(':baz 0')    && _mode === _modes.tl);
		test.ok('_tokenize 4', true, _tokenize(':del 9999') && _mode === _modes.tl);
		test.ok('_tokenize 5', true, _tokenize(':fav 9999') && _mode === _modes.tl);
		test.ok('_tokenize 6', true, _tokenize(':url 9999') && _mode === _modes.tl);
		test.ok('_tokenize 7', true, _tokenize(':qt  9999') && _mode === _modes.tl);
		test.ok('_tokenize 8', true, _tokenize(':@   9999') && _mode === _modes.tl);
		test.ok('_tokenize 9', true, _tokenize(':rt  9999') && _mode === _modes.tl);
		test.ok('_tokenize a', true, _tokenize(':tl')       && _mode === _modes.tl);
		test.ok('_tokenize b', true, _tokenize(':mention')  && _mode === _modes.mention);
		test.ok('_tokenize c', true, _tokenize(':user')     && _mode === _modes.user);
		test.ok('_tokenize d', true, _tokenize(':list')     && _mode === _modes.list);
	};

	// ================================================================================================================================

	return that;
};
