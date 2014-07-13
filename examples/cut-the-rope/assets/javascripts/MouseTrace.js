(function() {
    var MouseTrace = CutTheRope.MouseTrace = function(app) {
        this.app = app
        this.items = []
    }

    MouseTrace.prototype = {
        life: 200
        ,width: 10

        ,add: function(x, y) {
            this.items.push({v: cp.v(x, y), time: Date.now()})
        }

        ,reset: function() {
            this.items.length = 0
        }

        ,update: function(time) {
            var item
            for (var i = 0; i < this.items.length; i++) {
                item = this.items[i]
                if (item.time + this.life <= time) {
                    this.items.splice(i, 1)
                }
            }
        }

        ,draw: function() {
            var width = this.width
            var step = width / this.items.length
            var renderer = this.app.renderer

            for (var i = this.items.length - 1; i > 0; i--) {
                width -= step
                renderer.drawLine(this.items[i].v, this.items[i-1].v, width, '#fff')
            }
        }
    }

})()