// an enum; values taken on by this.interact_mode
var NONE     = 429900;
var PAINT    = 429901;
var SELECT   = 429902;
var DRAG     = 429903;
var DRAGCOPY = 429904;
var ERASE    = 429905;
function interact_mode_to_string(mode) {
    switch(mode) {
    case NONE:
        return "NONE";
        break;
    case PAINT:
        return "PAINT";
        break;
    case SELECT:
        return "SELECT";
        break;
    case DRAG:
        return "DRAG";
        break;
    case DRAGCOPY:
        return "DRAGCOPY";
        break;
    case ERASE:
        return "ERASE";
        break;
    default:
        console.error("switch fall-through in enum:interact_mode.tostring");
    }
}

// an enum of possible user mouse interactions
var PAINT_OR_DRAG    = 20429901; // bound to LMB by default
var SELECT           = 20429902; // bound to RMB by default
var ERASE            = 20429903; // bound to MMB by default
var FLOOD_FILL       = 20429904; // bound to R+LMB by default

function InputManager(canvas, grid, pubsub, default_sprite) {
    this.canvas = canvas;
    this.grid = grid;
    this.pubsub = pubsub;

    this.sprite = default_sprite;
    this.mouse_pos = Coord.from_mouse(canvas, {x: 0, y: 0});

    this.selection = new CoordSet();
    this.interact_mode = NONE;
    // this.select_origin = undefined;
    // this.drag_origin = undefined;

    this.pubsub.subscribe("sprites_loaded_from_server", this.sprites_loaded_from_server.bind(this));
    this.pubsub.subscribe("request_sprite", this.request_sprite.bind(this));
    this.pubsub.subscribe("request_fill", this.request_fill.bind(this));
    this.pubsub.subscribe("draw", this.draw.bind(this));

    // misc input events:
        // disable unwanted events
        $(canvas).on('contextmenu', _.constant(false));
        $(canvas).on('dblclick',    _.constant(false));
        $(canvas).on('dragstart',   _.constant(false));
        $(canvas).on('drag',        _.constant(false));
        $(canvas).on('dragend',     _.constant(false));
        $(canvas).on('selectstart', _.constant(false));
        $(canvas).on('mousedown', function(evt) {
            var buttons = new MouseButtons(evt);
            if (buttons.middle) {
                return false
            }
        });

        $("button#undo").on("click", function(evt){
            pubsub.emit("request_undo");
        });

        $("button#redo").on("click", function(evt){
            pubsub.emit("request_redo");
        });

        $("#sprite_search_bar").on("keyup", function(evt) {
            var search_string = this.value;
            var results = _.partition($(".sprite_canvas"), function(spr){
                return fuzzy_match(spr.id, search_string);
            });
            $(results[0]).show();
            $(results[1]).hide();
        });
}

InputManager.prototype.register_listeners = function(canvas) {
    canvas.addEventListener("mousedown", this.mousedown.bind(this));
    canvas.addEventListener("mousemove", this.mousemove.bind(this));
    canvas.addEventListener("mouseup", this.mouseup.bind(this));
    canvas.addEventListener("mouseleave", this.mouseleave.bind(this));
    // canvas.addEventListener("keydown", this.keydown.bind(this)); // TODO: fix
    // canvas.addEventListener("keyup", this.keyup.bind(this));
}

InputManager.prototype.mousedown = function(evt) {
    var coord = Coord.from_mouse(this.canvas, evt);
    var buttons = new MouseButtons(evt);
    if (this.interact_mode === NONE) {
        switch (buttons.visual) {
        case "100":
            this.begin_mouse_action(PAINT_OR_DRAG, coord, evt.ctrlKey);
            break;
        case "001":
            this.begin_mouse_action(SELECT, coord, evt.ctrlKey);
            break;
        case "010":
            this.begin_mouse_action(ERASE, coord, evt.ctrlKey);
            break;
        case "101": // This happens on a right click + double left click, because interact_mode goes NONE -> SELECT -> NONE and then the last left click reaches here
            this.begin_mouse_action(FLOOD_FILL, coord, evt.ctrlKey);
            break;
        }
    }
}

InputManager.prototype.begin_mouse_action = function(mode, coord, modifier) {
    // modifier is whether the ctrl key is pressed
    switch(mode) {
    case PAINT_OR_DRAG:
        if (this.selection && this.selection.has_by_grid(coord)) {
            this.interact_mode = modifier ? DRAGCOPY : DRAG;
            this.drag_origin = coord;
        } else {
            this.selection.clear();

            this.interact_mode = PAINT;
            this.pubsub.emit("start_stroke");
            this.pubsub.emit("request_paint", {
                 coords: new CoordSet([coord]),
                 sprite: this.sprite
            });
        }
        break;
    case SELECT:
        if (!modifier) {
            this.selection.clear();
        }
        this.interact_mode = SELECT;
        this.select_origin = coord;
        break;
    case ERASE:
        this.selection.clear();

        this.interact_mode = ERASE;
        this.pubsub.emit("start_stroke");
        this.pubsub.emit("request_paint", {
            coords: new CoordSet([coord]),
            sprite: undefined
        });
        break;
    case FLOOD_FILL:
        this.selection = this.grid.flood_select(coord.snap_to_grid());
        break;
    default:
        console.error("switch fall-through")
    }
}

InputManager.prototype.mousemove = function(evt) {
    var coord = Coord.from_mouse(this.canvas, evt);
    this.mouse_pos = coord;
    if (this.interact_mode === PAINT) {
        this.pubsub.emit("request_paint", {
            coords: new CoordSet([coord]),
            sprite: this.sprite
        });
    } else if (this.interact_mode === ERASE) {
        this.pubsub.emit("request_paint", {
            coords: new CoordSet([coord]),
            sprite: undefined
        });
    }
}

InputManager.prototype.mouseup = function(evt) {
    var coord = Coord.from_mouse(this.canvas, evt);

    switch (this.interact_mode) {
    case PAINT:
        this.interact_mode = NONE;
        this.pubsub.emit("end_stroke");
        break;
    case SELECT:
        var new_selection = this.rect_selection(this.select_origin, this.mouse_pos);
        if (evt.button === 1) { // middle click was just released
            this.pubsub.emit("start_stroke");
            this.pubsub.emit("request_paint", {
                coords: new_selection,
                sprite: undefined
            });
            this.pubsub.emit("end_stroke");
        } else {
            this.selection.xor_all(new_selection);
        }
        this.interact_mode = NONE;
        break;
    case DRAG:
    case DRAGCOPY:
        var delta = coord.snap_to_grid().minus(this.drag_origin.snap_to_grid());
        this.pubsub.emit("start_stroke");
        this.pubsub.emit("request_drag", {
            delta: delta,
            copy: this.interact_mode === DRAGCOPY,
            selection: this.selection
        });
        this.pubsub.emit("end_stroke");

        // TODO: redo in one line with _.map when CoordSet s are iterable
        var shifted_selection = new CoordSet();
        this.selection.forEach(function(old_coord) {
                shifted_selection.add(old_coord.plus(delta));
        });
        this.selection = shifted_selection; // TODO: errors when you drag the selection off-grid

        this.interact_mode = NONE;
        break;
    case ERASE:
        this.interact_mode = NONE;
        this.pubsub.emit("end_stroke");
        break;
    default:
        console.info("switch fall-through in enum:interact_mode.tostring");
    }
}

InputManager.prototype.mouseleave = function(evt) {
    // this.interact_mode = NONE;
    // this.pubsub.emit("end_stroke");
}

InputManager.prototype.keydown = function(evt) {
    console.log("keydown:");
    console.log(evt);
}

InputManager.prototype.keyup = function(evt) {
    console.log("keyup:");
    console.log(evt);
}

InputManager.prototype.rect_selection = function(coord1, coord2) {
    var selection = new CoordSet();

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
                selection.add(Coord.from_grid({rr: rr, cc: cc}));
            }
        }
    }
    return selection;
}

// TODO: deprecated
InputManager.prototype.current_tool = function() {
    return $("input[name=tool_select]:checked").val();
}

// pubsub:

InputManager.prototype.sprites_loaded_from_server = function(args) {
    // load the paintbrush
    this.sprite = $(".sprite#skeleton")[0];
}

InputManager.prototype.request_sprite = function(args) {
    var sprite = args.sprite;

    this.sprite = sprite;
}

InputManager.prototype.request_fill = function(args) {
    var sprite = args.sprite;

    this.pubsub.emit("request_paint", {
        coords: this.selection,
        sprite: sprite
    });
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

    // in-progress selection
    if (this.interact_mode === SELECT) {
        fill_rect(ctx,
                  this.select_origin.to_canvas_x(),
                  this.select_origin.to_canvas_y(),
                  this.mouse_pos.to_canvas_x(),
                  this.mouse_pos.to_canvas_y(),
                  "blue",
                  0.25);
    }
    // completed selection
    this.selection.forEach(function (coord) {
        fill_rect(ctx,
                  coord.to_canvas_x(),
                  coord.to_canvas_y(),
                  coord.to_canvas_x() + PIX,
                  coord.to_canvas_y() + PIX,
                  "blue",
                  0.5);
    });
    // dragging select rect
    // TODO: this won't display the actual contents moving... kinda lame
    if (this.interact_mode === DRAG || this.interact_mode === DRAGCOPY) {
        var delta = this.mouse_pos.snap_to_grid().minus(this.drag_origin.snap_to_grid());
        this.selection.forEach(function (coord) {
            fill_rect(ctx,
                      coord.plus(delta).to_canvas_x(),
                      coord.plus(delta).to_canvas_y(),
                      coord.plus(delta).to_canvas_x() + PIX,
                      coord.plus(delta).to_canvas_y() + PIX,
                      "blue",
                      0.25);
        });
    }

    // show current selected sprite
    if (this.interact_mode === PAINT || this.interact_mode === NONE) {
        draw_sprite(ctx,
            this.sprite,
            this.mouse_pos.snap_to_grid().to_canvas_x(),
            this.mouse_pos.snap_to_grid().to_canvas_y(),
            0.35);

        $("#interact_mode").text(interact_mode_to_string(this.interact_mode)); // DEBUG
    }
}