(function(global) {
    var Demo = global.Demo

    var Renderer  = Demo.Renderer = function(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')
    }

    /*static const cpVect*/ var spring_verts = [
        cp.v(0.00, 0.0),
        cp.v(0.20, 0.0),
        cp.v(0.25, 3.0),
        cp.v(0.30,-6.0),
        cp.v(0.35, 6.0),
        cp.v(0.40,-6.0),
        cp.v(0.45, 6.0),
        cp.v(0.50,-6.0),
        cp.v(0.55, 6.0),
        cp.v(0.60,-6.0),
        cp.v(0.65, 6.0),
        cp.v(0.70,-3.0),
        cp.v(0.75, 6.0),
        cp.v(0.80, 0.0),
        cp.v(1.00, 0.0)
    ];

    Renderer.prototype = {
        width: 640
        ,height: 480
        ,halfWidth: 640 / 2
        ,halfHeight: 480 / 2
        ,scale: 1
        ,pointLineScale: 1

        ,point2canvas: function(v) {
            return cp.v((v.x + this.halfWidth) * this.scale, (this.halfHeight - v.y) * this.scale)
        }

        ,canvas2point: function(x, y) {
            return cp.v(x / this.scale - this.halfWidth, this.halfHeight - y / this.scale)
        }

        ,resize: function(width, height) {
            var scale = this.scale = Math.min(width / this.width, height / this.height)
            width = this.width * scale
            height = this.height * scale

            $(this.canvas).attr({width: width, height: height})
                .parent().css({width: width, height: height})
        }

        ,clear: function() {
            this.ctx.clearRect(0, 0, this.width * this.scale, this.height * this.scale)
//            this.ctx.fillStyle = '#343e48'
//            this.ctx.fillRect(0, 0, this.width * this.scale, this.height * this.scale)
//            this.ctx.fill()
        }

        ,drawFatSegment: function(ta, tb, r, outline_color, fill_color) {
            var a = this.point2canvas(ta)
            var b = this.point2canvas(tb)
            var ctx = this.ctx
            ctx.lineWidth = Math.max((r * 2) * this.scale, 1)
            ctx.lineCap = 'round'

            ctx.strokeStyle = outline_color.rgba

            if (fill_color) {
                ctx.strokeStyle = fill_color.rgba
            }
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.fill()
            ctx.stroke()
            ctx.lineWidth = 1
            ctx.lineCap = 'butt'
        }

        ,drawSegment: function(a, b, color) {
            this.drawFatSegment(a, b, 0, color)
        }

        ,drawDot: function(size, pos, fillColor) {
            var p = this.point2canvas(pos)
            var ctx = this.ctx
            ctx.fillStyle = fillColor.rgba
            ctx.beginPath()
            ctx.arc(p.x, p.y, size / 2, 0, Math.PI*2)
            ctx.fill()
        }

        ,drawPoints: function(size, points, color) {
            for (var i = 0; i < points.length; i++) {
                this.drawDot(size, points[i], color)
            }
        }

        ,drawCircle: function(pos, a, r, outline_color, fill_color) {
            var p = this.point2canvas(pos)
            var ctx = this.ctx
            ctx.fillStyle = fill_color.rgba
            if (outline_color) {
                ctx.strokeStyle = outline_color.rgba
            }
            ctx.beginPath()
            ctx.arc(p.x, p.y, r * this.scale, 0, Math.PI*2)
            ctx.fill()
            ctx.stroke()
            this.drawSegment(pos, cp.v.add(pos, cp.v.mult(cp.v.forangle(a), r - this.pointLineScale*0.5)), outline_color);
        }

        ,drawPolygon: function(verts, radius, outline_color, fill_color) {
            if (!verts.length) {
                return
            }

            if (radius) {
                verts = expandVerts(verts, radius)
            }

            var ctx = this.ctx;
            if (fill_color) {
                ctx.fillStyle = fill_color.rgba
            }
            ctx.strokeStyle = outline_color.rgba

            ctx.beginPath()

            if (radius) {
                for (var i = 0; i < verts.length; i++) {
                    verts[i] = this.point2canvas(verts[i])
                }
                verts = getRoundedPoints(verts, radius * this.scale);
                var p1, p0 = verts[0]
                ctx.moveTo(p0[0], p0[1])
                ctx.quadraticCurveTo(p0[2], p0[3], p0[4], p0[5]);

                for (var i = 1; i < verts.length; i++) {
                    p1 = verts[i]
                    ctx.lineTo(p1[0], p1[1])
                    ctx.quadraticCurveTo(p1[2], p1[3], p1[4], p1[5]);
                }
                ctx.lineTo(p0[0], p0[1])
            } else {
                var p, p0 = this.point2canvas(verts[0])
                ctx.moveTo(p0.x, p0.y)
                for (var i = 1; i < verts.length; i++) {
                    p = this.point2canvas(verts[i])
                    ctx.lineTo(p.x, p.y)
                }
                ctx.lineTo(p0.x, p0.y)
            }

            if (fill_color) {
                ctx.fill()
            }
            ctx.stroke()
            ctx.lineWidth = 1
        }

        ,drawBB: function(bb, color) {
            var verts = [
                cp.v(bb.l, bb.b),
                cp.v(bb.l, bb.t),
                cp.v(bb.r, bb.t),
                cp.v(bb.r, bb.b)
            ]
            this.drawPolygon(verts, 0, color)
        }

        ,drawString: function(pos, str) {
            pos = this.point2canvas(pos)
            this.ctx.font = 10 * this.scale + 'px Tahoma'
            this.ctx.fillStyle = '#fff'
            var parts = str.split("\n")
            for (var i = 0; i < parts.length; i++) {
                this.ctx.fillText(parts[i], pos.x, pos.y)
                pos.y += 14 * this.scale
            }
        }

        ,drawSpring: function(/*cpDampedSpring*/ spring, /*cpBody*/ body_a, /*cpBody*/ body_b, color) {
            /*cpVect*/ var a = cp.v.add(body_a.p, cp.v.rotate(spring.anchr1, body_a.rot));
            /*cpVect*/ var b = cp.v.add(body_b.p, cp.v.rotate(spring.anchr2, body_b.rot));

            this.drawDot(5, a, color);
            this.drawDot(5, b, color);

            /*cpVect*/ var delta = cp.v.sub(b, a);
            /*GLfloat*/ var cos = delta.x;
            /*GLfloat*/ var sin = delta.y;
            /*GLfloat*/ var s = 1.0/cp.v.len(delta);

            /*cpVect*/ var r1 = cp.v(cos, -sin*s);
            /*cpVect*/ var r2 = cp.v(sin,  cos*s);

//	/*cpVect*/ var verts = (cpVect *)alloca(spring_count*sizeof(cpVect));
            /*cpVect*/ var verts = [];
            for(var i=0; i<spring_verts.length; i++){
                /*cpVect*/ var v = spring_verts[i];
                verts[i] = cp.v(cp.v.dot(v, r1) + a.x, cp.v.dot(v, r2) + a.y);
            }

            for(var i=0; i<spring_verts.length-1; i++){
                this.drawSegment(verts[i], verts[i + 1], color);
            }
        }

        ,drawRect: function(pos, width, height, color) {
            pos = this.point2canvas(pos)

            width *= this.scale
            height *= this.scale

            this.ctx.fillStyle = color.rgb
            this.ctx.fillRect(pos.x - width / 2, pos.y - height / 2, width, height)
        }
    }

    function intersect(line1, line2) {
        var a1 = line1[1].x - line1[0].x;
        var b1 = line2[0].x - line2[1].x;
        var c1 = line2[0].x - line1[0].x;

        var a2 = line1[1].y - line1[0].y;
        var b2 = line2[0].y - line2[1].y;
        var c2 = line2[0].y - line1[0].y;

        var t = (b1*c2 - b2*c1) / (a2*b1 - a1*b2);

        return cp.v(
            line1[0].x + t * (line1[1].x - line1[0].x),
            line1[0].y + t * (line1[1].y - line1[0].y)
            );
    }

    function expandVerts(p, distance) {
        var expanded = [];
        for (var i = 0; i < p.length; ++i) {

            // get this point (pt1), the point before it
            // (pt0) and the point that follows it (pt2)
            var pt0 = p[(i > 0) ? i - 1 : p.length - 1];
            var pt1 = p[i];
            var pt2 = p[(i < p.length - 1) ? i + 1 : 0];

            // find the line vectors of the lines going
            // into the current point
            var v01 = cp.v(pt1.x - pt0.x, pt1.y - pt0.y);
            var v12 = cp.v(pt2.x - pt1.x, pt2.y - pt1.y);

            // find the normals of the two lines, multiplied
            // to the distance that polygon should inflate
            var d01 = cp.v.mult(cp.v.normalize(cp.v.perp(v01)), distance);
            var d12 = cp.v.mult(cp.v.normalize(cp.v.perp(v12)), distance);

            // use the normals to find two points on the
            // lines parallel to the polygon lines
            var ptx0  = cp.v(pt0.x + d01.x, pt0.y + d01.y);
            var ptx10 = cp.v(pt1.x + d01.x, pt1.y + d01.y);
            var ptx12 = cp.v(pt1.x + d12.x, pt1.y + d12.y);
            var ptx2  = cp.v(pt2.x + d12.x, pt2.y + d12.y);

            // find the intersection of the two lines, and
            // add it to the expanded polygon
            expanded.push(intersect([ptx0, ptx10], [ptx12, ptx2]));
        }
        return expanded;
    }

    var getRoundedPoints = function(pts, radius) {
        var i1, i2, i3, p1, p2, p3, prevPt, nextPt,
            len = pts.length,
            res = new Array(len);
        for (i2 = 0; i2 < len; i2++) {
            i1 = i2-1;
            i3 = i2+1;
            if (i1 < 0) {
                i1 = len - 1;
            }
            if (i3 == len) {
                i3 = 0;
            }
            p1 = pts[i1];
            p2 = pts[i2];
            p3 = pts[i3];
            prevPt = getRoundedPoint(p1.x, p1.y, p2.x, p2.y, radius, false);
            nextPt = getRoundedPoint(p2.x, p2.y, p3.x, p3.y, radius, true);
            res[i2] = [prevPt[0], prevPt[1], p2.x, p2.y, nextPt[0], nextPt[1]];
        }
        return res;
    };

    var getRoundedPoint = function(x1, y1, x2, y2, radius, first) {
        var total = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
            idx = first ? radius / total : (total - radius) / total;
        return [x1 + (idx * (x2 - x1)), y1 + (idx * (y2 - y1))];
    };

})(function() {
   return this;
}())