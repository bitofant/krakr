class Ticker {
	public last;
	public ask;
	public bid;
	public today : PeriodInfo;
	public last24h : PeriodInfo;

	constructor (obj) {
		if (obj.a && obj.b) {
			this.ask =  parseFloat (obj.a[0]);
			this.bid =  parseFloat (obj.b[0]);
			this.last = parseFloat (obj.c[0]);
			this.today = new PeriodInfo (
				parseFloat (obj.l[0]),
				parseFloat (obj.h[0]),
				parseFloat (obj.p[0]),
				parseFloat (obj.v[0])
			);
			this.last24h = new PeriodInfo (
				parseFloat (obj.l[1]),
				parseFloat (obj.h[1]),
				parseFloat (obj.p[1]),
				parseFloat (obj.v[1])
			);
		} else {
			this.last = obj.last;
			this.ask = obj.ask;
			this.bid = obj.bid;
			this.today = new PeriodInfo (
				obj.today.low,
				obj.today.high,
				obj.today.avg,
				obj.today.volume
			);
			this.last24h = new PeriodInfo (
				obj.last24h.low,
				obj.last24h.high,
				obj.last24h.avg,
				obj.last24h.volume
			);
		}
	}

	toCondensed (obj) {
		return {
			a: [this.ask],
			b: [this.bid],
			c: [this.last],
			l: [this.today.low, this.last24h.low],
			h: [this.today.high, this.last24h.high],
			p: [this.today.avg, this.last24h.avg],
			v: [this.today.volume, this.last24h.volume]
		};
	}

}

class PeriodInfo {
	public low : number;
	public high : number;
	public avg: number;
	public volume : number;

	constructor (low, high, average, volume) {
		this.low = low;
		this.high = high;
		this.avg = average;
		this.volume = volume;
	}
}



export default Ticker;
