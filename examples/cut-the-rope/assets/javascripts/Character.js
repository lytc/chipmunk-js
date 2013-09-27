(function() {
    var v = cp.v

    var spriteSheet = {
        waiting: [
            {
                offset: v(0, 0),
                width: 83,
                height: 86
            },{
                offset: v(0, 86),
                width: 83,
                height: 85 // 170 - 86
            },{
                offset: v(0, 170),
                width: 83,
                height: 84 // 254 - 170
            },{
                offset: v(0, 254),
                width: 83,
                height: 85 // 339 - 254
            },{
                offset: v(0, 339),
                width: 83,
                height: 85 // 424 - 339
            },{
                offset: v(0, 424),
                width: 83,
                height: 87 // 511 - 424
            },{
                offset: v(0, 511),
                width: 83,
                height: 88 // 599 - 511
            },{
                offset: v(0, 599),
                width: 83,
                height: 90 // 689 - 599
            },{
                offset: v(0, 689),
                width: 83,
                height: 91 // 780 - 689
            },{
                offset: v(0, 780),
                width: 83,
                height: 90 // 870 - 780
            },{
                offset: v(83, 0),
                width: 83,
                height: 92
            },{
                offset: v(83, 92),
                width: 83,
                height: 92 // 184 - 92
            },{
                offset: v(83, 184),
                width: 83,
                height: 92 // 276 - 184
            },{
                offset: v(83, 276),
                width: 83,
                height: 93 // 369 - 276
            },{
                offset: v(83, 369),
                width: 83,
                height: 93 // 462 - 369
            },{
                offset: v(83, 462),
                width: 83,
                height: 91 // 553 - 462
            },{
                offset: v(83, 553),
                width: 83,
                height: 89 // 642 - 553
            },{
                offset: v(83, 642),
                width: 83,
                height: 88 // 730 - 642
            },{
                offset: v(83, 730),
                width: 83,
                height: 87 // 817 - 730
            }
        ]
        ,readyToEat: [
            {
                offset: v(83, 817),
                width: 83,
                height: 93
            },{
                offset: v(166, 0),
                width: 85,
                height: 88
            },{
                offset: v(166, 88),
                width: 85,
                height: 86 // 174 - 88
            },{
                offset: v(166, 174),
                width: 85,
                height: 86 // 259 - 173
            },{
                offset: v(166, 259),
                width: 85,
                height: 84 // 343 - 259
            },{
                offset: v(166, 343),
                width: 85,
                height: 82 // 425 - 343
            },{
                offset: v(166, 425),
                width: 85,
                height: 82 // 507 - 425
            },{
                offset: v(166, 507),
                width: 85,
                height: 82 // 589 - 507
            },{
                offset: v(166, 589),
                width: 85,
                height: 82 // 671 - 589
            },{
                offset: v(166, 671),
                width: 85,
                height: 85 // 756 - 671
            },{
                offset: v(166, 756),
                width: 85,
                height: 90 // 846 - 756
            },{
                offset: v(251, 0),
                width: 85, // 336 - 251
                height: 80 //
            },{
                offset: v(251, 80),
                width: 91, // 342 - 251
                height: 71 // 151 - 80
            }
        ]
        ,eating: [
            {
                offset: v(251, 151),
                width: 103, // 354 - 251
                height: 81 // 232 - 151
            },{
                offset: v(251, 232),
                width: 93, // 344 - 251
                height: 81 // 313 - 232
            },{
                offset: v(251, 313),
                width: 85, // 336 - 251
                height: 84 // 397 - 313
            },{
                offset: v(251, 397),
                width: 83, // 334 - 251
                height: 89 // 486 - 397
            },{
                offset: v(251, 486),
                width: 83,
                height: 91 // 577 - 486
            },{
                offset: v(251, 577),
                width: 84, // 335 - 251
                height: 93 // 670 - 577
            },{
                offset: v(251, 670),
                width: 85, // 336 - 251
                height: 91 // 761 - 670
            },{
                offset: v(251, 761),
                width: 93, // 344 - 251
                height: 88 // 849 - 761
            },{
                offset: v(353, 0),
                width: 100, // 453 - 353
                height: 84 //
            }
        ]
    }


    var Character = CutTheRope.Character = function(app, pos) {
        this.app = app
        this.pos = pos
        this.init()
    }

    Character.prototype = {
        width: 84
        ,height: 86
        ,sprites: 9
        ,image: 'char_animations.png'
        ,state: 'waiting'
        ,count: 0
        ,index: 0

        ,init: function() {
            var body = this.body = new cp.Body(Infinity, Infinity)
            body.setPos(this.pos)
            var shape = this.shape = space.addShape(new cp.BoxShape(body, this.width, this.height))
            shape.layers = 1
            shape.setCollisionType(2)
            this.initializeAnimate()
            shape.instance = this
        }

        ,initializeAnimate: function() {
//            window.height = 85
//            window.i = 0
            var offset = this.offset = cp.v(0, 0)
//            var me = this

//            var offsetY = this.height
//            var size = this.height * this.sprites
//            setInterval(function() {
//                offset.y += offsetY
//                if (offset.y >= size) {
//                    offset.y = 0
//                }
//            }, 1000 / this.sprites)
        }

        ,setPos: function(pos) {
            this.body.setPos(pos)
        }

        ,setState: function(state) {
            this.state = state
            var me = this
//            if (state == 'readyToEat') {
//                setTimeout(function() {
//                    me.setState('eating')
//                }, 300)
//            }
        }

        ,draw: function() {
            this.count++
            if (this.count > 2) {
                this.count = 0
                this.index += 1
            }

            var sprites = spriteSheet[this.state]
            if (this.index >= sprites.length) {
                this.index = 0
                if (this.state == 'readyToEat') {
                    this.state = 'eating'
                }
            }

            var sprite = sprites[this.index]
            var width = sprite.width
            var height = sprite.height
            var offset = sprite.offset
            var bodyPos = this.body.getPos()
            var pos = v(bodyPos.x, bodyPos.y - (this.height - height) / 2)

            this.app.renderer.drawImage(
                this.app.images[this.image],
                pos,
                offset,
                width,
                height
            )
        }
    }
})()

//85 Character.js:33
//170 Character.js:33
//255 Character.js:33
//340 Character.js:33
//425 Character.js:33
//510 Character.js:33
//595 Character.js:33
//680 Character.js:33
//765