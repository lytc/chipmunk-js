(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'Plink'
        ,messageString: "Right click to make pentagons static/dynamic."
        ,init: function() {

            /*cpSpace*/ var space = this.space
            space.setIterations(5);
            space.gravity = (cp.v(0, -100));

            var body, staticBody = space.staticBody
            /*cpShape*/ var shape

            // Vertexes for a triangle shape.
            /*cpVect*/ var tris = [
                cp.v(-15,-15),
                cp.v(  0, 10),
                cp.v( 15,-15)
            ];

            // Create the static triangles.
            for(var i=0; i<9; i++){
                for(var j=0; j<6; j++){
                    /*cpFloat*/ var stagger = (j%2)*40;
                    /*cpVect*/ var offset = cp.v(i*80 - 320 + stagger, j*70 - 240);
                    shape = space.addShape(new cp.PolyShape(staticBody, tris, offset));
                    shape.setElasticity(1.0);
                    shape.setFriction(1.0);
                    shape.layers = Demo.NOT_GRABABLE_MASK;
                }
            }

            // Create vertexes for a pentagon shape.
            /*cpVect*/ var verts = new Array(NUM_VERTS);
            for(var i=0; i<NUM_VERTS; i++){
                /*cpFloat*/ var angle = -2*Math.PI*i/(/*cpFloat*/ NUM_VERTS);
                verts[i] = cp.v(10*Math.cos(angle), 10*Math.sin(angle));
            }

            pentagon_mass = 1.0;
            pentagon_moment = cp.momentForPoly(1.0, verts, cp.vzero);

            // Add lots of pentagons.
            for(var i=0; i<100; i++){
                body = space.addBody(new cp.Body(pentagon_mass, pentagon_moment));
                /*cpFloat*/ var x = Demo.Random(-320, 320)
                body.setPos(cp.v(x, Demo.Random(320, 500)));

                shape = space.addShape(new cp.PolyShape(body, verts, cp.vzero));
                shape.setElasticity(0.0);
                shape.setFriction(0.4);
            }

            return space;
        }

        ,update: function(/*double*/ dt) {
            var space = this.space

            if(Demo.rightDown){
                /*cpShape*/ var nearest = space.nearestPointQueryNearest(Demo.mouse, 0.0, Demo.GRABABLE_MASK_BIT, cp.NO_GROUP, null);
                if(nearest){
                    /*cpBody*/ var body = nearest.getBody();
                    if(body.isStatic()){
                        space.convertBodyToDynamic(body, pentagon_mass, pentagon_moment);
                        space.addBody(body);
                    } else {
                        space.removeBody(body);
                        space.convertBodyToStatic(body);
                    }
                }
            }

            space.step(dt);
            space.eachBody(eachBody, null);
        }
    })
    /*cpFloat*/ var pentagon_mass = 0.0;
    /*cpFloat*/ var pentagon_moment = 0.0;

// Iterate over all of the bodies and reset the ones that have fallen offscreen.
//static void
    var eachBody = function(/*cpBody*/ body, /*void*/ unused) {
        /*cpVect*/ var pos = body.getPos();
        if(pos.y < -260 || cp.fabs(pos.x) > 340){
            /*cpFloat*/ var x = Demo.Random(-320, 320)//*cpFloat*/RAND_MAX*640 - 320;
            body.setPos(cp.v(x, 260));
        }
    }

    var NUM_VERTS = 5
})(this)