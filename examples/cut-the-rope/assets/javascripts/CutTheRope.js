(function() {
    var v = cp.v
    var requestAnimationFrame = window.requestAnimationFrame
                                || window.webkitRequestAnimationFrame
                                || window.mozRequestAnimationFrame
                                || window.msRequestAnimationFrame
                                || window.oRequestAnimationFrame

    var imagePath = 'assets/images'
    var images = [
        'char_supports.png',
        'char_animations.png',
        'obj_candy_01.png',
        'obj_hook_01.png',
        'cursor.png'
    ]

    var levels = [
        function() {
            this.ropes = []
            var rope = new CutTheRope.Rope(this, v(0, 250), 7)
            rope.jointCandy(this.candy)
            this.ropes.push(rope)
        }
    ]

    var CutTheRope = window.CutTheRope = function(canvas) {
        this.canvas = canvas
        this.initializeSpace()
        this.initializeRenderer(canvas)
        this.initializeMouse()
        this.initializeStats()
        this.initializePxLoader()
        this.initializeCharSupports()
        this.initializeCharacter()
        this.initializeCandy()
    }

    CutTheRope.prototype = {
        width: 1024
        ,height: 576
        ,steps: 2

        ,initializeSpace: function() {
            var space = this.space = new cp.Space()
            space.setIterations(30)
            space.gravity = v(0, -300)
            space.collisionSlop = .5
            space.sleepTimeThreshold = .5
            space.damping = .8
        }

        ,initializeRenderer: function(canvas) {
            this.renderer = new CutTheRope.Renderer(canvas, this.width, this.height)
        }

        ,initializeMouse: function() {
            this.mouse = v(0, 0)
            var me = this

            function getMousePoint(e) {
                if(e.offsetX == undefined) {
                    var targetOffset = $(e.target).offset();
                    e.offsetX = e.pageX - targetOffset.left;
                    e.offsetY = e.pageY - targetOffset.top;
                }

                return me.renderer.canvas2point(e.offsetX, e.offsetY)
            }

            $(this.canvas).on({
                mousemove: function(e) {
                    var point = getMousePoint(e)
                    me.mouse.x = point.x
                    me.mouse.y = point.y
                }
            })
        }

        ,initializeStats: function() {
            var stats = this.stats = new Stats()
            $(stats.domElement).css({
                position: 'fixed'
                ,top: 0
                ,right: 0
                ,zIndex: 9999
            }).appendTo(document.body)
        }

        ,initializePxLoader: function() {
            this.pxLoaded = false
            var pxLoader = this.pxLoader = new PxLoader()

            this.images = {}
            for (var i = 0; i < images.length; i++) {
                this.images[images[i]] = pxLoader.addImage(imagePath + '/' + images[i])
            }
        }

        ,initializeCharSupports: function() {
            var charSupports = this.charSupports = new CutTheRope.CharSupports(this, v(0, -this.height / 2 + 25))
        }

        ,initializeCharacter: function() {
            var character = this.character = new CutTheRope.Character(this, v(0, -this.height / 2 + 60))
        }

        ,initializeCandy: function() {
            var candy = this.candy = new CutTheRope.Candy(this)
            candy.setPos(cp.v(0, 150))
        }

        ,setLevel: function(level) {
            levels[level].call(this)
        }

        ,run: function() {
            var me = this

            if (!this.pxLoaded) {
                this.pxLoader.addCompletionListener(function() {
                    me.pxLoaded = true
                    me.run()
                })
                this.pxLoader.start()
                return this
            }

            var stats = this.stats
            var space  = this.space
            var renderer = this.renderer
            var step = function(dt) {
                renderer.clear()

                var dt = 1/60/me.steps
                for (var i = 0; i < me.steps; i++) {
                    space.step(dt)
                }

                me.draw()
                stats.update()

                requestAnimationFrame(step)
            }

            step(0)
        }

        ,draw: function() {
            this.charSupports.draw()
            this.character.draw()
            this.drawRopes()
            this.candy.draw()
        }

        ,drawRopes: function() {
            var rope
            for (var i = 0; i < this.ropes.length; i++) {
                this.ropes[i].draw()
            }
        }
    }
})()