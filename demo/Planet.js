(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'Planet'

        ,init: function() {
            // Create a rouge body to control the planet manually.
            this.planetBody = new cp.Body(Infinity, Infinity);
            this.planetBody.setAngVel(0.2);

            /*cpSpace*/ var space = this.space
            space.setIterations(20);

            for(var i=0; i<30; i++)
                add_box(space);

            /*cpShape*/ var shape = space.addShape(new cp.CircleShape(this.planetBody, 70.0, cp.vzero));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            return space;
        }

        ,update: function(/*double*/ dt) {
            this.space.step(dt);

            // Update the static body spin so that it looks like it's rotating.
            this.planetBody.updatePosition(dt);
        }
    })

/*cpFloat*/ var gravityStrength = 5.0e6;

//static void
    var planetGravityVelocityFunc = function(/*cpVect*/ gravity, /*cpFloat*/ damping, /*cpFloat*/ dt) {
        var body = this
        // Gravitational acceleration is proportional to the inverse square of
        // distance, and directed toward the origin. The central planet is assumed
        // to be massive enough that it affects the satellites but not vice versa.
        /*cpVect*/ var p = body.p
        /*cpFloat*/ var sqdist = cp.v.lengthsq(p);
        /*cpVect*/ var g = cp.v.mult(p, -gravityStrength / (sqdist * cp.fsqrt(sqdist)));

        cp.Body.prototype.updateVelocity.call(body, g, damping, dt)
//        body.updateVelocity(g, damping, dt);
    }

//static cpVect
    var rand_pos = function(/*cpFloat*/ radius) {
        /*cpVect*/ var v
        do {
            v = cp.v(Math.random()*(640 - 2*radius) - (320 - radius), Math.random()*(480 - 2*radius) - (240 - radius));
        } while(cp.v.len(v) < 85.0);

        return v;
    }

//static void
    var add_box = function(/*cpSpace*/ space) {
        /*cpFloat*/ var size = 10.0;
        /*cpFloat*/ var mass = 1.0;

        /*cpVect*/ var verts = [
            cp.v(-size,-size),
            cp.v(-size, size),
            cp.v( size, size),
            cp.v( size,-size)
        ];

        /*cpFloat*/ var radius = cp.v.len(cp.v(size, size));
        /*cpVect*/ var pos = rand_pos(radius);

        /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForPoly(mass, verts, cp.vzero)));
        body.updateVelocity = planetGravityVelocityFunc;
        body.setPos(pos);

        // Set the box's velocity to put it into a circular orbit from its
        // starting position.
        /*cpFloat*/ var r = cp.v.len(pos);
        /*cpFloat*/ var v = cp.fsqrt(gravityStrength / r) / r;
        body.setVel(cp.v.mult(cp.v.perp(pos), v));

        // Set the box's angular velocity to match its orbital period and
        // align its initial angle with its position.
        body.setAngVel(v);
        body.setAngle(cp.fatan2(pos.y, pos.x));

        /*cpShape*/ var shape = space.addShape(new cp.PolyShape(body, verts, cp.vzero));
        shape.setElasticity(0.0);
        shape.setFriction(0.7);
    }
})(function() {
   return this;
}())