import ema from "./ema.js"

class Macd {

    keyLine = `macdLine`

    keyLineSignal = `macdLineSignal`

    keyValue = `macd`

    constructor(candlesData) {
        this.candlesData = candlesData
    }

    includeMacd(ema1 = 12, ema2 = 26, signalEma = 9) {
        if (!this.candlesData) return

        if (!this.candlesData.slice(-1)[`ema${ema1}`]) {
            ema.includeEmaValue(this.candlesData, ema1)
        }

        if (!this.candlesData.slice(-1)[`ema${ema2}`]) {
            ema.includeEmaValue(this.candlesData, ema2)
        }

        if (!this.candlesData.slice(-1)[`ema${signalEma}`]) {
            ema.includeEmaValue(this.candlesData, signalEma)
        }

        this.candlesData.forEach((candle, i) => {
            if (i >= ema2) {
                candle[this.keyLine] = this.calculateMacdLine(ema1, ema2, candle)
            }
        })

        this.candlesData.forEach((candle, i) => {
            if (i >= ema2) {
                candle[this.keyLineSignal] = this.calculateMacdLineSignal(signalEma, i, ema2)
                candle[this.keyValue] = candle[this.keyLine] - candle[this.keyLineSignal]
            }
        })
    }

    calculateMacdLine(ema1, ema2, candle) {
        const macd = candle[`ema${ema1}`] - candle[`ema${ema2}`]

        return macd
    }

    calculateMacdLineSignal(signalEma, i, ema2) {
        const previousEma = i > signalEma + ema2? this.candlesData[i - 1][this.keyLineSignal] : this.calculateSma(signalEma, i, ema2)

        if(!previousEma) return null

        const k = 2 / (signalEma + 1)

        const currentPrice = this.candlesData[i][this.keyLine]

        const ema = k*(currentPrice - previousEma) + previousEma

        return ema
    }

    calculateSma(signalEma, i, ema2) {
        if(i < signalEma + ema2) return null

        let total = 0

        for (let index = ema2; index < i; index++) {
            const candleData = this.candlesData[index]

            total += candleData[this.keyLine]   
        }


        return total / signalEma
    }
}

export default Macd