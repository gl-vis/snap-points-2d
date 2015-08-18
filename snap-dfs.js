'use strict'

var pool = require('typedarray-pool')

var sortLevels = require('./lib/sort')
var findCut    = require('./lib/median')

module.exports = snapPoints

function partition(points, ids, start, end, lox, loy, hix, hiy) {
  var mid = start
  for(var i=start; i<end; ++i) {
    var x  = points[2*i]
    var y  = points[2*i+1]
    var s  = ids[i]
    if(lox <= x && x <= hix &&
       loy <= y && y <= hiy) {
      if(i === mid) {
        mid += 1
      } else {
        points[2*i]     = points[2*mid]
        points[2*i+1]   = points[2*mid+1]
        ids[i]          = ids[mid]
        points[2*mid]   = x
        points[2*mid+1] = y
        ids[mid]        = s
        mid += 1
      }
    }
  }
  return mid
}

function SnapInterval(pixelSize, offset, count) {
  this.pixelSize  = pixelSize
  this.offset     = offset
  this.count      = count
}

function snapPoints(points, ids, bounds) {
  var n    = points.length >>> 1
  if(n < 1) {
    return []
  }

  var lox =  Infinity, loy =  Infinity
  var hix = -Infinity, hiy = -Infinity
  for(var i=0; i<n; ++i) {
    var x = points[2*i]
    var y = points[2*i+1]
    lox = Math.min(lox, x)
    hix = Math.max(hix, x)
    loy = Math.min(loy, y)
    hiy = Math.max(hiy, y)
    ids[i] = i
  }

  //Calculate diameter
  var scaleX = 1.0 / (hix - lox)
  var scaleY = 1.0 / (hiy - loy)
  var diam = Math.max(hix - lox, hiy - loy)

  bounds = bounds || [0,0,0,0]

  bounds[0] = lox
  bounds[1] = loy
  bounds[2] = hix
  bounds[3] = hiy

  var levels = pool.mallocInt32(n)
  var ptr = 0

  //TODO: Cut out block of points
  function cutBlock(points, ids, start, end, diam, level) {
    var cutPoint = findCut(points, ids, start, end)
    var cutRadius = Math.max(Math.abs(points[2*start]   - points[2*cutPoint]),
                             Math.abs(points[2*start+1] - points[2*cutPoint+1]))
    if(cutRadius === 0) {
      for(var i=start; i<cutPoint; ++i) {
        levels[i] = level++
      }
      return cutPoint
    }
    var cutScale = diam
    var ptr = start
    while(0.5*cutScale >= cutRadius && ptr < cutPoint) {
      levels[ptr++] = level++
      cutScale *= 0.5
    }
    if(ptr < cutPoint) {
      var lowX = Infinity
      var lowY = -Infinity
      levels[ptr++] = level++
      for(var i=ptr; i<cutPoint; ++i) {
        lowX = Math.min(lowX, points[2*i])
        lowY = Math.min(lowY, points[2*i+1])
      }
      if(ptr < cutPoint) {
        snapRec(lowX, lowY, cutScale, ptr, cutPoint, level)
      }
    }
    return cutPoint
  }

  function snapRec(x, y, diam, start, end, level) {
    var diam_2 = diam * 0.5
    var offset = start + 1
    var count = end - start
    levels[ptr++] = level
    for(var i=0; i<2; ++i) {
      for(var j=0; j<2; ++j) {
        var nx = x+i*diam_2
        var ny = y+j*diam_2
        var nextOffset = partition(points, ids, offset, end, nx, ny, nx+diam_2, ny+diam_2)
        if(nextOffset - offset >= Math.max(0.9 * count, 32)) {

          //Use linear time partition algorithm
          console.log("BAD CASE", count)
          offset = cutBlock(points, ids, offset, nextOffset, diam_2, level+1))
        }
        if(nextOffset === offset) {
          continue
        }
        snapRec(nx, ny, diam_2, offset, nextOffset, level+1)
        offset = nextOffset
      }
    }
  }
  snapRec(lox, loy, diam, 0, n, 0)
  sortLevels(levels, points, ids, n)

  var lod = []
  var lastLevel = 0
  for(var ptr=n-1; ptr>=0; --ptr) {
    points[2*ptr]   = (points[2*ptr]   - lox) * scaleX
    points[2*ptr+1] = (points[2*ptr+1] - loy) * scaleY

    var level = levels[ptr]
    if(level === lastLevel) {
      continue
    }

    lod.push(new SnapInterval(
      diam * Math.pow(0.5, level),
      ptr + 1,
      n - ptr - 1
    ))

    lastLevel = level
  }
  lod.push(new SnapInterval(diam * Math.pow(0.5, level+1), 0, n))
  pool.free(levels)

  return lod
}
