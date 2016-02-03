function MouseManager(canvas, default_contents) {
    this.canvas = canvas;
    this.contents = default_contents;
    this.pos = Coord.from_mouse(canvas, {x: 0, y: 0});

    this.moving = false;
    this.selecting = false;

    this.setup();
};

MouseManager.prototype.setup = function() {
    requestAnimationFrame(this.render.bind(this));
};

MouseManager.prototype.set_contents = function(contents) {
    this.contents = contents;
};

MouseManager.prototype.mousemove = function(coord) {
    this.pos = coord;
};

MouseManager.prototype.click = function(coord, grid) {
    switch ($("input[name=tool_select]:checked").val()) {
    case "place":
        grid.place_at_click(coord, this.contents);
        break;
    case "select":
        break;
    case "move":
        break;
    default:
        console.error("switch fall-through");
    }
};

MouseManager.prototype.mousedown = function(coord, grid) {
    switch ($("input[name=tool_select]:checked").val()) {
    case "place":
        break;
    case "select":
        if (grid.inbounds(coord)){
            this.selecting = true;
            this.select_origin = coord;
        }
        break;
    case "move":
        this.moving = true;
        break;
    default:
        console.error("switch fall-through");
    }
};

MouseManager.prototype.mouseup = function(coord, grid) {
    switch ($("input[name=tool_select]:checked").val()) {
    case "place":
        break;
    case "select":
        if (this.selecting){
            this.selecting = false;
            grid.select(this.select_origin, this.pos);
        }
        break;
    case "move":
        this.moving = false;
        break;
    default:
        console.error("switch fall-through");
    }
};

MouseManager.prototype.render = function() {
    var ctx = this.canvas.getContext('2d');
    ctx.clear();
    draw_centered(this.contents, this.pos, this.canvas);
    if (this.moving) {
        console.warn("unimplemented");
    }
    if (this.selecting) {
        draw_rect(ctx,
                  this.select_origin.to_canvas_x(),
                  this.select_origin.to_canvas_y(),
                  this.pos.to_canvas_x(),
                  this.pos.to_canvas_y(),
                  "blue",
                  0.2);
    }
    requestAnimationFrame(this.render.bind(this));
};