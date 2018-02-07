const ENV_PROD = 'production';
const ENV_DEV = 'development';

const ENV_DEFAULT = ENV_PROD;


const ENV = process.env.NODE_ENV || ENV_DEFAULT;
console.log ('profile: ' + ENV);

const IS_DEV = (ENV === ENV_DEV);
const IS_PROD = (ENV === ENV_PROD);

export default {
	requestTimeout: 10 * 1000,
	port: process.env.HTTP_PORT || process.env.PORT || 8080,
	env: {
		name: ENV,
		dev: IS_DEV,
		prod: IS_PROD
	},
	userStore: __dirname + '/user-store/',
	krakenDisabled: false,
	krakenHistoryWrites: IS_PROD,
	tickerRefreshInterval: 20 * 1000,
	checkLastXStochasticBrackets: 5,
	buyAndSellPeriodInMinutes: 5,
	requireMACDtoBePositive: false,
	printBuySellStrategyHints: true,
	makeBuyAndSellPricesUnrealistic: true,
	disableEMails: false
};


