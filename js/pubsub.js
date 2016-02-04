var events = [
    "request_paint",
    // "drag_start",
    // "drag_end",
    "draw",
    "request_sprite",
]

function PubSub() {
    this.dispatch_table = {}; // maps events (strings) to lists of functions
};

PubSub.validate_event = function(event) {
    if (!(events.includes(event))) {
        console.error("bad event: "+event);
    }
};

PubSub.prototype.subscribe = function(event, callback) {
    PubSub.validate_event(event);
    // initialize if no one else is subbed to this channel yet
    if (!this.dispatch_table[event]) {
        this.dispatch_table[event] = [];
    }

    this.dispatch_table[event].push(callback);
};

PubSub.prototype.emit = function(event, data) {
    PubSub.validate_event(event);

    if (this.dispatch_table[event]) {
        this.dispatch_table[event].forEach(function(callback) {
            callback(data);
        });
    }
};
