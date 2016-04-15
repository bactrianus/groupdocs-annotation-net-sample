(function ($) {
    window.textReplacementModel = function (options) {
        $.extend(this, options);
        this._init();
    };


    // Text replacement tool model
    $.extend(textReplacementModel.prototype, watermarkModel.prototype, {
    });


    // Text replacement tool view model
    window.textReplacementViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(textReplacementViewModel.prototype, watermarkViewModel.prototype, {
        _replacements: null,
        _margins: { top: 50 },

        _create: function (options) {
            this._model = new textReplacementModel(options);
            this._init(options);
        },

        _init: function (options) {
            watermarkViewModel.prototype._init.call(this, options);
            var self = this;
            this._replacements = ko.observableArray([]);


            $(this).bind({
                onAnnotationReceived: function (e, annotation) {
                    self._onReplacementAnnotationCreated(annotation);
                },

                onAnnotationCreated: function (e, annotation) {
                    self._onReplacementAnnotationCreated(annotation);
                },

                onAnnotationRemoved: function (e, annotation) {
                    self._onReplacementAnnotationRemoved(annotation);
                }
            });
        },

        _onReplacementAnnotationCreated: function (annotation) {
            if (annotation.type != Annotation.prototype.AnnotationType.TextReplacement) {
                return;
            }

            var bounds = annotation.displayBounds(),
                pageNumber = annotation.pageNumber,
                selectable = this.getSelectableInstance();

            if (selectable._findPageAt(bounds.topLeft) != null)
                annotation.startingPoint = bounds.topLeft;
            else
                if (selectable._findPageAt(bounds.bottomRight) != null)
                    annotation.startingPoint = bounds.bottomRight;

            if (this.storeAnnotationCoordinatesRelativeToPages) {
                bounds = this.convertPageAndRectToScreenCoordinates(pageNumber, annotation.bounds());
            }
            else {
                bounds = this.convertRectToScreenCoordinates(annotation.bounds());
                pageNumber = parseInt(selectable.findPageAtVerticalPosition(annotation.bounds().top()).pageId) - 1;
            }

            bounds = bounds.round();

            var typewriter = new TextField(bounds.left(), bounds.bottom() + this._margins.top, bounds.width(), bounds.height(), annotation);
            typewriter.toolbarIsVisible(false);

            try {
                typewriter.REPLACETEXT = window.localizedStrings["Replace"];
            } catch (e) {
                typewriter.REPLACETEXT = "Replace";
            }

            this._replacements.push(typewriter);
        },

        _onReplacementAnnotationRemoved: function (annotation) {
            if (annotation == null || annotation.type != Annotation.prototype.AnnotationType.TextReplacement) {
                return;
            }

            var i = this._indexOfReplacementAnnotation(annotation.guid);
            if (i >= 0) {
                var typewriter = this._replacements()[i];

                this._replacements.splice(i, 1);
                this.deselectTextInRect(annotation.bounds(), false, annotation.pageNumber, annotation.selectionCounter);
            }
        },

        _indexOfReplacementAnnotation: function (guid) {
            for (var i = 0; i < this._replacements().length; i++) {
                var typewriter = this._replacements()[i];

                if (typewriter.annotation.guid == guid) {
                    return i;
                }
            }

            return -1;
        },

        setReplacementAnnotationMode: function () {
            this.setAnnotationMode($.ui.dvselectable.prototype.SelectionModes.SelectText);
            this.annotationModeObservable(Annotation.prototype.AnnotationType.TextReplacement);
        },

        createReplacementAnnotation: function (pageNumber, bounds, position, length, selectionCounter, rects) {
            this.createAnnotation(Annotation.prototype.AnnotationType.TextReplacement, pageNumber, bounds, null, null, null, null, selectionCounter, null, rects);
        },

        addAnnotationFromAnotherUser: function (data) {
            var annotation = watermarkViewModel.prototype.addAnnotationFromAnotherUser.call(this, data);

            this._onReplacementAnnotationCreated(annotation);
            return annotation;
        },

        deleteAnnotationOnClient: function (annotationGuid) {
            var annotation = this.findAnnotation(annotationGuid);
            this._onReplacementAnnotationRemoved(annotation);

            watermarkViewModel.prototype.deleteAnnotationOnClient.call(this, annotationGuid);
        },

        updateTextFieldOnClient: function (annotationGuid, text, fontFamily, fontSize) {
            watermarkViewModel.prototype.updateTextFieldOnClient.call(this, annotationGuid, text, fontFamily, fontSize);

            var i = this._indexOfReplacementAnnotation(annotationGuid);
            if (i >= 0) {
                var typewriter = this._replacements()[i];

                typewriter.text(text);
                typewriter.selectedFontFamily(fontFamily);
                typewriter.selectedFontSize(fontSize);
            }
        }

    });

    // Text replacement viewer widget
    /*
    $.widget('ui.documentAnnotation', $.ui.documentWithAnnotationsViewer, {
    _createViewModel: function () {
    return new textReplacementViewModel(this.options);
    },

    _create: function () {
    $.ui.documentWithAnnotationsViewer.prototype._create.call(this);
    }
    });
    */
})(jQuery);