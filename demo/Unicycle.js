(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'Unicycle'
        ,messageString: "This unicycle is completely driven and balanced by a single cpSimpleMotor.\nMove the mouse to make the unicycle follow it."
        ,init: function() {
            /*cpSpace*/ var space = this.space
            space.setIterations(30);
            space.gravity = (cp.v(0, -500));

            {
                /*cpShape*/ var shape;
                /*cpBody*/ var staticBody = space.staticBody;

                shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-3200,-240), cp.v(3200,-240), 0.0));
                shape.setElasticity(1.0);
                shape.setFriction(1.0);
                shape.layers = Demo.NOT_GRABABLE_MASK;

                shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(0,-200), cp.v(240,-240), 0.0));
                shape.setElasticity(1.0);
                shape.setFriction(1.0);
                shape.layers = Demo.NOT_GRABABLE_MASK;

                shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-240,-240), cp.v(0,-200), 0.0));
                shape.setElasticity(1.0);
                shape.setFriction(1.0);
                shape.layers = Demo.NOT_GRABABLE_MASK;
            }


            {
                /*cpFloat*/ var radius = 20.0;
                /*cpFloat*/ var mass = 1.0;

                /*cpFloat*/ var moment = cp.momentForCircle(mass, 0.0, radius, cp.vzero);
                wheel_body = space.addBody(new cp.Body(mass, moment));
                wheel_body.p = cp.v(0.0, -160.0 + radius);

                /*cpShape*/ var shape = space.addShape(new cp.CircleShape(wheel_body, radius, cp.vzero));
                shape.u = 0.7;
                shape.group = 1;
            }

            {
                /*cpFloat*/ var cog_offset = 30.0;

                /*cpBB*/ var bb1 = new cp.BB(-5.0, 0.0 - cog_offset, 5.0, cog_offset*1.2 - cog_offset);
                /*cpBB*/ var bb2 = new cp.BB(-25.0, bb1.t, 25.0, bb1.t + 10.0);

                /*cpFloat*/ var mass = 3.0;
                /*cpFloat*/ var moment = cp.momentForBox2(mass, bb1) + cp.momentForBox2(mass, bb2);

                balance_body = space.addBody(new cp.Body(mass, moment));
                balance_body.p = cp.v(0.0, wheel_body.p.y + cog_offset);

                /*cpShape*/ var shape = null;

                shape = space.addShape(new cp.BoxShape2(balance_body, bb1));
                shape.u = 1.0;
                shape.group = 1;

                shape = space.addShape(new cp.BoxShape2(balance_body, bb2));
                shape.u = 1.0;
                shape.group = 1;
            }

            /*cpVect*/ var anchr1 = balance_body.world2Local(wheel_body.p);
            /*cpVect*/ var groove_a = cp.v.add(anchr1, cp.v(0.0,  30.0));
            /*cpVect*/ var groove_b = cp.v.add(anchr1, cp.v(0.0, -10.0));
            space.addConstraint(new cp.GrooveJoint(balance_body, wheel_body, groove_a, groove_b, cp.vzero));
            space.addConstraint(new cp.DampedSpring(balance_body, wheel_body, anchr1, cp.vzero, 0.0, 6.0e2, 30.0));

            var motor = space.addConstraint(new cp.SimpleMotor(wheel_body, balance_body, 0.0));
            motor.preSolve = motor_preSolve;

            {
                /*cpFloat*/ var width = 100.0;
                /*cpFloat*/ var height = 20.0;
                /*cpFloat*/ var mass = 3.0;

                /*cpBody*/ var boxBody = space.addBody(new cp.Body(mass, cp.momentForBox(mass, width, height)));
                boxBody.setPos(cp.v(200, -100));

                /*cpShape*/ var shape = space.addShape(new cp.BoxShape(boxBody, width, height));
                shape.setFriction(0.7);
            }

            return space;
        }
    })

    /*cpBody*/ var balance_body;
    /*cpFloat*/ var balance_sin = 0.0;
    /*cpFloat*/ var last_v = 0.0;

    /*cpBody*/ var wheel_body

    /*
     TODO
     - Clamp max angle dynamically based on output torque.
     */

//void
    var motor_preSolve = function(/*cpSpace*/ space) {
        var motor = this

        /*cpFloat*/ var dt = space.getCurrentTimeStep();

        /*cpFloat*/ var target_x = Demo.mouse.x;
        Demo.renderer.drawSegment(cp.v(target_x, -1000.0), cp.v(target_x, 1000.0), 'rgba(255, 0.0, 0.0, 1.0)');

        /*cpFloat*/ var max_v = 500.0;
        /*cpFloat*/ var target_v = cp.fclamp(cp.biasCoef(0.5, dt/1.2)*(target_x - balance_body.p.x)/dt, -max_v, max_v);
        /*cpFloat*/ var error_v = (target_v - balance_body.v.x);
        /*cpFloat*/ var target_sin = 3.0e-3*cp.biasCoef(0.1, dt)*error_v/dt;

        /*cpFloat*/ var max_sin = cp.fsin(0.6);
        balance_sin = cp.fclamp(balance_sin - 6.0e-5*cp.biasCoef(0.2, dt)*error_v/dt, -max_sin, max_sin);
        /*cpFloat*/ var target_a = Math.asin(cp.fclamp(-target_sin + balance_sin, -max_sin, max_sin));
        /*cpFloat*/ var angular_diff = Math.asin(cp.v.cross(balance_body.rot, cp.v.forangle(target_a)));
        /*cpFloat*/ var target_w = cp.biasCoef(0.1, dt/0.4)*(angular_diff)/dt;

        /*cpFloat*/ var max_rate = 50.0;
        /*cpFloat*/ var rate = cp.fclamp(wheel_body.w + balance_body.w - target_w, -max_rate, max_rate);
        motor.rate = (cp.fclamp(rate, -max_rate, max_rate));
        motor.maxForce = (8.0e4);
    }

})(function() {
   return this;
}())