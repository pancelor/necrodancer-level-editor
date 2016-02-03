// don't call this constructor directly pls
function Coord(canvas, canvas_pos) {
    this.canvas = canvas;
    this.canvas_pos = canvas_pos;
}

Coord.from_mouse = function(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    var canvas_pos = {
        x: Math.round(evt.clientX - rect.left),
        y: Math.round(evt.clientY - rect.top)
    };
    return new Coord(canvas, canvas_pos);
};

Coord.from_canvas = function(canvas, pos) {
    return new Coord(canvas, pos);
};

Coord.from_grid = function(canvas, grid, pos) {
    return new Coord(canvas, {x: pos.cc*grid.pix, y: pos.rr*grid.pix});
};



Coord.prototype.to_canvas = function() {
    return {x: this.canvas_pos.x, y: this.canvas_pos.y}; // TODO: need to copy?
};

Coord.prototype.to_grid = function(grid) {
    return {cc: Math.floor(this.canvas_pos.x / grid.pix),
            rr: Math.floor(this.canvas_pos.y / grid.pix)};
};


// convinience:

Coord.prototype.to_canvas_x = function() {
    return (this.to_canvas()).x;
};

Coord.prototype.to_canvas_y = function() {
    return (this.to_canvas()).y;
};

Coord.prototype.to_grid_rr = function(grid) {
    return (this.to_grid(grid)).rr;
};

Coord.prototype.to_grid_cc = function(grid) {
    return (this.to_grid(grid)).cc;
};
