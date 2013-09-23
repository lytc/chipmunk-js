//cpContact*
var Contact = function (/*cpVect*/ p, /*cpVect*/ n, /*cpFloat*/ dist, /*cpHashValue*/ hash) {
    var con = this;
    con.p = p;
    con.n = n;
    con.dist = dist;

    con.hash = hash;

    con.r1 = new Vect(0, 0)
    con.r2 = new Vect(0, 0)
}

Contact.prototype.jnAcc = 0;
Contact.prototype.jtAcc = 0;
Contact.prototype.jBias = 0;
Contact.prototype.nMass = 0;
Contact.prototype.tMass = 0;
Contact.prototype.bounce = 0;
Contact.prototype.bias = 0;

// TODO make this generic so I can reuse it for constraints also.
//static inline void
var unthreadHelper = function (/*cpArbiter*/ arb, /*cpBody*/ body) {
    /*struct cpArbiterThread*/
    var thread = arb.threadForBody(body);
    /*cpArbiter*/
    var prev = thread.prev;
    /*cpArbiter*/
    var next = thread.next;

    if (prev) {
        prev.threadForBody(body).next = next;
    } else if (body.arbiterList == arb) {
        // IFF prev is null and body.arbiterList == arb, is arb at the head of the list.
        // This function may be called for an arbiter that was never in a list.
        // In that case, we need to protect it from wiping out the body.arbiterList pointer.
        body.arbiterList = next;
    }

    if (next) next.threadForBody(body).prev = prev;

    thread.prev = null;
    thread.next = null;
}

var arbiterThread = function (next, prev) {
    this.next = next;
    this.prev = prev;
}

//cpArbiter*
var Arbiter = cp.Arbiter = function (/*cpShape*/ a, /*cpShape*/ b) {
    var arb = this;

    arb.surface_vr = new Vect(0, 0);

    arb.a = a;
    arb.body_a = a.body;
    arb.b = b;
    arb.body_b = b.body;

    arb.thread_a = new arbiterThread(null, null)
    arb.thread_b = new arbiterThread(null, null)
}

Arbiter.prototype.handler = null;
Arbiter.prototype.contacts = null;
Arbiter.prototype.swappedColl = null;
Arbiter.prototype.e = 0.0;
Arbiter.prototype.u = 0.0;
Arbiter.prototype.stamp = 0.0;
Arbiter.prototype.state = cpArbiterStateFirstColl;
Arbiter.prototype.data = null;

Arbiter.prototype.reset = function (/*cpShape*/ a, /*cpShape*/ b) {
    var arb = this;
    arb.handler = null;
    arb.swappedColl = false;

    arb.e = 0.0;
    arb.u = 0.0;
//    arb.surface_vr = cpv(0, 0);
    arb.surface_vr.x = arb.surface_vr.y = 0;

    arb.contacts = null;

    arb.a = a;
    arb.body_a = a.body;
    arb.b = b;
    arb.body_b = b.body;

    arb.thread_a.next = null;
    arb.thread_a.prev = null;
    arb.thread_b.next = null;
    arb.thread_b.prev = null;

    arb.stamp = 0;
    arb.state = cpArbiterStateFirstColl;

    arb.data = null;
}

//void
Arbiter.prototype.unthread = function () {
    var arb = this;
    unthreadHelper(arb, arb.body_a);
    unthreadHelper(arb, arb.body_b);
}

//cpBool
Arbiter.prototype.isFirstContact = function () {
    return this.state == cpArbiterStateFirstColl;
}

//int
Arbiter.prototype.getCount = function () {
    // Return 0 contacts if we are in a separate callback.
    return (this.state != cpArbiterStateCached ? this.contacts.length : 0);
}

//cpVect
Arbiter.prototype.getNormal = function (/*int*/ i) {
    var arb = this;
    cpAssertHard(0 <= i && i < arb.getCount(), "Index error: The specified contact index is invalid for this arbiter");

    /*cpVect*/
    var n = arb.contacts[i].n;
    return arb.swappedColl ? cpvneg(n) : n;
}

//cpVect
Arbiter.prototype.getPoint = function (/*int*/ i) {
    cpAssertHard(0 <= i && i < this.getCount(), "Index error: The specified contact index is invalid for this arbiter");

    return this.contacts[i].p;
}

//cpFloat
Arbiter.prototype.getDepth = function (/*int*/ i) {
    cpAssertHard(0 <= i && i < this.getCount(), "Index error: The specified contact index is invalid for this arbiter");

    return this.contacts[i].dist;
}

//cpContactPointSet
Arbiter.prototype.getContactPointSet = function () {
    var arb = this;
    /*cpContactPointSet*/
    var set = new cpContactPointSet();
    set.count = arb.getCount();

    var con;
    for (var i = 0; i < set.count; i++) {
        con = arb.contacts[i];
        set.points[i] = new cpContactPoint(con.p, con.n, con.dist);
    }

    return set;
}

//void
Arbiter.prototype.setContactPointSet = function (/*cpContactPointSet*/ set) {
    var arb = this;
    /*int*/
    var count = set.count;
    cpAssertHard(count == arb.contacts.length, "The number of contact points cannot be changed.");

    for (var i = 0; i < count; i++) {
        arb.contacts[i].p = set.points[i].point;
        arb.contacts[i].n = set.points[i].normal;
        arb.contacts[i].dist = set.points[i].dist;
    }
}

//cpVect
Arbiter.prototype.totalImpulse = function () {
    var arb = this;
    /*cpContact*/
    var contacts = arb.contacts;
    /*cpVect*/
    var sum = cpvzero;

    for (var i = 0, count = arb.getCount(); i < count; i++) {
        /*cpContact*/
        var con = contacts[i];
        sum = cpvadd(sum, cpvmult(con.n, con.jnAcc));
    }

    return (arb.swappedColl ? sum : cpvneg(sum));
}

//cpVect
Arbiter.prototype.totalImpulseWithFriction = function () {
    var arb = this;
    /*cpContact*/
    var contacts = arb.contacts;
    /*cpVect*/
    var sum = cpvzero;

    for (var i = 0, count = arb.getCount(); i < count; i++) {
        /*cpContact*/
        var con = contacts[i];
        sum = cpvadd(sum, cpvrotate(con.n, new Vect(con.jnAcc, con.jtAcc)));
    }

    return (arb.swappedColl ? sum : cpvneg(sum));
}

//cpFloat
Arbiter.prototype.totalKE = function () {
    var arb = this;
    /*cpFloat*/
    var eCoef = (1 - arb.e) / (1 + arb.e);
    /*cpFloat*/
    var sum = 0.0;

    /*cpContact*/
    var contacts = arb.contacts;
    for (var i = 0, count = arb.getCount(); i < count; i++) {
        /*cpContact*/
        var con = contacts[i];
        /*cpFloat*/
        var jnAcc = con.jnAcc;
        /*cpFloat*/
        var jtAcc = con.jtAcc;

        sum += eCoef * jnAcc * jnAcc / con.nMass + jtAcc * jtAcc / con.tMass;
    }

    return sum;
}

//void
Arbiter.prototype.ignore = function () {
    this.state = cpArbiterStateIgnore;
}

//cpVect
Arbiter.prototype.getSurfaceVelocity = function () {
    return cpvmult(this.surface_vr, this.swappedColl ? -1.0 : 1.0);
}

//void
Arbiter.prototype.setSurfaceVelocity = function (/*cpVect*/ vr) {
    this.surface_vr = cpvmult(vr, this.swappedColl ? -1.0 : 1.0);
}

//void
Arbiter.prototype.update = function (/*cpContact*/ contacts, /*cpCollisionHandler*/ handler, /*cpShape*/ a, /*cpShape*/ b) {
    var arb = this;
    var numContacts = contacts.length;

    if (arb.contacts) {
        // Iterate over the possible pairs to look for hash value matches.
        for (var i = 0; i < numContacts; i++) {
            /*cpContact*/
            var con = contacts[i];

            for (var j = 0, len = arb.contacts.length; j < len; j++) {
                /*cpContact*/
                var old = arb.contacts[j];

                // This could trigger false positives, but is fairly unlikely nor serious if it does.
                if (con.hash == old.hash) {
                    // Copy the persistant contact information.
                    con.jnAcc = old.jnAcc;
                    con.jtAcc = old.jtAcc;
                }
            }
        }
    }


    arb.contacts = contacts;

    arb.handler = handler;
    arb.swappedColl = (a.collision_type != handler.a);

    arb.e = a.e * b.e;
    arb.u = a.u * b.u;

    // Currently all contacts will have the same normal.
    // This may change in the future.
//	/*cpVect*/ var n = (numContacts ? contacts[0].n : cpvzero);
    var nx, ny;
    if (numContacts) {
        nx = contacts[0].n.x;
        ny = contacts[0].n.y;
    } else {
        nx = ny = 0;
    }
//	/*cpVect*/ var surface_vr = cpvsub(a.surface_v, b.surface_v);
//	/*cpVect*/ var surface_vr = cpv(a.surface_v.x - b.surface_v.x, a.surface_v.y - b.surface_v.y);
    var surface_vrx = a.surface_v.x - b.surface_v.x;
    var surface_vry = a.surface_v.y - b.surface_v.y;
//	arb.surface_vr = cpvsub(surface_vr, cpvmult(n, cpvdot(surface_vr, n)));
    var f = surface_vrx * nx + surface_vry * ny;
//	arb.surface_vr = cpvsub(surface_vr, cpv(n.x * f, n.y * f));
    arb.surface_vr.x = surface_vrx - nx * f;
    arb.surface_vr.y = surface_vry - ny * f;
//
    // For collisions between two similar primitive types, the order could have been swapped.
    arb.a = a;
    arb.body_a = a.body;
    arb.b = b;
    arb.body_b = b.body;

    // mark it as new if it's been cached
    if (arb.state == cpArbiterStateCached) arb.state = cpArbiterStateFirstColl;
}

//void
Arbiter.prototype.preStep = function (/*cpFloat*/ dt, /*cpFloat*/ slop, /*cpFloat*/ bias) {
    var arb = this;
    /*cpBody*/
    var a = arb.body_a;
    /*cpBody*/
    var b = arb.body_b;

    for (var i = 0; i < arb.contacts.length; i++) {
        /*cpContact*/
        var con = arb.contacts[i];
        var r1 = con.r1;
        var r2 = con.r2;
        var n = con.n;
        var p = con.p;

        // Calculate the offsets.
//        con.r1 = cpvsub(con.p, a.p);
//        con.r2 = cpvsub(con.p, b.p);
        r1.x = p.x - a.p.x;
        r1.y = p.y - a.p.y;

        r2.x = p.x - b.p.x;
        r2.y = p.y - b.p.y;

        // Calculate the mass normal and mass tangent.
        con.nMass = 1.0 / k_scalar(a, b, r1, r2, n);
        con.tMass = 1.0 / k_scalar(a, b, r1, r2, cpvperp(n));

        // Calculate the target bias velocity.
        con.bias = -bias * cpfmin(0.0, con.dist + slop) / dt;
        con.jBias = 0.0;

        // Calculate the target bounce velocity.
        con.bounce = normal_relative_velocity(a, b, r1, r2, n) * arb.e;
    }
}

//void
Arbiter.prototype.applyCachedImpulse = function (/*cpFloat*/ dt_coef) {
    var arb = this;
    if (arb.isFirstContact()) return;

    /*cpBody*/
    var a = arb.body_a;
    /*cpBody*/
    var b = arb.body_b;

    for (var i = 0; i < arb.contacts.length; i++) {
        /*cpContact*/
        var con = arb.contacts[i];
        /*cpVect*/
//        var j = cpvrotate(con.n, new Vect(con.jnAcc, con.jtAcc));
        var jx = con.n.x * con.jnAcc - con.n.y * con.jtAcc
        var jy = con.n.x * con.jtAcc + con.n.y * con.jnAcc

//        apply_impulses(a, b, con.r1, con.r2, cpvmult(j, dt_coef));
        apply_impulses(a, b, con.r1, con.r2, new Vect(jx * dt_coef, jy * dt_coef));
    }
}

// TODO is it worth splitting velocity/position correction?

//void
//Arbiter.prototype.applyImpulse = function() {
//    var arb = this;
//	/*cpBody*/ var a = arb.body_a;
//	/*cpBody*/ var b = arb.body_b;
//	/*cpVect*/ var surface_vr = arb.surface_vr;
//	/*cpFloat*/ var friction = arb.u;
//
//	for(var i=0; i<arb.numContacts; i++){
//		/*cpContact*/ var con = arb.contacts[i];
//		/*cpFloat*/ var nMass = con.nMass;
//		/*cpVect*/ var n = con.n;
//		/*cpVect*/ var r1 = con.r1;
//		/*cpVect*/ var r2 = con.r2;
//
//		/*cpVect*/ var vb1 = cpvadd(a.v_bias, cpvmult(cpvperp(r1), a.w_bias));
//		/*cpVect*/ var vb2 = cpvadd(b.v_bias, cpvmult(cpvperp(r2), b.w_bias));
//		/*cpVect*/ var vr = cpvadd(relative_velocity(a, b, r1, r2), surface_vr);
//
//		/*cpFloat*/ var vbn = cpvdot(cpvsub(vb2, vb1), n);
//		/*cpFloat*/ var vrn = cpvdot(vr, n);
//		/*cpFloat*/ var vrt = cpvdot(vr, cpvperp(n));
//
//		/*cpFloat*/ var jbn = (con.bias - vbn)*nMass;
//		/*cpFloat*/ var jbnOld = con.jBias;
//		con.jBias = cpfmax(jbnOld + jbn, 0.0);
//
//		/*cpFloat*/ var jn = -(con.bounce + vrn)*nMass;
//		/*cpFloat*/ var jnOld = con.jnAcc;
//		con.jnAcc = cpfmax(jnOld + jn, 0.0);
//
//		/*cpFloat*/ var jtMax = friction*con.jnAcc;
//		/*cpFloat*/ var jt = -vrt*con.tMass;
//		/*cpFloat*/ var jtOld = con.jtAcc;
//		con.jtAcc = cpfclamp(jtOld + jt, -jtMax, jtMax);
//
//		apply_bias_impulses(a, b, r1, r2, cpvmult(n, con.jBias - jbnOld));
//		apply_impulses(a, b, r1, r2, cpvrotate(n, cpv(con.jnAcc - jnOld, con.jtAcc - jtOld)));
//	}
//}

Arbiter.prototype.applyImpulse = function () {
    var arb = this;
    /*cpBody*/
    var a = arb.body_a;
    /*cpBody*/
    var b = arb.body_b;
    /*cpVect*/
    var surface_vr = arb.surface_vr;
    /*cpFloat*/
    var friction = arb.u;

    for (var i = 0, numContacts = arb.contacts.length; i < numContacts; i++) {
        /*cpContact*/
        var con = arb.contacts[i];
        /*cpFloat*/
        var nMass = con.nMass;
        /*cpVect*/
        var n = con.n;
        /*cpVect*/
        var r1 = con.r1;
        /*cpVect*/
        var r2 = con.r2;

//		/*cpVect*/ var vb1 = cpvadd(a.v_bias, cpvmult(cpvperp(r1), a.w_bias));
//      /*cpVect*/ var vb2 = cpvadd(b.v_bias, cpvmult(cpvperp(r2), b.w_bias));
//        /*cpVect*/ var vr = cpvadd(relative_velocity(a, b, r1, r2), surface_vr);

        var a_w_bias = a.w_bias;
        var b_w_bias = b.w_bias;

        var a_v_bias = a.v_bias;
        var b_v_bias = b.v_bias;
        var a_v_bias_x = a_v_bias.x;
        var a_v_bias_y = a_v_bias.y;
        var b_v_bias_x = b_v_bias.x;
        var b_v_bias_y = b_v_bias.y;

        var av = a.v;
        var bv = b.v;
        var avx = av.x;
        var avy = av.y;
        var bvx = bv.x;
        var bvy = bv.y;
        var aw = a.w;
        var bw = b.w;
        var r1x = r1.x;
        var r1y = r1.y;
        var r2x = r2.x;
        var r2y = r2.y;
        var nx = n.x;
        var ny = n.y;

//		/*cpFloat*/ var vbn = cpvdot(vbSub, n);
//		/*cpFloat*/ var vrn = cpvdot(vr, n);
//        /*cpFloat*/ var vrt = cpvdot(vr, cpvperp(n));

        var vbn = (b_v_bias_x - r2y * b_w_bias - a_v_bias_x + r1y * a_w_bias) * nx + (b_v_bias_y + r2x * b_w_bias - a_v_bias_y - r1x * a_w_bias) * ny;

        var vrx = bvx - r2y * bw - avx + r1y * aw + surface_vr.x;
        var vry = bvy + r2x * bw - avy - r1x * aw + surface_vr.y;

        var vrn = vrx * nx + vry * ny;
        var vrt = -vrx * ny + vry * nx;
        /*cpFloat*/
        var jbn = (con.bias - vbn) * nMass;
        /*cpFloat*/
        var jbnOld = con.jBias;
        con.jBias = cpfmax(jbnOld + jbn, 0);

        /*cpFloat*/
        var jn = -(con.bounce + vrn) * nMass;
        /*cpFloat*/
        var jnOld = con.jnAcc;
        con.jnAcc = cpfmax(jnOld + jn, 0);

        /*cpFloat*/
        var jtMax = friction * con.jnAcc;
        /*cpFloat*/
        var jt = -vrt * con.tMass;
        /*cpFloat*/
        var jtOld = con.jtAcc;
        con.jtAcc = cpfclamp(jtOld + jt, -jtMax, jtMax);

//		apply_bias_impulses(a, b, r1, r2, cpvmult(n, con.jBias - jbnOld));
        var jBiasJbnOld = con.jBias - jbnOld
        var jx = nx * jBiasJbnOld;
        var jy = ny * jBiasJbnOld;

        var a_m_inv = a.m_inv;
        var a_i_inv = a.i_inv;
        a_v_bias.x = a_v_bias_x - jx * a_m_inv;
        a_v_bias.y = a_v_bias_y - jy * a_m_inv;
        a.w_bias += a_i_inv * (-r1x * jy + r1y * jx);

        var b_m_inv = b.m_inv;
        var b_i_inv = b.i_inv;
        b_v_bias.x = b_v_bias_x + jx * b_m_inv;
        b_v_bias.y = b_v_bias_y + jy * b_m_inv;

        b.w_bias += b_i_inv * (r2x * jy - r2y * jx);


//		apply_impulses(a, b, r1, r2, cpvrotate(n, cpv(con.jnAcc - jnOld, con.jtAcc - jtOld)));
        var rotx = con.jnAcc - jnOld;
        var roty = con.jtAcc - jtOld;
        jx = nx * rotx - ny * roty;
        jy = nx * roty + ny * rotx;

//        a.v = cpv(avx - jx * a_m_inv, avy - jy * a_m_inv);
        av.x = avx - jx * a_m_inv;
        av.y = avy - jy * a_m_inv;
        a.w += a_i_inv * (-r1x * jy + r1y * jx);

//        b.v = cpv(bvx + jx * b_m_inv, bvy + jy * b_m_inv);
        bv.x = bvx + jx * b_m_inv;
        bv.y = bvy + jy * b_m_inv;
        b.w += b_i_inv * (r2x * jy - r2y * jx);
    }
};