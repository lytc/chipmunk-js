//cpSpatialIndex *
var SpatialIndex = cp.SpatialIndex = function (/*cpSpatialIndexBBFunc*/ bbfunc, /*cpSpatialIndex*/ staticIndex) {
    var index = this;
    index.bbfunc = bbfunc;
    index.staticIndex = staticIndex;

    if (staticIndex) {
        cpAssertHard(!staticIndex.dynamicIndex, "This static index is already associated with a dynamic index.");
        staticIndex.dynamicIndex = index;
    }
}
//
var dynamicToStaticContext = function (/*cpSpatialIndexBBFunc*/ bbfunc, /*cpSpatialIndex*/ staticIndex, /*cpSpatialIndexQueryFunc*/ queryFunc, /*void*/ data) {
    this.bbfunc = bbfunc;
    this.staticIndex = staticIndex;
    this.queryFunc = queryFunc;
    this.data = data;
};


//static void
var dynamicToStaticIter = function (/*void*/ obj, /*dynamicToStaticContext*/ context) {
    context.staticIndex.query(obj, context.bbfunc(obj), context.queryFunc, context.data);
}

//void
SpatialIndex.prototype.collideStatic = function (/*cpSpatialIndex*/ staticIndex, /*cpSpatialIndexQueryFunc*/ func, /*void*/ data) {
    var dynamicIndex = this;
    if (staticIndex && staticIndex.count > 0) {
        /*dynamicToStaticContext*/
        var context = new dynamicToStaticContext(dynamicIndex.bbfunc, staticIndex, func, data);
        dynamicIndex.each(/*cpSpatialIndexIteratorFunc*/dynamicToStaticIter, context);
    }
}

