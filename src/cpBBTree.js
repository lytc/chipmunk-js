//typedef struct Node Node;
//typedef struct Pair Pair;

//struct Node {
//	void *obj;
//	cpBB bb;
//	Node *parent;
//	
//	union {
//		// Internal nodes
//		struct { Node *a, *b; } children;
//		
//		// Leaves
//		struct {
//			cpTimestamp stamp;
//			Pair *pairs;
//		} leaf;
//	} node;
//};

// Can't use anonymous unions and still get good x-compiler compatability
//#define A node.children.a
//#define B node.children.b
//#define STAMP node.leaf.stamp
//#define PAIRS node.leaf.pairs

var Node = function(a, b) {
    var node = this;
    node.bb = a.bb.merge(b.bb);
    node.parent = null;

    node.setA(a);
    node.setB(b);
}
var Leaf = function(tree, obj) {
    this.bb = new BB(0, 0, 0, 0)
    var node = this;
    node.obj = obj;
    tree.getBB(obj, node.bb);

    node.parent = null;
    node.STAMP = 0;
    node.PAIRS = null;
}

//_extend(Node, Leaf)

//typedef struct 
//var Thread  = function(
//	/*Pair **/prev,
//	/*Node **/leaf,
//	/*Pair **/next
//) {
//    this.prev = prev
//    this.leaf = leaf
//    this.next = next
//};

//struct 
//var Pair = function(
//	/*Thread*/ a, b,
//	/*cpCollisionID*/ id
//) {
//    this.a = a;
//    this.b = b;
//    this.id = id;
//};
var Pair = function(
	/*Thread*/ leafA, nextA, leafB, nextB,
	/*cpCollisionID*/ id
) {
    this.aPrev = null;
    this.aLeaf = leafA;
    this.aNext = nextA;

    this.bPrev = null;
    this.bLeaf = leafB;
    this.bNext = nextB;

//    this.a = new Thread(null, leafA, nextA);
//    this.b = new Thread(null, leafB, nextB);
    this.id = id;
};

//cpSpatialIndex *
var BBTree = cp.BBTree = function(/*cpSpatialIndexBBFunc*/ bbfunc, /*cpSpatialIndex **/staticIndex)
{
    var tree = this;
    SpatialIndex.call(tree, bbfunc, staticIndex);

    tree.velocityFunc = null;

    tree.leaves = {};
    tree.count = 0;

    tree.root = null;

    tree.pooledNodes = null;
    tree.pooledPairs = null;

    tree.stamp = 0;
}

_extend(SpatialIndex, BBTree);

//static inline cpBB
BBTree.prototype.getBB = function(/*void **/obj, targetBB)
{
    /*cpBBTree **/var tree = this;
    /*cpBB*/ var bb = tree.bbfunc(obj);

	/*cpBBTreeVelocityFunc*/ var velocityFunc = tree.velocityFunc;
	if(velocityFunc){
		/*cpFloat*/ var coef = 0.1;
		/*cpFloat*/ var x = (bb.r - bb.l)*coef;
		/*cpFloat*/ var y = (bb.t - bb.b)*coef;
		
//		/*cpVect*/ var v = cpvmult(velocityFunc(obj), 0.1);
		var v = velocityFunc(obj);
        var vx = v.x * 0.1;
        var vy = v.y * 0.1;

//		return new BB(bb.l + cpfmin(-x, v.x), bb.b + cpfmin(-y, v.y), bb.r + cpfmax(x, v.x), bb.t + cpfmax(y, v.y));
        targetBB.l = bb.l + cpfmin(-x, vx)
        targetBB.b = bb.b + cpfmin(-y, vy)
        targetBB.r = bb.r + cpfmax(x, vx)
        targetBB.t = bb.t + cpfmax(y, vy)
	} else {
        targetBB.l = bb.l;
        targetBB.b = bb.b;
        targetBB.r = bb.r;
        targetBB.t = bb.t;
//		return bb;
	}
}

//static inline cpBBTree *
//var GetTree = function(/*cpSpatialIndex **/index)
//{
//    return index
//    return index && index instanceof BBTree? index : null
//}

//static inline Node *
//var GetRootIfTree = function(/*cpSpatialIndex **/index){
//    return index.root
//    return index && index instanceof BBTree? index.root : null
//}

//static inline cpBBTree *
BBTree.prototype.getMasterTree = function()
{
    return this.dynamicIndex || this
//	/*cpBBTree **/ var dynamicTree = tree.dynamicIndex;
//	return (dynamicTree ? dynamicTree : tree);
}

//static inline void
BBTree.prototype.incrementStamp = function()
{
    (this.dynamicIndex || this).stamp++
}

//MARK: Pair/Thread Functions

//static void
Pair.prototype.recycle = function(/*cpBBTree **/tree)
{
    /*Pair **/var pair = this;
	// Share the pool of the master tree.
	// TODO would be lovely to move the pairs stuff into an external data structure.
	tree = tree.getMasterTree();
	
	pair.aNext = tree.pooledPairs;
	tree.pooledPairs = pair;
}

//static Pair *
BBTree.prototype.pairFromPool = function(a, nextA, b, nextB, id)
{
    /*cpBBTree **/var tree = this;
    // Share the pool of the master tree.
	// TODO would be lovely to move the pairs stuff into an external data structure.
	tree = tree.getMasterTree();
	
	/*Pair **/ var pair = tree.pooledPairs;
	
	if(pair){
		tree.pooledPairs = pair.aNext;
        pair.constructor(a, nextA, b, nextB, id)
//        pair.aPrev = null;
//        pair.aLeaf = a;
//        pair.aNext = nextA;
//
//        pair.bPrev = null;
//        pair.bLeaf = b;
//        pair.bNext = nextB;
//        pair.id = id;

		return pair;
	} else {
		// Pool is exhausted, make more
//		Pair *buffer = (Pair *)cpcalloc(1, CP_BUFFER_BYTES);
		/*Pair **/ var buffer = new Pair(a, nextA, b, nextB, id);
//        tree.pairAllocatedBuffers.push(buffer);
		
		// push all but the first one, return the first instead
//		for(/*int*/ var i=1; i<tree.pairAllocatedBuffers.length; i++) PairRecycle(tree, tree.pairAllocatedBuffers[i]);
		return buffer;
	}
}

//static inline void
var ThreadUnlink = function(prev, leaf, next)
{
	if(next){
		if(next.aLeaf == leaf) next.aPrev = prev; else next.bPrev = prev;
	}
	
	if(prev){
		if(prev.aLeaf == leaf) prev.aNext = next; else prev.bNext = next;
	} else {
		leaf.PAIRS = next;
	}
}

//static void
Leaf.prototype.pairsClear = function(/*cpBBTree **/tree)
{
    /*Node **/var leaf = this;
	/*Pair **/ var pair = leaf.PAIRS;
	leaf.PAIRS = null;
	
	while(pair){
		if(pair.aLeaf == leaf){
			/*Pair **/ var next = pair.aNext;
//            pair.b.unlink();
            ThreadUnlink(pair.bPrev, pair.bLeaf, pair.bNext);
		} else {
			/*Pair **/ var next = pair.bNext;
//            pair.a.unlink();
            ThreadUnlink(pair.aPrev, pair.aLeaf, pair.aNext);
        }
        pair.recycle(tree);
        pair = next;
	}
}

//static void
var PairInsert = function(/*Node **/a, /*Node **/b, /*cpBBTree **/tree)
{
	/*Pair **/ var nextA = a.PAIRS, nextB = b.PAIRS;
	/*Pair **/ var pair = tree.pairFromPool(a, nextA, b, nextB, 0);
//	/*Pair*/ var temp = new Pair(new Thread(null, a, nextA), new Thread(null, b, nextB), 0);
	
	a.PAIRS = b.PAIRS = pair;
//	pair.a = temp.a;
//	pair.b = temp.b;
//	pair.id = temp.id;
//    pair.a = new Thread(null, a, nextA);
//    pair.b = new Thread(null, b, nextB);
//    pair.id = 0;

	if(nextA){
		if(nextA.aLeaf == a) nextA.aPrev = pair; else nextA.bPrev = pair;
	}
	
	if(nextB){
		if(nextB.aLeaf == b) nextB.aPrev = pair; else nextB.bPrev = pair;
	}
}


//MARK: Node Functions

//static void
Node.prototype.recycle = function(/*cpBBTree **/tree)
{
    /*Node **/var node = this;
	node.parent = tree.pooledNodes;
	tree.pooledNodes = node;
}

//static Node *
BBTree.prototype.nodeFromPool = function(/*Node **/a, /*Node **/b)
{
    /*cpBBTree **/var tree = this;
	/*Node **/ var node = tree.pooledNodes;
	
	if(node){
		tree.pooledNodes = node.parent;
        node.constructor(a, b)
		return node;
	} else {
		// Pool is exhausted, make more
//		Node *buffer = (Node *)cpcalloc(1, CP_BUFFER_BYTES);
		/*Node **/ var buffer = new Node(a, b)
//        tree.nodeAllocatedBuffers.push(buffer);
		
		// push all but the first one, return the first instead
//		for(/*int*/ var i=1; i<tree.nodeAllocatedBuffers.length; i++) NodeRecycle(tree, tree.nodeAllocatedBuffers[i]);
		return buffer;
	}
}

//static inline void
Node.prototype.setA = function(/*Node **/value)
{
    /*Node **/var node = this;
    node.A = value;
	value.parent = node;
}

//static inline void
Node.prototype.setB = function(/*Node **/value)
{
    /*Node **/var node = this;
    node.B = value;
	value.parent = node;
}

//static inline cpBool
Node.prototype.isLeaf = false;
Leaf.prototype.isLeaf = true;

//static inline Node *
Node.prototype.other = function(/*Node **/child)
{
    /*Node **/var node = this;
    return (node.A == child ? node.B : node.A);
}

//static inline void
Node.prototype.replaceChild = function(/*Node **/child, /*Node **/value, /*cpBBTree **/tree)
{
    /*Node **/var parent = this;
    if (NDEBUG) {
        cpAssertSoft(!parent.isLeaf, "Internal Error: Cannot replace child of a leaf.");
        cpAssertSoft(child == parent.A || child == parent.B, "Internal Error: Node is not a child of parent.");
    }

	if(parent.A == child){
        parent.A.recycle(tree);
        parent.setA(value);
	} else {
        parent.B.recycle(tree);
        parent.setB(value);
	}
	
	for(/*Node **/ var node=parent; node; node = node.parent){
		node.bb = node.A.bb.merge(node.B.bb);
	}
}

//MARK: Subtree Functions

//static inline cpFloat
var cpBBProximity = function(/*cpBB*/ a, /*cpBB*/ b)
{
	return cpfabs(a.l + a.r - b.l - b.r) + cpfabs(a.b + a.t - b.b - b.t);
}

//static Node *
var SubtreeInsert = function(/*Node **/subtree, /*Node **/leaf, /*cpBBTree **/tree)
{
	if(subtree == null){
		return leaf;
	} else if(subtree.isLeaf){
		return tree.nodeFromPool(leaf, subtree);
	} else {
		/*cpFloat*/ var cost_a = subtree.B.bb.area() + subtree.A.bb.mergedArea(leaf.bb);
		/*cpFloat*/ var cost_b = subtree.A.bb.area() + subtree.B.bb.mergedArea(leaf.bb);
		
		if(cost_a == cost_b){
			cost_a = cpBBProximity(subtree.A.bb, leaf.bb);
			cost_b = cpBBProximity(subtree.B.bb, leaf.bb);
		}
		
		if(cost_b < cost_a){
            subtree.setB(SubtreeInsert(subtree.B, leaf, tree));
		} else {
            subtree.setA(SubtreeInsert(subtree.A, leaf, tree));
		}
		
		subtree.bb = subtree.bb.merge(leaf.bb);
		return subtree;
	}
}

//static void
var SubtreeQuery = function(/*Node **/subtree, /*void **/obj, /*cpBB*/ bb, /*cpSpatialIndexQueryFunc*/ func, /*void **/data)
{
	if(subtree.bb.intersects(bb)){
		if(subtree.isLeaf){
			func(obj, subtree.obj, 0, data);
		} else {
			SubtreeQuery(subtree.A, obj, bb, func, data);
			SubtreeQuery(subtree.B, obj, bb, func, data);
		}
	}
}


//static cpFloat
var SubtreeSegmentQuery = function(/*Node **/subtree, /*void **/obj, /*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ t_exit, /*cpSpatialIndexSegmentQueryFunc*/ func, /*void **/data)
{
	if(subtree.isLeaf){
		return func(obj, subtree.obj, data);
	} else {
		/*cpFloat*/ var t_a = subtree.A.bb.segmentQuery(a, b);
		/*cpFloat*/ var t_b = subtree.B.bb.segmentQuery(a, b);
		
		if(t_a < t_b){
			if(t_a < t_exit) t_exit = cpfmin(t_exit, SubtreeSegmentQuery(subtree.A, obj, a, b, t_exit, func, data));
			if(t_b < t_exit) t_exit = cpfmin(t_exit, SubtreeSegmentQuery(subtree.B, obj, a, b, t_exit, func, data));
		} else {
			if(t_b < t_exit) t_exit = cpfmin(t_exit, SubtreeSegmentQuery(subtree.B, obj, a, b, t_exit, func, data));
			if(t_a < t_exit) t_exit = cpfmin(t_exit, SubtreeSegmentQuery(subtree.A, obj, a, b, t_exit, func, data));
		}
		
		return t_exit;
	}
}

//static void
BBTree.prototype.subtreeRecycle = function(/*Node **/node)
{
    /*cpBBTree **/var tree = this;
    if(!node.isLeaf){
        tree.subtreeRecycle(node.A);
        tree.subtreeRecycle(node.B);
        node.recycle(tree);
	}
}

//static inline Node *
var SubtreeRemove = function(/*Node **/subtree, /*Node **/leaf, /*cpBBTree **/tree)
{
	if(leaf == subtree){
		return null;
	} else {
		/*Node **/ var parent = leaf.parent;
		if(parent == subtree){
			/*Node **/ var other = subtree.other(leaf);
			other.parent = subtree.parent;
            subtree.recycle(tree);
			return other;
		} else {
            parent.parent.replaceChild(parent, parent.other(leaf), tree);
			return subtree;
		}
	}
}

//MARK: Marking Functions

////typedef struct
//var MarkContext = function(
//	/*cpBBTree **/tree,
//	/*Node **/staticRoot,
//	/*cpSpatialIndexQueryFunc*/ func,
//	/*void **/data
//) {
//    this.tree = tree;
//    this.staticRoot = staticRoot;
//    this.func = func;
//    this.data = data;
//};
//static void

//var MarkLeafQuery = function(/*Node **/subtree, /*Node **/leaf, /*cpBool*/ left, /*MarkContext **/context)
//{
//	if(leaf.bb.intersects(subtree.bb)){
//        if(subtree.isLeaf){
//            if(left){
//				PairInsert(leaf, subtree, context.tree);
//			} else {
//				if(subtree.STAMP < leaf.STAMP) {
//                    PairInsert(subtree, leaf, context.tree);
//                }
//				context.func(leaf.obj, subtree.obj, 0, context.data);
//			}
//		} else {
//			MarkLeafQuery(subtree.A, leaf, left, context);
//			MarkLeafQuery(subtree.B, leaf, left, context);
//		}
//	}
//}

Node.prototype.markLeafQuery = function(/*Node **/leaf, /*cpBool*/ left, tree, func, data)
{
    /*Node **/ var subtree = this;
    if(leaf.bb.intersects(subtree.bb)){
        subtree.A.markLeafQuery(leaf, left, tree, func, data);
        subtree.B.markLeafQuery(leaf, left, tree, func, data);
    }
}

Leaf.prototype.markLeafQuery = function(/*Node **/leaf, /*cpBool*/ left, tree, func, data)
{
    /*Node **/ var subtree = this;
    if(leaf.bb.intersects(subtree.bb)){
        if(left){
            PairInsert(leaf, subtree, tree);
        } else {
            if(subtree.STAMP < leaf.STAMP) {
                PairInsert(subtree, leaf, tree);
            }
            func(leaf.obj, subtree.obj, 0, data);
        }
    }
}

//static void
Leaf.prototype.markSubtree = function(tree, staticRoot, func, data)
{
    /*Node **/ var leaf = this;

	if(leaf.STAMP == tree.getMasterTree().stamp){
		if(staticRoot) staticRoot.markLeafQuery(leaf, false, tree, func, data);
		
		for(/*Node **/ var node = leaf; node.parent; node = node.parent){
            if(node == node.parent.A){
                node.parent.B.markLeafQuery(leaf, true, tree, func, data);
			} else {
                node.parent.A.markLeafQuery(leaf, false, tree, func, data);
			}
		}
	} else {
		/*Pair **/ var pair = leaf.PAIRS;
		while(pair){
			if(leaf == pair.bLeaf){
				pair.id = func(pair.aLeaf.obj, leaf.obj, pair.id, data);
				pair = pair.bNext;
			} else {
				pair = pair.aNext;
			}
		}
	}
}

//static void
Node.prototype.markSubtree = function(tree, staticRoot, func, data)
{
    this.A.markSubtree(tree, staticRoot, func, data);
    this.B.markSubtree(tree, staticRoot, func, data); // TODO Force TCO here?
}

//MARK: Leaf Functions

//static Node *
//var LeafNew = function(/*cpBBTree **/tree, /*void **/obj, /*cpBB*/ bb)
//{
//	/*Node **/ var node = tree.nodeFromPool();
//	node.obj = obj;
//	node.bb = tree.getBB(obj);
//
//	node.parent = null;
//	node.STAMP = 0;
//	node.PAIRS = null;
//
//	return node;
//}

//static cpBool
Leaf.prototype.update = function(/*cpBBTree **/tree)
{
    /*Node **/ var leaf = this;
    /*Node **/ var root = tree.root;
	/*cpBB*/ var bb = tree.bbfunc(leaf.obj);
	
	if(!leaf.bb.containsBB(bb)){
		tree.getBB(leaf.obj, leaf.bb);
		
		root = SubtreeRemove(root, leaf, tree);
		tree.root = SubtreeInsert(root, leaf, tree);

        leaf.pairsClear(tree);
		leaf.STAMP = tree.getMasterTree().stamp;

		return true;
	} else {
		return false;
	}
}

//static cpCollisionID
var VoidQueryFunc = function(/*void **/obj1, /*void **/obj2, /*cpCollisionID*/ id, /*void **/data){return id;}

//static void
Leaf.prototype.addPairs = function(/*cpBBTree **/tree)
{
    /*Node **/var leaf = this;
    /*cpSpatialIndex **/ var dynamicIndex = tree.dynamicIndex;
	if(dynamicIndex){
        /*Node **/ var dynamicRoot = dynamicIndex.root;
		if(dynamicRoot){
            /*cpBBTree **/ var dynamicTree = dynamicIndex;
//			/*MarkContext*/ var context = new MarkContext(dynamicTree, null, null, null);
            dynamicRoot.markLeafQuery(leaf, true, dynamicTree, _nothing, null);
		}
	} else {
		/*Node **/ var staticRoot = tree.staticIndex.root;
//		/*MarkContext*/ var context = new MarkContext(tree, staticRoot, VoidQueryFunc, null);
        leaf.markSubtree(tree, staticRoot, VoidQueryFunc, null);
	}
}

////static int
//var leafSetEql = function(/*void **/obj, /*Node **/node)
//{
//	return (obj == node.obj);
//}
//
////static void *
//var leafSetTrans = function(/*void **/obj, /*cpBBTree **/tree)
//{
//	return LeafNew(tree, obj, tree.bbfunc(obj));
//}

//void
BBTree.prototype.setVelocityFunc = function(/*cpBBTreeVelocityFunc*/ func)
{
	this.velocityFunc = func;
}

//MARK: Insert/Remove

//static void
BBTree.prototype.insert = function(/*void **/obj, /*cpHashValue*/ hashid)
{
    var tree = this;
//	Node *leaf = (Node *)cpHashSetInsert(tree.leaves, hashid, obj, tree, (cpHashSetTransFunc)leafSetTrans);
    /*Node **/ var leaf = tree.leaves[hashid] = new Leaf(tree, obj);

    /*Node **/ var root = tree.root;
	tree.root = SubtreeInsert(root, leaf, tree);
	tree.count++

	leaf.STAMP = tree.getMasterTree().stamp;
    leaf.addPairs(tree);
    tree.incrementStamp();
}

//static void
BBTree.prototype.remove = function( /*void **/obj, /*cpHashValue*/ hashid)
{
    var tree = this;
//	Node *leaf = (Node *)cpHashSetRemove(tree.leaves, hashid, obj);
    /*Node **/ var leaf = tree.leaves[hashid];
    delete tree.leaves[hashid];

    tree.root = SubtreeRemove(tree.root, leaf, tree);
    tree.count--;

    leaf.pairsClear(tree);
//    leaf.recycle(tree);
}

//static cpBool
BBTree.prototype.contains = function(/*void **/obj, /*cpHashValue*/ hashid)
{
	return this.leaves[hashid] != null;
}

//MARK: Reindex

//static void
BBTree.prototype.reindexQuery = function(/*cpSpatialIndexQueryFunc*/ func, /*void **/data)
{
    /*cpBBTree **/var tree = this;

    if(!tree.root) return;
	
	// LeafUpdate() may modify tree.root. Don't cache it.

//	cpHashSetEach(tree.leaves, (cpHashSetIteratorFunc)LeafUpdate, tree);
	for (var hashid in tree.leaves) {
        tree.leaves[hashid].update(tree);
    }

	/*cpSpatialIndex **/ var staticIndex = tree.staticIndex;
	/*Node **/ var staticRoot = (staticIndex && staticIndex.root);
	
//	/*MarkContext*/ var context = new MarkContext(tree, staticRoot, func, data);
    tree.root.markSubtree(tree, staticRoot, func, data);
	if(staticIndex && !staticRoot) tree.collideStatic(staticIndex, func, data);

    tree.incrementStamp();
}

//static void
BBTree.prototype.reindex = function()
{
    this.reindexQuery(VoidQueryFunc, null);
}

//static void
BBTree.prototype.reindexObject = function(/*void **/obj, /*cpHashValue*/ hashid)
{
    /*cpBBTree **/var tree = this;
//	Node *leaf = (Node *)cpHashSetFind(tree.leaves, hashid, obj);
	/*Node **/ var leaf = tree.leaves[hashid];
	if(leaf){
		if(leaf.update(tree)) leaf.addPairs(tree);
        tree.incrementStamp();
	}
}

//MARK: Query

//static void
BBTree.prototype.segmentQuery = function(/*void **/obj, /*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ t_exit, /*cpSpatialIndexSegmentQueryFunc*/ func, /*void **/data)
{
    /*cpBBTree **/ var tree = this;
    /*Node **/ var root = tree.root;
	if(root) SubtreeSegmentQuery(root, obj, a, b, t_exit, func, data);
}

//static void
BBTree.prototype.query = function(/*void **/obj, /*cpBB*/ bb, /*cpSpatialIndexQueryFunc*/ func, /*void **/data)
{
	if(this.root) SubtreeQuery(this.root, obj, bb, func, data);
}

//MARK: Misc

//static int
//BBTree.prototype.count = function()
//{
//    return this.count;
//}

//typedef struct
//var eachContext = function(
//	/*cpSpatialIndexIteratorFunc*/ func,
//	/*void **/data
//) {
//    this.func = func;
//    this.data = data;
//};

//static void
//var each_helper = function(/*Node **/node, /*eachContext **/context){context.func(node.obj, context.data);}

//static void
BBTree.prototype.each = function(/*cpSpatialIndexIteratorFunc*/ func, /*void **/data)
{
    /*cpBBTree **/ var tree = this;
//    /*eachContext*/ var context = new eachContext(func, data);

//    cpHashSetEach(tree.leaves, (cpHashSetIteratorFunc)each_helper, &context);
    for (var hashid in tree.leaves) {
//        each_helper(tree.leaves[hashid], context)
        func(tree.leaves[hashid].obj, data)
    }
}

//MARK: Tree Optimization

//static int
//var cpfcompare = function(/*const cpFloat **/a, /*const cpFloat **/b){
//	return (a < b ? -1 : (b < a ? 1 : 0));
//}

//static Node *
//partitionNodes(cpBBTree *tree, Node **nodes, int count)
//{
//	if(count == 1){
//		return nodes[0];
//	} else if(count == 2) {
//		return NodeNew(tree, nodes[0], nodes[1]);
//	}
//
//	// Find the AABB for these nodes
//	cpBB bb = nodes[0].bb;
//	for(int i=1; i<count; i++) bb = cpBBMerge(bb, nodes[i].bb);
//
//	// Split it on it's longest axis
//	cpBool splitWidth = (bb.r - bb.l > bb.t - bb.b);
//
//	// Sort the bounds and use the median as the splitting point
//	cpFloat *bounds = (cpFloat *)cpcalloc(count*2, sizeof(cpFloat));
//	if(splitWidth){
//		for(int i=0; i<count; i++){
//			bounds[2*i + 0] = nodes[i].bb.l;
//			bounds[2*i + 1] = nodes[i].bb.r;
//		}
//	} else {
//		for(int i=0; i<count; i++){
//			bounds[2*i + 0] = nodes[i].bb.b;
//			bounds[2*i + 1] = nodes[i].bb.t;
//		}
//	}
//
//	qsort(bounds, count*2, sizeof(cpFloat), (int (*)(const void *, const void *))cpfcompare);
//	cpFloat split = (bounds[count - 1] + bounds[count])*0.5; // use the medain as the split
//	cpfree(bounds);
//
//	// Generate the child BBs
//	cpBB a = bb, b = bb;
//	if(splitWidth) a.r = b.l = split; else a.t = b.b = split;
//
//	// Partition the nodes
//	int right = count;
//	for(int left=0; left < right;){
//		Node *node = nodes[left];
//		if(cpBBMergedArea(node.bb, b) < cpBBMergedArea(node.bb, a)){
////		if(cpBBProximity(node.bb, b) < cpBBProximity(node.bb, a)){
//			right--;
//			nodes[left] = nodes[right];
//			nodes[right] = node;
//		} else {
//			left++;
//		}
//	}
//
//	if(right == count){
//		Node *node = null;
//		for(int i=0; i<count; i++) node = SubtreeInsert(node, nodes[i], tree);
//		return node;
//	}
//
//	// Recurse and build the node!
//	return NodeNew(tree,
//		partitionNodes(tree, nodes, right),
//		partitionNodes(tree, nodes + right, count - right)
//	);
//}
//
////static void
////cpBBTreeOptimizeIncremental(cpBBTree *tree, int passes)
////{
////	for(int i=0; i<passes; i++){
////		Node *root = tree.root;
////		Node *node = root;
////		int bit = 0;
////		unsigned int path = tree.opath;
////
////		while(!NodeIsLeaf(node)){
////			node = (path&(1<<bit) ? node.a : node.b);
////			bit = (bit + 1)&(sizeof(unsigned int)*8 - 1);
////		}
////
////		root = subtreeRemove(root, node, tree);
////		tree.root = subtreeInsert(root, node, tree);
////	}
////}
//
//void
//cpBBTreeOptimize(cpSpatialIndex *index)
//{
//	if(index.klass != &klass){
//		cpAssertWarn(false, "Ignoring cpBBTreeOptimize() call to non-tree spatial index.");
//		return;
//	}
//
//	cpBBTree *tree = (cpBBTree *)index;
//	Node *root = tree.root;
//	if(!root) return;
//
//	int count = cpBBTreeCount(tree);
//	Node **nodes = (Node **)cpcalloc(count, sizeof(Node *));
//	Node **cursor = nodes;
//
//	cpHashSetEach(tree.leaves, (cpHashSetIteratorFunc)fillNodeArray, &cursor);
//
//	SubtreeRecycle(tree, root);
//	tree.root = partitionNodes(tree, nodes, count);
//	cpfree(nodes);
//}
//
////MARK: Debug Draw
//
////#define CP_BBTREE_DEBUG_DRAW
//#ifdef CP_BBTREE_DEBUG_DRAW
//#include "OpenGL/gl.h"
//#include "OpenGL/glu.h"
//#include <GLUT/glut.h>
//
//static void
//NodeRender(Node *node, int depth)
//{
//	if(!NodeIsLeaf(node) && depth <= 10){
//		NodeRender(node.a, depth + 1);
//		NodeRender(node.b, depth + 1);
//	}
//
//	cpBB bb = node.bb;
//
////	GLfloat v = depth/2.0;
////	glColor3f(1.0 - v, v, 0.0);
//	glLineWidth(cpfmax(5.0 - depth, 1.0));
//	glBegin(GL_LINES); {
//		glVertex2f(bb.l, bb.b);
//		glVertex2f(bb.l, bb.t);
//
//		glVertex2f(bb.l, bb.t);
//		glVertex2f(bb.r, bb.t);
//
//		glVertex2f(bb.r, bb.t);
//		glVertex2f(bb.r, bb.b);
//
//		glVertex2f(bb.r, bb.b);
//		glVertex2f(bb.l, bb.b);
//	}; glEnd();
//}
//
//void
//cpBBTreeRenderDebug(cpSpatialIndex *index){
//	if(index.klass != &klass){
//		cpAssertWarn(false, "Ignoring cpBBTreeRenderDebug() call to non-tree spatial index.");
//		return;
//	}
//
//	cpBBTree *tree = (cpBBTree *)index;
//	if(tree.root) NodeRender(tree.root, 0);
//}
//#endif
