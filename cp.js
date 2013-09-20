(function(exports, global) {
    global["cp"] = exports;
    var CP_VERSION_MAJOR = 6;
    var CP_VERSION_MINOR = 1;
    var CP_VERSION_RELEASE = 5;
    var cp = exports;
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
    cp.versionString = CP_VERSION_MAJOR + "." + CP_VERSION_MINOR + "." + CP_VERSION_RELEASE;
    var cpMomentForCircle = cp.momentForCircle = function(m, r1, r2, offset) {
        return m * (.5 * (r1 * r1 + r2 * r2) + cpvlengthsq(offset));
    };
    cp.areaForCircle = function(r1, r2) {
        return M_PI * cpfabs(r1 * r1 - r2 * r2);
    };
    var cpMomentForSegment = cp.momentForSegment = function(m, a, b) {
        var offset = cpvmult(cpvadd(a, b), .5);
        return m * (cpvdistsq(b, a) / 12 + cpvlengthsq(offset));
    };
    cp.areaForSegment = function(a, b, r) {
        return r * (M_PI * r + 2 * cpvdist(a, b));
    };
    var cpMomentForPoly = cp.momentForPoly = function(m, verts, offset) {
        var numVerts = verts.length;
        if (numVerts == 2) return cpMomentForSegment(m, verts[0], verts[1]);
        var sum1 = 0;
        var sum2 = 0;
        for (var i = 0; i < numVerts; i++) {
            var v1 = cpvadd(verts[i], offset);
            var v2 = cpvadd(verts[(i + 1) % numVerts], offset);
            var a = cpvcross(v2, v1);
            var b = cpvdot(v1, v1) + cpvdot(v1, v2) + cpvdot(v2, v2);
            sum1 += a * b;
            sum2 += a;
        }
        return m * sum1 / (6 * sum2);
    };
    cp.areaForPoly = function(verts) {
        var area = 0;
        var numVerts = verts.length;
        for (var i = 0; i < numVerts; i++) {
            area += cpvcross(verts[i], verts[(i + 1) % numVerts]);
        }
        return -area / 2;
    };
    var cpCentroidForPoly = cp.centroidForPoly = function(verts) {
        var sum = 0;
        var vsum = cpvzero;
        var numVerts = verts.length;
        for (var i = 0; i < numVerts; i++) {
            var v1 = verts[i];
            var v2 = verts[(i + 1) % numVerts];
            var cross = cpvcross(v1, v2);
            sum += cross;
            vsum = cpvadd(vsum, cpvmult(cpvadd(v1, v2), cross));
        }
        return cpvmult(vsum, 1 / (3 * sum));
    };
    cp.recenterPoly = function(verts) {
        var centroid = cpCentroidForPoly(verts);
        var numVerts = verts.length;
        for (var i = 0; i < numVerts; i++) {
            verts[i] = cpvsub(verts[i], centroid);
        }
    };
    var cpMomentForBox = cp.momentForBox = function(m, width, height) {
        return m * (width * width + height * height) / 12;
    };
    cp.momentForBox2 = function(m, box) {
        var width = box.r - box.l;
        var height = box.t - box.b;
        var offset = cpvmult(cpv(box.l + box.r, box.b + box.t), .5);
        return cpMomentForBox(m, width, height) + m * cpvlengthsq(offset);
    };
    var cpLoopIndexes = cp.loopIndexes = function(verts, count) {
        var start = 0, end = 0;
        var min = verts[0];
        var max = min;
        for (var i = 1; i < count; i++) {
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
    var QHullPartition = function(verts, offset, count, a, b, tol) {
        if (count == 0) return 0;
        var max = 0;
        var pivot = offset;
        var delta = cpvsub(b, a);
        var valueTol = tol * cpvlength(delta);
        var head = offset;
        for (var tail = offset + count - 1; head <= tail; ) {
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
        if (pivot != offset) SWAP(verts, offset, pivot);
        return head - offset;
    };
    var QHullReduce = function(tol, verts, offset, count, a, pivot, b, resultPos) {
        if (count < 0) {
            return 0;
        } else if (count == 0) {
            verts[resultPos] = pivot;
            return 1;
        } else {
            var left_count = QHullPartition(verts, offset, count, a, pivot, tol);
            var index = QHullReduce(tol, verts, offset + 1, left_count - 1, a, verts[offset], pivot, resultPos);
            verts[resultPos + index++] = pivot;
            var right_count = QHullPartition(verts, offset + left_count, count - left_count, pivot, b, tol);
            return index + QHullReduce(tol, verts, offset + left_count + 1, right_count - 1, pivot, verts[offset + left_count], b, resultPos + index);
        }
    };
    cp.convexHull = function(count, verts, result, first, tol) {
        if (result) {
            for (var i = 0; i < verts.length; i++) {
                result[i] = verts[i];
            }
        } else {
            result = verts;
        }
        var indexes = cpLoopIndexes(verts, count);
        var start = indexes[0], end = indexes[1];
        if (start == end) {
            return result;
        }
        SWAP(result, 0, start);
        SWAP(result, 1, end == 0 ? start : end);
        var a = result[0];
        var b = result[1];
        var resultCount = QHullReduce(tol, result, 2, count - 2, a, b, a, 1) + 1;
        result.length = resultCount;
        if (NDEBUG) {
            cpAssertSoft(cpPolyValidate(result, resultCount), "Internal error: cpConvexHull() and cpPolyValidate() did not agree." + "Please report this error with as much info as you can.");
        }
        return result;
    };
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
    var isFF = global.navigator && global.navigator.userAgent.indexOf("Firefox") != -1;
    var cpfmax = cp.fmax = isFF ? Math.max : function(a, b) {
        return a > b ? a : b;
    };
    var cpfmin = cp.fmin = isFF ? Math.min : function(a, b) {
        return a < b ? a : b;
    };
    var cpfabs = cp.fabs = function(f) {
        return f < 0 ? -f : f;
    };
    var cpfclamp = cp.fclamp = function(f, min, max) {
        return cpfmin(cpfmax(f, min), max);
    };
    var cpfclamp01 = function(f) {
        return cpfmax(0, cpfmin(f, 1));
    };
    cp.flerp = function(f1, f2, t) {
        return f1 * (1 - t) + f2 * t;
    };
    cp.flerpconst = function(f1, f2, d) {
        return f1 + cpfclamp(f2 - f1, -d, d);
    };
    var CP_NO_GROUP = cp.NO_GROUP = 0;
    var CP_ALL_LAYERS = cp.ALL_LAYERS = ~0;
    var Mat2x2 = function(a, b, c, d) {
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
    var cpvzero = cp.vzero = new Vect(0, 0);
    var cpveql = cp.v.eql = function(v1, v2) {
        return v1.x == v2.x && v1.y == v2.y;
    };
    var cpvadd = cp.v.add = function(v1, v2) {
        return new Vect(v1.x + v2.x, v1.y + v2.y);
    };
    var cpvsub = cp.v.sub = function(v1, v2) {
        return new Vect(v1.x - v2.x, v1.y - v2.y);
    };
    var cpvneg = cp.v.neg = function(v) {
        return new Vect(-v.x, -v.y);
    };
    var cpvmult = cp.v.mult = function(v, s) {
        return new Vect(v.x * s, v.y * s);
    };
    var cpvdot = cp.v.dot = function(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    };
    var cpvcross = cp.v.cross = function(v1, v2) {
        return v1.x * v2.y - v1.y * v2.x;
    };
    var cpvperp = cp.v.perp = function(v) {
        return new Vect(-v.y, v.x);
    };
    cp.v.rperp = function(v) {
        return new Vect(v.y, -v.x);
    };
    var cpvproject = cp.v.project = function(v1, v2) {
        var f = (v1.x * v2.x + v1.y * v2.y) / (v2.x * v2.x + v2.y * v2.y);
        return new Vect(v2.x * f, v2.y * f);
    };
    cp.v.forangle = function(a) {
        return new Vect(cpfcos(a), cpfsin(a));
    };
    cp.v.toangle = function(v) {
        return cpfatan2(v.y, v.x);
    };
    var cpvrotate = cp.v.rotate = function(v1, v2) {
        return new Vect(v1.x * v2.x - v1.y * v2.y, v1.x * v2.y + v1.y * v2.x);
    };
    var cpvunrotate = cp.v.unrotate = function(v1, v2) {
        return new Vect(v1.x * v2.x + v1.y * v2.y, v1.y * v2.x - v1.x * v2.y);
    };
    var cpvlengthsq = cp.v.lengthsq = function(v) {
        return v.x * v.x + v.y * v.y;
    };
    var cpvlength = cp.v.len = function(v) {
        return cpfsqrt(v.x * v.x + v.y * v.y);
    };
    var cpvlerp = cp.v.lerp = function(v1, v2, t) {
        var t2 = 1 - t;
        return new Vect(v1.x * t2 + v2.x * t, v1.y * t2 + v2.y * t);
    };
    var cpvnormalize = cp.v.normalize = function(v) {
        var f = cpfsqrt(v.x * v.x + v.y * v.y) + CPFLOAT_MIN;
        return new Vect(v.x / f, v.y / f);
    };
    cp.v.normalize_safe = function(v) {
        return cpvnormalize(v);
    };
    var cpvclamp = cp.v.clamp = function(v, len) {
        var vlenSq = v.x * v.x + v.y * v.y;
        if (vlenSq > len * len) {
            var f = cpfsqrt(vlenSq) + CPFLOAT_MIN;
            return new Vect(v.x * len / f, v.y * len / f);
        }
        return v;
    };
    cp.v.lerpconst = function(v1, v2, d) {
        return cpvadd(v1, cpvclamp(cpvsub(v2, v1), d));
    };
    var cpvdist = cp.v.dist = function(v1, v2) {
        var x = v1.x - v2.x;
        var y = v1.y - v2.y;
        return cpfsqrt(x * x + y * y);
    };
    var cpvdistsq = cp.v.distsq = function(v1, v2) {
        var x = v1.x - v2.x;
        var y = v1.y - v2.y;
        return x * x + y * y;
    };
    cp.v.near = function(v1, v2, dist) {
        return cpvdistsq(v1, v2) < dist * dist;
    };
    Mat2x2.prototype.transform = function(v) {
        var m = this;
        return new Vect(v.x * m.a + v.y * m.b, v.x * m.c + v.y * m.d);
    };
    var cpvslerp = cp.v.slerp = function(v1, v2, t) {
        var dot = cpvdot(cpvnormalize(v1), cpvnormalize(v2));
        var omega = cpfacos(cpfclamp(dot, -1, 1));
        if (omega < .001) {
            return cpvlerp(v1, v2, t);
        } else {
            var denom = 1 / cpfsin(omega);
            return cpvadd(cpvmult(v1, cpfsin((1 - t) * omega) * denom), cpvmult(v2, cpfsin(t * omega) * denom));
        }
    };
    cp.v.slerpconst = function(v1, v2, a) {
        var dot = cpvdot(cpvnormalize(v1), cpvnormalize(v2));
        var omega = cpfacos(cpfclamp(dot, -1, 1));
        return cpvslerp(v1, v2, cpfmin(a, omega) / omega);
    };
    cp.v.str = function(v) {
        return "(" + v.x + ", " + v.y + ")";
    };
    var Constraint = cp.Constraint = function(a, b) {
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
    Constraint.prototype.preSolve = _nothing;
    Constraint.prototype.postSolve = _nothing;
    Constraint.prototype.applyCachedImpulse = _nothing;
    var defaultSpringTorque = function(spring, relativeAngle) {
        return (relativeAngle - spring.restAngle) * spring.stiffness;
    };
    var DampedRotarySpring = cp.DampedRotarySpring = function(a, b, restAngle, stiffness, damping) {
        Constraint.apply(this, arguments);
        var spring = this;
        spring.restAngle = restAngle;
        spring.stiffness = stiffness;
        spring.damping = damping;
        spring.springTorqueFunc = defaultSpringTorque;
        spring.jAcc = 0;
    };
    _extend(Constraint, DampedRotarySpring);
    DampedRotarySpring.prototype.preStep = function(dt) {
        var spring = this;
        var a = spring.a;
        var b = spring.b;
        var moment = a.i_inv + b.i_inv;
        if (NDEBUG) {
            cpAssertSoft(moment != 0, "Unsolvable spring.");
        }
        spring.iSum = 1 / moment;
        spring.w_coef = 1 - cpfexp(-spring.damping * dt * moment);
        spring.target_wrn = 0;
        var j_spring = spring.springTorqueFunc(spring, a.a - b.a) * dt;
        spring.jAcc = j_spring;
        a.w -= j_spring * a.i_inv;
        b.w += j_spring * b.i_inv;
    };
    DampedRotarySpring.prototype.applyImpulse = function(dt) {
        var spring = this;
        var a = spring.a;
        var b = spring.b;
        var wrn = a.w - b.w;
        var w_damp = (spring.target_wrn - wrn) * spring.w_coef;
        spring.target_wrn = wrn + w_damp;
        var j_damp = w_damp * spring.iSum;
        spring.jAcc += j_damp;
        a.w += j_damp * a.i_inv;
        b.w -= j_damp * b.i_inv;
    };
    DampedRotarySpring.prototype.getImpulse = function() {
        return this.jAcc;
    };
    var defaultSpringForce = function(spring, dist) {
        return (spring.restLength - dist) * spring.stiffness;
    };
    var DampedSpring = cp.DampedSpring = function(a, b, anchr1, anchr2, restLength, stiffness, damping) {
        Constraint.apply(this, arguments);
        var spring = this;
        spring.anchr1 = anchr1;
        spring.anchr2 = anchr2;
        spring.restLength = restLength;
        spring.stiffness = stiffness;
        spring.damping = damping;
        spring.springForceFunc = defaultSpringForce;
        spring.jAcc = 0;
    };
    _extend(Constraint, DampedSpring);
    DampedSpring.prototype.preStep = function(dt) {
        var spring = this;
        var a = spring.a;
        var b = spring.b;
        spring.r1 = cpvrotate(spring.anchr1, a.rot);
        spring.r2 = cpvrotate(spring.anchr2, b.rot);
        var delta = cpvsub(cpvadd(b.p, spring.r2), cpvadd(a.p, spring.r1));
        var dist = cpvlength(delta);
        spring.n = cpvmult(delta, 1 / (dist ? dist : Infinity));
        var k = k_scalar(a, b, spring.r1, spring.r2, spring.n);
        if (NDEBUG) {
            cpAssertSoft(k != 0, "Unsolvable spring.");
        }
        spring.nMass = 1 / k;
        spring.target_vrn = 0;
        spring.v_coef = 1 - cpfexp(-spring.damping * dt * k);
        var f_spring = spring.springForceFunc(spring, dist);
        var j_spring = spring.jAcc = f_spring * dt;
        apply_impulses(a, b, spring.r1, spring.r2, cpvmult(spring.n, j_spring));
    };
    DampedSpring.prototype.applyImpulse = function(dt) {
        var spring = this;
        var a = spring.a;
        var b = spring.b;
        var n = spring.n;
        var r1 = spring.r1;
        var r2 = spring.r2;
        var vrn = normal_relative_velocity(a, b, r1, r2, n);
        var v_damp = (spring.target_vrn - vrn) * spring.v_coef;
        spring.target_vrn = vrn + v_damp;
        var j_damp = v_damp * spring.nMass;
        spring.jAcc += j_damp;
        apply_impulses(a, b, spring.r1, spring.r2, cpvmult(spring.n, j_damp));
    };
    DampedSpring.prototype.getImpulse = function() {
        return this.jAcc;
    };
    var GearJoint = cp.GearJoint = function(a, b, phase, ratio) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.phase = phase;
        joint.ratio = ratio;
        joint.ratio_inv = 1 / ratio;
        joint.jAcc = 0;
    };
    _extend(Constraint, GearJoint);
    GearJoint.prototype.preStep = function(dt) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        joint.iSum = 1 / (a.i_inv * joint.ratio_inv + joint.ratio * b.i_inv);
        var maxBias = joint.maxBias;
        joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * (b.a * joint.ratio - a.a - joint.phase) / dt, -maxBias, maxBias);
    };
    GearJoint.prototype.applyCachedImpulse = function(dt_coef) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var j = joint.jAcc * dt_coef;
        a.w -= j * a.i_inv * joint.ratio_inv;
        b.w += j * b.i_inv;
    };
    GearJoint.prototype.applyImpulse = function(dt) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var wr = b.w * joint.ratio - a.w;
        var jMax = joint.maxForce * dt;
        var j = (joint.bias - wr) * joint.iSum;
        var jOld = joint.jAcc;
        joint.jAcc = cpfclamp(jOld + j, -jMax, jMax);
        j = joint.jAcc - jOld;
        a.w -= j * a.i_inv * joint.ratio_inv;
        b.w += j * b.i_inv;
    };
    GearJoint.prototype.getImpulse = function() {
        var joint = this;
        return cpfabs(joint.jAcc);
    };
    GearJoint.prototype.setRatio = function(value) {
        var constraint = this;
        constraint.ratio = value;
        constraint.ratio_inv = 1 / value;
        constraint.activateBodies();
    };
    var GrooveJoint = cp.GrooveJoint = function(a, b, groove_a, groove_b, anchr2) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.grv_a = groove_a;
        joint.grv_b = groove_b;
        joint.grv_n = cpvperp(cpvnormalize(cpvsub(groove_b, groove_a)));
        joint.anchr2 = anchr2;
        joint.jAcc = cpvzero;
    };
    _extend(Constraint, GrooveJoint);
    GrooveJoint.prototype.preStep = function(dt) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var ta = a.local2World(joint.grv_a);
        var tb = a.local2World(joint.grv_b);
        var n = cpvrotate(joint.grv_n, a.rot);
        var d = cpvdot(ta, n);
        joint.grv_tn = n;
        joint.r2 = cpvrotate(joint.anchr2, b.rot);
        var td = cpvcross(cpvadd(b.p, joint.r2), n);
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
        joint.k = k_tensor(a, b, joint.r1, joint.r2);
        var delta = cpvsub(cpvadd(b.p, joint.r2), cpvadd(a.p, joint.r1));
        joint.bias = cpvclamp(cpvmult(delta, -bias_coef(joint.errorBias, dt) / dt), joint.maxBias);
    };
    GrooveJoint.prototype.applyCachedImpulse = function(dt_coef) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        apply_impulses(a, b, joint.r1, joint.r2, cpvmult(joint.jAcc, dt_coef));
    };
    GrooveJoint.prototype.grooveConstrain = function(j, dt) {
        var joint = this;
        var n = joint.grv_tn;
        var jClamp = joint.clamp * cpvcross(j, n) > 0 ? j : cpvproject(j, n);
        return cpvclamp(jClamp, joint.maxForce * dt);
    };
    GrooveJoint.prototype.applyImpulse = function(dt) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var r1 = joint.r1;
        var r2 = joint.r2;
        var vr = relative_velocity(a, b, r1, r2);
        var j = joint.k.transform(cpvsub(joint.bias, vr));
        var jOld = joint.jAcc;
        joint.jAcc = joint.grooveConstrain(cpvadd(jOld, j), dt);
        j = cpvsub(joint.jAcc, jOld);
        apply_impulses(a, b, joint.r1, joint.r2, j);
    };
    GrooveJoint.prototype.getImpulse = function() {
        return cpvlength(this.jAcc);
    };
    GrooveJoint.prototype.setGrooveA = function(value) {
        var g = this;
        g.grv_a = value;
        g.grv_n = cpvperp(cpvnormalize(cpvsub(g.grv_b, value)));
        g.activateBodies();
    };
    GrooveJoint.prototype.setGrooveB = function(value) {
        var g = this;
        g.grv_b = value;
        g.grv_n = cpvperp(cpvnormalize(cpvsub(value, g.grv_a)));
        g.activateBodies();
    };
    var PinJoint = cp.PinJoint = function(a, b, anchr1, anchr2) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.anchr1 = anchr1;
        joint.anchr2 = anchr2;
        var p1 = a ? cpvadd(a.p, cpvrotate(anchr1, a.rot)) : anchr1;
        var p2 = b ? cpvadd(b.p, cpvrotate(anchr2, b.rot)) : anchr2;
        joint.dist = cpvlength(cpvsub(p2, p1));
        if (NDEBUG) {
            cpAssertWarn(joint.dist > 0, "You created a 0 length pin joint. A pivot joint will be much more stable.");
        }
        joint.jnAcc = 0;
    };
    _extend(Constraint, PinJoint);
    PinJoint.prototype.preStep = function(dt) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        joint.r1 = cpvrotate(joint.anchr1, a.rot);
        joint.r2 = cpvrotate(joint.anchr2, b.rot);
        var delta = cpvsub(cpvadd(b.p, joint.r2), cpvadd(a.p, joint.r1));
        var dist = cpvlength(delta);
        joint.n = cpvmult(delta, 1 / (dist ? dist : Infinity));
        joint.nMass = 1 / k_scalar(a, b, joint.r1, joint.r2, joint.n);
        var maxBias = joint.maxBias;
        joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * (dist - joint.dist) / dt, -maxBias, maxBias);
    };
    PinJoint.prototype.applyCachedImpulse = function(dt_coef) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var j = cpvmult(joint.n, joint.jnAcc * dt_coef);
        apply_impulses(a, b, joint.r1, joint.r2, j);
    };
    PinJoint.prototype.applyImpulse = function(dt) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var n = joint.n;
        var vrn = normal_relative_velocity(a, b, joint.r1, joint.r2, n);
        var jnMax = joint.maxForce * dt;
        var jn = (joint.bias - vrn) * joint.nMass;
        var jnOld = joint.jnAcc;
        joint.jnAcc = cpfclamp(jnOld + jn, -jnMax, jnMax);
        jn = joint.jnAcc - jnOld;
        apply_impulses(a, b, joint.r1, joint.r2, cpvmult(n, jn));
    };
    PinJoint.prototype.getImpulse = function() {
        return cpfabs(this.jnAcc);
    };
    var PivotJoint = cp.PivotJoint = function(a, b, anchr1, anchr2) {
        Constraint.apply(this, arguments);
        var joint = this;
        if (!anchr2) {
            var pivot = anchr1;
            anchr1 = a ? a.world2Local(pivot) : pivot;
            anchr2 = b ? b.world2Local(pivot) : pivot;
        }
        joint.anchr1 = anchr1;
        joint.anchr2 = anchr2;
        joint.jAcc = cpvzero;
    };
    _extend(Constraint, PivotJoint);
    PivotJoint.prototype.preStep = function(dt) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        joint.r1 = cpvrotate(joint.anchr1, a.rot);
        joint.r2 = cpvrotate(joint.anchr2, b.rot);
        joint.k = k_tensor(a, b, joint.r1, joint.r2);
        var delta = cpvsub(cpvadd(b.p, joint.r2), cpvadd(a.p, joint.r1));
        joint.bias = cpvclamp(cpvmult(delta, -bias_coef(joint.errorBias, dt) / dt), joint.maxBias);
    };
    PivotJoint.prototype.applyCachedImpulse = function(dt_coef) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        apply_impulses(a, b, joint.r1, joint.r2, cpvmult(joint.jAcc, dt_coef));
    };
    PivotJoint.prototype.applyImpulse = function(dt) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var r1 = joint.r1;
        var r2 = joint.r2;
        var vr = relative_velocity(a, b, r1, r2);
        var j = joint.k.transform(cpvsub(joint.bias, vr));
        var jOld = joint.jAcc;
        joint.jAcc = cpvclamp(cpvadd(joint.jAcc, j), joint.maxForce * dt);
        j = cpvsub(joint.jAcc, jOld);
        apply_impulses(a, b, joint.r1, joint.r2, j);
    };
    PivotJoint.prototype.getImpulse = function() {
        return cpvlength(this.jAcc);
    };
    var RatchetJoint = cp.RatchetJoint = function(a, b, phase, ratchet) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.angle = 0;
        joint.phase = phase;
        joint.ratchet = ratchet;
        joint.angle = (b ? b.a : 0) - (a ? a.a : 0);
    };
    _extend(Constraint, RatchetJoint);
    RatchetJoint.prototype.preStep = function(dt) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var angle = joint.angle;
        var phase = joint.phase;
        var ratchet = joint.ratchet;
        var delta = b.a - a.a;
        var diff = angle - delta;
        var pdist = 0;
        if (diff * ratchet > 0) {
            pdist = diff;
        } else {
            joint.angle = cpffloor((delta - phase) / ratchet) * ratchet + phase;
        }
        joint.iSum = 1 / (a.i_inv + b.i_inv);
        var maxBias = joint.maxBias;
        joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * pdist / dt, -maxBias, maxBias);
        if (!joint.bias) joint.jAcc = 0;
    };
    RatchetJoint.prototype.applyCachedImpulse = function(dt_coef) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var j = joint.jAcc * dt_coef;
        a.w -= j * a.i_inv;
        b.w += j * b.i_inv;
    };
    RatchetJoint.prototype.applyImpulse = function(dt) {
        var joint = this;
        if (!joint.bias) return;
        var a = joint.a;
        var b = joint.b;
        var wr = b.w - a.w;
        var ratchet = joint.ratchet;
        var jMax = joint.maxForce * dt;
        var j = -(joint.bias + wr) * joint.iSum;
        var jOld = joint.jAcc;
        joint.jAcc = cpfclamp((jOld + j) * ratchet, 0, jMax * cpfabs(ratchet)) / ratchet;
        j = joint.jAcc - jOld;
        a.w -= j * a.i_inv;
        b.w += j * b.i_inv;
    };
    RatchetJoint.prototype.getImpulse = function() {
        return cpfabs(this.jAcc);
    };
    var RotaryLimitJoint = cp.RotaryLimitJoint = function(a, b, min, max) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.min = min;
        joint.max = max;
        return joint;
    };
    _extend(Constraint, RotaryLimitJoint);
    RotaryLimitJoint.prototype.preStep = function(dt) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var dist = b.a - a.a;
        var pdist = 0;
        if (dist > joint.max) {
            pdist = joint.max - dist;
        } else if (dist < joint.min) {
            pdist = joint.min - dist;
        }
        joint.iSum = 1 / (1 / a.i + 1 / b.i);
        var maxBias = joint.maxBias;
        joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * pdist / dt, -maxBias, maxBias);
        if (!joint.bias) joint.jAcc = 0;
    };
    RotaryLimitJoint.prototype.applyCachedImpulse = function(dt_coef) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var j = joint.jAcc * dt_coef;
        a.w -= j * a.i_inv;
        b.w += j * b.i_inv;
    };
    RotaryLimitJoint.prototype.applyImpulse = function(dt) {
        var joint = this;
        if (!joint.bias) return;
        var a = joint.a;
        var b = joint.b;
        var wr = b.w - a.w;
        var jMax = joint.maxForce * dt;
        var j = -(joint.bias + wr) * joint.iSum;
        var jOld = joint.jAcc;
        if (joint.bias < 0) {
            joint.jAcc = cpfclamp(jOld + j, 0, jMax);
        } else {
            joint.jAcc = cpfclamp(jOld + j, -jMax, 0);
        }
        j = joint.jAcc - jOld;
        a.w -= j * a.i_inv;
        b.w += j * b.i_inv;
    };
    RotaryLimitJoint.prototype.getImpulse = function() {
        return cpfabs(this.jAcc);
    };
    var SimpleMotor = cp.SimpleMotor = function(a, b, rate) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.rate = rate;
        joint.jAcc = 0;
    };
    _extend(Constraint, SimpleMotor);
    SimpleMotor.prototype.preStep = function(dt) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        joint.iSum = 1 / (a.i_inv + b.i_inv);
    };
    SimpleMotor.prototype.applyCachedImpulse = function(dt_coef) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var j = joint.jAcc * dt_coef;
        a.w -= j * a.i_inv;
        b.w += j * b.i_inv;
    };
    SimpleMotor.prototype.applyImpulse = function(dt) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var wr = b.w - a.w + joint.rate;
        var jMax = joint.maxForce * dt;
        var j = -wr * joint.iSum;
        var jOld = joint.jAcc;
        joint.jAcc = cpfclamp(jOld + j, -jMax, jMax);
        j = joint.jAcc - jOld;
        a.w -= j * a.i_inv;
        b.w += j * b.i_inv;
    };
    SimpleMotor.prototype.getImpulse = function() {
        return cpfabs(this.jAcc);
    };
    var SlideJoint = cp.SlideJoint = function(a, b, anchr1, anchr2, min, max) {
        Constraint.apply(this, arguments);
        var joint = this;
        joint.anchr1 = anchr1;
        joint.anchr2 = anchr2;
        joint.min = min;
        joint.max = max;
        joint.jnAcc = 0;
    };
    _extend(Constraint, SlideJoint);
    SlideJoint.prototype.preStep = function(dt) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        joint.r1 = cpvrotate(joint.anchr1, a.rot);
        joint.r2 = cpvrotate(joint.anchr2, b.rot);
        var delta = cpvsub(cpvadd(b.p, joint.r2), cpvadd(a.p, joint.r1));
        var dist = cpvlength(delta);
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
        joint.nMass = 1 / k_scalar(a, b, joint.r1, joint.r2, joint.n);
        var maxBias = joint.maxBias;
        joint.bias = cpfclamp(-bias_coef(joint.errorBias, dt) * pdist / dt, -maxBias, maxBias);
    };
    SlideJoint.prototype.applyCachedImpulse = function(dt_coef) {
        var joint = this;
        var a = joint.a;
        var b = joint.b;
        var j = cpvmult(joint.n, joint.jnAcc * dt_coef);
        apply_impulses(a, b, joint.r1, joint.r2, j);
    };
    SlideJoint.prototype.applyImpulse = function(dt) {
        var joint = this;
        if (cpveql(joint.n, cpvzero)) return;
        var a = joint.a;
        var b = joint.b;
        var n = joint.n;
        var r1 = joint.r1;
        var r2 = joint.r2;
        var vr = relative_velocity(a, b, r1, r2);
        var vrn = cpvdot(vr, n);
        var jn = (joint.bias - vrn) * joint.nMass;
        var jnOld = joint.jnAcc;
        joint.jnAcc = cpfclamp(jnOld + jn, -joint.maxForce * dt, 0);
        jn = joint.jnAcc - jnOld;
        apply_impulses(a, b, joint.r1, joint.r2, cpvmult(n, jn));
    };
    SlideJoint.prototype.getImpulse = function() {
        return cpfabs(this.jnAcc);
    };
    var Contact = function(p, n, dist, hash) {
        var con = this;
        con.p = p;
        con.n = n;
        con.dist = dist;
        con.hash = hash;
        con.r1 = new Vect(0, 0);
        con.r2 = new Vect(0, 0);
    };
    Contact.prototype = {
        jnAcc: 0,
        jtAcc: 0,
        jBias: 0,
        nMass: 0,
        tMass: 0,
        bounce: 0,
        bias: 0
    };
    var unthreadHelper = function(arb, body) {
        var thread = arb.threadForBody(body);
        var prev = thread.prev;
        var next = thread.next;
        if (prev) {
            prev.threadForBody(body).next = next;
        } else if (body.arbiterList == arb) {
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
    var Arbiter = cp.Arbiter = function(a, b) {
        var arb = this;
        arb.surface_vr = cpv(0, 0);
        arb.a = a;
        arb.body_a = a.body;
        arb.b = b;
        arb.body_b = b.body;
        contacts: null, arb.thread_a = new arbiterThread(null, null);
        arb.thread_b = new arbiterThread(null, null);
    };
    Arbiter.prototype = {
        handler: null,
        swappedColl: false,
        e: 0,
        u: 0,
        stamp: 0,
        state: cpArbiterStateFirstColl,
        data: null
    };
    Arbiter.prototype.reset = function(a, b) {
        var arb = this;
        arb.handler = null;
        arb.swappedColl = false;
        arb.e = 0;
        arb.u = 0;
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
    Arbiter.prototype.unthread = function() {
        var arb = this;
        unthreadHelper(arb, arb.body_a);
        unthreadHelper(arb, arb.body_b);
    };
    Arbiter.prototype.isFirstContact = function() {
        return this.state == cpArbiterStateFirstColl;
    };
    Arbiter.prototype.getCount = function() {
        return this.state != cpArbiterStateCached ? this.contacts.length : 0;
    };
    Arbiter.prototype.getNormal = function(i) {
        var arb = this;
        cpAssertHard(0 <= i && i < arb.getCount(), "Index error: The specified contact index is invalid for this arbiter");
        var n = arb.contacts[i].n;
        return arb.swappedColl ? cpvneg(n) : n;
    };
    Arbiter.prototype.getPoint = function(i) {
        cpAssertHard(0 <= i && i < this.getCount(), "Index error: The specified contact index is invalid for this arbiter");
        return this.contacts[i].p;
    };
    Arbiter.prototype.getDepth = function(i) {
        cpAssertHard(0 <= i && i < this.getCount(), "Index error: The specified contact index is invalid for this arbiter");
        return this.contacts[i].dist;
    };
    Arbiter.prototype.getContactPointSet = function() {
        var arb = this;
        var set = new cpContactPointSet();
        set.count = arb.getCount();
        var con;
        for (var i = 0; i < set.count; i++) {
            con = arb.contacts[i];
            set.points[i] = new cpContactPoint(con.p, con.n, con.dist);
        }
        return set;
    };
    Arbiter.prototype.setContactPointSet = function(set) {
        var arb = this;
        var count = set.count;
        cpAssertHard(count == arb.contacts.length, "The number of contact points cannot be changed.");
        for (var i = 0; i < count; i++) {
            arb.contacts[i].p = set.points[i].point;
            arb.contacts[i].n = set.points[i].normal;
            arb.contacts[i].dist = set.points[i].dist;
        }
    };
    Arbiter.prototype.totalImpulse = function() {
        var arb = this;
        var contacts = arb.contacts;
        var sum = cpvzero;
        for (var i = 0, count = arb.getCount(); i < count; i++) {
            var con = contacts[i];
            sum = cpvadd(sum, cpvmult(con.n, con.jnAcc));
        }
        return arb.swappedColl ? sum : cpvneg(sum);
    };
    Arbiter.prototype.totalImpulseWithFriction = function() {
        var arb = this;
        var contacts = arb.contacts;
        var sum = cpvzero;
        for (var i = 0, count = arb.getCount(); i < count; i++) {
            var con = contacts[i];
            sum = cpvadd(sum, cpvrotate(con.n, cpv(con.jnAcc, con.jtAcc)));
        }
        return arb.swappedColl ? sum : cpvneg(sum);
    };
    Arbiter.prototype.totalKE = function() {
        var arb = this;
        var eCoef = (1 - arb.e) / (1 + arb.e);
        var sum = 0;
        var contacts = arb.contacts;
        for (var i = 0, count = arb.getCount(); i < count; i++) {
            var con = contacts[i];
            var jnAcc = con.jnAcc;
            var jtAcc = con.jtAcc;
            sum += eCoef * jnAcc * jnAcc / con.nMass + jtAcc * jtAcc / con.tMass;
        }
        return sum;
    };
    Arbiter.prototype.ignore = function() {
        this.state = cpArbiterStateIgnore;
    };
    Arbiter.prototype.getSurfaceVelocity = function() {
        return cpvmult(this.surface_vr, this.swappedColl ? -1 : 1);
    };
    Arbiter.prototype.setSurfaceVelocity = function(vr) {
        this.surface_vr = cpvmult(vr, this.swappedColl ? -1 : 1);
    };
    Arbiter.prototype.update = function(contacts, handler, a, b) {
        var arb = this;
        var numContacts = contacts.length;
        if (arb.contacts) {
            for (var i = 0; i < numContacts; i++) {
                var con = contacts[i];
                for (var j = 0, len = arb.contacts.length; j < len; j++) {
                    var old = arb.contacts[j];
                    if (con.hash == old.hash) {
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
        var nx, ny;
        if (numContacts) {
            nx = contacts[0].n.x;
            ny = contacts[0].n.y;
        } else {
            nx = ny = 0;
        }
        var surface_vrx = a.surface_v.x - b.surface_v.x;
        var surface_vry = a.surface_v.y - b.surface_v.y;
        var f = surface_vrx * nx + surface_vry * ny;
        arb.surface_vr.x = surface_vrx - nx * f;
        arb.surface_vr.y = surface_vry - ny * f;
        arb.a = a;
        arb.body_a = a.body;
        arb.b = b;
        arb.body_b = b.body;
        if (arb.state == cpArbiterStateCached) arb.state = cpArbiterStateFirstColl;
    };
    Arbiter.prototype.preStep = function(dt, slop, bias) {
        var arb = this;
        var a = arb.body_a;
        var b = arb.body_b;
        for (var i = 0; i < arb.contacts.length; i++) {
            var con = arb.contacts[i];
            var r1 = con.r1;
            var r2 = con.r2;
            var n = con.n;
            var p = con.p;
            r1.x = p.x - a.p.x;
            r1.y = p.y - a.p.y;
            r2.x = p.x - b.p.x;
            r2.y = p.y - b.p.y;
            con.nMass = 1 / k_scalar(a, b, r1, r2, n);
            con.tMass = 1 / k_scalar(a, b, r1, r2, cpvperp(n));
            con.bias = -bias * cpfmin(0, con.dist + slop) / dt;
            con.jBias = 0;
            con.bounce = normal_relative_velocity(a, b, r1, r2, n) * arb.e;
        }
    };
    Arbiter.prototype.applyCachedImpulse = function(dt_coef) {
        var arb = this;
        if (arb.isFirstContact()) return;
        var a = arb.body_a;
        var b = arb.body_b;
        for (var i = 0; i < arb.contacts.length; i++) {
            var con = arb.contacts[i];
            var jx = con.n.x * con.jnAcc - con.n.y * con.jtAcc;
            var jy = con.n.x * con.jtAcc + con.n.y * con.jnAcc;
            apply_impulses(a, b, con.r1, con.r2, new Vect(jx * dt_coef, jy * dt_coef));
        }
    };
    Arbiter.prototype.applyImpulse = function() {
        var arb = this;
        var a = arb.body_a;
        var b = arb.body_b;
        var surface_vr = arb.surface_vr;
        var friction = arb.u;
        for (var i = 0, numContacts = arb.contacts.length; i < numContacts; i++) {
            var con = arb.contacts[i];
            var nMass = con.nMass;
            var n = con.n;
            var r1 = con.r1;
            var r2 = con.r2;
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
            var vbn = (b_v_bias_x - r2y * b_w_bias - a_v_bias_x + r1y * a_w_bias) * nx + (b_v_bias_y + r2x * b_w_bias - a_v_bias_y - r1x * a_w_bias) * ny;
            var vrx = bvx - r2y * bw - avx + r1y * aw + surface_vr.x;
            var vry = bvy + r2x * bw - avy - r1x * aw + surface_vr.y;
            var vrn = vrx * nx + vry * ny;
            var vrt = -vrx * ny + vry * nx;
            var jbn = (con.bias - vbn) * nMass;
            var jbnOld = con.jBias;
            con.jBias = cpfmax(jbnOld + jbn, 0);
            var jn = -(con.bounce + vrn) * nMass;
            var jnOld = con.jnAcc;
            con.jnAcc = cpfmax(jnOld + jn, 0);
            var jtMax = friction * con.jnAcc;
            var jt = -vrt * con.tMass;
            var jtOld = con.jtAcc;
            con.jtAcc = cpfclamp(jtOld + jt, -jtMax, jtMax);
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
            var rotx = con.jnAcc - jnOld;
            var roty = con.jtAcc - jtOld;
            jx = nx * rotx - ny * roty;
            jy = nx * roty + ny * rotx;
            av.x = avx - jx * a_m_inv;
            av.y = avy - jy * a_m_inv;
            a.w += a_i_inv * (-r1x * jy + r1y * jx);
            bv.x = bvx + jx * b_m_inv;
            bv.y = bvy + jy * b_m_inv;
            b.w += b_i_inv * (r2x * jy - r2y * jx);
        }
    };
    var cpCollisionHandler = function(a, b, begin, preSolve, postSolve, separate, data) {
        this.a = a;
        this.b = b;
        this.begin = begin;
        this.preSolve = preSolve;
        this.postSolve = postSolve;
        this.separate = separate;
        this.data = data;
    };
    var CP_MAX_CONTACTS_PER_ARBITER = 2;
    var cpArbiterStateFirstColl = 0;
    var cpArbiterStateNormal = 1;
    var cpArbiterStateIgnore = 2;
    var cpArbiterStateCached = 3;
    Arbiter.prototype.getShapes = function() {
        return this.swappedColl ? [ this.b, this.a ] : [ this.a, this.b ];
    };
    Arbiter.prototype.getBodies = function() {
        var shapes = this.getShapes();
        return [ shapes[0].body, shapes[1].body ];
    };
    var cpContactPoint = function(point, normal, dist) {
        this.point = point;
        this.normal = normal;
        this.dist = dist;
    };
    var cpContactPointSet = function() {
        this.count = 0;
        this.points = [];
    };
    var cpArrayDeleteObj = function(arr, obj) {
        var index = arr.indexOf(obj);
        if (-1 != index) {
            arr[index] = arr[arr.length - 1];
            arr.pop();
        }
    };
    var BB = cp.BB = function(l, b, r, t) {
        this.l = l;
        this.b = b;
        this.r = r;
        this.t = t;
    };
    var BBNewForCircle = BB.newForCircle = function(p, r) {
        return new BB(p.x - r, p.y - r, p.x + r, p.y + r);
    };
    BB.prototype.intersects = function(b) {
        var a = this;
        return a.l <= b.r && b.l <= a.r && a.b <= b.t && b.b <= a.t;
    };
    BB.prototype.containsBB = function(other) {
        var bb = this;
        return bb.l <= other.l && bb.r >= other.r && bb.b <= other.b && bb.t >= other.t;
    };
    BB.prototype.containsVect = function(v) {
        var bb = this;
        return bb.l <= v.x && bb.r >= v.x && bb.b <= v.y && bb.t >= v.y;
    };
    BB.prototype.merge = function(b) {
        var a = this;
        return new BB(cpfmin(a.l, b.l), cpfmin(a.b, b.b), cpfmax(a.r, b.r), cpfmax(a.t, b.t));
    };
    BB.prototype.expand = function(v) {
        var bb = this;
        return new BB(cpfmin(bb.l, v.x), cpfmin(bb.b, v.y), cpfmax(bb.r, v.x), cpfmax(bb.t, v.y));
    };
    BB.prototype.center = function() {
        var bb = this;
        return cpvlerp(new Vect(bb.l, bb.b), new Vect(bb.r, bb.t), .5);
    };
    BB.prototype.area = function() {
        var bb = this;
        return (bb.r - bb.l) * (bb.t - bb.b);
    };
    BB.prototype.mergedArea = function(b) {
        var a = this;
        return (cpfmax(a.r, b.r) - cpfmin(a.l, b.l)) * (cpfmax(a.t, b.t) - cpfmin(a.b, b.b));
    };
    BB.prototype.segmentQuery = function(a, b) {
        var bb = this;
        var idx = 1 / (b.x - a.x);
        var tx1 = bb.l == a.x ? -Infinity : (bb.l - a.x) * idx;
        var tx2 = bb.r == a.x ? Infinity : (bb.r - a.x) * idx;
        var txmin = cpfmin(tx1, tx2);
        var txmax = cpfmax(tx1, tx2);
        var idy = 1 / (b.y - a.y);
        var ty1 = bb.b == a.y ? -Infinity : (bb.b - a.y) * idy;
        var ty2 = bb.t == a.y ? Infinity : (bb.t - a.y) * idy;
        var tymin = cpfmin(ty1, ty2);
        var tymax = cpfmax(ty1, ty2);
        if (tymin <= txmax && txmin <= tymax) {
            var min = cpfmax(txmin, tymin);
            var max = cpfmin(txmax, tymax);
            if (0 <= max && min <= 1) return cpfmax(min, 0);
        }
        return Infinity;
    };
    BB.prototype.intersectsSegment = function(a, b) {
        var bb = this;
        return bb.segmentQuery(a, b) != Infinity;
    };
    BB.prototype.clampVect = function(v) {
        var bb = this;
        return new Vect(cpfclamp(v.x, bb.l, bb.r), cpfclamp(v.y, bb.b, bb.t));
    };
    BB.prototype.wrapVect = function(v) {
        var bb = this;
        var ix = cpfabs(bb.r - bb.l);
        var modx = cpfmod(v.x - bb.l, ix);
        var x = modx > 0 ? modx : modx + ix;
        var iy = cpfabs(bb.t - bb.b);
        var mody = cpfmod(v.y - bb.b, iy);
        var y = mody > 0 ? mody : mody + iy;
        return new Vect(x + bb.l, y + bb.b);
    };
    var SpatialIndex = cp.SpatialIndex = function(bbfunc, staticIndex) {
        var index = this;
        index.bbfunc = bbfunc;
        index.staticIndex = staticIndex;
        if (staticIndex) {
            cpAssertHard(!staticIndex.dynamicIndex, "This static index is already associated with a dynamic index.");
            staticIndex.dynamicIndex = index;
        }
    };
    var dynamicToStaticContext = function(bbfunc, staticIndex, queryFunc, data) {
        this.bbfunc = bbfunc;
        this.staticIndex = staticIndex;
        this.queryFunc = queryFunc;
        this.data = data;
    };
    var dynamicToStaticIter = function(obj, context) {
        context.staticIndex.query(obj, context.bbfunc(obj), context.queryFunc, context.data);
    };
    SpatialIndex.prototype.collideStatic = function(staticIndex, func, data) {
        var dynamicIndex = this;
        if (staticIndex && staticIndex.count > 0) {
            var context = new dynamicToStaticContext(dynamicIndex.bbfunc, staticIndex, func, data);
            dynamicIndex.each(dynamicToStaticIter, context);
        }
    };
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
    var Pair = function(leafA, nextA, leafB, nextB, id) {
        this.aPrev = null;
        this.aLeaf = leafA;
        this.aNext = nextA;
        this.bPrev = null;
        this.bLeaf = leafB;
        this.bNext = nextB;
        this.id = id;
    };
    var BBTree = cp.BBTree = function(bbfunc, staticIndex) {
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
    BBTree.prototype.getBB = function(obj, targetBB) {
        var tree = this;
        var bb = tree.bbfunc(obj);
        var velocityFunc = tree.velocityFunc;
        if (velocityFunc) {
            var coef = .1;
            var x = (bb.r - bb.l) * coef;
            var y = (bb.t - bb.b) * coef;
            var v = cpvmult(velocityFunc(obj), .1);
            targetBB.l = bb.l + cpfmin(-x, v.x);
            targetBB.b = bb.b + cpfmin(-y, v.y);
            targetBB.r = bb.r + cpfmax(x, v.x);
            targetBB.t = bb.t + cpfmax(y, v.y);
        } else {
            targetBB.l = bb.l;
            targetBB.b = bb.b;
            targetBB.r = bb.r;
            targetBB.t = bb.t;
        }
    };
    BBTree.prototype.getMasterTree = function() {
        return this.dynamicIndex || this;
    };
    BBTree.prototype.incrementStamp = function() {
        (this.dynamicIndex || this).stamp++;
    };
    Pair.prototype.recycle = function(tree) {
        var pair = this;
        tree = tree.getMasterTree();
        pair.aNext = tree.pooledPairs;
        tree.pooledPairs = pair;
    };
    BBTree.prototype.pairFromPool = function(a, nextA, b, nextB, id) {
        var tree = this;
        tree = tree.getMasterTree();
        var pair = tree.pooledPairs;
        if (pair) {
            tree.pooledPairs = pair.aNext;
            pair.constructor(a, nextA, b, nextB, id);
            return pair;
        } else {
            var buffer = new Pair(a, nextA, b, nextB, id);
            return buffer;
        }
    };
    ThreadUnlink = function(prev, leaf, next) {
        if (next) {
            if (next.aLeaf == leaf) next.aPrev = prev; else next.bPrev = prev;
        }
        if (prev) {
            if (prev.aLeaf == leaf) prev.aNext = next; else prev.bNext = next;
        } else {
            leaf.PAIRS = next;
        }
    };
    Leaf.prototype.pairsClear = function(tree) {
        var leaf = this;
        var pair = leaf.PAIRS;
        leaf.PAIRS = null;
        while (pair) {
            if (pair.aLeaf == leaf) {
                var next = pair.aNext;
                ThreadUnlink(pair.bPrev, pair.bLeaf, pair.bNext);
            } else {
                var next = pair.bNext;
                ThreadUnlink(pair.aPrev, pair.aLeaf, pair.aNext);
            }
            pair.recycle(tree);
            pair = next;
        }
    };
    var PairInsert = function(a, b, tree) {
        var nextA = a.PAIRS, nextB = b.PAIRS;
        var pair = tree.pairFromPool(a, nextA, b, nextB, 0);
        a.PAIRS = b.PAIRS = pair;
        if (nextA) {
            if (nextA.aLeaf == a) nextA.aPrev = pair; else nextA.bPrev = pair;
        }
        if (nextB) {
            if (nextB.aLeaf == b) nextB.aPrev = pair; else nextB.bPrev = pair;
        }
    };
    Node.prototype.recycle = function(tree) {
        var node = this;
        node.parent = tree.pooledNodes;
        tree.pooledNodes = node;
    };
    BBTree.prototype.nodeFromPool = function(a, b) {
        var tree = this;
        var node = tree.pooledNodes;
        if (node) {
            tree.pooledNodes = node.parent;
            node.constructor(a, b);
            return node;
        } else {
            var buffer = new Node(a, b);
            return buffer;
        }
    };
    Node.prototype.setA = function(value) {
        var node = this;
        node.A = value;
        value.parent = node;
    };
    Node.prototype.setB = function(value) {
        var node = this;
        node.B = value;
        value.parent = node;
    };
    Node.prototype.isLeaf = false;
    Leaf.prototype.isLeaf = true;
    Node.prototype.other = function(child) {
        var node = this;
        return node.A == child ? node.B : node.A;
    };
    Node.prototype.replaceChild = function(child, value, tree) {
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
        for (var node = parent; node; node = node.parent) {
            node.bb = node.A.bb.merge(node.B.bb);
        }
    };
    var cpBBProximity = function(a, b) {
        return cpfabs(a.l + a.r - b.l - b.r) + cpfabs(a.b + a.t - b.b - b.t);
    };
    var SubtreeInsert = function(subtree, leaf, tree) {
        if (subtree == null) {
            return leaf;
        } else if (subtree.isLeaf) {
            return tree.nodeFromPool(leaf, subtree);
        } else {
            var cost_a = subtree.B.bb.area() + subtree.A.bb.mergedArea(leaf.bb);
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
    var SubtreeQuery = function(subtree, obj, bb, func, data) {
        if (subtree.bb.intersects(bb)) {
            if (subtree.isLeaf) {
                func(obj, subtree.obj, 0, data);
            } else {
                SubtreeQuery(subtree.A, obj, bb, func, data);
                SubtreeQuery(subtree.B, obj, bb, func, data);
            }
        }
    };
    var SubtreeSegmentQuery = function(subtree, obj, a, b, t_exit, func, data) {
        if (subtree.isLeaf) {
            return func(obj, subtree.obj, data);
        } else {
            var t_a = subtree.A.bb.segmentQuery(a, b);
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
    BBTree.prototype.subtreeRecycle = function(node) {
        var tree = this;
        if (!node.isLeaf) {
            tree.subtreeRecycle(node.A);
            tree.subtreeRecycle(node.B);
            node.recycle(tree);
        }
    };
    var SubtreeRemove = function(subtree, leaf, tree) {
        if (leaf == subtree) {
            return null;
        } else {
            var parent = leaf.parent;
            if (parent == subtree) {
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
    Node.prototype.markLeafQuery = function(leaf, left, tree, func, data) {
        var subtree = this;
        if (leaf.bb.intersects(subtree.bb)) {
            subtree.A.markLeafQuery(leaf, left, tree, func, data);
            subtree.B.markLeafQuery(leaf, left, tree, func, data);
        }
    };
    Leaf.prototype.markLeafQuery = function(leaf, left, tree, func, data) {
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
    Leaf.prototype.markSubtree = function(tree, staticRoot, func, data) {
        var leaf = this;
        if (leaf.STAMP == tree.getMasterTree().stamp) {
            if (staticRoot) staticRoot.markLeafQuery(leaf, false, tree, func, data);
            for (var node = leaf; node.parent; node = node.parent) {
                if (node == node.parent.A) {
                    node.parent.B.markLeafQuery(leaf, true, tree, func, data);
                } else {
                    node.parent.A.markLeafQuery(leaf, false, tree, func, data);
                }
            }
        } else {
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
    Node.prototype.markSubtree = function(tree, staticRoot, func, data) {
        this.A.markSubtree(tree, staticRoot, func, data);
        this.B.markSubtree(tree, staticRoot, func, data);
    };
    Leaf.prototype.update = function(tree) {
        var leaf = this;
        var root = tree.root;
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
    var VoidQueryFunc = function(obj1, obj2, id, data) {
        return id;
    };
    Leaf.prototype.addPairs = function(tree) {
        var leaf = this;
        var dynamicIndex = tree.dynamicIndex;
        if (dynamicIndex) {
            var dynamicRoot = dynamicIndex.root;
            if (dynamicRoot) {
                var dynamicTree = dynamicIndex;
                dynamicRoot.markLeafQuery(leaf, true, dynamicTree, _nothing, null);
            }
        } else {
            var staticRoot = tree.staticIndex.root;
            leaf.markSubtree(tree, staticRoot, VoidQueryFunc, null);
        }
    };
    BBTree.prototype.setVelocityFunc = function(func) {
        this.velocityFunc = func;
    };
    BBTree.prototype.insert = function(obj, hashid) {
        var tree = this;
        var leaf = tree.leaves[hashid] = new Leaf(tree, obj);
        var root = tree.root;
        tree.root = SubtreeInsert(root, leaf, tree);
        tree.count++;
        leaf.STAMP = tree.getMasterTree().stamp;
        leaf.addPairs(tree);
        tree.incrementStamp();
    };
    BBTree.prototype.remove = function(obj, hashid) {
        var tree = this;
        var leaf = tree.leaves[hashid];
        delete tree.leaves[hashid];
        tree.root = SubtreeRemove(tree.root, leaf, tree);
        tree.count--;
        leaf.pairsClear(tree);
    };
    BBTree.prototype.contains = function(obj, hashid) {
        return this.leaves[hashid] != null;
    };
    BBTree.prototype.reindexQuery = function(func, data) {
        var tree = this;
        if (!tree.root) return;
        for (var hashid in tree.leaves) {
            tree.leaves[hashid].update(tree);
        }
        var staticIndex = tree.staticIndex;
        var staticRoot = staticIndex && staticIndex.root;
        tree.root.markSubtree(tree, staticRoot, func, data);
        if (staticIndex && !staticRoot) tree.collideStatic(staticIndex, func, data);
        tree.incrementStamp();
    };
    BBTree.prototype.reindex = function() {
        this.reindexQuery(VoidQueryFunc, null);
    };
    BBTree.prototype.reindexObject = function(obj, hashid) {
        var tree = this;
        var leaf = tree.leaves[hashid];
        if (leaf) {
            if (leaf.update(tree)) leaf.addPairs(tree);
            tree.incrementStamp();
        }
    };
    BBTree.prototype.segmentQuery = function(obj, a, b, t_exit, func, data) {
        var tree = this;
        var root = tree.root;
        if (root) SubtreeSegmentQuery(root, obj, a, b, t_exit, func, data);
    };
    BBTree.prototype.query = function(obj, bb, func, data) {
        if (this.root) SubtreeQuery(this.root, obj, bb, func, data);
    };
    BBTree.prototype.each = function(func, data) {
        var tree = this;
        for (var hashid in tree.leaves) {
            func(tree.leaves[hashid].obj, data);
        }
    };
    var Body = cp.Body = function(m, i) {
        var body = this;
        body.p = cpv(0, 0);
        body.v = cpv(0, 0);
        body.f = cpv(0, 0);
        body.v_bias = new Vect(0, 0);
        this.rot = new Vect(1, 0);
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
    Body.initStatic = function(body) {
        body.setMass(Infinity);
        body.setMoment(Infinity);
        body.nodeIdleTime = Infinity;
        return body;
    };
    Body.newStatic = function() {
        var body = new Body(Infinity, Infinity);
        body.nodeIdleTime = Infinity;
        return body;
    };
    if (NDEBUG) {
        var cpv_assert_nan = function(v, message) {
            cpAssertSoft(v.x == v.x && v.y == v.y, message);
        };
        var cpv_assert_infinite = function(v, message) {
            cpAssertSoft(cpfabs(v.x) != Infinity && cpfabs(v.y) != Infinity, message);
        };
        var cpv_assert_sane = function(v, message) {
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
    Body.prototype.setMass = function(mass) {
        var body = this;
        cpAssertHard(mass > 0, "Mass must be positive and non-zero.");
        body.activate();
        body.m = mass;
        body.m_inv = 1 / mass;
        if (NDEBUG) {
            BodySanityCheck(body);
        }
    };
    Body.prototype.setMoment = function(moment) {
        var body = this;
        cpAssertHard(moment > 0, "Moment of Inertia must be positive and non-zero.");
        body.activate();
        body.i = moment;
        body.i_inv = 1 / moment;
        if (NDEBUG) {
            BodySanityCheck(body);
        }
    };
    Body.prototype.addShape = function(shape) {
        var body = this;
        var next = body.shapeList;
        if (next) next.prev = shape;
        shape.next = next;
        body.shapeList = shape;
    };
    Body.prototype.removeShape = function(shape) {
        var body = this;
        var prev = shape.prev;
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
    var filterConstraints = function(node, body, filter) {
        if (node == filter) {
            return node.next(body);
        } else if (node.a == body) {
            node.next_a = filterConstraints(node.next_a, body, filter);
        } else {
            node.next_b = filterConstraints(node.next_b, body, filter);
        }
        return node;
    };
    Body.prototype.removeConstraint = function(constraint) {
        var body = this;
        body.constraintList = filterConstraints(body.constraintList, body, constraint);
    };
    Body.prototype.setPos = function(pos) {
        var body = this;
        body.activate();
        body.p = pos;
        if (NDEBUG) {
            BodySanityCheck(body);
        }
    };
    var setAngle = function(body, angle) {
        cpAssertSoft(angle == angle && cpfabs(angle) != Infinity, "Body's angle is invalid.");
        body.a = angle;
        body.rot.x = cpfcos(angle);
        body.rot.y = cpfsin(angle);
    };
    Body.prototype.setAngle = function(angle) {
        var body = this;
        body.activate();
        setAngle(body, angle);
        if (NDEBUG) {
            BodySanityCheck(body);
        }
    };
    Body.prototype.updateVelocity = function(gravity, damping, dt) {
        var body = this;
        var v = body.v;
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
        var w_limit = body.w_limit;
        body.w = cpfclamp(body.w * damping + body.t * body.i_inv * dt, -w_limit, w_limit);
        if (NDEBUG) {
            BodySanityCheck(body);
        }
    };
    Body.prototype.updatePosition = function(dt) {
        var body = this;
        body.p.x += (body.v.x + body.v_bias.x) * dt;
        body.p.y += (body.v.y + body.v_bias.y) * dt;
        setAngle(body, body.a + (body.w + body.w_bias) * dt);
        body.v_bias.x = body.v_bias.y = 0;
        body.w_bias = 0;
        if (NDEBUG) {
            BodySanityCheck(body);
        }
    };
    Body.prototype.resetForces = function() {
        var body = this;
        body.activate();
        body.f.x = body.f.y = 0;
        body.t = 0;
    };
    Body.prototype.applyForce = function(force, r) {
        var body = this;
        body.activate();
        body.f.x += force.x;
        body.f.y += force.y;
        body.t += cpvcross(r, force);
    };
    Body.prototype.applyImpulse = function(j, r) {
        var body = this;
        body.activate();
        apply_impulse(body, j, r);
    };
    Body.prototype.getVelAtPoint = function(r) {
        var body = this;
        return cpvadd(body.v, cpvmult(cpvperp(r), body.w));
    };
    Body.prototype.getVelAtWorldPoint = function(point) {
        var body = this;
        return body.getVelAtPoint(cpvsub(point, body.p));
    };
    Body.prototype.getVelAtLocalPoint = function(point) {
        var body = this;
        return body.getVelAtPoint(cpvrotate(point, body.rot));
    };
    Body.prototype.kScalar = function(r, n) {
        return k_scalar_body(this, r, n);
    };
    Body.prototype.eachShape = function(func, data) {
        var body = this;
        var shape = body.shapeList;
        while (shape) {
            var next = shape.next;
            func(body, shape, data);
            shape = next;
        }
    };
    Body.prototype.eachConstraint = function(func, data) {
        var body = this;
        var constraint = body.constraintList;
        while (constraint) {
            var next = constraint.next(body);
            func(body, constraint, data);
            constraint = next;
        }
    };
    Body.prototype.eachArbiter = function(func, data) {
        var body = this;
        var arb = body.arbiterList;
        while (arb) {
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
    var CircleToCircleQuery = function(p1, p2, r1, r2, hash, con) {
        var mindist = r1 + r2;
        var delta = cpvsub(p2, p1);
        var distsq = cpvlengthsq(delta);
        if (distsq < mindist * mindist) {
            var dist = cpfsqrt(distsq);
            var n = dist ? cpvmult(delta, 1 / dist) : cpv(1, 0);
            con.push(new Contact(cpvlerp(p1, p2, r1 / (r1 + r2)), n, dist - mindist, hash));
            return 1;
        } else {
            return 0;
        }
    };
    var PolySupportPointIndex = function(verts, n) {
        var max = -Infinity;
        var index = 0;
        for (var i = 0, count = verts.length; i < count; i++) {
            var v = verts[i];
            var d = cpvdot(v, n);
            if (d > max) {
                max = d;
                index = i;
            }
        }
        return index;
    };
    var SupportPoint = function(p, id) {
        this.p = p;
        this.id = id;
    };
    var CircleSupportPoint = function(circle, n) {
        return new SupportPoint(circle.tc, 0);
    };
    var SegmentSupportPoint = function(seg, n) {
        if (cpvdot(seg.ta, n) > cpvdot(seg.tb, n)) {
            return new SupportPoint(seg.ta, 0);
        } else {
            return new SupportPoint(seg.tb, 1);
        }
    };
    var PolySupportPoint = function(poly, n) {
        var verts = poly.tVerts;
        var i = PolySupportPointIndex(verts, n);
        return new SupportPoint(verts[i], i);
    };
    var MinkoskiPoint = function(a, b) {
        this.a = a.p;
        this.b = b.p;
        this.ab = cpvsub(b.p, a.p);
        this.id = (a.id & 255) << 8 | b.id & 255;
    };
    var SupportContext = function(shape1, shape2, func1, func2) {
        this.shape1 = shape1;
        this.shape2 = shape2;
        this.func1 = func1;
        this.func2 = func2;
    };
    var Support = function(ctx, n) {
        var a = ctx.func1(ctx.shape1, cpvneg(n));
        var b = ctx.func2(ctx.shape2, n);
        return new MinkoskiPoint(a, b);
    };
    var EdgePoint = function(p, hash) {
        this.p = p;
        this.hash = hash;
    };
    var Edge = function(a, b, r, n) {
        this.a = a;
        this.b = b;
        this.r = r;
        this.n = n;
    };
    var SupportEdgeForPoly = function(poly, n) {
        var numVerts = poly.verts.length;
        var i1 = PolySupportPointIndex(poly.tVerts, n);
        var i0 = (i1 - 1 + numVerts) % numVerts;
        var i2 = (i1 + 1) % numVerts;
        var verts = poly.tVerts;
        if (cpvdot(n, poly.tPlanes[i1].n) > cpvdot(n, poly.tPlanes[i2].n)) {
            var edge = new Edge(new EdgePoint(verts[i0], CP_HASH_PAIR(poly.hashid, i0)), new EdgePoint(verts[i1], CP_HASH_PAIR(poly.hashid, i1)), poly.r, poly.tPlanes[i1].n);
            return edge;
        } else {
            var edge = new Edge(new EdgePoint(verts[i1], CP_HASH_PAIR(poly.hashid, i1)), new EdgePoint(verts[i2], CP_HASH_PAIR(poly.hashid, i2)), poly.r, poly.tPlanes[i2].n);
            return edge;
        }
    };
    var SupportEdgeForSegment = function(seg, n) {
        if (cpvdot(seg.tn, n) > 0) {
            var edge = new Edge(new EdgePoint(seg.ta, CP_HASH_PAIR(seg.hashid, 0)), new EdgePoint(seg.tb, CP_HASH_PAIR(seg.hashid, 1)), seg.r, seg.tn);
            return edge;
        } else {
            var edge = new Edge(new EdgePoint(seg.tb, CP_HASH_PAIR(seg.hashid, 1)), new EdgePoint(seg.ta, CP_HASH_PAIR(seg.hashid, 0)), seg.r, cpvneg(seg.tn));
            return edge;
        }
    };
    var ClosestT = function(a, b) {
        var delta = cpvsub(b, a);
        return -cpfclamp(cpvdot(delta, cpvadd(a, b)) / cpvlengthsq(delta), -1, 1);
    };
    var LerpT = function(a, b, t) {
        var ht = .5 * t;
        return cpvadd(cpvmult(a, .5 - ht), cpvmult(b, .5 + ht));
    };
    var ClosestPoints = function(v0, v1) {
        var t = ClosestT(v0.ab, v1.ab);
        var p = LerpT(v0.ab, v1.ab, t);
        var pa = LerpT(v0.a, v1.a, t);
        var pb = LerpT(v0.b, v1.b, t);
        var id = (v0.id & 65535) << 16 | v1.id & 65535;
        var delta = cpvsub(v1.ab, v0.ab);
        var n = cpvnormalize(cpvperp(delta));
        var d = -cpvdot(n, p);
        if (d <= 0 || 0 < t && t < 1) {
            n = cpvneg(n);
        } else {
            d = cpvlength(p);
            n = cpvmult(p, 1 / (d + CPFLOAT_MIN));
        }
        this.a = pa;
        this.b = pb;
        this.n = n;
        this.d = d;
        this.id = id;
    };
    var ClosestDist = function(v0, v1) {
        return cpvlengthsq(LerpT(v0, v1, ClosestT(v0, v1)));
    };
    var EPARecurse = function(ctx, count, hull, iteration) {
        var mini = 0;
        var minDist = Infinity;
        for (var j = 0, i = count - 1; j < count; i = j, j++) {
            var d = ClosestDist(hull[i].ab, hull[j].ab);
            if (d < minDist) {
                minDist = d;
                mini = i;
            }
        }
        var v0 = hull[mini];
        var v1 = hull[(mini + 1) % count];
        if (NDEBUG) {
            cpAssertSoft(!cpveql(v0.ab, v1.ab), "Internal Error: EPA vertexes are the same (" + mini + " and " + (mini + 1) % count + ")");
        }
        var p = Support(ctx, cpvperp(cpvsub(v1.ab, v0.ab)));
        var area2x = cpvcross(cpvsub(v1.ab, v0.ab), cpvadd(cpvsub(p.ab, v0.ab), cpvsub(p.ab, v1.ab)));
        if (area2x > 0 && iteration < MAX_EPA_ITERATIONS) {
            var count2 = 1;
            var hull2 = new Array(count + 1);
            hull2[0] = p;
            for (var i = 0; i < count; i++) {
                var index = (mini + 1 + i) % count;
                var h0 = hull2[count2 - 1].ab;
                var h1 = hull[index].ab;
                var h2 = (i + 1 < count ? hull[(index + 1) % count] : p).ab;
                if (cpvcross(cpvsub(h2, h0), cpvsub(h1, h0)) > 0) {
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
    var EPA = function(ctx, v0, v1, v2) {
        var hull = [ v0, v1, v2 ];
        return EPARecurse(ctx, 3, hull, 1);
    };
    var GJKRecurse = function(ctx, v0, v1, iteration) {
        if (iteration > MAX_GJK_ITERATIONS) {
            if (NDEBUG) {
                cpAssertWarn(iteration < WARN_GJK_ITERATIONS, "High GJK iterations: " + iteration);
            }
            return new ClosestPoints(v0, v1);
        }
        var delta = cpvsub(v1.ab, v0.ab);
        if (cpvcross(delta, cpvadd(v0.ab, v1.ab)) > 0) {
            return GJKRecurse(ctx, v1, v0, iteration + 1);
        } else {
            var t = ClosestT(v0.ab, v1.ab);
            var n = -1 < t && t < 1 ? cpvperp(delta) : cpvneg(LerpT(v0.ab, v1.ab, t));
            var p = Support(ctx, n);
            if (cpvcross(cpvsub(v1.ab, p.ab), cpvadd(v1.ab, p.ab)) > 0 && cpvcross(cpvsub(v0.ab, p.ab), cpvadd(v0.ab, p.ab)) < 0) {
                if (NDEBUG) {
                    cpAssertWarn(iteration < WARN_GJK_ITERATIONS, "High GJK.EPA iterations: " + iteration);
                }
                return EPA(ctx, v0, p, v1);
            } else {
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
    };
    var ShapePoint = function(shape, i) {
        switch (shape.type) {
          case CP_CIRCLE_SHAPE:
            {
                return new SupportPoint(shape.tc, 0);
            }

          case CP_SEGMENT_SHAPE:
            {
                var seg = shape;
                return new SupportPoint(i == 0 ? seg.ta : seg.tb, i);
            }

          case CP_POLY_SHAPE:
            {
                var poly = shape;
                var index = i < poly.verts.length ? i : 0;
                return new SupportPoint(poly.tVerts[index], index);
            }

          default:
            {
                return new SupportPoint(cpvzero, 0);
            }
        }
    };
    var GJK = function(ctx, idRef) {
        var id = idRef.id;
        var v0, v1;
        if (id && ENABLE_CACHING) {
            v0 = new MinkoskiPoint(ShapePoint(ctx.shape1, id >> 24 & 255), ShapePoint(ctx.shape2, id >> 16 & 255));
            v1 = new MinkoskiPoint(ShapePoint(ctx.shape1, id >> 8 & 255), ShapePoint(ctx.shape2, id & 255));
        } else {
            var axis = cpvperp(cpvsub(ctx.shape1.bb.center(), ctx.shape2.bb.center()));
            v0 = Support(ctx, axis);
            v1 = Support(ctx, cpvneg(axis));
        }
        var points = GJKRecurse(ctx, v0, v1, 1);
        idRef.id = points.id;
        return points;
    };
    var Contact1 = function(dist, a, b, refr, incr, n, hash, arr) {
        var rsum = refr + incr;
        var alpha = rsum > 0 ? refr / rsum : .5;
        var point = cpvlerp(a, b, alpha);
        arr.push(new Contact(point, n, dist - rsum, hash));
    };
    var Contact2 = function(refp, inca, incb, refr, incr, refn, n, hash, arr) {
        var cian = cpvcross(inca, refn);
        var cibn = cpvcross(incb, refn);
        var crpn = cpvcross(refp, refn);
        var t = 1 - cpfclamp01((cibn - crpn) / (cibn - cian));
        var point = cpvlerp(inca, incb, t);
        var pd = cpvdot(cpvsub(point, refp), refn);
        if (t > 0 && pd <= 0) {
            var rsum = refr + incr;
            var alpha = rsum > 0 ? incr * (1 - (rsum + pd) / rsum) : -.5 * pd;
            arr.push(new Contact(cpvadd(point, cpvmult(refn, alpha)), n, pd, hash));
            return 1;
        } else {
            return 0;
        }
    };
    var ClipContacts = function(ref, inc, points, nflip, arr) {
        var inc_offs = cpvmult(inc.n, inc.r);
        var ref_offs = cpvmult(ref.n, ref.r);
        var inca = cpvadd(inc.a.p, inc_offs);
        var incb = cpvadd(inc.b.p, inc_offs);
        var closest_inca = cpClosetPointOnSegment(inc.a.p, ref.a.p, ref.b.p);
        var closest_incb = cpClosetPointOnSegment(inc.b.p, ref.a.p, ref.b.p);
        var msa = cpvmult(points.n, nflip * points.d);
        var cost_a = cpvdistsq(cpvsub(inc.a.p, closest_inca), msa);
        var cost_b = cpvdistsq(cpvsub(inc.b.p, closest_incb), msa);
        var hash_iarb = CP_HASH_PAIR(inc.a.hash, ref.b.hash);
        var hash_ibra = CP_HASH_PAIR(inc.b.hash, ref.a.hash);
        if (cost_a < cost_b) {
            var refp = cpvadd(ref.a.p, ref_offs);
            Contact1(points.d, closest_inca, inc.a.p, ref.r, inc.r, points.n, hash_iarb, arr);
            return Contact2(refp, inca, incb, ref.r, inc.r, ref.n, points.n, hash_ibra, arr) + 1;
        } else {
            var refp = cpvadd(ref.b.p, ref_offs);
            Contact1(points.d, closest_incb, inc.b.p, ref.r, inc.r, points.n, hash_ibra, arr);
            return Contact2(refp, incb, inca, ref.r, inc.r, ref.n, points.n, hash_iarb, arr) + 1;
        }
    };
    var ContactPoints = function(e1, e2, points, arr) {
        var mindist = e1.r + e2.r;
        if (points.d <= mindist) {
            var pick = cpvdot(e1.n, points.n) + cpvdot(e2.n, points.n);
            if (pick != 0 && pick > 0 || pick == 0 && cpvdistsq(e1.a.p, e1.b.p) > cpvdistsq(e2.a.p, e2.b.p)) {
                return ClipContacts(e1, e2, points, 1, arr);
            } else {
                return ClipContacts(e2, e1, points, -1, arr);
            }
        } else {
            return 0;
        }
    };
    var CircleToCircle = function(c1, c2, idRef, arr) {
        return CircleToCircleQuery(c1.tc, c2.tc, c1.r, c2.r, 0, arr);
    };
    var CircleToSegment = function(circleShape, segmentShape, idRef, con) {
        var seg_a = segmentShape.ta;
        var seg_b = segmentShape.tb;
        var center = circleShape.tc;
        var seg_delta = cpvsub(seg_b, seg_a);
        var closest_t = cpfclamp01(cpvdot(seg_delta, cpvsub(center, seg_a)) / cpvlengthsq(seg_delta));
        var closest = cpvadd(seg_a, cpvmult(seg_delta, closest_t));
        if (CircleToCircleQuery(center, closest, circleShape.r, segmentShape.r, 0, con)) {
            var n = con[0].n;
            if ((closest_t != 0 || cpvdot(n, cpvrotate(segmentShape.a_tangent, segmentShape.body.rot)) >= 0) && (closest_t != 1 || cpvdot(n, cpvrotate(segmentShape.b_tangent, segmentShape.body.rot)) >= 0)) {
                return 1;
            }
        }
        return 0;
    };
    var SegmentToSegment = function(seg1, seg2, idRef, arr) {
        var context = new SupportContext(seg1, seg2, SegmentSupportPoint, SegmentSupportPoint);
        var points = GJK(context, idRef);
        var n = points.n;
        var rot1 = seg1.body.rot;
        var rot2 = seg2.body.rot;
        if (points.d <= seg1.r + seg2.r && (!cpveql(points.a, seg1.ta) || cpvdot(n, cpvrotate(seg1.a_tangent, rot1)) <= 0) && (!cpveql(points.a, seg1.tb) || cpvdot(n, cpvrotate(seg1.b_tangent, rot1)) <= 0) && (!cpveql(points.b, seg2.ta) || cpvdot(n, cpvrotate(seg2.a_tangent, rot2)) >= 0) && (!cpveql(points.b, seg2.tb) || cpvdot(n, cpvrotate(seg2.b_tangent, rot2)) >= 0)) {
            return ContactPoints(SupportEdgeForSegment(seg1, n), SupportEdgeForSegment(seg2, cpvneg(n)), points, arr);
        } else {
            return 0;
        }
    };
    var PolyToPoly = function(poly1, poly2, idRef, arr) {
        var context = new SupportContext(poly1, poly2, PolySupportPoint, PolySupportPoint);
        var points = GJK(context, idRef);
        if (points.d - poly1.r - poly2.r <= 0) {
            return ContactPoints(SupportEdgeForPoly(poly1, points.n), SupportEdgeForPoly(poly2, cpvneg(points.n)), points, arr);
        } else {
            return 0;
        }
    };
    var SegmentToPoly = function(seg, poly, id, arr) {
        var context = new SupportContext(seg, poly, SegmentSupportPoint, PolySupportPoint);
        var points = GJK(context, id);
        var n = points.n;
        var rot = seg.body.rot;
        if (points.d - seg.r - poly.r <= 0 && (!cpveql(points.a, seg.ta) || cpvdot(n, cpvrotate(seg.a_tangent, rot)) <= 0) && (!cpveql(points.a, seg.tb) || cpvdot(n, cpvrotate(seg.b_tangent, rot)) <= 0)) {
            return ContactPoints(SupportEdgeForSegment(seg, n), SupportEdgeForPoly(poly, cpvneg(n)), points, arr);
        } else {
            return 0;
        }
    };
    var CircleToPoly = function(circle, poly, id, con) {
        var context = new SupportContext(circle, poly, CircleSupportPoint, PolySupportPoint);
        var points = GJK(context, id);
        var mindist = circle.r + poly.r;
        if (points.d - mindist <= 0) {
            var p = cpvlerp(points.a, points.b, circle.r / mindist);
            con.push(new Contact(p, points.n, points.d - mindist, 0));
            return 1;
        } else {
            return 0;
        }
    };
    var builtinCollisionFuncs = [ CircleToCircle, null, null, CircleToSegment, null, null, CircleToPoly, SegmentToPoly, PolyToPoly ];
    var colfuncs = builtinCollisionFuncs;
    var segmentCollisions = [ CircleToCircle, null, null, CircleToSegment, SegmentToSegment, null, CircleToPoly, SegmentToPoly, PolyToPoly ];
    cp.enableSegmentToSegmentCollisions = function() {
        colfuncs = segmentCollisions;
    };
    var cpCollideShapes = function(a, b, idRef, arr) {
        if (NDEBUG) {
            cpAssertSoft(a.type <= b.type, "Internal Error: Collision shapes passed to cpCollideShapes() are not sorted.");
        }
        var cfunc = colfuncs[a.type + b.type * CP_NUM_SHAPES];
        var numContacts = cfunc ? cfunc(a, b, idRef, arr) : 0;
        if (NDEBUG) {
            cpAssertSoft(numContacts <= CP_MAX_CONTACTS_PER_ARBITER, "Internal error: Too many contact points returned.");
        }
        return numContacts;
    };
    var CP_CIRCLE_SHAPE = cp.CIRCLE_SHAPE = 0;
    var CP_SEGMENT_SHAPE = cp.SEGMENT_SHAPE = 1;
    var CP_POLY_SHAPE = cp.POLY_SHAPE = 2;
    var CP_NUM_SHAPES = 3;
    var cpNearestPointQueryInfo = function(shape, p, d, g) {
        this.shape = shape;
        this.p = p;
        this.d = d;
        this.g = g;
    };
    var cpSegmentQueryInfo = function(shape, t, n) {
        this.shape = shape;
        this.t = t;
        this.n = n;
    };
    cpSegmentQueryInfo.prototype.hitPoint = function(start, end) {
        return cpvlerp(start, end, this.t);
    };
    cpSegmentQueryInfo.prototype.hitDist = function(start, end) {
        return cpvdist(start, end) * this.t;
    };
    var cpShapeIDCounter = 0;
    var Shape = cp.Shape = function(body) {
        var shape = this;
        shape.hashid = cpShapeIDCounter;
        cpShapeIDCounter++;
        shape.body = body;
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
    Shape.prototype.setBody = function(body) {
        var shape = this;
        cpAssertHard(!shape.active(), "You cannot change the body on an active shape. You must remove the shape from the space before changing the body.");
        shape.body = body;
    };
    Shape.prototype.cacheBB = function() {
        var shape = this;
        var body = shape.body;
        return shape.update(body.p, body.rot);
    };
    Shape.prototype.update = function(pos, rot) {
        var shape = this;
        shape.cacheData(pos, rot);
        return shape.bb;
    };
    Shape.prototype.pointQuery = function(p) {
        var shape = this;
        var info = shape.nearestPointQuery(p);
        return info && info.d < 0;
    };
    Shape.prototype.segmentQuery = function(a, b, info) {
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
    var CircleShape = cp.CircleShape = function(body, radius, offset) {
        var circle = this;
        circle.c = offset;
        circle.r = radius;
        circle.tc = new Vect(0, 0);
        Shape.apply(this, arguments);
    };
    _extend(Shape, CircleShape);
    CircleShape.prototype.type = CP_CIRCLE_SHAPE;
    CircleShape.prototype.cacheData = function(p, rot) {
        var circle = this;
        var bb = circle.bb;
        var r = circle.r;
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
    CircleShape.prototype.nearestPointQuery = function(p) {
        var circle = this;
        var delta = cpvsub(p, circle.tc);
        var d = cpvlength(delta);
        var r = circle.r;
        var p = cpvadd(circle.tc, cpvmult(delta, r / d));
        var d = d - r;
        var g = d > MAGIC_EPSILON ? cpvmult(delta, 1 / d) : cpv(0, 1);
        return new cpNearestPointQueryInfo(circle, p, d, g);
    };
    CircleShape.prototype.segmentQuery = function(a, b) {
        var circle = this;
        return CircleSegmentQuery(circle, circle.tc, circle.r, a, b);
    };
    var SegmentShape = cp.SegmentShape = function(body, a, b, r) {
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
    SegmentShape.prototype.cacheData = function(p, rot) {
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
        var rad = seg.r;
        var bb = seg.bb;
        bb.l = l - rad;
        bb.b = b - rad;
        bb.r = r + rad;
        bb.t = t + rad;
        return bb;
    };
    SegmentShape.prototype.nearestPointQuery = function(p) {
        var seg = this;
        var closest = cpClosetPointOnSegment(p, seg.ta, seg.tb);
        var delta = cpvsub(p, closest);
        var d = cpvlength(delta);
        var r = seg.r;
        var g = cpvmult(delta, 1 / d);
        var p = d ? cpvadd(closest, cpvmult(g, r)) : closest;
        var d = d - r;
        var g = d > MAGIC_EPSILON ? g : seg.n;
        return new cpNearestPointQueryInfo(seg, p, d, g);
    };
    SegmentShape.prototype.segmentQuery = function(a, b) {
        var seg = this;
        var n = seg.tn;
        var d = cpvdot(cpvsub(seg.ta, a), n);
        var r = seg.r;
        var flipped_n = d > 0 ? cpvneg(n) : n;
        var seg_offset = cpvsub(cpvmult(flipped_n, r), a);
        var seg_a = cpvadd(seg.ta, seg_offset);
        var seg_b = cpvadd(seg.tb, seg_offset);
        var delta = cpvsub(b, a);
        if (cpvcross(delta, seg_a) * cpvcross(delta, seg_b) <= 0) {
            var d_offset = d + (d > 0 ? -r : r);
            var ad = -d_offset;
            var bd = cpvdot(delta, n) - d_offset;
            if (ad * bd < 0) {
                return {
                    shape: seg,
                    t: ad / (ad - bd),
                    n: flipped_n
                };
            }
        } else if (r != 0) {
            var info1 = CircleSegmentQuery(seg, seg.ta, seg.r, a, b, info1);
            var info2 = CircleSegmentQuery(seg, seg.tb, seg.r, a, b, info2);
            if (info1 && info2) {
                return info1.t < info2.t ? info1 : info2;
            }
            return info1 || info2;
        }
    };
    SegmentShape.prototype.setNeighbors = function(prev, next) {
        var seg = this;
        seg.a_tangent.x = prev.x - seg.a.x;
        seg.a_tangent.y = prev.y - seg.a.y;
        seg.b_tangent.x = next.x - seg.b.x;
        seg.b_tangent.y = next.y - seg.b.y;
    };
    CircleShape.setRadius = function(radius) {
        var circle = this;
        circle.r = radius;
    };
    CircleShape.prototype.setOffset = function(offset) {
        this.c = offset;
    };
    SegmentShape.prototype.setEndpoints = function(a, b) {
        var seg = this;
        seg.a = a;
        seg.b = b;
        seg.n = cpvperp(cpvnormalize(cpvsub(b, a)));
    };
    SegmentShape.prototype.setRadius = function(radius) {
        this.r = radius;
    };
    var PolyShape = cp.PolyShape = function(body, verts, offset) {
        PolyShape2.call(this, body, verts, offset, 0);
    };
    _extend(Shape, PolyShape);
    PolyShape.prototype.type = CP_POLY_SHAPE;
    PolyShape.prototype.transformVerts = function(p, rot) {
        var poly = this;
        var src = poly.verts;
        var dst = poly.tVerts;
        var l = Infinity, r = -Infinity;
        var b = Infinity, t = -Infinity;
        for (var i = 0; i < src.length; i++) {
            var v = cpvadd(p, cpvrotate(src[i], rot));
            dst[i] = v;
            l = cpfmin(l, v.x);
            r = cpfmax(r, v.x);
            b = cpfmin(b, v.y);
            t = cpfmax(t, v.y);
        }
        var radius = poly.r;
        var bb = this.bb;
        bb.l = l - radius;
        bb.b = b - radius;
        bb.r = r + radius;
        bb.t = t + radius;
    };
    PolyShape.prototype.transformAxes = function(p, rot) {
        var poly = this;
        var src = poly.planes;
        var dst = poly.tPlanes;
        for (var i = 0; i < src.length; i++) {
            var n = cpvrotate(src[i].n, rot);
            dst[i].n = n;
            dst[i].d = cpvdot(p, n) + src[i].d;
        }
    };
    PolyShape.prototype.cacheData = function(p, rot) {
        var poly = this;
        poly.transformAxes(p, rot);
        return poly.transformVerts(p, rot);
    };
    PolyShape.prototype.nearestPointQuery = function(p) {
        var poly = this;
        var count = poly.verts.length;
        var planes = poly.tPlanes;
        var verts = poly.tVerts;
        var r = poly.r;
        var v0 = verts[count - 1];
        var minDist = Infinity;
        var closestPoint = cpvzero;
        var closestNormal = cpvzero;
        var outside = false;
        for (var i = 0; i < count; i++) {
            if (planes[i].compare(p) > 0) outside = true;
            var v1 = verts[i];
            var closest = cpClosetPointOnSegment(p, v0, v1);
            var dist = cpvdist(p, closest);
            if (dist < minDist) {
                minDist = dist;
                closestPoint = closest;
                closestNormal = planes[i].n;
            }
            v0 = v1;
        }
        var dist = outside ? minDist : -minDist;
        var g = cpvmult(cpvsub(p, closestPoint), 1 / dist);
        var p = cpvadd(closestPoint, cpvmult(g, r));
        var d = dist - r;
        g = minDist > MAGIC_EPSILON ? g : closestNormal;
        return new cpNearestPointQueryInfo(poly, p, d, g);
    };
    PolyShape.prototype.segmentQuery = function(a, b) {
        var poly = this;
        var info;
        var axes = poly.tPlanes;
        var verts = poly.tVerts;
        var numVerts = poly.verts.length;
        var r = poly.r;
        for (var i = 0; i < numVerts; i++) {
            var n = axes[i].n;
            var an = cpvdot(a, n);
            var d = axes[i].d + r - an;
            if (d > 0) continue;
            var bn = cpvdot(b, n);
            var t = d / (bn - an);
            if (t < 0 || 1 < t) continue;
            var point = cpvlerp(a, b, t);
            var dt = -cpvcross(n, point);
            var dtMin = -cpvcross(n, verts[(i - 1 + numVerts) % numVerts]);
            var dtMax = -cpvcross(n, verts[i]);
            if (dtMin <= dt && dt <= dtMax) {
                info = new cpSegmentQueryInfo(poly, t, n);
            }
        }
        if (r > 0) {
            for (var i = 0; i < numVerts; i++) {
                var circle_info = CircleSegmentQuery(poly, verts[i], r, a, b);
                if (circle_info && (!info || circle_info.t < info.t)) {
                    info = circle_info;
                }
            }
        }
        return info;
    };
    var cpPolyValidate = function(verts) {
        var numVerts = verts.length;
        for (var i = 0; i < numVerts; i++) {
            var a = verts[i];
            var b = verts[(i + 1) % numVerts];
            var c = verts[(i + 2) % numVerts];
            if (cpvcross(cpvsub(b, a), cpvsub(c, a)) > 0) {
                return false;
            }
        }
        return true;
    };
    PolyShape.prototype.getNumVerts = function() {
        return this.verts.length;
    };
    PolyShape.prototype.getVert = function(idx) {
        var shape = this;
        cpAssertHard(0 <= idx && idx < shape.getNumVerts(), "Index out of range.");
        return shape.verts[idx];
    };
    PolyShape.prototype.getRadius = function() {
        return this.r;
    };
    var setUpVerts = function(poly, verts, offset) {
        cpAssertHard(cpPolyValidate(verts), "Polygon is concave or has a reversed winding. Consider using cp.convexHull().");
        poly.verts = [];
        poly.planes = [];
        poly.tVerts = [];
        poly.tPlanes = [];
        var numVerts = verts.length;
        for (var i = 0; i < numVerts; i++) {
            poly.verts[i] = cpvadd(offset, verts[i]);
        }
        for (i = 0; i < verts.length; i++) {
            poly.planes[i] = cpSplittingPlaneNew(poly.verts[(i - 1 + numVerts) % numVerts], poly.verts[i]);
            poly.tPlanes[i] = new cpSplittingPlane(cpv(0, 0), 0);
        }
    };
    PolyShape.prototype.setVerts = function(verts, offset) {
        var shape = this;
        setUpVerts(shape, verts, offset);
    };
    PolyShape.prototype.setRadius = function(radius) {
        this.r = radius;
    };
    var PolyShape2 = cp.PolyShape2 = function(body, verts, offset, radius) {
        var poly = this;
        setUpVerts(poly, verts, offset);
        Shape.call(poly, body);
        poly.r = radius;
    };
    var BoxShape = cp.BoxShape = function(body, width, height) {
        var hw = width / 2;
        var hh = height / 2;
        BoxShape2.call(this, body, new BB(-hw, -hh, hw, hh));
    };
    var BoxShape2 = cp.BoxShape2 = function(body, box) {
        BoxShape3.call(this, body, box, 0);
    };
    var BoxShape3 = cp.BoxShape3 = function(body, box, radius) {
        var verts = [ cpv(box.l, box.b), cpv(box.l, box.t), cpv(box.r, box.t), cpv(box.r, box.b) ];
        PolyShape2.call(this, body, verts, cpvzero, radius);
    };
    _extend(PolyShape, PolyShape2);
    _extend(PolyShape, BoxShape);
    _extend(PolyShape, BoxShape2);
    _extend(PolyShape, BoxShape3);
    var alwaysCollide = function() {
        return 1;
    };
    var shapeVelocityFunc = function(shape) {
        return shape.body.v;
    };
    var cpShapeGetBB = function(shape) {
        return shape.bb;
    };
    var cpDefaultCollisionHandler = new cpCollisionHandler(0, 0, alwaysCollide, alwaysCollide, _nothing, _nothing, null);
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
        space.staticShapes = new BBTree(cpShapeGetBB, null);
        space.activeShapes = new BBTree(cpShapeGetBB, space.staticShapes);
        space.activeShapes.setVelocityFunc(shapeVelocityFunc);
        space.bodies = [];
        space.sleepingComponents = [];
        space.rousedBodies = [];
        space.sleepTimeThreshold = Infinity;
        space.idleSpeedThreshold = 0;
        space.enableContactGraph = false;
        space.arbiters = [];
        space.pooledArbiters = [];
        space.contactBuffersHead = null;
        space.cachedArbiters = {};
        space.constraints = [];
        space.defaultHandler = cpDefaultCollisionHandler;
        space.collisionHandlers = {};
        space.postStepCallbacks = [];
        space.skipPostStep = false;
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
    Space.prototype.addCollisionHandler = function(a, b, begin, preSolve, postSolve, separate, data) {
        var space = this;
        cpAssertSpaceUnlocked(space);
        space.removeCollisionHandler(a, b);
        var handler = new cpCollisionHandler(a, b, begin ? begin : alwaysCollide, preSolve ? preSolve : alwaysCollide, postSolve ? postSolve : _nothing, separate ? separate : _nothing, data);
        space.collisionHandlers[CP_HASH_PAIR(a, b)] = handler;
    };
    Space.prototype.removeCollisionHandler = function(a, b) {
        var space = this;
        cpAssertSpaceUnlocked(space);
        delete space.collisionHandlers[CP_HASH_PAIR(a, b)];
    };
    Space.prototype.setDefaultCollisionHandler = function(begin, preSolve, postSolve, separate, data) {
        var space = this;
        cpAssertSpaceUnlocked(space);
        var handler = new cpCollisionHandler(0, 0, begin ? begin : alwaysCollide, preSolve ? preSolve : alwaysCollide, postSolve ? postSolve : _nothing, separate ? separate : _nothing, data);
        space.defaultHandler = handler;
    };
    Space.prototype.addShape = function(shape) {
        var space = this;
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
    Space.prototype.addStaticShape = function(shape) {
        var space = this;
        cpAssertHard(shape.space != space, "You have already added this shape to this space. You must not add it a second time.");
        cpAssertHard(!shape.space, "You have already added this shape to another space. You cannot add it to a second.");
        cpAssertHard(shape.body.isRogue(), "You are adding a static shape to a dynamic body. Did you mean to attach it to a static or rogue body? See the documentation for more information.");
        cpAssertSpaceUnlocked(space);
        var body = shape.body;
        body.addShape(shape);
        shape.update(body.p, body.rot);
        space.staticShapes.insert(shape, shape.hashid);
        shape.space = space;
        return shape;
    };
    Space.prototype.addBody = function(body) {
        var space = this;
        cpAssertHard(!body.isStatic(), "Do not add static bodies to a space. Static bodies do not move and should not be simulated.");
        cpAssertHard(body.space != space, "You have already added this body to this space. You must not add it a second time.");
        cpAssertHard(!body.space, "You have already added this body to another space. You cannot add it to a second.");
        cpAssertSpaceUnlocked(space);
        space.bodies.push(body);
        body.space = space;
        return body;
    };
    Space.prototype.addConstraint = function(constraint) {
        var space = this;
        cpAssertHard(constraint.space != space, "You have already added this constraint to this space. You must not add it a second time.");
        cpAssertHard(!constraint.space, "You have already added this constraint to another space. You cannot add it to a second.");
        cpAssertHard(constraint.a && constraint.b, "Constraint is attached to a null body.");
        cpAssertSpaceUnlocked(space);
        constraint.a.activate();
        constraint.b.activate();
        space.constraints.push(constraint);
        var a = constraint.a, b = constraint.b;
        constraint.next_a = a.constraintList;
        a.constraintList = constraint;
        constraint.next_b = b.constraintList;
        b.constraintList = constraint;
        constraint.space = space;
        return constraint;
    };
    Space.prototype.filterArbiters = function(body, filter) {
        var space = this;
        space.lock();
        {
            var cachedArbiters = space.cachedArbiters;
            for (var hash in cachedArbiters) {
                var arb = cachedArbiters[hash];
                if (body == arb.body_a && (filter == arb.a || filter == null) || body == arb.body_b && (filter == arb.b || filter == null)) {
                    if (filter && arb.state != cpArbiterStateCached) arb.callSeparate(space);
                    arb.unthread();
                    cpArrayDeleteObj(space.arbiters, arb);
                    delete cachedArbiters[hash];
                }
            }
        }
        space.unlock(true);
    };
    Space.prototype.removeShape = function(shape) {
        var space = this;
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
    Space.prototype.removeStaticShape = function(shape) {
        var space = this;
        cpAssertHard(space.containsShape(shape), "Cannot remove a static or sleeping shape that was not added to the space. (Removed twice maybe?)");
        cpAssertSpaceUnlocked(space);
        var body = shape.body;
        if (body.isStatic()) body.activateStatic(shape);
        body.removeShape(shape);
        space.filterArbiters(body, shape);
        space.staticShapes.remove(shape, shape.hashid);
        shape.space = null;
    };
    Space.prototype.removeBody = function(body) {
        var space = this;
        cpAssertHard(space.containsBody(body), "Cannot remove a body that was not added to the space. (Removed twice maybe?)");
        cpAssertSpaceUnlocked(space);
        body.activate();
        cpArrayDeleteObj(space.bodies, body);
        body.space = null;
    };
    Space.prototype.removeConstraint = function(constraint) {
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
    Space.prototype.containsShape = function(shape) {
        return shape.space == this;
    };
    Space.prototype.containsBody = function(body) {
        return body.space == this;
    };
    Space.prototype.containsConstraint = function(constraint) {
        return constraint.space == this;
    };
    Space.prototype.convertBodyToStatic = function(body) {
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
    Space.prototype.convertBodyToDynamic = function(body, m, i) {
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
    Space.prototype.eachBody = function(func, data) {
        var space = this;
        space.lock();
        {
            var bodies = space.bodies;
            for (var i = 0; i < bodies.length; i++) {
                func(bodies[i], data);
            }
            var components = space.sleepingComponents;
            for (var i = 0; i < components.length; i++) {
                var root = components[i];
                var body = root;
                while (body) {
                    var next = body.nodeNext;
                    func(body, data);
                    body = next;
                }
            }
        }
        space.unlock(true);
    };
    Space.prototype.eachShape = function(func, data) {
        var space = this;
        space.lock();
        {
            space.activeShapes.each(func, data);
            space.staticShapes.each(func, data);
        }
        space.unlock(true);
    };
    Space.prototype.eachConstraint = function(func, data) {
        var space = this;
        space.lock();
        {
            var constraints = space.constraints;
            for (var i = 0; i < constraints.length; i++) {
                func(constraints[i], data);
            }
        }
        space.unlock(true);
    };
    var updateBBCache = function(shape) {
        var body = shape.body;
        shape.update(body.p, body.rot);
    };
    Space.prototype.reindexStatic = function() {
        var space = this;
        cpAssertHard(!space.locked, "You cannot manually reindex objects while the space is locked. Wait until the current query or step is complete.");
        space.staticShapes.each(updateBBCache, null);
        space.staticShapes.reindex();
    };
    Space.prototype.reindexShape = function(shape) {
        var space = this;
        cpAssertHard(!space.locked, "You cannot manually reindex objects while the space is locked. Wait until the current query or step is complete.");
        var body = shape.body;
        shape.update(body.p, body.rot);
        space.activeShapes.reindexObject(shape, shape.hashid);
        space.staticShapes.reindexObject(shape, shape.hashid);
    };
    Space.prototype.reindexShapesForBody = function(body) {
        var space = this;
        for (var shape = body.shapeList; shape; shape = shape.next) space.reindexShape(shape);
    };
    var copyShapes = function(shape, index) {
        index.insert(shape, shape.hashid);
    };
    Space.prototype.useSpatialHash = function(dim, count) {
        var space = this;
        var staticShapes = new cpSpaceHash(dim, count, cpShapeGetBB, null);
        var activeShapes = new cpSpaceHash(dim, count, cpShapeGetBB, staticShapes);
        space.staticShapes.each(copyShapes, staticShapes);
        space.activeShapes.each(copyShapes, activeShapes);
        space.staticShapes = staticShapes;
        space.activeShapes = activeShapes;
    };
    Space.prototype.activateBody = function(body) {
        var space = this;
        cpAssertHard(!body.isRogue(), "Internal error: Attempting to activate a rogue body.");
        if (space.locked) {
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
                var bodyA = arb.body_a;
                if (body == bodyA || bodyA.isStatic()) {
                    var a = arb.a, b = arb.b;
                    var arbHashID = CP_HASH_PAIR(a.hashid, b.hashid);
                    space.cachedArbiters[arbHashID] = arb;
                    arb.stamp = space.stamp;
                    arb.handler = space.lookupHandler(a.collision_type, b.collision_type);
                    space.arbiters.push(arb);
                }
            }
            for (var constraint = body.constraintList; constraint; constraint = constraint.next(body)) {
                var bodyA = constraint.a;
                if (body == bodyA || bodyA.isStatic()) space.constraints.push(constraint);
            }
        }
    };
    Space.prototype.deactivateBody = function(body) {
        var space = this;
        cpAssertHard(!body.isRogue(), "Internal error: Attempting to deactivate a rouge body.");
        cpArrayDeleteObj(space.bodies, body);
        for (var shape = body.shapeList; shape; shape = shape.next) {
            space.activeShapes.remove(shape, shape.hashid);
            space.staticShapes.insert(shape, shape.hashid);
        }
        for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
            var bodyA = arb.body_a;
            if (body == bodyA || bodyA.isStatic()) {
                space.uncacheArbiter(arb);
            }
        }
        for (var constraint = body.constraintList; constraint; constraint = constraint.next(body)) {
            var bodyA = constraint.a;
            if (body == bodyA || bodyA.isStatic()) cpArrayDeleteObj(space.constraints, constraint);
        }
    };
    var ComponentRoot = function(body) {
        return body ? body.nodeRoot : null;
    };
    var ComponentActivate = function(root) {
        if (!root || !root.isSleeping()) return;
        cpAssertHard(!root.isRogue(), "Internal Error: ComponentActivate() called on a rogue body.");
        var space = root.space;
        var body = root;
        while (body) {
            var next = body.nodeNext;
            body.nodeIdleTime = 0;
            body.nodeRoot = null;
            body.nodeNext = null;
            space.activateBody(body);
            body = next;
        }
        cpArrayDeleteObj(space.sleepingComponents, root);
    };
    Body.prototype.activate = function() {
        var body = this;
        if (!body.isRogue()) {
            body.nodeIdleTime = 0;
            ComponentActivate(ComponentRoot(body));
        }
        for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
            var other = arb.body_a == body ? arb.body_b : arb.body_a;
            if (!other.isStatic()) other.nodeIdleTime = 0;
        }
    };
    Body.prototype.activateStatic = function(filter) {
        var body = this;
        cpAssertHard(body.isStatic(), "cpBodyActivateStatic() called on a non-static body.");
        for (var arb = body.arbiterList; arb; arb = arb.next(body)) {
            if (!filter || filter == arb.a || filter == arb.b) {
                (arb.body_a == body ? arb.body_b : arb.body_a).activate();
            }
        }
    };
    Body.prototype.pushArbiter = function(arb) {
        var body = this;
        if (NDEBUG) {
            cpAssertSoft(arb.threadForBody(body).next == null, "Internal Error: Dangling contact graph pointers detected. (A)");
            cpAssertSoft(arb.threadForBody(body).prev == null, "Internal Error: Dangling contact graph pointers detected. (B)");
        }
        var next = body.arbiterList;
        if (NDEBUG) {
            cpAssertSoft(next == null || next.threadForBody(body).prev == null, "Internal Error: Dangling contact graph pointers detected. (C)");
        }
        arb.threadForBody(body).next = next;
        if (next) next.threadForBody(body).prev = arb;
        body.arbiterList = arb;
    };
    var ComponentAdd = function(root, body) {
        body.nodeRoot = root;
        if (body != root) {
            body.nodeNext = root.nodeNext;
            root.nodeNext = body;
        }
    };
    var FloodFillComponent = function(root, body) {
        if (!body.isRogue()) {
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
    var ComponentActive = function(root, threshold) {
        for (var body = root; body; body = body.nodeNext) {
            if (body.nodeIdleTime < threshold) return true;
        }
        return false;
    };
    Space.prototype.processComponents = function(dt) {
        var space = this;
        var sleep = space.sleepTimeThreshold != Infinity;
        var bodies = space.bodies;
        if (NDEBUG) {
            for (var i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                cpAssertSoft(body.nodeNext == null, "Internal Error: Dangling next pointer detected in contact graph.");
                cpAssertSoft(body.nodeRoot == null, "Internal Error: Dangling root pointer detected in contact graph.");
            }
        }
        if (sleep) {
            var dv = space.idleSpeedThreshold;
            var dvsq = dv ? dv * dv : cpvlengthsq(space.gravity) * dt * dt;
            for (var i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                var keThreshold = dvsq ? body.m * dvsq : 0;
                body.nodeIdleTime = body.kineticEnergy() > keThreshold ? 0 : body.nodeIdleTime + dt;
            }
        }
        var arbiters = space.arbiters;
        for (var i = 0, count = arbiters.length; i < count; i++) {
            var arb = arbiters[i];
            var a = arb.body_a, b = arb.body_b;
            if (sleep) {
                if (b.isRogue() && !b.isStatic() || a.isSleeping()) a.activate();
                if (a.isRogue() && !a.isStatic() || b.isSleeping()) b.activate();
            }
            a.pushArbiter(arb);
            b.pushArbiter(arb);
        }
        if (sleep) {
            var constraints = space.constraints;
            for (var i = 0; i < constraints.length; i++) {
                var constraint = constraints[i];
                var a = constraint.a, b = constraint.b;
                if (b.isRogue() && !b.isStatic()) a.activate();
                if (a.isRogue() && !a.isStatic()) b.activate();
            }
            for (var i = 0; i < bodies.length; ) {
                var body = bodies[i];
                if (ComponentRoot(body) == null) {
                    FloodFillComponent(body, body);
                    if (!ComponentActive(body, space.sleepTimeThreshold)) {
                        space.sleepingComponents.push(body);
                        for (var other = body; other; other = other.nodeNext) {
                            space.deactivateBody(other);
                        }
                        continue;
                    }
                }
                i++;
                body.nodeRoot = null;
                body.nodeNext = null;
            }
        }
    };
    Body.prototype.sleep = function() {
        var body = this;
        body.sleepWithGroup(null);
    };
    Body.prototype.sleepWithGroup = function(group) {
        var body = this;
        cpAssertHard(!body.isRogue(), "Rogue (and static) bodies cannot be put to sleep.");
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
            var root = ComponentRoot(group);
            body.nodeRoot = root;
            body.nodeNext = root.nodeNext;
            body.nodeIdleTime = 0;
            root.nodeNext = body;
        } else {
            body.nodeRoot = body;
            body.nodeNext = null;
            body.nodeIdleTime = 0;
            space.sleepingComponents.push(body);
        }
        cpArrayDeleteObj(space.bodies, body);
    };
    var activateTouchingHelper = function(shape) {
        shape.body.activate();
    };
    Space.prototype.activateShapesTouchingShape = function(shape) {
        var space = this;
        if (space.sleepTimeThreshold != Infinity) {
            space.shapeQuery(shape, activateTouchingHelper, shape);
        }
    };
    var PointQueryContext = function(point, layers, group, func, data) {
        this.point = point;
        this.layers = layers;
        this.group = group;
        this.func = func;
        this.data = data;
    };
    var PointQuery = function(context, shape, id) {
        if (!(shape.group && context.group == shape.group) && context.layers & shape.layers && shape.pointQuery(context.point)) {
            context.func(shape, context.data);
        }
        return id;
    };
    Space.prototype.pointQuery = function(point, layers, group, func, data) {
        var space = this;
        var context = new PointQueryContext(point, layers, group, func, data);
        var bb = BBNewForCircle(point, 0);
        space.lock();
        {
            space.activeShapes.query(context, bb, PointQuery, data);
            space.staticShapes.query(context, bb, PointQuery, data);
        }
        space.unlock(true);
    };
    Space.prototype.pointQueryFirst = function(point, layers, group) {
        var space = this;
        var outShape = null;
        space.pointQuery(point, layers, group, function(shape) {
            if (!shape.sensor) {
                outShape = shape;
            }
        });
        return outShape;
    };
    var NearestPointQueryContext = function(point, maxDistance, layers, group, func) {
        this.point = point;
        this.maxDistance = maxDistance;
        this.layers = layers;
        this.group = group;
        this.func = func;
    };
    var NearestPointQuery = function(context, shape, id, data) {
        if (!(shape.group && context.group == shape.group) && context.layers & shape.layers) {
            var info = shape.nearestPointQuery(context.point);
            if (info && info.shape && info.d < context.maxDistance) context.func(shape, info.d, info.p, data);
        }
        return id;
    };
    Space.prototype.nearestPointQuery = function(point, maxDistance, layers, group, func, data) {
        var space = this;
        var context = new NearestPointQueryContext(point, maxDistance, layers, group, func);
        var bb = BB.newForCircle(point, cpfmax(maxDistance, 0));
        space.lock();
        {
            space.activeShapes.query(context, bb, NearestPointQuery, data);
            space.staticShapes.query(context, bb, NearestPointQuery, data);
        }
        space.unlock(true);
    };
    var NearestPointQueryNearest = function(context, shape, id, out) {
        if (!(shape.group && context.group == shape.group) && context.layers & shape.layers && !shape.sensor) {
            var info = shape.nearestPointQuery(context.point);
            if (info && info.d < out.d) {
                _merge(out, info);
            }
        }
        return id;
    };
    Space.prototype.nearestPointQueryNearest = function(point, maxDistance, layers, group) {
        var space = this;
        var info = new cpNearestPointQueryInfo(null, cpvzero, maxDistance, cpvzero);
        var context = new NearestPointQueryContext(point, maxDistance, layers, group, null);
        var bb = BB.newForCircle(point, cpfmax(maxDistance, 0));
        space.activeShapes.query(context, bb, NearestPointQueryNearest, info);
        space.staticShapes.query(context, bb, NearestPointQueryNearest, info);
        return info.shape ? info : null;
    };
    var SegmentQueryContext = function(start, end, layers, group, func) {
        this.start = start;
        this.end = end;
        this.layers = layers;
        this.group = group;
        this.func = func;
    };
    var SegmentQuery = function(context, shape, data) {
        var info;
        if (!(shape.group && context.group == shape.group) && context.layers & shape.layers && (info = shape.segmentQuery(context.start, context.end))) {
            context.func(shape, info.t, info.n, data);
        }
        return 1;
    };
    Space.prototype.segmentQuery = function(start, end, layers, group, func, data) {
        var space = this;
        var context = new SegmentQueryContext(start, end, layers, group, func);
        space.lock();
        {
            space.staticShapes.segmentQuery(context, start, end, 1, SegmentQuery, data);
            space.activeShapes.segmentQuery(context, start, end, 1, SegmentQuery, data);
        }
        space.unlock(true);
    };
    var SegmentQueryFirst = function(context, shape, out) {
        var info;
        if (!(shape.group && context.group == shape.group) && context.layers & shape.layers && !shape.sensor && (info = shape.segmentQuery(context.start, context.end)) && info.t < out.t) {
            _merge(out, info);
        }
        return out.t;
    };
    Space.prototype.segmentQueryFirst = function(start, end, layers, group) {
        var space = this;
        var info = new cpSegmentQueryInfo(null, 1, cpvzero);
        var context = new SegmentQueryContext(start, end, layers, group, null);
        space.staticShapes.segmentQuery(context, start, end, 1, SegmentQueryFirst, info);
        space.activeShapes.segmentQuery(context, start, end, info.t, SegmentQueryFirst, info);
        return info.shape ? info : null;
    };
    var BBQueryContext = function(bb, layers, group, func) {
        this.bb = bb;
        this.layers = layers;
        this.group = group;
        this.func = func;
    };
    var BBQuery = function(context, shape, id, data) {
        if (!(shape.group && context.group == shape.group) && context.layers & shape.layers && context.bb.intersects(shape.bb)) {
            context.func(shape, data);
        }
        return id;
    };
    Space.prototype.bBQuery = function(bb, layers, group, func, data) {
        var space = this;
        var context = new BBQueryContext(bb, layers, group, func);
        space.lock();
        {
            space.activeShapes.query(context, bb, BBQuery, data);
            space.staticShapes.query(context, bb, BBQuery, data);
        }
        space.unlock(true);
    };
    var ShapeQueryContext = function(func, data, anyCollision) {
        this.func = func;
        this.data = data;
        this.anyCollision = anyCollision;
    };
    var ShapeQuery = function(a, b, id, context) {
        if (a.group && a.group == b.group || !(a.layers & b.layers) || a == b) return id;
        var contacts = [];
        var numContacts = 0;
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
    Space.prototype.shapeQuery = function(shape, func, data) {
        var space = this;
        var body = shape.body;
        var bb = body ? shape.update(body.p, body.rot) : shape.bb;
        var context = new ShapeQueryContext(func, data, false);
        space.lock();
        {
            space.activeShapes.query(shape, bb, ShapeQuery, context);
            space.staticShapes.query(shape, bb, ShapeQuery, context);
        }
        space.unlock(true);
        return context.anyCollision;
    };
    Space.prototype.getPostStepCallback = function(key) {
        var space = this;
        var arr = space.postStepCallbacks;
        for (var i = 0; i < arr.length; i++) {
            var callback = arr[i];
            if (callback && callback.key == key) return callback;
        }
        return null;
    };
    Space.prototype.addPostStepCallback = function(func, key, data) {
        var space = this;
        if (NDEBUG) {
            cpAssertWarn(space.locked, "Adding a post-step callback when the space is not locked is unnecessary. " + "Post-step callbacks will not called until the end of the next call to cpSpaceStep() or the next query.");
        }
        if (!space.getPostStepCallback(key)) {
            var callback = new cpPostStepCallback(func ? func : _nothing(), key, data);
            space.postStepCallbacks.push(callback);
            return true;
        } else {
            return false;
        }
    };
    Space.prototype.lock = function() {
        var space = this;
        space.locked++;
    };
    Space.prototype.unlock = function(runPostStep) {
        var space = this;
        space.locked--;
        cpAssertHard(space.locked >= 0, "Internal Error: Space lock underflow.");
        if (space.locked == 0) {
            var rousedBodies = space.rousedBodies;
            var waking;
            while (waking = rousedBodies.pop()) {
                space.activateBody(waking);
            }
            if (space.locked == 0 && runPostStep && !space.skipPostStep) {
                space.skipPostStep = true;
                var arr = space.postStepCallbacks;
                var callback;
                while (callback = arr.pop()) {
                    var func = callback.func;
                    callback.func = null;
                    if (func) func(space, callback.key, callback.data);
                }
                space.skipPostStep = false;
            }
        }
    };
    var queryReject = function(a, b) {
        var result = !a.bb.intersects(b.bb) || a.body == b.body || a.group && a.group == b.group || !(a.layers & b.layers) || a.body.m == Infinity && b.body.m == Infinity;
        return result;
    };
    var cpSpaceCollideShapes = function(a, b, id, space) {
        if (queryReject(a, b)) return id;
        var handler = space.lookupHandler(a.collision_type, b.collision_type);
        var sensor = a.sensor || b.sensor;
        if (sensor && handler == cpDefaultCollisionHandler) return id;
        if (a.type > b.type || a.type == b.type && a < b) {
            var temp = a;
            a = b;
            b = temp;
        }
        var contacts = [];
        var idRef = {
            id: id
        };
        cpCollideShapes(a, b, idRef, contacts);
        var numContacts = contacts.length;
        if (!numContacts) return idRef.id;
        var arbHashID = CP_HASH_PAIR(a.hashid, b.hashid);
        var arb = space.cachedArbiters[arbHashID];
        if (!arb) {
            arb = space.pooledArbiters.pop();
            if (arb) {
                arb.reset(a, b);
            } else {
                arb = space.cachedArbiters[arbHashID] = new Arbiter(a, b);
            }
        }
        arb.update(contacts, handler, a, b);
        if (arb.state == cpArbiterStateFirstColl && !handler.begin(arb, space, handler.data)) {
            arb.ignore();
        }
        if (arb.state != cpArbiterStateIgnore && handler.preSolve(arb, space, handler.data) && !sensor) {
            space.arbiters.push(arb);
        } else {
            arb.contacts = null;
            if (arb.state != cpArbiterStateIgnore) arb.state = cpArbiterStateNormal;
        }
        arb.stamp = space.stamp;
        return idRef.id;
    };
    Space.prototype.arbiterSetFilter = function(arb) {
        var space = this;
        var ticks = space.stamp - arb.stamp;
        var a = arb.body_a, b = arb.body_b;
        if ((a.isStatic() || a.isSleeping()) && (b.isStatic() || b.isSleeping())) {
            return true;
        }
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
    var cpShapeUpdateFunc = function(shape) {
        var body = shape.body;
        shape.update(body.p, body.rot);
    };
    Space.prototype.step = function(dt) {
        var space = this;
        if (dt == 0) return;
        space.stamp++;
        var prev_dt = space.curr_dt;
        space.curr_dt = dt;
        var bodies = space.bodies;
        var constraints = space.constraints;
        var arbiters = space.arbiters;
        var arb;
        while (arb = arbiters.pop()) {
            arb.state = cpArbiterStateNormal;
            if (!arb.body_a.isSleeping() && !arb.body_b.isSleeping()) {
                arb.unthread();
            }
        }
        space.lock();
        {
            for (var i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                body.updatePosition(dt);
            }
            space.activeShapes.each(cpShapeUpdateFunc, null);
            space.activeShapes.reindexQuery(cpSpaceCollideShapes, space);
        }
        space.unlock(false);
        space.processComponents(dt);
        space.lock();
        {
            var cachedArbiters = space.cachedArbiters;
            for (var hash in cachedArbiters) {
                if (!this.arbiterSetFilter(cachedArbiters[hash])) {
                    delete cachedArbiters[hash];
                }
            }
            var arbLen = arbiters.length;
            var constraintLen = constraints.length;
            var slop = space.collisionSlop;
            var biasCoef = 1 - cpfpow(space.collisionBias, dt);
            for (var i = 0; i < arbLen; i++) {
                arbiters[i].preStep(dt, slop, biasCoef);
            }
            for (var i = 0; i < constraintLen; i++) {
                var constraint = constraints[i];
                constraint.preSolve(space);
                constraint.preStep(dt);
            }
            var damping = cpfpow(space.damping, dt);
            var gravity = space.gravity;
            for (var i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                body.updateVelocity(gravity, damping, dt);
            }
            var dt_coef = prev_dt == 0 ? 0 : dt / prev_dt;
            for (var i = 0; i < arbLen; i++) {
                arbiters[i].applyCachedImpulse(dt_coef);
            }
            for (var i = 0; i < constraintLen; i++) {
                var constraint = constraints[i];
                constraint.applyCachedImpulse(dt_coef);
            }
            for (var i = 0; i < space.iterations; i++) {
                for (var j = 0; j < arbLen; j++) {
                    arbiters[j].applyImpulse();
                }
                for (var j = 0; j < constraintLen; j++) {
                    var constraint = constraints[j];
                    constraint.applyImpulse(dt);
                }
            }
            for (var i = 0; i < constraintLen; i++) {
                var constraint = constraints[i];
                constraint.postSolve(space);
            }
            for (var i = 0; i < arbLen; i++) {
                var arb = arbiters[i];
                var handler = arb.handler;
                handler.postSolve(arb, space, handler.data);
            }
        }
        space.unlock(true);
    };
    Body.prototype.isSleeping = function() {
        return this.nodeRoot != null;
    };
    Body.prototype.isStatic = function() {
        return this.nodeIdleTime == Infinity;
    };
    Body.prototype.isRogue = function() {
        return this.space == null;
    };
    Body.prototype.local2World = function(v) {
        var body = this;
        return cpvadd(body.p, cpvrotate(v, body.rot));
    };
    Body.prototype.world2Local = function(v) {
        var body = this;
        return cpvunrotate(cpvsub(v, body.p), body.rot);
    };
    Body.prototype.kineticEnergy = function() {
        var body = this;
        var vsq = cpvdot(body.v, body.v);
        var wsq = body.w * body.w;
        return (vsq ? vsq * body.m : 0) + (wsq ? wsq * body.i : 0);
    };
    Space.prototype.isLocked = function() {
        return this.locked;
    };
    var MAGIC_EPSILON = 1e-5;
    Constraint.prototype.next = function(body) {
        var node = this;
        return node.a == body ? node.next_a : node.next_b;
    };
    Arbiter.prototype.next = function(body) {
        var node = this;
        return node.body_a == body ? node.thread_a.next : node.thread_b.next;
    };
    var cpClosetPointOnSegment = function(p, a, b) {
        var deltaX = a.x - b.x;
        var deltaY = a.y - b.y;
        var t = cpfclamp01((deltaX * (p.x - b.x) + deltaY * (p.y - b.y)) / (deltaX * deltaX + deltaY * deltaY));
        return new Vect(b.x + deltaX * t, b.y + deltaY * t);
    };
    Shape.prototype.active = function() {
        var shape = this;
        return shape.prev || shape.body && shape.body.shapeList == shape;
    };
    var CircleSegmentQuery = function(shape, center, r, a, b) {
        var da = cpvsub(a, center);
        var db = cpvsub(b, center);
        var qa = cpvdot(da, da) - 2 * cpvdot(da, db) + cpvdot(db, db);
        var qb = -2 * cpvdot(da, da) + 2 * cpvdot(da, db);
        var qc = cpvdot(da, da) - r * r;
        var det = qb * qb - 4 * qa * qc;
        if (det >= 0) {
            var t = (-qb - cpfsqrt(det)) / (2 * qa);
            if (0 <= t && t <= 1) {
                return new cpSegmentQueryInfo(shape, t, cpvnormalize(cpvlerp(da, db, t)));
            }
        }
    };
    var cpSplittingPlane = function(a, b) {
        this.n = a;
        this.d = b;
    };
    var cpSplittingPlaneNew = function(a, b) {
        var n = cpvnormalize(cpvperp(cpvsub(b, a)));
        var d = cpvdot(n, a);
        return new cpSplittingPlane(n, d);
    };
    cpSplittingPlane.prototype.compare = function(v) {
        var plane = this;
        return cpvdot(plane.n, v) - plane.d;
    };
    var cpPostStepCallback = function(func, key, data) {
        this.func = func;
        this.key = key;
        this.data = data;
    };
    Space.prototype.lookupHandler = function(a, b) {
        return this.collisionHandlers[CP_HASH_PAIR(a, b)] || this.defaultHandler;
    };
    Space.prototype.uncacheArbiter = function(arb) {
        var space = this;
        var a = arb.a, b = arb.b;
        var arbHashID = CP_HASH_PAIR(a.hashid, b.hashid);
        delete space.cachedArbiters[arbHashID];
        cpArrayDeleteObj(space.arbiters, arb);
    };
    Arbiter.prototype.callSeparate = function(space) {
        var arb = this;
        var handler = space.lookupHandler(arb.a.collision_type, arb.b.collision_type);
        handler.separate(arb, space, handler.data);
    };
    Arbiter.prototype.threadForBody = function(body) {
        var arb = this;
        return arb.body_a == body ? arb.thread_a : arb.thread_b;
    };
    Constraint.prototype.activateBodies = function() {
        var constraint = this;
        var a = constraint.a;
        if (a) a.activate();
        var b = constraint.b;
        if (b) b.activate();
    };
    var relative_velocity = function(a, b, r1, r2) {
        var x = b.v.x - r2.y * b.w - (a.v.x - r1.y * a.w);
        var y = b.v.y + r2.x * b.w - (a.v.y + r1.x * a.w);
        return new Vect(x, y);
    };
    var normal_relative_velocity = function(a, b, r1, r2, n) {
        var x = b.v.x - r2.y * b.w - (a.v.x - r1.y * a.w);
        var y = b.v.y + r2.x * b.w - (a.v.y + r1.x * a.w);
        return x * n.x + y * n.y;
    };
    var apply_impulse = function(body, j, r) {
        body.v.x += j.x * body.m_inv;
        body.v.y += j.y * body.m_inv;
        body.w += body.i_inv * (r.x * j.y - r.y * j.x);
    };
    var apply_impulses = function(a, b, r1, r2, j) {
        var jx = j.x;
        var jy = j.y;
        a.v.x += -jx * a.m_inv;
        a.v.y += -jy * a.m_inv;
        a.w += a.i_inv * (-r1.x * jy + r1.y * jx);
        b.v.x += jx * b.m_inv;
        b.v.y += jy * b.m_inv;
        b.w += b.i_inv * (r2.x * jy - r2.y * jx);
    };
    var apply_bias_impulse = function(body, j, r) {
        body.v_bias = cpvadd(body.v_bias, cpvmult(j, body.m_inv));
        body.w_bias += body.i_inv * cpvcross(r, j);
    };
    var apply_bias_impulses = function(a, b, r1, r2, j) {
        apply_bias_impulse(a, cpvneg(j), r1);
        apply_bias_impulse(b, j, r2);
    };
    var k_scalar_body = function(body, r, n) {
        var rcn = cpvcross(r, n);
        return body.m_inv + body.i_inv * rcn * rcn;
    };
    var k_scalar = function(a, b, r1, r2, n) {
        var value = k_scalar_body(a, r1, n) + k_scalar_body(b, r2, n);
        if (NDEBUG) {
            cpAssertSoft(value != 0, "Unsolvable collision or constraint.");
        }
        return value;
    };
    var k_tensor = function(a, b, r1, r2) {
        var m_sum = a.m_inv + b.m_inv;
        var k11 = m_sum, k12 = 0;
        var k21 = 0, k22 = m_sum;
        var a_i_inv = a.i_inv;
        var r1xsq = r1.x * r1.x * a_i_inv;
        var r1ysq = r1.y * r1.y * a_i_inv;
        var r1nxy = -r1.x * r1.y * a_i_inv;
        k11 += r1ysq;
        k12 += r1nxy;
        k21 += r1nxy;
        k22 += r1xsq;
        var b_i_inv = b.i_inv;
        var r2xsq = r2.x * r2.x * b_i_inv;
        var r2ysq = r2.y * r2.y * b_i_inv;
        var r2nxy = -r2.x * r2.y * b_i_inv;
        k11 += r2ysq;
        k12 += r2nxy;
        k21 += r2nxy;
        k22 += r2xsq;
        var det = k11 * k22 - k12 * k21;
        if (NDEBUG) {
            cpAssertSoft(det != 0, "Unsolvable constraint.");
        }
        var det_inv = 1 / det;
        return new Mat2x2(k22 * det_inv, -k12 * det_inv, -k21 * det_inv, k11 * det_inv);
    };
    var bias_coef = cp.biasCoef = function(errorBias, dt) {
        return 1 - cpfpow(errorBias, dt);
    };
})({}, function() {
    return this;
}());