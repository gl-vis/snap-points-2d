'use strict'

let getBounds = require('array-bounds')
let sort = require('./sort')

module.exports = snapPoints

function snapPoints(srcPoints, bounds) {
  let n = srcPoints.length >>> 1
  if(n < 1) {
    return {levels: [], ids: null, weights: null, points: srcPoints}
  }

  let points = new Float64Array(n * 2)

  if (!bounds) bounds = []

  let ids = new Uint32Array(n)
  let weights = new Uint32Array(n)
  let levels = new Uint8Array(n)

  for(let i=0; i < n; ++i) {
    ids[i] = i
  }

  // empty bounds or invalid bounds are considered as undefined and require recalc
  if (!bounds.length || bounds.length < 4 || bounds[0] >= bounds[2] || bounds[1] >= bounds[3]) {
    let b = getBounds(srcPoints, 2)

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

  let lox = bounds[0]
  let loy = bounds[1]
  let hix = bounds[2]
  let hiy = bounds[3]

  // Calculate diameter
  let scaleX = 1.0 / (hix - lox)
  let scaleY = 1.0 / (hiy - loy)
  let diam = Math.max(hix - lox, hiy - loy)

  // normalize values
  for (let i = 0; i < n; i++) {
    points[2*i]   = (srcPoints[2*i]   - lox) * scaleX
    points[2*i+1] = (srcPoints[2*i+1] - loy) * scaleY
  }

  // Rearrange in quadtree order
  let ptr = 0

  let a = new Uint32Array(n), b = new Uint32Array(n), c = new Uint32Array(n), d = new Uint32Array(n)

  snapRec(0, 0, 1, 0, n, 0)

  function snapRec(lx, ly, diam, start, end, level) {
    let diam_2 = diam * 0.5
    let offset = start + 1
    let count = end - start
    weights[ptr] = count
    levels[ptr++] = level

    // for(let i=0; i<2; ++i) {
    //   for(let j=0; j<2; ++j) {
    //     let lox = x+i*diam_2
    //     let loy = y+j*diam_2
    //     let hix = lox + diam_2
    //     let hiy = loy + diam_2

    //     let mid = partition(
    //         points
    //       , ids
    //       , offset
    //       , end
    //       , lox, loy
    //       , hix, hiy)

    //     if(mid === offset) continue
    //     snapRec(lox, loy, diam_2, offset, mid, level+1)
    //     offset = mid
    //   }
    // }
    let aoff = 0, boff = 0, coff = 0, doff = 0

    let cx = lx + diam_2, cy = ly + diam_2

    for (let i = offset; i < end; i++) {
      let id = ids[i]
      let x  = points[2*id]
      let y  = points[2*id+1]

      if (x < cx) {
        if (y < cy) a[aoff++] = id
        else b[boff++] = id
      }
      else {
        if (y < cy) c[coff++] = id
        else d[doff++] = id
      }
    }

    let a0 = offset, a1 = offset + aoff,
        b0 = a1, b1 = b0 + boff,
        c0 = b1, c1 = c0 + coff,
        d0 = c1, d1 = d0 + doff

    if (a1 > a0) {
      ids.set(a.subarray(0, aoff), a0)
      snapRec(lx, ly, diam_2, a0, a1, level + 1)
    }
    if (b1 > b0) {
      ids.set(b.subarray(0, boff), b0)
      snapRec(lx, cy, diam_2, b0, b1, level + 1)
    }
    if (c1 > c0) {
      ids.set(c.subarray(0, coff), c0)
      snapRec(cx, ly, diam_2, c0, c1, level + 1)
    }
    if (d1 > d0) {
      ids.set(d.subarray(0, doff), d0)
      snapRec(cx, cy, diam_2, d0, d1, level + 1)
    }
  }

  function partition(points, ids, start, end, lox, loy, hix, hiy) {
    let mid = start
    for(let i=start; i < end; ++i) {
      let x  = points[2*i]
      let y  = points[2*i+1]
      let s  = ids[i]
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

  // sort by levels with accordance to x-coordinate
  let result = sort(levels, points, ids, weights, n)

  // form levels of details
  let lod         = []
  let lastLevel   = 0
  let prevOffset  = n
  let level
  for(let ptr=n-1; ptr>=0; --ptr) {
    level = result.levels[ptr]
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

  result.levels = lod

  return result
}
