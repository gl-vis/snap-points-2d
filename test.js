'use strict'

var t = require('tape')
var snap = require('./snap')
var approxEqual = require('almost-equal')


t.only('snap-points-2d', t => {
  function verifySnap(points) {
    var numPoints = points.length>>>1
    var npoints   = points.slice()
    var bounds    = []

    var {levels, ids, weights} = snap(npoints, bounds)

    var sx = bounds[0]
    var sy = bounds[1]
    var sw = bounds[2] - bounds[0]
    var sh = bounds[3] - bounds[1]

    for(var i=0; i<numPoints; ++i) {
      var id = ids[i]
      t.ok(approxEqual(sx + sw*npoints[2*i],   points[2*id], approxEqual.FLT_EPSILON),
        'id perm ok: ' + id + ' ' +  points[2*id] + ' = ' + (sx + sw*npoints[2*i]))
      t.ok(approxEqual(sy + sh*npoints[2*i+1], points[2*id+1], approxEqual.FLT_EPSILON), 'id perm ok: ' + id + ' ' +  points[2*id+1] + ' = ' + (sy + sh*npoints[2*i+1]))
    }

    t.equals(levels[levels.length-1].offset, 0, 'last item')
    t.equals(levels[0].offset+levels[0].count, numPoints, 'first item')

    for(var i=0; i<levels.length; ++i) {
      var s = levels[i]

      var r = s.pixelSize
      var offs  = s.offset
      var count = s.count

      console.log('level=', i, r, offs, count)

      if(i > 0) {
        t.equals(offs+count, levels[i-1].offset, 'offset for ' + i)
        t.ok(r < levels[i-1].pixelSize, 'test scales ok')
      }
  k_loop:
      for(var k=offs-1; k>=0; --k) {
        var ax = npoints[2*k]
        var ay = npoints[2*k+1]

        var mind = Infinity

        for(var j=offs; j<offs+count; ++j) {
          var x = npoints[2*j]
          var y = npoints[2*j+1]

          mind = Math.min(mind, Math.max(Math.abs(ax-x), Math.abs(ay-y)))
        }

        t.ok(mind <= 2.0 * r, k + ':' + ax + ',' + ay + ' is not covered - closest pt = ' + mind)
      }
    }
  }

  verifySnap([
     1, 1,
     2, 2,
     3, 3,
     4, 4,
     5, 5])

  verifySnap([
    0,0,
    0,0,
    0,0,
    0,0])

  verifySnap([
    1, 2,
    2, 5,
    3, 6,
    4, -1
  ])

  var pts = new Array(100)
  for(var i=0; i<100; ++i) {
    pts[i] = Math.random()
  }
  verifySnap(pts)

  t.end()
})


t('no arguments', t => {
  var levels = snap([0,0, 1,1, 2,2])

  t.end()
})

t('larger bounds', t => {
  var pos = [0,0, 1,1, 2,2, 3,3, 4,4]

  var {levels} = snap(pos.slice(), [0,0,4,4])
  t.deepEqual(levels, [
      {pixelSize: 2, offset: 4, count: 1},
      {pixelSize: 1, offset: 2, count: 2},
      {pixelSize: 0.5, offset: 0, count: 2}
  ])

  var {levels} = snap(pos.slice(), [0,0,40,40])

  t.deepEqual(levels, [
    {pixelSize: 20, offset: 4, count: 1},
    {pixelSize: 10, offset: 3, count: 1},
    {pixelSize: 5, offset: 2, count: 1},
    {pixelSize: 2.5, offset: 1, count: 1},
    {pixelSize: 1.25, offset: 0, count: 1}
  ])

  t.end()
})

t('basics', t => {
  let {levels, points, ids, weights} = snap([0,0,1,1,2,2,3,3,4,4])

  t.deepEqual(points, [0.5, 0.5, 1, 1, 0.25, 0.25, 0.75, 0.75, 0, 0])
  t.deepEqual(ids, [2, 4, 1, 3, 0])
  t.deepEqual(weights, [1, 1, 2, 2, 5])
  t.deepEqual(levels, [
    {pixelSize: 2, offset: 4, count: 1},
    {pixelSize: 1, offset: 2, count: 2},
    {pixelSize: 0.5, offset: 0, count: 2}
  ])
})

t.skip('performance', t => {
  let N = 1e6
  let points = new Float64Array(N)

  for (let i = 0; i < N; i++) {
    points[i] = Math.random()
  }

  console.time(1)
    snap(points)
  console.timeEnd(1)

  t.end()
})
