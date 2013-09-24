(function() {
    var Character = CutTheRope.Character = function(app, pos) {
        this.app = app
        this.pos = pos
        this.init()
    }

    Character.prototype = {
        width: 84
        ,height: 86.5
        ,sprites: 9
        ,image: 'char_animations.png'

        ,init: function() {
            var body = this.body = new cp.Body(Infinity, Infinity)
            var shape = this.shape = new cp.BoxShape(body, this.width, this.height)

            this.initializeAnimate()
        }

        ,initializeAnimate: function() {
//            window.height = 85
//            window.i = 0
            var offset = this.offset = cp.v(0, 0)
//            var me = this

//            var offsetY = this.height
//            var size = this.height * this.sprites
//            setInterval(function() {
//                offset.y += offsetY
//                if (offset.y >= size) {
//                    offset.y = 0
//                }
//            }, 1000 / this.sprites)
        }

        ,draw: function() {
            this.app.renderer.drawImage(
                this.app.images[this.image],
                this.pos,
                this.offset,
                this.width,
                this.height
            )
        }
    }
})()

//85 Character.js:33
//170 Character.js:33
//255 Character.js:33
//340 Character.js:33
//425 Character.js:33
//510 Character.js:33
//595 Character.js:33
//680 Character.js:33
//765