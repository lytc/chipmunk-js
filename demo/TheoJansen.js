/*
 * The previous WalkBot demo I designed was fairly disappointing, so I implemented
 * the mechanism that Theo Jansen uses in his kinetic sculptures. Brilliant.
 * Read more here: http://en.wikipedia.org/wiki/Theo_Jansen
 */

(function(global) {
    var Demo = global.Demo

    /*cpFloat*/ var seg_radius = 3.0;

    Demo.add({
        name: 'Theo Jansen Machine'
        ,messageString: "Use the arrow keys to control the machine."
        ,steps: 3
        ,init: function() {
            /*cpSpace*/ var space = this.space
            space.setIterations(20);
            space.gravity = cp.v(0,-500);

            /*cpBody*/ var staticBody = space.staticBody;
            /*cpShape*/ var shape
            /*cpVect*/ var a, b;

            // Create segments around the edge of the screen.
            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,-240), cp.v(-320,240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(320,-240), cp.v(320,240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,-240), cp.v(320,-240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            /*cpFloat*/ var offset = 30.0;

            // make chassis
            /*cpFloat*/ var chassis_mass = 2.0;
            a = cp.v(-offset, 0.0), b = cp.v(offset, 0.0);

            /*cpBody*/ chassis = space.addBody(new cp.Body(chassis_mass, cp.momentForSegment(chassis_mass, a, b)));

            shape = space.addShape(new cp.SegmentShape(chassis, a, b, seg_radius));
            shape.group = 1;

            // make crank
            /*cpFloat*/ var crank_mass = 1.0;
            /*cpFloat*/ var crank_radius = 13.0;
            /*cpBody*/ var crank = space.addBody(new cp.Body(crank_mass, cp.momentForCircle(crank_mass, crank_radius, 0.0, cp.vzero)));

            shape = space.addShape(new cp.CircleShape(crank, crank_radius, cp.vzero));
            shape.group = 1;

            space.addConstraint(new cp.PivotJoint(chassis, crank, cp.vzero, cp.vzero));

            /*cpFloat*/ var side = 30.0;

            /*int*/ var num_legs = 2;
            for(var i=0; i<num_legs; i++){
                make_leg(space, side,  offset, chassis, crank, cp.v.mult(cp.v.forangle(/*cpFloat*/(2*i+0)/num_legs*Math.PI), crank_radius));
                make_leg(space, side, -offset, chassis, crank, cp.v.mult(cp.v.forangle(/*cpFloat*/(2*i+1)/num_legs*Math.PI), crank_radius));
            }

            this.motor = space.addConstraint(new cp.SimpleMotor(chassis, crank, 6.0));

            return space;
        }

        ,update: function(/*double*/ dt) {
            /*cpFloat*/ var coef = (2.0 + Demo.keyboard.y)/3.0;
            /*cpFloat*/ var rate = Demo.keyboard.x*10.0*coef;
            this.motor.rate = rate;
            this.motor.maxForce = (rate ? 100000.0 : 0.0);

            this.space.step(dt);
        }
    })



// static /*cpConstraint*/ var motor = new cpConstraint();



//static void
    var make_leg = function(/*cpSpace*/ space, /*cpFloat*/ side, /*cpFloat*/ offset, /*cpBody*/ chassis, /*cpBody*/ crank, /*cpVect*/ anchor) {
        /*cpVect*/ var a, b;
        /*cpShape*/ var shape

        /*cpFloat*/ var leg_mass = 1.0;

        // make leg
        a = cp.vzero, b = cp.v(0.0, side);
        /*cpBody*/ var upper_leg = space.addBody(new cp.Body(leg_mass, cp.momentForSegment(leg_mass, a, b)));
        upper_leg.setPos(cp.v(offset, 0.0));

        shape = space.addShape(new cp.SegmentShape(upper_leg, a, b, seg_radius));
        shape.group = 1;

        space.addConstraint(new cp.PivotJoint(chassis, upper_leg, cp.v(offset, 0.0), cp.vzero));

        // lower leg
        a = cp.vzero, b = cp.v(0.0, -1.0*side);
        /*cpBody*/ var lower_leg = space.addBody(new cp.Body(leg_mass, cp.momentForSegment(leg_mass, a, b)));
        lower_leg.setPos(cp.v(offset, -side));

        shape = space.addShape(new cp.SegmentShape(lower_leg, a, b, seg_radius));
        shape.group = 1;

        shape = space.addShape(new cp.CircleShape(lower_leg, seg_radius*2.0, b));
        shape.group = 1;
        shape.setElasticity(0.0);
        shape.setFriction(1.0);

        space.addConstraint(new cp.PinJoint(chassis, lower_leg, cp.v(offset, 0.0), cp.vzero));

        space.addConstraint(new cp.GearJoint(upper_leg, lower_leg, 0.0, 1.0));

        /*cpConstraint*/ var constraint
        /*cpFloat*/ var diag = cp.fsqrt(side*side + offset*offset);

        constraint = space.addConstraint(new cp.PinJoint(crank, upper_leg, anchor, cp.v(0.0, side)));
        constraint.dist = diag;

        constraint = space.addConstraint(new cp.PinJoint(crank, lower_leg, anchor, cp.vzero));
        constraint.dist = diag;
    }
})(function() {
   return this;
}())