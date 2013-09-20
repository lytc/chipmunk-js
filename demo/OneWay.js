(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'One Way Platforms'
        ,messageString: "One way platforms are trivial in Chipmunk using a very simple collision callback."

        ,init: function() {

            /*cpSpace*/ var space = this.space
            space.setIterations(10);
            space.gravity = (cp.v(0, -100));

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

            // Add our one way segment
            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-160,-100), cp.v(160,-100), 10.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.setCollisionType(1);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape.data = {n: cp.v(0, 1)}; //let objects pass upwards


            // Add a ball to make things more interesting
            /*cpFloat*/ var radius = 15.0;
            body = space.addBody(new cp.Body(10.0, cp.momentForCircle(10.0, 0.0, radius, cp.vzero)));
            body.setPos(cp.v(0, -200));
            body.setVel(cp.v(0, 170));

            shape = space.addShape(new cp.CircleShape(body, radius, cp.vzero));
            shape.setElasticity(0.0);
            shape.setFriction(0.9);
            shape.setCollisionType(2);

            space.addCollisionHandler(1, 2, null, preSolve, null, null, null);

            return space;
        }
    })
    //
    var OneWayPlatform = function(/*cpVect*/ n) {
        this.n = n;
    };

//static cpBool
    var preSolve = function(/*cpArbiter*/ arb, /*cpSpace*/ space, /*void*/ ignore) {
        var shapes = arb.getShapes();
        var a = shapes[0];
        var b = shapes[1];
        /*OneWayPlatform*/ var platform = /*(OneWayPlatform *)*/a.data;

        if(cp.v.dot(arb.getNormal(0), platform.n) < 0){
            arb.ignore();
            return false;
        }

        return true;
    }
})(function() {
   return this;
}())