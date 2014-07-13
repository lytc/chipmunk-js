/*cpHashValue*/
var cpShapeIDCounter = 0;

//void
//var cpResetShapeIdCounter = function() {
//	cpShapeIDCounter = 0;
//}

//cpShape*
var Shape = cp.Shape = function (/*cpBody*/ body) {
    var shape = this;

    shape.hashid = cpShapeIDCounter;
    cpShapeIDCounter++;

    shape.body = body;
//    shape.sensor = 0;

//    shape.e = 0.0;
//    shape.u = 0.0;
    shape.surface_v = new Vect(0, 0);
    shape.bb = new BB(0, 0, 0, 0);

//    shape.collision_type = 0;
//    shape.group = CP_NO_GROUP;
//    shape.layers = CP_ALL_LAYERS;

//    shape.data = null;

//    shape.space = null;

//    shape.next = null;
//    shape.prev = null;
}

Shape.prototype.sensor = 0;
Shape.prototype.e = 0.0;
Shape.prototype.u = 0.0;
Shape.prototype.collision_type = 0;
Shape.prototype.group = CP_NO_GROUP;
Shape.prototype.layers = CP_ALL_LAYERS;
Shape.prototype.data = null;
Shape.prototype.space = null;
Shape.prototype.next = null;
Shape.prototype.prev = null;


Shape.prototype.setElasticity = function (e) {
    this.e = e;
};
Shape.prototype.setFriction = function (u) {
    this.body.activate();
    this.u = u;
};
Shape.prototype.getFriction = function () {
    return this.u;
}
Shape.prototype.setLayers = function (layers) {
    this.body.activate();
    this.layers = layers;
};
Shape.prototype.setSensor = function (sensor) {
    this.body.activate();
    this.sensor = sensor;
};
Shape.prototype.setCollisionType = function (collision_type) {
    this.body.activate();
    this.collision_type = collision_type;
};
Shape.prototype.getBody = function () {
    return this.body;
};
Shape.prototype.getBB = function () {
    return this.bb;
}
Shape.prototype.setRadius = function(radius) {
    this.r = radius;
}

//void
Shape.prototype.setBody = function (/*cpBody*/ body) {
    var shape = this;
    cpAssertHard(!shape.active(), "You cannot change the body on an active shape. You must remove the shape from the space before changing the body.");
    shape.body = body;
}

//cpBB
Shape.prototype.cacheBB = function () {
    var shape = this;
    /*cpBody*/
    var body = shape.body;
    return shape.update(body.p, body.rot);
}

//cpBB
Shape.prototype.update = function (/*cpVect*/ pos, /*cpVect*/ rot) {
    var shape = this;
    shape.cacheData(pos, rot);
    return shape.bb;
//    return (shape.bb = shape.cacheData(pos, rot));
}

//cpBool
Shape.prototype.pointQuery = function (/*cpVect*/ p) {
    var shape = this;
//	/*cpNearestPointQueryInfo*/ var info = new cpNearestPointQueryInfo(null, cpvzero, Infinity, cpvzero);
    var info = shape.nearestPointQuery(p);

    return (info && info.d < 0.0);
}

////cpFloat
//Shape.prototype.nearestPointQuery = function(/*cpVect*/ p, /*cpNearestPointQueryInfo*/ info) {
//    var shape = this;
//	/*cpNearestPointQueryInfo*/ var blank = new cpNearestPointQueryInfo(null, cpvzero, Infinity, cpvzero);
//	shape.nearestPointQuery(shape, p, info);
//    _merge(info, blank);
//
//	return info.d;
//}


//cpBool
Shape.prototype.segmentQuery = function (/*cpVect*/ a, /*cpVect*/ b, /*cpSegmentQueryInfo*/ info) {
    var shape = this;
    var nearest = shape.nearestPointQuery(shape, a);

    if (nearest) {
        if (nearest.d <= 0.0) {
            var n = cpvnormalize(cpvsub(a, nearest.p));
            return new cpSegmentQueryInfo(shape, 0.0, n)
        } else {
            return shape.segmentQuery(shape, a, b, info);
        }
    }
}

//cpCircleShape *
var CircleShape = cp.CircleShape = function (/*cpBody*/ body, /*cpFloat*/ radius, /*cpVect*/ offset) {
    var circle = this;
    circle.c = offset;
    circle.r = radius;
    circle.tc = new Vect(0, 0)

    Shape.apply(this, arguments);
}

_extend(Shape, CircleShape);

CircleShape.prototype.type = CP_CIRCLE_SHAPE;

//static cpBB
CircleShape.prototype.cacheData = function (/*cpVect*/ p, /*cpVect*/ rot) {
    var circle = this;
    var bb = circle.bb;
    var r = circle.r;

    /*cpVect*/
//    var c = circle.tc = cpvadd(p, cpvrotate(circle.c, rot));
//    return BBNewForCircle(c, circle.r);

    var cx = circle.c.x
    var cy = circle.c.y
    var x = circle.tc.x = p.x + cx * rot.x - cy * rot.y;
    var y = circle.tc.y = p.y + cx * rot.y + cy * rot.x;

    bb.l = x - r
    bb.b = y - r
    bb.r = x + r
    bb.t = y + r

    circle.bbCenter = circle.tc;

    return bb;
}

//static void
CircleShape.prototype.nearestPointQuery = function (/*cpVect*/ p) {
    var circle = this;
    /*cpVect*/
    var delta = cpvsub(p, circle.tc);
    /*cpFloat*/
    var d = cpvlength(delta);
    /*cpFloat*/
    var r = circle.r;

    var p = cpvadd(circle.tc, cpvmult(delta, r / d)); // TODO div/0
    var d = d - r;

    // Use up for the gradient if the distance is very small.
    var g = (d > MAGIC_EPSILON ? cpvmult(delta, 1.0 / d) : new Vect(0.0, 1.0));

    return new cpNearestPointQueryInfo(circle, p, d, g);
}

//static void
CircleShape.prototype.segmentQuery = function (/*cpVect*/ a, /*cpVect*/ b) {
    var circle = this;
    return CircleSegmentQuery(/*cpShape*/circle, circle.tc, circle.r, a, b);
}

//cpSegmentShape *
var SegmentShape = cp.SegmentShape = function (/*cpBody*/ body, /*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ r) {
    var seg = this;
    seg.a = a;
    seg.b = b;
    seg.n = cpvperp(cpvnormalize(cpvsub(b, a)));

    seg.r = r;

    seg.a_tangent = new Vect(0, 0);
    seg.b_tangent = new Vect(0, 0);
    seg.ta = new Vect(0, 0);
    seg.tb = new Vect(0, 0);
    seg.tn = new Vect(0, 0);

    Shape.apply(this, arguments);
}

_extend(Shape, SegmentShape);

SegmentShape.prototype.type = CP_SEGMENT_SHAPE;

//static cpBB
SegmentShape.prototype.cacheData = function (/*cpVect*/ p, /*cpVect*/ rot) {
    var seg = this;
//    seg.ta = cpvadd(p, cpvrotate(seg.a, rot));
//    seg.tb = cpvadd(p, cpvrotate(seg.b, rot));

    var px = p.x;
    var py = p.y;
    var rotx = rot.x;
    var roty = rot.y;
    var ax = seg.a.x;
    var ay = seg.a.y;
    var bx = seg.b.x;
    var by = seg.b.y;

    var tax = seg.ta.x = px + ax * rotx - ay * roty;
    var tay = seg.ta.y = py + ax * roty + ay * rotx;
    var tbx = seg.tb.x = px + bx * rotx - by * roty;
    var tby = seg.tb.y = py + bx * roty + by * rotx;

//    seg.tn = cpvrotate(seg.n, rot);
    var nx = seg.n.x;
    var ny = seg.n.y;
    seg.tn.x = nx * rotx - ny * roty;
    seg.tn.y = nx * roty + ny * rotx;

    var l, r, b, t;

    if (tax < tbx) {
        l = tax;
        r = tbx;
    } else {
        l = tbx;
        r = tax;
    }

    if (tay < tby) {
        b = tay;
        t = tby;
    } else {
        b = tby;
        t = tay;
    }

    /*cpFloat*/
    var rad = seg.r;
    var bb = seg.bb;
    bb.l = l - rad
    bb.b = b - rad
    bb.r = r + rad
    bb.t = t + rad

    seg.bbCenter = bb.center();

    return bb;
//    return new BB(l - rad, b - rad, r + rad, t + rad);
}

//cpNearestPointQueryInfo
SegmentShape.prototype.nearestPointQuery = function (/*cpVect*/ p) {
    var seg = this;
    /*cpVect*/
    var closest = cpClosetPointOnSegment(p, seg.ta, seg.tb);

    /*cpVect*/
    var delta = cpvsub(p, closest);
    /*cpFloat*/
    var d = cpvlength(delta);
    /*cpFloat*/
    var r = seg.r;
    /*cpVect*/
    var g = cpvmult(delta, 1.0 / d);

    var p = (d ? cpvadd(closest, cpvmult(g, r)) : closest);
    var d = d - r;

    // Use the segment's normal if the distance is very small.
    var g = (d > MAGIC_EPSILON ? g : seg.n);

    return new cpNearestPointQueryInfo(seg, p, d, g);
}

//static void
SegmentShape.prototype.segmentQuery = function (/*cpVect*/ a, /*cpVect*/ b) {
    var seg = this;
    /*cpVect*/
    var n = seg.tn;
    /*cpFloat*/
    var d = cpvdot(cpvsub(seg.ta, a), n);
    /*cpFloat*/
    var r = seg.r;

    /*cpVect*/
    var flipped_n = (d > 0.0 ? cpvneg(n) : n);
    /*cpVect*/
    var seg_offset = cpvsub(cpvmult(flipped_n, r), a);

    // Make the endpoints relative to 'a' and move them by the thickness of the segment.
    /*cpVect*/
    var seg_a = cpvadd(seg.ta, seg_offset);
    /*cpVect*/
    var seg_b = cpvadd(seg.tb, seg_offset);
    /*cpVect*/
    var delta = cpvsub(b, a);

    if (cpvcross(delta, seg_a) * cpvcross(delta, seg_b) <= 0.0) {
        /*cpFloat*/
        var d_offset = d + (d > 0.0 ? -r : r);
        /*cpFloat*/
        var ad = -d_offset;
        /*cpFloat*/
        var bd = cpvdot(delta, n) - d_offset;

        if (ad * bd < 0.0) {
            return {
                shape: seg,
                t: ad / (ad - bd),
                n: flipped_n
            }
        }
    } else if (r != 0.0) {
        /*cpSegmentQueryInfo*/
        var info1 = CircleSegmentQuery(/*cpShape*/seg, seg.ta, seg.r, a, b);
        var info2 = CircleSegmentQuery(/*cpShape*/seg, seg.tb, seg.r, a, b);

        if (info1 && info2) {
            return info1.t < info2.t? info1 : info2;
        }

        return info1 || info2
    }
}

//void
SegmentShape.prototype.setNeighbors = function (/*cpVect*/ prev, /*cpVect*/ next) {
    /*cpSegmentShape*/
    var seg = this;

//    seg.a_tangent = cpvsub(prev, seg.a);
//    seg.b_tangent = cpvsub(next, seg.b);

    seg.a_tangent.x = prev.x - seg.a.x;
    seg.a_tangent.y = prev.y - seg.a.y;

    seg.b_tangent.x = next.x - seg.b.x;
    seg.b_tangent.y = next.y - seg.b.y;
}

// Unsafe API (chipmunk_unsafe.h)

//void
CircleShape.prototype.setOffset = function (/*cpVect*/ offset) {
    this.c = offset;
}

//void
SegmentShape.prototype.setEndpoints = function (/*cpVect*/ a, /*cpVect*/ b) {
    /*cpSegmentShape*/
    var seg = this;

    seg.a = a;
    seg.b = b;
    seg.n = cpvperp(cpvnormalize(cpvsub(b, a)));
}