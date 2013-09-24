(function() {
    var CharSupports = CutTheRope.CharSupports = function(app, pos) {
        this.app = app
        this.pos = pos;
    }

    CharSupports.prototype = {
        image: 'char_supports.png'
        ,width: 120
        ,height: 120
        ,draw: function() {
            this.app.renderer.drawImage(
                this.app.images[this.image],
                this.pos,
                this.width,
                this.height
            )
        }
    }
})()