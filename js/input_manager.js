var NONE = 0;
var IN_PROGRESS = 1;
var COMPLETE = 2;

function InputManager(canvas, grid, pubsub, default_sprite) {
    this.canvas = canvas;
    this.grid = grid;
    this.pubsub = pubsub;

    this.sprite = default_sprite;
    this.mouse_pos = Coord.from_mouse(canvas, {x: 0, y: 0});

    this.selection = new CoordSet();
    this.select_status = NONE;
    // this.select_origin = undefined;
    this.dragging = false;
    // this.drag_origin = undefined;
    // this.dragging_to_copy = undefined;
    this.painting = false;
    this.erasing = false;

    this.pubsub.subscribe("draw", this.draw.bind(this));
    this.pubsub.subscribe("request_sprite", this.request_sprite.bind(this));
}

InputManager.prototype.register_listeners = function(canvas) {
    canvas.addEventListener("mousemove", this.mousemove.bind(this));
    canvas.addEventListener("mousedown", this.mousedown.bind(this));
    canvas.addEventListener("mouseup", this.mouseup.bind(this));
    canvas.addEventListener("mouseout", this.mouseout.bind(this));
    canvas.addEventListener("keydown", this.keydown.bind(this));
    canvas.addEventListener("keyup", this.keyup.bind(this));
}

InputManager.prototype.mousedown = function(evt) {
    var coord = Coord.from_mouse(this.canvas, evt);
    if (evt.button === MOUSE_LEFT) {
        if (this.selection && this.selection.has_by_grid(coord)) {
            this.dragging = true;
            this.drag_origin = coord;
            this.dragging_to_copy = evt.ctrlKey;
        } else {
            this.select_status = NONE;
            this.selection.clear();

            this.painting = true;
            this.pubsub.emit("request_paint",
                 {coord: coord,
                  sprite: this.sprite});
        }
    } else if (evt.button === MOUSE_RIGHT) {
        if (!(evt.ctrlKey)) {
            this.selection.clear();
        }
        this.select_status = IN_PROGRESS;
        this.select_origin = coord;
    } else if (evt.button === MOUSE_MIDDLE) {
        this.select_status = NONE;
        this.selection.clear();

        this.erasing = true;
        this.pubsub.emit("request_paint",
            {coord: coord,
             sprite: undefined});
    }
}

InputManager.prototype.mousemove = function(evt) {
    var coord = Coord.from_mouse(this.canvas, evt);
    this.mouse_pos = coord;
    if (this.painting) {
        this.pubsub.emit("request_paint",
                         {coord: coord,
                          sprite: this.sprite});
    } else if (this.erasing) {
        this.pubsub.emit("request_paint",
                         {coord: coord,
                          sprite: undefined});
    }
}

InputManager.prototype.mouseup = function(evt) {
    var coord = Coord.from_mouse(this.canvas, evt);
    if (evt.button === MOUSE_LEFT) {
        if (this.painting) {
            this.painting = false;
        } else if (this.dragging) {
            this.dragging = false;
            var delta = coord.snap_to_grid().minus(this.drag_origin.snap_to_grid());
            this.pubsub.emit("request_drag",
                             {delta: delta,
                              copy: this.dragging_to_copy,
                              selection: this.selection});

            // TODO: redo in one line with _.map when CoordSet s are iterable
            var shifted_selection = new CoordSet();
            this.selection.forEach(function(old_coord) {
                    shifted_selection.add(old_coord.plus(delta));
            });
            this.selection = shifted_selection; // TODO: errors when you drag the selection off-grid
        }
    } else if (evt.button === MOUSE_RIGHT) {
        this.select_status = COMPLETE;
        this.add_mouse_selection(this.select_origin,
                                 this.mouse_pos);
    } else if (evt.button === MOUSE_MIDDLE) {
        this.erasing = false;
    }
}

InputManager.prototype.mouseout = function(evt) {
    // this.painting = false;
    // this.dragging = false;
    if (this.select_status === IN_PROGRESS) {
        this.select_status = COMPLETE;
        this.add_mouse_selection(this.select_origin,
                                 this.mouse_pos);
    }
}

InputManager.prototype.keydown = function(evt) {
    console.log("keydown:");
    console.log(evt);
}

InputManager.prototype.keyup = function(evt) {
    console.log("keyup:");
    console.log(evt);
}

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
                this.selection.xor(Coord.from_grid({rr: rr, cc: cc}));
            }
        }
    }
    // console.log(this.selection);
}

// TODO: deprecated
InputManager.prototype.current_tool = function() {
    return $("input[name=tool_select]:checked").val();
}

// pubsub:

InputManager.prototype.request_sprite = function(args) {
    var sprite = args.sprite;

    this.sprite = sprite;
}

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
    // in-progress selection
    if (this.select_status === IN_PROGRESS) {
        draw_rect(ctx,
                  this.select_origin.to_canvas_x(),
                  this.select_origin.to_canvas_y(),
                  this.mouse_pos.to_canvas_x(),
                  this.mouse_pos.to_canvas_y(),
                  "blue",
                  0.25);
    }
    // completed selection
    this.selection.forEach(function (coord) {
        draw_rect(ctx,
                  coord.to_canvas_x(),
                  coord.to_canvas_y(),
                  coord.to_canvas_x() + PIX,
                  coord.to_canvas_y() + PIX,
                  "blue",
                  0.5+0*(this.dragging ? 0.2 : 0.4));
    });
    // dragging select rect
    // TODO: this won't display the actual contents moving... kinda lame
    if (this.dragging) {
        var delta = this.mouse_pos.snap_to_grid().minus(this.drag_origin.snap_to_grid());
        this.selection.forEach(function (coord) {
            draw_rect(ctx,
                      coord.plus(delta).to_canvas_x(),
                      coord.plus(delta).to_canvas_y(),
                      coord.plus(delta).to_canvas_x() + PIX,
                      coord.plus(delta).to_canvas_y() + PIX,
                      "blue",
                      0.25);
        });
    }

    $("#select_status").css("display", (this.select_status != NONE ? "inline" : "none"));
    $("#dragging").css("display", (this.dragging ? "inline" : "none"));
    $("#painting").css("display", (this.painting ? "inline" : "none"));
}