<style lang="scss" scoped>
	path.slice{
		stroke-width:2px;
	}

	polyline{
		opacity: .3;
		stroke: black;
		stroke-width: 2px;
		fill: none;
	}
</style>

<template>
	<div class="row" style="position:relative"></div>
</template>


<script>

import user from '../js/user';
import renderChart from '../js/d3donut';

var data = {
	user: user,
	domain: [],
	colors: [],
	values: []
};

var colors = ["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"];
var change = null, width = 0, height = 0, el = null;

export default {
	name: 'currency-donut',
	data () {
		return data;
	},
	methods: {
		recalc () {
			var list = [], totalOwned = 0;
			for (var k in user.assets) {
				var curr = user.assets[k];
				var num = typeof (curr) === 'number' ? curr : (curr.owned * curr.last || 0);
				if (num < .003) continue;
				if (k !== 'ZEUR') totalOwned += num;
				var strnum = (Math.round (num * 100) / 100).toString ();
				var item = {
					name: k === 'ZEUR' ? '€' : curr.currency.name,
					color: '',
					amount: num,
					last: curr.last || 0
				};
				list.push (item);
			}
			if (totalOwned === 0) return;
			list.sort ((a, b) => {
				return a.last - b.last;
			});
			//console.log (JSON.stringify (data.domain, null, 4));

			if (change === null) {
				change = renderChart (el, width, height, list);
			} else {
				change (list);
			}

		}
	},
	mounted () {
		el = this.$el;
		width =  el.clientWidth;
		height = width * .6;
		el.style.height = (height | 0) + 'px';
		//this.recalc ();
	},
	watch: {
		"user.lastUpdate": {
			handler: 'recalc',
			deep: false
		}
	}
}


</script>
