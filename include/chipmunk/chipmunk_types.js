/// @defgroup basicTypes Basic Types
/// Most of these types can be configured at compile time.
/// @{

/// Chipmunk's floating point type.
/// Can be reconfigured at compile time.
var cpfsqrt = cp.fsqrt = Math.sqrt
var cpfsin = cp.fsin = Math.sin
var cpfcos = cp.fcos = Math.cos
var cpfacos = cp.facos = Math.acos
var cpfatan2 = cp.fatan2 = Math.atan2
var cpfmod = cp.fmod = function (a, b) {
    return a % b
}
var cpfexp = cp.fexp = Math.exp
var cpfpow = cp.fpow = Math.pow
var cpffloor = cp.ffloor = Math.floor
var CPFLOAT_MIN = 2.225074e-308
var M_PI = Math.PI

/// Return the max of two cpFloats.
//cpFloat
var isFF = global.navigator && global.navigator.userAgent.indexOf('Firefox') != -1

var cpfmax = cp.fmax = isFF? Math.max : function (/*cpFloat*/ a, /*cpFloat*/ b) {
    return (a > b) ? a : b;
}

/// Return the min of two cpFloats.
//cpFloat
var cpfmin = cp.fmin = isFF? Math.min : function (/*cpFloat*/ a, /*cpFloat*/ b) {
    return (a < b) ? a : b;
}

/// Return the absolute value of a cpFloat.
//cpFloat
var cpfabs = cp.fabs = function (/*cpFloat*/ f) {
    return (f < 0) ? -f : f;
}

/// Clamp @c f to be between @c min and @c max.
//cpFloat
var cpfclamp = cp.fclamp = function (/*cpFloat*/ f, /*cpFloat*/ min, /*cpFloat*/ max) {
    return cpfmin(cpfmax(f, min), max);
}

/// Clamp @c f to be between 0 and 1.
//cpFloat
var cpfclamp01 = function (/*cpFloat*/ f) {
    return cpfmax(0.0, cpfmin(f, 1.0));
}


/// Linearly interpolate (or extrapolate) between @c f1 and @c f2 by @c t percent.
//cpFloat
cp.flerp = function (/*cpFloat*/ f1, /*cpFloat*/ f2, /*cpFloat*/ t) {
    return f1 * (1.0 - t) + f2 * t;
}

/// Linearly interpolate from @c f1 to @c f2 by no more than @c d.
//cpFloat
cp.flerpconst = function (/*cpFloat*/ f1, /*cpFloat*/ f2, /*cpFloat*/ d) {
    return f1 + cpfclamp(f2 - f1, -d, d);
}

/// Value for cpShape.group signifying that a shape is in no group.
var CP_NO_GROUP = cp.NO_GROUP = 0
/// Value for cpShape.layers signifying that a shape is in every layer.
var CP_ALL_LAYERS = cp.ALL_LAYERS = ~0
//
var Mat2x2 = function (/*cpFloat*/ a, b, c, d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
};

