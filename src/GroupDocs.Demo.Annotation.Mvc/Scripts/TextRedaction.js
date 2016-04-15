(function ($) {
    // Text redaction structure
    var TextRedaction = function (bounds) {
        this._init(bounds);
    };

    $.extend(TextRedaction.prototype, {
        bounds: null,
        _init: function (bounds) {
            this.bounds = bounds;
        }
    });

    // Text strikeout group structure
    var TextRedactionGroup = function (textRedactions, annotation, pageNumber) {
        this._init(textRedactions, annotation, pageNumber);
    };

    $.extend(TextRedactionGroup.prototype, {
        textRedactions: null,
        annotation: null,

        _init: function (textRedactions, annotation, pageNumber) {
            this.textRedactions = textRedactions;
            this.annotation = annotation;
            this.pageNumber = pageNumber;
        }
    });


    // Text redaction model
    window.textRedactionModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(textRedactionModel.prototype, textReplacementModel.prototype, {
    });


    // Text redaction view model
    textRedactionViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(textRedactionViewModel.prototype, textReplacementViewModel.prototype, {
        _textRedactionGroups: null,

        _create: function (options) {
            this._model = new textRedactionModel(options);
            this._init(options);
        },

        _init: function (options) {
            textReplacementViewModel.prototype._init.call(this, options);

            this._textRedactionGroups = ko.observableArray([]);

            var self = this;

            $(this).bind({
                onAnnotationRemoved: function (e, annotation) {
                    if (annotation.type == Annotation.prototype.AnnotationType.TextRedaction) {
                        self._onTextRedactionAnnotationRemoved(annotation.guid);
                    }
                },

                onAnnotationReceived: function (e, annotation) {
                    self._onTextRedactionAnnotationCreated(annotation);
                },

                onAnnotationCreated: function (e, annotation) {
                    self._onTextRedactionAnnotationCreated(annotation);
                },

                onDocumentLoaded: function (e) {
                    self._clearTextRedactions();
                },

                onSetZoom: function (e, scale) {
                    self._onTextRedactionZoomSet(scale);
                }
            });
        },

        setTextRedactionAnnotationMode: function () {
            this.setAnnotationMode($.ui.dvselectable.prototype.SelectionModes.SelectText);
            this.annotationModeObservable(Annotation.prototype.AnnotationType.TextRedaction);
        },


        createTextRedactionAnnotation: function (pageNumber, bounds, position, length, selectionCounter, rects) {
            this.createAnnotation(Annotation.prototype.AnnotationType.TextRedaction, pageNumber, bounds, null, null, null, null, selectionCounter, null, rects);
        },

        _onTextRedactionAnnotationCreated: function (annotation) {
            if (annotation.type != Annotation.prototype.AnnotationType.TextRedaction) {
                return;
            }

            var bounds = annotation.bounds();
            var selectable = this.getSelectableInstance();
            var pageNumber = annotation.pageNumber;

            if (this.storeAnnotationCoordinatesRelativeToPages) {
                bounds = this.convertPageAndRectToScreenCoordinates(pageNumber, annotation.bounds());
            }
            else {
                bounds = this.convertRectToScreenCoordinates(annotation.bounds());
                pageNumber = parseInt(selectable.findPageAtVerticalPosition(annotation.bounds().top()).pageId) - 1;
            }

            bounds = bounds.round();

            var rect = null;
            var rects = selectable.getRowsFromRect(bounds);
            var textRedactionArray = [];
            var textRedaction = null;

            for (var i = 0; i < rects.length; i++) {
                textRedaction = new TextRedaction(rects[i].bounds);
                textRedactionArray.push(textRedaction);
            }

            annotation.firstRectBounds = rects[0].bounds;

            this._textRedactionGroups.push(
                new TextRedactionGroup(textRedactionArray,
                                    annotation,
                                    pageNumber
                                    ));

            this.deselectTextInRect(annotation.bounds(), true, pageNumber, annotation.selectionCounter);
        },

        addAnnotationFromAnotherUser: function (data) {
            var annotation = textReplacementViewModel.prototype.addAnnotationFromAnotherUser.call(this, data);

            if (data.annotationType == Annotation.prototype.AnnotationType.TextRedaction) {
                this._onTextRedactionAnnotationCreated(annotation);
            }

            return annotation;
        },

        _onTextRedactionAnnotationRemoved: function (groupGuid) {
            for (var i = 0; i < this._textRedactionGroups().length; i++) {
                var group = this._textRedactionGroups()[i];

                if (group.annotation.guid == groupGuid) {
                    this._textRedactionGroups.splice(i, 1);
                    break;
                }
            }
        },

        deleteAnnotationOnClient: function (annotationGuid) {
            this._onTextRedactionAnnotationRemoved(annotationGuid);
            textReplacementViewModel.prototype.deleteAnnotationOnClient.call(this, annotationGuid);
        },


        clearAllAnnotationOnClient: function () {
            this._clearTextRedactions();
            textReplacementViewModel.prototype.clearAllAnnotationOnClient.call(this);
        },

        _onTextRedactionZoomSet: function (value) {
            var annotationCount = this._textRedactionGroups().length;
            var annotations = [];
            var i;

            for (i = 0; i < annotationCount; i++) {
                var textRedactionGroup = this._textRedactionGroups()[i];
                annotations.push(textRedactionGroup.annotation);
            }

            this._textRedactionGroups.splice(0, annotationCount);

            for (i = 0; i < annotations.length; i++) {
                this._onTextRedactionAnnotationCreated(annotations[i]);
            }
        },

        deleteTextRedactionGroup: function (viewModel, group) {
            viewModel.removeAnnotation({ guid: group.annotation.guid, type: group.annotation.type });
            viewModel._textRedactionGroups.remove(group);
        },

        _clearTextRedactions: function () {
            this._textRedactionGroups.removeAll();
        }
    });

    $.widget('ui.textRedactionViewer', $.ui.documentWithAnnotationsViewer, {
        _createViewModel: function () {
            return new TextRedactionViewModel(this.options);
        },

        _create: function () {
            $(
                "<!-- ko foreach: _textRedactionGroups -->" +
                "   <!-- ko foreach: textRedactions -->" +
                "       <div class='redactiontextarea' style='z-index: 25;' data-bind=\"style: { left: $root.pageLeft() + bounds.left() + 'px', " +
                "                                                       top: bounds.top() + 'px', " +
                "                                                       width: bounds.width() + 'px', " +
                "                                                       height: bounds.height() + 'px'}," +
                "                                                       event: { mouseenter: function() { $root.hoveredAnnotation($parent.annotation); }, mouseleave: function() { $root.hoveredAnnotation(null); } }," +
                "                                              click: function () { var a = $parent.annotation; $root.markerClickHandler(a); } \">" +
                //"           <div class='redactiontextarea' data-bind=\"style: { top: bounds.height() / 2 + 'px' } \"></div>" +
                "       </div>" +
                "   <!-- /ko -->" +
                "<!-- /ko -->"
            ).appendTo(this.options.graphicsContainerElement);

            $.ui.documentWithAnnotationsViewer.prototype._create.call(this);
        }
    });
})(jQuery);
