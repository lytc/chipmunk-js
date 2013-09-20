//cpPivotJoint *
var PivotJoint = cp.PivotJoint = function (/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ anchr1, /*cpVect*/ anchr2) {
    Constraint.apply(this, arguments);

    var joint = this;

    if (!anchr2) {
        var pivot = anchr1;
        /*cpVect*/
        anchr1 = (a ? a.world2Local(pivot) : pivot);
        /*cpVect*/
        anchr2 = (b ? b.world2Local(pivot) : pivot);
    }

    joint.anchr1 = anchr1;
    joint.anchr2 = anchr2;

    joint.jAcc = cpvzero;
}

_extend(Constraint, PivotJoint)


//static void
PivotJoint.prototype.preStep = function (/*cpFloat*/ dt) {

    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    joint.r1 = cpvrotate(joint.anchr1, a.rot);
    joint.r2 = cpvrotate(joint.anchr2, b.rot);

    // Calculate mass tensor
    joint.k = k_tensor(a, b, joint.r1, joint.r2);

    // calculate bias velocity
    /*cpVect*/
    var delta = cpvsub(cpvadd(b.p, joint.r2), cpvadd(a.p, joint.r1));
    joint.bias = cpvclamp(cpvmult(delta, -bias_coef(joint.errorBias, dt) / dt), joint.maxBias);
}

//static void
PivotJoint.prototype.applyCachedImpulse = function (/*cpFloat*/ dt_coef) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    apply_impulses(a, b, joint.r1, joint.r2, cpvmult(joint.jAcc, dt_coef));
}

//static void
PivotJoint.prototype.applyImpulse = function (/*cpFloat*/ dt) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    /*cpVect*/
    var r1 = joint.r1;
    /*cpVect*/
    var r2 = joint.r2;

    // compute relative velocity
    /*cpVect*/
    var vr = relative_velocity(a, b, r1, r2);

    // compute normal impulse
    /*cpVect*/
    var j = joint.k.transform(cpvsub(joint.bias, vr));

    /*cpVect*/
    var jOld = joint.jAcc;
    joint.jAcc = cpvclamp(cpvadd(joint.jAcc, j), joint.maxForce * dt);
    j = cpvsub(joint.jAcc, jOld);

    // apply impulse

    apply_impulses(a, b, joint.r1, joint.r2, j);
}

//static cpFloat
PivotJoint.prototype.getImpulse = function () {
    return cpvlength(this.jAcc);
}