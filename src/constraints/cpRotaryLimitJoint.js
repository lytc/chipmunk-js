//cpRotaryLimitJoint *
var RotaryLimitJoint = cp.RotaryLimitJoint = function (/*cpBody*/ a, /*cpBody*/ b, /*cpFloat*/ min, /*cpFloat*/ max) {
    Constraint.apply(this, arguments);

    var joint = this;

    joint.min = min;
    joint.max = max;

    return joint;
}

_extend(Constraint, RotaryLimitJoint)

//static void
RotaryLimitJoint.prototype.preStep = function (/*cpFloat*/ dt) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    /*cpFloat*/
    var dist = b.a - a.a;
    /*cpFloat*/
    var pdist = 0.0;
    if (dist > joint.max) {
        pdist = joint.max - dist;
    } else if (dist < joint.min) {
        pdist = joint.min - dist;
    }

    // calculate moment of inertia coefficient.
    joint.iSum = 1.0 / (1.0 / a.i + 1.0 / b.i);

    // calculate bias velocity
    /*cpFloat*/
    var maxBias = joint.maxBias;
    joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * pdist / dt, -maxBias, maxBias);

    // If the bias is 0, the joint is not at a limit. Reset the impulse.
    if (!joint.bias) joint.jAcc = 0.0;
}

//static void
RotaryLimitJoint.prototype.applyCachedImpulse = function (/*cpFloat*/ dt_coef) {
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
RotaryLimitJoint.prototype.applyImpulse = function (/*cpFloat*/ dt) {
    var joint = this;

    if (!joint.bias) return; // early exit

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    // compute relative rotational velocity
    /*cpFloat*/
    var wr = b.w - a.w;

    /*cpFloat*/
    var jMax = joint.maxForce * dt;

    // compute normal impulse
    /*cpFloat*/
    var j = -(joint.bias + wr) * joint.iSum;
    /*cpFloat*/
    var jOld = joint.jAcc;
    if (joint.bias < 0.0) {
        joint.jAcc = cpfclamp(jOld + j, 0.0, jMax);
    } else {
        joint.jAcc = cpfclamp(jOld + j, -jMax, 0.0);
    }
    j = joint.jAcc - jOld;

    // apply impulse
    a.w -= j * a.i_inv;
    b.w += j * b.i_inv;
}

//static cpFloat
RotaryLimitJoint.prototype.getImpulse = function () {
    return cpfabs(this.jAcc);
}
