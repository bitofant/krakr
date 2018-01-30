const counterMAX = 19;
const counterIncInterval = 2000;
const counterIncAmount = 1;

/**
 * The kraken API has a call rate limit; this class keeps track of the calls and possibly defers API calls
 */
function CallRateLimiter () {

	var counter = counterMAX;
	var timer = -1;
	var waitingListeners = [];

	/**
	 * Enable the call rate limit
	 */
	this.start = () => {
		if (timer !== -1) return;
		timer = setInterval (() => {
			if ((counter += counterIncAmount) > counterMAX) {
				counter = counterMAX;
			}
			if (waitingListeners.length > 0 && counter >= waitingListeners[0][0]) {
				var firstListener = waitingListeners.splice (0, 1) [0];
				counter -= firstListener[0];
				firstListener[1] ();
			}
		}, counterIncInterval);
	};

	/**
	 * Disables the call rate limit
	 */
	this.stop = () => {
		if (timer === -1) return;
		clearInterval (timer);
		timer = -1;
	};

	/**
	 * Defer the API call if the call rate limit is reached
	 * @param {()=>void} listener 
	 * @param {number} n 
	 */
	this.reduce = (n, listener) => {
		// timer not running? => no call rate limit; call immediately
		if (timer === -1) return listener ();

		// no cost defined? default cost = 1
		if (typeof (n) !== 'number') n = 1;

		// can we call immediately?
		if (counter >= n) {
			// yes!
			counter -= n;
			listener ();
			return true;
		} else {
			// no - we have to wait for the next tick
			console.log ('API call deferred (call rate limit reached)');
			waitingListeners.push ([n, listener]);
			return false;
		}
	};

}

CallRateLimiter.MAX_COST = counterMAX;
CallRateLimiter.TICK_INTERVAL = counterIncInterval;

module.exports = CallRateLimiter;