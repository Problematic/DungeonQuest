module('Unit');
test('DungeonQuest.State', function () {
    var state = new DungeonQuest.State({
        foo: 5,
        baz: 'troz'
    });

    equal(state.get('foo'), 5, 'State should behave like a Backbone model');

    equal(state.increment('foo', 5), 10, 'State#increment should return the new value');
    equal(state.get('foo'), 10, 'State#increment should increment given key by given value');

    state.increment('foo', -4);
    equal(state.get('foo'), 6, 'State#increment should handle negative values as well');

    equal(state.increment('bar', 10), undefined, 'Incrementing a nonexistent key should return undefined');
    equal(state.get('bar'), undefined, 'Nonexistent value should not be created');

    equal(state.increment('bar', 10, true), 10, 'Incrementing with create=true should return value');
    equal(state.get('bar'), 10, 'Incrementing with create=true should create value');

    equal(state.increment('baz', 5), undefined, 'Incrementing a non-numeric value should return undefined');
    equal(state.get('baz'), 'troz', 'After invalid incrementing, value should be unchanged');
});
