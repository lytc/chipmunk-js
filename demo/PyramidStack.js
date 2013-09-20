(function() {
    Demo.add({
        name: 'Pyramid Stack'
        ,init: function() {
            /*cpSpace*/ var space = this.space
            space.setIterations(30);
            space.gravity = cp.v(0, -100);
            space.sleepTimeThreshold = 0.5;
            space.collisionSlop = 0.5;

            var body, staticBody = space.staticBody;
            /*cpShape*/ var shape;

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

            // Add lots of boxes.
            for(var i=0; i<14; i++){
                for(var j=0; j<=i; j++){
                    body = space.addBody(new cp.Body(1.0, cp.momentForBox(1.0, 30.0, 30.0)));
                    body.setPos(cp.v(j*32 - i*16, 300 - i*32));

                    shape = space.addShape(new cp.BoxShape(body, 30.0, 30.0));
                    shape.setElasticity(0.0);
                    shape.setFriction(0.8);
                }
            }

            // Add a ball to make things more interesting
            /*cpFloat*/ var radius = 15.0;
            body = space.addBody(new cp.Body(10.0, cp.momentForCircle(10.0, 0.0, radius, cp.vzero)));
            body.setPos(cp.v(0, -240 + radius+5));

            shape = space.addShape(new cp.CircleShape(body, radius, cp.vzero));
            shape.setElasticity(0.0);
            shape.setFriction(0.9);

            return space;
        }
        ,update: function(/*double*/ dt) {
            this.space.step(dt);
        }
    })
})(this)