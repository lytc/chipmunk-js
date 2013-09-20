(function() {
    var DENSITY = (1.0/10000.0)

    Demo.add({
        name: 'Convex'
        ,timeStep: 1.0/60.0
        ,messageString: "Right click and drag to change the blocks's shape."

        //static cpSpace *
        ,init: function() {
            /*cpSpace*/ var space = this.space
            space.iterations = 30;
            space.gravity = cp.v(0, -500);
            space.sleepTimeThreshold = .5;
            space.collisionSlop = .5;

            var body, staticBody = space.staticBody;

            // Create segments around the edge of the screen.
            var shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,-240), cp.v(320,-240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            /*cpFloat*/ var width = 50.0;
            /*cpFloat*/ var height = 70.0;
            /*cpFloat*/ var mass = width*height*DENSITY;
            /*cpFloat*/ var moment = cp.momentForBox(mass, width, height);

            body = space.addBody(new cp.Body(mass, moment));
//            body.setPos(cp.v(320, height / 2 + 100))
            shape = this.shape = space.addShape(new cp.BoxShape(body, width, height));
            shape.setFriction(0.6);

            return space;
        }

        //static void
        ,update: function(/*double*/ dt) {
            var shape = this.shape

            /*cpFloat*/ var tolerance = 2.0;

            if(Demo.rightClick && shape.nearestPointQuery(Demo.mouse, null).d > tolerance){
                /*cpBody*/ var body = shape.getBody();
                /*int*/ var count = shape.getNumVerts();
                // Allocate the space for the new vertexes on the stack.
//		/*cpVect*/ var verts = (cpVect *)alloca((count + 1)*sizeof(cpVect));
                /*cpVect*/ var verts = new Array(count + 1);

                for(var i=0; i<count; i++){
                    verts[i] = shape.getVert(i);
                }

                verts[count] = body.world2Local(Demo.mouse);

                // This function builds a convex hull for the vertexes.
                // Because the result array is null, it will reduce the input array instead.
                /*int*/ cp.convexHull(count + 1, verts, null, null, tolerance);

                // Figure out how much to shift the body by.
                /*cpVect*/ var centroid = cp.centroidForPoly(verts);

                // Recalculate the body properties to match the updated shape.
                /*cpFloat*/ var mass = cp.areaForPoly(verts)*DENSITY;

                body.setMass(mass);
                body.setMoment(cp.momentForPoly(mass, verts, cp.v.neg(centroid)));
                body.setPos(body.local2World(centroid));

                // Use the setter function from chipmunk_unsafe.h.
                // You could also remove and recreate the shape if you wanted.
                shape.setVerts(verts, cp.v.neg(centroid));
            }

            this.space.step(dt);
        }
    })
})(this)