$.extend(jSaaspose.PortalService.prototype, {
    getReviewerContactsAsync: function (userId, privateKey, successCallback, errorCallback) {
    },

    listAnnotationsAsync: function (connectionId, userId, privateKey, fileId, successCallback, errorCallback) {
        var data = { connectionId: connectionId, userId: userId, privateKey: privateKey, fileId: fileId };
        return this._runServiceAsync(this.applicationPath + 'document-annotation/ListAnnotations' + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    createAnnotationAsync: function (connectionId, userId, privateKey, fileId, type, message, pageNumber, rectangle, annotationPosition,  svgPath, drawingOptions, font, successCallback, errorCallback) {
        var data = { connectionId: connectionId, userId: userId, privateKey: privateKey, fileId: fileId, type: type, message: message,
            pageNumber: pageNumber, rectangle: rectangle, annotationPosition: annotationPosition, svgPath: svgPath,
            drawingOptions: drawingOptions, font: font
        };

        return this._runServiceAsync(this.applicationPath + 'document-annotation/CreateAnnotation' + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    deleteAnnotationAsync: function (connectionId, userId, privateKey, fileId, annotationGuid, successCallback, errorCallback) {
        var data = { connectionId: connectionId, userId: userId, privateKey: privateKey, fileId: fileId, annotationGuid: annotationGuid };
        return this._runServiceAsync(this.applicationPath + "document-annotation/DeleteAnnotation" + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    addAnnotationReplyAsync: function (connectionId, userId, privateKey, fileId, annotationGuid, message, parentReplyGuid, successCallback, errorCallback) {
        var data = { connectionId: connectionId, userId: userId, privateKey: privateKey, fileId: fileId,
            annotationGuid: annotationGuid, message: message, parentReplyGuid: parentReplyGuid
        };
        return this._runServiceAsync(this.applicationPath + 'document-annotation/AddAnnotationReply' + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    deleteAnnotationReplyAsync: function (connectionId, userId, privateKey, fileId, annotationGuid, replyGuid, successCallback, errorCallback) {
        var data = { connectionId: connectionId, userId: userId, privateKey: privateKey, fileId: fileId, annotationGuid: annotationGuid, replyGuid: replyGuid };
        return this._runServiceAsync(this.applicationPath + "document-annotation/DeleteAnnotationReply" + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    editAnnotationReplyAsync: function (connectionId, userId, privateKey, fileId, annotationGuid, replyGuid, message, successCallback, errorCallback) {
        var data = { connectionId: connectionId, userId: userId, privateKey: privateKey, fileId: fileId, annotationGuid: annotationGuid,
            replyGuid: replyGuid, message: message
        };
        return this._runServiceAsync(this.applicationPath + 'document-annotation/EditAnnotationReply' + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    restoreAnnotationRepliesAsync: function (connectionId, fileId, annotationGuid, replies, successCallback, errorCallback) {
        var data = { connectionId: connectionId, fileId: fileId, annotationGuid: annotationGuid, replies: replies };
        return this._runServiceAsync(this.applicationPath + 'document-annotation/RestoreAnnotationReplies' + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    viewAnnotatedDocumentAsync: function (userId, privateKey, guid, index, count, width, height, quality, usePdf, watermark, successCallback, errorCallback, useCache) {
        var data = { userId: userId, privateKey: privateKey, path: guid, width: width, quality: quality, usePdf: usePdf, preloadPagesCount: count, watermarkText: watermark.text, watermarkColor: watermark.color, watermarkPosition: watermark.position, watermarkFontSize: watermark.fontSize };
        this._runServiceAsync(this.applicationPath + this.urlPrefix + '/ViewDocument' + this._urlSuffix, data, successCallback, errorCallback, useCache != null ? useCache : true);
    },

    moveAnnotationMarkerAsync: function (connectionId, userId, privateKey, fileId, annotationGuid, left, top, pageNumber, successCallback, errorCallback) {
        var data = { connectionId: connectionId, userId: userId, privateKey: privateKey, fileId: fileId, annotationGuid: annotationGuid, left: left, top: top, pageNumber: pageNumber };
        return this._runServiceAsync(this.applicationPath + "document-annotation/MoveAnnotationMarker" + this._urlSuffix, data, successCallback, errorCallback, false);
    },
    saveTextFieldAsync: function (connectionId, userId, privateKey, fileId, annotationGuid, text, fontFamily, fontSize, successCallback, errorCallback) {
        var data = { connectionId: connectionId, userId: userId, privateKey: privateKey, fileId: fileId, annotationGuid: annotationGuid,
            text: text, fontFamily: fontFamily, fontSize: fontSize
        };
        return this._runServiceAsync(this.applicationPath + "document-annotation/SaveTextField" + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    setTextFieldColorAsync: function (connectionId, userId, privateKey, fileId, annotationGuid, fontColor, successCallback, errorCallback) {
        var data = { connectionId: connectionId, userId: userId, privateKey: privateKey, fileId: fileId, annotationGuid: annotationGuid,
            fontColor: fontColor
        };
        return this._runServiceAsync(this.applicationPath + "document-annotation/SetTextFieldColor" + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    setAnnotationBackgroundColorAsync: function (connectionId, fileId, annotationGuid, color, successCallback, errorCallback) {
        var data = { connectionId: connectionId, fileId: fileId, annotationGuid: annotationGuid, color: color };
        return this._runServiceAsync(this.applicationPath + "document-annotation/SetAnnotationBackgroundColor" + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    resizeAnnotationAsync: function (connectionId, userId, privateKey, fileId, annotationGuid, width, height, successCallback, errorCallback) {
        var data = { connectionId: connectionId, userId: userId, privateKey: privateKey, fileId: fileId,
            annotationGuid: annotationGuid, width: width, height: height
        };
        return this._runServiceAsync(this.applicationPath + "document-annotation/ResizeAnnotation" + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    exportAnnotationsAsync: function (connectionId, fileId, format, mode, successCallback, errorCallback) {
        var data = { connectionId: connectionId, fileId: fileId, format: format, mode: mode };
        return this._runServiceAsync(this.applicationPath + "document-annotation/ExportAnnotations" + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    importAnnotationsAsync: function (userId, privateKey, connectionId, fileId, saveCurrentAnnotations, successCallback, errorCallback) {
        var data = { connectionId: connectionId, fileGuid: fileId, userId: userId, privateKey: privateKey, saveCurrentAnnotations: saveCurrentAnnotations };
        return this._runServiceAsync(this.applicationPath + 'document-annotation/ImportAnnotations' + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    getPdfVersionOfDocumentAsync: function (connectionId, fileId, successCallback, errorCallback) {
        var data = { connectionId: connectionId, fileId: fileId };
        return this._runServiceAsync(this.applicationPath + "document-annotation/GetPdfVersionOfDocument" + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    addDocumentReviewerAsync: function (userId, privateKey, fileId, reviewerEmail, reviewerFirstName, reviewerLastName,
                                        reviewerInvitationMessage, successCallback, errorCallback) {
        var data = { userId: userId, privateKey: privateKey, fileId: fileId, reviewerEmail: reviewerEmail,
            reviewerFirstName: reviewerFirstName, reviewerLastName: reviewerLastName,
            reviewerInvitationMessage: reviewerInvitationMessage
        };
        return this._runServiceAsync(this.applicationPath + "document-annotation/AddDocumentReviewer", data, successCallback, errorCallback, false);
    },

    getDocumentCollaboratorsAsync: function (userId, privateKey, fileId, successCallback, errorCallback) {
        var data = { userId: userId, privateKey: privateKey, fileId: fileId };
        return this._runServiceAsync(this.applicationPath + "document-annotation/GetDocumentCollaborators" + this._urlSuffix, data, successCallback, errorCallback, false);
    },

    getDocumentCollaboratorsSync: function (userId, privateKey, fileId) {
        var r = null;
        var data = { userId: userId, privateKey: privateKey, fileId: fileId };
        var successCallback = function (response) { r = response; };
        var errorCallback = function (response) { r = { error: response }; };

        this._runService(this.applicationPath + "document-annotation/GetDocumentCollaborators" + this._urlSuffix, data, false, successCallback, errorCallback, false);
        return r;
    },

    setReviewerContactsAsync: function (userId, privateKey, reviewerContacts, successCallback, errorCallback) {
    },

    getFile: function (fileId, successCallback, errorCallback, useCache) {
        var data = { fileId: fileId };
        successCallback({ fileId: fileId, url: this.applicationPath + this.urlPrefix + '/GetFile' + this._urlSuffix + '?path=' + fileId });
    }
});