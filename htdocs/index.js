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
