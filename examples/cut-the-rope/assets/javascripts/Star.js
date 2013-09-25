(function() {
    var v = cp.v

    var Star = CutTheRope.Star = function(app, pos) {
        this.app = app
        this.pos = pos
        this.init()
    }

    Star.prototype = {
        width: 32
        ,height: 32
        ,image: 'obj_star_idle.png'
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
            for (var i = 0; i < verts.length; i++) {
                verts[i] = v.add(verts[i], this.pos)
            }
            var body, shape
            shape = space.addShape(new cp.PolyShape(space.staticBody, verts, cp.vzero))
            shape.group = 2
            shape.setCollisionType(1)
        }

        ,draw: function() {
            this.app.renderer.drawImage(
                this.app.images[this.image],
                this.pos,
                this.offset,
                this.width,
                this.height
            )
        }
    }
})()