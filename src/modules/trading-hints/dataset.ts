
class Data {

	avg: number;
	open: number;
	close: number;
	low: number;
	high: number;
	volume: number;

	constructor (item: {avg?:number,first?:number,last?:number,min?:number,max?:number,volume?:Array<number>}|number) {
		this.volume = 0;
		if (typeof (item) === 'number') {
			this.avg   = item;
			this.open  = item;
			this.close = item;
			this.low   = item;
			this.high  = item;
		} else {
			var defaultNum: number = item.avg || item.first || item.last || item.min || item.max || 0;
			this.avg   = item.avg   || defaultNum;
			this.open  = item.first || defaultNum;
			this.close = item.last  || defaultNum;
			this.low   = item.min   || defaultNum;
			this.high  = item.max   || defaultNum;
			if (item.volume && item.volume.length > 1) {
				var v1 = item.volume[0], v2 = item.volume[1];
				this.volume = v2 - v1;
				if (this.volume < 0) {
					this.volume = v2;
				}
			}
		}
	}


	public static fromArgs (open: number, close: number, low: number, high: number, volume: number): Data {
		var d = new Data (close);
		d.open = open;
		d.low = low;
		d.high = high;
		d.volume = volume;
		return d;
	}


	static subtract (v1: Data, v2: Data): Data {
		if (v1 === null || v2 === null) return null;
		var ret = Data.fromArgs (
			v1.open   - v2.open,
			v1.close  - v2.close,
			v1.low    - v2.low,
			v1.high   - v2.high,
			v1.volume - v2.volume
		);
		return ret;
	}


	public toString () {
		return '' + this.close;
	}

}




class Dataset {

	public data: Array<Data> = null;


	constructor (data?: Array<Data>) {
		if (data) this.data = data;
		else this.data = [];
	}


	public static fromArray (numbers: Array<number|{avg:number,first:number,last:number,min:number,max:number,volume:Array<number>}>): Dataset {
		var arr: Array<Data> = [];
		numbers.forEach (n => {
			arr.push (new Data (n));
		});
		return new Dataset (arr);
	}

	public static subtract (set1: Dataset, set2: Dataset): Dataset {
		var ret = new Dataset ();
		var len = Math.min (set1.data.length, set2.data.length);
		for (var i = 0; i < set1.data.length; i++) {
			var v1 = set1.data[i], v2 = set2.data[i];
			ret.push (Data.subtract (v1, v2))
		}
		return ret;
	}


	public getClose (): number {
		return this.data[this.data.length - 1].close;
	}


	public push (item: Data) {
		this.data.push (item);
	}


	public slice (length: number) {
		return new Dataset (this.data.slice (0, length));
	}



	public SMA (period: number): Dataset {
		if (this.data === null || this.data.length === null) return null;
		var ret = new Dataset ();
		var initialValue = this.data[0].close;
		for (var i = 0; i < this.data.length; i++) {
			var from = Math.max (0, i - period + 1);
			var to = i;
			var slice = new Dataset (this.data.slice (from, to + 1));
			var avg = 0, open = 0, close = 0, low = 0, high = 0, volume = 0;
			slice.data.forEach (item => {
				avg += item.avg;
				open += item.open;
				close += item.close;
				low += item.low;
				high += item.high;
				volume += item.volume;
			});
			avg /= slice.data.length;
			open /= slice.data.length;
			close /= slice.data.length;
			low /= slice.data.length;
			high /= slice.data.length;
			volume /= slice.data.length;
			ret.push (Data.fromArgs (open, close, low, high, volume));
		}
		return ret;
	}



	public EMA (period: number): Dataset {
		if (this.data === null || this.data.length === null) {
			return null;
		}

		var count: number = this.data.length;
		var result: Dataset = new Dataset ();
		var j = 0; 
		for (j = 0; j < count && (this.data[j] == null); j++) { 
				result.push (null);
		} 
		var open = 0, high = 0, low = 0, close = 0, volume = 0;
		for (var i = j; i < period + j && i < count; i++) {
			open   += this.data[i].open;
			high   += this.data[i].high;
			low    += this.data[i].low;
			close  += this.data[i].close;
			volume += this.data[i].volume;
			if (i === period + j - 1) {
				open   /= period;
				high   /= period;
				low    /= period;
				close  /= period;
				volume /= period;
				result.push (Data.fromArgs (open, close, low, high, volume));
			} else {
				result.push (null);
			}
		}

		var k = 2 / (period + 1);
		for (var i = period + j; i < this.data.length; i++) {
			open   = (this.data[i].open   - open)   * k + open;
			high   = (this.data[i].high   - high)   * k + high;
			low    = (this.data[i].low    - low)    * k + low;
			close  = (this.data[i].close  - close)  * k + close;
			volume = (this.data[i].volume - volume) * k + volume;
			result.push (Data.fromArgs (open, close, low, high, volume));
		}
		return result;
	}


}

export { Data, Dataset };
export default Dataset;
