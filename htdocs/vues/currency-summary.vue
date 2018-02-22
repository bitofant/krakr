<style lang="scss" scoped>
	th.number {
		text-align: right;
	}
	td.number {
		text-align: right;
		font-family: monospace;
	}
	a.stratlink {
		display: inline-block;
		color: #000;
		padding-left: .4em;
		padding-right: .4em;
		border-left: 1px solid rgba(0,0,0,.7);
		border-right: 1px solid rgba(0,0,0,.7);
		background: rgba(0,0,0,.1);
		border-radius: .6em;
		text-decoration: none;
	}
	a.stratlink:hover {
		text-decoration: none;
	}
</style>

<template>
	<div class="row" style="overflow:auto">
		<h1>Currencies <span style="font-size:50%;font-family:monospace">{{ lastUpdateDelta }}</span></h1>
		<table class="table table-sm table-striped">
			<thead class="thead-dark">
				<th>Currency</th>
				<th class="number">Last Trade</th>
				<th class="number">Avg. Buy</th>
				<th class="number">Owned</th>
				<th class="number">Value</th>
				<th class="number" colspan="2" style="text-align:center">Gain</th>
				<th class="number">Total Gain</th>
				<th class="number">24h</th>
				<th class="number">#</th>
			</thead>
			<tbody>
				<tr v-for="v in sortedList" :key="v.cid" v-if="typeof (v) !== 'number'">
					<td>{{ v.currency.name }}</td>
					<!-- last trade price -->
					<td class="number"
							v-html="niceNumber (v.last, 5)"></td>

					<!-- avg buy price -->
					<td class="number"
							v-html="niceNumber (v.avgBuyPrice, 5)"
							v-if="v.owned > .0001"></td>
						<td v-else></td>
					<!-- owned -->
					<td class="number"
							v-html="v.currency.symbol + niceNumber (v.owned, 5)"
							v-if="v.owned > .0001"></td>
						<td v-else></td>
					<!-- value -->
					<td class="number"
							v-html="niceNumber (v.last * v.owned, 2) + '€'"
							v-if="v.owned > .0001"></td>
						<td v-else></td>

					<!-- gain -->
					<td class="number"
							v-html="niceNumber ((v.last - v.avgBuyPrice) * v.owned, 2) + '€'"
							v-if="v.owned > .0001"></td>
						<td v-else></td>
					<!-- gain (percentage) -->
					<td class="number"
							v-html="niceNumber ((v.last - v.avgBuyPrice) / v.avgBuyPrice * 100, 1) + '%'"
							v-if="v.owned > .0001"></td>
						<td v-else></td>
					<!-- total gain -->
					<td class="number"
							v-html="niceNumber ((v.last * v.owned) - v.moneySpent, 2) + '€'"
							v-if="v.moneySpent > .0001 || v.moneySpent < -.0001"></td>
						<td v-else></td>

					<!-- 24h statistics -->
					<!-- <td class="number"
							v-html="niceNumber (v.last24h.volume * v.last24h.avg, 0) + '€'"></td> -->
					<td class="number" style="color:#080"
							v-html="stochastic (v.last24h.stoch)"></td>

					<td class="number" style="color:#080">
						<a href="#" class="stratlink"
							 :title="v.hint.substr(2)"
							 @click="showPopup (v.cid)"
							 v-text="v.hint.substr(0,1)"></a>
					</td>
				</tr>
				<tr>
					<td>Euro</td>
					<td class="number"></td>
					<td class="number"></td>
					<td class="number" v-html="niceNumber (user.assets.ZEUR,2) + '€'"></td>
					<td class="number" v-html="niceNumber (user.totalAssetValue,2) + '€'"></td>
					<td class="number" v-html="niceNumber (user.totalAssetValue - user.totalDeposit,2) + '€'"></td>
					<td class="number" v-html="niceNumber ((user.totalAssetValue - user.totalDeposit) / user.totalDeposit * 100,1) + '%'"></td>
					<td class="number"></td>
					<td class="number"></td>
					<td class="number"></td>
				</tr>
			</tbody>
		</table>
		<currency-popup ref="popup" />
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import $ from 'jquery';
import sock from '../sock';
import assets from '../js/assets';
import user from '../js/user';
import CurrencyPopup from './currency-popup.vue';

var data = {
	lastUpdateDelta: '0',
	user: user,
	sortedList: []
};

export default Vue.extend ({
	name: 'currency-summary',
	data () {
		return data;
	},
	components: {
		CurrencyPopup
	},
	methods: {
		sortList () {
			var list = [];
			for (var k in user.assets) {
				if (k !== 'ZEUR') list.push (user.assets[k]);
			}
			list.sort ((a, b) => {
				var v1 = a.owned * a.last || 0;
				var v2 = b.owned * b.last || 0;
				if (v1 !== 0 || v2 !== 0) return v2 - v1;
				return b.last - a.last;
			});
			data.sortedList = list;
		},
		stochastic: v => {
			var sv = v + '%';
			if (v <= 20 || v >= 80) {
				var pct = (v >= 80 ? 100 - v : v) * (255 / 25) | 0;
				sv = '<span style="color:rgb(255,' + pct + ',0)">' + sv + '</span>';
			}
			return sv;
		},
		niceNumber: (n, decimals) => {
			var s = ('' + n).split ('.');
			if (decimals > 0) {
				if (s.length === 1) s.push ('');
				s[1] = s[1].substr (0, decimals);
				while (s[1].length < decimals) s[1] += '0';
			} else if (s.length > 1) {
				s.splice (1, 1);
			}
			var s0 = s[0], ns0 = '';
			while (s0.length > 3) {
				ns0 = ',' + s0.substr (s0.length - 3) + ns0;
				s0 = s0.substr (0, s0.length - 3);
			}
			s[0] = s0 + ns0;
			if (s[0].startsWith ('-,')) s[0] = '-' + s[0].substr (2);
			if (s[0] === '0') s[0] = '';
			else if (s[0] === '-0') s[0] = '-';
			if (s.length > 1 && s[0].length > 1) {
				if (s[0].charAt (0) !== '-' || s[0].length > 2) s[1] = '<span style="opacity:.5">' + s[1] + '</span>';
			}
			return s.join ('.');
		},
		showPopup (assetID) {
			this.$children[0].show (assetID);
		}
	},
	watch: {
		"user.lastUpdate": 'sortList'
	}
});


function updateLastUpdateDelta () {
	var d = (Math.round ((Date.now () - user.lastUpdate) / 100) / 10).toString ();
	if (d.length < 3 || d.charAt (d.length - 2) !== '.') d += '.0';
	data.lastUpdateDelta = d;
	window.requestAnimationFrame (updateLastUpdateDelta);
}
sock.once ('values_of_tradable_assets', () => {
	setTimeout (updateLastUpdateDelta, 50);
});



</script>
