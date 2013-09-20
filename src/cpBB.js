/**
 * @param {Vect} v
 * @returns {Vect}
 */
BB.prototype.wrapVect = function (v) {
    var bb = this;
    /*cpFloat*/
    var ix = cpfabs(bb.r - bb.l);
    /*cpFloat*/
    var modx = cpfmod(v.x - bb.l, ix);
    /*cpFloat*/
    var x = (modx > 0.0) ? modx : modx + ix;

    /*cpFloat*/
    var iy = cpfabs(bb.t - bb.b);
    /*cpFloat*/
    var mody = cpfmod(v.y - bb.b, iy);
    /*cpFloat*/
    var y = (mody > 0.0) ? mody : mody + iy;

    return new Vect(x + bb.l, y + bb.b);
}
