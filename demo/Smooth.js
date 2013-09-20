(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'Smooth'
        
        ,init: function() {
            /*cpSpace*/ var space = this.space
            space.setIterations(5);
            space.damping = (0.1);

            space.setDefaultCollisionHandler(null, DrawContacts, null, null, null);

            {
                /*cpFloat*/ var mass = 1.0;
                /*cpFloat*/ var length = 100.0;
                /*cpVect*/ var a = cp.v(-length/2.0, 0.0), b = cp.v(length/2.0, 0.0);

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForSegment(mass, a, b)));
                body.setPos(cp.v(-160.0, 80.0));

                space.addShape(new cp.SegmentShape(body, a, b, 30.0));
            }

            {
                /*cpFloat*/ var mass = 1.0;
                /*int*/ var NUM_VERTS = 5;

                /*cpVect*/ var verts = new Array(NUM_VERTS);
                for(var i=0; i<NUM_VERTS; i++){
                    /*cpFloat*/ var angle = -2*Math.PI*i/(/*cpFloat*/ NUM_VERTS);
                    verts[i] = cp.v(40*Math.cos(angle), 40*Math.sin(angle));
                }

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForPoly(mass, verts, cp.vzero)));
                body.setPos(cp.v(-0.0, 80.0));

                space.addShape(new cp.PolyShape(body, verts, cp.vzero));
            }

            {
                /*cpFloat*/ var mass = 1.0;
                /*cpFloat*/ var r = 60.0;

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, Infinity));
                body.setPos(cp.v(160.0, 80.0));

                space.addShape(new cp.CircleShape(body, r, cp.vzero));
            }

            /*cpBody*/ var staticBody = space.staticBody

            /*cpVect*/ var terrain = [
                cp.v(-320, -200),
                cp.v(-200, -100),
                cp.v(   0, -200),
                cp.v( 200, -100),
                cp.v( 320, -200)
            ];
//	/*int*/ var terrainCount = sizeof(terrain)/sizeof(*terrain);
            /*int*/ var terrainCount = 5;

            for(var i=1; i<5; i++){
                /*cpVect*/ var v0 = terrain[MAX(i-2, 0)];
                /*cpVect*/ var v1 = terrain[i-1];
                /*cpVect*/ var v2 = terrain[i];
                /*cpVect*/ var v3 = terrain[MIN(i+1, terrainCount - 1)];

                /*cpShape*/ var seg = space.addShape(new cp.SegmentShape(staticBody, v1, v2, 10.0));
                seg.setNeighbors(v0, v3);
            }

            return space;
        }
    })
    //cpBool
    var DrawContacts = function(/*cpArbiter*/ arb, /*cpSpace*/ space, /*void*/ data) {
        /*cpContactPointSet*/ var set = arb.getContactPointSet();

        for(var i=0; i<set.count; i++){
            /*cpVect*/ var p = set.points[i].point;
            Demo.renderer.drawDot(6.0, p, new Demo.Color(255, 0, 0, 1));
            Demo.renderer.drawSegment(p, cp.v.add(p, cp.v.mult(set.points[i].normal, 10.0)), new Demo.Color(255, 0, 0, 1));
        }

        return false;
//	return true;
    }


    var MAX = function(a, b) {return a > b ? a : b}
    var MIN = function(a, b) {return a < b ? a : b}
})(this)