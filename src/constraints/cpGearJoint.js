//cpGearJoint *
var GearJoint = cp.GearJoint = function (/*cpBody*/ a, /*cpBody*/ b, /*cpFloat*/ phase, /*cpFloat*/ ratio) {
    Constraint.apply(this, arguments);

    var joint = this;

    joint.phase = phase;
    joint.ratio = ratio;
    joint.ratio_inv = 1.0 / ratio;

    joint.jAcc = 0.0;
}

_extend(Constraint, GearJoint)

//static void
GearJoint.prototype.preStep = function (/*cpFloat*/ dt) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    // calculate moment of inertia coefficient.
    joint.iSum = 1.0 / (a.i_inv * joint.ratio_inv + joint.ratio * b.i_inv);

    // calculate bias velocity
    /*cpFloat*/
    var maxBias = joint.maxBias;
    joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * (b.a * joint.ratio - a.a - joint.phase) / dt, -maxBias, maxBias);
}

//static void
GearJoint.prototype.applyCachedImpulse = function (/*cpFloat*/ dt_coef) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    /*cpFloat*/
    var j = joint.jAcc * dt_coef;
    a.w -= j * a.i_inv * joint.ratio_inv;
    b.w += j * b.i_inv;
}

//static void
GearJoint.prototype.applyImpulse = function (/*cpFloat*/ dt) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    // compute relative rotational velocity
    /*cpFloat*/
    var wr = b.w * joint.ratio - a.w;

    /*cpFloat*/
    var jMax = joint.maxForce * dt;

    // compute normal impulse
    /*cpFloat*/
    var j = (joint.bias - wr) * joint.iSum;
    /*cpFloat*/
    var jOld = joint.jAcc;
    joint.jAcc = cpfclamp(jOld + j, -jMax, jMax);
    j = joint.jAcc - jOld;

    // apply impulse
    a.w -= j * a.i_inv * joint.ratio_inv;
    b.w += j * b.i_inv;
}

//static cpFloat
GearJoint.prototype.getImpulse = function () {
    var joint = this;

    return cpfabs(joint.jAcc);
}

//void
GearJoint.prototype.setRatio = function (/*cpFloat*/ value) {
    var constraint = this;

    constraint.ratio = value;
    constraint.ratio_inv = 1.0 / value;
    constraint.activateBodies();
}
