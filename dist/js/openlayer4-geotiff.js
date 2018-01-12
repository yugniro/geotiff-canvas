/**
 * GeoTiff file to open layer canvas parser
 * @source https://github.com/yugniro/geotiff-canvas
 * @fork https://github.com/xlhomme/GeotiffParser.js
 * Code refactored & updated by: Pyatinskiy M., 2018 &copy
 * @param map
 * @param url
 * @param options
 * @constructor
 */
function GeoCanvas(map, url, options) {
    this.map = map;
    this.url = url;
    this.options = options;

    var self = this;

    this.init = function() {
        if (!this.options.opacity)
            this.options.opacity = 1;

        self.make();
    };

    this.make = function() {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() {
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                self.parseTiff(anHttpRequest.response);
        };

        anHttpRequest.open( "GET", this.url, true );
        anHttpRequest.responseType = 'arraybuffer';
        anHttpRequest.send(null);
    };

    this.parseTiff = function (bytes) {
        var parser = new GeotiffParser();

        // parseHeader to read TIff / Geotiff parameters
        parser.parseHeader(bytes);

        // Write some Geotiff parameter on the console for debug
        parser.consoleTiffProperty();

        // If a GeoTiff retrieve the BBOX
        if (!parser.isGeotiff())
            throw TypeError("Not a Geotiff data");

        // Get the reference system
        // Limit the reference system to projection handled by OL3

        var pCRS = parser.getCRSCode();
        if (pCRS != 4326 && pCRS != 3857 && pCRS != 102113 /*old 3857 */)
            throw TypeError("This reference system is not handled : use proj4js in conjunction to OL3 and GeotiffParser" + pCRS);


        // Get the BBOX of the Geotiff
        var ul = parser.ImageToPCS(0, 0);
        var ur = parser.ImageToPCS(parser.imageWidth, 0);
        var ll = parser.ImageToPCS(0, parser.imageLength);
        var lr = parser.ImageToPCS(parser.imageWidth, parser.imageLength);
        if (ul[0] != 1 || ur[0] != 1 || ll[0] != 1 || lr[0] != 1) {
            throw TypeError("BBox error");
        }

        // Create the BBox structure and call the display in a Canvas Function
        var lcoordinates = [];
        lcoordinates.push(ul.splice(1, 2));
        lcoordinates.push(ur.splice(1, 2));
        lcoordinates.push(lr.splice(1, 2));
        lcoordinates.push(ll.splice(1, 2));

        var projstring = 'EPSG:' + pCRS.toString();

        var bbox = {
            'WKID': projstring,
            'coord': lcoordinates
        };
        self.addCanvasLayer(parser, bbox);
    };

    this.addCanvasLayer = function(parser, bbox) {
        // This is the projection of the view
        // we need to project or Geotiff in this projection (if needed)
        var projOfView = map.getView().getProjection().getCode();

        var canvasFunction = function (extent, resolution, pixelRatio, size, projection) {
            // Issue with OL3 v3.0.0
            // Part of this code is found in the OpenLayers 3 Book but
            // seems to have some bug in it rotation is not well handled
            //
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            var canvasWidth = size[0], canvasHeight = size[1];
            canvas.setAttribute('width', canvasWidth);
            canvas.setAttribute('height', canvasHeight);

            // Canvas extent is different than map extent, so compute delta between
            // left-top of map and canvas extent.
            var mapExtent = map.getView().calculateExtent(map.getSize());
            //console.log("ViewExtent :",  mapExtent);

            var canvasOrigin = map.getPixelFromCoordinate([extent[0], extent[3]]);
            var mapOrigin = map.getPixelFromCoordinate([mapExtent[0], mapExtent[3]]);
            var delta = [mapOrigin[0] - canvasOrigin[0], mapOrigin[1] - canvasOrigin[1]];

            //drawBBox(projOfView, bbox, delta, context)
            self.drawImage(parser, projOfView, bbox, delta, context);
            return canvas;
        };

        // Define the canvas Layer ad add it to the map
        var canvasLayer = new ol.layer.Image({
            source: new ol.source.ImageCanvas({
                canvasFunction: canvasFunction,
                projection: projOfView
            })
        });

        map.addLayer(canvasLayer);
    };

    // draw output canvas
    this.drawImage = function(parser, in_proj, in_bbox, in_delta, in_context) {
        // Get some Information form HTML document ---> use MVVM instead
        var useMinMax = false;
        var MinMaxCb = document.getElementById("MixMaxCb");
        var MinMaxValue = [];
        if (MinMaxCb != null && MinMaxCb != 'undefined' && MinMaxCb.checked == true) {
            useMinMax = true;
            MinMaxValue[0] = document.getElementById("MinValueOfMinMax").value;
            MinMaxValue[1] = document.getElementById("MaxValueOfMinMax").value;
        }

        var points = in_bbox.coord;
        if (in_bbox.WKID != in_proj) {
            //console.log("transfo : " + in_bbox.WKID);
            for (var i = 0; i < points.length; i++)
                points[i] = ol.proj.transform(in_bbox.coord[i], in_bbox.WKID, in_proj);
            in_bbox.WKID = in_proj;
        }

        var pixelUL = map.getPixelFromCoordinate(points[0]);
        pixelUL[0] = Math.ceil(pixelUL[0] + in_delta[0]);
        pixelUL[1] = Math.ceil(pixelUL[1] + in_delta[1]);

        var pixelLR = map.getPixelFromCoordinate(points[2]);
        pixelLR[0] = Math.floor(pixelLR[0] + in_delta[0]);
        pixelLR[1] = Math.floor(pixelLR[1] + in_delta[1]);
        //console.log("drawImage",pixelUL,pixelLR);
        var pCRS = parser.getCRSCode();
        var projstring = 'EPSG:' + pCRS.toString();

        in_context.fillStyle = parser.makeRGBAFillValue(255, 255, 255, 0);
        var red = 255;
        var green = 0;
        var blue = 0;
        var opacity = this.options.opacity;
        var opacityError = 1;
        for (var y = pixelUL[1]; y < pixelLR[1]; y++) {
            var imy = y - in_delta[1];
            for (var x = pixelUL[0]; x < pixelLR[0]; x++) {
                var imx = x - in_delta[0];
                var mapCoord = map.getCoordinateFromPixel([imx, imy]);
                var pmapCoord;
                if (projstring != in_proj)
                    pmapCoord = ol.proj.transform(mapCoord, in_proj, projstring);
                else
                    pmapCoord = mapCoord;
                var imageCoord = parser.PCSToImage(pmapCoord[0], pmapCoord[1]);
                if (imageCoord[0] == 1) {
                    var pixSample = parser.getPixelValueOnDemand(imageCoord[1], imageCoord[2]);
                    if (pixSample != null) {
                        if (useMinMax == true)
                            pixrgba = parser.getMinMaxPixelValue(pixSample, MinMaxValue[0], MinMaxValue[1]);
                        else
                            pixrgba = parser.getRGBAPixelValue(pixSample);
                        in_context.fillStyle = parser.makeRGBAFillValue(pixrgba[0], pixrgba[1], pixrgba[2], opacity);
                    }
                    else
                        in_context.fillStyle = parser.makeRGBAFillValue(red, green, blue, opacityError);
                }
                else {
                    in_context.fillStyle = parser.makeRGBAFillValue(red, green, blue, opacityError);
                }
                in_context.fillRect(x, y, 1, 1);
            }
        }
    }
}