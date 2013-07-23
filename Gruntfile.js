module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: [
                    'src/DungeonQuest.js',
                    'src/Column.js',
                    'src/GameBoard.js',
                    'src/State.js',
                    'src/Player.js',
                    'src/Tile.js',
                    'src/Trace.js'
                ],
                dest: 'DungeonQuest.js'
            }
        },
        jshint: {
            all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
        },
        qunit: {
            all: ['test/**/*.html']
        },
        watch: {
            scripts: {
                files: ['src/**/*.js', 'test/**/*.js'],
                tasks: ['jshint', 'qunit']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['jshint', 'qunit', 'concat']);
};
