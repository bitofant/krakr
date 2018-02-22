<style scoped>
	#footr {
		position: fixed;
		bottom: 0px;
		left: 0px;
		width: 100%;
		text-align: center;
		background: linear-gradient(180deg, #ddd, #f3f3f3);
		box-shadow: 0 0 .5em rgba(0,0,0,.6);
		color: #888;
		font-size: 80%;
	}
	#disconnect {
		float: right;
		display: inline-block;
		width: 1em;
		text-align: center;
	}
</style>

<template>
	<div>
		&nbsp;<br />&nbsp;
		<div id="footr" :style="style">
			{{ msg }}
			<a id="disconnect" href="#" @click="footerClick()">&times;</a>
		</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import sock from '../sock';
import isMobile from '../js/is-mobile.js';

var data = {
	style: {
		color: 'inherit',
		display: 'block'
	},
	msg: 'Initializing'
};
var oldState = null;
function updateState () {
	if (sock.connected !== oldState) {
		if (oldState = sock.connected) {
			data.style.color = 'inherit';
			data.msg = 'Connected';
		} else {
			data.style.color = 'color:#f00';
			data.msg = 'Disconnected'
		}
	}
}
sock.on ('connect', updateState);
sock.on ('disconnect', updateState);
setInterval (updateState, 5000);
export default Vue.extend ({
	name: 'footr',
	data () {
		return data;
	},
	methods: {
		footerClick: () => {
			sock.close ();
		},
		onresize () {
			data.style.display = window.innerWidth > window.innerHeight ? 'none' : 'block';
		}
	},
	mounted () {
		if (isMobile) {
			window.addEventListener ('resize', this.onresize, false);
			this.onresize ();
		}
	},
	beforeDestroy () {
		window.removeEventListener ('resize', this.onresize);
	},
});
</script>
