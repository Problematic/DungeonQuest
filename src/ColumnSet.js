DungeonQuest.ColumnSet = (function () {
    var ColumnSet = function (options) {
        if (!(this instanceof ColumnSet)) {
            return new ColumnSet(options);
        }

        options = _.merge({
            columns: []
        }, options);

        this.columns = columns;
    };

    ColumnSet.prototype.indexOf = function (column) {
        return this.columns.indexOf(column);
    };

    ColumnSet.prototype.push = function (column) {
        this.columns.push(column);
    };

    ColumnSet.prototype.selection = function (selection) {
        var options = this.options, columns = selection.selectAll('.column')
            .data(this.columns, function (d) {
                return d.index;
            });

        // todo: is this really the right place to do this?
        columns.enter().append('svg:g')
            .attr('class', 'column')
            .attr('transform', function (d) {
                return 'translate(' +
                    ((options.tileWidth + options.tilePadding) * d.index) +
                    ', 0)';
            });
    };

    ColumnSet.prototype.getAdjacent = function (tile) {
        var adjacent = [],
            xStart = tile.x() > 0 ? -1 : 0,
            xEnd = tile.x() < this.options.columnCount - 1 ? 1 : 0,
            yStart = tile.y() > 0 ? -1 : 0,
            yEnd = tile.y() < this.options.rowCount - 1 ? 1 : 0;

        // http://stackoverflow.com/a/2035539/535666
        for (var dx = xStart; dx <= xEnd; dx++) {
            for (var dy = yStart; dy <= yEnd; dy++) {
                if (dx !== 0 || dy !== 0) {
                    adjacent.push(this.columns[tile.x() + dx].at(tile.y() + dy));
                }
            }
        }

        return adjacent;
    };

    ColumnSet.prototype.isAdjacent = function (source, target) {
        // todo: we can just check indexes, we don't need to pull the tiles
        return this.getAdjacent(source).indexOf(target) !== -1;
    };

    return ColumnSet;
}());
