(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'Contact Graph'
        ,init: function() {
            /*cpSpace*/ var space = this.space
            space.setIterations(30);
            space.gravity = cp.v(0, -300);
            space.collisionSlop = 0.5;

            // For cpBodyEachArbiter() to work you must explicitly enable the contact graph or enable sleeping.
            // Generating the contact graph is a small but measurable ~5-10% performance hit so it's not enabled by default.
//	space.setEnableContactGraph(true);
            space.sleepTimeThreshold = 1.0;

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

            this.scaleStaticBody = cp.Body.newStatic();
            shape = space.addShape(new cp.SegmentShape(this.scaleStaticBody, cp.v(-240,-180), cp.v(-140,-180), 4.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            // add some boxes to stack on the scale
            for(var i=0; i<5; i++){
                body = space.addBody(new cp.Body(1.0, cp.momentForBox(1.0, 30.0, 30.0)));
                body.setPos(cp.v(0, i*32 - 220));

                shape = space.addShape(new cp.BoxShape(body, 30.0, 30.0));
                shape.setElasticity(0.0);
                shape.setFriction(0.8);
            }

            // Add a ball that we'll track which objects are beneath it.
            /*cpFloat*/ var radius = 15.0;
            this.ballBody = space.addBody(new cp.Body(10.0, cp.momentForCircle(10.0, 0.0, radius, cp.vzero)));
            this.ballBody.setPos(cp.v(120, -240 + radius+5));

            shape = space.addShape(new cp.CircleShape(this.ballBody, radius, cp.vzero));
            shape.setElasticity(0.0);
            shape.setFriction(0.9);

            return space;
        }
        ,update: function(/*double*/ dt) {
            var space = this.space
            space.step(dt)

            this.messageString = "Place objects on the scale to weigh them. The ball marks the shapes it's sitting on.\n"

            // Sum the total impulse applied to the scale from all collision pairs in the contact graph.
            // If your compiler supports blocks, your life is a little easier.
            // You can use the "Block" versions of the functions without needing the callbacks above.
            /*cpVect*/ var impulseSum = new cp.v(0, 0);
            this.scaleStaticBody.eachArbiter(/*(cpBodyArbiterIteratorFunc)*/ScaleIterator, impulseSum);

            // Force is the impulse divided by the timestep.
            /*cpFloat*/ var force = cp.v.len(impulseSum)/dt;

            // Weight can be found similarly from the gravity vector.
            /*cpVect*/ var g = space.gravity;
            /*cpFloat*/ var weight = cp.v.dot(g, impulseSum)/(cp.v.lengthsq(g)*dt);

            this.messageString += Demo.format("Total force: {0}, Total weight: {1}. ", force.toFixed(2), weight.toFixed(2))


            // Highlight and count the number of shapes the ball is touching.
            var countRef = {count: 0}
            /*int*/ var count = this.ballBody.eachArbiter(/*(cpBodyArbiterIteratorFunc)*/BallIterator, countRef);

            this.messageString += Demo.format("The ball is touching {0} shapes.\n", countRef.count);

            /*struct CrushingContext*/ var crush = new CrushingContext(0.0, cp.vzero);
            this.ballBody.eachArbiter(/*(cpBodyArbiterIteratorFunc)*/EstimateCrushing, crush);

            /*cpFloat*/ var crushForce = (crush.magnitudeSum - cp.v.len(crush.vectorSum))*dt;


            if(crushForce > 10.0){
                this.messageString += Demo.format("The ball is being crushed. (f: {0})", crushForce.toFixed(2));
            } else {
                this.messageString += Demo.format("The ball is not being crushed. (f: {0})", crushForce.toFixed(2));
            }
        }
    })
    //static body that we will be making into a scale
//    /*cpBody*/ var scaleStaticBody = new cpBody();
//    /*cpBody*/ var ballBody = new cpBody();

// If your compiler supports blocks (Clang or some GCC versions),
// You can use the block based iterators instead of the function ones to make your life easier.
//static void
    var ScaleIterator = function(/*cpBody*/ body, /*cpArbiter*/ arb, /*cpVect*/ sum) {
        var totalImpulseWithFriction = arb.totalImpulseWithFriction()
        sum.x += totalImpulseWithFriction.x
        sum.y += totalImpulseWithFriction.y
    }

//static void
    var BallIterator = function(/*cpBody*/ body, /*cpArbiter*/ arb, /*int*/ countRef) {
        // body is the body we are iterating the arbiters for.
        // CP_ARBITER_GET_*() in an arbiter iterator always returns the body/shape for the iterated body first.
        var shapes = arb.getShapes();
        var ball = shapes[0];
        var other = shapes[1];
//        Demo.drawBB(other.getBB(), new Color(255, 0, 0, 1));

        countRef.count++;
    }

    /*var*/ var CrushingContext = function(/*cpFloat*/ magnitudeSum, /*cpVect*/ vectorSum) {
        this.magnitudeSum = magnitudeSum
        this.vectorSum = vectorSum
    };

//static void
    var EstimateCrushing = function(/*cpBody*/ body, /*cpArbiter*/ arb, /*struct CrushingContext*/ context) {
        /*cpVect*/ var j = arb.totalImpulseWithFriction();
        context.magnitudeSum += cp.v.len(j);
        context.vectorSum = cp.v.add(context.vectorSum, j);
    }
})(this)