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

        doTurn: function (state, player) {},

        x: function () {
            return this.collection.index;
        },
        y: function () {
            return this.collection.indexOf(this);
        }
    });

    return Tile;
}(Backbone));
