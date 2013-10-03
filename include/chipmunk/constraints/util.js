//static inline cpVect
var relative_velocity = function (/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ r1, /*cpVect*/ r2) {
    /*cpVect*/
//    var v1_sum = cpvadd(a.v, cpvmult(cpvperp(r1), a.w));
    /*cpVect*/
//    var v2_sum = cpvadd(b.v, cpvmult(cpvperp(r2), b.w));

//    return cpvsub(v2_sum, v1_sum);
    var x = (b.v.x - r2.y * b.w) - (a.v.x -r1.y * a.w)
    var y = (b.v.y + r2.x * b.w) - (a.v.y + r1.x * a.w)
    return new Vect(x, y)
}

//static inline cpFloat
var normal_relative_velocity = function (/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ r1, /*cpVect*/ r2, /*cpVect*/ n) {
//    return cpvdot(relative_velocity(a, b, r1, r2), n);
    var x = (b.v.x - r2.y * b.w) - (a.v.x -r1.y * a.w)
    var y = (b.v.y + r2.x * b.w) - (a.v.y + r1.x * a.w)
    return x * n.x + y * n.y;
}

//static inline void
var apply_impulse = function (/*cpBody*/ body, /*cpVect*/ j, /*cpVect*/ r) {
//    body.v = cpvadd(body.v, cpvmult(j, body.m_inv));
//    body.w += body.i_inv * cpvcross(r, j);

    body.v.x += j.x * body.m_inv;
    body.v.y += j.y * body.m_inv;

    body.w += body.i_inv * (r.x * j.y - r.y * j.x);
}

//static inline void
var apply_impulses = function (/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ r1, /*cpVect*/ r2, /*cpVect*/ j) {
//    apply_impulse(a, cpvneg(j), r1);
//    apply_impulse(b, j, r2);

    var jx = j.x
    var jy = j.y

    a.v.x += -jx * a.m_inv;
    a.v.y += -jy * a.m_inv;
    a.w += a.i_inv * (-r1.x * jy + r1.y * jx);

    b.v.x += jx * b.m_inv;
    b.v.y += jy * b.m_inv;
    b.w += b.i_inv * (r2.x * jy - r2.y * jx);
}

//static inline void
var apply_bias_impulse = function(/*cpBody*/ body, /*cpVect*/ j, /*cpVect*/ r) {
//	body.v_bias = cpvadd(body.v_bias, cpvmult(j, body.m_inv));
    body.v_biasx += j.x * body.m_inv;
    body.v_biasy += j.y * body.m_inv;
	body.w_bias += body.i_inv*cpvcross(r, j);
}

//static inline void
var apply_bias_impulses = function(/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ r1, /*cpVect*/ r2, /*cpVect*/ j) {
	apply_bias_impulse(a, cpvneg(j), r1);
	apply_bias_impulse(b, j, r2);
}

//static inline cpFloat
var k_scalar_body = function (/*cpBody*/ body, /*cpVect*/ r, /*cpVect*/ n) {
    /*cpFloat*/
    var rcn = cpvcross(r, n);
    return body.m_inv + body.i_inv * rcn * rcn;
}

//static inline cpFloat
var k_scalar = function (/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ r1, /*cpVect*/ r2, /*cpVect*/ n) {
    /*cpFloat*/
    var value = k_scalar_body(a, r1, n) + k_scalar_body(b, r2, n);

    if (NDEBUG) {
        cpAssertSoft(value != 0.0, "Unsolvable collision or constraint.");
    }

    return value;
}

//static inline cpMat2x2
var k_tensor = function (/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ r1, /*cpVect*/ r2) {
    /*cpFloat*/
    var m_sum = a.m_inv + b.m_inv;

    // start with Identity*m_sum
    /*cpFloat*/
    var k11 = m_sum, k12 = 0.0;
    /*cpFloat*/
    var k21 = 0.0, k22 = m_sum;

    // add the influence from r1
    /*cpFloat*/
    var a_i_inv = a.i_inv;
    /*cpFloat*/
    var r1xsq = r1.x * r1.x * a_i_inv;
    /*cpFloat*/
    var r1ysq = r1.y * r1.y * a_i_inv;
    /*cpFloat*/
    var r1nxy = -r1.x * r1.y * a_i_inv;
    k11 += r1ysq;
    k12 += r1nxy;
    k21 += r1nxy;
    k22 += r1xsq;

    // add the influnce from r2
    /*cpFloat*/
    var b_i_inv = b.i_inv;
    /*cpFloat*/
    var r2xsq = r2.x * r2.x * b_i_inv;
    /*cpFloat*/
    var r2ysq = r2.y * r2.y * b_i_inv;
    /*cpFloat*/
    var r2nxy = -r2.x * r2.y * b_i_inv;
    k11 += r2ysq;
    k12 += r2nxy;
    k21 += r2nxy;
    k22 += r2xsq;

    // invert
    /*cpFloat*/
    var det = k11 * k22 - k12 * k21;

    if (NDEBUG) {
        cpAssertSoft(det != 0.0, "Unsolvable constraint.");
    }

    /*cpFloat*/
    var det_inv = 1.0 / det;
    return new Mat2x2(
        k22 * det_inv, -k12 * det_inv,
        -k21 * det_inv, k11 * det_inv
    );
}

//static inline cpFloat
var bias_coef = cp.biasCoef = function (/*cpFloat*/ errorBias, /*cpFloat*/ dt) {
    return 1.0 - cpfpow(errorBias, dt);
}
