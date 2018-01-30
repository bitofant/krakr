<script>

	import Vue from 'Vue';
	import Donut from './components/donut.vue';
	import user from '../js/user';


	export default Donut.extend ({
		name: 'random-donut',
		data () {
			return {
				width: '100%',
				aspectRatio: 2 / 1,
				user: user,
				data: []
			}
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
			}
		},
		watch: {
			"user.lastUpdate": {
				handler: 'recalc',
				deep: false
			}
		}
	});

</script>