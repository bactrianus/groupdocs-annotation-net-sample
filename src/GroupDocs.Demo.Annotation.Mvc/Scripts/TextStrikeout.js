(function ($) {
    StrikeoutMode = {
        Strikeout: 0,
        Remove: 1
    };

    // Text strikeout structure
    var TextStrikeout = function (bounds) {
        this._init(bounds);
    };

    $.extend(TextStrikeout.prototype, {
        bounds: null,
        _init: function (bounds) {
            this.bounds = bounds;
        }
    });

    // Text strikeout group structure
    var TextStrikeoutGroup = function (textStrikeouts, annotation) {
        this._init(textStrikeouts, annotation);
    };

    $.extend(TextStrikeoutGroup.prototype, {
        _textStrikeouts: null,
        firstStrikeoutRightSide: null,
        firstStrikeoutTopSide: null,
        color: null,
        annotation: null,

        _init: function (textStrikeouts, annotation) {
            this._textStrikeouts = textStrikeouts;
            this.annotation = annotation;

            var minTop = 0;
            var strikeoutTop = 0;
            var minTopNotInitialized = true;
            this.firstStrikeoutRightSide = ko.observable(0.0);
            this.firstStrikeoutTopSide = ko.observable(0.0);
            this.color = ko.observable(jSaaspose.utils.getHexColor(annotation.penColor));

            for (var i = 0; i < this._textStrikeouts.length; i++) {
                strikeoutTop = this._textStrikeouts[i].bounds.top();
                if (minTopNotInitialized || strikeoutTop < minTop) {
                    minTopNotInitialized = false;
                    minTop = strikeoutTop;
                    this.firstStrikeoutRightSide(this._textStrikeouts[i].bounds.right());
                    this.firstStrikeoutTopSide(this._textStrikeouts[i].bounds.top());
                }
            }
        }
    });

    // Text strikeout model
    textStrikeoutModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(textStrikeoutModel.prototype, pointAnnotationModel.prototype, {
    });

    // Text strikeout view model
    textStrikeoutViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(textStrikeoutViewModel.prototype, pointAnnotationViewModel.prototype, {
        _textUnderlines: null,
        _textStrikeouts: null,
        _textStrikeoutGroups: null,
        strikeOutColor: null,
        underlineColor: null,
        strikeoutMode: StrikeoutMode.Strikeout,

        _create: function (options) {
            this._model = new textStrikeoutModel(options);
            this._init(options);
        },

        _init: function (options) {
            pointAnnotationViewModel.prototype._init.call(this, options);

            this._textUnderlines = ko.observableArray([]);
            this._textStrikeouts = ko.observableArray([]);
            this._textStrikeoutGroups = ko.observableArray([]);
            this.strikeoutMode = (options.strikeoutMode || StrikeoutMode.Strikeout);

            var self = this;
            $(this).bind({
                onAnnotationRemoved: function (e, annotation) {
                    if (annotation.type == Annotation.prototype.AnnotationType.TextStrikeout ||
                        annotation.type == Annotation.prototype.AnnotationType.TextRemoval) {

                        self.deleteTextStrikeoutGroupHandler(annotation.guid);
                    }
                    else
                        if (annotation.type == Annotation.prototype.AnnotationType.TextUnderline) {
                            self._deleteTextUnderline(annotation.guid);
                        }
                }
            });

            $(this).bind({
                onAnnotationReceived: function (e, annotation) {
                    self.receiveTextStrikeoutHandler(annotation);
                }
            });

            $(this).bind({
                onAnnotationCreated: function (e, annotation) {
                    if (annotation.type == Annotation.prototype.AnnotationType.TextStrikeout ||
                        annotation.type == Annotation.prototype.AnnotationType.TextRemoval) {

                        self.createTextStrikeoutHandler(annotation);
                    }
                    else
                        if (annotation.type == Annotation.prototype.AnnotationType.TextUnderline) {
                            self._onTextUnderlineCreated(annotation);
                        }
                }
            });

            $(this).bind({
                onReviewerColorsChanged: function (e) {
                    //self.reviewerColorsChangedHandlerStrikeout();
                    //self._updateUnderlinesColor();
                }
            });

            $(this).bind({
                onDocumentLoaded: function (e) {
                    self.clearStrikeouts();
                    self._clearUnderlines();
                }
            });

            $(this).bind({
                onSetZoom: function (e, scale) {
                    self.setTextStrikeoutZoom(scale);
                    self._onUnderlinesZoomChanged(scale);
                }
            });
        },

        createTextStrikeout: function (pageNumber, bounds, position, length, selectionCounter, rects) {
            var annotationType = (this.strikeoutMode == StrikeoutMode.Remove ?
                Annotation.prototype.AnnotationType.TextRemoval : Annotation.prototype.AnnotationType.TextStrikeout),
                color = this._getStrikeoutColor(this.userId, false);

            this.createAnnotation(annotationType, pageNumber, bounds, null, null, null, null, selectionCounter, { penColor: color }, rects);
        },

        createTextUnderline: function (pageNumber, bounds, position, length, selectionCounter, rects) {
            var color = this._getStrikeoutColor(this.userId, true);
            this.createAnnotation(Annotation.prototype.AnnotationType.TextUnderline, pageNumber, bounds, null, null, null, null, selectionCounter, { penColor: color }, rects);
        },

        createTextStrikeoutHandler: function (annotation) {
            var bounds = annotation.bounds(),
                selectable = this.getSelectableInstance(),
                pageNumber = annotation.pageNumber,
                offsets = this.getPageImageOffsets(annotation.type),
                underlineText = (annotation.type == Annotation.prototype.AnnotationType.TextUnderline);

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
            var textStrikeoutArray = [];
            var textStrikeout = null;

            for (var i = 0; i < rects.length; i++) {
                rect = rects[i].bounds;
                rect.add(new jSaaspose.Point(offsets.offsetX, Math.round(rect.height / 2)));

                textStrikeout = new TextStrikeout(rect);
                //this._textStrikeouts.push(textStrikeout);
                textStrikeoutArray.push(textStrikeout);
            }

            annotation.firstRectBounds = rects[0].bounds;

            if (annotation.penColor == null || annotation.penColor === undefined) {
                annotation.penColor = this._getStrikeoutColor(annotation.creatorGuid, underlineText);
            }

            (underlineText ? this._textUnderlines : this._textStrikeoutGroups).push(
                new TextStrikeoutGroup(textStrikeoutArray,
                                        annotation
                                        ));

            this.deselectTextInRect(annotation.bounds(), true, pageNumber, annotation.selectionCounter);
            this.deselectTextInRect(annotation.bounds(), false, pageNumber, annotation.selectionCounter);
        },

        addAnnotationFromAnotherUser: function (data) {
            var newAnnotation = pointAnnotationViewModel.prototype.addAnnotationFromAnotherUser.call(this, data);

            if (data.annotationType == Annotation.prototype.AnnotationType.TextStrikeout ||
                data.annotationType == Annotation.prototype.AnnotationType.TextRemoval) {

                this.createTextStrikeoutHandler(newAnnotation);
            }
            else
                if (data.annotationType == Annotation.prototype.AnnotationType.TextUnderline) {
                    this._onTextUnderlineCreated(newAnnotation);
                }

            return newAnnotation;
        },

        deleteTextStrikeout: function (textStrikeout) {
            this._textStrikeouts.remove(textStrikeout);
        },

        deleteTextStrikeoutGroupHandler: function (textStrikeoutGroupGuid) {
            var textStrikeoutGroupsLength = this._textStrikeoutGroups().length;
            for (var i = 0; i < textStrikeoutGroupsLength; i++) {
                var textStrikeoutGroup = this._textStrikeoutGroups()[i];
                if (textStrikeoutGroup.annotation.guid == textStrikeoutGroupGuid) {
                    this._textStrikeouts.removeAll(textStrikeoutGroup._textStrikeouts);
                    this._textStrikeoutGroups.splice(i, 1);
                    break;
                }
            }
        },

        receiveTextStrikeoutHandler: function (annotation) {
            if (annotation.type == Annotation.prototype.AnnotationType.TextStrikeout ||
                annotation.type == Annotation.prototype.AnnotationType.TextRemoval) {

                this.createTextStrikeoutHandler(annotation);
            }
            else
                if (annotation.type == Annotation.prototype.AnnotationType.TextUnderline) {
                    this._onTextUnderlineCreated(annotation);
                }
        },

        deleteAnnotationOnClient: function (annotationGuid) {
            this.deleteTextStrikeoutGroupHandler(annotationGuid);
            this._deleteTextUnderline(annotationGuid);

            pointAnnotationViewModel.prototype.deleteAnnotationOnClient.call(this, annotationGuid);
        },

        clearAllAnnotationOnClient: function () {
            this.clearStrikeouts();
            this._clearUnderlines();

            pointAnnotationViewModel.prototype.clearAllAnnotationOnClient.call(this);
        },

        setTextStrikeoutZoom: function (value) {
            //pointAnnotationViewModel.prototype.setZoom.call(this, value);
            var annotationCount = this._textStrikeoutGroups().length;
            var annotations = [];
            var i;
            for (i = 0; i < annotationCount; i++) {
                var textStrikeoutGroup = this._textStrikeoutGroups()[i];
                annotations.push(textStrikeoutGroup.annotation);
            }

            this._textStrikeouts.removeAll();
            this._textStrikeoutGroups.splice(0, annotationCount);

            for (i = 0; i < annotations.length; i++) {
                this.createTextStrikeoutHandler(annotations[i]);
            }
            this.reviewerColorsChangedHandlerStrikeout();
        },

        deleteTextStrikeoutGroup: function (viewModel, textStrikeoutGroup) {
            viewModel.removeAnnotation(textStrikeoutGroup.annotation);
            viewModel._textStrikeouts.removeAll(textStrikeoutGroup._textStrikeouts);
            viewModel._textStrikeoutGroups.remove(textStrikeoutGroup);
        },

        reviewerColorsChangedHandlerStrikeout: function () {
            for (var i = 0; i < this._textStrikeoutGroups().length; i++) {
                var colorOfReviewer = this.getRgbColorOfReviewer(this._textStrikeoutGroups()[i].annotation.creatorGuid);
                if (colorOfReviewer)
                    this._textStrikeoutGroups()[i].color(colorOfReviewer);
            }
        },

        clearStrikeouts: function () {
            this._textStrikeouts.removeAll();
            this._textStrikeoutGroups.removeAll();
        },

        // underline text methods
        setTextUnderlineAnnotationMode: function () {
            this.setAnnotationMode($.ui.dvselectable.prototype.SelectionModes.SelectText);
            this.annotationModeObservable(Annotation.prototype.AnnotationType.TextUnderline);
        },

        _onTextUnderlineCreated: function (annotation) {
            this.createTextStrikeoutHandler(annotation);
        },

        _deleteTextUnderline: function (guid) {
            var count = this._textUnderlines().length;

            for (var i = 0; i < count; i++) {
                var underline = this._textUnderlines()[i];

                if (underline.annotation.guid == guid) {
                    this._textUnderlines.splice(i, 1);
                    break;
                }
            }
        },

        _clearUnderlines: function () {
            this._textUnderlines.removeAll();
        },

        _updateUnderlinesColor: function () {
            for (var i = 0; i < this._textUnderlines().length; i++) {
                var color = this.getRgbColorOfReviewer(this._textUnderlines()[i].creatorGuid);

                if (color) {
                    this._textUnderlines()[i].color(color);
                }
            }
        },

        _onUnderlinesZoomChanged: function (value) {
            var count = this._textUnderlines().length,
                annotations = [],
                i;

            for (i = 0; i < count; i++) {
                annotations.push(this._textUnderlines()[i].annotation);
            }

            this._textUnderlines.splice(0, count);

            for (i = 0; i < annotations.length; i++) {
                this._onTextUnderlineCreated(annotations[i]);
            }

            this._updateUnderlinesColor();
        },

        _getStrikeoutColor: function (userId, underlineText) {
            var color = (underlineText ? this.underlineColor : this.strikeOutColor) || this._getHexReviewerColor(userId) || '#ff0000';
            return parseInt(color.replace('#', '0x'));
        }
    });

    $.widget('ui.docTextStrikeoutViewer', $.ui.docPointAnnotationViewer, {
        _createViewModel: function () {
            return new textStrikeoutViewModel(this.options);
        },

        _create: function () {
            $(
            "<!-- ko foreach: _textStrikeoutGroups -->" +
            "  <!-- ko if: (annotation.type == Annotation.prototype.AnnotationType.TextStrikeout) -->" +
            "   <a class='anno_del small_button blue_button popupa' data-bind=\"style: {left: $root.pageLeft() + firstStrikeoutRightSide() + 'px', " +
            "                                                                           top: firstStrikeoutTopSide() + 'px'}, " +
            "                                                                   click: $root.deleteTextStrikeoutGroup.bind($data, $root) \" " +
            "      href='#'>Delete</a>" +
            "  <!-- /ko -->" +
            "   <!-- ko foreach: _textStrikeouts -->" +
            "       <div class='textStrikeout' data-bind=\"style: { left: $root.pageLeft() + bounds.left() + 'px', " +
            "                                                       top: bounds.top() + 'px', " +
            "                                                       width: bounds.width() + 'px', " +
            "                                                       height: bounds.height() + 'px'}," +
            "                                                       event: { mouseenter: function() { $root.hoveredAnnotation($parent.annotation); }, mouseleave: function() { $root.hoveredAnnotation(null); } }," +
            "                                              click: function () { var a = $parent.annotation; $root.markerClickHandler(a); } \">" +
            "           <div class='textStrikeoutLine' data-bind=\"style: { backgroundColor: $parent.color(), top: bounds.height() / 2 + 'px'} \"></div>" +
            "       </div>" +
            "   <!-- /ko -->" +
            "<!-- /ko -->" +

            "<!-- ko foreach: _textUnderlines -->" +
            "  <!-- ko foreach: _textStrikeouts -->" +
            "    <div class='textStrikeout' data-bind=\"style: { left: $root.pageLeft() + bounds.left() + 'px', " +
            "                                                    top: bounds.top() + 'px', " +
            "                                                    width: bounds.width() + 'px', " +
            "                                                    height: bounds.height() + 'px' }," +
            "                                                    event: { mouseenter: function() { $root.hoveredAnnotation($parent.annotation); }, mouseleave: function() { $root.hoveredAnnotation(null); } }," +
            "                                           click: function () { var a = $parent.annotation; $root.markerClickHandler(a); } \">" +
            "      <div class='textStrikeoutLine' data-bind=\"style: { backgroundColor: $parent.color(), top: bounds.height() + 'px'} \"></div>" +
            "    </div>" +
            "  <!-- /ko -->" +
            "<!-- /ko -->"
            ).appendTo(this.options.graphicsContainerElement);

            $.ui.docPointAnnotationViewer.prototype._create.call(this);
        }
    });
})(jQuery);
