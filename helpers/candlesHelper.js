
class CandlesHelper {

    getCandlesByPriceMovement(candlesDataSource, movement){
        return candlesDataSource.filter(candle => (candle.high - candle.low) > movement)
    }

    includeCandlesMovement(candlesDataSource) {
        candlesDataSource.forEach((candle) => {
            candle['movement'] = this.getCandleMovement(candle)
        })
    }

    getCandleMovement(candle) {
        return (candle.high / candle.low) - 1
    }

}

export default new CandlesHelper()