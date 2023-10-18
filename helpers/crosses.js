import Cross from "../classes/cross.js"

class Crosses {

    getLastEmaCross(candleDataArray, period1, period2) {
        const ema1Key = `ema${period1}`
        const ema2Key = `ema${period2}`

        const lastCandle = candleDataArray[candleDataArray.length - 1]

        const greatherEma = lastCandle[ema1Key] > lastCandle[ema2Key]? ema1Key: ema2Key
        const smallerEma = greatherEma == ema1Key? ema2Key: ema1Key

        for (let index = candleDataArray.length - 1; index >= 0; index--) {
            const candleData = candleDataArray[index];
            if(candleData[greatherEma] <= candleData[smallerEma]){
                return this.getCrossByCandle(candleDataArray, candleData, period1, period2)
            }
        }

    }

    includeEmaCrosses(candleDataArray, period1, period2) {
        const ema1Key = `ema${period1}`
        const ema2Key = `ema${period2}`
        const newCrossKey = `cross${ema1Key}${ema2Key}`

        const lastCandle = candleDataArray[candleDataArray.length - 1]

        let greatherEma = lastCandle[ema1Key] > lastCandle[ema2Key]? ema1Key: ema2Key
        let smallerEma = greatherEma == ema1Key? ema2Key: ema1Key

        for (let index = candleDataArray.length - 1; index >= 0; index--) {
            const candleData = candleDataArray[index];
            let isCross = false

            if(candleData[greatherEma] == null || candleData[smallerEma] == null) {
                isCross = false
            }
            else if(candleData[greatherEma] <= candleData[smallerEma]){
                isCross = true;
                [greatherEma, smallerEma] = [smallerEma, greatherEma]
            }

            candleData[newCrossKey] = isCross
        }
    }

    getCandlesWithCrosses(candleDataArray, period1, period2) {
        const ema1Key = `ema${period1}`
        const ema2Key = `ema${period2}`
        const newCrossKey = `cross${ema1Key}${ema2Key}`

        return candleDataArray.filter(candleData => candleData[newCrossKey]).reverse()
    }

    calculateCrossPoint(candle1, candle2, period1, period2) {
        const ema1Key = `ema${period1}`
        const ema2Key = `ema${period2}`
        
        const py = (candle1[ema2Key] * (candle1[ema1Key] - candle2[ema1Key])  - candle1[ema1Key] * (candle1[ema2Key] - candle2[ema2Key])) / ((candle1[ema1Key] - candle2[ema1Key]) - (candle1[ema2Key] - candle2[ema2Key]))

        const px = (candle1[ema1Key] - candle1[ema2Key]) / ((candle1[ema1Key] - candle2[ema1Key]) - (candle1[ema2Key] - candle2[ema2Key]))

        const millisecodnsDifference = candle2.open_time.getTime() - candle1.open_time.getTime()

        const date = new Date(candle1.open_time.getTime() + (millisecodnsDifference * px))
        
        return [date, py];
    }

    getCrossByCandle(candleDataArray, candle, period1, period2) {
        const cross1 = new Cross(candle, candleDataArray, period1, period2)

        // const ema1Key = `ema${period1}`
        // const ema2Key = `ema${period2}`
        // const cross = this.calculateCrossPoint(candle, candleDataArray[candleDataArray.indexOf(candle) + 1], period1, period2)

        return cross1
    }

    getCrosses(candleDataArray, period1, period2) {
        const candlesWithCrosses = this.getCandlesWithCrosses(candleDataArray, period1, period2)

        return candlesWithCrosses.map(candle => this.getCrossByCandle(candleDataArray, candle, period1, period2))
    }

    getCrossReturningAverage(crosses, formatted = false) {
        const totalMinutes = crosses.reduce(
            (accumulator, cross) => {
                return accumulator + (cross.doesPriceReturned? ((cross.candleOfReturn.close_time.getTime() - cross.datetime.getTime()) / 1000): 0)
            }, 0
        )
        const average = totalMinutes / crosses.filter(c => c.doesPriceReturned).length

        // const days = Math.floor(average / (60 * 24));
        // const hours = Math.floor((average / 60) - days * 24);
        // const minutes = Math.floor(average - (hours * 60 + days * 60 * 24));
        // const seconds = Math.floor((average * 60) - (minutes * 60 + hours * 60 * 60 + days * 60 * 60 * 24));

        const days = Math.floor(average / (60 * 60 * 24));
        const hours = Math.floor((average % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((average % (60 * 60)) / (60));
        const seconds = Math.floor((average % (60)));


        // Time calculations for days, hours, minutes and seconds


        return (days? days + "d ": "") + (hours? hours + "h ": "") + (minutes? minutes + "m ": "") + (seconds? seconds + "s": "");
    }

    getCrossCandleDif(candleDataArray, cross1, cross2) {
        if (cross1 && cross2)
            return Math.abs(candleDataArray.indexOf(cross1.candleBefore) - candleDataArray.indexOf(cross2.candleBefore))
        return 0
    }
    
}

export default new Crosses()