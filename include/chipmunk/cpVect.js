var Vect = cp.Vect = function(x, y) {
    this.x = x;
    this.y = y;
}

var cpv = cp.v = function (x, y) {
    return {x: x, y: y}
}

/// Constant for the zero vector.
/*cpVect*/
var cpvzero = cp.vzero = new Vect(0, 0);

/// Check if two vectors are equal. (Be careful when comparing floating point numbers!)
//cpBool
var cpveql = cp.v.eql = function (/*const cpVect*/ v1, /*const cpVect*/ v2) {
    return (v1.x == v2.x && v1.y == v2.y);
}

/// Add two vectors
//cpVect
var cpvadd = cp.v.add = function (/*const cpVect*/ v1, /*const cpVect*/ v2) {
    return new Vect(v1.x + v2.x, v1.y + v2.y);
}

/// Subtract two vectors.
//cpVect
var cpvsub = cp.v.sub = function (/*const cpVect*/ v1, /*const cpVect*/ v2) {
    return new Vect(v1.x - v2.x, v1.y - v2.y);
}

/// Negate a vector.
//cpVect
var cpvneg = cp.v.neg = function (/*const cpVect*/ v) {
    return new Vect(-v.x, -v.y);
}

/// Scalar multiplication.
//cpVect
var cpvmult = cp.v.mult = function (/*const cpVect*/ v, /*const cpFloat*/ s) {
    return new Vect(v.x * s, v.y * s);
}

/// Vector dot product.
//cpFloat
var cpvdot = cp.v.dot = function (/*const cpVect*/ v1, /*const cpVect*/ v2) {
    return v1.x * v2.x + v1.y * v2.y;
}

/// 2D vector cross product analog.
/// The cross product of 2D vectors results in a 3D vector with only a z component.
/// This function returns the magnitude of the z value.
//cpFloat
var cpvcross = cp.v.cross = function (/*const cpVect*/ v1, /*const cpVect*/ v2) {
    return v1.x * v2.y - v1.y * v2.x;
}

/// Returns a perpendicular vector. (90 degree rotation)
//cpVect
var cpvperp = cp.v.perp = function (/*const cpVect*/ v) {
    return new Vect(-v.y, v.x);
}

/// Returns a perpendicular vector. (-90 degree rotation)
//cpVect
cp.v.rperp = function (/*const cpVect*/ v) {
    return new Vect(v.y, -v.x);
}

/// Returns the vector projection of v1 onto v2.
//cpVect
var cpvproject = cp.v.project = function (/*const cpVect*/ v1, /*const cpVect*/ v2) {
//	return cpvmult(v2, cpvdot(v1, v2)/cpvdot(v2, v2));
    var f = (v1.x * v2.x + v1.y * v2.y) / (v2.x * v2.x + v2.y * v2.y)
    return new Vect(v2.x * f, v2.y * f);
}

/// Returns the unit length vector for the given angle (in radians).
//cpVect
cp.v.forangle = function (/*const cpFloat*/ a) {
    return new Vect(cpfcos(a), cpfsin(a));
}

/// Returns the angular direction v is pointing in (in radians).
//cpFloat
cp.v.toangle = function (/*const cpVect*/ v) {
    return cpfatan2(v.y, v.x);
}

/// Uses complex number multiplication to rotate v1 by v2. Scaling will occur if v1 is not a unit vector.
//cpVect
var cpvrotate = cp.v.rotate = function (/*const cpVect*/ v1, /*const cpVect*/ v2) {
    return new Vect(v1.x * v2.x - v1.y * v2.y, v1.x * v2.y + v1.y * v2.x);
}

/// Inverse of cpvrotate().
//cpVect
var cpvunrotate = cp.v.unrotate = function (/*const cpVect*/ v1, /*const cpVect*/ v2) {
    return new Vect(v1.x * v2.x + v1.y * v2.y, v1.y * v2.x - v1.x * v2.y);
}

/// Returns the squared length of v. Faster than cpvlength() when you only need to compare lengths.
//cpFloat
var cpvlengthsq = cp.v.lengthsq = function (/*const cpVect*/ v) {
//	return cpvdot(v, v);
    return v.x * v.x + v.y * v.y;
}

/// Returns the length of v.
//cpFloat
var cpvlength = cp.v.len = function (/*const cpVect*/ v) {
//	return cpfsqrt(cpvdot(v, v));
    return cpfsqrt(v.x * v.x + v.y * v.y);
}

/// Linearly interpolate between v1 and v2.
//cpVect
var cpvlerp = cp.v.lerp = function (/*const cpVect*/ v1, /*const cpVect*/ v2, /*const cpFloat*/ t) {
//	return cpvadd(cpvmult(v1, 1.0 - t), cpvmult(v2, t));
    var t2 = 1.0 - t;
    return new Vect(v1.x * t2 + v2.x * t, v1.y * t2 + v2.y * t);
}

/// Returns a normalized copy of v.
//cpVect
var cpvnormalize = cp.v.normalize = function (/*const cpVect*/ v) {
    // Neat trick I saw somewhere to avoid div/0.
//	return cpvmult(v, 1.0/(cpvlength(v) + CPFLOAT_MIN));

    var f = cpfsqrt(v.x * v.x + v.y * v.y) + CPFLOAT_MIN;
    return new Vect(v.x / f, v.y / f);
}

/// @deprecated Just an alias for cpvnormalize() now.
//cpVect
cp.v.normalize_safe = function (/*const cpVect*/ v) {
    return cpvnormalize(v);
}

/// Clamp v to length len.
//cpVect
var cpvclamp = cp.v.clamp = function (/*const cpVect*/ v, /*const cpFloat*/ len) {
//	return (cpvdot(v,v) > len*len) ? cpvmult(cpvnormalize(v), len) : v;

    var vlenSq = v.x * v.x + v.y * v.y;
    if (vlenSq > len * len) {
        var f = cpfsqrt(vlenSq) + CPFLOAT_MIN;
        return new Vect(v.x * len / f, v.y * len / f);
    }
    return v;
}

/// Linearly interpolate between v1 towards v2 by distance d.
//cpVect
cp.v.lerpconst = function (/*cpVect*/ v1, /*cpVect*/ v2, /*cpFloat*/ d) {
    return cpvadd(v1, cpvclamp(cpvsub(v2, v1), d));
}

/// Returns the distance between v1 and v2.
//cpFloat
var cpvdist = cp.v.dist = function (/*const cpVect*/ v1, /*const cpVect*/ v2) {
//    return cpvlength(cpvsub(v1, v2));
    var x = v1.x - v2.x;
    var y = v1.y - v2.y;
    return cpfsqrt(x * x + y * y);
}

/// Returns the squared distance between v1 and v2. Faster than cpvdist() when you only need to compare distances.
//cpFloat
var cpvdistsq = cp.v.distsq = function (/*const cpVect*/ v1, /*const cpVect*/ v2) {
//    return cpvlengthsq(cpvsub(v1, v2));
    var x = v1.x - v2.x;
    var y = v1.y - v2.y;
    return x * x + y * y;

}

/// Returns true if the distance between v1 and v2 is less than dist.
//cpBool
cp.v.near = function (/*const cpVect*/ v1, /*const cpVect*/ v2, /*const cpFloat*/ dist) {
    return cpvdistsq(v1, v2) < dist * dist;
}

/// @}

/// @defgroup cpMat2x2 cpMat2x2
/// 2x2 matrix type used for tensors and such.
/// @{

//static inline cpVect
Mat2x2.prototype.transform = function (/*cpVect*/ v) {
    var m = this;
    return new Vect(v.x * m.a + v.y * m.b, v.x * m.c + v.y * m.d);
}
