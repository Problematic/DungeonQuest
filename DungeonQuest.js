var DungeonQuest = (function (d3, _, Backbone, undefined) {
    "use strict";

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

        this.board = new DungeonQuest.GameBoard(this.options);
        this.state = new DungeonQuest.State({
            score: 0
        });
        this.player = new DungeonQuest.Player({
            level: 1,
            xp: 0
        });
        this.data = [];

        this.listenTo(this.board, 'trace:end', this.doTurn);
        this.listenTo(this.board, 'trace:add', function (trace, tile) {
            var lastSelection = trace.at(trace.length - 1);

            // todo: prevent crossing the trace line on a diagonal?
            // todo: path tracing to see if we can draw a valid
            // straight line between two tiles (instead of just adjacent)
            if (this.isAdjacent(lastSelection, tile) &&
                lastSelection.isMatch(tile)) {
                trace.push(tile);
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
        }, tile.attributes, this.state.get(tile.attributes.type));
        instance = new DungeonQuest.Tile(attributes);
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
        var data = [], column;

        _.each(this.tileset, function (tile) {
            tile.methods.register(this.state, this.player);
        }, this);

        for (var i = 0; i < this.options.columnCount; i++) {
            column = new DungeonQuest.Column(null, {
                index: i
            });
            data.push(this.fillColumn(column));
        }
        this.data = data;

        this.board.render(this.data);
    };

    DungeonQuest.prototype.doTurn = function (trace) {
        var tiles = trace.models, columns = this.data, remove;

        if (trace.length > 2) {
            _.each(tiles, function (tile) {
                tile.preRemove(this.state, this.player);
            }, this);

            _.each(tiles, function (tile) {
                remove = tile.doRemove(this.state, this.player);
                if (remove) {
                    this.state.increment('score', tile.get('points'));
                    this.player.increment('xp', tile.get('xp'));

                    _.each(columns, function (column) {
                        if (!column.get(tile.cid)) { return ; }

                        column.remove(tile);
                    }, this);
                }
            }, this);

            _.each(tiles, function (tile) {
                tile.postRemove(this.state, this.player);
            }, this);
        }

        // step 1: verify game state (did we level up?)
        // step 2: call doTurn(state, player) on each remaining board tile
        _.each(columns, function (column) {
            _.each(column.models, function (tile) {
                tile.doTurn(this.state, this.player);
            }, this);
        }, this);
        // step 3: verify game state (are we dead?)

        _.each(columns, function (column) {
            this.fillColumn(column);
        }, this);

        trace.reset();
        trace.active = false;
        this.board.render(this.data);
    };

    return DungeonQuest;
}(d3, _, Backbone));

DungeonQuest.Column = (function (Backbone, DungeonQuest) {
    "use strict";

    var Column = Backbone.Collection.extend({
        initialize: function (models, options) {
            this.index = options.index;
        },
        model: DungeonQuest.Tile
    });

    return Column;
}(Backbone, DungeonQuest));

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

DungeonQuest.State = (function (Backbone) {
    "use strict";

    var State = Backbone.Model.extend({
        increment: function (key, by) {
            var newTotal;

            if (!this.has(key)) {
                return;
            }

            newTotal = this.get(key) + by;
            this.set(key, newTotal);

            return this;
        }
    });

    return State;
}(Backbone));

DungeonQuest.Player = (function (Backbone, DungeonQuest) {
    "use strict";

    return DungeonQuest.State.extend({
        initialize: function (options) {
            this.on('change:health', function (model, value) {
                var max_health = this.get('max_health');
                if (this.get('health') > max_health) {
                    this.set('health', max_health);
                }
            });
        }
    });
}(Backbone, DungeonQuest));

DungeonQuest.Tile = (function (Backbone) {
    "use strict";

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

        increment: function (key, by) {
            var newTotal;

            if (!this.has(key)) {
                return;
            }

            newTotal = this.get(key) + by;
            this.set(key, newTotal);

            return newTotal;
        },

        preRemove: function (state, player) {},
        doRemove: function (state, player) {
            return true;
        },
        postRemove: function (state, player) {},

        doTurn: function (state, player) {}
    });

    return Tile;
}(Backbone));

DungeonQuest.GameBoard.Trace = (function (Backbone, DungeonQuest) {
    "use strict";

    var Trace = Backbone.Collection.extend({
        model: DungeonQuest.Tile,
        active: false,
        selection: function (selection) {
            return selection.selectAll('.trace')
                .data(this.models, function (d) {
                    return d.cid;
                });
        }
    });

    return Trace;
}(Backbone, DungeonQuest));
