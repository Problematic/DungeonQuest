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
