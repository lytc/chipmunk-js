//MARK: Post Step Callback Functions

//cpPostStepCallback *
Space.prototype.getPostStepCallback = function (/*void*/ key) {
    var space = this;
    /*cpArray*/
    var arr = space.postStepCallbacks;
    for (var i = 0; i < arr.length; i++) {
        /*cpPostStepCallback*/
        var callback = /*cpPostStepCallback*/arr[i];
        if (callback && callback.key == key) return callback;
    }

    return null;
}

//void
//var PostStepDoNothing = function(/*cpSpace*/ space, /*void*/ obj, /*void*/ data) {}

//cpBool
Space.prototype.addPostStepCallback = function (/*cpPostStepFunc*/ func, /*void*/ key, /*void*/ data) {
    var space = this;
    if (NDEBUG) {
        cpAssertWarn(space.locked,
            "Adding a post-step callback when the space is not locked is unnecessary. " +
                "Post-step callbacks will not called until the end of the next call to cpSpaceStep() or the next query.");
    }

    if (!space.getPostStepCallback(key)) {
//		/*cpPostStepCallback*/ var callback = /*cpPostStepCallback*/cpcalloc(1, sizeof(cpPostStepCallback));
        /*cpPostStepCallback*/
        var callback = new cpPostStepCallback((func ? func : _nothing), key, data);
//		callback.func = (func ? func : PostStepDoNothing);
//		callback.key = key;
//		callback.data = data;

        space.postStepCallbacks.push(callback);
        return true;
    } else {
        return false;
    }
}

//MARK: Locking Functions

//void
Space.prototype.lock = function () {
    var space = this;
    space.locked++;
}

//void
Space.prototype.unlock = function (/*cpBool*/ runPostStep) {
    var space = this;
    space.locked--;
    cpAssertHard(space.locked >= 0, "Internal Error: Space lock underflow.");

    if (space.locked == 0) {
        /*cpArray*/
//        var waking = space.rousedBodies;

        var rousedBodies = space.rousedBodies
        var waking

        while (waking = rousedBodies.pop()) {
            space.activateBody(/*cpBody*/waking)
        }

        if (space.locked == 0 && runPostStep && !space.skipPostStep) {
            space.skipPostStep = true;

            /*cpArray*/
            var arr = space.postStepCallbacks;
            var callback
            while (callback = arr.pop()) {
//			for(var i=0; i<arr.length; i++){
//				/*cpPostStepCallback*/ var callback = /*cpPostStepCallback*/arr[i];
                /*cpPostStepFunc*/
                var func = callback.func;

                // Mark the func as null in case calling it calls cpSpaceRunPostStepCallbacks() again.
                // TODO need more tests around this case I think.
                callback.func = null;
                if (func) func(space, callback.key, callback.data);
            }

            space.skipPostStep = false;
        }
    }
}

//MARK: Collision Detection Functions

//static inline cpBool
var queryReject = function (/*cpShape*/ a, /*cpShape*/ b) {
    var result = (
        // BBoxes must overlap
        !a.bb.intersects(b.bb)
            // Don't collide shapes attached to the same body.
            || a.body == b.body
            // Don't collide objects in the same non-zero group
            || (a.group && a.group == b.group)
            // Don't collide objects that don't share at least on layer.
            || !(a.layers & b.layers)
            // Don't collide infinite mass objects
            || (a.body.m == Infinity && b.body.m == Infinity)
        );

    return result;
}

// Callback from the spatial hash.
//cpCollisionID
var cpSpaceCollideShapes = function (/*cpShape*/ a, /*cpShape*/ b, /*cpCollisionID*/ id, /*cpSpace*/ space) {
    // Reject any of the simple cases
    if (queryReject(a, b)) return id;

    /*cpCollisionHandler*/
    var handler = space.lookupHandler(a.collision_type, b.collision_type);

    /*cpBool*/
    var sensor = a.sensor || b.sensor;
    if (sensor && handler == cpDefaultCollisionHandler) return id;

    // Shape 'a' should have the lower shape type. (required by cpCollideShapes() )
    // TODO remove me: a < b comparison is for debugging collisions

    if (a.type > b.type || (a.type == b.type && a < b)) {
        /*cpShape*/
        var temp = a;
        a = b;
        b = temp;
    }

    // Narrow-phase collision detection.
    /*cpContact*/
    var contacts = [];
    var idRef = {id: id}
    /*int*/
    cpCollideShapes(a, b, idRef, contacts);
    var numContacts = contacts.length;

    if (!numContacts) return idRef.id; // Shapes are not colliding.
//	space.pushContacts(numContacts);

    // Get an arbiter from space.arbiterSet for the two shapes.
    // This is where the persistant contact magic comes from.
//	cpShape *shape_pair[] = {a, b};
    /*cpHashValue*/
    var arbHashID = CP_HASH_PAIR(/*cpHashValue*/a.hashid, /*cpHashValue*/b.hashid);
//	/*cpArbiter*/ var arb = /*cpArbiter*/cpHashSetInsert(space.cachedArbiters, arbHashID, shape_pair, space, /*cpHashSetTransFunc*/cpSpaceArbiterSetTrans);
    var arb = space.cachedArbiters[arbHashID];
    if (!arb) {
        arb = space.pooledArbiters.pop();
        if (arb) {
            arb.reset(a, b);
        } else {
            arb = space.cachedArbiters[arbHashID] = new Arbiter(a, b);
        }
    }
//    var arb = space.cachedArbiters[arbHashID] = new Arbiter(a, b);
    arb.update(contacts, handler, a, b);

    // Call the begin function first if it's the first step
    if (arb.state == cpArbiterStateFirstColl && !handler.begin(arb, space, handler.data)) {
        arb.ignore(); // permanently ignore the collision until separation
    }

    if (
    // Ignore the arbiter if it has been flagged
        (arb.state != cpArbiterStateIgnore) &&
            // Call preSolve
            handler.preSolve(arb, space, handler.data) &&
            // Process, but don't add collisions for sensors.
            !sensor
        ) {
        space.arbiters.push(arb);
    } else {
//		space.popContacts(numContacts);

        arb.contacts = null;

        // Normally arbiters are set as used after calling the post-solve callback.
        // However, post-solve callbacks are not called for sensors or arbiters rejected from pre-solve.
        if (arb.state != cpArbiterStateIgnore) arb.state = cpArbiterStateNormal;
    }

    // Time stamp the arbiter so we know it was used recently.
    arb.stamp = space.stamp;
    return idRef.id;
}

// Hashset filter func to throw away old arbiters.
//cpBool
Space.prototype.arbiterSetFilter = function (arb) {
    var space = this;
    /*cpTimestamp*/
    var ticks = space.stamp - arb.stamp;

    /*cpBody*/
    var a = arb.body_a, b = arb.body_b;

    // TODO should make an arbiter state for this so it doesn't require filtering arbiters for dangling body pointers on body removal.
    // Preserve arbiters on sensors and rejected arbiters for sleeping objects.
    // This prevents errant separate callbacks from happenening.
    if (
        (a.isStatic() || a.isSleeping()) &&
            (b.isStatic() || b.isSleeping())
        ) {
        return true;
    }

    // Arbiter was used last frame, but not this one
    if (ticks >= 1 && arb.state != cpArbiterStateCached) {
        arb.state = cpArbiterStateCached;
        arb.callSeparate(space);
    }

    if (ticks >= space.collisionPersistence) {
        arb.contacts = null;

        space.pooledArbiters.push(arb);
        return false;
    }

    return true;
}

//MARK: All Important cpSpaceStep() Function

//void
var cpShapeUpdateFunc = function (/*cpShape*/ shape) {
    /*cpBody*/
    var body = shape.body;
    shape.update(body.p, body.rot);
}
//void
Space.prototype.step = function (/*cpFloat*/ dt) {
    var space = this;
    // don't step if the timestep is 0!
    if (dt == 0.0) return;

    space.stamp++;

    /*cpFloat*/
    var prev_dt = space.curr_dt;
    space.curr_dt = dt;

    /*cpArray*/
    var bodies = space.bodies;
    /*cpArray*/
    var constraints = space.constraints;
    /*cpArray*/
    var arbiters = space.arbiters;

    // Reset and empty the arbiter lists.
    var arb
    while (arb = arbiters.pop()) {
        arb.state = cpArbiterStateNormal;

        // If both bodies are awake, unthread the arbiter from the contact graph.
        if (!arb.body_a.isSleeping() && !arb.body_b.isSleeping()) {
            arb.unthread();
        }
    }

    space.lock();
    {
        // Integrate positions
        for (var i = 0; i < bodies.length; i++) {
            /*cpBody*/
            var body = /*cpBody*/bodies[i];
            body.updatePosition(dt);
        }

        // Find colliding pairs.
//		space.pushFreshContactBuffer();
        space.activeShapes.each(/*cpSpatialIndexIteratorFunc*/cpShapeUpdateFunc, null);
        space.activeShapes.reindexQuery(/*cpSpatialIndexQueryFunc*/cpSpaceCollideShapes, space);
    }
    space.unlock(false);

    // Rebuild the contact graph (and detect sleeping components if sleeping is enabled)
    space.processComponents(dt);

    space.lock();
    {
        // Clear out old cached arbiters and call separate callbacks
//		cpHashSetFilter(space.cachedArbiters, /*cpHashSetFilterFunc*/cpSpaceArbiterSetFilter, space);
        var cachedArbiters = space.cachedArbiters;
        for (var hash in cachedArbiters) {
            if (!this.arbiterSetFilter(cachedArbiters[hash])) {
                delete cachedArbiters[hash];
            }
        }

        var arbLen = arbiters.length;
        var constraintLen = constraints.length;

        // Prestep the arbiters and constraints.
        /*cpFloat*/
        var slop = space.collisionSlop;
        /*cpFloat*/
        var biasCoef = 1.0 - cpfpow(space.collisionBias, dt);
        for (var i = 0; i < arbLen; i++) {
            arbiters[i].preStep(dt, slop, biasCoef);
        }

        for (var i = 0; i < constraintLen; i++) {
            /*cpConstraint*/
            var constraint = /*cpConstraint*/constraints[i];

            constraint.preSolve(space);
            constraint.preStep(dt);
        }

        // Integrate velocities.
        /*cpFloat*/
        var damping = cpfpow(space.damping, dt);
        /*cpVect*/
        var gravity = space.gravity;
        for (var i = 0; i < bodies.length; i++) {
            bodies[i].updateVelocity(gravity, damping, dt);
        }

        // Apply cached impulses
        /*cpFloat*/
        var dt_coef = (prev_dt == 0.0 ? 0.0 : dt / prev_dt);

        for (var i = 0; i < arbLen; i++) {
            arbiters[i].applyCachedImpulse(dt_coef);
        }

        for (var i = 0; i < constraintLen; i++) {
            constraints[i].applyCachedImpulse(dt_coef);
        }

        // Run the impulse solver.
        for (var i = 0; i < space.iterations; i++) {
            for (var j = 0; j < arbLen; j++) {
                arbiters[j].applyImpulse();
            }

            for (var j = 0; j < constraintLen; j++) {
                constraints[j].applyImpulse(dt);
            }
        }

        // Run the constraint post-solve callbacks
        for (var i = 0; i < constraintLen; i++) {
            constraints[i].postSolve(space);
        }

        // run the post-solve callbacks
        for (var i = 0; i < arbLen; i++) {
            /*cpArbiter*/
            var arb = /*cpArbiter*/ arbiters[i];

            /*cpCollisionHandler*/
            var handler = arb.handler;
            handler.postSolve(arb, space, handler.data);
        }
    }
    space.unlock(true);
}
