(function() {
    var Renderer = CutTheRope.Renderer = function(canvas, width, height) {
        this.canvas = canvas
        this.setSize(width, height)
        this.ctx = canvas.getContext('2d')
    }

    Renderer.prototype = {
        setSize: function(width, height) {
            this.width = width
            this.height = height
            this.halfWidth = width / 2
            this.halfHeight = height / 2
        }

        ,clear: function() {
            this.ctx.clearRect(0, 0, this.width, this.height)
        }

        ,point2canvas: function(p) {
            return cp.v(p.x + this.halfWidth, this.halfHeight - p.y)
        }

        ,canvas2point: function(x, y) {
            return cp.v(x - this.halfWidth, this.halfHeight - y)
        }

        ,drawImage: function(img, pos, offset, width, height) {
            pos = this.point2canvas(pos)
            var x = pos.x
            var y = pos.y

            var offsetX = 0
            var offsetY = 0

            if (arguments.length == 4) {
                height = width
                width = offset
                offset = null
            }

            if (offset) {
                offsetX = offset.x
                offsetY = offset.y
            }

            var halfWidth = width / 2
            var halfHeight = height / 2

            var ctx = this.ctx
            ctx.save()
            ctx.translate(x, y)
            ctx.translate(halfWidth, halfHeight)
            ctx.drawImage(img, offsetX, offsetY, width, height, 0, 0, -width, -height)
            ctx.restore()
        }

        ,drawPolygon: function(verts, radius, color) {
            var p, p0 = this.point2canvas(verts[0])

            var ctx = this.ctx
            ctx.save()
            ctx.fillStyle = color

            ctx.beginPath()

            ctx.moveTo(p0.x, p0.y)
            for (var i = 1; i < verts.length; i++) {
                p = this.point2canvas(verts[i])
                ctx.lineTo(p.x, p.y)
            }
            ctx.lineTo(p0.x, p0.y)
            ctx.fill()
            ctx.restore()
        }

        ,drawLine: function(start, end, width, color) {
            start = this.point2canvas(start)
            end = this.point2canvas(end)

            var ctx = this.ctx
            ctx.save()
            ctx.lineWidth = width
            ctx.strokeStyle = color
            ctx.beginPath()
            ctx.moveTo(start.x, start.y)
            ctx.lineTo(end.x, end.y)
            ctx.stroke()
            ctx.restore()
        }
    }
})()