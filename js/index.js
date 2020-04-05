var SELECTION_RADIUS = 20;

var context;
var potentialField;

var hoveredParticle = null;
var hoveredFieldLineInfo = null;
var hoveredPosition = null;
var downInfo = null;

var clamp = function(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

var luminance;
var fieldLines;
var settings;

function canvasDown(e) {
    if (hoveredParticle) {
        downInfo = {dx: hoveredParticle.x - e.x, dy: hoveredParticle.y - e.y};
    } else if (hoveredFieldLineInfo) {
        downInfo = {dx: hoveredFieldLineInfo.x - e.x, dy: hoveredFieldLineInfo.y - e.y};
    }
}

function canvasMove(e) {
    e.target.focus();
    let x = e.x;
    let y = e.y;
    hoveredPosition = {x: x, y: y};

    if (downInfo) {
        if (hoveredParticle) {
            hoveredParticle.x = downInfo.dx + e.x;
            hoveredParticle.y = downInfo.dy + e.y;
        } else if (hoveredFieldLineInfo) {
            hoveredFieldLineInfo.fieldLine.x = downInfo.dx + e.x;
            hoveredFieldLineInfo.fieldLine.y = downInfo.dy + e.y;
        }
        draw();
    } else {
        let info = potentialField.nearestInfo(e.x, e.y);
        let lastHoveredParticle = hoveredParticle;
        let lasthoveredFieldLineInfo = hoveredFieldLineInfo;
        if (info.distance < SELECTION_RADIUS ) {
            hoveredParticle = info.particle;
            hoveredFieldLineInfo = null;
        } else {
            hoveredParticle = null;
            let info = fieldLines.nearestInfo(e.x, e.y);
            if (info.distance < SELECTION_RADIUS) {
                hoveredFieldLineInfo = info;
            } else {
                hoveredFieldLineInfo = null;
            }
        }
        if (hoveredParticle != lastHoveredParticle || hoveredFieldLineInfo != lasthoveredFieldLineInfo) {
            draw();
        }
    }
}

function canvasUp(e) {
    if (downInfo) {
        downInfo = null;
        draw();
    }
}

function canvasOut(e) {
    downInfo = null;
    hoveredParticle = null;
    hoveredFieldLineInfo = null;
    draw();
}

function canvasWheel(e) {
    if (hoveredParticle) {
        hoveredParticle.charge -= 10 * e.deltaY;
        draw();
    }
}

function canvasKey(e) {
    if (e.key == 'd') {
        if (hoveredParticle) {
            hoveredParticle = null;
            potentialField.particles.splice(potentialField.particles.indexOf(hoveredParticle), 1);
            draw();
        } else if (hoveredFieldLineInfo) {
            fieldLines.fieldLines.splice(fieldLines.fieldLines.indexOf(hoveredFieldLineInfo.fieldLine), 1);
            hoveredFieldLineInfo = null;
            draw();
        }
    } else if (!hoveredParticle && hoveredPosition) {
        if (e.key == 'a') {
            potentialField.particles.push(new Particle(hoveredPosition.x, hoveredPosition.y, 1e3));
            draw();
        } else if (e.key == 's') {
            fieldLines.newFieldLine(hoveredPosition.x, hoveredPosition.y);
            draw();
        }
    }
}

function canvasResize() {
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = settings.resolution * w;
    canvas.height = settings.resolution * h;

    luminance = new Luminance(
        context.createImageData(canvas.width, canvas.height),
        context.createImageData(canvas.width, canvas.height), settings.resolution);
    fieldLines.maxLength = 3 * Math.max(w, h);

    draw();
}


function setUp(canvas) {
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    canvas.onmousedown = canvasDown;
    canvas.onmousemove = canvasMove;
    canvas.onmouseup = canvasUp;
    canvas.onmouseout = canvasOut;
    canvas.onwheel = canvasWheel;
    canvas.onkeydown = canvasKey;

    potentialField = new PotentialField(60);
    fieldLines = new FieldLines(3 * Math.max(canvas.width, canvas.height));
    settings = new Settings(["resolution", "levelCount", "levelSpread", "particleRadius", "levelColors", "fieldLineWidth", "fieldLineColor"]);
    settings.onchange = canvasResize;

    canvasResize();
}


function draw() {
    context.save();

    context.scale(settings.resolution, settings.resolution);

    fieldLines.update(potentialField);
    luminance.update(potentialField, settings.levelCount, settings.levelSpread, settings.levelColors, settings.particleRadius);

    luminance.draw(context);
    fieldLines.draw(context, settings.fieldLineWidth, settings.fieldLineColor);

    if (hoveredParticle && !downInfo) {
        hoveredParticle.draw(context);
    }
    if (hoveredFieldLineInfo) {
        hoveredFieldLineInfo.fieldLine.draw(context, settings.fieldLineWidth, settings.fieldLineColor, true);
    }

    context.restore();
}

(function() {
    document.body.style.overflow = 'hidden';
    let canvas = document.getElementById("canvas");
    context = canvas.getContext('2d');
    setUp(canvas);
    window.onresize = canvasResize;
})();
