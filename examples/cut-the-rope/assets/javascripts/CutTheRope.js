(function() {
    var GRABABLE_MASK_BIT = 1<<31
    var NOT_GRABABLE_MASK = ~GRABABLE_MASK_BIT

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
        'cursor.png',
        'obj_star_idle.png',
        'obj_star_disappear.png'
    ]

    var levels = [
        // 0
        function() {
            this.ropes = []
            var rope = new CutTheRope.Rope(this, v(0, 250), 7)
            rope.jointCandy(this.candy)
            this.ropes.push(rope)

            // stars
            this.starts = []
            var star
            star = new CutTheRope.Star(this, v(0, 30))
            this.starts.push(star)

            star = new CutTheRope.Star(this, v(0, -50))
            this.starts.push(star)

            star = new CutTheRope.Star(this, v(0, -130))
            this.starts.push(star)
        }
        // 1
        ,function() {
            this.ropes = []
            var rope = new CutTheRope.Rope(this, v(-130, 210), 7)
            rope.jointCandy(this.candy)
            this.ropes.push(rope)

            var rope = new CutTheRope.Rope(this, v(0, 210), 12)
            rope.jointCandy(this.candy)
            this.ropes.push(rope)

            var rope = new CutTheRope.Rope(this, v(130, 210), 20)
            rope.jointCandy(this.candy)
            this.ropes.push(rope)

            // stars
            this.starts = []
            var star
            star = new CutTheRope.Star(this, v(-130, 10))
            this.starts.push(star)

            star = new CutTheRope.Star(this, v(-130, -140))
            this.starts.push(star)

            star = new CutTheRope.Star(this, v(130, 10))
            this.starts.push(star)

            //
            this.character.setPos(v(130, -this.height / 2 + 70))
            this.charSupports.setPos(v(130, -this.height / 2 + 35))
        }
    ]

    var CutTheRope = window.CutTheRope = function(canvas) {
        this.canvas = canvas
        this.initializeSpace()
        this.initializeRenderer(canvas)
        this.initializeMouse()
        this.initializeMouseTrace()
        this.initializeStats()
        this.initializePxLoader()
        this.initializeCharSupports()
        this.initializeCharacter()
        this.initializeCandy()
        this.initCandyStarCollisionHandler()
        this.initCandyCharacterCollisionHandler()
    }

    CutTheRope.prototype = {
        width: 1024
        ,height: 576
        ,steps: 3
        ,GRABABLE_MASK_BIT: GRABABLE_MASK_BIT
        ,NOT_GRABABLE_MASK: NOT_GRABABLE_MASK
        ,mouseDown: false

        ,initializeSpace: function() {
            var space = this.space = window.space = new cp.Space()
            space.setIterations(120)
            space.gravity = v(0, -600)
            space.collisionSlop = .5
            space.sleepTimeThreshold = .5
            space.damping = .9
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
                mousedown: function() {
                    me.mouseDown = true
                }

                ,mouseup: function() {
                    me.mouseDown = false
                    me.mouseTrace.reset()
                }

                ,mousemove: function(e) {
                    var point = getMousePoint(e)
                    me.mouse.x = point.x
                    me.mouse.y = point.y

                    if (me.mouseDown) {
                        me.mouseTrace.add(point.x, point.y)
                    }
                }
            })
        }

        ,initializeMouseTrace: function() {
            var mouseTrace = this.mouseTrace = new CutTheRope.MouseTrace(this)
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
            var damping = this.space.damping
            space.damping = .1
            // run few step to make everything stable
            for (var i = 0; i < 200; i++) {
                this.space.step(1/120)
            }
            space.damping = damping
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
                me.mouseTrace.update(Date.now())
                me.detectCutTheRope()

                me.draw()
                stats.update()

                requestAnimationFrame(step)
            }

            step(0)
        }

        ,detectCutTheRope: function() {
            if (!this.mouseDown) {
                return
            }

            var start = this.mouseTrace.items[0]
            if (!start) {
                return
            }
            start = start.v
            var end = this.mouse

            this.space.segmentQuery(start, end, 2, cp.NO_GROUP, this.cutTheRope.bind(this));
        }

        ,cutTheRope: function(shape, t, n, context) {
            var space = this.space
            shape.layers = 0
            shape.instance.break(shape)
//            space.addPostStepCallback(function() {
//                space.removeConstraint(shape.body.constraintList)
//            })
        }

        ,initCandyStarCollisionHandler: function() {
            var me = this
            me.collidedStars = 0
            this.space.addCollisionHandler(0, 1, function(arb, space) {
                var shapes = arb.getShapes()
                var candy = shapes[0]
                var star = shapes[1]
                star.instance.destroy()
                me.collidedStars++
            })
        }

        ,initCandyCharacterCollisionHandler: function() {
            var me = this
            var space = this.space

            space.addCollisionHandler(0, 2, function(arb, space) {
                var shapes = arb.getShapes()
                var candy = shapes[0]
                var character = shapes[1]
                character.instance.setState('readyToEat')

                // break all ropes also
                for (var i = 0; i < me.ropes.length; i++) {
                    me.ropes[i].break()
                }

                //
                candy.layers = 0
//                space.addPostStepCallback(function() {
//                    space.removeConstraint(candy.body.constraintList)
//                })
                candy.instance.destroy()
            })
        }

        ,draw: function() {
            this.charSupports.draw()
            this.character.draw()
            this.drawRopes()
            this.candy.draw()
            this.drawStarts()
            this.mouseTrace.draw()
        }

        ,drawRopes: function() {
            var rope
            for (var i = 0; i < this.ropes.length; i++) {
                this.ropes[i].draw()
            }
        }

        ,drawStarts: function() {
            for (var i = 0; i < this.starts.length; i++) {
                this.starts[i].draw()
            }
        }
    }
})()