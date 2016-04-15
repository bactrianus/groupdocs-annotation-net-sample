(function ($, undefined) {
    var GuestUser = {
        Name: 'groupdocs@groupdocs.com',
        DisplayName: 'guest'
    };

    var englishLocale = {
        'ago': 'ago',
        'hour': 'hour',
        'hours': 'hours',
        'minute': 'minute',
        'minutes': 'minutes',
        'day': 'day',
        'days': 'days',
        'week': 'week',
        'weeks': 'weeks',
        'lessThanAMinuteAgo': 'less than a minute ago'
    };

    var ToolDeactivationMode = {
        Manual: 0,
        Auto: 1
    };

    //
    // Annotation reply structure
    //
    AnnotationReply = function (reply, serverTime) {
        this._init(reply, serverTime || new Date());
    };

    $.extend(AnnotationReply.prototype, {
        guid: null,
        index: -1,
        text: null,
        repliedOn: null,
        userGuid: null,
        userName: null,
        parentReply: null,
        replyLevel: 0,
        baseAvatarUrl: null,
        avatarUrl: null,
        childReplies: null,

        _init: function (reply, serverTime) {
            this.guid = ko.observable(reply.guid);
            this.repliedOn = reply.repliedOn;
            var replyDateTime = new Date(this.repliedOn);
            var now = serverTime;

            var difference = now.getTime() - replyDateTime.getTime();

            difference = (difference > 0 ? difference : 0);

            var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
            difference -= daysDifference * 1000 * 60 * 60 * 24;

            var hoursDifference = Math.floor(difference / 1000 / 60 / 60);
            difference -= hoursDifference * 1000 * 60 * 60;

            var minutesDifference = Math.floor(difference / 1000 / 60);
            difference -= minutesDifference * 1000 * 60;

            //var secondsDifference = Math.floor(difference / 1000);
            if (hoursDifference > 0) {
                if (minutesDifference > 15 && minutesDifference < 45)
                    hoursDifference += 0.5;
                if (minutesDifference >= 45) {
                    hoursDifference += 1;
                    if (hoursDifference >= 24)
                        daysDifference += 1;
                }
            }

            var localization = $.extend(true, {}, englishLocale, window.localizedStrings || {});

            var localizedAgo = localization["ago"];

            var localizedHour = localization["hour"];
            var localizedHours = localization["hours"];

            var localizedDay = localization["day"];
            var localizedDays = localization["days"];

            var localizedWeek = localization["week"];
            var localizedWeeks = localization["weeks"];

            if (daysDifference < 7) {
                if (daysDifference == 0) {
                    if (hoursDifference == 0) {
                        if (minutesDifference == 0) {

                            this.displayDateTime = localization["lessThanAMinuteAgo"];
                        } else {

                            var localizedMin = localization["minute"];
                            var localizedMins = localization["minutes"];

                            this.displayDateTime = window.jGroupdocs.stringExtensions.format("{0} {1} {2}", minutesDifference, (minutesDifference == 1 ? localizedMin : localizedMins), localizedAgo);
                        }
                    }
                    else {
                        this.displayDateTime = window.jGroupdocs.stringExtensions.format("{0} {1} {2}", hoursDifference, (hoursDifference == 1 ? localizedHour : localizedHours), localizedAgo);

                    }
                }
                else {
                    this.displayDateTime = window.jGroupdocs.stringExtensions.format("{0} {1} {2} {3} {4}", daysDifference, (daysDifference == 1 ? localizedDay : localizedDays), hoursDifference, (hoursDifference == 1 ? localizedHour : localizedHours), localizedAgo);
                }
            }
            else {
                this.displayDateTime = window.jGroupdocs.stringExtensions.format("{0} {1} {2} {3} {4}", Math.floor(daysDifference / 7), (Math.floor(daysDifference / 7) == 1 ? localizedWeek : localizedWeeks), daysDifference % 7, (daysDifference % 7) == 1 ? localizedDay : localizedDays, localizedAgo);
            }

            //this.displayDateTime = replyDateTime.getFullYear() + "-" + (replyDateTime.getMonth() + 1) + "-" + replyDateTime.getDate() + " " +
            //                        replyDateTime.getHours() + ":" + replyDateTime.getMinutes() + ":" + replyDateTime.getSeconds();
            this.userGuid = reply.userGuid;
            this.userName = (reply.userName == GuestUser.Name ? GuestUser.DisplayName : reply.userName || GuestUser.DisplayName);
            this.text = ko.observable(reply.text);
            this.parentReplyGuid = ko.observable(reply.parentReplyGuid);
            this.replyLevel = reply.replyLevel;
            this.avatarUrl = (reply.isAvatarExist === false ? null : this.baseAvatarUrl + reply.userGuid);
            this.childReplies = ko.observableArray([]);

            this.isEmpty = ko.computed(function () {
                return !(this.guid() && this.guid().length);
            }, this);
        },

        clone: function () {
            return new AnnotationReply(ko.toJS(this), new Date());
        },

        restore: function (source) {
            if (!source || source.guid() != this.guid()) {
                return false;
            }

            this.text(source.text());
            return true;
        }
    });

    //
    // Annotation structure
    //
    Annotation = function (annotation, serverTime) {
        this._init(annotation, serverTime);
    };

    $.extend(Annotation.prototype, {
        guid: null,
        creatorGuid: null,
        type: null,
        access: null,
        bounds: null,
        displayBounds: null,
        annotationPosition: null,
        annotationOriginalTextBoxDisplayPosition: null,
        annotationSideIconDisplayPosition: null,
        textRange: null,
        createdOn: null,
        documentGuid: null,
        comments: null,
        replies: null,
        activeReply: null,
        activeReplyData: null,
        svgPath: null,
        displaySvgPath: null,
        connectingLine: null,
        annotationIsPublic: null,
        startingPoint: null,
        text: null,
        fontSize: null,
        fontFamily: null,
        isBeingDeleted: null,
        fontColor: null,
        penColor: null,
        penWidth: null,
        penStyle: null,
        backgroundColor: null,
        selectionCounter: null,
        connectorPosition: 0,
        // Annotation Type enum
        AnnotationType: { None: -1, Text: 0, Area: 1, Point: 2, TextStrikeout: 3, Polyline: 4, TextField: 5, Watermark: 6, TextReplacement: 7, Arrow: 8, TextRedaction: 9, ResourcesRedaction: 10, TextUnderline: 11, Distance: 12 },
        AnnotationExportMode: { Append: 0, TrackChanges: 1 },
        AnnotationAccess: { Public: 0, Private: 1 },
        ConnectorPosition: { Middle: 0, Bottom: 1 },

        _init: function (annotation, serverTime) {
            this.guid = annotation.guid;
            this.type = annotation.type;
            this.access = annotation.access;
            this.pageNumber = annotation.pageNumber;
            this.bounds = ko.observable(new jSaaspose.Rect(annotation.box.x, annotation.box.y, annotation.box.x + annotation.box.width, annotation.box.y + annotation.box.height, false));
            this.displayBounds = ko.observable(new jSaaspose.Rect(0, 0, 0, 0));
            this.annotationPosition = ko.observable(new jSaaspose.Point(annotation.annotationPosition.x, annotation.annotationPosition.y));
            this.annotationOriginalTextBoxDisplayPosition = ko.observable(new jSaaspose.Point(0, 0));
            this.annotationSideIconDisplayPosition = ko.observable(new jSaaspose.Point(0, 0));
            this.createdOn = annotation.createdOn;
            this.documentGuid = annotation.documentGuid;
            this.replies = ko.observableArray([]);
            this.comments = ko.observableArray([]);
            this.activeReply = ko.observable(-1);
            this.svgPath = annotation.svgPath;
            this.displaySvgPath = "";
            this.annotationIsPublic = ko.observable(annotation.access == Annotation.prototype.AnnotationAccess.Public);
            this.creatorGuid = annotation.creatorGuid;
            this.startingPoint = annotation.startingPoint;
            this.text = annotation.fieldText;
            this.fontFamily = annotation.fontFamily;
            this.fontSize = annotation.fontSize;
            this.isBeingDeleted = ko.observable(false);
            this.fontColor = ko.observable(annotation.fontColor || 0);
            this.selectionCounter = annotation.selectionCounter;
            this.penColor = annotation.penColor || (annotation.drawingOptions ? annotation.drawingOptions.penColor : undefined);
            this.penWidth = annotation.penWidth || (annotation.drawingOptions ? annotation.drawingOptions.penWidth : undefined);
            this.penStyle = annotation.penStyle || (annotation.drawingOptions ? annotation.drawingOptions.penStyle : undefined);
            this.backgroundColor = ko.observable(annotation.backgroundColor || (annotation.drawingOptions ? annotation.drawingOptions.brushColor : undefined));

            if (annotation.range) {
                this.textRange = { position: annotation.range.position, length: annotation.range.length };
            }

            this.commentsEnabled = (this.type != Annotation.prototype.AnnotationType.TextStrikeout &&
                this.type != Annotation.prototype.AnnotationType.TextField &&
                this.type != Annotation.prototype.AnnotationType.Watermark);

            this.sortReplies(annotation.replies, serverTime);

            this.replyCount = ko.computed(function () {
                return $.grep(this.replies(), function (r) { return !r.isEmpty(); }).length;
            }, this);

            this.activeReply.subscribe(function (newValue) {
                var reply = this.getReplyAt(newValue);
                if (reply)
                    this.activeReplyData = reply.clone();
            }, this);
        },

        boundingBox: function () {
            if (this.bounds().top() < 0) {
                this.bounds().setTop(0);
                this.bounds(this.bounds());
            }

            /*if (this.svgPath && this.svgPath.length > 0 &&
            (this.type == Annotation.prototype.AnnotationType.Text ||
            this.type == Annotation.prototype.AnnotationType.TextReplacement ||
            this.type == Annotation.prototype.AnnotationType.TextRedaction)) {

            var points = JSON.parse(this.svgPath);
            if ($.isArray(points) == false)
            return this.bounds();

            var bounds = new jSaaspose.Rect(points[0].x, points[0].y, 0, 0);

            for (var i = 1; i < points.length; i++) {
            bounds.topLeft.x = Math.min(bounds.topLeft.x, points[i].x);
            bounds.bottomRight.x = Math.max(bounds.bottomRight.x, points[i].x);
            bounds.topLeft.y = Math.min(bounds.topLeft.y, points[i].y);
            bounds.bottomRight.y = Math.max(bounds.bottomRight.y, points[i].y);
            }

            return bounds;
            }*/

            return this.bounds();
        },

        sortReplies: function (inputReplies, serverTime) {
            var i;
            var reply;
            var unsortedReplies = [];
            for (i = 0; i < inputReplies.length; i++) {
                var r = new AnnotationReply(inputReplies[i], serverTime);
                unsortedReplies.push(r);
            }

            var parentReplyGuid;
            for (i = 0; i < unsortedReplies.length; i++) {
                reply = unsortedReplies[i];
                this.calculateReplyLevel(reply, unsortedReplies);
            }

            var sortedReplies = [];
            var replyLevel = 0;
            var repliesMoved = 0;
            parentReplyGuid = null;
            var repliesMovedForThisLevel = false;
            var replyQuantity = unsortedReplies.length;
            var parentReplyGuids = [];

            while (repliesMoved < replyQuantity) {
                do {
                    repliesMovedForThisLevel = false;
                    for (i = 0; i < unsortedReplies.length; i++) {
                        reply = unsortedReplies[i];
                        if (reply.replyLevel == replyLevel && (reply.parentReplyGuid() == parentReplyGuid || replyLevel == 0)) {
                            sortedReplies.push(reply);
                            repliesMoved++;
                            repliesMovedForThisLevel = true;
                            parentReplyGuids.push(parentReplyGuid);
                            parentReplyGuid = reply.guid();
                            unsortedReplies.splice(i, 1);
                            replyLevel++;
                            break;
                        }
                    }
                } while (repliesMovedForThisLevel)
                parentReplyGuid = parentReplyGuids.pop();
                replyLevel--;
            }

            for (i = 0; i < sortedReplies.length; i++) {
                this.pushReply(sortedReplies[i]);
            }
        },

        activateLastReply: function () {
            var count = this.replies().length;
            this.activeReply(count - 1);
        },

        deactivateActiveReply: function () {
            this.activeReply(-1);
        },

        pushReply: function (reply) {
            reply.index = this.replies().length;
            this.replies.push(reply);

            if (reply.replyLevel == 0 && !reply.isEmpty()) {
                this.comments.push(reply);
                this.comments.sort(function (left, right) {
                    var leftTime = left.repliedOn,
                        rightTime = right.repliedOn;

                    if (leftTime == rightTime)
                        return 0;

                    return (leftTime > rightTime ? 1 : -1);
                });
            }
        },

        addReply: function (userGuid, userName) {
            var reply = new AnnotationReply({ userGuid: userGuid, userName: userName, text: '', repliedOn: new Date() });
            this.pushReply(reply);
            this.activateLastReply();
        },

        addReplyFromAnotherUser: function (reply) {
            if (this.replies().length == 1 && this.replies()[0].userGuid == reply.userGuid) {
                this.replies.remove(this.replies[0]);
                this.replies().length = 0;
            }

            reply.guid = reply.replyGuid;

            var r = new AnnotationReply(reply, new Date(reply.serverTime));
            this.calculateReplyLevel(r, this.replies());

            var replyCount = this.replies().length;

            if (replyCount > 0 && this.replies()[replyCount - 1].isEmpty()) { // an empty reply at the end
                this.replies()[replyCount - 1].index++;
                if (this.activeReply() >= replyCount - 1)
                    this.activeReply(this.activeReply() + 1);
                r.index = replyCount - 1;
                this.replies.splice(-1, 0, r);

                if (r.replyLevel == 0)
                    this.comments.push(r);
            }
            else {
                this.pushReply(r);
                this.deactivateActiveReply();
            }
            return r;
        },

        getActiveReply: function () {
            var index = this.activeReply();
            return this.getReplyAt(index);
        },

        setActiveReply: function (reply) {
            // var index = this.replies().indexOf(reply);
            var index = $.inArray(reply, this.replies());
            this.activeReply(index);
        },

        setActiveReplyIndex: function (replyIndex) {
            this.activeReply(replyIndex);
        },

        getReplyAt: function (index) {
            return (index < 0 || index >= this.replies().length ? null : this.replies()[index]);
        },

        updateReply: function (replyGuid, text) {
            var reply = this.findReply(replyGuid);
            if (reply) {
                reply.text(text);
            }
        },

        deleteAllReplies: function () {
            this.replies.removeAll();
            this.comments.removeAll();
        },

        makeEmpty: function () {
            var reply = new AnnotationReply({ text: "", repliedOn: "", userName: "" });
            this.replies([reply]);
        },

        findReply: function (replyGuid) {
            for (var i = 0; i < this.replies().length; i++) {
                if (this.replies()[i].guid() == replyGuid) {
                    return this.replies()[i];
                }
            }

            return null;
        },

        findReplyInArray: function (array, replyGuid) {
            for (var i = 0; i < array.length; i++) {
                if (array[i].guid() == replyGuid) {
                    return array[i];
                }
            }

            return null;
        },

        createConnectingLine: function (canvas, startX, startY, endX, endY, skipX, endX2) {
            this.removeConnectingLine();
            var offsetLeft = 20, offsetRight = 10;
            var bounds = this.displayBounds();
            this.connectingLine = canvas.path(
                window.jGroupdocs.stringExtensions.format("M{0},{1}L{2},{3}L{4},{5}L{6},{7}m{8},0L{9},{7}",
                    startX, startY,
                    endX - offsetLeft, startY,
                    endX - offsetRight, endY,
                    endX, endY,
                    skipX,
                    endX2));

            this.connectingLine.attr({ "stroke-opacity": 1 });
            this.connectingLine.attr({ "stroke-width": 1 });
            this.setLineColorToInactive();
        },

        setLineColorToActive: function () {
            this.changeConnectingLineColor("#D3480D");
            this.changeConnectingLineDash("");
        },

        setLineColorToInactive: function () {
            this.changeConnectingLineColor("#000");
            this.changeConnectingLineDash(". ");
        },

        changeConnectingLineColor: function (color) {
            if (this.connectingLine != null)
                this.connectingLine.attr({ stroke: color });
        },

        changeConnectingLineDash: function (dashString) {
            if (this.connectingLine != null)
                this.connectingLine.attr({ "stroke-dasharray": dashString });
        },

        removeConnectingLine: function () {
            if (this.connectingLine != null) {
                this.connectingLine.remove();
                this.connectingLine = null;
            }
        },

        insertReplyAfterAnotherReply: function (existingReply, newReply) {
            if (existingReply == null) {
                this.pushReply(newReply);
            } else {
                var existingReplyIndex = this.replies.indexOf(existingReply);
                //this.replies.splice(existingReplyIndex + 1, 0, newReply);
                var lastChildOfParent = existingReplyIndex;
                for (var i = 0; i < this.replies().length; i++) {
                    if (this.replies()[i].parentReplyGuid() == existingReply.guid()) {
                        lastChildOfParent = i;
                    }
                }
                this.replies.splice(lastChildOfParent + 1, 0, newReply);
            }
        },

        calculateReplyLevel: function (reply, replyArray) {
            reply.replyLevel = 0;
            var parentReplyGuid = reply.parentReplyGuid();

            while (parentReplyGuid != null) {
                var parentReply = this.findReplyInArray(replyArray, parentReplyGuid);

                if (parentReply == null) {
                    parentReplyGuid = null;
                }
                else {
                    if (reply.replyLevel == 0)
                        parentReply.childReplies.push(reply);

                    parentReplyGuid = parentReply.parentReplyGuid();
                    reply.replyLevel++;
                }
            }
        },

        checkReplyHasChildren: function (replyGuid) {
            for (var i = 0; i < this.replies().length; i++) {
                if (this.replies()[i].parentReplyGuid() == replyGuid) {
                    return true;
                }
            }

            return false;
        },

        getReplyDescendants: function (replyGuid) {
            var parentGuids = [replyGuid];
            var replies = [];

            while (parentGuids.length > 0) {
                var parentReplyGuid = parentGuids.pop();

                for (var i = 0; i < this.replies().length; i++) {
                    var r = this.replies()[i];

                    if (!r.isEmpty() && r.parentReplyGuid() == parentReplyGuid) {
                        replies.push(r);
                        parentGuids.push(r.guid());
                    }
                }
            }

            return replies;
        }
    });

    //
    // Annotation Model
    //
    annotationModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(annotationModel.prototype, docViewerModel.prototype, {
        createAnnotation: function (fileId, type, message, pageNumber, rectangle, annotationPosition,  svgPath, drawingOptions, font, callback, errorCallback) {
            this._portalService.createAnnotationAsync($.connection.hub.id, this.userId, this.userKey, fileId, type, message,
                                                      pageNumber, rectangle, annotationPosition,  svgPath, drawingOptions, font,
                function (response) {
                    callback.apply(this, [response]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        },

        deleteAnnotation: function (fileId, annotationGuid, callback, errorCallback) {
            this._portalService.deleteAnnotationAsync($.connection.hub.id, this.userId, this.userKey, fileId, annotationGuid,
                function (response) {
                    callback.apply(this, [response]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        },

        addAnnotationReply: function (fileId, annotationGuid, message, parentReplyGuid, callback, errorCallback) {
            this._portalService.addAnnotationReplyAsync($.connection.hub.id, this.userId, this.userKey, fileId, annotationGuid, message, parentReplyGuid,
                function (response) {
                    callback.apply(this, [response]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        },

        editAnnotationReply: function (fileId, annotationGuid, replyGuid, message, callback, errorCallback) {
            this._portalService.editAnnotationReplyAsync($.connection.hub.id, this.userId, this.userKey, fileId, annotationGuid, replyGuid, message,
                function (response) {
                    if (!response.data || response.data.success == false) {
                        errorCallback.apply(this, [response.data || {}]);
                    }
                    else {
                        callback.apply(this, [response]);
                    }
                }.bind(this),
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        },

        restoreAnnotationReplies: function (fileId, annotationGuid, replies, callback, errorCallback) {
            this._portalService.restoreAnnotationRepliesAsync($.connection.hub.id, fileId, annotationGuid, replies,
                function (response) {
                    if (!response.data || response.data.success == false) {
                        errorCallback.apply(this, [response.data || {}]);
                    }
                    else {
                        callback.apply(this, [response]);
                    }
                }.bind(this),
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        },

        deleteAnnotationReply: function (fileId, annotationGuid, replyGuid, callback, errorCallback) {
            this._portalService.deleteAnnotationReplyAsync($.connection.hub.id, this.userId, this.userKey, fileId, annotationGuid, replyGuid,
                function (response) {
                    callback.apply(this, [response]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        },
        listAnnotations: function (fileId, callback, errorCallback) {
            this._portalService.listAnnotationsAsync($.connection.hub.id, this.userId, this.userKey, fileId,
                function (response) {
                    callback.apply(this, [response]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        },

        exportAnnotations: function (fileId, format, mode, callback, errorCallback) {
            this._portalService.exportAnnotationsAsync($.connection.hub.id, fileId, format, mode,
                function (response) {
                    callback.apply(this, [response.data]);
                }.bind(this),
                function (error) {
                    errorCallback.apply(this, [error]);
                }.bind(this));
        },

        importAnnotations: function (fileId, saveCurrentAnnotations, callback, errorCallback) {
            this._portalService.importAnnotationsAsync(this.userId, this.userKey, $.connection.hub.id, fileId, saveCurrentAnnotations,
                function (response) {
                    callback.apply(this, [response.data]);
                }.bind(this),
                function (error) {
                    error.Reason = window.localizedStrings[error.Reason];
                    errorCallback.apply(this, [error]);
                }.bind(this));
        },

        getPdfVersionOfDocument: function (fileGuid, callback, errorCallback) {
            this._portalService.getPdfVersionOfDocumentAsync($.connection.hub.id, fileGuid,
                function (response) {
                    callback.apply(this, [response.data]);
                }.bind(this),
                function (error) {
                    errorCallback.apply(this, [error]);
                }.bind(this));
        },

        getJobOutDoc: function (jobId, callback, errorCallback) {
            this._portalService.getJobOutDocAsync(this.userId, this.userKey, jobId,
                function (response) {
                    callback.apply(this, [response.data]);
                }.bind(this),
                function (error) {
                    errorCallback.apply(this, [error]);
                }.bind(this),
                false
            ).Subscribe();
        },

        moveAnnotation: function (fileId, annotationGuid, left, top, callback, errorCallback) {
            this._portalService.moveAnnotationAsync($.connection.hub.id, this.userId, this.userKey, fileId, annotationGuid, left, top,
                function (response) {
                    callback.apply(this, [response]);
                },
                function (error) {
                    errorCallback.apply(this, [error]);
                });
        },

        resizeAnnotation: function (fileId, annotationGuid, width, height, callback, errorCallback) {
            this._portalService.resizeAnnotationAsync($.connection.hub.id, this.userId, this.userKey, fileId, annotationGuid, width, height,
            function (response) {
                callback.apply(this, [response]);
            },
            function (error) {
                errorCallback.apply(this, [error]);
            });
        },

        moveAnnotationMarker: function (fileId, annotationGuid, left, top, pageNumber, callback, errorCallback) {
            this._portalService.moveAnnotationMarkerAsync($.connection.hub.id, this.userId, this.userKey, fileId, annotationGuid, left, top, pageNumber,
            function (response) {
                callback.apply(this, [response]);
            },
            function (error) {
                errorCallback.apply(this, [error]);
            });
        },

        setAnnotationAccess: function (fileId, annotationGuid, annotationAccess, callback, errorCallback) {
            this._portalService.setAnnotationAccessAsync($.connection.hub.id, this.userId, this.userKey, fileId, annotationGuid, annotationAccess,
            function (response) {
                callback.apply(this, [response]);
            },
            function (error) {
                errorCallback.apply(this, [error]);
            });
        },

        getDocumentCollaborators: function (fileId, successCallback) {
            var response = {};
            response = this._portalService.getDocumentCollaboratorsSync(this.userId, this.userKey, fileId);
            return response;
        },

        setDocumentCollaborators: function (fileId, collaboratorNames, successCallback, errorCallback) {
            this._portalService.setDocumentCollaboratorsAsync(this.userId, this.userKey, fileId, "2", collaboratorNames,
                function (response) {
                    successCallback.apply(this, [response]);
                }.bind(this),
                function (error) {
                    errorCallback.apply(this, [error.Reason]);
                });
        },

        addDocumentReviewer: function (fileId, reviewerEmail, reviewerFirstName, reviewerLastName, reviewerInvitationMessage, successCallback, errorCallback) {
            if (jSaaspose.utils.validateEmail(reviewerEmail)) {
                this._portalService.addDocumentReviewerAsync(this.userId, this.userKey, fileId,
                    reviewerEmail, reviewerFirstName, reviewerLastName,
                    reviewerInvitationMessage,
                    function (response) {
                        successCallback.apply(this, [response]);
                    }.bind(this),
                    function (error) {
                        errorCallback.apply(this, [error.Reason]);
                    });
            } else {
                errorCallback.apply(this, ["You should enter a valid email"]);
            }
        },

        deleteDocumentReviewer: function (fileId, reviewerId, successCallback, errorCallback) {
            this._portalService.deleteDocumentReviewerAsync(this.userId, this.userKey, fileId, reviewerId,
            function (response) {
                successCallback.apply(this, [response]);
            }.bind(this),
            function (error) {
                errorCallback.apply(this, [error.Reason]);
            });
        },

        setReviewerRights: function (fileId, collaborators, successCallback, errorCallback) {
            this._portalService.setReviewerRightsAsync($.connection.hub.id, this.userId, this.userKey, fileId, collaborators,
                function (response) {
                    successCallback.apply(this, [response]);
                }.bind(this),
                function (error) {
                    errorCallback.apply(this, [error.Reason]);
                });
        },

        setSharedLinkAccessRights: function (fileId, sharedLinkAccessRights, successCallback, errorCallback) {
            this._portalService.setSharedLinkAccessRightsAsync(this.userId, this.userKey, fileId, sharedLinkAccessRights,
                function (response) {
                    successCallback.apply(this, [response]);
                }.bind(this),
                function (error) {
                    errorCallback.apply(this, [error.Reason]);
                });
        },

        getReviewerContacts: function (successCallback) {
            this._portalService.getReviewerContactsAsync(this.userId, this.userKey,
                function (response) {
                    successCallback.apply(this, [response]);
                },
                function (error) {
                    jerror("An error has occurred: " + error.Reason);
                });
        },

        setReviewerContacts: function (reviewerContacts, successCallback, errorCallback) {
            this._portalService.setReviewerContactsAsync(this.userId, this.userKey, reviewerContacts,
                function (response) {
                    successCallback.apply(this, [response]);
                }.bind(this),
                function (error) {
                    errorCallback.apply(this, [error.Reason]);
                });
        }
    });

    //
    // Annotation View Model
    //
    annotationViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(annotationViewModel.prototype, docViewerViewModel.prototype, {
        annotations: ko.observableArray([]),
        activeAnnotation: null,
        hoveredAnnotation: null,
        prevHoveredAnnotation: null,
        userName: 'guest@groupdocs.com',
        //annotationModeObservable: ko.observable(Annotation.prototype.AnnotationType.Text),
        annotationModeObservable: ko.observable(null),
        _containerElement: null,
        _designVersion: 2,
        _collaborators: null,
        newCollaborator: null,
        newCollaboratorFirstName: null,
        newCollaboratorLastName: null,
        reviewerContacts: null,
        newReviewerContactEmail: null,
        newReviewerContactFirstName: null,
        newReviewerContactLastName: null,
        invited: null,
        busySavingReviewerRights: null,
        busySavingReviewerContacts: null,
        busyAddingReviewer: null,
        reviewerAutocompleteInputField: null,
        linkToCollaborate: null,
        canRedact: null,
        canDelete: null,
        canExport: null,
        canDownload: null,
        canAnnotate: null,
        canView: null,
        currentUserIsDocumentOwner: null,
        isAnonymousUser: false,
        reviewerInvitationMessage: null,
        iconHeight: 22,
        minimumDistance: 45,
        fixedIconShift: 45,
        draggedMarker: true,
        embeddedAnnotation: false,
        alwaysOnePageInRow: true,
        fullSynchronization: false,
        busyDeletingReviewer: null,
        horizontalCursorPointShift: -10,
        verticalCursorPointShift: 5,
        isRightPanelEnabled: true,

        isTextAnnotationButtonEnabled: true,
        isRectangleAnnotationButtonEnabled: true,
        isPointAnnotationButtonEnabled: true,
        isStrikeoutAnnotationButtonEnabled: true,
        isPolylineAnnotationButtonEnabled: true,
        isTypewriterAnnotationButtonEnabled: true,
        isWatermarkAnnotationButtonEnabled: true,

        isTextReplacementAnnotationButtonEnabled: true,
        isArrowAnnotationButtonEnabled: true,
        isTextRedactionAnnotationButtonEnabled: true,
        isResourceRedactionAnnotationButtonEnabled: true,
        isTextUnderlineAnnotationButtonEnabled: true,
        isDistanceAnnotationButtonEnabled: true,


        isMouseBroadcastEnabled: true,
        isMasterOfBroadcast: false,
        storeAnnotationCoordinatesRelativeToPages: false,
        saveReplyOnFocusLoss: false,
        anyToolSelection: true,
        scrollOnFocus: true,
        disconnectUncommented: false,
        _undoRedo: null,

        _create: function (options) {
            this._model = new annotationModel(options);
            this._init(options);
        },

        _init: function (options) {
            var self = this;

            if (this.embeddedAnnotation) {
                this.pageImageWidth = this.getImageWidthWithoutRightPanel();
                if (this.fullSynchronization && this.isMasterOfBroadcast) {
                    this.zoomToFitHeight = true;
                }
            }

            this._undoRedo = new jGroupdocs.AnnotationUndoManager();

            this.annotations = ko.observableArray([]);
            this.annotationModeObservable = ko.observable(null);

            this.newCollaborator = ko.observable("");
            this.newCollaboratorFirstName = ko.observable("");
            this.newCollaboratorLastName = ko.observable("");

            this.invited = ko.observable(false);
            this._containerElement = options.graphicsContainerElement;
            this._collaborators = ko.observableArray([]);
            this.reviewerContacts = ko.observableArray([]);
            this.newReviewerContactEmail = ko.observable("");
            this.newReviewerContactFirstName = ko.observable("");
            this.newReviewerContactLastName = ko.observable("");
            this.activeAnnotationInternal = ko.observable(null);
            this.hoveredAnnotation = ko.observable(null);
            this.prevHoveredAnnotation = ko.observable(null);

            this.hoveredAnnotation.subscribe(function (newValue) {
                if (newValue)
                    self.prevHoveredAnnotation(newValue);
            });

            this.activeAnnotation = ko.computed({
                read: function () {
                    return this.activeAnnotationInternal();
                },
                write: function (value) {
                    var topOffset;
                    var activeAnnotation = this.activeAnnotationInternal();

                    if (activeAnnotation != null && activeAnnotation != value && activeAnnotation.setLineColorToInactive)
                        activeAnnotation.setLineColorToInactive();

                    if (value != null) {
                        if (value.setLineColorToActive)
                            value.setLineColorToActive();

                        this.scrollToVisible(value);
                    }

                    this.activeAnnotationInternal(value);
                },
                owner: this
            });

            //this.activeAnnotation({ replies: { text: "", repliedOn: "", userName: ""} });
            this.activeAnnotation(null);
            this.busySavingReviewerRights = ko.observable(false);
            this.busySavingReviewerContacts = ko.observable(false);
            this.busyAddingReviewer = ko.observable(false);
            this.busyDeletingReviewer = ko.observable(false);

            this.canRedact = ko.observable(false);
            this.canDelete = ko.observable(false);
            this.canExport = ko.observable(false);
            this.canDownload = ko.observable(false);
            this.canAnnotate = ko.observable(false);
            this.canView = ko.observable(false);
            this.currentUserIsDocumentOwner = ko.observable(false);
            this.isAnonymousUser = ko.observable(false);
            this.reviewerInvitationMessage = ko.observable("");
            this.draggedMarker = false;
            if (this.embeddedAnnotation) {
                this.fixedIconShift = 35;
            }

            this.setupChromeMouseWheelHandler();
            this.getCanvas();
            AnnotationReply.prototype.baseAvatarUrl = this.baseAvatarUrl;

            docViewerViewModel.prototype._init.call(this, options);
        },

        loadDocument: function (fileId) {
            docViewerViewModel.prototype.loadDocument.call(this, fileId);

            var reviewerContacts = [];
            for (var i = 0; i < this.reviewerContacts().length; i++)
                reviewerContacts.push(this.reviewerContacts()[i].emailAddress);

            if (this.reviewerAutocompleteInputField) {
                this.reviewerAutocompleteInputField.autocomplete({
                    source: reviewerContacts,
                    select: function (event, ui) {
                        $(this).val(ui.item.value);
                        $(this).focus();
                        $(this).trigger(jQuery.Event('keypress', { which: 13 }));
                    }
                });
            }

            this._clearAnnotations();
            this.getReviewerContacts();
        },

        getCanvas: function () {
            if (this._canvas == null) {
                var raphaelWrapper = $("<div/>").appendTo(this._containerElement).addClass("raphaelWrapper");
                this._canvas = Raphael(raphaelWrapper[0], "100%", "100%");
            }
            return this._canvas;
        },

        setFileId: function (fileId) {
            this.fileId = fileId;
        },

        listAnnotations: function () {
            this._model.listAnnotations(this.fileId,
                function (response) {
                    this._onAnnotationsReceived(response.data);
                }.bind(this),
                function (error) {
                    this._onError(error);
                }.bind(this));
        },

        removeActiveAnnotation: function () {
            var ann = this.activeAnnotation();
            if (!ann.isBeingDeleted())
                this.removeAnnotation(ann);
        },

        removeAnnotation: function (annotation, e) {
            if (annotation.guid == null)
                return;

            if (annotation.isBeingDeleted)
                annotation.isBeingDeleted(true);

            var bounds = annotation.bounds(),
                pos = annotation.annotationPosition(),
                annotationGuid = annotation.guid,
                activeReply = annotation.getActiveReply(),
                data = {
                    creatorGuid: this.userId,
                    guid: annotation.guid,
                    type: annotation.type,
                    fieldText: annotation.fieldText,
                    pageNumber: annotation.pageNumber,
                    box: (bounds ? { x: bounds.left(), y: bounds.top(), width: bounds.width(), height: bounds.height() } : null),
                    annotationPosition: (pos ? { x: pos.x, y: pos.y } : null),
                    range: annotation.range,
                    svgPath: annotation.svgPath,
                    drawingOptions: annotation.drawingOptions,
                    replies: annotation.replies(),
                    access: annotation.access,
                    startingPoint: annotation.startingPoint,
                    selectionCounter: annotation.selectionCounter
                },
                replies = annotation.getReplyDescendants(null),
                deleteCommand = new DeleteAnnotationCommand(this._model, this.fileId, data, {
                    onDone: function (response) {
                        annotation.isBeingDeleted(false);

                        if (activeReply != null && activeReply.initialText != null && activeReply.initialText.length >= 0) {
                            activeReply.text(activeReply.initialText);
                            activeReply.initialText = null;
                        }

                        this._onAnnotationRemoved(annotation);
                    }.bind(this),

                    onDoFailed: this._onError.bind(this),

                    onUndone: function (response) {
                        annotationGuid = data.guid = response.data.annotationGuid;
                        annotation.guid = annotationGuid;

                        this._addAnnotation(annotation);
                        this.activeAnnotation(annotation);
                    }.bind(this),

                    onUndoFailed: this._onError.bind(this),

                    onIdsFixedUp: function (ids) {
                        if (annotationGuid == ids.oldId) {
                            annotationGuid = ids.newId;
                            annotation.guid = annotationGuid;
                        }
                        else {
                            for (var i = 0; i < replies.length; i++)
                                if (replies[i].guid() == ids.oldId)
                                    replies[i].guid(ids.newId);
                        }
                    }.bind(this)
                },
                replies);
            $('#comments_scroll_2').tinyscrollbar_update('relative');
            this._undoRedo.executeAsync(deleteCommand);
        },

        deleteActiveAnnotation: function () {
            var annotation = this.activeAnnotation();
            if (!annotation.isBeingDeleted())
                this.removeAnnotation(annotation);
        },

        _onAnnotationRemoved: function (annotation) {
            if (this.activeAnnotation() == annotation)
                this.activeAnnotation(null);

            if (annotation.commentsEnabled) {
                annotation.removeConnectingLine();
                this.deselectTextInRect(annotation.bounds(), true, annotation.pageNumber, annotation.selectionCounter);
            }

            this.annotations.remove(annotation);

            $(this).trigger('onAnnotationRemoved', [annotation]);

            if (annotation.commentsEnabled)
                this.preventIconsFromOverlapping();
        },

        moveAnnotation: function (annotation, position) {
            if (annotation.guid != null) {
                this._model.moveAnnotation(this.fileId, annotation.guid, position.x, position.y,
                    function (response) {
                    }.bind(this),
                    function (error) {
                        this._onError(error);
                    }.bind(this));
            }
        },

        resizeAnnotation: function (annotation, width, height, originalSize) {
            if (annotation.guid != null) {
                var oldSize = originalSize,
                    annotationGuid = annotation.guid,
                    resizeCommand = new ResizeAnnotationCommand(this._model, this.fileId, annotation, {
                        onDone: function (response) {
                            this.setTextFieldSize(annotation, width, height);
                        }.bind(this),

                        onUndone: function (response) {
                            this.setTextFieldSize(annotation, oldSize.width, oldSize.height);
                        }.bind(this),

                        onDoFailed: function (response) {
                            this.setTextFieldSize(annotation, oldSize.width, oldSize.height);
                            this._onError.bind(this);
                        }.bind(this),

                        onIdsFixedUp: function (ids) {
                            annotationGuid = ids.newId;
                            annotation = this.findAnnotation(annotationGuid);
                        }.bind(this),

                        onUndoFailed: this._onError.bind(this)
                    },
                    { width: width, height: height },
                    oldSize);

                this._undoRedo.executeAsync(resizeCommand);
            }
        },

        moveAnnotationMarker: function (annotation, position, originalPos) {
            if (annotation.guid != null) {
                var self = this,
                    annotationGuid = annotation.guid,
                    oldPosition = originalPos,
                    triggerEvent = (annotation.type == Annotation.prototype.AnnotationType.Area
                                    || annotation.type == Annotation.prototype.AnnotationType.Polyline
                                     || annotation.type == Annotation.prototype.AnnotationType.ResourcesRedaction
                                     || annotation.type == Annotation.prototype.AnnotationType.Arrow
                                     || annotation.type == Annotation.prototype.AnnotationType.Distance),
                    moveCommand = new MoveAnnotationCommand(this._model, this.fileId, annotation, {
                        onDone: function (response) {
                            this._moveAnnotationMarkerTo(annotation, position, null, triggerEvent);
                        }.bind(this),

                        onUndone: function (response) {
                            this._moveAnnotationMarkerTo(annotation, originalPos, null, triggerEvent);
                        }.bind(this),

                        onDoFailed: function (response) {
                            this._moveAnnotationMarkerTo(annotation, originalPos, null, triggerEvent);
                            this._onError.bind(this);
                        }.bind(this),

                        onIdsFixedUp: function (ids) {
                            annotationGuid = ids.newId;
                            annotation = this.findAnnotation(annotationGuid);
                        }.bind(this),

                        onUndoFailed: this._onError.bind(this)
                    },
                    position,
                    oldPosition);

                this._undoRedo.executeAsync(moveCommand);
            }
        },

        createTextAnnotation: function (pageNumber, bounds, position, length, selectionCounter, rects) {
            var color = (typeof (this.highlightColor) === 'string' ? parseInt(this.highlightColor.replace('#', '0x')) : null);
            this.createAnnotation(Annotation.prototype.AnnotationType.Text, pageNumber, bounds, position, length, null, null, selectionCounter, { brushColor: color }, rects, null, null);
        },

        createAnnotation: function (type, pageNumber, bounds, position, length, markerFigure, svgPath, selectionCounter, drawingOptions, rects, fieldText, font) {
            if (!markerFigure)
                markerFigure = null;

            var box = { x: bounds.left(), y: bounds.top(), width: bounds.width(), height: bounds.height() };
            var offsets = this.getPageImageOffsets(type);

            var annotationTextBoxPosition = { x: this.pageWidth(), y: bounds.top() };
            var containerWidth = this.graphicsContainerElement.width();
            var textBoxWidth = 265;
            var margin = 10;
            var scrollbarWidth = 10;
            var scale = this.scale();
            var startingPoint;
            if (annotationTextBoxPosition.x * scale + textBoxWidth > containerWidth - scrollbarWidth) {
                annotationTextBoxPosition.x = (containerWidth - scrollbarWidth - textBoxWidth - offsets.offsetX) / scale;
                if (markerFigure) {
                    var boundingBox = markerFigure.getBBox(false);
                    var screenBounds = new jSaaspose.Rect(boundingBox.x, boundingBox.y, boundingBox.x + boundingBox.width, boundingBox.y + boundingBox.height);
                    var selectable = this.getSelectableInstance();
                    var startingPointRaphael = markerFigure.getPointAtLength(0);
                    startingPoint = new jSaaspose.Point(startingPointRaphael.x, startingPointRaphael.y);
                    var absoluteBounds = selectable.convertRectToAbsoluteCoordinates(screenBounds, startingPoint);
                    annotationTextBoxPosition.y = absoluteBounds.bottom() + margin / scale;
                }
                else {
                    annotationTextBoxPosition.y = box.y + box.height + margin;
                }
            }

            var self = this;
            var range = null;

            if (position != null && length != null) {
                range = { position: position, length: length };
            }

            if (rects && rects.length) {
                var points = [];
                var h = this.unscaledPageHeight;

                $.each(rects, function () {
                    points.push({ x: this.left(), y: h - this.top() });
                    points.push({ x: this.right(), y: h - this.top() });
                    points.push({ x: this.left(), y: h - this.bottom() });
                    points.push({ x: this.right(), y: h - this.bottom() });
                });

                svgPath = JSON.stringify(points);
            }


            var annotation = null,
                annotationGuid = '',
                data = {
                    guid: '',
                    type: type,
                    fieldText: fieldText,
                    pageNumber: pageNumber,
                    box: box,
                    annotationPosition: annotationTextBoxPosition,
                    range: range,
                    svgPath: svgPath,
                    drawingOptions: drawingOptions,
                    fontFamily: font ? font.family : null,
                    fontSize: font ? font.size : null
                },
                createCommand = new CreateAnnotationCommand(this._model, this.fileId, data, {
                    onDone: function (response) {
                        annotationGuid = response.data.annotationGuid;
                        annotation = new Annotation($.extend(data, {
                            guid: annotationGuid,
                            replies: [],
                            creatorGuid: this.userId,
                            access: Annotation.prototype.AnnotationAccess.Public,
                            startingPoint: startingPoint,
                            selectionCounter: selectionCounter
                        }));

                        this.updateAnnotationDisplayPosition(annotation);
                        this._onAnnotationCreated(annotation, markerFigure);

                        if (this.toolDeactivationMode == ToolDeactivationMode.Auto)
                            this.setHandToolMode();

                    }.bind(this),

                    onDoFailed: this._onError.bind(this),

                    onUndone: function (response) {
                        this._onAnnotationRemoved(annotation);

                        annotationGuid = '';
                        markerFigure = null;
                    }.bind(this),

                    onUndoFailed: this._onError.bind(this),

                    onIdsFixedUp: function (ids) {
                        annotationGuid = annotation.guid = ids.newId;
                        annotation = this.findAnnotation(annotationGuid);
                        markerFigure = null;
                    }.bind(this)
                });

            this._undoRedo.executeAsync(createCommand);
        },

        _onAnnotationCreated: function (annotation, markerFigure) {
            $('#comments_scroll_2').tinyscrollbar_update('relative');
            if (!annotation.commentsEnabled) {
                this.annotations.push(annotation);

                $(this).trigger('onAnnotationCreated', [annotation]);

                return;
            }

            annotation.addReply(this.userId, this.userName);

            this.annotations.push(annotation);
            this.preventIconsFromOverlapping();

            var color = annotation.backgroundColor();

            annotation.selectionCounter = this.selectTextInRect(
                annotation.bounds(),
                this.markerClickHandler.bind(this, annotation),
                annotation.pageNumber,
                annotation.selectionCounter,
                color && color !== undefined ? this.getRgbColorFromInteger(color) : null,
                { mouseenter: function () { this.hoveredAnnotation(annotation); }.bind(this), mouseleave: function () { this.hoveredAnnotation(null); }.bind(this) });

            this.createConnectingLineAndIcon(annotation);
            this.activeAnnotation(annotation);

            $(this).trigger('onAnnotationCreated', [annotation, markerFigure]);
            annotation.activeReply(0);
        },

        createClickHandler: function (markerElement, annotation) {
            $(markerElement).click(this.markerClickHandler.bind(this, annotation));
        },

        editAnnotationReply: function (annotationGuid, replyGuid, annotationMessage) {
            var annotation = this.findAnnotation(annotationGuid),
                reply = annotation.findReply(replyGuid),
                newText = reply.text(),
                oldText = annotation.activeReplyData.text(),
                editReplyCommand = new EditAnnotationReplyCommand(this._model, this.fileId, annotation, {
                    onDone: function (response) {
                        reply.text(newText);
                    }.bind(this),

                    onUndone: function (response) {
                        reply.text(oldText);
                    }.bind(this),

                    onDoFailed: function (response) {
                        reply.text(oldText);
                        this._onError.bind(this)
                    }.bind(this),

                    onUndoFailed: this._onError.bind(this)
                },
                reply,
                newText,
                oldText);

            this._undoRedo.executeAsync(editReplyCommand);
        },

        restoreAnnotationReplies: function (annotationGuid, replies) {
            this._model.restoreAnnotationReplies(this.fileId, annotationGuid, replies,
                function (response) {
                }.bind(this),
                this._onError.bind(this));
        },

        deleteAnnotationReply: function (annotationGuid, replyGuid) {
            var annotation = this.findAnnotation(annotationGuid),
                reply = annotation.findReply(replyGuid),
                replyDescendants = annotation.getReplyDescendants(replyGuid);
            deleteReplyCommand = new DeleteAnnotationReplyCommand(this._model, this.fileId, annotation, {
                onDone: function (response) {
                    this._onAnnotationReplyRemoved(response);
                }.bind(this),

                onUndone: function (response) {
                    this._onAnnotationReplyAdded(annotation, reply, true, true);

                    for (var i = 0; i < replyDescendants.length; i++)
                        this._onAnnotationReplyAdded(annotation, replyDescendants[i], true, true);
                }.bind(this),

                onIdsFixedUp: function (ids) {
                    if (replyGuid == ids.oldId) {
                        replyGuid = ids.newId;
                        reply = annotation.findReply(replyGuid);
                    }
                    else
                        if (annotationGuid == ids.oldId) {
                            annotationGuid = ids.newId;
                            annotation = this.findAnnotation(annotationGuid);
                        }
                        else
                            for (var i = 0; i < replyDescendants.length; i++) {
                                if (replyDescendants[i].guid() == ids.oldId)
                                    replyDescendants[i].guid(ids.newId);
                                else
                                    if (replyDescendants[i].parentReplyGuid() == ids.oldId)
                                        replyDescendants[i].parentReplyGuid(ids.newId);
                            }
                }.bind(this),

                onDoFailed: this._onError.bind(this),
                onUndoFailed: this._onError.bind(this)
            },
                reply);

            this._undoRedo.executeAsync(deleteReplyCommand);
        },

        _onAnnotationReplyRemoved: function (response) {
            var annotation = this.findAnnotation(response.data.annotationGuid);
            annotation.deleteAllReplies();

            annotation.sortReplies(response.data.replies, new Date(response.data.serverTime));
            if (annotation.replies().length == 0) {
                annotation.addReply(this.userId, this.userName);
                annotation.activeReply(0);
            }

            if (this.disconnectUncommented && annotation.replyCount() == 0) {
                annotation.removeConnectingLine();
            }
        },

        deleteReply: function (reply) {
            var annotation = this.activeAnnotation();
            var replies = annotation.replies();
            if (replies.length > 1 || (replies.length == 1 && replies[0].guid()))
                annotation.replies.remove(reply);
            if (replies.length == 1 && !replies[0].guid())
                reply.text("");

            if (this.disconnectUncommented && annotation.replyCount() == 0) {
                annotation.removeConnectingLine();
            }
        },

        addAnnotationReply: function (annotation, reply, keepFocusedReply) {
            if (annotation.guid && reply && reply.text().length) {
                var replyGuid = reply.guid() || '',
                    annotationGuid = annotation.guid,
                    addReplyCommand = new CreateAnnotationReplyCommand(this._model, this.fileId, annotation, {
                        onDone: function (response) {
                            reply.guid(response.data.replyGuid);
                            reply.repliedOn = response.data.repliedOn;

                            var redone = (replyGuid != null && replyGuid !== undefined && replyGuid.length > 0 && replyGuid != reply.guid());
                            replyGuid = reply.guid();

                            this._onAnnotationReplyAdded(annotation, reply, keepFocusedReply, redone);
                        }.bind(this),

                        onUndone: function (response) {
                            this._onAnnotationReplyRemoved(response);
                        }.bind(this),

                        onIdsFixedUp: function (ids) {
                            if (replyGuid == ids.oldId) {
                                replyGuid = ids.newId;
                                annotation.findReply(replyGuid);
                            }
                            else
                                if (annotationGuid == ids.oldId) {
                                    annotationGuid = ids.newId;
                                    annotation = this.findAnnotation(annotationGuid);
                                }
                        }.bind(this),

                        onDoFailed: this._onError.bind(this),
                        onUndoFailed: this._onError.bind(this)
                    },
                    reply);

                this._undoRedo.executeAsync(addReplyCommand);
            }
        },

        commitAnnotationReplyOnBlur: function (annotation, keepFocusedReply, reply) {
            if (this.saveReplyOnFocusLoss)
                return this.commitAnnotationReply(annotation, keepFocusedReply, reply);
        },

        commitAnnotationReply: function (annotation, keepFocusedReply, reply) {
            var activeReply = reply;
            if (!activeReply)
                activeReply = annotation.getActiveReply();

            if (activeReply) {
                annotation.deactivateActiveReply();

                if (activeReply.guid() && activeReply.guid().length) {
                    var text = jGroupdocs.html.toText(activeReply.text());
                    this.editAnnotationReply(annotation.guid, activeReply.guid(), text);
                }
                else {
                    this.addAnnotationReply(annotation, activeReply, keepFocusedReply);
                }
            }
        },

        activateAnnotationReply: function (annotation, replyInex) {
            var reply = annotation.getReplyAt(replyInex);
            if (reply && reply.userName == this.userName) {
                annotation.activeReply(replyInex);
            }
        },

        exportAnnotations: function () {
            this.exportingAnnotationsProgress.modal("show");
            this._model.exportAnnotations(this.fileId, 'Pdf', Annotation.prototype.AnnotationExportMode.Append,
                function (response) {
                    if (response.success) {
                        this._onExportJobScheduled(response.jobId);
                    }
                    else {
                        this.exportingAnnotationsProgress.modal("hide");
                        this._onError({ Reason: response.error });
                    }
                }.bind(this),
                function (error) {
                    this._onError(error);
                });
        },

        chooseImportFormat: function () {
            this.choosingImportFormat.modal("show");
        },

        importAnnotations: function (format) {
            this.importDocumentAnnotations(this.fileId, format);
        },

        importDocumentAnnotations: function (fileId, format) {
            if (this.choosingImportFormat)
                this.choosingImportFormat.modal("hide");

            if (this.importingAnnotationsProgress)
                this.importingAnnotationsProgress.modal("show");

            this._model.importAnnotations(fileId, format,
                function (response) {
                    if (response.success) {
                        this._onAnnotationsImported(response);
                    }
                    else {
                        this.importingAnnotationsProgress.modal("hide");
                        this._onError({ Reason: response.error });
                    }
                }.bind(this),
                function (error) {
                    this.importingAnnotationsProgress.modal("hide");
                    this._onError(error);
                }.bind(this));
        },

        _onAnnotationsImported: function (response) {
            this.importingAnnotationsProgress.modal("hide");
        },

        getPdfVersionOfDocument: function () {
            this.exportingAnnotationsProgress.modal("show");
            this._model.getPdfVersionOfDocument(this.fileId,
                function (response) {
                    if (response.success) {
                        if (!response.original) {
                            this._onExportJobScheduled(response.jobId);
                        } else {
                            this.exportingAnnotationsProgress.modal("hide");
                            window.location.href = response.original;
                        }
                    }
                    else {
                        this.exportingAnnotationsProgress.modal("hide");
                        this._onError({ Reason: response.error });
                    }
                }.bind(this),
                function (error) {
                    this._onError(error);
                });
        },

        setAnnotationMode: function (mode) {
            var selectable = this.getSelectable();
            if (selectable != null) {
                selectable.dvselectable("setMode", mode);
                selectable.dvselectable("setTextSelectionMode", this.textSelectionByCharModeEnabled);
            }
        },

        setTextAnnotationMode: function () {
            this.setAnnotationMode($.ui.dvselectable.prototype.SelectionModes.SelectText);
            this.annotationModeObservable(Annotation.prototype.AnnotationType.Text);
        },

        setAreaAnnotationMode: function () {
            this.setAnnotationMode($.ui.dvselectable.prototype.SelectionModes.SelectRectangle);
            this.annotationModeObservable(Annotation.prototype.AnnotationType.Area);
        },

        setPointAnnotationMode: function () {
            this.setAnnotationMode($.ui.dvselectable.prototype.SelectionModes.ClickPoint);
            this.annotationModeObservable(Annotation.prototype.AnnotationType.Point);
        },

        setStrikeoutTextMode: function () {
            this.setAnnotationMode($.ui.dvselectable.prototype.SelectionModes.SelectTextToStrikeout);
            this.annotationModeObservable(Annotation.prototype.AnnotationType.TextStrikeout);
        },

        setPolylineAnnotationMode: function () {
            this.setAnnotationMode($.ui.dvselectable.prototype.SelectionModes.TrackMouseMovement);
            this.annotationModeObservable(Annotation.prototype.AnnotationType.Polyline);
        },

        setTextFieldAnnotationMode: function () {
            this.setAnnotationMode($.ui.dvselectable.prototype.SelectionModes.SelectRectangle);
            this.annotationModeObservable(Annotation.prototype.AnnotationType.TextField);
        },

        setWatermarkAnnotationMode: function () {
            this.setAnnotationMode($.ui.dvselectable.prototype.SelectionModes.SelectRectangle);
            this.annotationModeObservable(Annotation.prototype.AnnotationType.Watermark);
        },

        setHandToolMode: function () {
            this.setAnnotationMode(this.textSelectionEnabled === true ?
                $.ui.dvselectable.prototype.SelectionModes.SelectText : $.ui.dvselectable.prototype.SelectionModes.DoNothing);
            this.annotationModeObservable(null);
        },

        // annotation broadcast handlers

        addAnnotationFromAnotherUser: function (data) {
            var annotation = new Annotation({
                pageNumber: data.pageNumber,
                box: data.box,
                annotationPosition: data.annotationPosition,
                documentGuid: this.fileId,
                guid: data.annotationGuid,
                replies: [],
                type: data.annotationType,
                svgPath: data.svgPath,
                creatorGuid: data.userGuid,
                access: data.access,
                penColor: (data.drawingOptions ? data.drawingOptions.penColor : null),
                penWidth: (data.drawingOptions ? data.drawingOptions.penWidth : null),
                penStyle: (data.drawingOptions ? data.drawingOptions.penStyle : null),
                backgroundColor: (data.drawingOptions ? data.drawingOptions.brushColor : null),
                fontSize: (data.font ? data.font.size : null),
                fontFamily: (data.font ? data.font.family : null)
            }, new Date(data.serverTime));

            this.updateAnnotationDisplayPosition(annotation);
            this.annotations.push(annotation);

            if (annotation.commentsEnabled) {
                annotation.addReply(this.userId, this.userName);
                this.preventIconsFromOverlapping();

                if (annotation.type == Annotation.prototype.AnnotationType.Text ||
                    annotation.type == Annotation.prototype.AnnotationType.TextReplacement) {

                    this.selectTextForAnnotation(annotation);
                }

                this.createConnectingLineAndIcon(annotation);
            }

            return annotation;
        },

        findAnnotation: function (guid) {
            var annotation = null;
            for (var i = 0; i < this.annotations().length; i++) {
                if (this.annotations()[i].guid == guid) {
                    annotation = this.annotations()[i];
                    break;
                }
            }
            return annotation;
        },

        _indexOfAnnotation: function (guid) {
            for (var i = 0; i < this.annotations().length; i++) {
                if (this.annotations()[i].guid == guid) {
                    return i;
                }
            }

            return -1;
        },

        _getAnnotationAt: function (index) {
            return (index >= 0 && index < this.annotations().length ? this.annotations()[index] : null);
        },

        addAnnotationReplyFromAnotherUser: function (rawReply) {
            var annotation = this.findAnnotation(rawReply.annotationGuid);
            var reply = annotation.addReplyFromAnotherUser(rawReply);

            if (annotation.replyCount() == 1) {
                this.createConnectingLineAndIcon(annotation);
            }
        },

        editAnnotationReplyOnClient: function (annotationGuid, replyGuid, message) {
            this.findAnnotation(annotationGuid).updateReply(replyGuid, message);
        },

        deleteAnnotationReplyOnClient: function (annotationGuid, replyGuid, replies) {
            var annotation = this.findAnnotation(annotationGuid);
            annotation.deleteAllReplies();
            annotation.sortReplies(replies);
            if (annotation.replies().length == 0)
                annotation.addReply(this.userId, this.userName);

            if (this.disconnectUncommented && annotation.replyCount() == 0) {
                annotation.removeConnectingLine();
            }
        },

        clearAllAnnotationOnClient: function () {
            while (this.annotations().length > 0) {
                var annotation = this.annotations()[0];
                this.deleteAnnotationOnClient(annotation.guid);
            }
        },

        deleteAnnotationOnClient: function (annotationGuid) {
            for (var i = 0; i < this.annotations().length; i++) {
                var annotation = this.annotations()[i];
                if (annotation.guid == annotationGuid) {
                    if (this.activeAnnotation() == annotation)
                        this.activeAnnotation(null);
                    this.deselectTextInRect(annotation.bounds(), true, annotation.pageNumber, annotation.selectionCounter);
                    annotation.removeConnectingLine();
                    this.annotations.splice(i, 1);
                    break;
                }
            }
        },

        setAnnotationAccessOnClient: function (annotationGuid, annotationAccess, annotation) {
            var screenAnnotation = this.findAnnotation(annotationGuid);
            if (screenAnnotation != null && screenAnnotation.creatorGuid == this.userId) {
                screenAnnotation.annotationIsPublic(annotationAccess == Annotation.prototype.AnnotationAccess.Public);
            }
            else {
                if (annotationAccess == Annotation.prototype.AnnotationAccess.Private) {
                    if (screenAnnotation != null)
                        this.deleteAnnotationOnClient(annotationGuid);
                }
                else if (annotationAccess == Annotation.prototype.AnnotationAccess.Public) {
                    this._onAnnotationsReceived({ annotations: [annotation] }, true);
                }
            }
        },

        _onAnnotationsReceived: function (response, appendOnly) {
            var list = [];
            var selectable = this.getSelectableInstance();
            var pages = selectable.getPages(),
                pageCount = (pages ? pages.length : 0);

            if (response.annotations) {
                for (var i = 0; i < response.annotations.length; i++) {
                    if (response.annotations[i].pageNumber >= pageCount) {
                        continue;
                    }

                    var annotation = new Annotation(response.annotations[i], new Date(response.serverTime));
                    this._onAnnotationReceived(annotation);
                    list.push(annotation);
                }
            }

            if (appendOnly) {
                list = this.annotations().concat(list);
            }
            else {
                this._clearAnnotations();
            }

            this.annotations(list);
            this.preventIconsFromOverlapping();

            $(this).trigger('onAnnotationsReceived', [list]);
        },

        _onAnnotationReceived: function (annotation) {
            this.updateAnnotationDisplayPosition(annotation);

            if (annotation.commentsEnabled) {

                if (annotation.replies().length == 0) {
                    annotation.addReply(this.userId, this.userName);
                    annotation.setActiveReplyIndex(0);
                }
                else
                    annotation.setActiveReplyIndex(-1);

                if (annotation.type == Annotation.prototype.AnnotationType.Text || annotation.type == Annotation.prototype.AnnotationType.TextReplacement) {
                    this.selectTextForAnnotation(annotation);
                }

                this.createConnectingLineAndIcon(annotation);
            }

            $(this).trigger('onAnnotationReceived', [annotation]);
        },

        _addAnnotation: function (annotation) {
            this._onAnnotationReceived(annotation);
            this.annotations.push(annotation);

            this.preventIconsFromOverlapping();
            $(this).trigger('onAnnotationsReceived', [annotation]);
        },

        _clearAnnotations: function () {
            var annotations = this.annotations();
            for (var j = 0; j < annotations.length; j++) {
                annotations[j].removeConnectingLine();
                $(this).trigger('onAnnotationRemoved', [annotations[j]]);
            }

            this.activeAnnotation(null);
            this.annotations.removeAll();

            this._undoRedo.clear();
        },

        markerClickHandler: function (annotation) {
            if ((this.anyToolSelection === true || this.annotationModeObservable() == null) && !this.draggedMarker) {
                this.activeAnnotation(annotation);
            }
            this.draggedMarker = false;
        },

        _onAnnotationReplyAdded: function (annotation, reply, keepFocusedReply, redone) {
            var replyCount = annotation.replyCount();

            if (replyCount == 0)
                annotation.deleteAllReplies();

            if (redone)
                annotation.pushReply(reply);

            if (replyCount == 1 || (redone && replyCount == 0)) {
                if (!redone)
                    annotation.comments.push(reply);

                this.createConnectingLineAndIcon(annotation);
            }

            $(this).trigger('onAnnotationReplyAdded', [annotation, reply]);
        },

        _onExportJobScheduled: function (jobId) {
            this._model.getJobOutDoc(jobId,
                function (doc) {
                    if (doc) {
                        this.exportingAnnotationsProgress.modal("hide");

                        if (doc.error) {
                            jerror('Sorry, the conversion is failed. A notification has been sent to the GroupDocs Support Team.');
                        }
                        else {
                            window.location.href = doc.url;
                        }
                    }
                    else {
                        window.setTimeout(function () {
                            this._onExportJobScheduled(jobId);
                        }.bind(this), 2000);
                    }
                }.bind(this),
                function (node, error) {
                    this.inprogress(false);
                    jerror();
                });
        },

        selectTextForAnnotation: function (annotation) {
            var selectable = this.getSelectable();
            var selectionMode = selectable.dvselectable("getMode");
            var color = annotation.backgroundColor();
            selectable.dvselectable("setMode", $.ui.dvselectable.prototype.SelectionModes.SelectText, true);

            annotation.selectionCounter = this.selectTextInRect(
                annotation.bounds(), this.markerClickHandler.bind(this, annotation), annotation.pageNumber, undefined, color && color !== undefined ? this.getRgbColorFromInteger(color) : null,
                { mouseenter: function () { this.hoveredAnnotation(annotation); }.bind(this), mouseleave: function () { this.hoveredAnnotation(null); }.bind(this) });
            selectable.dvselectable("setMode", selectionMode);
        },

        getPageImageOffsets: function (annotationType) {
            var offsets = { offsetX: 0, offsetY: 0 };

            if (annotationType != Annotation.prototype.AnnotationType.TextStrikeout &&
                annotationType != Annotation.prototype.AnnotationType.TextField &&
                annotationType != Annotation.prototype.AnnotationType.Watermark &&
                annotationType != Annotation.prototype.AnnotationType.TextRemoval &&
                annotationType != Annotation.prototype.AnnotationType.TextRedaction &&
                annotationType != Annotation.prototype.AnnotationType.TextUnderline) {

                offsets.offsetX = this.getPageImageHorizontalOffset();
                offsets.offsetY = this.getPageImageVerticalOffset();
            }

            return offsets;
        },

        getPageImageHorizontalOffset: function () {
            var leftImageMargin = 34;
            return leftImageMargin;
        },

        getPageImageVerticalOffset: function () {
            var pagePadding = 6;
            return pagePadding;
        },

        moveAnnotationOnClient: function (annotationGuid, position) {
            var annotation = this.findAnnotation(annotationGuid);
            if (annotation != null) {
                annotation.annotationPosition(new jSaaspose.Point(position.x, position.y));
                this.createConnectingLineAndIcon(annotation, false);
            }
        },

        moveAnnotationMarkerOnClient: function (annotationGuid, position, pageNumber) {
            var annotation = this.findAnnotation(annotationGuid);
            var annotationBounds;
            if (annotation != null) {
                annotationBounds = annotation.bounds().clone();
                this._moveAnnotationMarkerTo(annotation, position, pageNumber, false);
            }

            $(this).trigger('onAnnotationMarkerMovedOnClient', [annotationGuid, position, pageNumber, annotationBounds]);
        },

        _moveAnnotationMarkerTo: function (annotation, position, pageNumber, triggerEvent, responseData) {
            var annotationBounds = annotation.bounds().clone();
            annotation.bounds(new jSaaspose.Rect(position.x, position.y,
                                  position.x + annotationBounds.width(), position.y + annotationBounds.height()));

            if (pageNumber)
                annotation.pageNumber = pageNumber;

            this.updateAnnotationDisplayPosition(annotation);
            this.preventIconsFromOverlapping();
            this.createConnectingLineAndIcon(annotation);

            if (triggerEvent == true)
                $(this).trigger('onAnnotationMarkerMovedOnClient', [annotation.guid, position, (pageNumber || annotation.pageNumber), annotationBounds]);
        },

        createConnectingLineAndIcon: function (annotation, createIcon, beforeSwitchingPanels) {
            if ((this.disconnectUncommented == false || annotation.replyCount()) && annotation.commentsEnabled) {
                this.createConnectingLine(annotation, beforeSwitchingPanels);

                if (createIcon) {
                    this.createRightSideIcon(annotation);
                }
            }
        },

        createConnectingLine: function (annotation, beforeSwitchingPanels) {
            var iconWidth = iconHeight = this.iconHeight,
                visiblePanel = this.rightSideElement.children(beforeSwitchingPanels ? ":hidden" : ":visible"),
                rightOffset = visiblePanel.width();

            var result = this.getAnnotationSideIconCoordinates(annotation);
            var iconLeft = Math.round(this.pageLeft() + this.getAnnotationSideIconLeft());
            var rightEdge = Math.max(annotation.displayBounds().left(), annotation.displayBounds().right());

            annotation.createConnectingLine(this.getCanvas(),
                Math.round(rightEdge + (annotation.penWidth || 2) / 2), result.iconMiddle,
                iconLeft, Math.round(annotation.annotationSideIconDisplayPosition().y + iconHeight / 2),
                iconWidth,
                this.documentSpace.outerWidth() - rightOffset);

            if (this.activeAnnotation() == annotation) {
                annotation.setLineColorToActive();
            }
        },

        redrawConnectingLines: function (beforeSwitchingPanels) {
            for (var i = 0; i < this.annotations().length; i++) {
                this.createConnectingLineAndIcon(this.annotations()[i], false, beforeSwitchingPanels);
            }
        },

        createRightSideIcon: function (annotation) {
            var result = this.getAnnotationSideIconCoordinates(annotation);
            annotation.annotationOriginalTextBoxDisplayPosition(new jSaaspose.Point(this.getAnnotationSideIconLeft(), result.iconTop));
        },

        getAnnotationSideIconCoordinates: function (annotation) {
            var iconTop, iconMiddle;
            var iconHeight = this.iconHeight;
            var bounds = annotation.displayBounds();

            if (this.connectorPosition == Annotation.prototype.ConnectorPosition.Middle &&
                (annotation.type == Annotation.prototype.AnnotationType.Text ||
                 annotation.type == Annotation.prototype.AnnotationType.TextReplacement)) {

                var selectable = this.getSelectableInstance();
                var rect = null;
                var minTop = null, maxBottom = null;
                var rects = selectable.getRowsFromRect(bounds);

                for (var i = 0; i < rects.length; i++) {
                    rect = rects[i].bounds;
                    if (minTop == null || rect.top() < minTop)
                        minTop = rect.top();
                    if (maxBottom == null || rect.bottom() > maxBottom)
                        maxBottom = rect.bottom();
                }

                var annotationMarkerHeight = maxBottom - minTop;
                iconTop = Math.round(minTop - (iconHeight - annotationMarkerHeight) / 2);
                iconMiddle = Math.round(minTop + annotationMarkerHeight / 2);
            }
            else
                if (this.connectorPosition == Annotation.prototype.ConnectorPosition.Middle) {
                    iconTop = Math.round(bounds.top() - (iconHeight - bounds.height()) / 2);
                    iconMiddle = Math.round(bounds.top() + bounds.height() / 2);
                }
                else {
                    var offset = (annotation.type == Annotation.prototype.AnnotationType.Point ? 14 : (annotation.penWidth || 1) / 2 - 1);
                    var bottom = Math.max(bounds.top(), bounds.bottom());
                    iconTop = Math.round(bottom - iconHeight / 2 + offset);
                    iconMiddle = Math.round(bottom + offset);
                }

            return { iconTop: iconTop, iconMiddle: iconMiddle };
        },

        getAnnotationSideIconLeft: function () {
            var iconWidth = this.iconHeight;
            return Math.round(this.pageWidth() + this.imageHorizontalMargin - iconWidth);
            //return this.pageWidth();
        },

        setupRemoveAnnotationMenu: function (contextMenu) {
            $("html").click(function () {
                contextMenu.remove();
                return false;
            });
        },

        setZoom: function (value) {
            var activeAnnot = this.activeAnnotation();
            this.activeAnnotation(null);

            this.redrawScreenWhenZooming(value);

            if (this.fullSynchronization && this.isZoomBroadcastEnabled && this.isMasterOfBroadcast) {
                this.broadcastDocumentScale();
                //                this._model.broadcastDocumentScale(this.fileId, this.pageWidth(), //value,
                //                    function (response) {
                //                    } .bind(this),
                //                    function (error) {
                //                        this._onError(error);
                //                    } .bind(this));
            }
            this.activeAnnotation(activeAnnot);
        },

        broadcastDocumentScale: function () {
            //var windowPercentage = this.pageWidth() / (window.innerWidth - this.imageHorizontalMargin * 2) * 100;
            //var windowPercentage = this.pageHeight() / this.documentSpace.height() * 100;
            var windowPercentage = this.pageHeight() / this.documentSpace[0].clientHeight * 100;
            $.connection.annotationHub.server.broadcastDocumentScale(this.userId, this.userKey, this.fileId, windowPercentage);
        },

        redrawScreenWhenZooming: function (value) {
            docViewerViewModel.prototype.setZoom.call(this, value, true);
            this.redrawWorkingArea();
        },

        resizePagesToWindowSize: function () {
            if (this.embeddedAnnotation && this.fullSynchronization && this.isMasterOfBroadcast) {
                var pageWidth = this.getImageWidthWithoutRightPanel();
                if (pageWidth != this.initialWidth) {
                    var currentZoom = this.zoom();
                    this.initialWidth = pageWidth;
                    this.pageImageWidth = pageWidth;
                    //var zoom = pageImageWidth / this.initialWidth * 100.0;
                    docViewerViewModel.prototype.setZoom.call(this, currentZoom, true);
                    //this.setZoom(zoom);
                    //var selectable = this.getSelectable().data("dvselectable");
                    //selectable.options.pageHeight = this.pageHeight();
                }
            }
        },

        redrawWorkingArea: function () {
            this.reInitSelectable();
            this.recalculatePageLeft();

            var annotationCount = this.annotations().length;
            for (var i = 0; i < annotationCount; i++) {
                var annotation = this.annotations()[i];

                this.updateAnnotationDisplayPosition(annotation);
                this.createConnectingLineAndIcon(annotation);
            }

            this.preventIconsFromOverlapping();
            $(this).trigger('onSetZoom', [this.zoom()]);
        },

        setDocumentScaleOnClient: function (windowPercentage) {
            //var windowPercentage = this.pageWidth() / window.innerWidth;
            //var width = windowPercentage / 100 * (window.innerWidth - this.imageHorizontalMargin * 2);
            //var height = windowPercentage / 100 * this.documentSpace.height();
            var height = windowPercentage / 100 * this.documentSpace[0].clientHeight;
            var zoom = height / (this.pageImageWidth * this.heightWidthRatio) * 100;
            //var zoom = width / this.pageImageWidth * 100;
            this.redrawScreenWhenZooming(zoom);
        },

        setDocumentScrollOnClient: function (horizontalScrollPosition, verticalScrollPosition, scale) {
            this.setDocumentScrollCalled = true;
            this.synchronizeDocumentScroll(horizontalScrollPosition, verticalScrollPosition, scale);
        },

        synchronizeDocumentScroll: function (horizontalScrollPortion, scrollTop, scale) {
            var documentSpace = this.documentSpace[0];
            var firstPageTop = parseInt(this._firstPage.css("padding-top"));
            var pagePadding = firstPageTop;
            var maxScrollLeft = documentSpace.scrollWidth - documentSpace.clientWidth;

            //var theirPageWidth = this.pageWidth() / this.scale() * scale + 2 * this.imageHorizontalMargin;
            //var horizontalScrollPortion = scrollLeft / theirPageWidth;
            //var horizontalScrollPosition = scrollLeft / scale * this.scale();
            //var horizontalScrollPosition = (this.pageWidth() + 2 * this.imageHorizontalMargin) * horizontalScrollPortion;
            //var pagePosition = this._firstPage.outerHeight(true) * pageNumber;
            var imageMargin = this.getImageMargin();
            var pageHeightInSenderScale = this.pageHeight() / this.scale() * scale;
            var pageNumber = Math.floor(scrollTop / (pageHeightInSenderScale + imageMargin));
            var ourTop = (scrollTop - pagePadding - pageNumber * imageMargin) / scale * this.scale() + pagePadding + pageNumber * imageMargin;

            this.documentSpace[0].scrollLeft = maxScrollLeft * horizontalScrollPortion;
            this.documentSpace[0].scrollTop = ourTop;
        },

        ScrollDocViewEnd: function (item, e) {
            docViewerViewModel.prototype.ScrollDocViewEnd.call(this, item, e);

            if (!this.setDocumentScrollCalled) {
                this.broadcastDocumentScroll();
            }
            this.setDocumentScrollCalled = false;
        },

        broadcastDocumentScroll: function () {
            if (this.fullSynchronization && this.isScrollBroadcastEnabled && this.isMasterOfBroadcast) {
                var horizontalScrollPosition = this.scrollPosition[0];
                var verticalScrollPosition = this.scrollPosition[1];
                var scale = this.scale();

                var documentSpace = this.documentSpace[0];
                var maxScrollLeft = documentSpace.scrollWidth - documentSpace.clientWidth;
                var horizontalScrollPortion;
                if (maxScrollLeft == 0)
                    horizontalScrollPortion = 0;
                else
                    horizontalScrollPortion = horizontalScrollPosition / maxScrollLeft;
                $.connection.annotationHub.server.broadcastDocumentScroll(this.userId, this.userKey, this.fileId,
                                                                              horizontalScrollPortion, verticalScrollPosition, scale);
                //                this._model.broadcastDocumentScroll(this.fileId, scrollPosition,
                //                    function (response) {
                //                    } .bind(this),
                //                    function (error) {
                //                        this._onError(error);
                //                    } .bind(this));
            }
        },

        broadcastMouseCursorPosition: function (left, top) {
            if (this.fullSynchronization && this.isMasterOfBroadcast) {
                var scale = this.scale();
                var scrollTop = this.documentSpace[0].scrollTop;
                var documentSpaceTop = this.documentSpace.offset().top;
                var documentPageLeft = this._firstPage.find(".page-image").offset().left - this._firstPage.parent().offset().left;

                $.connection.annotationHub.server.broadcastMouseCursorPosition(this.userId, this.userKey, this.fileId,
                                                                               left - documentPageLeft, top - documentSpaceTop, scale, scrollTop);
                //this._model.broadcastMouseCursorPosition(this.fileId, left, top,
                //    function (response) {
                //    } .bind(this),
                //    function (error) {
                //        this._onError(error);
                //    } .bind(this));
            }
        },

        setMousePositionOnClient: function (left, top, scale, scrollTop) {
            var pointer = $('#cursor_hand');
            var documentSpaceTop = this.documentSpace.offset().top;
            //var firstPageTop = this._firstPage.offset().top;
            var firstPageTop = parseInt(this._firstPage.css("padding-top"));
            //var pagePadding = firstPageTop + documentSpaceTop;
            var pagePadding = firstPageTop;
            var ourLeft = left, ourTop = top;
            //if (left - this.imageHorizontalMargin > 0) {
            //ourLeft = (left - this.imageHorizontalMargin) / scale * this.scale() + this.imageHorizontalMargin;
            ourLeft = left / scale * this.scale();
            var imageMargin = this.getImageMargin();

            var pageHeightInSenderScale = this.pageHeight() / this.scale() * scale;
            var pageNumber = Math.floor((scrollTop + top) / (pageHeightInSenderScale + imageMargin));
            ourTop = (top - pagePadding - pageNumber * imageMargin) / scale * this.scale() + pagePadding + pageNumber * imageMargin;
            //}
            ourLeft += this.horizontalCursorPointShift;
            ourLeft += this._firstPage.find(".page-image").offset().left - this._firstPage.parent().offset().left;
            //var scrollTopInOurScale = scrollTop / scale * this.scale();
            //ourTop += documentSpaceTop + (scrollTop - pageNumber * imagePadding) / scale * this.scale() - this.documentSpace[0].scrollTop + pageNumber * imagePadding;
            ourTop += documentSpaceTop;
            var ourScrollTop = this.documentSpace[0].scrollTop;
            ourTop += scrollTop / scale * this.scale() - ourScrollTop;
            ourTop += this.verticalCursorPointShift;
            pointer.css({ left: ourLeft, top: ourTop });
        },

        getImageMargin: function () {
            var imageMargin = this._firstPage.outerHeight(true) - this._firstPage.find(".page-image").height();
            return imageMargin;
        },

        updateAnnotationDisplayPosition: function (annotation) {
            var bounds = annotation.boundingBox();

            if (bounds != annotation.bounds()) {
                bounds.topLeft.y = this.unscaledPageHeight - bounds.topLeft.y;
                bounds.bottomRight.y = this.unscaledPageHeight - bounds.bottomRight.y;
            }

            bounds = (this.storeAnnotationCoordinatesRelativeToPages ?
                this.convertPageAndRectToScreenCoordinates(annotation.pageNumber, bounds) :
                this.convertRectToScreenCoordinates(bounds));
            annotation.displayBounds(bounds.round());

            var result = this.getAnnotationSideIconCoordinates(annotation);
            annotation.annotationOriginalTextBoxDisplayPosition(new jSaaspose.Point(this.getAnnotationSideIconLeft(), result.iconTop));
        },

        convertPointToAbsoluteCoordinates: function (point, pointToFindPageFor) {
            var scale = this.scale();
            var left = point.x;
            var top = point.y;

            var selectable = this.getSelectableInstance();
            var page = selectable.findPageAtVerticalPosition(pointToFindPageFor.y);
            if (page == null)
                return null;
            left -= page.rect.left();
            top -= page.rect.top();
            var pageOffset;

            var pageNumber = parseInt(page.pageId) - 1;
            pageOffset = pageNumber * this.getPageHeight();
            pageOffset /= scale;
            left /= scale;
            top /= scale;
            var position = new jSaaspose.Point(left, top + pageOffset);
            return position;
        },

        convertPointToRelativeToPageUnscaledCoordinates: function (point, pointToFindPageFor) {
            var scale = this.scale();
            var left = point.x;
            var top = point.y;

            var selectable = this.getSelectableInstance();
            var page = selectable.findPageAtVerticalPosition(pointToFindPageFor.y);
            if (page == null) {
                return null;
            }
            left -= page.rect.left();
            top -= page.rect.top();
            left /= scale;
            top /= scale;
            var position = new jSaaspose.Point(left, top);
            return position;
        },

        convertRectToScreenCoordinates: function (rect) {
            var selectable = this.getSelectableInstance();
            return selectable.convertRectToScreenCoordinates(rect);
        },

        convertPageAndRectToScreenCoordinates: function (pageNumber, rect) {
            var selectable = this.getSelectableInstance();
            return selectable.convertPageAndRectToScreenCoordinates(pageNumber, rect);
        },

        annotationIsPublicChangedHandler: function (annotation) {
            if (annotation.guid != null) {
                annotation.access = annotation.annotationIsPublic() ? 0 : 1;
                this._model.setAnnotationAccess(this.fileId, annotation.guid, annotation.access,
                function (response) {
                }.bind(this),
                function (error) {
                    this._onError(error);
                }.bind(this));
            }

            return true;
        },

        replyOnEnter: function (annotation, event) {
            var keyCode = (event.which ? event.which : event.keyCode);
            if (keyCode === 13) { // Enter
                this.commitAnnotationReply(annotation);
                return false;
            }
            return true;
        },

        focusOutHandler: function (annotation, reply, e) {
            var target = (e && e.target) || (e && e.srcElement);
            if (!$(target).is('.annotationButton'))
                if (annotation.activeReply() == reply.index)
                    this.commitAnnotationReply(annotation, true);
            return true;
        },

        saveReplyIfClickedOnAnotherReply: function (clickedAnnotation, clickedReply, event) {
            if (this.activeAnnotation() != null && (this.activeAnnotation() != clickedAnnotation || clickedAnnotation.activeReply() != clickedReply.index))
                this.commitAnnotationReply(this.activeAnnotation(), true);
            this.activeAnnotation(clickedAnnotation);
            this.activateAnnotationReply(clickedAnnotation, clickedReply.index);
        },

        getDocumentCollaborators: function (fileId) {
            if ((fileId || this.fileId) && !this.anonymousAnnotation) {
                var response = this._model.getDocumentCollaborators(fileId || this.fileId);
                if (response.error) {
                    jerror(response.error.Reason);
                }

                var owner = response.data.owner;
                this.createReviewersFromResponse(response);
                this.currentUserIsDocumentOwner(owner != null && owner.guid == this.userId);

                if (response.data.shared_link_access_rights) {
                    this._setAccessRights(response.data.shared_link_access_rights || -1);
                }
                else
                    if (owner)
                        this._setAccessRights(owner.access_rights || -1);
            }
        },

        _resetAccessRights: function () {
        },

        _setAccessRights: function (access) {
            var canRedact = ((access & 32) > 0),
                canDelete = ((access & 16) > 0),
                canExport = ((access & 8) > 0),
                canDownload = ((access & 4) > 0),
                canAnnotate = ((access & 2) > 0),
                canView = ((access & 1) > 0);

            this.canRedact(canRedact);
            this.canDelete(canDelete);
            this.canExport(canExport);
            this.canDownload(canDownload);
            this.canAnnotate(canAnnotate);
            this.canView(canView);
        },

        setDocumentCollaborators: function (setReviewerContacts, newCollaborator) {
            if (newCollaborator)
                this.newCollaborator(newCollaborator);
            if (this.newCollaborator() != "") {
                this.busyAddingReviewer(true);

                var serverCollaborators = [];
                var i, j;
                var collaborator;
                for (i = 0; i < this._collaborators().length; i++) {
                    collaborator = this._collaborators()[i];
                    serverCollaborators.push(collaborator.emailAddress);
                }

                serverCollaborators.push(this.newCollaborator());

                if (setReviewerContacts) {
                    this.newReviewerContactEmail(this.newCollaborator());
                    this.setReviewerContacts();
                }

                this._model.setDocumentCollaborators(this.fileId, serverCollaborators,
                    function (response) {
                        this.busyAddingReviewer(false);

                        this.newCollaborator("");
                        this.createReviewersFromResponse(response);
                        this.invited(true);
                    }.bind(this),
                    function (error) {
                        this.busyAddingReviewer(false);
                        this.invited(false);
                        jerror(error);
                    }.bind(this)
                );
            }
        },

        addDocumentReviewer: function () {
            if (this.newCollaborator() != "") {
                this.busyAddingReviewer(true);

                this._model.addDocumentReviewer(this.fileId,
                                                this.newCollaborator(),
                                                this.newCollaboratorFirstName(),
                                                this.newCollaboratorLastName(),
                                                this.reviewerInvitationMessage(),
                    function (response) {
                        this.newReviewerContactEmail(this.newCollaborator());
                        this.newReviewerContactFirstName("");
                        this.newReviewerContactLastName("");
                        this.setReviewerContacts();
                        this.busyAddingReviewer(false);

                        this.newCollaborator("");
                        this.createReviewersFromResponse(response);
                        this.invited(true);
                    }.bind(this),
                    function (error) {
                        this.busyAddingReviewer(false);
                        this.invited(false);
                        jerror(error);
                    }.bind(this)
                );
            }
        },

        deleteDocumentReviewer: function (reviewer) {
            this.busyDeletingReviewer(true);

            this._model.deleteDocumentReviewer(this.fileId, reviewer.id,
                function (response) {
                    this.busyDeletingReviewer(false);
                    this._collaborators.remove(reviewer);
                    //this.createReviewersFromResponse(response);
                }.bind(this),
                function (error) {
                    this.busyDeletingReviewer(false);
                    jerror(error);
                }.bind(this)
            );
        },

        createReviewersFromResponse: function (response) {
            var newItems = [];
            var owner = response.data.owner;
            var ownerIsSet = false;
            var canAnnotate, canDownload, canView, canExport, canDelete, canRedact;
            var access;
            var emailAddress, displayName;
            var ownerSuffix = " (Owner)";
            var viewModel = this;
            var isOwner;
            $.each(response.data.collaborators, function (index, value) {
                access = value.access_rights;
                emailAddress = value.primary_email;
                if (value.firstName != null && value.lastName != null && value.firstName != "" && value.lastName != "")
                    displayName = value.firstName + " " + value.lastName;
                else
                    displayName = value.primary_email;
                if (owner && emailAddress == owner.primary_email) {
                    ownerIsSet = true;
                    canAnnotate = canDownload = canView = canExport = canDelete = canRedact = alwaysTrue;
                    displayName += ownerSuffix;
                    isOwner = true;
                }
                else {
                    canRedact = ko.observable((access & 32) > 0);
                    canDelete = ko.observable((access & 16) > 0);
                    canExport = ko.observable((access & 8) > 0);
                    canDownload = ko.observable((access & 4) > 0);
                    canAnnotate = ko.observable((access & 2) > 0);
                    canView = ko.observable((access & 1) > 0);
                    isOwner = false;
                }

                if (value.guid == viewModel.userId) {
                    viewModel._setAccessRights(access > 0 ? access : -1);
                }

                var reviewer = {
                    emailAddress: emailAddress,
                    displayName: displayName,
                    color: ko.observable((value.color == null ? viewModel.getDefaultColor() : value.color)),
                    id: value.id,
                    guid: value.guid,
                    canAnnotate: canAnnotate,
                    canDownload: canDownload,
                    canView: canView,
                    canExport: canExport,
                    canDelete: canDelete,
                    canRedact: canRedact,
                    isOwner: isOwner,
                    avatar: value.avatar,
                    avatarUrl: (viewModel.baseAvatarUrl + value.guid)
                };

                if (isOwner)
                    newItems.splice(0, 0, reviewer);
                else
                    newItems.push(reviewer);
            });

            function alwaysTrue() { return true; }

            if (!ownerIsSet && owner) {
                if (owner.firstName != null && owner.lastName != null && owner.firstName != "" && owner.lastName != "")
                    displayName = owner.firstName + " " + owner.lastName;
                else
                    displayName = owner.primary_email;
                newItems.splice(0, 0, {
                    emailAddress: owner.primary_email,
                    displayName: displayName + ownerSuffix,
                    color: ko.observable((owner.color == null ? viewModel.getDefaultColor() : owner.color)),
                    id: null,
                    guid: owner.guid,
                    canAnnotate: alwaysTrue,
                    canDownload: alwaysTrue,
                    canView: alwaysTrue,
                    canExport: alwaysTrue,
                    canDelete: alwaysTrue,
                    canRedact: alwaysTrue,
                    isOwner: true,
                    avatarUrl: (viewModel.baseAvatarUrl + owner.guid)
                });
            }

            this._collaborators(newItems);
        },

        getReviewerContacts: function () {
            if (this.fileId && !this.anonymousAnnotation) {
                this._model.getReviewerContacts(function (response) {
                    var newItems = [];
                    $.each(response.data.reviewerContacts, function (index, value) {
                        newItems.push({
                            emailAddress: value.emailAddress,
                            firstName: value.firstName == null ? "" : value.firstName,
                            lastName: value.lastName == null ? "" : value.lastName
                        });
                    });

                    this.reviewerContacts(newItems);

                    var reviewerContacts = [];
                    for (var i = 0; i < this.reviewerContacts().length; i++)
                        reviewerContacts.push(this.reviewerContacts()[i].emailAddress);

                    if (this.reviewerAutocompleteInputField) {
                        this.reviewerAutocompleteInputField.autocomplete("option", "source", reviewerContacts);
                    }

                }.bind(this));
            }
        },

        setReviewerContacts: function () {
            if (this.newReviewerContactEmail() != "") {
                this.busySavingReviewerContacts(true);
                var serverReviewerContacts = [];
                var i;
                var reviewerContact;
                for (i = 0; i < this.reviewerContacts().length; i++) {
                    reviewerContact = this.reviewerContacts()[i];
                    serverReviewerContacts.push(reviewerContact);
                }

                serverReviewerContacts.push({
                    emailAddress: this.newReviewerContactEmail(),
                    firstName: this.newReviewerContactFirstName(),
                    lastName: this.newReviewerContactLastName()
                });

                this._model.setReviewerContacts(serverReviewerContacts,
                    function (response) {
                        this.busySavingReviewerContacts(false);
                        var newItems = [];
                        $.each(response.data.reviewerContacts, function (index, value) {
                            newItems.push({
                                emailAddress: value.emailAddress,
                                firstName: value.firstName == null ? "" : value.firstName,
                                lastName: value.lastName == null ? "" : value.lastName
                            });
                        });
                        this.reviewerContacts(newItems);

                        this.newReviewerContactEmail("");
                        this.newReviewerContactFirstName("");
                        this.newReviewerContactLastName("");
                        this.invited(true);
                    }.bind(this),
                    function (error) {
                        this.busySavingReviewerContacts(false);
                        this.invited(false);
                        jerror(error);
                    }.bind(this));
            }
        },


        findCollaborator: function (collaboratorGuid) {
            var reviewer = null;
            for (var i = 0; i < this._collaborators().length; i++) {
                if (this._collaborators()[i].guid == collaboratorGuid) {
                    reviewer = this._collaborators()[i];
                    break;
                }
            }
            return reviewer;
        },

        findReviewerByEmail: function (reviewerEmailAddress) {
            var reviewer = null;
            for (var i = 0; i < this._collaborators().length; i++) {
                if (this._collaborators()[i].emailAddress == reviewerEmailAddress) {
                    reviewer = this._collaborators()[i];
                    break;
                }
            }
            return reviewer;
        },

        getLastReplyColor: function (annotation) {
            var replies = annotation.replies();
            if (replies.length > 0) {
                var userGuid = replies[replies.length - 1].userGuid;
                return this.getRgbColorOfReviewer(userGuid);
            }
            else {
                return "#" + this.getDefaultColor().toString();
            }
        },

        getDefaultColor: function () {
            return 0x125389;
        },

        getLastReplyText: function (annotation) {
            var replies = annotation.replies();
            if (replies.length > 0) {
                var replyText = replies[replies.length - 1].text();
                return jGroupdocs.html.toText(replyText);
            }
            else {
                return "";
            }
        },

        _getReviewerColor: function (userGuid) {
            var reviewer = this.findCollaborator(userGuid);
            var color;

            if (reviewer == null)
                color = this.getDefaultColor();
            else {
                color = reviewer.color();
                if (color == null)
                    color = this.getDefaultColor();
            }

            return color;
        },

        _getHexReviewerColor: function (userGuid) {
            var color = this._getReviewerColor(userGuid);
            return jSaaspose.utils.getHexColor(color);
        },

        getRgbColorOfReviewer: function (userGuid) {
            var color = this._getReviewerColor(userGuid);
            return this.getRgbColorFromInteger(color);
        },

        getRgbColorFromInteger: function (color) {
            return isNaN(color) ? 'rgb(255, 255, 255)' : 'rgb(' + (color >> 16 & 255) + ',' + (color >> 8 & 255) + ',' + (color & 255) + ')';
        },

        setReviewerRights: function () {
            this.busySavingReviewerRights(true);
            var serverCollaborators = [];
            for (var i = 0; i < this._collaborators().length; i++) {
                var collaborator = this._collaborators()[i];
                var serverCollaborator = {
                    primary_email: collaborator.emailAddress, color: collaborator.color(),
                    id: collaborator.id, guid: collaborator.guid,
                    access_rights: ((collaborator.canRedact() && collaborator.canView()) ? 32 : 0) |
                                    ((collaborator.canDelete() && collaborator.canView()) ? 16 : 0) |
                                    ((collaborator.canExport() && collaborator.canView()) ? 8 : 0) |
                                    ((collaborator.canDownload() && collaborator.canView()) ? 4 : 0) |
                                    ((collaborator.canAnnotate() && collaborator.canView()) ? 2 : 0) |
                                    (collaborator.canView() ? 1 : 0)
                };
                serverCollaborators.push(serverCollaborator);
            }

            this._model.setReviewerRights(this.fileId, serverCollaborators,
                function (response) {
                    if (this.currentUserIsDocumentOwner()) {
                        this.applySharedLinkAccessRights();
                    }
                    else {
                        this.busySavingReviewerRights(false);
                    }
                    //this.busy(false);
                    //this.invited(true);
                }.bind(this),
                function (error) {
                    this.busySavingReviewerRights(false);
                    //this.invited(false);
                    jerror(error);
                }.bind(this)
            );
        },

        applySharedLinkAccessRights: function () {
            if (!this.currentUserIsDocumentOwner()) {
                return;
            }

            this.busySavingReviewerRights(true);

            var sharedLinkAccessRights =
                    ((this.canRedact() && this.canView()) ? 32 : 0) |
                    ((this.canDelete() && this.canView()) ? 16 : 0) |
                    ((this.canExport() && this.canView()) ? 8 : 0) |
                    ((this.canDownload() && this.canView()) ? 4 : 0) |
                    ((this.canAnnotate() && this.canView()) ? 2 : 0) |
                    (this.canView() ? 1 : 0);

            this._model.setSharedLinkAccessRights(this.fileId, sharedLinkAccessRights,
                function (response) {
                    this.triggerOnReviewerColorsChanged();
                    this.busySavingReviewerRights(false);
                }.bind(this),
                function (error) {
                    this.busySavingReviewerRights(false);
                    jerror(error);
                }.bind(this)
            );
        },

        addChildReply: function (annotation, parentReplyGuid) {
            var parentReply = annotation.findReply(parentReplyGuid);
            var replyLevel = 0;
            if (parentReply != null) {
                replyLevel = parentReply.replyLevel + 1;
            }
            var newReply = new AnnotationReply({
                parentReplyGuid: parentReplyGuid,
                userName: this.userName,
                repliedOn: new Date().getTime(),
                userGuid: this.userId,
                replyLevel: replyLevel
            });
            if (parentReply != null) {
                parentReply.childReplies.push(newReply);
                annotation.insertReplyAfterAnotherReply(parentReply, newReply);
            }
            annotation.setActiveReply(newReply);

            var scrollbar = $('#comments_scroll');
            if (scrollbar.length > 0) {
                scrollbar.tinyscrollbar_update('relative');
            }
        },

        setReviewersColorsOnClient: function (reviewerDescriptions) {
            for (var i = 0; i < reviewerDescriptions.length; i++) {
                var reviewer = this.findReviewerByEmail(reviewerDescriptions[i].emailAddress);
                if (reviewer != null)
                    reviewer.color(reviewerDescriptions[i].color);
            }
            this.triggerOnReviewerColorsChanged();
        },

        setReviewersRightsOnClient: function (reviewerDescriptions) {
            for (var i = 0; i < reviewerDescriptions.length; i++) {
                var reviewer = this.findReviewerByEmail(reviewerDescriptions[i].emailAddress);

                if (reviewer != null) {
                    var access = reviewerDescriptions[i].accessRights;

                    reviewer.canRedact((access & 32) > 0);
                    reviewer.canDelete((access & 16) > 0);
                    reviewer.canExport((access & 8) > 0);
                    reviewer.canDownload((access & 4) > 0);
                    reviewer.canAnnotate((access & 2) > 0);
                    reviewer.canView((access & 1) > 0);

                    if (reviewer.guid == this.userId) {
                        this._setAccessRights(access);
                    }
                }
            }
        },

        triggerOnReviewerColorsChanged: function () {
            $(this).trigger('onReviewerColorsChanged', []);
        },

        preventIconsFromOverlapping: function () {
            this.annotations.sort(function (left, right) {
                var leftY = left.annotationOriginalTextBoxDisplayPosition().y;
                var rightY = right.annotationOriginalTextBoxDisplayPosition().y;
                if (leftY > rightY)
                    return 1;
                else if (leftY < rightY)
                    return -1;
                else if (leftY == rightY)
                    return 0;
            });
            var previousY = null;
            var previousOriginalY = null;
            var minimumDistance = this.minimumDistance;
            var annotation;
            var distance;
            for (var i = 0; i < this.annotations().length; i++) {
                annotation = this.annotations()[i];
                if (!annotation.commentsEnabled)
                    continue;

                if (previousY == null) {
                    annotation.annotationSideIconDisplayPosition().y = annotation.annotationOriginalTextBoxDisplayPosition().y;
                }
                else {
                    distance = annotation.annotationOriginalTextBoxDisplayPosition().y - previousOriginalY;
                    if (distance < minimumDistance) {
                        distance = minimumDistance;
                        annotation.annotationSideIconDisplayPosition().y = previousY + distance;
                    }
                    else {
                        if (annotation.annotationOriginalTextBoxDisplayPosition().y >= previousY + minimumDistance)
                            annotation.annotationSideIconDisplayPosition().y = annotation.annotationOriginalTextBoxDisplayPosition().y;
                        else {
                            distance = minimumDistance;
                            annotation.annotationSideIconDisplayPosition().y = previousY + distance;
                        }
                    }

                }
                previousY = annotation.annotationSideIconDisplayPosition().y;
                previousOriginalY = annotation.annotationOriginalTextBoxDisplayPosition().y;
                annotation.annotationSideIconDisplayPosition().x = annotation.annotationOriginalTextBoxDisplayPosition().x;
                annotation.annotationSideIconDisplayPosition(annotation.annotationSideIconDisplayPosition());

                this.createConnectingLineAndIcon(annotation, false);
            }
        },

        getImageWidthWithoutRightPanel: function () {
            var rightOffset;
            var visiblePanel = this.rightSideElement.children(":visible");
            if (this.isRightPanelEnabled)
                rightOffset = Math.round(visiblePanel.width());
            else
                rightOffset = 0;

            var fixedDistanceBetweenPageAndRightPanel = 68;
            if (this.embeddedAnnotation && this.fullSynchronization) { // centered page
                if (this.isRightPanelEnabled) {
                    rightOffset *= 2;
                    fixedDistanceBetweenPageAndRightPanel *= 2;
                }
                else {
                    fixedDistanceBetweenPageAndRightPanel = 40;
                }
            }
            //var imageHorizontalMargin = this.imageHorizontalMargin;
            return this.documentSpace.width() - rightOffset - fixedDistanceBetweenPageAndRightPanel;
            //return this.documentSpace.width() - 2 * this.imageHorizontalMargin - rightOffset;
            //return this.documentSpace[0].clientWidth - 2 * this.imageHorizontalMargin - rightOffset;
        },

        setImageWidthWithoutRightPanel: function () {
            var ratio = null;
            if (this.embeddedAnnotation) {
                var requiredWidth = this.getImageWidthWithoutRightPanel();
                //if (this.pageWidth() > requiredWidth) {
                ratio = requiredWidth / this.pageImageWidth * 100;
                //this.setZoom(ratio);
                //}
            }
            return ratio;
        },

        setDocumentScroll: function (verticalScrollPosition) {
            var documentSpace = this.documentSpace[0];
            documentSpace.scrollTop = verticalScrollPosition;
        },

        scrollToVisible: function (annotation) {
            var displayPos = null;

            if (this.scrollOnFocus && annotation.annotationSideIconDisplayPosition && (displayPos = annotation.annotationSideIconDisplayPosition()) != null) {
                var topOffset = (annotation.replyCount() > 0 ? 165 : 190);
                var scrollTop = Math.max(displayPos.y - topOffset, 0);
                var documentSpace = this.documentSpace[0];

                if (displayPos.y < documentSpace.scrollTop || displayPos.y > documentSpace.scrollTop + documentSpace.clientHeight)
                    this.setDocumentScroll(scrollTop);
            }
        },

        // mouse wheel scroll without lags in Chrome
        setupChromeMouseWheelHandler: function () {
            var browserIsChrome = /chrom(e|ium)/.test(navigator.userAgent.toLowerCase());
            if (!browserIsChrome)
                return;
            var self = this;
            var mouseWheelStepPixels = 0;
            var mouseWheelFired = false;
            var previousScrollTop = 0;
            var wheelDelta = 0;

            function chromeMouseWheelHandler(incomingEvent) {
                //var st = self.documentSpace.scrollTop();
                var delta = 0;
                var event = incomingEvent;
                if (incomingEvent.originalEvent)
                    event = incomingEvent.originalEvent;
                if (!event) /* For IE. */
                    event = window.event;
                if (event.wheelDelta) { /* IE/Opera. */
                    delta = event.wheelDelta / 120;
                } else if (event.detail) { /** Mozilla case. */
                    /** In Mozilla, sign of delta is different than in IE.
                    * Also, delta is multiple of 3.
                    */
                    delta = -event.detail / 3;
                }
                /** If delta is nonzero, handle it.
                * Basically, delta is now positive if wheel was scrolled up,
                * and negative, if wheel was scrolled down.
                */
                if (delta && mouseWheelStepPixels > 0) {
                    var st = self.documentSpace.scrollTop();
                    st -= delta * mouseWheelStepPixels;
                    if (st < self.documentSpace[0].scrollHeight - self.documentSpace.height())
                        $(this).trigger('onBeforeScrollDocView', { position: st });
                }

                previousScrollTop = self.documentSpace.scrollTop();
                wheelDelta = delta;
                mouseWheelFired = true;
            }

            function chromeScrollHandler() {
                if (mouseWheelFired && wheelDelta != 0) {
                    var st = self.documentSpace.scrollTop();
                    if (st < self.documentSpace[0].scrollHeight - self.documentSpace.height()) {
                        mouseWheelStepPixels = (self.documentSpace.scrollTop() - previousScrollTop) / wheelDelta;
                        if (mouseWheelStepPixels < 0)
                            mouseWheelStepPixels = -mouseWheelStepPixels;
                    }
                    mouseWheelFired = false;
                }
            }

            this.documentSpace.bind("scroll", chromeScrollHandler);
            this.documentSpace.bind("mousewheel", chromeMouseWheelHandler);
        },

        broadcastMasterResolution: function () {
            if (this.fullSynchronization && this.isMasterOfBroadcast) {
                this.broadcastDocumentScale();
            }
        },

        slaveConnectedHandlerOnClient: function () {
            if (this.fullSynchronization && this.isMasterOfBroadcast) {
                this.broadcastDocumentScroll();
                this.broadcastDocumentScale();
            }
        },

        broadcastSlaveConnected: function () {
            if (this.fullSynchronization && !this.isMasterOfBroadcast) {
                $.connection.annotationHub.server.broadcastSlaveConnected(this.fileId);
            }
        },

        isThereActiveAnnotation: function () {
            return this.activeAnnotation() != null;
        },

        activateNextAnnotation: function () {
            return this._activateAnnotation(1);
        },

        activatePrevAnnotation: function () {
            return this._activateAnnotation(-1);
        },

        _activateAnnotation: function (direction) {
            var annotationCount = this.annotations().length;
            if (annotationCount <= 0)
                return null;

            var annotation = this.activeAnnotation();

            if (annotation != null) {
                var idx = this._indexOfAnnotation(annotation.guid);
                annotation = this._getAnnotationAt(idx + direction);
            }

            if (annotation == null)
                annotation = (direction >= 0 ? this.annotations()[0] : this.annotations()[annotationCount - 1]);

            this.activeAnnotation(annotation);
            return annotation;
        }
    });


    //
    // Annotation viewer
    //
    $.widget('ui.docAnnotationViewer', $.ui.docViewer, {
        _create: function () {
            $.ui.docViewer.prototype._create.call(this);
            var viewModel = this.getViewModel();
            ko.bindingHandlers.makeDraggable = {
                init: function (element, valueAccessor, allBindingsAccessor, marker) {
                    if (valueAccessor()) {
                        //if (marker.annotation.type == Annotation.prototype.AnnotationType.Point)
                        //    viewModel.createConnectingLine(marker.annotation, $(element).height());

                        $(element).draggable(valueAccessor());
                    }
                }
            };

            ko.bindingHandlers.htmlValue = {
                init: function (element, valueAccessor, allBindingsAccessor) {
                    function updateHandler(onToolbar) {
                        var modelValue = valueAccessor();
                        //var elementValue = $(element).text();
                        var elementValue = $(element).html();

                        if (ko.isWriteableObservable(modelValue)) {
                            modelValue(elementValue);
                        }
                        else { //handle non-observable one-way binding
                            var allBindings = allBindingsAccessor();
                            if (allBindings['_ko_property_writers'] && allBindings['_ko_property_writers'].htmlValue)
                                allBindings['_ko_property_writers'].htmlValue(elementValue);
                        }
                        if (onToolbar)
                            $(element).trigger("koValueUpdatedOnToolbar");
                        else
                            $(element).trigger("koValueUpdated", element);
                    }

                    function updateHandlerNotToolbar() {
                        updateHandler(false);
                    }

                    function updateHandlerToolbar() {
                        updateHandler(true);
                    }

                    ko.utils.registerEventHandler(element, "clickoutside", updateHandlerNotToolbar);
                    ko.utils.registerEventHandler(element, "clickoutsideOnToolbar", updateHandlerToolbar);
                    ko.utils.registerEventHandler(element, "blur", updateHandler);
                    ko.utils.registerEventHandler(element, "keyup", updateHandler);
                    ko.utils.registerEventHandler(element, "input", updateHandler);
                },
                update: function (element, valueAccessor) {
                    var value = ko.utils.unwrapObservable(valueAccessor()) || "";
                    var newInnerHtml = (value && value.length ? value.replace(/\n/g, '<br/>') : '');
                    if (newInnerHtml != element.innerHTML) {
                        element.innerHTML = newInnerHtml;
                    }

                    var scrollbar = $('#comments_scroll');
                    if (scrollbar.length > 0) {
                        scrollbar.tinyscrollbar_update('relative');
                    }
                }
            };

            $(document).bind("mousedown", function (event) {
                var activeElement = $(document.activeElement);
                var target = (event && event.target) || (event && event.srcElement);

                var activeToolbar = $(".text_area_toolbar").has(activeElement);
                var toolbarWasActive = (activeToolbar.length > 0);
                if (target != document.activeElement &&
                    (activeElement.is("input") || activeElement.is("textarea") || activeElement.is("[contenteditable='true']") || toolbarWasActive)
                    && !$(target).is(".annotationButton")
                    && !$(target).is(".ta_resize_box")
                    && !(toolbarWasActive && activeToolbar.parent().has(target).length > 0 && $(target).is(".doc_text_area_text"))) {
                    if ($(".text_area_toolbar").has(target).length == 0)
                        activeElement.trigger("clickoutside");
                    else
                        activeElement.trigger("clickoutsideOnToolbar");
                    //if (toolbarWasActive)
                    //    activeToolbar.trigger("clickoutside");
                }
                var visibleToolbars = $(".text_area_toolbar:visible");
                if ($(".text_area_toolbar").has(target).length == 0 && !$(target).is(".doc_text_area_text"))
                    visibleToolbars.trigger("clickoutside");
                return true;
            });
        },

        _createViewModel: function () {
            return new annotationViewModel(this.options);
        }
    });
})(jQuery);