'use strict'

module.exports = findMedian

var INSERT_SORT_CUTOFF = 8   //Cut off for using insertion sort in findMedian

function boxDistance(i, points, x, y) {
  return Math.max(Math.abs(points[2*i] - x), Math.abs(points[2*i+1] - y))
}

//Base case for median finding:  Use insertion sort
function insertionSort(points, ids, start, end, x, y) {
  for(var i=start+1; i<end; ++i) {
    var x   = points[2*i]
    var y   = points[2*i+1]
    var id  = ids[i]

    for(var j=i; j>start; --j) {

      points[2*j] =

      var aPtr = ptr
      var bPtr = ptr+elemSize
      for(var k=0; k<elemSize; ++k, ++aPtr, ++bPtr) {
        var y = boxes[aPtr]
        boxes[aPtr] = boxes[bPtr]
        boxes[bPtr] = y
      }
      var tmp = ids[j]
      ids[j] = ids[j-1]
      ids[j-1] = tmp
    }
  }
}

function partitionStartLessThan(points, ids, start, end, value, x, y) {
  //TODO
}


//Find median using quick select algorithm
//  takes O(n) time with high probability
function findMedian(points, ids, start, end, x, y) {
  if(end <= start+1) {
    return start
  }

  var lo       = start
  var hi       = end
  var mid      = ((end + start) >>> 1)
  var pivot    = mid
  var value    = boxDistance(mid, points, x, y)

  while(lo < hi) {
    if(hi - lo < INSERT_SORT_CUTOFF) {
      insertionSort(points, ids, lo, hi, x, y)
      value = boxDistance(mid, points, x, y)
      break
    }

    //Select pivot using median-of-3
    var count  = hi - lo
    var pivot0 = (Math.random()*count+lo)|0
    var value0 = boxDistance(pivot0, points, x, y)
    var pivot1 = (Math.random()*count+lo)|0
    var value1 = boxDistance(pivot1, points, x, y)
    var pivot2 = (Math.random()*count+lo)|0
    var value2 = boxDistance(pivot2, points, x, y)
    if(value0 <= value1) {
      if(value2 >= value1) {
        pivot = pivot1
        value = value1
      } else if(value0 >= value2) {
        pivot = pivot0
        value = value0
      } else {
        pivot = pivot2
        value = value2
      }
    } else {
      if(value1 >= value2) {
        pivot = pivot1
        value = value1
      } else if(value2 >= value0) {
        pivot = pivot0
        value = value0
      } else {
        pivot = pivot2
        value = value2
      }
    }

    //Swap pivot to end of array
    var ax              = points[2*pivot]
    var ay              = points[2*pivot+1]
    points[2*pivot]     = points[2*(hi-1)]
    points[2*pivot+1]   = points[2*(hi-1)+1]
    points[2*(hi-1)]    = ax
    points[2*(hi-1)+1]  = ay
    var aid             = ids[pivot]
    ids[pivot]          = ids[hi-1]
    ids[hi-1]           = aid

    //Partition using pivot
    pivot = partitionStartLessThan(
      points, ids,
      lo, hi-1,
      value,
      x, y)

    //Swap pivot back
    var ax              = points[2*pivot]
    var ay              = points[2*pivot+1]
    points[2*pivot]     = points[2*(hi-1)]
    points[2*pivot+1]   = points[2*(hi-1)+1]
    points[2*(hi-1)]    = ax
    points[2*(hi-1)+1]  = ay
    var aid             = ids[pivot]
    ids[pivot]          = ids[hi-1]
    ids[hi-1]           = aid

    //Swap pivot to last pivot
    if(mid < pivot) {
      hi = pivot-1
      while(lo < hi &&
        boxDistance(hi-1, points, ids, x, y) === value) {
        hi -= 1
      }
      hi += 1
    } else if(pivot < mid) {
      lo = pivot + 1
      while(lo < hi &&
        boxDistance(lo, points, ids, x, y) === value) {
        lo += 1
      }
    } else {
      break
    }
  }

  return partitionStartLessThan(
    points, ids,
    lo, mid,
    value,
    x, y)
}
