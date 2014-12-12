module.exports = function (grunt) {

	grunt.initConfig({
		jsDir: 'public/js/',
		jsDistDir: 'dist/js/',
		cssDir: 'public/css/',
		cssDistDir: 'dist/css/',
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			js: {
				options: {
					separator: ';'
				},
				src: ['<%=jsDir%>*.js'],
				dest: '<%=jsDistDir%><%= pkg.name %>.js'
			},
			css: {
				src: ['<%=cssDir%>*.css'],
				dest: '<%=cssDistDir%><%= pkg.name %>.css'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%=grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			dist: {
				files: {
					'<%=jsDistDir%><%= pkg.name %>.min.js': ['<%= concat.js.dest %>']
				}
			}
		},
		cssmin: {
			add_banner: {
				options: {
					banner: '/*! <%= pkg.name %> <%=grunt.template.today("dd-mm-yyyy") %> */\n'
				},
				files: {
					'<%=cssDistDir%><%= pkg.name %>.min.css': ['<%= concat.css.dest %>']
				}
			}
		},
	jshint: {
		options : {
			curly: true,
			eqeqeq: true,
			//eqnull: true,
			forin: true,
			freeze: true,
			undef: true,
			unused: true
		},
		server: {
			src: ['./*.js', 'routes/**/*.js', 'database/*.js', 'utils/**/*.js'],
			options : {
				node: true,
				proto: true
			}
		},
		client: {
			src: ['public/js/ng/**/*.js'],
			options: {
				browser: true,
				jquery: true,
				devel: true,
				globals: {
					angular: false,
					PNotify: false
				}
			}
		}
	},
	jslint: {
		server: {
			src: ['./*.js', 'routes/**/*.js', 'database/*.js', 'utils/**/*.js'],
			directives: {
				node: true,
				sloppy: true,
				white: true,
				nomen: true
			}
		},
		client: {
			src: ['public/js/ng/**/*.js'],
			directives: {
				browser: true,
				sloppy: true,
				white: true,
				predef: [
					'angular',
					'jQuery',
					'$',
					'PNotify',
					'console'
				]
			}
		}
	},
		csslint: {
			src : ['public/css/**/*.css', 
				'!public/css/bootstrap.css',
				'!public/css/bootstrap.min.css',
				'!public/css/bootstrap-theme.css',
				'!public/css/bootstrap-theme.min.css',
				'!public/css/pnotify.custom.min.css']
		},
		watch: {
		files: ['<%=jsDir%>*.js', '<%=cssDir%>*.css'],
		tasks: ['concat', 'uglify', 'cssmin']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-csslint');
	grunt.loadNpmTasks('grunt-jslint');

	grunt.registerTask('default', [
		'concat',
		'uglify',
		'cssmin',
		'watch'
	]);
	
};
