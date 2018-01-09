<style scoped>
	#footr {
		position: fixed;
		bottom: 0px;
		left: 0px;
		width: 100%;
		text-align: center;
		border-top: 1px solid #000;
		background: #eee;
		color: #888;
		font-size: 80%;
	}
</style>

<template>
	<div id="footr" :style="style">{{ msg }}</div>
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
	}
}
</script>
