<style lang="scss" scoped>
	body {
		font-family: 'Helvetica', 'Segoe UI', Arial, sans-serif;
	}
</style>

<template>
	<div class="row" style="margin-top: 10%">
		<div class="col-md-4">&nbsp;</div>
		<div class="col-md-4">
			<form v-on:submit="submit">
				<div class="form-group">
					<label for="apiKey" >API Key</label>
					<input type="text" class="form-control" id="apiKey" v-model="apikey" placeholder="API Key" v-bind:disabled="!controlsEnabled" autofocus="autofocus" />
				</div>
				<div class="form-group">
					<label for="privateKey">Private Key</label>
					<input type="text" class="form-control" id="privateKey" v-model="privkey" v-bind:disabled="!controlsEnabled" placeholder="Private Key" />
				</div>
				<callout v-if="errMsg"><h4>Error logging in</h4>{{ errMsg }}</callout>
				<div class="form-group" style="text-align:right">
					<input type="submit" class="btn btn-primary" v-bind:value="loginBtnText" v-bind:disabled="!controlsEnabled" />
				</div>
			</form>
		</div>
		<div class="col-md-4">&nbsp;</div>
	</div>
</template>

<script lang="ts">
import CommonFooter from './footer.vue';
import sock from '../sock.js';
import Callout from './components/callout';

var data = {
	loggedIn: false,
	controlsEnabled: true,
	apikey: '',
	privkey: '',
	loginBtnText: 'Login',
	errMsg: ''
};

function enableControls (enabled) {
	data.controlsEnabled = enabled;
	data.loginBtnText = enabled ? 'Login' : 'Loggin in...';
}

export default {
	name: 'login',
	data () {
		return data;
	},
	components: {
		CommonFooter,
		Callout
	},
	methods: {
		submit: ev => {
			ev.preventDefault ();
			enableControls (false);
			loginCache.set (data.apikey, data.privkey);
			sock.emit ('auth', {
				apikey: data.apikey,
				privkey: data.privkey
			});
		}
	}
}

sock.on ('auth:failed', reason => {
	enableControls (true);
	data.errMsg = reason;
});

sock.on ('disconnect', reason => {
	enableControls (true);
	data.errMsg = 'You have been disconnected';
	sock.once ('connect', () => {
		document.location.reload ();
	});
});

sock.on ('auth:override', obj => {
	Object.assign (data, obj);
});

var loginCache = new (function () {
	const lskey = 'krakr:lc';
	this.set = (apikey, privkey) => {
		if (!localStorage) return;
		localStorage[lskey] = encodeURIComponent (JSON.stringify ([apikey, privkey]));
	};
	if (localStorage && localStorage[lskey]) {
		var d = JSON.parse (decodeURIComponent (localStorage[lskey]));
		data.apikey = d[0];
		data.privkey = d[1];
		enableControls (false);
		sock.emit ('auth', {
			apikey: d[0],
			privkey: d[1]
		});
	}
}) ();

</script>
