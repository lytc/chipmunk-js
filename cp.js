/*
 * Copyright (c) 2007-2013 Scott Lembcke and Howling Moon Software
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

/*
 * Chipmunk JS 6.2.0 - Port of Chipmunk Physics
 * @author lytc
 */
(function(exports, global) {
    global["cp"] = exports;
    var NDEBUG = true;
    "use strict";
    var CP_VERSION_MAJOR = 6;
    var CP_VERSION_MINOR = 2;
    var CP_VERSION_RELEASE = 0;
    var cp = exports;
    if (typeof module != "undefined") {
        module.exports = cp;
    }
    var _nothing = function() {};
    var _merge = function(dest, source) {
        for (var i in source) {
            if (source.hasOwnProperty(i)) {
                dest[i] = source[i];
            }
        }
        return dest;
    };
    var _extend = function(parent, child, overrides) {
        var ctor = function() {
            this.constructor = child;
        };
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        if (overrides) {
            _merge(child.prototype, overrides);
        }
        child.__super__ = parent.prototype;
        return child;
    };
    var cpAssertHard = function(condition, message) {
        if (!condition) {
            console.trace();
            throw new Error(message);
        }
    };
    var cpAssertSoft = function(condition, message) {
        if (!condition) {
            console.trace();
            throw new Error(message);
        }
    };
    var cpAssertWarn = function(condition, message) {
        if (!condition) {
            console.warn(message);
        }
    };
    var CP_HASH_PAIR = cp.CP_HASH_PAIR = function(a, b) {
        return a < b ? a + " " + b : b + " " + a;
    };
    //var CP_HASH_COEF = 3344921057
    //var CP_HASH_PAIR = cp.CP_HASH_PAIR = function(A, B) {
    //    return /*(cpHashValue)*/A*CP_HASH_COEF ^ /*(cpHashValue)*/B*CP_HASH_COEF
    //}
    cp.versionString = CP_VERSION_MAJOR + "." + CP_VERSION_MINOR + "." + CP_VERSION_RELEASE;
    //MARK: Misc Functions
    //cpFloat
    var cpMomentForCircle = cp.momentForCircle = function(/*cpFloat*/ m, /*cpFloat*/ r1, /*cpFloat*/ r2, /*cpVect*/ offset) {
        return m * (.5 * (r1 * r1 + r2 * r2) + cpvlengthsq(offset));
    };
    //cpFloat
    cp.areaForCircle = function(/*cpFloat*/ r1, /*cpFloat*/ r2) {
        /*cpFloat*/
        return M_PI * cpfabs(r1 * r1 - r2 * r2);
    };
    //cpFloat
    var cpMomentForSegment = cp.momentForSegment = function(/*cpFloat*/ m, /*cpVect*/ a, /*cpVect*/ b) {
        /*cpVect*/
        var offset = cpvmult(cpvadd(a, b), .5);
        return m * (cpvdistsq(b, a) / 12 + cpvlengthsq(offset));
    };
    //cpFloat
    cp.areaForSegment = function(/*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ r) {
        return r * (/*cpFloat*/ M_PI * r + 2 * cpvdist(a, b));
    };
    //cpFloat
    var cpMomentForPoly = cp.momentForPoly = function(/*cpFloat*/ m, /*const cpVect*/ verts, /*cpVect*/ offset) {
        var numVerts = verts.length;
        if (numVerts == 2) return cpMomentForSegment(m, verts[0], verts[1]);
        /*cpFloat*/
        var sum1 = 0;
        /*cpFloat*/
        var sum2 = 0;
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
        return m * sum1 / (6 * sum2);
    };
    //cpFloat
    cp.areaForPoly = function(/*const cpVect*/ verts) {
        /*cpFloat*/
        var area = 0;
        var numVerts = verts.length;
        for (var i = 0; i < numVerts; i++) {
            area += cpvcross(verts[i], verts[(i + 1) % numVerts]);
        }
        return -area / 2;
    };
    //cpVect
    var cpCentroidForPoly = cp.centroidForPoly = function(/*const cpVect*/ verts) {
        /*cpFloat*/
        var sum = 0;
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
        return cpvmult(vsum, 1 / (3 * sum));
    };
    //void
    cp.recenterPoly = function(/*cpVect*/ verts) {
        /*cpVect*/
        var centroid = cpCentroidForPoly(verts);
        var numVerts = verts.length;
        for (var i = 0; i < numVerts; i++) {
            verts[i] = cpvsub(verts[i], centroid);
        }
    };
    //cpFloat
    var cpMomentForBox = cp.momentForBox = function(/*cpFloat*/ m, /*cpFloat*/ width, /*cpFloat*/ height) {
        return m * (width * width + height * height) / 12;
    };
    //cpFloat
    cp.momentForBox2 = function(/*cpFloat*/ m, /*cpBB*/ box) {
        /*cpFloat*/
        var width = box.r - box.l;
        /*cpFloat*/
        var height = box.t - box.b;
        /*cpVect*/
        var offset = cpvmult(new Vect(box.l + box.r, box.b + box.t), .5);
        // TODO NaN when offset is 0 and m is Infinity
        return cpMomentForBox(m, width, height) + m * cpvlengthsq(offset);
    };
    //MARK: Quick Hull
    //void
    var cpLoopIndexes = cp.loopIndexes = function(/*cpVect*/ verts, /*int*/ count) {
        var start = 0, end = 0;
        /*cpVect*/
        var min = verts[0];
        /*cpVect*/
        var max = min;
        for (var i = 1; i < count; i++) {
            /*cpVect*/
            var v = verts[i];
            if (v.x < min.x || v.x == min.x && v.y < min.y) {
                min = v;
                start = i;
            } else if (v.x > max.x || v.x == max.x && v.y > max.y) {
                max = v;
                end = i;
            }
        }
        return [ start, end ];
    };
    var SWAP = function(arr, i1, i2) {
        var tmp = arr[i2];
        arr[i2] = arr[i1];
        arr[i1] = tmp;
    };
    //static int
    var QHullPartition = function(/*cpVect*/ verts, offset, /*int*/ count, /*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ tol) {
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
        for (/*int*/ var tail = offset + count - 1; head <= tail; ) {
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
    };
    //static int
    var QHullReduce = function(/*cpFloat*/ tol, /*cpVect*/ verts, offset, /*int*/ count, /*cpVect*/ a, /*cpVect*/ pivot, /*cpVect*/ b, resultPos) {
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
    };
    // QuickHull seemed like a neat algorithm, and efficient-ish for large input sets.
    // My implementation performs an in place reduction using the result array as scratch space.
    //int
    cp.convexHull = function(/*int*/ count, /*cpVect*/ verts, /*cpVect*/ result, /*int*/ first, /*cpFloat*/ tol) {
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
        result.length = resultCount;
        if (NDEBUG) {
            cpAssertSoft(cpPolyValidate(result, resultCount), "Internal error: cpConvexHull() and cpPolyValidate() did not agree." + "Please report this error with as much info as you can.");
        }
        return result;
    };
    /// @defgroup basicTypes Basic Types
    /// Most of these types can be configured at compile time.
    /// @{
    /// Chipmunk's floating point type.
    /// Can be reconfigured at compile time.
    var cpfsqrt = cp.fsqrt = Math.sqrt;
    var cpfsin = cp.fsin = Math.sin;
    var cpfcos = cp.fcos = Math.cos;
    var cpfacos = cp.facos = Math.acos;
    var cpfatan2 = cp.fatan2 = Math.atan2;
    var cpfmod = cp.fmod = function(a, b) {
        return a % b;
    };
    var cpfexp = cp.fexp = Math.exp;
    var cpfpow = cp.fpow = Math.pow;
    var cpffloor = cp.ffloor = Math.floor;
    var CPFLOAT_MIN = 2.225074e-308;
    var M_PI = Math.PI;
    /// Return the max of two cpFloats.
    //cpFloat
    var isFF = global.navigator && global.navigator.userAgent.indexOf("Firefox") != -1;
    var cpfmax = cp.fmax = isFF ? Math.max : function(/*cpFloat*/ a, /*cpFloat*/ b) {
        return a > b ? a : b;
    };
    /// Return the min of two cpFloats.
    //cpFloat
    var cpfmin = cp.fmin = isFF ? Math.min : function(/*cpFloat*/ a, /*cpFloat*/ b) {
        return a < b ? a : b;
    };
    /// Return the absolute value of a cpFloat.
    //cpFloat
    var cpfabs = cp.fabs = function(/*cpFloat*/ f) {
        return f < 0 ? -f : f;
    };
    /// Clamp @c f to be between @c min and @c max.
    //cpFloat
    var cpfclamp = cp.fclamp = function(/*cpFloat*/ f, /*cpFloat*/ min, /*cpFloat*/ max) {
        return cpfmin(cpfmax(f, min), max);
    };
    /// Clamp @c f to be between 0 and 1.
    //cpFloat
    var cpfclamp01 = function(/*cpFloat*/ f) {
        return cpfmax(0, cpfmin(f, 1));
    };
    /// Linearly interpolate (or extrapolate) between @c f1 and @c f2 by @c t percent.
    //cpFloat
    cp.flerp = function(/*cpFloat*/ f1, /*cpFloat*/ f2, /*cpFloat*/ t) {
        return f1 * (1 - t) + f2 * t;
    };
    /// Linearly interpolate from @c f1 to @c f2 by no more than @c d.
    //cpFloat
    cp.flerpconst = function(/*cpFloat*/ f1, /*cpFloat*/ f2, /*cpFloat*/ d) {
        return f1 + cpfclamp(f2 - f1, -d, d);
    };
    /// Value for cpShape.group signifying that a shape is in no group.
    var CP_NO_GROUP = cp.NO_GROUP = 0;
    /// Value for cpShape.layers signifying that a shape is in every layer.
    var CP_ALL_LAYERS = cp.ALL_LAYERS = ~0;
    //
    var Mat2x2 = function(/*cpFloat*/ a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    };
    var Vect = cp.Vect = function(x, y) {
        this.x = x;
        this.y = y;
    };
    var cpv = cp.v = function(x, y) {
        return {
            x: x,
            y: y
        };
    };
    /// Constant for the zero vector.
    /*cpVect*/
    var cpvzero = cp.vzero = new Vect(0, 0);
    /// Check if two vectors are equal. (Be careful when comparing floating point numbers!)
    //cpBool
    var cpveql = cp.v.eql = function(/*const cpVect*/ v1, /*const cpVect*/ v2) {
        return v1.x == v2.x && v1.y == v2.y;
    };
    /// Add two vectors
    //cpVect
    var cpvadd = cp.v.add = function(/*const cpVect*/ v1, /*const cpVect*/ v2) {
        return new Vect(v1.x + v2.x, v1.y + v2.y);
    };
    /// Subtract two vectors.
    //cpVect
    var cpvsub = cp.v.sub = function(/*const cpVect*/ v1, /*const cpVect*/ v2) {
        return new Vect(v1.x - v2.x, v1.y - v2.y);
    };
    /// Negate a vector.
    //cpVect
    var cpvneg = cp.v.neg = function(/*const cpVect*/ v) {
        return new Vect(-v.x, -v.y);
    };
    /// Scalar multiplication.
    //cpVect
    var cpvmult = cp.v.mult = function(/*const cpVect*/ v, /*const cpFloat*/ s) {
        return new Vect(v.x * s, v.y * s);
    };
    /// Vector dot product.
    //cpFloat
    var cpvdot = cp.v.dot = function(/*const cpVect*/ v1, /*const cpVect*/ v2) {
        return v1.x * v2.x + v1.y * v2.y;
    };
    /// 2D vector cross product analog.
    /// The cross product of 2D vectors results in a 3D vector with only a z component.
    /// This function returns the magnitude of the z value.
    //cpFloat
    var cpvcross = cp.v.cross = function(/*const cpVect*/ v1, /*const cpVect*/ v2) {
        return v1.x * v2.y - v1.y * v2.x;
    };
    /// Returns a perpendicular vector. (90 degree rotation)
    //cpVect
    var cpvperp = cp.v.perp = function(/*const cpVect*/ v) {
        return new Vect(-v.y, v.x);
    };
    /// Returns a perpendicular vector. (-90 degree rotation)
    //cpVect
    cp.v.rperp = function(/*const cpVect*/ v) {
        return new Vect(v.y, -v.x);
    };
    /// Returns the vector projection of v1 onto v2.
    //cpVect
    var cpvproject = cp.v.project = function(/*const cpVect*/ v1, /*const cpVect*/ v2) {
        //	return cpvmult(v2, cpvdot(v1, v2)/cpvdot(v2, v2));
        var f = (v1.x * v2.x + v1.y * v2.y) / (v2.x * v2.x + v2.y * v2.y);
        return new Vect(v2.x * f, v2.y * f);
    };
    /// Returns the unit length vector for the given angle (in radians).
    //cpVect
    cp.v.forangle = function(/*const cpFloat*/ a) {
        return new Vect(cpfcos(a), cpfsin(a));
    };
    /// Returns the angular direction v is pointing in (in radians).
    //cpFloat
    cp.v.toangle = function(/*const cpVect*/ v) {
        return cpfatan2(v.y, v.x);
    };
    /// Uses complex number multiplication to rotate v1 by v2. Scaling will occur if v1 is not a unit vector.
    //cpVect
    var cpvrotate = cp.v.rotate = function(/*const cpVect*/ v1, /*const cpVect*/ v2) {
        return new Vect(v1.x * v2.x - v1.y * v2.y, v1.x * v2.y + v1.y * v2.x);
    };
    /// Inverse of cpvrotate().
    //cpVect
    var cpvunrotate = cp.v.unrotate = function(/*const cpVect*/ v1, /*const cpVect*/ v2) {
        return new Vect(v1.x * v2.x + v1.y * v2.y, v1.y * v2.x - v1.x * v2.y);
    };
    /// Returns the squared length of v. Faster than cpvlength() when you only need to compare lengths.
    //cpFloat
    var cpvlengthsq = cp.v.lengthsq = function(/*const cpVect*/ v) {
        //	return cpvdot(v, v);
        return v.x * v.x + v.y * v.y;
    };
    /// Returns the length of v.
    //cpFloat
    var cpvlength = cp.v.len = function(/*const cpVect*/ v) {
        //	return cpfsqrt(cpvdot(v, v));
        return cpfsqrt(v.x * v.x + v.y * v.y);
    };
    /// Linearly interpolate between v1 and v2.
    //cpVect
    var cpvlerp = cp.v.lerp = function(/*const cpVect*/ v1, /*const cpVect*/ v2, /*const cpFloat*/ t) {
        //	return cpvadd(cpvmult(v1, 1.0 - t), cpvmult(v2, t));
        var t2 = 1 - t;
        return new Vect(v1.x * t2 + v2.x * t, v1.y * t2 + v2.y * t);
    };
    /// Returns a normalized copy of v.
    //cpVect
    var cpvnormalize = cp.v.normalize = function(/*const cpVect*/ v) {
        // Neat trick I saw somewhere to avoid div/0.
        //	return cpvmult(v, 1.0/(cpvlength(v) + CPFLOAT_MIN));
        var f = cpfsqrt(v.x * v.x + v.y * v.y) + CPFLOAT_MIN;
        return new Vect(v.x / f, v.y / f);
    };
    /// @deprecated Just an alias for cpvnormalize() now.
    //cpVect
    cp.v.normalize_safe = function(/*const cpVect*/ v) {
        return cpvnormalize(v);
    };
    /// Clamp v to length len.
    //cpVect
    var cpvclamp = cp.v.clamp = function(/*const cpVect*/ v, /*const cpFloat*/ len) {
        //	return (cpvdot(v,v) > len*len) ? cpvmult(cpvnormalize(v), len) : v;
        var vlenSq = v.x * v.x + v.y * v.y;
        if (vlenSq > len * len) {
            var f = cpfsqrt(vlenSq) + CPFLOAT_MIN;
            return new Vect(v.x * len / f, v.y * len / f);
        }
        return v;
    };
    /// Linearly interpolate between v1 towards v2 by distance d.
    //cpVect
    cp.v.lerpconst = function(/*cpVect*/ v1, /*cpVect*/ v2, /*cpFloat*/ d) {
        return cpvadd(v1, cpvclamp(cpvsub(v2, v1), d));
    };
    /// Returns the distance between v1 and v2.
    //cpFloat
    var cpvdist = cp.v.dist = function(/*const cpVect*/ v1, /*const cpVect*/ v2) {
        //    return cpvlength(cpvsub(v1, v2));
        var x = v1.x - v2.x;
        var y = v1.y - v2.y;
        return cpfsqrt(x * x + y * y);
    };
    /// Returns the squared distance between v1 and v2. Faster than cpvdist() when you only need to compare distances.
    //cpFloat
    var cpvdistsq = cp.v.distsq = function(/*const cpVect*/ v1, /*const cpVect*/ v2) {
        //    return cpvlengthsq(cpvsub(v1, v2));
        var x = v1.x - v2.x;
        var y = v1.y - v2.y;
        return x * x + y * y;
    };
    /// Returns true if the distance between v1 and v2 is less than dist.
    //cpBool
    cp.v.near = function(/*const cpVect*/ v1, /*const cpVect*/ v2, /*const cpFloat*/ dist) {
        return cpvdistsq(v1, v2) < dist * dist;
    };
    /// @}
    /// @defgroup cpMat2x2 cpMat2x2
    /// 2x2 matrix type used for tensors and such.
    /// @{
    //static inline cpVect
    Mat2x2.prototype.transform = function(/*cpVect*/ v) {
        var m = this;
        return new Vect(v.x * m.a + v.y * m.b, v.x * m.c + v.y * m.d);
    };
    //cpVect
    var cpvslerp = cp.v.slerp = function(/*const cpVect*/ v1, /*const cpVect*/ v2, /*const cpFloat*/ t) {
        /*cpFloat*/
        var dot = cpvdot(cpvnormalize(v1), cpvnormalize(v2));
        /*cpFloat*/
        var omega = cpfacos(cpfclamp(dot, -1, 1));
        if (omega < .001) {
            // If the angle between two vectors is very small, lerp instead to avoid precision issues.
            return cpvlerp(v1, v2, t);
        } else {
            /*cpFloat*/
            var denom = 1 / cpfsin(omega);
            return cpvadd(cpvmult(v1, cpfsin((1 - t) * omega) * denom), cpvmult(v2, cpfsin(t * omega) * denom));
        }
    };
    //cpVect
    cp.v.slerpconst = function(/*const cpVect*/ v1, /*const cpVect*/ v2, /*const cpFloat*/ a) {
        /*cpFloat*/
        var dot = cpvdot(cpvnormalize(v1), cpvnormalize(v2));
        /*cpFloat*/
        var omega = cpfacos(cpfclamp(dot, -1, 1));
        return cpvslerp(v1, v2, cpfmin(a, omega) / omega);
    };
    //char*
    cp.v.str = function(/*const cpVect*/ v) {
        return "(" + v.x + ", " + v.y + ")";
    };
    //void
    var Constraint = cp.Constraint = function(/*cpBody*/ a, /*cpBody*/ b) {
        var constraint = this;
        constraint.a = a;
        constraint.b = b;
        constraint.space = null;
        constraint.next_a = null;
        constraint.next_b = null;
        constraint.maxForce = Infinity;
        constraint.errorBias = cpfpow(1 - .1, 60);
        constraint.maxBias = Infinity;
    };
    //Constraint.prototype.applyCachedImpulse = function(/*cpFloat*/ dt_coef) {}
    Constraint.prototype.preSolve = _nothing;
    Constraint.prototype.postSolve = _nothing;
    Constraint.prototype.applyCachedImpulse = _nothing;
    //static cpFloat
    var defaultSpringTorque = function(/*cpDampedRotarySpring*/ spring, /*cpFloat*/ relativeAngle) {
        return (relativeAngle - spring.restAngle) * spring.stiffness;
    };
    //cpDampedRotarySpring *
    var DampedRotarySpring = cp.DampedRotarySpring = function(/*cpBody*/ a, /*cpBody*/ b, /*cpFloat*/ restAngle, /*cpFloat*/ stiffness, /*cpFloat*/ damping) {
        Constraint.apply(this, arguments);
        var spring = this;
        spring.restAngle = restAngle;
        spring.stiffness = stiffness;
        spring.damping = damping;
        spring.springTorqueFunc = /*(cpDampedRotarySpringTorqueFunc)*/ defaultSpringTorque;
        spring.jAcc = 0;
    };
    _extend(Constraint, DampedRotarySpring);
    //static void
    DampedRotarySpring.prototype.preStep = function(/*cpFloat*/ dt) {
        var spring = this;
        /*cpBody*/
        var a = spring.a;
        /*cpBody*/
        var b = spring.b;
        /*cpFloat*/
        var moment = a.i_inv + b.i_inv;
        if (NDEBUG) {
            cpAssertSoft(moment != 0, "Unsolvable spring.");
        }
        spring.iSum = 1 / moment;
        spring.w_coef = 1 - cpfexp(-spring.damping * dt * moment);
        spring.target_wrn = 0;
        // apply spring torque
        /*cpFloat*/
        var j_spring = spring.springTorqueFunc(/*cpConstraint*/ spring, a.a - b.a) * dt;
        spring.jAcc = j_spring;
        a.w -= j_spring * a.i_inv;
        b.w += j_spring * b.i_inv;
    };
    //static void
    DampedRotarySpring.prototype.applyImpulse = function(/*cpFloat*/ dt) {
        var spring = this;
        /*cpBody*/
        var a = spring.a;
        /*cpBody*/
        var b = spring.b;
        // compute relative velocity
        /*cpFloat*/
        var wrn = a.w - b.w;
        //normal_relative_velocity(a, b, r1, r2, n) - spring.target_vrn;
        // compute velocity loss from drag
        // not 100% certain this is derived correctly, though it makes sense
        /*cpFloat*/
        var w_damp = (spring.target_wrn - wrn) * spring.w_coef;
        spring.target_wrn = wrn + w_damp;
        //apply_impulses(a, b, spring.r1, spring.r2, cpvmult(spring.n, v_damp*spring.nMass));
        /*cpFloat*/
        var j_damp = w_damp * spring.iSum;
        spring.jAcc += j_damp;
        a.w += j_damp * a.i_inv;
        b.w -= j_damp * b.i_inv;
    };
    //static cpFloat
    DampedRotarySpring.prototype.getImpulse = function() {
        return this.jAcc;
    };
    //static cpFloat
    var defaultSpringForce = function(/*cpDampedSpring **/ spring, /*cpFloat*/ dist) {
        return (spring.restLength - dist) * spring.stiffness;
    };
    //cpDampedSpring *
    var DampedSpring = cp.DampedSpring = function(/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ anchr1, /*cpVect*/ anchr2, /*cpFloat*/ restLength, /*cpFloat*/ stiffness, /*cpFloat*/ damping) {
        Constraint.apply(this, arguments);
        var spring = this;
        spring.anchr1 = anchr1;
        spring.anchr2 = anchr2;
        spring.restLength = restLength;
        spring.stiffness = stiffness;
        spring.damping = damping;
        spring.springForceFunc = /*(cpDampedSpringForceFunc)*/ defaultSpringForce;
        spring.jAcc = 0;
    };
    _extend(Constraint, DampedSpring);
    //static void
    DampedSpring.prototype.preStep = function(/*cpFloat*/ dt) {
        var spring = this;
        /*cpBody*/
        var a = spring.a;
        /*cpBody*/
        var b = spring.b;
        spring.r1 = cpvrotate(spring.anchr1, a.rot);
        spring.r2 = cpvrotate(spring.anchr2, b.rot);
        /*cpVect*/
        var delta = cpvsub(cpvadd(b.p, spring.r2), cpvadd(a.p, spring.r1));
        /*cpFloat*/
        var dist = cpvlength(delta);
        spring.n = cpvmult(delta, 1 / (dist ? dist : Infinity));
        /*cpFloat*/
        var k = k_scalar(a, b, spring.r1, spring.r2, spring.n);
        if (NDEBUG) {
            cpAssertSoft(k != 0, "Unsolvable spring.");
        }
        spring.nMass = 1 / k;
        spring.target_vrn = 0;
        spring.v_coef = 1 - cpfexp(-spring.damping * dt * k);
        // apply spring force
        /*cpFloat*/
        var f_spring = spring.springForceFunc(/*cpConstraint*/ spring, dist);
        /*cpFloat*/
        var j_spring = spring.jAcc = f_spring * dt;
        apply_impulses(a, b, spring.r1, spring.r2, cpvmult(spring.n, j_spring));
    };
    //static void
    DampedSpring.prototype.applyImpulse = function(/*cpFloat*/ dt) {
        var spring = this;
        /*cpBody*/
        var a = spring.a;
        /*cpBody*/
        var b = spring.b;
        /*cpVect*/
        var n = spring.n;
        /*cpVect*/
        var r1 = spring.r1;
        /*cpVect*/
        var r2 = spring.r2;
        // compute relative velocity
        /*cpFloat*/
        var vrn = normal_relative_velocity(a, b, r1, r2, n);
        // compute velocity loss from drag
        /*cpFloat*/
        var v_damp = (spring.target_vrn - vrn) * spring.v_coef;
        spring.target_vrn = vrn + v_damp;
        /*cpFloat*/
        var j_damp = v_damp * spring.nMass;
        spring.jAcc += j_damp;
        apply_impulses(a, b, spring.r1, spring.r2, cpvmult(spring.n, j_damp));
    };
    //static cpFloat
    DampedSpring.prototype.getImpulse = function() {
        return this.jAcc;
    };
    //cpGearJoint *
    var GearJoint = cp.GearJoint = function(/*cpBody*/ a, /*cpBody*/ b, /*cpFloat*/ phase, /*cpFloat*/ ratio) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.phase = phase;
        joint.ratio = ratio;
        joint.ratio_inv = 1 / ratio;
        joint.jAcc = 0;
    };
    _extend(Constraint, GearJoint);
    //static void
    GearJoint.prototype.preStep = function(/*cpFloat*/ dt) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        // calculate moment of inertia coefficient.
        joint.iSum = 1 / (a.i_inv * joint.ratio_inv + joint.ratio * b.i_inv);
        // calculate bias velocity
        /*cpFloat*/
        var maxBias = joint.maxBias;
        joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * (b.a * joint.ratio - a.a - joint.phase) / dt, -maxBias, maxBias);
    };
    //static void
    GearJoint.prototype.applyCachedImpulse = function(/*cpFloat*/ dt_coef) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        /*cpFloat*/
        var j = joint.jAcc * dt_coef;
        a.w -= j * a.i_inv * joint.ratio_inv;
        b.w += j * b.i_inv;
    };
    //static void
    GearJoint.prototype.applyImpulse = function(/*cpFloat*/ dt) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        // compute relative rotational velocity
        /*cpFloat*/
        var wr = b.w * joint.ratio - a.w;
        /*cpFloat*/
        var jMax = joint.maxForce * dt;
        // compute normal impulse
        /*cpFloat*/
        var j = (joint.bias - wr) * joint.iSum;
        /*cpFloat*/
        var jOld = joint.jAcc;
        joint.jAcc = cpfclamp(jOld + j, -jMax, jMax);
        j = joint.jAcc - jOld;
        // apply impulse
        a.w -= j * a.i_inv * joint.ratio_inv;
        b.w += j * b.i_inv;
    };
    //static cpFloat
    GearJoint.prototype.getImpulse = function() {
        var joint = this;
        return cpfabs(joint.jAcc);
    };
    //void
    GearJoint.prototype.setRatio = function(/*cpFloat*/ value) {
        var constraint = this;
        constraint.ratio = value;
        constraint.ratio_inv = 1 / value;
        constraint.activateBodies();
    };
    //cpGrooveJoint *
    var GrooveJoint = cp.GrooveJoint = function(/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ groove_a, /*cpVect*/ groove_b, /*cpVect*/ anchr2) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.grv_a = groove_a;
        joint.grv_b = groove_b;
        joint.grv_n = cpvperp(cpvnormalize(cpvsub(groove_b, groove_a)));
        joint.anchr2 = anchr2;
        joint.jAcc = cpvzero;
    };
    _extend(Constraint, GrooveJoint);
    //static void
    GrooveJoint.prototype.preStep = function(/*cpFloat*/ dt) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        // calculate endpoints in worldspace
        /*cpVect*/
        var ta = a.local2World(joint.grv_a);
        /*cpVect*/
        var tb = a.local2World(joint.grv_b);
        // calculate axis
        /*cpVect*/
        var n = cpvrotate(joint.grv_n, a.rot);
        /*cpFloat*/
        var d = cpvdot(ta, n);
        joint.grv_tn = n;
        joint.r2 = cpvrotate(joint.anchr2, b.rot);
        // calculate tangential distance along the axis of r2
        /*cpFloat*/
        var td = cpvcross(cpvadd(b.p, joint.r2), n);
        // calculate clamping factor and r2
        if (td <= cpvcross(ta, n)) {
            joint.clamp = 1;
            joint.r1 = cpvsub(ta, a.p);
        } else if (td >= cpvcross(tb, n)) {
            joint.clamp = -1;
            joint.r1 = cpvsub(tb, a.p);
        } else {
            joint.clamp = 0;
            joint.r1 = cpvsub(cpvadd(cpvmult(cpvperp(n), -td), cpvmult(n, d)), a.p);
        }
        // Calculate mass tensor
        joint.k = k_tensor(a, b, joint.r1, joint.r2);
        // calculate bias velocity
        /*cpVect*/
        var delta = cpvsub(cpvadd(b.p, joint.r2), cpvadd(a.p, joint.r1));
        joint.bias = cpvclamp(cpvmult(delta, -bias_coef(joint.errorBias, dt) / dt), joint.maxBias);
    };
    //static void
    GrooveJoint.prototype.applyCachedImpulse = function(/*cpFloat*/ dt_coef) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        apply_impulses(a, b, joint.r1, joint.r2, cpvmult(joint.jAcc, dt_coef));
    };
    //static inline cpVect
    GrooveJoint.prototype.grooveConstrain = function(/*cpVect*/ j, /*cpFloat*/ dt) {
        var joint = this;
        /*cpVect*/
        var n = joint.grv_tn;
        /*cpVect*/
        var jClamp = joint.clamp * cpvcross(j, n) > 0 ? j : cpvproject(j, n);
        return cpvclamp(jClamp, joint.maxForce * dt);
    };
    //static void
    GrooveJoint.prototype.applyImpulse = function(/*cpFloat*/ dt) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        /*cpVect*/
        var r1 = joint.r1;
        /*cpVect*/
        var r2 = joint.r2;
        // compute impulse
        /*cpVect*/
        var vr = relative_velocity(a, b, r1, r2);
        /*cpVect*/
        var j = joint.k.transform(cpvsub(joint.bias, vr));
        /*cpVect*/
        var jOld = joint.jAcc;
        joint.jAcc = joint.grooveConstrain(cpvadd(jOld, j), dt);
        j = cpvsub(joint.jAcc, jOld);
        // apply impulse
        apply_impulses(a, b, joint.r1, joint.r2, j);
    };
    //static cpFloat
    GrooveJoint.prototype.getImpulse = function() {
        return cpvlength(this.jAcc);
    };
    //void
    GrooveJoint.prototype.setGrooveA = function(/*cpVect*/ value) {
        /*cpGrooveJoint*/
        var g = this;
        g.grv_a = value;
        g.grv_n = cpvperp(cpvnormalize(cpvsub(g.grv_b, value)));
        g.activateBodies();
    };
    //void
    GrooveJoint.prototype.setGrooveB = function(/*cpVect*/ value) {
        /*cpGrooveJoint*/
        var g = this;
        g.grv_b = value;
        g.grv_n = cpvperp(cpvnormalize(cpvsub(value, g.grv_a)));
        g.activateBodies();
    };
    //cpPinJoint *
    var PinJoint = cp.PinJoint = function(/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ anchr1, /*cpVect*/ anchr2) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.anchr1 = anchr1;
        joint.anchr2 = anchr2;
        // STATIC_BODY_CHECK
        /*cpVect*/
        var p1 = a ? cpvadd(a.p, cpvrotate(anchr1, a.rot)) : anchr1;
        /*cpVect*/
        var p2 = b ? cpvadd(b.p, cpvrotate(anchr2, b.rot)) : anchr2;
        joint.dist = cpvlength(cpvsub(p2, p1));
        if (NDEBUG) {
            cpAssertWarn(joint.dist > 0, "You created a 0 length pin joint. A pivot joint will be much more stable.");
        }
        joint.jnAcc = 0;
    };
    _extend(Constraint, PinJoint);
    //static void
    PinJoint.prototype.preStep = function(/*cpFloat*/ dt) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        joint.r1 = cpvrotate(joint.anchr1, a.rot);
        joint.r2 = cpvrotate(joint.anchr2, b.rot);
        /*cpVect*/
        var delta = cpvsub(cpvadd(b.p, joint.r2), cpvadd(a.p, joint.r1));
        /*cpFloat*/
        var dist = cpvlength(delta);
        joint.n = cpvmult(delta, 1 / (dist ? dist : Infinity));
        // calculate mass normal
        joint.nMass = 1 / k_scalar(a, b, joint.r1, joint.r2, joint.n);
        // calculate bias velocity
        /*cpFloat*/
        var maxBias = joint.maxBias;
        joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * (dist - joint.dist) / dt, -maxBias, maxBias);
    };
    //static void
    PinJoint.prototype.applyCachedImpulse = function(/*cpFloat*/ dt_coef) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        /*cpVect*/
        var j = cpvmult(joint.n, joint.jnAcc * dt_coef);
        apply_impulses(a, b, joint.r1, joint.r2, j);
    };
    //static void
    PinJoint.prototype.applyImpulse = function(/*cpFloat*/ dt) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        /*cpVect*/
        var n = joint.n;
        // compute relative velocity
        /*cpFloat*/
        var vrn = normal_relative_velocity(a, b, joint.r1, joint.r2, n);
        /*cpFloat*/
        var jnMax = joint.maxForce * dt;
        // compute normal impulse
        /*cpFloat*/
        var jn = (joint.bias - vrn) * joint.nMass;
        /*cpFloat*/
        var jnOld = joint.jnAcc;
        joint.jnAcc = cpfclamp(jnOld + jn, -jnMax, jnMax);
        jn = joint.jnAcc - jnOld;
        // apply impulse
        apply_impulses(a, b, joint.r1, joint.r2, cpvmult(n, jn));
    };
    //static cpFloat
    PinJoint.prototype.getImpulse = function() {
        return cpfabs(this.jnAcc);
    };
    //cpPivotJoint *
    var PivotJoint = cp.PivotJoint = function(/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ anchr1, /*cpVect*/ anchr2) {
        Constraint.apply(this, arguments);
        var joint = this;
        if (!anchr2) {
            var pivot = anchr1;
            /*cpVect*/
            anchr1 = a ? a.world2Local(pivot) : pivot;
            /*cpVect*/
            anchr2 = b ? b.world2Local(pivot) : pivot;
        }
        joint.anchr1 = anchr1;
        joint.anchr2 = anchr2;
        joint.jAcc = cpvzero;
    };
    _extend(Constraint, PivotJoint);
    //static void
    PivotJoint.prototype.preStep = function(/*cpFloat*/ dt) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        joint.r1 = cpvrotate(joint.anchr1, a.rot);
        joint.r2 = cpvrotate(joint.anchr2, b.rot);
        // Calculate mass tensor
        joint.k = k_tensor(a, b, joint.r1, joint.r2);
        // calculate bias velocity
        /*cpVect*/
        var delta = cpvsub(cpvadd(b.p, joint.r2), cpvadd(a.p, joint.r1));
        joint.bias = cpvclamp(cpvmult(delta, -bias_coef(joint.errorBias, dt) / dt), joint.maxBias);
    };
    //static void
    PivotJoint.prototype.applyCachedImpulse = function(/*cpFloat*/ dt_coef) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        apply_impulses(a, b, joint.r1, joint.r2, cpvmult(joint.jAcc, dt_coef));
    };
    //static void
    PivotJoint.prototype.applyImpulse = function(/*cpFloat*/ dt) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        /*cpVect*/
        var r1 = joint.r1;
        /*cpVect*/
        var r2 = joint.r2;
        // compute relative velocity
        /*cpVect*/
        var vr = relative_velocity(a, b, r1, r2);
        // compute normal impulse
        /*cpVect*/
        var j = joint.k.transform(cpvsub(joint.bias, vr));
        /*cpVect*/
        var jOld = joint.jAcc;
        joint.jAcc = cpvclamp(cpvadd(joint.jAcc, j), joint.maxForce * dt);
        j = cpvsub(joint.jAcc, jOld);
        // apply impulse
        apply_impulses(a, b, joint.r1, joint.r2, j);
    };
    //static cpFloat
    PivotJoint.prototype.getImpulse = function() {
        return cpvlength(this.jAcc);
    };
    //cpRatchetJoint *
    var RatchetJoint = cp.RatchetJoint = function(/*cpBody*/ a, /*cpBody*/ b, /*cpFloat*/ phase, /*cpFloat*/ ratchet) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.angle = 0;
        joint.phase = phase;
        joint.ratchet = ratchet;
        // STATIC_BODY_CHECK
        joint.angle = (b ? b.a : 0) - (a ? a.a : 0);
    };
    _extend(Constraint, RatchetJoint);
    //static void
    RatchetJoint.prototype.preStep = function(/*cpFloat*/ dt) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        /*cpFloat*/
        var angle = joint.angle;
        /*cpFloat*/
        var phase = joint.phase;
        /*cpFloat*/
        var ratchet = joint.ratchet;
        /*cpFloat*/
        var delta = b.a - a.a;
        /*cpFloat*/
        var diff = angle - delta;
        /*cpFloat*/
        var pdist = 0;
        if (diff * ratchet > 0) {
            pdist = diff;
        } else {
            joint.angle = cpffloor((delta - phase) / ratchet) * ratchet + phase;
        }
        // calculate moment of inertia coefficient.
        joint.iSum = 1 / (a.i_inv + b.i_inv);
        // calculate bias velocity
        /*cpFloat*/
        var maxBias = joint.maxBias;
        joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * pdist / dt, -maxBias, maxBias);
        // If the bias is 0, the joint is not at a limit. Reset the impulse.
        if (!joint.bias) joint.jAcc = 0;
    };
    //static void
    RatchetJoint.prototype.applyCachedImpulse = function(/*cpFloat*/ dt_coef) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        /*cpFloat*/
        var j = joint.jAcc * dt_coef;
        a.w -= j * a.i_inv;
        b.w += j * b.i_inv;
    };
    //static void
    RatchetJoint.prototype.applyImpulse = function(/*cpFloat*/ dt) {
        var joint = this;
        if (!joint.bias) return;
        // early exit
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        // compute relative rotational velocity
        /*cpFloat*/
        var wr = b.w - a.w;
        /*cpFloat*/
        var ratchet = joint.ratchet;
        /*cpFloat*/
        var jMax = joint.maxForce * dt;
        // compute normal impulse
        /*cpFloat*/
        var j = -(joint.bias + wr) * joint.iSum;
        /*cpFloat*/
        var jOld = joint.jAcc;
        joint.jAcc = cpfclamp((jOld + j) * ratchet, 0, jMax * cpfabs(ratchet)) / ratchet;
        j = joint.jAcc - jOld;
        // apply impulse
        a.w -= j * a.i_inv;
        b.w += j * b.i_inv;
    };
    //static cpFloat
    RatchetJoint.prototype.getImpulse = function() {
        return cpfabs(this.jAcc);
    };
    //cpRotaryLimitJoint *
    var RotaryLimitJoint = cp.RotaryLimitJoint = function(/*cpBody*/ a, /*cpBody*/ b, /*cpFloat*/ min, /*cpFloat*/ max) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.min = min;
        joint.max = max;
        return joint;
    };
    _extend(Constraint, RotaryLimitJoint);
    //static void
    RotaryLimitJoint.prototype.preStep = function(/*cpFloat*/ dt) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        /*cpFloat*/
        var dist = b.a - a.a;
        /*cpFloat*/
        var pdist = 0;
        if (dist > joint.max) {
            pdist = joint.max - dist;
        } else if (dist < joint.min) {
            pdist = joint.min - dist;
        }
        // calculate moment of inertia coefficient.
        joint.iSum = 1 / (1 / a.i + 1 / b.i);
        // calculate bias velocity
        /*cpFloat*/
        var maxBias = joint.maxBias;
        joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * pdist / dt, -maxBias, maxBias);
        // If the bias is 0, the joint is not at a limit. Reset the impulse.
        if (!joint.bias) joint.jAcc = 0;
    };
    //static void
    RotaryLimitJoint.prototype.applyCachedImpulse = function(/*cpFloat*/ dt_coef) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        /*cpFloat*/
        var j = joint.jAcc * dt_coef;
        a.w -= j * a.i_inv;
        b.w += j * b.i_inv;
    };
    //static void
    RotaryLimitJoint.prototype.applyImpulse = function(/*cpFloat*/ dt) {
        var joint = this;
        if (!joint.bias) return;
        // early exit
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        // compute relative rotational velocity
        /*cpFloat*/
        var wr = b.w - a.w;
        /*cpFloat*/
        var jMax = joint.maxForce * dt;
        // compute normal impulse
        /*cpFloat*/
        var j = -(joint.bias + wr) * joint.iSum;
        /*cpFloat*/
        var jOld = joint.jAcc;
        if (joint.bias < 0) {
            joint.jAcc = cpfclamp(jOld + j, 0, jMax);
        } else {
            joint.jAcc = cpfclamp(jOld + j, -jMax, 0);
        }
        j = joint.jAcc - jOld;
        // apply impulse
        a.w -= j * a.i_inv;
        b.w += j * b.i_inv;
    };
    //static cpFloat
    RotaryLimitJoint.prototype.getImpulse = function() {
        return cpfabs(this.jAcc);
    };
    //cpSimpleMotor *
    var SimpleMotor = cp.SimpleMotor = function(/*cpBody*/ a, /*cpBody*/ b, /*cpFloat*/ rate) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.rate = rate;
        joint.jAcc = 0;
    };
    _extend(Constraint, SimpleMotor);
    //static void
    SimpleMotor.prototype.preStep = function(/*cpFloat*/ dt) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        // calculate moment of inertia coefficient.
        joint.iSum = 1 / (a.i_inv + b.i_inv);
    };
    //static void
    SimpleMotor.prototype.applyCachedImpulse = function(/*cpFloat*/ dt_coef) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        /*cpFloat*/
        var j = joint.jAcc * dt_coef;
        a.w -= j * a.i_inv;
        b.w += j * b.i_inv;
    };
    //static void
    SimpleMotor.prototype.applyImpulse = function(/*cpFloat*/ dt) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        // compute relative rotational velocity
        /*cpFloat*/
        var wr = b.w - a.w + joint.rate;
        /*cpFloat*/
        var jMax = joint.maxForce * dt;
        // compute normal impulse
        /*cpFloat*/
        var j = -wr * joint.iSum;
        /*cpFloat*/
        var jOld = joint.jAcc;
        joint.jAcc = cpfclamp(jOld + j, -jMax, jMax);
        j = joint.jAcc - jOld;
        // apply impulse
        a.w -= j * a.i_inv;
        b.w += j * b.i_inv;
    };
    //static cpFloat
    SimpleMotor.prototype.getImpulse = function() {
        return cpfabs(this.jAcc);
    };
    //cpSlideJoint *
    var SlideJoint = cp.SlideJoint = function(/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ anchr1, /*cpVect*/ anchr2, /*cpFloat*/ min, /*cpFloat*/ max) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.anchr1 = anchr1;
        joint.anchr2 = anchr2;
        joint.min = min;
        joint.max = max;
        joint.jnAcc = 0;
    };
    _extend(Constraint, SlideJoint);
    //static void
    SlideJoint.prototype.preStep = function(/*cpFloat*/ dt) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        joint.r1 = cpvrotate(joint.anchr1, a.rot);
        joint.r2 = cpvrotate(joint.anchr2, b.rot);
        /*cpVect*/
        var delta = cpvsub(cpvadd(b.p, joint.r2), cpvadd(a.p, joint.r1));
        /*cpFloat*/
        var dist = cpvlength(delta);
        /*cpFloat*/
        var pdist = 0;
        if (dist > joint.max) {
            pdist = dist - joint.max;
            joint.n = cpvnormalize(delta);
        } else if (dist < joint.min) {
            pdist = joint.min - dist;
            joint.n = cpvneg(cpvnormalize(delta));
        } else {
            joint.n = cpvzero;
            joint.jnAcc = 0;
        }
        // calculate mass normal
        joint.nMass = 1 / k_scalar(a, b, joint.r1, joint.r2, joint.n);
        // calculate bias velocity
        /*cpFloat*/
        var maxBias = joint.maxBias;
        joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * pdist / dt, -maxBias, maxBias);
    };
    //static void
    SlideJoint.prototype.applyCachedImpulse = function(/*cpFloat*/ dt_coef) {
        var joint = this;
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        /*cpVect*/
        var j = cpvmult(joint.n, joint.jnAcc * dt_coef);
        apply_impulses(a, b, joint.r1, joint.r2, j);
    };
    //static void
    SlideJoint.prototype.applyImpulse = function(/*cpFloat*/ dt) {
        var joint = this;
        if (cpveql(joint.n, cpvzero)) return;
        // early exit
        /*cpBody*/
        var a = joint.a;
        /*cpBody*/
        var b = joint.b;
        /*cpVect*/
        var n = joint.n;
        /*cpVect*/
        var r1 = joint.r1;
        /*cpVect*/
        var r2 = joint.r2;
        // compute relative velocity
        /*cpVect*/
        var vr = relative_velocity(a, b, r1, r2);
        /*cpFloat*/
        var vrn = cpvdot(vr, n);
        // compute normal impulse
        /*cpFloat*/
        var jn = (joint.bias - vrn) * joint.nMass;
        /*cpFloat*/
        var jnOld = joint.jnAcc;
        joint.jnAcc = cpfclamp(jnOld + jn, -joint.maxForce * dt, 0);
        jn = joint.jnAcc - jnOld;
        // apply impulse
        apply_impulses(a, b, joint.r1, joint.r2, cpvmult(n, jn));
    };
    //static cpFloat
    SlideJoint.prototype.getImpulse = function() {
        return cpfabs(this.jnAcc);
    };
    var CP_MAX_CONTACTS_PER_ARBITER = 2;
    /// @private
    // Arbiter is active and its the first collision.
    var cpArbiterStateFirstColl = 0;
    // Arbiter is active and its not the first collision.
    var cpArbiterStateNormal = 1;
    // Collision has been explicitly ignored.
    // Either by returning false from a begin collision handler or calling cpArbiterIgnore().
    var cpArbiterStateIgnore = 2;
    // Collison is no longer active. A space will cache an arbiter for up to cpSpace.collisionPersistence more steps.
    var cpArbiterStateCached = 3;
    //cpContact*
    var Contact = function(/*cpVect*/ p, /*cpVect*/ n, /*cpFloat*/ dist, /*cpHashValue*/ hash) {
        var con = this;
        con.p = p;
        con.n = n;
        con.dist = dist;
        con.hash = hash;
        con.r1 = new Vect(0, 0);
        con.r2 = new Vect(0, 0);
    };
    Contact.prototype.jnAcc = 0;
    Contact.prototype.jtAcc = 0;
    //Contact.prototype.jBias = 0;
    //Contact.prototype.nMass = 0;
    //Contact.prototype.tMass = 0;
    //Contact.prototype.bounce = 0;
    //Contact.prototype.bias = 0;
    // TODO make this generic so I can reuse it for constraints also.
    //static inline void
    var unthreadHelper = function(/*cpArbiter*/ arb, /*cpBody*/ body) {
        /*struct cpArbiterThread*/
        var thread = arb.threadForBody(body);
        /*cpArbiter*/
        var prev = thread.prev;
        /*cpArbiter*/
        var next = thread.next;
        if (prev) {
            prev.threadForBody(body).next = next;
        } else if (body.arbiterList == arb) {
            // IFF prev is null and body.arbiterList == arb, is arb at the head of the list.
            // This function may be called for an arbiter that was never in a list.
            // In that case, we need to protect it from wiping out the body.arbiterList pointer.
            body.arbiterList = next;
        }
        if (next) next.threadForBody(body).prev = prev;
        thread.prev = null;
        thread.next = null;
    };
    var arbiterThread = function(next, prev) {
        this.next = next;
        this.prev = prev;
    };
    //cpArbiter*
    var Arbiter = cp.Arbiter = function(/*cpShape*/ a, /*cpShape*/ b) {
        var arb = this;
        arb.surface_vr = new Vect(0, 0);
        arb.a = a;
        arb.body_a = a.body;
        arb.b = b;
        arb.body_b = b.body;
        arb.thread_a = new arbiterThread(null, null);
        arb.thread_b = new arbiterThread(null, null);
    };
    Arbiter.prototype.handler = null;
    Arbiter.prototype.contacts = null;
    Arbiter.prototype.swappedColl = null;
    Arbiter.prototype.e = 0;
    Arbiter.prototype.u = 0;
    Arbiter.prototype.stamp = 0;
    Arbiter.prototype.state = cpArbiterStateFirstColl;
    Arbiter.prototype.data = null;
    Arbiter.prototype.reset = function(/*cpShape*/ a, /*cpShape*/ b) {
        var arb = this;
        arb.handler = null;
        arb.swappedColl = false;
        arb.e = 0;
        arb.u = 0;
        //    arb.surface_vr = cpv(0, 0);
        arb.surface_vr.x = arb.surface_vr.y = 0;
        arb.contacts = null;
        arb.a = a;
        arb.body_a = a.body;
        arb.b = b;
        arb.body_b = b.body;
        arb.thread_a.next = null;
        arb.thread_a.prev = null;
        arb.thread_b.next = null;
        arb.thread_b.prev = null;
        arb.stamp = 0;
        arb.state = cpArbiterStateFirstColl;
        arb.data = null;
    };
    //void
    Arbiter.prototype.unthread = function() {
        var arb = this;
        unthreadHelper(arb, arb.body_a);
        unthreadHelper(arb, arb.body_b);
    };
    //cpBool
    Arbiter.prototype.isFirstContact = function() {
        return this.state == cpArbiterStateFirstColl;
    };
    //int
    Arbiter.prototype.getCount = function() {
        // Return 0 contacts if we are in a separate callback.
        return this.state != cpArbiterStateCached ? this.contacts.length : 0;
    };
    //cpVect
    Arbiter.prototype.getNormal = function(/*int*/ i) {
        var arb = this;
        cpAssertHard(0 <= i && i < arb.getCount(), "Index error: The specified contact index is invalid for this arbiter");
        /*cpVect*/
        var n = arb.contacts[i].n;
        return arb.swappedColl ? cpvneg(n) : n;
    };
    //cpVect
    Arbiter.prototype.getPoint = function(/*int*/ i) {
        cpAssertHard(0 <= i && i < this.getCount(), "Index error: The specified contact index is invalid for this arbiter");
        return this.contacts[i].p;
    };
    //cpFloat
    Arbiter.prototype.getDepth = function(/*int*/ i) {
        cpAssertHard(0 <= i && i < this.getCount(), "Index error: The specified contact index is invalid for this arbiter");
        return this.contacts[i].dist;
    };
    //cpContactPointSet
    Arbiter.prototype.getContactPointSet = function() {
        var arb = this;
        /*cpContactPointSet*/
        var set = new cpContactPointSet();
        set.count = arb.getCount();
        var con;
        for (var i = 0; i < set.count; i++) {
            con = arb.contacts[i];
            set.points[i] = new cpContactPoint(con.p, con.n, con.dist);
        }
        return set;
    };
    //void
    Arbiter.prototype.setContactPointSet = function(/*cpContactPointSet*/ set) {
        var arb = this;
        /*int*/
        var count = set.count;
        cpAssertHard(count == arb.contacts.length, "The number of contact points cannot be changed.");
        for (var i = 0; i < count; i++) {
            arb.contacts[i].p = set.points[i].point;
            arb.contacts[i].n = set.points[i].normal;
            arb.contacts[i].dist = set.points[i].dist;
        }
    };
    //cpVect
    Arbiter.prototype.totalImpulse = function() {
        var arb = this;
        /*cpContact*/
        var contacts = arb.contacts;
        /*cpVect*/
        var sum = cpvzero;
        for (var i = 0, count = arb.getCount(); i < count; i++) {
            /*cpContact*/
            var con = contacts[i];
            sum = cpvadd(sum, cpvmult(con.n, con.jnAcc));
        }
        return arb.swappedColl ? sum : cpvneg(sum);
    };
    //cpVect
    Arbiter.prototype.totalImpulseWithFriction = function() {
        var arb = this;
        /*cpContact*/
        var contacts = arb.contacts;
        /*cpVect*/
        var sum = cpvzero;
        for (var i = 0, count = arb.getCount(); i < count; i++) {
            /*cpContact*/
            var con = contacts[i];
            sum = cpvadd(sum, cpvrotate(con.n, new Vect(con.jnAcc, con.jtAcc)));
        }
        return arb.swappedColl ? sum : cpvneg(sum);
    };
    //cpFloat
    Arbiter.prototype.totalKE = function() {
        var arb = this;
        /*cpFloat*/
        var eCoef = (1 - arb.e) / (1 + arb.e);
        /*cpFloat*/
        var sum = 0;
        /*cpContact*/
        var contacts = arb.contacts;
        for (var i = 0, count = arb.getCount(); i < count; i++) {
            /*cpContact*/
            var con = contacts[i];
            /*cpFloat*/
            var jnAcc = con.jnAcc;
            /*cpFloat*/
            var jtAcc = con.jtAcc;
            sum += eCoef * jnAcc * jnAcc / con.nMass + jtAcc * jtAcc / con.tMass;
        }
        return sum;
    };
    //void
    Arbiter.prototype.ignore = function() {
        this.state = cpArbiterStateIgnore;
    };
    //cpVect
    Arbiter.prototype.getSurfaceVelocity = function() {
        return cpvmult(this.surface_vr, this.swappedColl ? -1 : 1);
    };
    //void
    Arbiter.prototype.setSurfaceVelocity = function(/*cpVect*/ vr) {
        this.surface_vr = cpvmult(vr, this.swappedColl ? -1 : 1);
    };
    //void
    Arbiter.prototype.update = function(/*cpContact*/ contacts, /*cpCollisionHandler*/ handler, /*cpShape*/ a, /*cpShape*/ b) {
        var arb = this;
        var numContacts = contacts.length;
        if (arb.contacts) {
            // Iterate over the possible pairs to look for hash value matches.
            for (var i = 0; i < numContacts; i++) {
                /*cpContact*/
                var con = contacts[i];
                for (var j = 0, len = arb.contacts.length; j < len; j++) {
                    /*cpContact*/
                    var old = arb.contacts[j];
                    // This could trigger false positives, but is fairly unlikely nor serious if it does.
                    if (con.hash == old.hash) {
                        // Copy the persistant contact information.
                        con.jnAcc = old.jnAcc;
                        con.jtAcc = old.jtAcc;
                    }
                }
            }
        }
        arb.contacts = contacts;
        arb.handler = handler;
        arb.swappedColl = a.collision_type != handler.a;
        arb.e = a.e * b.e;
        arb.u = a.u * b.u;
        // Currently all contacts will have the same normal.
        // This may change in the future.
        //	/*cpVect*/ var n = (numContacts ? contacts[0].n : cpvzero);
        var nx, ny;
        if (numContacts) {
            nx = contacts[0].n.x;
            ny = contacts[0].n.y;
        } else {
            nx = ny = 0;
        }
        //	/*cpVect*/ var surface_vr = cpvsub(a.surface_v, b.surface_v);
        //	/*cpVect*/ var surface_vr = cpv(a.surface_v.x - b.surface_v.x, a.surface_v.y - b.surface_v.y);
        var surface_vrx = a.surface_v.x - b.surface_v.x;
        var surface_vry = a.surface_v.y - b.surface_v.y;
        //	arb.surface_vr = cpvsub(surface_vr, cpvmult(n, cpvdot(surface_vr, n)));
        var f = surface_vrx * nx + surface_vry * ny;
        //	arb.surface_vr = cpvsub(surface_vr, cpv(n.x * f, n.y * f));
        arb.surface_vr.x = surface_vrx - nx * f;
        arb.surface_vr.y = surface_vry - ny * f;
        //
        // For collisions between two similar primitive types, the order could have been swapped.
        arb.a = a;
        arb.body_a = a.body;
        arb.b = b;
        arb.body_b = b.body;
        // mark it as new if it's been cached
        if (arb.state == cpArbiterStateCached) arb.state = cpArbiterStateFirstColl;
    };
    //void
    Arbiter.prototype.preStep = function(/*cpFloat*/ dt, /*cpFloat*/ slop, /*cpFloat*/ bias) {
        var arb = this;
        /*cpBody*/
        var a = arb.body_a;
        /*cpBody*/
        var b = arb.body_b;
        for (var i = 0; i < arb.contacts.length; i++) {
            /*cpContact*/
            var con = arb.contacts[i];
            var r1 = con.r1;
            var r2 = con.r2;
            var n = con.n;
            var p = con.p;
            // Calculate the offsets.
            //        con.r1 = cpvsub(con.p, a.p);
            //        con.r2 = cpvsub(con.p, b.p);
            r1.x = p.x - a.p.x;
            r1.y = p.y - a.p.y;
            r2.x = p.x - b.p.x;
            r2.y = p.y - b.p.y;
            // Calculate the mass normal and mass tangent.
            con.nMass = 1 / k_scalar(a, b, r1, r2, n);
            con.tMass = 1 / k_scalar(a, b, r1, r2, cpvperp(n));
            // Calculate the target bias velocity.
            con.bias = -bias * cpfmin(0, con.dist + slop) / dt;
            con.jBias = 0;
            // Calculate the target bounce velocity.
            con.bounce = normal_relative_velocity(a, b, r1, r2, n) * arb.e;
        }
    };
    //void
    Arbiter.prototype.applyCachedImpulse = function(/*cpFloat*/ dt_coef) {
        var arb = this;
        if (arb.isFirstContact()) return;
        /*cpBody*/
        var a = arb.body_a;
        /*cpBody*/
        var b = arb.body_b;
        for (var i = 0; i < arb.contacts.length; i++) {
            /*cpContact*/
            var con = arb.contacts[i];
            /*cpVect*/
            //        var j = cpvrotate(con.n, new Vect(con.jnAcc, con.jtAcc));
            var jx = con.n.x * con.jnAcc - con.n.y * con.jtAcc;
            var jy = con.n.x * con.jtAcc + con.n.y * con.jnAcc;
            //        apply_impulses(a, b, con.r1, con.r2, cpvmult(j, dt_coef));
            apply_impulses(a, b, con.r1, con.r2, new Vect(jx * dt_coef, jy * dt_coef));
        }
    };
    // TODO is it worth splitting velocity/position correction?
    //void
    //Arbiter.prototype.applyImpulse = function() {
    //    var arb = this;
    //	/*cpBody*/ var a = arb.body_a;
    //	/*cpBody*/ var b = arb.body_b;
    //	/*cpVect*/ var surface_vr = arb.surface_vr;
    //	/*cpFloat*/ var friction = arb.u;
    //
    //	for(var i=0; i<arb.numContacts; i++){
    //		/*cpContact*/ var con = arb.contacts[i];
    //		/*cpFloat*/ var nMass = con.nMass;
    //		/*cpVect*/ var n = con.n;
    //		/*cpVect*/ var r1 = con.r1;
    //		/*cpVect*/ var r2 = con.r2;
    //
    //		/*cpVect*/ var vb1 = cpvadd(a.v_bias, cpvmult(cpvperp(r1), a.w_bias));
    //		/*cpVect*/ var vb2 = cpvadd(b.v_bias, cpvmult(cpvperp(r2), b.w_bias));
    //		/*cpVect*/ var vr = cpvadd(relative_velocity(a, b, r1, r2), surface_vr);
    //
    //		/*cpFloat*/ var vbn = cpvdot(cpvsub(vb2, vb1), n);
    //		/*cpFloat*/ var vrn = cpvdot(vr, n);
    //		/*cpFloat*/ var vrt = cpvdot(vr, cpvperp(n));
    //
    //		/*cpFloat*/ var jbn = (con.bias - vbn)*nMass;
    //		/*cpFloat*/ var jbnOld = con.jBias;
    //		con.jBias = cpfmax(jbnOld + jbn, 0.0);
    //
    //		/*cpFloat*/ var jn = -(con.bounce + vrn)*nMass;
    //		/*cpFloat*/ var jnOld = con.jnAcc;
    //		con.jnAcc = cpfmax(jnOld + jn, 0.0);
    //
    //		/*cpFloat*/ var jtMax = friction*con.jnAcc;
    //		/*cpFloat*/ var jt = -vrt*con.tMass;
    //		/*cpFloat*/ var jtOld = con.jtAcc;
    //		con.jtAcc = cpfclamp(jtOld + jt, -jtMax, jtMax);
    //
    //		apply_bias_impulses(a, b, r1, r2, cpvmult(n, con.jBias - jbnOld));
    //		apply_impulses(a, b, r1, r2, cpvrotate(n, cpv(con.jnAcc - jnOld, con.jtAcc - jtOld)));
    //	}
    //}
    Arbiter.prototype.applyImpulse = function() {
        var arb = this;
        /*cpBody*/
        var a = arb.body_a;
        /*cpBody*/
        var b = arb.body_b;
        /*cpVect*/
        var surface_vr = arb.surface_vr;
        /*cpFloat*/
        var friction = arb.u;
        for (var i = 0, numContacts = arb.contacts.length; i < numContacts; i++) {
            /*cpContact*/
            var con = arb.contacts[i];
            /*cpFloat*/
            var nMass = con.nMass;
            /*cpVect*/
            var n = con.n;
            /*cpVect*/
            var r1 = con.r1;
            /*cpVect*/
            var r2 = con.r2;
            //		/*cpVect*/ var vb1 = cpvadd(a.v_bias, cpvmult(cpvperp(r1), a.w_bias));
            //      /*cpVect*/ var vb2 = cpvadd(b.v_bias, cpvmult(cpvperp(r2), b.w_bias));
            //        /*cpVect*/ var vr = cpvadd(relative_velocity(a, b, r1, r2), surface_vr);
            var a_w_bias = a.w_bias;
            var b_w_bias = b.w_bias;
            var a_v_bias = a.v_bias;
            var b_v_bias = b.v_bias;
            var a_v_bias_x = a_v_bias.x;
            var a_v_bias_y = a_v_bias.y;
            var b_v_bias_x = b_v_bias.x;
            var b_v_bias_y = b_v_bias.y;
            var av = a.v;
            var bv = b.v;
            var avx = av.x;
            var avy = av.y;
            var bvx = bv.x;
            var bvy = bv.y;
            var aw = a.w;
            var bw = b.w;
            var r1x = r1.x;
            var r1y = r1.y;
            var r2x = r2.x;
            var r2y = r2.y;
            var nx = n.x;
            var ny = n.y;
            //		/*cpFloat*/ var vbn = cpvdot(vbSub, n);
            //		/*cpFloat*/ var vrn = cpvdot(vr, n);
            //        /*cpFloat*/ var vrt = cpvdot(vr, cpvperp(n));
            var vbn = (b_v_bias_x - r2y * b_w_bias - a_v_bias_x + r1y * a_w_bias) * nx + (b_v_bias_y + r2x * b_w_bias - a_v_bias_y - r1x * a_w_bias) * ny;
            var vrx = bvx - r2y * bw - avx + r1y * aw + surface_vr.x;
            var vry = bvy + r2x * bw - avy - r1x * aw + surface_vr.y;
            var vrn = vrx * nx + vry * ny;
            var vrt = -vrx * ny + vry * nx;
            /*cpFloat*/
            var jbn = (con.bias - vbn) * nMass;
            /*cpFloat*/
            var jbnOld = con.jBias;
            con.jBias = cpfmax(jbnOld + jbn, 0);
            /*cpFloat*/
            var jn = -(con.bounce + vrn) * nMass;
            /*cpFloat*/
            var jnOld = con.jnAcc;
            con.jnAcc = cpfmax(jnOld + jn, 0);
            /*cpFloat*/
            var jtMax = friction * con.jnAcc;
            /*cpFloat*/
            var jt = -vrt * con.tMass;
            /*cpFloat*/
            var jtOld = con.jtAcc;
            con.jtAcc = cpfclamp(jtOld + jt, -jtMax, jtMax);
            //		apply_bias_impulses(a, b, r1, r2, cpvmult(n, con.jBias - jbnOld));
            var jBiasJbnOld = con.jBias - jbnOld;
            var jx = nx * jBiasJbnOld;
            var jy = ny * jBiasJbnOld;
            var a_m_inv = a.m_inv;
            var a_i_inv = a.i_inv;
            a_v_bias.x = a_v_bias_x - jx * a_m_inv;
            a_v_bias.y = a_v_bias_y - jy * a_m_inv;
            a.w_bias += a_i_inv * (-r1x * jy + r1y * jx);
            var b_m_inv = b.m_inv;
            var b_i_inv = b.i_inv;
            b_v_bias.x = b_v_bias_x + jx * b_m_inv;
            b_v_bias.y = b_v_bias_y + jy * b_m_inv;
            b.w_bias += b_i_inv * (r2x * jy - r2y * jx);
            //		apply_impulses(a, b, r1, r2, cpvrotate(n, cpv(con.jnAcc - jnOld, con.jtAcc - jtOld)));
            var rotx = con.jnAcc - jnOld;
            var roty = con.jtAcc - jtOld;
            jx = nx * rotx - ny * roty;
            jy = nx * roty + ny * rotx;
            //        a.v = cpv(avx - jx * a_m_inv, avy - jy * a_m_inv);
            av.x = avx - jx * a_m_inv;
            av.y = avy - jy * a_m_inv;
            a.w += a_i_inv * (-r1x * jy + r1y * jx);
            //        b.v = cpv(bvx + jx * b_m_inv, bvy + jy * b_m_inv);
            bv.x = bvx + jx * b_m_inv;
            bv.y = bvy + jy * b_m_inv;
            b.w += b_i_inv * (r2x * jy - r2y * jx);
        }
    };
    /// @private
    /*var*/
    var cpCollisionHandler = function(/*cpCollisionType*/ a, /*cpCollisionType*/ b, /*cpCollisionBeginFunc*/ begin, /*cpCollisionPreSolveFunc*/ preSolve, /*cpCollisionPostSolveFunc*/ postSolve, /*cpCollisionSeparateFunc*/ separate, /*void*/ data) {
        this.a = a;
        this.b = b;
        this.begin = begin;
        this.preSolve = preSolve;
        this.postSolve = postSolve;
        this.separate = separate;
        this.data = data;
    };
    /// Return the colliding shapes involved for this arbiter.
    /// The order of their cpSpace.collision_type values will match
    /// the order set when the collision handler was registered.
    //void
    Arbiter.prototype.getShapes = function() {
        return this.swappedColl ? [ this.b, this.a ] : [ this.a, this.b ];
    };
    /// Return the colliding bodies involved for this arbiter.
    /// The order of the cpSpace.collision_type the bodies are associated with values will match
    /// the order set when the collision handler was registered.
    //void
    Arbiter.prototype.getBodies = function() {
        var shapes = this.getShapes();
        return [ shapes[0].body, shapes[1].body ];
    };
    var cpContactPoint = function(/*cpVect*/ point, /*cpVect*/ normal, /*cpFloat*/ dist) {
        this.point = point;
        this.normal = normal;
        this.dist = dist;
    };
    /// A struct that wraps up the important collision data for an arbiter.
    var cpContactPointSet = function() {
        //    struct {
        //        /// The position of the contact point.
        //        /*cpVect*/ var point = new cpVect();
        //        /// The normal of the contact point.
        //        /*cpVect*/ var normal = new cpVect();
        //        /// The depth of the contact point.
        //        /*cpFloat*/ var dist = new cpFloat();
        //    } points[CP_MAX_CONTACTS_PER_ARBITER];
        this.count = 0;
        this.points = [];
    };
    //void
    var cpArrayDeleteObj = function(/*cpArray*/ arr, /*void*/ obj) {
        var index = arr.indexOf(obj);
        if (-1 != index) {
            arr[index] = arr[arr.length - 1];
            arr.pop();
        }
    };
    ///// Chipmunk's axis-aligned 2D bounding box type. (left, bottom, right, top)
    var BB = cp.BB = function(/*cpFloat*/ l, b, r, t) {
        this.l = l;
        this.b = b;
        this.r = r;
        this.t = t;
    };
    /// Constructs a cpBB for a circle with the given position and radius.
    //cpBB
    var BBNewForCircle = BB.newForCircle = function(/*const cpVect*/ p, /*const cpFloat*/ r) {
        return new BB(p.x - r, p.y - r, p.x + r, p.y + r);
    };
    /// Returns true if @c a and @c b intersect.
    //cpBool
    BB.prototype.intersects = function(/*const cpBB*/ b) {
        var a = this;
        //    return (a.l <= b.r && b.l <= a.r && a.b <= b.t && b.b <= a.t);
        return !(b.l > a.r || b.r < a.l || b.t < a.b || b.b > a.t);
    };
    /// Returns true if @c other lies completely within @c bb.
    //cpBool
    BB.prototype.containsBB = function(/*const cpBB*/ other) {
        var bb = this;
        //    return (bb.l <= other.l && bb.r >= other.r && bb.b <= other.b && bb.t >= other.t);
        return !(bb.l > other.l || bb.r < other.r || bb.b > other.b || bb.t < other.t);
    };
    /// Returns true if @c bb contains @c v.
    //cpBool
    BB.prototype.containsVect = function(/*const cpVect*/ v) {
        var bb = this;
        return bb.l <= v.x && bb.r >= v.x && bb.b <= v.y && bb.t >= v.y;
    };
    /// Returns a bounding box that holds both bounding boxes.
    //cpBB
    BB.prototype.merge = function(/*const cpBB*/ b) {
        var a = this;
        return new BB(cpfmin(a.l, b.l), cpfmin(a.b, b.b), cpfmax(a.r, b.r), cpfmax(a.t, b.t));
    };
    /// Returns a bounding box that holds both @c bb and @c v.
    //cpBB
    BB.prototype.expand = function(/*const cpVect*/ v) {
        var bb = this;
        return new BB(cpfmin(bb.l, v.x), cpfmin(bb.b, v.y), cpfmax(bb.r, v.x), cpfmax(bb.t, v.y));
    };
    /// Returns the center of a bounding box.
    //static inline cpVect
    BB.prototype.center = function() {
        var bb = this;
        return cpvlerp(new Vect(bb.l, bb.b), new Vect(bb.r, bb.t), .5);
    };
    /// Returns the area of the bounding box.
    //cpFloat
    BB.prototype.area = function() {
        var bb = this;
        return (bb.r - bb.l) * (bb.t - bb.b);
    };
    /// Merges @c a and @c b and returns the area of the merged bounding box.
    //cpFloat
    BB.prototype.mergedArea = function(/*cpBB*/ b) {
        var a = this;
        return (cpfmax(a.r, b.r) - cpfmin(a.l, b.l)) * (cpfmax(a.t, b.t) - cpfmin(a.b, b.b));
    };
    /// Returns the fraction along the segment query the cpBB is hit. Returns Infinity if it doesn't hit.
    //cpFloat
    BB.prototype.segmentQuery = function(/*cpVect*/ a, /*cpVect*/ b) {
        var bb = this;
        /*cpFloat*/
        var idx = 1 / (b.x - a.x);
        /*cpFloat*/
        var tx1 = bb.l == a.x ? -Infinity : (bb.l - a.x) * idx;
        /*cpFloat*/
        var tx2 = bb.r == a.x ? Infinity : (bb.r - a.x) * idx;
        /*cpFloat*/
        var txmin = cpfmin(tx1, tx2);
        /*cpFloat*/
        var txmax = cpfmax(tx1, tx2);
        /*cpFloat*/
        var idy = 1 / (b.y - a.y);
        /*cpFloat*/
        var ty1 = bb.b == a.y ? -Infinity : (bb.b - a.y) * idy;
        /*cpFloat*/
        var ty2 = bb.t == a.y ? Infinity : (bb.t - a.y) * idy;
        /*cpFloat*/
        var tymin = cpfmin(ty1, ty2);
        /*cpFloat*/
        var tymax = cpfmax(ty1, ty2);
        if (tymin <= txmax && txmin <= tymax) {
            /*cpFloat*/
            var min = cpfmax(txmin, tymin);
            /*cpFloat*/
            var max = cpfmin(txmax, tymax);
            if (0 <= max && min <= 1) return cpfmax(min, 0);
        }
        return Infinity;
    };
    /// Return true if the bounding box intersects the line segment with ends @c a and @c b.
    //cpBool
    BB.prototype.intersectsSegment = function(/*cpVect*/ a, /*cpVect*/ b) {
        var bb = this;
        return bb.segmentQuery(a, b) != Infinity;
    };
    /// Clamp a vector to a bounding box.
    //static inline cpVect
    BB.prototype.clampVect = function(/*const cpVect*/ v) {
        var bb = this;
        return new Vect(cpfclamp(v.x, bb.l, bb.r), cpfclamp(v.y, bb.b, bb.t));
    };
    /**
 * @param {Vect} v
 * @returns {Vect}
 */
    BB.prototype.wrapVect = function(v) {
        var bb = this;
        /*cpFloat*/
        var ix = cpfabs(bb.r - bb.l);
        /*cpFloat*/
        var modx = cpfmod(v.x - bb.l, ix);
        /*cpFloat*/
        var x = modx > 0 ? modx : modx + ix;
        /*cpFloat*/
        var iy = cpfabs(bb.t - bb.b);
        /*cpFloat*/
        var mody = cpfmod(v.y - bb.b, iy);
        /*cpFloat*/
        var y = mody > 0 ? mody : mody + iy;
        return new Vect(x + bb.l, y + bb.b);
    };
    //cpSpatialIndex *
    var SpatialIndex = cp.SpatialIndex = function(/*cpSpatialIndexBBFunc*/ bbfunc, /*cpSpatialIndex*/ staticIndex) {
        var index = this;
        index.bbfunc = bbfunc;
        index.staticIndex = staticIndex;
        if (staticIndex) {
            cpAssertHard(!staticIndex.dynamicIndex, "This static index is already associated with a dynamic index.");
            staticIndex.dynamicIndex = index;
        }
    };
    //
    var dynamicToStaticContext = function(/*cpSpatialIndexBBFunc*/ bbfunc, /*cpSpatialIndex*/ staticIndex, /*cpSpatialIndexQueryFunc*/ queryFunc, /*void*/ data) {
        this.bbfunc = bbfunc;
        this.staticIndex = staticIndex;
        this.queryFunc = queryFunc;
        this.data = data;
    };
    //static void
    var dynamicToStaticIter = function(/*void*/ obj, /*dynamicToStaticContext*/ context) {
        context.staticIndex.query(obj, context.bbfunc(obj), context.queryFunc, context.data);
    };
    //void
    SpatialIndex.prototype.collideStatic = function(/*cpSpatialIndex*/ staticIndex, /*cpSpatialIndexQueryFunc*/ func, /*void*/ data) {
        var dynamicIndex = this;
        if (staticIndex && staticIndex.count > 0) {
            /*dynamicToStaticContext*/
            var context = new dynamicToStaticContext(dynamicIndex.bbfunc, staticIndex, func, data);
            dynamicIndex.each(/*cpSpatialIndexIteratorFunc*/ dynamicToStaticIter, context);
        }
    };
    //typedef struct Node Node;
    //typedef struct Pair Pair;
    //struct Node {
    //	void *obj;
    //	cpBB bb;
    //	Node *parent;
    //	
    //	union {
    //		// Internal nodes
    //		struct { Node *a, *b; } children;
    //		
    //		// Leaves
    //		struct {
    //			cpTimestamp stamp;
    //			Pair *pairs;
    //		} leaf;
    //	} node;
    //};
    // Can't use anonymous unions and still get good x-compiler compatability
    //#define A node.children.a
    //#define B node.children.b
    //#define STAMP node.leaf.stamp
    //#define PAIRS node.leaf.pairs
    var Node = function(a, b) {
        var node = this;
        node.bb = a.bb.merge(b.bb);
        node.parent = null;
        node.setA(a);
        node.setB(b);
    };
    var Leaf = function(tree, obj) {
        this.bb = new BB(0, 0, 0, 0);
        var node = this;
        node.obj = obj;
        tree.getBB(obj, node.bb);
        node.parent = null;
        node.STAMP = 0;
        node.PAIRS = null;
    };
    //_extend(Node, Leaf)
    //typedef struct 
    //var Thread  = function(
    //	/*Pair **/prev,
    //	/*Node **/leaf,
    //	/*Pair **/next
    //) {
    //    this.prev = prev
    //    this.leaf = leaf
    //    this.next = next
    //};
    //struct 
    //var Pair = function(
    //	/*Thread*/ a, b,
    //	/*cpCollisionID*/ id
    //) {
    //    this.a = a;
    //    this.b = b;
    //    this.id = id;
    //};
    var Pair = function(/*Thread*/
    leafA, nextA, leafB, nextB, /*cpCollisionID*/
    id) {
        this.aPrev = null;
        this.aLeaf = leafA;
        this.aNext = nextA;
        this.bPrev = null;
        this.bLeaf = leafB;
        this.bNext = nextB;
        //    this.a = new Thread(null, leafA, nextA);
        //    this.b = new Thread(null, leafB, nextB);
        this.id = id;
    };
    //cpSpatialIndex *
    var BBTree = cp.BBTree = function(/*cpSpatialIndexBBFunc*/ bbfunc, /*cpSpatialIndex **/ staticIndex) {
        var tree = this;
        SpatialIndex.call(tree, bbfunc, staticIndex);
        tree.velocityFunc = null;
        tree.leaves = {};
        tree.count = 0;
        tree.root = null;
        tree.pooledNodes = null;
        tree.pooledPairs = null;
        tree.stamp = 0;
    };
    _extend(SpatialIndex, BBTree);
    //static inline cpBB
    BBTree.prototype.getBB = function(/*void **/ obj, targetBB) {
        /*cpBBTree **/
        var tree = this;
        /*cpBB*/
        var bb = tree.bbfunc(obj);
        /*cpBBTreeVelocityFunc*/
        var velocityFunc = tree.velocityFunc;
        if (velocityFunc) {
            /*cpFloat*/
            var coef = .1;
            /*cpFloat*/
            var x = (bb.r - bb.l) * coef;
            /*cpFloat*/
            var y = (bb.t - bb.b) * coef;
            //		/*cpVect*/ var v = cpvmult(velocityFunc(obj), 0.1);
            var v = velocityFunc(obj);
            var vx = v.x * .1;
            var vy = v.y * .1;
            //		return new BB(bb.l + cpfmin(-x, v.x), bb.b + cpfmin(-y, v.y), bb.r + cpfmax(x, v.x), bb.t + cpfmax(y, v.y));
            targetBB.l = bb.l + cpfmin(-x, vx);
            targetBB.b = bb.b + cpfmin(-y, vy);
            targetBB.r = bb.r + cpfmax(x, vx);
            targetBB.t = bb.t + cpfmax(y, vy);
        } else {
            targetBB.l = bb.l;
            targetBB.b = bb.b;
            targetBB.r = bb.r;
            targetBB.t = bb.t;
        }
    };
    //static inline cpBBTree *
    //var GetTree = function(/*cpSpatialIndex **/index)
    //{
    //    return index
    //    return index && index instanceof BBTree? index : null
    //}
    //static inline Node *
    //var GetRootIfTree = function(/*cpSpatialIndex **/index){
    //    return index.root
    //    return index && index instanceof BBTree? index.root : null
    //}
    //static inline cpBBTree *
    BBTree.prototype.getMasterTree = function() {
        return this.dynamicIndex || this;
    };
    //static inline void
    BBTree.prototype.incrementStamp = function() {
        (this.dynamicIndex || this).stamp++;
    };
    //MARK: Pair/Thread Functions
    //static void
    Pair.prototype.recycle = function(/*cpBBTree **/ tree) {
        /*Pair **/
        var pair = this;
        // Share the pool of the master tree.
        // TODO would be lovely to move the pairs stuff into an external data structure.
        tree = tree.getMasterTree();
        pair.aNext = tree.pooledPairs;
        tree.pooledPairs = pair;
    };
    //static Pair *
    BBTree.prototype.pairFromPool = function(a, nextA, b, nextB, id) {
        /*cpBBTree **/
        var tree = this;
        // Share the pool of the master tree.
        // TODO would be lovely to move the pairs stuff into an external data structure.
        tree = tree.getMasterTree();
        /*Pair **/
        var pair = tree.pooledPairs;
        if (pair) {
            tree.pooledPairs = pair.aNext;
            pair.constructor(a, nextA, b, nextB, id);
            //        pair.aPrev = null;
            //        pair.aLeaf = a;
            //        pair.aNext = nextA;
            //
            //        pair.bPrev = null;
            //        pair.bLeaf = b;
            //        pair.bNext = nextB;
            //        pair.id = id;
            return pair;
        } else {
            // Pool is exhausted, make more
            //		Pair *buffer = (Pair *)cpcalloc(1, CP_BUFFER_BYTES);
            /*Pair **/
            var buffer = new Pair(a, nextA, b, nextB, id);
            //        tree.pairAllocatedBuffers.push(buffer);
            // push all but the first one, return the first instead
            //		for(/*int*/ var i=1; i<tree.pairAllocatedBuffers.length; i++) PairRecycle(tree, tree.pairAllocatedBuffers[i]);
            return buffer;
        }
    };
    //static inline void
    var ThreadUnlink = function(prev, leaf, next) {
        if (next) {
            if (next.aLeaf == leaf) next.aPrev = prev; else next.bPrev = prev;
        }
        if (prev) {
            if (prev.aLeaf == leaf) prev.aNext = next; else prev.bNext = next;
        } else {
            leaf.PAIRS = next;
        }
    };
    //static void
    Leaf.prototype.pairsClear = function(/*cpBBTree **/ tree) {
        /*Node **/
        var leaf = this;
        /*Pair **/
        var pair = leaf.PAIRS;
        leaf.PAIRS = null;
        while (pair) {
            if (pair.aLeaf == leaf) {
                /*Pair **/
                var next = pair.aNext;
                //            pair.b.unlink();
                ThreadUnlink(pair.bPrev, pair.bLeaf, pair.bNext);
            } else {
                /*Pair **/
                var next = pair.bNext;
                //            pair.a.unlink();
                ThreadUnlink(pair.aPrev, pair.aLeaf, pair.aNext);
            }
            pair.recycle(tree);
            pair = next;
        }
    };
    //static void
    var PairInsert = function(/*Node **/ a, /*Node **/ b, /*cpBBTree **/ tree) {
        /*Pair **/
        var nextA = a.PAIRS, nextB = b.PAIRS;
        /*Pair **/
        var pair = tree.pairFromPool(a, nextA, b, nextB, 0);
        //	/*Pair*/ var temp = new Pair(new Thread(null, a, nextA), new Thread(null, b, nextB), 0);
        a.PAIRS = b.PAIRS = pair;
        //	pair.a = temp.a;
        //	pair.b = temp.b;
        //	pair.id = temp.id;
        //    pair.a = new Thread(null, a, nextA);
        //    pair.b = new Thread(null, b, nextB);
        //    pair.id = 0;
        if (nextA) {
            if (nextA.aLeaf == a) nextA.aPrev = pair; else nextA.bPrev = pair;
        }
        if (nextB) {
            if (nextB.aLeaf == b) nextB.aPrev = pair; else nextB.bPrev = pair;
        }
    };
    //MARK: Node Functions
    //static void
    Node.prototype.recycle = function(/*cpBBTree **/ tree) {
        /*Node **/
        var node = this;
        node.parent = tree.pooledNodes;
        tree.pooledNodes = node;
    };
    //static Node *
    BBTree.prototype.nodeFromPool = function(/*Node **/ a, /*Node **/ b) {
        /*cpBBTree **/
        var tree = this;
        /*Node **/
        var node = tree.pooledNodes;
        if (node) {
            tree.pooledNodes = node.parent;
            node.constructor(a, b);
            return node;
        } else {
            // Pool is exhausted, make more
            //		Node *buffer = (Node *)cpcalloc(1, CP_BUFFER_BYTES);
            /*Node **/
            var buffer = new Node(a, b);
            //        tree.nodeAllocatedBuffers.push(buffer);
            // push all but the first one, return the first instead
            //		for(/*int*/ var i=1; i<tree.nodeAllocatedBuffers.length; i++) NodeRecycle(tree, tree.nodeAllocatedBuffers[i]);
            return buffer;
        }
    };
    //static inline void
    Node.prototype.setA = function(/*Node **/ value) {
        /*Node **/
        var node = this;
        node.A = value;
        value.parent = node;
    };
    //static inline void
    Node.prototype.setB = function(/*Node **/ value) {
        /*Node **/
        var node = this;
        node.B = value;
        value.parent = node;
    };
    //static inline cpBool
    Node.prototype.isLeaf = false;
    Leaf.prototype.isLeaf = true;
    //static inline Node *
    Node.prototype.other = function(/*Node **/ child) {
        /*Node **/
        var node = this;
        return node.A == child ? node.B : node.A;
    };
    //static inline void
    Node.prototype.replaceChild = function(/*Node **/ child, /*Node **/ value, /*cpBBTree **/ tree) {
        /*Node **/
        var parent = this;
        if (NDEBUG) {
            cpAssertSoft(!parent.isLeaf, "Internal Error: Cannot replace child of a leaf.");
            cpAssertSoft(child == parent.A || child == parent.B, "Internal Error: Node is not a child of parent.");
        }
        if (parent.A == child) {
            parent.A.recycle(tree);
            parent.setA(value);
        } else {
            parent.B.recycle(tree);
            parent.setB(value);
        }
        for (/*Node **/ var node = parent; node; node = node.parent) {
            node.bb = node.A.bb.merge(node.B.bb);
        }
    };
    //MARK: Subtree Functions
    //static inline cpFloat
    var cpBBProximity = function(/*cpBB*/ a, /*cpBB*/ b) {
        return cpfabs(a.l + a.r - b.l - b.r) + cpfabs(a.b + a.t - b.b - b.t);
    };
    //static Node *
    var SubtreeInsert = function(/*Node **/ subtree, /*Node **/ leaf, /*cpBBTree **/ tree) {
        if (subtree == null) {
            return leaf;
        } else if (subtree.isLeaf) {
            return tree.nodeFromPool(leaf, subtree);
        } else {
            /*cpFloat*/
            var cost_a = subtree.B.bb.area() + subtree.A.bb.mergedArea(leaf.bb);
            /*cpFloat*/
            var cost_b = subtree.A.bb.area() + subtree.B.bb.mergedArea(leaf.bb);
            if (cost_a == cost_b) {
                cost_a = cpBBProximity(subtree.A.bb, leaf.bb);
                cost_b = cpBBProximity(subtree.B.bb, leaf.bb);
            }
            if (cost_b < cost_a) {
                subtree.setB(SubtreeInsert(subtree.B, leaf, tree));
            } else {
                subtree.setA(SubtreeInsert(subtree.A, leaf, tree));
            }
            subtree.bb = subtree.bb.merge(leaf.bb);
            return subtree;
        }
    };
    //static void
    var SubtreeQuery = function(/*Node **/ subtree, /*void **/ obj, /*cpBB*/ bb, /*cpSpatialIndexQueryFunc*/ func, /*void **/ data) {
        if (subtree.bb.intersects(bb)) {
            if (subtree.isLeaf) {
                func(obj, subtree.obj, 0, data);
            } else {
                SubtreeQuery(subtree.A, obj, bb, func, data);
                SubtreeQuery(subtree.B, obj, bb, func, data);
            }
        }
    };
    //static cpFloat
    var SubtreeSegmentQuery = function(/*Node **/ subtree, /*void **/ obj, /*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ t_exit, /*cpSpatialIndexSegmentQueryFunc*/ func, /*void **/ data) {
        if (subtree.isLeaf) {
            return func(obj, subtree.obj, data);
        } else {
            /*cpFloat*/
            var t_a = subtree.A.bb.segmentQuery(a, b);
            /*cpFloat*/
            var t_b = subtree.B.bb.segmentQuery(a, b);
            if (t_a < t_b) {
                if (t_a < t_exit) t_exit = cpfmin(t_exit, SubtreeSegmentQuery(subtree.A, obj, a, b, t_exit, func, data));
                if (t_b < t_exit) t_exit = cpfmin(t_exit, SubtreeSegmentQuery(subtree.B, obj, a, b, t_exit, func, data));
            } else {
                if (t_b < t_exit) t_exit = cpfmin(t_exit, SubtreeSegmentQuery(subtree.B, obj, a, b, t_exit, func, data));
                if (t_a < t_exit) t_exit = cpfmin(t_exit, SubtreeSegmentQuery(subtree.A, obj, a, b, t_exit, func, data));
            }
            return t_exit;
        }
    };
    //static void
    BBTree.prototype.subtreeRecycle = function(/*Node **/ node) {
        /*cpBBTree **/
        var tree = this;
        if (!node.isLeaf) {
            tree.subtreeRecycle(node.A);
            tree.subtreeRecycle(node.B);
            node.recycle(tree);
        }
    };
    //static inline Node *
    var SubtreeRemove = function(/*Node **/ subtree, /*Node **/ leaf, /*cpBBTree **/ tree) {
        if (leaf == subtree) {
            return null;
        } else {
            /*Node **/
            var parent = leaf.parent;
            if (parent == subtree) {
                /*Node **/
                var other = subtree.other(leaf);
                other.parent = subtree.parent;
                subtree.recycle(tree);
                return other;
            } else {
                parent.parent.replaceChild(parent, parent.other(leaf), tree);
                return subtree;
            }
        }
    };
    //MARK: Marking Functions
    ////typedef struct
    //var MarkContext = function(
    //	/*cpBBTree **/tree,
    //	/*Node **/staticRoot,
    //	/*cpSpatialIndexQueryFunc*/ func,
    //	/*void **/data
    //) {
    //    this.tree = tree;
    //    this.staticRoot = staticRoot;
    //    this.func = func;
    //    this.data = data;
    //};
    //static void
    //var MarkLeafQuery = function(/*Node **/subtree, /*Node **/leaf, /*cpBool*/ left, /*MarkContext **/context)
    //{
    //	if(leaf.bb.intersects(subtree.bb)){
    //        if(subtree.isLeaf){
    //            if(left){
    //				PairInsert(leaf, subtree, context.tree);
    //			} else {
    //				if(subtree.STAMP < leaf.STAMP) {
    //                    PairInsert(subtree, leaf, context.tree);
    //                }
    //				context.func(leaf.obj, subtree.obj, 0, context.data);
    //			}
    //		} else {
    //			MarkLeafQuery(subtree.A, leaf, left, context);
    //			MarkLeafQuery(subtree.B, leaf, left, context);
    //		}
    //	}
    //}
    Node.prototype.markLeafQuery = function(/*Node **/ leaf, /*cpBool*/ left, tree, func, data) {
        /*Node **/
        var subtree = this;
        if (leaf.bb.intersects(subtree.bb)) {
            subtree.A.markLeafQuery(leaf, left, tree, func, data);
            subtree.B.markLeafQuery(leaf, left, tree, func, data);
        }
    };
    Leaf.prototype.markLeafQuery = function(/*Node **/ leaf, /*cpBool*/ left, tree, func, data) {
        /*Node **/
        var subtree = this;
        if (leaf.bb.intersects(subtree.bb)) {
            if (left) {
                PairInsert(leaf, subtree, tree);
            } else {
                if (subtree.STAMP < leaf.STAMP) {
                    PairInsert(subtree, leaf, tree);
                }
                func(leaf.obj, subtree.obj, 0, data);
            }
        }
    };
    //static void
    Leaf.prototype.markSubtree = function(tree, staticRoot, func, data) {
        /*Node **/
        var leaf = this;
        if (leaf.STAMP == tree.getMasterTree().stamp) {
            if (staticRoot) staticRoot.markLeafQuery(leaf, false, tree, func, data);
            for (/*Node **/ var node = leaf; node.parent; node = node.parent) {
                if (node == node.parent.A) {
                    node.parent.B.markLeafQuery(leaf, true, tree, func, data);
                } else {
                    node.parent.A.markLeafQuery(leaf, false, tree, func, data);
                }
            }
        } else {
            /*Pair **/
            var pair = leaf.PAIRS;
            while (pair) {
                if (leaf == pair.bLeaf) {
                    pair.id = func(pair.aLeaf.obj, leaf.obj, pair.id, data);
                    pair = pair.bNext;
                } else {
                    pair = pair.aNext;
                }
            }
        }
    };
    //static void
    Node.prototype.markSubtree = function(tree, staticRoot, func, data) {
        this.A.markSubtree(tree, staticRoot, func, data);
        this.B.markSubtree(tree, staticRoot, func, data);
    };
    //MARK: Leaf Functions
    //static Node *
    //var LeafNew = function(/*cpBBTree **/tree, /*void **/obj, /*cpBB*/ bb)
    //{
    //	/*Node **/ var node = tree.nodeFromPool();
    //	node.obj = obj;
    //	node.bb = tree.getBB(obj);
    //
    //	node.parent = null;
    //	node.STAMP = 0;
    //	node.PAIRS = null;
    //
    //	return node;
    //}
    //static cpBool
    Leaf.prototype.update = function(/*cpBBTree **/ tree) {
        /*Node **/
        var leaf = this;
        /*Node **/
        var root = tree.root;
        /*cpBB*/
        var bb = tree.bbfunc(leaf.obj);
        if (!leaf.bb.containsBB(bb)) {
            tree.getBB(leaf.obj, leaf.bb);
            root = SubtreeRemove(root, leaf, tree);
            tree.root = SubtreeInsert(root, leaf, tree);
            leaf.pairsClear(tree);
            leaf.STAMP = tree.getMasterTree().stamp;
            return true;
        } else {
            return false;
        }
    };
    //static cpCollisionID
    var VoidQueryFunc = function(/*void **/ obj1, /*void **/ obj2, /*cpCollisionID*/ id, /*void **/ data) {
        return id;
    };
    //static void
    Leaf.prototype.addPairs = function(/*cpBBTree **/ tree) {
        /*Node **/
        var leaf = this;
        /*cpSpatialIndex **/
        var dynamicIndex = tree.dynamicIndex;
        if (dynamicIndex) {
            /*Node **/
            var dynamicRoot = dynamicIndex.root;
            if (dynamicRoot) {
                /*cpBBTree **/
                var dynamicTree = dynamicIndex;
                //			/*MarkContext*/ var context = new MarkContext(dynamicTree, null, null, null);
                dynamicRoot.markLeafQuery(leaf, true, dynamicTree, _nothing, null);
            }
        } else {
            /*Node **/
            var staticRoot = tree.staticIndex.root;
            //		/*MarkContext*/ var context = new MarkContext(tree, staticRoot, VoidQueryFunc, null);
            leaf.markSubtree(tree, staticRoot, VoidQueryFunc, null);
        }
    };
    ////static int
    //var leafSetEql = function(/*void **/obj, /*Node **/node)
    //{
    //	return (obj == node.obj);
    //}
    //
    ////static void *
    //var leafSetTrans = function(/*void **/obj, /*cpBBTree **/tree)
    //{
    //	return LeafNew(tree, obj, tree.bbfunc(obj));
    //}
    //void
    BBTree.prototype.setVelocityFunc = function(/*cpBBTreeVelocityFunc*/ func) {
        this.velocityFunc = func;
    };
    //MARK: Insert/Remove
    //static void
    BBTree.prototype.insert = function(/*void **/ obj, /*cpHashValue*/ hashid) {
        var tree = this;
        //	Node *leaf = (Node *)cpHashSetInsert(tree.leaves, hashid, obj, tree, (cpHashSetTransFunc)leafSetTrans);
        /*Node **/
        var leaf = tree.leaves[hashid] = new Leaf(tree, obj);
        /*Node **/
        var root = tree.root;
        tree.root = SubtreeInsert(root, leaf, tree);
        tree.count++;
        leaf.STAMP = tree.getMasterTree().stamp;
        leaf.addPairs(tree);
        tree.incrementStamp();
    };
    //static void
    BBTree.prototype.remove = function(/*void **/ obj, /*cpHashValue*/ hashid) {
        var tree = this;
        //	Node *leaf = (Node *)cpHashSetRemove(tree.leaves, hashid, obj);
        /*Node **/
        var leaf = tree.leaves[hashid];
        delete tree.leaves[hashid];
        tree.root = SubtreeRemove(tree.root, leaf, tree);
        tree.count--;
        leaf.pairsClear(tree);
    };
    //static cpBool
    BBTree.prototype.contains = function(/*void **/ obj, /*cpHashValue*/ hashid) {
        return this.leaves[hashid] != null;
    };
    //MARK: Reindex
    //static void
    BBTree.prototype.reindexQuery = function(/*cpSpatialIndexQueryFunc*/ func, /*void **/ data) {
        /*cpBBTree **/
        var tree = this;
        if (!tree.root) return;
        // LeafUpdate() may modify tree.root. Don't cache it.
        //	cpHashSetEach(tree.leaves, (cpHashSetIteratorFunc)LeafUpdate, tree);
        for (var hashid in tree.leaves) {
            tree.leaves[hashid].update(tree);
        }
        /*cpSpatialIndex **/
        var staticIndex = tree.staticIndex;
        /*Node **/
        var staticRoot = staticIndex && staticIndex.root;
        //	/*MarkContext*/ var context = new MarkContext(tree, staticRoot, func, data);
        tree.root.markSubtree(tree, staticRoot, func, data);
        if (staticIndex && !staticRoot) tree.collideStatic(staticIndex, func, data);
        tree.incrementStamp();
    };
    //static void
    BBTree.prototype.reindex = function() {
        this.reindexQuery(VoidQueryFunc, null);
    };
    //static void
    BBTree.prototype.reindexObject = function(/*void **/ obj, /*cpHashValue*/ hashid) {
        /*cpBBTree **/
        var tree = this;
        //	Node *leaf = (Node *)cpHashSetFind(tree.leaves, hashid, obj);
        /*Node **/
        var leaf = tree.leaves[hashid];
        if (leaf) {
            if (leaf.update(tree)) leaf.addPairs(tree);
            tree.incrementStamp();
        }
    };
    //MARK: Query
    //static void
    BBTree.prototype.segmentQuery = function(/*void **/ obj, /*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ t_exit, /*cpSpatialIndexSegmentQueryFunc*/ func, /*void **/ data) {
        /*cpBBTree **/
        var tree = this;
        /*Node **/
        var root = tree.root;
        if (root) SubtreeSegmentQuery(root, obj, a, b, t_exit, func, data);
    };
    //static void
    BBTree.prototype.query = function(/*void **/ obj, /*cpBB*/ bb, /*cpSpatialIndexQueryFunc*/ func, /*void **/ data) {
        if (this.root) SubtreeQuery(this.root, obj, bb, func, data);
    };
    //MARK: Misc
    //static int
    //BBTree.prototype.count = function()
    //{
    //    return this.count;
    //}
    //typedef struct
    //var eachContext = function(
    //	/*cpSpatialIndexIteratorFunc*/ func,
    //	/*void **/data
    //) {
    //    this.func = func;
    //    this.data = data;
    //};
    //static void
    //var each_helper = function(/*Node **/node, /*eachContext **/context){context.func(node.obj, context.data);}
    //static void
    BBTree.prototype.each = function(/*cpSpatialIndexIteratorFunc*/ func, /*void **/ data) {
        /*cpBBTree **/
        var tree = this;
        //    /*eachContext*/ var context = new eachContext(func, data);
        //    cpHashSetEach(tree.leaves, (cpHashSetIteratorFunc)each_helper, &context);
        for (var hashid in tree.leaves) {
            //        each_helper(tree.leaves[hashid], context)
            func(tree.leaves[hashid].obj, data);
        }
    };
    //MARK: Tree Optimization
    //static int
    //var cpfcompare = function(/*const cpFloat **/a, /*const cpFloat **/b){
    //	return (a < b ? -1 : (b < a ? 1 : 0));
    //}
    //static Node *
    //partitionNodes(cpBBTree *tree, Node **nodes, int count)
    //{
    //	if(count == 1){
    //		return nodes[0];
    //	} else if(count == 2) {
    //		return NodeNew(tree, nodes[0], nodes[1]);
    //	}
    //
    //	// Find the AABB for these nodes
    //	cpBB bb = nodes[0].bb;
    //	for(int i=1; i<count; i++) bb = cpBBMerge(bb, nodes[i].bb);
    //
    //	// Split it on it's longest axis
    //	cpBool splitWidth = (bb.r - bb.l > bb.t - bb.b);
    //
    //	// Sort the bounds and use the median as the splitting point
    //	cpFloat *bounds = (cpFloat *)cpcalloc(count*2, sizeof(cpFloat));
    //	if(splitWidth){
    //		for(int i=0; i<count; i++){
    //			bounds[2*i + 0] = nodes[i].bb.l;
    //			bounds[2*i + 1] = nodes[i].bb.r;
    //		}
    //	} else {
    //		for(int i=0; i<count; i++){
    //			bounds[2*i + 0] = nodes[i].bb.b;
    //			bounds[2*i + 1] = nodes[i].bb.t;
    //		}
    //	}
    //
    //	qsort(bounds, count*2, sizeof(cpFloat), (int (*)(const void *, const void *))cpfcompare);
    //	cpFloat split = (bounds[count - 1] + bounds[count])*0.5; // use the medain as the split
    //	cpfree(bounds);
    //
    //	// Generate the child BBs
    //	cpBB a = bb, b = bb;
    //	if(splitWidth) a.r = b.l = split; else a.t = b.b = split;
    //
    //	// Partition the nodes
    //	int right = count;
    //	for(int left=0; left < right;){
    //		Node *node = nodes[left];
    //		if(cpBBMergedArea(node.bb, b) < cpBBMergedArea(node.bb, a)){
    ////		if(cpBBProximity(node.bb, b) < cpBBProximity(node.bb, a)){
    //			right--;
    //			nodes[left] = nodes[right];
    //			nodes[right] = node;
    //		} else {
    //			left++;
    //		}
    //	}
    //
    //	if(right == count){
    //		Node *node = null;
    //		for(int i=0; i<count; i++) node = SubtreeInsert(node, nodes[i], tree);
    //		return node;
    //	}
    //
    //	// Recurse and build the node!
    //	return NodeNew(tree,
    //		partitionNodes(tree, nodes, right),
    //		partitionNodes(tree, nodes + right, count - right)
    //	);
    //}
    //
    ////static void
    ////cpBBTreeOptimizeIncremental(cpBBTree *tree, int passes)
    ////{
    ////	for(int i=0; i<passes; i++){
    ////		Node *root = tree.root;
    ////		Node *node = root;
    ////		int bit = 0;
    ////		unsigned int path = tree.opath;
    ////
    ////		while(!NodeIsLeaf(node)){
    ////			node = (path&(1<<bit) ? node.a : node.b);
    ////			bit = (bit + 1)&(sizeof(unsigned int)*8 - 1);
    ////		}
    ////
    ////		root = subtreeRemove(root, node, tree);
    ////		tree.root = subtreeInsert(root, node, tree);
    ////	}
    ////}
    //
    //void
    //cpBBTreeOptimize(cpSpatialIndex *index)
    //{
    //	if(index.klass != &klass){
    //		cpAssertWarn(false, "Ignoring cpBBTreeOptimize() call to non-tree spatial index.");
    //		return;
    //	}
    //
    //	cpBBTree *tree = (cpBBTree *)index;
    //	Node *root = tree.root;
    //	if(!root) return;
    //
    //	int count = cpBBTreeCount(tree);
    //	Node **nodes = (Node **)cpcalloc(count, sizeof(Node *));
    //	Node **cursor = nodes;
    //
    //	cpHashSetEach(tree.leaves, (cpHashSetIteratorFunc)fillNodeArray, &cursor);
    //
    //	SubtreeRecycle(tree, root);
    //	tree.root = partitionNodes(tree, nodes, count);
    //	cpfree(nodes);
    //}
    //
    ////MARK: Debug Draw
    //
    ////#define CP_BBTREE_DEBUG_DRAW
    //#ifdef CP_BBTREE_DEBUG_DRAW
    //#include "OpenGL/gl.h"
    //#include "OpenGL/glu.h"
    //#include <GLUT/glut.h>
    //
    //static void
    //NodeRender(Node *node, int depth)
    //{
    //	if(!NodeIsLeaf(node) && depth <= 10){
    //		NodeRender(node.a, depth + 1);
    //		NodeRender(node.b, depth + 1);
    //	}
    //
    //	cpBB bb = node.bb;
    //
    ////	GLfloat v = depth/2.0;
    ////	glColor3f(1.0 - v, v, 0.0);
    //	glLineWidth(cpfmax(5.0 - depth, 1.0));
    //	glBegin(GL_LINES); {
    //		glVertex2f(bb.l, bb.b);
    //		glVertex2f(bb.l, bb.t);
    //
    //		glVertex2f(bb.l, bb.t);
    //		glVertex2f(bb.r, bb.t);
    //
    //		glVertex2f(bb.r, bb.t);
    //		glVertex2f(bb.r, bb.b);
    //
    //		glVertex2f(bb.r, bb.b);
    //		glVertex2f(bb.l, bb.b);
    //	}; glEnd();
    //}
    //
    //void
    //cpBBTreeRenderDebug(cpSpatialIndex *index){
    //	if(index.klass != &klass){
    //		cpAssertWarn(false, "Ignoring cpBBTreeRenderDebug() call to non-tree spatial index.");
    //		return;
    //	}
    //
    //	cpBBTree *tree = (cpBBTree *)index;
    //	if(tree.root) NodeRender(tree.root, 0);
    //}
    //#endif
    var cpBodyIDCounter = 0;
    //cpBody *
    var Body = cp.Body = function(/*cpFloat*/ m, /*cpFloat*/ i) {
        var body = this;
        body.hashid = cpBodyIDCounter++;
        body.p = new Vect(0, 0);
        body.v = new Vect(0, 0);
        body.f = new Vect(0, 0);
        body.v_bias = new Vect(0, 0);
        //    this.rot = cpvforangle(0.0)
        this.rot = new Vect(1, 0);
        // Setters must be called after full initialization so the sanity checks don't assert on garbage data.
        body.setMass(m);
        body.setMoment(i);
    };
    Body.prototype = {
        space: null,
        shapeList: null,
        arbiterList: null,
        constraintList: null,
        nodeRoot: null,
        nodeNext: null,
        nodeIdleTime: 0,
        w: 0,
        t: 0,
        w_bias: 0,
        v_limit: Infinity,
        w_limit: Infinity,
        data: null,
        a: 0
    };
    Body.prototype.getPos = function() {
        return this.p;
    };
    Body.prototype.getAngVel = function() {
        return this.w;
    };
    Body.prototype.getVel = function() {
        return this.v;
    };
    Body.prototype.setVel = function(v) {
        this.activate();
        this.v = v;
    };
    Body.prototype.setAngVel = function(w) {
        this.activate();
        this.w = w;
    };
    //cpBody *
    Body.initStatic = function(body) {
        body.setMass(Infinity);
        body.setMoment(Infinity);
        body.nodeIdleTime = Infinity;
        return body;
    };
    //cpBody *
    Body.newStatic = function() {
        var body = new Body(Infinity, Infinity);
        body.nodeIdleTime = Infinity;
        return body;
    };
    //void
    if (NDEBUG) {
        //void
        var cpv_assert_nan = function(/*cpVect*/ v, /*char **/ message) {
            cpAssertSoft(v.x == v.x && v.y == v.y, message);
        };
        //void
        var cpv_assert_infinite = function(/*cpVect*/ v, /*char **/ message) {
            cpAssertSoft(cpfabs(v.x) != Infinity && cpfabs(v.y) != Infinity, message);
        };
        //void
        var cpv_assert_sane = function(/*cpVect*/ v, /*char **/ message) {
            cpv_assert_nan(v, message);
            cpv_assert_infinite(v, message);
        };
        var BodySanityCheck = function(body) {
            cpAssertSoft(body.m == body.m && body.m_inv == body.m_inv, "Body's mass is invalid.");
            cpAssertSoft(body.i == body.i && body.i_inv == body.i_inv, "Body's moment is invalid.");
            cpv_assert_sane(body.p, "Body's position is invalid.");
            cpv_assert_sane(body.v, "Body's velocity is invalid.");
            cpv_assert_sane(body.f, "Body's force is invalid.");
            cpAssertSoft(body.a == body.a && cpfabs(body.a) != Infinity, "Body's angle is invalid.");
            cpAssertSoft(body.w == body.w && cpfabs(body.w) != Infinity, "Body's angular velocity is invalid.");
            cpAssertSoft(body.t == body.t && cpfabs(body.t) != Infinity, "Body's torque is invalid.");
            cpv_assert_sane(body.rot, "Body's rotation vector is invalid.");
            cpAssertSoft(body.v_limit == body.v_limit, "Body's velocity limit is invalid.");
            cpAssertSoft(body.w_limit == body.w_limit, "Body's angular velocity limit is invalid.");
        };
    }
    //void
    Body.prototype.setMass = function(/*cpFloat*/ mass) {
        var body = this;
        cpAssertHard(mass > 0, "Mass must be positive and non-zero.");
        body.activate();
        body.m = mass;
        body.m_inv = 1 / mass;
        if (NDEBUG) {
            BodySanityCheck(body);
        }
    };
    //void
    Body.prototype.setMoment = function(/*cpFloat*/ moment) {
        var body = this;
        cpAssertHard(moment > 0, "Moment of Inertia must be positive and non-zero.");
        body.activate();
        body.i = moment;
        body.i_inv = 1 / moment;
        if (NDEBUG) {
            BodySanityCheck(body);
        }
    };
    //void
    Body.prototype.addShape = function(/*cpShape*/ shape) {
        var body = this;
        /*cpShape*/
        var next = body.shapeList;
        if (next) next.prev = shape;
        shape.next = next;
        body.shapeList = shape;
    };
    //void
    Body.prototype.removeShape = function(/*cpShape*/ shape) {
        var body = this;
        /*cpShape*/
        var prev = shape.prev;
        /*cpShape*/
        var next = shape.next;
        if (prev) {
            prev.next = next;
        } else {
            body.shapeList = next;
        }
        if (next) {
            next.prev = prev;
        }
        shape.prev = null;
        shape.next = null;
    };
    //static cpConstraint *
    var filterConstraints = function(/*cpConstraint*/ node, /*cpBody*/ body, /*cpConstraint*/ filter) {
        if (node == filter) {
            return node.next(body);
        } else if (node.a == body) {
            node.next_a = filterConstraints(node.next_a, body, filter);
        } else {
            node.next_b = filterConstraints(node.next_b, body, filter);
        }
        return node;
    };
    //void
    Body.prototype.removeConstraint = function(/*cpConstraint*/ constraint) {
        var body = this;
        body.constraintList = filterConstraints(body.constraintList, body, constraint);
    };
    //void
    Body.prototype.setPos = function(/*cpVect*/ pos) {
        var body = this;
        body.activate();
        body.p = pos;
        if (NDEBUG) {
            BodySanityCheck(body);
        }
    };
    //static inline void
    var setAngle = function(/*cpBody*/ body, /*cpFloat*/ angle) {
        cpAssertSoft(angle == angle && cpfabs(angle) != Infinity, "Body's angle is invalid.");
        body.a = angle;
        //fmod(a, /*cpFloat*/M_PI*2.0);
        //	body.rot = cpvforangle(angle);
        body.rot.x = cpfcos(angle);
        body.rot.y = cpfsin(angle);
    };
    //void
    Body.prototype.setAngle = function(/*cpFloat*/ angle) {
        var body = this;
        body.activate();
        setAngle(body, angle);
        if (NDEBUG) {
            BodySanityCheck(body);
        }
    };
    //void
    Body.prototype.updateVelocity = function(/*cpVect*/ gravity, /*cpFloat*/ damping, /*cpFloat*/ dt) {
        var body = this;
        var v = body.v;
        //	body.v = cpvclamp(cpvadd(cpvmult(body.v, damping), cpvmult(cpvadd(gravity, cpvmult(body.f, body.m_inv)), dt)), body.v_limit);
        v.x = v.x * damping + (gravity.x + body.f.x * body.m_inv) * dt;
        v.y = body.v.y * damping + (gravity.y + body.f.y * body.m_inv) * dt;
        var v_limit = body.v_limit;
        if (v_limit < Infinity) {
            var vlenSq = v.x * v.x + v.y * v.y;
            if (vlenSq > v_limit * v_limit) {
                var f = cpfsqrt(vlenSq) + CPFLOAT_MIN;
                v.x *= v_limit / f;
                v.y *= v_limit / f;
            }
        }
        /*cpFloat*/
        var w_limit = body.w_limit;
        body.w = cpfclamp(body.w * damping + body.t * body.i_inv * dt, -w_limit, w_limit);
        if (NDEBUG) {
            BodySanityCheck(body);
        }
    };
    //void
    Body.prototype.updatePosition = function(/*cpFloat*/ dt) {
        var body = this;
        //	body.p = cpvadd(body.p, cpvmult(cpvadd(body.v, body.v_bias), dt));
        body.p.x += (body.v.x + body.v_bias.x) * dt;
        body.p.y += (body.v.y + body.v_bias.y) * dt;
        setAngle(body, body.a + (body.w + body.w_bias) * dt);
        //	body.v_bias = cpv(0, 0);
        body.v_bias.x = body.v_bias.y = 0;
        body.w_bias = 0;
        if (NDEBUG) {
            BodySanityCheck(body);
        }
    };
    //void
    Body.prototype.resetForces = function() {
        var body = this;
        body.activate();
        body.f.x = body.f.y = 0;
        body.t = 0;
    };
    //void
    Body.prototype.applyForce = function(/*cpVect*/ force, /*cpVect*/ r) {
        var body = this;
        body.activate();
        body.f.x += force.x;
        body.f.y += force.y;
        //	body.f = cpvadd(body.f, force);
        body.t += cpvcross(r, force);
    };
    //void
    Body.prototype.applyImpulse = function(/*const cpVect*/ j, /*const cpVect*/ r) {
        var body = this;
        body.activate();
        apply_impulse(body, j, r);
    };
    //static inline cpVect
    Body.prototype.getVelAtPoint = function(/*cpVect*/ r) {
        var body = this;
        return cpvadd(body.v, cpvmult(cpvperp(r), body.w));
    };
    //cpVect
    Body.prototype.getVelAtWorldPoint = function(/*cpVect*/ point) {
        var body = this;
        return body.getVelAtPoint(cpvsub(point, body.p));
    };
    //cpVect
    Body.prototype.getVelAtLocalPoint = function(/*cpVect*/ point) {
        var body = this;
        return body.getVelAtPoint(cpvrotate(point, body.rot));
    };
    Body.prototype.kScalar = function(/*cpVect*/ r, /*cpVect*/ n) {
        return k_scalar_body(this, r, n);
    };
    //void
    Body.prototype.eachShape = function(/*cpBodyShapeIteratorFunc*/ func, /*void*/ data) {
        var body = this;
        /*cpShape*/
        var shape = body.shapeList;
        while (shape) {
            /*cpShape*/
            var next = shape.next;
            func(body, shape, data);
            shape = next;
        }
    };
    //void
    Body.prototype.eachConstraint = function(/*cpBodyConstraintIteratorFunc*/ func, /*void*/ data) {
        var body = this;
        /*cpConstraint*/
        var constraint = body.constraintList;
        while (constraint) {
            /*cpConstraint*/
            var next = constraint.next(body);
            func(body, constraint, data);
            constraint = next;
        }
    };
    //void
    Body.prototype.eachArbiter = function(/*cpBodyArbiterIteratorFunc*/ func, /*void*/ data) {
        var body = this;
        /*cpArbiter*/
        var arb = body.arbiterList;
        while (arb) {
            /*cpArbiter*/
            var next = arb.next(body);
            arb.swappedColl = body == arb.body_b;
            func(body, arb, data);
            arb = next;
        }
    };
    var ENABLE_CACHING = 1;
    var MAX_GJK_ITERATIONS = 30;
    var MAX_EPA_ITERATIONS = 30;
    var WARN_GJK_ITERATIONS = 20;
    var WARN_EPA_ITERATIONS = 20;
    // Add contact points for circle to circle collisions.
    // Used by several collision tests.
    // TODO should accept hash parameter
    //static int
    var CircleToCircleQuery = function(/*const cpVect*/ p1, /*const cpVect*/ p2, /*const cpFloat*/ r1, /*const cpFloat*/ r2, /*cpHashValue*/ hash) {
        /*cpFloat*/
        var mindist = r1 + r2;
        /*cpVect*/
        //    var delta = cpvsub(p2, p1);
        var deltaX = p2.x - p1.x;
        var deltaY = p2.y - p1.y;
        /*cpFloat*/
        //    var distsq = cpvlengthsq(delta);
        var distsq = deltaX * deltaX + deltaY * deltaY;
        if (distsq < mindist * mindist) {
            /*cpFloat*/
            var dist = cpfsqrt(distsq);
            /*cpVect*/
            var n = dist ? new Vect(deltaX / dist, deltaY / dist) : new Vect(1, 0);
            return new Contact(cpvlerp(p1, p2, r1 / (r1 + r2)), n, dist - mindist, hash);
        }
    };
    //MARK: Support Points and Edges:
    //static inline int
    var PolySupportPointIndex = function(/*const cpVect **/ verts, /*const cpVect*/ n) {
        /*cpFloat*/
        var max = -Infinity;
        /*int*/
        var index = 0;
        for (/*int*/ var i = 0, count = verts.length; i < count; i++) {
            /*cpVect*/
            var v = verts[i];
            /*cpFloat*/
            //        var d = cpvdot(v, n);
            var d = v.x * n.x + v.y * n.y;
            if (d > max) {
                max = d;
                index = i;
            }
        }
        return index;
    };
    /*struct*/
    var SupportPoint = function(/*cpVect*/ p, /*cpCollisionID*/ id) {
        this.p = p;
        this.id = id;
    };
    //static inline struct SupportPoint
    var CircleSupportPoint = function(/*const cpCircleShape **/ circle, /*const cpVect*/ n) {
        return new SupportPoint(circle.tc, 0);
    };
    //static inline struct SupportPoint
    var SegmentSupportPoint = function(/*const cpSegmentShape **/ seg, /*const cpVect*/ n) {
        if (cpvdot(seg.ta, n) > cpvdot(seg.tb, n)) {
            return new SupportPoint(seg.ta, 0);
        } else {
            return new SupportPoint(seg.tb, 1);
        }
    };
    //static inline struct SupportPoint
    var PolySupportPoint = function(/*const cpPolyShape **/ poly, /*const cpVect*/ n) {
        /*const cpVect **/
        var verts = poly.tVerts;
        /*int*/
        var i = PolySupportPointIndex(verts, n);
        return new SupportPoint(verts[i], i);
    };
    //static inline struct MinkowskiPoint
    var MinkoskiPoint = function(/*const struct SupportPoint*/ a, /*const struct SupportPoint*/ b) {
        this.a = a.p;
        this.b = b.p;
        //    this.ab = cpvsub(b.p, a.p);
        this.ab = new Vect(b.p.x - a.p.x, b.p.y - a.p.y);
        this.id = (a.id & 255) << 8 | b.id & 255;
    };
    /*struct*/
    var SupportContext = function(/*const cpShape **/ shape1, shape2, /*SupportPointFunc*/ func1, func2) {
        this.shape1 = shape1;
        this.shape2 = shape2;
        this.func1 = func1;
        this.func2 = func2;
    };
    //static inline struct MinkowskiPoint
    var Support = function(/*const struct SupportContext **/ ctx, /*const cpVect*/ n) {
        /*struct SupportPoint*/
        //    var a = ctx.func1(ctx.shape1, cpvneg(n));
        var a = ctx.func1(ctx.shape1, new Vect(-n.x, -n.y));
        /*struct SupportPoint*/
        var b = ctx.func2(ctx.shape2, n);
        return new MinkoskiPoint(a, b);
    };
    /*struct*/
    var EdgePoint = function(/*cpVect*/ p, /*cpHashValue*/ hash) {
        this.p = p;
        this.hash = hash;
    };
    /*struct*/
    var Edge = function(/*struct EdgePoint*/ a, b, /*cpFloat*/ r, /*cpVect*/ n) {
        this.a = a;
        this.b = b;
        this.r = r;
        this.n = n;
    };
    //static struct Edge
    var SupportEdgeForPoly = function(/*const cpPolyShape **/ poly, /*const cpVect*/ n) {
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
        var planes = poly.tPlanes;
        if (cpvdot(n, planes[i1].n) > cpvdot(n, planes[i2].n)) {
            /*struct Edge*/
            var edge = new Edge(new EdgePoint(verts[i0], CP_HASH_PAIR(poly.hashid, i0)), new EdgePoint(verts[i1], CP_HASH_PAIR(poly.hashid, i1)), poly.r, planes[i1].n);
            return edge;
        } else {
            /*struct Edge*/
            var edge = new Edge(new EdgePoint(verts[i1], CP_HASH_PAIR(poly.hashid, i1)), new EdgePoint(verts[i2], CP_HASH_PAIR(poly.hashid, i2)), poly.r, planes[i2].n);
            return edge;
        }
    };
    //static struct Edge
    var SupportEdgeForSegment = function(/*const cpSegmentShape **/ seg, /*const cpVect*/ n) {
        if (cpvdot(seg.tn, n) > 0) {
            /*struct Edge*/
            var edge = new Edge(new EdgePoint(seg.ta, CP_HASH_PAIR(seg.hashid, 0)), new EdgePoint(seg.tb, CP_HASH_PAIR(seg.hashid, 1)), seg.r, seg.tn);
            return edge;
        } else {
            /*struct Edge*/
            var edge = new Edge(new EdgePoint(seg.tb, CP_HASH_PAIR(seg.hashid, 1)), new EdgePoint(seg.ta, CP_HASH_PAIR(seg.hashid, 0)), seg.r, cpvneg(seg.tn));
            return edge;
        }
    };
    //static inline cpFloat
    var ClosestT = function(/*const cpVect*/ a, /*const cpVect*/ b) {
        /*cpVect*/
        //    var delta = cpvsub(b, a);
        //    return -cpfclamp(cpvdot(delta, cpvadd(a, b)) / cpvlengthsq(delta), -1.0, 1.0);
        var deltaX = b.x - a.x;
        var deltaY = b.y - a.y;
        return -cpfclamp((deltaX * (a.x + b.x) + deltaY * (a.y + b.y)) / (deltaX * deltaX + deltaY * deltaY), -1, 1);
    };
    //static inline cpVect
    var LerpT = function(/*const cpVect*/ a, /*const cpVect*/ b, /*const cpFloat*/ t) {
        /*cpFloat*/
        var ht = .5 * t;
        //    return cpvadd(cpvmult(a, 0.5 - ht), cpvmult(b, 0.5 + ht));
        var f1 = .5 - ht;
        var f2 = .5 + ht;
        return new Vect(a.x * f1 + b.x * f2, a.y * f1 + b.y * f2);
    };
    //static inline struct ClosestPoints
    var ClosestPoints = function(/*const struct MinkowskiPoint*/ v0, /*const struct MinkowskiPoint*/ v1) {
        /*cpFloat*/
        var t = ClosestT(v0.ab, v1.ab);
        /*cpVect*/
        var p = LerpT(v0.ab, v1.ab, t);
        /*cpVect*/
        var pa = LerpT(v0.a, v1.a, t);
        /*cpVect*/
        var pb = LerpT(v0.b, v1.b, t);
        /*cpCollisionID*/
        var id = (v0.id & 65535) << 16 | v1.id & 65535;
        /*cpVect*/
        //    var delta = cpvsub(v1.ab, v0.ab);
        //    /*cpVect*/
        //    var n = cpvnormalize(cpvperp(delta));
        //    var delta = new Vect(v1.ab.x - v0.ab.x, v1.ab.y - v0.ab.y);
        var deltaY = v1.ab.x - v0.ab.x;
        var deltaX = -v1.ab.y + v0.ab.y;
        var f = cpfsqrt(deltaX * deltaX + deltaY * deltaY) + CPFLOAT_MIN;
        var nx = deltaX / f;
        var ny = deltaY / f;
        //
        ////    var n = cpvnormalize(new Vect(-deltaY, deltaX));
        //    var n = new Vect(nx, ny);
        /*cpFloat*/
        //    var d = -cpvdot(n, p);
        var d = -(nx * p.x + ny * p.y);
        if (d <= 0 || 0 < t && t < 1) {
            //        n = cpvneg(n);
            var n = new Vect(-nx, -ny);
        } else {
            /*cpFloat*/
            //        d = cpvlength(p);
            d = cpfsqrt(p.x * p.x + p.y * p.y);
            /*cpVect*/
            //        n = cpvmult(p, 1.0 / (d + CPFLOAT_MIN));
            var f = d + CPFLOAT_MIN;
            var n = new Vect(p.x / f, p.y / f);
        }
        this.a = pa;
        this.b = pb;
        this.n = n;
        this.d = d;
        this.id = id;
    };
    //MARK: EPA Functions
    //static inline cpFloat
    var ClosestDist = function(/*const cpVect*/ v0, /*const cpVect*/ v1) {
        return cpvlengthsq(LerpT(v0, v1, ClosestT(v0, v1)));
    };
    //static struct ClosestPoints
    var EPARecurse = function(/*const struct SupportContext **/ ctx, /*const int*/ count, /*const struct MinkowskiPoint **/ hull, /*const int*/ iteration) {
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
            cpAssertSoft(!cpveql(v0.ab, v1.ab), "Internal Error: EPA vertexes are the same (" + mini + " and " + (mini + 1) % count + ")");
        }
        /*struct MinkowskiPoint*/
        //    var p = Support(ctx, cpvperp(cpvsub(v1.ab, v0.ab)));
        var v0abx = v0.ab.x;
        var v0aby = v0.ab.y;
        var v1abx = v1.ab.x;
        var v1aby = v1.ab.y;
        var p = Support(ctx, new Vect(v0aby - v1aby, v1abx - v0abx));
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
        //    var area2x = cpvcross(cpvsub(v1.ab, v0.ab), cpvadd(cpvsub(p.ab, v0.ab), cpvsub(p.ab, v1.ab)));
        //    var area2x = ((v1.ab.x - v0.ab.x) * (2*p.ab.y - v0.ab.y - v1.ab.y) - (v1.ab.y - v0.ab.y) * (2*p.ab.x - v0.ab.x - v1.ab.x));
        var area2x = 2 * (v1abx * (p.ab.y - v0aby) + v0abx * (v1aby - p.ab.y) + p.ab.x * (v0aby - v1aby));
        if (area2x > 0 && iteration < MAX_EPA_ITERATIONS) {
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
                //            if (cpvcross(cpvsub(h2, h0), cpvsub(h1, h0)) > 0.0) {
                if ((h2.x - h0.x) * (h1.y - h0.y) - (h2.y - h0.y) * (h1.x - h0.x) > 0) {
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
    };
    //static struct ClosestPoints
    var EPA = function(/*const struct SupportContext **/ ctx, /*const struct MinkowskiPoint*/ v0, /*const struct MinkowskiPoint*/ v1, /*const struct MinkowskiPoint*/ v2) {
        // TODO: allocate a NxM array here and do an in place convex hull reduction in EPARecurse
        //	struct MinkowskiPoint hull[3] = {v0, v1, v2};
        /*struct MinkowskiPoint*/
        var hull = [ v0, v1, v2 ];
        return EPARecurse(ctx, 3, hull, 1);
    };
    //MARK: GJK Functions.
    //static inline struct ClosestPoints
    var GJKRecurse = function(/*const struct SupportContext **/ ctx, /*const struct MinkowskiPoint*/ v0, /*const struct MinkowskiPoint*/ v1, /*const int*/ iteration) {
        if (iteration > MAX_GJK_ITERATIONS) {
            if (NDEBUG) {
                cpAssertWarn(iteration < WARN_GJK_ITERATIONS, "High GJK iterations: " + iteration);
            }
            return new ClosestPoints(v0, v1);
        }
        /*cpVect*/
        //    var delta = cpvsub(v1.ab, v0.ab);
        var v0abx = v0.ab.x;
        var v0aby = v0.ab.y;
        var v1abx = v1.ab.x;
        var v1aby = v1.ab.y;
        var deltaX = v1abx - v0abx;
        var deltaY = v1aby - v0aby;
        //    if (cpvcross(delta, cpvadd(v0.ab, v1.ab)) > 0.0) {
        if (deltaX * (v0aby + v1aby) - deltaY * (v0abx + v1abx) > 0) {
            // Origin is behind axis. Flip and try again.
            return GJKRecurse(ctx, v1, v0, iteration + 1);
        } else {
            /*cpFloat*/
            var t = ClosestT(v0.ab, v1.ab);
            /*cpVect*/
            //        var n = (-1.0 < t && t < 1.0 ? cpvperp(delta) : cpvneg(LerpT(v0.ab, v1.ab, t)));
            var n = -1 < t && t < 1 ? new Vect(-deltaY, deltaX) : cpvneg(LerpT(v0.ab, v1.ab, t));
            /*struct MinkowskiPoint*/
            var p = Support(ctx, n);
            //#if DRAW_GJK
            //		ChipmunkDebugDrawSegment(v0.ab, v1.ab, RGBAColor(1, 1, 1, 1));
            //		cpVect c = cpvlerp(v0.ab, v1.ab, 0.5);
            //		ChipmunkDebugDrawSegment(c, cpvadd(c, cpvmult(cpvnormalize(n), 5.0)), RGBAColor(1, 0, 0, 1));
            //
            //		ChipmunkDebugDrawPoints(5.0, 1, &p.ab, RGBAColor(1, 1, 1, 1));
            //#endif
            var pabx = p.ab.x;
            var paby = p.ab.y;
            if (//            cpvcross(cpvsub(v1.ab, p.ab), cpvadd(v1.ab, p.ab)) > 0.0 &&
            (v1abx - pabx) * (v1aby + paby) - (v1aby - paby) * (v1abx + pabx) > 0 && //                cpvcross(cpvsub(v0.ab, p.ab), cpvadd(v0.ab, p.ab)) < 0.0
            (v0abx - pabx) * (v0aby + paby) - (v0aby - paby) * (v0abx + pabx) < 0) {
                if (NDEBUG) {
                    cpAssertWarn(iteration < WARN_GJK_ITERATIONS, "High GJK.EPA iterations: " + iteration);
                }
                // The triangle v0, p, v1 contains the origin. Use EPA to find the MSA.
                return EPA(ctx, v0, p, v1);
            } else {
                // The new point must be farther along the normal than the existing points.
                var nx = n.x;
                var ny = n.y;
                //            if (cpvdot(p.ab, n) <= cpfmax(cpvdot(v0.ab, n), cpvdot(v1.ab, n))) {
                if (pabx * nx + paby * ny <= cpfmax(v0abx * nx + v0aby * ny, v1abx * nx + v1aby * ny)) {
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
    };
    //static struct SupportPoint
    var ShapePoint = function(/*const cpShape **/ shape, /*const int*/ i) {
        switch (shape.type) {
          case CP_CIRCLE_SHAPE:
            {
                return new SupportPoint(shape.tc, 0);
            }

          case CP_SEGMENT_SHAPE:
            {
                /*cpSegmentShape **/
                var seg = /*(cpSegmentShape *)*/ shape;
                return new SupportPoint(i == 0 ? seg.ta : seg.tb, i);
            }

          case CP_POLY_SHAPE:
            {
                /*cpPolyShape **/
                var poly = /*(cpPolyShape *)*/ shape;
                // Poly shapes may change vertex count.
                /*int*/
                var index = i < poly.verts.length ? i : 0;
                return new SupportPoint(poly.tVerts[index], index);
            }

          default:
            {
                return new SupportPoint(cpvzero, 0);
            }
        }
    };
    //static struct ClosestPoints
    var GJK = function(/*const struct SupportContext **/ ctx, /*cpCollisionID **/ idRef) {
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
        var id = idRef.id;
        /*struct MinkowskiPoint*/
        var v0, v1;
        if (id && ENABLE_CACHING) {
            v0 = new MinkoskiPoint(ShapePoint(ctx.shape1, id >> 24 & 255), ShapePoint(ctx.shape2, id >> 16 & 255));
            v1 = new MinkoskiPoint(ShapePoint(ctx.shape1, id >> 8 & 255), ShapePoint(ctx.shape2, id & 255));
        } else {
            /*cpVect*/
            //        var axis = cpvperp(cpvsub(ctx.shape1.bb.center(), ctx.shape2.bb.center()));
            var bb1Center = ctx.shape1.bb.center();
            var bb2Center = ctx.shape2.bb.center();
            var axisY = bb1Center.x - bb2Center.x;
            var axisX = -bb1Center.y + bb2Center.y;
            v0 = Support(ctx, new Vect(axisX, axisY));
            v1 = Support(ctx, new Vect(-axisX, -axisY));
        }
        /*struct ClosestPoints*/
        var points = GJKRecurse(ctx, v0, v1, 1);
        idRef.id = points.id;
        return points;
    };
    //MARK: Contact Clipping
    //static inline void
    var Contact1 = function(/*cpFloat*/ dist, /*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ refr, /*cpFloat*/ incr, /*cpVect*/ n, /*cpHashValue*/ hash, /*cpContact **/ arr) {
        /*cpFloat*/
        var rsum = refr + incr;
        /*cpFloat*/
        var alpha = rsum > 0 ? refr / rsum : .5;
        /*cpVect*/
        var point = cpvlerp(a, b, alpha);
        arr.push(new Contact(point, n, dist - rsum, hash));
    };
    //static inline int
    var Contact2 = function(/*cpVect*/ refp, /*cpVect*/ inca, /*cpVect*/ incb, /*cpFloat*/ refr, /*cpFloat*/ incr, /*cpVect*/ refn, /*cpVect*/ n, /*cpHashValue*/ hash, /*cpContact **/ arr) {
        var incax = inca.x;
        var incay = inca.y;
        var incbx = incb.x;
        var incby = incb.y;
        var refnx = refn.x;
        var refny = refn.y;
        var refpx = refp.x;
        var refpy = refp.y;
        /*cpFloat*/
        //    var cian = cpvcross(inca, refn);
        var cian = incax * refny - incay * refnx;
        /*cpFloat*/
        //    var cibn = cpvcross(incb, refn);
        var cibn = incbx * refny - incby * refnx;
        /*cpFloat*/
        //    var crpn = cpvcross(refp, refn);
        var crpn = refpx * refny - refpy * refnx;
        /*cpFloat*/
        var t = 1 - cpfclamp01((cibn - crpn) / (cibn - cian));
        /*cpVect*/
        var point = cpvlerp(inca, incb, t);
        /*cpFloat*/
        //    var pd = cpvdot(cpvsub(point, refp), refn);
        var pd = (point.x - refpx) * refnx + (point.y - refpy) * refny;
        if (t > 0 && pd <= 0) {
            /*cpFloat*/
            var rsum = refr + incr;
            /*cpFloat*/
            var alpha = rsum > 0 ? incr * (1 - (rsum + pd) / rsum) : -.5 * pd;
            //        arr.push(new Contact(cpvadd(point, cpvmult(refn, alpha)), n, pd, hash));
            arr.push(new Contact(new Vect(point.x + refnx * alpha, point.y + refny * alpha), n, pd, hash));
            return 1;
        } else {
            return 0;
        }
    };
    //static inline int
    var ClipContacts = function(/*const struct Edge*/ ref, /*const struct Edge*/ inc, /*const struct ClosestPoints*/ points, /*const cpFloat*/ nflip, /*cpContact **/ arr) {
        /*cpVect*/
        //    var inc_offs = cpvmult(inc.n, inc.r);
        //    var inc_offs = new Vect(inc.n.x * inc.r, inc.n.y * inc.r);
        var incr = inc.r;
        var inc_offsX = inc.n.x * incr;
        var inc_offsY = inc.n.y * incr;
        /*cpVect*/
        //    var ref_offs = cpvmult(ref.n, ref.r);
        //    var ref_offs = new Vect(ref.n.x * ref.r, ref.n.y * ref.r);
        var refn = ref.n;
        var refr = ref.r;
        var ref_offsX = refn.x * refr;
        var ref_offsY = refn.y * refr;
        /*cpVect*/
        //    var inca = cpvadd(inc.a.p, inc_offs);
        var incap = inc.a.p;
        var inca = new Vect(incap.x + inc_offsX, incap.y + inc_offsY);
        /*cpVect*/
        //    var incb = cpvadd(inc.b.p, inc_offs);
        var incbp = inc.b.p;
        var incb = new Vect(incbp.x + inc_offsX, incbp.y + inc_offsY);
        /*cpVect*/
        var refap = ref.a.p;
        var refbp = ref.b.p;
        var closest_inca = cpClosetPointOnSegment(incap, refap, refbp);
        /*cpVect*/
        var closest_incb = cpClosetPointOnSegment(incbp, refap, refbp);
        /*cpVect*/
        var pointsn = points.n;
        var f = nflip * points.d;
        //    var msa = new Vect(pointsn.x * f, pointsn.y * f);
        var msax = pointsn.x * f;
        var msay = pointsn.y * f;
        /*cpFloat*/
        //    var cost_a = cpvdistsq(cpvsub(incap, closest_inca), msa);
        var cost_ax = incap.x - closest_inca.x - msax;
        var cost_ay = incap.y - closest_inca.y - msay;
        var cost_a = cost_ax * cost_ax + cost_ay * cost_ay;
        /*cpFloat*/
        //    var cost_b = cpvdistsq(cpvsub(incbp, closest_incb), msa);
        var cost_bx = incbp.x - closest_incb.x - msax;
        var cost_by = incbp.y - closest_incb.y - msay;
        var cost_b = cost_bx * cost_bx + cost_by * cost_by;
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
            //        var refp = cpvadd(ref.a.p, ref_offs);
            var refp = new Vect(refap.x + ref_offsX, refap.y + ref_offsY);
            Contact1(points.d, closest_inca, incap, refr, incr, pointsn, hash_iarb, arr);
            return Contact2(refp, inca, incb, refr, incr, refn, pointsn, hash_ibra, arr) + 1;
        } else {
            /*cpVect*/
            //        var refp = cpvadd(ref.b.p, ref_offs);
            var refp = new Vect(refbp.x + ref_offsX, refbp.y + ref_offsY);
            Contact1(points.d, closest_incb, incbp, refr, incr, pointsn, hash_ibra, arr);
            return Contact2(refp, incb, inca, refr, incr, refn, pointsn, hash_iarb, arr) + 1;
        }
    };
    //static inline int
    var ContactPoints = function(/*const struct Edge*/ e1, /*const struct Edge*/ e2, /*const struct ClosestPoints*/ points, /*cpContact **/ arr) {
        /*cpFloat*/
        var mindist = e1.r + e2.r;
        if (points.d <= mindist) {
            /*cpFloat*/
            var pick = cpvdot(e1.n, points.n) + cpvdot(e2.n, points.n);
            if (pick != 0 && pick > 0 || // If the edges are both perfectly aligned weird things happen.
            // This is *very* common at the start of a simulation.
            // Pick the longest edge as the reference to break the tie.
            pick == 0 && cpvdistsq(e1.a.p, e1.b.p) > cpvdistsq(e2.a.p, e2.b.p)) {
                return ClipContacts(e1, e2, points, 1, arr);
            } else {
                return ClipContacts(e2, e1, points, -1, arr);
            }
        } else {
            return 0;
        }
    };
    //MARK: Collision Functions
    //typedef int (*CollisionFunc)(const cpShape *a, const cpShape *b, cpCollisionID *id, cpContact *arr);
    // Collide circle shapes.
    //static int
    var CircleToCircle = function(/*const cpCircleShape **/ c1, /*const cpCircleShape **/ c2, /*cpCollisionID **/ idRef, /*cpContact **/ arr) {
        var con = CircleToCircleQuery(c1.tc, c2.tc, c1.r, c2.r, 0);
        if (con) {
            arr.push(con);
            return 1;
        }
        return 0;
    };
    //static int
    var CircleToSegment = function(/*const cpCircleShape **/ circleShape, /*const cpSegmentShape **/ segmentShape, /*cpCollisionID **/ idRef, /*cpContact **/ arr) {
        /*cpVect*/
        var seg_a = segmentShape.ta;
        /*cpVect*/
        var seg_b = segmentShape.tb;
        /*cpVect*/
        var center = circleShape.tc;
        /*cpVect*/
        //    var seg_delta = cpvsub(seg_b, seg_a);
        var seg_deltax = seg_b.x - seg_a.x;
        var seg_deltay = seg_b.y - seg_a.y;
        /*cpFloat*/
        //    var closest_t = cpfclamp01(cpvdot(seg_delta, cpvsub(center, seg_a)) / cpvlengthsq(seg_delta));
        var closest_t = cpfclamp01((seg_deltax * (center.x - seg_a.x) + seg_deltay * (center.y - seg_a.y)) / (seg_deltax * seg_deltax + seg_deltay * seg_deltay));
        /*cpVect*/
        //    var closest = cpvadd(seg_a, cpvmult(seg_delta, closest_t));
        var closest = new Vect(seg_a.x + seg_deltax * closest_t, seg_a.y + seg_deltay * closest_t);
        var con;
        if (con = CircleToCircleQuery(center, closest, circleShape.r, segmentShape.r, 0)) {
            /*cpVect*/
            var n = con.n;
            // Reject endcap collisions if tangents are provided.
            if ((closest_t != 0 || segmentShape.a_tangent.x == 0 && segmentShape.a_tangent.y == 0 || cpvdot(n, cpvrotate(segmentShape.a_tangent, segmentShape.body.rot)) >= 0) && (closest_t != 1 || segmentShape.b_tangent.x == 0 && segmentShape.b_tangent.y == 0 || cpvdot(n, cpvrotate(segmentShape.b_tangent, segmentShape.body.rot)) >= 0)) {
                arr.push(con);
                return 1;
            }
        }
        return 0;
    };
    //static int
    var SegmentToSegment = function(/*const cpSegmentShape **/ seg1, /*const cpSegmentShape **/ seg2, /*cpCollisionID **/ idRef, /*cpContact **/ arr) {
        /*struct SupportContext*/
        var context = new SupportContext(/*(cpShape *)*/ seg1, /*(cpShape *)*/ seg2, /*(SupportPointFunc)*/ SegmentSupportPoint, /*(SupportPointFunc)*/ SegmentSupportPoint);
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
        if (points.d <= seg1.r + seg2.r && (!cpveql(points.a, seg1.ta) || cpvdot(n, cpvrotate(seg1.a_tangent, rot1)) <= 0) && (!cpveql(points.a, seg1.tb) || cpvdot(n, cpvrotate(seg1.b_tangent, rot1)) <= 0) && (!cpveql(points.b, seg2.ta) || cpvdot(n, cpvrotate(seg2.a_tangent, rot2)) >= 0) && (!cpveql(points.b, seg2.tb) || cpvdot(n, cpvrotate(seg2.b_tangent, rot2)) >= 0)) {
            return ContactPoints(SupportEdgeForSegment(seg1, n), SupportEdgeForSegment(seg2, cpvneg(n)), points, arr);
        } else {
            return 0;
        }
    };
    //static int
    var PolyToPoly = function(/*const cpPolyShape **/ poly1, /*const cpPolyShape **/ poly2, /*cpCollisionID **/ idRef, /*cpContact **/ arr) {
        /*struct SupportContext*/
        var context = new SupportContext(/*(cpShape *)*/ poly1, /*(cpShape *)*/ poly2, /*(SupportPointFunc)*/ PolySupportPoint, /*(SupportPointFunc)*/ PolySupportPoint);
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
        if (points.d <= 0 || points.d - poly1.r - poly2.r <= 0) {
            return ContactPoints(SupportEdgeForPoly(poly1, points.n), SupportEdgeForPoly(poly2, cpvneg(points.n)), points, arr);
        } else {
            return 0;
        }
    };
    //static int
    var SegmentToPoly = function(/*const cpSegmentShape **/ seg, /*const cpPolyShape **/ poly, /*cpCollisionID **/ id, /*cpContact **/ arr) {
        /*struct SupportContext*/
        var context = new SupportContext(/*(cpShape *)*/ seg, /*(cpShape *)*/ poly, /*(SupportPointFunc)*/ SegmentSupportPoint, /*(SupportPointFunc)*/ PolySupportPoint);
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
        if (points.d - seg.r - poly.r <= 0 && (seg.a_tangent.x == 0 && seg.a_tangent.y == 0 || !cpveql(points.a, seg.ta) || cpvdot(n, cpvrotate(seg.a_tangent, rot)) <= 0) && (seg.b_tangent.x == 0 && seg.b_tangent.y == 0 || !cpveql(points.a, seg.tb) || cpvdot(n, cpvrotate(seg.b_tangent, rot)) <= 0)) {
            return ContactPoints(SupportEdgeForSegment(seg, n), SupportEdgeForPoly(poly, cpvneg(n)), points, arr);
        } else {
            return 0;
        }
    };
    // This one is less gross, but still gross.
    // TODO: Comment me!
    //static int
    var CircleToPoly = function(/*const cpCircleShape **/ circle, /*const cpPolyShape **/ poly, /*cpCollisionID **/ id, /*cpContact **/ con) {
        /*struct SupportContext*/
        var context = new SupportContext(/*(cpShape *)*/ circle, /*(cpShape *)*/ poly, /*(SupportPointFunc)*/ CircleSupportPoint, /*(SupportPointFunc)*/ PolySupportPoint);
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
        if (points.d - mindist <= 0) {
            /*cpVect*/
            var p = cpvlerp(points.a, points.b, circle.r / mindist);
            con.push(new Contact(p, points.n, points.d - mindist, 0));
            return 1;
        } else {
            return 0;
        }
    };
    /*static const CollisionFunc*/
    var builtinCollisionFuncs = [ /*(CollisionFunc)*/
    CircleToCircle, null, null, /*(CollisionFunc)*/
    CircleToSegment, null, null, /*(CollisionFunc)*/
    CircleToPoly, /*(CollisionFunc)*/
    SegmentToPoly, /*(CollisionFunc)*/
    PolyToPoly ];
    /*static const CollisionFunc **/
    var colfuncs = builtinCollisionFuncs;
    /*static const CollisionFunc*/
    var segmentCollisions = [ /*(CollisionFunc)*/
    CircleToCircle, null, null, /*(CollisionFunc)*/
    CircleToSegment, /*(CollisionFunc)*/
    SegmentToSegment, null, /*(CollisionFunc)*/
    CircleToPoly, /*(CollisionFunc)*/
    SegmentToPoly, /*(CollisionFunc)*/
    PolyToPoly ];
    //void
    cp.enableSegmentToSegmentCollisions = function() {
        colfuncs = segmentCollisions;
    };
    //int
    var cpCollideShapes = function(/*const cpShape **/ a, /*const cpShape **/ b, /*cpCollisionID **/ idRef, /*cpContact **/ arr) {
        // Their shape types must be in order.
        if (NDEBUG) {
            cpAssertSoft(a.type <= b.type, "Internal Error: Collision shapes passed to cpCollideShapes() are not sorted.");
        }
        /*CollisionFunc*/
        var cfunc = colfuncs[a.type + b.type * CP_NUM_SHAPES];
        /*int*/
        var numContacts = cfunc ? cfunc(a, b, idRef, arr) : 0;
        if (NDEBUG) {
            cpAssertSoft(numContacts <= CP_MAX_CONTACTS_PER_ARBITER, "Internal error: Too many contact points returned.");
        }
        return numContacts;
    };
    /// @private
    var CP_CIRCLE_SHAPE = cp.CIRCLE_SHAPE = 0;
    var CP_SEGMENT_SHAPE = cp.SEGMENT_SHAPE = 1;
    var CP_POLY_SHAPE = cp.POLY_SHAPE = 2;
    var CP_NUM_SHAPES = 3;
    ///// Nearest point query info struct.
    var cpNearestPointQueryInfo = function(/*cpShape*/ shape, /*cpVect*/ p, /*cpFloat*/ d, /*cpVect*/ g) {
        this.shape = shape;
        this.p = p;
        this.d = d;
        this.g = g;
    };
    ///// Segment query info struct.
    var cpSegmentQueryInfo = function(/*cpShape*/ shape, /*cpFloat*/ t, /*cpVect*/ n) {
        this.shape = shape;
        this.t = t;
        this.n = n;
    };
    /// Get the hit point for a segment query.
    //cpVect
    cpSegmentQueryInfo.prototype.hitPoint = function(/*const cpVect*/ start, /*const cpVect*/ end) {
        return cpvlerp(start, end, this.t);
    };
    /// Get the hit distance for a segment query.
    //cpFloat
    cpSegmentQueryInfo.prototype.hitDist = function(/*const cpVect*/ start, /*const cpVect*/ end) {
        return cpvdist(start, end) * this.t;
    };
    /*cpHashValue*/
    var cpShapeIDCounter = 0;
    //void
    //var cpResetShapeIdCounter = function() {
    //	cpShapeIDCounter = 0;
    //}
    //cpShape*
    var Shape = cp.Shape = function(/*cpBody*/ body) {
        var shape = this;
        shape.hashid = cpShapeIDCounter;
        cpShapeIDCounter++;
        shape.body = body;
        //    shape.sensor = 0;
        //    shape.e = 0.0;
        //    shape.u = 0.0;
        shape.surface_v = new Vect(0, 0);
        shape.bb = new BB(0, 0, 0, 0);
    };
    Shape.prototype.sensor = 0;
    Shape.prototype.e = 0;
    Shape.prototype.u = 0;
    Shape.prototype.collision_type = 0;
    Shape.prototype.group = CP_NO_GROUP;
    Shape.prototype.layers = CP_ALL_LAYERS;
    Shape.prototype.data = null;
    Shape.prototype.space = null;
    Shape.prototype.next = null;
    Shape.prototype.prev = null;
    Shape.prototype.setElasticity = function(e) {
        this.e = e;
    };
    Shape.prototype.setFriction = function(u) {
        this.body.activate();
        this.u = u;
    };
    Shape.prototype.getFriction = function() {
        return this.u;
    };
    Shape.prototype.setLayers = function(layers) {
        this.body.activate();
        this.layers = layers;
    };
    Shape.prototype.setSensor = function(sensor) {
        this.body.activate();
        this.sensor = sensor;
    };
    Shape.prototype.setCollisionType = function(collision_type) {
        this.body.activate();
        this.collision_type = collision_type;
    };
    Shape.prototype.getBody = function() {
        return this.body;
    };
    Shape.prototype.getBB = function() {
        return this.bb;
    };
    Shape.prototype.setRadius = function(radius) {
        this.r = radius;
    };
    //void
    Shape.prototype.setBody = function(/*cpBody*/ body) {
        var shape = this;
        cpAssertHard(!shape.active(), "You cannot change the body on an active shape. You must remove the shape from the space before changing the body.");
        shape.body = body;
    };
    //cpBB
    Shape.prototype.cacheBB = function() {
        var shape = this;
        /*cpBody*/
        var body = shape.body;
        return shape.update(body.p, body.rot);
    };
    //cpBB
    Shape.prototype.update = function(/*cpVect*/ pos, /*cpVect*/ rot) {
        var shape = this;
        shape.cacheData(pos, rot);
        return shape.bb;
    };
    //cpBool
    Shape.prototype.pointQuery = function(/*cpVect*/ p) {
        var shape = this;
        //	/*cpNearestPointQueryInfo*/ var info = new cpNearestPointQueryInfo(null, cpvzero, Infinity, cpvzero);
        var info = shape.nearestPointQuery(p);
        return info && info.d < 0;
    };
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
    Shape.prototype.segmentQuery = function(/*cpVect*/ a, /*cpVect*/ b, /*cpSegmentQueryInfo*/ info) {
        var shape = this;
        var nearest = shape.nearestPointQuery(shape, a);
        if (nearest) {
            if (nearest.d <= 0) {
                var n = cpvnormalize(cpvsub(a, nearest.p));
                return new cpSegmentQueryInfo(shape, 0, n);
            } else {
                return shape.segmentQuery(shape, a, b, info);
            }
        }
    };
    //cpCircleShape *
    var CircleShape = cp.CircleShape = function(/*cpBody*/ body, /*cpFloat*/ radius, /*cpVect*/ offset) {
        var circle = this;
        circle.c = offset;
        circle.r = radius;
        circle.tc = new Vect(0, 0);
        Shape.apply(this, arguments);
    };
    _extend(Shape, CircleShape);
    CircleShape.prototype.type = CP_CIRCLE_SHAPE;
    //static cpBB
    CircleShape.prototype.cacheData = function(/*cpVect*/ p, /*cpVect*/ rot) {
        var circle = this;
        var bb = circle.bb;
        var r = circle.r;
        /*cpVect*/
        //    var c = circle.tc = cpvadd(p, cpvrotate(circle.c, rot));
        //    return BBNewForCircle(c, circle.r);
        var cx = circle.c.x;
        var cy = circle.c.y;
        var x = circle.tc.x = p.x + cx * rot.x - cy * rot.y;
        var y = circle.tc.y = p.y + cx * rot.y + cy * rot.x;
        bb.l = x - r;
        bb.b = y - r;
        bb.r = x + r;
        bb.t = y + r;
        return bb;
    };
    //static void
    CircleShape.prototype.nearestPointQuery = function(/*cpVect*/ p) {
        var circle = this;
        /*cpVect*/
        var delta = cpvsub(p, circle.tc);
        /*cpFloat*/
        var d = cpvlength(delta);
        /*cpFloat*/
        var r = circle.r;
        var p = cpvadd(circle.tc, cpvmult(delta, r / d));
        // TODO div/0
        var d = d - r;
        // Use up for the gradient if the distance is very small.
        var g = d > MAGIC_EPSILON ? cpvmult(delta, 1 / d) : new Vect(0, 1);
        return new cpNearestPointQueryInfo(circle, p, d, g);
    };
    //static void
    CircleShape.prototype.segmentQuery = function(/*cpVect*/ a, /*cpVect*/ b) {
        var circle = this;
        return CircleSegmentQuery(/*cpShape*/ circle, circle.tc, circle.r, a, b);
    };
    //cpSegmentShape *
    var SegmentShape = cp.SegmentShape = function(/*cpBody*/ body, /*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ r) {
        var seg = this;
        seg.a = a;
        seg.b = b;
        seg.n = cpvperp(cpvnormalize(cpvsub(b, a)));
        seg.r = r;
        seg.a_tangent = new Vect(0, 0);
        seg.b_tangent = new Vect(0, 0);
        Shape.apply(this, arguments);
    };
    _extend(Shape, SegmentShape);
    SegmentShape.prototype.type = CP_SEGMENT_SHAPE;
    //static cpBB
    SegmentShape.prototype.cacheData = function(/*cpVect*/ p, /*cpVect*/ rot) {
        var seg = this;
        seg.ta = cpvadd(p, cpvrotate(seg.a, rot));
        seg.tb = cpvadd(p, cpvrotate(seg.b, rot));
        seg.tn = cpvrotate(seg.n, rot);
        var l, r, b, t;
        if (seg.ta.x < seg.tb.x) {
            l = seg.ta.x;
            r = seg.tb.x;
        } else {
            l = seg.tb.x;
            r = seg.ta.x;
        }
        if (seg.ta.y < seg.tb.y) {
            b = seg.ta.y;
            t = seg.tb.y;
        } else {
            b = seg.tb.y;
            t = seg.ta.y;
        }
        /*cpFloat*/
        var rad = seg.r;
        var bb = seg.bb;
        bb.l = l - rad;
        bb.b = b - rad;
        bb.r = r + rad;
        bb.t = t + rad;
        return bb;
    };
    //cpNearestPointQueryInfo
    SegmentShape.prototype.nearestPointQuery = function(/*cpVect*/ p) {
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
        var g = cpvmult(delta, 1 / d);
        var p = d ? cpvadd(closest, cpvmult(g, r)) : closest;
        var d = d - r;
        // Use the segment's normal if the distance is very small.
        var g = d > MAGIC_EPSILON ? g : seg.n;
        return new cpNearestPointQueryInfo(seg, p, d, g);
    };
    //static void
    SegmentShape.prototype.segmentQuery = function(/*cpVect*/ a, /*cpVect*/ b) {
        var seg = this;
        /*cpVect*/
        var n = seg.tn;
        /*cpFloat*/
        var d = cpvdot(cpvsub(seg.ta, a), n);
        /*cpFloat*/
        var r = seg.r;
        /*cpVect*/
        var flipped_n = d > 0 ? cpvneg(n) : n;
        /*cpVect*/
        var seg_offset = cpvsub(cpvmult(flipped_n, r), a);
        // Make the endpoints relative to 'a' and move them by the thickness of the segment.
        /*cpVect*/
        var seg_a = cpvadd(seg.ta, seg_offset);
        /*cpVect*/
        var seg_b = cpvadd(seg.tb, seg_offset);
        /*cpVect*/
        var delta = cpvsub(b, a);
        if (cpvcross(delta, seg_a) * cpvcross(delta, seg_b) <= 0) {
            /*cpFloat*/
            var d_offset = d + (d > 0 ? -r : r);
            /*cpFloat*/
            var ad = -d_offset;
            /*cpFloat*/
            var bd = cpvdot(delta, n) - d_offset;
            if (ad * bd < 0) {
                return {
                    shape: seg,
                    t: ad / (ad - bd),
                    n: flipped_n
                };
            }
        } else if (r != 0) {
            /*cpSegmentQueryInfo*/
            var info1 = CircleSegmentQuery(/*cpShape*/ seg, seg.ta, seg.r, a, b);
            var info2 = CircleSegmentQuery(/*cpShape*/ seg, seg.tb, seg.r, a, b);
            if (info1 && info2) {
                return info1.t < info2.t ? info1 : info2;
            }
            return info1 || info2;
        }
    };
    //void
    SegmentShape.prototype.setNeighbors = function(/*cpVect*/ prev, /*cpVect*/ next) {
        /*cpSegmentShape*/
        var seg = this;
        //    seg.a_tangent = cpvsub(prev, seg.a);
        //    seg.b_tangent = cpvsub(next, seg.b);
        seg.a_tangent.x = prev.x - seg.a.x;
        seg.a_tangent.y = prev.y - seg.a.y;
        seg.b_tangent.x = next.x - seg.b.x;
        seg.b_tangent.y = next.y - seg.b.y;
    };
    // Unsafe API (chipmunk_unsafe.h)
    //void
    CircleShape.prototype.setOffset = function(/*cpVect*/ offset) {
        this.c = offset;
    };
    //void
    SegmentShape.prototype.setEndpoints = function(/*cpVect*/ a, /*cpVect*/ b) {
        /*cpSegmentShape*/
        var seg = this;
        seg.a = a;
        seg.b = b;
        seg.n = cpvperp(cpvnormalize(cpvsub(b, a)));
    };
    //cpPolyShape *
    var PolyShape = cp.PolyShape = function(/*cpBody*/ body, /*const cpVect*/ verts, /*cpVect*/ offset) {
        PolyShape2.call(this, body, verts, offset, 0);
    };
    _extend(Shape, PolyShape);
    PolyShape.prototype.type = CP_POLY_SHAPE;
    //static cpBB
    PolyShape.prototype.transformVerts = function(/*cpVect*/ p, /*cpVect*/ rot) {
        var poly = this;
        /*cpVect*/
        var src = poly.verts;
        /*cpVect*/
        var dst = poly.tVerts;
        /*cpFloat*/
        var l = Infinity, r = -Infinity;
        /*cpFloat*/
        var b = Infinity, t = -Infinity;
        var px = p.x;
        var py = p.y;
        var rotx = rot.x;
        var roty = rot.y;
        for (var i = 0; i < src.length; i++) {
            /*cpVect*/
            //        var v = cpvadd(p, cpvrotate(src[i], rot));
            var vx = px + src[i].x * rotx - src[i].y * roty;
            var vy = py + src[i].x * roty + src[i].y * rotx;
            dst[i] = new Vect(vx, vy);
            l = cpfmin(l, vx);
            r = cpfmax(r, vx);
            b = cpfmin(b, vy);
            t = cpfmax(t, vy);
        }
        /*cpFloat*/
        var radius = poly.r;
        var bb = this.bb;
        bb.l = l - radius;
        bb.b = b - radius;
        bb.r = r + radius;
        bb.t = t + radius;
    };
    //static void
    PolyShape.prototype.transformAxes = function(/*cpVect*/ p, /*cpVect*/ rot) {
        var poly = this;
        /*cpSplittingPlane*/
        var src = poly.planes;
        /*cpSplittingPlane*/
        var dst = poly.tPlanes;
        var rotx = rot.x;
        var roty = rot.y;
        var px = p.x;
        var py = p.y;
        for (var i = 0; i < src.length; i++) {
            /*cpVect*/
            //        var n = cpvrotate(src[i].n, rot);
            var n = src[i].n;
            var nx = n.x * rotx - n.y * roty;
            var ny = n.x * roty + n.y * rotx;
            //        dst[i].n = n;
            dst[i].n.x = nx;
            dst[i].n.y = ny;
            //        dst[i].d = cpvdot(p, n) + src[i].d;
            dst[i].d = px * nx + py * ny + src[i].d;
        }
    };
    //static cpBB
    PolyShape.prototype.cacheData = function(/*cpVect*/ p, /*cpVect*/ rot) {
        var poly = this;
        poly.transformAxes(p, rot);
        return poly.transformVerts(p, rot);
    };
    //cpNearestPointQueryInfo
    PolyShape.prototype.nearestPointQuery = function(/*cpVect*/ p) {
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
            if (planes[i].compare(p) > 0) outside = true;
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
        var dist = outside ? minDist : -minDist;
        /*cpVect*/
        var g = cpvmult(cpvsub(p, closestPoint), 1 / dist);
        var p = cpvadd(closestPoint, cpvmult(g, r));
        var d = dist - r;
        // Use the normal of the closest segment if the distance is small.
        g = minDist > MAGIC_EPSILON ? g : closestNormal;
        return new cpNearestPointQueryInfo(poly, p, d, g);
    };
    //static void
    PolyShape.prototype.segmentQuery = function(/*cpVect*/ a, /*cpVect*/ b) {
        var poly = this;
        var info;
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
            if (d > 0) continue;
            /*cpFloat*/
            var bn = cpvdot(b, n);
            /*cpFloat*/
            var t = d / (bn - an);
            if (t < 0 || 1 < t) continue;
            /*cpVect*/
            var point = cpvlerp(a, b, t);
            /*cpFloat*/
            var dt = -cpvcross(n, point);
            /*cpFloat*/
            var dtMin = -cpvcross(n, verts[(i - 1 + numVerts) % numVerts]);
            /*cpFloat*/
            var dtMax = -cpvcross(n, verts[i]);
            if (dtMin <= dt && dt <= dtMax) {
                info = new cpSegmentQueryInfo(poly, t, n);
            }
        }
        //    return info
        // Also check against the beveled vertexes.
        if (r > 0) {
            for (/*int*/ var i = 0; i < numVerts; i++) {
                //            /*cpSegmentQueryInfo*/ circle_info = {NULL, 1.0f, cpvzero};
                var circle_info = CircleSegmentQuery(poly, verts[i], r, a, b);
                if (circle_info && (!info || circle_info.t < info.t)) {
                    info = circle_info;
                }
            }
        }
        return info;
    };
    //cpBool
    var cpPolyValidate = function(/*const cpVect*/ verts) {
        var numVerts = verts.length;
        for (var i = 0; i < numVerts; i++) {
            /*cpVect*/
            var a = verts[i];
            /*cpVect*/
            var b = verts[(i + 1) % numVerts];
            /*cpVect*/
            var c = verts[(i + 2) % numVerts];
            if (cpvcross(cpvsub(b, a), cpvsub(c, a)) > 0) {
                return false;
            }
        }
        return true;
    };
    //int
    PolyShape.prototype.getNumVerts = function() {
        return this.verts.length;
    };
    //cpVect
    PolyShape.prototype.getVert = function(/*int*/ idx) {
        var shape = this;
        cpAssertHard(0 <= idx && idx < shape.getNumVerts(), "Index out of range.");
        return shape.verts[idx];
    };
    //cpFloat
    PolyShape.prototype.getRadius = function() {
        return this.r;
    };
    //static void
    var setUpVerts = function(/*cpPolyShape **/ poly, /*const cpVect **/ verts, /*cpVect*/ offset) {
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
            poly.tPlanes[i] = new cpSplittingPlane(new Vect(0, 0), 0);
        }
    };
    //void
    PolyShape.prototype.setVerts = function(/*cpVect*/ verts, /*cpVect*/ offset) {
        var shape = this;
        setUpVerts(/*cpPolyShape*/ shape, verts, offset);
    };
    //cpPolyShape *
    var PolyShape2 = cp.PolyShape2 = function(/*cpBody*/ body, /*const cpVect*/ verts, /*cpVect*/ offset, /*cpFloat*/ radius) {
        var poly = this;
        setUpVerts(poly, verts, offset);
        Shape.call(poly, body);
        poly.r = radius;
    };
    //cpPolyShape *
    var BoxShape = cp.BoxShape = function(/*cpBody*/ body, /*cpFloat*/ width, /*cpFloat*/ height) {
        /*cpFloat*/
        var hw = width / 2;
        /*cpFloat*/
        var hh = height / 2;
        BoxShape2.call(this, body, new BB(-hw, -hh, hw, hh));
    };
    //cpPolyShape *
    var BoxShape2 = cp.BoxShape2 = function(/*cpBody*/ body, /*cpBB*/ box) {
        BoxShape3.call(this, body, box, 0);
    };
    //cpPolyShape *
    var BoxShape3 = cp.BoxShape3 = function(/*cpBody*/ body, /*cpBB*/ box, /*cpFloat*/ radius) {
        var verts = [ new Vect(box.l, box.b), new Vect(box.l, box.t), new Vect(box.r, box.t), new Vect(box.r, box.b) ];
        PolyShape2.call(this, body, verts, cpvzero, radius);
    };
    _extend(PolyShape, PolyShape2);
    _extend(PolyShape, BoxShape);
    _extend(PolyShape, BoxShape2);
    _extend(PolyShape, BoxShape3);
    //MARK: Contact Set Helpers
    //MARK: Collision Handler Set HelperFunctions
    //MARK: Misc Helper Funcs
    // Default collision functions.
    var alwaysCollide = function() {
        return 1;
    };
    // function to get the estimated velocity of a shape for the cpBBTree.
    /*static cpVect*/
    var shapeVelocityFunc = function(/*cpShape **/ shape) {
        return shape.body.v;
    };
    //MARK: Memory Management Functions
    var cpShapeGetBB = function(shape) {
        return shape.bb;
    };
    var cpDefaultCollisionHandler = new cpCollisionHandler(0, 0, alwaysCollide, alwaysCollide, _nothing, _nothing, null);
    //cpSpace*
    var Space = cp.Space = function() {
        var space = this;
        space.iterations = 10;
        space.gravity = cpvzero;
        space.damping = 1;
        space.collisionSlop = .1;
        space.collisionBias = cpfpow(1 - .1, 60);
        space.collisionPersistence = 3;
        space.locked = 0;
        space.curr_dt = 0;
        space.stamp = 0;
        space.staticShapes = new BBTree(/*cpSpatialIndexBBFunc*/ cpShapeGetBB, null);
        space.activeShapes = new BBTree(/*cpSpatialIndexBBFunc*/ cpShapeGetBB, space.staticShapes);
        space.activeShapes.setVelocityFunc(/*cpBBTreeVelocityFunc*/ shapeVelocityFunc);
        space.bodies = [];
        space.sleepingComponents = [];
        space.rousedBodies = [];
        space.sleepTimeThreshold = Infinity;
        space.idleSpeedThreshold = 0;
        space.enableContactGraph = false;
        space.arbiters = [];
        space.pooledArbiters = [];
        //    space.contactBuffersHead = null;
        space.cachedArbiters = {};
        space.constraints = [];
        space.defaultHandler = cpDefaultCollisionHandler;
        space.collisionHandlers = {};
        //	cpHashSetSetDefaultValue(space.collisionHandlers, &cpDefaultCollisionHandler);
        space.postStepCallbacks = [];
        space.skipPostStep = false;
        //	space.staticBody = Body.newStatic();
        //    space.staticBody.space = this;
        space.staticBody = new Body(Infinity, Infinity);
        space.staticBody.nodeIdleTime = Infinity;
        return space;
    };
    Space.prototype.setIterations = function(iterations) {
        this.iterations = iterations;
    };
    Space.prototype.getCurrentTimeStep = function() {
        return this.curr_dt;
    };
    var cpAssertSpaceUnlocked = function(space) {
        cpAssertHard(!space.locked, "This operation cannot be done safely during a call to cpSpaceStep() or during a query. " + "Put these calls into a post-step callback.");
    };
    //MARK: Collision Handler Function Management
    //void
    Space.prototype.addCollisionHandler = function(/*cpCollisionType*/ a, /*cpCollisionType*/ b, /*cpCollisionBeginFunc*/ begin, /*cpCollisionPreSolveFunc*/ preSolve, /*cpCollisionPostSolveFunc*/ postSolve, /*cpCollisionSeparateFunc*/ separate, /*void*/ data) {
        var space = this;
        cpAssertSpaceUnlocked(space);
        // Remove any old function so the new one will get added.
        space.removeCollisionHandler(a, b);
        /*cpCollisionHandler*/
        var handler = new cpCollisionHandler(a, b, begin ? begin : alwaysCollide, preSolve ? preSolve : alwaysCollide, postSolve ? postSolve : _nothing, separate ? separate : _nothing, data);
        space.collisionHandlers[CP_HASH_PAIR(a, b)] = handler;
    };
    //void
    Space.prototype.removeCollisionHandler = function(/*cpCollisionType*/ a, /*cpCollisionType*/ b) {
        var space = this;
        cpAssertSpaceUnlocked(space);
        delete space.collisionHandlers[CP_HASH_PAIR(a, b)];
    };
    //void
    Space.prototype.setDefaultCollisionHandler = function(/*cpCollisionBeginFunc*/ begin, /*cpCollisionPreSolveFunc*/ preSolve, /*cpCollisionPostSolveFunc*/ postSolve, /*cpCollisionSeparateFunc*/ separate, /*void*/ data) {
        var space = this;
        cpAssertSpaceUnlocked(space);
        /*cpCollisionHandler*/
        var handler = new cpCollisionHandler(0, 0, begin ? begin : alwaysCollide, preSolve ? preSolve : alwaysCollide, postSolve ? postSolve : _nothing, separate ? separate : _nothing, data);
        space.defaultHandler = handler;
    };
    //MARK: Body, Shape, and Joint Management
    //cpShape *
    Space.prototype.addShape = function(/*cpShape*/ shape) {
        var space = this;
        /*cpBody*/
        var body = shape.body;
        if (body.isStatic()) return space.addStaticShape(shape);
        cpAssertHard(shape.space != space, "You have already added this shape to this space. You must not add it a second time.");
        cpAssertHard(!shape.space, "You have already added this shape to another space. You cannot add it to a second.");
        cpAssertSpaceUnlocked(space);
        body.activate();
        body.addShape(shape);
        shape.update(body.p, body.rot);
        space.activeShapes.insert(shape, shape.hashid);
        shape.space = space;
        return shape;
    };
    //cpShape *
    Space.prototype.addStaticShape = function(/*cpShape*/ shape) {
        var space = this;
        cpAssertHard(shape.space != space, "You have already added this shape to this space. You must not add it a second time.");
        cpAssertHard(!shape.space, "You have already added this shape to another space. You cannot add it to a second.");
        cpAssertHard(shape.body.isRogue(), "You are adding a static shape to a dynamic body. Did you mean to attach it to a static or rogue body? See the documentation for more information.");
        cpAssertSpaceUnlocked(space);
        /*cpBody*/
        var body = shape.body;
        body.addShape(shape);
        shape.update(body.p, body.rot);
        space.staticShapes.insert(shape, shape.hashid);
        shape.space = space;
        return shape;
    };
    //cpBody *
    Space.prototype.addBody = function(/*cpBody*/ body) {
        var space = this;
        cpAssertHard(!body.isStatic(), "Do not add static bodies to a space. Static bodies do not move and should not be simulated.");
        cpAssertHard(body.space != space, "You have already added this body to this space. You must not add it a second time.");
        cpAssertHard(!body.space, "You have already added this body to another space. You cannot add it to a second.");
        cpAssertSpaceUnlocked(space);
        space.bodies.push(body);
        body.space = space;
        return body;
    };
    //cpConstraint *
    Space.prototype.addConstraint = function(/*cpConstraint*/ constraint) {
        var space = this;
        cpAssertHard(constraint.space != space, "You have already added this constraint to this space. You must not add it a second time.");
        cpAssertHard(!constraint.space, "You have already added this constraint to another space. You cannot add it to a second.");
        cpAssertHard(constraint.a && constraint.b, "Constraint is attached to a null body.");
        cpAssertSpaceUnlocked(space);
        constraint.a.activate();
        constraint.b.activate();
        space.constraints.push(constraint);
        // Push onto the heads of the bodies' constraint lists
        /*cpBody*/
        var a = constraint.a, b = constraint.b;
        constraint.next_a = a.constraintList;
        a.constraintList = constraint;
        constraint.next_b = b.constraintList;
        b.constraintList = constraint;
        constraint.space = space;
        return constraint;
    };
    //void
    Space.prototype.filterArbiters = function(/*cpBody*/ body, /*cpShape*/ filter) {
        var space = this;
        space.lock();
        {
            var cachedArbiters = space.cachedArbiters;
            for (var hash in cachedArbiters) {
                var arb = cachedArbiters[hash];
                if (body == arb.body_a && (filter == arb.a || filter == null) || body == arb.body_b && (filter == arb.b || filter == null)) {
                    // Call separate when removing shapes.
                    if (filter && arb.state != cpArbiterStateCached) arb.callSeparate(space);
                    arb.unthread();
                    cpArrayDeleteObj(space.arbiters, arb);
                    //                context.space.pooledArbiters.push(arb);
                    delete cachedArbiters[hash];
                }
            }
        }
        space.unlock(true);
    };
    //void
    Space.prototype.removeShape = function(/*cpShape*/ shape) {
        var space = this;
        /*cpBody*/
        var body = shape.body;
        if (body.isStatic()) {
            space.removeStaticShape(shape);
        } else {
            cpAssertHard(space.containsShape(shape), "Cannot remove a shape that was not added to the space. (Removed twice maybe?)");
            cpAssertSpaceUnlocked(space);
            body.activate();
            body.removeShape(shape);
            space.filterArbiters(body, shape);
            space.activeShapes.remove(shape, shape.hashid);
            shape.space = null;
        }
    };
    //void
    Space.prototype.removeStaticShape = function(/*cpShape*/ shape) {
        var space = this;
        cpAssertHard(space.containsShape(shape), "Cannot remove a static or sleeping shape that was not added to the space. (Removed twice maybe?)");
        cpAssertSpaceUnlocked(space);
        /*cpBody*/
        var body = shape.body;
        if (body.isStatic()) body.activateStatic(shape);
        body.removeShape(shape);
        space.filterArbiters(body, shape);
        space.staticShapes.remove(shape, shape.hashid);
        shape.space = null;
    };
    //void
    Space.prototype.removeBody = function(/*cpBody*/ body) {
        var space = this;
        cpAssertHard(space.containsBody(body), "Cannot remove a body that was not added to the space. (Removed twice maybe?)");
        cpAssertSpaceUnlocked(space);
        body.activate();
        //	space.filterArbiters(body, null);
        cpArrayDeleteObj(space.bodies, body);
        body.space = null;
    };
    //void
    Space.prototype.removeConstraint = function(/*cpConstraint*/ constraint) {
        var space = this;
        cpAssertHard(space.containsConstraint(constraint), "Cannot remove a constraint that was not added to the space. (Removed twice maybe?)");
        cpAssertSpaceUnlocked(space);
        constraint.a.activate();
        constraint.b.activate();
        cpArrayDeleteObj(space.constraints, constraint);
        constraint.a.removeConstraint(constraint);
        constraint.b.removeConstraint(constraint);
        constraint.space = null;
    };
    //cpBool
    Space.prototype.containsShape = function(/*cpShape*/ shape) {
        return shape.space == this;
    };
    //cpBool
    Space.prototype.containsBody = function(/*cpBody*/ body) {
        return body.space == this;
    };
    //cpBool
    Space.prototype.containsConstraint = function(/*cpConstraint*/ constraint) {
        return constraint.space == this;
    };
    //MARK: Static/rogue body conversion.
    //void
    Space.prototype.convertBodyToStatic = function(/*cpBody*/ body) {
        var space = this;
        cpAssertHard(!body.isStatic(), "Body is already static.");
        cpAssertHard(body.isRogue(), "Remove the body from the space before calling this function.");
        cpAssertSpaceUnlocked(space);
        body.setMass(Infinity);
        body.setMoment(Infinity);
        body.setVel(cpvzero);
        body.setAngVel(0);
        body.nodeIdleTime = Infinity;
        for (var shape = body.shapeList; shape; shape = shape.next) {
            space.activeShapes.remove(shape, shape.hashid);
            space.staticShapes.insert(shape, shape.hashid);
        }
    };
    //void
    Space.prototype.convertBodyToDynamic = function(/*cpBody*/ body, /*cpFloat*/ m, /*cpFloat*/ i) {
        var space = this;
        cpAssertHard(body.isStatic(), "Body is already dynamic.");
        cpAssertSpaceUnlocked(space);
        body.activateStatic(null);
        body.setMass(m);
        body.setMoment(i);
        body.nodeIdleTime = 0;
        for (var shape = body.shapeList; shape; shape = shape.next) {
            space.staticShapes.remove(shape, shape.hashid);
            space.activeShapes.insert(shape, shape.hashid);
        }
    };
    //MARK: Iteration
    //void
    Space.prototype.eachBody = function(/*cpSpaceBodyIteratorFunc*/ func, /*void*/ data) {
        var space = this;
        space.lock();
        {
            /*cpArray*/
            var bodies = space.bodies;
            for (var i = 0; i < bodies.length; i++) {
                func(/*cpBody*/ bodies[i], data);
            }
            /*cpArray*/
            var components = space.sleepingComponents;
            for (var i = 0; i < components.length; i++) {
                /*cpBody*/
                var root = /*cpBody*/ components[i];
                /*cpBody*/
                var body = root;
                while (body) {
                    /*cpBody*/
                    var next = body.nodeNext;
                    func(body, data);
                    body = next;
                }
            }
        }
        space.unlock(true);
    };
    //
    //var spaceShapeContext = function (/*cpSpaceShapeIteratorFunc*/ func, /*void*/ data) {
    //    this.func = func;
    //    this.data = data;
    //};
    //static void
    //var spaceEachShapeIterator = function (/*cpShape*/ shape, /*spaceShapeContext*/ context) {
    //    context.func(shape, context.data);
    //}
    //void
    Space.prototype.eachShape = function(/*cpSpaceShapeIteratorFunc*/ func, /*void*/ data) {
        var space = this;
        space.lock();
        {
            /*spaceShapeContext*/
            //        var context = new spaceShapeContext(func, data);
            space.activeShapes.each(/*cpSpatialIndexIteratorFunc*/ func, data);
            space.staticShapes.each(/*cpSpatialIndexIteratorFunc*/ func, data);
        }
        space.unlock(true);
    };
    //void
    Space.prototype.eachConstraint = function(/*cpSpaceConstraintIteratorFunc*/ func, /*void*/ data) {
        var space = this;
        space.lock();
        {
            /*cpArray*/
            var constraints = space.constraints;
            for (var i = 0; i < constraints.length; i++) {
                func(/*cpConstraint*/ constraints[i], data);
            }
        }
        space.unlock(true);
    };
    //MARK: Spatial Index Management
    //static void
    var updateBBCache = function(/*cpShape*/ shape) {
        /*cpBody*/
        var body = shape.body;
        shape.update(body.p, body.rot);
    };
    //void 
    Space.prototype.reindexStatic = function() {
        var space = this;
        cpAssertHard(!space.locked, "You cannot manually reindex objects while the space is locked. Wait until the current query or step is complete.");
        space.staticShapes.each(/*cpSpatialIndexIteratorFunc*/ updateBBCache, null);
        space.staticShapes.reindex();
    };
    //void
    Space.prototype.reindexShape = function(/*cpShape*/ shape) {
        var space = this;
        cpAssertHard(!space.locked, "You cannot manually reindex objects while the space is locked. Wait until the current query or step is complete.");
        /*cpBody*/
        var body = shape.body;
        shape.update(body.p, body.rot);
        // attempt to rehash the shape in both hashes
        space.activeShapes.reindexObject(shape, shape.hashid);
        space.staticShapes.reindexObject(shape, shape.hashid);
    };
    //void
    Space.prototype.reindexShapesForBody = function(/*cpBody*/ body) {
        var space = this;
        for (var shape = body.shapeList; shape; shape = shape.next) space.reindexShape(shape);
    };
    //static void
    //var copyShapes = function (/*cpShape*/ shape, /*cpSpatialIndex*/ index) {
    //    index.insert(shape, shape.hashid);
    //}
    //
    ////void
    //Space.prototype.useSpatialHash = function (/*cpFloat*/ dim, /*int*/ count) {
    //    var space = this;
    //    /*cpSpatialIndex*/
    //    var staticShapes = new cpSpaceHash(dim, count, /*cpSpatialIndexBBFunc*/cpShapeGetBB, null);
    //    /*cpSpatialIndex*/
    //    var activeShapes = new cpSpaceHash(dim, count, /*cpSpatialIndexBBFunc*/cpShapeGetBB, staticShapes);
    //
    //    space.staticShapes.each(/*cpSpatialIndexIteratorFunc*/copyShapes, staticShapes);
    //    space.activeShapes.each(/*cpSpatialIndexIteratorFunc*/copyShapes, activeShapes);
    //
    ////    space.staticShapes.free();
    ////    space.activeShapes.free();
    //
    //    space.staticShapes = staticShapes;
    //    space.activeShapes = activeShapes;
    //}
    //MARK: Sleeping Functions
    //void
    Space.prototype.activateBody = function(/*cpBody*/ body) {
        var space = this;
        cpAssertHard(!body.isRogue(), "Internal error: Attempting to activate a rogue body.");
        if (space.locked) {
            // cpSpaceActivateBody() is called again once the space is unlocked
            if (-1 == space.rousedBodies.indexOf(body)) space.rousedBodies.push(body);
        } else {
            if (NDEBUG) {
                cpAssertSoft(body.nodeRoot == null && body.nodeNext == null, "Internal error: Activating body non-null node pointers.");
            }
            space.bodies.push(body);
            for (var shape = body.shapeList; shape; shape = shape.next) {
                space.staticShapes.remove(shape, shape.hashid);
                space.activeShapes.insert(shape, shape.hashid);
            }
            for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
                /*cpBody*/
                var bodyA = arb.body_a;
                // Arbiters are shared between two bodies that are always woken up together.
                // You only want to restore the arbiter once, so bodyA is arbitrarily chosen to own the arbiter.
                // The edge case is when static bodies are involved as the static bodies never actually sleep.
                // If the static body is bodyB then all is good. If the static body is bodyA, that can easily be checked.
                if (body == bodyA || bodyA.isStatic()) {
                    //				/*int*/ var numContacts = arb.numContacts;
                    //				/*cpContact*/ var contacts = arb.contacts;
                    // Restore contact values back to the space's contact buffer memory
                    //				arb.contacts = cpContactBufferGetArray(space);
                    //				memcpy(arb.contacts, contacts, numContacts*sizeof(cpContact));
                    //				space.pushContacts(numContacts);
                    // Reinsert the arbiter into the arbiter cache
                    /*cpShape*/
                    var a = arb.a, b = arb.b;
                    //				cpShape *shape_pair[] = {a, b};
                    /*cpHashValue*/
                    var arbHashID = CP_HASH_PAIR(/*cpHashValue*/ a.hashid, /*cpHashValue*/ b.hashid);
                    //				cpHashSetInsert(space.cachedArbiters, arbHashID, shape_pair, arb, null);
                    space.cachedArbiters[arbHashID] = arb;
                    // Update the arbiter's state
                    arb.stamp = space.stamp;
                    arb.handler = space.lookupHandler(a.collision_type, b.collision_type);
                    space.arbiters.push(arb);
                }
            }
            for (var constraint = body.constraintList; constraint; constraint = constraint.next(body)) {
                /*cpBody*/
                var bodyA = constraint.a;
                if (body == bodyA || bodyA.isStatic()) space.constraints.push(constraint);
            }
        }
    };
    //static void
    Space.prototype.deactivateBody = function(/*cpBody*/ body) {
        var space = this;
        cpAssertHard(!body.isRogue(), "Internal error: Attempting to deactivate a rouge body.");
        cpArrayDeleteObj(space.bodies, body);
        for (var shape = body.shapeList; shape; shape = shape.next) {
            space.activeShapes.remove(shape, shape.hashid);
            space.staticShapes.insert(shape, shape.hashid);
        }
        for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
            /*cpBody*/
            var bodyA = arb.body_a;
            if (body == bodyA || bodyA.isStatic()) {
                space.uncacheArbiter(arb);
            }
        }
        for (var constraint = body.constraintList; constraint; constraint = constraint.next(body)) {
            /*cpBody*/
            var bodyA = constraint.a;
            if (body == bodyA || bodyA.isStatic()) cpArrayDeleteObj(space.constraints, constraint);
        }
    };
    //static inline cpBody *
    var ComponentRoot = function(/*cpBody*/ body) {
        return body ? body.nodeRoot : null;
    };
    //static inline void
    var ComponentActivate = function(/*cpBody*/ root) {
        if (!root || !root.isSleeping()) return;
        cpAssertHard(!root.isRogue(), "Internal Error: ComponentActivate() called on a rogue body.");
        /*cpSpace*/
        var space = root.space;
        /*cpBody*/
        var body = root;
        while (body) {
            /*cpBody*/
            var next = body.nodeNext;
            body.nodeIdleTime = 0;
            body.nodeRoot = null;
            body.nodeNext = null;
            space.activateBody(body);
            body = next;
        }
        cpArrayDeleteObj(space.sleepingComponents, root);
    };
    //void
    Body.prototype.activate = function() {
        var body = this;
        if (!body.isRogue()) {
            body.nodeIdleTime = 0;
            ComponentActivate(ComponentRoot(body));
        }
        for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
            // Reset the idle timer of things the body is touching as well.
            // That way things don't get left hanging in the air.
            /*cpBody*/
            var other = arb.body_a == body ? arb.body_b : arb.body_a;
            if (!other.isStatic()) other.nodeIdleTime = 0;
        }
    };
    //void
    Body.prototype.activateStatic = function(/*cpShape*/ filter) {
        var body = this;
        cpAssertHard(body.isStatic(), "cpBodyActivateStatic() called on a non-static body.");
        for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
            if (!filter || filter == arb.a || filter == arb.b) {
                (arb.body_a == body ? arb.body_b : arb.body_a).activate();
            }
        }
    };
    //static inline void
    Body.prototype.pushArbiter = function(/*cpArbiter*/ arb) {
        var body = this;
        if (NDEBUG) {
            cpAssertSoft(arb.threadForBody(body).next == null, "Internal Error: Dangling contact graph pointers detected. (A)");
            cpAssertSoft(arb.threadForBody(body).prev == null, "Internal Error: Dangling contact graph pointers detected. (B)");
        }
        /*cpArbiter*/
        var next = body.arbiterList;
        if (NDEBUG) {
            cpAssertSoft(next == null || next.threadForBody(body).prev == null, "Internal Error: Dangling contact graph pointers detected. (C)");
        }
        arb.threadForBody(body).next = next;
        if (next) next.threadForBody(body).prev = arb;
        body.arbiterList = arb;
    };
    //static inline void
    var ComponentAdd = function(/*cpBody*/ root, /*cpBody*/ body) {
        body.nodeRoot = root;
        if (body != root) {
            body.nodeNext = root.nodeNext;
            root.nodeNext = body;
        }
    };
    //static inline void
    var FloodFillComponent = function(/*cpBody*/ root, /*cpBody*/ body) {
        // Rogue bodies cannot be put to sleep and prevent bodies they are touching from sleepining anyway.
        // Static bodies (which are a type of rogue body) are effectively sleeping all the time.
        if (!body.isRogue()) {
            /*cpBody*/
            var other_root = ComponentRoot(body);
            if (other_root == null) {
                ComponentAdd(root, body);
                for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
                    FloodFillComponent(root, body == arb.body_a ? arb.body_b : arb.body_a);
                }
                for (var constraint = body.constraintList; constraint; constraint = constraint.next(body)) {
                    FloodFillComponent(root, body == constraint.a ? constraint.b : constraint.a);
                }
            } else {
                if (NDEBUG) {
                    cpAssertSoft(other_root == root, "Internal Error: Inconsistency dectected in the contact graph.");
                }
            }
        }
    };
    //static inline cpBool
    var ComponentActive = function(/*cpBody*/ root, /*cpFloat*/ threshold) {
        for (var body = root; body; body = body.nodeNext) {
            if (body.nodeIdleTime < threshold) return true;
        }
        return false;
    };
    //void
    Space.prototype.processComponents = function(/*cpFloat*/ dt) {
        var space = this;
        /*cpBool*/
        var sleep = space.sleepTimeThreshold != Infinity;
        /*cpArray*/
        var bodies = space.bodies;
        if (NDEBUG) {
            for (var i = 0; i < bodies.length; i++) {
                /*cpBody*/
                var body = /*cpBody*/ bodies[i];
                cpAssertSoft(body.nodeNext == null, "Internal Error: Dangling next pointer detected in contact graph.");
                cpAssertSoft(body.nodeRoot == null, "Internal Error: Dangling root pointer detected in contact graph.");
            }
        }
        // Calculate the kinetic energy of all the bodies.
        if (sleep) {
            /*cpFloat*/
            var dv = space.idleSpeedThreshold;
            /*cpFloat*/
            var dvsq = dv ? dv * dv : cpvlengthsq(space.gravity) * dt * dt;
            // update idling and reset component nodes
            for (var i = 0; i < bodies.length; i++) {
                /*cpBody*/
                var body = /*cpBody*/ bodies[i];
                // Need to deal with infinite mass objects
                /*cpFloat*/
                var keThreshold = dvsq ? body.m * dvsq : 0;
                body.nodeIdleTime = body.kineticEnergy() > keThreshold ? 0 : body.nodeIdleTime + dt;
            }
        }
        // Awaken any sleeping bodies found and then push arbiters to the bodies' lists.
        /*cpArray*/
        var arbiters = space.arbiters;
        for (var i = 0, count = arbiters.length; i < count; i++) {
            /*cpArbiter*/
            var arb = /*(cpArbiter*)*/ arbiters[i];
            /*cpBody*/
            var a = arb.body_a, b = arb.body_b;
            if (sleep) {
                if (b.isRogue() && !b.isStatic() || a.isSleeping()) a.activate();
                if (a.isRogue() && !a.isStatic() || b.isSleeping()) b.activate();
            }
            a.pushArbiter(arb);
            b.pushArbiter(arb);
        }
        if (sleep) {
            // Bodies should be held active if connected by a joint to a non-static rouge body.
            /*cpArray*/
            var constraints = space.constraints;
            for (var i = 0; i < constraints.length; i++) {
                /*cpConstraint*/
                var constraint = /*cpConstraint*/ constraints[i];
                /*cpBody*/
                var a = constraint.a, b = constraint.b;
                if (b.isRogue() && !b.isStatic()) a.activate();
                if (a.isRogue() && !a.isStatic()) b.activate();
            }
            // Generate components and deactivate sleeping ones
            for (var i = 0; i < bodies.length; ) {
                /*cpBody*/
                var body = /*cpBody*/ bodies[i];
                if (ComponentRoot(body) == null) {
                    // Body not in a component yet. Perform a DFS to flood fill mark
                    // the component in the contact graph using this body as the root.
                    FloodFillComponent(body, body);
                    // Check if the component should be put to sleep.
                    if (!ComponentActive(body, space.sleepTimeThreshold)) {
                        space.sleepingComponents.push(body);
                        for (var other = body; other; other = other.nodeNext) {
                            space.deactivateBody(other);
                        }
                        // cpSpaceDeactivateBody() removed the current body from the list.
                        // Skip incrementing the index counter.
                        continue;
                    }
                }
                i++;
                // Only sleeping bodies retain their component node pointers.
                body.nodeRoot = null;
                body.nodeNext = null;
            }
        }
    };
    //void
    Body.prototype.sleep = function() {
        var body = this;
        body.sleepWithGroup(null);
    };
    //void
    Body.prototype.sleepWithGroup = function(/*cpBody*/ group) {
        var body = this;
        cpAssertHard(!body.isRogue(), "Rogue (and static) bodies cannot be put to sleep.");
        /*cpSpace*/
        var space = body.space;
        cpAssertHard(!space.locked, "Bodies cannot be put to sleep during a query or a call to cpSpaceStep(). Put these calls into a post-step callback.");
        cpAssertHard(group == null || group.isSleeping(), "Cannot use a non-sleeping body as a group identifier.");
        if (body.isSleeping()) {
            cpAssertHard(ComponentRoot(body) == ComponentRoot(group), "The body is already sleeping and it's group cannot be reassigned.");
            return;
        }
        for (var shape = body.shapeList; shape; shape = shape.next) shape.update(body.p, body.rot);
        space.deactivateBody(body);
        if (group) {
            /*cpBody*/
            var root = ComponentRoot(group);
            //		/*cpComponentNode*/ var node = new cpComponentNode(root, root.node.next, 0.0);
            body.nodeRoot = root;
            body.nodeNext = root.nodeNext;
            body.nodeIdleTime = 0;
            root.nodeNext = body;
        } else {
            //		/*cpComponentNode*/ var node = new cpComponentNode(body, null, 0.0);
            body.nodeRoot = body;
            body.nodeNext = null;
            body.nodeIdleTime = 0;
            space.sleepingComponents.push(body);
        }
        cpArrayDeleteObj(space.bodies, body);
    };
    //static void
    var activateTouchingHelper = function(/*cpShape*/ shape) {
        shape.body.activate();
    };
    //void
    Space.prototype.activateShapesTouchingShape = function(/*cpShape*/ shape) {
        var space = this;
        if (space.sleepTimeThreshold != Infinity) {
            space.shapeQuery(shape, /*cpSpaceShapeQueryFunc*/ activateTouchingHelper, shape);
        }
    };
    //MARK: Point Query Functions
    var PointQueryContext = function(/*cpVect*/ point, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpacePointQueryFunc*/ func, /*void*/ data) {
        this.point = point;
        this.layers = layers;
        this.group = group;
        this.func = func;
        this.data = data;
    };
    //static cpCollisionID
    var PointQuery = function(/*struct PointQueryContext*/ context, /*cpShape*/ shape, /*cpCollisionID*/ id) {
        if (!(shape.group && context.group == shape.group) && context.layers & shape.layers && shape.pointQuery(context.point)) {
            context.func(shape, context.data);
        }
        return id;
    };
    //void
    Space.prototype.pointQuery = function(/*cpVect*/ point, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpacePointQueryFunc*/ func, /*void*/ data) {
        var space = this;
        /*struct PointQueryContext*/
        var context = new PointQueryContext(point, layers, group, func, data);
        /*cpBB*/
        var bb = BBNewForCircle(point, 0);
        space.lock();
        {
            space.activeShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/ PointQuery, data);
            space.staticShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/ PointQuery, data);
        }
        space.unlock(true);
    };
    //cpShape *
    Space.prototype.pointQueryFirst = function(/*cpVect*/ point, /*cpLayers*/ layers, /*cpGroup*/ group) {
        var space = this;
        /*cpShape*/
        var outShape = null;
        space.pointQuery(point, layers, group, function(shape) {
            if (!shape.sensor) {
                outShape = shape;
            }
        });
        return outShape;
    };
    //MARK: Nearest Point Query Functions
    /*var*/
    var NearestPointQueryContext = function(/*cpVect*/ point, /*cpFloat*/ maxDistance, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpaceNearestPointQueryFunc*/ func) {
        this.point = point;
        this.maxDistance = maxDistance;
        this.layers = layers;
        this.group = group;
        this.func = func;
    };
    //static cpCollisionID
    var NearestPointQuery = function(/*struct NearestPointQueryContext*/ context, /*cpShape*/ shape, /*cpCollisionID*/ id, /*void*/ data) {
        if (!(shape.group && context.group == shape.group) && context.layers & shape.layers) {
            var info = shape.nearestPointQuery(context.point);
            if (info && info.shape && info.d < context.maxDistance) context.func(shape, info.d, info.p, data);
        }
        return id;
    };
    //void
    Space.prototype.nearestPointQuery = function(/*cpVect*/ point, /*cpFloat*/ maxDistance, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpaceNearestPointQueryFunc*/ func, /*void*/ data) {
        var space = this;
        /*struct NearestPointQueryContext*/
        var context = new NearestPointQueryContext(point, maxDistance, layers, group, func);
        /*cpBB*/
        var bb = BB.newForCircle(point, cpfmax(maxDistance, 0));
        space.lock();
        {
            space.activeShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/ NearestPointQuery, data);
            space.staticShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/ NearestPointQuery, data);
        }
        space.unlock(true);
    };
    //static cpCollisionID
    var NearestPointQueryNearest = function(/*struct NearestPointQueryContext*/ context, /*cpShape*/ shape, /*cpCollisionID*/ id, /*cpNearestPointQueryInfo*/ out) {
        if (!(shape.group && context.group == shape.group) && context.layers & shape.layers && !shape.sensor) {
            /*cpNearestPointQueryInfo*/
            var info = shape.nearestPointQuery(context.point);
            if (info && info.d < out.d) {
                _merge(out, info);
            }
        }
        return id;
    };
    //cpShape *
    Space.prototype.nearestPointQueryNearest = function(/*cpVect*/ point, /*cpFloat*/ maxDistance, /*cpLayers*/ layers, /*cpGroup*/ group) {
        var space = this;
        /*cpNearestPointQueryInfo*/
        var info = new cpNearestPointQueryInfo(null, cpvzero, maxDistance, cpvzero);
        // @todo convert should remove it?
        /*struct NearestPointQueryContext*/
        var context = new NearestPointQueryContext(point, maxDistance, layers, group, null);
        /*cpBB*/
        var bb = BB.newForCircle(point, cpfmax(maxDistance, 0));
        space.activeShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/ NearestPointQueryNearest, info);
        space.staticShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/ NearestPointQueryNearest, info);
        return info.shape ? info : null;
    };
    //MARK: Segment Query Functions
    /*var*/
    var SegmentQueryContext = function(/*cpVect*/ start, end, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpaceSegmentQueryFunc*/ func) {
        this.start = start;
        this.end = end;
        this.layers = layers;
        this.group = group;
        this.func = func;
    };
    //static cpFloat
    var SegmentQuery = function(/*struct SegmentQueryContext*/ context, /*cpShape*/ shape, /*void*/ data) {
        /*cpSegmentQueryInfo*/
        var info;
        if (!(shape.group && context.group == shape.group) && context.layers & shape.layers && (info = shape.segmentQuery(context.start, context.end))) {
            context.func(shape, info.t, info.n, data);
        }
        return 1;
    };
    //void
    Space.prototype.segmentQuery = function(/*cpVect*/ start, /*cpVect*/ end, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpaceSegmentQueryFunc*/ func, /*void*/ data) {
        var space = this;
        /*struct SegmentQueryContext*/
        var context = new SegmentQueryContext(start, end, layers, group, func);
        space.lock();
        {
            space.staticShapes.segmentQuery(context, start, end, 1, /*cpSpatialIndexSegmentQueryFunc*/ SegmentQuery, data);
            space.activeShapes.segmentQuery(context, start, end, 1, /*cpSpatialIndexSegmentQueryFunc*/ SegmentQuery, data);
        }
        space.unlock(true);
    };
    //static cpFloat
    var SegmentQueryFirst = function(/*struct SegmentQueryContext*/ context, /*cpShape*/ shape, /*cpSegmentQueryInfo*/ out) {
        var info;
        if (!(shape.group && context.group == shape.group) && context.layers & shape.layers && !shape.sensor && (info = shape.segmentQuery(context.start, context.end)) && info.t < out.t) {
            _merge(out, info);
        }
        return out.t;
    };
    //cpShape *
    Space.prototype.segmentQueryFirst = function(/*cpVect*/ start, /*cpVect*/ end, /*cpLayers*/ layers, /*cpGroup*/ group) {
        var space = this;
        /*cpSegmentQueryInfo*/
        var info = new cpSegmentQueryInfo(null, 1, cpvzero);
        /*struct SegmentQueryContext*/
        var context = new SegmentQueryContext(start, end, layers, group, null);
        space.staticShapes.segmentQuery(context, start, end, 1, /*cpSpatialIndexSegmentQueryFunc*/ SegmentQueryFirst, info);
        space.activeShapes.segmentQuery(context, start, end, info.t, /*cpSpatialIndexSegmentQueryFunc*/ SegmentQueryFirst, info);
        return info.shape ? info : null;
    };
    //MARK: BB Query Functions
    /*var*/
    var BBQueryContext = function(/*cpBB*/ bb, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpaceBBQueryFunc*/ func) {
        this.bb = bb;
        this.layers = layers;
        this.group = group;
        this.func = func;
    };
    //static cpCollisionID
    var BBQuery = function(/*struct BBQueryContext*/ context, /*cpShape*/ shape, /*cpCollisionID*/ id, /*void*/ data) {
        if (!(shape.group && context.group == shape.group) && context.layers & shape.layers && context.bb.intersects(shape.bb)) {
            context.func(shape, data);
        }
        return id;
    };
    //void
    Space.prototype.bBQuery = function(/*cpBB*/ bb, /*cpLayers*/ layers, /*cpGroup*/ group, /*cpSpaceBBQueryFunc*/ func, /*void*/ data) {
        var space = this;
        /*struct BBQueryContext*/
        var context = new BBQueryContext(bb, layers, group, func);
        space.lock();
        {
            space.activeShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/ BBQuery, data);
            space.staticShapes.query(context, bb, /*cpSpatialIndexQueryFunc*/ BBQuery, data);
        }
        space.unlock(true);
    };
    //MARK: Shape Query Functions
    /*var*/
    var ShapeQueryContext = function(/*cpSpaceShapeQueryFunc*/ func, /*void*/ data, /*cpBool*/ anyCollision) {
        this.func = func;
        this.data = data;
        this.anyCollision = anyCollision;
    };
    // Callback from the spatial hash.
    //static cpCollisionID
    var ShapeQuery = function(/*cpShape*/ a, /*cpShape*/ b, /*cpCollisionID*/ id, /*struct ShapeQueryContext*/ context) {
        // Reject any of the simple cases
        if (a.group && a.group == b.group || !(a.layers & b.layers) || a == b) return id;
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
    };
    //cpBool
    Space.prototype.shapeQuery = function(/*cpShape*/ shape, /*cpSpaceShapeQueryFunc*/ func, /*void*/ data) {
        var space = this;
        /*cpBody*/
        var body = shape.body;
        /*cpBB*/
        var bb = body ? shape.update(body.p, body.rot) : shape.bb;
        /*struct ShapeQueryContext*/
        var context = new ShapeQueryContext(func, data, false);
        space.lock();
        {
            space.activeShapes.query(shape, bb, /*cpSpatialIndexQueryFunc*/ ShapeQuery, context);
            space.staticShapes.query(shape, bb, /*cpSpatialIndexQueryFunc*/ ShapeQuery, context);
        }
        space.unlock(true);
        return context.anyCollision;
    };
    //MARK: Post Step Callback Functions
    //cpPostStepCallback *
    Space.prototype.getPostStepCallback = function(/*void*/ key) {
        var space = this;
        /*cpArray*/
        var arr = space.postStepCallbacks;
        for (var i = 0; i < arr.length; i++) {
            /*cpPostStepCallback*/
            var callback = /*cpPostStepCallback*/ arr[i];
            if (callback && callback.key == key) return callback;
        }
        return null;
    };
    //void
    //var PostStepDoNothing = function(/*cpSpace*/ space, /*void*/ obj, /*void*/ data) {}
    //cpBool
    Space.prototype.addPostStepCallback = function(/*cpPostStepFunc*/ func, /*void*/ key, /*void*/ data) {
        var space = this;
        if (NDEBUG) {
            cpAssertWarn(space.locked, "Adding a post-step callback when the space is not locked is unnecessary. " + "Post-step callbacks will not called until the end of the next call to cpSpaceStep() or the next query.");
        }
        if (!space.getPostStepCallback(key)) {
            //		/*cpPostStepCallback*/ var callback = /*cpPostStepCallback*/cpcalloc(1, sizeof(cpPostStepCallback));
            /*cpPostStepCallback*/
            var callback = new cpPostStepCallback(func ? func : _nothing, key, data);
            //		callback.func = (func ? func : PostStepDoNothing);
            //		callback.key = key;
            //		callback.data = data;
            space.postStepCallbacks.push(callback);
            return true;
        } else {
            return false;
        }
    };
    //MARK: Locking Functions
    //void
    Space.prototype.lock = function() {
        var space = this;
        space.locked++;
    };
    //void
    Space.prototype.unlock = function(/*cpBool*/ runPostStep) {
        var space = this;
        space.locked--;
        cpAssertHard(space.locked >= 0, "Internal Error: Space lock underflow.");
        if (space.locked == 0) {
            /*cpArray*/
            //        var waking = space.rousedBodies;
            var rousedBodies = space.rousedBodies;
            var waking;
            while (waking = rousedBodies.pop()) {
                space.activateBody(/*cpBody*/ waking);
            }
            if (space.locked == 0 && runPostStep && !space.skipPostStep) {
                space.skipPostStep = true;
                /*cpArray*/
                var arr = space.postStepCallbacks;
                var callback;
                while (callback = arr.pop()) {
                    //			for(var i=0; i<arr.length; i++){
                    //				/*cpPostStepCallback*/ var callback = /*cpPostStepCallback*/arr[i];
                    /*cpPostStepFunc*/
                    var func = callback.func;
                    // Mark the func as null in case calling it calls cpSpaceRunPostStepCallbacks() again.
                    // TODO need more tests around this case I think.
                    callback.func = null;
                    if (func) func(space, callback.key, callback.data);
                }
                space.skipPostStep = false;
            }
        }
    };
    //MARK: Collision Detection Functions
    //static inline cpBool
    var queryReject = function(/*cpShape*/ a, /*cpShape*/ b) {
        var result = // BBoxes must overlap
        !a.bb.intersects(b.bb) || a.body == b.body || a.group && a.group == b.group || !(a.layers & b.layers) || a.body.m == Infinity && b.body.m == Infinity;
        return result;
    };
    // Callback from the spatial hash.
    //cpCollisionID
    var cpSpaceCollideShapes = function(/*cpShape*/ a, /*cpShape*/ b, /*cpCollisionID*/ id, /*cpSpace*/ space) {
        // Reject any of the simple cases
        if (queryReject(a, b)) return id;
        /*cpCollisionHandler*/
        var handler = space.lookupHandler(a.collision_type, b.collision_type);
        /*cpBool*/
        var sensor = a.sensor || b.sensor;
        if (sensor && handler == cpDefaultCollisionHandler) return id;
        // Shape 'a' should have the lower shape type. (required by cpCollideShapes() )
        // TODO remove me: a < b comparison is for debugging collisions
        if (a.type > b.type || a.type == b.type && a < b) {
            /*cpShape*/
            var temp = a;
            a = b;
            b = temp;
        }
        // Narrow-phase collision detection.
        /*cpContact*/
        var contacts = [];
        var idRef = {
            id: id
        };
        /*int*/
        cpCollideShapes(a, b, idRef, contacts);
        var numContacts = contacts.length;
        if (!numContacts) return idRef.id;
        // Shapes are not colliding.
        //	space.pushContacts(numContacts);
        // Get an arbiter from space.arbiterSet for the two shapes.
        // This is where the persistant contact magic comes from.
        //	cpShape *shape_pair[] = {a, b};
        /*cpHashValue*/
        var arbHashID = CP_HASH_PAIR(/*cpHashValue*/ a.hashid, /*cpHashValue*/ b.hashid);
        //	/*cpArbiter*/ var arb = /*cpArbiter*/cpHashSetInsert(space.cachedArbiters, arbHashID, shape_pair, space, /*cpHashSetTransFunc*/cpSpaceArbiterSetTrans);
        var arb = space.cachedArbiters[arbHashID];
        if (!arb) {
            arb = space.pooledArbiters.pop();
            if (arb) {
                arb.reset(a, b);
            } else {
                arb = space.cachedArbiters[arbHashID] = new Arbiter(a, b);
            }
        }
        //    var arb = space.cachedArbiters[arbHashID] = new Arbiter(a, b);
        arb.update(contacts, handler, a, b);
        // Call the begin function first if it's the first step
        if (arb.state == cpArbiterStateFirstColl && !handler.begin(arb, space, handler.data)) {
            arb.ignore();
        }
        if (// Ignore the arbiter if it has been flagged
        arb.state != cpArbiterStateIgnore && // Call preSolve
        handler.preSolve(arb, space, handler.data) && // Process, but don't add collisions for sensors.
        !sensor) {
            space.arbiters.push(arb);
        } else {
            //		space.popContacts(numContacts);
            arb.contacts = null;
            // Normally arbiters are set as used after calling the post-solve callback.
            // However, post-solve callbacks are not called for sensors or arbiters rejected from pre-solve.
            if (arb.state != cpArbiterStateIgnore) arb.state = cpArbiterStateNormal;
        }
        // Time stamp the arbiter so we know it was used recently.
        arb.stamp = space.stamp;
        return idRef.id;
    };
    // Hashset filter func to throw away old arbiters.
    //cpBool
    Space.prototype.arbiterSetFilter = function(arb) {
        var space = this;
        /*cpTimestamp*/
        var ticks = space.stamp - arb.stamp;
        /*cpBody*/
        var a = arb.body_a, b = arb.body_b;
        // TODO should make an arbiter state for this so it doesn't require filtering arbiters for dangling body pointers on body removal.
        // Preserve arbiters on sensors and rejected arbiters for sleeping objects.
        // This prevents errant separate callbacks from happenening.
        if ((a.isStatic() || a.isSleeping()) && (b.isStatic() || b.isSleeping())) {
            return true;
        }
        // Arbiter was used last frame, but not this one
        if (ticks >= 1 && arb.state != cpArbiterStateCached) {
            arb.state = cpArbiterStateCached;
            arb.callSeparate(space);
        }
        if (ticks >= space.collisionPersistence) {
            arb.contacts = null;
            space.pooledArbiters.push(arb);
            return false;
        }
        return true;
    };
    //MARK: All Important cpSpaceStep() Function
    //void
    var cpShapeUpdateFunc = function(/*cpShape*/ shape) {
        /*cpBody*/
        var body = shape.body;
        shape.update(body.p, body.rot);
    };
    //void
    Space.prototype.step = function(/*cpFloat*/ dt) {
        var space = this;
        // don't step if the timestep is 0!
        if (dt == 0) return;
        space.stamp++;
        /*cpFloat*/
        var prev_dt = space.curr_dt;
        space.curr_dt = dt;
        /*cpArray*/
        var bodies = space.bodies;
        /*cpArray*/
        var constraints = space.constraints;
        /*cpArray*/
        var arbiters = space.arbiters;
        // Reset and empty the arbiter lists.
        var arb;
        while (arb = arbiters.pop()) {
            arb.state = cpArbiterStateNormal;
            // If both bodies are awake, unthread the arbiter from the contact graph.
            if (!arb.body_a.isSleeping() && !arb.body_b.isSleeping()) {
                arb.unthread();
            }
        }
        space.lock();
        {
            // Integrate positions
            for (var i = 0; i < bodies.length; i++) {
                /*cpBody*/
                var body = /*cpBody*/ bodies[i];
                body.updatePosition(dt);
            }
            // Find colliding pairs.
            //		space.pushFreshContactBuffer();
            space.activeShapes.each(/*cpSpatialIndexIteratorFunc*/ cpShapeUpdateFunc, null);
            space.activeShapes.reindexQuery(/*cpSpatialIndexQueryFunc*/ cpSpaceCollideShapes, space);
        }
        space.unlock(false);
        // Rebuild the contact graph (and detect sleeping components if sleeping is enabled)
        space.processComponents(dt);
        space.lock();
        {
            // Clear out old cached arbiters and call separate callbacks
            //		cpHashSetFilter(space.cachedArbiters, /*cpHashSetFilterFunc*/cpSpaceArbiterSetFilter, space);
            var cachedArbiters = space.cachedArbiters;
            for (var hash in cachedArbiters) {
                if (!this.arbiterSetFilter(cachedArbiters[hash])) {
                    delete cachedArbiters[hash];
                }
            }
            var arbLen = arbiters.length;
            var constraintLen = constraints.length;
            // Prestep the arbiters and constraints.
            /*cpFloat*/
            var slop = space.collisionSlop;
            /*cpFloat*/
            var biasCoef = 1 - cpfpow(space.collisionBias, dt);
            for (var i = 0; i < arbLen; i++) {
                arbiters[i].preStep(dt, slop, biasCoef);
            }
            for (var i = 0; i < constraintLen; i++) {
                /*cpConstraint*/
                var constraint = /*cpConstraint*/ constraints[i];
                constraint.preSolve(space);
                constraint.preStep(dt);
            }
            // Integrate velocities.
            /*cpFloat*/
            var damping = cpfpow(space.damping, dt);
            /*cpVect*/
            var gravity = space.gravity;
            for (var i = 0; i < bodies.length; i++) {
                bodies[i].updateVelocity(gravity, damping, dt);
            }
            // Apply cached impulses
            /*cpFloat*/
            var dt_coef = prev_dt == 0 ? 0 : dt / prev_dt;
            for (var i = 0; i < arbLen; i++) {
                arbiters[i].applyCachedImpulse(dt_coef);
            }
            for (var i = 0; i < constraintLen; i++) {
                constraints[i].applyCachedImpulse(dt_coef);
            }
            // Run the impulse solver.
            for (var i = 0; i < space.iterations; i++) {
                for (var j = 0; j < arbLen; j++) {
                    arbiters[j].applyImpulse();
                }
                for (var j = 0; j < constraintLen; j++) {
                    constraints[j].applyImpulse(dt);
                }
            }
            // Run the constraint post-solve callbacks
            for (var i = 0; i < constraintLen; i++) {
                constraints[i].postSolve(space);
            }
            // run the post-solve callbacks
            for (var i = 0; i < arbLen; i++) {
                /*cpArbiter*/
                var arb = /*cpArbiter*/ arbiters[i];
                /*cpCollisionHandler*/
                var handler = arb.handler;
                handler.postSolve(arb, space, handler.data);
            }
        }
        space.unlock(true);
    };
    /// Returns true if the body is sleeping.
    //cpBool
    Body.prototype.isSleeping = function() {
        return !!this.nodeRoot;
    };
    /// Returns true if the body is static.
    //cpBool
    Body.prototype.isStatic = function() {
        return this.nodeIdleTime == Infinity;
    };
    /// Returns true if the body has not been added to a space.
    /// Note: Static bodies are a subtype of rogue bodies.
    //cpBool
    Body.prototype.isRogue = function() {
        return !this.space;
    };
    /// Convert body relative/local coordinates to absolute/world coordinates.
    //cpVect
    Body.prototype.local2World = function(/*const cpVect*/ v) {
        var body = this;
        return cpvadd(body.p, cpvrotate(v, body.rot));
    };
    /// Convert body absolute/world coordinates to  relative/local coordinates.
    //cpVect
    Body.prototype.world2Local = function(/*const cpVect*/ v) {
        var body = this;
        return cpvunrotate(cpvsub(v, body.p), body.rot);
    };
    /// Get the kinetic energy of a body.
    //cpFloat
    Body.prototype.kineticEnergy = function() {
        var body = this;
        // Need to do some fudging to avoid NaNs
        /*cpFloat*/
        var vsq = cpvdot(body.v, body.v);
        /*cpFloat*/
        var wsq = body.w * body.w;
        return (vsq ? vsq * body.m : 0) + (wsq ? wsq * body.i : 0);
    };
    /// returns true from inside a callback and objects cannot be added/removed.
    //static inline cpBool
    Space.prototype.isLocked = function() {
        return this.locked;
    };
    // TODO: Eww. Magic numbers.
    var MAGIC_EPSILON = 1e-5;
    //MARK: Foreach loops
    //static inline cpConstraint *
    Constraint.prototype.next = function(/*cpBody*/ body) {
        var node = this;
        return node.a == body ? node.next_a : node.next_b;
    };
    //static inline cpArbiter *
    Arbiter.prototype.next = function(/*cpBody*/ body) {
        var node = this;
        return node.body_a == body ? node.thread_a.next : node.thread_b.next;
    };
    //MARK: Shape/Collision Functions
    // TODO should move this to the cpVect API. It's pretty useful.
    //static inline cpVect
    var cpClosetPointOnSegment = function(/*const cpVect*/ p, /*const cpVect*/ a, /*const cpVect*/ b) {
        //    /*cpVect*/
        //    var delta = cpvsub(a, b);
        //    /*cpFloat*/
        //    var t = cpfclamp01(cpvdot(delta, cpvsub(p, b)) / cpvlengthsq(delta));
        //    return cpvadd(b, cpvmult(delta, t));
        /*cpVect*/
        var deltaX = a.x - b.x;
        var deltaY = a.y - b.y;
        /*cpFloat*/
        var t = cpfclamp01((deltaX * (p.x - b.x) + deltaY * (p.y - b.y)) / (deltaX * deltaX + deltaY * deltaY));
        return new Vect(b.x + deltaX * t, b.y + deltaY * t);
    };
    //static inline cpBool
    Shape.prototype.active = function() {
        var shape = this;
        return shape.prev || shape.body && shape.body.shapeList == shape;
    };
    //static inline void
    var CircleSegmentQuery = function(/*cpShape*/ shape, /*cpVect*/ center, /*cpFloat*/ r, /*cpVect*/ a, /*cpVect*/ b) {
        /*cpVect*/
        var da = cpvsub(a, center);
        /*cpVect*/
        var db = cpvsub(b, center);
        /*cpFloat*/
        var qa = cpvdot(da, da) - 2 * cpvdot(da, db) + cpvdot(db, db);
        /*cpFloat*/
        var qb = -2 * cpvdot(da, da) + 2 * cpvdot(da, db);
        /*cpFloat*/
        var qc = cpvdot(da, da) - r * r;
        /*cpFloat*/
        var det = qb * qb - 4 * qa * qc;
        if (det >= 0) {
            /*cpFloat*/
            var t = (-qb - cpfsqrt(det)) / (2 * qa);
            if (0 <= t && t <= 1) {
                return new cpSegmentQueryInfo(shape, t, cpvnormalize(cpvlerp(da, db, t)));
            }
        }
    };
    // TODO doesn't really need to be inline, but need a better place to put this function
    //static inline cpSplittingPlane
    var cpSplittingPlane = function(/*cpVect*/ a, /*cpVect*/ b) {
        this.n = a;
        this.d = b;
    };
    var cpSplittingPlaneNew = function(/*cpVect*/ a, /*cpVect*/ b) {
        /*cpVect*/
        var n = cpvnormalize(cpvperp(cpvsub(b, a)));
        /*cpFloat*/
        var d = cpvdot(n, a);
        return new cpSplittingPlane(n, d);
    };
    //static inline cpFloat
    cpSplittingPlane.prototype.compare = function(/*cpVect*/ v) {
        var plane = this;
        return cpvdot(plane.n, v) - plane.d;
    };
    //
    var cpPostStepCallback = function(/*cpPostStepFunc*/ func, /*void*/ key, /*void*/ data) {
        this.func = func;
        this.key = key;
        this.data = data;
    };
    //static inline cpCollisionHandler *
    Space.prototype.lookupHandler = function(/*cpCollisionType*/ a, /*cpCollisionType*/ b) {
        return this.collisionHandlers[CP_HASH_PAIR(a, b)] || this.defaultHandler;
    };
    //static inline void
    Space.prototype.uncacheArbiter = function(/*cpArbiter*/ arb) {
        var space = this;
        /*cpShape*/
        var a = arb.a, b = arb.b;
        /*cpHashValue*/
        var arbHashID = CP_HASH_PAIR(/*cpHashValue*/ a.hashid, /*cpHashValue*/ b.hashid);
        delete space.cachedArbiters[arbHashID];
        cpArrayDeleteObj(space.arbiters, arb);
    };
    //MARK: Arbiters
    //static inline void
    Arbiter.prototype.callSeparate = function(/*cpSpace*/ space) {
        var arb = this;
        // The handler needs to be looked up again as the handler cached on the arbiter may have been deleted since the last step.
        /*cpCollisionHandler*/
        var handler = space.lookupHandler(arb.a.collision_type, arb.b.collision_type);
        handler.separate(arb, space, handler.data);
    };
    //static inline struct cpArbiterThread *
    Arbiter.prototype.threadForBody = function(/*cpBody*/ body) {
        var arb = this;
        return arb.body_a == body ? arb.thread_a : arb.thread_b;
    };
    /// @private
    //void
    Constraint.prototype.activateBodies = function() {
        var constraint = this;
        /*cpBody*/
        var a = constraint.a;
        if (a) a.activate();
        /*cpBody*/
        var b = constraint.b;
        if (b) b.activate();
    };
    //static inline cpVect
    var relative_velocity = function(/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ r1, /*cpVect*/ r2) {
        /*cpVect*/
        //    var v1_sum = cpvadd(a.v, cpvmult(cpvperp(r1), a.w));
        /*cpVect*/
        //    var v2_sum = cpvadd(b.v, cpvmult(cpvperp(r2), b.w));
        //    return cpvsub(v2_sum, v1_sum);
        var x = b.v.x - r2.y * b.w - (a.v.x - r1.y * a.w);
        var y = b.v.y + r2.x * b.w - (a.v.y + r1.x * a.w);
        return new Vect(x, y);
    };
    //static inline cpFloat
    var normal_relative_velocity = function(/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ r1, /*cpVect*/ r2, /*cpVect*/ n) {
        //    return cpvdot(relative_velocity(a, b, r1, r2), n);
        var x = b.v.x - r2.y * b.w - (a.v.x - r1.y * a.w);
        var y = b.v.y + r2.x * b.w - (a.v.y + r1.x * a.w);
        return x * n.x + y * n.y;
    };
    //static inline void
    var apply_impulse = function(/*cpBody*/ body, /*cpVect*/ j, /*cpVect*/ r) {
        //    body.v = cpvadd(body.v, cpvmult(j, body.m_inv));
        //    body.w += body.i_inv * cpvcross(r, j);
        body.v.x += j.x * body.m_inv;
        body.v.y += j.y * body.m_inv;
        body.w += body.i_inv * (r.x * j.y - r.y * j.x);
    };
    //static inline void
    var apply_impulses = function(/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ r1, /*cpVect*/ r2, /*cpVect*/ j) {
        //    apply_impulse(a, cpvneg(j), r1);
        //    apply_impulse(b, j, r2);
        var jx = j.x;
        var jy = j.y;
        a.v.x += -jx * a.m_inv;
        a.v.y += -jy * a.m_inv;
        a.w += a.i_inv * (-r1.x * jy + r1.y * jx);
        b.v.x += jx * b.m_inv;
        b.v.y += jy * b.m_inv;
        b.w += b.i_inv * (r2.x * jy - r2.y * jx);
    };
    //static inline void
    var apply_bias_impulse = function(/*cpBody*/ body, /*cpVect*/ j, /*cpVect*/ r) {
        body.v_bias = cpvadd(body.v_bias, cpvmult(j, body.m_inv));
        body.w_bias += body.i_inv * cpvcross(r, j);
    };
    //static inline void
    var apply_bias_impulses = function(/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ r1, /*cpVect*/ r2, /*cpVect*/ j) {
        apply_bias_impulse(a, cpvneg(j), r1);
        apply_bias_impulse(b, j, r2);
    };
    //static inline cpFloat
    var k_scalar_body = function(/*cpBody*/ body, /*cpVect*/ r, /*cpVect*/ n) {
        /*cpFloat*/
        var rcn = cpvcross(r, n);
        return body.m_inv + body.i_inv * rcn * rcn;
    };
    //static inline cpFloat
    var k_scalar = function(/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ r1, /*cpVect*/ r2, /*cpVect*/ n) {
        /*cpFloat*/
        var value = k_scalar_body(a, r1, n) + k_scalar_body(b, r2, n);
        if (NDEBUG) {
            cpAssertSoft(value != 0, "Unsolvable collision or constraint.");
        }
        return value;
    };
    //static inline cpMat2x2
    var k_tensor = function(/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ r1, /*cpVect*/ r2) {
        /*cpFloat*/
        var m_sum = a.m_inv + b.m_inv;
        // start with Identity*m_sum
        /*cpFloat*/
        var k11 = m_sum, k12 = 0;
        /*cpFloat*/
        var k21 = 0, k22 = m_sum;
        // add the influence from r1
        /*cpFloat*/
        var a_i_inv = a.i_inv;
        /*cpFloat*/
        var r1xsq = r1.x * r1.x * a_i_inv;
        /*cpFloat*/
        var r1ysq = r1.y * r1.y * a_i_inv;
        /*cpFloat*/
        var r1nxy = -r1.x * r1.y * a_i_inv;
        k11 += r1ysq;
        k12 += r1nxy;
        k21 += r1nxy;
        k22 += r1xsq;
        // add the influnce from r2
        /*cpFloat*/
        var b_i_inv = b.i_inv;
        /*cpFloat*/
        var r2xsq = r2.x * r2.x * b_i_inv;
        /*cpFloat*/
        var r2ysq = r2.y * r2.y * b_i_inv;
        /*cpFloat*/
        var r2nxy = -r2.x * r2.y * b_i_inv;
        k11 += r2ysq;
        k12 += r2nxy;
        k21 += r2nxy;
        k22 += r2xsq;
        // invert
        /*cpFloat*/
        var det = k11 * k22 - k12 * k21;
        if (NDEBUG) {
            cpAssertSoft(det != 0, "Unsolvable constraint.");
        }
        /*cpFloat*/
        var det_inv = 1 / det;
        return new Mat2x2(k22 * det_inv, -k12 * det_inv, -k21 * det_inv, k11 * det_inv);
    };
    //static inline cpFloat
    var bias_coef = cp.biasCoef = function(/*cpFloat*/ errorBias, /*cpFloat*/ dt) {
        return 1 - cpfpow(errorBias, dt);
    };
})({}, function() {
    return this;
}());