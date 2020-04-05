class Settings {
    static OVERRIDE_MAPPINGS = {
        'resolution': (v) => {return Math.pow(2, Number(v) - 3)},
        'startColor': (v) => {return v},
        'endColor': (v) => {return v},
        'fieldLineColor': (v) => {return v},
    };

    constructor(propertyNames) {
        let settings = this;
        for (let i = 0; i < propertyNames.length; i++) {
            let name = propertyNames[i];
            let element = document.getElementById(name);
            this.set(name, element.value);
            element.onchange = (event) => settings.update(name, event.target.value);
        }
    }

    set(name, value) {
        this[name] = Settings.OVERRIDE_MAPPINGS[name] ? Settings.OVERRIDE_MAPPINGS[name](value) : Number(value);
        console.log('set ' + name + ' to ' + this[name]);
    }

    update(name, value) {
        let oldValue = this[name];
        this.set(name, value);
        if (this.onchange && this[name] != oldValue) this.onchange();
    }
}