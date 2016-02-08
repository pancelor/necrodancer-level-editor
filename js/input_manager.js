// an enum; values taken on by this.interact_mode
const NONE     = 10429900;
const PAINT    = 10429901;
const SELECT   = 10429902;
const DRAG     = 10429903;
const DRAGCOPY = 10429904;
const ERASE    = 10429905;
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
const ACTION_PAINT_OR_DRAG    = 20429901; // bound to LMB by default
const ACTION_SELECT           = 20429902; // bound to RMB by default
const ACTION_ERASE            = 20429903; // bound to MMB by default
const ACTION_FLOOD_FILL       = 20429904; // bound to R+LMB by default
// var ACTION_MOVE_VIEW       = 20429905;
// var ACTION_EDIT_SPRITE_PROPERTIES       = 20429906;
// var ACTION_STACK_PAINT       = 20429907;
// var ACTION_SELECT_ALL_SIMILAR       = 20429908;

function InputManager(canvas, grid, pubsub) {
    this.canvas = canvas;
    this.grid = grid;
    this.pubsub = pubsub;

    this.sprite = undefined;
    this.mouse_pos = Coord.from_mouse(canvas, {x: 0, y: 0});

    this.selection = new CoordSet();
    this.interact_mode = NONE;
    this.select_origin = undefined;
    this.drag_origin = undefined;

    pubsub.subscribe("sprites_loaded_from_server", this.sprites_loaded_from_server.bind(this));
    pubsub.subscribe("select_sprite", this.select_sprite.bind(this));
    pubsub.subscribe("request_fill_selection_with", this.request_fill_selection_with.bind(this));
    pubsub.subscribe("draw", this.draw.bind(this));
    pubsub.subscribe("request_cut", this.request_cut.bind(this));
    pubsub.subscribe("request_copy", this.request_copy.bind(this));
    pubsub.subscribe("request_paste", this.request_paste.bind(this));

    $(canvas).on("mousedown", this.mousedown.bind(this));
    $(canvas).on("mousemove", this.mousemove.bind(this));
    $(canvas).on("mouseup", this.mouseup.bind(this));
    $(canvas).on("mouseleave", this.mouseleave.bind(this));
    $(document).on("keydown", this.keydown.bind(this)); // TODO: fix
    $(canvas).on('wheel', this.wheel.bind(this));

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
            if (buttons.middle) { // disable middle-click-to-scroll
                return false
            }
        });

        $("button#download").on("click", function(evt){
            download_grid(grid);
        });

        $("input#upload").on("change", function(evt){
            var file = evt.target.files[0];
            upload_grid(file, grid);
        });

        $("button#undo").on("click", function(evt){
            pubsub.emit("request_undo");
        });

        $("button#redo").on("click", function(evt){
            pubsub.emit("request_redo");
        });

        $("button#cut").on("click", function(evt){
            pubsub.emit("request_cut");
        });

        $("button#copy").on("click", function(evt){
            pubsub.emit("request_copy");
        });

        $("button#paste").on("click", function(evt){
            pubsub.emit("request_paste");
        });

        $("#sprite_search_bar").on("input", function(evt) {
            var search_string = this.value;
            var results = _.partition($("canvas.sprite_holder"), function(spr){
                return fuzzy_match(spr.id, search_string);
            });
            $(results[0]).show();
            $(results[1]).hide();
        });
}

InputManager.prototype.mousedown = function(evt) {
    var coord = Coord.from_mouse(this.canvas, evt);
    var buttons = new MouseButtons(evt);
    if (this.interact_mode === NONE) {
        switch (buttons.visual) {
        case "100":
            this.begin_mouse_action(ACTION_PAINT_OR_DRAG, coord, evt.ctrlKey);
            break;
        case "001":
            this.begin_mouse_action(ACTION_SELECT, coord, evt.ctrlKey);
            break;
        case "010":
            this.begin_mouse_action(ACTION_ERASE, coord, evt.ctrlKey);
            break;
        case "101": // This happens on a right click + double left click, because interact_mode goes NONE -> SELECT -> NONE and then the last left click reaches here
            this.begin_mouse_action(ACTION_FLOOD_FILL, coord, evt.ctrlKey);
            break;
        }
    }
}

InputManager.prototype.begin_mouse_action = function(mode, coord, modifier) {
    // modifier is whether the ctrl key is pressed
    switch(mode) {
    case ACTION_PAINT_OR_DRAG:
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
    case ACTION_SELECT:
        if (!modifier) {
            this.selection.clear();
        }
        this.interact_mode = SELECT;
        this.select_origin = coord;
        break;
    case ACTION_ERASE:
        if (this.selection && this.selection.has_by_grid(coord)) {
            this.pubsub.emit("start_stroke");
            this.pubsub.emit("request_paint", {
                coords: this.selection,
                sprite: undefined
            });
            this.pubsub.emit("end_stroke");

        } else {
            this.selection.clear();

            this.interact_mode = ERASE;
            this.pubsub.emit("start_stroke");
            this.pubsub.emit("request_paint", {
                coords: new CoordSet([coord]),
                sprite: undefined
            });
        }
        break;
    case ACTION_FLOOD_FILL:
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
        // if (evt.button === 1) { // middle click was just released
        //     this.pubsub.emit("start_stroke");
        //     this.pubsub.emit("request_paint", {
        //         coords: new_selection,
        //         sprite: undefined
        //     });
        //     this.pubsub.emit("end_stroke");
        // } else {
            this.selection.xor_all(new_selection);
        // }
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
    this.mouse_pos = Coord.from_grid({rr: -1, cc: -1});
    this.interact_mode = NONE;
    this.pubsub.emit("end_stroke");
}

InputManager.prototype.keydown = function(evt) {
    const Z_KEYCODE = 90;
    const Y_KEYCODE = 89;
    const X_KEYCODE = 88;
    const V_KEYCODE = 86;
    const C_KEYCODE = 67;

    // var evt = window.event? event : evt
    if (evt.ctrlKey) {
        if (evt.keyCode == Z_KEYCODE && evt.shiftKey || evt.keyCode == Y_KEYCODE) {
            this.pubsub.emit("request_redo");
        } else if (evt.keyCode == Z_KEYCODE && !evt.shiftKey) {
            this.pubsub.emit("request_undo");
        } else if (evt.keyCode == X_KEYCODE) {
            this.pubsub.emit("request_cut");
        } else if (evt.keyCode == C_KEYCODE) {
            this.pubsub.emit("request_copy");
        } else if (evt.keyCode == V_KEYCODE) {
            this.pubsub.emit("request_paste");
        }
    }
}

InputManager.prototype.wheel = function(evt) {
    // evt.preventDefault();
    console.warn("No behavior currently bound to mouse wheel");
    var dir = Math.sign(evt.originalEvent.wheelDeltaY);
    console.log(dir);
}

InputManager.prototype.rect_selection = function(coord1, coord2) {
    var selection = new CoordSet();

    var grid_rr_1 = Math.min(coord1.to_grid_rr(), coord2.to_grid_rr());
    var grid_cc_1 = Math.min(coord1.to_grid_cc(), coord2.to_grid_cc());
    var grid_rr_2 = Math.max(coord1.to_grid_rr(), coord2.to_grid_rr());
    var grid_cc_2 = Math.max(coord1.to_grid_cc(), coord2.to_grid_cc());

    if (this.grid.inbounds(Coord.from_grid({rr: grid_rr_1, cc: grid_cc_1}))) {
        grid_rr_1 = clamp(0, grid_rr_1, this.grid.height() - 1);
        grid_cc_1 = clamp(0, grid_cc_1, this.grid.width()  - 1);
        grid_rr_2 = clamp(0, grid_rr_2, this.grid.height() - 1);
        grid_cc_2 = clamp(0, grid_cc_2, this.grid.width()  - 1);
        for (var rr = grid_rr_1; rr <= grid_rr_2; ++rr) {
            for (var cc = grid_cc_1; cc <= grid_cc_2; ++cc) {
                selection.add(Coord.from_grid({rr: rr, cc: cc}));
            }
        }
    }
    return selection;
}

// pubsub:

InputManager.prototype.sprites_loaded_from_server = function(args) {
    // load the paintbrush
    this.sprite = $(".sprite#skeleton")[0];
}

InputManager.prototype.select_sprite = function(args) {
    var sprite = args.sprite;

    this.sprite = sprite;
}

InputManager.prototype.request_fill_selection_with = function(args) {
    var sprite = args.sprite;

    this.pubsub.emit("request_paint", {
        coords: this.selection,
        sprite: sprite
    });
}

InputManager.prototype.request_cut = function(args) {
    console.warn("cut is unimplemented");
}
InputManager.prototype.request_copy = function(args) {
    console.warn("copy is unimplemented");
}
InputManager.prototype.request_paste = function(args) {
    console.warn("paste is unimplemented");
}

InputManager.prototype.draw = function(args) {
    var ctx = args.ctx;

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

    }

    $("#interact_mode").text(interact_mode_to_string(this.interact_mode)); // DEBUG
}