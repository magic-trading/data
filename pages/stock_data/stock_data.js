import api from "../../helpers/api.js"
import Bollinger from "../../helpers/bollinger.js"
import crossesHelper from "../../helpers/crosses.js"
import csvHelper from "../../helpers/csvHelper.js"
import emaHelper from "../../helpers/ema.js"

const now = new Date();
now.setHours( (new Date().getHours()) - (new Date().getTimezoneOffset() / 60) )

document.getElementById('datetime').value = now.toISOString().substring(0, 16)
document.getElementById('button').addEventListener('click', generateCSV)
document.getElementById('copyTable').hidden = true
document.getElementById('copyTable').addEventListener('click', ()=> copytable('tableBody'))

setLoaderVisibility(false)


async function generateCSV() {
    setLoaderVisibility(true)

    const datetimeValue = document.getElementById('datetime').value

    console.log(datetimeValue)

    const symbol = 'btcusdt'
    const datetime =  datetimeValue? new Date(datetimeValue): new Date()

    console.log(datetime)

    const dataPromises = getTimeframesToGenerate().map(
        async timeframe => {
            const candlesDataSource = await api.getCandleData(symbol, timeframe, 1500, undefined, datetime)

            getEmasToGenerate().forEach(ema => emaHelper.includeEmaValue(candlesDataSource, ema))
            new Bollinger(candlesDataSource).includeBollingerBands(20)
            
            return candlesDataSource[candlesDataSource.length - 1]
        }
    )

    let data = (await Promise.all(dataPromises)).flat()

    const headers = [
        'Fecha',
        // 'hora',
        'Cod',
        'Time Frame',
        'BBT',
        'BBB',
        'EMA 20'
    ]

    const rows = data.map((lastData, i) => {
        return [
            `${datetime.getUTCDate()}/${datetime.getUTCMonth() + 1}/${datetime.getUTCFullYear()}`,
            // datetime.toLocaleTimeString(),
            i + 1,
            getTimeframeMappings()[i],
            castDecimal(lastData.bbt20),
            castDecimal(lastData.bbb20),
            castDecimal(lastData.ema20)
            //`${cross.crossPrice.toFixed(4)}`.replace('.', ','),
        ]
    })

    console.log(data)

    //csvHelper.generateCSV(headers, rows, 'crosses.csv')

    tableHeader.innerHTML = `<tr>
            ${headers.map(header => `<th scope="col">${header}</th>`).join('')}
        </tr>`

    const body = rows.map(row => `<tr>
            ${row.map(cell => `<td>${cell}</td>`).join('')}
        </tr>`).join('')

    tableBody.innerHTML = body
    document.getElementById('copyTable').hidden = false
    setLoaderVisibility(false)

}


function getEmasToGenerate() {
    return [ 
        20
    ]
}

function getTimeframesToGenerate() {
    return [
        '1d',
        '1h',
        '30m',
        '15m',
        '5m',
        '3m',
        '1m'
    ]
}

function getTimeframeMappings() {
    return [
        '1 Day',
        '1 Hour',
        '30 Minutes',
        '15 Minutes',
        '5 Minutes',
        '3 Minutes',
        '1 Minute'
    ]
}

function copytable(el) {
    var urlField = document.getElementById(el)   
    var range = document.createRange()
    window.getSelection().removeAllRanges()
    range.selectNode(urlField)
    window.getSelection().addRange(range) 
    document.execCommand('copy')
}

function castDecimal(value, decimals = 2) {
    return `${value.toFixed(decimals)}`.replace('.', ',')
}


function setLoaderVisibility(visible) {
    visible? document.getElementById('loader').classList.remove("hidden"): document.getElementById('loader').classList.add("hidden")
}



