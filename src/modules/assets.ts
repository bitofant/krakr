var to_export = {
	names: [],
	list: [],
	tradableNames: [],
	tradableList: [],
	tradablePairs: [],
	findNameByPair (pair) {
		for (var i = 0; i < to_export.tradableNames.length; i++) {
			var name = to_export.tradableNames[i];
			var item = to_export[name];
			if (item.pair === pair) return name;
		}
		return null;
	},
	//BEGIN_CURRENCY_SECTION
	"BCH": {
		"name": "Bitcoin Cash",
		"symbol": "฿",
		"pair": "BCHEUR",
		"aclass": "currency",
		"altname": "BCH",
		"decimals": 10,
		"display_decimals": 2,
		"cryptowatch": {
			"symbol": "bch",
			"route": "https://api.cryptowat.ch/assets/bch"
		},
		"price_decimals": 1
	},
	"DASH": {
		"name": "Dash",
		"symbol": "Đ",
		"pair": "DASHEUR",
		"aclass": "currency",
		"altname": "DASH",
		"decimals": 10,
		"display_decimals": 2,
		"cryptowatch": {
			"symbol": "dash",
			"route": "https://api.cryptowat.ch/assets/dash"
		},
		"price_decimals": 3
	},
	"EOS": {
		"name": "EOS",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "EOS",
		"decimals": 10,
		"display_decimals": 5,
		"cryptowatch": {
			"symbol": "eos",
			"route": "https://api.cryptowat.ch/assets/eos"
		}
	},
	"GNO": {
		"name": "Gnosis",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "GNO",
		"decimals": 10,
		"display_decimals": 5,
		"cryptowatch": {
			"symbol": "gno",
			"route": "https://api.cryptowat.ch/assets/gno"
		}
	},
	"KFEE": {
		"name": "Fee",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "FEE",
		"decimals": 2,
		"display_decimals": 2,
		"cryptowatch": {
			"symbol": "",
			"route": ""
		}
	},
	"USDT": {
		"name": "Tether",
		"symbol": "$",
		"aclass": "currency",
		"altname": "USDT",
		"decimals": 8,
		"display_decimals": 4,
		"cryptowatch": {
			"symbol": "usdt",
			"route": "https://api.cryptowat.ch/assets/usdt"
		}
	},
	"XDAO": {
		"name": "Decentralized Autonomous Organization",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "DAO",
		"decimals": 10,
		"display_decimals": 3,
		"cryptowatch": {
			"symbol": "dao",
			"route": "https://api.cryptowat.ch/assets/dao"
		}
	},
	"XETC": {
		"name": "Ethereum Classic",
		"symbol": "Ξ",
		"pair": "XETCZEUR",
		"aclass": "currency",
		"altname": "ETC",
		"decimals": 10,
		"display_decimals": 3,
		"cryptowatch": {
			"symbol": "etc",
			"route": "https://api.cryptowat.ch/assets/etc"
		},
		"price_decimals": 3
	},
	"XETH": {
		"name": "Ethereum",
		"symbol": "Ξ",
		"pair": "XETHZEUR",
		"aclass": "currency",
		"altname": "ETH",
		"decimals": 10,
		"display_decimals": 3,
		"cryptowatch": {
			"symbol": "eth",
			"route": "https://api.cryptowat.ch/assets/eth"
		},
		"price_decimals": 2
	},
	"XICN": {
		"name": "Iconomi",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "ICN",
		"decimals": 10,
		"display_decimals": 5,
		"cryptowatch": {
			"symbol": "icn",
			"route": "https://api.cryptowat.ch/assets/icn"
		}
	},
	"XLTC": {
		"name": "Litecoin",
		"symbol": "Ł",
		"pair": "XLTCZEUR",
		"aclass": "currency",
		"altname": "LTC",
		"decimals": 10,
		"display_decimals": 5,
		"cryptowatch": {
			"symbol": "ltc",
			"route": "https://api.cryptowat.ch/assets/ltc"
		},
		"price_decimals": 2
	},
	"XMLN": {
		"name": "Melonport",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "MLN",
		"decimals": 10,
		"display_decimals": 5,
		"cryptowatch": {
			"symbol": "mln",
			"route": "https://api.cryptowat.ch/assets/mln"
		}
	},
	"XNMC": {
		"name": "Namecoin",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "NMC",
		"decimals": 10,
		"display_decimals": 5,
		"cryptowatch": {
			"symbol": "nmc",
			"route": "https://api.cryptowat.ch/assets/nmc"
		}
	},
	"XREP": {
		"name": "Augur",
		"symbol": "Ɍ",
		"pair": "XREPZEUR",
		"aclass": "currency",
		"altname": "REP",
		"decimals": 10,
		"display_decimals": 5,
		"cryptowatch": {
			"symbol": "rep",
			"route": "https://api.cryptowat.ch/assets/rep"
		},
		"price_decimals": 3
	},
	"XXBT": {
		"name": "Bitcoin",
		"symbol": "฿",
		"pair": "XXBTZEUR",
		"aclass": "currency",
		"altname": "XBT",
		"decimals": 10,
		"display_decimals": 5,
		"cryptowatch": {
			"symbol": "btc",
			"route": "https://api.cryptowat.ch/assets/btc"
		},
		"price_decimals": 1
	},
	"XXDG": {
		"name": "Dogecoin",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "XDG",
		"decimals": 8,
		"display_decimals": 2,
		"cryptowatch": {
			"symbol": "doge",
			"route": "https://api.cryptowat.ch/assets/doge"
		}
	},
	"XXLM": {
		"name": "Stellar",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "XLM",
		"decimals": 8,
		"display_decimals": 5,
		"cryptowatch": {
			"symbol": "xlm",
			"route": "https://api.cryptowat.ch/assets/xlm"
		}
	},
	"XXMR": {
		"name": "Monero",
		"symbol": "ɱ",
		"pair": "XXMRZEUR",
		"aclass": "currency",
		"altname": "XMR",
		"decimals": 10,
		"display_decimals": 5,
		"cryptowatch": {
			"symbol": "xmr",
			"route": "https://api.cryptowat.ch/assets/xmr"
		},
		"price_decimals": 2
	},
	"XXRP": {
		"name": "Ripple",
		"symbol": "Ʀ",
		"pair": "XXRPZEUR",
		"aclass": "currency",
		"altname": "XRP",
		"decimals": 8,
		"display_decimals": 5,
		"cryptowatch": {
			"symbol": "xrp",
			"route": "https://api.cryptowat.ch/assets/xrp"
		},
		"price_decimals": 5
	},
	"XXVN": {
		"name": "XVN",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "XVN",
		"decimals": 4,
		"display_decimals": 2,
		"cryptowatch": {
			"symbol": "",
			"route": ""
		}
	},
	"XZEC": {
		"name": "Zcash",
		"symbol": "ⓩ",
		"pair": "XZECZEUR",
		"aclass": "currency",
		"altname": "ZEC",
		"decimals": 10,
		"display_decimals": 5,
		"cryptowatch": {
			"symbol": "zec",
			"route": "https://api.cryptowat.ch/assets/zec"
		},
		"price_decimals": 3
	},
	"ZCAD": {
		"name": "CAD",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "CAD",
		"decimals": 4,
		"display_decimals": 2,
		"cryptowatch": {
			"symbol": "",
			"route": ""
		}
	},
	"ZEUR": {
		"name": "Euro",
		"symbol": "€",
		"pair": "",
		"aclass": "currency",
		"altname": "EUR",
		"decimals": 4,
		"display_decimals": 2,
		"cryptowatch": {
			"symbol": "",
			"route": ""
		}
	},
	"ZGBP": {
		"name": "Pounds Sterling",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "GBP",
		"decimals": 4,
		"display_decimals": 2,
		"cryptowatch": {
			"symbol": "",
			"route": ""
		}
	},
	"ZJPY": {
		"name": "JPY",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "JPY",
		"decimals": 2,
		"display_decimals": 0,
		"cryptowatch": {
			"symbol": "",
			"route": ""
		}
	},
	"ZKRW": {
		"name": "KRW",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "KRW",
		"decimals": 2,
		"display_decimals": 0,
		"cryptowatch": {
			"symbol": "",
			"route": ""
		}
	},
	"ZUSD": {
		"name": "US Dollar",
		"symbol": "$",
		"pair": "",
		"aclass": "currency",
		"altname": "USD",
		"decimals": 4,
		"display_decimals": 2,
		"cryptowatch": {
			"symbol": "",
			"route": ""
		}
	}
	//END_CURRENCY_SECTION
};

for (var k in to_export) {
	if (k === 'list' || k === 'names' || k.startsWith ('tradable') || k === 'findNameByPair') continue;
	to_export.names.push (k);
	var asset = to_export[k];
	to_export.list.push (asset);
	if (asset.pair) {
		to_export.tradableNames.push (k);
		to_export.tradableList.push (asset);
		to_export.tradablePairs.push (asset.pair);
	}
}

//TYPESCRIPT
function getAsset (name: string): {
	name: string,
	symbol: string,
	pair: string,
	aclass: string,
	altname: string,
	decimals: number,
	display_decimals: number,
	price_decimals: number,
	cryptowatch: {
		symbol: string,
		route: string
	}
} {
	return to_export[name];
}

export { getAsset, to_export as assets };
//TYPESCRIPT

export default to_export;
