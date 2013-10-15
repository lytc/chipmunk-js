///// Chipmunk's axis-aligned 2D bounding box type. (left, bottom, right, top)
var BB = cp.BB = function (/*cpFloat*/ l, b, r, t) {
    this.l = l;
    this.b = b;
    this.r = r;
    this.t = t;
};

/// Constructs a cpBB for a circle with the given position and radius.
//cpBB
var BBNewForCircle = BB.newForCircle = function (/*const cpVect*/ p, /*const cpFloat*/ r) {
    return new BB(p.x - r, p.y - r, p.x + r, p.y + r);
}

/// Returns true if @c a and @c b intersect.
//cpBool
BB.prototype.intersects = function (/*const cpBB*/ b) {
    var a = this;
//    return (a.l <= b.r && b.l <= a.r && a.b <= b.t && b.b <= a.t);
    return !(a.l > b.r || b.l > a.r || a.b > b.t || b.b > a.t);
}

/// Returns true if @c other lies completely within @c bb.
//cpBool
BB.prototype.containsBB = function (/*const cpBB*/ other) {
    var bb = this;
//    return (bb.l <= other.l && bb.r >= other.r && bb.b <= other.b && bb.t >= other.t);
    return !(bb.l > other.l || bb.r < other.r || bb.b > other.b || bb.t < other.t);
}

/// Returns true if @c bb contains @c v.
//cpBool
BB.prototype.containsVect = function (/*const cpVect*/ v) {
    var bb = this;
    return (bb.l <= v.x && bb.r >= v.x && bb.b <= v.y && bb.t >= v.y);
}

/// Returns a bounding box that holds both bounding boxes.
//cpBB
BB.prototype.merge = function (/*const cpBB*/ b) {
    var a = this;
    return new BB(
        cpfmin(a.l, b.l),
        cpfmin(a.b, b.b),
        cpfmax(a.r, b.r),
        cpfmax(a.t, b.t)
    );
}

BB.prototype.mergeTo = function(b, dest) {
    var a = this;
    dest.l = cpfmin(a.l, b.l);
    dest.b = cpfmin(a.b, b.b);
    dest.r = cpfmax(a.r, b.r);
    dest.t = cpfmax(a.t, b.t);
}

/// Returns a bounding box that holds both @c bb and @c v.
//cpBB
BB.prototype.expand = function (/*const cpVect*/ v) {
    var bb = this;
    return new BB(
        cpfmin(bb.l, v.x),
        cpfmin(bb.b, v.y),
        cpfmax(bb.r, v.x),
        cpfmax(bb.t, v.y)
    );
}

/// Returns the center of a bounding box.
//static inline cpVect
BB.prototype.center = function () {
    var bb = this;
    return cpvlerp(new Vect(bb.l, bb.b), new Vect(bb.r, bb.t), 0.5);
}

/// Returns the area of the bounding box.
//cpFloat
BB.prototype.area = function () {
    var bb = this;
    return (bb.r - bb.l) * (bb.t - bb.b);
}

/// Merges @c a and @c b and returns the area of the merged bounding box.
//cpFloat
BB.prototype.mergedArea = function (/*cpBB*/ b) {
    var a = this;
    return (cpfmax(a.r, b.r) - cpfmin(a.l, b.l)) * (cpfmax(a.t, b.t) - cpfmin(a.b, b.b));
}

/// Returns the fraction along the segment query the cpBB is hit. Returns Infinity if it doesn't hit.
//cpFloat
BB.prototype.segmentQuery = function (/*cpVect*/ a, /*cpVect*/ b) {
    var bb = this;
    /*cpFloat*/
    var ax = a.x;
    var ay = a.y;
    var bx = b.x;
    var by = b.y;
    var idx = bx - ax;
    /*cpFloat*/
    var tx1 = (bb.l == ax ? -Infinity : (bb.l - ax) / idx);
    /*cpFloat*/
    var tx2 = (bb.r == ax ? Infinity : (bb.r - ax) / idx);
    /*cpFloat*/
    if (tx1 < tx2) {
        var txmin = tx1;
        var txmax = tx2;
    } else {
        var txmin = tx2;
        var txmax = tx1;
    }
//    var txmin = cpfmin(tx1, tx2);
    /*cpFloat*/
//    var txmax = cpfmax(tx1, tx2);

    /*cpFloat*/
    var idy = by - ay;
    /*cpFloat*/
    var ty1 = (bb.b == ay ? -Infinity : (bb.b - ay) / idy);
    /*cpFloat*/
    var ty2 = (bb.t == ay ? Infinity : (bb.t - ay) / idy);
    /*cpFloat*/
//    var tymin = cpfmin(ty1, ty2);
    /*cpFloat*/
//    var tymax = cpfmax(ty1, ty2);

    if (ty1 < ty2) {
        var tymin = ty1;
        var tymax = ty2;
    } else {
        var tymin = ty2;
        var tymax = ty1;
    }

    if (tymin <= txmax && txmin <= tymax) {
        /*cpFloat*/
        var min;
        if (0.0 <= cpfmin(txmax, tymax) && (min = cpfmax(txmin, tymin)) <= 1.0) return cpfmax(min, 0.0);
    }

    return Infinity;
}

/// Return true if the bounding box intersects the line segment with ends @c a and @c b.
//cpBool
BB.prototype.intersectsSegment = function (/*cpVect*/ a, /*cpVect*/ b) {
    var bb = this;
    return (bb.segmentQuery(a, b) != Infinity);
}

/// Clamp a vector to a bounding box.
//static inline cpVect
BB.prototype.clampVect = function (/*const cpVect*/ v) {
    var bb = this;
    return new Vect(cpfclamp(v.x, bb.l, bb.r), cpfclamp(v.y, bb.b, bb.t));
}