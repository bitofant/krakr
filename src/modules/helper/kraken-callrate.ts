const counterMAX = 19;
const counterIncInterval = 2000;
const counterIncAmount = 1;

/**
 * The kraken API has a call rate limit; this class keeps track of the calls and possibly defers API calls
 */
class CallRateLimiter {

	private counter : number = counterMAX;
	private timer : NodeJS.Timer = null;
	private waitingListeners = [];

	/**
	 * Enable the call rate limit
	 */
	start () {
		if (this.timer !== null) return;
		this.timer = setInterval (() => {
			if ((this.counter += counterIncAmount) > counterMAX) {
				this.counter = counterMAX;
			}
			if (this.waitingListeners.length > 0 && this.counter >= this.waitingListeners[0][0]) {
				var firstListener = this.waitingListeners.splice (0, 1) [0];
				this.counter -= firstListener[0];
				firstListener[1] ();
			}
		}, counterIncInterval);
	};

	/**
	 * Disables the call rate limit
	 */
	stop () {
		if (this.timer === null) return;
		clearInterval (this.timer);
		this.timer = null;
	};

	/**
	 * Defer the API call if the call rate limit is reached
	 * @param {()=>void} listener 
	 * @param {number} n 
	 */
	reduce (n, listener) {
		// timer not running? => no call rate limit; call immediately
		if (this.timer === null) return listener ();

		// no cost defined? default cost = 1
		if (typeof (n) !== 'number') n = 1;

		// can we call immediately?
		if (this.counter >= n) {
			// yes!
			this.counter -= n;
			listener ();
			return true;
		} else {
			// no - we have to wait for the next tick
			console.log ('API call deferred (call rate limit reached)');
			this.waitingListeners.push ([n, listener]);
			return false;
		}
	};

}

export {
	CallRateLimiter,
	counterMAX as MAX_COST,
	counterIncInterval as TICK_INTERVAL
};

export default CallRateLimiter;