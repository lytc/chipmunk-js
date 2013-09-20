//void
var cpArrayDeleteObj = function (/*cpArray*/ arr, /*void*/ obj) {
    var index = arr.indexOf(obj)
    if (-1 != index) {
        arr[index] = arr[arr.length - 1];
        arr.pop()
//        arr.splice(index, 1)
    }
}