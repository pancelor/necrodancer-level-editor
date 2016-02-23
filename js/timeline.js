// for undo/redo functionality
function Timeline() {
    // past and future each hold a list of StrokeRecords
    this.past = [];
    this.future = [];

    this.current_action_buffer = []; // holds {coord:, before:, after:} objects
}