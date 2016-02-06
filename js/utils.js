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

function fill_rect(ctx, x1, y1, x2, y2, color, alpha) {
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

function bool_to_int(b) {return b ? 1 : 0}

function readSingleFile(evt) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0];

    if (f) {
        var r = new FileReader();
        r.onload = function(e) {
            var contents = e.target.result;
            alert( "Got the file.n"
                +"name: " + f.name + "n"
                +"type: " + f.type + "n"
                +"size: " + f.size + " bytesn"
                + "starts with: " + contents.substr(1, contents.indexOf("n"))
            );
        }
        r.readAsText(f);
    } else {
        alert("Failed to load file");
    }
}

PIX = 24;
