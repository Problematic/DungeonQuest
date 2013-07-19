var DungeonQuest = (function (d3, _, Backbone, undefined) {
    var DungeonQuest = function (options) {
        if (!(this instanceof DungeonQuest)) {
            return new DungeonQuest(options);
        }

        this.board = new GameBoard(options);


        this.listenTo(this.board, 'trace:end', this.doTurn);
    };

    _.extend(DungeonQuest.prototype, Backbone.Events);

    DungeonQuest.prototype.start = function () {
        this.board.render();
    };

    DungeonQuest.prototype.doTurn = function (trace) {
        var data = trace.data();
    };

    var GameBoard = function (options) {
        if (!(this instanceof GameBoard)) {
            return new GameBoard(options);
        }

        options = _.extend({
            rowCount: 6,
            columnCount: 6,
            tileWidth: 50,
            tileHeight: 50,
            tilePadding: 5,
            tileset: []
        }, options);

        this.options = options;
        this.tileset = this.options.tileset;

        var columns = [], column;
        for (var i = 0; i < this.options.columnCount; i++) {
            column = new Column(null, {
                index: i
            });
            columns.push(this.fillColumn(column));
        }

        this._columns = columns;
        this._selection = this.options.selection;
        this.trace = new Trace();
    };

    _.extend(GameBoard.prototype, Backbone.Events);

    GameBoard.prototype.selection = function () {
        return this._selection;
    };

    GameBoard.prototype.columnSelection = function () {
        var board = this, columns = this.selection().selectAll('.column')
            .data(this.getColumns(), function (d) {
                return d.index;
            });

        columns.enter().append('svg:g')
            .attr('class', 'column')
            .attr('transform', function (d, i) {
                return 'translate(' +
                    ((board.options.tileWidth + board.options.tilePadding) *
                        i) + ',0)';
            })
            .attr('data-cx', function (d, i) {
                return (board.options.tileWidth + board.options.tilePadding) *
                    i + (board.options.tileWidth / 2);
            });

        return columns;
    };

    GameBoard.prototype.render = function () {
        var assetRoot = this.options.assetRoot,
            columns = this.columnSelection(),
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
            // if we're not a tile, or the trace is already active
            // (can happen when mouseup happens off-board)
            if (trace.active) {
                return;
            }

            trace.reset([this]);
            trace.active = true;
        });

        enterset.on('mouseover', function (d, i) {
            var tile, lastSelection = board.trace.last();

            if (!board.trace.active) {
                return;
            }

            if (!board.trace.contains(this)) {
                // todo: prevent crossing the trace line on a diagonal?
                // todo: path tracing to see if we can draw a valid
                // straight line between two tiles (instead of just adjacent)
                if (board.isAdjacent(lastSelection.__data__, d) &&
                    lastSelection.__data__.isMatch(this.__data__)) {
                    trace.push(this);
                }
            } else if (board.trace.get(-2) === this) {
                // we've backtracked, remove last element
                trace.pop();
            }

            board.render();
        });

        enterset.on('mouseup', function (d, i) {
            var columns, idx;

            if (board.trace.length > 2) {

                board.trigger('trace:end', trace);
                columns = board.getColumns();

                _.each(board.trace.get(), function (tile, index) {
                    _.each(columns, function (column, index) {
                        idx = column.models.indexOf(tile.__data__);
                        if (idx === -1) { return; }

                        column.remove(tile.__data__);
                        board.fillColumn(column);
                    });
                });
            }

            trace.reset();
            trace.active = false;
            board.render();
        });

        tiles.exit().remove();

        this.renderTrace();
    };

    GameBoard.prototype.renderTrace = function () {
        var board = this, lineGenerator = d3.svg.line()
            .x(function (d) {
                var parent = d.parentNode;
                if (parent.dataset) {
                    return parent.dataset.cx;
                }
                // IE, y u no dataset?!
                return d.parentNode.getAttribute('data-cx');
            })
            .y(function (d) {
                return d.y.baseVal.value + board.options.tileHeight / 2;
            }),
            path = this.trace.selection(this.selection());

        path.enter()
            .append('svg:path')
                .attr('d', lineGenerator(this.trace.get()))
                .attr('class', 'trace')
                .attr('pointer-events', 'none')  // don't capture click/mouseup
                .attr('fill', 'none');

        path.attr('d', lineGenerator(this.trace.get()));

        path.exit().remove();
    };

    GameBoard.prototype.fillColumn = function (column) {
        var tile, attributes;
        while (column.length < this.options.rowCount) {
            attributes = _.extend({
                width: this.options.tileWidth,
                height: this.options.tileHeight,
                padding: this.options.tilePadding
            }, _.shuffle(_.values(this.tileset))[0]);
            tile = new Tile(attributes);
            column.unshift(tile);
        }
        return column;
    };

    GameBoard.prototype.getAdjacent = function (tile) {
        var tileIdx = tile.collection.indexOf(tile),
            colIdx = this.getColumns().indexOf(tile.collection),
            adjacent = [];

        // todo: figure out how to optimize this
        _.each(this.getColumns(), function (column, index) {
            if (index >= colIdx -1 && index <= colIdx + 1) {
                column.each(function (tile, idx) {
                    if (idx >= tileIdx -1 && idx <= tileIdx + 1) {
                        adjacent.push(tile);
                    }
                });
            }
        });

        return adjacent;
    };

    GameBoard.prototype.isAdjacent = function (source, target) {
        return this.getAdjacent(source).indexOf(target) !== -1;
    };

    GameBoard.prototype.getColumns = function () {
        return this._columns;
    };

    DungeonQuest.GameBoard = GameBoard;


    var Trace = function (options) {
        if (!(this instanceof Trace)) {
            return new Trace(options);
        }

        this.active = false;
        this._elements = [];  // todo: refactor to use coords instead
        this.length = 0;
    };

    _.extend(Trace.prototype, Backbone.Events);

    Trace.prototype.selection = function (selection) {
        return selection.selectAll('.trace')
            .data(this._elements, function (d) {
                return d;
            });
    };

    Trace.prototype.get = function (index) {
        if (!isNaN(index)) {
            if (index >= 0) {
                return this._elements[index];
            }
            return this._elements[this._elements.length + index];
        }
        return this._elements;
    };

    Trace.prototype.push = function (element) {
        this._elements.push(element);
        this.length = this._elements.length;

        return this._elements.length;
    };

    Trace.prototype.pop = function (element) {
        var el = this._elements.pop();
        this.length = this._elements.length;

        return el;
    };

    Trace.prototype.reset = function (elements) {
        this._elements = elements || [];
        this.length = this._elements.length;
    };

    Trace.prototype.last = function () {
        return this._elements[this._elements.length - 1];
    };

    Trace.prototype.contains = function (element) {
        return this._elements.indexOf(element) !== -1;
    };

    Trace.prototype.data = function () {
        return _.pluck(this.get(), '__data__');
    };

    GameBoard.Trace = Trace;


    var Tile = Backbone.Model.extend({
        defaults: function () {
            return {
                matches: [],
                points: 0
            };
        },

        isMatch: function (tile) {
            // todo: we may not want to match this.type === tile.type
            // what if we have a tile that doesn't match itself?
            // tradeoff: having to put ourself in the matches list
            return this.get('type') === tile.get('type') ||
                (this.get('matches').indexOf(tile.get('type')) !== -1 ||
                    tile.get('matches').indexOf(this.get('type')) !== -1);
        }
    });

    GameBoard.Tile = Tile;


    var Column = Backbone.Collection.extend({
        initialize: function (models, options) {
            this.index = options.index;
        },
        model: Tile
    });

    GameBoard.Column = Column;


    return DungeonQuest;
}(d3, _, Backbone));
