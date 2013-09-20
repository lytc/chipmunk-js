(function(global) {
    var Demo = global.Demo

    Demo.add({
        name: 'Springies'

        ,init: function() {
            /*cpSpace*/ var space = this.space
            /*cpBody*/ var staticBody = space.staticBody;

            /*cpBody*/ var body1  = add_bar(space, cp.v(-240,  160), cp.v(-160,   80), 1);
            /*cpBody*/ var body2  = add_bar(space, cp.v(-160,   80), cp.v( -80,  160), 1);
            /*cpBody*/ var body3  = add_bar(space, cp.v(   0,  160), cp.v(  80,    0), 0);
            /*cpBody*/ var body4  = add_bar(space, cp.v( 160,  160), cp.v( 240,  160), 0);
            /*cpBody*/ var body5  = add_bar(space, cp.v(-240,    0), cp.v(-160,  -80), 2);
            /*cpBody*/ var body6  = add_bar(space, cp.v(-160,  -80), cp.v( -80,    0), 2);
            /*cpBody*/ var body7  = add_bar(space, cp.v( -80,    0), cp.v(   0,    0), 2);
            /*cpBody*/ var body8  = add_bar(space, cp.v(   0,  -80), cp.v(  80,  -80), 0);
            /*cpBody*/ var body9  = add_bar(space, cp.v( 240,   80), cp.v( 160,    0), 3);
            /*cpBody*/ var body10 = add_bar(space, cp.v( 160,    0), cp.v( 240,  -80), 3);
            /*cpBody*/ var body11 = add_bar(space, cp.v(-240,  -80), cp.v(-160, -160), 4);
            /*cpBody*/ var body12 = add_bar(space, cp.v(-160, -160), cp.v( -80, -160), 4);
            /*cpBody*/ var body13 = add_bar(space, cp.v(   0, -160), cp.v(  80, -160), 0);
            /*cpBody*/ var body14 = add_bar(space, cp.v( 160, -160), cp.v( 240, -160), 0);

            space.addConstraint(new cp.PivotJoint( body1,  body2, cp.v( 40,-40), cp.v(-40,-40)));
            space.addConstraint(new cp.PivotJoint( body5,  body6, cp.v( 40,-40), cp.v(-40,-40)));
            space.addConstraint(new cp.PivotJoint( body6,  body7, cp.v( 40, 40), cp.v(-40,  0)));
            space.addConstraint(new cp.PivotJoint( body9, body10, cp.v(-40,-40), cp.v(-40, 40)));
            space.addConstraint(new cp.PivotJoint(body11, body12, cp.v( 40,-40), cp.v(-40,  0)));

            /*cpFloat*/ var stiff = 100.0;
            /*cpFloat*/ var damp = 0.5;
            space.addConstraint(new_spring(staticBody,  body1, cp.v(-320,  240), cp.v(-40, 40), 0.0, stiff, damp));
            space.addConstraint(new_spring(staticBody,  body1, cp.v(-320,   80), cp.v(-40, 40), 0.0, stiff, damp));
            space.addConstraint(new_spring(staticBody,  body1, cp.v(-160,  240), cp.v(-40, 40), 0.0, stiff, damp));

            space.addConstraint(new_spring(staticBody,  body2, cp.v(-160,  240), cp.v( 40, 40), 0.0, stiff, damp));
            space.addConstraint(new_spring(staticBody,  body2, cp.v(   0,  240), cp.v( 40, 40), 0.0, stiff, damp));

            space.addConstraint(new_spring(staticBody,  body3, cp.v(  80,  240), cp.v(-40, 80), 0.0, stiff, damp));

            space.addConstraint(new_spring(staticBody,  body4, cp.v(  80,  240), cp.v(-40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring(staticBody,  body4, cp.v( 320,  240), cp.v( 40,  0), 0.0, stiff, damp));

            space.addConstraint(new_spring(staticBody,  body5, cp.v(-320,   80), cp.v(-40, 40), 0.0, stiff, damp));

            space.addConstraint(new_spring(staticBody,  body9, cp.v( 320,  80), cp.v( 40, 40), 0.0, stiff, damp));

            space.addConstraint(new_spring(staticBody, body10, cp.v( 320,   0), cp.v( 40,-40), 0.0, stiff, damp));
            space.addConstraint(new_spring(staticBody, body10, cp.v( 320,-160), cp.v( 40,-40), 0.0, stiff, damp));

            space.addConstraint(new_spring(staticBody, body11, cp.v(-320,-160), cp.v(-40, 40), 0.0, stiff, damp));

            space.addConstraint(new_spring(staticBody, body12, cp.v(-240,-240), cp.v(-40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring(staticBody, body12, cp.v(   0,-240), cp.v( 40,  0), 0.0, stiff, damp));

            space.addConstraint(new_spring(staticBody, body13, cp.v(   0,-240), cp.v(-40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring(staticBody, body13, cp.v(  80,-240), cp.v( 40,  0), 0.0, stiff, damp));

            space.addConstraint(new_spring(staticBody, body14, cp.v(  80,-240), cp.v(-40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring(staticBody, body14, cp.v( 240,-240), cp.v( 40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring(staticBody, body14, cp.v( 320,-160), cp.v( 40,  0), 0.0, stiff, damp));

            space.addConstraint(new_spring( body1,  body5, cp.v( 40,-40), cp.v(-40, 40), 0.0, stiff, damp));
            space.addConstraint(new_spring( body1,  body6, cp.v( 40,-40), cp.v( 40, 40), 0.0, stiff, damp));
            space.addConstraint(new_spring( body2,  body3, cp.v( 40, 40), cp.v(-40, 80), 0.0, stiff, damp));
            space.addConstraint(new_spring( body3,  body4, cp.v(-40, 80), cp.v(-40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring( body3,  body4, cp.v( 40,-80), cp.v(-40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring( body3,  body7, cp.v( 40,-80), cp.v( 40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring( body3,  body7, cp.v(-40, 80), cp.v(-40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring( body3,  body8, cp.v( 40,-80), cp.v( 40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring( body3,  body9, cp.v( 40,-80), cp.v(-40,-40), 0.0, stiff, damp));
            space.addConstraint(new_spring( body4,  body9, cp.v( 40,  0), cp.v( 40, 40), 0.0, stiff, damp));
            space.addConstraint(new_spring( body5, body11, cp.v(-40, 40), cp.v(-40, 40), 0.0, stiff, damp));
            space.addConstraint(new_spring( body5, body11, cp.v( 40,-40), cp.v( 40,-40), 0.0, stiff, damp));
            space.addConstraint(new_spring( body7,  body8, cp.v( 40,  0), cp.v(-40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring( body8, body12, cp.v(-40,  0), cp.v( 40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring( body8, body13, cp.v(-40,  0), cp.v(-40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring( body8, body13, cp.v( 40,  0), cp.v( 40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring( body8, body14, cp.v( 40,  0), cp.v(-40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring(body10, body14, cp.v( 40,-40), cp.v(-40,  0), 0.0, stiff, damp));
            space.addConstraint(new_spring(body10, body14, cp.v( 40,-40), cp.v(-40,  0), 0.0, stiff, damp));

            return space;
        }
    })
    
    //static cpFloat
    var springForce = function(/*cpConstraint*/ spring, /*cpFloat*/ dist) {
        /*cpFloat*/ var clamp = 20.0;
        return cp.fclamp(spring.restLength - dist, -clamp, clamp)*spring.stiffness;
    }

//static cpConstraint *
    var new_spring = function(/*cpBody*/ a, /*cpBody*/ b, /*cpVect*/ anchr1, /*cpVect*/ anchr2, /*cpFloat*/ restLength, /*cpFloat*/ stiff, /*cpFloat*/ damp) {
        /*cpConstraint*/ var spring = new cp.DampedSpring(a, b, anchr1, anchr2, restLength, stiff, damp);
        spring.springForceFunc = springForce;

        return spring;
    }


//static cpBody *
    var add_bar = function(/*cpSpace*/ space, /*cpVect*/ a, /*cpVect*/ b, /*int*/ group) {
        /*cpVect*/ var center = cp.v.mult(cp.v.add(a, b), 1.0/2.0);
        /*cpFloat*/ var length = cp.v.len(cp.v.sub(b, a));
        /*cpFloat*/ var mass = length/160.0;

        /*cpBody*/ var body = space.addBody(new cp.Body(mass, mass*length*length/12.0));
        body.setPos(center);

        /*cpShape*/ var shape = space.addShape(new cp.SegmentShape(body, cp.v.sub(a, center), cp.v.sub(b, center), 10.0));
        shape.group = group;

        return body;
    }
})(this)