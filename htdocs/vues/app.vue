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
				<compact-summary v-if="mobile" />
				<currency-summary v-else />
				<div class="row">
					<button type="button" class="btn btn-primary" v-on:click="emit('balance:refresh')">Refresh Balance</button>
				</div>
				<donut-dashboard>
					<template slot-scope="props">
						<donut-details :currency="props.currency.currency.cid" />
					</template>
				</donut-dashboard>
				<!-- <currency-donut></currency-donut> -->
			</div>
			<common-footer />
		</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import isMobile from '../js/is-mobile.js';
import CommonFooter from './footer.vue';
import Login from './login.vue';
import CurrencySummary from './currency-summary.vue';
import CompactSummary from './compact-summary.vue';
import DonutDashboard from './donut-dashboard.vue';
import DonutDetails from './donut-details.vue';
import sock from '../sock';
import user from '../js/user';


var data = {
	user: user,
	mobile: isMobile
};

export default Vue.extend ({
	name: 'app',
	data () {
		return data;
	},
	components: {
		CommonFooter,
		Login,
		CurrencySummary,
		CompactSummary,
		DonutDashboard,
		DonutDetails
	},
	methods: {
		emit: ev => {
			sock.emit (ev);
		}
	}
});


sock.on ('debug', data => {
	console.log (data);
});

</script>
