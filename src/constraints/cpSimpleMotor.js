//cpSimpleMotor *
var SimpleMotor = cp.SimpleMotor = function (/*cpBody*/ a, /*cpBody*/ b, /*cpFloat*/ rate) {
    Constraint.apply(this, arguments);

    var joint = this;

    joint.rate = rate;

    joint.jAcc = 0.0;
}

_extend(Constraint, SimpleMotor)

//static void
SimpleMotor.prototype.preStep = function (/*cpFloat*/ dt) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    // calculate moment of inertia coefficient.
    joint.iSum = 1.0 / (a.i_inv + b.i_inv);
}

//static void
SimpleMotor.prototype.applyCachedImpulse = function (/*cpFloat*/ dt_coef) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    /*cpFloat*/
    var j = joint.jAcc * dt_coef;
    a.w -= j * a.i_inv;
    b.w += j * b.i_inv;
}

//static void
SimpleMotor.prototype.applyImpulse = function (/*cpFloat*/ dt) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    // compute relative rotational velocity
    /*cpFloat*/
    var wr = b.w - a.w + joint.rate;

    /*cpFloat*/
    var jMax = joint.maxForce * dt;

    // compute normal impulse
    /*cpFloat*/
    var j = -wr * joint.iSum;
    /*cpFloat*/
    var jOld = joint.jAcc;
    joint.jAcc = cpfclamp(jOld + j, -jMax, jMax);
    j = joint.jAcc - jOld;

    // apply impulse
    a.w -= j * a.i_inv;
    b.w += j * b.i_inv;
}

//static cpFloat
SimpleMotor.prototype.getImpulse = function () {
    return cpfabs(this.jAcc);
}