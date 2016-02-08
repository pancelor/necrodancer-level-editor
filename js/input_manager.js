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

    pubsub.on("sprites_loaded_from_server", this.sprites_loaded_from_server.bind(this));
    pubsub.on("select_sprite", this.select_sprite.bind(this));
    pubsub.on("request_fill_selection_with", this.request_fill_selection_with.bind(this));
    pubsub.on("draw", this.draw.bind(this));
    pubsub.on("request_cut", this.request_cut.bind(this));
    pubsub.on("request_copy", this.request_copy.bind(this));
    pubsub.on("request_paste", this.request_paste.bind(this));

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
            $(results[0]).css("opacity", 1);
            $(results[1]).css("opacity", "0.25");
        });
}

// an enum of possible user mouse interactions
const ACTION_PAINT_OR_DRAG    = 20429901; // bound to LMB by default
const ACTION_SELECT           = 20429903; // bound to RMB by default
const ACTION_ERASE            = 20429904; // bound to MMB by default
const ACTION_FLOOD_SELECT     = 20429905; // bound to R+LMB by default
const ACTION_EYE_DROPPER      = 20429906;
const ACTION_MENU             = 20429907;
// var ACTION_MOVE_VIEW       = 20429908;
// var ACTION_EDIT_SPRITE_PROPERTIES       = 20429909;
// var ACTION_STACK_PAINT       = 20429910;
// var ACTION_SELECT_ALL_SIMILAR       = 20429911;

InputManager.prototype.get_current_MMB_tool = function() {
    var selected = $("input[name=MMB-tool]:checked").val();
    switch (selected) {
    case "PAINT":
        return ACTION_PAINT_OR_DRAG;
        break;
    case "ERASE":
        return ACTION_ERASE;
        break;
    case "SELECT":
        return ACTION_SELECT;
        break;
    case "FLOOD_SELECT":
        return ACTION_FLOOD_SELECT;
        break;
    case "EYE_DROPPER":
        return ACTION_EYE_DROPPER;
        break;
    case "MENU":
        return ACTION_MENU;
        break;
    default:
        console.error("switch fall-through");
    }

}

InputManager.prototype.mousedown = function(evt) {
    var coord = Coord.from_mouse(this.canvas, evt);
    var coord_in_selection = this.selection && this.selection.has_by_grid(coord);

    var action_code;
    if (this.interact_mode === NONE) {
        switch ((new MouseButtons(evt)).visual) {
        case "100":
            action_code = ACTION_PAINT_OR_DRAG;
            break;
        case "001":
            if (coord_in_selection && this.selection.size() == 1) {
                action_code = ACTION_MENU;
            } else {
                action_code = ACTION_SELECT;
            }
            break;
        case "010":
            action_code = this.get_current_MMB_tool();
            break;
        case "101": // This happens on a right click + double left click, because interact_mode goes NONE -> SELECT -> NONE and then the last left click reaches here
            action_code = ACTION_FLOOD_SELECT;
            break;
        }

        this.begin_mouse_action(action_code, coord, coord_in_selection, evt.ctrlKey);
    }
}

InputManager.prototype.begin_mouse_action = function(mode, coord, coord_in_selection, modifier) {
    // modifier is whether the ctrl key is pressed
    switch(mode) {
    case ACTION_PAINT_OR_DRAG:
        if (coord_in_selection) {
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
        // if (coord_in_selection) {
        //     this.pubsub.emit("start_stroke");
        //     this.pubsub.emit("request_paint", {
        //         coords: this.selection,
        //         sprite: undefined
        //     });
        //     this.pubsub.emit("end_stroke");
        // } else {
            this.selection.clear();

            this.interact_mode = ERASE;
            this.pubsub.emit("start_stroke");
            this.pubsub.emit("request_paint", {
                coords: new CoordSet([coord]),
                sprite: undefined
            });
        // }
        break;
    case ACTION_FLOOD_SELECT:
        this.selection = this.grid.flood_select(coord.snap_to_grid());
        break;
    case ACTION_EYE_DROPPER:
        this.pubsub.emit("select_sprite", {
           sprite: this.grid.get(coord)
        });
        break;
    case ACTION_MENU:
        console.warn("context menu is not implemented")
        $(this.canvas).contextmenu();
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
        this.selection.xor_all(this.rect_selection(this.select_origin, this.mouse_pos));
        this.interact_mode = NONE;
        break;
    case DRAG:
    case DRAGCOPY:
        var delta = coord.snap_to_grid().minus(this.drag_origin.snap_to_grid());
        this.pubsub.emit("start_stroke");
        this.pubsub.emit("request_drag", {
            selection: this.selection,
            delta: delta,
            copy: this.interact_mode === DRAGCOPY
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
    console.log(evt.keyCode)

    const KEYCODE = {
        BACKSPACE: 8,
        DELETE: 46,
        Z: 90,
        Y: 89,
        X: 88,
        V: 86,
        C: 67,
    };

    var key_is = function (keycode) {
        return evt.keyCode == keycode;
    };

    // var evt = window.event? event : evt
    if (evt.ctrlKey) {
        if (key_is(KEYCODE.Z) && evt.shiftKey || key_is(KEYCODE.Y)) {
            this.pubsub.emit("request_redo");
        } else if (key_is(KEYCODE.Z) && !evt.shiftKey) {
            this.pubsub.emit("request_undo");
        } else if (key_is(KEYCODE.X)) {
            this.pubsub.emit("request_cut");
        } else if (key_is(KEYCODE.C)) {
            this.pubsub.emit("request_copy");
        } else if (key_is(KEYCODE.V)) {
            this.pubsub.emit("request_paste");
        }
    }
    if (key_is(KEYCODE.DELETE) || key_is(KEYCODE.BACKSPACE)) {
        this.pubsub.emit("start_stroke");
        this.pubsub.emit("request_paint", {
            coords: this.selection,
            sprite: undefined
        });
        this.pubsub.emit("end_stroke");
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