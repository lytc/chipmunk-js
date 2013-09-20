//MARK: Point Query Functions

var PointQueryContext = function (/*cpVect*/ point, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpacePointQueryFunc*/ func, /*void*/ data) {
    this.point = point;
    this.layers = layers;
    this.group = group;
    this.func = func;
    this.data = data;
};

//static cpCollisionID
var PointQuery = function (/*struct PointQueryContext*/ context, /*cpShape*/ shape, /*cpCollisionID*/ id) {
    if (
        !(shape.group && context.group == shape.group) && (context.layers & shape.layers) &&
            shape.pointQuery(context.point)
        ) {
        context.func(shape, context.data);
    }

    return id;
}

//void
Space.prototype.pointQuery = function (/*cpVect*/ point, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpacePointQueryFunc*/ func, /*void*/ data) {
    var space = this;
    /*struct PointQueryContext*/
    var context = new PointQueryContext(point, layers, group, func, data);
    /*cpBB*/
    var bb = BBNewForCircle(point, 0.0);

    space.lock();
    {
        space.activeShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/PointQuery, data);
        space.staticShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/PointQuery, data);
    }
    space.unlock(true);
}

//cpShape *
Space.prototype.pointQueryFirst = function (/*cpVect*/ point, /*cpLayers*/ layers, /*cpGroup*/ group) {
    var space = this;
    /*cpShape*/
    var outShape = null;
    space.pointQuery(point, layers, group, function (shape) {
        if (!shape.sensor) {
            outShape = shape
        }
    });

    return outShape;
}

//MARK: Nearest Point Query Functions

/*var*/
var NearestPointQueryContext = function (/*cpVect*/ point, /*cpFloat*/ maxDistance, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpaceNearestPointQueryFunc*/ func) {
    this.point = point;
    this.maxDistance = maxDistance;
    this.layers = layers;
    this.group = group;
    this.func = func;
};

//static cpCollisionID
var NearestPointQuery = function (/*struct NearestPointQueryContext*/ context, /*cpShape*/ shape, /*cpCollisionID*/ id, /*void*/ data) {
    if (
        !(shape.group && context.group == shape.group) && (context.layers & shape.layers)
        ) {
        var info = shape.nearestPointQuery(context.point);

        if (info && info.shape && info.d < context.maxDistance) context.func(shape, info.d, info.p, data);
    }

    return id;
}

//void
Space.prototype.nearestPointQuery = function (/*cpVect*/ point, /*cpFloat*/ maxDistance, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpaceNearestPointQueryFunc*/ func, /*void*/ data) {
    var space = this;
    /*struct NearestPointQueryContext*/
    var context = new NearestPointQueryContext(point, maxDistance, layers, group, func);
    /*cpBB*/
    var bb = BB.newForCircle(point, cpfmax(maxDistance, 0.0));

    space.lock();
    {
        space.activeShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/NearestPointQuery, data);
        space.staticShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/NearestPointQuery, data);
    }
    space.unlock(true);
}

//static cpCollisionID
var NearestPointQueryNearest = function (/*struct NearestPointQueryContext*/ context, /*cpShape*/ shape, /*cpCollisionID*/ id, /*cpNearestPointQueryInfo*/ out) {
    if (
        !(shape.group && context.group == shape.group) && (context.layers & shape.layers) && !shape.sensor
        ) {
        /*cpNearestPointQueryInfo*/
        var info = shape.nearestPointQuery(context.point);

        if (info && info.d < out.d) {
            _merge(out, info);
        }
    }

    return id;
}

//cpShape *
Space.prototype.nearestPointQueryNearest = function (/*cpVect*/ point, /*cpFloat*/ maxDistance, /*cpLayers*/ layers, /*cpGroup*/ group) {
    var space = this;
    /*cpNearestPointQueryInfo*/
    var info = new cpNearestPointQueryInfo(null, cpvzero, maxDistance, cpvzero);

    // @todo convert should remove it?
    /*struct NearestPointQueryContext*/
    var context = new NearestPointQueryContext(
        point, maxDistance,
        layers, group,
        null
    );

    /*cpBB*/
    var bb = BB.newForCircle(point, cpfmax(maxDistance, 0.0));
    space.activeShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/NearestPointQueryNearest, info);
    space.staticShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/NearestPointQueryNearest, info);

    return info.shape ? info : null;
}


//MARK: Segment Query Functions

/*var*/
var SegmentQueryContext = function (/*cpVect*/ start, end, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpaceSegmentQueryFunc*/ func) {
    this.start = start;
    this.end = end;
    this.layers = layers;
    this.group = group;
    this.func = func;
};

//static cpFloat
var SegmentQuery = function (/*struct SegmentQueryContext*/ context, /*cpShape*/ shape, /*void*/ data) {
    /*cpSegmentQueryInfo*/
    var info;

    if (
        !(shape.group && context.group == shape.group) && (context.layers & shape.layers) &&
            (info = shape.segmentQuery(context.start, context.end))
        ) {
        context.func(shape, info.t, info.n, data);
    }

    return 1.0;
}

//void
Space.prototype.segmentQuery = function (/*cpVect*/ start, /*cpVect*/ end, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpaceSegmentQueryFunc*/ func, /*void*/ data) {
    var space = this;
    /*struct SegmentQueryContext*/
    var context = new SegmentQueryContext(
        start, end,
        layers, group,
        func
    );

    space.lock();
    {
        space.staticShapes.segmentQuery(context, start, end, 1.0, /*cpSpatialIndexSegmentQueryFunc*/SegmentQuery, data);
        space.activeShapes.segmentQuery(context, start, end, 1.0, /*cpSpatialIndexSegmentQueryFunc*/SegmentQuery, data);
    }
    space.unlock(true);
}

//static cpFloat
var SegmentQueryFirst = function (/*struct SegmentQueryContext*/ context, /*cpShape*/ shape, /*cpSegmentQueryInfo*/ out) {
    var info;
    if (
        !(shape.group && context.group == shape.group) && (context.layers & shape.layers) && !shape.sensor &&
            (info = shape.segmentQuery(context.start, context.end)) &&
            info.t < out.t
        ) {
        _merge(out, info);
    }

    return out.t;
}

//cpShape *
Space.prototype.segmentQueryFirst = function (/*cpVect*/ start, /*cpVect*/ end, /*cpLayers*/ layers, /*cpGroup*/ group) {
    var space = this;
    /*cpSegmentQueryInfo*/
    var info = new cpSegmentQueryInfo(null, 1.0, cpvzero);

    /*struct SegmentQueryContext*/
    var context = new SegmentQueryContext(
        start, end,
        layers, group,
        null
    );

    space.staticShapes.segmentQuery(context, start, end, 1.0, /*cpSpatialIndexSegmentQueryFunc*/SegmentQueryFirst, info);
    space.activeShapes.segmentQuery(context, start, end, info.t, /*cpSpatialIndexSegmentQueryFunc*/SegmentQueryFirst, info);

    return info.shape ? info : null;
}

//MARK: BB Query Functions

/*var*/
var BBQueryContext = function (/*cpBB*/ bb, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpaceBBQueryFunc*/ func) {
    this.bb = bb;
    this.layers = layers;
    this.group = group;
    this.func = func;
};

//static cpCollisionID
var BBQuery = function (/*struct BBQueryContext*/ context, /*cpShape*/ shape, /*cpCollisionID*/ id, /*void*/ data) {
    if (
        !(shape.group && context.group == shape.group) && (context.layers & shape.layers) &&
            context.bb.intersects(shape.bb)
        ) {
        context.func(shape, data);
    }

    return id;
}

//void
Space.prototype.bBQuery = function (/*cpBB*/ bb, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpaceBBQueryFunc*/ func, /*void*/ data) {
    var space = this;
    /*struct BBQueryContext*/
    var context = new BBQueryContext(bb, layers, group, func);

    space.lock();
    {
        space.activeShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/BBQuery, data);
        space.staticShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/BBQuery, data);
    }
    space.unlock(true);
}

//MARK: Shape Query Functions

/*var*/
var ShapeQueryContext = function (/*cpSpaceShapeQueryFunc*/ func, /*void*/ data, /*cpBool*/ anyCollision) {
    this.func = func;
    this.data = data;
    this.anyCollision = anyCollision;
};

// Callback from the spatial hash.
//static cpCollisionID
var ShapeQuery = function (/*cpShape*/ a, /*cpShape*/ b, /*cpCollisionID*/ id, /*struct ShapeQueryContext*/ context) {
    // Reject any of the simple cases
    if (
        (a.group && a.group == b.group) || !(a.layers & b.layers) ||
            a == b
        ) return id;

    var contacts = [];
    /*int*/
    var numContacts = 0;

    // Shape 'a' should have the lower shape type. (required by cpCollideShapes() )
    if (a.type <= b.type) {
        cpCollideShapes(a, b, id, contacts);
        numContacts = contacts.length;
    } else {
        cpCollideShapes(b, a, id, contacts);
        numContacts = contacts.length;
        for (var i = 0; i < numContacts; i++) contacts[i].n = cpvneg(contacts[i].n);
    }

    if (numContacts) {
        context.anyCollision = !(a.sensor || b.sensor);

        if (context.func) {
            /*cpContactPointSet*/
            var set = new cpContactPointSet();
            set.count = numContacts;
            var con;
            for (var i = 0; i < numContacts; i++) {
                con = contacts[i];
                set.points[i] = new cpContactPoint(con.p, con.n, con.dist);
            }

            context.func(b, set, context.data);
        }
    }

    return id;
}

//cpBool
Space.prototype.shapeQuery = function (/*cpShape*/ shape, /*cpSpaceShapeQueryFunc*/ func, /*void*/ data) {
    var space = this;
    /*cpBody*/
    var body = shape.body;
    /*cpBB*/
    var bb = (body ? shape.update(body.p, body.rot) : shape.bb);
    /*struct ShapeQueryContext*/
    var context = new ShapeQueryContext(func, data, false);

    space.lock();
    {
        space.activeShapes.query(shape, bb, /*cpSpatialIndexQueryFunc*/ShapeQuery, context);
        space.staticShapes.query(shape, bb, /*cpSpatialIndexQueryFunc*/ShapeQuery, context);
    }
    space.unlock(true);

    return context.anyCollision;
}
