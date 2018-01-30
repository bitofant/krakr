const fs = require ('fs');
import props from '../../application-properties';


class UserStore {
	private timer;
	private data : { [key: string]: any } = {
		auth: null
	}
	private somethingChanged : boolean = false;

	constructor (auth) {
		var fn = props.userStore + auth.apikey.replace (/[^a-zA-Z0-9]/g, '-') + '.json';

		this.data.auth = auth;

		if (fs.existsSync (fn)) {
			var contents = fs.readFileSync (fn, 'utf8');
			this.data = JSON.parse (contents);
		} else {
			this.somethingChanged = true;
		}

		this.timer = setInterval (() => {
			if (!this.somethingChanged) return;
			this.somethingChanged = false;
			fs.writeFile (fn, JSON.stringify (this.data, null, 4), err => {
				if (err) {
					console.log ('Error writing user-store to disc!');
					this.somethingChanged = true;
				}
			});
		}, 1000);
	}

	get (varname, defaultValue) {
		return this.data[varname] || defaultValue;
	}

	set (varname, value) {
		this.data[varname] = value;
		this.somethingChanged = true;
	}
	
	socketClosed () {
		clearInterval (this.timer);
	}

}

export default UserStore;
