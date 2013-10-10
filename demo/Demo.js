(function(global) {
    var requestAnimationFrame = global.requestAnimationFrame
                                || global.webkitRequestAnimationFrame
                                || global.mozRequestAnimationFrame
                                || global.oRequestAnimationFrame
                                || global.msRequestAnimationFrame;


    var GRABABLE_MASK_BIT = 1<<31;
    var NOT_GRABABLE_MASK = ~GRABABLE_MASK_BIT;
    /*float*/ var SHAPE_ALPHA = 1.0;

    var colors = [];
    for (var i = 0; i < 100; i++) {
        var r = Math.floor(Math.random() * 256)
        var g = Math.floor(Math.random() * 256)
        var b = Math.floor(Math.random() * 256)

        colors.push('rgb(' + [r, g, b].join(',') + ')')
    }

    /*Color*/ var LINE_COLOR = 'rgba(200, 210, 230, 1)';
    /*Color*/ var CONSTRAINT_COLOR = 'rgba(0, 191, 0, 1)';

    function getMousePoint(e) {
        if(e.offsetX == undefined) {
            var targetOffset = $(e.target).offset();
            e.offsetX = e.pageX - targetOffset.left;
            e.offsetY = e.pageY - targetOffset.top;
        }

        return Demo.renderer.canvas2point(e.offsetX, e.offsetY)
    }

    var Base = function() {
        this.space = new cp.Space()
        window.space = this.space
    }

    Base.prototype = {
        steps: 1 // 1/60
        ,update: function(/*double*/ dt) {
            this.space.step(dt);
        }
    }

    var Demo = {
        GRABABLE_MASK_BIT: GRABABLE_MASK_BIT
        ,NOT_GRABABLE_MASK: NOT_GRABABLE_MASK
        ,demoList: {}
        ,rightClick: false
        ,mouse: cp.v(0, 0)
        ,keyboard: cp.v(0, 0)
        ,rightClick: false
        ,rightDown: false
        ,mouseJoint: null
        ,currentDemo: null
        ,disableDrawCollisionPoints: false

        ,add: function(child, overrides) {
            if (!overrides) {
                overrides = child
                child = overrides.constructor !== Object.prototype.constructor? overrides.constructor : function() {
                    Base.apply(this, arguments)
                }
            }
            delete overrides.constructor

            // extend static
            var parent = Base;
            for (var prop in parent) {
                if (!child[prop] && parent.hasOwnProperty(prop)) {
                    child[prop] = parent[prop]
                }
            }

            var ctor = function() {
                this.constructor = child
            }

            ctor.prototype = parent.prototype

            child.prototype = new ctor()

            for (var prop in overrides) {
                if (overrides.hasOwnProperty(prop)) {
                    child.prototype[prop] = overrides[prop];
                }
            }

            child.__super__ = parent.prototype

            Demo.demoList[child.prototype.name] = child
            return child
        }

        ,initRenderer: function() {
            var canvas = this.canvas = document.getElementById('canvas')
            this.renderer = new Demo.Renderer(canvas)
            $(window).resize(function() {
                Demo.renderer.resize(window.innerWidth, window.innerHeight)
            })
            Demo.renderer.resize(window.innerWidth, window.innerHeight)
        }

        ,initMouse: function() {
            var me = this;
            this.mouseBody = new cp.Body(Infinity, Infinity);
            this.mouseBody.p = this.mouse;

            $(this.canvas).on({
                mousedown: function(e) {
                    e.preventDefault()

                    var point = getMousePoint(e);
                    me.mouse.x = point.x;
                    me.mouse.y = point.y;

                    if (e.button == 0 && !me.mouseJoint) {
                        /*cpShape*/ var shape = me.currentDemo.space.pointQueryFirst(me.mouse, me.GRABABLE_MASK_BIT, cp.NO_GROUP);

                        if(shape){
                            /*cpBody*/ var body = shape.body;
                            me.mouseJoint = new cp.PivotJoint(me.mouseBody, body, cp.vzero, body.world2Local(me.mouse));
                            me.mouseJoint.maxForce = 50000.0;
                            me.mouseJoint.errorBias = cp.fpow(1.0 - 0.15, 60.0);
                            me.currentDemo.space.addConstraint(me.mouseJoint);
                        }
                    }
                }
                ,mouseup: function() {
                    me.rightDown = false
                    me.rightClick = false

                    if (me.mouseJoint) {
                        me.currentDemo.space.removeConstraint(me.mouseJoint)
                        me.mouseJoint = null;
                    }
                }
                ,mousemove: function(e) {
                    var point = getMousePoint(e);
                    me.mouse.x = point.x;
                    me.mouse.y = point.y;
                }
                ,contextmenu: function(e) {
                    e.preventDefault()
                    me.rightClick = true
                    me.rightDown = true
                }
            })
        }

        ,initKeyboard: function() {
            var me = this
            $(this.canvas).on({
                keydown: function(e) {
                    var keyCode = e.keyCode || e.which
                    switch (keyCode) {
                        case 37: // left
                            me.keyboard.x = -1
                            break

                        case 39: // right
                            me.keyboard.x = 1
                            break

                        case 38: // up
                            me.keyboard.y = 1
                            break

                        case 40: // down
                            me.keyboard.y = -1
                            break
                    }
                }
                ,keyup: function(e) {
                    me.keyboard.x = me.keyboard.y = 0
                }
            })
        }

        ,run: function() {
            this.initRenderer()
            this.initMouse()
            this.initKeyboard()

            var me = this;

            var stats = new Stats()
            $(stats.domElement).css({
                position: 'fixed'
                ,top: 0
                ,right: 0
                ,zIndex: 9999
            }).appendTo(document.body)

            this.totalTime = 0
            var step = function() {

                if (me.currentDemo) {
                    me.renderer.clear()

                    var dt = 1/ (60*me.currentDemo.steps);

                    for (var i = 0; i < me.currentDemo.steps; i++) {
                        me.currentDemo.update(dt)
                        me.rightDown = false
                    }

                    me.drawShapes()
                    me.drawConstraints()
                    me.disableDrawCollisionPoints || me.drawCollisionPoints()
                    me.drawHighlightShape()
                    me.drawMouse()
                    me.drawInfo()

                    me.totalTime += 1/60
                    stats.update()
                }

                requestAnimationFrame(step)
            }

            requestAnimationFrame(step)
        }

        ,runDemo: function(name) {
            var demo = this.demoList[name];
            if (!demo) {
                throw new Error('Demo not found with name ' + name)
            }

            $('title').text(demo.prototype.name)

            this.currentDemo = new demo()
            this.currentDemo.init()
        }

        ,drawShapes: function() {
            this.currentDemo.space.eachShape(this.drawShape)
        }

        ,drawShape: function(/*cpShape*/ shape, /*struct ShapeColors*/ fillColor, outlineColor) {
            /*cpBody*/ var body = shape.body;
            /*Color*/ var fill_color = (fillColor ? fillColor : Demo.colorForShape(shape));
            /*Color*/ var outline_color = (outlineColor ? outlineColor : LINE_COLOR);

            switch(shape.type){
                case cp.CIRCLE_SHAPE: {
                    /*cpCircleShape*/ var circle = /*cpCircleShape*/shape;
                    circle.draw? circle.draw() : Demo.renderer.drawCircle(circle.tc, body.a, circle.r, outline_color, fill_color);
//                    Demo.renderer.drawBB(circle.bb, outline_color)
                    break;
                }
                case cp.SEGMENT_SHAPE: {
                    /*cpSegmentShape*/ var seg = /*cpSegmentShape*/shape;
                    Demo.renderer.drawFatSegment(seg.ta, seg.tb, seg.r, outline_color, fill_color);
                    break;
                }
                case cp.POLY_SHAPE: {
                    /*cpPolyShape*/ var poly = /*cpPolyShape*/shape;
                    Demo.renderer.drawPolygon(poly.tVerts, poly.r, outline_color, fill_color);
                    break;
                }
                default: break;
            }
        }

        ,drawHighlightShape: function() {
            // Highlight the shape under the mouse because it looks neat.
            var nearestInfo = this.currentDemo.space.nearestPointQueryNearest(this.mouse, 0.0, cp.ALL_LAYERS, cp.NO_GROUP);
            if(nearestInfo) {
                this.drawShape(nearestInfo.shape, 'rgba(0, 0, 0, 0)', 'rgb(255, 0, 0)')
            }
        }

        ,drawConstraints: function() {
            this.currentDemo.space.eachConstraint(this.drawConstraint)
        }

        ,drawConstraint: function(constraint) {
            var renderer = Demo.renderer

            /*cpBody*/ var body_a = constraint.a;
            /*cpBody*/ var body_b = constraint.b;

            if(constraint instanceof cp.PinJoint){
                /*cpPinJoint*/ var joint = /*(cpPinJoint *)*/constraint;

                /*cpVect*/ var a = cp.v.add(body_a.p, cp.v.rotate(joint.anchr1, body_a.rot));
                /*cpVect*/ var b = cp.v.add(body_b.p, cp.v.rotate(joint.anchr2, body_b.rot));

                renderer.drawDot(4, a, CONSTRAINT_COLOR);
                renderer.drawDot(4, b, CONSTRAINT_COLOR);
                renderer.drawSegment(a, b, CONSTRAINT_COLOR);
            } else if(constraint instanceof cp.SlideJoint){
                /*cpSlideJoint*/ var joint = /*(cpSlideJoint *)*/constraint;

                /*cpVect*/ var a = cp.v.add(body_a.p, cp.v.rotate(joint.anchr1, body_a.rot));
                /*cpVect*/ var b = cp.v.add(body_b.p, cp.v.rotate(joint.anchr2, body_b.rot));

                renderer.drawDot(4, a, CONSTRAINT_COLOR);
                renderer.drawDot(4, b, CONSTRAINT_COLOR);
                renderer.drawSegment(a, b, CONSTRAINT_COLOR);
            } else if(constraint instanceof cp.PivotJoint){
                /*cpPivotJoint*/ var joint = /*(cpPivotJoint *)*/constraint;

                /*cpVect*/ var a = cp.v.add(body_a.p, cp.v.rotate(joint.anchr1, body_a.rot));
                /*cpVect*/ var b = cp.v.add(body_b.p, cp.v.rotate(joint.anchr2, body_b.rot));

                renderer.drawDot(4, a, CONSTRAINT_COLOR);
                renderer.drawDot(4, b, CONSTRAINT_COLOR);
            } else if(constraint instanceof cp.GrooveJoint){
                /*cpGrooveJoint*/ var joint = /*(cpGrooveJoint *)*/constraint;

                /*cpVect*/ var a = cp.v.add(body_a.p, cp.v.rotate(joint.grv_a, body_a.rot));
                /*cpVect*/ var b = cp.v.add(body_a.p, cp.v.rotate(joint.grv_b, body_a.rot));
                /*cpVect*/ var c = cp.v.add(body_b.p, cp.v.rotate(joint.anchr2, body_b.rot));

                renderer.drawDot(4, c, CONSTRAINT_COLOR);
                renderer.drawSegment(a, b, CONSTRAINT_COLOR);
            } else if(constraint instanceof cp.DampedSpring){
                renderer.drawSpring(/*(cpDampedSpring *)*/constraint, body_a, body_b, CONSTRAINT_COLOR);
            }
        }

        ,drawCollisionPoints: function(/*cpSpace*/ space) {
            /*cpArray*/ var arbiters = this.currentDemo.space.arbiters;
            /*Color*/ var color = 'rgba(255, 0, 0, 1)';
            var renderer = this.renderer

            var segments = []
            for(var i= 0, arbLen = arbiters.length; i<arbLen; i++){
                /*cpArbiter*/ var arb = /*(cpArbiter*)*/arbiters[i];

                for(var j=0; j<arb.contacts.length; j++){
                    var con = arb.contacts[j]
                    /*cpVect*/ var p = con.p;
                    /*cpVect*/ var n = con.n;
                    /*cpFloat*/ var d = 2.0 - con.dist/2.0;

                    /*cpVect*/ var a = cp.v.add(p, cp.v.mult(n,  d));
                    /*cpVect*/ var b = cp.v.add(p, cp.v.mult(n, -d));
                    segments.push(a, b)
//                    renderer.drawSegment(a, b, color);
                }
            }

            renderer.drawSegments(segments, color)
        }

        ,drawMouse: function() {
            if (this.mouseJoint) {
                var color = 'rgba(255, 0, 0, 1)';
                this.renderer.drawCircle(this.mouse, 0, 1, color, color)
            }
        }

        ,drawInfo: function() {
            var max_arbiters = 0
            var max_points = 0
            var max_constraints = 0
            var currentSpace

            return function() {
                var space = this.currentDemo.space

                if (space != currentSpace) {
                    max_arbiters = 0
                    max_points = 0
                    max_constraints = 0
                    currentSpace = space
                }

                var arbiters = space.arbiters
                /*int*/ var points = 0;

                for(var i=0; i<arbiters.length; i++)
                    points += (/*cpArbiter*/(arbiters[i])).contacts.length;

                /*int*/ var constraints = (space.constraints.length + points)*space.iterations;

                max_arbiters = arbiters.length > max_arbiters ? arbiters.length : max_arbiters;
                max_points = points > max_points ? points : max_points;
                max_constraints = constraints > max_constraints ? constraints : max_constraints;

                /*char*/ var info =
                        "Arbiters: {0} ({1}) - " +
                        "Contact Points: {2} ({3})\n" +
                        "Other Constraints: {4}, Iterations: {5}\n" +
                        "Constraints x Iterations: {6} ({7})\n" +
                        "Time: {8} s, KE: {9}";

                /*cpArray*/ var bodies = space.bodies;
                /*cpFloat*/ var ke = 0.0;
                for(var i=0; i<bodies.length; i++){
                    /*cpBody*/ var body = /*cpBody*/bodies[i];
                    if(body.m == Infinity || body.i == Infinity) continue;

                    ke += body.m*cp.v.dot(body.v, body.v) + body.i*body.w*body.w;
                }

                var data = [
                    arbiters.length, max_arbiters,
                    points, max_points,
                    space.constraints.length, space.iterations,
                    constraints, max_constraints,
                    this.totalTime.toFixed(2), (ke < 1e-10 ? 0.0 : ke).toFixed(2)
                ]

                info = info.replace(/\{(\d)\}/g, function(m, m1) {
                    return data[m1]
                })

                this.renderer.drawString(cp.v(80, 220), info)

                if (this.currentDemo.messageString) {
                    this.renderer.drawString(cp.v(-300, -200), this.currentDemo.messageString);
                }
            }
        }()

        ,colorForShape: function(/*cpShape*/ shape) {
            if(shape.sensor){
//                return LAColor(1.0, 0.1);
                return 'rgba(0, 0, 0, .1)';
            } else {
                /*cpBody*/ var body = shape.body;

                if(body.isSleeping()){
//                    return LAColor(0.2, 1.0);
                    return 'rgba(50, 50, 50, 1)'
                } else if(body.nodeIdleTime > shape.space.sleepTimeThreshold) {
//                    return LAColor(0.66, 1.0);
                    return 'rgba(170, 170, 170, 1)'
                } else {
                    return colors[shape.hashid % colors.length];
                }
            }
        }

        ,rand: function() {
            return Math.floor(Math.random() * 2147483647)
        }

        ,format: function(/*str, params...*/) {
            var params = arguments
            str = Array.prototype.shift.call(params)

            return str.replace(/\{(\d+)\}/g, function(m, m1) {
                return params[m1]
            })
        }
    }

    Demo.Random = function(min, max) {
        if (!(max)) {
            max = min
            min = 0
        }

        return min + Math.random() * (max - min)
    }
    Demo.Random.int = function(min, max) {
        return Math.floor(Demo.random(min, max))
    }

    Demo.Random.sign = function(prob) {
        prob || (prob =.5)
        if (Math.random() < prob) {
            return 1
        } {
            return -1
        }
    }


    Demo.Random.bool = function(prob) {
        prob || (prob =.5)
        return Math.random() < prob
    }

    Demo.Random.item = function(list) {
        return list[ Math.floor(Math.random() * list.length) ]
    }

    global.Demo = Demo;
})(function() {
   return this;
}())