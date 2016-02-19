function CoordSet(coords) {
    this.elements = [];
    if (coords) {
        this.add_all(coords);
    }
}

// TODO: figure out the iterable interface instead so I can use _(coord_set).each(fxn)
CoordSet.prototype.forEach = function(fxn, this_arg) {
    this.elements.forEach(fxn);
}

CoordSet.prototype.size = function(coord) {
    return this.elements.length;
}

CoordSet.prototype.has = function(coord) {
    return _.some(this.elements, coord.equals.bind(coord));
}

CoordSet.prototype.has_by_grid = function(coord) {
    return _.some(this.elements, coord.equals_by_grid.bind(coord));
}

CoordSet.prototype.add = function(coord) {
    if (!this.has(coord)) {
        this.elements.push(coord);
        return true;
    }
    return false;
}

CoordSet.prototype.delete = function(coord) {
    var index = _.findIndex(this.elements, coord.equals.bind(coord));
    if (index != -1) {
        removeByIndex(this.elements, index);
        return true;
    }
    return false;
}

CoordSet.prototype.xor = function(coord) {
    if (this.has(coord)) {
        this.delete(coord);
    } else {
        this.add(coord);
    }
}

CoordSet.prototype.clear = function(coords) {
    this.delete_all(_.cloneDeep(this.elements)); // preserves the object id of this.elements
}

CoordSet.prototype.xor_all = function(coords) {
    coords.forEach(this.xor.bind(this));
}

CoordSet.prototype.delete_all = function(coords) {
    coords.forEach(this.delete.bind(this));
}
CoordSet.prototype.add_all = function(coords) {
    coords.forEach(this.add.bind(this));
}
