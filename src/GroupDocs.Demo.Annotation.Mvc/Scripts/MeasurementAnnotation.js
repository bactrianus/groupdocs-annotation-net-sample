Raphael.fn.doubleArrow = function (x1, y1, x2, y2) {
    var distance = 7,
        halfDistance = distance / 2,
        angle = Math.atan2(y1 - y2, x1 - x2),
        st = this.set();

    st.push(
        this.path(
                Raphael.format('M{0},{1} L{2},{3} {4},{5}', x1 + distance, y1 - halfDistance, x1, y1, x1 + distance, y1 + halfDistance))
            .transform('R' + Math.round(Raphael.deg(angle - Math.PI)) + ',' + x1 + ',' + y1),
        this.path(
                Raphael.format('M{0},{1} L{2},{3}', x1, y1, x2, y2)),
        this.path(
            Raphael.format('M{0},{1} L{2},{3} {4},{5}', x2 - distance, y2 - halfDistance, x2, y2, x2 - distance, y2 + halfDistance))
            .transform('R' + Math.round(Raphael.deg(angle - Math.PI)) + ',' + x2 + ',' + y2));

    return st;
};

Raphael.fn.ruler = function (x1, y1, x2, y2, scale) {
    var d = 25, textDistance = 10, lineDistance = 8,
        angle = 1.5 * Math.PI - Math.atan2(y1 - y2, x1 - x2),
        angleCos = Math.cos(angle),
        angleSin = Math.sin(angle),
        deltaX = d * angleCos,
        deltaY = d * angleSin,
        lineDeltaX = lineDistance * angleCos,
        lineDeltaY = lineDistance * angleSin,
        line = { left: x1 - lineDeltaX, top: y1 + lineDeltaY, right: x2 - lineDeltaX, bottom: y2 + lineDeltaY },
        x0 = x1 - deltaX,
        y0 = y1 + deltaY,
        x3 = x2 - deltaX,
        y3 = y2 + deltaY,
        len = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)),
        label = Math.round(len / scale) + 'px';

    var st = this.set(),
        curve = this.path(
            Raphael.format('M{0},{1} L{2},{3} M{4},{5} L{6},{7} M{8},{9} L{10},{11}',
                x0, y0, x1, y1,
                line.left, line.top, line.right, line.bottom,
                x2, y2, x3, y3)),
        center = curve.getPointAtLength(len / 2.0 + d);

    st.push(
        curve,
        this.doubleArrow(line.left, line.top, line.right, line.bottom),
        this.text(
            center.x + textDistance * angleCos,
            center.y - textDistance * angleSin,
            label).transform('R' + Math.round(Raphael.deg(Math.PI / 2.0 - angle)))
    );

    st.label = label;
    return st;
};


(function ($) {
    window.measurementAnnotationModel = function (options) {
        $.extend(this, options);
        this._init();
    };


    // measurement annotation tool model
    $.extend(measurementAnnotationModel.prototype, graphicsAnnotationModel.prototype, {
    });


    // measurement annotation tool view model
    window.measurementAnnotationViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(measurementAnnotationViewModel.prototype, graphicsAnnotationViewModel.prototype, {
        _measurements: null,

        _create: function (options) {
            this._model = new measurementAnnotationModel(options);
            this._init(options);
        },

        _init: function (options) {
            graphicsAnnotationViewModel.prototype._init.call(this, options);

            var self = this;
            this._measurements = [];

            $(this).bind({
                onAnnotationReceived: function (e, annotation) {
                    self._onMeasurementAnnotationCreated(annotation);
                },

                onAnnotationCreated: function (e, annotation, markerFigure) {
                    self._onMeasurementAnnotationCreated(annotation, markerFigure);
                },

                onAnnotationRemoved: function (e, annotation) {
                    self._onMeasurementAnnotationRemoved(annotation);
                },

                onSetZoom: function (e, scale) {
                    self._setMeasurementsZoom(scale);
                }
            });

            $(this).bind({
                onAnnotationMarkerMovedOnClient: function (e, annotationGuid, position, pageNumber, originalPosition) {
                    self.moveAnnotationMarkerOnClientMeasurement(annotationGuid, position, pageNumber, originalPosition);
                }
            });
        },

        _onMeasurementAnnotationCreated: function (annotation, markerFigure) {
            if (annotation.type != Annotation.prototype.AnnotationType.Distance) {
                return;
            }

            var canvas = this.getCanvas();

            if (!markerFigure) {
                var scale = this.scale(),
                    selectable = this.getSelectableInstance(),
                    bounds = annotation.displayBounds(),
                    pageOffset = { x: 0, y: 0 };

                if (annotation.svgPath) {
                    var pattern = " l";
                    var re = new RegExp(pattern, 'g');

                    var points = annotation.svgPath.substring(1, annotation.svgPath.length - 1).replace(re, 'l').split('l'),
                        topLeft = points[0].split(','),
                        rightBottom = points[1].split(','),
                        left = parseFloat(topLeft[0]),
                        top = parseFloat(topLeft[1]),
                        offsetX = parseFloat(rightBottom[0]),
                        offsetY = parseFloat(rightBottom[1]),
                        pageNumber = 0;

                    if (this.storeAnnotationCoordinatesRelativeToPages) {
                        pageNumber = annotation.pageNumber;
                    }
                    else {
                        var pageHeight = selectable.options.pageHeight;
                        pageNumber = Math.floor((top * scale) / pageHeight);
                        top -= pageNumber * pageHeight;
                    }

                    pageOffset.x = selectable.pages[pageNumber].rect.left();
                    pageOffset.y = selectable.pages[pageNumber].rect.top();

                    bounds = new jSaaspose.Rect(left, top, left + (isNaN(offsetX) ? 0 : offsetX), top + (isNaN(offsetY) ? 0 : offsetY), false);
                    scale = this.scale();
                }

                markerFigure = canvas.ruler(
                    pageOffset.x + bounds.left() * scale,
                    pageOffset.y + bounds.top() * scale,
                    pageOffset.x + bounds.right() * scale,
                    pageOffset.y + bounds.bottom() * scale, this.scale());
            }

            var bboxBounds = markerFigure.getBBox(),
                bbox = canvas.rect(bboxBounds.x, bboxBounds.y, bboxBounds.width, bboxBounds.height)
                    .attr({ stroke: "none", fill: "#f00", "fill-opacity": 0, cursor: "pointer" });

            this.setFigureLook(markerFigure, annotation);

            this.createClickHandler((bbox || markerFigure).node, annotation);
            this._makeDraggable(annotation, markerFigure, bbox);

            var ruler = new AnnotationPolyline(markerFigure, bbox);
            ruler.setAnnotation(annotation);

            this._measurements.push(ruler);
        },

        _onMeasurementAnnotationRemoved: function (annotation) {
            if (annotation.type != Annotation.prototype.AnnotationType.Distance) {
                return;
            }

            this._removeMeasurementAnnotation(annotation.guid);
        },

        _removeMeasurementAnnotation: function (guid) {
            for (var i = 0; i < this._measurements.length; i++) {
                var r = this._measurements[i];

                if (r.annotation.guid == guid) {
                    r.deleteScreenFigure();
                    this._measurements.splice(i, 1);
                    break;
                }
            }
        },

        _setMeasurementsZoom: function (value) {
            var i, annotations = [];

            for (i = 0; i < this._measurements.length; i++) {
                var marker = this._measurements[i];
                marker.deleteScreenFigure();
                annotations.push(marker.annotation);
            }

            this._measurements.length = 0;

            for (i = 0; i < annotations.length; i++) {
                var annotation = annotations[i];
                this._onMeasurementAnnotationCreated(annotation);
            }
        },

        setDistanceAnnotationMode: function () {
            this.setAnnotationMode($.ui.dvselectable.prototype.SelectionModes.TrackMouseMovement);
            this.annotationModeObservable(Annotation.prototype.AnnotationType.Distance);
        },

        createDistanceAnnotation: function (pageNumber, point) {
            var canvas = this.getCanvas();
            var selectable = this.getSelectable();
            var self = this,
                scale = this.scale(),
                topLeft = new jSaaspose.Point(point.left, point.top),
                bottomRight = point,
                  drawingOptions = this._getDrawingOptions(null),
                /*arrow = canvas.rect(point.left, point.top, 20, 100).attr({
                    fill: 'url(./document-annotation/images/ruler.png)'
                })*/
                ruler = canvas.ruler(point.left, point.top, point.left, point.top, scale).attr({
                    "stroke": this.getRgbColorFromInteger(drawingOptions.penColor)
                });

            //var scale = self.scale();
            //arrow.transform('S' + scale + ' R30');

            selectable.bind('onMouseDrag', function (e, point) {
                bottomRight = point;
                //arrow.attr({ height: Math.abs(topLeft.y - point.top) });
                ruler.remove();
                ruler = canvas.ruler(topLeft.x, topLeft.y, point.left, point.top, scale)
            });

            selectable.bind("onMouseMoveStopped", function () {
                selectable.unbind("onMouseMoveStopped");
                selectable.unbind("onMouseDrag");

                var bbox = ruler.getBBox();
                selectableModel = self.getSelectableInstance(),
                //bounds = new jSaaspose.Rect(topLeft.x, topLeft.y, bottomRight.left, bottomRight.top),
                bounds = new jSaaspose.Rect(bbox.x, bbox.y, bbox.x2, bbox.y2),
                absoluteBounds = (self.storeAnnotationCoordinatesRelativeToPages ?
                    selectableModel.convertRectToRelativeToPageUnscaledCoordinates(bounds, topLeft) :
                    selectableModel.convertRectToAbsoluteCoordinates(bounds, topLeft)),
                absoluteTopLeft = (self.storeAnnotationCoordinatesRelativeToPages ?
                    self.convertPointToRelativeToPageUnscaledCoordinates(topLeft, topLeft) :
                    self.convertPointToAbsoluteCoordinates(topLeft, topLeft)),
                drawingOptions = self._getDrawingOptions(null, self.rulerToolOptions),
                svgPath = window.jGroupdocs.stringExtensions.format("M{0},{1} l{2},{3}", absoluteTopLeft.x, absoluteTopLeft.y, (bottomRight.left - topLeft.x) / scale, (bottomRight.top - topLeft.y) / scale);

                self.createAnnotation(Annotation.prototype.AnnotationType.Distance, pageNumber, absoluteBounds, null, null, ruler, svgPath, null, drawingOptions, null, ruler.label);
            });
        },

        addAnnotationFromAnotherUser: function (data) {
            var annotation = graphicsAnnotationViewModel.prototype.addAnnotationFromAnotherUser.call(this, data);
            if (annotation.type == Annotation.prototype.AnnotationType.Distance) {
                this._onMeasurementAnnotationCreated(annotation);
            }

            return annotation;
        },

        deleteAnnotationOnClient: function (annotationGuid) {
            this._removeMeasurementAnnotation(annotationGuid);
            graphicsAnnotationViewModel.prototype.deleteAnnotationOnClient.call(this, annotationGuid);
        },


        findMeasurementByAnnotationGuid: function (annotationGuid) {
            for (var i = 0; i < this._measurements.length; i++) {
                var measurement = this._measurements[i];
                if (measurement.annotation.guid == annotationGuid) {
                    return measurement;
                }
            }
            return null;
        },

        moveAnnotationMarkerOnClientMeasurement: function (annotationGuid,
            position,
            pageNumber,
            originalPosition) {

            var measurement = this.findMeasurementByAnnotationGuid(annotationGuid);
            if (measurement != null) {
                var annotation = measurement.annotation;
                this.updateSvgPathAfterMove(annotation, position.x - originalPosition.left(), position.y - originalPosition.top());
                this._removeMeasurementAnnotation(annotationGuid);
                this._onMeasurementAnnotationCreated(annotation);
            }
        }
    });


    // Document annotation viewer widget
    $.widget('ui.documentAnnotation', $.ui.textRedactionViewer, {
        _createViewModel: function () {
            return new measurementAnnotationViewModel(this.options);
        },

        _create: function () {
            $.ui.textRedactionViewer.prototype._create.call(this);
        }
    });
})(jQuery);