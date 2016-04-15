(function ($) {
    // A structure
    window.TextField = function (left, top, width, height, text, fontFamily, fontSize) {
        this._init(left, top, width, height, text, fontFamily, fontSize);
    };

    $.extend(TextField.prototype, {
        guid: "",
        //left: 0, top: 0, width: 0, height: 0,
        bounds: null,
        annotation: null,
        text: null,
        selectedFontFamily: null,
        selectedFontSize: null,
        //fontColor: null,
        fontFamilies: ["Arial", "Verdana", "Microsoft Sans Serif"],
        fontSizes: [10, 11, 12, 13, 14, 15, 16, 17],
        toolbarIsVisible: null,
        mouseIsOver: null,
        activated: null,

        _init: function (left, top, width, height, annotation) {
            //this.left = left;
            //this.top = top;
            //this.width = width;
            //this.height = height;
            this.bounds = ko.observable(new jSaaspose.Rect(left, top, left + width, top + height));
            this.text = ko.observable(annotation.text);
            this.selectedFontFamily = ko.observable(annotation.fontFamily || this.fontFamilies[0]);
            this.selectedFontSize = ko.observable(annotation.fontSize || this.fontSizes[0]);
            this.annotation = annotation;
            this.toolbarIsVisible = ko.observable(true);
            this.mouseIsOver = ko.observable(false);
            this.activated = ko.observable(true);
            //this.fontColor = ko.observable(0);
        }
    });

    window.textFieldModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(textFieldModel.prototype, polylineAnnotationModel.prototype, {
        saveTextField: function (fileId, annotationGuid, text, fontFamily, fontSize, callback, errorCallback) {
            this._portalService.saveTextFieldAsync($.connection.hub.id, this.userId, this.userKey, fileId, annotationGuid,
                                                        text, fontFamily, fontSize,
                function (response) {
                    callback.apply(this, [response]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        },

        setTextFieldColor: function (fileId, annotationGuid, fontColor, callback, errorCallback) {
            this._portalService.setTextFieldColorAsync($.connection.hub.id, this.userId, this.userKey, fileId, annotationGuid,
                                                       fontColor,
                function (response) {
                    callback.apply(this, [response]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        },

        setAnnotationBackgroundColor: function (fileId, annotationGuid, color, callback, errorCallback) {
            this._portalService.setAnnotationBackgroundColorAsync($.connection.hub.id, fileId, annotationGuid, color,
                function (response) {
                    callback.apply(this, [response]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        }
    });


    window.textFieldViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(textFieldViewModel.prototype, polylineAnnotationViewModel.prototype, {
        _textFields: null,
        fontFamilies: null,
        fontSizes: null,
        fontColors: null,

        _create: function (options) {
            this._model = new textFieldModel(options);
            this._init(options);
        },

        _init: function (options) {
            polylineAnnotationViewModel.prototype._init.call(this, options);

            this._textFields = ko.observableArray([]);
            this.fontColors = ko.observableArray([0x0, 0xff0000, 0xffa500, 0xff00, 0xff]);

            var self = this;
            $(this).bind({
                onAnnotationRemoved: function (e, annotation) {
                    if (annotation.type == Annotation.prototype.AnnotationType.TextField) {
                        self.deleteTextFieldByAnnotationGuid(annotation.guid);
                    }
                }
            });

            $(this).bind({
                onAnnotationReceived: function (e, annotation) {
                    if (annotation.type == Annotation.prototype.AnnotationType.TextField) {
                        self.receiveTextFieldHandler(annotation);
                    }
                }
            });

            $(this).bind({
                onAnnotationCreated: function (e, annotation) {
                    self.createTextFieldHandler(annotation);
                }
            });

            //$(this).bind({
            //    onReviewerColorsChanged: function (e) {
            //        self.reviewerColorsChangedHandlerTextField();
            //    }
            //});

            $(this).bind({
                onDocumentLoaded: function (e) {
                    self.clearTextFields();
                }
            });

            $(this).bind({
                onSetZoom: function (e, scale) {
                    self.setTextFieldZoom(scale);
                }
            });

            $(this).bind({
                onAnnotationMarkerMovedOnClient: function (e, annotationGuid, position, pageNumber) {
                    self.moveAnnotationMarkerOnClientTextField(annotationGuid, position, pageNumber);
                }
            });
        },

        createTextField: function (pageNumber, bounds) {
            this.createAnnotation(Annotation.prototype.AnnotationType.TextField, pageNumber, bounds, null, null, null, null, null, null, null, null, this.typewriterFont);
        },


        createTextFieldHandler: function (annotation) {
            if (annotation.type != Annotation.prototype.AnnotationType.TextField) {
                return;
            }

            var bounds = annotation.displayBounds();
            var selectable = this.getSelectableInstance();

            if (selectable._findPageAt(bounds.topLeft) != null)
                annotation.startingPoint = bounds.topLeft;
            else if (selectable._findPageAt(bounds.bottomRight) != null)
                annotation.startingPoint = bounds.bottomRight;

            var textField = new TextField(bounds.left(), bounds.top(), bounds.width(), bounds.height(), annotation);
            this._textFields.push(textField);
        },

        getDraggableOptionsForTextFields: function (textField) {
            var self = this;
            var initialBounds, originalPos;
            var annotation = textField.annotation;
            return {
                start: function (event, ui) {
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
                    if (ui.position.left + ui.helper.context.offsetWidth > currentPage.rect.bottomRight.x) {
                        ui.position = currentPage.rect.bottomRight.x;
                        return;
                    }
                    if (ui.position.top + ui.helper.context.offsetHeight > currentPage.rect.bottomRight.y) {
                        ui.position = currentPage.rect.bottomRight.x;
                        return;
                    }
                    if (ui.position.top < currentPage.rect.topLeft.y) {
                        ui.position = currentPage.rect.topLeft.y;
                        return;
                    }
                    if (ui.position.left < currentPage.rect.topLeft.x) {
                        ui.position = currentPage.rect.topLeft.x;
                        return;
                    }
                    var currentDisplayOrigin = new jSaaspose.Point(ui.position.left, ui.position.top);
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
                    //textField.bounds(annotation.displayBounds());
                    textField.bounds(annotation.bounds());
                },

                stop: function (event, ui) {
                    if (initialBounds.left() != annotation.displayBounds().left() || initialBounds.top() != annotation.displayBounds().top()) {
                        self.draggedMarker = true;
                        self.moveAnnotationMarker(annotation, { x: annotation.bounds().topLeft.x, y: annotation.bounds().topLeft.y }, originalPos);
                    }
                },

                handle: $(".ta_move")
            };
        },

        getDraggableOptionsForResizeMarker: function (textField) {
            var self = this;
            var initialBounds, originalSize;
            var annotation = textField.annotation;
            var previousPosition;
            return {
                start: function (event, ui) {
                    self.draggedMarker = true;
                    initialBounds = annotation.displayBounds();
                    originalSize = { width: annotation.bounds().width(), height: annotation.bounds().height() };
                },

                drag: function (event, ui) {
                    var textBox = ui.helper.parent().find(".doc_text_area_text");
                    var textBoxWidth = textBox.width();
                    var textBoxHeight = textBox.height();

                    var currentWidth = ui.position.left; // -initialBounds.left();
                    var currentHeight = ui.position.top; // -initialBounds.top();
                    if (currentWidth < 0) {
                        currentWidth = 0;
                        ui.position.left = textBoxWidth;
                    }
                    if (currentHeight < 0) {
                        currentHeight = 0;
                        ui.position.top = textBoxHeight;
                    }
                    var annotationBounds = annotation.bounds();
                    var annotationDisplayBounds = annotation.displayBounds();
                    var displayRightBottom = new jSaaspose.Point(annotationDisplayBounds.left() + currentWidth,
                                                                 annotationDisplayBounds.top() + currentHeight);

                    var rightBottom;
                    if (self.storeAnnotationCoordinatesRelativeToPages) {
                        rightBottom = self.convertPointToRelativeToPageUnscaledCoordinates(displayRightBottom, displayRightBottom);
                    }
                    else {
                        rightBottom = self.convertPointToAbsoluteCoordinates(displayRightBottom, displayRightBottom);
                    }

                    annotation.bounds(new jSaaspose.Rect(annotationBounds.left(), annotationBounds.top(),
                        rightBottom.x, rightBottom.y));
                    self.updateAnnotationDisplayPosition(annotation);
                    //textField.bounds(annotation.displayBounds());
                    textField.bounds(annotation.bounds());
                    if ((currentWidth < textBoxWidth - 1) && previousPosition)
                        ui.position.left = textBoxWidth;
                    if ((currentHeight < textBoxHeight - 1) && previousPosition)
                        ui.position.top = textBoxHeight;
                    previousPosition = ui.position;
                },

                stop: function (event, ui) {
                    if (initialBounds.width() != annotation.displayBounds().width() || initialBounds.height() != annotation.displayBounds().height()) {
                        self.resizeAnnotation(annotation, annotation.bounds().width(), annotation.bounds().height(), originalSize);
                    }
                }
            };
        },

        deleteAnnotationHandler: function (e, annotation) {
            this.deleteTextFieldByAnnotationGuid(annotation.guid);
        },

        receiveTextFieldHandler: function (annotation) {
            if (annotation.type == Annotation.prototype.AnnotationType.TextField) {
                this.createTextFieldHandler(annotation);
            }
        },

        addAnnotationFromAnotherUser: function (data) {
            var newAnnotation = window.polylineAnnotationViewModel.prototype.addAnnotationFromAnotherUser.call(this, data);
            if (newAnnotation.type == Annotation.prototype.AnnotationType.TextField) {
                this.createTextFieldHandler(newAnnotation);
            }
            return newAnnotation;
        },

        deleteAnnotationOnClient: function (annotationGuid) {
            this.deleteTextFieldByAnnotationGuid(annotationGuid);
            window.polylineAnnotationViewModel.prototype.deleteAnnotationOnClient.call(this, annotationGuid);
        },

        clearAllAnnotationOnClient: function () {
            this._textFields.removeAll();
            window.polylineAnnotationViewModel.prototype.clearAllAnnotationOnClient.call(this);
        },

        deleteTextFieldByAnnotationGuid: function (annotationGuid) {
            for (var i = 0; i < this._textFields().length; i++) {
                var textField = this._textFields()[i];
                if (textField.annotation.guid == annotationGuid) {
                    this._textFields.splice(i, 1);
                    break;
                }
            }
        },

        saveTextField: function (textField) {
            if (textField.annotation.guid) {
                var text = jGroupdocs.html.toText(textField.text());
                this._model.saveTextField(this.fileId, textField.annotation.guid, text,
                                          textField.selectedFontFamily(), textField.selectedFontSize(),
                    function (response) {
                    } .bind(this),
                    function (error) {
                        this._onError(error);
                    } .bind(this));
            }
        },

        setTextFieldColor: function (textField) {
            if (textField.annotation.guid) {
                this._model.setTextFieldColor(this.fileId, textField.annotation.guid, textField.annotation.fontColor(),
                function (response) {
                } .bind(this),
                function (error) {
                    this._onError(error);
                } .bind(this));
            }
        },

        setAnnotationBackgroundColor: function (annotation) {
            if (annotation.guid) {
                this._model.setAnnotationBackgroundColor(this.fileId, annotation.guid, annotation.backgroundColor(),
                    function (response) {
                    } .bind(this),
                    function (error) {
                        this._onError(error);
                    } .bind(this));
            }
        },

        updateTextFieldOnClient: function (annotationGuid, text, fontFamily, fontSize) {
            var textField = this.findTextFieldByAnnotationGuid(annotationGuid);
            if (textField != null) {
                textField.text(text);
                textField.selectedFontFamily(fontFamily);
                textField.selectedFontSize(fontSize);
            }
        },

        findTextFieldByAnnotationGuid: function (annotationGuid) {
            for (var i = 0; i < this._textFields().length; i++) {
                var textField = this._textFields()[i];
                if (textField.annotation.guid == annotationGuid) {
                    return textField;
                }
            }
            return null;
        },

        setTextFieldZoom: function (value) {
            //window.polylineAnnotationViewModel.prototype.setZoom.call(this, value);
            this.updateTextFieldsDisplayPosition(this._textFields, this.createTextFieldHandler);
        },

        updateTextFieldsDisplayPosition: function (textFieldsObservableArray, createTextFieldHandler) {
            var textFieldCount = textFieldsObservableArray().length;
            //var annotations = [];
            var i;
            for (i = 0; i < textFieldCount; i++) {
                var textField = textFieldsObservableArray()[i];
                var annotation = textField.annotation;
                //annotation.text = textField.text();
                //annotation.fontFamily = textField.selectedFontFamily();
                //annotation.fontSize = textField.selectedFontSize();
                this.updateAnnotationDisplayPosition(annotation);
                //annotations.push(annotation);
                var bounds = annotation.bounds().clone();
                //textField.bounds(bounds);
                annotation.bounds(bounds);
            }

            //            textFieldsObservableArray.removeAll();
            //            for (i = 0; i < annotations.length; i++) {
            //                createTextFieldHandler.call(this, annotations[i]);
            //            }
        },

        clearTextFields: function () {
            this._textFields.removeAll();
        },

        convertRectToScreenCoordinatesForPage: function (rect, resultPageNumber) {
            var selectable = this.getSelectableInstance();
            var scale = this.scale();
            var pageHeight = this.getPageHeight();
            var pageNumber;
            if (rect.top() < 0) {
                rect.setTop(0);
            }
            pageNumber = Math.floor(rect.top() * scale / pageHeight);

            var bounds;
            bounds = rect.clone();
            bounds.scale(scale);
            bounds.subtract(new jSaaspose.Point(0, pageNumber * pageHeight));
            bounds.add(selectable.pages[resultPageNumber].rect.topLeft);
            return bounds;
        },

        moveAnnotationMarkerOnClientTextField: function (annotationGuid, position, pageNumber) {
            var textField = this.findTextFieldByAnnotationGuid(annotationGuid);
            if (textField != null) {
                var annotation = textField.annotation;
                var annotationBounds = annotation.bounds();
                annotation.bounds(new jSaaspose.Rect(position.x, position.y,
                    position.x + annotationBounds.width(), position.y + annotationBounds.height()));
                annotation.pageNumber = pageNumber;
                this.updateAnnotationDisplayPosition(annotation);
                textField.bounds(annotation.displayBounds());
            }
        },

        resizeAnnotationOnClient: function (annotationGuid, width, height) {
            var textField = this.findTextFieldByAnnotationGuid(annotationGuid);
            if (textField != null) {
                var annotation = textField.annotation;
                this.setTextFieldSize(annotation, width, height);
            }
        },

        setTextFieldSize: function (annotation, width, height) {
            var annotationBounds = annotation.bounds();
            annotation.bounds(new jSaaspose.Rect(annotationBounds.left(), annotationBounds.top(),
                                  annotationBounds.left() + width, annotationBounds.top() + height));
            this.updateAnnotationDisplayPosition(annotation);
        },

        setTextFieldColorOnClient: function (annotationGuid, fontColor) {
            var textField = this.findTextFieldByAnnotationGuid(annotationGuid);
            if (textField != null) {
                textField.annotation.fontColor(fontColor);
            }
        },

        setAnnotationBackgroundColorOnClient: function (annotationGuid, color) {
            var textField = this.findTextFieldByAnnotationGuid(annotationGuid);
            if (textField != null) {
                textField.annotation.backgroundColor(color);
            }
        }

    });


    $.widget('ui.documentWithTextFieldsViewer', $.ui.docPolylineAnnotationViewer, {
        _createViewModel: function () {
            return new textFieldViewModel(this.options);
        },

        _create: function () {
            /*$(
            "<!-- ko foreach: _textFields -->" +
            "       <div style='position:absolute;border:2px dashed gray;background: none repeat scroll 0 0 #FFFFFF;z-index:1' " +
            "            data-bind=\"style: {left: left + 'px', " +
            "                                top: top + 'px', " +
            "                                minWidth: width + 'px', " +
            "                                minHeight: height + 'px'}, " +
            "                htmlValue: text, " +
            "                attr: {contenteditable: $root.activeAnnotation() == $data.annotation}, " +
            "                hasfocus: $root.activeAnnotation() == $data.annotation, " +
            "                click: function(){if ($root.activeAnnotation() != $data.annotation)$root.activeAnnotation($data.annotation);return false;}," +
            "                event: {mouseover: function(){$root.getSelectable().data('dvselectable')._mouseDestroy();}, " +
            "                        mouseout: function(){$root.getSelectable().data('dvselectable')._mouseInit();}, " +
            "                        koValueUpdated: function(){console.log('save:' + $data.text());$root.saveAnnotationText($data.annotation.guid, $data.text());} }," +
            "                clickBubble: false" +
            "            \" " +
            "       >" +
            "       </div>" +
            "<!-- /ko -->"
            ).appendTo(this.options.graphicsContainerElement);*/

            $.ui.docPolylineAnnotationViewer.prototype._create.call(this);
        }
    });
})(jQuery);