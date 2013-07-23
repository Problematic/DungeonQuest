module('Scenario');
test('Path Tracing', function () {
    var column, tiles;
    ok(game instanceof DungeonQuest, 'A DungeonQuest is us!');

    // a cheater hack so we can select them without much fuss
    // todo: there's gotta be a better way to provide initial data
    column = game.data[0];
    column.at(0).set('type', 'coin');
    column.at(1).set('type', 'coin');
    column.at(2).set('type', 'coin');
    tiles = document.querySelectorAll('.tile');

    triggerEvent(tiles[0], 'mousedown');
    triggerEvent(tiles[1], 'mouseover');
    triggerEvent(tiles[2], 'mouseover');

    deepEqual(game.board.trace.models, column.slice(0, 3), 'Trace data should be equal to selected models');

    triggerEvent(tiles[2], 'mouseup');

    equal(game.board.trace.length, 0, 'After mouseup, trace data should be empty');
});
