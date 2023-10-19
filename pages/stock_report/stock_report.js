import api from "../../helpers/api.js"
import Bollinger from "../../helpers/bollinger.js"
import emaHelper from "../../helpers/ema.js"

const now = new Date();
now.setHours( (new Date().getHours()) - (new Date().getTimezoneOffset() / 60) )

// document.getElementById('datetime').value = now.toISOString().substring(0, 16)
document.getElementById('button').addEventListener('click', generateCSV)
document.getElementById('copyTable').hidden = true
document.getElementById('copyTable').addEventListener('click', ()=> copytable('tableBody'))

setLoaderVisibility(false)


async function generateCSV() {
    setLoaderVisibility(true)

    const datetimeValue = document.getElementById('datetime').value
    const symbol = document.getElementById('symbol').value
    const count = document.getElementById('count').value

    console.log(datetimeValue)

    const datetime =  datetimeValue? new Date(datetimeValue): new Date()

    console.log(datetime)

    const dataPromises = getTimeframesToGenerate().map(
        async timeframe => {
            const candlesDataSource = await api.getCandleData(symbol, timeframe, 1500, undefined, datetime)

            getEmasToGenerate().forEach(ema => emaHelper.includeEmaValue(candlesDataSource, ema))
            new Bollinger(candlesDataSource).includeBollingerBands(20)
            
            return candlesDataSource.slice(candlesDataSource.length - count)
        }
    )

    let data = (await Promise.all(dataPromises))

    const headers = [
        'Time Frame'
    ].concat(Array.from({length: count}, (x, i) => i==0? "Ahora":""));

    const rows = data.map((lastData, i) => {
        lastData.reverse()
        const max = Math.max(...lastData.map(c => (c.bbt20 - c.bbb20) * 0.3333));

        const min = Math.min(...lastData.map(c => (c.bbt20 - c.bbb20) * 0.3333));

        const getPercentage = (value) => {
            const range = max - min;

            const valueWithinRange = value - min

            return valueWithinRange / range
        }

        const cells = lastData.map((candle) => ({
            value: castDecimal((candle.bbt20 - candle.bbb20) * 0.3333, 4),
            background: colorGradient(getPercentage((candle.bbt20 - candle.bbb20) * 0.3333))
        }))

        return [
            getTimeframeMappings()[i]
        ].concat(cells)
    })


    tableHeader.innerHTML = `
        <tr>
            <th scope="col" colspan="${headers.length}">GAP 33%</th>
        </tr>
        <tr>
            ${headers.map(header => `<th scope="col">${header}</th>`).join('')}
        </tr>`

    const body = rows.map(row => `<tr>
            ${row.map(cell => `<td ${cell.background? `style="background-color: ${cell.background}"`: ''}>${cell.value? cell.value: cell}</td>`).join('')}
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

// Gradient Function
function colorGradient(percentage) {

    let color1 = {
    red: 255, green: 105, blue: 105
    };
    let color2 = {
        red: 245, green: 233, blue: 130
    };
    let color3 = {
        red: 99, green: 190, blue: 123
    };

    console.log('>> fade: ', percentage)
    var fade = percentage;

    // Do we have 3 colors for the gradient? Need to adjust the params.
    if (color3) {
      fade = fade * 2;

      // Find which interval to use and adjust the fade percentage
      if (fade >= 1) {
        fade -= 1;
        color1 = color2;
        color2 = color3;
      }
    }

    var diffRed = color2.red - color1.red;
    var diffGreen = color2.green - color1.green;
    var diffBlue = color2.blue - color1.blue;

    var gradient = {
      red: parseInt(Math.floor(color1.red + (diffRed * fade)), 10),
      green: parseInt(Math.floor(color1.green + (diffGreen * fade)), 10),
      blue: parseInt(Math.floor(color1.blue + (diffBlue * fade)), 10),
    };
    return 'rgb(' + gradient.red + ',' + gradient.green + ',' + gradient.blue + ')';
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


