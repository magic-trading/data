

export default class Cross {

    datetime
    crossPrice


    constructor(candleBefore, candleDataSource, emaA, emaB) {
        this.candleBefore = candleBefore
        this.candleDataSource = candleDataSource
        this.emaA = emaA < emaB? emaA: emaB
        this.emaB = emaA < emaB? emaB: emaA

        this.candleAfter = candleDataSource[candleDataSource.indexOf(this.candleBefore) + 1]
        this.emaAKey = `ema${this.emaA}`
        this.emaBKey = `ema${this.emaB}`
        this.key = `cross_${this.emaAKey}_${this.emaBKey}`

        this.calculateCrossPoint()
        this.calculateSwingType()
        this.calculateTimeframe()
    }

    get candleOfReturn() {
        // this.candleDataSource.indexOf(this.candleAfter) + 2 to avoid checking closer candles
        for (let i = this.candleDataSource.indexOf(this.candleAfter) + 2; i < this.candleDataSource.length; i++) {
            const candle = this.candleDataSource[i];
            if (this.crossPrice > candle.low && this.crossPrice < candle.high) {
                return candle
            }
        }
    }

    get doesPriceReturned() {
        return this.candleOfReturn != undefined
    }

    get timeToReturn() {
        if(this.candleOfReturn) {
            const distance = this.candleOfReturn.close_time.getTime() - this.datetime.getTime()

            // Time calculations for days, hours, minutes and seconds
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);


            return (days? days + "d ": "") + (hours? hours + "h ": "") + (minutes? minutes + "m ": "") + (seconds? seconds + "s": "");
        }
    }

    get candlesToReturn() {
        if (!this.doesPriceReturned) return this.candleDataSource.length - this.candleDataSource.indexOf(this.candleBefore)
        const diff = this.candleDataSource.indexOf(this.candleOfReturn) - this.candleDataSource.indexOf(this.candleBefore)

        return diff
    }

    calculateSwingType() {
        this.swingType = this.candleBefore[this.emaAKey] > this.candleBefore[this.emaBKey]? "down": "up"
    }

    calculateCrossPoint() {
        // simplified formula from https://dirask.com/posts/JavaScript-calculate-intersection-point-of-two-lines-for-given-4-points-VjvnAj
        const py = (this.candleBefore[this.emaBKey] * (this.candleBefore[this.emaAKey] - this.candleAfter[this.emaAKey])  - this.candleBefore[this.emaAKey] * (this.candleBefore[this.emaBKey] - this.candleAfter[this.emaBKey])) / ((this.candleBefore[this.emaAKey] - this.candleAfter[this.emaAKey]) - (this.candleBefore[this.emaBKey] - this.candleAfter[this.emaBKey]))

        const px = (this.candleBefore[this.emaAKey] - this.candleBefore[this.emaBKey]) / ((this.candleBefore[this.emaAKey] - this.candleAfter[this.emaAKey]) - (this.candleBefore[this.emaBKey] - this.candleAfter[this.emaBKey]))

        const millisecodnsDifference = this.candleAfter.open_time.getTime() - this.candleBefore.open_time.getTime()

        this.datetime = new Date(this.candleBefore.open_time.getTime() + (millisecodnsDifference * px))
        this.crossPrice = py
    }

    calculateTimeframe() {
        const distance = this.candleAfter.close_time.getTime() - this.candleBefore.close_time.getTime()

        // Time calculations for days, hours, minutes and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        this.timeframe = (days? days + "d": "") + (hours? hours + "h": "") + (minutes? minutes + "m": "");
    }



}