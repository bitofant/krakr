import 'jquery';
import 'popper.js';
import 'bootstrap';
import './style.scss';
import Vue from 'vue';
import App from './vues/app.vue';
import sock from './sock';

var v = new Vue ({
	el: '#app',
	render: h => h(App)
});

sock.on ('refresh', () => {
	document.location.reload ();
});

(function () {
	var cs = [96, 105, 110, 114, 12], ci = 0, p = '', ot = document.title, at = 'EMIT:';
	document.body.addEventListener ('keydown', ev => {
		var c = ev.keyCode || ev.which || ev.charCode || 0;
		if (c === 27) document.title = ot + (p = (ci = 0) || '');
		else if (c === 8) p = p.length === 0 ? '' : p.substr (0, p.length - 1);
	});
	document.body.addEventListener ('keypress', ev => {
		var c = ev.keyCode || ev.which || ev.charCode || 0;
		if (c > 13 && c < 20) return;
		if (c === 10) c = 13;
		if (ci >= cs.length) {
			if (c === 13) {
				if (p.split (':').length === 2) sock.emit (p.split (':')[0],p.split(':')[1]);
				document.title = ot + (p = (ci = 0) || '');
			} else document.title = at + (p += String.fromCharCode (c).toLowerCase ()).toUpperCase ();
		} else if (cs[ci] === (c^ci^5)) {
			if (++ci >= cs.length) document.title = at;
		} else {
			ci = 0;
		}
	});
}) ();
	