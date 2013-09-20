(function() {
    Demo.add({
        name: 'Tumble'
        ,steps: 3

        ,init: function() {
            cp.enableSegmentToSegmentCollisions()
            /*cpSpace*/ var space = this.space
            space.gravity = (cp.v(0, -600));

            /*cpShape*/ var shape

            // We create an infinite mass rogue body to attach the line segments too
            // This way we can control the rotation however we want.
            var rogueBoxBody = this.rogueBoxBody = new cp.Body(Infinity, Infinity);
            rogueBoxBody.setAngVel(0.4);

            // Set up the static box.
            /*cpVect*/ var a = cp.v(-200, -200);
            /*cpVect*/ var b = cp.v(-200,  200);
            /*cpVect*/ var c = cp.v( 200,  200);
            /*cpVect*/ var d = cp.v( 200, -200);

            shape = space.addShape(new cp.SegmentShape(rogueBoxBody, a, b, 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(rogueBoxBody, b, c, 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(rogueBoxBody, c, d, 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(rogueBoxBody, d, a, 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;

            /*cpFloat*/ var mass = 1;
            /*cpFloat*/ var width = 30;
            /*cpFloat*/ var height = width*2;

            // Add the bricks.
            for(var i=0; i<7; i++){
                for(var j=0; j<3; j++){
                    /*cpVect*/ var pos = cp.v(i*width - 150, j*height - 150);

                    /*int*/ var type = Math.round(Math.random() * 3);
                    if(type ==0){
                        AddBox(space, pos, mass, width, height);
                    } else if(type == 1){
                        AddSegment(space, pos, mass, width, height);
                    } else {
                        AddCircle(space, cp.v.add(pos, cp.v(0.0, (height - width)/2.0)), mass, width/2.0);
                        AddCircle(space, cp.v.add(pos, cp.v(0.0, (width - height)/2.0)), mass, width/2.0);
                    }
                }
            }

            return space;
        }

        ,update: function(/*double*/ dt) {
            // Manually update the position of the box body so that the box rotates.
            // Normally Chipmunk calls this and cpBodyUpdateVelocity() for you,
            // but we wanted to control the angular velocity explicitly.
            this.rogueBoxBody.updatePosition(dt);

            this.space.step(dt);
        }
    })

//static void
    var AddBox = function(/*cpSpace*/ space, /*cpVect*/ pos, /*cpFloat*/ mass, /*cpFloat*/ width, /*cpFloat*/ height) {
        /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForBox(mass, width, height)));
        body.setPos(pos);

        /*cpShape*/ var shape = space.addShape(new cp.BoxShape(body, width, height));
        shape.setElasticity(0.0);
        shape.setFriction(0.7);
    }

//static void
    var AddSegment = function(/*cpSpace*/ space, /*cpVect*/ pos, /*cpFloat*/ mass, /*cpFloat*/ width, /*cpFloat*/ height) {
        /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForBox(mass, width, height)));
        body.setPos(pos);

        /*cpShape*/ var shape = space.addShape(new cp.SegmentShape(body, cp.v(0.0, (height - width)/2.0), cp.v(0.0, (width - height)/2.0), width/2.0));
        shape.setElasticity(0.0);
        shape.setFriction(0.7);
    }

//static void
    var AddCircle = function(/*cpSpace*/ space, /*cpVect*/ pos, /*cpFloat*/ mass, /*cpFloat*/ radius) {
        /*cpBody*/ var body = space.addBody(new cp.Body(mass, cp.momentForCircle(mass, 0.0, radius, cp.vzero)));
        body.setPos(pos);

        /*cpShape*/ var shape = space.addShape(new cp.CircleShape(body, radius, cp.vzero));
        shape.setElasticity(0.0);
        shape.setFriction(0.7);
    }
})(this)