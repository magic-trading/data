import helpers from "./helpers.js"

class API {

    API_URL = "https://fapi.binance.com"


    async getCandleData(symbol, interval, limit = null, startTime, endTime) {
        const endpoint = "fapi/v1/klines"

        const params = new URLSearchParams({
            symbol: symbol,
            interval: interval
        })

        limit ? params.append('limit', limit): limit

        startTime? params.append('startTime', new Date(startTime).getTime() + (new Date().getTimezoneOffset() * 60000)): null
        endTime? params.append('endTime', new Date(endTime).getTime() + (new Date().getTimezoneOffset() * 60000)): null

        const request = fetch(`${this.API_URL}/${endpoint}?${params.toString()}`)

        const response = await request

        const json = await response.json()

        return helpers.mapCandleData(json)
    }
}

export default new API