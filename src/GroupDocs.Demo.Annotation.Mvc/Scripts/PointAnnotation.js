(function ($) {
    // Annotation point structure
    var AnnotationPoint = function (annotation) {
        this._init(annotation);
    };

    $.extend(AnnotationPoint.prototype, {
        annotation: null,
        deleteIconIsVisible: null,
        markerWidth: 26,
        markerHeight: 27,

        _init: function (annotation) {
            this.deleteIconIsVisible = ko.observable(false);
            this.annotation = annotation;
        }
    });

    // Point Annotation Model
    pointAnnotationModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(pointAnnotationModel.prototype, areaAnnotationModel.prototype, {
    });


    // Point Annotation View Model
    pointAnnotationViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(pointAnnotationViewModel.prototype, areaAnnotationViewModel.prototype, {
        _points: null,

        _create: function (options) {
            this._model = new pointAnnotationModel(options);
            this._init(options);
        },

        _init: function (options) {
            areaAnnotationViewModel.prototype._init.call(this, options);
            this._points = ko.observableArray([]);
            var self = this;
            $(this).bind({
                onAnnotationRemoved: function (e, annotation) {
                    if (annotation.type == Annotation.prototype.AnnotationType.Point) {
                        self.deletePointByAnnotationGuid(annotation.guid);
                    }
                }
            });

            $(this).bind({
                onAnnotationReceived: function (e, annotation) {
                    self.receivePointAnnotationHandler(annotation);
                }
            });

            $(this).bind({
                onAnnotationCreated: function (e, annotation) {
                    self.createPointAnnotationHandler(annotation);
                }
            });

            $(this).bind({
                onSetZoom: function (e, scale) {
                    self.setPointZoom(scale);
                }
            });
        },

        createPointAnnotation: function (pageNumber, bounds) {
            this.createAnnotation(Annotation.prototype.AnnotationType.Point, pageNumber, bounds, null, null, null, null);
        },

        deleteAnnotationHandler: function (e, annotation) {
            this.deletePointByAnnotationGuid(annotation.guid);
        },

        receivePointAnnotationHandler: function (annotation) {
            if (annotation.type == Annotation.prototype.AnnotationType.Point) {
                this.createPointAnnotationHandler(annotation);
            }
        },

        createPointAnnotationHandler: function (annotation) {
            if (annotation.type != Annotation.prototype.AnnotationType.Point) {
                return;
            }
            var annotationPoint = new AnnotationPoint(annotation);
            this._points.push(annotationPoint);
        },

        getDraggableOptions: function (annotation) {
            var self = this;
            var initialBounds, originalPos;
            return {
                start: function (event, ui) {
                    if (self.annotationModeObservable() != null)
                        return false;
                    self.draggedMarker = true;
                    initialBounds = annotation.displayBounds();
                    originalPos = annotation.bounds().topLeft.clone();
                },

                drag: function (event, ui) {
                    var width = 26, height = 27;
                    var currentPage = self.getSelectableInstance()._findPageAt(new jSaaspose.Point(ui.position.left, ui.position.top));
                    if (currentPage == null) {
                        currentPage = self.getSelectableInstance()._findPageAt(new jSaaspose.Point(ui.originalPosition.left, ui.originalPosition.top));
                    }
                    if (ui.position.left + width / 2 > currentPage.rect.bottomRight.x) {
                        ui.position = currentPage.rect.bottomRight.x;
                        return;
                    }
                    if (ui.position.left < currentPage.rect.topLeft.x) {
                        ui.position = currentPage.rect.topLeft.x;
                        return;
                    }
                    if (ui.position.top < currentPage.rect.topLeft.y) {
                        ui.position = currentPage.rect.topLeft.y;
                        return;
                    }
                    if (ui.position.top + height > currentPage.rect.bottomRight.y) {
                        ui.position = currentPage.rect.bottomRight.y;
                        return;
                    }
                    if (ui.position.top < currentPage.rect.topLeft.y) {
                        ui.position = currentPage.rect.topLeft.x;
                        return;
                    }
                    var currentDisplayOrigin = new jSaaspose.Point(ui.position.left + width / 2, ui.position.top + height / 2);

                    var currentOrigin;
                    if (self.storeAnnotationCoordinatesRelativeToPages) {
                        var page = self.getSelectableInstance().findPageAtVerticalPosition(currentDisplayOrigin.y);
                        if (page)
                            annotation.pageNumber = parseInt(page.pageId) - 1;

                        currentOrigin = self.convertPointToRelativeToPageUnscaledCoordinates(currentDisplayOrigin, currentDisplayOrigin);
                    }
                    else {
                        currentOrigin = self.convertPointToAbsoluteCoordinates(currentDisplayOrigin, currentDisplayOrigin);
                    }
                    var annotationBounds = annotation.bounds();
                    annotation.bounds(new jSaaspose.Rect(currentOrigin.x, currentOrigin.y,
                        currentOrigin.x + annotationBounds.width(), currentOrigin.y + annotationBounds.height()));
                    self.updateAnnotationDisplayPosition(annotation);
                    self.preventIconsFromOverlapping();
                    self.createConnectingLineAndIcon(annotation);
                },

                stop: function (event, ui) {
                    if (initialBounds.left() != annotation.displayBounds().left() || initialBounds.top() != annotation.displayBounds().top()) {
                        self.draggedMarker = true;
                        self.moveAnnotationMarker(annotation, { x: annotation.bounds().topLeft.x, y: annotation.bounds().topLeft.y }, originalPos);
                    }
                }
            };
        },

        addAnnotationFromAnotherUser: function (data) {
            var newAnnotation = areaAnnotationViewModel.prototype.addAnnotationFromAnotherUser.call(this, data);
            if (newAnnotation.type == Annotation.prototype.AnnotationType.Point) {
                this.createPointAnnotationHandler(newAnnotation);
            }
            return newAnnotation;
        },

        clearAllAnnotationOnClient: function () {
            this._points.removeAll();
            areaAnnotationViewModel.prototype.clearAllAnnotationOnClient.call(this);
        },

        deleteAnnotationOnClient: function (annotationGuid) {
            this.deletePointByAnnotationGuid(annotationGuid);
            areaAnnotationViewModel.prototype.deleteAnnotationOnClient.call(this, annotationGuid);
        },

        deletePointByAnnotationGuid: function (annotationGuid) {
            for (var i = 0; i < this._points().length; i++) {
                var point = this._points()[i];
                if (point.annotation.guid == annotationGuid) {
                    this._points.splice(i, 1);
                    break;
                }
            }
        },

        setPointZoom: function (value) {
            //areaAnnotationViewModel.prototype.setZoom.call(this, value);
            var markerCount = this._points().length;
            var annotations = [];
            var i;
            for (i = 0; i < markerCount; i++) {
                var marker = this._points()[i];
                annotations.push(marker.annotation);
            }
            this._points().length = 0;
            for (i = 0; i < annotations.length; i++) {
                this.createPointAnnotationHandler(annotations[i]);
            }
        }
    });


    $.widget('ui.docPointAnnotationViewer', $.ui.docAreaAnnotationViewer, {
        _createViewModel: function () {
            return new pointAnnotationViewModel(this.options);
        },

        _create: function () {
            $.ui.docAreaAnnotationViewer.prototype._create.call(this);
        }
    });
})(jQuery);