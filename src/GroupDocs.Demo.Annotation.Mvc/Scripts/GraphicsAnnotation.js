Raphael.fn.arrow = function (x1, y1, x2, y2) {
    var distance = 7,
        halfDistance = distance / 2,
        angle = Math.atan2(y1 - y2, x1 - x2),
        st = this.set();

    st.push(
        this.path(
                Raphael.format('M{0},{1} L{2},{3}', x1, y1, x2, y2)),
        this.path(
                Raphael.format('M{0},{1} L{2},{3} {4},{5}', x2 - distance, y2 - halfDistance, x2, y2, x2 - distance, y2 + halfDistance))
            .transform('R' + Math.round(Raphael.deg(angle - Math.PI)) + ',' + x2 + ',' + y2));

    return st;
};

(function ($) {
    window.graphicsAnnotationModel = function (options) {
        $.extend(this, options);
        this._init();
    };


    // Graphics annotation tool model
    $.extend(graphicsAnnotationModel.prototype, textReplacementModel.prototype, {
    });


    // Graphics annotation tool view model
    window.graphicsAnnotationViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(graphicsAnnotationViewModel.prototype, textRedactionViewModel.prototype, {
        _graphics: null,
        _arrowEnd: 'open-wide-long',

        _create: function (options) {
            this._model = new graphicsAnnotationModel(options);
            this._init(options);
        },

        _init: function (options) {
            textRedactionViewModel.prototype._init.call(this, options);

            var self = this;
            this._graphics = [];

            $(this).bind({
                onAnnotationReceived: function (e, annotation) {
                    self._onGraphicsAnnotationCreated(annotation);
                },

                onAnnotationCreated: function (e, annotation, markerFigure) {
                    self._onGraphicsAnnotationCreated(annotation, markerFigure);
                },

                onAnnotationRemoved: function (e, annotation) {
                    self._onGraphicsAnnotationRemoved(annotation);
                },

                onSetZoom: function (e, scale) {
                    self._setGraphicsZoom(scale);
                }
            });

            $(this).bind({
                onAnnotationMarkerMovedOnClient: function (e, annotationGuid, position, pageNumber, originalPosition) {
                    self.moveAnnotationMarkerOnClientGraphic(annotationGuid, position, pageNumber, originalPosition);
                }
            });
        },

        _onGraphicsAnnotationCreated: function (annotation, markerFigure) {
            if (annotation.type != Annotation.prototype.AnnotationType.Arrow) {
                return;
            }

            var bounds = annotation.displayBounds();

            if (!markerFigure) {
                var selectable = this.getSelectableInstance();

                if ((selectable._findPageAt(bounds.topLeft)) != null) {
                    annotation.startingPoint = bounds.topLeft;
                }
                else
                    if ((selectable._findPageAt(bounds.bottomRight)) != null) {
                        annotation.startingPoint = bounds.bottomRight;
                    }

                var canvas = this.getCanvas();
                var arrowPath = ["M", bounds.left(), bounds.top(), "L", bounds.right(), bounds.bottom()];
                markerFigure = canvas.arrow(arrowPath[1], arrowPath[2], arrowPath[4], arrowPath[5]);
            }

            bounds = bounds.clone().normalize();

            var bbox = this.getCanvas()
                .rect(bounds.left(), bounds.top(), bounds.width(), bounds.height())
                .attr({ "stroke": "none", "fill": "#f00", "fill-opacity": 0, "cursor": "pointer" });

            this.setFigureLook(markerFigure, annotation, this.ArrowToolOptions);
            this.createClickHandler((bbox || markerFigure).node, annotation);
            this._makeDraggable(annotation, markerFigure, bbox);

            var graphics = new AnnotationPolyline(markerFigure, bbox);
            graphics.setAnnotation(annotation);
            this._graphics.push(graphics);
        },

        _onGraphicsAnnotationRemoved: function (annotation) {
            if (annotation.type != Annotation.prototype.AnnotationType.Arrow) {
                return;
            }

            this._removeGraphicsAnnotation(annotation.guid);
        },

        _removeGraphicsAnnotation: function (guid) {
            for (var i = 0; i < this._graphics.length; i++) {
                var g = this._graphics[i];

                if (g.annotation.guid == guid) {
                    g.deleteScreenFigure();
                    this._graphics.splice(i, 1);
                    break;
                }
            }
        },

        _setGraphicsZoom: function (value) {
            var annotations = [];
            var i;

            for (i = 0; i < this._graphics.length; i++) {
                var marker = this._graphics[i];
                marker.deleteScreenFigure();
                annotations.push(marker.annotation);
            }

            this._graphics.length = 0;

            for (i = 0; i < annotations.length; i++) {
                var annotation = annotations[i];
                annotation.svgPath = null;

                this._onGraphicsAnnotationCreated(annotation);
            }
        },

        setArrowAnnotationMode: function () {
            this.setAnnotationMode($.ui.dvselectable.prototype.SelectionModes.TrackMouseMovement);
            this.annotationModeObservable(Annotation.prototype.AnnotationType.Arrow);
        },

        createGraphicsAnnotation: function (pageNumber, point) {
            var previousPoint = point;
            var startingPoint = new jSaaspose.Point(point.left, point.top);
            var position;
            if (this.storeAnnotationCoordinatesRelativeToPages) {
                position = this.convertPointToRelativeToPageUnscaledCoordinates(startingPoint, startingPoint);
            }
            else {
                position = this.convertPointToAbsoluteCoordinates(startingPoint, startingPoint);
            }
            var canvas = this.getCanvas();
            var selectable = this.getSelectable();
            var self = this,
                topLeft = new jSaaspose.Point(point.left, point.top),
                drawingOptions = this._getDrawingOptions(null, this.arrowToolOptions),
                arrowDrawPath = [point.left, point.top, point.left + 1, point.top + 1];
            arrowPath = ["M", position.x, position.y, "L", position.x + 1, position.y + 1],

            arrow = canvas.arrow(position.x, position.y, position.x + 1, position.y + 1).attr({

                "stroke": this.getRgbColorFromInteger(drawingOptions.penColor),
                "stroke-width" : drawingOptions.penWidth,
                "stroke-dasharray" : this._dasharray[drawingOptions.penStyle]
            });

            selectable.bind('onMouseDrag', function (e, point) {

                var scale = self.scale();

                var deltaX = point.left - previousPoint.left;
                var deltaY = point.top - previousPoint.top;

                var unscaledDeltaX = deltaX / scale;
                var unscaledDeltaY = deltaY / scale;

                arrowPath[4] = unscaledDeltaX;
                arrowPath[5] = unscaledDeltaY;

                arrowDrawPath[2] = point.left;
                arrowDrawPath[3] = point.top;

                arrow.remove();
                arrow = canvas.arrow(arrowDrawPath[0], arrowDrawPath[1], arrowDrawPath[2], arrowDrawPath[3]);
            });

            selectable.bind("onMouseMoveStopped", function () {
                selectable.unbind("onMouseMoveStopped");
                selectable.unbind("onMouseDrag");

                var bounds = new jSaaspose.Rect(arrowDrawPath[0], arrowDrawPath[1], arrowDrawPath[2], arrowDrawPath[3]);

                var selectableModel = self.getSelectableInstance();
                var absoluteBounds;

                if (self.storeAnnotationCoordinatesRelativeToPages) {
                    absoluteBounds = selectableModel.convertRectToRelativeToPageUnscaledCoordinates(bounds, topLeft);
                }
                else {
                    absoluteBounds = selectableModel.convertRectToAbsoluteCoordinates(bounds, topLeft);
                }

                var drawingOptions = self._getDrawingOptions(null, self.arrowToolOptions);
                var svgPath = window.jGroupdocs.stringExtensions.format("M{0},{1} L{2},{3}", arrowPath[1], arrowPath[2], arrowPath[4], arrowPath[5]);

                self.createAnnotation(Annotation.prototype.AnnotationType.Arrow, pageNumber, absoluteBounds, null, null, arrow, svgPath, null, drawingOptions);
            });
        },

        addAnnotationFromAnotherUser: function (data) {
            var annotation = textRedactionViewModel.prototype.addAnnotationFromAnotherUser.call(this, data);
            if (annotation.type == Annotation.prototype.AnnotationType.Arrow) {
                this._onGraphicsAnnotationCreated(annotation);
            }

            return annotation;
        },

        deleteAnnotationOnClient: function (annotationGuid) {
            this._removeGraphicsAnnotation(annotationGuid);
            textRedactionViewModel.prototype.deleteAnnotationOnClient.call(this, annotationGuid);
        },

        findGraphicByAnnotationGuid: function (annotationGuid) {
            for (var i = 0; i < this._graphics.length; i++) {
                var graphic = this._graphics[i];
                if (graphic.annotation.guid == annotationGuid) {
                    return graphic;
                }
            }
            return null;
        },

        moveAnnotationMarkerOnClientGraphic: function (annotationGuid,
            position,
            pageNumber,
            originalPosition) {

            var graphic = this.findGraphicByAnnotationGuid(annotationGuid);
            if (graphic != null) {
                var annotation = graphic.annotation;
                this.updateSvgPathAfterMove(annotation, position.x - originalPosition.left(), position.y - originalPosition.top());
                this._removeGraphicsAnnotation(annotationGuid);
                this._onGraphicsAnnotationCreated(annotation);
            }
        }
    });
})(jQuery);