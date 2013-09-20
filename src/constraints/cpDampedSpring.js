//static cpFloat
var defaultSpringForce = function (/*cpDampedSpring **/spring, /*cpFloat*/ dist) {
    return (spring.restLength - dist) * spring.stiffness;
}

//cpDampedSpring *
var DampedSpring = cp.DampedSpring = function (/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ anchr1, /*cpVect*/ anchr2, /*cpFloat*/ restLength, /*cpFloat*/ stiffness, /*cpFloat*/ damping) {
    Constraint.apply(this, arguments);

    var spring = this;

    spring.anchr1 = anchr1;
    spring.anchr2 = anchr2;

    spring.restLength = restLength;
    spring.stiffness = stiffness;
    spring.damping = damping;
    spring.springForceFunc = /*(cpDampedSpringForceFunc)*/defaultSpringForce;

    spring.jAcc = 0.0;
}

_extend(Constraint, DampedSpring)

//static void
DampedSpring.prototype.preStep = function (/*cpFloat*/ dt) {
    var spring = this;
    /*cpBody*/
    var a = spring.a;
    /*cpBody*/
    var b = spring.b;

    spring.r1 = cpvrotate(spring.anchr1, a.rot);
    spring.r2 = cpvrotate(spring.anchr2, b.rot);

    /*cpVect*/
    var delta = cpvsub(cpvadd(b.p, spring.r2), cpvadd(a.p, spring.r1));
    /*cpFloat*/
    var dist = cpvlength(delta);
    spring.n = cpvmult(delta, 1.0 / (dist ? dist : Infinity));

    /*cpFloat*/
    var k = k_scalar(a, b, spring.r1, spring.r2, spring.n);
    if (NDEBUG) {
        cpAssertSoft(k != 0.0, "Unsolvable spring.");
    }
    spring.nMass = 1.0 / k;

    spring.target_vrn = 0.0;
    spring.v_coef = 1.0 - cpfexp(-spring.damping * dt * k);

    // apply spring force
    /*cpFloat*/
    var f_spring = spring.springForceFunc(/*cpConstraint*/spring, dist);
    /*cpFloat*/
    var j_spring = spring.jAcc = f_spring * dt;
    apply_impulses(a, b, spring.r1, spring.r2, cpvmult(spring.n, j_spring));
}

//static void
DampedSpring.prototype.applyImpulse = function (/*cpFloat*/ dt) {
    var spring = this;
    /*cpBody*/
    var a = spring.a;
    /*cpBody*/
    var b = spring.b;

    /*cpVect*/
    var n = spring.n;
    /*cpVect*/
    var r1 = spring.r1;
    /*cpVect*/
    var r2 = spring.r2;

    // compute relative velocity
    /*cpFloat*/
    var vrn = normal_relative_velocity(a, b, r1, r2, n);

    // compute velocity loss from drag
    /*cpFloat*/
    var v_damp = (spring.target_vrn - vrn) * spring.v_coef;
    spring.target_vrn = vrn + v_damp;

    /*cpFloat*/
    var j_damp = v_damp * spring.nMass;
    spring.jAcc += j_damp;
    apply_impulses(a, b, spring.r1, spring.r2, cpvmult(spring.n, j_damp));
}

//static cpFloat
DampedSpring.prototype.getImpulse = function () {
    return this.jAcc;
}