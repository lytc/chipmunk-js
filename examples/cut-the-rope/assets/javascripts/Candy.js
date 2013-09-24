(function() {
    var Candy = CutTheRope.Candy = function(app) {
        this.app = app
        this.init()
    }

    Candy.prototype = {
        mass: 1
        ,radius: 24
        ,image: 'obj_candy_01.png'

        ,init: function() {
            this.offset = cp.v(0, 0)

            var space = this.app.space
            var body = this.body = space.addBody(new cp.Body(this.mass, cp.momentForCircle(this.mass, 0, this.radius, cp.vzero)))
            var shape = this.shape = space.addShape(new cp.CircleShape(body, this.radius, cp.vzero))
            shape.group = 1
        }

        ,setPos: function(p) {
            this.body.setPos(p)
        }

        ,draw: function() {
            this.app.renderer.drawImage(
                this.app.images[this.image],
                this.body.p,
                cp.v(5, 0),
                this.radius * 2,
                this.radius * 2
            );
            this.app.renderer.drawImage(
                this.app.images[this.image],
                this.body.p,
                cp.v(0, 65),
                this.radius * 2,
                this.radius * 2
            );
            this.app.renderer.drawImage(
                this.app.images[this.image],
                this.body.p,
                cp.v(0, 112),
                this.radius * 2,
                this.radius * 2
            )
        }
    }
})()