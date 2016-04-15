(function ($) {
    // Annotation polyline structure
    AnnotationPolyline = function (raphaelFigure, boundingBox) {
        this._init(raphaelFigure, boundingBox);
    };

    $.extend(AnnotationPolyline.prototype, {
        annotation: null,
        raphaelFigure: null,

        _init: function (raphaelFigure, boundingBox) {
            this.raphaelFigure = raphaelFigure;
            this.boundingBox = boundingBox;
        },

        setAnnotation: function (annotation) {
            this.annotation = annotation;
        },

        deleteScreenFigure: function () {
            this.raphaelFigure.remove();

            if (this.boundingBox)
                this.boundingBox.remove();
        },

        setSvgPath: function (svgPath) {
            this.raphaelFigure.attr("path", svgPath);
        }
    });


    // Polyline annotation model
    window.polylineAnnotationModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(polylineAnnotationModel.prototype, textStrikeoutModel.prototype, {
    });

    // Polyline annotation view model
    window.polylineAnnotationViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };
    $.extend(polylineAnnotationViewModel.prototype, textStrikeoutViewModel.prototype, {
        _polylines: null,
        _create: function (options) {
            this._model = new polylineAnnotationModel(options);
            this._init(options);
        },

        _init: function (options) {
            textStrikeoutViewModel.prototype._init.call(this, options);
            this._polylines = [];
            var self = this;
            $(this).bind({
                onAnnotationRemoved: function (e, annotation) {
                    if (annotation.type == Annotation.prototype.AnnotationType.Polyline) {
                        self.deletePolylineByAnnotationGuid(annotation.guid);
                    }
                }
            });

            $(this).bind({
                onAnnotationReceived: function (e, annotation) {
                    self.receivePolylineAnnotationHandler(annotation);
                }
            });

            $(this).bind({
                onAnnotationCreated: function (e, annotation, markerFigure) {
                    self.createPolylineAnnotationHandler(annotation, markerFigure);
                }
            });

            $(this).bind({
                onReviewerColorsChanged: function (e) {
                    self.reviewerColorsChangedHandlerPolyline();
                }
            });

            $(this).bind({
                onSetZoom: function (e, scale) {
                    self.setPolylineZoom(scale);
                }
            });

            $(this).bind({
                onAnnotationMarkerMovedOnClient: function (e, annotationGuid, position, pageNumber, originalPosition) {
                    self.moveAnnotationMarkerOnClientPolyline(annotationGuid, position, pageNumber, originalPosition);
                }
            });
        },

        addPart: function (raphaelElement, point) {
            var pathParts = raphaelElement.attr('path') || [];
            if ($.isArray(pathParts)) {
                pathParts.push(point);
            }
            else {
                pathParts += point[0] + point[1] + "," + point[2]; // String in IE
            }
            raphaelElement.attr('path', pathParts);
        },

        setFigureLook: function (raphaelFigure, annotation, toolOptions) {
            var drawingOptions = this._getDrawingOptions(annotation, toolOptions);

            raphaelFigure.attr({ "stroke": this.getRgbColorFromInteger(drawingOptions.penColor) });
            raphaelFigure.attr({ "stroke-width": drawingOptions.penWidth });
            raphaelFigure.attr({ "stroke-dasharray": this._dasharray[drawingOptions.penStyle] });
            raphaelFigure.attr({ "stroke-opacity": 1 });
        },

        createPolylineAnnotation: function (pageNumber, point) {
            var selectableElement = this.getSelectable();
            var pathString = window.jGroupdocs.stringExtensions.format("M{0},{1}", point.left, point.top);
            var markerFigure = this.getCanvas().path(pathString).attr({ fill: "#f00", "fill-opacity": 0 });

            this.setFigureLook(markerFigure, null, this.polylineToolOptions);

            var self = this,
                previousPoint = point,
                startingPoint = new jSaaspose.Point(point.left, point.top),
                position;

            if (this.storeAnnotationCoordinatesRelativeToPages) {
                position = this.convertPointToRelativeToPageUnscaledCoordinates(startingPoint, startingPoint);
            }
            else {
                position = this.convertPointToAbsoluteCoordinates(startingPoint, startingPoint);
            }

            if (position != null) {
                var scale = this.scale();

                var markerSvgPath = window.jGroupdocs.stringExtensions.format("M{0},{1}", position.x, position.y);
                selectableElement.bind("onMouseDrag", function (event, mouseDragPoint) {
                    var deltaX = mouseDragPoint.left - previousPoint.left;
                    var deltaY = mouseDragPoint.top - previousPoint.top;
                    self.addPart(markerFigure, ["l", deltaX, deltaY]);
                    var unscaledDeltaX = deltaX / scale;
                    var unscaledDeltaY = deltaY / scale;
                    markerSvgPath += window.jGroupdocs.stringExtensions.format("l{0},{1}", unscaledDeltaX, unscaledDeltaY);
                    previousPoint = mouseDragPoint;
                });
                selectableElement.bind("onMouseMoveStopped", function () {
                    selectableElement.unbind("onMouseMoveStopped");
                    selectableElement.unbind("onMouseDrag");
                    var boundingBox = markerFigure.getBBox(false);
                    var bounds = new jSaaspose.Rect(boundingBox.x, boundingBox.y, boundingBox.x + boundingBox.width, boundingBox.y + boundingBox.height);

                    var selectable = self.getSelectableInstance();
                    var absoluteBounds;

                    if (self.storeAnnotationCoordinatesRelativeToPages) {
                        absoluteBounds = selectable.convertRectToRelativeToPageUnscaledCoordinates(bounds, startingPoint);
                    }
                    else {
                        absoluteBounds = selectable.convertRectToAbsoluteCoordinates(bounds, startingPoint);
                    }

                    var drawingOptions = self._getDrawingOptions(null, self.polylineToolOptions);
                    self.createAnnotation(Annotation.prototype.AnnotationType.Polyline, pageNumber, absoluteBounds, null, null, markerFigure, markerSvgPath, null, drawingOptions);
                });
            }
        },

        createPolylineAnnotationHandler: function (annotation, markerFigure) {
            if (annotation.type != Annotation.prototype.AnnotationType.Polyline) {
                return;
            }

            if (!markerFigure && annotation.svgPath) {
                var svgPath = annotation.svgPath,
                    scale = this.scale(),
                    selectable = this.getSelectableInstance();

                var resultingSvgPath = "M",
                    segmentArray = svgPath.substring(1, svgPath.length - 1).split('l'),
                    segmentCount = segmentArray.length,
                    pageHeight, pageNumber;

                for (var i = 0; i < segmentCount; i++) {
                    var coordinateArray = segmentArray[i].split(',');
                    var x = parseFloat(coordinateArray[0]);
                    var y = parseFloat(coordinateArray[1]);
                    x *= scale;
                    y *= scale;
                    if (i == 0) {
                        if (this.storeAnnotationCoordinatesRelativeToPages) {
                            pageNumber = annotation.pageNumber;
                        }
                        else {
                            pageHeight = selectable.options.pageHeight;
                            pageNumber = Math.floor(y / pageHeight);
                            y -= pageNumber * pageHeight;
                        }
                        x += selectable.pages[pageNumber].rect.topLeft.x;
                        y += selectable.pages[pageNumber].rect.topLeft.y;
                        annotation.startingPoint = new jSaaspose.Point(x, y);
                        resultingSvgPath += window.jGroupdocs.stringExtensions.format("{0},{1}", x, y);
                    }
                    else
                        resultingSvgPath += window.jGroupdocs.stringExtensions.format("l{0},{1}", x, y);
                }

                annotation.displaySvgPath = resultingSvgPath;
                markerFigure = this.getCanvas().path(annotation.displaySvgPath);

                this.setFigureLook(markerFigure, annotation, this.polylineToolOptions);
            }


            var bbox = this.getCanvas()
                .rect(annotation.displayBounds().left(), annotation.displayBounds().top(), annotation.displayBounds().width(), annotation.displayBounds().height())
                .attr({ stroke: "none", fill: "#f00", "fill-opacity": 0, cursor: "pointer" });

            this.createMenu((bbox || markerFigure).node, annotation);
            this.createClickHandler((bbox || markerFigure).node, annotation);
            this._makeDraggable(annotation, markerFigure, bbox);

            var annotationPolyline = new AnnotationPolyline(markerFigure, bbox);
            annotationPolyline.setAnnotation(annotation);
            this._polylines.push(annotationPolyline);
        },

        deleteAnnotationHandler: function (e, annotation) {
            this.deletePolylineByAnnotationGuid(annotation.guid);
        },

        receivePolylineAnnotationHandler: function (annotation) {
            if (annotation.type == Annotation.prototype.AnnotationType.Polyline) {
                this.createPolylineAnnotationHandler(annotation);
            }
        },

        addAnnotationFromAnotherUser: function (data) {
            var newAnnotation = textStrikeoutViewModel.prototype.addAnnotationFromAnotherUser.call(this, data);
            if (newAnnotation.type == Annotation.prototype.AnnotationType.Polyline) {
                this.createPolylineAnnotationHandler(newAnnotation);
            }
            return newAnnotation;
        },

        deleteAnnotationOnClient: function (annotationGuid) {
            this.deletePolylineByAnnotationGuid(annotationGuid);
            textStrikeoutViewModel.prototype.deleteAnnotationOnClient.call(this, annotationGuid);
        },

        clearAllAnnotationOnClient: function () {
            while (this._polylines.length > 0) {
                var polyline = this._polylines[0];
                this.deletePolylineByAnnotationGuid(polyline.annotation.guid);
            }
            textStrikeoutViewModel.prototype.clearAllAnnotationOnClient.call(this);
        },

        deletePolylineByAnnotationGuid: function (annotationGuid) {
            for (var i = 0; i < this._polylines.length; i++) {
                var polyline = this._polylines[i];
                if (polyline.annotation.guid == annotationGuid) {
                    polyline.deleteScreenFigure();
                    this._polylines.splice(i, 1);
                    break;
                }
            }
        },

        setPolylineZoom: function (value) {
            var markerCount = this._polylines.length;
            var annotations = [];
            var i;
            for (i = 0; i < markerCount; i++) {
                var marker = this._polylines[i];
                marker.deleteScreenFigure();
                annotations.push(marker.annotation);
            }
            this._polylines.length = 0;
            for (i = 0; i < annotations.length; i++) {
                var annotation = annotations[i];
                this.createPolylineAnnotationHandler(annotation);
            }
        },

        reviewerColorsChangedHandlerPolyline: function () {
            for (var i = 0; i < this._polylines.length; i++) {
                var colorOfReviewer = this.getRgbColorOfReviewer && this.getRgbColorOfReviewer(this._polylines[i].annotation.creatorGuid);
                if (colorOfReviewer)
                    this._polylines[i].raphaelFigure.attr({ stroke: colorOfReviewer });
            }
        },

        findPolylineByAnnotationGuid: function (annotationGuid) {
            for (var i = 0; i < this._polylines.length; i++) {
                var polyline = this._polylines[i];
                if (polyline.annotation.guid == annotationGuid) {
                    return polyline;
                }
            }
            return null;
        },

        moveAnnotationMarkerOnClientPolyline: function (annotationGuid,
            position,
            pageNumber,
            originalPosition) {

            var polyline = this.findPolylineByAnnotationGuid(annotationGuid);
            if (polyline != null) {
                var annotation = polyline.annotation;
                this.updateSvgPathAfterMove(annotation, position.x - originalPosition.left(), position.y - originalPosition.top());
                this.deletePolylineByAnnotationGuid(annotationGuid);
                this.createPolylineAnnotationHandler(annotation);
            }
        }
    });


    $.widget('ui.docPolylineAnnotationViewer', $.ui.docTextStrikeoutViewer, {
        _createViewModel: function () {
            return new polylineAnnotationViewModel(this.options);
        },

        _create: function () {
            $.ui.docTextStrikeoutViewer.prototype._create.call(this);
        }
    });
})(jQuery);
