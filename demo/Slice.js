(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'Slice.'
        ,messageString: "Right click and drag to slice up the block."
        ,init: function() {

            /*cpSpace*/ var space = this.space
            space.setIterations(30);
            space.gravity = (cp.v(0, -500));
            space.sleepTimeThreshold = (0.5);
            space.collisionSlop = (0.5);

            var body, staticBody = space.staticBody
            /*cpShape*/ var shape

            // Create segments around the edge of the screen.
            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-1000,-240), cp.v(1000,-240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            /*cpFloat*/ var width = 200.0;
            /*cpFloat*/ var height = 300.0;
            /*cpFloat*/ var mass = width*height*DENSITY;
            /*cpFloat*/ var moment = cp.momentForBox(mass, width, height);

            body = space.addBody(new cp.Body(mass, moment));

            shape = space.addShape(new cp.BoxShape(body, width, height));
            shape.setFriction(0.6);

            return space;
        }
        
        ,update: function(/*double*/ dt) {
            var space = this.space
            space.step(dt);

            // Annoying state tracking code that you wouldn't need
            // in a real event driven system.
            if(Demo.rightClick != lastClickState){
                if(Demo.rightClick){
                    // MouseDown
                    sliceStart = cp.v(Demo.mouse.x, Demo.mouse.y);
                } else {
                    // MouseUp
                    /*struct SliceContext*/ var context = new SliceContext(sliceStart, Demo.mouse, space);
                    space.segmentQuery(sliceStart, Demo.mouse, Demo.GRABABLE_MASK_BIT, cp.NO_GROUP, /*(cpSpaceSegmentQueryFunc)*/SliceQuery, context);
                }

                lastClickState = Demo.rightClick;
            }
            if(Demo.rightClick){
                Demo.renderer.drawSegment(sliceStart, Demo.mouse, new Demo.Color(255, 0, 0, 1));
            }
        }
    })
    var DENSITY = (1.0/10000.0)
    var lastClickState = false
    var sliceStart = cp.v(0, 0)

//static void
    var ClipPoly = function(/*cpSpace*/ space, /*cpShape*/ shape, /*cpVect*/ n, /*cpFloat*/ dist) {
        /*cpBody*/ var body = shape.getBody();

        /*int*/ var count = shape.getNumVerts();
        /*int*/ var clippedCount = 0;

//	/*cpVect*/ var clipped = (cpVect *)alloca((count + 1)*sizeof(cpVect));
        /*cpVect*/ var clipped = [];

        for(var i=0, j=count-1; i<count; j=i, i++){
            /*cpVect*/ var a = body.local2World(shape.getVert(j));
            /*cpFloat*/ var a_dist = cp.v.dot(a, n) - dist;

            if(a_dist < 0.0){
                clipped[clippedCount] = a;
                clippedCount++;
            }

            /*cpVect*/ var b = body.local2World(shape.getVert(i));
            /*cpFloat*/ var b_dist = cp.v.dot(b, n) - dist;

            if(a_dist*b_dist < 0.0){
                /*cpFloat*/ var t = cp.fabs(a_dist)/(cp.fabs(a_dist) + cp.fabs(b_dist));

                clipped[clippedCount] = cp.v.lerp(a, b, t);
                clippedCount++;
            }
        }


        /*cpVect*/ var centroid = cp.centroidForPoly(clipped);
        /*cpFloat*/ var mass = cp.areaForPoly(clipped)*DENSITY;
        /*cpFloat*/ var moment = cp.momentForPoly(mass, clipped, cp.v.neg(centroid));

        /*cpBody*/ var new_body = space.addBody(new cp.Body(mass, moment));
        new_body.setPos(centroid);
        new_body.setVel(body.getVelAtWorldPoint(centroid));
        new_body.setAngVel(body.getAngVel());

        /*cpShape*/ var new_shape = space.addShape(new cp.PolyShape(new_body, clipped, cp.v.neg(centroid)));
        // Copy whatever properties you have set on the original shape that are important
        new_shape.setFriction(shape.getFriction());
    }

// Context structs are annoying, use blocks or closures instead if your compiler supports them.
    /*var*/ var SliceContext = function(/*cpVect*/ a, b, /*cpSpace*/ space) {
        this.a = a;
        this.b = b;
        this.space = space;
    };

//static void
    var SliceShapePostStep = function(/*cpSpace*/ space, /*cpShape*/ shape, /*struct SliceContext*/ context) {
        /*cpVect*/ var a = context.a;
        /*cpVect*/ var b = context.b;

        // Clipping plane normal and distance.
        /*cpVect*/ var n = cp.v.normalize(cp.v.perp(cp.v.sub(b, a)));
        /*cpFloat*/ var dist = cp.v.dot(a, n);

        ClipPoly(space, shape, n, dist);
        ClipPoly(space, shape, cp.v.neg(n), -dist);

        /*cpBody*/ var body = shape.getBody();
        space.removeShape(shape);
        space.removeBody(body);
    }

//static void
    var SliceQuery = function(/*cpShape*/ shape, /*cpFloat*/ t, /*cpVect*/ n, /*struct SliceContext*/ context) {
        /*cpVect*/ var a = context.a;
        /*cpVect*/ var b = context.b;


        // Check that the slice was complete by checking that the endpoints aren't in the sliced shape.
        if(!shape.pointQuery(a) && !shape.pointQuery(b)){
            // Can't modify the space during a query.
            // Must make a post-step callback to do the actual slicing.
            context.space.addPostStepCallback(/*(cpPostStepFunc)*/SliceShapePostStep, shape, context);
        }
    }
})(function() {
   return this;
}())