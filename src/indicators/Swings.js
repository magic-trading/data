import helpers from "../helpers/helpers.js"

class Swings {

    constructor(candlesData) {
        this.candlesData = candlesData
    }

    includeSwings(expectedMovement, type = 'both', candleQuantity = 3) {
        if (!this.candlesData) return

        const keyUp = `swing_up_${expectedMovement}`
        const keyDown = `swing_down_${expectedMovement}`

        this.candlesData.forEach((candle) => {
            const result = this.calculateSwing(candle, expectedMovement, type, candleQuantity)

            candle[keyUp] = type != "down" && result.includes("up")? true: false
            candle[keyDown] =  type != "up" && result.includes("down")? true: false
        })
    }

    calculateSwing(candle, expectedMovement, type = 'both', candleQuantity) {
        let result = []

        if(type != 'down' && this.calculateSwingUp(candle, expectedMovement, candleQuantity)){
            result.push('up')
        }

        if(type != 'up' && this.calculateSwingDown(candle, expectedMovement, candleQuantity)){
            result.push('down')
        }

        return result
    }

    calculateSwingUp(candle, expectedMovement, candleQuantity) {

        const minSwing = candle.low

        let maxSwing = candle.high

        if((maxSwing / minSwing) - 1 > expectedMovement) {
            return true
        }

        let i = this.candlesData.indexOf(candle) + 1

        while(i <= this.candlesData.indexOf(candle) + candleQuantity) {
            if(this.candlesData.length > i) {
                const nextCandle = this.candlesData[i]

                if(minSwing > nextCandle.low || maxSwing > nextCandle.high) {
                    return
                }

                maxSwing = nextCandle.high

                if((maxSwing / minSwing) - 1 > expectedMovement) {
                    return true
                }

                i++
            }
            return
        }
    }

    calculateSwingDown(candle, expectedMovement, candleQuantity) {

        let minSwing = candle.low

        const maxSwing = candle.high

        if((maxSwing / minSwing) - 1 > expectedMovement) {
            return true
        }

        let i = this.candlesData.indexOf(candle) + 1

        while(i <= this.candlesData.indexOf(candle) + candleQuantity) {
            if(this.candlesData.length > i) {
                const nextCandle = this.candlesData[i]

                if(minSwing < nextCandle.low || maxSwing < nextCandle.high) {
                    return
                }


                minSwing = nextCandle.low

                if((maxSwing / minSwing) - 1 > expectedMovement) {
                    return true
                }

                i++
            }
            return
        }
    }
}

export default Swings