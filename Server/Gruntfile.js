module.exports = function(grunt) {

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
			src: ['Gruntfile.js', 'routes/**/*.js', 'database/*.js'],
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
				devel: true
			}
		}
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

  grunt.registerTask('default', [
    'concat',
    'uglify',
    'cssmin',
    'watch'
  ]);
  
};