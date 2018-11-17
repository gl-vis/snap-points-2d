# snap-points-2d

Runs iterative snap rounding on a set of 2D coordinates to produce a hierarchical level of detail for optimizing online rendering of huge 2D plots.

# Install

```
npm i snap-points-2d
```

# API

#### `{levels, ids, weights, points} = require('snap-points-2d')(points, bounds?)`

Reorders the `points` hierarchically such that those which are drawn at the same pixel coordinate are grouped together.

##### Inputs
* `points` is an input array of 2*n coordinate values. It is kept untouched.
* `bounds` is an optional array of 4 bounding box values of the points.

##### Outputs
* `points` is an output float64 array with reordered an normalized to `bounds` point values.
* `ids` is an output uint32 array which gets the reordered index of the points.
* `weights` is an output uint32 array of point weights (number of points at the same pixel), which can be used for transparent rendering.
* `levels` is an array of LOD scales.  Each record is an object with the following properties:
	* `pixelSize` the pixel size of this level of detail in data units
	* `offset` the offset of this lod within the output array
	* `count` the number of items in the lod

# License
(c) 2015 Mikola Lysenko. MIT License
