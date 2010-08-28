var _parseHighlight = function(str) {
	return str ? new RegExp(str.replace(/\W/g, '\\$&'), 'g') : null;
};
onmessage = function(event) {
	var html = event.data.html;
	var expr = _parseHighlight(event.data.expr);
	postMessage(
		html.
		replace(/(@)(\w{1,20})/g, '$1<em class="account">$2</em>').
		replace(/#\S+/g, '<em class="hash-tag">$&</em>').
		replace(/([\s\S])(\1{3})(\1+)/g, '$1$2<em class="weeded">$3</em>').
		replace(expr, '<em class="highlight">$&</em>'));
};
