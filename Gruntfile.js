module.exports = function (grunt) {
    var fs = require('fs')
    var license = fs.readFileSync('LICENSE.txt', {encoding: 'utf8'})
    license = '/*\n * ' + license.replace(/\n/g, '\n * ') + '\n */\n\n'

    license += '/*\n' +
     ' * Chipmunk JS 6.2.0 - Port of Chipmunk Physics\n' +
     ' * @author lytc\n' +
     ' */\n'

    var files = [
        'src/chipmunk.js',
        'include/chipmunk/chipmunk_types.js',
        'include/chipmunk/cpVect.js',
        'src/cpVect.js',

        'src/constraints/cpConstraint.js',
        'src/constraints/cpDampedRotarySpring.js',
        'src/constraints/cpDampedSpring.js',
        'src/constraints/cpGearJoint.js',
        'src/constraints/cpGrooveJoint.js',
        'src/constraints/cpPinJoint.js',
        'src/constraints/cpPivotJoint.js',
        'src/constraints/cpRatchetJoint.js',
        'src/constraints/cpRotaryLimitJoint.js',
        'src/constraints/cpSimpleMotor.js',
        'src/constraints/cpSlideJoint.js',
        'src/cpArbiter.js',
        'include/chipmunk/cpArbiter.js',
        'src/cpArray.js',
        'include/chipmunk/cpBB.js',
        'src/cpBB.js',
        'src/cpSpatialIndex.js',
        'src/cpBBTree.js',
        'src/cpBody.js',
        'src/cpCollision.js',
        'include/chipmunk/cpShape.js',
        'src/cpShape.js',
        'src/cpPolyShape.js',
        'src/cpSpace.js',
        'src/cpSpaceComponent.js',
        'src/cpSpaceQuery.js',
        'src/cpSpaceStep.js',

        'include/chipmunk/cpBody.js',
        'include/chipmunk/cpSpace.js',
        'include/chipmunk/chipmunk_private.js',
        'include/chipmunk/constraints/cpConstraint.js',
        'include/chipmunk/constraints/util.js'
    ]

    grunt.initConfig({
        concat: {
            all: {
                dest: 'cp.js',
                src: ['src/debug.js'].concat(files)
            },
            min: {
                dest: 'cp.min.js',
                src: files
            }
        },
        uglify: {
            debug: {
                options: {
                    banner: license,
                    wrap: 'cp',
                    mangle: false,
                    compress: false,
                    beautify: true,
                    preserveComments: 'all'
                },
                files: {
                    'cp.js': 'cp.js'
                }
            },

            minify: {
                options: {
                    banner: license,
                    wrap: 'cp',
                    compress: {
                        global_defs: {
                            NDEBUG: false
                        }
                    }
                },
                files: {
                    'cp.min.js': 'cp.min.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['concat', 'uglify']);
}
