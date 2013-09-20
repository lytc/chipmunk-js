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

var CP_MAX_CONTACTS_PER_ARBITER = 2

/// @private
// Arbiter is active and its the first collision.
var cpArbiterStateFirstColl = 0
// Arbiter is active and its not the first collision.
var cpArbiterStateNormal = 1
// Collision has been explicitly ignored.
// Either by returning false from a begin collision handler or calling cpArbiterIgnore().
var cpArbiterStateIgnore = 2
// Collison is no longer active. A space will cache an arbiter for up to cpSpace.collisionPersistence more steps.
var cpArbiterStateCached = 3

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
