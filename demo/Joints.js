(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'Joints and Constraints'
        ,init: function() {
            /*cpSpace*/ var space = this.space
            space.setIterations(10);
            space.gravity = (cp.v(0, -100));
            space.sleepTimeThreshold = (0.5);

            /*cpBody*/ var staticBody = space.staticBody
            /*cpShape*/ var shape

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,240), cp.v(320,240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,120), cp.v(320,120), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,0), cp.v(320,0), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,-120), cp.v(320,-120), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,-240), cp.v(320,-240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;


            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,-240), cp.v(-320,240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-160,-240), cp.v(-160,240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(0,-240), cp.v(0,240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(160,-240), cp.v(160,240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(320,-240), cp.v(320,240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            /*cpVect*/ var boxOffset
            /*cpBody **/ var body1, body2;

            /*cpVect*/ var posA = cp.v( 50, 60);
            /*cpVect*/ var posB = cp.v(110, 60);

            var POS_A = function() {
                return cp.v.add(boxOffset, posA)
            }
            var POS_B = function() {
                return cp.v.add(boxOffset, posB)
            }

            // Pin Joints - Link shapes with a solid bar or pin.
            // Keeps the anchor points the same distance apart from when the joint was created.
            boxOffset = cp.v(-320, -240);
            body1 = addBall(space, posA, boxOffset);
            body2 = addBall(space, posB, boxOffset);
            space.addConstraint(new cp.PinJoint(body1, body2, cp.v(15,0), cp.v(-15,0)));

            // Slide Joints - Like pin joints but with a min/max distance.
            // Can be used for a cheap approximation of a rope.
            boxOffset = cp.v(-160, -240);
            body1 = addBall(space, posA, boxOffset);
            body2 = addBall(space, posB, boxOffset);
            space.addConstraint(new cp.SlideJoint(body1, body2, cp.v(15,0), cp.v(-15,0), 20.0, 40.0));

            // Pivot Joints - Holds the two anchor points together. Like a swivel.
            boxOffset = cp.v(0, -240);
            body1 = addBall(space, posA, boxOffset);
            body2 = addBall(space, posB, boxOffset);
            space.addConstraint(new cp.PivotJoint(body1, body2, cp.v.add(boxOffset, cp.v(80,60))));
            // new cp.PivotJoint() takes it's anchor parameter in world coordinates. The anchors are calculated from that
            // new cp.PivotJoint() lets you specify the two anchor points explicitly

            // Groove Joints - Like a pivot joint, but one of the anchors is a line segment that the pivot can slide in
            boxOffset = cp.v(160, -240);
            body1 = addBall(space, posA, boxOffset);
            body2 = addBall(space, posB, boxOffset);
            space.addConstraint(new cp.GrooveJoint(body1, body2, cp.v(30,30), cp.v(30,-30), cp.v(-30,0)));

            // Damped Springs
            boxOffset = cp.v(-320, -120);
            body1 = addBall(space, posA, boxOffset);
            body2 = addBall(space, posB, boxOffset);
            space.addConstraint(new cp.DampedSpring(body1, body2, cp.v(15,0), cp.v(-15,0), 20.0, 5.0, 0.3));

            // Damped Rotary Springs
            boxOffset = cp.v(-160, -120);
            body1 = addBar(space, posA, boxOffset);
            body2 = addBar(space, posB, boxOffset);
            // Add some pin joints to hold the circles in place.
            space.addConstraint(new cp.PivotJoint(body1, staticBody, POS_A()));
            space.addConstraint(new cp.PivotJoint(body2, staticBody, POS_B()));
            space.addConstraint(new cp.DampedRotarySpring(body1, body2, 0.0, 3000.0, 60.0));

            // Rotary Limit Joint
            boxOffset = cp.v(0, -120);
            body1 = addLever(space, posA, boxOffset);
            body2 = addLever(space, posB, boxOffset);
            // Add some pin joints to hold the circles in place.
            space.addConstraint(new cp.PivotJoint(body1, staticBody, POS_A()));
            space.addConstraint(new cp.PivotJoint(body2, staticBody, POS_B()));
            // Hold their rotation within 90 degrees of each other.
            space.addConstraint(new cp.RotaryLimitJoint(body1, body2, -Math.PI / 2, Math.PI / 2));

            // Ratchet Joint - A rotary ratchet, like a socket wrench
            boxOffset = cp.v(160, -120);
            body1 = addLever(space, posA, boxOffset);
            body2 = addLever(space, posB, boxOffset);
            // Add some pin joints to hold the circles in place.
            space.addConstraint(new cp.PivotJoint(body1, staticBody, POS_A()));
            space.addConstraint(new cp.PivotJoint(body2, staticBody, POS_B()));
            // Ratchet every 90 degrees
            space.addConstraint(new cp.RatchetJoint(body1, body2, 0.0, Math.PI / 2));

            // Gear Joint - Maintain a specific angular velocity ratio
            boxOffset = cp.v(-320, 0);
            body1 = addBar(space, posA, boxOffset);
            body2 = addBar(space, posB, boxOffset);
            // Add some pin joints to hold the circles in place.
            space.addConstraint(new cp.PivotJoint(body1, staticBody, POS_A()));
            space.addConstraint(new cp.PivotJoint(body2, staticBody, POS_B()));
            // Force one to sping 2x as fast as the other
            space.addConstraint(new cp.GearJoint(body1, body2, 0.0, 2.0));

            // Simple Motor - Maintain a specific angular relative velocity
            boxOffset = cp.v(-160, 0);
            body1 = addBar(space, posA, boxOffset);
            body2 = addBar(space, posB, boxOffset);
            // Add some pin joints to hold the circles in place.
            space.addConstraint(new cp.PivotJoint(body1, staticBody, POS_A()));
            space.addConstraint(new cp.PivotJoint(body2, staticBody, POS_B()));
            // Make them spin at 1/2 revolution per second in relation to each other.
            space.addConstraint(new cp.SimpleMotor(body1, body2, Math.PI));

            // Make a car with some nice soft suspension
            boxOffset = cp.v(0, 0);
            /*cpBody*/ var wheel1 = addWheel(space, posA, boxOffset);
            /*cpBody*/ var wheel2 = addWheel(space, posB, boxOffset);
            /*cpBody*/ var chassis = addChassis(space, cp.v(80, 100), boxOffset);

            space.addConstraint(new cp.GrooveJoint(chassis, wheel1, cp.v(-30, -10), cp.v(-30, -40), cp.vzero));
            space.addConstraint(new cp.GrooveJoint(chassis, wheel2, cp.v( 30, -10), cp.v( 30, -40), cp.vzero));

            space.addConstraint(new cp.DampedSpring(chassis, wheel1, cp.v(-30, 0), cp.vzero, 50.0, 20.0, 10.0));
            space.addConstraint(new cp.DampedSpring(chassis, wheel2, cp.v( 30, 0), cp.vzero, 50.0, 20.0, 10.0));

            return space;
        }
    })
    //static cpBody *
    var addBall = function(/*cpSpace*/ space, /*cpVect*/ pos, /*cpVect*/ boxOffset) {
        /*cpFloat*/ var radius = 15.0;
        /*cpFloat*/ var mass = 1.0;
        /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForCircle(mass, 0.0, radius, cp.vzero)));
        body.setPos(cp.v.add(pos, boxOffset));

        /*cpShape*/ var shape = space.addShape(new cp.CircleShape(body, radius, cp.vzero));
        shape.setElasticity(0.0);
        shape.setFriction(0.7);

        return body;
    }

//static cpBody *
    var addLever = function(/*cpSpace*/ space, /*cpVect*/ pos, /*cpVect*/ boxOffset) {
        /*cpFloat*/ var mass = 1.0;
        /*cpVect*/ var a = cp.v(0,  15);
        /*cpVect*/ var b = cp.v(0, -15);

        /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForSegment(mass, a, b)));
        body.setPos(cp.v.add(pos, cp.v.add(boxOffset, cp.v(0, -15))));

        /*cpShape*/ var shape = space.addShape(new cp.SegmentShape(body, a, b, 5.0));
        shape.setElasticity(0.0);
        shape.setFriction(0.7);

        return body;
    }

//static cpBody *
    var addBar = function(/*cpSpace*/ space, /*cpVect*/ pos, /*cpVect*/ boxOffset) {
        /*cpFloat*/ var mass = 2.0;
        /*cpVect*/ var a = cp.v(0,  30);
        /*cpVect*/ var b = cp.v(0, -30);

        /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForSegment(mass, a, b)));
        body.setPos(cp.v.add(pos, boxOffset));

        /*cpShape*/ var shape = space.addShape(new cp.SegmentShape(body, a, b, 5.0));
        shape.setElasticity(0.0);
        shape.setFriction(0.7);
        shape.group = (1);

        return body;
    }

//static cpBody *
    var addWheel = function(/*cpSpace*/ space, /*cpVect*/ pos, /*cpVect*/ boxOffset) {
        /*cpFloat*/ var radius = 15.0;
        /*cpFloat*/ var mass = 1.0;
        /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForCircle(mass, 0.0, radius, cp.vzero)));
        body.setPos(cp.v.add(pos, boxOffset));

        /*cpShape*/ var shape = space.addShape(new cp.CircleShape(body, radius, cp.vzero));
        shape.setElasticity(0.0);
        shape.setFriction(0.7);
        shape.group = (1); // use a group to keep the car parts from colliding

        return body;
    }

//static cpBody *
    var addChassis = function(/*cpSpace*/ space, /*cpVect*/ pos, /*cpVect*/ boxOffset) {
        /*cpFloat*/ var mass = 5.0;
        /*cpFloat*/ var width = 80;
        /*cpFloat*/ var height = 30;

        /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForBox(mass, width, height)));
        body.setPos(cp.v.add(pos, boxOffset));

        /*cpShape*/ var shape = space.addShape(new cp.BoxShape(body, width, height));
        shape.setElasticity(0.0);
        shape.setFriction(0.7);
        shape.group = (1); // use a group to keep the car parts from colliding

        return body;
    }
})(this)