const fs = require ('fs');
const props = require ('../../application-properties');


function UserStore (auth) {
	var fn = props.userStore + auth.apikey.replace (/[^a-zA-Z0-9]/g, '-') + '.json';

	var data = {
		auth: auth
	};
	var somethingChanged = false;

	if (fs.existsSync (fn)) {
		var contents = fs.readFileSync (fn, 'utf8');
		data = JSON.parse (contents);
	}

	var get = this.get = (varname, defaultValue) => {
		return data[varname] || defaultValue;
	};

	var set = this.set = (varname, value) => {
		data[varname] = value;
		somethingChanged = true;
	}

	setTimeout (() => {
		set ('auth', auth);
		somethingChanged = true;
	}, 1000);

	var timer = setInterval (() => {
		if (!somethingChanged) return;
		somethingChanged = false;
		fs.writeFile (fn, JSON.stringify (data, null, 4), err => {
			if (err) {
				console.log ('Error writing user-store to disc!');
				somethingChanged = true;
			}
		});
	}, 1000);
	
	this.socketClosed = () => {
		clearInterval (timer);
	}

}

module.exports = UserStore;
