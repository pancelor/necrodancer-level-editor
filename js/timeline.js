// for undo/redo functionality
function Timeline(pubsub) {
    // past and future each hold a list of StrokeRecords
    this.past = [];
    this.future = [];

    this.current_action_buffer = []; // holds {coord:, grid:, before:, after:} objects

    pubsub.on("start_stroke", this.start_stroke.bind(this));
    pubsub.on("end_stroke", this.end_stroke.bind(this));
    pubsub.on("request_undo", this.request_undo.bind(this));
    pubsub.on("request_redo", this.request_redo.bind(this));
}

Timeline.prototype.start_stroke = function(args) {
    this.future = [];
    this.current_action_buffer = [];
}

Timeline.prototype.end_stroke = function(args) {
    if (this.current_action_buffer.length) { // TODO: mouseing off-screen currently generates a stroke-end event... is that okay? (this if-clause guards against the harmful effects, but it still seems weird)
        this.past.push(this.current_action_buffer);
        this.current_action_buffer = [];
    }
}

Timeline.prototype.request_undo = function() {
    if (this.past.length) {
        var last_action = this.past.splice(-1)[0]; // note: this mutates the array as well, splitting off its last element

        _(last_action).eachRight(function(axn){
            axn.grid.raw_set(axn.coord, axn.before);
        });

        this.future.unshift(last_action);
    }
}

Timeline.prototype.request_redo = function() {
    if (this.future.length) {
        var next_action = this.future.splice(0, 1)[0]; // note: this mutates the array as well, splitting off its last element

        _(next_action).each(function(axn){
            axn.grid.raw_set(axn.coord, axn.after);
        });

        this.past.push(next_action);
    }
}
