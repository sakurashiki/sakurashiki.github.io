module.exports = function (g) {

	var pkg = g.file.readJSON('package.json');

	g.loadNpmTasks('grunt-contrib-coffee');
	g.loadNpmTasks('grunt-contrib-compass');
	g.loadNpmTasks('grunt-contrib-concat');
	g.loadNpmTasks('grunt-contrib-uglify');
	g.loadNpmTasks('grunt-contrib-cssmin');
	g.loadNpmTasks('grunt-contrib-watch');
	g.loadNpmTasks('grunt-contrib-connect');
	g.loadNpmTasks('grunt-open');

	var liveReloadPort = 35729;
    var lrSnippet = require('connect-livereload')({port: liveReloadPort});
    var mountFolder = function (connect, dir) {
        return connect.static(require('path').resolve(dir));
    };

	g.initConfig({
		coffee: {
			compile: {
				files: [{
					expand: true,
					cwd: 'js/coffee/',
					src: '**/*.coffee',
					dest: 'js/js/', ext: '.js'
				}]
			}
		},
		compass: {
			compile: {
				options: {
					config: 'config.rb'
					// src : 'css/sass/*.scss',
					// dest: 'css/css/*.css'
				}
			}
		},
		concat: {
			js: {
				src : 'js/js/*.js',
				dest: 'js/concat/common.js'
			},
			css: {
				src : 'css/css/*.css',
				dest: 'css/concat/common.css'
			}
		},
		uglify: {
			dist: {
				files: {
					'js/common-min.js': 'js/concat/common.js'
				}
			}
		},
		cssmin: {
			minify: {
				files: {
					'css/common-min.css': 'css/concat/common.css'
				}
			}
		},
		watch: {
            options: { livereload: liveReloadPort},
			files: [
				'*.html',
				'img/*.jpg','img/*.png','img/*.gif',
				'js/coffee/*.coffee',
				'css/sass/*.scss'
			],
			tasks: ['coffee','compass','concat','uglify','cssmin']
		},
		connect: {
			options: {
				port: 9001,
				hostname : 'localhost'
			},
			livereload: {
				options: {
					middleware: function (connect) {
						return [ lrSnippet, mountFolder(connect, './') ];
					}
				}
			}
		},
        open: {
            server: {
                url: 'http://localhost:<%=connect.options.port%>'
            }
        }
	});

	g.registerTask('default',['connect:livereload','open','watch']);

};