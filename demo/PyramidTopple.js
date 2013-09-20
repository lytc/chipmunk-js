(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'Pyramid Topple'
        ,steps: 1

        ,init: function() {
            /*cpSpace*/ var space = this.space
            space.setIterations(30);
            space.gravity = (cp.v(0, -100));
            space.sleepTimeThreshold = (0.5);
            space.collisionSlop = (0.5);

            // Add a floor.
            /*cpShape*/ var shape = space.addShape(new cp.SegmentShape(space.staticBody, cp.v(-600,-240), cp.v(600,-240), 0.0));
            shape.setElasticity(1.0);
            shape.setFriction(1.0);
            shape.layers = Demo.NOT_GRABABLE_MASK;


            // Add the dominoes.
            /*int*/ var n = 12;
            for(var i=0; i<n; i++){
                for(var j=0; j<(n - i); j++){
                    /*cpVect*/ var offset = cp.v((j - (n - 1 - i)*0.5)*1.5*HEIGHT, (i + 0.5)*(HEIGHT + 2*WIDTH) - WIDTH - 240);
                    add_domino(space, offset, false);
                    add_domino(space, cp.v.add(offset, cp.v(0, (HEIGHT + WIDTH)/2.0)), true);

                    if(j == 0){
                        add_domino(space, cp.v.add(offset, cp.v(0.5*(WIDTH - HEIGHT), HEIGHT + WIDTH)), false);
                    }

                    if(j != n - i - 1){
                        add_domino(space, cp.v.add(offset, cp.v(HEIGHT*0.75, (HEIGHT + 3*WIDTH)/2.0)), true);
                    } else {
                        add_domino(space, cp.v.add(offset, cp.v(0.5*(HEIGHT - WIDTH), HEIGHT + WIDTH)), false);
                    }
                }
            }

            return space;
        }
    })

    var WIDTH = 4.0
    var HEIGHT = 30.0

//static void
    var add_domino = function(/*cpSpace*/ space, /*cpVect*/ pos, /*cpBool*/ flipped) {
        /*cpFloat*/ var mass = 1.0;
        /*cpFloat*/ var moment = cp.momentForBox(mass, WIDTH, HEIGHT);

        /*cpBody*/ var body = space.addBody(new cp.Body(mass, moment));
        body.setPos(pos);

        /*cpShape*/ var shape = (flipped ? new cp.BoxShape(body, HEIGHT, WIDTH) : new cp.BoxShape(body, WIDTH, HEIGHT));
        space.addShape(shape);
        shape.setElasticity(0.0);
        shape.setFriction(0.6);
    }
})(this)