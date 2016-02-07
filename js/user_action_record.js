
// StrokeRecord = UndoMarker | Coord * Sprite * Sprite
function StrokeRecord(actions) {
    this.actions = actions; // formatted as {coord:, before:, after:} hashes
}

StrokeRecord.prototype.undo = function(callback) {
    // callback(coord, sprite) should set the given grid coordinate to the given sprite
    _(this.actions).eachRight(function(axn){
        callback(axn.coord, axn.before);
    });
}

StrokeRecord.prototype.redo = function(callback) {
    // callback(coord, sprite) should set the given grid coordinate to the given sprite
    _(this.actions).each(function(axn){
        callback(axn.coord, axn.after);
    });
}
