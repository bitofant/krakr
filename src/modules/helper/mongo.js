

const fs = require ('fs');
const MongoClient = require ('mongodb').MongoClient;

const mongo_config = {
	host: '127.0.0.1',
	port: 27017,
	db: 'krakr'
};

var db = null;
var dbListeners = [];

MongoClient.connect ('mongodb://' + mongo_config.host + ':' + mongo_config.port, (err, client) => {
	if (err) throw err;
	db = client.db (mongo_config.db);
	module.exports.db = db;
	dbListeners.forEach (listener => {
		listener (client);
	});
});


module.exports = {
	getDB (callback) {
		if (db !== null) process.nextTick (callback);
		else dbListeners.push (callback);
	},
	/**
	 * 
	 * @param {string} name 
	 * @returns {Collection}
	 */
	collection (name) {
		return db.collection (name);
	}
}
