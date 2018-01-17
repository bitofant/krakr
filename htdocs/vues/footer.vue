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

<script>
import sock from '../sock';
var data = {
	style: '',
	msg: 'Initializing'
}
var oldState = null;
function updateState () {
	if (sock.connected !== oldState) {
		if (oldState = sock.connected) {
			data.style = '';
			data.msg = 'Connected';
		} else {
			data.style = 'color:#f00';
			data.msg = 'Disconnected'
		}
	}
}
sock.on ('connect', updateState);
sock.on ('disconnect', updateState);
setInterval (updateState, 5000);
export default {
	name: 'footr',
	data () {
		return data;
	},
	methods: {
		footerClick: () => {
			sock.close ();
		}
	}
}
</script>
