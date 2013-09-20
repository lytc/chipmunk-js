(function() {
    var numBalls = 5

    Demo.add({
        name: 'Pump'
        ,steps: 3
        ,messageString: "Use the arrow keys to control the machine."
        ,init: function() {
            cp.enableSegmentToSegmentCollisions()

            /*cpSpace*/ var space = this.space
            space.gravity = (cp.v(0, -600));

            /*cpBody*/ var staticBody = space.staticBody
            /*cpShape*/ var shape

            // beveling all of the line segments slightly helps prevent things from getting stuck on cracks
            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-256,16), cp.v(-256,300), 2.0));
            shape.setElasticity(0.0);
            shape.setFriction(0.5);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-256,16), cp.v(-192,0), 2.0));
            shape.setElasticity(0.0);
            shape.setFriction(0.5);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-192,0), cp.v(-192, -64), 2.0));
            shape.setElasticity(0.0);
            shape.setFriction(0.5);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-128,-64), cp.v(-128,144), 2.0));
            shape.setElasticity(0.0);
            shape.setFriction(0.5);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-192,80), cp.v(-192,176), 2.0));
            shape.setElasticity(0.0);
            shape.setFriction(0.5);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-192,176), cp.v(-128,240), 2.0));
            shape.setElasticity(0.0);
            shape.setFriction(0.5);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-128,144), cp.v(192,64), 2.0));
            shape.setElasticity(0.0);
            shape.setFriction(0.5);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            /*cpVect*/ var verts = [
                cp.v(-30,-80),
                cp.v(-30, 80),
                cp.v( 30, 64),
                cp.v( 30,-80)
            ];

            /*cpBody*/ var plunger = space.addBody(new cp.Body(1.0, Infinity));
            plunger.setPos(cp.v(-160,-80));

            shape = space.addShape(new cp.PolyShape(plunger, verts, cp.vzero));
            shape.setElasticity(1.0);
            shape.setFriction(0.5);
            shape.layers = 1;

            // add balls to hopper
            var balls = this.balls = []
            for(var i=0; i<numBalls; i++)
                balls[i] = add_ball(space, cp.v(-224 + i,80 + 64*i));

            // add small gear
            /*cpBody*/ var smallGear = space.addBody(new cp.Body(10.0, cp.momentForCircle(10.0, 80, 0, cp.vzero)));
            smallGear.setPos(cp.v(-160,-160));
            smallGear.setAngle(-Math.PI / 2);

            shape = space.addShape(new cp.CircleShape(smallGear, 80.0, cp.vzero));
            shape.layers = 0;

            space.addConstraint(new cp.PivotJoint(staticBody, smallGear, cp.v(-160,-160), cp.vzero));

            // add big gear
            /*cpBody*/ var bigGear = space.addBody(new cp.Body(40.0, cp.momentForCircle(40.0, 160, 0, cp.vzero)));
            bigGear.setPos(cp.v(80,-160));
            bigGear.setAngle(Math.PI / 2);

            shape = space.addShape(new cp.CircleShape(bigGear, 160.0, cp.vzero));
            shape.layers = 0;

            space.addConstraint(new cp.PivotJoint(staticBody, bigGear, cp.v(80,-160), cp.vzero));

            // connect the plunger to the small gear.
            space.addConstraint(new cp.PinJoint(smallGear, plunger, cp.v(80,0), cp.v(0,0)));
            // connect the gears.
            space.addConstraint(new cp.GearJoint(smallGear, bigGear, -Math.PI / 2, -2.0));


            // feeder mechanism
            /*cpFloat*/ var bottom = -300.0;
            /*cpFloat*/ var top = 32.0;
            /*cpBody*/ var feeder = space.addBody(new cp.Body(1.0, cp.momentForSegment(1.0, cp.v(-224.0, bottom), cp.v(-224.0, top))));
            feeder.setPos(cp.v(-224, (bottom + top)/2.0));

            /*cpFloat*/ var len = top - bottom;
            shape = space.addShape(new cp.SegmentShape(feeder, cp.v(0.0, len/2.0), cp.v(0.0, -len/2.0), 20.0));
            shape.layers = Demo.GRABABLE_MASK_BIT;

            space.addConstraint(new cp.PivotJoint(staticBody, feeder, cp.v(-224.0, bottom), cp.v(0.0, -len/2.0)));
            /*cpVect*/ var anchr = feeder.world2Local(cp.v(-224.0, -160.0));
            space.addConstraint(new cp.PinJoint(feeder, smallGear, anchr, cp.v(0.0, 80.0)));

            // motorize the second gear
            this.motor = space.addConstraint(new cp.SimpleMotor(staticBody, bigGear, 3.0));

            return space;
        }

        ,update: function(/*double*/ dt) {
            var space = this.space
            var motor = this.motor
            var balls = this.balls
            /*cpFloat*/ var coef = (2.0 + Demo.keyboard.y)/3.0;
            /*cpFloat*/ var rate = Demo.keyboard.x*30.0*coef;

            motor.rate = rate;
            motor.maxForce = (rate ? 1000000.0 : 0.0);

            space.step(dt);

            for(var i=0; i<numBalls; i++){
                /*cpBody*/ var ball = balls[i];
                /*cpVect*/ var pos = ball.getPos();

                if(pos.x > 320.0){
                    ball.setVel(cp.v(0, 0));
                    ball.setPos(cp.v(-224.0, 200.0));
                }
            }
        }
    })

//static cpBody *
    var add_ball = function(/*cpSpace*/ space, /*cpVect*/ pos) {
        /*cpBody*/ var body = space.addBody(new cp.Body(1.0, cp.momentForCircle(1.0, 30, 0, cp.vzero)));
        body.setPos(pos);

        /*cpShape*/ var shape = space.addShape(new cp.CircleShape(body, 30, cp.vzero));
        shape.setElasticity(0.0);
        shape.setFriction(0.5);

        return body;
    }
})(this)