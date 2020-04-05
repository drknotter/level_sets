class Settings {
    static RGBAToHex(rgba) {
        let sep = rgba.indexOf(",") > -1 ? "," : " ";
        rgba = rgba.substr(5).split(")")[0].split(sep);

        let r = (+rgba[0]).toString(16),
            g = (+rgba[1]).toString(16),
            b = (+rgba[2]).toString(16);

        if (r.length == 1)
            r = "0" + r;
        if (g.length == 1)
            g = "0" + g;
        if (b.length == 1)
            b = "0" + b;

        return "#" + r + g + b;
    };

    static hexToRGB(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };


    static OVERRIDE_NAME_MAPPINGS = {
        'levelColors': () => {
            let gp = new Grapick({el: '#levelColors', colorEl: '<input type="" class="levelColorStop" style="width: 1em; height: 1em; position: relative; left:-0.5em; border-radius: 1em; border: 2px solid black; color: rgba(0,0,0,0)">'});
            gp.setColorPicker(handler => {
                let color = new jscolor(handler.getEl().querySelector('.levelColorStop'));
                color.valueElement.addEventListener('change', (event) => {
                    event.target.style.color = '#0000';
                    handler.setColor('#' + event.target.value);
                }, false);
                color.valueElement.style.color = '#0000';
                color.fromString(Settings.RGBAToHex(handler.getColor()));
                handler.setColor('#' + color.valueElement.value);
            });
            gp.addHandler(0, 'rgba(0,0,0,255)', 0);
            gp.addHandler(100, 'rgba(255,255,255,255)', 0);
            return gp;
        },
    };

    static OVERRIDE_CHANGE_LISTENERS = {
        'levelColors': (gp, settings) => {
            gp.on('change', (completed) => {if (completed) settings.update('levelColors', gp);});
        }
    }

    static OVERRIDE_OBJECT_MAPPINGS = {
        'resolution': (object) => {return Math.pow(2, Number(object.value) - 3)},
        'fieldLineColor': (object) => {return '#' + object.value},
        'levelColors': (gp) => {
            let colorStops = [];
            for (let i = 0; i < gp.getHandlers().length; i++) {
                colorStops.push({
                    position: 0.01 * gp.getHandlers()[i].getPosition(),
                    color: Settings.hexToRGB(gp.getHandlers()[i].getColor())
                });
            }
            colorStops = colorStops.sort((a, b) => {return a.position - b.position});
            return colorStops;
        },
    };

    constructor(propertyNames) {
        let settings = this;
        for (let i = 0; i < propertyNames.length; i++) {
            let name = propertyNames[i];
            let element = Settings.OVERRIDE_NAME_MAPPINGS[name]
                    ? Settings.OVERRIDE_NAME_MAPPINGS[name]()
                    : document.getElementById(name);
            this.set(name, element);
            if (Settings.OVERRIDE_CHANGE_LISTENERS[name]) {
                Settings.OVERRIDE_CHANGE_LISTENERS[name](element, settings);
            } else {
                element.onchange = (event) => {settings.update(name, event.target)};
            }
        }
    }

    set(name, object) {
        this[name] = Settings.OVERRIDE_OBJECT_MAPPINGS[name]
                ? Settings.OVERRIDE_OBJECT_MAPPINGS[name](object)
                : Number(object.value);
        console.log('set ' + name + ' to ' + this[name]);
    }

    update(name, object) {
        let oldValue = this[name];
        this.set(name, object);
        if (this.onchange && this[name] != oldValue) this.onchange();
    }
}