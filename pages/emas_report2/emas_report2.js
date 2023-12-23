import Router from "../../routes/router.js"
import binanceAPI from "../../src/api/binanceAPI.js";
import timeframes from "../../src/config/timeframes.js";
import helpers from "../../src/helpers/helpers.js";
import templateHelper from "../../src/helpers/templateHelper.js";
import Crosses from "../../src/indicators/Crosses.js";
import Ema from "../../src/indicators/Ema.js";

Router.renderNavbar()

let timeout = 0

const AUTO_REFRESH_TIME = 5; // seconds
const DEFAULT_SYMBOL = 'BTCUSDT'

document.getElementById('symbol').value = localStorage.getItem('symbol') || DEFAULT_SYMBOL
document.getElementById('button').addEventListener('click', generateData)
document.getElementById('openWindow').addEventListener('click', helpers.openWindow)

const defaultTimeframes = ['1m', '3m', '5m', '15m', "30m", "1h"];

$(document).ready(function() {
    $('#timeframes').select2();
    $('#timeframes').val(defaultTimeframes).trigger('change');
    generateData() // GENERATE DATA WHEN OPENING
});

setLoaderVisibility(false)

async function generateData() {
    clearTimeout(timeout)
    setLoaderVisibility(true)

    const datetimeValue = document.getElementById('datetime').value
    const symbol = document.getElementById('symbol').value
    localStorage.setItem('symbol', symbol.toUpperCase())
    const count = document.getElementById('count').value

    const datetime =  datetimeValue? new Date(datetimeValue): new Date()

    const dataPromises = getTimeframesToGenerate().map(
        async timeframe => {
            const candlesDataSource = await binanceAPI.getCandleData(symbol, timeframe, 1500, undefined, datetime)

            getEmasToGenerate().forEach(ema => new Ema(candlesDataSource).includeEma(ema))

            candlesDataSource.reverse()
            
            return {timeframe: timeframes[timeframe], candles: candlesDataSource}
        }
    )

    
    let data = (await Promise.all(dataPromises))
    
    const lastPrice = data[0].candles[0].close

    setLastPriceTitle(lastPrice, symbol.toUpperCase())

    const headers = [
        'Time Frame'
    ].concat(Array.from({length: Number(count)}, (x, i) => i==0? "Ahora":""));

    const maxTimeframeMinutes = data[0]?.timeframe?.minutes

    const lastBigCandleDatetime =  data[0]?.candles[count - 1].open_time

    await templateHelper.preloadTemplates([
        'emas-report/tooltip',
        'emas-report/tooltip-cross',
        'emas-report/tooltip-ema',
    ])

    const rows = data.map(({timeframe, candles}, i) => {
        const lastIndex = candles.findIndex((c) => c.open_time < lastBigCandleDatetime)

        candles = candles.slice(0, i == 0? Number(count): lastIndex != -1? lastIndex: undefined)

        const expansionOrder = [...getEmasToGenerate()]

        const getPercentage = (candle) => {
            const diffPercents = [];

            const expansionOrderAux = [...expansionOrder]

            let keepChecking = true
            
            while (keepChecking && expansionOrderAux.length > 1) {
                const emaValuesOrdered = [...expansionOrderAux].sort((emaA, emaB) =>  Number(candle[`ema${emaB}`] - Number(candle[`ema${emaA}`])))

                if(JSON.stringify(expansionOrderAux) == JSON.stringify(emaValuesOrdered)) {
                    keepChecking = false
                    diffPercents.push(...Array.from({ length: expansionOrderAux.length - 1}, () => 1))
                    break;
                }

                if(JSON.stringify([...expansionOrderAux].reverse()) == JSON.stringify(emaValuesOrdered)) {
                    keepChecking = false
                    diffPercents.push(...Array.from({ length: expansionOrderAux.length - 1}, () => 0))
                    break;
                }
                // which emas can be removed to make the array ordered in up or down
                const emasToRemove = expansionOrderAux.filter(e => {
                    const expansionOrderAux2 = [...expansionOrderAux]
                    expansionOrderAux2.splice(expansionOrderAux2.indexOf(e), 1)

                    const expansionOrderAux2R = [...expansionOrderAux].reverse()
                    expansionOrderAux2R.splice(expansionOrderAux2R.indexOf(e), 1)

                    const emaValuesOrderedAux = [...emaValuesOrdered]
                    emaValuesOrderedAux.splice(emaValuesOrderedAux.indexOf(e), 1)

                    return JSON.stringify(expansionOrderAux2) == JSON.stringify(emaValuesOrderedAux)
                    || JSON.stringify(expansionOrderAux2R) == JSON.stringify(emaValuesOrderedAux)
                })

                if(emasToRemove.length > 0) {
                    expansionOrderAux.splice(expansionOrderAux.indexOf(emasToRemove.at(-1)), 1)
                }
                else {
                    const notOrderedValues = expansionOrderAux.filter((e, i) => e != emaValuesOrdered[i] && e != emaValuesOrdered.at(-1 - i))
                    expansionOrderAux.splice(expansionOrderAux.indexOf(notOrderedValues.at(-1)), 1)
                }
                diffPercents.push(0.5)
            }

            return diffPercents.reduce((a, b) => a + b, 0) / diffPercents.length;
        }

        getEmasToGenerate().forEach(emaA => getEmasToGenerate().forEach(emaB => emaA < emaB? new Crosses(candles).includeEmaCrosses(emaA, emaB): null))

        const crossesList = getEmasToGenerate().map(emaA => getEmasToGenerate().map(emaB => emaA < emaB? new Crosses(candles).getCrosses(emaA, emaB): []).flat()).flat() 

        const fisrtColspan = data[data.length - 1]?.candles?.filter((c) => c.open_time >= candles[0]?.open_time)?.length * data[data.length - 1]?.timeframe?.minutes
        
        const cells = candles.map((candle, i) => {
            const percentage = getPercentage(candle)

            const background = colorGradient(percentage)

            const crossesCandle = crossesList.filter(cross => cross.candleBefore == candle)

            const emaValuesOrdered = [...expansionOrder].sort((emaA, emaB) =>  Number(candle[`ema${emaB}`] - Number(candle[`ema${emaA}`])))

            const tooltip = templateHelper.render(
                'emas-report/tooltip', 
                {
                    openTime: candle.open_time.toTimeString().slice(0, 5), 
                    closePrice: helpers.castDecimal(candle.close),
                    closeColor: candle.close > candles.at(i + 1)?.close ? colorGradient(1) : colorGradient(0), 
                    crossesCandle, 
                    candle, 
                    emaValuesOrdered
                }
            )

            return ({
                value: crossesCandle.length > 0? crossesCandle.map(crossCandle => `<span class="cross-${crossCandle.swingType}">${crossCandle.emaA} ${crossCandle.swingType == 'up'? '↑': '↓'} ${crossCandle.emaB}</span>`).join('<br>'): ' ',
                valueSmall: crossesCandle.length > 0? crossesCandle.map(crossCandle => `<span class="cross-${crossCandle.swingType} small">${crossCandle.swingType == 'up'? '↑': '↓'}</span>`).join(''): ' ',
                background,
                colspan: i == 0? fisrtColspan: timeframe.minutes,
                openTime: candle.open_time,
                tooltip,
                percentage
            })
        })

        return [
            timeframe.label
        ].concat(cells)
    })


    tableHeader.innerHTML = `
        <tr>
            ${headers.map((header, i) => `
                <th 
                    scope="col" 
                    colspan="${rows[0][i].colspan}
                ">
                    <div style="position: relative; ${i > 0? "font-size: 13px; font-weight: 300;": ""}">
                        <div class="${i == 1 ? "timetag": ""}" style="right: calc(100% - 50px)"> 
                            ${i == 0? header: i == 1? maxTimeframeMinutes <= 120? datetime.toTimeString().slice(0, 5): datetime.toLocaleString(): ""}
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
                    style="text-align: center; ${cell.background? `background-color: ${cell.background}`: ''}" 
                    class="${cell.percentage == 1? 'swing-up' : cell.percentage == 0? 'swing-down': ''} ${cell.tooltip? 'tooltip': ''}"
                    ${cell.colspan? `colspan="${cell.colspan}"`: ''}
                >
                    ${!cell.colspan || i < rows.length - 2 || i < 3 ? (cell.value? cell.value: cell) : (cell.valueSmall? cell.valueSmall: cell)}
                    ${cell.tooltip? `<div class='tooltiptext' style="border-color: ${cell.background}">${cell.tooltip}</div>`: ''}
                </td>`
                ).join('')}
        </tr>`).join('')

    tableBody.innerHTML = body
    setLoaderVisibility(false)

    timeout = setTimeout(generateData, AUTO_REFRESH_TIME * 1000)
}

function getEmasToGenerate() {
    return [
        3,
        9,
        20,
        50,
        200,
    ]
}

function getTimeframesToGenerate() {
    return $('#timeframes').val()
}

function setLoaderVisibility(visible) {
    visible? document.getElementById('loader').classList.remove("hidden"): document.getElementById('loader').classList.add("hidden")
}

function setLastPriceTitle(price, symbol) {
    const $el = document.querySelector('#lastPrice')

    $el.innerHTML = `<span>${symbol}</span> ${castDecimal(price)}`
}

// Gradient Function
function colorGradient(percentage) {

    const color1 = {
    red: 255, green: 105, blue: 105
    };
    const color2 = {
        red: 245, green: 233, blue: 130
    };
    const color3 = {
        red: 99, green: 190, blue: 123
    };
    
    return helpers.colorGradient(percentage, color1, color2, color3)
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

function castDecimal(value, decimals = (value > 10 ? 2: 4)) {
    if(value % 1 == 0) {
        return value
    }
    return `${value.toFixed(decimals)}`.replace('.', ',')
}



