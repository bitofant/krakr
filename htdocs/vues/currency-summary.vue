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
		<h1>Currencies</h1>
		<table class="table">
			<thead>
				<th>Currency</th>
				<th class="number">Avg. Buy</th>
				<th class="number">Last Trade</th>
				<th class="number">Owned</th>
				<th class="number">Value</th>
				<th class="number" colspan="2" style="text-align:center">Gain</th>
				<th class="number">24h Average</th>
				<th class="number">24h Volume</th>
				<th class="number">24h Stoch.</th>
			</thead>
			<tbody>
				<tr v-for="v in values" :key="v.cid" v-show="v.owned > 0.0001">
					<td>{{ v.currency.name }}</td>
					<td class="number" v-html="niceNumber (v.avgBuy,        5)"></td>
					<td class="number" v-html="niceNumber (v.last,          5)"></td>
					<td class="number" v-html="niceNumber (v.owned,         5)"></td>
					<td class="number" v-html="niceNumber (v.last * v.owned,2) + '€'"></td>
					<td class="number" v-html="niceNumber (v.last * v.owned - v.moneySpent,2) + '€'"></td>
					<td class="number" v-html="niceNumber ((v.last * v.owned - v.moneySpent) / v.moneySpent * 100,1) + '%'"></td>
					<td class="number" v-html="niceNumber (v.last24h.avg,   5)"></td>
					<td class="number" v-html="niceNumber (v.last24h.volume * v.last24h.avg, 0) + '€'"></td>
					<td class="number" v-html="stochastic (v.last, v.last24h)" style="color:#080"></td>
				</tr>
				<tr>
					<td>Euro</td>
					<td class="number"></td>
					<td class="number"></td>
					<td class="number" v-html="niceNumber (balance.ZEUR,2) + '€'"></td>
					<td class="number" v-html="niceNumber (totalSum,2) + '€'"></td>
					<td class="number" v-html="niceNumber (totalSum - 1500,2) + '€'"></td>
					<td class="number" v-html="niceNumber ((totalSum - 1500) / 1500 * 100,1) + '%'"></td>
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
	moneySpent: {},
	values: [],
	totalSum: 0
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
			return s.join ('.');
		}
	}
}

sock.on ('balance', balance => {
	Object.assign (data.balance, balance);
	data.values.forEach (item => {
		if (typeof (balance[item.cid]) === 'number') {
			item.owned = balance[item.cid];
			if (typeof (data.moneySpent[item.cid]) === 'number') {
				item.avgBuy = data.moneySpent[item.cid] / balance[item.cid];
			}
		}
	});
	// console.log (JSON.stringify (balance, null, 4));
});
sock.on ('moneySpent', moneySpent => {
	data.moneySpent = moneySpent;
	data.values.forEach (item => {
		if (typeof (moneySpent[item.cid]) === 'number') {
			item.moneySpent = moneySpent[item.cid];
			if (typeof (data.balance[item.cid]) === 'number') {
				item.avgBuy = moneySpent[item.cid] / data.balance[item.cid];
			}
		}
	});
})
sock.on ('values_of_tradable_assets', values => {
	var oldValues = {};
	data.values.forEach (item => {
		oldValues[item.cid] = item;
	});
	var newValues = [];
	var totalSum = data.balance.ZEUR || 0;
	for (var k in values) {
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

setTimeout (() => {

	sock.emit ('balance');
}, 500);

</script>
