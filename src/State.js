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
