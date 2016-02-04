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
};

Coord.from_canvas = function(pos) {
    return new Coord(pos);
};

Coord.from_grid = function(pos) {
    return new Coord({x: pos.cc*Grid.pix, y: pos.rr*Grid.pix});
};



Coord.prototype.to_canvas = function() {
    return {x: this.canvas_pos.x, y: this.canvas_pos.y}; // TODO: need to copy?
};

Coord.prototype.to_grid = function() {
    return {cc: Math.floor(this.canvas_pos.x / Grid.pix),
            rr: Math.floor(this.canvas_pos.y / Grid.pix)};
};


// convinience:

Coord.prototype.to_canvas_x = function() {
    return (this.to_canvas()).x;
};

Coord.prototype.to_canvas_y = function() {
    return (this.to_canvas()).y;
};

Coord.prototype.to_grid_rr = function() {
    return (this.to_grid()).rr;
};

Coord.prototype.to_grid_cc = function() {
    return (this.to_grid()).cc;
};
