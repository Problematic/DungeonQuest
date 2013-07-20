DungeonQuest.GameBoard = (function (Backbone, DungeonQuest) {
    "use strict";

    var GameBoard = function (options) {
        if (!(this instanceof GameBoard)) {
            return new GameBoard(options);
        }

        this.options = options;

        this._selection = this.options.selection;
        this.trace = new DungeonQuest.GameBoard.Trace();
    };

    _.extend(GameBoard.prototype, Backbone.Events);

    GameBoard.prototype.selection = function () {
        return this._selection;
    };

    GameBoard.prototype.columnSelection = function (data) {
        var board = this, columns = this.selection().selectAll('.column')
            .data(data, function (d) {
                return d.index;
            });

        columns.enter().append('svg:g')
            .attr('class', 'column')
            .attr('transform', function (d, i) {
                return 'translate(' +
                    ((board.options.tileWidth + board.options.tilePadding) *
                        i) + ',0)';
            });

        return columns;
    };

    GameBoard.prototype.render = function (data) {
        var assetRoot = this.options.assetRoot,
            columns = this.columnSelection(data),
            board = this,
            trace = board.trace;

        var tiles = columns.selectAll('.tile')
                .data(function (d, i) {
                    return d.models;
                }, function (d) {
                    return d.cid;
                });

        tiles.transition()
            .duration(333)
            .ease('bounce')
            .attr('y', function (d, i) {
                return i *
                    (d.get('height') + d.get('padding'));
            });

        var enterset = tiles.enter()
            .append('svg:image')
                .attr('class', 'tile')
                .attr('height', this.options.tileHeight)
                .attr('width', this.options.tileWidth)
                // .attr('pointer-events', 'all')
                .attr('xlink:href', function (d) {
                    return [assetRoot, 'svg', d.get('type') + '.svg']
                        .join('/');
                })
                .attr('y', function (d, i) {
                    return i * -(d.get('height') + d.get('padding')) -
                        (d.get('height') + d.get('padding'));
                });

        enterset.transition()
            .duration(333)
            .ease('bounce')
            .attr('y', function (d, i) {
                return i * (d.get('height') + d.get('padding'));
            });

        enterset.on('mousedown', function (d, i) {
            // if the trace is already active
            // (can happen when mouseup happens off-board)
            if (trace.active) {
                return;
            }

            trace.reset([d]);
            trace.active = true;
        });

        enterset.on('mouseover', function (d, i) {
            if (!board.trace.active) {
                return;
            }

            if (board.trace.indexOf(d) === -1) {
                board.trigger('trace:add', trace, d);
            } else if (board.trace.at(board.trace.length - 2) === d) {
                // we've backtracked, remove last element
                board.trace.pop();
            }

            board.renderTrace();
        });

        enterset.on('mouseup', function (d, i) {
            board.trigger('trace:end', trace);
        });

        tiles.exit().remove();

        this.renderTrace();
    };

    GameBoard.prototype.renderTrace = function () {
        var lineGenerator = d3.svg.line().x(this.cx).y(this.cy),
            path = this.trace.selection(this.selection());

        path.enter()
            .append('svg:path')
                .attr('d', lineGenerator(this.trace.models))
                .attr('class', 'trace')
                .attr('pointer-events', 'none')  // don't capture click/mouseup
                .attr('fill', 'none');

        path.attr('d', lineGenerator(this.trace.models));

        path.exit().remove();
    };

    GameBoard.prototype.cx = function (tile) {
        return (tile.get('width') + tile.get('padding')) *
            tile.collection.index + (tile.get('width') / 2);
    };

    GameBoard.prototype.cy = function (tile) {
        return (tile.get('height') + tile.get('padding')) *
            tile.collection.indexOf(tile) + (tile.get('height') / 2);
    };

    return GameBoard;
}(Backbone, DungeonQuest));
