PIX = 24;

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

// http://stackoverflow.com/a/15252131/2281633
function fuzzy_match(string, target) {
    var hay = string.toLowerCase(), i = 0, n = -1, l;
    s = target.toLowerCase();
    for (; l = s[i++] ;) if (!~(n = hay.indexOf(l, n + 1))) return false;
    return true;
}

function chunk_by(collection, predicate) {
  var chunks = []
  var prevKey = null
  var chunkValues = []
  _(collection).each(function (value) {
    var key = predicate(value)
    if (key == prevKey) {
      chunkValues.push(value)
    } else {
      // Guard against init values
      if (chunkValues.length) {
        chunks.push([ prevKey, chunkValues ])
      }
      prevKey = key
      chunkValues = [ value ]
    }
  });
  // Push hanging values
  if (chunkValues.length) {
    chunks.push([ prevKey, chunkValues ])
  }
  return chunks
}

function split_by(collection, predicate) {
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
