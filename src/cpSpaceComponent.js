//MARK: Sleeping Functions

//void
Space.prototype.activateBody = function (/*cpBody*/ body) {
    var space = this;
    cpAssertHard(!body.isRogue(), "Internal error: Attempting to activate a rogue body.");

    if (space.locked) {
        // cpSpaceActivateBody() is called again once the space is unlocked
        if (-1 == space.rousedBodies.indexOf(body)) space.rousedBodies.push(body);
    } else {
        if (NDEBUG) {
            cpAssertSoft(body.nodeRoot == null && body.nodeNext == null, "Internal error: Activating body non-null node pointers.");
        }
        space.bodies.push(body);

        for (var shape = body.shapeList; shape; shape = shape.next) {
            space.staticShapes.remove(shape, shape.hashid);
            space.activeShapes.insert(shape, shape.hashid);
        }

        for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
            /*cpBody*/
            var bodyA = arb.body_a;

            // Arbiters are shared between two bodies that are always woken up together.
            // You only want to restore the arbiter once, so bodyA is arbitrarily chosen to own the arbiter.
            // The edge case is when static bodies are involved as the static bodies never actually sleep.
            // If the static body is bodyB then all is good. If the static body is bodyA, that can easily be checked.
            if (body == bodyA || bodyA.isStatic()) {
//				/*int*/ var numContacts = arb.numContacts;
//				/*cpContact*/ var contacts = arb.contacts;

                // Restore contact values back to the space's contact buffer memory
//				arb.contacts = cpContactBufferGetArray(space);
//				memcpy(arb.contacts, contacts, numContacts*sizeof(cpContact));
//				space.pushContacts(numContacts);

                // Reinsert the arbiter into the arbiter cache
                /*cpShape*/
                var a = arb.a, b = arb.b;
//				cpShape *shape_pair[] = {a, b};
                /*cpHashValue*/
                var arbHashID = CP_HASH_PAIR(/*cpHashValue*/a.hashid, /*cpHashValue*/b.hashid);
//				cpHashSetInsert(space.cachedArbiters, arbHashID, shape_pair, arb, null);
                space.cachedArbiters[arbHashID] = arb;
                // Update the arbiter's state
                arb.stamp = space.stamp;
                arb.handler = space.lookupHandler(a.collision_type, b.collision_type);
                space.arbiters.push(arb);

//				cpfree(contacts);
            }
        }

        for (var constraint = body.constraintList; constraint; constraint = constraint.next(body)) {
            /*cpBody*/
            var bodyA = constraint.a;
            if (body == bodyA || bodyA.isStatic()) space.constraints.push(constraint);
        }
    }
}

//static void
Space.prototype.deactivateBody = function (/*cpBody*/ body) {
    var space = this;
    cpAssertHard(!body.isRogue(), "Internal error: Attempting to deactivate a rouge body.");
    cpArrayDeleteObj(space.bodies, body);

    for (var shape = body.shapeList; shape; shape = shape.next) {
        space.activeShapes.remove(shape, shape.hashid);
        space.staticShapes.insert(shape, shape.hashid);
    }

    for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
        /*cpBody*/
        var bodyA = arb.body_a;
        if (body == bodyA || bodyA.isStatic()) {
            space.uncacheArbiter(arb);

            // Save contact values to a new block of memory so they won't time out
//			/*size_t*/ var bytes = arb.numContacts*sizeof(cpContact);
//			/*cpContact*/ var contacts = (cpContact *)cpcalloc(1, bytes);
//			memcpy(contacts, arb.contacts, bytes);
//			arb.contacts = contacts;
        }
    }

    for (var constraint = body.constraintList; constraint; constraint = constraint.next(body)) {
        /*cpBody*/
        var bodyA = constraint.a;
        if (body == bodyA || bodyA.isStatic()) cpArrayDeleteObj(space.constraints, constraint);
    }
}

//static inline cpBody *
var ComponentRoot = function (/*cpBody*/ body) {
    return (body ? body.nodeRoot : null);
}

//static inline void
var ComponentActivate = function (/*cpBody*/ root) {
    if (!root || !root.isSleeping()) return;
    cpAssertHard(!root.isRogue(), "Internal Error: ComponentActivate() called on a rogue body.");

    /*cpSpace*/
    var space = root.space;
    /*cpBody*/
    var body = root;
    while (body) {
        /*cpBody*/
        var next = body.nodeNext;

        body.nodeIdleTime = 0.0;
        body.nodeRoot = null;
        body.nodeNext = null;
        space.activateBody(body);

        body = next;
    }

    cpArrayDeleteObj(space.sleepingComponents, root);
}

//void
Body.prototype.activate = function () {
    var body = this;
    if (!body.isRogue()) {
        body.nodeIdleTime = 0.0;
        ComponentActivate(ComponentRoot(body));
    }

    for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
        // Reset the idle timer of things the body is touching as well.
        // That way things don't get left hanging in the air.
        /*cpBody*/
        var other = (arb.body_a == body ? arb.body_b : arb.body_a);
        if (!other.isStatic()) other.nodeIdleTime = 0.0;
    }
}

//void
Body.prototype.activateStatic = function (/*cpShape*/ filter) {
    var body = this;
    cpAssertHard(body.isStatic(), "cpBodyActivateStatic() called on a non-static body.");

    for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
        if (!filter || filter == arb.a || filter == arb.b) {
            (arb.body_a == body ? arb.body_b : arb.body_a).activate();
        }
    }

    // TODO should also activate joints?
}

//static inline void
Body.prototype.pushArbiter = function (/*cpArbiter*/ arb) {
    var body = this;
    if (NDEBUG) {
        cpAssertSoft(arb.threadForBody(body).next == null, "Internal Error: Dangling contact graph pointers detected. (A)");
        cpAssertSoft(arb.threadForBody(body).prev == null, "Internal Error: Dangling contact graph pointers detected. (B)");
    }

    /*cpArbiter*/
    var next = body.arbiterList;
    if (NDEBUG) {
        cpAssertSoft(next == null || next.threadForBody(body).prev == null, "Internal Error: Dangling contact graph pointers detected. (C)");
    }
    arb.threadForBody(body).next = next;

    if (next) next.threadForBody(body).prev = arb;
    body.arbiterList = arb;
}

//static inline void
var ComponentAdd = function (/*cpBody*/ root, /*cpBody*/ body) {
    body.nodeRoot = root;

    if (body != root) {
        body.nodeNext = root.nodeNext;
        root.nodeNext = body;
    }
}

//static inline void
var FloodFillComponent = function (/*cpBody*/ root, /*cpBody*/ body) {
    // Rogue bodies cannot be put to sleep and prevent bodies they are touching from sleepining anyway.
    // Static bodies (which are a type of rogue body) are effectively sleeping all the time.
    if (!body.isRogue()) {
        /*cpBody*/
        var other_root = ComponentRoot(body);
        if (other_root == null) {
            ComponentAdd(root, body);
            for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
                FloodFillComponent(root, (body == arb.body_a ? arb.body_b : arb.body_a));
            }
            for (var constraint = body.constraintList; constraint; constraint = constraint.next(body)) {
                FloodFillComponent(root, (body == constraint.a ? constraint.b : constraint.a));
            }
        } else {
            if (NDEBUG) {
                cpAssertSoft(other_root == root, "Internal Error: Inconsistency dectected in the contact graph.");
            }
        }
    }
}

//static inline cpBool
var ComponentActive = function (/*cpBody*/ root, /*cpFloat*/ threshold) {
    for (var body = root; body; body = body.nodeNext) {
        if (body.nodeIdleTime < threshold) return true;
    }

    return false;
}

//void
Space.prototype.processComponents = function (/*cpFloat*/ dt) {
    var space = this;
    /*cpBool*/
    var sleep = (space.sleepTimeThreshold != Infinity);
    /*cpArray*/
    var bodies = space.bodies;

    if (NDEBUG) {
        for (var i = 0; i < bodies.length; i++) {
            /*cpBody*/
            var body = /*cpBody*/bodies[i];

            cpAssertSoft(body.nodeNext == null, "Internal Error: Dangling next pointer detected in contact graph.");
            cpAssertSoft(body.nodeRoot == null, "Internal Error: Dangling root pointer detected in contact graph.");
        }
    }

    // Calculate the kinetic energy of all the bodies.
    if (sleep) {
        /*cpFloat*/
        var dv = space.idleSpeedThreshold;
        /*cpFloat*/
        var dvsq = (dv ? dv * dv : cpvlengthsq(space.gravity) * dt * dt);

        // update idling and reset component nodes
        for (var i = 0; i < bodies.length; i++) {
            /*cpBody*/
            var body = /*cpBody*/bodies[i];

            // Need to deal with infinite mass objects
            /*cpFloat*/
            var keThreshold = (dvsq ? body.m * dvsq : 0.0);
            body.nodeIdleTime = (body.kineticEnergy() > keThreshold ? 0.0 : body.nodeIdleTime + dt);
        }
    }

    // Awaken any sleeping bodies found and then push arbiters to the bodies' lists.
    /*cpArray*/
    var arbiters = space.arbiters;
    for (var i = 0, count = arbiters.length; i < count; i++) {
        /*cpArbiter*/
        var arb = /*(cpArbiter*)*/arbiters[i];
        /*cpBody*/
        var a = arb.body_a, b = arb.body_b;

        if (sleep) {
            if ((b.isRogue() && !b.isStatic()) || a.isSleeping()) a.activate();
            if ((a.isRogue() && !a.isStatic()) || b.isSleeping()) b.activate();
        }

        a.pushArbiter(arb);
        b.pushArbiter(arb);
    }

    if (sleep) {
        // Bodies should be held active if connected by a joint to a non-static rouge body.
        /*cpArray*/
        var constraints = space.constraints;
        for (var i = 0; i < constraints.length; i++) {
            /*cpConstraint*/
            var constraint = /*cpConstraint*/constraints[i];
            /*cpBody*/
            var a = constraint.a, b = constraint.b;

            if (b.isRogue() && !b.isStatic()) a.activate();
            if (a.isRogue() && !a.isStatic()) b.activate();
        }

        // Generate components and deactivate sleeping ones
        for (var i = 0; i < bodies.length;) {
            /*cpBody*/
            var body = /*cpBody*/bodies[i];

            if (ComponentRoot(body) == null) {
                // Body not in a component yet. Perform a DFS to flood fill mark
                // the component in the contact graph using this body as the root.
                FloodFillComponent(body, body);

                // Check if the component should be put to sleep.
                if (!ComponentActive(body, space.sleepTimeThreshold)) {
                    space.sleepingComponents.push(body);
                    for (var other = body; other; other = other.nodeNext) {
                        space.deactivateBody(other);
                    }

                    // cpSpaceDeactivateBody() removed the current body from the list.
                    // Skip incrementing the index counter.
                    continue;
                }
            }

            i++;

            // Only sleeping bodies retain their component node pointers.
            body.nodeRoot = null;
            body.nodeNext = null;
        }
    }
}

//void
Body.prototype.sleep = function () {
    var body = this;
    body.sleepWithGroup(null);
}

//void
Body.prototype.sleepWithGroup = function (/*cpBody*/ group) {
    var body = this;
    cpAssertHard(!body.isRogue(), "Rogue (and static) bodies cannot be put to sleep.");

    /*cpSpace*/
    var space = body.space;
    cpAssertHard(!space.locked, "Bodies cannot be put to sleep during a query or a call to cpSpaceStep(). Put these calls into a post-step callback.");
    cpAssertHard(group == null || group.isSleeping(), "Cannot use a non-sleeping body as a group identifier.");

    if (body.isSleeping()) {
        cpAssertHard(ComponentRoot(body) == ComponentRoot(group), "The body is already sleeping and it's group cannot be reassigned.");
        return;
    }

    for (var shape = body.shapeList; shape; shape = shape.next) shape.update(body.p, body.rot);
    space.deactivateBody(body);

    if (group) {
        /*cpBody*/
        var root = ComponentRoot(group);

//		/*cpComponentNode*/ var node = new cpComponentNode(root, root.node.next, 0.0);
        body.nodeRoot = root;
        body.nodeNext = root.nodeNext;
        body.nodeIdleTime = 0.0;

        root.nodeNext = body;
    } else {
//		/*cpComponentNode*/ var node = new cpComponentNode(body, null, 0.0);
        body.nodeRoot = body;
        body.nodeNext = null;
        body.nodeIdleTime = 0.0;

        space.sleepingComponents.push(body);
    }

    cpArrayDeleteObj(space.bodies, body);
}

//static void
var activateTouchingHelper = function (/*cpShape*/ shape) {
    shape.body.activate();
}

//void
Space.prototype.activateShapesTouchingShape = function (/*cpShape*/ shape) {
    var space = this;
    if (space.sleepTimeThreshold != Infinity) {
        space.shapeQuery(shape, /*cpSpaceShapeQueryFunc*/activateTouchingHelper, shape);
    }
}
