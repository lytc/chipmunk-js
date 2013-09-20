//cpSlideJoint *
var SlideJoint = cp.SlideJoint = function (/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ anchr1, /*cpVect*/ anchr2, /*cpFloat*/ min, /*cpFloat*/ max) {
    Constraint.apply(this, arguments);

    var joint = this;

    joint.anchr1 = anchr1;
    joint.anchr2 = anchr2;
    joint.min = min;
    joint.max = max;

    joint.jnAcc = 0.0;
}

_extend(Constraint, SlideJoint)

//static void
SlideJoint.prototype.preStep = function (/*cpFloat*/ dt) {
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
    /*cpFloat*/
    var pdist = 0.0;
    if (dist > joint.max) {
        pdist = dist - joint.max;
        joint.n = cpvnormalize(delta);
    } else if (dist < joint.min) {
        pdist = joint.min - dist;
        joint.n = cpvneg(cpvnormalize(delta));
    } else {
        joint.n = cpvzero;
        joint.jnAcc = 0.0;
    }

    // calculate mass normal
    joint.nMass = 1.0 / k_scalar(a, b, joint.r1, joint.r2, joint.n);

    // calculate bias velocity
    /*cpFloat*/
    var maxBias = joint.maxBias;
    joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * pdist / dt, -maxBias, maxBias);
}

//static void
SlideJoint.prototype.applyCachedImpulse = function (/*cpFloat*/ dt_coef) {
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
SlideJoint.prototype.applyImpulse = function (/*cpFloat*/ dt) {
    var joint = this;

    if (cpveql(joint.n, cpvzero)) return;  // early exit

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    /*cpVect*/
    var n = joint.n;
    /*cpVect*/
    var r1 = joint.r1;
    /*cpVect*/
    var r2 = joint.r2;

    // compute relative velocity
    /*cpVect*/
    var vr = relative_velocity(a, b, r1, r2);
    /*cpFloat*/
    var vrn = cpvdot(vr, n);

    // compute normal impulse
    /*cpFloat*/
    var jn = (joint.bias - vrn) * joint.nMass;
    /*cpFloat*/
    var jnOld = joint.jnAcc;
    joint.jnAcc = cpfclamp(jnOld + jn, -joint.maxForce * dt, 0.0);
    jn = joint.jnAcc - jnOld;

    // apply impulse
    apply_impulses(a, b, joint.r1, joint.r2, cpvmult(n, jn));
}

//static cpFloat
SlideJoint.prototype.getImpulse = function () {
    return cpfabs(this.jnAcc);
}
