(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'Breakable Chains'
        ,steps: 2
        ,init: function() {
            /*cpSpace*/ var space = this.space
            cp.enableSegmentToSegmentCollisions()

            space.setIterations(30);
            space.gravity = (cp.v(0, -100));
            space.sleepTimeThreshold = (0.5);

            var body, staticBody = space.staticBody
            /*cpShape*/ var shape

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

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,240), cp.v(320,240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            /*cpFloat*/ var mass = 1;
            /*cpFloat*/ var width = 20;
            /*cpFloat*/ var height = 30;

            /*cpFloat*/ var spacing = width*0.3;

            // Add lots of boxes.
            for(var i=0; i<CHAIN_COUNT; i++){
                /*cpBody*/ var prev = null;

                for(var j=0; j<LINK_COUNT; j++){
                    /*cpVect*/ var pos = cp.v(40*(i - (CHAIN_COUNT - 1)/2.0), 240 - (j + 0.5)*height - (j + 1)*spacing);

                    body = space.addBody(new cp.Body(mass, cp.momentForBox(mass, width, height)));
                    body.setPos(pos);

                    shape = space.addShape(new cp.SegmentShape(body, cp.v(0, (height - width)/2.0), cp.v(0, (width - height)/2.0), width/2.0));
                    shape.setFriction(0.8);

                    /*cpFloat*/ var breakingForce = 80000;

                    /*cpConstraint*/ var constraint = null;
                    if(prev == null){
                        constraint = space.addConstraint(new cp.SlideJoint(body, staticBody, cp.v(0, height/2), cp.v(pos.x, 240), 0, spacing));
                    } else {
                        constraint = space.addConstraint(new cp.SlideJoint(body, prev, cp.v(0, height/2), cp.v(0, -height/2), 0, spacing));
                    }

                    constraint.maxForce = (breakingForce);
                    constraint.postSolve = BreakableJointPostSolve.bind(constraint);

                    prev = body;
                }
            }

            /*cpFloat*/ var radius = 15.0;
            body = space.addBody(new cp.Body(10.0, cp.momentForCircle(10.0, 0.0, radius, cp.vzero)));
            body.setPos(cp.v(0, -240 + radius+5));
            body.setVel(cp.v(0, 300));

            shape = space.addShape(new cp.CircleShape(body, radius, cp.vzero));
            shape.setElasticity(0.0);
            shape.setFriction(0.9);

            return space;
        }
    })
    var CHAIN_COUNT = 8
    var LINK_COUNT = 10

//static void
    var BreakablejointPostStepRemove = function(/*cpSpace*/ space, /*cpConstraint*/ joint, /*void*/ unused) {
        space.removeConstraint(joint);
    }

//static void
    var BreakableJointPostSolve = function(/*cpSpace*/ space) {
        /*cpConstraint*/ var joint = this;
        /*cpFloat*/ var dt = space.getCurrentTimeStep();

        // Convert the impulse to a force by dividing it by the timestep.
        /*cpFloat*/ var force = joint.getImpulse()/dt;
        /*cpFloat*/ var maxForce = joint.maxForce;
        // If the force is almost as big as the joint's max force, break it.
        if(force > 0.9*maxForce){
            space.addPostStepCallback(/*/*(cpPostStepFunc)*/BreakablejointPostStepRemove, joint, null);
        }
    }
})(function() {
   return this;
}())