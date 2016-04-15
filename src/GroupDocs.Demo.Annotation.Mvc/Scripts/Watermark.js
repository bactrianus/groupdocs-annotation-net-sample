(function ($) {
    // A structure
    window.Watermark = function (left, top, width, height, text, fontFamily, fontSize) {
        this._init(left, top, width, height, text, fontFamily, fontSize);
    };

    $.extend(Watermark.prototype, TextField.prototype, {

    });

    window.watermarkModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(watermarkModel.prototype, textFieldModel.prototype, {
        saveWatermark: function (fileId, annotationGuid, text, fontFamily, fontSize, callback, errorCallback) {
            this._portalService.saveWatermarkAsync($.connection.hub.id, this.userId, this.userKey, fileId, annotationGuid,
                                                   text, fontFamily, fontSize,
                function (response) {
                    callback.apply(this, [response]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        }
    });


    window.watermarkViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(watermarkViewModel.prototype, textFieldViewModel.prototype, {
        _watermarks: null,
        fontFamilies: null,
        fontSizes: null,

        _create: function (options) {
            this._model = new watermarkModel(options);
            this._init(options);
        },

        _init: function (options) {
            textFieldViewModel.prototype._init.call(this, options);
            this._watermarks = ko.observableArray([]);

            var self = this;
            $(this).bind({
                onAnnotationRemoved: function (e, annotation) {
                    if (annotation.type == Annotation.prototype.AnnotationType.Watermark) {
                        self.deleteWatermarkByAnnotationGuid(annotation.guid);
                    }
                }
            });

            $(this).bind({
                onAnnotationReceived: function (e, annotation) {
                    if (annotation.type == Annotation.prototype.AnnotationType.Watermark) {
                        self.receiveWatermarkHandler(annotation);
                    }
                }
            });

            $(this).bind({
                onAnnotationCreated: function (e, annotation) {
                    self.createWatermarkHandler(annotation);
                }
            });

            //$(this).bind({
            //    onReviewerColorsChanged: function (e) {
            //        self.reviewerColorsChangedHandlerWatermark();
            //    }
            //});

            $(this).bind({
                onDocumentLoaded: function (e) {
                    self.clearWatermarks();
                }
            });

            $(this).bind({
                onSetZoom: function (e, scale) {
                    self.setWatermarkZoom(scale);
                }
            });

            $(this).bind({
                onAnnotationMarkerMovedOnClient: function (e, annotationGuid, position, pageNumber) {
                    self.moveAnnotationMarkerOnClientWatermark(annotationGuid, position, pageNumber);
                }
            });
        },

        createWatermark: function (pageNumber, bounds) {
            this.createAnnotation(Annotation.prototype.AnnotationType.Watermark, pageNumber, bounds, null, null, null, null, null, null, null, null, this.watermarkFont);
        },

        createWatermarkHandler: function (annotation) {
            if (annotation.type != Annotation.prototype.AnnotationType.Watermark) {
                return;
            }

            var bounds = annotation.bounds().clone();
            var selectable = (this.getSelectable().data("ui-dvselectable") || this.getSelectable().data("dvselectable"));
            if (selectable._findPageAt(bounds.topLeft) != null)
                annotation.startingPoint = bounds.topLeft;
            else if (selectable._findPageAt(bounds.bottomRight) != null)
                annotation.startingPoint = bounds.bottomRight;

            var watermark = new TextField(bounds.left(), bounds.top(), bounds.width(), bounds.height(), annotation);
            this._watermarks.push(watermark);
        },

        deleteAnnotationHandler: function (e, annotation) {
            this.deleteWatermarkByAnnotationGuid(annotation.guid);
        },

        receiveWatermarkHandler: function (annotation) {
            if (annotation.type == Annotation.prototype.AnnotationType.Watermark) {
                this.createWatermarkHandler(annotation);
            }
        },

        addAnnotationFromAnotherUser: function (data) {
            var newAnnotation = window.textFieldViewModel.prototype.addAnnotationFromAnotherUser.call(this, data);
            if (newAnnotation.type == Annotation.prototype.AnnotationType.Watermark) {
                this.createWatermarkHandler(newAnnotation);
            }
            return newAnnotation;
        },

        deleteAnnotationOnClient: function (annotationGuid) {
            this.deleteWatermarkByAnnotationGuid(annotationGuid);
            window.textFieldViewModel.prototype.deleteAnnotationOnClient.call(this, annotationGuid);
        },

        clearAllAnnotationsOnClient: function () {
            this._watermarks.removeAll();
            window.textFieldViewModel.prototype.clearAllAnnotationOnClient.call(this);
        },
        
        deleteWatermarkByAnnotationGuid: function (annotationGuid) {
            for (var i = 0; i < this._watermarks().length; i++) {
                var watermark = this._watermarks()[i];
                if (watermark.annotation.guid == annotationGuid) {
                    this._watermarks.splice(i, 1);
                    break;
                }
            }
        },

        saveWatermark: function (watermark) {
            if (watermark.annotation.guid) {
                var text = jGroupdocs.html.toText(watermark.text());
                this._model.saveWatermark(this.fileId, watermark.annotation.guid, text,
                                          watermark.selectedFontFamily(), watermark.selectedFontSize(),
                    function (response) {
                    } .bind(this),
                    function (error) {
                        this._onError(error);
                    } .bind(this));
            }
        },

        updateTextFieldOnClient: function (annotationGuid, text, fontFamily, fontSize) {
            var watermark = this.findWatermarkByAnnotationGuid(annotationGuid);
            if (watermark == null) {
                window.textFieldViewModel.prototype.updateTextFieldOnClient.call(this, annotationGuid, text, fontFamily, fontSize);
            }
            else {
                watermark.text(text);
                watermark.selectedFontFamily(fontFamily);
                watermark.selectedFontSize(fontSize);
            }
        },

        findWatermarkByAnnotationGuid: function (annotationGuid) {
            for (var i = 0; i < this._watermarks().length; i++) {
                var watermark = this._watermarks()[i];
                if (watermark.annotation.guid == annotationGuid) {
                    return watermark;
                }
            }
            return null;
        },

        setWatermarkZoom: function (value) {
            this.updateTextFieldsDisplayPosition(this._watermarks, this.createWatermarkHandler);
        },

        clearWatermarks: function () {
            this._watermarks.removeAll();
        },

        moveAnnotationMarkerOnClientWatermark: function (annotationGuid, position, pageNumber) {
            var watermark = this.findWatermarkByAnnotationGuid(annotationGuid);
            if (watermark != null) {
                var annotation = watermark.annotation;
                var annotationBounds = annotation.bounds();
                annotation.bounds(new jSaaspose.Rect(position.x, position.y,
                    position.x + annotationBounds.width(), position.y + annotationBounds.height()));
                annotation.pageNumber = pageNumber;
                this.updateAnnotationDisplayPosition(annotation);
                watermark.bounds(annotation.bounds());
            }
        },

        resizeAnnotationOnClient: function (annotationGuid, width, height) {
            var watermark = this.findWatermarkByAnnotationGuid(annotationGuid);
            if (watermark != null) {
                var annotation = watermark.annotation;
                this.setTextFieldSize(annotation, width, height);
            }

            window.textFieldViewModel.prototype.resizeAnnotationOnClient.call(this, annotationGuid, width, height);
        },

        setTextFieldColorOnClient: function (annotationGuid, fontColor) {
            var watermark = this.findWatermarkByAnnotationGuid(annotationGuid);
            if (watermark != null) {
                watermark.annotation.fontColor(fontColor);
            }

            window.textFieldViewModel.prototype.setTextFieldColorOnClient.call(this, annotationGuid, fontColor);
        },

        setAnnotationBackgroundColorOnClient: function (annotationGuid, color) {
            var watermark = this.findWatermarkByAnnotationGuid(annotationGuid);
            if (watermark != null) {
                watermark.annotation.backgroundColor(color);
            }

            window.textFieldViewModel.prototype.setAnnotationBackgroundColorOnClient.call(this, annotationGuid, color);
        }
    });


    $.widget('ui.documentWithAnnotationsViewer', $.ui.documentWithTextFieldsViewer, {
        _createViewModel: function () {
            return new watermarkViewModel(this.options);
        },

        _create: function () {
            $.ui.documentWithTextFieldsViewer.prototype._create.call(this);
        }
    });
})(jQuery);