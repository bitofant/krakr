<script lang="ts">

	import Vue from 'vue';
	import Donut from './components/donut.vue';
	import user from '../js/user';
	import isMobile from '../js/is-mobile.js';


	export default Donut.extend ({
		name: 'donut-dashboard',
		data () {
			return Object.assign ({
				mobile: isMobile,
				width: '100%',
				user: user,
				data: []
			}, isMobile ? {
				height: Math.min (window.innerWidth, window.innerHeight)
			} : {
				aspectRatio: 2 / 1,
			});
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
						label: k === 'ZEUR' ? '€' : curr.currency.name,
						last: curr.last || 0,
						value: num,
						currency: curr
					};
					list.push (item);
				}
				if (totalOwned === 0) return;
				list.sort ((a, b) => {
					return a.last - b.last;
				});
				this.data = list;
			},
			getDetailsHTML (item) {
				return '<span style="font-weight:bold;font-size:140%">' + item.label + '</span>' +
					'<table>' +
					'<tr><td>Gain:</td><td>' +
					'</table>';
			},
		},
		watch: {
			'user.lastUpdate': 'recalc'
		}
	});

</script>