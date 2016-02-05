var events = [
    "request_paint",
    "request_drag",
    // "drag_start",
    // "drag_end",
    "draw",
    "request_sprite",
]

function PubSub() {
    this.dispatch_table = {}; // maps events (strings) to lists of functions
}

PubSub.validate_event = function(event) {
    if (!(events.includes(event))) {
        console.error("bad event: "+event);
    }
}

PubSub.prototype.subscribe = function(event, action) {
    PubSub.validate_event(event);
    // initialize if no one else is subbed to this channel yet
    if (!this.dispatch_table[event]) {
        this.dispatch_table[event] = [];
    }

    this.dispatch_table[event].push(action);
}

PubSub.prototype.emit = function(event, data) {
    PubSub.validate_event(event);

    var actions = this.dispatch_table[event];
    if (actions) {
        _.each(actions, function(action) {
            action(data);
        });
    }
}
