//cpRatchetJoint *
var RatchetJoint = cp.RatchetJoint = function (/*cpBody*/ a, /*cpBody*/ b, /*cpFloat*/ phase, /*cpFloat*/ ratchet) {
    Constraint.apply(this, arguments);

    var joint = this;

    joint.angle = 0.0;
    joint.phase = phase;
    joint.ratchet = ratchet;

    // STATIC_BODY_CHECK
    joint.angle = (b ? b.a : 0.0) - (a ? a.a : 0.0);
}

_extend(Constraint, RatchetJoint)


//static void
RatchetJoint.prototype.preStep = function (/*cpFloat*/ dt) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    /*cpFloat*/
    var angle = joint.angle;
    /*cpFloat*/
    var phase = joint.phase;
    /*cpFloat*/
    var ratchet = joint.ratchet;

    /*cpFloat*/
    var delta = b.a - a.a;
    /*cpFloat*/
    var diff = angle - delta;
    /*cpFloat*/
    var pdist = 0.0;

    if (diff * ratchet > 0.0) {
        pdist = diff;
    } else {
        joint.angle = cpffloor((delta - phase) / ratchet) * ratchet + phase;
    }

    // calculate moment of inertia coefficient.
    joint.iSum = 1.0 / (a.i_inv + b.i_inv);

    // calculate bias velocity
    /*cpFloat*/
    var maxBias = joint.maxBias;
    joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * pdist / dt, -maxBias, maxBias);

    // If the bias is 0, the joint is not at a limit. Reset the impulse.
    if (!joint.bias) joint.jAcc = 0.0;
}

//static void
RatchetJoint.prototype.applyCachedImpulse = function (/*cpFloat*/ dt_coef) {
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
RatchetJoint.prototype.applyImpulse = function (/*cpFloat*/ dt) {
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
    var ratchet = joint.ratchet;

    /*cpFloat*/
    var jMax = joint.maxForce * dt;

    // compute normal impulse
    /*cpFloat*/
    var j = -(joint.bias + wr) * joint.iSum;
    /*cpFloat*/
    var jOld = joint.jAcc;
    joint.jAcc = cpfclamp((jOld + j) * ratchet, 0.0, jMax * cpfabs(ratchet)) / ratchet;
    j = joint.jAcc - jOld;

    // apply impulse
    a.w -= j * a.i_inv;
    b.w += j * b.i_inv;
}

//static cpFloat
RatchetJoint.prototype.getImpulse = function () {
    return cpfabs(this.jAcc);
}