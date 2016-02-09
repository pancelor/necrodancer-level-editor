var events = [
    "sprites_loaded_from_server",

    "select_sprite",

    "start_stroke",
    "end_stroke",

    "request_fill_selection", // buttons -> input_manager
    "request_paint", // input_manager -> grid
    "request_drag",

    "request_undo",
    "request_redo",
    "request_cut",
    "request_copy",
    "request_paste",
    "request_download",

    "draw",
]

function PubSub() {
    this.dispatch_table = {}; // maps events (strings) to lists of functions
}

PubSub.validate_event = function(event) {
    if (!_(events).includes(event)) {
        console.error("unknown event: "+event);
    }
}

PubSub.prototype.on = function(event, action) {
    PubSub.validate_event(event);

    // initialize subscriber list if no one else is subbed to this channel yet
    if (!this.dispatch_table[event]) {
        this.dispatch_table[event] = [];
    }

    this.dispatch_table[event].push(action);
}

PubSub.prototype.emit = function(event, data) {
    PubSub.validate_event(event);

    var actions = this.dispatch_table[event];
    _(actions).each(function(axn) {
        axn(data);
    });
}
