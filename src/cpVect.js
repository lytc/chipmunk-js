//cpVect
var cpvslerp = cp.v.slerp = function (/*const cpVect*/ v1, /*const cpVect*/ v2, /*const cpFloat*/ t) {
    /*cpFloat*/
    var dot = cpvdot(cpvnormalize(v1), cpvnormalize(v2));
    /*cpFloat*/
    var omega = cpfacos(cpfclamp(dot, -1.0, 1.0));

    if (omega < 1e-3) {
        // If the angle between two vectors is very small, lerp instead to avoid precision issues.
        return cpvlerp(v1, v2, t);
    } else {
        /*cpFloat*/
        var denom = 1.0 / cpfsin(omega);
        return cpvadd(cpvmult(v1, cpfsin((1.0 - t) * omega) * denom), cpvmult(v2, cpfsin(t * omega) * denom));
    }
}

//cpVect
cp.v.slerpconst = function (/*const cpVect*/ v1, /*const cpVect*/ v2, /*const cpFloat*/ a) {
    /*cpFloat*/
    var dot = cpvdot(cpvnormalize(v1), cpvnormalize(v2));
    /*cpFloat*/
    var omega = cpfacos(cpfclamp(dot, -1.0, 1.0));

    return cpvslerp(v1, v2, cpfmin(a, omega) / omega);
}

//char*
cp.v.str = function (/*const cpVect*/ v) {
    return '(' + v.x + ', ' + v.y + ')';
}
