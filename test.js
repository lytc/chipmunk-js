var BB = function (width, height) {
    var hw = width / 2.0;
    var hh = height / 2.0;

    this.l = -hw;
    this.b = -hh;
    this.r = hw;
    this.t = hh;
};

BB.prototype.intersects1 = function (b) {
    var a = this;
    return (a.l <= b.r && b.l <= a.r && a.b <= b.t && b.b <= a.t);
};

BB.prototype.intersects2 = function (b) {
    var a = this;
    return ! ( b.l > a.r || b.r < a.l || b.t < a.b || b.b > a.t);
};