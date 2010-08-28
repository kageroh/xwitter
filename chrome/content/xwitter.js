var xwitter = function() {
	var that = {};

	var _name = 'xwitter';
	var _attrTitle = document.documentElement.getAttributeNode('title');
	var _subname = '';
	var _footer = '';

	var _changeTitle = function() {
		var arr = [];
		arr.push(_name);
		if (_subname) { arr.push(_subname); }
		_attrTitle.nodeValue = arr.join(' - ') + _footer;
	};

	var _statuses = [];
	var _in_reply = '';
	var _q;

	var _box = $s('#statuses');
	var _textbox = $('#status');

	var _query = {
		status      : 'section',
		marker      : 'header:first',
		created_at  : 'time:first',
		screen_name : 'h1:first',
		text        : 'p:first'
	};

	var _cmds = {
	  destroy    : 'del',
	  fav        : 'fav',
	  findUrl    : 'url',
	  search     : 'f',
	  flee       : 'flee',
	  list       : 'list',
	  mention    : 'men',
	  quoteTweet : 'qt',
	  rate       : 'api',
	  reply      : '@',
	  reTweet    : 'rt',
	  tag        : 'tag',
	  tl         : 'tl',
	  user       : 'user'
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

	var _matchUrl = /(https?:\/\/[\-_.!~*\'()\w;\/?:\@&=+\$,%#]+)/g;

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
	  search  : 'search'
	};
	var _mode; // _modes.xxx
	var _modeUrl;

	var _changeMode = function(mode, param) {
		_mode = mode;

		switch (mode) {
		  case _modes.tl:
			_subname = '';
			_modeUrl = 'https://api.twitter.com/1/statuses/home_timeline.xml';
			break;
		  case _modes.mention:
			_subname = 'mention';
			_modeUrl = 'https://api.twitter.com/1/statuses/mentions.xml';
			break;
		}
		_changeTitle();

		if (!param) { return; }

		switch (mode) {
		  case _modes.user:
			_subname = param;
			_modeUrl = 'https://api.twitter.com/1/statuses/user_timeline/' + param + '.xml';
			break;
		  case _modes.list:
			var arr = param.split('/');
			_subname = param;
			_modeUrl = ['https://api.twitter.com/1', arr[0], 'lists', arr[1], 'statuses.xml'].join('/');
			break;
		  case _modes.search:
			_q = param;
			_subname = 'search: ' + param;
			_modeUrl = 'https://search.twitter.com/search.atom';
			break;
		}
		_changeTitle();
	};

	var _refresh = (function() {
		var since_id = {};
		var myXsltproc = xsltproc('chrome://xwitter/content/xwitter.xsl');
		var atom2stats = xsltproc('chrome://xwitter/content/atom2stats.xsl');

		return function() {
			var data = {}, mode = _mode, url = _modeUrl;

			if (since_id[url]) {
				data.count = mode === _modes.list ? '' : '200';
				data.since_id = since_id[url];
			} else {
				since_id[url] = '';
			}

			switch (mode) {
			  case _modes.search:
				data.q = _q;
				break;
			}

			var message = _message({
			  type : 'GET',
			  url  : url,
			  data : data
			});
			$.ajax({
			  type : message.method,
			  url  : message.action,
			  data : OAuth.getParameterMap(message.parameters),
			  success: function(data, status, xhr) {
				  var xml = xhr.responseXML;
				  switch (mode) {
					case _modes.search:
					  xml = atom2stats.transformToFragment(xml, document);
					  break;
				  }

				  var df = myXsltproc.transformToFragment(xml, document);

				  if (!(df.firstChild instanceof HTMLBodyElement)) { return; }
				  _transform(df);

				  since_id[url] = _statuses[_statuses.length - 1].title;
				  _box.insertBefore(df, _box.firstChild);
				  Effects.fadeIn(_box.firstChild, 0.5);

				  if (_logSave) {
					  _save(xml);
				  }
			  }
			});
		};
	})();

	var _transform = function(df) {
		var element, elements = $(_query.status, df.firstChild);
		for (var i = elements.length; i--;) {
			element = elements[i];

			$(_query.marker, element).attr('title', _statuses.length.toString(10));

			var created_at = $(_query.created_at, element);
			created_at.text( _dateParse(created_at.text()) );

			var text = $(_query.text, element);
			text.html(
				_refChar(text.html()).
				replace(/(@)(\w{1,20})/g, '$1<em class="account">$2</em>').
				replace(/#\w+/g, '<em class="hash-tag">$&</em>').
				replace(_matchUrl, '<em class="url">$1</em>').
				replace(_highlight, '<em class="highlight">$&</em>')
				);

			_statuses.push(element);
		}
	};

	var _dateParse = function(created_at) {
		var arr = created_at.split(/\s/);
		var date = new Date([arr[1], arr[2] + ',', arr[5], arr[3]].join(' '));
		date.setSeconds(date.getSeconds() + _timeOffset);
		var h = date.getHours().zerofill(2);
		var m = date.getMinutes().zerofill(2);
		return isNaN(h) || isNaN(m) ? 'N/A' : [ h, m ].join(':');
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
			  case _cmds.search  : _changeMode ( _modes.search,  text ); return true;
			  case _cmds.tag     : _tag(text); return true;
			  case _cmds.rate    : _rate(); return true;
			  case _cmds.flee    : _flee(); return true;
			}
		}
		return true;
	};

	var _shortenUrl = function(value) {
		return value.replace(_matchUrl, function($_, $1) {
			var xhr = $.ajax({
			  async: false,
			  type : 'GET',
			  url  : 'http://api.bit.ly/v3/shorten',
			  data : {
				login   : 'kageroh',
				apiKey  : 'R_8a4f42906456aa208ea827950cd378ad',
				longUrl : $1
			  }
			});
			var json = JSON.parse(xhr.responseText);
			return json.status_txt === 'OK' ? json.data.url : $1;
		});
	};

	var _update = function(value) {
		if (!value || _tokenize(value)) { return; }

		value += _footer;
		if (value.length > 140) {
			value = _shortenUrl(value);
			if (value.length > 140) {
				_textbox.select();
				return;
			}
		}

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
		$.ajax({
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
		$.ajax({
		  type : message.method,
		  url  : message.action,
		  data : OAuth.getParameterMap(message.parameters),
		  success: function() {
			  $(element).remove();
		  }
		});
	};

	var _fav = function(element, status_id) {
		element = $(_query.text, element);
		var className = 'favorited', favorited = element.hasClass(className);

		var message = _message({
		  type : 'POST',
		  url  : ['https://api.twitter.com/1/favorites/', favorited ? 'destroy' : 'create', '/', status_id, '.json'].join('')
		});
		$.ajax({
		  type : message.method,
		  url  : message.action,
		  data : OAuth.getParameterMap(message.parameters),
		  success: function() {
			  element[ (favorited ? 'remove' : 'add') + 'Class' ](className);
		  }
		});
	};

	var _findUrl = function(element) {
		var ret = [];
		$('em.url', element).each(function(index, element) {
			var url = $(element).text();
			var xhr = $.ajax({
			  async: false,
			  type : 'GET',
			  url  : 'http://ss-o.net/api/reurl.json?url=' + encodeURIComponent(url)
			});
			ret.push(JSON.parse(xhr.responseText).url || url);
		});
		_textbox.val(ret.join(' ')).
		  select();
	};

	var _quoteTweet = function(element, status_id) {
		_in_reply = status_id;
		_textbox.val(' QT @' + $(_query.screen_name, element).text() + ': ' + $(_query.text, element).text());
		_textbox.focus();
	};

	var _reply = function(element, status_id) {
		_in_reply = status_id;
		_textbox.val('@' + $(_query.screen_name, element).text() + ' ').
		  focus();
	};

	var _reTweet = function(status_id) {
		var message = _message({
		  type : 'POST',
		  url  : ['https://api.twitter.com/1/statuses/retweet/', status_id, '.json'].join('')
		});
		$.ajax({
		  type : message.method,
		  url  : message.action,
		  data : OAuth.getParameterMap(message.parameters)
		});
	};

	var _tag = function(text) {
		_footer = text ? ( ' ' + text ) : '';
		_changeTitle();
	};

	var _rate = function() {
		var message = _message({
		  type : 'GET',
		  url  : 'https://api.twitter.com/1/account/rate_limit_status.json'
		});
		$.ajax({
		  type : message.method,
		  url  : message.action,
		  data : OAuth.getParameterMap(message.parameters),
		  success: function(data) {
			  _textbox.val([
				  data.remaining_hits,
				  data.hourly_limit
				  ].join('/')).
				select();
		  }
		});
	};

	var _flee = function() {
		_statuses.length = 0;
		$(_box).empty();
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

	$(window).keydown(function(event) {
		if (event.ctrlKey) {
			switch (event.keyCode) {
			  case KeyEvent.DOM_VK_W:
				window.close();
				return;
			}
		}
	});

	_textbox.keypress(function(event) {
		switch (event.keyCode) {
		  case KeyEvent.DOM_VK_RETURN:
		  case KeyEvent.DOM_VK_ENTER:
			var value = _textbox.val();
			_textbox.val('');
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
		$.ajax({
		  type : message.method,
		  url  : message.action,
		  data : OAuth.getParameterMap(message.parameters),
		  success: function(data) {
			  var res = data;
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
			  $.ajax({
				type : message.method,
				url  : message.action,
				data : OAuth.getParameterMap(message.parameters),
				success: function(data) {
					var res = data;
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

	return that;
};
