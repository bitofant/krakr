import { Dataset, Data } from "./dataset";



function stochastic (dataset: Dataset, period: number): Dataset {
	var initialValue = dataset.data[0].close;
	var ret = new Dataset ();
	for (var i = 0; i < dataset.data.length; i++) {
		var low = initialValue, high = initialValue;
		var slice = new Dataset (dataset.data.slice (
			Math.max (0, i - period + 1),
			i + 1
		));
		slice.data.forEach (n => {
			if (n.low < low) low = n.low;
			else if (n.high > high) high = n.high;
		});
		ret.push (new Data ((slice.getClose () - low) / (high - low)))
	}
	return ret;
}

function fullStochastic (dataset: Dataset, period: number, periodK: number, periodD: number): { k: Dataset, d: Dataset, toString: ()=>string } {
	var fastK = stochastic (dataset, period);
	var fullK = fastK.EMA (periodK);
	var fullD = fullK.EMA (periodD);
	return {
		k: fullK,
		d: fullD,
		toString () {
			return 'k: ' + (Math.round (fullK.getClose () * 1000) / 10) + '%, d: ' + (Math.round (fullD.getClose () * 1000) / 10) + '%';
		}
	};
}


const stochastics = {
	plain: stochastic,
	full: fullStochastic
};

export { stochastics, stochastic, fullStochastic };
export default stochastics;
