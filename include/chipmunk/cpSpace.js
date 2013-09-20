/// returns true from inside a callback and objects cannot be added/removed.
//static inline cpBool
Space.prototype.isLocked = function () {
    return this.locked;
};
