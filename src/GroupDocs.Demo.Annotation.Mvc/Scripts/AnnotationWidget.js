ko.bindingHandlers.focused = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        $(element).focus();
    }
};

(function ($) {
    var AnnotationTools = {
        Text: 1,
        Area: 2,
        Point: 4,
        TextStrikeout: 8,
        Polyline: 16,
        TextField: 32,
        Watermark: 64,
        TextReplacement: 128,
        Arrow: 256,
        TextRedaction: 512,
        ResourcesRedaction: 1024,
        TextUnderline: 2048,
        Distance: 4096
    };

    $.widget("ui.groupdocsAnnotation", $.ui.groupdocsViewer, {
        _viewer: null,
        _adapter: null,
        _importerUploader: null,
        viewerViewModel: null,

        options: {
            enableViewerInit: false,
            textSelectionSynchronousCalculation: true,
            usePageNumberInUrlHash: false,
            variableHeightPageSupport: true,
            useJavaScriptDocumentDescription: true,
            saveReplyOnFocusLoss: true,
            createMarkup: true,
            showSearch: true,
            undoEnabled: true,
            tooltipsEnabled: true,
            textSelectionEnabled: false,
            textSelectionByCharModeEnabled: false,
            use_pdf: 'true',
            _mode: 'annotatedDocument'
        },

        _create: function () {
            this.options.showPaging &= this.options.showHeader;
            this.options.showZoom &= this.options.showHeader;
            this.options.showSearch &= this.options.showHeader;

            if (this.options.createMarkup) {
                this._createMarkup();
            }
            $.ui.groupdocsViewer.prototype._create.apply(this, arguments);

            var self = this;
            this._viewer = this.element.find('.doc_viewer').groupdocsAnnotationViewer(
                $.extend(this.options, {
                    graphicsContainerElement: self.element.find(self.options.graphicsContainerSelector),
                    selectionContent: self.element.find(self.options.selectionContainerSelector),
                    rightSideElement: self.element.find(self.options.sideboarContainerSelector),
                    exportingAnnotationsProgress: self.element.find('.export_annotations_modal'),
                    importingAnnotationsProgress: self.element.find('.importing_annotations_modal'),
                    element: self.element,
                    showHyperlinks: false,
                    storeAnnotationCoordinatesRelativeToPages: true,
                    baseAvatarUrl: self.applicationPath + 'document-annotation/GetAvatar' + (self.useHttpHandlers ? 'Handler' : '') + '?userId=',
                    imageHorizontalMargin: 0,
                    redactionToolOptions: {
                        pen: { width: 1, color: 0x333333, dashStyle: 0 },
                        brush: { color: 0x333333 }
                    }
                })
            );

            var viewerViewModel = this.viewerViewModel = this._viewer.groupdocsAnnotationViewer('getViewModel');

            this.getViewModel().viewerAdapter = this._adapter = viewerViewModel.viewerAdapter = new DocViewerAdapter({
                docSpaceCreator: function () { return self._viewer; },
                docSpaceViewModel: function () { return viewerViewModel; },
                navigation: (this.options.showPaging ? this.element.find(".navigation-bar") : null),
                navigationOptions: { createHtml: true },
                zooming: (this.options.showZoom ? this.element.find('.zoom_wrappper') : null),
                zoomingOptions: { createHtml: true },
                thumbnails: (this.options.showThumbnails ? this.element.find(".viewer_mainwrapper") : null),
                thumbnailsOptions: {
                    createHtml: true /*, thumbnailWidth: thumbnailImageWidth*/,
                    _mode: 'webComponent'
                },
                search: (this.options.showSearch ? this.element.find("[name='search_wrapper']") : null),
                searchOptions: { createHtml: true, viewerElement: this.element.find('.doc_viewer'), searchIsVisible: this.options.showSearch, searchForSeparateWords: this.options.searchForSeparateWords }
            });

            if (!this.options.showPaging) {
                $(this.element.find('.navigation-bar')).hide();
            }

            $("html").click(function () {
                if (self._adapter.zoomViewModel) {
                    self._adapter.zoomViewModel.showDropDownMenu(false);
                }

                viewerViewModel.exportMenuOpened(false);
            });

            var thumbsButton = this.element.find(".thumbs_btn");

            thumbsButton.click(function () {
                $(this).toggleClass("thumbs_btn_slide", 'slow');
                self.element.find(".thumbnailsContainer").toggle('slide', 'slow', function () {
                    if ($.browser.msie) {
                        thumbsButton.css("background-image", "");
                        //setThumbsImage();
                    }
                });

                return false;
            });

            this.element.find('.comments_sidebar_expanded').tabs({
                selected: 2,
                show: false,
                hide: false,
                activate: function (event, ui) {
                    self.element.find('#comments_scroll').tinyscrollbar_update('relative');
                    self.element.find('#comments_scroll_2').tinyscrollbar_update('relative');
                }
            });


            this._viewer.bind('onTextSelected', function (e, pageNumber, bounds, position, length, selectionCounter, rects) {
                switch (viewerViewModel.annotationModeObservable()) {
                    case Annotation.prototype.AnnotationType.TextReplacement:
                        viewerViewModel.createReplacementAnnotation(pageNumber, bounds, position, length, selectionCounter, rects);
                        break;
                    case Annotation.prototype.AnnotationType.TextRedaction:
                        viewerViewModel.createTextRedactionAnnotation(pageNumber, bounds, position, length, selectionCounter, rects);
                        break;
                    case Annotation.prototype.AnnotationType.TextUnderline:
                        viewerViewModel.createTextUnderline(pageNumber, bounds, position, length, selectionCounter, rects);
                        break;
                    case Annotation.prototype.AnnotationType.Text:
                        viewerViewModel.createTextAnnotation(pageNumber, bounds, position, length, selectionCounter, rects);
                        break;
                }
            });

            this._viewer.bind('onTextToStrikeoutSelected', function (e, pageNumber, bounds, position, length, selectionCounter, rects) {
                viewerViewModel.createTextStrikeout(pageNumber, bounds, position, length, selectionCounter, rects);
            });


            this._viewer.bind('onRectangleSelected', function (e, pageNumber, bounds) {
                switch (viewerViewModel.annotationModeObservable()) {
                    case Annotation.prototype.AnnotationType.Area:
                        viewerViewModel.createAreaAnnotation(pageNumber, bounds);
                        break;
                    case Annotation.prototype.AnnotationType.ResourcesRedaction:
                        viewerViewModel.createResourcesRedactionAnnotation(pageNumber, bounds);
                        break;
                    case Annotation.prototype.AnnotationType.TextField:
                        viewerViewModel.createTextField(pageNumber, bounds);
                        break;
                    case Annotation.prototype.AnnotationType.Watermark:
                        viewerViewModel.createWatermark(pageNumber, bounds);
                        break;
                }
            });

            this._viewer.bind('onPointClicked', function (e, pageNumber, bounds) {
                viewerViewModel.createPointAnnotation(pageNumber, bounds);
            });

            this._viewer.bind('onMouseMoveStarted', function (e, pageNumber, point) {
                switch (viewerViewModel.annotationModeObservable()) {
                    case Annotation.prototype.AnnotationType.Arrow:
                        viewerViewModel.createGraphicsAnnotation(pageNumber, point);
                        break;
                    case Annotation.prototype.AnnotationType.Distance:
                        viewerViewModel.createDistanceAnnotation(pageNumber, point);
                        break;
                    default:
                        viewerViewModel.createPolylineAnnotation(pageNumber, point);
                        break;
                }
            });

            if (this.options.showToolbar)
                ko.applyBindings(viewerViewModel, $(this.element).find('div.embed_annotation_tools').get(0));

            if (this.options.showHeader) {
                ko.applyBindings(viewerViewModel, $(this.element).find('.tools_wrapper').get(0));
                ko.applyBindings(viewerViewModel, $(this.element).find('.undo-bar').get(0));
            }

            ko.applyBindings(viewerViewModel, $(this.element).find('.comments_sidebar_wrapper').get(0));
            ko.applyBindings(viewerViewModel, $(this.element).find("#addCollaboratorTab").get(0));
            ko.applyBindings(viewerViewModel, $(this.element).find(".viewer_alerts").get(0));

            if (!this.options.showThumbnails) {
                $(this.element).find(".thumbs_btn").hide();
            }

            if (this.options.openThumbnails) {
                $(this.element).find(".thumbs_btn").addClass("thumbs_btn_slide");
                $(this.element).find(".thumbnailsContainer").css("display", "block");
            }
            else {
                $(this.element).find(".thumbnailsContainer").css("display", "none");
            }

            if (!this.options.enableRightClickMenu) {
                $(this.element).get(0).oncontextmenu = function () { return false; }
            }

            if (this.options.showFileExplorer) {
                var fod = $(this.element).find(".fileOpenDialogWrapper").fileOpenDialog({
                    hostUrl: $.ui.groupdocsViewer.prototype.applicationPath,
                    fileExplorer: $(this.element).find(".file_browser_content"),
                    fileUploader: $(this.element).find(".file_browser_toolbar"),
                    resourcePrefix: this.options.resourcePrefix,
                    urlHashEnabled: false
                });
                fod.bind('fileSelected', function (e, metadata) { viewerViewModel.onFileSelected(metadata); $(fod).modal('hide') });
                $(fod).css({ 'display': 'none' });
            }

            // file uploader for annotations import
            this._importerUploader = $(this.element).find('.import_file_uploader').uploader({
                userId: self.options.userId,
                url: self.applicationPath + 'document-annotation',
                proxy: 'UploadFile' + (this.useHttpHandlers ? 'Handler' : ''),
                fld: 'Uploads',
                multiple: true,
                addFileBtn: $(this.element).find('.import_btn')
            });

            this._importerUploader.bind('onStart', function (e, id, fileName, fileSize) {
            });

            this._importerUploader.bind('onComplete', function (e, id, metadata) {
                /// <summary>
                /// s the specified e.
                /// </summary>
                /// <param name="e">The e.</param>
                /// <param name="id">The identifier.</param>
                /// <param name="metadata">The metadata.</param>
                /// <returns></returns>
                this.viewerViewModel.importDocumentAnnotations(metadata.fileId);
            }.bind(this));

            if (this.tooltipsEnabled) {
                $('.wt-icon').click(expandAnnotationTooltip);

                $('.wt-close').click(function (e) {
                    e.preventDefault();
                    $(this).parents('.wt-container').hide();

                });

                $('.icon-expand').click(function (e) {
                    e.preventDefault();
                    $(this).parents('.overflowed').removeClass('overflowed');
                    $('.scrollbar').customScrollbar();
                });
            }

            this.initControlsAndHandlers();
        },

        _createMarkup: function () {
            var groupdocsViewerWrapper = this._groupdocsViewerWrapperMarkup();

            var viewerMarkup = this._viewerMarkup();
            viewerMarkup.appendTo(groupdocsViewerWrapper);

            if (this.options.showToolbar)
                this._toolboxMarkup().appendTo(groupdocsViewerWrapper);

            this._localizeControl(this._sidebarMarkup()).appendTo(groupdocsViewerWrapper);

            this._modalsMarkup().appendTo(groupdocsViewerWrapper);

            groupdocsViewerWrapper.appendTo(this.element);
        },

        _localizeControl: function (control) {

            var sourceText = control[0].innerHTML;

            var pattern = new RegExp('(@)' + '(localize)' + '(\\()' + '((?:[a-z][a-z]+))' + '(\\))', ["i"]);

            var phraseMatch;
            do {
                phraseMatch = pattern.exec(sourceText);

                if (phraseMatch) {
                    var phrase = phraseMatch[0];
                    var internalPattern = new RegExp('.*?' + '(?:[a-z][a-z]+)' + '.*?' + '((?:[a-z][a-z]+))', ["i"]);  
                    var key = internalPattern.exec(phrase);
                    var localizedWord = this.options.localizedStrings != null ? (this.options.localizedStrings[key[1]] ? this.options.localizedStrings[key[1]] : key[1]) : key[1];
                    if (localizedWord) {
                        sourceText = sourceText.replace(phrase, localizedWord);
                        control[0].innerHTML = sourceText;
                    }
                }

            } while (phraseMatch)

            return control;
        },

        _groupdocsViewerWrapperMarkup: function () {
            return $('<div class="groupdocs_viewer_wrapper grpdx">');
        },

        _viewerMarkup: function () {
            var html = '';

            if (this.element.find('[name="selection-content"]').length == 0)
                html += '  <textarea readonly="readonly" rows="1" cols="1" style="display: block !important" id="selection-content" name="selection-content" class="mousetrap"></textarea>';

            html += '' +
                (this.options.showHeader ? this._toolbarMarkup() : '') +

                '  <div class="fileOpenDialogWrapper"></div>' +
                '  <div class="viewer_alerts">' +
                '    <div data-bind="visible: !licensed()" class="banner_trial" style="position: inherit;">This has been created using an unlicensed version of  </div>' +
                '  </div>' +

                '  <div class="viewer_mainwrapper">' +
                '    <div class="doc_viewer" data-bind="event: { scroll: function(item, e) { this.ScrollDocView(item, e); }, scrollstop: function(item, e) { this.ScrollDocViewEnd(item, e);e.returnValue = false;return true; } }">' +
                '      <div class="pages_container" data-bind="css: { \'auto_cursor\': ($root.annotationModeObservable() == null),' +
                '                                        \'textanno_cursor\': ($root.annotationModeObservable() == Annotation.prototype.AnnotationType.Text),' +
                '                                        \'pointanno_cursor\': ($root.annotationModeObservable() == Annotation.prototype.AnnotationType.Point),' +
                '                                        \'area_cursor\': ($root.annotationModeObservable() == Annotation.prototype.AnnotationType.Area),' +
                '                                        \'strikeout_cursor\': ($root.annotationModeObservable() == Annotation.prototype.AnnotationType.TextStrikeout),' +
                '                                        \'polyline_cursor\': ($root.annotationModeObservable() == Annotation.prototype.AnnotationType.Polyline),' +
                '                                        \'typewritter_cursor\': ($root.annotationModeObservable() == Annotation.prototype.AnnotationType.TextField),' +
                '                                        \'watermark_cursor\': ($root.annotationModeObservable() == Annotation.prototype.AnnotationType.Watermark),' +
                '                                        \'crossarrow_cursor\': ($root.annotationModeObservable() == Annotation.prototype.AnnotationType.Arrow),' +
                '                                        \'crossarea_cursor\': ($root.annotationModeObservable() == Annotation.prototype.AnnotationType.TextRedaction),' +
                //'                                        \'crossarea_cursor\': ($root.annotationModeObservable() == Annotation.prototype.AnnotationType.ResourcesRedaction)' +
                '                                        \'underline_cursor\': ($root.annotationModeObservable() == Annotation.prototype.AnnotationType.TextUnderline),' +
                '                                        \'crossruler_cursor\': ($root.annotationModeObservable() == Annotation.prototype.AnnotationType.Distance),' +
                '                                      }">' +
                (this.options.tooltipsEnabled ? this._tooltipMarkupt() : '') +
                '        <div class="annotationsContainer">' +
                '          <div data-bind="with: $root.activeAnnotation()">' +
                '            <div data-bind="with: displayBounds().clone().normalize()">' +
                '              <div class="transformtool" data-bind="style: { left: left() + \'px\', top: top() + \'px\', width: width() + \'px\', height: height() + \'px\' }">' +
                '                <div class="bd_lr"></div>' +
                '              </div>' +
                '            </div>' +
                '          </div>' +
                '          <!-- ko foreach: annotations -->' +
                '            <span class="document_anno_icon" style="position: absolute" ' +
                '              data-bind="visible: commentsEnabled === true,' +
                '                         css: { \'text_anno\': type == 0, ' +
                '                                \'area_anno\': type == 1, ' +
                '                                \'point_anno\': type == 2, ' +
                '                                \'polyline_anno\': type == 4, ' +
                '                                \'replacetext_anno\': type == 7, ' +
                '                                \'replace_anno\': type == 8, ' +
                '                                \'arrow_anno\': type == 9, ' +
                '                                \'redtext_anno\': type == 10, ' +
                '                                \'redarea_anno\': type == 11, ' +
                '                                \'underline_anno\': type == 12, ' +
                '                                \'ruler_anno\': type == 13, ' +
                '                                \'current_anno\': $data == $parent.activeAnnotation() },' +
                '                         style: { left: $root.pageLeft() + annotationSideIconDisplayPosition().x + \'px\', ' +
                '                                  top: annotationSideIconDisplayPosition().y + \'px\' }, ' +
                '                         click: function(data, e) { $root.showExpandedCommentsPanel();' +
                '                                                    $root.activeAnnotation($data); ' +
                '                                                    $(\'#comments_scroll\').tinyscrollbar_update(\'relative\'); ' +
                '                                                    $(\'#comments_scroll_2\').tinyscrollbar_update(\'relative\'); ' +
                '                                                    return true; }, ' +
                '                         clickBubble: false">' +
                '            </span>' +
            //'            <div style="position: absolute; display: inline-block; z-index: 999; cursor: pointer;" data-bind="if: (type == 1 || type = 4), style: { left: displayBounds().left() + \'px\', top: displayBounds().top() + \'px\', width: displayBounds().width() + \'px\', height: displayBounds().height() + \'px\' }, click: function () { $root.activeAnnotation($data); }"></div>' +
                '          <!-- /ko -->' +
                '          <!-- ko foreach: _points -->' +
                '            <span class="delete_button_x" data-bind="style: {left: $data.annotation.displayBounds().left() - $data.markerWidth/2 - 15 + \'px\', ' +
                '                  top: $data.annotation.displayBounds().top() - $data.markerHeight/2 + 5 + \'px\'}, ' +
                '                  click: function() { $root.removeAnnotation($data.annotation); }, clickBubble: false,' +
                '                  visible: deleteIconIsVisible(),' +
                '                  event: { mouseenter: function() { $data.deleteIconIsVisible(true); }, mouseleave: function() { $data.deleteIconIsVisible(false); } }">' +
                '            </span>' +
                '            <div class="red_pointer" data-bind="style: { left: $data.annotation.displayBounds().left() - $data.markerWidth/2 + \'px\', ' +
                '                 top: $data.annotation.displayBounds().top() - $data.markerHeight/2 + \'px\' }, ' +
                '                 click: $root.markerClickHandler.bind($root, $data.annotation),' +
                '                 event: { mouseenter: function() { $data.deleteIconIsVisible(true); $root.hoveredAnnotation($data.annotation); }, mouseleave: function() { $data.deleteIconIsVisible(false); $root.hoveredAnnotation(null); } },' +
                '                 makeDraggable: $root.getDraggableOptions($data.annotation)">' +
                '              <span class="ta_tooltip ta_tp_move">' +
                '                <p data-bind="foreach: annotation.replies"><i data-bind="text: userName + \': \'"></i><span data-bind="text: text" /></p>' +
                '                <span class="ta_tooltip_pointer"></span>' +
                '              </span>' +
                '            </div>' +
                '          <!-- /ko -->' +
                '          <!-- ko foreach: _textFields -->' +
                '            <div style="display: none;z-index:1" class="doc_text_area" ' +
                '                 data-bind="style: {left: $data.annotation.displayBounds().left() + \'px\', top: $data.annotation.displayBounds().top() + \'px\', display: \'block\'}, ' +
                '                 makeDraggable: $root.getDraggableOptionsForTextFields($data)">' +
                '              <div class="doc_text_area_text mousetrap"' +
                '                   data-bind="htmlValue: text, ' +
                '                     style: {minWidth: $data.annotation.displayBounds().width() + \'px\', minHeight: $data.annotation.displayBounds().height() + \'px\', display: \'block\',' +
                '                             fontFamily: $data.selectedFontFamily(), fontSize: $data.selectedFontSize().toString() + \'px\',' +
                '                             color: $root.getRgbColorFromInteger($data.annotation.fontColor() || 0),' +
                '                             backgroundColor: $root.getRgbColorFromInteger($data.annotation.backgroundColor())' +
                '                             },' +
                '                     attr: {contenteditable: true},' +
                '                     event: { koValueUpdated: function(){$root.saveTextField($data);$data.toolbarIsVisible(false);return true;},' +
                '                         mouseover: function() { if (!$data.annotation.isBeingDeleted()) { var sel = $root.getSelectableInstance(); sel._mouseDestroy(); } }, ' +
                '                         mouseout: function() { if (!$data.annotation.isBeingDeleted()) { var sel = $root.getSelectableInstance(); sel._mouseInit(); } }' +
                '                     },' +
                '                     click: function() { $data.toolbarIsVisible(true); return true; },' +
                '                     hasfocus: $data.activated()"' +
                '                   spellcheck="false">' +
                '              </div>' +
                               this._textfieldToolbarMarkup() +
                '            </div>' +
                '          <!-- /ko -->' +
                        this._textReplacementMarkup() +
                        this._watermarksMarkup() +
                '        </div>' +
                '        <!-- ko foreach: pages -->' +
                '          <div class="doc-page centered_doc_page" data-bind="attr: {id: $parent.pagePrefix + number}, style: { width: $parent.pageWidth() + \'px\', height: $parent.pageWidth() * $data.prop() + \'px\', marginLeft: ($root.fullSynchronization ? \'auto\' : \'\'), marginRight: ($root.fullSynchronization ? \'auto\' : \'\') }">' +
                '            <div class="viewer_loading_overlay" data-bind="style: { zIndex: ($root.inprogress() || !visible() ? 2 : 0), width: $parent.pageWidth() + \'px\', height: $root.useTabsForPages() ? \'100%\' : ($parent.pageWidth() * $data.prop() + \'px\'), backgroundColor: ($root.inprogress() || !visible() ? \'\' : \'transparent\')}" style="width: 850px; height: 1100px;position: absolute;left:0;top:0">' +
                '              <div class="loading_overlay_message">' +
                '                <span class="progresspin"></span>' +
                '                <p data-localize="LoadingYourContent">Loading your content...</p>' +
                '              </div>' +
                '            </div>' +
                '            <div class="button-pane"></div>' +
                '            <div class="highlight-pane"></div>' +
                '            <div class="custom-pane"></div>' +
                '            <div class="search-pane"></div>' +
                '            <img class="page-image" data-bind="attr: { id: \'img-\' + number, src: (visible() ? url : \'\') },' +
                '                                            style: { width: $parent.pageWidth() + \'px\', height: $parent.pageWidth() * $data.prop() + \'px\' }"/>' +
                '          </div>' +
                '        <!-- /ko -->' +
                '      </div>' +
                '    </div>' +
                '    <a class="thumbs_btn" href="#"></a>' +
                '  </div>';

            return $($.trim(html));
        },

        _toolbarMarkup: function () {
            return '' +
                '  <div class="viewer_header header_sidescroll">' +
                '    <div class="viewer_header_wrapper">' +

                '      <div class="new_head_tools_wrapper left tools_wrapper" data-bind="visible: (canExport() || canDownload() || fileExplorerEnabled())">' +
                '        <div class="new_head_tools_dropdown_wrapper" data-bind="visible: (canExport() || canDownload())">' +
                '          <a class="new_head_tools_btn head_tool_dropdown_btn h_t_i_export link_with_pointer_cursor" data-tooltip="Export"  data-localize-tooltip="Export" data-bind="click: toggleExportMenu"></a>' +
                '          <ul class="dropdown-menu head_tool_dropdown head_tool_dropdown_export" style="display: none;" data-bind="style: { display: (exportMenuOpened() ? \'block\' : \'none\' )}">' +
                '            <li style="display: inline" data-bind="visible: canExport()">' +
                '              <a id="btnExport" class="link_with_pointer_cursor" data-bind="click: function() { exportAnnotationsTo(); }">' +
                '                <span class="h_t_d_i_pdf"></span>' +
                '                <p data-localize="PDFWithComments">PDF With Comments</p>' +
                '              </a>' +
                '            </li>' +
                '            <li style="display: inline" data-bind="visible: canExport()">' +
                '              <a id="btnExportWithoutComments" class="link_with_pointer_cursor" data-bind="click: getPdfVersionOfDocument">' +
                '                <span class="h_t_d_i_pdf"></span>' +
                '                <p data-localize="PDFWithoutComments">PDF W/O Comments</p>' +
                '              </a>' +
                '            </li>' +
                '            <li style="display: inline" data-bind="visible: canDownload()">' +
                '              <a id="btnExportOriginal" class="link_with_pointer_cursor" data-bind="click: downloadDocument">' +
                '                <span class="h_t_d_i_normal"></span>' +
                '                <p data-localize="OriginalDocument">Original Document</p>' +
                '              </a>' +
                '            </li>' +
                '          </ul>' +
                '        </div>' +
                '        <a class="new_head_tools_btn h_t_i_import import_btn import_file_uploader" data-tooltip="Import Annotations" data-localize-tooltip="ImportAnnotations"></a>' +
                '        <a data-bind="visible: fileExplorerEnabled, click: openFileExplorer" class="btnOpen new_head_tools_btn h_t_i_browser" data-tooltip="Open File" data-localize-tooltip="OpenFile"></a>' +
                '      </div>' +

                '      <div class="new_head_tools_wrapper navigation-bar">' +
                '      </div>' +
                '      <div class="new_head_tools_wrapper zoom_wrappper">' +
                '      </div>' +
                '      <div class="new_head_tools_wrapper undo-bar" data-bind="visible: undoEnabled">' +
                '        <div class="left">' +
                '          <a class="new_head_tools_btn h_t_i_undo" href="#" data-bind="click: undo, css: { disabled: !_undoRedo.canUndoObservable() }" data-tooltip="Undo" data-localize-tooltip="Undo"></a>' +
                '          <a class="new_head_tools_btn h_t_i_redo" href="#" data-bind="click: redo, css: { disabled: !_undoRedo.canRedoObservable() }" data-tooltip="Redo" data-localize-tooltip="Redo"></a>' +
                '        </div>' +
                '      </div>' +
                '      <div name="search_wrapper" class="new_head_tools_wrapper">' +
                '      </div>' +
                '    </div>' +
                '  </div>';
        },

        _toolboxMarkup: function () {
            var html = '' +
                '<div class="tools_container embed_annotation_tools" style="top: 100px;" data-bind="style: {display: $root.canAnnotate() && ($root.isToolbarEnabled || !$root.embeddedAnnotation) ? \'\' : \'none\'}">' +
                '  <span class="tools_dots"></span>' +
                '  <ul class="tools_list">' +
                '    <li>' +
                '      <button class="tool_field hand_box" data-bind="css: {\'active\': $data.annotationModeObservable() == null }, click: setHandToolMode">' +
                '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="SelectTool">Select tool</div>' +
                '      </button>' +
                '    </li>';

            if ((this.options.enabledTools & AnnotationTools.Text) == AnnotationTools.Text) {
                html +=
                    '    <li data-bind="visible: ($root.isTextAnnotationButtonEnabled || !$root.embeddedAnnotation)">' +
                    '      <button class="tool_field text_box_annotate" data-bind="css: {\'active\': $data.annotationModeObservable() == Annotation.prototype.AnnotationType.Text }, click: setTextAnnotationMode">' +
                    '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="TextAnnotation" >Text annotation</div>' +
                    '      </button>' +
                    '    </li>';
            }

            if ((this.options.enabledTools & AnnotationTools.Area) == AnnotationTools.Area) {
                html +=
                    '    <li data-bind="visible: ($root.isRectangleAnnotationButtonEnabled || !$root.embeddedAnnotation)">' +
                    '      <button class="tool_field area_box" data-bind="css: {\'active\': $data.annotationModeObservable() == Annotation.prototype.AnnotationType.Area }, click: setAreaAnnotationMode">' +
                    '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="AreaAnnotation">Area annotation</div>' +
                    '      </button>' +
                    '    </li>';
            }

            if ((this.options.enabledTools & AnnotationTools.Point) == AnnotationTools.Point) {
                html +=
                    '    <li data-bind="visible: ($root.isPointAnnotationButtonEnabled || !$root.embeddedAnnotation)">' +
                    '      <button class="tool_field point_box" data-bind="css: {\'active\': $data.annotationModeObservable() == Annotation.prototype.AnnotationType.Point }, click: setPointAnnotationMode">' +
                    '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="PointAnnotation">Point annotation</div>' +
                    '      </button>' +
                    '    </li>';
            }

            if ((this.options.enabledTools & AnnotationTools.TextStrikeout) == AnnotationTools.TextStrikeout) {
                html +=
                    '    <li data-bind="visible: ($root.isStrikeoutAnnotationButtonEnabled || !$root.embeddedAnnotation)">' +
                    '      <button class="tool_field strike_box" data-bind="css: {\'active\': $data.annotationModeObservable() == Annotation.prototype.AnnotationType.TextStrikeout }, click: setStrikeoutTextMode">' +
                    '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="StrikeoutText">Strikeout text</div>' +
                    '      </button>' +
                    '    </li>';
            }

            if ((this.options.enabledTools & AnnotationTools.Polyline) == AnnotationTools.Polyline) {
                html +=
                    '    <li data-bind="visible: ($root.isPolylineAnnotationButtonEnabled || !$root.embeddedAnnotation)">' +
                    '      <button class="tool_field polyline_box" data-bind="css: {\'active\': $data.annotationModeObservable() == Annotation.prototype.AnnotationType.Polyline }, click: setPolylineAnnotationMode">' +
                    '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="PolylineAnnotation">Polyline annotation</div>' +
                    '      </button>' +
                    '    </li>';
            }

            if ((this.options.enabledTools & AnnotationTools.TextField) == AnnotationTools.TextField) {
                html +=
                    '    <li data-bind="visible: ($root.isTypewriterAnnotationButtonEnabled || !$root.embeddedAnnotation)">' +
                    '      <button class="tool_field highlight_box" data-bind="css: {\'active\': $data.annotationModeObservable() == Annotation.prototype.AnnotationType.TextField }, click: setTextFieldAnnotationMode">' +
                    '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="TypewriterTool">Typewriter tool</div>' +
                    '      </button>' +
                    '    </li>';
            }

            if ((this.options.enabledTools & AnnotationTools.Watermark) == AnnotationTools.Watermark) {
                html +=
                '    <li data-bind="visible: ($root.isWatermarkAnnotationButtonEnabled || !$root.embeddedAnnotation)">' +
                '      <button class="tool_field watermark_box" data-bind="css: {\'active\': $data.annotationModeObservable() == Annotation.prototype.AnnotationType.Watermark }, click: setWatermarkAnnotationMode">' +
                '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="WatermarkTool">Watermark tool</div>' +
                '      </button>' +
                '    </li>';
            }

           /* if ((this.options.enabledTools & AnnotationTools.TextReplacement) == AnnotationTools.TextReplacement) {
                html +=
                '    <li>' +
                '      <button class="tool_field replace_box" data-bind="css: {\'active\': $data.annotationModeObservable() == Annotation.prototype.AnnotationType.TextReplacement }, click: setReplacementAnnotationMode">' +
                '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="TextReplacementTool">Text replacement tool</div>' +
                '      </button>' +
                '    </li>';
            }
            */
            if ((this.options.enabledTools & AnnotationTools.Arrow) == AnnotationTools.Arrow) {
                html +=
                '    <li>' +
                '      <button class="tool_field arrow_tool" data-bind="css: {\'active\': $data.annotationModeObservable() == Annotation.prototype.AnnotationType.Arrow }, click: setArrowAnnotationMode">' +
                '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="PointerTool">Pointer tool</div>' +
                '      </button>' +
                '    </li>';
            }

            if ((this.options.enabledTools & AnnotationTools.TextRedaction) == AnnotationTools.TextRedaction) {
                html +=
                '    <li data-bind="visible: canRedact()">' +
                '      <button class="tool_field redtext_box" data-bind="css: {\'active\': $data.annotationModeObservable() == Annotation.prototype.AnnotationType.TextRedaction }, click: setTextRedactionAnnotationMode">' +
                '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="TextRedactionTool">Text redaction tool</div>' +
                '      </button>' +
                '    </li>';
            }

            if ((this.options.enabledTools & AnnotationTools.ResourcesRedaction) == AnnotationTools.ResourcesRedaction) {
                html +=
                '    <li data-bind="visible: canRedact()">' +
                '      <button class="tool_field redarea_box" data-bind="css: {\'active\': $data.annotationModeObservable() == Annotation.prototype.AnnotationType.ResourcesRedaction }, click: setResourcesRedactionAnnotationMode">' +
                '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="ResourceRedactionTool">Resource redaction tool</div>' +
                '      </button>' +
                '    </li>';
            }

            if ((this.options.enabledTools & AnnotationTools.TextUnderline) == AnnotationTools.TextUnderline) {
                html +=
                '    <li>' +
                '      <button class="tool_field underline_tool" data-bind="css: {\'active\': $data.annotationModeObservable() == Annotation.prototype.AnnotationType.TextUnderline }, click: setTextUnderlineAnnotationMode">' +
                '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="UnderlineTextTool">Underline text tool</div>' +
                '      </button>' +
                '    </li>';
            }

            if ((this.options.enabledTools & AnnotationTools.Distance) == AnnotationTools.Distance) {
                html +=
                '    <li>' +
                '      <button class="tool_field ruler_tool" data-bind="css: { \'active\': $data.annotationModeObservable() == Annotation.prototype.AnnotationType.Distance }, click: setDistanceAnnotationMode">' +
                '        <div class="popupdiv-hover tool_field_tooltip small_button" data-localize="DistanceTool">Distance tool</div>' +
                '      </button>' +
                '    </li>';
            }

            html +=
                '  </ul>' +
                '</div>';

            return $(html);
        },

        _sidebarMarkup: function () {
            return $(
                '<div style="position: absolute; right: 16px; z-index: 9999; margin-top: 5px;" class="comments_sidebar_wrapper"' +
                '         data-bind="style: {display: $root.isRightPanelEnabled ? \'\' : \'none\' }">' +
                '  <div style="display: none" class="comments_sidebar_expanded">' +
                '    <a class="comments_togle_btn expanded_toggle_icon"></a>' +
                '    <ul class="comment_tabs_buttons">' +
                '      <li data-bind="visible: !embeddedAnnotation">' +
                '        <a href="#tab_summary"><span class="com_sum_icon"></span></a>' +
                '      </li>' +
                '      <li>' +
                '        <a href="#tab_comments"><span class="com_com_icon"></span></a>' +
                '      </li>' +
            /*'      <li>' +
            '        <a id="showReviewers" href="#tab_users"><span class="com_usr_icon"></span></a>' +
            '      </li>' +*/
                '    </ul>' +

                '    <div id="tab_summary" class="comments_content ui-tabs-panel ui-widget-content ui-corner-bottom" style="height: 492px;">' +
                '      <div class="comments_scroll" id="comments_scroll_2" style="height: 473px;">' +
                '        <div class="scrollbar" style="height: 433px;">' +
                '          <div class="track" style="height: 433px;">' +
                '            <div class="thumb" style="height: 50px; top: 0px;">' +
                '              <div class="end"></div>' +
                '            </div>' +
                '          </div>' +
                '        </div>' +
                '        <div class="viewport" style="height: 453px;">' +
                '          <div class="overview" style="top: 0px;">' +
                '            <div>' +
                '              <h3 class="com_heading colon" data-localize="Summary">Summary:</h3>' +

                '              <!-- ko foreach: annotationsByPages.pageNumbers -->' +
                '                <h3 class="page_number_in_summary" data-bind="text: \'@localize(Page) \' + ($data + 1)"></h3>' +
                '                <!-- ko foreach: $parent.annotationsByPages["page_" + $data].annotations -->' +
                '                  <div class="collapsed_anno_box" data-bind="click: function(){$root.activeAnnotation($data); $root.showExpandedCommentsPanel();}">' +
                '                    <a class="anno_select anno_universal_icon" href="#">' +
                '                      <span class="comments_number" ' +
                '                          data-bind="visible: $data.replyCount, text: $data.replyCount, style: {backgroundColor: $root.getLastReplyColor($data)}"></span>' +
                '                    </a>' +
                '                    <a href="#" class="tab_sum_comment_text" data-bind="text: $root.getLastReplyText($data)"></a>' +
                '                  </div>' +
                '                <!-- /ko -->' +
                '              <!-- /ko -->' +

            /*'              <!-- ko foreach: annotations -->' +
            '                <div class="collapsed_anno_box" data-bind="click: function(){$root.activeAnnotation($data); $root.showExpandedCommentsPanel();}">' +
            '                  <a class="anno_select anno_universal_icon" href="#">' +
            '                    <span class="comments_number" ' +
            '                        data-bind="visible: $data.replies().length > 1 || ($data.replies().length > 0 && $data.replies()[0].guid()), text: $data.replies().length, style: {backgroundColor: $root.getLastReplyColor($data)}"></span>' +
            '                  </a>' +
            '                  <a href="#" class="tab_sum_comment_text" data-bind="text: $root.getLastReplyText($data)"></a>' +
            '                </div>' +
            '              <!-- /ko -->' +*/
                '            </div>' +
                '          </div>' +
                '       </div>' +
                '     </div>' +
                '   </div>' +

                '   <div id="tab_comments" class="comments_content ui-tabs-panel ui-widget-content ui-corner-bottom" style="height: 453px;">' +
                '     <div class="comments_scroll" id="comments_scroll" style="height: 453px;">' +
                '       <div class="scrollbar" style="height: 433px;">' +
                '         <div class="track" style="height: 433px;">' +
                '           <div class="thumb" style="height: 50px; top: 0px;">' +
                '             <div class="end"></div>' +
                '           </div>' +
                '         </div>' +
                '       </div>' +
                '        <div class="viewport" style="height: 433px;">' +
                '          <div class="overview" style="top: 0px;">' +
                '            <a class="red_button_sb right" href="#" data-bind="click: $root.removeActiveAnnotation, visible: ($root.canDelete() && $root.activeAnnotation() != null)" data-localize="DeleteAnnotation">Delete Annotation</a>' +
                '            <h3 class="com_heading colon" data-localize="CommentsForAnnotation">Comments for annotation:</h3>' +
                '            <!-- ko if: activeAnnotation() != null -->' +
                '            <!-- ko foreach: activeAnnotation().replies -->' +
                '            <div class="comment_box_sidebar" data-bind="css: {\'lvl1\': replyLevel == 0, \'lvl2\': replyLevel == 1, \'lvl3\':replyLevel >= 2}">' +
                '               <div class="comment_avatar"><span class="blanc_avatar_icon"></span><img alt="" style="position: absolute; left: 0;" data-bind="visible: avatarUrl, src: avatarUrl" onerror="$(this).hide();" onload="if (this.width == 0) { $(this).hide(); }" /></div>' +
                '               <span class="comment_name" data-bind="text: userName, visible: guid() != null"></span>' +
                '               <p class="comment_time" data-bind="text: displayDateTime, visible: guid() != null"></p>' +
                '               <div class="comment_text_wrapper mousetrap">' +
                '                   <span class="comment_box_pointer"></span>' +
                '                   <div class="comment_text mousetrap" data-bind="htmlValue: text, valueUpdate: [\'keyup\'],' +
                '                                                    attr: {contenteditable: $root.activeAnnotation().activeReply() == $index() || $data.guid() == null},' +
                '                                                    hasfocus: $root.activeAnnotation().activeReply() == $index(),' +
                '                                                    event: {blur: function(){$root.commitAnnotationReplyOnBlur($root.activeAnnotation(), false, $data)}},' +
                '                                                    click: function(){$root.activeAnnotation().activeReply($index())}">' +
                '                   </div>' +
                '               </div>' +
                '               <!-- ko if: guid() != null -->' +
                '               <!-- ko if: $data.userGuid == $root.userId -->' +
                '               <a class="comment_reply_btn" data-bind="text: \'@localize(Edit)\', visible: $root.activeAnnotation().activeReply() != $index(), click: function(){ $data.initialText = $data.text(); $root.activeAnnotation().activeReply($index()) }" href="#">Edit</a>' +
                '               <a class="comment_reply_btn" data-bind="text: \'@localize(Delete)\',visible: $root.activeAnnotation().activeReply() != $index(), click: ' +
                '                   function(){ /*askAndDeleteReply($root, $root.activeAnnotation(), $data)*/ $root.deleteAnnotationReply($root.activeAnnotation().guid, $data.guid()); }" href="#">Delete</a>' +
                '               <!-- /ko -->' +
                '               <!-- ko if: $data.userGuid != $root.userId -->' +
                '               <a class="comment_reply_btn" data-bind="text: \'@localize(Reply)\', visible: $root.activeAnnotation().activeReply() != $index(), click: function(){ $root.addChildReply($root.activeAnnotation(), $data.guid()) }" href="#">Reply</a>' +
                '               <!-- /ko -->' +
                '               <a class="red_button_sb right" href="#" ' +
                '                  data-bind="text: \'@localize(Submit)\',visible: $root.activeAnnotation().activeReply() == $index(), ' +
                '                             click: function(data, e) { $root.commitAnnotationReply($root.activeAnnotation()); }, clickBubble: false">Submit</a>' +
                '               <a class="comment_reply_btn" href="#" data-bind="text: \'@localize(Cancel)\',visible: $root.activeAnnotation().activeReply() == $index(), click: function(data, e) { $data.text($data.initialText); $data.initialText = null; $root.activeAnnotation().activeReply(-1); }">Cancel</a>' +
                '               <!-- /ko -->' +
                '               <!-- ko if: guid() == null -->' +
                '               <a class="red_button_sb right" href="#" ' +
                '                  data-bind="text: \'@localize(Submit)\',visible: $root.activeAnnotation().activeReply() == $index(), ' +
                '                             click: function(data, e) { $root.commitAnnotationReply($root.activeAnnotation()); return false;}, clickBubble: false">Submit</a>' +
                '               <a class="comment_reply_btn" href="#" data-bind="text: \'@localize(Cancel)\', click: $root.deleteReply.bind($root, $data)">Cancel</a>' +
                '               <!-- /ko -->' +
                '           </div>' +
                '           <!-- /ko -->' +
                '           <!-- /ko -->' +

                '           </div>' +
                '         </div>' +
                '      </div>' +
                '    </div>' +

            /*'    <div class="comments_content ui-tabs-panel ui-widget-content ui-corner-bottom" id="tab_users" style="height: 453px;">' +
            '      <div id="usersTab" class="tab_users_wrapper">' +
            '        <h3 class="com_heading">Reviewers:</h3>' +
            '        <!-- ko foreach: _collaborators -->' +
            '          <div class="reviewers_box">' +
            '            <div class="rev_avatar">' +
            '              <span class="blanc_avatar_icon"></span>' +
            '              <span class="rev_color_box" data-bind="style: {backgroundColor: \'rgb(\' + ($data.color() >> 16 & 255) + \',\' +  ($data.color() >> 8 & 255) + \',\' + ($data.color() & 255) + \')\' }"></span>' +
            '            </div>' +
            '            <span class="rev_name" data-bind="text: $data.displayName"></span>' +
            '          </div>' +
            '        <!-- /ko -->' +
            '        <a class="red_button_sb right" data-toggle="modal" href="#modal_coll" data-bind="visible: false">Manage</a>' +
            '        <a class="red_button_sb right" data-bind="visible: (true || currentUserIsDocumentOwner)" data-toggle="modal" href="#modal_inv">Invite</a>' +
            '      </div>' +
            '    </div>' +*/
                '  </div>' +

                '  <div class="comments_sidebar_collapsed" style="display: block;">' +
                '    <a class="comments_togle_btn collapsed_toggle_icon"></a>' +
                '    <div style="overflow:hidden;height:100%;width:100%;position: relative">' +
                '      <div class="annotation_icons_wrapper">' +
                '        <!-- ko foreach: annotations -->' +
                '          <div class="collapsed_anno_box" style="position: absolute" data-bind="visible: ($data.commentsEnabled == true && ($root.disconnectUncommented == false || $data.replyCount() > 0)), click: function(){$root.activeAnnotation($data); $root.showExpandedCommentsPanel();}, style: {top: ($data.annotationSideIconDisplayPosition().y - $root.fixedIconShift) + \'px\'}">' +
                '            <a class="anno_select anno_universal_icon" href="#">' +
                '              <span class="comments_number" data-bind="visible: $data.replyCount, text: $data.replyCount, style: {backgroundColor: $root.getLastReplyColor($data)}"></span>' +
                '            </a>' +
                '          </div>' +
                '        <!-- /ko -->' +
                '      </div>' +
                '    </div>	' +
                '  </div>' +
                '</div>');
        },

        _textfieldToolbarMarkup: function () {
            return '' +
                '<span class="ta_resize_box" data-bind="visible: toolbarIsVisible() || mouseIsOver(), makeDraggable:$root.getDraggableOptionsForResizeMarker($data)"></span>' +
                '<div class="text_area_toolbar" data-bind="event: {' +
                '            mouseover: function() { if (!$data.annotation.isBeingDeleted()) { var sel = $root.getSelectableInstance(); sel._mouseDestroy(); } }, ' +
                '            mouseout: function() { if (!$data.annotation.isBeingDeleted()) { var sel = $root.getSelectableInstance(); sel._mouseInit(); } }' +
                '        },' +
                '        clickBubble: true,' +
                '        visible: toolbarIsVisible() || mouseIsOver()">' +
                '  <a href="#" class="ta_move">' +
                '    <span class="ta_tooltip ta_tp_move">Move <span class="ta_tooltip_pointer"></span></span>' +
                '  </a>' +
                '  <div class="ta_tool_wrapper">' +
                '    <span class="ta_tooltip ta_tp_color">Select Color<span class="ta_tooltip_pointer"></span></span>' +
                '    <span data-bind="style: { backgroundColor: $root.getRgbColorFromInteger($data.annotation.fontColor()) }" class="ta_color_selected"></span>' +
                '    <a class="ta_dropdown_btn dropdown_menu_button" href="#" data-bind="click: function(data, event) { $root.dropdownMenuClickHandler.call(event.target); }"></a>' +
                '    <ul class="ta_dropdown dropdown_menu" data-bind="foreach: $root.fontColors">' +
                '      <li> <a class="ta_color_sel" data-bind="style: { backgroundColor: $root.getRgbColorFromInteger($data) }, click: function() { $parent.annotation.fontColor($data); $root.setTextFieldColor($parent); }" href="#"></a></li>' +
                '    </ul>' +
                '  </div>' +
                '  <div class="ta_tool_wrapper">' +
                '    <span class="ta_tooltip ta_tp_font">Select Font<span class="ta_tooltip_pointer"></span></span>' +
                '    <span class="ta_font_selected" data-bind="text: $data.selectedFontFamily()"></span>' +
                '    <a class="ta_dropdown_btn dropdown_menu_button" href="#" data-bind="click: function(data, event) { $root.dropdownMenuClickHandler.call(event.target); }"></a>' +
                '    <ul id="fontFamilyList" class="ta_dropdown dropdown_menu" data-bind="foreach: $data.fontFamilies">' +
                '      <li data-bind="click: function() { $parent.selectedFontFamily($data); $root.saveTextField($parent); }">' +
                '        <a href="#" data-bind="text: $data"></a>' +
                '      </li>' +
                '    </ul>' +
                '  </div>' +
                '  <div class="ta_tool_wrapper">' +
                '    <span class="ta_tooltip ta_tp_font_size">Select Font Size<span class="ta_tooltip_pointer"></span></span>' +
                '    <span class="ta_size_selected" data-bind="text: $data.selectedFontSize()"></span>' +
                '    <a class="ta_dropdown_btn dropdown_menu_button" href="#" data-bind="click: function(data, event) { $root.dropdownMenuClickHandler.call(event.target); }"></a>' +
                '    <ul id="fontSizeList" class="ta_dropdown dropdown_menu" data-bind="foreach: $data.fontSizes">' +
                '      <li data-bind="click: function() { $parent.selectedFontSize($data); $root.saveTextField($parent); }">' +
                '        <a href="#" data-bind="text: $data"></a>' +
                '      </li>' +
                '    </ul>' +
                '  </div>' +
                '  <div class="ta_tool_wrapper">' +
                '    <span class="ta_tooltip ta_tp_font_size_adjust">Adjust Font Size<span class="ta_tooltip_pointer"></span></span>' +
                '    <a class="ta_plus" href="#" data-bind="click: function() { if ($data.selectedFontSize() < $data.fontSizes[$data.fontSizes.length - 1]) $data.selectedFontSize($data.selectedFontSize() + 1); $root.saveTextField($data); return true; }, clickBubble: true">' +
                '    </a>' +
                '    <a class="ta_minus" href="#" data-bind="click: function(){ if ($data.selectedFontSize() > $data.fontSizes[0]) $data.selectedFontSize($data.selectedFontSize() - 1); $root.saveTextField($data); return true; }, clickBubble: true">' +
                '    </a>' +
                '  </div>' +
                '  <div class="ta_del_wrapper">' +
                '    <span class="ta_tooltip ta_tp_del">Delete<span class="ta_tooltip_pointer"></span></span>' +
                '    <a class="ta_del" data-bind="click: function(){ $root.removeAnnotation($data.annotation); var sel = $root.getSelectableInstance(); sel._mouseInit(); }" href="#"></a>' +
                '  </div>' +
                '</div>';
        },

        _textReplacementMarkup: function () {
            return '' +
                '          <!-- ko foreach: _replacements -->' +
                '            <div style="display: none; z-index: 1" class="doc_text_area" ' +
                '                 data-bind="style: { left: $data.annotation.displayBounds().left() + \'px\', top: $data.annotation.displayBounds().bottom() + 34 + \'px\', display: \'block\' }, click: function () { $root.showExpandedCommentsPanel(); $data.annotation.deactivateActiveReply(); $root.activeAnnotation($data.annotation); }">' +
                '              <div class="replace_tab" data-bind="text: $data.REPLACETEXT">Replace</div>' +
                '              <div class="doc_text_area_text mousetrap" data-bind="htmlValue: text, ' +
                '                   style: { minWidth: $data.annotation.displayBounds().width() + \'px\', minHeight: $data.annotation.displayBounds().height() + \'px\', display: \'block\' },' +
                '                   attr: { contenteditable: true },' +
                '                   event: { koValueUpdated: function() { $root.saveTextField($data); return true; },' +
                '                       mouseover: function() { if (!$data.annotation.isBeingDeleted()) { var sel = $root.getSelectableInstance(); sel._mouseDestroy(); } }, ' +
                '                       mouseout: function() { if (!$data.annotation.isBeingDeleted()) { var sel = $root.getSelectableInstance(); sel._mouseInit(); } }' +
                '                   }"' +
                '                   spellcheck="false">' +
                '              </div>' +
                '            </div>' +
                '          <!-- /ko -->';

        },

        _watermarksMarkup: function () {
            return '' +
                '<!-- ko foreach: pages -->' +
                '  <!-- ko foreach: $root._watermarks() -->' +
                '    <div style="display: none;z-index:1" class="doc_text_area"' +
                '         data-bind="style: { left: $root.convertRectToScreenCoordinatesForPage($data.annotation.bounds(), $parent.number - 1).left() + \'px\',' +
                '                             top: $root.convertRectToScreenCoordinatesForPage($data.annotation.bounds(), $parent.number - 1).top() + \'px\', display: \'block\'},' +
                '                             makeDraggable: $root.getDraggableOptionsForTextFields($data)" >' +
                '      <div class="doc_text_area_text mousetrap"' +
                '           data-bind="htmlValue: text,' +
                '           style: { minWidth: $root.convertRectToScreenCoordinatesForPage($data.annotation.bounds(), $parent.number - 1).width() + \'px\',' +
                '                    minHeight: $root.convertRectToScreenCoordinatesForPage($data.annotation.bounds(), $parent.number - 1).height() + \'px\', display: \'block\',' +
                '                    fontFamily: $data.selectedFontFamily(), fontSize: $data.selectedFontSize().toString() + \'px\',' +
                '                    border: $data.toolbarIsVisible() || mouseIsOver() ? \'1px dotted #000000\' : \'none\',' +
                '                    background: $data.toolbarIsVisible() || mouseIsOver() ? \'none repeat scroll 0 0 #FFFFFF\' : \'none\',' +
                '                    boxShadow: $data.toolbarIsVisible() || mouseIsOver() ? \'1px 1px 3px 0 rgba(0, 0, 0, 0.6)\' : \'none\',' +
                '                    color: $root.getRgbColorFromInteger($data.annotation.fontColor()),' +
                '                    opacity: $data.toolbarIsVisible() || mouseIsOver() ? 1.0 : 0.5' +
                '                   },' +
                '           attr: { contenteditable: true },' +
                '           event: { koValueUpdated: function(wm, event, element) { /*askAndDeleteEmptyWatermark($root, $data, element);*/ $root.saveTextField($data); $data.toolbarIsVisible($.trim($data.text()).length == 0); if ($.trim($data.text()).length != 0) $(element).blur(); return true; },' +
                '                    mouseover: function() { $data.mouseIsOver(true); if (!$data.annotation.isBeingDeleted()) { var sel = $root.getSelectableInstance(); sel._mouseDestroy(); } },' +
                '                    mouseout: function(){ $data.mouseIsOver(false); if (!$data.annotation.isBeingDeleted()) { var sel = $root.getSelectableInstance(); sel._mouseInit(); } }' +
                '                  },' +
                '           click: function() { $data.toolbarIsVisible(true); return true; }" spellcheck="false"></div>' +
                       this._textfieldToolbarMarkup() +
                '    </div>' +
                '  <!-- /ko -->' +
                '<!-- /ko -->';
        },

        _modalsMarkup: function () {
            return $(
                '<div class="modal fade export_annotations_modal">' +
                '  <h3 data-localize="ExportingTheDocument">Exporting the document</h3>' +
                '</div>' +

                '<div class="modal fade importing_annotations_modal">' +
                '  <h3 class="ellipsis" data-localize="ImportingInternalDocumentAnnotations">Importing internal document annotations...</h3>' +
                '</div>' +

               
                '<div class="modal fade manage_collaborators_modal" id="modal_inv">' +
                '  <a data-dismiss="modal" class="popclose"></a>' +
                '  <div class="sigModalbody">' +
                '    <ul class="nav nav-tabs">' +
            /*'      <li>' +
            '        <a href="#inv_link" data-toggle="tab">Link</a>' +
            '      </li>' +*/
                '      <li class="active">' +
                '        <a href="#inv_mail" data-toggle="tab">E-mail</a>' +
                '      </li>' +
                '    </ul>' +
                '    <div id="addCollaboratorTab" class="tab-content">' +
            /*'      <div id="inv_link" class="tab-pane">' +
            '        <p class="small_heading_text">Simply share this link to collaborate:</p>' +
            '        <div class="manage_add_wrapper">' +
            '          <input id="linkToCollaborate" type="text" class="manage_add_usr link_input" data-bind="value: linkToCollaborate"></input>' +
            '          <a id="copyToClipboard" class="red_button_sb right" href="#" data-bind="click: function() { $(\'#linkToCollaborate\').select(); }">Copy to Clipboard</a>' +
            '        </div>' +
            '        <ul class="manage_coll invite_manage">' +
            '          <li class="manage_heading">' +
            '            <p class="export">Export</p>' +
            '            <p class="download">Download</p>' +
            '            <p class="proof">Proof</p>' +
            '            <p class="view">View</p>' +
            '          </li>' +
            '          <li>' +
            '            <span class="checkbox" data-bind="css: {checked: canView(), checked: canExport(), unchecked: !canExport()}, click: function(){$data.canExport(!$data.canExport())}">' +
            '              <input type="checkbox" class="checkbox" data-bind="checked: canView">' +
            '            </span>' +
            '            <span class="checkbox" data-bind="css: {enabled: canView(), checked: canDownload(), unchecked: !canDownload()}, click: function(){$data.canDownload(!$data.canDownload())}">' +
            '              <input type="checkbox" class="checkbox" data-bind="checked: canDownload">' +
            '            </span>' +
            '            <span class="checkbox" data-bind="css: {enabled: canView(), checked: canAnnotate(), unchecked: !canAnnotate()}, click: function(){$data.canAnnotate(!$data.canAnnotate())}">' +
            '              <input type="checkbox" class="checkbox" data-bind="checked: canAnnotate">' +
            '            </span>' +
            '            <span class="checkbox" data-bind="css: {checked: canView(), unchecked: !canView()}, click: function(){$data.canView(!$data.canView())}">' +
            '              <input type="checkbox" class="checkbox" data-bind="checked: canView">' +
            '            </span>'
            '          </li>' +
            '        </ul>' +
            '      </div>' +*/
                '      <div id="inv_mail" class="tab-pane active">' +
                '        <div class="ivn_line_wrapper">' +
                '          <p class="inv_line_name">E-mail</p>' +
                '          <input id="newReviewer" type="text" class="inv_mail_input" data-bind="value: newCollaborator, valueUpdate: [\'keypress\',\'afterkeydown\',\'propertychange\',\'input\']"/>' +
                '          <a class="red_button_sb right" data-toggle="modal" href="#modal_add_from_contacts">Add from Contacts</a>' +
                '        </div>' +
                '        <div class="ivn_line_wrapper">' +
                '          <p class="inv_line_name" data-localize="Message">Message</p>' +
                '          <textarea class="inv_msg_area" data-bind="value: reviewerInvitationMessage, valueUpdate: [\'keypress\',\'afterkeydown\',\'propertychange\',\'input\']"></textarea>' +
                '        </div>' +
                '        <button class="red_button_sb inv_send_btn" data-dismiss="modal" data-localize="Cancel">Cancel</button>' +
                '        <button class="red_button_sb inv_send_btn" data-bind="click: $root.addDocumentReviewer.bind($root)" data-localize="Send">Send</button>' +
                '        <span class="progresspin right" data-bind="visible: busyAddingReviewer()"></span>' +
                '      </div>' +
                '    </div>' +
                '  </div>' +
                '</div>');
        },

        _tooltipMarkupt: function () {
            return '' +
                '<script type="text/html" id="wt-comments">' +
                '    <li>' +
                '        <h5 data-bind="text: userName">John Doe</h5>' +
                '        <p class="date" data-bind="text: displayDateTime">16 Apr 2014, 12:10:11</p>' +
                '        <p class="wt-comment" data-bind="text: text">Check this part please</p>' +
                '        <a class="icon-expand" href="#expand" data-toggle="tooltip" data-placement="left" title="" data-original-title="Expand">+</a>' +

                '        <ul data-bind="template: { name: \'wt-comments\', foreach: childReplies }"></ul>' +
                '    </li>' +
                '</script>' +
                '<div class="widget-tooltip" style="left: 100px; top: 300px; height: 17px; z-index: 24;" data-bind="style: { left: (prevHoveredAnnotation() != null ? Math.min(prevHoveredAnnotation().displayBounds().left(), prevHoveredAnnotation().displayBounds().right()) : \'-100\') + \'px\', top: (prevHoveredAnnotation() != null ? (Math.min(prevHoveredAnnotation().displayBounds().top(), prevHoveredAnnotation().displayBounds().bottom())  - 17) : \'-100\') + \'px\', width: (prevHoveredAnnotation() != null ? (Math.abs(prevHoveredAnnotation().displayBounds().width()) + 17) : \'0\') + \'px\' }, event: { mouseenter: function() { $root.hoveredAnnotation($root.prevHoveredAnnotation()); }, mouseleave: function (data, event) { $root.hoveredAnnotation(null); $root.prevHoveredAnnotation(null); $(event.target).children(\'.wt-container\').hide(); } }">' +
                '    <div class="widget-tooltip" style="left: 100px; top: 17px; width: 17px; z-index: 24;" data-bind="style: { left: (prevHoveredAnnotation() != null ? Math.abs(prevHoveredAnnotation().displayBounds().width()) : \'-100\') + \'px\', height: (prevHoveredAnnotation() != null ? Math.abs(prevHoveredAnnotation().displayBounds().height()) : \'0\') + \'px\' }">' +
                '    </div>' +
                '    <div class="wt-icon" data-bind="visible: (hoveredAnnotation() != null), click: function (data, event) { $root.expandAnnotationTooltip(event); }">' +
                '    </div>' +
                '    <div class="wt-container" style="display: none;" data-bind="with: hoveredAnnotation, visible: (hoveredAnnotation() != null)">' +
                '        <div class="wt-header" data-bind="text: (replyCount() + \' comment(s):\')">1 comment</div>' +
                '        <a class="wt-close" href="#close" data-bind="clickBubble: false, click: function (data, event) { $(event.target).parents(\'.wt-container\').hide(); }">Close</a>' +
                '        <div class="scrollbar scrollable" tabindex="-1">' +
                '            <div class="scroll-bar vertical" style="height: 230px; display: none;">' +
                '                <div class="thumb" style="top: 0px; height: 237.219730941704px;">' +
                '                </div>' +
                '            </div>' +
                '            <div class="viewport" style="height: 230px; width: 180px;">' +
                '                <div class="overview" style="top: 0px; left: 0px;">' +
                '                    <ul data-bind="template: { name: \'wt-comments\', foreach: $data.comments }"></ul>' +
                '                </div>' +
                '            </div>' +
                '            <div class="scroll-bar horizontal" style="width: 180px; display: none;">' +
                '                <div class="thumb" style="left: 0px; width: 181.005586592179px;"></div>' +
                '            </div>' +
                '        </div>' +
                '    </div>' +
                '</div>';
        },

        getViewer: function () {
            return this._viewer;
        },

        activateAnnotation: function (annotation) {
            this.viewerViewModel.activeAnnotation(annotation);
        },

        getAnnotationsObservable: function () {
            return this.viewerViewModel.annotations;
        },

        getAnnotationsByPagesObservable: function () {
            return this.viewerViewModel.annotationsByPagesObservable;
        },

        getActiveAnnotationObservable: function () {
            return this.viewerViewModel.activeAnnotation;
        },

        getLastReplyColor: function (annotation) {
            return this.viewerViewModel.getLastReplyColor(annotation);
        },

        getLastReplyText: function (annotation) {
            return this.viewerViewModel.getLastReplyText(annotation);
        },

        deleteActiveAnnotation: function () {
            this.viewerViewModel.deleteActiveAnnotation();
        },

        commitReplyOfActiveAnnotation: function (replyIndex) {
            var activeAnnotation = this.viewerViewModel.activeAnnotation();
            activeAnnotation.activeReply(replyIndex);
            this.viewerViewModel.commitAnnotationReply(activeAnnotation);
        },

        deleteReply: function (annotationGuid, replyGuid) {
            this.viewerViewModel.deleteAnnotationReply(annotationGuid, replyGuid);
        },

        getCurrentUserGuid: function () {
            return this.viewerViewModel.userId;
        },

        addChildReply: function (annotation, parentReplyGuid) {
            return this.viewerViewModel.addChildReply(annotation, parentReplyGuid);
        },

        setAnnotationMode: function (mode) {
            switch (mode) {
                case Annotation.prototype.AnnotationType.Text:
                    this.viewerViewModel.setTextAnnotationMode();
                    break;
                case Annotation.prototype.AnnotationType.Area:
                    this.viewerViewModel.setAreaAnnotationMode();
                    break;
                case Annotation.prototype.AnnotationType.Point:
                    this.viewerViewModel.setPointAnnotationMode();
                    break;
                case Annotation.prototype.AnnotationType.TextStrikeout:
                case Annotation.prototype.AnnotationType.TextRemoval:
                    this.viewerViewModel.setStrikeoutTextMode();
                    break;
                case Annotation.prototype.AnnotationType.Polyline:
                    this.viewerViewModel.setPolylineAnnotationMode();
                    break;
                case Annotation.prototype.AnnotationType.TextField:
                    this.viewerViewModel.setTextFieldAnnotationMode();
                    break;
                case Annotation.prototype.AnnotationType.Watermark:
                    this.viewerViewModel.setWatermarkAnnotationMode();
                    break;
                case Annotation.prototype.AnnotationType.TextReplacement:
                    this.viewerViewModel.setReplacementAnnotationMode();
                    break;
                case Annotation.prototype.AnnotationType.Arrow:
                    this.viewerViewModel.setArrowAnnotationMode();
                    break;
                case Annotation.prototype.AnnotationType.TextRedaction:
                    this.viewerViewModel.setTextRedactionAnnotationMode();
                    break;
                case Annotation.prototype.AnnotationType.ResourcesRedaction:
                    this.viewerViewModel.setResourcesRedactionAnnotationMode();
                    break;
                default:
                    this.viewerViewModel.setHandToolMode();
                    break;
            }
        },

        exportAnnotations: function (format) {
            this.viewerViewModel.exportAnnotationsTo(format);
        },

        importAnnotations: function (fileId) {
            if (fileId)
                this.viewerViewModel.importDocumentAnnotations(fileId);
            else
                this.viewerViewModel.importAnnotations();
        },

        loadDocument: function (fileId) {
            this.viewerViewModel.loadDocument(fileId);
        },

        initControlsAndHandlers: function () {
            window.groupdocs.initAnnotationControlsAndHandlers(this.element, this._viewer, this.viewerViewModel);
        }
    });


    /* Widget viewer and view model */
    groupdocsAnnotationViewerModel = function (options) {
        measurementAnnotationModel.prototype.constructor.apply(this, arguments);
    };

    $.extend(groupdocsAnnotationViewerModel.prototype, measurementAnnotationModel.prototype, {
        getFile: function (fileId, callback, errorCallback) {
            this._portalService.getFile(fileId,
                function (response) {
                    callback.apply(this, [response]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        }
    });



    groupdocsAnnotationViewerViewModel = function (options) {
        measurementAnnotationViewModel.prototype.constructor.apply(this, arguments);
    };

    $.extend(groupdocsAnnotationViewerViewModel.prototype, measurementAnnotationViewModel.prototype, {
        annotationHub: null,
        fileExplorerEnabled: ko.observable(false),
        licensed: ko.observable(false),
        annotationsByPages: null,
        showHeader: false,
        showZoom: false,
        localizedStrings: null,
        charSelection: false,
        thumbsImageBase64Encoded: null,
        undoEnabled: true,
        exportMenuOpened: false,

        _create: function (options) {
            var self = this;

            this._model = new groupdocsAnnotationViewerModel(options);
            this._init(options);

            this.fileExplorerEnabled = ko.observable(options.showFileExplorer || false);
            this.licensed = ko.observable(true);
            this.annotationsByPages = { pageNumbers: ko.observableArray([]) };
            this.annotationsByPagesObservable = ko.observableArray();
            this.showHeader = options.showHeader;
            this.showZoom = options.showZoom;
            this.localizedStrings = options.localizedStrings;
            //this.charSelection = option.charSelection;
            //this.viewerViewModel.localizedStrings = options.localizedStrings;
            this.undoEnabled = options.undoEnabled;
            this.exportMenuOpened = ko.observable(false);
            this.thumbsImageBase64Encoded = options.thumbsImageBase64Encoded;
            this.licensed.subscribe(function (newValue) {
                window.setTimeout(self.reInitCanvasOffset.bind(self), 100);
            });

        },

        _init: function (options) {
            measurementAnnotationViewModel.prototype._init.call(this, options);

            var self = this;
            var prevAnnotations = [];
            var oldAnnotationsPages = [];
            var newAnnotationPages = [];

            var changedPages = {};
            var newPageToAnnot;
            var oldPageToAnnot;

            var temporaryValue = [];

            var temporaryValueArr;

            this.annotations.subscribe(function (newValue) {

                var changes = $.grep(ko.utils.compareArrays(prevAnnotations, newValue),
                    function (x) { return (isNaN(x.moved) && (x.status == 'added' || x.status == 'deleted')); });
                prevAnnotations = newValue.slice(0);

                $.each(changes, function (index, valueArgs) {
                    var pageNumber = valueArgs.value.pageNumber;
                    var pageKey = 'page_' + pageNumber.toString();
                    var pageAnnotations = self.annotationsByPages[pageKey];
                    var indexTemporaryValueArr = -1;
                    temporaryValueArr = valueArgs.value;  //valueArgs.slice()

                    if (temporaryValue.length == 0) {
                        temporaryValue.push(temporaryValueArr);
                    }
                    else {
                        indexTemporaryValueArr = -1;
                        for (var elementArr = 0, lengthArrValue = temporaryValue.length; elementArr < lengthArrValue; elementArr++) {
                            if (temporaryValueArr.guid === temporaryValue[elementArr].guid) {
                                indexTemporaryValueArr = elementArr;
                                temporaryValue.splice(elementArr, 1);
                                temporaryValue.push(temporaryValueArr);
                                break;
                            }
                        }

                        if (indexTemporaryValueArr == -1) {
                            temporaryValue.push(temporaryValueArr);
                        }
                    }

                    if (!pageAnnotations) {
                        pageAnnotations = { page: pageNumber, annotations: ko.observableArray([]) };

                        self.annotationsByPages[pageKey] = pageAnnotations;
                        self.annotationsByPages.pageNumbers.push(pageNumber);
                    }

                    changedPages[pageKey] = pageAnnotations;

                    if (!self.annotationsByPagesObservable()[pageNumber]) {
                        self.annotationsByPagesObservable.valueWillMutate();
                        self.annotationsByPagesObservable()[pageNumber] = ko.observableArray();
                        self.annotationsByPagesObservable.valueHasMutated();
                    }

                    if (valueArgs.status == 'deleted') {
                        pageAnnotations.annotations.remove(valueArgs.value);
                        self.annotationsByPagesObservable()[pageNumber].remove(valueArgs.value);

                        if (indexTemporaryValueArr != -1) temporaryValue.splice(indexTemporaryValueArr, 1);

                        if (pageAnnotations.annotations().length == 0) {
                            self.annotationsByPages.pageNumbers.remove(pageNumber);
                            self.annotationsByPages[pageKey] = undefined;
                        }
                    }
                    else {
                        pageAnnotations.annotations.push(valueArgs.value);
                        self.annotationsByPagesObservable()[pageNumber].push(valueArgs.value);
                    }


                });

                $.each(newValue, function (index, valueNewValue) {
                    newAnnotationPages[index] = { guid: valueNewValue.guid, page: valueNewValue.pageNumber }
                });
                if (newAnnotationPages.length > 0) {
                    var lastElementNewArray = newAnnotationPages.length - 1;
                    if (oldAnnotationsPages.length == 0) {
                        oldAnnotationsPages = newAnnotationPages.slice();
                    }
                    else {//search the element in oldArray, if not found - add him
                        var searchTerm = newAnnotationPages[lastElementNewArray].guid, indexElement = -1;
                        for (var element = 0, len = oldAnnotationsPages.length; element < len; element++) {
                            if (oldAnnotationsPages[element].guid === searchTerm) {
                                indexElement = element;
                                break;
                            }
                        }

                        if (indexElement == -1) {
                            oldAnnotationsPages.push(newAnnotationPages[lastElementNewArray]);
                        }
                    }
                }
                var movedAnnotationFromPage = [];
                $.each(newAnnotationPages, function (index, valueMoved) {
                    for (var countOld = 0; countOld < oldAnnotationsPages.length; countOld++) {
                        if (valueMoved.guid == oldAnnotationsPages[countOld].guid) {
                            if (valueMoved.page == oldAnnotationsPages[countOld].page) {
                                continue;
                            } else {
                                var indexAnnotationPages = -1;
                                var indexTemporaryValue;

                                for (var elementAnnotation = 0, lengthAnnotationValue = newAnnotationPages.length; elementAnnotation < lengthAnnotationValue; elementAnnotation++) {
                                    if (valueMoved.guid === newAnnotationPages[elementAnnotation].guid) {
                                        indexAnnotationPages = elementAnnotation;
                                        break;
                                    }
                                }
                                oldPageToAnnot = oldAnnotationsPages[countOld].page;
                                movedAnnotationFromPage = oldAnnotationsPages.slice();
                                oldAnnotationsPages.splice(countOld, 1);//
                                newPageToAnnot = valueMoved.page;
                                oldAnnotationsPages.push(newAnnotationPages[indexAnnotationPages]);

                                for (var count = 0; count < len; count++) {     //with new page and delete old page
                                    if (valueMoved.guid == movedAnnotationFromPage[count].guid) {
                                        var pageOld = movedAnnotationFromPage[count].page;
                                        var pageKeyOld = 'page_' + pageOld.toString();
                                        var pageNumberNew = newPageToAnnot;
                                        var pageKeyNew = 'page_' + pageNumberNew.toString();

                                        var pageAnnotationsUpd = self.annotationsByPages[pageKeyOld];
                                        var pageAnnotationsNew = self.annotationsByPages[pageKeyNew];

                                        var indexElementTemporaryValue = -1;
                                        for (var elementValue = 0, lengthTemporaryValue = temporaryValue.length; elementValue < lengthTemporaryValue; elementValue++) {
                                            if (valueMoved.guid === temporaryValue[elementValue].guid) {
                                                indexElementTemporaryValue = elementValue;
                                                temporaryValue[elementValue].pageNumber = oldPageToAnnot;
                                                break;
                                            }
                                        }

                                        pageAnnotationsUpd.annotations.remove(temporaryValue[indexElementTemporaryValue]);
                                        self.annotationsByPagesObservable()[pageOld].remove(temporaryValue[indexElementTemporaryValue]);

                                        if (pageAnnotationsUpd.annotations().length == 0) {
                                            self.annotationsByPages.pageNumbers.remove(pageOld);
                                            self.annotationsByPages[pageKeyOld] = undefined;
                                        }

                                        if (!pageAnnotationsNew) {
                                            pageAnnotationsNew = { page: pageNumberNew, annotations: ko.observableArray([]) };

                                            self.annotationsByPages[pageKeyNew] = pageAnnotationsNew;
                                            self.annotationsByPages.pageNumbers.push(pageNumberNew);
                                        }
                                        changedPages[pageKeyNew] = pageAnnotationsNew;

                                        if (!self.annotationsByPagesObservable()[pageNumberNew]) {
                                            self.annotationsByPagesObservable.valueWillMutate();
                                            self.annotationsByPagesObservable()[pageNumberNew] = ko.observableArray();
                                            self.annotationsByPagesObservable.valueHasMutated();
                                        }

                                        temporaryValue[indexElementTemporaryValue].pageNumber = pageNumberNew;

                                        pageAnnotationsNew.annotations.push(temporaryValue[indexElementTemporaryValue]);
                                        self.annotationsByPagesObservable()[pageNumberNew].push(temporaryValue[indexElementTemporaryValue]);

                                        //movedAnnotationFromPage.splice();

                                        break;

                                    }
                                }
                                movedAnnotationFromPage.splice();
                            }
                        }
                    }
                });

                $.each(changedPages, function (i, p) {
                    p.annotations.sort(function (x, y) {
                        var diff = (x.bounds().top() - y.bounds().top());

                        return (diff == 0 ? 0 :
                            (diff > 0 ? 1 : -1));
                    });
                });

                self.annotationsByPages.pageNumbers.sort();
            }, this);
        },

        getLocalized: function (key) {
            var localized = this.localizedStrings[key];
            return localized;
        },



        showExpandedCommentsPanel: function () {
            if (this.enableSidePanel) {
                this.element.find('.comments_sidebar_collapsed').hide();
                this.element.find('.comments_sidebar_expanded').show();
                this.element.find('.comments_sidebar_expanded').tabs('option', 'active', 1);
                this.element.find('#comments_scroll').tinyscrollbar_update('relative');
                this.element.find('#comments_scroll_2').tinyscrollbar_update('relative');
                this.redrawConnectingLines();
                //window.setZoomWhenTogglePanel();
            }
        },

        expandAnnotationTooltip: function (e) {
            $(e.target).siblings('.wt-container').show();
            $('.widget-tooltip .wt-comment').each(function () {
                if (jGroupdocs.html.textWidth($(this).text(), "400 11px 'PT Sans', Helvetica, Arial, sans-serif") > $(this).width()) {
                    $(this).parent().addClass('overflowed');
                }
            });
            $('.widget-tooltip .scrollbar').customScrollbar();

            return false;
        },

        dropdownMenuClickHandler: function (target) {
            var self = $(this);

            if (self.hasClass('active')) {
                self.parent().find('.dropdown_menu').hide('blind', 'fast', function () {
                    self.removeClass('active');
                    document.activeElement = self[0];
                });
            }
            else {
                self.parent().find('.dropdown_menu').show('blind', 'fast', function () {
                    self.addClass('active');
                });
            }
        },

        markerClickHandler: function (annotation) {
            measurementAnnotationViewModel.prototype.markerClickHandler.call(this, annotation);

            if (this.clickableAnnotations) {
                this.showExpandedCommentsPanel();
            }
        },

        toggleExportMenu: function (viewModel, event) {
            this.exportMenuOpened(!this.exportMenuOpened());
            event.stopPropagation();
        },

        getPageImageHorizontalOffset: function () {
            var leftImageMargin = 17;
            return leftImageMargin;
        },

        exportAnnotationsTo: function (format, mode) {
            this.exportingAnnotationsProgress.modal("show");

            this._model.exportAnnotations(this.fileId, format || 'Pdf', mode || Annotation.prototype.AnnotationExportMode.Append,
                function (response) {
                    this._onAnnotationsExported(response);
                }.bind(this),
                function (error) {
                    this.exportingAnnotationsProgress.modal("hide");
                    this._onError(error);
                }.bind(this));
        },

        getPdfVersionOfDocument: function () {
            this.exportingAnnotationsProgress.modal("show");

            this._model.getPdfVersionOfDocument(this.fileId,
                function (response) {
                    this._onPdfVerionOfDocumentReceived(response);
                }.bind(this),
                function (error) {
                    this.exportingAnnotationsProgress.modal("hide");
                    this._onError(error);
                }.bind(this));
        },

        downloadDocument: function () {
            this._model.getFile(this.fileId,
                function (response) {
                    this._onDocumentDownloaded(response);
                }.bind(this),
                function (error) {
                    this._onError(error);
                });
        },

        openFileExplorer: function () {
            $(this.element).find(".fileOpenDialogWrapper").modal('show');
        },

        onFileSelected: function (metadata) {
            this.loadDocument(metadata.path);
        },

        undo: function () {
            if (this._undoRedo)
                this._undoRedo.undoAsync();
        },

        redo: function () {
            if (this._undoRedo)
                this._undoRedo.redoAsync();
        },

        _onDocumentLoaded: function (response) {
            measurementAnnotationViewModel.prototype._onDocumentLoaded.apply(this, arguments);

            this.licensed(response.lic === true);

            if (!response.lic && $(this.element).find(".licBanner").length == 0) {
                $(this.element).find(".viewer_mainwrapper").addClass("viewer_mainwrapper_trial");

                if (!this.showHeader) {
                    $(this.element).find(".viewer_mainwrapper").css("top", "32px");
                }
            }

            if (this.showZoom) {
                var zoomViewModel = this.viewerAdapter.zooming.zooming('getViewModel');
                zoomViewModel.setFitWidthZoom(this.getFitWidthZoom());
                zoomViewModel.setFitHeightZoom(this.getFitHeightZoom());
            } else {
                $(".zoom_wrappper").css('display', 'none');
            }

            this.annotationHub = $.connection.annotationHub.client;
            this.annotationHub.createAnnotationOnClient = this._hubHandler._onAnnotationCreated.bind(this);
            this.annotationHub.createReplyOnClient = this._hubHandler._onAnnotationReplyCreated.bind(this);
            this.annotationHub.moveAnnotationOnClient = this._hubHandler._onAnnotationMoved.bind(this);
            this.annotationHub.setReviewersColorsOnClient = this._hubHandler._onReviewerColorChanged.bind(this);
            this.annotationHub.setReviewerRightsOnClient = this._hubHandler._onReviewerRightsChanged.bind(this);
            this.annotationHub.resizeAnnotationOnClient = this._hubHandler._onAnnotationResized.bind(this);
            this.annotationHub.setTextFieldColorOnClient = this._hubHandler._onTextFieldColorSet.bind(this);
            this.annotationHub.setAnnotationBackgroundColorOnClient = this._hubHandler._onAnnotationBackgroundColorSet.bind(this);
            this.annotationHub.deleteAnnotationOnClient = this._hubHandler._onAnnotationRemoved.bind(this);
            this.annotationHub.moveAnnotationMarkerOnClient = this._hubHandler._onAnnotationMarkerMoved.bind(this);
            this.annotationHub.editAnnotationReplyOnClient = this._hubHandler._onAnnotationReplyEdited.bind(this);
            this.annotationHub.deleteAnnotationReplyOnClient = this._hubHandler._onAnnotationReplyRemoved.bind(this);
            this.annotationHub.updateTextFieldOnClient = this._hubHandler._onTextFieldUpdated.bind(this);
            this.annotationHub.setAnnotationAccessOnClient = this._hubHandler._onAnnotationAccessChanged.bind(this);

            var isChrome = false; //navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
            var urlParts = jGroupdocs.http.splitUrl($.ui.groupdocsViewer.prototype.applicationPath);
            var baseUrl = urlParts.schema + '://' + urlParts.authority + (urlParts.path && urlParts.path != '/' ? '/' + urlParts.path : '');

            $.connection.hub.qs = { 'uid': this.userId };
            $.connection.hub.url = baseUrl + '/signalr1_1_2/hubs';
            $.connection.hub.start({ jsonp: isChrome }).done(this._onConnectionEstablished.bind(this));

            this._localizeElements();
            this._setThumbsImage();

            localizedStrings = this.localizedStrings;
        },

        _localizeElements: function () {
            var localizedStrings = this.localizedStrings;
            if (localizedStrings != null) {
                this.element.find("[data-localize],[data-localize-ph],[data-localize-tooltip]").each(function () {
                    var that = $(this);
                    var localizationKey = that.attr("data-localize");
                    var localizationTextValue;
                    if (localizationKey) {
                        localizationTextValue = localizedStrings[localizationKey];
                        that.text(localizationTextValue);
                    } else {
                        localizationKey = that.attr("data-localize-ph");
                        if (localizationKey) {
                            localizationTextValue = localizedStrings[localizationKey];
                            that.attr("placeholder", localizationTextValue);
                        } else {
                            localizationKey = that.attr("data-localize-tooltip");
                            if (localizationKey) {
                                localizationTextValue = localizedStrings[localizationKey];
                                that.attr("data-tooltip", localizationTextValue);
                            }
                        }
                    }
                });
            }
        },

        _setThumbsImage: function () {
            var thumbsButton = this.element.find(".thumbs_btn");

            if (this.showThumbnails && this.thumbsImageBase64Encoded != null) {
                thumbsButton.css("background-image", "url(data:image/png;base64," + this.thumbsImageBase64Encoded + ")")
                    .css("background-position", "0 0");
            }
        },

        _onAnnotationsImported: function (response) {
            measurementAnnotationViewModel.prototype._onAnnotationsImported.apply(this, arguments);
            this.loadDocument(response.fileId);
        },

        _onAnnotationsExported: function (response) {
            this.exportingAnnotationsProgress.modal("hide");
            this._downloadFileAt(response.url);
        },

        _onAnnotationCreated: function (annotation, markerFigure) {
            measurementAnnotationViewModel.prototype._onAnnotationCreated.call(this, annotation, markerFigure);
            this.showExpandedCommentsPanel();
        },

        _onPdfVerionOfDocumentReceived: function (response) {
            this.exportingAnnotationsProgress.modal("hide");
            this._downloadFileAt(response.url);
        },

        _onDocumentDownloaded: function (response) {
            this._downloadFileAt(response.url);
        },

        _downloadFileAt: function (url) {
            var frameId = 'groupdocs-file-download',
                downloader = $('#' + frameId);

            if (!downloader || downloader.length == 0) {
                downloader = $('<iframe>', { id: frameId }).hide().appendTo('body');
            }

            downloader.attr('src', url);
        },

        _onConnectionEstablished: function (result) {
            $.connection.annotationHub.server.setDocumentGuidForConnection(this.fileId);
            this.getDocumentCollaborators();
            this.listAnnotations();
        },

        _hubHandler: {
            _onAnnotationCreated: function (connectionId, data) {
                if (connectionId != $.connection.hub.id) {
                    this.addAnnotationFromAnotherUser(data);
                }
            },

            _onAnnotationReplyCreated: function (connectionId, data) {
                if (connectionId != $.connection.hub.id) {
                    this.addAnnotationReplyFromAnotherUser(data);
                }
            },

            _onAnnotationMoved: function (connectionId, annotationGuid, position) {
                if (connectionId != $.connection.hub.id) {
                    this.moveAnnotationOnClient(annotationGuid, position);
                }
            },

            _onReviewerColorChanged: function (connectionId, reviewerDescriptions) {
                if (connectionId != $.connection.hub.id) {
                    this.setReviewersColorsOnClient(reviewerDescriptions);
                }
            },

            _onReviewerRightsChanged: function (connectionId, reviewerDescriptions) {
                if (connectionId != $.connection.hub.id) {
                    this.setReviewersRightsOnClient(reviewerDescriptions);
                }
            },

            _onAnnotationResized: function (connectionId, annotationGuid, width, height) {
                if (connectionId != $.connection.hub.id) {
                    this.resizeAnnotationOnClient(annotationGuid, width, height);
                }
            },

            _onTextFieldColorSet: function (connectionId, annotationGuid, fontColor) {
                if (connectionId != $.connection.hub.id) {
                    this.setTextFieldColorOnClient(annotationGuid, fontColor);
                }
            },

            _onAnnotationBackgroundColorSet: function (connectionId, annotationGuid, color) {
                if (connectionId != $.connection.hub.id) {
                    this.setAnnotationBackgroundColorOnClient(annotationGuid, color);
                }
            },

            _onAnnotationRemoved: function (connectionId, annotationGuid) {
                if (connectionId != $.connection.hub.id) {
                    this.deleteAnnotationOnClient(annotationGuid);
                }
            },

            _onAnnotationMarkerMoved: function (connectionId, annotationGuid, position, pageNumber) {
                if (connectionId != $.connection.hub.id) {
                    this.moveAnnotationMarkerOnClient(annotationGuid, position, pageNumber);
                }
            },

            _onAnnotationReplyEdited: function (connectionId, annotationGuid, replyGuid, message) {
                if (connectionId != $.connection.hub.id) {
                    this.editAnnotationReplyOnClient(annotationGuid, replyGuid, message);
                }
            },

            _onAnnotationReplyRemoved: function (connectionId, annotationGuid, replyGuid, replies) {
                if (connectionId != $.connection.hub.id) {
                    this.deleteAnnotationReplyOnClient(annotationGuid, replyGuid, replies);
                }
            },

            _onTextFieldUpdated: function (connectionId, annotationGuid, text, fontFamily, fontSize) {
                if (connectionId != $.connection.hub.id) {
                    this.updateTextFieldOnClient(annotationGuid, text, fontFamily, fontSize);
                }
            },

            _onAnnotationAccessChanged: function (connectionId, annotationGuid, annotationAccess, annotation) {
                if (connectionId != $.connection.hub.id) {
                    this.setAnnotationAccessOnClient(annotationGuid, annotationAccess, annotation);
                }
            }
        }
    });
    $("a[href='#tab_summary']").on('click', function (e) {
        $("#comments_scroll_2").tinyscrollbar_update("relative");
    });
    $.widget('ui.groupdocsAnnotationViewer', $.ui.documentAnnotation, {
        _createViewModel: function () {
            return new groupdocsAnnotationViewerViewModel(this.options);
        },

        _create: function () {
            $.ui.documentAnnotation.prototype._create.call(this);
        }
    });
})(jQuery);