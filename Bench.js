var NDEBUG = true;
var cp = require('./cp.min.js');
var mersenne = require('mersenne');
mersenne.seed(4711);
var r = new mersenne.MersenneTwister19937;
r.init_genrand((new Date).getTime() % 1000000000);

var cpv = cp.v;
var cpvadd = cp.v.add;
var cpvlengthsq = cp.v.lengthsq;
var cpvmult = cp.v.mult;
var cpvzero = cp.vzero;
var Space = cp.Space;
var Body = cp.Body;
var CircleShape = cp.CircleShape;
var SegmentShape = cp.SegmentShape;
var PolyShape2 = cp.PolyShape2;
var cpMomentForCircle = cp.momentForCircle;
var cpMomentForPoly = cp.momentForPoly;
var cpMomentForBox = cp.momentForBox;
var BoxShape = cp.BoxShape;
var M_PI = Math.PI;
var cpflerp = cp.flerp;
var cpfpow = cp.fpow;

var BENCH_SPACE_NEW = function() {
    return new Space()
}
var BENCH_SPACE_STEP = function(space, dt) {
    space.step(dt)
}

/*cpFloat*/ var bevel = 0.0;

//static inline cpVect
var frand_unit_circle = function(){
    /*cpVect*/ var v = cpv(r.genrand_real2()*2.0 - 1.0, r.genrand_real2()*2.0 - 1.0);
    return (cpvlengthsq(v) < 1.0 ? v : frand_unit_circle());
}

//static cpVect 
var simple_terrain_verts = [
	cpv(350.00, 425.07), cpv(336.00, 436.55), cpv(272.00, 435.39), cpv(258.00, 427.63), cpv(225.28, 420.00), cpv(202.82, 396.00),
	cpv(191.81, 388.00), cpv(189.00, 381.89), cpv(173.00, 380.39), cpv(162.59, 368.00), cpv(150.47, 319.00), cpv(128.00, 311.55),
	cpv(119.14, 286.00), cpv(126.84, 263.00), cpv(120.56, 227.00), cpv(141.14, 178.00), cpv(137.52, 162.00), cpv(146.51, 142.00),
	cpv(156.23, 136.00), cpv(158.00, 118.27), cpv(170.00, 100.77), cpv(208.43,  84.00), cpv(224.00,  69.65), cpv(249.30,  68.00),
	cpv(257.00,  54.77), cpv(363.00,  45.94), cpv(374.15,  54.00), cpv(386.00,  69.60), cpv(413.00,  70.73), cpv(456.00,  84.89),
	cpv(468.09,  99.00), cpv(467.09, 123.00), cpv(464.92, 135.00), cpv(469.00, 141.03), cpv(497.00, 148.67), cpv(513.85, 180.00),
	cpv(509.56, 223.00), cpv(523.51, 247.00), cpv(523.00, 277.00), cpv(497.79, 311.00), cpv(478.67, 348.00), cpv(467.90, 360.00),
	cpv(456.76, 382.00), cpv(432.95, 389.00), cpv(417.00, 411.32), cpv(373.00, 433.19), cpv(361.00, 430.02), cpv(350.00, 425.07)
];
/*int*/ var simple_terrain_count = simple_terrain_verts.length;

//cpBody bodies[1000] = {};
//cpCircleShape circles[1000] = {};

//void
var add_circle = function(/*cpSpace*/ space, /*int*/ index, /*cpFloat*/ radius) {
	/*cpFloat*/ var mass = radius*radius/25.0;
	/*cpBody*/ var body = space.addBody(new Body(mass, cpMomentForCircle(mass, 0.0, radius, cpvzero)));
//	/*cpBody*/ var body = space.addBody(cpBodyInit(&bodies[i], mass, cpMomentForCircle(mass, 0.0, radius, cpvzero)));
	body.p = cpvmult(frand_unit_circle(), 180.0);
	
	
	/*cpShape*/ var shape = space.addShape(new CircleShape(body, radius, cpvzero));
//	/*cpShape*/ var shape = space.addShape(cpCircleShapeInit(&circles[i], body, radius, cpvzero));
	shape.e = 0.0; shape.u = 0.9;
}

//void
var add_box = function(/*cpSpace*/ space, /*int*/ index, /*cpFloat*/ size) {
	/*cpFloat*/ var mass = size*size/100.0;
	/*cpBody*/ var body = space.addBody(new Body(mass, cpMomentForBox(mass, size, size)));
//	/*cpBody*/ var body = space.addBody(cpBodyInit(&bodies[i], mass, cpMomentForBox(mass, size, size)));
	body.p = cpvmult(frand_unit_circle(), 180.0);
	
	
	/*cpShape*/ var shape = space.addShape(new BoxShape(body, size - bevel*2, size - bevel*2));
	shape.setRadius(bevel);
	shape.e = 0.0; shape.u = 0.9;
}

//void
var add_hexagon = function(/*cpSpace*/ space, /*int*/ index, /*cpFloat*/ radius) {
	/*cpVect*/ var hexagon = [];
	for(var i=0; i<6; i++){
		/*cpFloat*/ var angle = -M_PI*2.0*i/6.0;
		hexagon[i] = cpvmult(cpv(Math.cos(angle), Math.sin(angle)), radius - bevel);
	}
	
	/*cpFloat*/ var mass = radius*radius;
	/*cpBody*/ var body = space.addBody(new Body(mass, cpMomentForPoly(mass, hexagon, cpvzero)));
	body.p = cpvmult(frand_unit_circle(), 180.0);
	
	/*cpShape*/ var shape = space.addShape(new PolyShape2(body, hexagon, cpvzero, bevel));
	shape.e = 0.0; shape.u = 0.9;
}


//static cpSpace *
var SetupSpace_simpleTerrain = function(/**/ ) {
	/*cpSpace*/ var space = BENCH_SPACE_NEW();
	space.iterations = 10;
	space.gravity = cpv(0, -100);
	space.collisionSlop = 0.5;
	
	/*cpVect*/ var offset = cpv(-320, -240);
	for(var i=0; i<(simple_terrain_count - 1); i++){
		/*cpVect*/ var a = simple_terrain_verts[i], b = simple_terrain_verts[i+1];
		space.addShape(new SegmentShape(space.staticBody, cpvadd(a, offset), cpvadd(b, offset), 0.0));
	}
	
	return space;
}


var init = {}

// SimpleTerrain constant sized objects
//static cpSpace 
init['SimpleTerrainCircles_1000'] = function(){
	/*cpSpace*/ var space = SetupSpace_simpleTerrain();
	for(var i=0; i<1000; i++) add_circle(space, i, 5.0);
	
	return space;
}

//static cpSpace 
init['SimpleTerrainCircles_500'] = function(){
	/*cpSpace*/ var space = SetupSpace_simpleTerrain();
	for(var i=0; i<500; i++) add_circle(space, i, 5.0);
	
	return space;
}

//static cpSpace 
init['SimpleTerrainCircles_100'] = function(){
	/*cpSpace*/ var space = SetupSpace_simpleTerrain();
	for(var i=0; i<100; i++) add_circle(space, i, 5.0);
	
	return space;
}

//static cpSpace
init['SimpleTerrainBoxes_1000'] = function(){
	/*cpSpace*/ var space = SetupSpace_simpleTerrain();
	for(var i=0; i<1000; i++) add_box(space, i, 10.0);
	
	return space;
}

//static cpSpace 
init['SimpleTerrainBoxes_500'] = function(){
	/*cpSpace*/ var space = SetupSpace_simpleTerrain();
	for(var i=0; i<500; i++) add_box(space, i, 10.0);
	
	return space;
}

//static cpSpace 
init['SimpleTerrainBoxes_100'] = function(){
	/*cpSpace*/ var space = SetupSpace_simpleTerrain();
	for(var i=0; i<100; i++) add_box(space, i, 10.0);
	
	return space;
}

//static cpSpace 
init['SimpleTerrainHexagons_1000'] = function(){
	/*cpSpace*/ var space = SetupSpace_simpleTerrain();
	for(var i=0; i<1000; i++) add_hexagon(space, i, 5.0);
	
	return space;
}

//static cpSpace 
init['SimpleTerrainHexagons_500'] = function(){
	/*cpSpace*/ var space = SetupSpace_simpleTerrain();
	for(var i=0; i<500; i++) add_hexagon(space, i, 5.0);
	
	return space;
}

//static cpSpace 
init['SimpleTerrainHexagons_100'] = function(){
	/*cpSpace*/ var space = SetupSpace_simpleTerrain();
	for(var i=0; i<100; i++) add_hexagon(space, i, 5.0);
	
	return space;
}


// SimpleTerrain variable sized objects
//cpFloat
var rand_size = function(/**/ ) {
	return cpfpow(1.5, cpflerp(-1.5, 3.5, r.genrand_real2()));
}

//static cpSpace 
init['SimpleTerrainVCircles_200'] = function(){
	/*cpSpace*/ var space = SetupSpace_simpleTerrain();
	for(var i=0; i<200; i++) add_circle(space, i, 5.0*rand_size());
	
	return space;
}

//static cpSpace 
init['SimpleTerrainVBoxes_200'] = function(){
	/*cpSpace*/ var space = SetupSpace_simpleTerrain();
	for(var i=0; i<200; i++) add_box(space, i, 8.0*rand_size());
	
	return space;
}

//static cpSpace 
init['SimpleTerrainVHexagons_200'] = function(){
	/*cpSpace*/ var space = SetupSpace_simpleTerrain();
	for(var i=0; i<200; i++) add_hexagon(space, i, 5.0*rand_size());
	
	return space;
}


// ComplexTerrain
//static cpVect 
var complex_terrain_verts = [
	cpv( 46.78, 479.00), cpv( 35.00, 475.63), cpv( 27.52, 469.00), cpv( 23.52, 455.00), cpv( 23.78, 441.00), cpv( 28.41, 428.00), cpv( 49.61, 394.00), cpv( 59.00, 381.56), cpv( 80.00, 366.03), cpv( 81.46, 358.00), cpv( 86.31, 350.00), cpv( 77.74, 320.00),
	cpv( 70.26, 278.00), cpv( 67.51, 270.00), cpv( 58.86, 260.00), cpv( 57.19, 247.00), cpv( 38.00, 235.60), cpv( 25.76, 221.00), cpv( 24.58, 209.00), cpv( 27.63, 202.00), cpv( 31.28, 198.00), cpv( 40.00, 193.72), cpv( 48.00, 193.73), cpv( 55.00, 196.70),
	cpv( 62.10, 204.00), cpv( 71.00, 209.04), cpv( 79.00, 206.55), cpv( 88.00, 206.81), cpv( 95.88, 211.00), cpv(103.00, 220.49), cpv(131.00, 220.51), cpv(137.00, 222.66), cpv(143.08, 228.00), cpv(146.22, 234.00), cpv(147.08, 241.00), cpv(145.45, 248.00),
	cpv(142.31, 253.00), cpv(132.00, 259.30), cpv(115.00, 259.70), cpv(109.28, 270.00), cpv(112.91, 296.00), cpv(119.69, 324.00), cpv(129.00, 336.26), cpv(141.00, 337.59), cpv(153.00, 331.57), cpv(175.00, 325.74), cpv(188.00, 325.19), cpv(235.00, 317.46),
	cpv(250.00, 317.19), cpv(255.00, 309.12), cpv(262.62, 302.00), cpv(262.21, 295.00), cpv(248.00, 273.59), cpv(229.00, 257.93), cpv(221.00, 255.48), cpv(215.00, 251.59), cpv(210.79, 246.00), cpv(207.47, 234.00), cpv(203.25, 227.00), cpv(179.00, 205.90),
	cpv(148.00, 189.54), cpv(136.00, 181.45), cpv(120.00, 180.31), cpv(110.00, 181.65), cpv( 95.00, 179.31), cpv( 63.00, 166.96), cpv( 50.00, 164.23), cpv( 31.00, 154.49), cpv( 19.76, 145.00), cpv( 15.96, 136.00), cpv( 16.65, 127.00), cpv( 20.57, 120.00),
	cpv( 28.00, 114.63), cpv( 40.00, 113.67), cpv( 65.00, 127.22), cpv( 73.00, 128.69), cpv( 81.96, 120.00), cpv( 77.58, 103.00), cpv( 78.18,  92.00), cpv( 59.11,  77.00), cpv( 52.00,  67.29), cpv( 31.29,  55.00), cpv( 25.67,  47.00), cpv( 24.65,  37.00),
	cpv( 27.82,  29.00), cpv( 35.00,  22.55), cpv( 44.00,  20.35), cpv( 49.00,  20.81), cpv( 61.00,  25.69), cpv( 79.00,  37.81), cpv( 88.00,  49.64), cpv( 97.00,  56.65), cpv(109.00,  49.61), cpv(143.00,  38.96), cpv(197.00,  37.27), cpv(215.00,  35.30),
	cpv(222.00,  36.65), cpv(228.42,  41.00), cpv(233.30,  49.00), cpv(234.14,  57.00), cpv(231.00,  65.80), cpv(224.00,  72.38), cpv(218.00,  74.50), cpv(197.00,  76.62), cpv(145.00,  78.81), cpv(123.00,  87.41), cpv(117.59,  98.00), cpv(117.79, 104.00),
	cpv(119.00, 106.23), cpv(138.73, 120.00), cpv(148.00, 129.50), cpv(158.50, 149.00), cpv(203.93, 175.00), cpv(229.00, 196.60), cpv(238.16, 208.00), cpv(245.20, 221.00), cpv(275.45, 245.00), cpv(289.00, 263.24), cpv(303.60, 287.00), cpv(312.00, 291.57),
	cpv(339.25, 266.00), cpv(366.33, 226.00), cpv(363.43, 216.00), cpv(364.13, 206.00), cpv(353.00, 196.72), cpv(324.00, 181.05), cpv(307.00, 169.63), cpv(274.93, 156.00), cpv(256.00, 152.48), cpv(228.00, 145.13), cpv(221.09, 142.00), cpv(214.87, 135.00),
	cpv(212.67, 127.00), cpv(213.81, 119.00), cpv(219.32, 111.00), cpv(228.00, 106.52), cpv(236.00, 106.39), cpv(290.00, 119.40), cpv(299.33, 114.00), cpv(300.52, 109.00), cpv(300.30,  53.00), cpv(301.46,  47.00), cpv(305.00,  41.12), cpv(311.00,  36.37),
	cpv(317.00,  34.43), cpv(325.00,  34.81), cpv(334.90,  41.00), cpv(339.45,  50.00), cpv(339.82, 132.00), cpv(346.09, 139.00), cpv(350.00, 150.26), cpv(380.00, 167.38), cpv(393.00, 166.48), cpv(407.00, 155.54), cpv(430.00, 147.30), cpv(437.78, 135.00),
	cpv(433.13, 122.00), cpv(410.23,  78.00), cpv(401.59,  69.00), cpv(393.48,  56.00), cpv(392.80,  44.00), cpv(395.50,  38.00), cpv(401.00,  32.49), cpv(409.00,  29.41), cpv(420.00,  30.84), cpv(426.92,  36.00), cpv(432.32,  44.00), cpv(439.49,  51.00),
	cpv(470.13, 108.00), cpv(475.71, 124.00), cpv(483.00, 130.11), cpv(488.00, 139.43), cpv(529.00, 139.40), cpv(536.00, 132.52), cpv(543.73, 129.00), cpv(540.47, 115.00), cpv(541.11, 100.00), cpv(552.18,  68.00), cpv(553.78,  47.00), cpv(559.00,  39.76),
	cpv(567.00,  35.52), cpv(577.00,  35.45), cpv(585.00,  39.58), cpv(591.38,  50.00), cpv(591.67,  66.00), cpv(590.31,  79.00), cpv(579.76, 109.00), cpv(582.25, 119.00), cpv(583.66, 136.00), cpv(586.45, 143.00), cpv(586.44, 151.00), cpv(580.42, 168.00),
	cpv(577.15, 173.00), cpv(572.00, 177.13), cpv(564.00, 179.49), cpv(478.00, 178.81), cpv(443.00, 184.76), cpv(427.10, 190.00), cpv(424.00, 192.11), cpv(415.94, 209.00), cpv(408.82, 228.00), cpv(405.82, 241.00), cpv(411.00, 250.82), cpv(415.00, 251.50),
	cpv(428.00, 248.89), cpv(469.00, 246.29), cpv(505.00, 246.49), cpv(533.00, 243.60), cpv(541.87, 248.00), cpv(547.55, 256.00), cpv(548.48, 267.00), cpv(544.00, 276.00), cpv(534.00, 282.24), cpv(513.00, 285.46), cpv(468.00, 285.76), cpv(402.00, 291.70),
	cpv(392.00, 290.29), cpv(377.00, 294.46), cpv(367.00, 294.43), cpv(356.44, 304.00), cpv(354.22, 311.00), cpv(362.00, 321.36), cpv(390.00, 322.44), cpv(433.00, 330.16), cpv(467.00, 332.76), cpv(508.00, 347.64), cpv(522.00, 357.67), cpv(528.00, 354.46),
	cpv(536.00, 352.96), cpv(546.06, 336.00), cpv(553.47, 306.00), cpv(564.19, 282.00), cpv(567.84, 268.00), cpv(578.72, 246.00), cpv(585.00, 240.97), cpv(592.00, 238.91), cpv(600.00, 239.72), cpv(606.00, 242.82), cpv(612.36, 251.00), cpv(613.35, 263.00),
	cpv(588.75, 324.00), cpv(583.25, 350.00), cpv(572.12, 370.00), cpv(575.45, 378.00), cpv(575.20, 388.00), cpv(589.00, 393.81), cpv(599.20, 404.00), cpv(607.14, 416.00), cpv(609.96, 430.00), cpv(615.45, 441.00), cpv(613.44, 462.00), cpv(610.48, 469.00),
	cpv(603.00, 475.63), cpv(590.96, 479.00)
];
/*int*/ var complex_terrain_count = complex_terrain_verts.length;

//static cpSpace 
init['ComplexTerrainCircles_1000'] = function(){
	/*cpSpace*/ var space = BENCH_SPACE_NEW();
	space.iterations = 10;
	space.gravity = cpv(0, -100);
	space.collisionSlop = 0.5;
	
	/*cpVect*/ var offset = cpv(-320, -240);
	for(var i=0; i<(complex_terrain_count - 1); i++){
		/*cpVect*/ var a = complex_terrain_verts[i], b = complex_terrain_verts[i+1];
		space.addShape(new SegmentShape(space.staticBody, cpvadd(a, offset), cpvadd(b, offset), 0.0));
	}
	
	for(var i=0; i<1000; i++){
		/*cpFloat*/ var radius = 5.0;
		/*cpFloat*/ var mass = radius*radius;
		/*cpBody*/ var body = space.addBody(new Body(mass, cpMomentForCircle(mass, 0.0, radius, cpvzero)));
		body.p = cpvadd(cpvmult(frand_unit_circle(), 180.0), cpv(0.0, 300.0));
		
		/*cpShape*/ var shape = space.addShape(new CircleShape(body, radius, cpvzero));
		shape.e = 0.0; shape.u = 0.0;
	}
	
	return space;
}

//static cpSpace 
init['ComplexTerrainHexagons_1000'] = function(){
	/*cpSpace*/ var space = BENCH_SPACE_NEW();
	space.iterations = 10;
	space.gravity = cpv(0, -100);
	space.collisionSlop = 0.5;
	
	/*cpVect*/ var offset = cpv(-320, -240);
	for(var i=0; i<(complex_terrain_count - 1); i++){
		/*cpVect*/ var a = complex_terrain_verts[i], b = complex_terrain_verts[i+1];
		space.addShape(new SegmentShape(space.staticBody, cpvadd(a, offset), cpvadd(b, offset), 0.0));
	}
	
	/*cpFloat*/ var radius = 5.0;
	/*cpVect*/ var hexagon = [];
	for(var i=0; i<6; i++){
		/*cpFloat*/ var angle = -M_PI*2.0*i/6.0;
		hexagon[i] = cpvmult(cpv(Math.cos(angle), Math.sin(angle)), radius - bevel);
	}
	
	for(var i=0; i<1000; i++){
		/*cpFloat*/ var mass = radius*radius;
		/*cpBody*/ var body = space.addBody(new Body(mass, cpMomentForPoly(mass, hexagon, cpvzero)));
		body.p = cpvadd(cpvmult(frand_unit_circle(), 180.0), cpv(0.0, 300.0));
		
		/*cpShape*/ var shape = space.addShape(new PolyShape2(body, hexagon, cpvzero, bevel));
		shape.e = 0.0; shape.u = 0.0;
	}
	
	return space;
}


// BouncyTerrain
//static cpVect 
var bouncy_terrain_verts = [
	cpv(537.18,  23.00), cpv(520.50,  36.00), cpv(501.53,  63.00), cpv(496.14,  76.00), cpv(498.86,  86.00), cpv(504.00,  90.51), cpv(508.00,  91.36), cpv(508.77,  84.00), cpv(513.00,  77.73), cpv(519.00,  74.48), cpv(530.00,  74.67), cpv(545.00,  54.65),
	cpv(554.00,  48.77), cpv(562.00,  46.39), cpv(568.00,  45.94), cpv(568.61,  47.00), cpv(567.94,  55.00), cpv(571.27,  64.00), cpv(572.92,  80.00), cpv(572.00,  81.39), cpv(563.00,  79.93), cpv(556.00,  82.69), cpv(551.49,  88.00), cpv(549.00,  95.76),
	cpv(538.00,  93.40), cpv(530.00, 102.38), cpv(523.00, 104.00), cpv(517.00, 103.02), cpv(516.22, 109.00), cpv(518.96, 116.00), cpv(526.00, 121.15), cpv(534.00, 116.48), cpv(543.00, 116.77), cpv(549.28, 121.00), cpv(554.00, 130.17), cpv(564.00, 125.67),
	cpv(575.60, 129.00), cpv(573.31, 121.00), cpv(567.77, 111.00), cpv(575.00, 106.47), cpv(578.51, 102.00), cpv(580.25,  95.00), cpv(577.98,  87.00), cpv(582.00,  85.71), cpv(597.00,  89.46), cpv(604.80,  95.00), cpv(609.28, 104.00), cpv(610.55, 116.00),
	cpv(609.30, 125.00), cpv(600.80, 142.00), cpv(597.31, 155.00), cpv(584.00, 167.23), cpv(577.86, 175.00), cpv(583.52, 184.00), cpv(582.64, 195.00), cpv(591.00, 196.56), cpv(597.81, 201.00), cpv(607.45, 219.00), cpv(607.51, 246.00), cpv(600.00, 275.46),
	cpv(588.00, 267.81), cpv(579.00, 264.91), cpv(557.00, 264.41), cpv(552.98, 259.00), cpv(548.00, 246.18), cpv(558.00, 247.12), cpv(565.98, 244.00), cpv(571.10, 237.00), cpv(571.61, 229.00), cpv(568.25, 222.00), cpv(562.00, 217.67), cpv(544.00, 213.93),
	cpv(536.73, 214.00), cpv(535.60, 204.00), cpv(539.69, 181.00), cpv(542.84, 171.00), cpv(550.43, 161.00), cpv(540.00, 156.27), cpv(536.62, 152.00), cpv(534.70, 146.00), cpv(527.00, 141.88), cpv(518.59, 152.00), cpv(514.51, 160.00), cpv(510.33, 175.00),
	cpv(519.38, 183.00), cpv(520.52, 194.00), cpv(516.00, 201.27), cpv(505.25, 206.00), cpv(507.57, 223.00), cpv(519.90, 260.00), cpv(529.00, 260.48), cpv(534.00, 262.94), cpv(538.38, 268.00), cpv(540.00, 275.00), cpv(537.06, 284.00), cpv(530.00, 289.23),
	cpv(520.00, 289.23), cpv(513.00, 284.18), cpv(509.71, 286.00), cpv(501.69, 298.00), cpv(501.56, 305.00), cpv(504.30, 311.00), cpv(512.00, 316.43), cpv(521.00, 316.42), cpv(525.67, 314.00), cpv(535.00, 304.98), cpv(562.00, 294.80), cpv(573.00, 294.81),
	cpv(587.52, 304.00), cpv(600.89, 310.00), cpv(596.96, 322.00), cpv(603.28, 327.00), cpv(606.52, 333.00), cpv(605.38, 344.00), cpv(597.65, 352.00), cpv(606.36, 375.00), cpv(607.16, 384.00), cpv(603.40, 393.00), cpv(597.00, 398.14), cpv(577.00, 386.15),
	cpv(564.35, 373.00), cpv(565.21, 364.00), cpv(562.81, 350.00), cpv(553.00, 346.06), cpv(547.48, 338.00), cpv(547.48, 330.00), cpv(550.00, 323.30), cpv(544.00, 321.53), cpv(537.00, 322.70), cpv(532.00, 326.23), cpv(528.89, 331.00), cpv(527.83, 338.00),
	cpv(533.02, 356.00), cpv(542.00, 360.73), cpv(546.68, 369.00), cpv(545.38, 379.00), cpv(537.58, 386.00), cpv(537.63, 388.00), cpv(555.00, 407.47), cpv(563.00, 413.52), cpv(572.57, 418.00), cpv(582.72, 426.00), cpv(578.00, 431.12), cpv(563.21, 440.00),
	cpv(558.00, 449.27), cpv(549.00, 452.94), cpv(541.00, 451.38), cpv(536.73, 448.00), cpv(533.00, 441.87), cpv(520.00, 437.96), cpv(514.00, 429.69), cpv(490.00, 415.15), cpv(472.89, 399.00), cpv(472.03, 398.00), cpv(474.00, 396.71), cpv(486.00, 393.61),
	cpv(492.00, 385.85), cpv(492.00, 376.15), cpv(489.04, 371.00), cpv(485.00, 368.11), cpv(480.00, 376.27), cpv(472.00, 379.82), cpv(463.00, 378.38), cpv(455.08, 372.00), cpv(446.00, 377.69), cpv(439.00, 385.24), cpv(436.61, 391.00), cpv(437.52, 404.00),
	cpv(440.00, 409.53), cpv(463.53, 433.00), cpv(473.80, 441.00), cpv(455.00, 440.30), cpv(443.00, 436.18), cpv(436.00, 431.98), cpv(412.00, 440.92), cpv(397.00, 442.46), cpv(393.59, 431.00), cpv(393.71, 412.00), cpv(400.00, 395.10), cpv(407.32, 387.00),
	cpv(408.54, 380.00), cpv(407.42, 375.00), cpv(403.97, 370.00), cpv(399.00, 366.74), cpv(393.00, 365.68), cpv(391.23, 374.00), cpv(387.00, 380.27), cpv(381.00, 383.52), cpv(371.56, 384.00), cpv(364.98, 401.00), cpv(362.96, 412.00), cpv(363.63, 435.00),
	cpv(345.00, 433.55), cpv(344.52, 442.00), cpv(342.06, 447.00), cpv(337.00, 451.38), cpv(330.00, 453.00), cpv(325.00, 452.23), cpv(318.00, 448.17), cpv(298.00, 453.70), cpv(284.00, 451.49), cpv(278.62, 449.00), cpv(291.47, 408.00), cpv(291.77, 398.00),
	cpv(301.00, 393.83), cpv(305.00, 393.84), cpv(305.60, 403.00), cpv(310.00, 409.47), cpv(318.00, 413.07), cpv(325.00, 412.40), cpv(332.31, 407.00), cpv(335.07, 400.00), cpv(334.40, 393.00), cpv(329.00, 385.69), cpv(319.00, 382.79), cpv(301.00, 389.23),
	cpv(289.00, 389.97), cpv(265.00, 389.82), cpv(251.00, 385.85), cpv(245.00, 389.23), cpv(239.00, 389.94), cpv(233.00, 388.38), cpv(226.00, 382.04), cpv(206.00, 374.75), cpv(206.00, 394.00), cpv(204.27, 402.00), cpv(197.00, 401.79), cpv(191.00, 403.49),
	cpv(186.53, 407.00), cpv(183.60, 412.00), cpv(183.60, 422.00), cpv(189.00, 429.31), cpv(196.00, 432.07), cpv(203.00, 431.40), cpv(209.47, 427.00), cpv(213.00, 419.72), cpv(220.00, 420.21), cpv(227.00, 418.32), cpv(242.00, 408.41), cpv(258.98, 409.00),
	cpv(250.00, 435.43), cpv(239.00, 438.78), cpv(223.00, 448.19), cpv(209.00, 449.70), cpv(205.28, 456.00), cpv(199.00, 460.23), cpv(190.00, 460.52), cpv(182.73, 456.00), cpv(178.00, 446.27), cpv(160.00, 441.42), cpv(148.35, 435.00), cpv(149.79, 418.00),
	cpv(157.72, 401.00), cpv(161.00, 396.53), cpv(177.00, 385.00), cpv(180.14, 380.00), cpv(181.11, 374.00), cpv(180.00, 370.52), cpv(170.00, 371.68), cpv(162.72, 368.00), cpv(158.48, 361.00), cpv(159.56, 349.00), cpv(154.00, 342.53), cpv(146.00, 339.85),
	cpv(136.09, 343.00), cpv(130.64, 351.00), cpv(131.74, 362.00), cpv(140.61, 374.00), cpv(130.68, 387.00), cpv(120.75, 409.00), cpv(118.09, 421.00), cpv(117.92, 434.00), cpv(100.00, 432.40), cpv( 87.00, 427.48), cpv( 81.59, 423.00), cpv( 73.64, 409.00),
	cpv( 72.57, 398.00), cpv( 74.62, 386.00), cpv( 78.80, 378.00), cpv( 88.00, 373.43), cpv( 92.49, 367.00), cpv( 93.32, 360.00), cpv( 91.30, 353.00), cpv(103.00, 342.67), cpv(109.00, 343.10), cpv(116.00, 340.44), cpv(127.33, 330.00), cpv(143.00, 327.24),
	cpv(154.30, 322.00), cpv(145.00, 318.06), cpv(139.77, 311.00), cpv(139.48, 302.00), cpv(144.95, 293.00), cpv(143.00, 291.56), cpv(134.00, 298.21), cpv(118.00, 300.75), cpv(109.40, 305.00), cpv( 94.67, 319.00), cpv( 88.00, 318.93), cpv( 81.00, 321.69),
	cpv( 67.24, 333.00), cpv( 56.68, 345.00), cpv( 53.00, 351.40), cpv( 47.34, 333.00), cpv( 50.71, 314.00), cpv( 56.57, 302.00), cpv( 68.00, 287.96), cpv( 91.00, 287.24), cpv(110.00, 282.36), cpv(133.80, 271.00), cpv(147.34, 256.00), cpv(156.47, 251.00),
	cpv(157.26, 250.00), cpv(154.18, 242.00), cpv(154.48, 236.00), cpv(158.72, 229.00), cpv(166.71, 224.00), cpv(170.15, 206.00), cpv(170.19, 196.00), cpv(167.24, 188.00), cpv(160.00, 182.67), cpv(150.00, 182.66), cpv(143.60, 187.00), cpv(139.96, 195.00),
	cpv(139.50, 207.00), cpv(136.45, 221.00), cpv(136.52, 232.00), cpv(133.28, 238.00), cpv(129.00, 241.38), cpv(119.00, 243.07), cpv(115.00, 246.55), cpv(101.00, 253.16), cpv( 86.00, 257.32), cpv( 63.00, 259.24), cpv( 57.00, 257.31), cpv( 50.54, 252.00),
	cpv( 47.59, 247.00), cpv( 46.30, 240.00), cpv( 47.58, 226.00), cpv( 50.00, 220.57), cpv( 58.00, 226.41), cpv( 69.00, 229.17), cpv( 79.00, 229.08), cpv( 94.50, 225.00), cpv(100.21, 231.00), cpv(107.00, 233.47), cpv(107.48, 224.00), cpv(109.94, 219.00),
	cpv(115.00, 214.62), cpv(122.57, 212.00), cpv(116.00, 201.49), cpv(104.00, 194.57), cpv( 90.00, 194.04), cpv( 79.00, 198.21), cpv( 73.00, 198.87), cpv( 62.68, 191.00), cpv( 62.58, 184.00), cpv( 64.42, 179.00), cpv( 75.00, 167.70), cpv( 80.39, 157.00),
	cpv( 68.79, 140.00), cpv( 61.67, 126.00), cpv( 61.47, 117.00), cpv( 64.43, 109.00), cpv( 63.10,  96.00), cpv( 56.48,  82.00), cpv( 48.00,  73.88), cpv( 43.81,  66.00), cpv( 43.81,  56.00), cpv( 50.11,  46.00), cpv( 59.00,  41.55), cpv( 71.00,  42.64),
	cpv( 78.00,  36.77), cpv( 83.00,  34.75), cpv( 99.00,  34.32), cpv(117.00,  38.92), cpv(133.00,  55.15), cpv(142.00,  50.70), cpv(149.74,  51.00), cpv(143.55,  68.00), cpv(153.28,  74.00), cpv(156.23,  79.00), cpv(157.00,  84.00), cpv(156.23,  89.00),
	cpv(153.28,  94.00), cpv(144.58,  99.00), cpv(151.52, 112.00), cpv(151.51, 124.00), cpv(150.00, 126.36), cpv(133.00, 130.25), cpv(126.71, 125.00), cpv(122.00, 117.25), cpv(114.00, 116.23), cpv(107.73, 112.00), cpv(104.48, 106.00), cpv(104.32,  99.00),
	cpv(106.94,  93.00), cpv(111.24,  89.00), cpv(111.60,  85.00), cpv(107.24,  73.00), cpv(102.00,  67.57), cpv( 99.79,  67.00), cpv( 99.23,  76.00), cpv( 95.00,  82.27), cpv( 89.00,  85.52), cpv( 79.84,  86.00), cpv( 86.73, 114.00), cpv( 98.00, 136.73),
	cpv( 99.00, 137.61), cpv(109.00, 135.06), cpv(117.00, 137.94), cpv(122.52, 146.00), cpv(122.94, 151.00), cpv(121.00, 158.58), cpv(134.00, 160.97), cpv(153.00, 157.45), cpv(171.30, 150.00), cpv(169.06, 142.00), cpv(169.77, 136.00), cpv(174.00, 129.73),
	cpv(181.46, 126.00), cpv(182.22, 120.00), cpv(182.20, 111.00), cpv(180.06, 101.00), cpv(171.28,  85.00), cpv(171.75,  80.00), cpv(182.30,  53.00), cpv(189.47,  50.00), cpv(190.62,  38.00), cpv(194.00,  33.73), cpv(199.00,  30.77), cpv(208.00,  30.48),
	cpv(216.00,  34.94), cpv(224.00,  31.47), cpv(240.00,  30.37), cpv(247.00,  32.51), cpv(249.77,  35.00), cpv(234.75,  53.00), cpv(213.81,  93.00), cpv(212.08,  99.00), cpv(213.00, 101.77), cpv(220.00,  96.77), cpv(229.00,  96.48), cpv(236.28, 101.00),
	cpv(240.00, 107.96), cpv(245.08, 101.00), cpv(263.00,  65.32), cpv(277.47,  48.00), cpv(284.00,  47.03), cpv(286.94,  41.00), cpv(292.00,  36.62), cpv(298.00,  35.06), cpv(304.00,  35.77), cpv(314.00,  43.81), cpv(342.00,  32.56), cpv(359.00,  31.32),
	cpv(365.00,  32.57), cpv(371.00,  36.38), cpv(379.53,  48.00), cpv(379.70,  51.00), cpv(356.00,  52.19), cpv(347.00,  54.74), cpv(344.38,  66.00), cpv(341.00,  70.27), cpv(335.00,  73.52), cpv(324.00,  72.38), cpv(317.00,  65.75), cpv(313.00,  67.79),
	cpv(307.57,  76.00), cpv(315.00,  78.62), cpv(319.28,  82.00), cpv(322.23,  87.00), cpv(323.00,  94.41), cpv(334.00,  92.49), cpv(347.00,  87.47), cpv(349.62,  80.00), cpv(353.00,  75.73), cpv(359.00,  72.48), cpv(366.00,  72.32), cpv(372.00,  74.94),
	cpv(377.00,  81.34), cpv(382.00,  83.41), cpv(392.00,  83.40), cpv(399.00,  79.15), cpv(404.00,  85.74), cpv(411.00,  85.06), cpv(417.00,  86.62), cpv(423.38,  93.00), cpv(425.05, 104.00), cpv(438.00, 110.35), cpv(450.00, 112.17), cpv(452.62, 103.00),
	cpv(456.00,  98.73), cpv(462.00,  95.48), cpv(472.00,  95.79), cpv(471.28,  92.00), cpv(464.00,  84.62), cpv(445.00,  80.39), cpv(436.00,  75.33), cpv(428.00,  68.46), cpv(419.00,  68.52), cpv(413.00,  65.27), cpv(408.48,  58.00), cpv(409.87,  46.00),
	cpv(404.42,  39.00), cpv(408.00,  33.88), cpv(415.00,  29.31), cpv(429.00,  26.45), cpv(455.00,  28.77), cpv(470.00,  33.81), cpv(482.00,  42.16), cpv(494.00,  46.85), cpv(499.65,  36.00), cpv(513.00,  25.95), cpv(529.00,  22.42), cpv(537.18,  23.00)
];
/*int*/ var bouncy_terrain_count = bouncy_terrain_verts.length;

//static cpSpace
init['BouncyTerrainCircles_500'] = function(){
	/*cpSpace*/ var space = BENCH_SPACE_NEW();
	space.iterations = 10;
	
	/*cpVect*/ var offset = cpv(-320, -240);
	for(var i=0; i<(bouncy_terrain_count - 1); i++){
		/*cpVect*/ var a = bouncy_terrain_verts[i], b = bouncy_terrain_verts[i+1];
		/*cpShape*/ var shape = space.addShape(new SegmentShape(space.staticBody, cpvadd(a, offset), cpvadd(b, offset), 0.0));
		shape.e = 1.0;
	}
	
	for(var i=0; i<500; i++){
		/*cpFloat*/ var radius = 5.0;
		/*cpFloat*/ var mass = radius*radius;
		/*cpBody*/ var body = space.addBody(new Body(mass, cpMomentForCircle(mass, 0.0, radius, cpvzero)));
		body.p = cpvadd(cpvmult(frand_unit_circle(), 130.0), cpvzero);
		body.v = cpvmult(frand_unit_circle(), 50.0);
		
		/*cpShape*/ var shape = space.addShape(new CircleShape(body, radius, cpvzero));
		shape.e = 1.0;
	}
	
	return space;
}

//static cpSpace
init['BouncyTerrainHexagons_500'] = function(){
	/*cpSpace*/ var space = BENCH_SPACE_NEW();
	space.iterations = 10;
	
	/*cpVect*/ var offset = cpv(-320, -240);
	for(var i=0; i<(bouncy_terrain_count - 1); i++){
		/*cpVect*/ var a = bouncy_terrain_verts[i], b = bouncy_terrain_verts[i+1];
		/*cpShape*/ var shape = space.addShape(new SegmentShape(space.staticBody, cpvadd(a, offset), cpvadd(b, offset), 0.0));
		shape.e = 1.0;
	}
	
	/*cpFloat*/ var radius = 5.0;
	/*cpVect*/ var hexagon = [];
	for(var i=0; i<6; i++){
		/*cpFloat*/ var angle = -M_PI*2.0*i/6.0;
		hexagon[i] = cpvmult(cpv(Math.cos(angle), Math.sin(angle)), radius - bevel);
	}
	
	for(var i=0; i<500; i++){
		/*cpFloat*/ var mass = radius*radius;
		/*cpBody*/ var body = space.addBody(new Body(mass, cpMomentForPoly(mass, hexagon, cpvzero)));
		body.p = cpvadd(cpvmult(frand_unit_circle(), 130.0), cpvzero);
		body.v = cpvmult(frand_unit_circle(), 50.0);
		
		/*cpShape*/ var shape = space.addShape(new PolyShape2(body, hexagon, cpvzero, bevel));
		shape.e = 1.0;
	}
	
	return space;
}


// No collisions

//cpBool
var NoCollide_begin = function(/*cpArbiter*/ arb, /*cpSpace*/ space, /*void*/ data) {
//	abort();
	
	return true;
}


//static cpSpace
init['NoCollide'] = function(){
	/*cpSpace*/ var space = BENCH_SPACE_NEW();
	space.iterations = 10;
	
	space.addCollisionHandler(2, 2, NoCollide_begin, null, null, null, null);
	
	/*float*/ var radius = 4.5;
	
	space.addShape(new SegmentShape(space.staticBody, cpv(-330-radius, -250-radius), cpv( 330+radius, -250-radius), 0.0)).e = 1.0;
	space.addShape(new SegmentShape(space.staticBody, cpv( 330+radius,  250+radius), cpv( 330+radius, -250-radius), 0.0)).e = 1.0;
	space.addShape(new SegmentShape(space.staticBody, cpv( 330+radius,  250+radius), cpv(-330-radius,  250+radius), 0.0)).e = 1.0;
	space.addShape(new SegmentShape(space.staticBody, cpv(-330-radius, -250-radius), cpv(-330-radius,  250+radius), 0.0)).e = 1.0;
	
	for(var x=-320; x<=320; x+=20){
		for(var y=-240; y<=240; y+=20){
			space.addShape(new CircleShape(space.staticBody, radius, cpv(x, y)));
		}
	}
	
	for(var y=10-240; y<=240; y+=40){
		/*cpFloat*/ var mass = 7.0;
		/*cpBody*/ var body = space.addBody(new Body(mass, cpMomentForCircle(mass, 0.0, radius, cpvzero)));
		body.p = cpv(-320.0, y);
		body.v = cpv(100.0, 0.0);
		
		/*cpShape*/ var shape = space.addShape(new CircleShape(body, radius, cpvzero));
		shape.e = 1.0;
		shape.collision_type = 2;
	}
	
	for(var x=30-320; x<=320; x+=40){
		/*cpFloat*/ var mass = 7.0;
		/*cpBody*/ var body = space.addBody(new Body(mass, cpMomentForCircle(mass, 0.0, radius, cpvzero)));
		body.p = cpv(x, -240.0);
		body.v = cpv(0.0, 100.0); 
		
		/*cpShape*/ var shape = space.addShape(new CircleShape(body, radius, cpvzero));
		shape.e = 1.0;
		shape.collision_type = 2;
	}
	
	return space;
}


// TODO ideas:
// addition/removal
// Memory usage? (too small to matter?)
// http://forums.tigsource.com/index.php?topic=18077.msg518578#msg518578


// Build benchmark list
//void
var update = function(/*cpSpace*/ space, /*double*/ dt) {
	BENCH_SPACE_STEP(space, dt);
}

//// Make a second demo declaration for this demo to use in the regular demo set.
///*ChipmunkDemo*/ var BouncyHexagons = new ChipmunkDemo(
//	"Bouncy Hexagons",
//	1.0/60.0,
//	init_BouncyTerrainHexagons_500,
//	update,
//	ChipmunkDemoDefaultDrawImpl,
//	destroy,
//);

//#define BENCH(n) {"benchmark - " #n, 1.0/60.0, init_##n, update, 	ChipmunkDemoDefaultDrawImpl, destroy}
//ChipmunkDemo bench_list[] = {
//	BENCH(SimpleTerrainCircles_1000),
//	BENCH(SimpleTerrainCircles_500),
//	BENCH(SimpleTerrainCircles_100),
//	BENCH(SimpleTerrainBoxes_1000),
//	BENCH(SimpleTerrainBoxes_500),
//	BENCH(SimpleTerrainBoxes_100),
//	BENCH(SimpleTerrainHexagons_1000),
//	BENCH(SimpleTerrainHexagons_500),
//	BENCH(SimpleTerrainHexagons_100),
//	BENCH(SimpleTerrainVCircles_200),
//	BENCH(SimpleTerrainVBoxes_200),
//	BENCH(SimpleTerrainVHexagons_200),
//	BENCH(ComplexTerrainCircles_1000),
//	BENCH(ComplexTerrainHexagons_1000),
//	BENCH(BouncyTerrainCircles_500),
//	BENCH(BouncyTerrainHexagons_500),
//	BENCH(NoCollide),
//};

// /*int*/ var bench_count = sizeof(bench_list)/sizeof(ChipmunkDemo);

var BENCH = function(n) {
    console.log('bench: ' + n);
    var ticks = n.match(/(\d+)/);
    ticks = ticks? ticks[1] : 1000;
    ticks = 100000 / ticks;

    var sample = new Array(9)
    for (var i = 0; i < sample.length; i++) {
        var fn = init[n];
        var space = fn();
        var start = Date.now()
        for (var j = 0; j < ticks; j++) {
            update(space, 1.0/60.0);
        }
        var end = Date.now() - start;
        sample[i] = end;
        console.log('Run ' + (i + 1) + ': ' + end);
    }

    console.log(n + ': ' + (sample[3] + sample[4] + sample[5]) / 3);
//    console.log(n + ': ' + sample[0]);

}

var bench_list;
var benchName = process.argv[2]
if (!benchName) {
    bench_list = Object.keys(init)
} else {
    bench_list = [benchName]
}

for (var i = 0; i < bench_list.length; i++) {
    BENCH(bench_list[i])
}