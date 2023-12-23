import Router from "../../routes/router.js"
import helpers from "../../src/helpers/helpers.js";
import templateHelper from "../../src/helpers/templateHelper.js";
import BollingerReport from "../../src/reports/bollingerReport.js";
Router.renderNavbar();

const bollingerReport = new BollingerReport();

const AUTO_REFRESH_TIME = 5; // seconds

let timeout = 0;

document.getElementById('button').addEventListener('click', generateData)
document.getElementById('openWindow').addEventListener('click', helpers.openWindow)

const defaultTimeframes = ['1m', '3m', '5m', '15m', "30m", "1h"];

$(document).ready(function() {
    $('#timeframes').select2();
    $('#timeframes').val(defaultTimeframes).trigger('change');
});

setLoaderVisibility(false)


async function generateData() {
    clearTimeout(timeout)
    setLoaderVisibility(true)

    const datetimeValue = document.getElementById('datetime').value
    const symbol = document.getElementById('symbol').value
    const count = document.getElementById('count').value

    const datetime =  datetimeValue? new Date(datetimeValue): new Date()

    const v2Color = document.getElementById('colorsV2').checked

    const reportConfig = {
        symbol,
        timeframes: getTimeframesToGenerate(),
        maxTimeframeCount: count,
        datetime
    }

    bollingerReport.setConfig(reportConfig)

    await bollingerReport.fetchCandlesData()

    const headers = bollingerReport.headers

    const data = bollingerReport.candlesData

    const maxTimeframeMinutes = data[0]?.timeframe?.minutes

    const lastBigCandleDatetime =  data[0]?.candles[count - 1].open_time

    const rows = data.map(({timeframe, candles}, i) => {
        const lastIndex = candles.findIndex((c) => c.open_time < lastBigCandleDatetime)

        candles = candles.slice(0, i == 0? Number(count): lastIndex != -1? lastIndex: undefined)

        const max = Math.max(...candles.map(c => c.bbt20 - c.bbb20));

        const min = Math.min(...candles.map(c => c.bbt20 - c.bbb20));

        const getPercentage = (value) => {
            const range = max - min;

            const valueWithinRange = value - min

            return valueWithinRange / range
        }

        const fisrtColspan = data[data.length - 1]?.candles?.filter((c) => c.open_time >= candles[0]?.open_time)?.length * data[data.length - 1]?.timeframe?.minutes

        const colors = {
            green: { red: 99, green: 190, blue: 123 },
            red: { red: 255, green: 105, blue: 105 },
            white: { red: 255, green: 255, blue: 255 },
            yelow: { red: 245, green: 233, blue: 130 }
        }
        
        const cells = candles.map((candle, i) => {
            const color = v2Color ? 
                helpers.colorGradient(getPercentage(candle.bbt20 - candle.bbb20), colors.white, candle.close > candle.ema20? colors.green : colors.red) :
                helpers.colorGradient(getPercentage(candle.bbt20 - candle.bbb20), colors.red, colors.yelow, colors.green) 

            return ({
            value: helpers.castDecimal(candle.bbt20 - candle.bbb20),
            background: color,
            colspan: i == 0? fisrtColspan: timeframe.minutes,
            openTime: candle.open_time
        })})

        return [
            timeframe.label
        ].concat(cells)
    })

    templateHelper.preloadTemplates([
        'bollingerReport/headerRow',
        'bollingerReport/headerCell',
        'bollingerReport/row',
        'bollingerReport/cell'
    ]).then(() => {
        templateHelper.render('bollingerReport/headerRow', { rows, headers, maxTimeframeMinutes }, tableHeader)

        templateHelper.renderEach(rows, 'bollingerReport/row', 'row', { rows }, tableBody)
    })
    
    setLoaderVisibility(false)
    timeout = setTimeout(generateData, AUTO_REFRESH_TIME * 1000)
}

function getTimeframesToGenerate() {
    return $('#timeframes').val()
}

function setLoaderVisibility(visible) {
    visible? document.getElementById('loader').classList.remove("hidden"): document.getElementById('loader').classList.add("hidden")
}




