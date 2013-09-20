// TODO: Eww. Magic numbers.
var MAGIC_EPSILON = 1e-5

//MARK: Foreach loops

//static inline cpConstraint *
Constraint.prototype.next = function (/*cpBody*/ body) {
    var node = this;
    return (node.a == body ? node.next_a : node.next_b);
}

//static inline cpArbiter *
Arbiter.prototype.next = function (/*cpBody*/ body) {
    var node = this;
    return (node.body_a == body ? node.thread_a.next : node.thread_b.next);
}

//MARK: Shape/Collision Functions

// TODO should move this to the cpVect API. It's pretty useful.
//static inline cpVect
var cpClosetPointOnSegment = function (/*const cpVect*/ p, /*const cpVect*/ a, /*const cpVect*/ b) {
//    /*cpVect*/
//    var delta = cpvsub(a, b);
//    /*cpFloat*/
//    var t = cpfclamp01(cpvdot(delta, cpvsub(p, b)) / cpvlengthsq(delta));
//    return cpvadd(b, cpvmult(delta, t));

    /*cpVect*/
    var deltaX = a.x - b.x
    var deltaY = a.y - b.y
    /*cpFloat*/
    var t = cpfclamp01((deltaX*(p.x - b.x) + deltaY*(p.y - b.y)) / (deltaX * deltaX + deltaY * deltaY));
    return new Vect(b.x + deltaX*t, b.y + deltaY*t);
}

//static inline cpBool
Shape.prototype.active = function () {
    var shape = this;
    return shape.prev || (shape.body && shape.body.shapeList == shape);
}

//static inline void
var CircleSegmentQuery = function (/*cpShape*/ shape, /*cpVect*/ center, /*cpFloat*/ r, /*cpVect*/ a, /*cpVect*/ b) {
    /*cpVect*/
    var da = cpvsub(a, center);
    /*cpVect*/
    var db = cpvsub(b, center);

    /*cpFloat*/
    var qa = cpvdot(da, da) - 2.0 * cpvdot(da, db) + cpvdot(db, db);
    /*cpFloat*/
    var qb = -2.0 * cpvdot(da, da) + 2.0 * cpvdot(da, db);
    /*cpFloat*/
    var qc = cpvdot(da, da) - r * r;

    /*cpFloat*/
    var det = qb * qb - 4.0 * qa * qc;

    if (det >= 0.0) {
        /*cpFloat*/
        var t = (-qb - cpfsqrt(det)) / (2.0 * qa);
        if (0.0 <= t && t <= 1.0) {
            return new cpSegmentQueryInfo(shape, t, cpvnormalize(cpvlerp(da, db, t)))
        }
    }
}

// TODO doesn't really need to be inline, but need a better place to put this function
//static inline cpSplittingPlane
var cpSplittingPlane = function (/*cpVect*/ a, /*cpVect*/ b) {
    this.n = a;
    this.d = b;
//	/*cpVect*/ this.n = cpvnormalize(cpvperp(cpvsub(b, a)));
//    /*cpFloat*/ this.d = cpvdot(this.n, a);
}

var cpSplittingPlaneNew = function (/*cpVect*/ a, /*cpVect*/ b) {
    /*cpVect*/
    var n = cpvnormalize(cpvperp(cpvsub(b, a)));
    /*cpFloat*/
    var d = cpvdot(n, a);

    return new cpSplittingPlane(n, d);
}


//static inline cpFloat
cpSplittingPlane.prototype.compare = function (/*cpVect*/ v) {
    var plane = this;
    return cpvdot(plane.n, v) - plane.d;
}

//
var cpPostStepCallback = function (/*cpPostStepFunc*/ func, /*void*/ key, /*void*/ data) {
    this.func = func;
    this.key = key;
    this.data = data;
};

//static inline cpCollisionHandler *
Space.prototype.lookupHandler = function (/*cpCollisionType*/ a, /*cpCollisionType*/ b) {
    return this.collisionHandlers[CP_HASH_PAIR(a, b)] || this.defaultHandler;
}

//static inline void
Space.prototype.uncacheArbiter = function (/*cpArbiter*/ arb) {
    var space = this;
    /*cpShape*/
    var a = arb.a, b = arb.b;
    /*cpHashValue*/
    var arbHashID = CP_HASH_PAIR(/*cpHashValue*/a.hashid, /*cpHashValue*/b.hashid);
    delete space.cachedArbiters[arbHashID];
    cpArrayDeleteObj(space.arbiters, arb);
}

//MARK: Arbiters
//static inline void
Arbiter.prototype.callSeparate = function (/*cpSpace*/ space) {
    var arb = this;
    // The handler needs to be looked up again as the handler cached on the arbiter may have been deleted since the last step.
    /*cpCollisionHandler*/
    var handler = space.lookupHandler(arb.a.collision_type, arb.b.collision_type);
    handler.separate(arb, space, handler.data);
}

//static inline struct cpArbiterThread *
Arbiter.prototype.threadForBody = function (/*cpBody*/ body) {
    var arb = this;
    return (arb.body_a == body ? arb.thread_a : arb.thread_b);
}
