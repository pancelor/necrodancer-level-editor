
// HistoryEntry = UndoMarker | Coord * Sprite * Sprite
function HistoryEntry(coord, before, after) {
    this.coord  = coord;
    this.before = before;
    this.after  = after;
}

// HistoryEntry.prototype.invert = function() {
//     return new HistoryEntry(this.coord, this.after, this.before);
// };

// UndoMarker
HistoryEntry.flag = new HistoryEntry();

HistoryEntry.prototype.is_flag = function() {
    return this === HistoryEntry.flag;
}
