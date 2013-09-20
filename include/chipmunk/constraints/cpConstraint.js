/// @private
//void
Constraint.prototype.activateBodies = function () {
    var constraint = this;
    /*cpBody*/
    var a = constraint.a;
    if (a) a.activate();
    /*cpBody*/
    var b = constraint.b;
    if (b) b.activate();
}