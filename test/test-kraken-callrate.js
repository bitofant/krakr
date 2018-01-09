const CallRateLimiter = require ('../modules/helper/kraken-callrate');

var limiter = new CallRateLimiter ();

var n = 0;
limiter.start ();
var deferred;

deferred = !limiter.reduce (1, () => {
	n++;
});
if (n !== 1) throw Error ('n should be 1 (is: ' + n + ')');
if (deferred) throw Error ('Should run immediately');

deferred = !limiter.reduce (CallRateLimiter.MAX_COST, () => {
	n++;
});
if (n !== 1) throw Error ('n should be 1 (is: ' + n + ')');
if (!deferred) throw Error ('Should not run immediately');

setTimeout (() => {
	if (n !== 2) throw Error ('n should be 2 (is: ' + n + ')');
	limiter.stop ();
}, CallRateLimiter.TICK_INTERVAL);
