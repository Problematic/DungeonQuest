DungeonQuest.State = (function (Backbone) {
    "use strict";

    var State = Backbone.Model.extend({
        increment: function (key, by, create) {
            var oldTotal = this.get(key), newTotal;

            if (oldTotal !== undefined && isNaN(oldTotal)) {
                return;
            } else if (oldTotal === undefined && !create) {
                return;
            }

            newTotal = (oldTotal || 0) + by;

            this.set(key, newTotal);

            return newTotal;
        }
    });

    return State;
}(Backbone));
