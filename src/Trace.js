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
