const fs = require ('fs');


function UserStore (auth) {
	var fn = __dirname + '/../user-store/' + auth.apikey.replace (/[^a-zA-Z0-9]/g, '-') + '.json';

	var data = {};
	var somethingChanged = false;

	if (fs.existsSync (fn)) {
		var contents = fs.readFileSync (fn, 'utf8');
		data = JSON.parse (contents);
	}

	this.get = (varname, defaultValue) => {
		return data[varname] || defaultValue;
	};

	this.set = (varname, value) => {
		data[varname] = value;
		somethingChanged = true;
	}


	var timer = setInterval (() => {
		if (!somethingChanged) return;
		somethingChanged = false;
		fs.writeFile (fn, JSON.stringify (data, null, 4), err => {
			if (err) console.log ('Error writing user-store to disc!');
		});
	}, 1000);
	
	this.socketClosed = () => {
		clearInterval (timer);
	}

}

module.exports = UserStore;
