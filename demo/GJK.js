(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'GJK'
        ,init: function() {
            /*cpSpace*/ var space = this.space;
            space.setIterations(5);
            space.damping = 0.1;

            /*cpFloat*/ var mass = 1.0;

//	{
//		/*cpFloat*/ var size = 100.0;
//
//		/*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForBox(mass, size, size)));
//		body.setPos(cp.v(100.0, 50.0));
//
//		shape1 = space.addShape(new cp.BoxShape(body, size, size));
//		cpPolyShapeSetRadius(shape1, 10.0);
//		shape1.group = 1;
//	}{
//		/*cpFloat*/ var size = 100.0;
//
//		/*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForBox(mass, size, size)));
//		body.setPos(cp.v(120.0, -40.0));
//		body.setAngle(1e-2);
//
//		shape2 = space.addShape(new cp.BoxShape(body, size, size));
//		cpPolyShapeSetRadius(shape2, 20.0);
//		shape2.group = 1;
//	}

            {
                /*cpFloat*/ var size = 100.0;
                /*int*/ var NUM_VERTS = 5;

                /*cpVect*/ var verts = new Array(NUM_VERTS);
                for(var i=0; i<NUM_VERTS; i++){
                    /*cpFloat*/ var angle = -2*Math.PI*i/(/*cpFloat*/ NUM_VERTS);
                    verts[i] = cp.v(size/2.0*Math.cos(angle), size/2.0*Math.sin(angle));
                }

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForPoly(mass, verts, cp.vzero)));
                body.setPos(cp.v(100.0, 50.0));

                shape1 = space.addShape(new cp.PolyShape(body, verts, cp.vzero));
                shape1.group = 1;
                shape1.r = 25.0;
            }
//	{
//		/*cpFloat*/ var size = 100.0;
//		const /*int*/ var NUM_VERTS = 4;
//
//		cpVect verts[NUM_VERTS];
//		for(var i=0; i<NUM_VERTS; i++){
//			/*cpFloat*/ var angle = -2*M_PI*i/(/*cpFloat*/ NUM_VERTS);
//			verts[i] = cp.v(size/2.0*cos(angle), size/2.0*sin(angle));
//		}
//
//		/*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForPoly(mass, NUM_VERTS, verts, cp.vzero)));
//		body.setPos(cp.v(100.0, -50.0));
//
//		shape2 = space.addShape(body.new(NUM_VERTS, verts, cp.vzero));
//		shape2.group = 1;
//	}

//	{
//		/*cpFloat*/ var size = 150.0;
//		/*cpFloat*/ var radius = 25.0;
//
//		/*cpVect*/ var a = cp.v( size/2.0, 0.0);
//		/*cpVect*/ var b = cp.v(-size/2.0, 0.0);
//		/*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForSegment(mass, a, b)));
//		body.setPos(cp.v(0, 25));
//
//		shape1 = space.addShape(new cp.SegmentShape(body, a, b, radius));
//		shape1.group = 1;
//	}
//	{
//		/*cpFloat*/ var size = 150.0;
//		/*cpFloat*/ var radius = 25.0;
//
//		/*cpVect*/ var a = cp.v( size/2.0, 0.0);
//		/*cpVect*/ var b = cp.v(-size/2.0, 0.0);
//		/*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForSegment(mass, a, b)));
//		body.setPos(cp.v(0, -25));
//
//		shape2 = space.addShape(new cp.SegmentShape(body, a, b, radius));
//		shape2.group = 1;
//	}

            {
                /*cpFloat*/ var radius = 50.0;

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForCircle(mass, 0.0, radius, cp.vzero)));
                body.setPos(cp.v(0, -25));

                shape2 = space.addShape(new cp.CircleShape(body, radius, cp.vzero));
                shape2.group = 2;
            }

            return space;
        }
    })
    /*static cpShape*/ var shape1, shape2;
})(function() {
   return this;
}())