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
