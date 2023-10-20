import api from "../../helpers/api.js"
import Bollinger from "../../helpers/bollinger.js"
import emaHelper from "../../helpers/ema.js"

let timeout = 0

// document.getElementById('datetime').value = now.toISOString().substring(0, 16)
document.getElementById('button').addEventListener('click', generateCSV)
document.getElementById('copyTable').hidden = true
document.getElementById('copyTable').addEventListener('click', ()=> copytable('tableBody'))

const defaultTimeframes = ['1m', '3m', '5m', '15m', "30m"];

$(document).ready(function() {
    $('#timeframes').select2();
    $('#timeframes').val(defaultTimeframes).trigger('change');
});

setLoaderVisibility(false)


async function generateCSV() {
    clearTimeout(timeout)
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

            candlesDataSource.reverse()
            
            return {timeframe: getTimeframeMappings()[timeframe], candles: candlesDataSource}
        }
    )

    let data = (await Promise.all(dataPromises))

    const headers = [
        'Time Frame'
    ].concat(Array.from({length: Number(count)}, (x, i) => i==0? "Ahora":""));

    const maxTimeframeMinutes = data[0]?.timeframe?.minutes

    const lastBigCandleDatetime =  data[0]?.candles[count - 1].open_time

    const rows = data.map(({timeframe, candles}, i) => {
        const lastIndex = candles.findIndex((c) => c.open_time < lastBigCandleDatetime)

        candles = candles.slice(0, i == 0? Number(count): lastIndex != -1? lastIndex: undefined)

        const max = Math.max(...candles.map(c => (c.bbt20 - c.bbb20) * 0.3333));

        const min = Math.min(...candles.map(c => (c.bbt20 - c.bbb20) * 0.3333));

        const getPercentage = (value) => {
            const range = max - min;

            const valueWithinRange = value - min

            return valueWithinRange / range
        }

        const fisrtColspan = data[data.length - 1]?.candles?.filter((c) => c.open_time >= candles[0]?.open_time)?.length * data[data.length - 1]?.timeframe?.minutes
        
        const cells = candles.map((candle, i) => {
            return ({
            value: castDecimal((candle.bbt20 - candle.bbb20) * 0.3333),
            background: colorGradient(getPercentage((candle.bbt20 - candle.bbb20) * 0.3333)),
            colspan: i == 0? fisrtColspan: timeframe.minutes,
            openTime: candle.open_time
        })})

        return [
            timeframe.label
        ].concat(cells)
    })


    tableHeader.innerHTML = `
        <tr>
            <th scope="col" colspan="${((headers.length - 1) * maxTimeframeMinutes) + 1}">GAP 33%</th>
        </tr>
        <tr>
            ${headers.map((header, i) => `
                <th 
                    scope="col" 
                    colspan="${rows[0][i].colspan}
                ">
                    <div style="position: relative; ${i > 0? "font-size: 13px; font-weight: 300;": ""}">
                        <div class="${i == 1 ? "timetag": ""}" style="right: calc(100% - 50px)"> 
                            ${i == 0? header: i == 1? maxTimeframeMinutes <= 60? datetime.toTimeString().slice(0, 5): datetime.toLocaleString(): ""}
                        </div>
                        <div class="${i == 0 || i == headers.length - 1? "": "timetag"}"> 
                            ${i == 0 || i == headers.length - 1? "": maxTimeframeMinutes <= 60? rows[0][i].openTime.toTimeString().slice(0, 5): rows[0][i].openTime.toLocaleString()}
                        </div>
                    </div>
                </th>`)
            .join('')}
        </tr>`
    

    const body = rows.map((row, i) => `<tr>
            ${row.map(cell => 
                `<td 
                    ${cell.background? `style="background-color: ${cell.background}"`: ''} 
                    ${cell.colspan? `colspan="${cell.colspan}"`: ''}
                >
                    ${!cell.colspan || i < rows.length - 2 || i < 1 ? (cell.value? cell.value: cell) : ''}
                </td>`
                ).join('')}
        </tr>`).join('')

    tableBody.innerHTML = body
    document.getElementById('copyTable').hidden = false
    setLoaderVisibility(false)

    timeout = setTimeout(generateCSV, 5000)
}

function getEmasToGenerate() {
    return [ 
        20
    ]
}

function getTimeframesToGenerate() {
    return $('#timeframes').val()
}

function copytable(el) {
    var urlField = document.getElementById(el)   
    var range = document.createRange()
    window.getSelection().removeAllRanges()
    range.selectNode(urlField)
    window.getSelection().addRange(range) 
    document.execCommand('copy')
}

function castDecimal(value, decimals) {
    decimals = decimals !== undefined? decimals: value > 10? 2: 4
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
    return {
        "1m": {
            label: "1 min",
            minutes: 1
        },
        "3m": {
            label: "3 min",
            minutes: 3
        },
        "5m": {
            label: "5 min",
            minutes: 5
        },
        "15m": {
            label: "15 min",
            minutes: 15
        },
        "30m": {
            label: "30 min",
            minutes: 30
        },
        "1h": {
            label: "1 hora",
            minutes: 60
        },
        "2h": {
            label: "2 horas",
            minutes: 120
        },
        "12h": {
            label: "12 horas",
            minutes: 720
        },
        "1d": {
            label: "1 día",
            minutes: 1440
        },
        "1w": {
            label: "1 semana",
            minutes: 10080
        },
    }
}



