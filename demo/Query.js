(function() {
    Demo.add({
        name: 'Segment Query'
        
        ,init: function() {
            /*cpVect*/ this.QUERY_START = cp.v(0, 0)

            /*cpSpace*/ var space = this.space
            space.setIterations(5);

            { // add a fat segment
                /*cpFloat*/ var mass = 1.0;
                /*cpFloat*/ var length = 100.0;
                /*cpVect*/ var a = cp.v(-length/2.0, 0.0), b = cp.v(length/2.0, 0.0);

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForSegment(mass, a, b)));
                body.setPos(cp.v(0.0, 100.0));

                space.addShape(new cp.SegmentShape(body, a, b, 20.0));
            }

            { // add a static segment
                space.addShape(new cp.SegmentShape(space.staticBody, cp.v(0, 300), cp.v(300, 0), 0.0));
            }

            { // add a pentagon
                /*cpFloat*/ var mass = 1.0;
                /*int*/ var NUM_VERTS = 5;

                /*cpVect*/ var verts = new Array(NUM_VERTS);
                for(var i=0; i<NUM_VERTS; i++){
                    /*cpFloat*/ var angle = -2*Math.PI*i/(/*cpFloat*/ NUM_VERTS);
                    verts[i] = cp.v(30*Math.cos(angle), 30*Math.sin(angle));
                }

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForPoly(mass, verts, cp.vzero)));
                body.setPos(cp.v(50.0, 30.0));

                space.addShape(new cp.PolyShape2(body, verts, cp.vzero, 10.0));
            }

            { // add a circle
                /*cpFloat*/ var mass = 1.0;
                /*cpFloat*/ var r = 20.0;

                /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForCircle(mass, 0.0, r, cp.vzero)));
                body.setPos(cp.v(100.0, 100.0));

                space.addShape(new cp.CircleShape(body, r, cp.vzero));
            }

            return space;
        }
        
        ,update: function(/*double*/ dt) {
            var space = this.space
            space.step(dt);

            var QUERY_START = this.QUERY_START

            if(Demo.rightClick){
                QUERY_START.x = Demo.mouse.x;
                QUERY_START.y = Demo.mouse.y;
            }

            /*cpVect*/ var start = QUERY_START;
            /*cpVect*/ var end = Demo.mouse;
            Demo.renderer.drawSegment(start, end, new Demo.Color(0,255,0,1));

            this.messageString =(Demo.format("Query: Dist({0}) Point {1}, ", cp.v.dist(start, end).toFixed(2), cp.v.str(end)));

            /*cpSegmentQueryInfo*/ var segInfo;
            if(segInfo = space.segmentQueryFirst(start, end, cp.ALL_LAYERS, cp.NO_GROUP)){
                /*cpVect*/ var point = segInfo.hitPoint(start, end);

                // Draw blue over the occluded part of the query
                Demo.renderer.drawSegment(point, end, new Demo.Color(0,0,255,1));

                // Draw a little red surface normal
                Demo.renderer.drawSegment(point, cp.v.add(point, cp.v.mult(segInfo.n, 16)), new Demo.Color(255,0,0,1));

                // Draw a little red dot on the hit point.
                Demo.renderer.drawDot(3, point, new Demo.Color(255,0,0,1));


                this.messageString +=(Demo.format("Segment Query: Dist({0}) Normal {1}", segInfo.hitDist(start, end).toFixed(2), cp.v.str(segInfo.n)));
            } else {
                this.messageString +=("Segment Query (None)");
            }

//            /*cpNearestPointQueryInfo*/ var nearestInfo = {};
            var nearestInfo = space.nearestPointQueryNearest(Demo.mouse, 100.0, cp.ALL_LAYERS, cp.NO_GROUP);
            if(nearestInfo){
                // Draw a grey line to the closest shape.
                Demo.renderer.drawDot(3, Demo.mouse, new Demo.Color(127, 127, 127, 1.0));
                Demo.renderer.drawSegment(Demo.mouse, nearestInfo.p, 	new Demo.Color(127, 127, 127, 1.0));

                // Draw a red bounding box around the shape under the mouse.
                if(nearestInfo.d < 0) Demo.renderer.drawBB(nearestInfo.shape.getBB(), new Demo.Color(255,0,0,1));
            }
        }
    })
})(this)