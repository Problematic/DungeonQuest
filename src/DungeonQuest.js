var DungeonQuest = (function (d3, _, Backbone, undefined) {
    var DungeonQuest = function (options) {
        if (!(this instanceof DungeonQuest)) {
            return new DungeonQuest(options);
        }

        this.options = _.extend({
            rowCount: 6,
            columnCount: 6,
            tileWidth: 50,
            tileHeight: 50,
            tilePadding: 5,
            tileset: []
        }, options);
        this.tileset = options.tileset;

        var data = [], column;
        for (var i = 0; i < this.options.columnCount; i++) {
            column = new Column(null, {
                index: i
            });
            data.push(this.fillColumn(column));
        }
        this.data = data;

        this.board = new GameBoard(this.options);
        this.state = new State({
            score: 0
        });
        this.player = new State({
            level: 1,
            xp: 0
        });

        _.each(this.tileset, function (tile) {
            tile.methods.register(this.state, this.player);
        }, this);

        this.listenTo(this.board, 'trace:end', this.doTurn);
        this.listenTo(this.board, 'trace:add', function (trace, element) {
            var lastSelection = trace.last();

            // todo: prevent crossing the trace line on a diagonal?
            // todo: path tracing to see if we can draw a valid
            // straight line between two tiles (instead of just adjacent)
            if (this.isAdjacent(lastSelection.__data__, element.__data__) &&
                lastSelection.__data__.isMatch(element.__data__)) {
                trace.push(element);
            }
        });
    };

    _.extend(DungeonQuest.prototype, Backbone.Events);

    DungeonQuest.prototype.fillColumn = function (column) {
        while (column.length < this.options.rowCount) {
            column.unshift(this.createTile());
        }
        return column;
    };

    DungeonQuest.prototype.createTile = function (type) {
        var tile, attributes, instance;
        tile = this.tileset[type] || _.shuffle(_.values(this.tileset))[0];
        attributes = _.extend({
            width: this.options.tileWidth,
            height: this.options.tileHeight,
            padding: this.options.tilePadding
        }, tile.attributes);
        instance = new Tile(attributes);
        _.extend(instance, tile.methods);

        return instance;
    };

    DungeonQuest.prototype.getAdjacent = function (tile) {
        var tileIdx = tile.collection.indexOf(tile),
            colIdx = this.data.indexOf(tile.collection),
            adjacent = [];

        // todo: figure out how to optimize this
        _.each(this.data, function (column, index) {
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

    DungeonQuest.prototype.isAdjacent = function (source, target) {
        return this.getAdjacent(source).indexOf(target) !== -1;
    };

    DungeonQuest.prototype.start = function () {
        this.board.render(this.data);
    };

    DungeonQuest.prototype.doTurn = function (trace) {
        var tiles = trace.data(), columns = this.data, remove;

        if (trace.length > 2) {
            _.each(tiles, function (tile) {
                remove = tile.doRemove(this.state, this.player);
                if (remove) {
                    this.state.increment('score', tile.get('points'));
                    this.player.increment('xp', tile.get('xp'));

                    _.each(columns, function (column) {
                        if (!column.get(tile.cid)) { return ; }

                        column.remove(tile);
                        this.fillColumn(column);
                    }, this);
                }
            }, this);
        }

        // step 1: verify game state (did we level up?)
        // step 2: call doTurn(state, player) on each remaining board tile
        // step 3: verify game state (are we dead?)

        trace.reset();
        trace.active = false;
        this.board.render(this.data);
    };


    var State = Backbone.Model.extend({
        increment: function (key, by) {
            var newTotal;

            if (!this.has(key)) {
                return;
            }

            newTotal = this.get(key) + by;
            this.set(key, newTotal);

            return newTotal;
        }
    });

    DungeonQuest.State = State;


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
        },

        doRemove: function (state, player) {
            return true;
        }
    });

    DungeonQuest.Tile = Tile;


    var Column = Backbone.Collection.extend({
        initialize: function (models, options) {
            this.index = options.index;
        },
        model: Tile
    });

    DungeonQuest.Column = Column;


    var GameBoard = function (options) {
        if (!(this instanceof GameBoard)) {
            return new GameBoard(options);
        }

        this.options = options;

        this._selection = this.options.selection;
        this.trace = new Trace();
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
            })
            .attr('data-cx', function (d, i) {
                return (board.options.tileWidth + board.options.tilePadding) *
                    i + (board.options.tileWidth / 2);
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

            trace.reset([this]);
            trace.active = true;
        });

        enterset.on('mouseover', function (d, i) {
            if (!board.trace.active) {
                return;
            }

            if (!board.trace.contains(this)) {
                board.trigger('trace:add', trace, this);
            } else if (board.trace.get(-2) === this) {
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


    return DungeonQuest;
}(d3, _, Backbone));
