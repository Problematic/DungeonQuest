module('Unit');
test('DungeonQuest.Player', function () {
    var MAX_HEALTH = 100, player = new DungeonQuest.Player({
            health: MAX_HEALTH,
            max_health: MAX_HEALTH
        });

    player.set('health', MAX_HEALTH * 2);
    equal(player.get('health'), MAX_HEALTH, 'Player health should not exceed max_health');

    player.set('health', MAX_HEALTH - 10);

    player.increment('health', 5);
    equal(player.get('health'), MAX_HEALTH - 5, 'Player#increment should increment given key properly');

    player.increment('health', -5);
    equal(player.get('health'), MAX_HEALTH - 10, 'Player#increment should also accept negative numbers');
});
