'use strict'

module.exports = sortLevels

var INSERT_SORT_CUTOFF = 32

function sortLevels(data_levels, data_points, data_ids, n0) {
  if (n0 <= 4*INSERT_SORT_CUTOFF) {
    insertionSort(0, n0 - 1, data_levels, data_points, data_ids)
  } else {
    quickSort(0, n0 - 1, data_levels, data_points, data_ids)
  }
}

function insertionSort(left, right, data_levels, data_points, data_ids) {
  for(var i=left+1; i<=right; ++i) {
    var a_level = data_levels[i]
    var a_x     = data_points[2*i]
    var a_y     = data_points[2*i+1]
    var a_id    = data_ids[i]

    var j = i
    while(j > left) {
      var b_level = data_levels[j-1]
      if(b_level >= a_level) {
        break
      }
      data_levels[j]      = b_level
      data_points[2*j]    = data_points[2*(j-1)]
      data_points[2*j+1]  = data_points[2*j-1]
      data_ids[j]         = data_ids[j-1]
      j -= 1
    }

    data_levels[j]     = a_level
    data_points[2*j]   = a_x
    data_points[2*j+1] = a_y
    data_ids[j]        = a_id
  }
}

function swap(i, j, data_levels, data_points, data_ids) {
  var a_level = data_levels[i]
  var a_x     = data_points[2*i]
  var a_y     = data_points[2*i+1]
  var a_id    = data_ids[i]

  data_levels[i]     = data_levels[j]
  data_points[2*i]   = data_points[2*j]
  data_points[2*i+1] = data_points[2*j+1]
  data_ids[i]        = data_ids[j]

  data_levels[j]     = a_level
  data_points[2*j]   = a_x
  data_points[2*j+1] = a_y
  data_ids[j]        = a_id
}

function move(i, j, data_levels, data_points, data_ids) {
  data_levels[i]     = data_levels[j]
  data_points[2*i]   = data_points[2*j]
  data_points[2*i+1] = data_points[2*j+1]
  data_ids[i]        = data_ids[j]
}

function rotate(i, j, k, data_levels, data_points, data_ids) {
  var a_level = data_levels[i]
  var a_x     = data_points[2*i]
  var a_y     = data_points[2*i+1]
  var a_id    = data_ids[i]

  data_levels[i]     = data_levels[j]
  data_points[2*i]   = data_points[2*j]
  data_points[2*i+1] = data_points[2*j+1]
  data_ids[i]        = data_ids[j]

  data_levels[j]     = data_levels[k]
  data_points[2*j]   = data_points[2*k]
  data_points[2*j+1] = data_points[2*k+1]
  data_ids[j]        = data_ids[k]

  data_levels[k]     = a_level
  data_points[2*k]   = a_x
  data_points[2*k+1] = a_y
  data_ids[k]        = a_id
}

function shufflePivot(
  i, j,
  a_level, a_x, a_y, a_id,
  data_levels, data_points, data_ids) {

  data_levels[i]     = data_levels[j]
  data_points[2*i]   = data_points[2*j]
  data_points[2*i+1] = data_points[2*j+1]
  data_ids[i]        = data_ids[j]

  data_levels[j]     = a_level
  data_points[2*j]   = a_x
  data_points[2*j+1] = a_y
  data_ids[j]        = a_id
}

function compare(i, j, data_levels, data_ids) {
  return ((data_levels[i] - data_levels[j]) || (data_ids[i] - data_ids[j])) < 0
}

function comparePivot(i, level, id, data_levels, data_ids) {
  return ((level - data_levels[i]) || (id - data_ids[i])) < 0
}

function quickSort(left, right, data_levels, data_points, data_ids) {
  var sixth = (right - left + 1) / 6 | 0,
      index1 = left + sixth,
      index5 = right - sixth,
      index3 = left + right >> 1,
      index2 = index3 - sixth,
      index4 = index3 + sixth,
      el1 = index1,
      el2 = index2,
      el3 = index3,
      el4 = index4,
      el5 = index5,
      less = left + 1,
      great = right - 1,
      tmp = 0
  if(compare(el1, el2, data_levels, data_ids)) {
    tmp = el1
    el1 = el2
    el2 = tmp
  }
  if(compare(el4, el5, data_levels, data_ids)) {
    tmp = el4
    el4 = el5
    el5 = tmp
  }
  if(compare(el1, el3, data_levels, data_ids)) {
    tmp = el1
    el1 = el3
    el3 = tmp
  }
  if(compare(el2, el3, data_levels, data_ids)) {
    tmp = el2
    el2 = el3
    el3 = tmp
  }
  if(compare(el1, el4, data_levels, data_ids)) {
    tmp = el1
    el1 = el4
    el4 = tmp
  }
  if(compare(el3, el4, data_levels, data_ids)) {
    tmp = el3
    el3 = el4
    el4 = tmp
  }
  if(compare(el2, el5, data_levels, data_ids)) {
    tmp = el2
    el2 = el5
    el5 = tmp
  }
  if(compare(el2, el3, data_levels, data_ids)) {
    tmp = el2
    el2 = el3
    el3 = tmp
  }
  if(compare(el4, el5, data_levels, data_ids)) {
    tmp = el4
    el4 = el5
    el5 = tmp
  }

  var pivot1_level  = data_levels[el2]
  var pivot1_x      = data_points[2*el2]
  var pivot1_y      = data_points[2*el2+1]
  var pivot1_id     = data_ids[el2]

  var pivot2_level  = data_levels[el4]
  var pivot2_x      = data_points[2*el4]
  var pivot2_y      = data_points[2*el4+1]
  var pivot2_id     = data_ids[el4]

  var ptr0 = el1
  var ptr2 = el3
  var ptr4 = el5
  var ptr5 = index1
  var ptr6 = index3
  var ptr7 = index5

  var level_x = data_levels[ptr0]
  var level_y = data_levels[ptr2]
  var level_z = data_levels[ptr4]
  data_levels[ptr5] = level_x
  data_levels[ptr6] = level_y
  data_levels[ptr7] = level_z

  for (var i1 = 0; i1 < 2; ++i1) {
    var x = data_points[2*ptr0+i1]
    var y = data_points[2*ptr2+i1]
    var z = data_points[2*ptr4+i1]
    data_points[2*ptr5+i1] = x
    data_points[2*ptr6+i1] = y
    data_points[2*ptr7+i1] = z
  }

  var id_x = data_ids[ptr0]
  var id_y = data_ids[ptr2]
  var id_z = data_ids[ptr4]
  data_ids[ptr5] = id_x
  data_ids[ptr6] = id_y
  data_ids[ptr7] = id_z

  move(index2, left, data_levels, data_points, data_ids)
  move(index4, right, data_levels, data_points, data_ids)
  for (var k = less; k <= great; ++k) {
    if (comparePivot(k, pivot1_level, pivot1_id, data_levels, data_ids)) {
      if (k !== less) {
        swap(k, less, data_levels, data_points, data_ids)
      }
      ++less;
    } else {
      if (!comparePivot(k, pivot2_level, pivot2_id, data_levels, data_ids)) {
        while (true) {
          if (!comparePivot(great, pivot2_level, pivot2_id, data_levels, data_ids)) {
            if (--great < k) {
              break;
            }
            continue;
          } else {
            if (comparePivot(great, pivot1_level, pivot1_id, data_levels, data_ids)) {
              rotate(k, less, great, data_levels, data_points, data_ids)
              ++less;
              --great;
            } else {
              swap(k, great, data_levels, data_points, data_ids)
              --great;
            }
            break;
          }
        }
      }
    }
  }
  shufflePivot(left, less-1, pivot1_level, pivot1_x, pivot1_y, pivot1_id, data_levels, data_points, data_ids)
  shufflePivot(right, great+1, pivot2_level, pivot2_x, pivot2_y, pivot2_id, data_levels, data_points, data_ids)
  if (less - 2 - left <= INSERT_SORT_CUTOFF) {
    insertionSort(left, less - 2, data_levels, data_points, data_ids)
  } else {
    quickSort(left, less - 2, data_levels, data_points, data_ids)
  }
  if (right - (great + 2) <= INSERT_SORT_CUTOFF) {
    insertionSort(great + 2, right, data_levels, data_points, data_ids)
  } else {
    quickSort(great + 2, right, data_levels, data_points, data_ids)
  }
  if (great - less <= INSERT_SORT_CUTOFF) {
    insertionSort(less, great, data_levels, data_points, data_ids)
  } else {
    quickSort(less, great, data_levels, data_points, data_ids)
  }
}
