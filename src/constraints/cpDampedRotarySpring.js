//static cpFloat
var defaultSpringTorque = function (/*cpDampedRotarySpring*/ spring, /*cpFloat*/ relativeAngle) {
    return (relativeAngle - spring.restAngle) * spring.stiffness;
}

//cpDampedRotarySpring *
var DampedRotarySpring = cp.DampedRotarySpring = function (/*cpBody*/ a, /*cpBody*/ b, /*cpFloat*/ restAngle, /*cpFloat*/ stiffness, /*cpFloat*/ damping) {
    Constraint.apply(this, arguments);

    var spring = this;

    spring.restAngle = restAngle;
    spring.stiffness = stiffness;
    spring.damping = damping;
    spring.springTorqueFunc = /*(cpDampedRotarySpringTorqueFunc)*/defaultSpringTorque;

    spring.jAcc = 0.0;
}
_extend(Constraint, DampedRotarySpring)

//static void
DampedRotarySpring.prototype.preStep = function (/*cpFloat*/ dt) {
    var spring = this;
    /*cpBody*/
    var a = spring.a;
    /*cpBody*/
    var b = spring.b;

    /*cpFloat*/
    var moment = a.i_inv + b.i_inv;
    if (NDEBUG) {
        cpAssertSoft(moment != 0.0, "Unsolvable spring.");
    }
    spring.iSum = 1.0 / moment;

    spring.w_coef = 1.0 - cpfexp(-spring.damping * dt * moment);
    spring.target_wrn = 0.0;

    // apply spring torque
    /*cpFloat*/
    var j_spring = spring.springTorqueFunc(/*cpConstraint*/spring, a.a - b.a) * dt;
    spring.jAcc = j_spring;

    a.w -= j_spring * a.i_inv;
    b.w += j_spring * b.i_inv;
}

//static void
DampedRotarySpring.prototype.applyImpulse = function (/*cpFloat*/ dt) {
    var spring = this;
    /*cpBody*/
    var a = spring.a;
    /*cpBody*/
    var b = spring.b;

    // compute relative velocity
    /*cpFloat*/
    var wrn = a.w - b.w;//normal_relative_velocity(a, b, r1, r2, n) - spring.target_vrn;

    // compute velocity loss from drag
    // not 100% certain this is derived correctly, though it makes sense
    /*cpFloat*/
    var w_damp = (spring.target_wrn - wrn) * spring.w_coef;
    spring.target_wrn = wrn + w_damp;

    //apply_impulses(a, b, spring.r1, spring.r2, cpvmult(spring.n, v_damp*spring.nMass));
    /*cpFloat*/
    var j_damp = w_damp * spring.iSum;
    spring.jAcc += j_damp;

    a.w += j_damp * a.i_inv;
    b.w -= j_damp * b.i_inv;
}

//static cpFloat
DampedRotarySpring.prototype.getImpulse = function () {
    return this.jAcc;
}