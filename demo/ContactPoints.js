(function() {
    Demo.add({
        name: 'ContactPoints'

        ,init: function() {
            /*cpSpace*/ var space = this.space
            space.setIterations(5);
            space.damping = (0.1);

            space.setDefaultCollisionHandler(NeverCollide, null, null, null, null);

            {
                /*cpFloat*/ var mass = 1.0;
                /*cpFloat*/ var length = 100.0;
                /*cpVect*/ var a = cp.v(-length/2.0, 0.0), b = cp.v(length/2.0, 0.0);

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForSegment(mass, a, b)));
                body.setPos(cp.v(-160.0, -80.0));

                space.addShape(new cp.SegmentShape(body, a, b, 30.0));
            }

            {
                /*cpFloat*/ var mass = 1.0;
                /*cpFloat*/ var length = 100.0;
                /*cpVect*/ var a = cp.v(-length/2.0, 0.0), b = cp.v(length/2.0, 0.0);

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForSegment(mass, a, b)));
                body.setPos(cp.v(-160.0, 80.0));

                space.addShape(new cp.SegmentShape(body, a, b, 20.0));
            }

            {
                /*cpFloat*/ var mass = 1.0;
                /*int*/ var NUM_VERTS = 5;

                /*cpVect*/var verts = new Array(NUM_VERTS);
                for(var i=0; i<NUM_VERTS; i++){
                    /*cpFloat*/ var angle = -2*Math.PI*i/(/*cpFloat*/ NUM_VERTS);
                    verts[i] = cp.v(40*Math.cos(angle), 40*Math.sin(angle));
                }

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForPoly(mass, verts, cp.vzero)));
                body.setPos(cp.v(-0.0, -80.0));

                space.addShape(new cp.PolyShape(body, verts, cp.vzero));
            }

            {
                /*cpFloat*/ var mass = 1.0;
                /*int*/ var NUM_VERTS = 4;

                /*cpVect*/ var verts = new Array(NUM_VERTS);
                for(var i=0; i<NUM_VERTS; i++){
                    /*cpFloat*/ var angle = -2*Math.PI*i/(/*cpFloat*/ NUM_VERTS);
                    verts[i] = cp.v(60*Math.cos(angle), 60*Math.sin(angle));
                }

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForPoly(mass, verts, cp.vzero)));
                body.setPos(cp.v(-0.0, 80.0));

                space.addShape(new cp.PolyShape(body, verts, cp.vzero));
            }

            {
                /*cpFloat*/ var mass = 1.0;
                /*cpFloat*/ var r = 60.0;

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, Infinity));
                body.setPos(cp.v(160.0, -80.0));

                space.addShape(new cp.CircleShape(body, r, cp.vzero));
            }

            {
                /*cpFloat*/ var mass = 1.0;
                /*cpFloat*/ var r = 40.0;

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, Infinity));
                body.setPos(cp.v(160.0, 80.0));

                space.addShape(new cp.CircleShape(body, r, cp.vzero));
            }

            return space;
        }
    })
    /*static cpBool*/
    var NeverCollide = function(/*cpArbiter **/arb, /*cpSpace **/space, /*void **/data){
        return false;
    }
})(this)