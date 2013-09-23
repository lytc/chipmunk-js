var ENABLE_CACHING = 1

var MAX_GJK_ITERATIONS = 30
var MAX_EPA_ITERATIONS = 30
var WARN_GJK_ITERATIONS = 20
var WARN_EPA_ITERATIONS = 20

// Add contact points for circle to circle collisions.
// Used by several collision tests.
// TODO should accept hash parameter
//static int
var CircleToCircleQuery = function (/*const cpVect*/ p1, /*const cpVect*/ p2, /*const cpFloat*/ r1, /*const cpFloat*/ r2, /*cpHashValue*/ hash, /*cpContact **/con) {
    /*cpFloat*/
    var mindist = r1 + r2;
    /*cpVect*/
    var delta = cpvsub(p2, p1);
    /*cpFloat*/
    var distsq = cpvlengthsq(delta);

    if (distsq < mindist * mindist) {
        /*cpFloat*/
        var dist = cpfsqrt(distsq);
        /*cpVect*/
        var n = (dist ? cpvmult(delta, 1.0 / dist) : new Vect(1.0, 0.0));
        con.push(new Contact(cpvlerp(p1, p2, r1 / (r1 + r2)), n, dist - mindist, hash));
        return 1;
    } else {
        return 0;
    }
}

//MARK: Support Points and Edges:

//static inline int
var PolySupportPointIndex = function (/*const cpVect **/verts, /*const cpVect*/ n) {
    /*cpFloat*/
    var max = -Infinity;
    /*int*/
    var index = 0;

    for (/*int*/ var i = 0, count = verts.length; i < count; i++) {
        /*cpVect*/
        var v = verts[i];
        /*cpFloat*/
        var d = cpvdot(v, n);
        if (d > max) {
            max = d;
            index = i;
        }
    }

    return index;
}

/*struct*/
var SupportPoint = function (/*cpVect*/ p, /*cpCollisionID*/ id) {
    this.p = p;
    this.id = id;
};

//static inline struct SupportPoint
var CircleSupportPoint = function (/*const cpCircleShape **/circle, /*const cpVect*/ n) {
    return new SupportPoint(circle.tc, 0);
}

//static inline struct SupportPoint
var SegmentSupportPoint = function (/*const cpSegmentShape **/seg, /*const cpVect*/ n) {
    if (cpvdot(seg.ta, n) > cpvdot(seg.tb, n)) {
        return new SupportPoint(seg.ta, 0);
    } else {
        return new SupportPoint(seg.tb, 1);
    }
}

//static inline struct SupportPoint
var PolySupportPoint = function (/*const cpPolyShape **/poly, /*const cpVect*/ n) {
    /*const cpVect **/
    var verts = poly.tVerts;
    /*int*/
    var i = PolySupportPointIndex(verts, n);
    return new SupportPoint(verts[i], i);
}

//static inline struct MinkowskiPoint
var MinkoskiPoint = function (/*const struct SupportPoint*/ a, /*const struct SupportPoint*/ b) {
    this.a = a.p;
    this.b = b.p;
    this.ab = cpvsub(b.p, a.p);
    this.id = (a.id & 0xFF) << 8 | (b.id & 0xFF);
}

/*struct*/
var SupportContext = function (/*const cpShape **/shape1, shape2, /*SupportPointFunc*/ func1, func2) {
    this.shape1 = shape1;
    this.shape2 = shape2;
    this.func1 = func1;
    this.func2 = func2;
}

//static inline struct MinkowskiPoint
var Support = function (/*const struct SupportContext **/ctx, /*const cpVect*/ n) {
    /*struct SupportPoint*/
    var a = ctx.func1(ctx.shape1, cpvneg(n));
    /*struct SupportPoint*/
    var b = ctx.func2(ctx.shape2, n);
    return new MinkoskiPoint(a, b);
}

/*struct*/
var EdgePoint = function (/*cpVect*/ p, /*cpHashValue*/ hash) {
    this.p = p;
    this.hash = hash
};

/*struct*/
var Edge = function (/*struct EdgePoint*/ a, b, /*cpFloat*/ r, /*cpVect*/ n) {
    this.a = a;
    this.b = b;
    this.r = r;
    this.n = n;
};

//static struct Edge
var SupportEdgeForPoly = function (/*const cpPolyShape **/poly, /*const cpVect*/ n) {
    /*int*/
    var numVerts = poly.verts.length;
    /*int*/
    var i1 = PolySupportPointIndex(poly.tVerts, n);

    // TODO get rid of mod eventually, very expensive on ARM
    /*int*/
    var i0 = (i1 - 1 + numVerts) % numVerts;
    /*int*/
    var i2 = (i1 + 1) % numVerts;

    /*cpVect **/
    var verts = poly.tVerts;

    if (cpvdot(n, poly.tPlanes[i1].n) > cpvdot(n, poly.tPlanes[i2].n)) {
        /*struct Edge*/
        var edge = new Edge(new EdgePoint(verts[i0], CP_HASH_PAIR(poly.hashid, i0)), new EdgePoint(verts[i1], CP_HASH_PAIR(poly.hashid, i1)), poly.r, poly.tPlanes[i1].n);
        return edge;
    } else {

        /*struct Edge*/
        var edge = new Edge(new EdgePoint(verts[i1], CP_HASH_PAIR(poly.hashid, i1)), new EdgePoint(verts[i2], CP_HASH_PAIR(poly.hashid, i2)), poly.r, poly.tPlanes[i2].n);
        return edge;
    }
}

//static struct Edge
var SupportEdgeForSegment = function (/*const cpSegmentShape **/seg, /*const cpVect*/ n) {
    if (cpvdot(seg.tn, n) > 0.0) {
        /*struct Edge*/
        var edge = new Edge(new EdgePoint(seg.ta, CP_HASH_PAIR(seg.hashid, 0)), new EdgePoint(seg.tb, CP_HASH_PAIR(seg.hashid, 1)), seg.r, seg.tn);
        return edge;
    } else {
        /*struct Edge*/
        var edge = new Edge(new EdgePoint(seg.tb, CP_HASH_PAIR(seg.hashid, 1)), new EdgePoint(seg.ta, CP_HASH_PAIR(seg.hashid, 0)), seg.r, cpvneg(seg.tn));
        return edge;
    }
}

//static inline cpFloat
var ClosestT = function (/*const cpVect*/ a, /*const cpVect*/ b) {
    /*cpVect*/
    var delta = cpvsub(b, a);
    return -cpfclamp(cpvdot(delta, cpvadd(a, b)) / cpvlengthsq(delta), -1.0, 1.0);
}

//static inline cpVect
var LerpT = function (/*const cpVect*/ a, /*const cpVect*/ b, /*const cpFloat*/ t) {
    /*cpFloat*/
    var ht = 0.5 * t;
    return cpvadd(cpvmult(a, 0.5 - ht), cpvmult(b, 0.5 + ht));
}

//static inline struct ClosestPoints
var ClosestPoints = function (/*const struct MinkowskiPoint*/ v0, /*const struct MinkowskiPoint*/ v1) {
    /*cpFloat*/
    var t = ClosestT(v0.ab, v1.ab);
    /*cpVect*/
    var p = LerpT(v0.ab, v1.ab, t);

    /*cpVect*/
    var pa = LerpT(v0.a, v1.a, t);
    /*cpVect*/
    var pb = LerpT(v0.b, v1.b, t);
    /*cpCollisionID*/
    var id = (v0.id & 0xFFFF) << 16 | (v1.id & 0xFFFF);

    /*cpVect*/
    var delta = cpvsub(v1.ab, v0.ab);
    /*cpVect*/
    var n = cpvnormalize(cpvperp(delta));
    /*cpFloat*/
    var d = -cpvdot(n, p);

    if (d <= 0.0 || (0.0 < t && t < 1.0)) {
        n = cpvneg(n);
    } else {
        /*cpFloat*/
        d = cpvlength(p);
        /*cpVect*/
        n = cpvmult(p, 1.0 / (d + CPFLOAT_MIN));
    }

    this.a = pa;
    this.b = pb;
    this.n = n;
    this.d = d;
    this.id = id;

}

//MARK: EPA Functions

//static inline cpFloat
var ClosestDist = function (/*const cpVect*/ v0, /*const cpVect*/ v1) {
    return cpvlengthsq(LerpT(v0, v1, ClosestT(v0, v1)));
}

//static struct ClosestPoints
var EPARecurse = function (/*const struct SupportContext **/ctx, /*const int*/ count, /*const struct MinkowskiPoint **/hull, /*const int*/ iteration) {
    /*int*/
    var mini = 0;
    /*cpFloat*/
    var minDist = Infinity;

    // TODO: precalculate this when building the hull and save a step.
    for (/*int*/ var j = 0, i = count - 1; j < count; i = j, j++) {
        /*cpFloat*/
        var d = ClosestDist(hull[i].ab, hull[j].ab);
        if (d < minDist) {
            minDist = d;
            mini = i;
        }
    }

    /*struct MinkowskiPoint*/
    var v0 = hull[mini];
    /*struct MinkowskiPoint*/
    var v1 = hull[(mini + 1) % count];
    if (NDEBUG) {
        cpAssertSoft(!cpveql(v0.ab, v1.ab), "Internal Error: EPA vertexes are the same (" + mini + " and " + ((mini + 1) % count) + ")");
    }

    /*struct MinkowskiPoint*/
    var p = Support(ctx, cpvperp(cpvsub(v1.ab, v0.ab)));

//#if DRAW_EPA
//	cpVect verts[count];
//	for(int i=0; i<count; i++) verts[i] = hull[i].ab;
//
//	ChipmunkDebugDrawPolygon(count, verts, RGBAColor(1, 1, 0, 1), RGBAColor(1, 1, 0, 0.25));
//	ChipmunkDebugDrawSegment(v0.ab, v1.ab, RGBAColor(1, 0, 0, 1));
//
//	ChipmunkDebugDrawPoints(5, 1, (cpVect[]){p.ab}, RGBAColor(1, 1, 1, 1));
//#endif

    /*cpFloat*/
    var area2x = cpvcross(cpvsub(v1.ab, v0.ab), cpvadd(cpvsub(p.ab, v0.ab), cpvsub(p.ab, v1.ab)));
    if (area2x > 0.0 && iteration < MAX_EPA_ITERATIONS) {
        /*int*/
        var count2 = 1;
//		struct MinkowskiPoint *hull2 = (struct MinkowskiPoint *)alloca((count + 1)*sizeof(struct MinkowskiPoint));
        /*struct MinkowskiPoint **/
        var hull2 = new Array(count + 1);
        hull2[0] = p;

        for (/*int*/ var i = 0; i < count; i++) {
            /*int*/
            var index = (mini + 1 + i) % count;

            /*cpVect*/
            var h0 = hull2[count2 - 1].ab;
            /*cpVect*/
            var h1 = hull[index].ab;
            /*cpVect*/
            var h2 = (i + 1 < count ? hull[(index + 1) % count] : p).ab;

            // TODO: Should this be changed to an area2x check?
            if (cpvcross(cpvsub(h2, h0), cpvsub(h1, h0)) > 0.0) {
                hull2[count2] = hull[index];
                count2++;
            }
        }

        return EPARecurse(ctx, count2, hull2, iteration + 1);
    } else {
        if (NDEBUG) {
            cpAssertWarn(iteration < WARN_EPA_ITERATIONS, "High EPA iterations: " + iteration);
        }
        return new ClosestPoints(v0, v1);
    }
}

//static struct ClosestPoints
var EPA = function (/*const struct SupportContext **/ctx, /*const struct MinkowskiPoint*/ v0, /*const struct MinkowskiPoint*/ v1, /*const struct MinkowskiPoint*/ v2) {
    // TODO: allocate a NxM array here and do an in place convex hull reduction in EPARecurse
//	struct MinkowskiPoint hull[3] = {v0, v1, v2};
    /*struct MinkowskiPoint*/
    var hull = [v0, v1, v2];
    return EPARecurse(ctx, 3, hull, 1);
}

//MARK: GJK Functions.

//static inline struct ClosestPoints
var GJKRecurse = function (/*const struct SupportContext **/ctx, /*const struct MinkowskiPoint*/ v0, /*const struct MinkowskiPoint*/ v1, /*const int*/ iteration) {
    if (iteration > MAX_GJK_ITERATIONS) {
        if (NDEBUG) {
            cpAssertWarn(iteration < WARN_GJK_ITERATIONS, "High GJK iterations: " + iteration);
        }
        return new ClosestPoints(v0, v1);
    }

    /*cpVect*/
    var delta = cpvsub(v1.ab, v0.ab);
    if (cpvcross(delta, cpvadd(v0.ab, v1.ab)) > 0.0) {
        // Origin is behind axis. Flip and try again.
        return GJKRecurse(ctx, v1, v0, iteration + 1);
    } else {
        /*cpFloat*/
        var t = ClosestT(v0.ab, v1.ab);
        /*cpVect*/
        var n = (-1.0 < t && t < 1.0 ? cpvperp(delta) : cpvneg(LerpT(v0.ab, v1.ab, t)));
        /*struct MinkowskiPoint*/
        var p = Support(ctx, n);

//#if DRAW_GJK
//		ChipmunkDebugDrawSegment(v0.ab, v1.ab, RGBAColor(1, 1, 1, 1));
//		cpVect c = cpvlerp(v0.ab, v1.ab, 0.5);
//		ChipmunkDebugDrawSegment(c, cpvadd(c, cpvmult(cpvnormalize(n), 5.0)), RGBAColor(1, 0, 0, 1));
//
//		ChipmunkDebugDrawPoints(5.0, 1, &p.ab, RGBAColor(1, 1, 1, 1));
//#endif

        if (
            cpvcross(cpvsub(v1.ab, p.ab), cpvadd(v1.ab, p.ab)) > 0.0 &&
                cpvcross(cpvsub(v0.ab, p.ab), cpvadd(v0.ab, p.ab)) < 0.0
            ) {
            if (NDEBUG) {
                cpAssertWarn(iteration < WARN_GJK_ITERATIONS, "High GJK.EPA iterations: " + iteration);
            }
            // The triangle v0, p, v1 contains the origin. Use EPA to find the MSA.
            return EPA(ctx, v0, p, v1);
        } else {
            // The new point must be farther along the normal than the existing points.
            if (cpvdot(p.ab, n) <= cpfmax(cpvdot(v0.ab, n), cpvdot(v1.ab, n))) {
                if (NDEBUG) {
                    cpAssertWarn(iteration < WARN_GJK_ITERATIONS, "High GJK iterations: " + iteration);
                }
                return new ClosestPoints(v0, v1);
            } else {
                if (ClosestDist(v0.ab, p.ab) < ClosestDist(p.ab, v1.ab)) {
                    return GJKRecurse(ctx, v0, p, iteration + 1);
                } else {
                    return GJKRecurse(ctx, p, v1, iteration + 1);
                }
            }
        }
    }
}

//static struct SupportPoint
var ShapePoint = function (/*const cpShape **/shape, /*const int*/ i) {
    switch (shape.type) {
        case CP_CIRCLE_SHAPE:
        {
            return new SupportPoint((/*(cpCircleShape *)*/shape).tc, 0);
        }
        case CP_SEGMENT_SHAPE:
        {
            /*cpSegmentShape **/
            var seg = /*(cpSegmentShape *)*/shape;
            return new SupportPoint(i == 0 ? seg.ta : seg.tb, i);
        }
        case CP_POLY_SHAPE:
        {
            /*cpPolyShape **/
            var poly = /*(cpPolyShape *)*/shape;
            // Poly shapes may change vertex count.
            /*int*/
            var index = (i < poly.verts.length ? i : 0);
            return new SupportPoint(poly.tVerts[index], index);
        }
        default:
        {
            return new SupportPoint(cpvzero, 0);
        }
    }
}

//static struct ClosestPoints
var GJK = function (/*const struct SupportContext **/ctx, /*cpCollisionID **/idRef) {
//#if DRAW_GJK || DRAW_EPA
//	// draw the minkowski difference origin
//	cpVect origin = cpvzero;
//	ChipmunkDebugDrawPoints(5.0, 1, &origin, RGBAColor(1,0,0,1));
//
//	int mdiffCount = ctx.count1*ctx.count2;
//	cpVect *mdiffVerts = alloca(mdiffCount*sizeof(cpVect));
//
//	for(int i=0; i<ctx.count1; i++){
//		for(int j=0; j<ctx.count2; j++){
//			cpVect v1 = ShapePoint(ctx.count1, ctx.verts1, i).p;
//			cpVect v2 = ShapePoint(ctx.count2, ctx.verts2, j).p;
//			mdiffVerts[i*ctx.count2 + j] = cpvsub(v2, v1);
//		}
//	}
//
//	cpVect *hullVerts = alloca(mdiffCount*sizeof(cpVect));
//	int hullCount = cpConvexHull(mdiffCount, mdiffVerts, hullVerts, NULL, 0.0);
//
//	ChipmunkDebugDrawPolygon(hullCount, hullVerts, RGBAColor(1, 0, 0, 1), RGBAColor(1, 0, 0, 0.25));
//	ChipmunkDebugDrawPoints(2.0, mdiffCount, mdiffVerts, RGBAColor(1, 0, 0, 1));
//#endif

    var id = idRef.id

    /*struct MinkowskiPoint*/
    var v0, v1;
    if (id && ENABLE_CACHING) {
        v0 = new MinkoskiPoint(ShapePoint(ctx.shape1, (id >> 24) & 0xFF), ShapePoint(ctx.shape2, (id >> 16) & 0xFF));
        v1 = new MinkoskiPoint(ShapePoint(ctx.shape1, (id >> 8) & 0xFF), ShapePoint(ctx.shape2, (id    ) & 0xFF));
    } else {
        /*cpVect*/
        var axis = cpvperp(cpvsub(ctx.shape1.bb.center(), ctx.shape2.bb.center()));
        v0 = Support(ctx, axis);
        v1 = Support(ctx, cpvneg(axis));
    }

    /*struct ClosestPoints*/
    var points = GJKRecurse(ctx, v0, v1, 1);
    idRef.id = points.id;
    return points;
}

//MARK: Contact Clipping

//static inline void
var Contact1 = function (/*cpFloat*/ dist, /*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ refr, /*cpFloat*/ incr, /*cpVect*/ n, /*cpHashValue*/ hash, /*cpContact **/arr) {
    /*cpFloat*/
    var rsum = refr + incr;
    /*cpFloat*/
    var alpha = (rsum > 0.0 ? refr / rsum : 0.5);
    /*cpVect*/
    var point = cpvlerp(a, b, alpha);

    arr.push(new Contact(point, n, dist - rsum, hash));
}

//static inline int
var Contact2 = function (/*cpVect*/ refp, /*cpVect*/ inca, /*cpVect*/ incb, /*cpFloat*/ refr, /*cpFloat*/ incr, /*cpVect*/ refn, /*cpVect*/ n, /*cpHashValue*/ hash, /*cpContact **/arr) {
    /*cpFloat*/
    var cian = cpvcross(inca, refn);
    /*cpFloat*/
    var cibn = cpvcross(incb, refn);
    /*cpFloat*/
    var crpn = cpvcross(refp, refn);
    /*cpFloat*/
    var t = 1.0 - cpfclamp01((cibn - crpn) / (cibn - cian));

    /*cpVect*/
    var point = cpvlerp(inca, incb, t);
    /*cpFloat*/
    var pd = cpvdot(cpvsub(point, refp), refn);

    if (t > 0.0 && pd <= 0.0) {
        /*cpFloat*/
        var rsum = refr + incr;
        /*cpFloat*/
        var alpha = (rsum > 0.0 ? incr * (1.0 - (rsum + pd) / rsum) : -0.5 * pd);

        arr.push(new Contact(cpvadd(point, cpvmult(refn, alpha)), n, pd, hash));
        return 1;
    } else {
        return 0;
    }
}

//static inline int
var ClipContacts = function (/*const struct Edge*/ ref, /*const struct Edge*/ inc, /*const struct ClosestPoints*/ points, /*const cpFloat*/ nflip, /*cpContact **/arr) {
    /*cpVect*/
    var inc_offs = cpvmult(inc.n, inc.r);
    /*cpVect*/
    var ref_offs = cpvmult(ref.n, ref.r);

    /*cpVect*/
    var inca = cpvadd(inc.a.p, inc_offs);
    /*cpVect*/
    var incb = cpvadd(inc.b.p, inc_offs);

    /*cpVect*/
    var closest_inca = cpClosetPointOnSegment(inc.a.p, ref.a.p, ref.b.p);
    /*cpVect*/
    var closest_incb = cpClosetPointOnSegment(inc.b.p, ref.a.p, ref.b.p);

    /*cpVect*/
    var msa = cpvmult(points.n, nflip * points.d);
    /*cpFloat*/
    var cost_a = cpvdistsq(cpvsub(inc.a.p, closest_inca), msa);
    /*cpFloat*/
    var cost_b = cpvdistsq(cpvsub(inc.b.p, closest_incb), msa);

//#if DRAW_CLIP
//	ChipmunkDebugDrawSegment(ref.a.p, ref.b.p, RGBAColor(1, 0, 0, 1));
//	ChipmunkDebugDrawSegment(inc.a.p, inc.b.p, RGBAColor(0, 1, 0, 1));
//	ChipmunkDebugDrawSegment(inca, incb, RGBAColor(0, 1, 0, 1));
//
//	cpVect cref = cpvlerp(ref.a.p, ref.b.p, 0.5);
//	ChipmunkDebugDrawSegment(cref, cpvadd(cref, cpvmult(ref.n, 5.0)), RGBAColor(1, 0, 0, 1));
//
//	cpVect cinc = cpvlerp(inc.a.p, inc.b.p, 0.5);
//	ChipmunkDebugDrawSegment(cinc, cpvadd(cinc, cpvmult(inc.n, 5.0)), RGBAColor(1, 0, 0, 1));
//
//	ChipmunkDebugDrawPoints(5.0, 2, (cpVect[]){ref.a.p, inc.a.p}, RGBAColor(1, 1, 0, 1));
//	ChipmunkDebugDrawPoints(5.0, 2, (cpVect[]){ref.b.p, inc.b.p}, RGBAColor(0, 1, 1, 1));
//
//	if(cost_a < cost_b){
//		ChipmunkDebugDrawSegment(closest_inca, inc.a.p, RGBAColor(1, 0, 1, 1));
//	} else {
//		ChipmunkDebugDrawSegment(closest_incb, inc.b.p, RGBAColor(1, 0, 1, 1));
//	}
//#endif

    /*cpHashValue*/
    var hash_iarb = CP_HASH_PAIR(inc.a.hash, ref.b.hash);
    /*cpHashValue*/
    var hash_ibra = CP_HASH_PAIR(inc.b.hash, ref.a.hash);

    if (cost_a < cost_b) {
        /*cpVect*/
        var refp = cpvadd(ref.a.p, ref_offs);
        Contact1(points.d, closest_inca, inc.a.p, ref.r, inc.r, points.n, hash_iarb, arr);
        return Contact2(refp, inca, incb, ref.r, inc.r, ref.n, points.n, hash_ibra, arr) + 1;
    } else {
        /*cpVect*/
        var refp = cpvadd(ref.b.p, ref_offs);
        Contact1(points.d, closest_incb, inc.b.p, ref.r, inc.r, points.n, hash_ibra, arr);
        return Contact2(refp, incb, inca, ref.r, inc.r, ref.n, points.n, hash_iarb, arr) + 1;
    }
}

//static inline int
var ContactPoints = function (/*const struct Edge*/ e1, /*const struct Edge*/ e2, /*const struct ClosestPoints*/ points, /*cpContact **/arr) {
    /*cpFloat*/
    var mindist = e1.r + e2.r;
    if (points.d <= mindist) {
        /*cpFloat*/
        var pick = cpvdot(e1.n, points.n) + cpvdot(e2.n, points.n);

        if (
            (pick != 0.0 && pick > 0.0) ||
                // If the edges are both perfectly aligned weird things happen.
                // This is *very* common at the start of a simulation.
                // Pick the longest edge as the reference to break the tie.
                (pick == 0.0 && (cpvdistsq(e1.a.p, e1.b.p) > cpvdistsq(e2.a.p, e2.b.p)))
            ) {
            return ClipContacts(e1, e2, points, 1.0, arr);
        } else {
            return ClipContacts(e2, e1, points, -1.0, arr);
        }
    } else {
        return 0;
    }
}

//MARK: Collision Functions

//typedef int (*CollisionFunc)(const cpShape *a, const cpShape *b, cpCollisionID *id, cpContact *arr);

// Collide circle shapes.
//static int
var CircleToCircle = function (/*const cpCircleShape **/c1, /*const cpCircleShape **/c2, /*cpCollisionID **/idRef, /*cpContact **/arr) {
    return CircleToCircleQuery(c1.tc, c2.tc, c1.r, c2.r, 0, arr);
}

//static int
var CircleToSegment = function (/*const cpCircleShape **/circleShape, /*const cpSegmentShape **/segmentShape, /*cpCollisionID **/idRef, /*cpContact **/con) {
    /*cpVect*/
    var seg_a = segmentShape.ta;
    /*cpVect*/
    var seg_b = segmentShape.tb;
    /*cpVect*/
    var center = circleShape.tc;

    /*cpVect*/
    var seg_delta = cpvsub(seg_b, seg_a);
    /*cpFloat*/
    var closest_t = cpfclamp01(cpvdot(seg_delta, cpvsub(center, seg_a)) / cpvlengthsq(seg_delta));
    /*cpVect*/
    var closest = cpvadd(seg_a, cpvmult(seg_delta, closest_t));

    if (CircleToCircleQuery(center, closest, circleShape.r, segmentShape.r, 0, con)) {
        /*cpVect*/
        var n = con[0].n;

        // Reject endcap collisions if tangents are provided.
        if (
            (closest_t != 0.0 || cpvdot(n, cpvrotate(segmentShape.a_tangent, segmentShape.body.rot)) >= 0.0) &&
                (closest_t != 1.0 || cpvdot(n, cpvrotate(segmentShape.b_tangent, segmentShape.body.rot)) >= 0.0)
            ) {
            return 1;
        }
    }

    return 0;
}

//static int
var SegmentToSegment = function (/*const cpSegmentShape **/seg1, /*const cpSegmentShape **/seg2, /*cpCollisionID **/idRef, /*cpContact **/arr) {
    /*struct SupportContext*/
    var context = new SupportContext(/*(cpShape *)*/seg1, /*(cpShape *)*/seg2, /*(SupportPointFunc)*/SegmentSupportPoint, /*(SupportPointFunc)*/SegmentSupportPoint);
    /*struct ClosestPoints*/
    var points = GJK(context, idRef);

//#if DRAW_CLOSEST
//#if PRINT_LOG
////	ChipmunkDemoPrintString("Distance: %.2f\n", points.d);
//#endif
//
//	ChipmunkDebugDrawDot(6.0, points.a, RGBAColor(1, 1, 1, 1));
//	ChipmunkDebugDrawDot(6.0, points.b, RGBAColor(1, 1, 1, 1));
//	ChipmunkDebugDrawSegment(points.a, points.b, RGBAColor(1, 1, 1, 1));
//	ChipmunkDebugDrawSegment(points.a, cpvadd(points.a, cpvmult(points.n, 10.0)), RGBAColor(1, 0, 0, 1));
//#endif

    /*cpVect*/
    var n = points.n;
    /*cpVect*/
    var rot1 = seg1.body.rot;
    /*cpVect*/
    var rot2 = seg2.body.rot;
    if (
        points.d <= (seg1.r + seg2.r) &&
            (
                (!cpveql(points.a, seg1.ta) || cpvdot(n, cpvrotate(seg1.a_tangent, rot1)) <= 0.0) &&
                    (!cpveql(points.a, seg1.tb) || cpvdot(n, cpvrotate(seg1.b_tangent, rot1)) <= 0.0) &&
                    (!cpveql(points.b, seg2.ta) || cpvdot(n, cpvrotate(seg2.a_tangent, rot2)) >= 0.0) &&
                    (!cpveql(points.b, seg2.tb) || cpvdot(n, cpvrotate(seg2.b_tangent, rot2)) >= 0.0)
                )
        ) {
        return ContactPoints(SupportEdgeForSegment(seg1, n), SupportEdgeForSegment(seg2, cpvneg(n)), points, arr);
    } else {
        return 0;
    }
}

//static int
var PolyToPoly = function (/*const cpPolyShape **/poly1, /*const cpPolyShape **/poly2, /*cpCollisionID **/idRef, /*cpContact **/arr) {
    /*struct SupportContext*/
    var context = new SupportContext(/*(cpShape *)*/poly1, /*(cpShape *)*/poly2, /*(SupportPointFunc)*/PolySupportPoint, /*(SupportPointFunc)*/PolySupportPoint);
    /*struct ClosestPoints*/
    var points = GJK(context, idRef);

//#if DRAW_CLOSEST
//#if PRINT_LOG
////	ChipmunkDemoPrintString("Distance: %.2f\n", points.d);
//#endif
//
//	ChipmunkDebugDrawDot(3.0, points.a, RGBAColor(1, 1, 1, 1));
//	ChipmunkDebugDrawDot(3.0, points.b, RGBAColor(1, 1, 1, 1));
//	ChipmunkDebugDrawSegment(points.a, points.b, RGBAColor(1, 1, 1, 1));
//	ChipmunkDebugDrawSegment(points.a, cpvadd(points.a, cpvmult(points.n, 10.0)), RGBAColor(1, 0, 0, 1));
//#endif
//	console.log(points)
//    throw new Error('xxxx')
    if (points.d - poly1.r - poly2.r <= 0.0) {
        return ContactPoints(SupportEdgeForPoly(poly1, points.n), SupportEdgeForPoly(poly2, cpvneg(points.n)), points, arr);
    } else {
        return 0;
    }
}

//static int
var SegmentToPoly = function (/*const cpSegmentShape **/seg, /*const cpPolyShape **/poly, /*cpCollisionID **/id, /*cpContact **/arr) {
    /*struct SupportContext*/
    var context = new SupportContext(/*(cpShape *)*/seg, /*(cpShape *)*/poly, /*(SupportPointFunc)*/SegmentSupportPoint, /*(SupportPointFunc)*/PolySupportPoint);
    /*struct ClosestPoints*/
    var points = GJK(context, id);

//#if DRAW_CLOSEST
//#if PRINT_LOG
////	ChipmunkDemoPrintString("Distance: %.2f\n", points.d);
//#endif
//
//	ChipmunkDebugDrawDot(3.0, points.a, RGBAColor(1, 1, 1, 1));
//	ChipmunkDebugDrawDot(3.0, points.b, RGBAColor(1, 1, 1, 1));
//	ChipmunkDebugDrawSegment(points.a, points.b, RGBAColor(1, 1, 1, 1));
//	ChipmunkDebugDrawSegment(points.a, cpvadd(points.a, cpvmult(points.n, 10.0)), RGBAColor(1, 0, 0, 1));
//#endif

    // Reject endcap collisions if tangents are provided.
    /*cpVect*/
    var n = points.n;
    /*cpVect*/
    var rot = seg.body.rot;
    if (
        points.d - seg.r - poly.r <= 0.0 &&
            (
                (!cpveql(points.a, seg.ta) || cpvdot(n, cpvrotate(seg.a_tangent, rot)) <= 0.0) &&
                    (!cpveql(points.a, seg.tb) || cpvdot(n, cpvrotate(seg.b_tangent, rot)) <= 0.0)
                )
        ) {
        return ContactPoints(SupportEdgeForSegment(seg, n), SupportEdgeForPoly(poly, cpvneg(n)), points, arr);
    } else {
        return 0;
    }
}

// This one is less gross, but still gross.
// TODO: Comment me!
//static int
var CircleToPoly = function (/*const cpCircleShape **/circle, /*const cpPolyShape **/poly, /*cpCollisionID **/id, /*cpContact **/con) {
    /*struct SupportContext*/
    var context = new SupportContext(/*(cpShape *)*/circle, /*(cpShape *)*/poly, /*(SupportPointFunc)*/CircleSupportPoint, /*(SupportPointFunc)*/PolySupportPoint);
    /*struct ClosestPoints*/
    var points = GJK(context, id);

//#if DRAW_CLOSEST
//	ChipmunkDebugDrawDot(3.0, points.a, RGBAColor(1, 1, 1, 1));
//	ChipmunkDebugDrawDot(3.0, points.b, RGBAColor(1, 1, 1, 1));
//	ChipmunkDebugDrawSegment(points.a, points.b, RGBAColor(1, 1, 1, 1));
//	ChipmunkDebugDrawSegment(points.a, cpvadd(points.a, cpvmult(points.n, 10.0)), RGBAColor(1, 0, 0, 1));
//#endif

    /*cpFloat*/
    var mindist = circle.r + poly.r;
    if (points.d - mindist <= 0.0) {
        /*cpVect*/
        var p = cpvlerp(points.a, points.b, circle.r / (mindist));
        con.push(new Contact(p, points.n, points.d - mindist, 0));
        return 1;
    } else {
        return 0;
    }
}

/*static const CollisionFunc*/
var builtinCollisionFuncs = [
    /*(CollisionFunc)*/CircleToCircle,
    null,
    null,
    /*(CollisionFunc)*/CircleToSegment,
    null,
    null,
    /*(CollisionFunc)*/CircleToPoly,
    /*(CollisionFunc)*/SegmentToPoly,
    /*(CollisionFunc)*/PolyToPoly
];
/*static const CollisionFunc **/
var colfuncs = builtinCollisionFuncs;

/*static const CollisionFunc*/
var segmentCollisions = [
    /*(CollisionFunc)*/CircleToCircle,
    null,
    null,
    /*(CollisionFunc)*/CircleToSegment,
    /*(CollisionFunc)*/SegmentToSegment,
    null,
    /*(CollisionFunc)*/CircleToPoly,
    /*(CollisionFunc)*/SegmentToPoly,
    /*(CollisionFunc)*/PolyToPoly
];

//void
cp.enableSegmentToSegmentCollisions = function () {
    colfuncs = segmentCollisions;
}

//int
var cpCollideShapes = function (/*const cpShape **/a, /*const cpShape **/b, /*cpCollisionID **/idRef, /*cpContact **/arr) {
    // Their shape types must be in order.
    if (NDEBUG) {
        cpAssertSoft(a.type <= b.type, "Internal Error: Collision shapes passed to cpCollideShapes() are not sorted.");
    }

    /*CollisionFunc*/
    var cfunc = colfuncs[a.type + b.type * CP_NUM_SHAPES];
    /*int*/
    var numContacts = (cfunc ? cfunc(a, b, idRef, arr) : 0);

    if (NDEBUG) {
        cpAssertSoft(numContacts <= CP_MAX_CONTACTS_PER_ARBITER, "Internal error: Too many contact points returned.");
    }

    return numContacts;
}
