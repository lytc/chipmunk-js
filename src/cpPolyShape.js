//cpPolyShape *
var PolyShape = cp.PolyShape = function (/*cpBody*/ body, /*const cpVect*/ verts, /*cpVect*/ offset) {
    PolyShape2.call(this, body, verts, offset, 0.0);
}

_extend(Shape, PolyShape);

PolyShape.prototype.type = CP_POLY_SHAPE;

//static cpBB
PolyShape.prototype.transformVerts = function (/*cpVect*/ p, /*cpVect*/ rot) {
    var poly = this;
    /*cpVect*/
    var src = poly.verts;
    /*cpVect*/
    var dst = poly.tVerts;

    /*cpFloat*/
    var l = Infinity, r = -Infinity;
    /*cpFloat*/
    var b = Infinity, t = -Infinity;

    for (var i = 0; i < src.length; i++) {
        /*cpVect*/
        var v = cpvadd(p, cpvrotate(src[i], rot));

        dst[i] = v;
        l = cpfmin(l, v.x);
        r = cpfmax(r, v.x);
        b = cpfmin(b, v.y);
        t = cpfmax(t, v.y);
    }

    /*cpFloat*/
    var radius = poly.r;
    var bb = this.bb;
    bb.l = l - radius
    bb.b = b - radius
    bb.r = r + radius
    bb.t = t + radius
//    return new BB(l - radius, b - radius, r + radius, t + radius);
}

//static void
PolyShape.prototype.transformAxes = function (/*cpVect*/ p, /*cpVect*/ rot) {
    var poly = this;
    /*cpSplittingPlane*/
    var src = poly.planes;
    /*cpSplittingPlane*/
    var dst = poly.tPlanes;

    for (var i = 0; i < src.length; i++) {
        /*cpVect*/
        var n = cpvrotate(src[i].n, rot);
        dst[i].n = n;
        dst[i].d = cpvdot(p, n) + src[i].d;
    }
}

//static cpBB
PolyShape.prototype.cacheData = function (/*cpVect*/ p, /*cpVect*/ rot) {
    var poly = this;

    poly.transformAxes(p, rot);
    return poly.transformVerts(p, rot);
    /*cpBB*/
//    var bb = poly.bb = poly.transformVerts(p, rot);
//
//    return bb;
}

//cpNearestPointQueryInfo
PolyShape.prototype.nearestPointQuery = function (/*cpVect*/ p) {
    var poly = this;
    /*int*/
    var count = poly.verts.length;
    /*cpSplittingPlane*/
    var planes = poly.tPlanes;
    /*cpVect*/
    var verts = poly.tVerts;
    /*cpFloat*/
    var r = poly.r;

    /*cpVect*/
    var v0 = verts[count - 1];
    /*cpFloat*/
    var minDist = Infinity;
    /*cpVect*/
    var closestPoint = cpvzero;
    /*cpVect*/
    var closestNormal = cpvzero;
    /*cpBool*/
    var outside = false;

    for (var i = 0; i < count; i++) {
        if (planes[i].compare(p) > 0.0) outside = true;

        /*cpVect*/
        var v1 = verts[i];
        /*cpVect*/
        var closest = cpClosetPointOnSegment(p, v0, v1);

        /*cpFloat*/
        var dist = cpvdist(p, closest);
        if (dist < minDist) {
            minDist = dist;
            closestPoint = closest;
            closestNormal = planes[i].n;
        }

        v0 = v1;
    }

    /*cpFloat*/
    var dist = (outside ? minDist : -minDist);
    /*cpVect*/
    var g = cpvmult(cpvsub(p, closestPoint), 1.0 / dist);

    var p = cpvadd(closestPoint, cpvmult(g, r));
    var d = dist - r;

    // Use the normal of the closest segment if the distance is small.
    g = (minDist > MAGIC_EPSILON ? g : closestNormal);

    return new cpNearestPointQueryInfo(poly, p, d, g);
}

//static void
PolyShape.prototype.segmentQuery = function (/*cpVect*/ a, /*cpVect*/ b) {
    var poly = this;
    var info
    /*cpSplittingPlane **/
    var axes = poly.tPlanes;
    /*cpVect **/
    var verts = poly.tVerts;
    /*int*/
    var numVerts = poly.verts.length;
    /*cpFloat*/
    var r = poly.r;

    for (/*int*/ var i = 0; i < numVerts; i++) {
        /*cpVect*/
        var n = axes[i].n;
        /*cpFloat*/
        var an = cpvdot(a, n);
        /*cpFloat*/
        var d = axes[i].d + r - an;
        if (d > 0.0) continue;

        /*cpFloat*/
        var bn = cpvdot(b, n);
        /*cpFloat*/
        var t = d / (bn - an);
        if (t < 0.0 || 1.0 < t) continue;

        /*cpVect*/
        var point = cpvlerp(a, b, t);
        /*cpFloat*/
        var dt = -cpvcross(n, point);
        /*cpFloat*/
        var dtMin = -cpvcross(n, verts[(i - 1 + numVerts) % numVerts]);
        /*cpFloat*/
        var dtMax = -cpvcross(n, verts[i]);

        if (dtMin <= dt && dt <= dtMax) {
            info = new cpSegmentQueryInfo(poly, t, n)
//            info.shape = /*(cpShape *)*/poly;
//            info.t = t;
//            info.n = n;
        }
    }
//    return info
    // Also check against the beveled vertexes.
    if (r > 0.0) {
        for (/*int*/ var i = 0; i < numVerts; i++) {
//            /*cpSegmentQueryInfo*/ circle_info = {NULL, 1.0f, cpvzero};
            var circle_info = CircleSegmentQuery(poly, verts[i], r, a, b/*, &circle_info*/);

            if (circle_info && (!info || circle_info.t < info.t)) {
                info = circle_info
            }
        }
    }

    return info
}

//cpBool
var cpPolyValidate = function (/*const cpVect*/ verts) {
    var numVerts = verts.length;

    for (var i = 0; i < numVerts; i++) {
        /*cpVect*/
        var a = verts[i];
        /*cpVect*/
        var b = verts[(i + 1) % numVerts];
        /*cpVect*/
        var c = verts[(i + 2) % numVerts];

        if (cpvcross(cpvsub(b, a), cpvsub(c, a)) > 0.0) {
            return false;
        }
    }

    return true;
}

//int
PolyShape.prototype.getNumVerts = function () {
    return this.verts.length;
}

//cpVect
PolyShape.prototype.getVert = function (/*int*/ idx) {
    var shape = this;
    cpAssertHard(0 <= idx && idx < shape.getNumVerts(), "Index out of range.");

    return shape.verts[idx];
}

//cpFloat
PolyShape.prototype.getRadius = function () {
    return this.r;
}

//static void
var setUpVerts = function (/*cpPolyShape **/poly, /*const cpVect **/verts, /*cpVect*/ offset) {
    // Fail if the user attempts to pass a concave poly, or a bad winding.
    cpAssertHard(cpPolyValidate(verts), "Polygon is concave or has a reversed winding. Consider using cp.convexHull().");

    poly.verts = [];
    poly.planes = [];
    poly.tVerts = [];
    poly.tPlanes = [];

    var numVerts = verts.length;

    for (var i = 0; i < numVerts; i++) {
        poly.verts[i] = cpvadd(offset, verts[i]);
    }

    // TODO: Why did I add this? It duplicates work from above.
    for (/*int*/ i = 0; i < verts.length; i++) {
        poly.planes[i] = cpSplittingPlaneNew(poly.verts[(i - 1 + numVerts) % numVerts], poly.verts[i]);
        poly.tPlanes[i] = new cpSplittingPlane(cpv(0, 0), 0);
    }
}

//void
PolyShape.prototype.setVerts = function (/*cpVect*/ verts, /*cpVect*/ offset) {
    var shape = this;
    setUpVerts(/*cpPolyShape*/shape, verts, offset);
}

//void
PolyShape.prototype.setRadius = function (/*cpFloat*/ radius) {
    this.r = radius;
}

//cpPolyShape *
var PolyShape2 = cp.PolyShape2 = function (/*cpBody*/ body, /*const cpVect*/ verts, /*cpVect*/ offset, /*cpFloat*/ radius) {
    var poly = this;
    setUpVerts(poly, verts, offset);

    Shape.call(poly, body);
    poly.r = radius;
//    poly.r = 1;
//    return poly;
}

//cpPolyShape *
var BoxShape = cp.BoxShape = function (/*cpBody*/ body, /*cpFloat*/ width, /*cpFloat*/ height) {
    /*cpFloat*/
    var hw = width / 2.0;
    /*cpFloat*/
    var hh = height / 2.0;
    BoxShape2.call(this, body, new BB(-hw, -hh, hw, hh));
}

//cpPolyShape *
var BoxShape2 = cp.BoxShape2 = function (/*cpBody*/ body, /*cpBB*/ box) {
    BoxShape3.call(this, body, box, 0.0)
}

//cpPolyShape *
var BoxShape3 = cp.BoxShape3 = function (/*cpBody*/ body, /*cpBB*/ box, /*cpFloat*/ radius) {
    var verts = [
        cpv(box.l, box.b),
        cpv(box.l, box.t),
        cpv(box.r, box.t),
        cpv(box.r, box.b)
    ];

    PolyShape2.call(this, body, verts, cpvzero, radius)
}

_extend(PolyShape, PolyShape2)
_extend(PolyShape, BoxShape)
_extend(PolyShape, BoxShape2)
_extend(PolyShape, BoxShape3)
