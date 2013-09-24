/// Returns true if the body is sleeping.
//cpBool
Body.prototype.isSleeping = function () {
    return !!this.nodeRoot;
}

/// Returns true if the body is static.
//cpBool
Body.prototype.isStatic = function () {
    return this.nodeIdleTime == Infinity;
}

/// Returns true if the body has not been added to a space.
/// Note: Static bodies are a subtype of rogue bodies.
//cpBool
Body.prototype.isRogue = function () {
    return !this.space;
}

/// Convert body relative/local coordinates to absolute/world coordinates.
//cpVect
Body.prototype.local2World = function (/*const cpVect*/ v) {
    var body = this;
    return cpvadd(body.p, cpvrotate(v, body.rot));
}

/// Convert body absolute/world coordinates to  relative/local coordinates.
//cpVect
Body.prototype.world2Local = function (/*const cpVect*/ v) {
    var body = this;
    return cpvunrotate(cpvsub(v, body.p), body.rot);
}

/// Get the kinetic energy of a body.
//cpFloat
Body.prototype.kineticEnergy = function () {
    var body = this;
    // Need to do some fudging to avoid NaNs
    /*cpFloat*/
    var vsq = cpvdot(body.v, body.v);
    /*cpFloat*/
    var wsq = body.w * body.w;
    return (vsq ? vsq * body.m : 0.0) + (wsq ? wsq * body.i : 0.0);
}