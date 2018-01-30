import logger from './logger';
const log = logger (module);

const fs = require ('fs');
//import { MongoClient, Db } from 'mongodb';
//import { Db } from 'mongodb';
const MongoClient = require ('mongodb').MongoClient;


declare interface Collection {
	insertOne: (object: any, callback: (err: Error,result: any) => void) => void
}

declare interface Db {
	collection: (name: string) => Collection
}


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

function getDB (callback : (db: Db) => void) {
	if (db !== null) process.nextTick (callback);
	else dbListeners.push (callback);
}

export default getDB;
