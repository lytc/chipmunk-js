/// @private
var CP_CIRCLE_SHAPE = cp.CIRCLE_SHAPE = 0
var CP_SEGMENT_SHAPE = cp.SEGMENT_SHAPE = 1
var CP_POLY_SHAPE = cp.POLY_SHAPE = 2
var CP_NUM_SHAPES = 3


///// Nearest point query info struct.
var cpNearestPointQueryInfo = function (/*cpShape*/ shape, /*cpVect*/ p, /*cpFloat*/ d, /*cpVect*/ g) {
    this.shape = shape;
    this.p = p;
    this.d = d;
    this.g = g;
};

///// Segment query info struct.
var cpSegmentQueryInfo = function (/*cpShape*/ shape, /*cpFloat*/ t, /*cpVect*/ n) {
    this.shape = shape;
    this.t = t;
    this.n = n;
};

/// Get the hit point for a segment query.
//cpVect
cpSegmentQueryInfo.prototype.hitPoint = function (/*const cpVect*/ start, /*const cpVect*/ end) {
    return cpvlerp(start, end, this.t);
}

/// Get the hit distance for a segment query.
//cpFloat
cpSegmentQueryInfo.prototype.hitDist = function (/*const cpVect*/ start, /*const cpVect*/ end) {
    return cpvdist(start, end) * this.t;
};