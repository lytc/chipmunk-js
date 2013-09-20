//cpPinJoint *
var PinJoint = cp.PinJoint = function (/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ anchr1, /*cpVect*/ anchr2) {
    Constraint.apply(this, arguments);

    var joint = this;

    joint.anchr1 = anchr1;
    joint.anchr2 = anchr2;

    // STATIC_BODY_CHECK
    /*cpVect*/
    var p1 = (a ? cpvadd(a.p, cpvrotate(anchr1, a.rot)) : anchr1);
    /*cpVect*/
    var p2 = (b ? cpvadd(b.p, cpvrotate(anchr2, b.rot)) : anchr2);
    joint.dist = cpvlength(cpvsub(p2, p1));

    if (NDEBUG) {
        cpAssertWarn(joint.dist > 0.0, "You created a 0 length pin joint. A pivot joint will be much more stable.");
    }

    joint.jnAcc = 0.0;
}

_extend(Constraint, PinJoint)


//static void
PinJoint.prototype.preStep = function (/*cpFloat*/ dt) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    joint.r1 = cpvrotate(joint.anchr1, a.rot);
    joint.r2 = cpvrotate(joint.anchr2, b.rot);

    /*cpVect*/
    var delta = cpvsub(cpvadd(b.p, joint.r2), cpvadd(a.p, joint.r1));
    /*cpFloat*/
    var dist = cpvlength(delta);
    joint.n = cpvmult(delta, 1.0 / (dist ? dist : Infinity));

    // calculate mass normal
    joint.nMass = 1.0 / k_scalar(a, b, joint.r1, joint.r2, joint.n);

    // calculate bias velocity
    /*cpFloat*/
    var maxBias = joint.maxBias;
    joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * (dist - joint.dist) / dt, -maxBias, maxBias);
}

//static void
PinJoint.prototype.applyCachedImpulse = function (/*cpFloat*/ dt_coef) {

    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    /*cpVect*/
    var j = cpvmult(joint.n, joint.jnAcc * dt_coef);
    apply_impulses(a, b, joint.r1, joint.r2, j);
}

//static void
PinJoint.prototype.applyImpulse = function (/*cpFloat*/ dt) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;
    /*cpVect*/
    var n = joint.n;

    // compute relative velocity
    /*cpFloat*/
    var vrn = normal_relative_velocity(a, b, joint.r1, joint.r2, n);

    /*cpFloat*/
    var jnMax = joint.maxForce * dt;

    // compute normal impulse
    /*cpFloat*/
    var jn = (joint.bias - vrn) * joint.nMass;
    /*cpFloat*/
    var jnOld = joint.jnAcc;
    joint.jnAcc = cpfclamp(jnOld + jn, -jnMax, jnMax);
    jn = joint.jnAcc - jnOld;

    // apply impulse
    apply_impulses(a, b, joint.r1, joint.r2, cpvmult(n, jn));
}

//static cpFloat
PinJoint.prototype.getImpulse = function () {
    return cpfabs(this.jnAcc);
}