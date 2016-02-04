var NONE = 0;
var IN_PROGRESS = 1;
var COMPLETE = 2;

function InputManager(canvas, grid, pubsub, default_sprite) {
    this.canvas = canvas;
    this.grid = grid;
    this.pubsub = pubsub;

    this.sprite = default_sprite;
    this.mouse_pos = Coord.from_mouse(canvas, {x: 0, y: 0});

    this.selection = new Set();
    this.select_status = NONE;
    this.dragging = false;
    this.painting = false;

    this.pubsub.subscribe("draw", this.draw.bind(this));
    this.pubsub.subscribe("request_sprite", this.request_sprite.bind(this));
};

InputManager.prototype.register_listeners = function(canvas) {
    canvas.addEventListener("mousemove", this.mousemove.bind(this));
    canvas.addEventListener("mousedown", this.mousedown.bind(this));
    canvas.addEventListener("mouseup", this.mouseup.bind(this));
    canvas.addEventListener("mouseout", this.mouseout.bind(this));
};

InputManager.prototype.mousedown = function(evt) {
    var coord = Coord.from_mouse(this.canvas, evt);
    if (evt.button === MOUSE_LEFT) {
        if (this.selection && this.selection.has(coord)) { // TODO: make Selection; essentially a set of coords
            this.dragging = true;
            console.warn("dragging is unimplemented");
        } else {
            this.select_status = NONE;
            this.selection.clear();

            this.painting = true;
            this.pubsub.emit("request_paint",
                 {coord: this.mouse_pos,
                  sprite: this.sprite});
        }
    } else if (evt.button === MOUSE_RIGHT) {
        if (!(evt.ctrlKey)) {
            this.selection.clear();
        }
        this.select_status = IN_PROGRESS;
        this.select_origin = coord;
    }
};

InputManager.prototype.mousemove = function(evt) {
    this.mouse_pos = Coord.from_mouse(this.canvas, evt);
    if (this.painting) {
        this.pubsub.emit("request_paint",
                         {coord: this.mouse_pos,
                          sprite: this.sprite});
    } else if (this.dragging) {
        console.warn("dragging is unimplemented");
    }
};

InputManager.prototype.mouseup = function(evt) {
    if (evt.button === MOUSE_LEFT) {
        if (this.painting) {
            this.painting = false;
        } else if (this.dragging) {
            this.dragging = false;
            console.warn("dragging is unimplemented");
        }
    } else if (evt.button === MOUSE_RIGHT) {
        this.select_status = COMPLETE;
        this.add_mouse_selection(this.select_origin,
                                 this.mouse_pos);
    }
};

InputManager.prototype.mouseout = function(evt) {
    // this.painting = false;
    // this.dragging = false;
    if (this.select_status === IN_PROGRESS) {
        this.select_status = COMPLETE;
        this.add_mouse_selection(this.select_origin,
                                 this.mouse_pos);

    }
};

InputManager.prototype.add_mouse_selection = function(coord1, coord2) {
    var grid_rr_1 = Math.min(coord1.to_grid_rr(), coord2.to_grid_rr());
    var grid_cc_1 = Math.min(coord1.to_grid_cc(), coord2.to_grid_cc());
    var grid_rr_2 = Math.max(coord1.to_grid_rr(), coord2.to_grid_rr());
    var grid_cc_2 = Math.max(coord1.to_grid_cc(), coord2.to_grid_cc());

    if (this.grid.inbounds(Coord.from_grid({rr: grid_rr_1, cc: grid_cc_1}))) {
        grid_rr_1 = clamp(0, grid_rr_1, this.grid.height()-1);
        grid_cc_1 = clamp(0, grid_cc_1, this.grid.width()-1);
        grid_rr_2 = clamp(0, grid_rr_2, this.grid.height()-1);
        grid_cc_2 = clamp(0, grid_cc_2, this.grid.width()-1);
        for (var rr = grid_rr_1; rr <= grid_rr_2; ++rr) {
            for (var cc = grid_cc_1; cc <= grid_cc_2; ++cc) {
                this.selection.add(Coord.from_grid({rr: rr, cc: cc}));
            }
        }
    }
    // console.log(this.selection);
};

// TODO: deprecated
InputManager.prototype.current_tool = function() {
    return $("input[name=tool_select]:checked").val();
};

// pubsub
InputManager.prototype.request_sprite = function(args) {
    var sprite = args.sprite;

    this.sprite = sprite;
};

// pubsub
InputManager.prototype.draw = function(args) {
    var ctx = args.ctx;

    // switch (this.current_tool()) {
    // case "place":
    //     draw_centered(ctx, this.sprite, this.mouse_pos.to_canvas());
    //     break;
    // case "select":
    //     break;
    // case "move":
    //     draw_centered(ctx, $("img#move_cursor")[0], this.mouse_pos.to_canvas());
    //     break;
    // default:
    //     console.error("switch fall-through");
    // }
    if (this.moving) {
        console.warn("move tool is unimplemented");
    }
    // in-progress select rect
    if (this.select_status === IN_PROGRESS) {
        draw_rect(ctx,
                  this.select_origin.to_canvas_x(),
                  this.select_origin.to_canvas_y(),
                  this.mouse_pos.to_canvas_x(),
                  this.mouse_pos.to_canvas_y(),
                  "blue",
                  0.2);
    } else if (this.select_status === COMPLETE) {
        // completed select rect
        this.selection.forEach(function (coord) {
            draw_rect(ctx,
                      coord.to_canvas_x(),
                      coord.to_canvas_y(),
                      coord.to_canvas_x() + Grid.pix,
                      coord.to_canvas_y() + Grid.pix,
                      "blue",
                      0.2);
        });
    }
};