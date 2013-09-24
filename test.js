var BB = function (width, height, x, y) {
    var hw = width / 2.0;
    var hh = height / 2.0;

    this.l = -hw + x;
    this.b = -hh + y;
    this.r = hw + x;
    this.t = hh + y;
};

BB.prototype.intersects1 = function (b) {
    var a = this;
    return (a.l <= b.r && b.l <= a.r && a.b <= b.t && b.b <= a.t);
};

BB.prototype.intersects2 = function (b) {
    var a = this;
    return !(a.l > b.r && b.l > a.r && a.b > b.t && b.b > a.t);
};

BB.prototype.not_intersects = function (b) {
    var a = this;
    return (a.l > b.r && b.l > a.r && a.b > b.t && b.b > a.t);
};

var random = function(min, max) {
    if (!(max)) {
        max = min
        min = 0
    }

    return min + Math.random() * (max - min)
}

var boxes = []
for (var i = 0; i < 100; i++) {
    boxes.push(new BB(random(50, 200), random(50, 200), random(-1000, 1000), random(-1000, 1000)))
}