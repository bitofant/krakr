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
			<login v-if="!user.isLoggedin" />
			<div v-else>
				<!-- <random-donut/> -->
				<compact-summary v-if="mobile" />
				<currency-summary v-else />
				<div class="row">
					<button type="button" class="btn btn-primary" v-on:click="emit('balance:refresh')">Refresh Balance</button>
				</div>
				<currency-donut></currency-donut>
			</div>
			<common-footer />
		</div>
	</div>
</template>

<script>
import CommonFooter from './footer.vue';
import Login from './login.vue';
import CurrencySummary from './currency-summary.vue';
import CompactSummary from './compact-summary.vue';
import CurrencyDonut from './currency-donut.vue';
// import RandomDonut from './random-donut.vue';
import sock from '../sock';
import user from '../js/user';


var data = {
	user: user,
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
		CurrencySummary,
		CompactSummary,
		CurrencyDonut,
		// RandomDonut
	},
	methods: {
		emit: ev => {
			sock.emit (ev);
		}
	}
}


sock.on ('debug', data => {
	console.log (data);
});

</script>
