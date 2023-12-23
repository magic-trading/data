class Helpers {
    openWindow() {
        open(window.location.href, "_blank", "popup=1")
    }

    // Gradient Function
    colorGradient(percentage, color1, color2, color3) {
        let fade = percentage;

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

        const diffRed = color2.red - color1.red;
        const diffGreen = color2.green - color1.green;
        const diffBlue = color2.blue - color1.blue;

        const gradient = {
            red: parseInt(Math.floor(color1.red + (diffRed * fade)), 10),
            green: parseInt(Math.floor(color1.green + (diffGreen * fade)), 10),
            blue: parseInt(Math.floor(color1.blue + (diffBlue * fade)), 10),
        };
        return 'rgb(' + gradient.red + ',' + gradient.green + ',' + gradient.blue + ')';
    }

    castDecimal(value, decimals = (value > 10 ? 2: 4)) {
        if(value % 1 == 0) {
            return value
        }
        return `${value.toFixed(decimals)}`.replace('.', ',')
    }
}

export default new Helpers()