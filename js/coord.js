// don't call this constructor directly pls...
function Coord(canvas_pos) {
    this.canvas_pos = canvas_pos;
}

// ...use these three instead
Coord.from_mouse = function(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    var canvas_pos = {
        x: Math.round(evt.clientX - rect.left),
        y: Math.round(evt.clientY - rect.top)
    };
    return new Coord(canvas_pos);
}

Coord.from_canvas = function(pos) {
    return new Coord({x: pos.x, y: pos.y});
}

Coord.from_grid = function(pos) {
    return new Coord({x: pos.cc*PIX, y: pos.rr*PIX});
}



Coord.prototype.to_canvas = function() {
    return {x: this.canvas_pos.x, y: this.canvas_pos.y}; // TODO: need to copy?
}

Coord.prototype.to_grid = function() {
    return {cc: Math.floor(this.canvas_pos.x / PIX),
            rr: Math.floor(this.canvas_pos.y / PIX)};
}

Coord.prototype.snap_to_grid = function() {
    return Coord.from_grid(this.to_grid());
}


// convinience:

Coord.prototype.to_canvas_x = function() {
    return (this.to_canvas()).x;
}

Coord.prototype.to_canvas_y = function() {
    return (this.to_canvas()).y;
}

Coord.prototype.to_grid_rr = function() {
    return (this.to_grid()).rr;
}

Coord.prototype.to_grid_cc = function() {
    return (this.to_grid()).cc;
}

// other:

Coord.prototype.minus = function(other) {
    return Coord.from_canvas({
        x: this.to_canvas_x() - other.to_canvas_x(),
        y: this.to_canvas_y() - other.to_canvas_y()
    })
}

Coord.prototype.plus = function(other) {
    return Coord.from_canvas({
        x: this.to_canvas_x() + other.to_canvas_x(),
        y: this.to_canvas_y() + other.to_canvas_y()
    })
}

Coord.prototype.equals = function(other) {
    return _.isEqual(this.to_canvas(), other.to_canvas());
}

Coord.prototype.equals_by_grid = function(other) {
    return _.isEqual(this.to_grid(), other.to_grid());
}
