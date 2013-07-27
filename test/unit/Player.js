module('Unit');
test('DungeonQuest.Player', function () {
    var MAX_HEALTH = 100, player = new DungeonQuest.Player({
            health: MAX_HEALTH,
            max_health: MAX_HEALTH
        });

    player.set('health', MAX_HEALTH * 2);
    equal(player.get('health'), MAX_HEALTH, 'Player health should not exceed max_health');
});
