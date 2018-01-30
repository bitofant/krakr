import assets from '../assets';

class Asset {
	public name : string;
	public symbol : string;
	public pair : string;
	public aclass : string;
	public altname : string;
	public decimals : number;
	public display_decimals: number;
	public cryptowatch : {symbol : string, route : string};

	constructor (name) {
		var obj = name;
		if (typeof (name) === 'string') {
			obj = assets[name] || assets.findNameByPair (name);
			if (obj === null) throw Error ('Unable to find asset ' + name);
		}
		this.name = obj.name || name;
		this.symbol = obj.symbol || '$';
		this.pair = obj.pair || null;
		this.aclass = obj.aclass || 'currency';
		this.altname = obj.altname || name;
		this.decimals = obj.decimals || 5;
		this.display_decimals = obj.display_decimals || 2;
		var cw = obj.cryptowatch || {};
		this.cryptowatch.symbol = cw.symbol || null;
		this.cryptowatch.route = cw.route || null;
	}
}