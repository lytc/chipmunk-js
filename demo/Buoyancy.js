(function(global) {
    var FLUID_DENSITY = 0.00014
    var FLUID_DRAG = 2.0

    var Demo = global.Demo

    Demo.add({
        name: 'Simple Sensor based fluids.'
        ,steps: 1

        ,init: function() {
            /*cpSpace*/ var space  = window.space = this.space

            space.setIterations(30);
            space.gravity = (cp.v(0, -500));
//	space.setDamping(0.5);
            space.sleepTimeThreshold = (0.5);
            space.collisionSlop = (0.5);

//            var body = space.addBody(new cp.Body(1, cp.momentForBox(1, 100, 40)));
//            body.setPos(cp.v(0, 0));
//            body.setAngle(1);
//            shape = space.addShape(new cp.BoxShape(body, 100, 40));
////            console.log(shape)
////            throw new Error('sdfdsf')
//            body = space.addBody(new cp.Body(1, cp.momentForBox(1, 100, 40)));
//            body.setPos(cp.v(0, 30));
//            shape = space.addShape(new cp.BoxShape(body, 100, 40));
////            return;

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

            {
                // Add the edges of the bucket
                /*cpBB*/ var bb = new cp.BB(-300, -200, 100, 0);
                /*cpFloat*/ var radius = 5.0;

                shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(bb.l, bb.b), cp.v(bb.l, bb.t), radius));
                shape.setElasticity(1.0);
                shape.setFriction(1.0);
                shape.layers = Demo.NOT_GRABABLE_MASK;

                shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(bb.r, bb.b), cp.v(bb.r, bb.t), radius));
                shape.setElasticity(1.0);
                shape.setFriction(1.0);
                shape.layers = Demo.NOT_GRABABLE_MASK;

                shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(bb.l, bb.b), cp.v(bb.r, bb.b), radius));
                shape.setElasticity(1.0);
                shape.setFriction(1.0);
                shape.layers = Demo.NOT_GRABABLE_MASK;

                // Add the sensor for the water.
                shape = space.addShape(new cp.BoxShape2(staticBody, bb));
                shape.setSensor(true);
                shape.setCollisionType(1);
            }


            {
                /*cpFloat*/ var width = 200.0;
                /*cpFloat*/ var height = 50.0;
                /*cpFloat*/ var mass = 0.3*FLUID_DENSITY*width*height;
                /*cpFloat*/ var moment = cp.momentForBox(mass, width, height);

                body = space.addBody(new cp.Body(mass, moment));
                body.setPos(cp.v(-50, -100));
                body.setVel(cp.v(0, -100));
                body.setAngVel(1);

                shape = space.addShape(new cp.BoxShape(body, width, height));
                shape.setFriction(0.8);
            }

            {
                /*cpFloat*/ var width = 40.0;
                /*cpFloat*/ var height = width*2;
                /*cpFloat*/ var mass = 0.3*FLUID_DENSITY*width*height;
                /*cpFloat*/ var moment = cp.momentForBox(mass, width, height);

                body = space.addBody(new cp.Body(mass, moment));
                body.setPos(cp.v(-200, -50));
                body.setVel(cp.v(0, -100));
                body.setAngVel(1);

                shape = space.addShape(new cp.BoxShape(body, width, height));
                shape.setFriction(0.8);
            }

            space.addCollisionHandler(1, 0, null, /*cpSpacePointQueryFunc*/waterPreSolve, null, null, null);

            return space;
        }
    })

//static cpBool
    var waterPreSolve = function(/*cpArbiter*/ arb, /*cpSpace*/ space, /*void*/ ptr) {
        var shapes = arb.getShapes();
        var water = shapes[0];
        var poly = shapes[1];
        /*cpBody*/ var body = poly.getBody();

        // Get the top of the water sensor bounding box to use as the water level.
        /*cpFloat*/ var level = water.getBB().t;

        // Clip the polygon against the water level
        /*int*/ var count = poly.getNumVerts();
        /*int*/ var clippedCount = 0;
        if(typeof _MSC_VER != 'undefined' && _MSC_VER) {
            // MSVC is pretty much the only compiler in existence that doesn't support variable sized arrays.
            var clipped = new Array(10);
        } else {
            var clipped = new Array(count + 1);
        }
        var clipped = []

        for(var i=0, j=count-1; i<count; j=i, i++){
            /*cpVect*/ var a = body.local2World(poly.getVert(j));
            /*cpVect*/ var b = body.local2World(poly.getVert(i));

            if(a.y < level){
                clipped[clippedCount] = a;
                clippedCount++;
            }

            /*cpFloat*/ var a_level = a.y - level;
            /*cpFloat*/ var b_level = b.y - level;

            if(a_level*b_level < 0.0){
                /*cpFloat*/ var t = cp.fabs(a_level)/(cp.fabs(a_level) + cp.fabs(b_level));

                clipped[clippedCount] = cp.v.lerp(a, b, t);
                clippedCount++;
            }
        }

        // Calculate buoyancy from the clipped polygon area
        /*cpFloat*/ var clippedArea = cp.areaForPoly(clipped);
        /*cpFloat*/ var displacedMass = clippedArea*FLUID_DENSITY;
        /*cpVect*/ var centroid = cp.centroidForPoly(clipped);
        /*cpVect*/ var r = cp.v.sub(centroid, body.getPos());

        Demo.renderer.drawPolygon(clipped, 0.0, 'rgba(0, 0, 255, 255)', 'rgba(0, 0, 255, 0.1)');
        Demo.renderer.drawDot(5, centroid, 'rgba(0, 0, 255, 1)');

        /*cpFloat*/ var dt = space.getCurrentTimeStep();
        /*cpVect*/ var g = space.gravity

        // Apply the buoyancy force as an impulse.
        body.applyImpulse(cp.v.mult(g, -displacedMass*dt), r);

        // Apply linear damping for the fluid drag.
        /*cpVect*/ var v_centroid = cp.v.add(body.v, cp.v.mult(cp.v.perp(r), body.w));
        /*cpFloat*/ var k = body.kScalar(r, cp.v.normalize_safe(v_centroid));

        /*cpFloat*/ var damping = clippedArea*FLUID_DRAG*FLUID_DENSITY;
        /*cpFloat*/ var v_coef = cp.fexp(-damping*dt*k); // linear drag
//	/*cpFloat*/ var v_coef = 1.0/(1.0 + damping*dt*cp.v.len(v_centroid)*k); // quadratic drag
        body.applyImpulse(cp.v.mult(cp.v.sub(cp.v.mult(v_centroid, v_coef), v_centroid), 1.0/k), r);

        // Apply angular damping for the fluid drag.
        /*cpFloat*/ var w_damping = cp.momentForPoly(FLUID_DRAG*FLUID_DENSITY*clippedArea, clipped, cp.v.neg(body.p));

        body.w *= cp.fexp(-w_damping*dt*body.i_inv);

        return true;
    }
})(function() {
   return this;
}())