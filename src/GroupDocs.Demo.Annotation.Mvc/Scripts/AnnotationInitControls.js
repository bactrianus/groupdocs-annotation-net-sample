window.groupdocs.initAnnotationControlsAndHandlers = function (annotationWidget, annotationsViewer, annotationsViewerVM) {

    var commentModePanel = $(annotationWidget).find('div.embed_annotation_tools');
    commentModePanel.css('margin-right', 0);

    commentModePanel.draggable({
        scroll: false,
        handle: '.tools_dots',
        containment: 'body',
        appendTo: 'body'
    });

    $(annotationWidget).find('.tool_field').click(function () {
        var toolFields = $(annotationWidget).find('.tool_field');
        if (toolFields.hasClass('active')) {
            $(toolFields.removeClass('active'));
        }
        ;
        $(this).addClass('active');
    });

    $(annotationWidget).find('.header_tools_icon').hover(
        function () { $(this).find('.tooltip_on_hover').css('display', 'block'); },
        function () { $(this).find('.tooltip_on_hover').css('display', 'none'); });


    if (annotationsViewerVM.enableSidePanel)
        $(annotationWidget).find(".comments_togle_btn").click(function () { flipPanels(true); });

    $(annotationWidget).find('.comments_scroll').tinyscrollbar({ sizethumb: 50 });

    var annotationIconsWrapper = $(annotationWidget).find('.annotation_icons_wrapper');
    var annotationIconsWrapperParent = annotationIconsWrapper.parent()[0];
    var annotationIconsWrapperParentScrollTop;

    annotationsViewer.bind('onDocumentLoadComplete', function (e, data) {
        annotationsViewerVM.setHandToolMode();

        annotationIconsWrapper.height($(annotationsViewer).find('.pages_container').height());
        annotationIconsWrapperParent.scrollTop = annotationIconsWrapperParentScrollTop;

        window.setTimeout(resizeSidebar, 10);
    });

    annotationsViewer.bind('onDocViewScrollPositionSet', function (e, data) {
        annotationIconsWrapper.parent()[0].scrollTop = data.position;
    } .bind(this));

    annotationsViewer.bind('onBeforeScrollDocView onDocViewScrollPositionSet', function (e, data) {
        if (annotationIconsWrapperParent.scrollTop != data.position) {
            annotationIconsWrapperParent.scrollTop = data.position;
            annotationIconsWrapperParentScrollTop = data.position;
        }
    } .bind(this));

    function flipPanels(togglePanels) {
        var docViewer = $(annotationsViewer)[0];
        var annotationIconsPanelVisible = $(annotationWidget).find('.comments_sidebar_collapsed').is(':visible');

        function setIconsPanelScrollTop() {
            if (!annotationIconsPanelVisible)
                annotationIconsWrapperParent.scrollTop = docViewer.scrollTop;
        }

        function redrawLinesAndCalculateZoom() {
            setIconsPanelScrollTop();

            if (togglePanels)
                annotationsViewerVM.redrawConnectingLines(!annotationIconsPanelVisible);
            else {
                annotationsViewerVM.resizePagesToWindowSize();
                var selectableElement = annotationsViewerVM.getSelectable();

                if (selectableElement != null) {
                    var selectable = (selectableElement.data('ui-dvselectable') || selectableElement.data('dvselectable'));
                    selectable.initStorage();
                }

                annotationsViewerVM.redrawWorkingArea();
            }
        }

        if (togglePanels) {
            if (!annotationIconsPanelVisible) {
                redrawLinesAndCalculateZoom();
            }

            var setIntervalId = window.setInterval(function () {
                setIconsPanelScrollTop();
            }, 50);

            $(annotationWidget).find('.comments_sidebar_collapsed').toggle('slide', { direction: 'right' }, 400, function () {
                clearInterval(setIntervalId);
                setIconsPanelScrollTop();
            });

            $(annotationWidget).find('.comments_sidebar_expanded').toggle('slide', { direction: 'right' }, 400,
                function () {
                    if (annotationIconsPanelVisible)
                        redrawLinesAndCalculateZoom();
                    else
                        setIconsPanelScrollTop();

                    //window.setZoomWhenTogglePanel(); 
                });
        }
        else
            redrawLinesAndCalculateZoom();

        $(annotationWidget).find('.comments_scroll').tinyscrollbar_update('relative');
    }

    $(window).resize(function () {
        flipPanels(false);
        resizeSidebar();
    });

    resizeSidebar();


    function resizeSidebar() {
        var containerHeight = $(annotationWidget).find(".doc_viewer").height();
        $(annotationWidget).find('.comments_content').css({ 'height': (containerHeight - 152) + 'px' });
        $(annotationWidget).find('.comments_scroll').css({ 'height': (containerHeight - 152) + 'px' });
        $(annotationWidget).find('.comments_scroll .viewport').css({ 'height': (containerHeight - 80) + 'px' });
        $(annotationWidget).find('.comments_sidebar_collapsed').css({ 'height': (containerHeight - 50) + 'px' });
        $(annotationWidget).find('.comments_scroll').tinyscrollbar_update('relative');
    }

    $('html').click(function () {
        if ($(annotationWidget).find('.dropdown_menu_button').hasClass('active')) {
            $(annotationWidget).find('.dropdown_menu_button.active').next('.dropdown_menu').hide('blind', 'fast');
            $(annotationWidget).find('.dropdown_menu_button.active').removeClass('active');
        }
    });

    // initialize keyboard shortcuts
    if (Mousetrap) {
        var baseMousetrapStopCallback = Mousetrap.stopCallback;

        Mousetrap.stopCallback = function (e, element, combo, sequence) {
            if (annotationsViewerVM.tabNavigationEnabled !== true) {
                return true;
            }

            return false;
        };

        Mousetrap.bind(['command+z', 'ctrl+z'], function (e) {
            annotationsViewerVM.undo();
            return false;
        });

        Mousetrap.bind(['shift+command+z', 'ctrl+y'], function (e) {
            annotationsViewerVM.redo();
            return false;
        });

        Mousetrap.bind(['del'], function (e) {
            var annotation = annotationsViewerVM.activeAnnotation(),
                reply = (annotation ? annotation.getActiveReply() : null);

            if (annotation == null || (reply != null && reply.text().length > 0)) {
                return true;
            }

            annotationsViewerVM.removeAnnotation(annotation, e);
            return false;
        });

        Mousetrap.bind('tab', function (e) {
            if (annotationsViewerVM.tabNavigationEnabled !== true)
                return true;

            annotationsViewerVM.activateNextAnnotation();
            return false;
        });

        Mousetrap.bind('shift+tab', function (e) {
            if (annotationsViewerVM.tabNavigationEnabled !== true)
                return true;

            annotationsViewerVM.activatePrevAnnotation();
            return false;
        });
    }

    // initialize error modal dialog
    window.jerror = function (msg, handler, title) {
        $(annotationWidget).trigger("error.groupdocs", msg);

        if (annotationsViewerVM.enableStandardErrorHandling) {
            var ttl = title || 'Error';

            if (!msg) msg = 'Sorry, we\'re unable to perform your request right now. Please try again later.';

            $('#jerrormodal h3').text(ttl);
            $('#jerrormodalText').text(msg.Reason ? msg.Reason : msg);

            if (handler) {
                $('#jerrormodal').one('hidden', handler);
            }

            $('#jerrormodal').modal('show');
        }
    }


    if ($('#jerrormodal').length > 0)
        return;

    $("<div class='grpdx jerrorwrapper'> <div id='jerrormodal' class='modal fade modal2' style='z-index: 9999'>" +
        "  <div class='modal_inner_wrapper'>" +
        "      <a class='popclose' data-dismiss='modal'></a>" +
        "      <div class='modal_header'>" +
        "          <h3>Error</h3>" +
        "      </div>" +
        "      <div class='modal_content'>" +
        "          <div class='modal_input_wrap_left'>" +
        "              <p id='jerrormodalText' class='modaltext left'>An unexpected error occured. Please contact Support team for the assistance.</p>" +
        "          </div>" +
        "      </div>" +
        "  </div>" +
        "</div></div>").appendTo('body');

    $('#jerrormodal').modal({ show: false });

}