class Helpers {

    mapCandleData(data) {
        if (!data) return []

        return data.map((candle) => (
            {
                open_time: new Date(candle[0]),
                open: Number.parseFloat(candle[1]),
                high: Number.parseFloat(candle[2]),
                low: Number.parseFloat(candle[3]),
                close: Number.parseFloat(candle[4]),
                volume: Number.parseFloat(candle[5]),
                close_time: new Date(candle[6]),
                quote_asset_volume: Number.parseFloat(candle[7]),
                trades: candle[8],
            }
        ))

        // [
        //     [
        //         1499040000000,      // Open time
        //         "0.01634790",       // Open
        //         "0.80000000",       // High
        //         "0.01575800",       // Low
        //         "0.01577100",       // Close
        //         "148976.11427815",  // Volume
        //         1499644799999,      // Close time
        //         "2434.19055334",    // Quote asset volume
        //         308,                // Number of trades
        //         "1756.87402397",    // Taker buy base asset volume
        //         "28.46694368",      // Taker buy quote asset volume
        //         "17928899.62484339" // Ignore.
        //     ]
        // ]
    }
}



export default new Helpers()