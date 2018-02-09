'use strict'

var sortLevels = require('./lib/sort')
var getBounds = require('array-bounds')

module.exports = snapPoints

function snapPoints(points, bounds) {
  var n = points.length >>> 1
  if(n < 1) {
    return {levels: [], ids: null, weights: null}
  }

  if (!bounds) bounds = []

  var ids = new Uint32Array(n)
  var weights = new Uint32Array(n)
  var levels = new Uint8Array(n)

  for(var i=0; i<n; ++i) {
    ids[i] = i
  }

  // empty bounds or invalid bounds are considered as undefined and require recalc
  if (!bounds.length || bounds.length < 4 || bounds[0] >= bounds[2] || bounds[1] >= bounds[3]) {
    var b = getBounds(points, 2)

    if(b[0] === b[2]) {
      b[2] += 1
    }
    if(b[1] === b[3]) {
      b[3] += 1
    }

    bounds[0] = b[0]
    bounds[1] = b[1]
    bounds[2] = b[2]
    bounds[3] = b[3]
  }

  var lox = bounds[0]
  var loy = bounds[1]
  var hix = bounds[2]
  var hiy = bounds[3]

  //Calculate diameter
  var scaleX = 1.0 / (hix - lox)
  var scaleY = 1.0 / (hiy - loy)
  var diam = Math.max(hix - lox, hiy - loy)


  var ptr = 0

  function snapRec(x, y, diam, start, end, level) {
    var diam_2 = diam * 0.5
    var offset = start + 1
    var count = end - start
    weights[ptr] = count
    levels[ptr++] = level
    for(var i=0; i<2; ++i) {
      for(var j=0; j<2; ++j) {
        var nx = x+i*diam_2
        var ny = y+j*diam_2
        var nextOffset = partition(
            points
          , ids
          , offset
          , end
          , nx, ny
          , nx+diam_2, ny+diam_2)
        if(nextOffset === offset) {
          continue
        }
        snapRec(nx, ny, diam_2, offset, nextOffset, level+1)
        offset = nextOffset
      }
    }
  }
  snapRec(lox, loy, diam, 0, n, 0)

  // normalize values
  for (var i = 0; i < n; i++) {
    points[2*i]   = (points[2*i]   - lox) * scaleX
    points[2*i+1] = (points[2*i+1] - loy) * scaleY
  }

  // pack levels: uint8, x-coord: uint16 and id: uint32 to float64

  var packed = new Float64Array(n)
  var packedInt = new Uint32Array(packed.buffer)

  for (var i = 0; i < n; i++) {
    packedInt[i * 2] = i
    packedInt[i * 2 + 1] = (0x3ff00000 & (levels[i] << 20) | 0x0000ffff & ((1 - points[i * 2]) * 0xffff))
  }

  // do native sort
  packed.sort()

  // unpack data back
  var sortedLevels = new Uint8Array(n)
  var sortedWeights = new Uint32Array(n)
  var sortedIds = new Uint32Array(n)
  var sortedPoints = new Float64Array(n * 2)
  for (var i = 0; i < n; i++) {
    var id = packedInt[(n - i - 1) * 2]
    sortedLevels[i] = levels[id]
    sortedWeights[i] = weights[id]
    sortedIds[i] = ids[id]
    sortedPoints[i * 2] = points[id * 2]
    sortedPoints[i * 2 + 1] = points[id * 2 + 1]
  }
  levels = sortedLevels
  points = sortedPoints
  ids = sortedIds
  weights = sortedWeights

  // sortLevels(levels, points, ids, weights, n)


  var lod         = []
  var lastLevel   = 0
  var prevOffset  = n
  for(var ptr=n-1; ptr>=0; --ptr) {
    var level = levels[ptr]
    if(level === lastLevel) {
      continue
    }

    lod.push({
      pixelSize: diam * Math.pow(0.5, level),
      offset: ptr+1,
      count: prevOffset - (ptr+1)
    })
    prevOffset = ptr+1

    lastLevel = level
  }

  lod.push({
    pixelSize: diam * Math.pow(0.5, level+1),
    offset: 0,
    count: prevOffset
  })

  return {
    points: points,
    levels: lod,
    ids: ids,
    weights: weights
  }
}

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
