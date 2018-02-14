<style lang="scss" scoped>
</style>

<template>
	<div v-if="currency" class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="exampleModalLabel" v-text="user.assets[currency].currency.name + ' ' + user.assets[currency].hint.substr (0, 1)"></h5>
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body">
					<div v-text="user.assets[currency].hint.substr (2)"></div>
					<div v-if="currencySettings[currency]">
						{{ JSON.stringify (currencySettings[currency], null, '&nbsp;&nbsp;') }}
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
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





export default {
	name: 'currency-popup',
	data () {
		return {
			user: user,
			assets: assets,
			currencySettings: {},
			currency: null
		};
	},
	components: {
	},
	mounted () {
		var self = this;
		sock.on ('currency-settings', data => {
			self.currencySettings[data.id] = data;
		});
	},
	methods: {
		show (assetID) {
			this.currency = assetID;
			sock.emit ('currency-settings:get', assetID);
			setTimeout (() => {
				$ ('#exampleModal').modal ()
			}, 50);
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
		}
	}
}



</script>
