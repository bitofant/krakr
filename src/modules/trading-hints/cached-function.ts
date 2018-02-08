import Logger from '../helper/logger';
const log = Logger (module);
import { fullStochastic, FullStochasticReturnType } from './stochastic';
import macd, { MACDReturnType } from './macd';
import { Dataset } from './dataset';

function CachedFunction (fn: (dataset:Dataset, arg1:number, arg2:number, arg3:number)=>void, a1:number, a2:number, a3:number): (dataset:Dataset)=>any {
	var lastDataset = null;
	var result = null;
	return (dataset:Dataset) => {
		if (dataset !== lastDataset) result = null;
		if (result === null) {
			lastDataset = dataset;
			result = fn (dataset, a1, a2, a3);
		}
		return result;
	};
}

function CachedMACD (fastLength:number, slowLength:number, smooth:number): (dataset:Dataset) => MACDReturnType {
	return CachedFunction (macd, fastLength, slowLength, smooth);
}

function CachedStochastic (period:number, periodK:number, periodD:number): (dataset:Dataset) => FullStochasticReturnType {
	return CachedFunction (fullStochastic, period, periodK, periodD);
}


export { CachedFunction, CachedMACD, CachedStochastic };
export default {
	CachedFunction: CachedFunction,
	CachedMACD: CachedMACD,
	CachedStochastic: CachedStochastic
};
