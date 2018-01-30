const fs = require ('fs');
import props from '../../application-properties';
const log = require ('../helper/logger') (module);
const getUser = require ('./user');


function loadUsers () {
	log (props.userStore);
	fs.readdir (props.userStore, (err, files) => {
		if (err) throw (err);
		files.forEach (file => {
			fs.readFile (props.userStore + file, 'utf8', (err, data) => {
				if (err) return;
				try {
					var auth = JSON.parse (data).auth;
					getUser (auth);
				} catch (err) {}
			});
		});
	});
}

export default loadUsers;
