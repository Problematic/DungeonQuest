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

        this.board = new DungeonQuest.GameBoard(this.options);
        this.state = new DungeonQuest.State({
            score: 0
        });
        this.player = new DungeonQuest.State({
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
        }

        // step 1: verify game state (did we level up?)
        // step 2: call doTurn(state, player) on each remaining board tile
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
