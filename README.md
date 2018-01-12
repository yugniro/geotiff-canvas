## Geotiff-canvas

Geotiff-canvas - openlayer4 library for real-time draw .tif (.tiff) images from qgis/arcgis/etc raster layer export on web map. Library parse geotiff image binary and add canvas layer on map in real time.

![Alt text](demo.png?raw=true "Example image")

### Live demo
[Open Web Demo](https://yugniro.github.io/geotiff-canvas/example.html)

### Requirement
 - [OpenLayers4](https://openlayers.org/)

### Use example

The first you should import libraries in header:

```html
<script src="dist/js/geotiff-format-parser.js"></script>
<script src="dist/js/openlayer4-geotiff.js"></script>
```

and then after ```map``` openlayer object is initialized you should make:
```javascript
var layer = new GeoCanvas(map, 'binary/kriging-interpolation-qgis.tif', {
    opacity: 0.7
});
layer.init();
```

If you looking for working example look at ```example.html```.

### Browser support
  - Chrome >= 50
  - Firefox
  - IE >= 11
  - Edge >= 40
  - Safari >= 11
 
 ### Author
 Pyatinskiy Mihail, 2018.
 
 ### License
MIT License

Copyright (c) 2018 YugNIRO

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
