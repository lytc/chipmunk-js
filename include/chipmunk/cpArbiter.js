/// @private
/*var*/
var cpCollisionHandler = function (/*cpCollisionType*/ a, /*cpCollisionType*/ b, /*cpCollisionBeginFunc*/ begin, /*cpCollisionPreSolveFunc*/ preSolve, /*cpCollisionPostSolveFunc*/ postSolve, /*cpCollisionSeparateFunc*/ separate, /*void*/ data) {
    this.a = a;
    this.b = b;
    this.begin = begin;
    this.preSolve = preSolve;
    this.postSolve = postSolve;
    this.separate = separate;
    this.data = data;
};

/// Return the colliding shapes involved for this arbiter.
/// The order of their cpSpace.collision_type values will match
/// the order set when the collision handler was registered.
//void
Arbiter.prototype.getShapes = function () {
    return this.swappedColl ? [this.b, this.a] : [this.a, this.b];
}

/// Return the colliding bodies involved for this arbiter.
/// The order of the cpSpace.collision_type the bodies are associated with values will match
/// the order set when the collision handler was registered.
//void
Arbiter.prototype.getBodies = function () {
    var shapes = this.getShapes();
    return [shapes[0].body, shapes[1].body];
}

var cpContactPoint = function (/*cpVect*/ point, /*cpVect*/ normal, /*cpFloat*/ dist) {
    this.point = point;
    this.normal = normal;
    this.dist = dist;
}

/// A struct that wraps up the important collision data for an arbiter.
var cpContactPointSet = function () {
//    struct {
//        /// The position of the contact point.
//        /*cpVect*/ var point = new cpVect();
//        /// The normal of the contact point.
//        /*cpVect*/ var normal = new cpVect();
//        /// The depth of the contact point.
//        /*cpFloat*/ var dist = new cpFloat();
//    } points[CP_MAX_CONTACTS_PER_ARBITER];
    this.count = 0;
    this.points = [];
};
