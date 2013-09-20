(function() {
    var Base = Demo.Base = function() {
        this.space = new cp.Space()
        window.space = this.space
    }

    Base.prototype = {
        steps: 1 // 1/60
        ,update: function(/*double*/ dt) {
            this.space.step(dt);
        }
    }

    Base.extend = function(child, overrides) {
        if (!overrides) {
            overrides = child
            child = overrides.constructor !== Object.prototype.constructor? overrides.constructor : function() {
                Base.apply(this, arguments)
            }

            delete overrides.constructor
        }

        // extend static
        var parent = this;
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

        Demo.add(child)
        return child
    }

})(this)