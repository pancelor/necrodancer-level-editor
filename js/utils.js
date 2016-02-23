// http://stackoverflow.com/a/9722502/2281633
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

    draw_with(ctx, {alpha: alpha, color: color}, function(ctx) {
        ctx.fillRect(x1, y1, width, height);
    });
}

function draw_with(ctx, settings, callback) {
    // prep
    if ("alpha" in settings) {
        var old_alpha = ctx.globalAlpha;
        ctx.globalAlpha = settings.alpha;
    }
    if ("color" in settings) {
        var old_color = ctx.fillStyle;
        ctx.fillStyle = settings.color;
    }

    // draw
    callback(ctx)

    // cleanup
    if ("alpha" in settings) {
        ctx.globalAlpha = old_alpha;
    }
    if ("color" in settings) {
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

// http://stackoverflow.com/a/15252131/2281633
function fuzzy_match(string, target) {
    var hay = string.toLowerCase(), i = 0, n = -1, l;
    s = target.toLowerCase();
    for (; l = s[i++] ;) if (!~(n = hay.indexOf(l, n + 1))) return false;
    return true;
}

// adapted from https://github.com/aj0strow (https://github.com/lodash/lodash/issues/1379)
function chunk_by(collection, predicate) {
    var chunks = [];
    var prev_key = null;
    var chunk_values = [];
    _(collection).each(function (value) {
        var key = predicate(value);
        if (key == prev_key) {
            chunk_values.push(value);
        } else {
            // Guard against init values
            if (chunk_values.length) {
                chunks.push([prev_key, chunk_values]);
            }
            prev_key = key;
            chunk_values = [value];
        }
    });
    // Push hanging values
    if (chunk_values.length) {
        chunks.push([prev_key, chunk_values]);
    }
    return chunks;
}

function split_chunks(collection, predicate) {
  // Note that this is not quite string.split:
  //   "0120030".split("0")
  //   ["", "12", "", "3", ""]
  //
  //   split_chunks([0,1,2,0,0,3,0], function(x){return x==0});
  //   [[1, 2], [3]]
    return _
        .chain(chunk_by(collection, predicate))
        .reject(0)
        .map(1)
        .value();
}

function intersperse(array_of_arrays, sep) {
    var result = _.chain(_(array_of_arrays).head());
    _(array_of_arrays).tail().forEach(function(arr){
        if (sep != undefined) {
            result = result.concat(sep);
        }
        result = result.concat(arr);
    });
    return result.value();
}

// http://stackoverflow.com/a/16436975
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}