// http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
CanvasRenderingContext2D.prototype.clear =
    CanvasRenderingContext2D.prototype.clear || function (preserveTransform) {
        if (preserveTransform) {
            this.save();
            this.setTransform(1, 0, 0, 1, 0, 0);
        }

        this.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (preserveTransform) {
            this.restore();
        }
    };

function draw_centered(ctx, image, pos) {
    // TODO: center properly; something about the scaling is wonky
    ctx.drawImage(image,
                  pos.x - (image.width / 2),
                  pos.y - (image.height / 2));
}

function draw_rect(ctx, x1, y1, x2, y2, color, alpha) {
    var width = x2 - x1;
    var height = y2 - y1;
    if (alpha) {
        var old_alpha = ctx.globalAlpha;
        ctx.globalAlpha = alpha;
    }
    if (color) {
        var old_color = ctx.fillStyle;
        ctx.fillStyle = color;
    }

    ctx.fillRect(x1, y1, width, height);

    // cleanup
    if (alpha) {
        ctx.globalAlpha = old_alpha;
    }
    if (color) {
        ctx.fillStyle = old_color;
    }
}

function clamp(x, a, b) {
    var lower = Math.min(a, b);
    var higher = Math.max(a, b);
    return Math.max(lower, Math.min(x, higher));
}

function removeByIndex(array, index){
    array.splice(index, 1);
}

MOUSE_LEFT = 0;
MOUSE_MIDDLE = 1;
MOUSE_RIGHT = 2;

PIX = 32;
