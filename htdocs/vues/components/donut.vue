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
		<svg>
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
		<div ref="centerpiece" class="centerpiece" :style="divStyles" v-if="selected !== null" @mousemove="centermm" @click="centerclick">
			<slot :currency="selected" />
			<div v-text="radList.join (', ')"></div>
		</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';

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
			selected: null,
			radList: []
		};
	},
	components: {
	},
	methods: {
		init () {
			var svg = this.$el.children[0];
			var failed = 0, hasW = true, hasH = true;
			if (typeof (this.width ) === 'number' && this.width < 0) hasW = false;
			if (typeof (this.height) === 'number' && this.height < 0) hasH = false;
			if (!hasW && !hasH) return;
			if ((!hasW || !hasH) && this.aspectRatio <= 0) return;
			// console.log ('init(); ', Date.now ());
			if (hasW) svg.style.width  = typeof (this.width)  === 'number' ? this.width  + 'px' : this.width;
			if (hasH) svg.style.height = typeof (this.height) === 'number' ? this.height + 'px' : this.height;
			if (!hasW) svg.style.width = (svg.clientHeight * this.aspectRatio | 0) + 'px';
			if (!hasH) svg.style.height= (svg.clientWidth  / this.aspectRatio | 0) + 'px';
			// this.$el.style.height = svg.style.height;
			
			var w : number = svg.clientWidth, h : number = svg.clientHeight;
			var isWide = (w > h);
			svg.setAttribute ('width', w);
			svg.setAttribute ('height', h);
			
			this.center.x = (w >> 1) + .5;
			this.center.y = (h >> 1) + .5;

			this.radius.outer = (isWide ? h >> 1 : w >> 1) - 1;
			this.radius.inner = (isWide ? h * .3 : w * .3) - 1 | 0;

			var divPos = addPoints (
				this.center,
				//toPoint (this.radius.inner, Math.PI * -.75)
				{ x: -this.radius.inner, y: -this.radius.inner }
			);
			divPos.x = (divPos.x | 0) + 1;
			divPos.y = (divPos.y | 0) + 1;
			var divSize = ((this.center.y - divPos.y) << 1) + 1;
			this.divStyles = {
				left: divPos.x + 'px',
				top: divPos.y + 'px',
				width: divSize + 'px',
				height: divSize + 'px',
				borderRadius: (this.radius.inner*.6|0) + 'px'
			};
			// console.log (divSize);

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
			var prevRad = Math.PI;
			this.radList.splice (0, this.radList.length);
			var np = [];
			this.data.forEach ((item, i) => {
				var pct = item.value / total;
				// console.log (item.label + ': ' + pct + '%');
				var rad = pct * -2 * Math.PI;
				this.radList.push (rad + prevRad);
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
			if (this.hilight === p.index) return;
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
		},
		centermm (ev) {
			var x = ev.layerX || ev.offsetX, y = ev.layerY || ev.offsetY;
			var centerpiece = this.$refs.centerpiece;
			var cx = centerpiece.offsetWidth, cy = centerpiece.offsetHeight;
			var px = x - (cx >> 1), py = y - (cy >> 1);
			var distance = (px * px + py * py) / ((cx >> 1) * (cy >> 1));
			if (distance < .7) return;
			var a = Math.atan2 (px, py);
			for (var i = 1; i < this.radList.length; i++) {
				if (a > this.radList[i]) {
					this.activate (this.paths[i]);
					break;
				}
			}
		},
		centerclick (ev) {
			this.centermm (ev);
			ev.preventDefault ();
		}
	},
	mounted () {
		// console.log ('mounting!');
		// console.log (window.t = this);
		this.init ();
		window.addEventListener ('resize', this.init, false);
	},
	beforeDestroy () {
		window.removeEventListener ('resize', this.init);
	},
	watch: {
		"data": {
			handler: function () {
				this.render ();
			},
			deep: true
		},
		"width": 'init',
		"height": 'init'
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
