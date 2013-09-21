(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'Platformer Player Controls'
        ,steps: 3
        ,init: function() {
            /*cpSpace*/ var space = this.space
            space.iterations = 10;
            space.gravity = cp.v(0, -GRAVITY);
//	space.sleepTimeThreshold = 1000;
            space.enableContactGraph = true;

            var body, staticBody = space.staticBody;
            /*cpShape*/ var shape

            // Create segments around the edge of the screen.
            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,-240), cp.v(-320,240), 0.0));
            shape.e = 1.0; shape.u = 1.0;
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(320,-240), cp.v(320,240), 0.0));
            shape.e = 1.0; shape.u = 1.0;
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,-240), cp.v(320,-240), 0.0));
            shape.e = 1.0; shape.u = 1.0;
            shape.layers = Demo.NOT_GRABABLE_MASK;

            shape = space.addShape(new cp.SegmentShape(staticBody, cp.v(-320,240), cp.v(320,240), 0.0));
            shape.e = 1.0; shape.u = 1.0;
            shape.layers = Demo.NOT_GRABABLE_MASK;

            // Set up the player
            body = space.addBody(new cp.Body(1.0, Infinity));
            body.p = cp.v(0, -200);
            body.updateVelocity = playerUpdateVelocity;
            playerBody = body;

            shape = space.addShape(new cp.BoxShape3(body, new cp.BB(-15.0, -27.5, 15.0, 27.5), 10.0));
//	shape = space.addShape(new cp.SegmentShape(playerBody, cp.vzero, cp.v(0, radius), radius));
            shape.e = 0.0; shape.u = 0.0;
            shape.collision_type = 1;
            playerShape = shape;

            // Add some boxes to jump on
            for(var i=0; i<6; i++){
                for(var j=0; j<3; j++){
                    body = space.addBody(new cp.Body(4.0, Infinity));
                    body.p = cp.v(100 + j*60, -200 + i*60);

                    shape = space.addShape(new cp.BoxShape(body, 50, 50));
                    shape.e = 0.0; shape.u = 0.7;
                }
            }

            return space;
        }

        ,update: function(/*double*/ dt) {
            /*int*/ var jumpState = (Demo.keyboard.y > 0.0);

            // If the jump key was just pressed this frame, jump!
            if(jumpState && !lastJumpState && grounded){
                /*cpFloat*/ var jump_v = cp.fsqrt(2.0*JUMP_HEIGHT*GRAVITY);
                playerBody.v = cp.v.add(playerBody.v, cp.v(0.0, jump_v));

                remainingBoost = JUMP_BOOST_HEIGHT/jump_v;
            }

            // Step the space
            this.space.step(dt);

            remainingBoost -= dt;
            lastJumpState = jumpState;
        }
    })
    var PLAYER_VELOCITY = 500.0

    var PLAYER_GROUND_ACCEL_TIME = 0.1
    var PLAYER_GROUND_ACCEL = (PLAYER_VELOCITY/PLAYER_GROUND_ACCEL_TIME)

    var PLAYER_AIR_ACCEL_TIME = 0.25
    var PLAYER_AIR_ACCEL = (PLAYER_VELOCITY/PLAYER_AIR_ACCEL_TIME)

    var JUMP_HEIGHT = 50.0
    var JUMP_BOOST_HEIGHT = 55.0
    var FALL_VELOCITY = 900.0
    var GRAVITY = 2000.0

    /*cpBody*/ var playerBody = null;
    /*cpShape*/ var playerShape = null;

    /*cpFloat*/ var remainingBoost = 0;
    /*cpBool*/ var grounded = false;
    /*cpBool*/ var lastJumpState = false;

//static void
    var SelectPlayerGroundNormal = function(/*cpBody*/ body, /*cpArbiter*/ arb, /*cpVect*/ groundNormal) {
        /*cpVect*/ var n = cp.v.neg(arb.getNormal(0));

        if(n.y > groundNormal.y){
            groundNormal.x = n.x;
            groundNormal.y = n.y;
        }
    }

//static void
    var playerUpdateVelocity = function(/*cpVect*/ gravity, /*cpFloat*/ damping, /*cpFloat*/ dt) {
        var body = this

        /*int*/ var jumpState = (Demo.keyboard.y > 0.0);

        // Grab the grounding normal from last frame
        /*cpVect*/ var groundNormal = cp.v(0, 0);
        playerBody.eachArbiter(/*(cpBodyArbiterIteratorFunc)*/SelectPlayerGroundNormal, groundNormal);

        grounded = (groundNormal.y > 0.0);
        if(groundNormal.y < 0.0) remainingBoost = 0.0;

        // Do a normal-ish update
        /*cpBool*/ var boost = (jumpState && remainingBoost > 0.0);
        /*cpVect*/ var g = (boost ? cp.vzero : gravity);
        cp.Body.prototype.updateVelocity.call(body, g, damping, dt);

        // Target horizontal speed for air/ground control
        /*cpFloat*/ var target_vx = PLAYER_VELOCITY*Demo.keyboard.x;

        // Update the surface velocity and friction
        /*cpVect*/ var surface_v = cp.v(target_vx, 0.0);
        playerShape.surface_v = surface_v;
        playerShape.u = (grounded ? PLAYER_GROUND_ACCEL/GRAVITY : 0.0);

        // Apply air control if not grounded
        if(!grounded){
            // Smoothly accelerate the velocity
            playerBody.v.x = cp.flerpconst(playerBody.v.x, target_vx, PLAYER_AIR_ACCEL*dt);
        }

        body.v.y = cp.fclamp(body.v.y, -FALL_VELOCITY, Infinity);
    }
})(function() {
   return this;
}())