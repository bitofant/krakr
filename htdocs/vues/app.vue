<style lang="scss" scoped>
	body {
		font-family: 'Helvetica', 'Segoe UI', Arial, sans-serif;
	}
	h1 {
		font-family: 'Lato', 'Helvetica', 'Segoe UI', Arial, sans-serif;
		font-weight: 900;
		text-transform: uppercase;
		text-align: center;
		background: #06c;
		color: #fff;
		box-shadow: 0 0 .2em rgba(0,0,0,.5);
	}
	h1 span {
		font-weight: 100;
		text-transform: lowercase;
	}
</style>

<template>
	<div>
		<h1>Krakr<span v-if="!mobile"> &mdash; behodl the stinky kraken automizr</span></h1>
		<div class="container">
			<login v-if="!loggedIn" />
			<div v-else>
				<currency-summary />
				<div class="row">
					<button type="button" class="btn btn-primary" v-on:click="emit('balance:refresh')">Refresh Balance</button>
				</div>
			</div>
			<common-footer />
		</div>
	</div>
</template>

<script>
import CommonFooter from './footer.vue';
import Login from './login.vue';
import CurrencySummary from './currency-summary.vue';
import sock from '../sock';

var data = {
	loggedIn: false,
	mobile: (navigator.userAgent.indexOf ('Mobile') > -1)
};

export default {
	name: 'app',
	data () {
		return data;
	},
	components: {
		CommonFooter,
		Login,
		CurrencySummary
	},
	methods: {
		emit: ev => {
			sock.emit (ev);
		}
	}
}

sock.on ('auth:success', () => {
	data.loggedIn = true;
});

sock.on ('disconnect', () => {
	data.loggedIn = false;
});

sock.on ('debug', data => {
	console.log (data);
});

</script>
