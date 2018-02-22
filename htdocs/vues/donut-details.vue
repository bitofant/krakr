<style lang="scss" scoped>
	.wrapper {
		position: relative;
		height: 100%;
	}
	h2 {
		font-family: 'Lato', 'Helvetica', 'Segoe UI', Arial, sans-serif;
		font-weight: 900;
		padding-top: 1.5em;
	}
</style>

<template>
	<div class="wrapper">
		<h2>{{ coolCurrencyName () }}</h2>
		Owned:       {{ Math.round (user.assets[currency].owned       * 100) / 100 }}{{ assets[currency].symbol }}<br />
		Avg. Buy:    {{ Math.round (user.assets[currency].avgBuyPrice * 100) / 100 }}€<br />
		Money Spent: {{ Math.round (user.assets[currency].moneySpent  * 100) / 100 }}€<br />
		Value:       {{ Math.round (user.assets[currency].owned * user.assets[currency].last * 100) / 100 }}€
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import assets from '../js/assets';
import user from '../js/user';


export default Vue.extend ({
	name: 'donut-details',
	props: [
		'currency'
	],
	data () {
		return {
			assets: assets,
			user: user
		};
	},
	mounted () {
	},
	components: {
	},
	methods: {
		coolCurrencyName () {
			var symbol = this.assets[this.currency].symbol;
			var name = this.assets[this.currency].name;
			switch (this.currency) {
				case 'XXMR': return symbol + name.substr (1).toLowerCase ();
				case 'XREP': return name.substr (0, name.length - 1).toUpperCase () + symbol;
				case 'BCH': return symbol + name.substr (1).toUpperCase ().split ('S').join ('$');
			}
			return symbol + name.substr (1).toUpperCase ();
		}
	}
});



</script>
