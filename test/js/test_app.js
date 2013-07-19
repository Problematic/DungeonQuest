(function (DungeonQuest) {
    var STARTING_HEALTH = 100;

    var game = new DungeonQuest({
        tileset: {
            coin: {
                attributes: {
                    type: 'coin',
                    points: 5
                },
                methods: {
                    register: function (state, player) {
                        state.set('coin', {
                            value: 1
                        });
                        player.set('coin', 0);
                    },
                    doRemove: function (state, player) {
                        player.increment('coin', state.get('coin').value);

                        return true;
                    }
                }
            },
            potion: {
                attributes: {
                    type: 'potion',
                    points: 1
                },
                methods: {
                    register: function (state, player) {
                        state.set('potion', {
                            value: 1
                        });
                        player.set('health', STARTING_HEALTH);
                        player.set('max_health', STARTING_HEALTH);
                    },
                    doRemove: function (state, player) {
                        var max = player.get('max_health'),
                            newTotal = player.get('health') + this.get('value');
                        if (newTotal > max) {
                            newTotal = max;
                        }

                        player.set('health', newTotal);

                        return true;
                    }
                }
            },
            skull: {
                attributes: {
                    type: 'skull',
                    matches: ['sword'],
                    points: 10
                },
                methods: {
                    register: function (state, player) {
                        state.set('skull', {
                            level: 1,
                            attack: 1,
                            health: 1,
                            xp: 1
                        });
                    },
                    doRemove: function (state, player) {
                        if (player.get('attack') >= this.get('health')) {
                            player.increment('xp', this.get('xp'));
                            return true;
                        }

                        return false;
                    }
                }
            },
            sword: {
                attributes: {
                    type: 'sword',
                    matches: ['skull'],
                    points: 1
                },
                methods: {
                    register: function (state, player) {
                        state.set('sword', {
                            attack: 1
                        });
                        player.set('attack', 1);
                    }
                }
            }
        },
        assetRoot: '../assets',
        selection: d3.select('.field').append('svg:svg').append('svg:g')
    });

    game.start();
}(DungeonQuest));
