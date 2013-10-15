//struct
var Node = function(
	/*void*/ tree,
	/*cpBB*/ a,
	/*Node*/ b
	) {
    var node = this;
//    node.obj = null;
    node.bb = a.bb.merge(b.bb);
    node.parent = null;

    node.setA(a);
    node.setB(b);
//    this.obj = obj;
//    this.bb = bb;
//    this.parent = parent;
};

//Node.prototype.isLeaf = false;

var Leaf = function(tree, obj) {
    var leaf = this;
    leaf.obj = obj;
    leaf.bb = new BB(0, 0, 0, 0);
    tree.getBB(obj, leaf.bb);

    leaf.parent = null;
    leaf.STAMP = 0;
    leaf.PAIRS = null;
}

//Leaf.prototype.isLeaf = true;

// Can't use anonymous unions and still get good x-compiler compatability
//var A = node.children.a;
//var B = node.children.b;
//var STAMP = node.leaf.stamp;
//var PAIRS = node.leaf.pairs;

//typedef struct
//var Thread = function(
//	/*Pair*/ prev,
//	/*Node*/ leaf,
//	/*Pair*/ next
//) {
//    this.prev = prev;
//    this.leaf = leaf;
//    this.next = next;
//};

//struct
var Pair = function(
	aLeaf, aNext, bLeaf, bNext,
	/*cpCollisionID*/ id
) {
    this.aPrev = null;
    this.aLeaf = aLeaf;
    this.aNext = aNext;
    this.bPrev = null;
    this.bLeaf = bLeaf;
    this.bNext = bNext;
    this.id = id;
};

//cpSpatialIndex *

var BBTree = function(/*cpSpatialIndexBBFunc*/ bbfunc, /*cpSpatialIndex*/ staticIndex) {
    /*cpBBTree*/ var tree = this;

    SpatialIndex.call(/*(cpSpatialIndex *)*/tree, bbfunc, staticIndex);

    tree.velocityFunc = null;

    tree.leaves = {};
    tree.root = null;

    tree.pooledNodes = null;
    tree.pooledLeaves = null;

    tree.stamp = 0;
    tree.count = 0;
};

_extend(SpatialIndex, BBTree);

//MARK: Misc Functions

//static inline cpBB

BBTree.prototype.getBB = function(/*void*/ obj, targetBB) {
    /*cpBBTree*/ var tree = this;
	/*cpBB */ var bb = tree.bbfunc(obj);
	
	/*cpBBTreeVelocityFunc */ var velocityFunc = tree.velocityFunc;
	if(velocityFunc){
		/*cpFloat */ var coef = 0.1;
		/*cpFloat */ var x = (bb.r - bb.l)*coef;
		/*cpFloat */ var y = (bb.t - bb.b)*coef;
		
//		/*cpVect */ var v = cpvmult(velocityFunc(obj), 0.1);
        var v = velocityFunc(obj);
        var vx = v.x * 0.1;
        var vy = v.y * 0.1;

//		return new BB(bb.l + cpfmin(-x, vx), bb.b + cpfmin(-y, vy), bb.r + cpfmax(x, vx), bb.t + cpfmax(y, vy));
        targetBB.l = bb.l + cpfmin(-x, vx);
        targetBB.b = bb.b + cpfmin(-y, vy);
        targetBB.r = bb.r + cpfmax(x, vx);
        targetBB.t = bb.t + cpfmax(y, vy);
	} else {
        targetBB.l = bb.l;
        targetBB.b = bb.b;
        targetBB.r = bb.r;
        targetBB.t = bb.t;
//		return bb;
	}
};

//static inline cpBBTree *

//var GetTree = function(/*cpSpatialIndex*/ index) {
//    return index
//};

//static inline Node *

//var GetRootIfTree = function(/*cpSpatialIndex*/ index) {
//    return index.root
//};

//static inline cpBBTree *

BBTree.prototype.getMasterTree = function() {
    return this.dynamicIndex || this
};

//static inline void

BBTree.prototype.incrementStamp = function() {
    (this.dynamicIndex || this).stamp++;
};

//MARK: Pair/Thread Functions

//static void

BBTree.prototype.pairRecycle = function(/*Pair*/ pair) {
    /*cpBBTree*/ var tree = this;
        // Share the pool of the master tree.
	// TODO: would be lovely to move the pairs stuff into an external data structure.
	tree = tree.getMasterTree();
	
	pair.aNext = tree.pooledPairs;
	tree.pooledPairs = pair;
};

//static Pair *

BBTree.prototype.pairFromPool = function(aLeaf, aNext, bLeaf, bNext, id) {
    /*cpBBTree*/ var tree = this;
	// Share the pool of the master tree.
	// TODO: would be lovely to move the pairs stuff into an external data structure.
	tree = tree.getMasterTree();
	
	/*Pair */ var pair = tree.pooledPairs;
	
	if(pair){
		tree.pooledPairs = pair.aNext;
        pair.aPrev = null;
        pair.aLeaf = aLeaf;
        pair.aNext = aNext;
        pair.bPrev = null;
        pair.bLeaf = bLeaf;
        pair.bNext = bNext;
        pair.id = id;
		return pair;
	} else {
        return new Pair(aLeaf, aNext, bLeaf, bNext, id);
	}
};

//static inline void

var ThreadUnlink = function(prev, leaf, next) {
	if(next){
		if(next.aLeaf == leaf) next.aPrev = prev; else next.bPrev = prev;
	}
	
	if(prev){
		if(prev.aLeaf == leaf) prev.aNext = next; else prev.bNext = next;
	} else {
		leaf.PAIRS = next;
	}
};

//static void

Leaf.prototype.pairsClear = function(/*cpBBTree*/ tree) {
    /*Node*/ var leaf = this;
	/*Pair */ var pair = leaf.PAIRS;
	leaf.PAIRS = null;
	
	while(pair){
		if(pair.aLeaf == leaf){
			/*Pair */ var next = pair.aNext;
			ThreadUnlink(pair.bPrev, pair.bLeaf, pair.bNext);
            tree.pairRecycle(pair);
			pair = next;
		} else {
			/*Pair */ var next = pair.bNext;
			ThreadUnlink(pair.aPrev, pair.aLeaf, pair.aNext);
            tree.pairRecycle(pair);
			pair = next;
		}
	}
};

//static void

BBTree.prototype.pairInsert = function(/*Node*/ a, /*Node*/ b) {
    /*cpBBTree*/ var tree = this;
	/*Pair */ var nextA = a.PAIRS, nextB = b.PAIRS;
	/*Pair */ var pair = tree.pairFromPool(a, nextA, b, nextB, 0);
//	/*Pair */ var temp = new Pair(a, nextA, b, nextB, 0);
	
	a.PAIRS = b.PAIRS = pair;
//    pair.a = temp.a;
//    pair.b = temp.b;
//    pair.id = temp.id;

	if(nextA){
		if(nextA.aLeaf == a) nextA.aPrev = pair; else nextA.bPrev = pair;
	}
	
	if(nextB){
		if(nextB.aLeaf == b) nextB.aPrev = pair; else nextB.bPrev = pair;
	}
};


//MARK: Node Functions

//static void

Node.prototype.recycle = function(/*cpBBTree*/ tree) {
    /*Node*/ var node = this;
	node.parent = tree.pooledNodes;
	tree.pooledNodes = node;
};

Leaf.prototype.recycle = function(/*cpBBTree*/ tree) {
    /*Node*/ var leaf = this;
    leaf.parent = tree.pooledLeaves;
    tree.pooledLeaves = leaf;
};

//static Node *

BBTree.prototype.nodeFromPool = function(a, b) {
    /*cpBBTree*/ var tree = this;
	/*Node */ var node = tree.pooledNodes;
	
	if(node){
		tree.pooledNodes = node.parent;
//        node.obj = null;
//        node.bb = a.bb.merge(b.bb);
        a.bb.mergeTo(b.bb, node.bb);
        node.parent = null;

        node.setA(a);
        node.setB(b);
		return node;
	} else {
        return new Node(tree, a, b);
	}
};

BBTree.prototype.leafFromPool = function(obj) {
    /*cpBBTree*/ var tree = this;
    /*Node */ var leaf = tree.pooledLeaves;

    if(leaf){
        tree.pooledLeaves = leaf.parent;
        leaf.obj = obj;
        tree.getBB(obj, leaf.bb);

        leaf.parent = null;
        leaf.STAMP = 0;
        leaf.PAIRS = null;
        return leaf;
    } else {
        return new Leaf(tree, obj);
    }
};

//static inline void

Node.prototype.setA = function(/*Node*/ value) {
    /*Node*/ var node = this;
	node.A = value;
	value.parent = node;
};

//static inline void

Node.prototype.setB = function(/*Node*/ value) {
    /*Node*/ var node = this;
	node.B = value;
	value.parent = node;
};

//static Node *

//var NodeNew = function(/*cpBBTree*/ tree, /*Node*/ a, /*Node*/ b) {
//	/*Node */ var node = NodeFromPool(tree, a, b);
//
//	return node;
//};

//static inline cpBool

//var NodeIsLeaf = function(/*Node*/ node) {
//	return (node.obj != null);
//};

//static inline Node *

Node.prototype.other = function(/*Node*/ child) {
    /*Node*/ var node = this;
    return (node.A == child ? node.B : node.A);
};

//static inline void

Node.prototype.replaceChild = function(/*Node*/ child, /*Node*/ value, /*cpBBTree*/ tree) {
    /*Node*/ var parent = this;
    if (NDEBUG) {
        cpAssertSoft(child == parent.A || child == parent.B, "Internal Error: Node is not a child of parent.");
    }

	if(parent.A == child){
        parent.A.recycle(tree);
        parent.setA(value);
	} else {
        parent.B.recycle(tree);
        parent.setB(value);
	}
	
	for(/*Node*/ var node =parent; node; node = node.parent){
		node.A.bb.mergeTo(node.B.bb, node.bb);
	}
};

//MARK: Subtree Functions

//static inline cpFloat

BB.prototype.proximity = function(/*cpBB*/ b) {
    /*cpBB*/ var a = this;

	return cpfabs(a.l + a.r - b.l - b.r) + cpfabs(a.b + a.t - b.b - b.t);
};

//static Node *

Node.prototype.subtreeInsert = function(/*Node*/ leaf, /*cpBBTree*/ tree) {
    /*Node*/ var subtree = this;
    /*cpFloat */ var cost_a = subtree.B.bb.area() + subtree.A.bb.mergedArea(leaf.bb);
    /*cpFloat */ var cost_b = subtree.A.bb.area() + subtree.B.bb.mergedArea(leaf.bb);

    if(cost_a == cost_b){
        cost_a = subtree.A.bb.proximity(leaf.bb);
        cost_b = subtree.B.bb.proximity(leaf.bb);
    }

    if(cost_b < cost_a){
        subtree.setB(subtree.B.subtreeInsert(leaf, tree));
    } else {
        subtree.setA(subtree.A.subtreeInsert(leaf, tree));
    }

    subtree.bb.mergeTo(leaf.bb, subtree.bb);
    return subtree;
};

Leaf.prototype.subtreeInsert = function(/*Node*/ leaf, /*cpBBTree*/ tree) {
    return tree.nodeFromPool(leaf, this);
};

//static void

Node.prototype.subtreeQuery = function(/*void*/ obj, /*cpBB*/ bb, /*cpSpatialIndexQueryFunc*/ func, /*void*/ data) {
    /*Node*/ var subtree = this;
	if(subtree.bb.intersects(bb)){
        subtree.A.subtreeQuery(obj, bb, func, data);
        subtree.B.subtreeQuery(obj, bb, func, data);
	}
};

Leaf.prototype.subtreeQuery = function(/*void*/ obj, /*cpBB*/ bb, /*cpSpatialIndexQueryFunc*/ func, /*void*/ data) {
    /*Node*/ var subtree = this;
    if(subtree.bb.intersects(bb)){
        func(obj, subtree.obj, 0, data);
    }
};


//static cpFloat

Node.prototype.subtreeSegmentQuery = function(/*void*/ obj, /*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ t_exit, /*cpSpatialIndexSegmentQueryFunc*/ func, /*void*/ data) {
    /*Node*/ var subtree = this;

    /*cpFloat */ var t_a = subtree.A.bb.segmentQuery(a, b);
    /*cpFloat */ var t_b = subtree.B.bb.segmentQuery(a, b);

    if(t_a < t_b){
        if(t_a < t_exit) t_exit = cpfmin(t_exit, subtree.A.subtreeSegmentQuery(obj, a, b, t_exit, func, data));
        if(t_b < t_exit) t_exit = cpfmin(t_exit, subtree.B.subtreeSegmentQuery(obj, a, b, t_exit, func, data));
    } else {
        if(t_b < t_exit) t_exit = cpfmin(t_exit, subtree.B.subtreeSegmentQuery(obj, a, b, t_exit, func, data));
        if(t_a < t_exit) t_exit = cpfmin(t_exit, subtree.A.subtreeSegmentQuery(obj, a, b, t_exit, func, data));
    }

    return t_exit;
};

Leaf.prototype.subtreeSegmentQuery = function(/*void*/ obj, /*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ t_exit, /*cpSpatialIndexSegmentQueryFunc*/ func, /*void*/ data) {
    /*Node*/ var subtree = this;
    return func(obj, subtree.obj, data);
};

//static void

//var SubtreeRecycle = function(/*cpBBTree*/ tree, /*Node*/ node) {
//	if(!node.isLeaf){
//		SubtreeRecycle(tree, node.A);
//		SubtreeRecycle(tree, node.B);
//        node.recycle(tree);
//	}
//};

//static inline Node *

Node.prototype.subtreeRemove = Leaf.prototype.subtreeRemove = function(/*Node*/ leaf, /*cpBBTree*/ tree) {
    /*Node*/ var subtree = this;
	if(leaf == subtree){
		return null;
	} else {
		/*Node */ var parent = leaf.parent;
		if(parent == subtree){
			/*Node */ var other = subtree.other(leaf);
			other.parent = subtree.parent;
            subtree.recycle(tree);
			return other;
		} else {
            parent.parent.replaceChild(parent, parent.other(leaf), tree);
			return subtree;
		}
	}
};

//MARK: Marking Functions

////typedef struct
//var MarkContext = function(
//	/*cpBBTree*/ tree,
//	/*Node*/ staticRoot,
//	/*cpSpatialIndexQueryFunc*/ func,
//	/*void*/ data
//) {
//    this.tree = tree;
//    this.staticRoot = staticRoot;
//    this.func = func;
//    this.data = data;
//};

//static void

Node.prototype.markLeafQuery = function(/*Node*/ leaf, /*cpBool*/ left, tree, staticRoot, func, data) {
    /*Node*/ var subtree = this;
	if(leaf.bb.intersects(subtree.bb)){
        subtree.A.markLeafQuery(leaf, left, tree, staticRoot, func, data);
        subtree.B.markLeafQuery(leaf, left, tree, staticRoot, func, data);
	}
};

Leaf.prototype.markLeafQuery = function(/*Node*/ leaf, /*cpBool*/ left, tree, staticRoot, func, data) {
    /*Node*/ var subtree = this;
    if(leaf.bb.intersects(subtree.bb)){
        if(left){
            tree.pairInsert(leaf, subtree);
        } else {
            if(subtree.STAMP < leaf.STAMP) tree.pairInsert(subtree, leaf);
            func(leaf.obj, subtree.obj, 0, data);
        }
    }
};

//static void

Leaf.prototype.markLeaf = function(tree, staticRoot, func, data) {
    /*Node*/ var leaf = this;
	if(leaf.STAMP == tree.getMasterTree().stamp){
		if(staticRoot) staticRoot.markLeafQuery(leaf, false, tree, staticRoot, func, data);
		
		for(/*Node*/ var node = leaf; node.parent; node = node.parent){
			if(node == node.parent.A){
                node.parent.B.markLeafQuery(leaf, true, tree, staticRoot, func, data);
			} else {
                node.parent.A.markLeafQuery(leaf, false, tree, staticRoot, func, data);
			}
		}
	} else {
		/*Pair */ var pair = leaf.PAIRS;
		while(pair){
			if(leaf == pair.bLeaf){
				pair.id = func(pair.aLeaf.obj, leaf.obj, pair.id, data);
				pair = pair.bNext;
			} else {
				pair = pair.aNext;
			}
		}
	}
};

//static void

//var MarkSubtree = function(/*Node*/ subtree, /*MarkContext*/ context) {
//	if(subtree.isLeaf){
//		MarkLeaf(subtree, context);
//	} else {
//		MarkSubtree(subtree.A, context);
//		MarkSubtree(subtree.B, context); // TODO: Force TCO here?
//	}
//};

Node.prototype.markLeaf = function(tree, staticRoot, func, data) {
    this.A.markLeaf(tree, staticRoot, func, data);
    this.B.markLeaf(tree, staticRoot, func, data); // TODO: Force TCO here?
}

//Leaf.prototype.markSubtree = function(context) {
//    this.markLeaf(context);
//}

//MARK: Leaf Functions

//static Node *

//var LeafNew = function(/*cpBBTree*/ tree, /*void*/ obj, /*cpBB*/ bb) {
//	/*Node */ var node = LeafFromPool(tree, obj);
//	return node;
//};

//static cpBool

Leaf.prototype.update = function(/*cpBBTree*/ tree) {
    /*Node*/ var leaf = this;
	/*Node */ var root = tree.root;
	/*cpBB */ var bb = tree.bbfunc(leaf.obj);
	
	if(!leaf.bb.containsBB(bb)){
        tree.getBB(leaf.obj, leaf.bb);
		
		root = root.subtreeRemove(leaf, tree);
	    tree.root = root? root.subtreeInsert(leaf, tree) : leaf;

        leaf.pairsClear(tree);
		leaf.STAMP = tree.getMasterTree().stamp;
		
		return true;
	} else {
		return false;
	}
};

//static cpCollisionID 
var VoidQueryFunc = function(/*void*/ obj1, /*void*/ obj2, /*cpCollisionID*/ id, /*void*/ data) {return id;};

//static void

Leaf.prototype.addPairs = function(/*cpBBTree*/ tree) {
    /*Node*/ var leaf = this;
	/*cpSpatialIndex */ var dynamicIndex = tree.dynamicIndex;
	if(dynamicIndex){
		/*Node */ var dynamicRoot = dynamicIndex.root;
		if(dynamicRoot){
			/*cpBBTree */ var dynamicTree = dynamicIndex;
//			/*MarkContext */ var context = new MarkContext(dynamicTree, null, null, null);
            dynamicRoot.markLeafQuery(leaf, true, dynamicTree, null, null, null);
		}
	} else {
		/*Node */ var staticRoot = tree.staticIndex.root;
//		/*MarkContext */ var context = new MarkContext(tree, staticRoot, VoidQueryFunc, null);
        leaf.markLeaf(tree, staticRoot, VoidQueryFunc, null);
	}
};

//MARK: Memory Management Functions

//cpBBTree *
//cpBBTreeAlloc(void)
//{
//	return /*(cpBBTree *)*/cpcalloc(1, sizeof(cpBBTree));
//}

//static int

//var leafSetEql = function(/*void*/ obj, /*Node*/ node) {
//	return (obj == node.obj);
//};

//static void *

//var leafSetTrans = function(/*void*/ obj, /*cpBBTree*/ tree) {
//	return LeafNew(tree, obj, tree.bbfunc(obj));
//};

//void

BBTree.prototype.setVelocityFunc = function(/*cpBBTreeVelocityFunc*/ func) {
    /*cpSpatialIndex*/ var index = this;

	(/*(cpBBTree *)*/index).velocityFunc = func;
};

//cpSpatialIndex *
//new cpBBTree(cpSpatialIndexBBFunc bbfunc, cpSpatialIndex *staticIndex)
//{
//	return new cpBBTree(cpBBTreeAlloc(), bbfunc, staticIndex);
//}

//static void
//cpBBTreeDestroy(cpBBTree *tree)
//{
//	cpHashSetFree(tree.leaves);
//	
//	if(tree.allocatedBuffers) cpArrayFreeEach(tree.allocatedBuffers, cpfree);
//	cpArrayFree(tree.allocatedBuffers);
//}

//MARK: Insert/Remove

//static void

BBTree.prototype.insert = function(/*void*/ obj, /*cpHashValue*/ hashid) {
    /*cpBBTree*/ var tree = this;

//	/*Node */ var leaf = /*(Node *)*/cpHashSetInsert(tree.leaves, hashid, obj, /*(cpHashSetTransFunc)*/leafSetTrans, tree);
    var leaf = tree.leaves[hashid] = tree.leafFromPool(obj);
    tree.count++;
    /*Node */ var root = tree.root;
	tree.root = root? root.subtreeInsert(leaf, tree) : leaf;

	leaf.STAMP = tree.getMasterTree().stamp;
    leaf.addPairs(tree);
    tree.incrementStamp();
};

//static void

BBTree.prototype.remove = function(/*void*/ obj, /*cpHashValue*/ hashid) {
    /*cpBBTree*/ var tree = this;

//	/*Node */ var leaf = /*(Node *)*/cpHashSetRemove(tree.leaves, hashid, obj);
	var leaf = tree.leaves[hashid];
    delete tree.leaves[hashid];
    tree.count--;
	tree.root = tree.root.subtreeRemove(leaf, tree);
    leaf.pairsClear(tree);
    leaf.recycle(tree);
};

//static cpBool

BBTree.prototype.contains = function(/*void*/ obj, /*cpHashValue*/ hashid) {
    return this.leaves[hashid];
};

//MARK: Reindex

//static void

BBTree.prototype.reindexQuery = function(/*cpSpatialIndexQueryFunc*/ func, /*void*/ data) {
    /*cpBBTree*/ var tree = this;

	if(!tree.root) return;
	
	// LeafUpdate() may modify tree.root. Don't cache it.
    var hashid, leaves = tree.leaves;
    for (hashid in leaves) {
        leaves[hashid].update(tree);
    }
//	cpHashSetEach(tree.leaves, /*(cpHashSetIteratorFunc)*/LeafUpdate, tree);
	
	/*cpSpatialIndex */ var staticIndex = tree.staticIndex;
	/*Node */ var staticRoot = (staticIndex && staticIndex.root);
	
//	/*MarkContext */ var context = new MarkContext(tree, staticRoot, func, data);
    tree.root.markLeaf(tree, staticRoot, func, data);
	if(staticIndex && !staticRoot) /*(cpSpatialIndex *)*/tree.collideStatic(staticIndex, func, data);

    tree.incrementStamp();
};

//static void

BBTree.prototype.reindex = function() {
    /*cpBBTree*/ var tree = this;

	tree.reindexQuery(VoidQueryFunc, null);
};

//static void

BBTree.prototype.reindexObject = function(/*void*/ obj, /*cpHashValue*/ hashid) {
    /*cpBBTree*/ var tree = this;

//	/*Node */ var leaf = /*(Node *)*/cpHashSetFind(tree.leaves, hashid, obj);
    var leaf = tree.leaves[hashid];
	if(leaf){
		if(leaf.update(tree)) leaf.addPairs(tree);
        tree.incrementStamp();
	}
};

//MARK: Query

//static void

BBTree.prototype.segmentQuery = function(/*void*/ obj, /*cpVect*/ a, /*cpVect*/ b, /*cpFloat*/ t_exit, /*cpSpatialIndexSegmentQueryFunc*/ func, /*void*/ data) {
    /*cpBBTree*/ var tree = this;

	/*Node */ var root = tree.root;
	if(root) root.subtreeSegmentQuery(obj, a, b, t_exit, func, data);
};

//static void

BBTree.prototype.query = function(/*void*/ obj, /*cpBB*/ bb, /*cpSpatialIndexQueryFunc*/ func, /*void*/ data) {
    /*cpBBTree*/ var tree = this;

	if(tree.root) tree.root.subtreeQuery(obj, bb, func, data);
};

//MARK: Misc

//static int

BBTree.prototype.count = function() {
    return this.count;
//	return cpHashSetCount(tree.leaves);
};

////typedef struct
//var eachContext = function(
//	/*cpSpatialIndexIteratorFunc*/ func,
//	/*void*/ data
//) {
//    this.func = func;
//    this.data = data;
//};

//static void 
//var each_helper = function(/*Node*/ node, /*eachContext*/ context) {context.func(node.obj, context.data);};

//static void

BBTree.prototype.each = function(/*cpSpatialIndexIteratorFunc*/ func, /*void*/ data) {
    /*cpBBTree*/ var tree = this;

//	/*eachContext */ var context = new eachContext(func, data);
//	cpHashSetEach(tree.leaves, /*(cpHashSetIteratorFunc)*/each_helper, context);
    var hashid, leaves = tree.leaves;
    for (hashid in leaves) {
        func(leaves[hashid].obj, data);
//        each_helper(tree.leaves[hashid], context);
    }
};

//static cpSpatialIndexClass klass = {
//	/*(cpSpatialIndexDestroyImpl)*/cpBBTreeDestroy,
//	
//	/*(cpSpatialIndexCountImpl)*/cpBBTreeCount,
//	/*(cpSpatialIndexEachImpl)*/cpBBTreeEach,
//	
//	/*(cpSpatialIndexContainsImpl)*/cpBBTreeContains,
//	/*(cpSpatialIndexInsertImpl)*/cpBBTreeInsert,
//	/*(cpSpatialIndexRemoveImpl)*/cpBBTreeRemove,
//	
//	/*(cpSpatialIndexReindexImpl)*/cpBBTreeReindex,
//	/*(cpSpatialIndexReindexObjectImpl)*/cpBBTreeReindexObject,
//	/*(cpSpatialIndexReindexQueryImpl)*/cpBBTreeReindexQuery,
//	
//	/*(cpSpatialIndexQueryImpl)*/cpBBTreeQuery,
//	/*(cpSpatialIndexSegmentQueryImpl)*/cpBBTreeSegmentQuery,
//};


//MARK: Tree Optimization

//static int
//cpfcompare(const cpFloat *a, const cpFloat *b){
//	return (*a < *b ? -1 : (*b < *a ? 1 : 0));
//}

//static void
//fillNodeArray(Node *node, Node ***cursor){
//	(**cursor) = node;
//	(*cursor)++;
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
//	for(/*int*/ var i =1; i<count; i++) bb = bb.merge(nodes[i].bb);
//	
//	// Split it on it's longest axis
//	cpBool splitWidth = (bb.r - bb.l > bb.t - bb.b);
//	
//	// Sort the bounds and use the median as the splitting point
//	cpFloat *bounds = /*(cpFloat *)*/cpcalloc(count*2, sizeof(cpFloat));
//	if(splitWidth){
//		for(/*int*/ var i =0; i<count; i++){
//			bounds[2*i + 0] = nodes[i].bb.l;
//			bounds[2*i + 1] = nodes[i].bb.r;
//		}
//	} else {
//		for(/*int*/ var i =0; i<count; i++){
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
//	for(/*int*/ var left =0; left < right;){
//		Node *node = nodes[left];
//		if(node.bb.mergedArea(b) < node.bb.mergedArea(a)){
////		if(node.bb.proximity(b) < node.bb.proximity(a)){
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
//		for(/*int*/ var i =0; i<count; i++) node = SubtreeInsert(node, nodes[i], tree);
//		return node;
//	}
//	
//	// Recurse and build the node!
//	return NodeNew(tree,
//		partitionNodes(tree, nodes, right),
//		partitionNodes(tree, nodes + right, count - right)
//	);
//}

//static void
//cpBBTreeOptimizeIncremental(cpBBTree *tree, int passes)
//{
//	for(/*int*/ var i =0; i<passes; i++){
//		Node *root = tree.root;
//		Node *node = root;
//		int bit = 0;
//		unsigned int path = tree.opath;
//		
//		while(!NodeIsLeaf(node)){
//			node = (path&(1<<bit) ? node.a : node.b);
//			bit = (bit + 1)&(sizeof(unsigned int)*8 - 1);
//		}
//		
//		root = subtreeRemove(root, node, tree);
//		tree.root = subtreeInsert(root, node, tree);
//	}
//}

//void
//cpBBTreeOptimize(cpSpatialIndex *index)
//{
//	if(index != &klass){
//		cpAssertWarn(false, "Ignoring cpBBTreeOptimize() call to non-tree spatial index.");
//		return;
//	}
//	
//	cpBBTree *tree = /*(cpBBTree *)*/index;
//	Node *root = tree.root;
//	if(!root) return;
//	
//	int count = tree.count();
//	Node **nodes = (Node **)cpcalloc(count, sizeof(Node *));
//	Node **cursor = nodes;
//	
//	cpHashSetEach(tree.leaves, /*(cpHashSetIteratorFunc)*/fillNodeArray, &cursor);
//	
//	SubtreeRecycle(tree, root);
//	tree.root = partitionNodes(tree, nodes, count);
//	cpfree(nodes);
//}

//MARK: Debug Draw

//#define CP_BBTREE_DEBUG_DRAW
//if ('undefined' != typeof CP_BBTREE_DEBUG_DRAW) {
////#include "OpenGL/gl.h"
////#include "OpenGL/glu.h"
////#include <GLUT/glut.h>
//
////static void
//
//var NodeRender = function(/*Node*/ node, /*int*/ depth) {
//	if(!NodeIsLeaf(node) && depth <= 10){
//		NodeRender(node.a, depth + 1);
//		NodeRender(node.b, depth + 1);
//	}
//
//	/*cpBB */ var bb = node.bb;
//
////	/*GLfloat */ var v = depth/2.0;
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
//};
//
////void
//
//cpBBTree.prototype.renderDebug = function() {
//    /*cpSpatialIndex*/ var index = this;
//
//	if(index != klass){
//		cpAssertWarn(false, "Ignoring cpBBTreeRenderDebug() call to non-tree spatial index.");
//		return;
//	}
//
//	/*cpBBTree */ var tree = /*(cpBBTree *)*/index;
//	if(tree.root) NodeRender(tree.root, 0);
//};
//}
