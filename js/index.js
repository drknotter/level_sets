var SELECTION_RADIUS = 20;
var DT = 1e-2;
var WIDTH = 1920;
var HEIGHT = 1080;

var context;
var potentialField;

var hoveredParticle = null;
var hoveredFieldLineInfo = null;
var hoveredPosition = null;
var downInfo = null;

var isRetinaMode = false;

var levelCount = 6;
var levelSpread = 0.4;

var clamp = function(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

var luminance;
var fieldLines;

function canvasDown(e) {
    console.log(e.target.cursor);
    if (hoveredParticle) {
        downInfo = {dx: hoveredParticle.x - e.x, dy: hoveredParticle.y - e.y};
        e.target.style.cursor = 'none';
    } else if (hoveredFieldLineInfo) {
        downInfo = {dx: hoveredFieldLineInfo.x - e.x, dy: hoveredFieldLineInfo.y - e.y};
        e.target.style.cursor = 'none';
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
        draw(true, false);
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
            draw(false, false);
        }
    }
}

function canvasUp(e) {
    if (downInfo) {
        downInfo = null;
        e.target.style.cursor = '';
        draw(true, false);
    }
}

function canvasWheel(e) {
    if (hoveredParticle) {
        hoveredParticle.charge -= 10 * e.deltaY;
        draw(true, false);
    } else {
        if (e.shiftKey) {
            levelSpread -= 0.01 * e.deltaY;
            draw(true, false);
        } else if (e.ctrlKey) {
            levelCount -= 0.01 * e.deltaY;
            draw(true, false);
        } else {
            potentialField.particleRadius -= 0.1 * e.deltaY;
            draw(true, false);
        }
    }
}

function canvasKey(e) {
    if (e.key == 'r') {
        let scale = window.devicePixelRatio || 1;
        if (isRetinaMode) {
            canvas.style.width = '';
            canvas.style.height = '';
            canvas.width = WIDTH / scale;
            canvas.height = HEIGHT / scale;
            context.scale(1, 1);
            luminance = new Luminance(
                context.createImageData(canvas.width, canvas.height),
                context.createImageData(canvas.width, canvas.height));
        } else {
            canvas.style.width = (WIDTH / scale) + 'px';
            canvas.style.height = (HEIGHT / scale) + 'px';
            canvas.width = WIDTH;
            canvas.height = HEIGHT;
            context.scale(scale, scale);
            luminance = new Luminance(
                context.createImageData(canvas.width, canvas.height),
                context.createImageData(canvas.width, canvas.height), scale);
        }
        isRetinaMode = !isRetinaMode;
        draw(true, false);
    } else if (e.key == 'd') {
        if (hoveredParticle) {
            hoveredParticle = null;
            potentialField.particles.splice(potentialField.particles.indexOf(hoveredParticle), 1);
            draw(true, false);
        } else if (hoveredFieldLineInfo) {
            fieldLines.fieldLines.splice(fieldLines.fieldLines.indexOf(hoveredFieldLineInfo.fieldLine), 1);
            hoveredFieldLineInfo = null;
            draw(true, false);
        }
    } else if (!hoveredParticle && hoveredPosition) {
        if (e.key == 'a') {
            potentialField.particles.push(new Particle(hoveredPosition.x, hoveredPosition.y, 1e3));
            draw(true, false);
        } else if (e.key == 't') {
            drawTriangulation();
        } else if (e.key == 's') {
            fieldLines.newFieldLine(hoveredPosition.x, hoveredPosition.y);
            draw(true, false);
        }
    }
}

function setUp(canvas) {
    canvas.width = WIDTH / scale;
    canvas.height = HEIGHT / scale;

    canvas.onmousedown = canvasDown;
    canvas.onmousemove = canvasMove;
    canvas.onmouseup = canvasUp;
    canvas.onwheel = canvasWheel;
    canvas.onkeydown = canvasKey;

    luminance = new Luminance(
        context.createImageData(canvas.width, canvas.height),
        context.createImageData(canvas.width, canvas.height));
    fieldLines = new FieldLines(3 * Math.max(canvas.width, canvas.height));
    potentialField = new PotentialField(60);
}


function draw(particlesUpdated, drawTriangulation) {
    context.save();

    let paths = [];
    if (particlesUpdated) {
        fieldLines.update(potentialField);
        luminance.update(potentialField, levelCount, levelSpread);
    }

    if (!drawTriangulation) {
        luminance.draw(context);
    }
    fieldLines.draw(context, drawTriangulation);

    if (hoveredParticle && !downInfo) {
        hoveredParticle.draw(context);
    }
    if (hoveredFieldLineInfo) {
        hoveredFieldLineInfo.fieldLine.draw(context, true);
    }

    context.restore();
}

function drawTriangulation() {
    fieldLines.update(potentialField);
    luminance.update(potentialField, levelCount, levelSpread);

    context.save();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    fieldLines.drawTriangulation(context, potentialField, luminance.levels);
    context.restore();
}

(function() {
    document.body.style.overflow = 'hidden';
    let canvas = document.getElementById("canvas");
    context = canvas.getContext('2d');
    setUp(canvas);
    draw(true, false);
})();
