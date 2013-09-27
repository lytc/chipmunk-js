(function() {
    var v = cp.v

    var spriteSheet = {
        idle: {
            image: 'obj_star_idle.png',
            sprites: [
                {
                    offset: v(0, 92),
                    width: 32,
                    height: 32
                },{
                    offset: v(0, 125),
                    width: 32,
                    height: 158 - 125
                },{
                    offset: v(0, 158),
                    width: 29,
                    height: 191 - 158
                },{
                    offset: v(0, 191),
                    width: 27,
                    height: 223 - 191
                },{
                    offset: v(0, 223),
                    width: 24,
                    height: 257 - 223
                },{
                    offset: v(0, 257),
                    width: 22,
                    height: 290 - 257
                },{
                    offset: v(0, 290),
                    width: 20,
                    height: 324 - 290
                },{ // 2
                    offset: v(96, 0),
                    width: 114 - 96,
                    height: 34
                },{
                    offset: v(96, 34),
                    width: 111 - 96,
                    height: 67 - 34
                },{
                    offset: v(96, 67),
                    width: 111 - 96,
                    height: 101 - 67
                },{
                    offset: v(96, 101),
                    width: 114 - 96,
                    height: 135 - 101
                },{
                    offset: v(96, 135),
                    width: 116 - 96,
                    height: 168 - 135
                },{
                    offset: v(96, 168),
                    width: 119 - 96,
                    height: 201 - 168
                },{
                    offset: v(96, 201),
                    width: 122 - 96,
                    height: 234 - 201
                },{
                    offset: v(96, 234),
                    width: 125 - 96,
                    height: 267 - 234
                },{// 3
                    offset: v(124, 0),
                    width: 156 - 124,
                    height: 34
                },{
                    offset: v(124, 34),
                    width: 158 - 124,
                    height: 67 - 34
                },{
                    offset: v(124, 67),
                    width: 161 - 124,
                    height: 101 - 67
                }
            ]
        },

        disappear: {
            image: 'obj_star_disappear.png',
            sprites: [
                {
                    offset: v(0, 0),
                    width: 103,
                    height: 112
                },{
                    offset: v(0, 112),
                    width: 139,
                    height: 260 - 112
                },{
                    offset: v(0, 260),
                    width: 87,
                    height: 355 - 260
                },{
                    offset: v(0, 355),
                    width: 128,
                    height: 502 - 355
                },{// 2
                    offset: v(135, 0),
                    width: 296 - 135,
                    height: 188
                },{
                    offset: v(135, 188),
                    width: 271 - 135,
                    height: 351 - 188
                },{
                    offset: v(135, 351),
                    width: 275 - 135,
                    height: 484 - 351
                },{
                    offset: v(135, 484),
                    width: 260 - 135,
                    height: 594 - 484
                },{// 3
                    offset: v(294, 0),
                    width: 392 - 294,
                    height: 96
                },{
                    offset: v(294, 96),
                    width: 392 - 294,
                    height: 184 - 96
                },{
                    offset: v(294, 184),
                    width: 392 - 294,
                    height: 268 - 184
                },{
                    offset: v(294, 268),
                    width: 392 - 294,
                    height: 348 - 268
                },{
                    offset: v(392, 0),
                    width: 473 - 392,
                    height: 57
                }
            ]
        }
    }

    var Star = CutTheRope.Star = function(app, pos) {
        this.app = app
        this.pos = pos
        this.init()
    }

    Star.prototype = {
        width: 32
        ,height: 32
        ,image: 'obj_star_idle.png'
        ,disappearImage: 'obj_star_disappear.png'
        ,state: 'idle'
        ,count: 0
        ,index: 0

        ,init: function() {
            this.offset = cp.v(0, 92)
            var space = this.app.space

            var hw = this.width / 2
            var hh = this.height / 2
            var verts = [
                v(-hw, -hh),
                v(-hw, hh),
                v(hw, hh),
                v(hw, -hh)
            ]

            var body = this.body = new cp.Body(Infinity, Infinity)
            body.setPos(this.pos)
//            var shape = this.shape = space.addShape(new cp.PolyShape(body, verts, cp.vzero))
            var shape = this.shape = space.addShape(new cp.BoxShape(body, this.width, this.height))
            shape.layers = 1
            shape.setCollisionType(1)
            shape.instance = this
        }

        ,destroy: function() {
            var me = this
            var space = this.app.space
            space.addPostStepCallback(function() {
                space.removeShape(me.shape)
            })

            this.state = 'disappear'
            this.count = 0
            this.index = 0

            this.destroyed = true
        }

        ,draw: function() {
            if (this.done) {
                return
            }

            var bodyPos = this.body.getPos()

            if (this.state == 'idle') {
                this.app.renderer.drawImage(
                    this.app.images[this.image],
                    bodyPos,
                    cp.v(10, 10),
                    70,
                    70
                )
            }


            this.count++
            if (this.count > 3) {
                this.count = 0
                this.index += 1
            }

            var image = spriteSheet[this.state].image
            var sprites = spriteSheet[this.state].sprites
            if (this.index >= sprites.length) {
                if (this.state == 'disappear') {
                    this.done = true
                    return
                }
                this.index = 0
            }

//            window.index || (window.index = 0)
//            this.index = window.index

            var sprite = sprites[this.index]
            var width = sprite.width
            var height = sprite.height
            var offset = sprite.offset
            var pos = v(bodyPos.x, bodyPos.y - (this.height - height) / 2)

            this.app.renderer.drawImage(
                this.app.images[image],
                pos,
                offset,
                width,
                height
            )



//            this.app.renderer.drawImage(
//                this.app.images[this.image],
//                this.pos,
//                this.offset,
//                this.width,
//                this.height
//            )
        }
    }
})()