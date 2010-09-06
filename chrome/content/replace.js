onmessage = function(event) { try {
	event.currentTarget.removeEventListener(event.type, arguments.callee, false);
	var html = event.data.html;
	var expr = new RegExp(event.data.expr, 'g');
	var ret  = html.replace(expr, function($_, $1, $2, $3, $4) {
		return $1 ? '@<em class="account">'  + $1 + '</em>' :
		       $2 ? '<em class="hash-tag">'  + $2 + '</em>' :
		       $3 ? '<em class="url">'       + $3 + '</em>' :
		       $4 ? '<em class="old-rt">'    + $4 + '</em>' :
		       '';
	});
	postMessage(ret);
} catch (e) { dump(e); } };
