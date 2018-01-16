<style lang="scss" scoped>
	th.number {
		text-align: right;
	}
	td.number {
		text-align: right;
		font-family: monospace;
	}
</style>

<template>
	<div class="row" style="overflow:auto">
		<h1>Currencies <span style="font-size:50%;font-family:monospace">{{ lastUpdateDelta }}</span></h1>
		<table class="table">
			<thead>
				<th>Currency</th>
				<th class="number">Last Trade</th>
				<th class="number">Avg. Buy</th>
				<th class="number">Owned</th>
				<th class="number">Value</th>
				<th class="number" colspan="2" style="text-align:center">Gain</th>
				<th class="number">Total Gain</th>
				<th class="number">24h Volume</th>
				<th class="number">24h Stoch.</th>
			</thead>
			<tbody>
				<tr v-for="v in values" :key="v.cid">
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
					<td class="number"
							v-html="niceNumber (v.last24h.volume * v.last24h.avg, 0) + '€'"></td>
					<td class="number" style="color:#080"
							v-html="stochastic (v.last, v.last24h)"></td>
				</tr>
				<tr>
					<td>Euro</td>
					<td class="number"></td>
					<td class="number"></td>
					<td class="number" v-html="niceNumber (balance.ZEUR,2) + '€'"></td>
					<td class="number" v-html="niceNumber (totalSum,2) + '€'"></td>
					<td class="number" v-html="niceNumber (totalSum - totalDeposit,2) + '€'"></td>
					<td class="number" v-html="niceNumber ((totalSum - totalDeposit) / totalDeposit * 100,1) + '%'"></td>
					<td class="number"></td>
					<td class="number"></td>
					<td class="number"></td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script>
import sock from '../sock';
import assets from '../js/assets';

var data = {
	balance: {},
	avgBuyPrice: {},
	moneySpent: {},
	totalDeposit: 1500,
	values: [],
	totalSum: 0,
	lastUpdate: 0,
	lastUpdateDelta: 0
};

export default {
	name: 'currency-summary',
	data () {
		return data;
	},
	components: {
	},
	methods: {
		stochastic: (value, data) => {
			var v = Math.round ((value - data.low) / (data.high - data.low) * 100);
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
		}
	}
}

sock.on ('balance', balance => {
	Object.assign (data.balance, balance.balance);
	Object.assign (data.moneySpent, balance.moneySpent);
	Object.assign (data.avgBuyPrice, balance.avgBuyPrice);
	if (balance.totalDeposit) data.totalDeposit = balance.totalDeposit;
	document.title = balance.totalDeposit;
	data.lastUpdate = Date.now ();
	data.values.forEach (item => {
		if (typeof (data.balance[item.cid]) === 'number') {
			item.owned = data.balance[item.cid];
			if (typeof (data.moneySpent[item.cid]) === 'number') {
				item.avgBuyPrice = data.avgBuyPrice[item.cid];
				item.moneySpent = data.moneySpent[item.cid];
			}
		}
	});
	// console.log (JSON.stringify (balance, null, 4));
});

sock.on ('values_of_tradable_assets', values => {
	var oldValues = {};
	data.values.forEach (item => {
		oldValues[item.cid] = item;
	});
	var newValues = [];
	var totalSum = data.balance.ZEUR || 0;
	for (var k in values) {
		if (k === 'lastUpdate') {
			data.lastUpdate = Date.now () - values.lastUpdate;
			continue;
		}
		newValues.push (Object.assign (oldValues[k] || {}, values[k], {
			cid: k,
			currency: assets[k],
			owned: data.balance[k] || 0
		}));
		totalSum += (data.balance[k] || 0) * values[k].last;
	}
	data.totalSum = totalSum;
	newValues.sort ((a, b) => {
		return b.last - a.last;
	});
	data.values = newValues;
	// console.log (JSON.stringify (data.values[1], null, 4));
});

function updateLastUpdateDelta () {
	var d = (Math.round ((Date.now () - data.lastUpdate) / 100) / 10).toString ();
	if (d.length < 3 || d.charAt (d.length - 2) !== '.') d += '.0';
	data.lastUpdateDelta = d;
	window.requestAnimationFrame (updateLastUpdateDelta);
}
sock.once ('values_of_tradable_assets', () => {
	setTimeout (updateLastUpdateDelta, 50);
});

setTimeout (() => {

	sock.emit ('balance');
}, 500);

</script>
