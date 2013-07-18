(function (DungeonQuest) {
    var game = new DungeonQuest({
        tileset: {
            coin: {
                type: 'coin',
                points: 5
            },
            potion: {
                type: 'potion',
                points: 1
            },
            skull: {
                type: 'skull',
                matches: ['sword'],
                points: 10
            },
            sword: {
                type: 'sword',
                matches: ['skull'],
                points: 1
            }
        },
        assetRoot: '../assets',
        selection: d3.select('.field').append('svg:svg').append('svg:g')
    });

    game.start();
}(DungeonQuest));
