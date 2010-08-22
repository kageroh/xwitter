onmessage = function(event) {
	postMessage(
		event.data.
		replace(/(@)(\w{1,20})/g, '$1<em class="account">$2</em>').
		replace(/([\s\S])(\1{3})(\1+)/g, '$1$2<em class="weeded">$3</em>'));
};
