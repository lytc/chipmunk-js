(function() {
    var Rope = CutTheRope.Rope = function(app, pos, len) {
        this.app = app
        this.pos = pos
        this.len = len
        this.init()
    }

    Rope.prototype = {
        mass:.1
        ,width: 4
        ,height: 20

        ,init: function() {
            var space = this.app.space
            var body, shape

            var halfHeight = this.height / 2
            var x = this.pos.x - this.width / 2
            var y = this.pos.y - halfHeight

            var bodies = []
            this.shapes = []
            for (var i = 0; i < this.len; i++) {
                bodies[i] = space.addBody(new cp.Body(this.mass, cp.momentForBox(this.mass, this.width, this.height)))
                bodies[i].setPos(cp.v(x, y))
                y -= this.height

                shape = space.addShape(new cp.BoxShape(bodies[i], this.width, this.height))
                shape.group = 1
                this.shapes.push(shape)
            }

            var pinBody = new cp.Body(Infinity, Infinity)
            pinBody.setPos(this.pos)
            var constraint
            constraint = space.addConstraint(new cp.PinJoint(pinBody, bodies[0], cp.v(0, 0), cp.v(0, halfHeight)))

            for (var i = 0; i < bodies.length - 1; i++) {
                constraint = space.addConstraint(new cp.PivotJoint(bodies[i], bodies[i + 1], cp.v(0, -halfHeight), cp.v(0, halfHeight)))
            }

//            bodies[4].v.x = 200
            this.bodies = bodies
        }

        ,jointCandy: function(candy) {
            this.app.space.addConstraint(new cp.PivotJoint(this.bodies[this.bodies.length - 1], candy.body, cp.v(0, -this.height / 2), cp.v(0, 0)))
        }

        ,draw: function() {
            var renderer = this.app.renderer
            // draw hook
            renderer.drawImage(
                this.app.images['obj_hook_01.png'],
                this.pos,
                cp.v(8, 8),
                35,
                35
            );

            var colors = ['#808080', '#D3D3D3']
            for (var i = 0; i < this.shapes.length; i++) {
                renderer.drawPolygon(this.shapes[i].tVerts, 0, colors[i%2])
            }

            renderer.drawImage(
                this.app.images['obj_hook_01.png'],
                this.pos,
                cp.v(.5, 53),
                18,
                18
            );
        }
    }
})()