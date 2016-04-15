(function ($) {
    // Annotation area structure
    var Area = function (left, top, width, height, raphaelRect) {
        this._init(left, top, width, height, raphaelRect);
    };

    $.extend(Area.prototype, {
        guid: '',
        left: 0, top: 0, width: 0, height: 0,
        annotation: null,
        raphaelRect: null,

        _init: function (left, top, width, height, raphaelRect) {
            this.left = left;
            this.top = top;
            this.width = width;
            this.height = height;
            this.raphaelRect = raphaelRect;
        },

        setAnnotation: function (annotation) {
            this.annotation = annotation;
        },

        deleteScreenRect: function () {
            this.raphaelRect.remove();
        }
    });

    // Area Annotation Model
    areaAnnotationModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(areaAnnotationModel.prototype, annotationModel.prototype, {
    });


    // Area Annotation View Model
    areaAnnotationViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(areaAnnotationViewModel.prototype, annotationViewModel.prototype, {
        _areas: null,
        _canvas: null,
        _dasharray: ["", "-", ".", "-.", "-..", ". ", "- ", "--", "- .", "--.", "--.."],

        _create: function (options) {
            this._model = new areaAnnotationModel(options);
            this._init(options);
        },

        _init: function (options) {
            annotationViewModel.prototype._init.call(this, options);
            this._areas = [];
            var self = this;
            $(this).bind({
                onAnnotationRemoved: function (e, annotation) {
                    if (annotation.type == Annotation.prototype.AnnotationType.Area || annotation.type == Annotation.prototype.AnnotationType.ResourcesRedaction) {
                        self.deleteAreaByAnnotationGuid(annotation.guid);
                    }
                }
            });

            $(this).bind({
                onAnnotationReceived: function (e, annotation) {
                    if (annotation.type == Annotation.prototype.AnnotationType.Area || annotation.type == Annotation.prototype.AnnotationType.ResourcesRedaction) {
                        self.receiveAreaAnnotationHandler(annotation);
                    }
                }
            });

            $(this).bind({
                onAnnotationCreated: function (e, annotation) {
                    self.createAreaAnnotationHandler(annotation);
                }
            });

            $(this).bind({
                onReviewerColorsChanged: function (e) {
                    self.reviewerColorsChangedHandlerArea();
                }
            });

            $(this).bind({
                onAnnotationMarkerMovedOnClient: function (e, annotationGuid, position, pageNumber) {
                    self.areaAnnotationMarkerMovedHandler(annotationGuid, position, pageNumber);
                }
            });

            $(this).bind({
                onSetZoom: function (e, scale) {
                    self.setAreaZoom(scale);
                }
            });
        },

        createAreaAnnotation: function (pageNumber, bounds) {
            var drawingOptions = this._getDrawingOptions(null, this.areaToolOptions);
            this.createAnnotation(Annotation.prototype.AnnotationType.Area, pageNumber, bounds, null, null, null, null, null, drawingOptions);
        },

        createResourcesRedactionAnnotation: function (pageNumber, bounds) {
            var drawingOptions = this._getDrawingOptions(null, this.redactionToolOptions);
            this.createAnnotation(Annotation.prototype.AnnotationType.ResourcesRedaction, pageNumber, bounds, null, null, null, null, null, drawingOptions);
        },

        createAreaAnnotationHandler: function (annotation) {
            if (annotation.type != Annotation.prototype.AnnotationType.Area && annotation.type != Annotation.prototype.AnnotationType.ResourcesRedaction) {
                return;
            }

            var bounds = annotation.displayBounds();
            var selectable = this.getSelectableInstance();

            if (selectable._findPageAt(bounds.topLeft) != null)
                annotation.startingPoint = bounds.topLeft;
            else if (selectable._findPageAt(bounds.bottomRight) != null)
                annotation.startingPoint = bounds.bottomRight;

            var rectangle = this.getCanvas().rect(bounds.left(), bounds.top(), bounds.width(), bounds.height())
                .attr({ fill: "#f00", "fill-opacity": 0, cursor: "pointer" });

            var drawingOptions = this._getDrawingOptions(annotation);

            rectangle.attr({ "stroke": this.getRgbColorFromInteger(drawingOptions.penColor) });
            rectangle.attr({ "stroke-width": drawingOptions.penWidth });
            rectangle.attr({ "stroke-dasharray": this._dasharray[drawingOptions.penStyle] });
            rectangle.attr({ "stroke-opacity": 0.5 });

            if (!isNaN(drawingOptions.brushColor)) {
                rectangle.attr({ "fill": this.getRgbColorFromInteger(drawingOptions.brushColor), "fill-opacity": (drawingOptions.opacity || 1.0) });
            }

            this.createMenu(rectangle.node, annotation);
            this.createClickHandler(rectangle.node, annotation);
            this._makeDraggable(annotation, rectangle);

            var area = new Area(bounds.left(), bounds.top(), bounds.width(), bounds.height(), rectangle);
            area.setAnnotation(annotation);
            this._areas.push(area);
        },

        _makeDraggable: function (annotation, figure, bbox) {
            var initialX = 0, initialY = 0,
                prevDx = 0, prevDy = 0,
                initialBounds, originalPos,
                self = this,
                selectable = this.getSelectableInstance(),
                selectionMode = $.ui.dvselectable.prototype.SelectionModes.DoNothing;

            function onDragStarted(x, y, event) {
                selectionMode = selectable.getMode();
                selectable.setMode($.ui.dvselectable.prototype.SelectionModes.DoNothing);

                initialX = this.attr("x");
                initialY = this.attr("y");

                initialBounds = annotation.displayBounds();
                originalPos = annotation.bounds().topLeft.clone();

                prevDx = prevDy = 0;

                return false;
            }

            function onDragging(dx, dy, x, y, event) {
                if (self.annotationModeObservable() != null)
                    return false;
                var leftTopBorderPage = self.getSelectableInstance()._findPageAt(new jSaaspose.Point(initialX + dx, initialY + dy));
                var rightBottomBorderPage = self.getSelectableInstance()._findPageAt(new jSaaspose.Point(initialX + dx + this.attrs.width, initialY + dy + this.attrs.height));
                if (leftTopBorderPage == null || rightBottomBorderPage == null) {
                    return;
                }
                if (leftTopBorderPage != rightBottomBorderPage) {
                    return;
                }
                this.attr({ x: initialX + dx, y: initialY + dy });

                var currentDisplayBounds = initialBounds.clone().add(new jSaaspose.Point(dx, dy)),
                    currentOrigin;

                if (self.storeAnnotationCoordinatesRelativeToPages) {
                    var page = self.getSelectableInstance().findPageAtVerticalPosition(currentDisplayBounds.top());
                    if (page)
                        annotation.pageNumber = parseInt(page.pageId) - 1;

                    currentOrigin = self.convertPointToRelativeToPageUnscaledCoordinates(currentDisplayBounds.topLeft, currentDisplayBounds.topLeft);
                }
                else {
                    currentOrigin = self.convertPointToAbsoluteCoordinates(currentDisplayBounds.topLeft, currentDisplayBounds.topLeft);
                }

                var annotationBounds = annotation.bounds().clone();
                annotation.bounds(new jSaaspose.Rect(currentOrigin.x, currentOrigin.y,
                    currentOrigin.x + annotationBounds.width(), currentOrigin.y + annotationBounds.height()));

                self.updateAnnotationDisplayPosition(annotation);
                self.preventIconsFromOverlapping();
                self.createConnectingLineAndIcon(annotation);

                if (bbox) {
                    figure.transform('...T' + (dx - prevDx) + ',' + (dy - prevDy));

                    prevDx = dx;
                    prevDy = dy;

                    self.updateSvgPathAfterMove(annotation, currentOrigin.x - annotationBounds.left(), currentOrigin.y - annotationBounds.top());
                }

                return false;
            }

            function onDragEnded(event) {
                if (initialX != this.attr("x") || initialY != this.attr("y")) {
                    self.draggedMarker = true;
                    self.moveAnnotationMarker(annotation, { x: annotation.bounds().topLeft.x, y: annotation.bounds().topLeft.y }, originalPos);
                }

                selectable.setMode(selectionMode);
            }

            (bbox || figure).drag(onDragging, onDragStarted, onDragEnded);
            (bbox || figure).hover(
                function () {
                    this.hoveredAnnotation(annotation);
                },
                function () {
                    this.hoveredAnnotation(null);
                },
                this,
                this);
        },

        _getDrawingOptions: function (annotation, drawingOptions) {
            var strokeColor = this._getReviewerColor ? this._getReviewerColor(annotation ? annotation.creatorGuid : this.userId) : 0xff6600;
            var strokeWidth = 1;
            var strokeStyle = 0;
            var brushColor = undefined;
            var opacity = (annotation != null && annotation.type != Annotation.prototype.AnnotationType.ResourcesRedaction ? 0.5 : 1.0);

            if (drawingOptions && drawingOptions.pen) {
                if (drawingOptions.pen.color) {
                    strokeColor = drawingOptions.pen.color;
                }

                strokeWidth = drawingOptions.pen.width;
                strokeStyle = drawingOptions.pen.dashStyle;
            }

            if (drawingOptions && drawingOptions.brush && drawingOptions.brush.color)
                brushColor = drawingOptions.brush.color;

            if (annotation) {
                if (!isNaN(annotation.penColor))
                    strokeColor = annotation.penColor;

                if (!isNaN(annotation.penWidth))
                    strokeWidth = annotation.penWidth;

                if (!isNaN(annotation.penStyle))
                    strokeStyle = annotation.penStyle;

                if (annotation.backgroundColor && !isNaN(annotation.backgroundColor()))
                    brushColor = annotation.backgroundColor();
            }

            return {
                penColor: strokeColor,
                penWidth: strokeWidth,
                penStyle: strokeStyle,
                brushColor: brushColor,
                opacity: opacity
            };
        },

        createMenu: function (markerElement, annotation) {
            var viewModel = this;
            $(markerElement).bind("contextmenu", function (e) {
                function clickHandler() {
                    viewModel.removeAnnotation(annotation, null);
                    $(this).remove();
                    return false;
                }
                var contextMenu = $("<div/>").text("Delete").addClass("figureContextMenu").css("left", e.originalEvent.layerX - 10).css("top", e.originalEvent.layerY - 10).
                    appendTo(viewModel._containerElement.children(".raphaelWrapper")).
                    click(clickHandler).
                    bind('contextmenu', clickHandler);

                viewModel.setupRemoveAnnotationMenu(contextMenu);
                return false;
            });
        },

        deleteAnnotationHandler: function (e, annotation) {
            this.deleteAreaByAnnotationGuid(annotation.guid);
        },

        receiveAreaAnnotationHandler: function (annotation) {
            if (annotation.type == Annotation.prototype.AnnotationType.Area || annotation.type == Annotation.prototype.AnnotationType.ResourcesRedaction) {
                this.createAreaAnnotationHandler(annotation);
            }
        },

        addAnnotationFromAnotherUser: function (data) {
            var newAnnotation = annotationViewModel.prototype.addAnnotationFromAnotherUser.call(this, data);
            if (newAnnotation.type == Annotation.prototype.AnnotationType.Area || newAnnotation.type == Annotation.prototype.AnnotationType.ResourcesRedaction) {
                this.createAreaAnnotationHandler(newAnnotation);
            }
            return newAnnotation;
        },

        clearAllAnnotationOnClient: function () {
            while (this._areas.length > 0) {
                var area = this._areas[0];
                this.deleteAreaByAnnotationGuid(area.annotation.guid);
            }
            annotationViewModel.prototype.clearAllAnnotationOnClient.call(this);
        },

        deleteAnnotationOnClient: function (annotationGuid) {
            this.deleteAreaByAnnotationGuid(annotationGuid);
            annotationViewModel.prototype.deleteAnnotationOnClient.call(this, annotationGuid);
        },

        deleteAreaByAnnotationGuid: function (annotationGuid) {
            for (var i = 0; i < this._areas.length; i++) {
                var area = this._areas[i];
                if (area.annotation.guid == annotationGuid) {
                    area.deleteScreenRect();
                    this._areas.splice(i, 1);
                    break;
                }
            }
        },

        setAreaZoom: function () {
            //annotationViewModel.prototype.setZoom.call(this, value);
            var areaCount = this._areas.length;
            var annotations = [];
            var i;
            for (i = 0; i < areaCount; i++) {
                var area = this._areas[i];
                area.deleteScreenRect();
                annotations.push(area.annotation);
            }
            this._areas.length = 0;
            for (i = 0; i < annotations.length; i++) {
                this.createAreaAnnotationHandler(annotations[i]);
            }
        },

        reviewerColorsChangedHandlerArea: function () {
            for (var i = 0; i < this._areas.length; i++) {
                var colorOfReviewer = this.getRgbColorOfReviewer && this.getRgbColorOfReviewer(this._areas[i].annotation.creatorGuid);
                if (colorOfReviewer)
                    this._areas[i].raphaelRect.attr({ stroke: colorOfReviewer });
            }
        },

        areaAnnotationMarkerMovedHandler: function (annotationGuid, position, pageNumber) {
            this.deleteAreaByAnnotationGuid(annotationGuid);
            var annotation = this.findAnnotation(annotationGuid);
            if (annotation != null) {
                annotation.pageNumber = pageNumber;
                this.createAreaAnnotationHandler(annotation);
            }
        },

        setResourcesRedactionAnnotationMode: function () {
            this.setAnnotationMode($.ui.dvselectable.prototype.SelectionModes.SelectRectangle);
            this.annotationModeObservable(Annotation.prototype.AnnotationType.ResourcesRedaction);
        },

        updateSvgPathAfterMove: function (annotation, dx, dy) {
            var svgPath = annotation.svgPath;
            if (!svgPath)
                return;

            var pattern = " l";
            var re = new RegExp(pattern, 'g');

            var resultingSvgPath = "M",
                    segmentArray = svgPath.toLowerCase().substring(1, svgPath.length).replace(re, 'l').split('l'),
                    segmentCount = segmentArray.length;

            for (var i = 0; i < segmentCount; i++) {
                var coordinateArray = segmentArray[i].split(',');
                var x = parseFloat(coordinateArray[0]);
                var y = parseFloat(coordinateArray[1]);
                if (i == 0) {
                    x += dx;
                    y += dy;
                    resultingSvgPath += window.jGroupdocs.stringExtensions.format("{0},{1}", x, y);
                } else {
                    resultingSvgPath += window.jGroupdocs.stringExtensions.format("l{0},{1}", x, y);
                }
            }
            annotation.svgPath = resultingSvgPath;
        }
    });


    $.widget('ui.docAreaAnnotationViewer', $.ui.docAnnotationViewer, {
        _createViewModel: function () {
            return new areaAnnotationViewModel(this.options);
        },

        _create: function () {
            $.ui.docAnnotationViewer.prototype._create.call(this);
        }
    });
})(jQuery);