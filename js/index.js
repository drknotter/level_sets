var SELECTION_RADIUS = 20;
var DT = 1e-2;


var context;
var potentialField;

var hoveredParticle = null;
var hoveredFieldLineInfo = null;
var hoveredPosition = null;
var downInfo = null;
var resolution = 0.25;

var isRetinaMode = false;

var levelCount = 6;
var levelSpread = 0.4;

var clamp = function(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

var luminance;
var fieldLines;

function canvasDown(e) {
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
        isRetinaMode = !isRetinaMode;
        if (isRetinaMode) {
            resolution = window.devicePixelRatio || 1;
        } else {
            resolution = 0.25;
        }
        canvasResize();
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

function canvasResize() {
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = resolution * w;
    canvas.height = resolution * h;
    context.scale(resolution, resolution);

    luminance = new Luminance(
        context.createImageData(canvas.width, canvas.height),
        context.createImageData(canvas.width, canvas.height), resolution);
    fieldLines.maxLength = 3 * Math.max(w, h);

    draw(true, false);
}


function setUp(canvas) {
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    canvas.onmousedown = canvasDown;
    canvas.onmousemove = canvasMove;
    canvas.onmouseup = canvasUp;
    canvas.onwheel = canvasWheel;
    canvas.onkeydown = canvasKey;

    potentialField = new PotentialField(60);
    fieldLines = new FieldLines(3 * Math.max(canvas.width, canvas.height));

    canvasResize();
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
    window.onresize = canvasResize;
})();
