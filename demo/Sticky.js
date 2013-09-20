(function(root) {
    var	COLLIDE_STICK_SENSOR = 1
    var STICK_SENSOR_THICKNESS = 2.5

    Demo.add({
        name: 'Sticky Surfaces'
        ,messageString: "Sticky collisions using the cpArbiter data pointer."

        ,init: function() {
            /*cpSpace*/ var space = this.space
            space.setIterations(10);
            space.gravity = (cp.v(0, -1000));
            space.collisionSlop = (2.0);

            /*cpBody*/ var staticBody = space.staticBody;
            /*cpShape*/ var shape;

            // Create segments around the edge of the screen.
            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-340,-260), cp.v(-340, 260), 20.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.setCollisionType(COLLIDE_STICK_SENSOR);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v( 340,-260), cp.v( 340, 260), 20.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.setCollisionType(COLLIDE_STICK_SENSOR);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-340,-260), cp.v( 340,-260), 20.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.setCollisionType(COLLIDE_STICK_SENSOR);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-340, 260), cp.v( 340, 260), 20.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.setCollisionType(COLLIDE_STICK_SENSOR);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            for(var i=0; i<150; i++){
                /*cpFloat*/ var mass = 0.15;
                /*cpFloat*/ var radius = 10.0;

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForCircle(mass, 0.0, radius, cp.vzero)));
                body.setPos(cp.v(cp.flerp(-150.0, 150.0, Math.random()), cp.flerp(-150.0, 150.0, Math.random())));

                /*cpShape*/ var shape = space.addShape(new cp.CircleShape(body, radius + STICK_SENSOR_THICKNESS, cp.vzero));
                shape.setFriction(0.9);
                shape.setCollisionType(COLLIDE_STICK_SENSOR);
            }

            space.addCollisionHandler(COLLIDE_STICK_SENSOR, COLLIDE_STICK_SENSOR, null, StickyPreSolve, null, StickySeparate, null);

            return space;
        }
    })

//static void
    var PostStepAddJoint = function(/*cpSpace*/ space, /*void*/ key, /*void*/ data) {
//	printf("Adding joint for %p\n", data);

        /*cpConstraint*/ var joint = /*cpConstraint*/key;
        space.addConstraint(joint);
    }

//static cpBool
    var StickyPreSolve = function(/*cpArbiter*/ arb, /*cpSpace*/ space, /*void*/ data) {
        // We want to fudge the collisions a bit to allow shapes to overlap more.
        // This simulates their squishy sticky surface, and more importantly
        // keeps them from separating and destroying the joint.

        // Track the deepest collision point and use that to determine if a rigid collision should occur.
        /*cpFloat*/ var deepest = Infinity;

        // Grab the contact set and iterate over them.
        /*cpContactPointSet*/ var contacts = arb.getContactPointSet();
        for(var i=0; i<contacts.count; i++){
            // Increase the distance (negative means overlaping) of the
            // collision to allow them to overlap more.
            // This value is used only for fixing the positions of overlapping shapes.
            /*cpFloat*/ var dist = contacts.points[i].dist + 2.0*STICK_SENSOR_THICKNESS;
            contacts.points[i].dist = cp.fmin(0.0, dist);
            deepest = cp.fmin(deepest, dist);
        }

        // Set the new contact point data.
        arb.setContactPointSet(contacts);

        // If the shapes are overlapping enough, then create a
        // joint that sticks them together at the first contact point.
//        if(!arb.getUserData() && deepest <= 0.0){
        if(!arb.data && deepest <= 0.0){
//            CP_ARBITER_GET_BODIES(arb, bodyA, bodyB);
            var bodies = arb.getBodies();
            var bodyA = bodies[0];
            var bodyB = bodies[1];

            // Create a joint at the contact point to hold the body in place.
            /*cpConstraint*/ var joint = new cp.PivotJoint(bodyA, bodyB, contacts.points[0].point);

            // Give it a finite force for the stickyness.
            joint.maxForce = (3e3);

            // Schedule a post-step() callback to add the joint.
            space.addPostStepCallback(PostStepAddJoint, joint, null);

            // Store the joint on the arbiter so we can remove it later.
//            arb.setUserData(joint);
            arb.data = joint;
        }

        // Position correction and velocity are handled separately so changing
        // the overlap distance alone won't prevent the collision from occuring.
        // Explicitly the collision for this frame if the shapes don't overlap using the new distance.
        return (deepest <= 0.0);

        // Lots more that you could improve upon here as well:
        // * Modify the joint over time to make it plastic.
        // * Modify the joint in the post-step to make it conditionally plastic (like clay).
        // * Track a joint for the deepest contact point instead of the first.
        // * Track a joint for each contact point. (more complicated since you only get one data pointer).
    }



//static void
    var PostStepRemoveJoint = function(/*cpSpace*/ space, /*void*/ key, /*void*/ data) {
//	printf("Removing joint for %p\n", data);

        /*cpConstraint*/ var joint = /*cpConstraint*/key;
        space.removeConstraint(joint);
//        joint.free();
    }

//static void
    var StickySeparate = function(/*cpArbiter*/ arb, /*cpSpace*/ space, /*void*/ data) {
//        /*cpConstraint*/ var joint = /*cpConstraint*/arb.getUserData();
        /*cpConstraint*/ var joint = /*cpConstraint*/arb.data;

        if(joint){
            // The joint won't be removed until the step is done.
            // Need to disable it so that it won't apply itself.
            // Setting the force to 0 will do just that
            joint.maxForce = 0.0;

            // Perform the removal in a post-step() callback.
            space.addPostStepCallback(PostStepRemoveJoint, joint, null);

            // null out the reference to the joint.
            // Not required, but it's a good practice.
            arb.data = null;
        }
    }
})(this)