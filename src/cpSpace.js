//MARK: Contact Set Helpers

//MARK: Collision Handler Set HelperFunctions

//MARK: Misc Helper Funcs

// Default collision functions.
var alwaysCollide = function () {
    return 1;
}

// function to get the estimated velocity of a shape for the cpBBTree.
/*static cpVect*/
var shapeVelocityFunc = function (/*cpShape **/shape) {
    return shape.body.v;
}

//MARK: Memory Management Functions

var cpShapeGetBB = function (shape) {
    return shape.bb;
}

var cpDefaultCollisionHandler = new cpCollisionHandler(0, 0, alwaysCollide, alwaysCollide, _nothing, _nothing, null);

//cpSpace*
var Space = cp.Space = function () {
    var space = this;

    space.iterations = 10;

    space.gravity = cpvzero;
    space.damping = 1.0;

    space.collisionSlop = 0.1;
    space.collisionBias = cpfpow(1.0 - 0.1, 60.0);
    space.collisionPersistence = 3;

    space.locked = 0;
    space.curr_dt = 0;
    space.stamp = 0;

    space.staticShapes = new BBTree(/*cpSpatialIndexBBFunc*/cpShapeGetBB, null);
    space.activeShapes = new BBTree(/*cpSpatialIndexBBFunc*/cpShapeGetBB, space.staticShapes);
    space.activeShapes.setVelocityFunc(/*cpBBTreeVelocityFunc*/shapeVelocityFunc);

    space.bodies = [];
    space.sleepingComponents = [];
    space.rousedBodies = [];

    space.sleepTimeThreshold = Infinity;
    space.idleSpeedThreshold = 0.0;
    space.enableContactGraph = false;

    space.arbiters = [];
    space.pooledArbiters = [];

//    space.contactBuffersHead = null;
    space.cachedArbiters = {};

    space.constraints = [];

    space.defaultHandler = cpDefaultCollisionHandler;
    space.collisionHandlers = {};
//	cpHashSetSetDefaultValue(space.collisionHandlers, &cpDefaultCollisionHandler);

    space.postStepCallbacks = [];
    space.skipPostStep = false;

//	space.staticBody = Body.newStatic();
//    space.staticBody.space = this;
    space.staticBody = new Body(Infinity, Infinity);
    space.staticBody.nodeIdleTime = Infinity;

    return space;
}

Space.prototype.setIterations = function (iterations) {
    this.iterations = iterations;
}

Space.prototype.getCurrentTimeStep = function () {
    return this.curr_dt;
}

var cpAssertSpaceUnlocked = function (space) {
    cpAssertHard(!space.locked,
        "This operation cannot be done safely during a call to cpSpaceStep() or during a query. " +
            "Put these calls into a post-step callback."
    );
}
//MARK: Collision Handler Function Management

//void
Space.prototype.addCollisionHandler = function (/*cpCollisionType*/ a, /*cpCollisionType*/ b, /*cpCollisionBeginFunc*/ begin, /*cpCollisionPreSolveFunc*/ preSolve, /*cpCollisionPostSolveFunc*/ postSolve, /*cpCollisionSeparateFunc*/ separate, /*void*/ data) {
    var space = this;
    cpAssertSpaceUnlocked(space);

    // Remove any old function so the new one will get added.
    space.removeCollisionHandler(a, b);

    /*cpCollisionHandler*/
    var handler = new cpCollisionHandler(
        a, b,
        begin ? begin : alwaysCollide,
        preSolve ? preSolve : alwaysCollide,
        postSolve ? postSolve : _nothing,
        separate ? separate : _nothing,
        data
    );
    space.collisionHandlers[CP_HASH_PAIR(a, b)] = handler;
}

//void
Space.prototype.removeCollisionHandler = function (/*cpCollisionType*/ a, /*cpCollisionType*/ b) {
    var space = this;
    cpAssertSpaceUnlocked(space);
    delete space.collisionHandlers[CP_HASH_PAIR(a, b)];
}

//void
Space.prototype.setDefaultCollisionHandler = function (/*cpCollisionBeginFunc*/ begin, /*cpCollisionPreSolveFunc*/ preSolve, /*cpCollisionPostSolveFunc*/ postSolve, /*cpCollisionSeparateFunc*/ separate, /*void*/ data) {
    var space = this;
    cpAssertSpaceUnlocked(space);

    /*cpCollisionHandler*/
    var handler = new cpCollisionHandler(
        0, 0,
        begin ? begin : alwaysCollide,
        preSolve ? preSolve : alwaysCollide,
        postSolve ? postSolve : _nothing,
        separate ? separate : _nothing,
        data
    );

    space.defaultHandler = handler;
//	cpHashSetSetDefaultValue(space.collisionHandlers, &space.defaultHandler);
}

//MARK: Body, Shape, and Joint Management
//cpShape *
Space.prototype.addShape = function (/*cpShape*/ shape) {
    var space = this;
    /*cpBody*/
    var body = shape.body;
    if (body.isStatic()) return space.addStaticShape(shape);

    cpAssertHard(shape.space != space, "You have already added this shape to this space. You must not add it a second time.");
    cpAssertHard(!shape.space, "You have already added this shape to another space. You cannot add it to a second.");
    cpAssertSpaceUnlocked(space);

    body.activate();
    body.addShape(shape);

    shape.update(body.p, body.rot);
    space.activeShapes.insert(shape, shape.hashid);
    shape.space = space;

    return shape;
}

//cpShape *
Space.prototype.addStaticShape = function (/*cpShape*/ shape) {
    var space = this;
    cpAssertHard(shape.space != space, "You have already added this shape to this space. You must not add it a second time.");
    cpAssertHard(!shape.space, "You have already added this shape to another space. You cannot add it to a second.");
    cpAssertHard(shape.body.isRogue(), "You are adding a static shape to a dynamic body. Did you mean to attach it to a static or rogue body? See the documentation for more information.");
    cpAssertSpaceUnlocked(space);

    /*cpBody*/
    var body = shape.body;
    body.addShape(shape);
    shape.update(body.p, body.rot);
    space.staticShapes.insert(shape, shape.hashid);
    shape.space = space;

    return shape;
}

//cpBody *
Space.prototype.addBody = function (/*cpBody*/ body) {
    var space = this;
    cpAssertHard(!body.isStatic(), "Do not add static bodies to a space. Static bodies do not move and should not be simulated.");
    cpAssertHard(body.space != space, "You have already added this body to this space. You must not add it a second time.");
    cpAssertHard(!body.space, "You have already added this body to another space. You cannot add it to a second.");
    cpAssertSpaceUnlocked(space);

    space.bodies.push(body);
    body.space = space;

    return body;
}

//cpConstraint *
Space.prototype.addConstraint = function (/*cpConstraint*/ constraint) {
    var space = this;
    cpAssertHard(constraint.space != space, "You have already added this constraint to this space. You must not add it a second time.");
    cpAssertHard(!constraint.space, "You have already added this constraint to another space. You cannot add it to a second.");
    cpAssertHard(constraint.a && constraint.b, "Constraint is attached to a null body.");
    cpAssertSpaceUnlocked(space);

    constraint.a.activate();
    constraint.b.activate();
    space.constraints.push(constraint);

    // Push onto the heads of the bodies' constraint lists
    /*cpBody*/
    var a = constraint.a, b = constraint.b;
    constraint.next_a = a.constraintList;
    a.constraintList = constraint;
    constraint.next_b = b.constraintList;
    b.constraintList = constraint;
    constraint.space = space;

    return constraint;
}

//void
Space.prototype.filterArbiters = function (/*cpBody*/ body, /*cpShape*/ filter) {
    var space = this;
    space.lock();
    {
        var cachedArbiters = space.cachedArbiters;

        for (var hash in cachedArbiters) {
            var arb = cachedArbiters[hash];

            if (
                (body == arb.body_a && (filter == arb.a || filter == null)) ||
                    (body == arb.body_b && (filter == arb.b || filter == null))
                ) {
                // Call separate when removing shapes.
                if (filter && arb.state != cpArbiterStateCached) arb.callSeparate(space);

                arb.unthread();
                cpArrayDeleteObj(space.arbiters, arb);
//                context.space.pooledArbiters.push(arb);
                delete cachedArbiters[hash];
            }

        }
    }
    space.unlock(true);
}

//void
Space.prototype.removeShape = function (/*cpShape*/ shape) {
    var space = this;
    /*cpBody*/
    var body = shape.body;
    if (body.isStatic()) {
        space.removeStaticShape(shape);
    } else {
        cpAssertHard(space.containsShape(shape), "Cannot remove a shape that was not added to the space. (Removed twice maybe?)");
        cpAssertSpaceUnlocked(space);

        body.activate();
        body.removeShape(shape);
        space.filterArbiters(body, shape);
        space.activeShapes.remove(shape, shape.hashid);
        shape.space = null;
    }
}

//void
Space.prototype.removeStaticShape = function (/*cpShape*/ shape) {
    var space = this;
    cpAssertHard(space.containsShape(shape), "Cannot remove a static or sleeping shape that was not added to the space. (Removed twice maybe?)");
    cpAssertSpaceUnlocked(space);

    /*cpBody*/
    var body = shape.body;
    if (body.isStatic()) body.activateStatic(shape);
    body.removeShape(shape);
    space.filterArbiters(body, shape);
    space.staticShapes.remove(shape, shape.hashid);
    shape.space = null;
}

//void
Space.prototype.removeBody = function (/*cpBody*/ body) {
    var space = this;
    cpAssertHard(space.containsBody(body), "Cannot remove a body that was not added to the space. (Removed twice maybe?)");
    cpAssertSpaceUnlocked(space);

    body.activate();
//	space.filterArbiters(body, null);
    cpArrayDeleteObj(space.bodies, body);
    body.space = null;
}

//void
Space.prototype.removeConstraint = function (/*cpConstraint*/ constraint) {
    var space = this;
    cpAssertHard(space.containsConstraint(constraint), "Cannot remove a constraint that was not added to the space. (Removed twice maybe?)");
    cpAssertSpaceUnlocked(space);

    constraint.a.activate();
    constraint.b.activate();
    cpArrayDeleteObj(space.constraints, constraint);

    constraint.a.removeConstraint(constraint);
    constraint.b.removeConstraint(constraint);
    constraint.space = null;
}

//cpBool
Space.prototype.containsShape = function (/*cpShape*/ shape) {
    return (shape.space == this);
}

//cpBool
Space.prototype.containsBody = function (/*cpBody*/ body) {
    return (body.space == this);
}

//cpBool
Space.prototype.containsConstraint = function (/*cpConstraint*/ constraint) {
    return (constraint.space == this);
}

//MARK: Static/rogue body conversion.

//void
Space.prototype.convertBodyToStatic = function (/*cpBody*/ body) {
    var space = this;
    cpAssertHard(!body.isStatic(), "Body is already static.");
    cpAssertHard(body.isRogue(), "Remove the body from the space before calling this function.");
    cpAssertSpaceUnlocked(space);

    body.setMass(Infinity);
    body.setMoment(Infinity);

    body.setVel(cpvzero);
    body.setAngVel(0.0);

    body.nodeIdleTime = Infinity;
    for (var shape = body.shapeList; shape; shape = shape.next) {
        space.activeShapes.remove(shape, shape.hashid);
        space.staticShapes.insert(shape, shape.hashid);
    }
}

//void
Space.prototype.convertBodyToDynamic = function (/*cpBody*/ body, /*cpFloat*/ m, /*cpFloat*/ i) {
    var space = this;
    cpAssertHard(body.isStatic(), "Body is already dynamic.");
    cpAssertSpaceUnlocked(space);

    body.activateStatic(null);

    body.setMass(m);
    body.setMoment(i);

    body.nodeIdleTime = 0.0;
    for (var shape = body.shapeList; shape; shape = shape.next) {
        space.staticShapes.remove(shape, shape.hashid);
        space.activeShapes.insert(shape, shape.hashid);
    }
}

//MARK: Iteration

//void
Space.prototype.eachBody = function (/*cpSpaceBodyIteratorFunc*/ func, /*void*/ data) {
    var space = this;
    space.lock();
    {
        /*cpArray*/
        var bodies = space.bodies;

        for (var i = 0; i < bodies.length; i++) {
            func(/*cpBody*/bodies[i], data);
        }

        /*cpArray*/
        var components = space.sleepingComponents;
        for (var i = 0; i < components.length; i++) {
            /*cpBody*/
            var root = /*cpBody*/components[i];

            /*cpBody*/
            var body = root;
            while (body) {
                /*cpBody*/
                var next = body.nodeNext;
                func(body, data);
                body = next;
            }
        }
    }
    space.unlock(true);
}
//
//var spaceShapeContext = function (/*cpSpaceShapeIteratorFunc*/ func, /*void*/ data) {
//    this.func = func;
//    this.data = data;
//};


//static void
//var spaceEachShapeIterator = function (/*cpShape*/ shape, /*spaceShapeContext*/ context) {
//    context.func(shape, context.data);
//}

//void
Space.prototype.eachShape = function (/*cpSpaceShapeIteratorFunc*/ func, /*void*/ data) {
    var space = this;
    space.lock();
    {
        /*spaceShapeContext*/
//        var context = new spaceShapeContext(func, data);
        space.activeShapes.each(/*cpSpatialIndexIteratorFunc*/func, data);
        space.staticShapes.each(/*cpSpatialIndexIteratorFunc*/func, data);
    }
    space.unlock(true);
}

//void
Space.prototype.eachConstraint = function (/*cpSpaceConstraintIteratorFunc*/ func, /*void*/ data) {
    var space = this;
    space.lock();
    {
        /*cpArray*/
        var constraints = space.constraints;

        for (var i = 0; i < constraints.length; i++) {
            func(/*cpConstraint*/constraints[i], data);
        }
    }
    space.unlock(true);
}

//MARK: Spatial Index Management

//static void
var updateBBCache = function (/*cpShape*/ shape) {
    /*cpBody*/
    var body = shape.body;
    shape.update(body.p, body.rot);
}

//void 
Space.prototype.reindexStatic = function () {
    var space = this;
    cpAssertHard(!space.locked, "You cannot manually reindex objects while the space is locked. Wait until the current query or step is complete.");

    space.staticShapes.each(/*cpSpatialIndexIteratorFunc*/updateBBCache, null);
    space.staticShapes.reindex();
}

//void
Space.prototype.reindexShape = function (/*cpShape*/ shape) {
    var space = this;
    cpAssertHard(!space.locked, "You cannot manually reindex objects while the space is locked. Wait until the current query or step is complete.");

    /*cpBody*/
    var body = shape.body;
    shape.update(body.p, body.rot);

    // attempt to rehash the shape in both hashes
    space.activeShapes.reindexObject(shape, shape.hashid);
    space.staticShapes.reindexObject(shape, shape.hashid);
}

//void
Space.prototype.reindexShapesForBody = function (/*cpBody*/ body) {
    var space = this;
    for (var shape = body.shapeList; shape; shape = shape.next) space.reindexShape(shape);
}


//static void
var copyShapes = function (/*cpShape*/ shape, /*cpSpatialIndex*/ index) {
    index.insert(shape, shape.hashid);
}

//void
Space.prototype.useSpatialHash = function (/*cpFloat*/ dim, /*int*/ count) {
    var space = this;
    /*cpSpatialIndex*/
    var staticShapes = new cpSpaceHash(dim, count, /*cpSpatialIndexBBFunc*/cpShapeGetBB, null);
    /*cpSpatialIndex*/
    var activeShapes = new cpSpaceHash(dim, count, /*cpSpatialIndexBBFunc*/cpShapeGetBB, staticShapes);

    space.staticShapes.each(/*cpSpatialIndexIteratorFunc*/copyShapes, staticShapes);
    space.activeShapes.each(/*cpSpatialIndexIteratorFunc*/copyShapes, activeShapes);

//    space.staticShapes.free();
//    space.activeShapes.free();

    space.staticShapes = staticShapes;
    space.activeShapes = activeShapes;
}
