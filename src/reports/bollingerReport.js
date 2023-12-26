import binanceAPI from "../api/BinanceAPI.js";
import timeframes from "../config/timeframes.js";
import Bollinger from "../indicators/Bollinger.js";

class BollingerReport {

    #fetching = false

    constructor(config) {
        this.config = {
            ...this.#defaultConfig(), 
            ...config
        };
    }

    #defaultConfig() {
        return {
            symbol: 'btcusdt',
            emas: [20],
            timeframes: ['1m', '3m', '5m', '15m', '30m', '1h'],
            maxTimeframeCount: 12,
            datetime: undefined,
            fetchingListener: undefined
        }
    }

    set isFetching(value) {
        this.#fetching = value
        this.config.fetchingListener?.(value);
    }

    get isFetching() {
        return this.#fetching
    }

    get headers() {
        return [
            'Time Frame'
        ].concat(Array.from({length: Number(this.config.maxTimeframeCount)}, (x, i) => i==0? "Ahora":""));
    }

    setConfig(config) {
        this.config = {
            ...this.config, 
            ...config
        };
    }

    async fetchCandlesData(){
        this.isFetching = true;
        const fetchPromises = this.config.timeframes.map(
            async timeframe => {
                const candlesDataSource = await binanceAPI.getCandleData(this.config.symbol, timeframe, 1500, undefined, this.config.datetime)
    
                new Bollinger(candlesDataSource).includeBollingerBands(20)
    
                candlesDataSource.reverse()
                
                return {timeframe: timeframes[timeframe], candles: candlesDataSource}
            }
        )
    
        this.candlesData = await Promise.all(fetchPromises)
        this.isFetching = false
    }
}

export default BollingerReport