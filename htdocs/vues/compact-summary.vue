<style lang="scss" scoped>
	table {
		border-collapse: collapse;
	}
	th {
		background: #06c;
		color: #fff;
		padding: .2em .5em .2em .5em;
	}
	td {
		padding: .2em .5em .2em .5em;
	}
	th.number {
		text-align: right;
	}
	td.number {
		text-align: right;
		font-family: monospace;
	}
	.even-row {
		background: #e3e3e3;
	}
	.odd-row {
		background: #f6f6f6;
	}
</style>

<template>
	<div>
		<h1>Currencies <span style="font-size:50%;font-family:monospace">{{ lastUpdateDelta }}</span></h1>
		<div class="row" style="overflow:auto;margin-bottom:1em">
			<table style="width:100%">
				<thead>
					<th>Currency</th>
					<th class="number">Last Trade</th>
					<th class="number">Avg. Buy</th>
					<th class="number" colspan="2" style="text-align:center">Gain</th>
					<th class="number">#</th>
					<th class="number">24h</th>
				</thead>
				<tbody>
					<tr v-for="v in sortedList" :key="v.cid" v-if="typeof (v) !== 'number'">
						<td v-bind:class="v.even ? 'even-row' : 'odd-row'">{{ v.currency.name }}</td>
						<!-- last trade price -->
						<td v-bind:class="v.even ? 'even-row' : 'odd-row'" class="number"
								v-html="niceNumber (v.last, 2)"></td>

						<!-- avg buy price -->
						<td v-bind:class="v.even ? 'even-row' : 'odd-row'" class="number"
								v-html="niceNumber (v.avgBuyPrice, 2)"
								v-if="v.owned > .0001"></td>
							<td v-else v-bind:class="v.even ? 'even-row' : 'odd-row'"></td>

						<!-- gain -->
						<td v-bind:class="v.even ? 'even-row' : 'odd-row'" class="number"
								v-html="niceNumber ((v.last - v.avgBuyPrice) * v.owned, 2) + '€'"
								v-if="v.owned > .0001"></td>
							<td v-else v-bind:class="v.even ? 'even-row' : 'odd-row'"></td>
						<!-- gain (percentage) -->
						<td v-bind:class="v.even ? 'even-row' : 'odd-row'" class="number"
								v-html="niceNumber ((v.last - v.avgBuyPrice) / v.avgBuyPrice * 100, 1) + '%'"
								v-if="v.owned > .0001"></td>
							<td v-else v-bind:class="v.even ? 'even-row' : 'odd-row'"></td>

						<td v-bind:class="v.even ? 'even-row' : 'odd-row'" class="number" style="color:#080">
							<a href="#" class="stratlink"
								:title="v.hint.substr(2)"
								@click="openModal(v)"
								v-text="v.hint.substr(0,1)"></a>
						</td>
						
						<!-- 24h statistics -->
						<td v-bind:class="v.even ? 'even-row' : 'odd-row'" class="number" style="color:#080"
								v-html="stochastic (v.last24h.stoch)"></td>
					</tr>
					<tr>
						<td>Euro</td>
						<td class="number" v-html="niceNumber (user.assets.ZEUR,2) + '€'"></td>
						<td class="number" v-html="niceNumber (user.totalAssetValue,2) + '€'"></td>
						<td class="number" v-html="niceNumber (user.totalAssetValue - user.totalDeposit,2) + '€'"></td>
						<td class="number" v-html="niceNumber ((user.totalAssetValue - user.totalDeposit) / user.totalDeposit * 100,1) + '%'"></td>
					</tr>
				</tbody>
			</table>
		</div>
		<div v-if="modal" class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
			<div class="modal-dialog" role="document">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="exampleModalLabel" v-text="modal.currency.name + ' ' + modal.hint.substr (0, 1)"></h5>
						<button type="button" class="close" data-dismiss="modal" aria-label="Close">
							<span aria-hidden="true">&times;</span>
						</button>
					</div>
					<div class="modal-body" v-text="modal.hint.substr (2)"></div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import $ from 'jquery';
import sock from '../sock';
import assets from '../js/assets';
import user from '../js/user';

var data = {
	lastUpdateDelta: 0,
	user: user,
	sortedList: [],
	modal: null
};

export default {
	name: 'currency-summary',
	data () {
		return data;
	},
	components: {
	},
	methods: {
		sortList () {
			var list = [], i = 0;
			for (var k in user.assets) {
				if (k !== 'ZEUR') list.push (Object.assign ({ even: true }, user.assets[k]));
			}
			list.sort ((a, b) => {
				var v1 = a.owned * a.last || 0;
				var v2 = b.owned * b.last || 0;
				if (v1 !== 0 || v2 !== 0) return v2 - v1;
				return b.last - a.last;
			});
			list.forEach ((item, i) => {
				item.even = (i & 1) === 1;
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
		openModal (item) {
			data.modal = item;
			setTimeout (() => {
				$ ('#exampleModal').modal ()
			}, 50);
		}
	},
	watch: {
		"user.lastUpdate": {
			handler: 'sortList',
			deep: false
		}
	}
}


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
