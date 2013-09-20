//void
var Constraint = cp.Constraint = function (/*cpBody*/ a, /*cpBody*/ b) {
    var constraint = this;

    constraint.a = a;
    constraint.b = b;
    constraint.space = null;

    constraint.next_a = null;
    constraint.next_b = null;

    constraint.maxForce = Infinity;
    constraint.errorBias = cpfpow(1.0 - 0.1, 60.0);
    constraint.maxBias = Infinity;
}


//Constraint.prototype.applyCachedImpulse = function(/*cpFloat*/ dt_coef) {}
Constraint.prototype.preSolve = _nothing
Constraint.prototype.postSolve = _nothing
Constraint.prototype.applyCachedImpulse = _nothing