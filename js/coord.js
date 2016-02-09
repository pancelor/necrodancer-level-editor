// don't call this constructor directly pls...
function Coord(grid, canvas_pos) {
    this.grid = grid;
    this.canvas_pos = canvas_pos;
}

// ...use these three instead
Coord.from_mouse = function(canvas, grid, evt) {
    var rect = canvas.getBoundingClientRect();
    var canvas_pos = {
        x: Math.round(evt.clientX - rect.left),
        y: Math.round(evt.clientY - rect.top)
    };
    return new Coord(grid, canvas_pos);
}

Coord.from_canvas = function(pos) {
    return new Coord(undefined, {x: pos.x, y: pos.y});
}

Coord.from_grid = function(grid, pos) {
    return new Coord(grid, {
        x: pos.cc*grid.PIX + grid.embed_pos.x,
        y: pos.rr*grid.PIX + grid.embed_pos.y
    });
}



Coord.prototype.to_canvas = function() {
    return {x: this.canvas_pos.x, y: this.canvas_pos.y}; // TODO: need to copy?
}

Coord.prototype.to_grid = function() {
    if (!this.grid) {
        console.error("coord.grid is undefined")
    }
    return {cc: Math.floor((this.canvas_pos.x - this.grid.embed_pos.x) / this.grid.PIX),
            rr: Math.floor((this.canvas_pos.y - this.grid.embed_pos.y) / this.grid.PIX)};
}

Coord.prototype.snap_to_grid = function(grid) {
    return Coord.from_grid(grid ? grid : this.grid, this.to_grid());
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
    if (this.grid !== other.grid) {
        console.error("mismatched grids");
    }
    var coord = Coord.from_canvas({
        x: this.to_canvas_x() - other.to_canvas_x() + this.grid.embed_pos.x,
        y: this.to_canvas_y() - other.to_canvas_y() + this.grid.embed_pos.y
    });
    coord.grid = this.grid;
    return coord;
}

Coord.prototype.plus = function(other) {
    if (this.grid !== other.grid) {
        console.error("mismatched grids");
    }
    var coord = Coord.from_canvas({
        x: this.to_canvas_x() + other.to_canvas_x() - this.grid.embed_pos.x,
        y: this.to_canvas_y() + other.to_canvas_y() - this.grid.embed_pos.y
    });
    coord.grid = this.grid;
    return coord;
}

Coord.prototype.equals = function(other) {
    return _.isEqual(this.to_canvas(), other.to_canvas());
}

Coord.prototype.equals_by_grid = function(other) {
    return _.isEqual(this.to_grid(), other.to_grid());
}
