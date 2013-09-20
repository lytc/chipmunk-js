//cpGrooveJoint *
var GrooveJoint = cp.GrooveJoint = function (/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ groove_a, /*cpVect*/ groove_b, /*cpVect*/ anchr2) {
    Constraint.apply(this, arguments);

    var joint = this;

    joint.grv_a = groove_a;
    joint.grv_b = groove_b;
    joint.grv_n = cpvperp(cpvnormalize(cpvsub(groove_b, groove_a)));
    joint.anchr2 = anchr2;

    joint.jAcc = cpvzero;
}

_extend(Constraint, GrooveJoint)


//static void
GrooveJoint.prototype.preStep = function (/*cpFloat*/ dt) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    // calculate endpoints in worldspace
    /*cpVect*/
    var ta = a.local2World(joint.grv_a);
    /*cpVect*/
    var tb = a.local2World(joint.grv_b);

    // calculate axis
    /*cpVect*/
    var n = cpvrotate(joint.grv_n, a.rot);
    /*cpFloat*/
    var d = cpvdot(ta, n);

    joint.grv_tn = n;
    joint.r2 = cpvrotate(joint.anchr2, b.rot);

    // calculate tangential distance along the axis of r2
    /*cpFloat*/
    var td = cpvcross(cpvadd(b.p, joint.r2), n);
    // calculate clamping factor and r2
    if (td <= cpvcross(ta, n)) {
        joint.clamp = 1.0;
        joint.r1 = cpvsub(ta, a.p);
    } else if (td >= cpvcross(tb, n)) {
        joint.clamp = -1.0;
        joint.r1 = cpvsub(tb, a.p);
    } else {
        joint.clamp = 0.0;
        joint.r1 = cpvsub(cpvadd(cpvmult(cpvperp(n), -td), cpvmult(n, d)), a.p);
    }

    // Calculate mass tensor
    joint.k = k_tensor(a, b, joint.r1, joint.r2);

    // calculate bias velocity
    /*cpVect*/
    var delta = cpvsub(cpvadd(b.p, joint.r2), cpvadd(a.p, joint.r1));
    joint.bias = cpvclamp(cpvmult(delta, -bias_coef(joint.errorBias, dt) / dt), joint.maxBias);
}

//static void
GrooveJoint.prototype.applyCachedImpulse = function (/*cpFloat*/ dt_coef) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    apply_impulses(a, b, joint.r1, joint.r2, cpvmult(joint.jAcc, dt_coef));
}

//static inline cpVect
GrooveJoint.prototype.grooveConstrain = function (/*cpVect*/ j, /*cpFloat*/ dt) {
    var joint = this;

    /*cpVect*/
    var n = joint.grv_tn;
    /*cpVect*/
    var jClamp = (joint.clamp * cpvcross(j, n) > 0.0) ? j : cpvproject(j, n);
    return cpvclamp(jClamp, joint.maxForce * dt);
}

//static void
GrooveJoint.prototype.applyImpulse = function (/*cpFloat*/ dt) {
    var joint = this;

    /*cpBody*/
    var a = joint.a;
    /*cpBody*/
    var b = joint.b;

    /*cpVect*/
    var r1 = joint.r1;
    /*cpVect*/
    var r2 = joint.r2;

    // compute impulse
    /*cpVect*/
    var vr = relative_velocity(a, b, r1, r2);

    /*cpVect*/
    var j = joint.k.transform(cpvsub(joint.bias, vr));
    /*cpVect*/
    var jOld = joint.jAcc;
    joint.jAcc = joint.grooveConstrain(cpvadd(jOld, j), dt);
    j = cpvsub(joint.jAcc, jOld);

    // apply impulse
    apply_impulses(a, b, joint.r1, joint.r2, j);
}

//static cpFloat
GrooveJoint.prototype.getImpulse = function () {
    return cpvlength(this.jAcc);
}

//void
GrooveJoint.prototype.setGrooveA = function (/*cpVect*/ value) {
    /*cpGrooveJoint*/
    var g = this;

    g.grv_a = value;
    g.grv_n = cpvperp(cpvnormalize(cpvsub(g.grv_b, value)));

    g.activateBodies();
}

//void
GrooveJoint.prototype.setGrooveB = function (/*cpVect*/ value) {
    /*cpGrooveJoint*/
    var g = this;

    g.grv_b = value;
    g.grv_n = cpvperp(cpvnormalize(cpvsub(value, g.grv_a)));

    g.activateBodies();
}

