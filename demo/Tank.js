(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'Tank'
        ,messageString: "Use the mouse to drive the tank, it will follow the cursor."
        
        ,init: function() {
            /*cpSpace*/ var space = this.space
            space.setIterations(10);
            space.sleepTimeThreshold = (0.5);

            /*cpBody*/ var staticBody = space.staticBody
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

            for(var i=0; i<50; i++){
                /*cpBody*/ var body = add_box(space, 20, 1);

                /*cpConstraint*/ var pivot = space.addConstraint(new cp.PivotJoint(staticBody, body, cp.vzero, cp.vzero));
                pivot.maxBias = (0); // disable joint correction
                pivot.maxForce = (1000.0); // emulate linear friction

                /*cpConstraint*/ var gear = space.addConstraint(new cp.GearJoint(staticBody, body, 0.0, 1.0));
                gear.maxBias = (0); // disable joint correction
                gear.maxForce = (5000.0); // emulate angular friction
            }

            // We joint the tank to the control body and control the tank indirectly by modifying the control body.
            this.tankControlBody = new cp.Body(Infinity, Infinity);
            this.tankBody = add_box(space, 30, 10);

            /*cpConstraint*/ var pivot = space.addConstraint(new cp.PivotJoint(this.tankControlBody, this.tankBody, cp.vzero, cp.vzero));
            pivot.maxBias = (0); // disable joint correction
            pivot.maxForce = (10000.0); // emulate linear friction

            /*cpConstraint*/ var gear = space.addConstraint(new cp.GearJoint(this.tankControlBody, this.tankBody, 0.0, 1.0));
            gear.errorBias = (0); // attempt to fully correct the joint each step
            gear.maxBias = (1.2);  // but limit it's angular correction rate
            gear.maxForce = (50000.0); // emulate angular friction

            return space;
        }
        
        ,update: function(/*double*/ dt) {
            var space = this.space
            // turn the control body based on the angle relative to the actual body
            /*cpVect*/ var mouseDelta = cp.v.sub(Demo.mouse, this.tankBody.getPos());
            /*cpFloat*/ var turn = cp.v.toangle(cp.v.unrotate(this.tankBody.rot, mouseDelta));
            this.tankControlBody.setAngle(this.tankBody.a - turn);

            // drive the tank towards the mouse
            if(cp.v.near(Demo.mouse, this.tankBody.getPos(), 30.0)){
                this.tankControlBody.setVel(cp.vzero); // stop
            } else {
                /*cpFloat*/ var direction = (cp.v.dot(mouseDelta, this.tankBody.rot) > 0.0 ? 1.0 : -1.0);
                this.tankControlBody.setVel(cp.v.rotate(this.tankBody.rot, cp.v(30.0*direction, 0.0)));
            }

            space.step(dt);
        }
    })
//static cpBody *
    var add_box = function(/*cpSpace*/ space, /*cpFloat*/ size, /*cpFloat*/ mass) {
        /*cpFloat*/ var radius = cp.v.len(cp.v(size, size));

        /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForBox(mass, size, size)));
        body.setPos(cp.v(Math.random()*(640 - 2*radius) - (320 - radius), Math.random()*(480 - 2*radius) - (240 - radius)));

        /*cpShape*/ var shape = space.addShape(new cp.BoxShape(body, size, size));
        shape.setElasticity(0.0);
        shape.setFriction(0.7);

        return body;
    }
})(function() {
   return this;
}())