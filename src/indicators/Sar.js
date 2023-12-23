const metadataKey = `sarMetadata`;
const valueKey = `sarValue`;
const acceleration = 2;
const maxAcceleration = 20;

class Sar {

    metadataKey = `sarMetadata`
    valueKey = `sarValue`

    constructor(candlesData) {
        this.candlesData = candlesData
    }

    includeSar() {
        if (!this.candlesData) return

        this.candlesData.forEach((candle, i) => {
            if(i == 0) {
                candle[metadataKey] = this.getFirstMetadata(candle);
            }
            if (i >= 1) {
                const result = this.calculateSar(candle, i)
                candle[metadataKey] = result[0]
                candle[valueKey] = result[1]
            }
        })
    }

    calculateSar(candle, candleIndex) {

        const priorCandle = this.candlesData[candleIndex - 1];

        const priorMetadata = priorCandle[metadataKey];

        const priorSarValue = priorCandle[valueKey] || priorMetadata.extremePoints.low;

        let newSarValue;
        const priorAf = priorMetadata.accelerationFactor / 100;
        if(priorMetadata.rising) {
            newSarValue = priorSarValue + (priorAf * (priorMetadata.extremePoints.high - priorSarValue));
        }
        else {
            newSarValue = priorSarValue - (priorAf * (priorSarValue - priorMetadata.extremePoints.low));
        }

        let changeRising;
        if(priorMetadata.rising) {
            changeRising = candle.low <= newSarValue;
        }
        else {
            changeRising = candle.high >= newSarValue;
        }

        const newRising = changeRising? !priorMetadata.rising: priorMetadata.rising;

        let newMetadata;

        if(changeRising) {
            newMetadata = this.getNewMetadata(newRising, candle);
            newSarValue = newMetadata.rising ? priorMetadata.extremePoints.low : priorMetadata.extremePoints.high;
        }
        else {
            const newLow = Math.min(priorMetadata.extremePoints.low, candle.low);
            const newHigh = Math.max(priorMetadata.extremePoints.high, candle.high);

            let newAf = priorMetadata.accelerationFactor;
            if((newRising == true && newHigh != priorMetadata.extremePoints.high) || (newRising == false && newLow != priorMetadata.extremePoints.low)) {
                newAf = Math.min(priorMetadata.accelerationFactor + acceleration, maxAcceleration);
            }

            const newEp = { 
                low: newLow,
                high: newHigh,
            }
            newMetadata = {
                accelerationFactor: newAf,
                extremePoints: newEp,
                rising: newRising
            };
        }

        return [newMetadata, newSarValue];
    }

    getFirstMetadata(candle) {
        return {
            accelerationFactor: acceleration,
            extremePoints: { low: candle.low, high: candle.high },
            rising: true,
        }
    }

    getNewMetadata(newRising, candle) {
        return {
            accelerationFactor: acceleration,
            extremePoints: { low: candle.low, high: candle.high },
            rising: newRising,
        }
    }
}

export default Sar