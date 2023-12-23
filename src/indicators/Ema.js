export default class Ema {

    constructor(candlesData) {
        this.candlesData = candlesData;
    }

    calculateEma(period, i) {
        const previousEma = i >= period? this.candlesData[i - 1][`ema${period}`] : this.calculateSma(period, i)

        if(!previousEma) return null

        const k = 2 / (period + 1)

        const currentPrice = this.candlesData[i].close

        const ema = k*(currentPrice - previousEma) + previousEma

        return ema
    }

    calculateSma(period, i) {
        if(i < period - 1) return null

        let total = 0

        for (let index = 0; index < i; index++) {
            const candleData = this.candlesData[index]

            total += candleData.close
        }

        return total / period
    }

    includeEma(period) {
        this.candlesData.forEach((candleData, i) => {
            candleData[`ema${period}`] = this.calculateEma(period, i)
        })
    }

    calculateCrossPoint(candle1, candle2, period1, period2) {
        const ema1Key = `ema${period1}`
        const ema2Key = `ema${period2}`
        
        const py = (candle1[ema2Key] * (candle1[ema1Key] - candle2[ema1Key])  - candle1[ema1Key] * (candle1[ema2Key] - candle2[ema2Key])) / ((candle1[ema1Key] - candle2[ema1Key]) - (candle1[ema2Key] - candle2[ema2Key]))

        const px = (candle1[ema1Key] - candle1[ema2Key]) / ((candle1[ema1Key] - candle2[ema1Key]) - (candle1[ema2Key] - candle2[ema2Key]))
        
        return py;
    }
}