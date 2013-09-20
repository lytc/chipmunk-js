(function() {
    var HOOK_SENSOR = 1;
    var CRATE = 0;

    Demo.add({
        name: 'Crane'
        ,messageString: "Control the crane by moving the mouse. Right click to release."

        //static cpSpace *
        ,init: function() {
            /*cpSpace*/ var space = this.space
            space.setIterations(30);
            space.gravity = cp.v(0, -100);
            space.damping = 0.8;

            /*cpBody*/ var staticBody = space.staticBody;
            /*cpShape*/ var shape;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,-240), cp.v(320,-240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            // Add a body for the dolly.
            var dollyBody = space.addBody(new cp.Body(10, Infinity));
            dollyBody.setPos(cp.v(0, 100));

            // Add a block so you can see it.
            space.addShape(new cp.BoxShape(dollyBody, 30, 30));

            // Add a groove joint for it to move back and forth on.
            space.addConstraint(new cp.GrooveJoint(staticBody, dollyBody, cp.v(-250, 100), cp.v(250, 100), cp.vzero));

            // Constraint used as a servo motor to move the dolly back and forth.
            // Add a pivot joint to act as a servo motor controlling it's position
            // By updating the anchor points of the pivot joint, you can move the dolly.
            var dollyServo = this.dollyServo = space.addConstraint(new cp.PivotJoint(staticBody, dollyBody, dollyBody.getPos()));
            // Max force the dolly servo can generate.
            dollyServo.maxForce = 10000;
            // Max speed of the dolly servo
            dollyServo.maxBias = 100;
            // You can also change the error bias to control how it slows down.
            //dollyServo.setErrorBias(0.2);


            // Add the crane hook.
            /*cpBody*/ var hookBody = space.addBody(new cp.Body(1, Infinity));
            hookBody.setPos(cp.v(0, 50));

            // Add a sensor shape for it. This will be used to figure out when the hook touches a box.
            shape = space.addShape(new cp.CircleShape(hookBody, 10, cp.vzero));
            shape.setSensor(true);
            shape.setCollisionType(HOOK_SENSOR);

            // Constraint used as a winch motor to lift the load.
            // Add a slide joint to act as a winch motor
            // By updating the max length of the joint you can make it pull up the load.
            var winchServo = this.winchServo = space.addConstraint(new cp.SlideJoint(dollyBody, hookBody, cp.vzero, cp.vzero, 0, Infinity));
            // Max force the dolly servo can generate.
            winchServo.maxForce = 30000;
            // Max speed of the dolly servo
            winchServo.maxBias = 60;

            // TODO cleanup
            // Finally a box to play with
            /*cpBody*/ var boxBody = space.addBody(new cp.Body(30, cp.momentForBox(30, 50, 50)));
            boxBody.setPos(cp.v(200, -200));

            // Add a block so you can see it.
            shape = space.addShape(new cp.BoxShape(boxBody, 50, 50));
            shape.setFriction(0.7);
            shape.setCollisionType(CRATE);

            space.addCollisionHandler(HOOK_SENSOR, CRATE, /*(cpCollisionBeginFunc)*/this.hookCrate.bind(this), null, null, null, null);

            // Temporary joint used to hold the hook to the load.
            /*cpConstraint*/ this.hookJoint = null;

            return space;
        }

        //static void
        ,update: function(/*double*/ dt) {
            /*cpSpace*/ var space = this.space;
            var dollyServo = this.dollyServo;
            var winchServo = this.winchServo;

                // Set the first anchor point (the one attached to the static body) of the dolly servo to the mouse's x position.
            dollyServo.anchr1.x = Demo.mouse.x;// = cp.v(Demo.mouse.x, 100);

            // Set the max length of the winch servo to match the mouse's height.
            winchServo.max = cp.fmax(100 - Demo.mouse.y, 50);

            if(this.hookJoint && Demo.rightClick){
                space.removeConstraint(this.hookJoint);
                this.hookJoint = null;
            }

            space.step(dt);
        }

        //static void
        ,attachHook: function(space, /*cpBody*/ hook, /*cpBody*/ crate) {
            this.hookJoint = space.addConstraint(new cp.PivotJoint(hook, crate, hook.getPos()));
        }
        //static cpBool
        ,hookCrate: function(/*cpArbiter*/ arb, /*cpSpace*/ space, /*void*/ data) {
            if(this.hookJoint == null){
                // Get pointers to the two bodies in the collision pair and define local variables for them.
                // Their order matches the order of the collision types passed
                // to the collision handler this function was defined for
                var bodies = arb.getBodies();
                var hook = bodies[0];
                var crate = bodies[1];

                // additions and removals can't be done in a normal callback.
                // Schedule a post step callback to do it.
                // Use the hook as the key and pass along the arbiter.
                this.space.addPostStepCallback(/*(cpPostStepFunc)*/this.attachHook.bind(this), hook, crate);
            }

            return true; // return value is ignored for sensor callbacks anyway
        }
    })


//enum COLLISION_TYPES {
//	HOOK_SENSOR = 1,
//	CRATE,
//};
})(this)