const ENV_TYPE = {
	DEV: 'development',
	PROD: 'production'
};
var NODE_ENV = (function () {
	if (typeof (process.env.NODE_ENV) === 'string') {
		var check = process.env.NODE_ENV.toLowerCase ();
		for (var k in ENV_TYPE) {
			if (ENV_TYPE[k] === check) return ENV_TYPE[k];
		}
	}
	if (process.platform.toLowerCase () === 'linux') {
		return ENV_TYPE.PROD;
	}
	return ENV_TYPE.DEV;
}) ();

console.log ('$NODE_ENV=' + NODE_ENV);
