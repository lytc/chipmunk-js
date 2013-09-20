(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'Shatter.'
        ,messageString: "Right click something to shatter it."
        ,init: function()
        {
            /*cpSpace **/ var space = this.space;

            space.iterations = (30);
            space.gravity = (cp.v(0, -500));
            space.sleepTimeThreshold = (0.5);
            space.setCollisionSlop = (0.5);

            /*cpBody **/ var body, staticBody = space.staticBody;
            /*cpShape **/ var shape;

            // Create segments around the edge of the screen.
            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-1000, -240), cp.v( 1000, -240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            /*cpFloat*/ var width = 200.0;
            /*cpFloat*/ var height = 200.0;
            /*cpFloat*/ var mass = width*height*DENSITY;
            /*cpFloat*/ var moment = cp.momentForBox(mass, width, height);

            body = space.addBody(new cp.Body(mass, moment));

            shape = space.addShape(new cp.BoxShape(body, width, height));
            shape.setFriction(0.6);

            return space;
        }

        ,update: function(/*double*/ dt)
        {
            var space = this.space;

            space.step(dt);

            if(Demo.rightDown){
                var mouse = Demo.mouse
                /*cpNearestPointQueryInfo*/ var info;
                if(info = space.nearestPointQueryNearest(mouse, 0, Demo.GRABABLE_MASK_BIT, cp.NO_GROUP)){
                    /*cpBB*/ var bb = info.shape.getBB();
                    /*cpFloat*/ var cell_size = cp.fmax(bb.r - bb.l, bb.t - bb.b)/5.0;

                    if(cell_size > 5.0){
                        ShatterShape(space, info.shape, cell_size, mouse);
                    } else {
//				printf("Too small to splinter %f\n", cell_size);
                    }
                }
            }
        }
    })

    var DENSITY = (1.0/10000.0)

    var MAX_VERTEXES_PER_VORONOI = 16

    var WorleyContex = function (
        /*uint32_t*/ seed,
        /*cpFloat*/ cellSize,
        /*int*/ width, height,
        /*cpBB*/ bb,
        /*cpVect*/ focus
        ) {
        this.seed = seed;
        this.cellSize = cellSize;
        this.width = width;
        this.height = height;
        this.bb = bb;
        this.focus = focus;
    };

//static inline cpVect
    var HashVect = function(/*uint32_t*/ x, /*uint32_t*/ y, /*uint32_t*/ seed)
    {
//	cpFloat border = 0.21f;
        /*cpFloat*/ var border = 0.05;
        /*uint32_t*/ var h = (x*1640531513 ^ y*2654435789) + seed;

        return cp.v(
            cp.flerp(border, 1.0 - border, (      h & 0xFFFF)/0xFFFF),
            cp.flerp(border, 1.0 - border, ((h>>16) & 0xFFFF)/0xFFFF)
        );
    }

//static cpVect
    var WorleyPoint = function(/*int*/ i, /*int*/ j, /*struct WorleyContex **/context)
    {
        /*cpFloat*/ var size = context.cellSize;
        /*int*/ var width = context.width;
        /*int*/ var height = context.height;
        /*cpBB*/ var bb = context.bb;

//	cpVect fv = cpv(0.5, 0.5);
        /*cpVect*/ var fv = HashVect(i, j, context.seed);

        return cp.v(
            cp.flerp(bb.l, bb.r, 0.5) + size*(i + fv.x -  width*0.5),
            cp.flerp(bb.b, bb.t, 0.5) + size*(j + fv.y - height*0.5)
        );
    }

//static int
    var ClipCell = function(/*cpShape **/shape, /*cpVect*/ center, /*int*/ i, /*int*/ j, /*struct WorleyContex **/context, /*cpVect **/verts, /*cpVect **/clipped, /*int*/ count)
    {
        /*cpVect*/ var other = WorleyPoint(i, j, context);
//	printf("  other %dx%d: (% 5.2f, % 5.2f) ", i, j, other.x, other.y);
        if(shape.nearestPointQuery(other, null).d > 0.0){
//		printf("excluded\n");
            for (var i = 0; i < count; i++) {
                clipped[i] = verts[i];
            }
//		memcpy(clipped, verts, count*sizeof(cpVect));
            return count;
        } else {
//		printf("clipped\n");
        }

        /*cpVect*/ var n = cp.v.sub(other, center);
        /*cpFloat*/ var dist = cp.v.dot(n, cp.v.lerp(center, other, 0.5));

        /*int*/ var clipped_count = 0;
        for(/*int*/ var j=0, i=count-1; j<count; i=j, j++){
            /*cpVect*/ var a = verts[i];
            /*cpFloat*/ var a_dist = cp.v.dot(a, n) - dist;

            if(a_dist <= 0.0){
                clipped[clipped_count] = a;
                clipped_count++;
            }

            /*cpVect*/ var b = verts[j];
            /*cpFloat*/ var b_dist = cp.v.dot(b, n) - dist;

            if(a_dist*b_dist < 0.0){
                /*cpFloat*/ var t = cp.fabs(a_dist)/(cp.fabs(a_dist) + cp.fabs(b_dist));

                clipped[clipped_count] = cp.v.lerp(a, b, t);
                clipped_count++;
            }
        }

        return clipped_count;
    }

//static void
    var ShatterCell = function(/*cpSpace **/space, /*cpShape **/shape, /*cpVect*/ cell, /*int*/ cell_i, /*int*/ cell_j, /*struct WorleyContex **/context)
    {
//	printf("cell %dx%d: (% 5.2f, % 5.2f)\n", cell_i, cell_j, cell.x, cell.y);

        /*cpBody **/ var body = shape.body

        /*cpVect **/ var ping = [];
        /*cpVect **/ var pong = [];

        /*int*/ var count = shape.getNumVerts();
        count = (count > MAX_VERTEXES_PER_VORONOI ? MAX_VERTEXES_PER_VORONOI : count);

        for(/*int*/ var i=0; i<count; i++){
            ping[i] = body.local2World(shape.getVert(i));
        }

        for(/*int*/ var i=0; i<context.width; i++){
            for(/*int*/ var j=0; j<context.height; j++){
                if(
                    !(i == cell_i && j == cell_j) &&
                        shape.nearestPointQuery(cell, null).d < 0.0
                    ){

                    count = ClipCell(shape, cell, i, j, context, ping, pong, count);
                    for (var k = 0; k < count; k++) {
                        ping[k] = pong[k]
                    }
//				memcpy(ping, pong, count*sizeof(cpVect));
                }
            }
        }

        ping.splice(count)

        /*cpVect*/ var centroid = cp.centroidForPoly(ping);
        /*cpFloat*/ var mass = cp.areaForPoly(ping)*DENSITY;
        /*cpFloat*/ var moment = cp.momentForPoly(mass, ping, cp.v.neg(centroid));

        /*cpBody **/ var new_body = space.addBody(new cp.Body(mass, moment));
        new_body.setPos(centroid);
        new_body.setVel(body.getVelAtWorldPoint(centroid));
        new_body.setAngVel(body.getAngVel());

        /*cpShape **/ var new_shape = space.addShape(new cp.PolyShape(new_body, ping, cp.v.neg(centroid)));

        // Copy whatever properties you have set on the original shape that are important
        new_shape.setFriction(shape.getFriction());
    }

//static void
    var ShatterShape = function(/*cpSpace **/space, /*cpShape **/shape, /*cpFloat*/ cellSize, /*cpVect*/ focus)
    {
        space.removeShape(shape);
        space.removeBody(shape.body);

        /*cpBB*/ var bb = shape.getBB();
        /*int*/ var width = parseInt((bb.r - bb.l)/cellSize) + 1;
        /*int*/ var height = parseInt((bb.t - bb.b)/cellSize) + 1;
//	printf("Splitting as %dx%d\n", width, height);

        /*struct WorleyContex*/ var context = new WorleyContex(Demo.rand(), cellSize, width, height, bb, focus);

        for(/*int*/ var i=0; i<context.width; i++){
            for(/*int*/ var j=0; j<context.height; j++){
                /*cpVect*/ var cell = WorleyPoint(i, j, context);
                if(shape.nearestPointQuery(cell, null).d < 0.0){
                    ShatterCell(space, shape, cell, i, j, context);
                }
            }
        }
    }
})(this)