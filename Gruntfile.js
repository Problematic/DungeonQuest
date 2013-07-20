module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: ['src/DungeonQuest.js', 'src/*.js'],
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
                tasks: ['jshint', 'qunit', 'concat']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['jshint', 'qunit']);
};
