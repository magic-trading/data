import Ema from "./Ema.js"

export default class Bollinger {

    constructor(candlesData) {
        this.candlesData = candlesData
    }

    includeBollingerBands(period) {
        if (!this.candlesData) return

        if (!this.candlesData.slice(-1)[`ema${period}`]) {
            new Ema(this.candlesData).includeEma(period)
        }

        const keyTop = `bbt${period}`
        const keyBottom = `bbb${period}`


        this.candlesData.forEach((candle, i) => {
            if (i >= period) {
                const result = this.calculateBollingerBands(period, candle)
                candle[keyTop] = result[0]
                candle[keyBottom] = result[1]
            }
        })
    }

    calculateBollingerBands(period, candle) {
        const candleIndex = this.candlesData.indexOf(candle)

        const candlesToUse = this.candlesData.slice(candleIndex - period + 1, candleIndex + 1)

        const mean = candlesToUse.reduce((total, candle) => candle.close + total, 0) / period

        const totalSquaredDifference = candlesToUse.reduce((total, candle) => Math.pow(candle.close - mean, 2) + total, 0)

        const deviation = Math.sqrt(totalSquaredDifference / (period - 1)) // the - 1 is because of the sample standart deviation, the one used by gocharting

        const top = candle[`ema${period}`] + (2 * deviation)

        const bottom = candle[`ema${period}`] - (2 * deviation)

        return [top, bottom]
    }
}