//cpBody *
var Body = cp.Body = function (/*cpFloat*/ m, /*cpFloat*/ i) {
    var body = this;

    body.p = new Vect(0, 0);
    body.v = new Vect(0, 0);
    body.f = new Vect(0, 0);

    body.v_bias = new Vect(0, 0);
//    this.rot = cpvforangle(0.0)
    this.rot = new Vect(1.0, 0.0)

    // Setters must be called after full initialization so the sanity checks don't assert on garbage data.
    body.setMass(m);
    body.setMoment(i);
}

Body.prototype = {
    space: null,
    shapeList: null,
    arbiterList: null,
    constraintList: null,
    nodeRoot: null,
    nodeNext: null,
    nodeIdleTime: 0.0,
    w: 0.0,
    t: 0.0,
    w_bias: 0.0,
    v_limit: Infinity,
    w_limit: Infinity,
    data: null,
    a: 0.0
}

Body.prototype.getPos = function () {
    return this.p;
};
Body.prototype.getAngVel = function () {
    return this.w;
};
Body.prototype.getVel = function () {
    return this.v;
};
Body.prototype.setVel = function (v) {
    this.activate();
    this.v = v;
};
Body.prototype.setAngVel = function (w) {
    this.activate();
    this.w = w;
}

//cpBody *
Body.initStatic = function (body) {
    body.setMass(Infinity);
    body.setMoment(Infinity);
    body.nodeIdleTime = Infinity;

    return body;
}

//cpBody *
Body.newStatic = function () {
    var body = new Body(Infinity, Infinity);
    body.nodeIdleTime = Infinity;

    return body;
}

//void
if (NDEBUG) {
    //void
    var cpv_assert_nan = function (/*cpVect*/ v, /*char **/message) {
        cpAssertSoft(v.x == v.x && v.y == v.y, message);
    }
    //void
    var cpv_assert_infinite = function (/*cpVect*/ v, /*char **/message) {
        cpAssertSoft(cpfabs(v.x) != Infinity && cpfabs(v.y) != Infinity, message);
    }
    //void
    var cpv_assert_sane = function (/*cpVect*/ v, /*char **/message) {
        cpv_assert_nan(v, message);
        cpv_assert_infinite(v, message);
    }

    var BodySanityCheck = function (body) {
        cpAssertSoft(body.m == body.m && body.m_inv == body.m_inv, "Body's mass is invalid.");
        cpAssertSoft(body.i == body.i && body.i_inv == body.i_inv, "Body's moment is invalid.");

        cpv_assert_sane(body.p, "Body's position is invalid.");
        cpv_assert_sane(body.v, "Body's velocity is invalid.");
        cpv_assert_sane(body.f, "Body's force is invalid.");

        cpAssertSoft(body.a == body.a && cpfabs(body.a) != Infinity, "Body's angle is invalid.");
        cpAssertSoft(body.w == body.w && cpfabs(body.w) != Infinity, "Body's angular velocity is invalid.");
        cpAssertSoft(body.t == body.t && cpfabs(body.t) != Infinity, "Body's torque is invalid.");

        cpv_assert_sane(body.rot, "Body's rotation vector is invalid.");

        cpAssertSoft(body.v_limit == body.v_limit, "Body's velocity limit is invalid.");
        cpAssertSoft(body.w_limit == body.w_limit, "Body's angular velocity limit is invalid.");
    }
//    var BodyAssertSane = BodySanityCheck;
}


//void
Body.prototype.setMass = function (/*cpFloat*/ mass) {
    var body = this;
    cpAssertHard(mass > 0.0, "Mass must be positive and non-zero.");

    body.activate();
    body.m = mass;
    body.m_inv = 1.0 / mass;
    if (NDEBUG) {
        BodySanityCheck(body);
    }
}

//void
Body.prototype.setMoment = function (/*cpFloat*/ moment) {
    var body = this;
    cpAssertHard(moment > 0.0, "Moment of Inertia must be positive and non-zero.");

    body.activate();
    body.i = moment;
    body.i_inv = 1.0 / moment;
    if (NDEBUG) {
        BodySanityCheck(body);
    }
}

//void
Body.prototype.addShape = function (/*cpShape*/ shape) {
    var body = this;
    /*cpShape*/
    var next = body.shapeList;
    if (next) next.prev = shape;

    shape.next = next;
    body.shapeList = shape;
}

//void
Body.prototype.removeShape = function (/*cpShape*/ shape) {
    var body = this;
    /*cpShape*/
    var prev = shape.prev;
    /*cpShape*/
    var next = shape.next;

    if (prev) {
        prev.next = next;
    } else {
        body.shapeList = next;
    }

    if (next) {
        next.prev = prev;
    }

    shape.prev = null;
    shape.next = null;
}

//static cpConstraint *
var filterConstraints = function (/*cpConstraint*/ node, /*cpBody*/ body, /*cpConstraint*/ filter) {
    if (node == filter) {
        return node.next(body);
    } else if (node.a == body) {
        node.next_a = filterConstraints(node.next_a, body, filter);
    } else {
        node.next_b = filterConstraints(node.next_b, body, filter);
    }

    return node;
}

//void
Body.prototype.removeConstraint = function (/*cpConstraint*/ constraint) {
    var body = this;
    body.constraintList = filterConstraints(body.constraintList, body, constraint);
}

//void
Body.prototype.setPos = function (/*cpVect*/ pos) {
    var body = this;
    body.activate();
    body.p = pos;
    if (NDEBUG) {
        BodySanityCheck(body);
    }
}

//static inline void
var setAngle = function (/*cpBody*/ body, /*cpFloat*/ angle) {
    cpAssertSoft(angle == angle && cpfabs(angle) != Infinity, "Body's angle is invalid.");
    body.a = angle;//fmod(a, /*cpFloat*/M_PI*2.0);
//	body.rot = cpvforangle(angle);
    body.rot.x = cpfcos(angle);
    body.rot.y = cpfsin(angle);
}

//void
Body.prototype.setAngle = function (/*cpFloat*/ angle) {
    var body = this;
    body.activate();
    setAngle(body, angle);
    if (NDEBUG) {
        BodySanityCheck(body);
    }
}

//void
Body.prototype.updateVelocity = function (/*cpVect*/ gravity, /*cpFloat*/ damping, /*cpFloat*/ dt) {
    var body = this;
    var v = body.v;
//	body.v = cpvclamp(cpvadd(cpvmult(body.v, damping), cpvmult(cpvadd(gravity, cpvmult(body.f, body.m_inv)), dt)), body.v_limit);
    v.x = v.x * damping + (gravity.x + body.f.x * body.m_inv) * dt;
    v.y = body.v.y * damping + (gravity.y + body.f.y * body.m_inv) * dt;

    var v_limit = body.v_limit;
    if (v_limit < Infinity) {
        var vlenSq = v.x * v.x + v.y * v.y;
        if (vlenSq > v_limit * v_limit) {
            var f = cpfsqrt(vlenSq) + CPFLOAT_MIN;
            v.x *= v_limit / f;
            v.y *= v_limit / f;
        }
    }

    /*cpFloat*/
    var w_limit = body.w_limit;
    body.w = cpfclamp(body.w * damping + body.t * body.i_inv * dt, -w_limit, w_limit);

    if (NDEBUG) {
        BodySanityCheck(body);
    }
}

//void
Body.prototype.updatePosition = function (/*cpFloat*/ dt) {
    var body = this;
//	body.p = cpvadd(body.p, cpvmult(cpvadd(body.v, body.v_bias), dt));
    body.p.x += (body.v.x + body.v_bias.x) * dt;
    body.p.y += (body.v.y + body.v_bias.y) * dt;

    setAngle(body, body.a + (body.w + body.w_bias) * dt);

//	body.v_bias = cpv(0, 0);
    body.v_bias.x = body.v_bias.y = 0;
    body.w_bias = 0.0;

    if (NDEBUG) {
        BodySanityCheck(body);
    }
}

//void
Body.prototype.resetForces = function () {
    var body = this;
    body.activate();
    body.f.x = body.f.y = 0;
    body.t = 0.0;
}

//void
Body.prototype.applyForce = function (/*cpVect*/ force, /*cpVect*/ r) {
    var body = this;
    body.activate();
    body.f.x += force.x;
    body.f.y += force.y;
//	body.f = cpvadd(body.f, force);
    body.t += cpvcross(r, force);
}

//void
Body.prototype.applyImpulse = function (/*const cpVect*/ j, /*const cpVect*/ r) {
    var body = this;
    body.activate();
    apply_impulse(body, j, r);
}

//static inline cpVect
Body.prototype.getVelAtPoint = function (/*cpVect*/ r) {
    var body = this;
    return cpvadd(body.v, cpvmult(cpvperp(r), body.w));
}

//cpVect
Body.prototype.getVelAtWorldPoint = function (/*cpVect*/ point) {
    var body = this;
    return body.getVelAtPoint(cpvsub(point, body.p));
}

//cpVect
Body.prototype.getVelAtLocalPoint = function (/*cpVect*/ point) {
    var body = this;
    return body.getVelAtPoint(cpvrotate(point, body.rot));
}

Body.prototype.kScalar = function (/*cpVect*/ r, /*cpVect*/ n) {
    return k_scalar_body(this, r, n)
}

//void
Body.prototype.eachShape = function (/*cpBodyShapeIteratorFunc*/ func, /*void*/ data) {
    var body = this;
    /*cpShape*/
    var shape = body.shapeList;
    while (shape) {
        /*cpShape*/
        var next = shape.next;
        func(body, shape, data);
        shape = next;
    }
}

//void
Body.prototype.eachConstraint = function (/*cpBodyConstraintIteratorFunc*/ func, /*void*/ data) {
    var body = this;
    /*cpConstraint*/
    var constraint = body.constraintList;
    while (constraint) {
        /*cpConstraint*/
        var next = constraint.next(body);
        func(body, constraint, data);
        constraint = next;
    }
}

//void
Body.prototype.eachArbiter = function (/*cpBodyArbiterIteratorFunc*/ func, /*void*/ data) {
    var body = this;
    /*cpArbiter*/
    var arb = body.arbiterList;
    while (arb) {
        /*cpArbiter*/
        var next = arb.next(body);

        arb.swappedColl = (body == arb.body_b);
        func(body, arb, data);

        arb = next;
    }
}
