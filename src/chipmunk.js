
/*
 * @license
 * Copyright (c) 2007 Scott Lembcke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Chipmunk 6.2.0
var CP_VERSION_MAJOR = 6
var CP_VERSION_MINOR = 1
var CP_VERSION_RELEASE = 5

var cp = exports;
var _nothing = function () {
};

var _merge = function (dest, source) {
    for (var i in source) {
        if (source.hasOwnProperty(i)) {
            dest[i] = source[i];
        }
    }
    return dest;
}

var _extend = function (parent, child, overrides) {
    var ctor = function () {
        this.constructor = child;
    }

    ctor.prototype = parent.prototype;
    child.prototype = new ctor();

    if (overrides) {
        _merge(child.prototype, overrides)
    }

    child.__super__ = parent.prototype;
    return child;
}

var cpAssertHard = function (condition, message) {
    if (!condition) {
        console.trace()
        throw new Error(message)
    }
}

var cpAssertSoft = function (condition, message) {
    if (!condition) {
        console.trace()
        throw new Error(message);
    }
}

var cpAssertWarn = function (condition, message) {
    if (!condition) {
        console.warn(message)
    }
}

var CP_HASH_PAIR = cp.CP_HASH_PAIR = function (a, b) {
    return a < b ? a + ' ' + b : b + ' ' + a;
}

//var CP_HASH_COEF = 3344921057
//var CP_HASH_PAIR = cp.CP_HASH_PAIR = function(A, B) {
//    return /*(cpHashValue)*/A*CP_HASH_COEF ^ /*(cpHashValue)*/B*CP_HASH_COEF
//}

cp.versionString = CP_VERSION_MAJOR + "." + CP_VERSION_MINOR + "." + CP_VERSION_RELEASE;
//MARK: Misc Functions

//cpFloat
var cpMomentForCircle = cp.momentForCircle = function (/*cpFloat*/ m, /*cpFloat*/ r1, /*cpFloat*/ r2, /*cpVect*/ offset) {
    return m * (0.5 * (r1 * r1 + r2 * r2) + cpvlengthsq(offset));
}

//cpFloat
cp.areaForCircle = function (/*cpFloat*/ r1, /*cpFloat*/ r2) {
    return /*cpFloat*/M_PI * cpfabs(r1 * r1 - r2 * r2);
}

//cpFloat
var cpMomentForSegment = cp.momentForSegment = function (/*cpFloat*/ m, /*cpVect*/ a, /*cpVect*/ b) {
    /*cpVect*/
    var offset = cpvmult(cpvadd(a, b), 0.5);
    return m * (cpvdistsq(b, a) / 12.0 + cpvlengthsq(offset));
}

//cpFloat
cp.areaForSegment = function (/*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ r) {
    return r * (/*cpFloat*/M_PI * r + 2.0 * cpvdist(a, b));
}

//cpFloat
var cpMomentForPoly = cp.momentForPoly = function (/*cpFloat*/ m, /*const cpVect*/ verts, /*cpVect*/ offset) {
    var numVerts = verts.length;
    if (numVerts == 2) return cpMomentForSegment(m, verts[0], verts[1]);

    /*cpFloat*/
    var sum1 = 0.0;
    /*cpFloat*/
    var sum2 = 0.0;
    for (var i = 0; i < numVerts; i++) {
        /*cpVect*/
        var v1 = cpvadd(verts[i], offset);
        /*cpVect*/
        var v2 = cpvadd(verts[(i + 1) % numVerts], offset);

        /*cpFloat*/
        var a = cpvcross(v2, v1);
        /*cpFloat*/
        var b = cpvdot(v1, v1) + cpvdot(v1, v2) + cpvdot(v2, v2);

        sum1 += a * b;
        sum2 += a;
    }

    return (m * sum1) / (6.0 * sum2);
}

//cpFloat
cp.areaForPoly = function (/*const cpVect*/ verts) {
    /*cpFloat*/
    var area = 0.0;
    var numVerts = verts.length;
    for (var i = 0; i < numVerts; i++) {
        area += cpvcross(verts[i], verts[(i + 1) % numVerts]);
    }

    return -area / 2.0;
}

//cpVect
var cpCentroidForPoly = cp.centroidForPoly = function (/*const cpVect*/ verts) {
    /*cpFloat*/
    var sum = 0.0;
    /*cpVect*/
    var vsum = cpvzero;
    var numVerts = verts.length;

    for (/*int*/ var i = 0; i < numVerts; i++) {
        /*cpVect*/
        var v1 = verts[i];
        /*cpVect*/
        var v2 = verts[(i + 1) % numVerts];
        /*cpFloat*/
        var cross = cpvcross(v1, v2);

        sum += cross;
        vsum = cpvadd(vsum, cpvmult(cpvadd(v1, v2), cross));
    }

    return cpvmult(vsum, 1.0 / (3.0 * sum));
}

//void
cp.recenterPoly = function (/*cpVect*/ verts) {
    /*cpVect*/
    var centroid = cpCentroidForPoly(verts);

    var numVerts = verts.length;
    for (var i = 0; i < numVerts; i++) {
        verts[i] = cpvsub(verts[i], centroid);
    }
}

//cpFloat
var cpMomentForBox = cp.momentForBox = function (/*cpFloat*/ m, /*cpFloat*/ width, /*cpFloat*/ height) {
    return m * (width * width + height * height) / 12.0;
}

//cpFloat
cp.momentForBox2 = function (/*cpFloat*/ m, /*cpBB*/ box) {
    /*cpFloat*/
    var width = box.r - box.l;
    /*cpFloat*/
    var height = box.t - box.b;
    /*cpVect*/
    var offset = cpvmult(cpv(box.l + box.r, box.b + box.t), 0.5);

    // TODO NaN when offset is 0 and m is Infinity
    return cpMomentForBox(m, width, height) + m * cpvlengthsq(offset);
}

//MARK: Quick Hull

//void
var cpLoopIndexes = cp.loopIndexes = function (/*cpVect*/ verts, /*int*/ count) {
    var start = 0, end = 0;
    /*cpVect*/
    var min = verts[0];
    /*cpVect*/
    var max = min;

    for (var i = 1; i < count; i++) {
        /*cpVect*/
        var v = verts[i];

        if (v.x < min.x || (v.x == min.x && v.y < min.y)) {
            min = v;
            start = i;
        } else if (v.x > max.x || (v.x == max.x && v.y > max.y)) {
            max = v;
            end = i;
        }
    }

    return [start, end];
}


var SWAP = function (arr, i1, i2) {
    var tmp = arr[i2];
    arr[i2] = arr[i1];
    arr[i1] = tmp;
}

//static int
var QHullPartition = function (/*cpVect*/ verts, offset, /*int*/ count, /*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ tol) {
    if (count == 0) return 0;

    /*cpFloat*/
    var max = 0;
    /*int*/
    var pivot = offset;

    /*cpVect*/
    var delta = cpvsub(b, a);
    /*cpFloat*/
    var valueTol = tol * cpvlength(delta);

    /*int*/
    var head = offset;
    for (/*int*/ var tail = offset + count - 1; head <= tail;) {
        /*cpFloat*/
        var value = cpvcross(delta, cpvsub(verts[head], a));
        if (value > valueTol) {
            if (value > max) {
                max = value;
                pivot = head;
            }

            head++;
        } else {
            SWAP(verts, head, tail);
            tail--;
        }
    }

    // move the new pivot to the front if it's not already there.
    if (pivot != offset) SWAP(verts, offset, pivot);
    return head - offset;
}

//static int
var QHullReduce = function (/*cpFloat*/ tol, /*cpVect*/ verts, offset, /*int*/ count, /*cpVect*/ a, /*cpVect*/ pivot, /*cpVect*/ b, resultPos) {
    if (count < 0) {
        return 0;
    } else if (count == 0) {
        verts[resultPos] = pivot;
        return 1;
    } else {
        /*int*/
        var left_count = QHullPartition(verts, offset, count, a, pivot, tol);

        /*int*/
        var index = QHullReduce(tol, verts, offset + 1, left_count - 1, a, verts[offset], pivot, resultPos);

        verts[resultPos + index++] = pivot;

        /*int*/
        var right_count = QHullPartition(verts, offset + left_count, count - left_count, pivot, b, tol);
//        console.log(verts);
//        throw new Error('xxx')
        return index + QHullReduce(tol, verts, offset + left_count + 1, right_count - 1, pivot, verts[offset + left_count], b, resultPos + index);
    }
}

// QuickHull seemed like a neat algorithm, and efficient-ish for large input sets.
// My implementation performs an in place reduction using the result array as scratch space.
//int
cp.convexHull = function (/*int*/ count, /*cpVect*/ verts, /*cpVect*/ result, /*int*/ first, /*cpFloat*/ tol) {
    if (result) {
        // Copy the line vertexes into the empty part of the result polyline to use as a scratch buffer.
        for (var i = 0; i < verts.length; i++) {
            result[i] = verts[i];
        }
    } else {
        // If a result array was not specified, reduce the input instead.
        result = verts;
    }

    // Degenerate case, all poins are the same.
    var indexes = cpLoopIndexes(verts, count);
    var start = indexes[0], end = indexes[1];

    if (start == end) {
        return result;
    }
    SWAP(result, 0, start);
    SWAP(result, 1, end == 0 ? start : end);

    /*cpVect*/
    var a = result[0];
    /*cpVect*/
    var b = result[1];

    /*int*/
    var resultCount = QHullReduce(tol, result, 2, count - 2, a, b, a, 1) + 1;
    result.length = resultCount

    if (NDEBUG) {
        cpAssertSoft(cpPolyValidate(result, resultCount),
            "Internal error: cpConvexHull() and cpPolyValidate() did not agree." +
                "Please report this error with as much info as you can.");
    }

    return result;
}