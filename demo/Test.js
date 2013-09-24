(function() {
   Demo.add({
       name: 'test'
       ,init: function() {
           var space = this.space;
           var body, shape
           body = space.addBody(new cp.Body(1, cp.momentForCircle(1, 0, 40, cp.vzero)))
           body.setPos(cp.v(-50, 0))
           shape = space.addShape(new cp.CircleShape(body, 40, cp.vzero))

           body = space.addBody(new cp.Body(1, cp.momentForCircle(1, 0, 40, cp.vzero)))
           body.setPos(cp.v(50, 0))
           shape = space.addShape(new cp.CircleShape(body, 40, cp.vzero))
       }
   })
})()