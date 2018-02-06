import logger from './logger';
const log = logger (module);

const fs = require ('fs');
//import { MongoClient, Db } from 'mongodb';
// import { Db } from 'mongodb';
import mongodb = require ('mongodb');
const MongoClient  = mongodb.MongoClient;
const Long = mongodb.Long;


// declare interface Collection {
// 	insertOne: (object: any, callback: (err: Error,result: any) => void) => void
// }

// declare interface Db {
// 	collection: (name: string) => Collection
// }


const mongo_config = {
	host: '127.0.0.1',
	port: 27017,
	db: 'krakr'
};


var db = null;
var dbListeners = [];

MongoClient.connect ('mongodb://' + mongo_config.host + ':' + mongo_config.port, (err, client) => {
	if (err) throw err;
	log ('connected!', 'green');
	db = client.db (mongo_config.db);
	dbListeners.forEach (listener => {
		listener (db);
	});
});

log ('connecting to "mongodb://' + mongo_config.host + ':' + mongo_config.port + '"', 'yellow');

function getDB (callback : (db: mongodb.Db) => void) {
	if (db !== null) process.nextTick (() => {
		callback (db);
	});
	else dbListeners.push (callback);
}

export { getDB as mongo, Long };
export default getDB;
