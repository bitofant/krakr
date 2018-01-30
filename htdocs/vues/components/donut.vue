<style lang="scss" scoped>
	.slice {
		stroke: #000;
	}
	.centerpiece {
		position: absolute;
		text-align: center;
		overflow: hidden;
	}
</style>

<template>
	<div style="position:relative">
		<svg @mouseout="deactivate()">
			<g v-bind:transform="'translate(' + center.x + ',' + center.y + ')'">
				<path v-for="p in paths"
					class="slice"
					@mouseover="activate(p)"
					@click="activate(p)"
					:style="'fill:' + (p.index === hilight ? '#38f' : '#555')" 
					:key="p.label"
					:d="p.path" />
				<!-- <text style="text-anchor:middle" dy="-1em">{{ line1 }}</text>
				<text style="text-anchor:middle" dy="0">{{ line2 }}</text>
				<text style="text-anchor:middle" dy="1em">{{ line3 }}</text> -->
			</g>
		</svg>
		<div class="centerpiece" :style="divStyles" v-if="selected !== null" v-html="getDetailsHTML(selected)">
		</div>
	</div>
</template>

<script>
import Vue from 'Vue';

// const colors = (function () {
// 	var colors = ['#555555'];
// 	var count = 11;
// 	for (var i = 0; i < count; i++) {
// 		colors.push ('hsl(' + (3 * 255 / count * i | 0) + ',' + (80 - (i&1) * 40) + '%,60%)')
// 	}
// 	return colors;
// }) ();

const colors = {
	base: '#555',
	hilight: '#38f'
}


export default Vue.extend ({
	name: 'donut',
	data () {
		return {
			width: -1,
			height: -1,
			aspectRatio: -1,
			data: [
			],
			center: {
				x: 1,
				y: 1
			},
			radius: {
				outer: 1,
				inner: 1
			},
			paths: [
			],
			divStyles: '',
			hilight: -1,
			selected: null
		};
	},
	components: {
	},
	methods: {
		init () {
			var svg = this.$el.children[0];
			var failed = 0, w = true, h = true;
			if (typeof (this.width ) === 'number' && this.width < 0) w = false;
			if (typeof (this.height) === 'number' && this.height < 0) h = false;
			if (!w && !h) return;
			if ((!w || !h) && this.aspectRatio < 0) return;
			console.log ('init(); ', Date.now ());
			if (w) svg.style.width  = typeof (this.width)  === 'number' ? this.width  + 'px' : this.width;
			if (h) svg.style.height = typeof (this.height) === 'number' ? this.height + 'px' : this.height;
			if (!w) svg.style.width = (svg.clientHeight * this.aspectRatio | 0) + 'px';
			if (!h) svg.style.height= (svg.clientWidth  / this.aspectRatio | 0) + 'px';
			
			var w = svg.clientWidth, h = svg.clientHeight;
			var isWide = (w > h);
			svg.setAttribute ('width', w);
			svg.setAttribute ('height', h);
			
			this.center.x = (w >> 1) + .5;
			this.center.y = (h >> 1) + .5;

			this.radius.outer = (isWide ? h >> 1 : w >> 1) - 1;
			this.radius.inner = (isWide ? h * .3 : w * .3) - 1 | 0;

			var divPos = addPoints (
				this.center,
				toPoint (this.radius.inner, Math.PI * -.75)
			);
			divPos.x = (divPos.x | 0) - 2;
			divPos.y = (divPos.y | 0) - 2;
			var divSize = (this.center.y - divPos.y) << 1;
			this.divStyles = {
				left: divPos.x + 'px',
				top: divPos.y + 'px',
				width: divSize + 'px',
				height: divSize + 'px'
			};
			console.log (this.divStyles);

			this.render ();
		},
		render () {
			var svg = this.$el.children[0];
			var w = svg.clientWidth, h = svg.clientHeight;
			var isWide = (w > h);
			var center = this.center;
			var radius = this.radius;
			var umf = {
				outer: 2 * Math.PI * radius.outer,
				inner: 2 * Math.PI * radius.inner
			};

			var total = 0;
			this.data.forEach (item => {
				total += item.value;
			});
			var prevRad = -Math.PI;
			var np = [];
			this.data.forEach ((item, i) => {
				var pct = item.value / total;
				var rad = pct * -2 * Math.PI;
				np.push ({
					label: item.label,
					path: 'M' + xya (radius.inner, prevRad) +
						'L' + xya (radius.outer, prevRad) +
						'A' + radius.outer + ',' + radius.outer + ',0,' + (rad < -Math.PI ? 1 : 0) + ',1,' + xya (radius.outer, prevRad + rad) +
						'L' + xya (radius.inner, prevRad + rad) +
						'A' + radius.inner + ',' + radius.inner + ',0,' + (rad < -Math.PI ? 1 : 0) + ',0,' + xya (radius.inner, prevRad) +
						'Z',
					index: i,
					pct: pct,
					currency: item.currency
				});
				prevRad += rad;
			});
			this.paths = np;
		},
		activate (p) {
			var curr = p.currency;
			this.hilight = p.index;
			this.selected = p;
			// this.line1 = curr.currency.name + ' (' + (Math.round (p.pct * 100)) + '%)';
			// var gainPct = (curr.avgBuyPrice - curr.last) / curr.avgBuyPrice;
			// var gain = (curr.avgBuyPrice - curr.last) * curr.owned;
			// this.line2 = 'Gain: ' +
			// 	(Math.round (gain * 100) / 100) + '€' +
			// 	' (' + Math.round (gainPct * 100) + '%)';
			// console.log (JSON.stringify (p, null, 4));
		},
		deactivate () {
			this.hilight = -1;
			this.selected = null;
			// this.line1 = this.line2 = this.line3 = '';
		},
		getDetailsHTML (item) {
			return '<span style="font-weight:bold;font-size:140%">' + item.label + '</span>';
		}
	},
	mounted () {
		console.log ('mounting!');
		console.log (window.t = this);
		this.init ();
		window.addEventListener ('resize', this.init, false);
	},
	beforeDestroy () {
		window.removeEventListener ('resize', this.init);
	},
	watch: {
		"data": {
			handler: 'render',
			deep: true
		},
		"width": {
			handler: 'init',
			deep: false
		},
		"height": {
			handler: 'init',
			deep: false
		}
	}
});

function xy (point) {
	return point.x + ',' + point.y;
}
function xya (length, angle) {
	return xy (toPoint (length, angle));
}
function toPoint (length, angle) {
	return {
		x: Math.sin (angle) * length,
		y: Math.cos (angle) * length
	};
}
function addPoints (p1, p2) {
	return {
		x: p1.x + p2.x,
		y: p1.y + p2.y
	};
}



</script>
