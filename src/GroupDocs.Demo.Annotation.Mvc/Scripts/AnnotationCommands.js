jGroupdocs.AnnotationUndoManager = function () {
    jGroupdocs.UndoManager.prototype.constructor.apply(this, arguments);

    this.canRedoObservable = ko.observable(false);
    this.canUndoObservable = ko.observable(false);
    this.busy = ko.computed(function () {
        return this.canRedoObservable() && this.canUndoObservable();
    }, this);
};

$.extend(jGroupdocs.AnnotationUndoManager.prototype, jGroupdocs.UndoManager.prototype, {
    canRedoObservable: ko.observable(false),
    canUndoObservable: ko.observable(false),
    busy: null,

    _onDone: function (command) {
        jGroupdocs.UndoManager.prototype._onDone.apply(this, arguments);

        this._fixupIds(command);
        this._refreshObservables();
    },

    _onUndone: function (command) {
        jGroupdocs.UndoManager.prototype._onUndone.apply(this, arguments);

        this._fixupIds(command);
        this._refreshObservables();
    },

    _onDoUndoFailed: function (command) {
        jGroupdocs.UndoManager.prototype._onDoUndoFailed.apply(this, arguments);
        this._refreshObservables();
    },

    _onExecuting: function () {
        this._refreshObservables();
    },

    _refreshObservables: function () {
        this.canRedoObservable(this.canRedo());
        this.canUndoObservable(this.canUndo());
    },

    _fixupIds: function (command) {
        var maps = command.idsMap(), j;

        for (j = 0; j < maps.length; j++) {
            var ids = maps[j],
                newIdExists = (ids.newId != null && ids.newId !== undefined && ids.newId.length > 0);

            if (ids.oldId == null || ids.oldId.length <= 0 || !newIdExists || ids.oldId == ids.newId)
                continue;

            for (var i = 0; i < this._commands.length; i++) {
                if (this._commands[i] != command && this._commands[i].fixupIds(ids))
                    this._commands[i].onIdsFixedUp(ids);
            }
        }

        for (j = 0; j < maps.length; j++) {
            var ids = maps[j],
                newIdExists = (ids.newId != null && ids.newId !== undefined && ids.newId.length > 0);

            if (newIdExists && command.fixupIds(ids))
                command.onIdsFixedUp(ids);
        }
    }
});

// Annotation commands base class
AnnotationCommand = function (model, fileId, annotation, callbacks) {
    jGroupdocs.AsyncCommand.prototype.constructor.apply(this, [callbacks]);

    this._model = model;
    this._fileId = fileId;
    this._annotation = annotation;
    this._annotationId = (annotation ? annotation.guid : null);
    this._idsMap = {
        oldId: annotation.guid,
        newId: annotation.guid
    };
};

$.extend(AnnotationCommand.prototype, jGroupdocs.AsyncCommand.prototype, {
    _model: null,
    _fileId: null,
    _annotation: null,
    _annotationId: null,
    _idsMap: {
        oldId: '',
        newId: ''
    },

    idsMap: function () {
        return [this._idsMap];
    },

    fixupIds: function (ids, preserveIdsMap) {
        if (this._annotationId != ids.oldId)
            return (this._annotationId == ids.newId);

        this._annotationId = ids.newId;
        this._annotation.guid = ids.newId;

        if (!preserveIdsMap)
            this._idsMap.newId = this._idsMap.oldId = ids.newId;

        return true;
    },

    onIdsFixedUp: function (ids) {
        if (this._callbacks && this._callbacks.onIdsFixedUp)
            this._callbacks.onIdsFixedUp(ids);
    }
});



// Annotation creation command
CreateAnnotationCommand = function (model, fileId, annotation, callbacks) {
    AnnotationCommand.prototype.constructor.apply(this, arguments);
};

$.extend(CreateAnnotationCommand.prototype, AnnotationCommand.prototype, {
    executeAsync: function () {
        this._model.createAnnotation(
            this._fileId,
            this._annotation.type,
            this._annotation.fieldText,
            this._annotation.pageNumber,
            this._annotation.box,
            this._annotation.annotationPosition,
            //this._annotation.range,
            this._annotation.svgPath,
            this._annotation.drawingOptions,
            { family: this._annotation.fontFamily, size: this._annotation.fontSize },
            this._onDone.bind(this),
            this._onDoFailed.bind(this));
    }
});



// Annotation replies restore command
RestoreAnnotationRepliesCommand = function (model, fileId, annotation, callbacks, replies) {
    AnnotationCommand.prototype.constructor.apply(this, arguments);
    this._replies = replies;
};

$.extend(RestoreAnnotationRepliesCommand.prototype, AnnotationCommand.prototype, {
    _replies: null,

    executeAsync: function () {
        this._model.restoreAnnotationReplies(
            this._fileId,
            this._annotationId,
            this._replies,
            this._onDone.bind(this),
            this._onDoFailed.bind(this));
    },

    _onDone: function (response) {
        AnnotationCommand.prototype._onDone.apply(this, arguments);
    }
});



// Annotation and replies restoring command
RestoreAnnotationCommand = function (model, fileId, annotation, callbacks, replies) {
    AnnotationCommand.prototype.constructor.apply(this, arguments);

    this._replies = [];

    if (replies && replies.length) {
        for (var i = 0; i < replies.length; i++) {
            var rd = replies[i];
            this._replies.push({
                guid: rd.guid(),
                message: rd.text(),
                userGuid: rd.userGuid,
                parentReplyGuid: rd.parentReplyGuid(),
                repliedOn: rd.repliedOn
            });
        }
    }
};


$.extend(RestoreAnnotationCommand.prototype, AnnotationCommand.prototype, {
    _replies: null,
    _replyIdsMap: null,

    executeAsync: function () {
        var callbacks = {
            onDone: this._onAnnotationCreated.bind(this),
            onDoFailed: this._onDoFailed.bind(this)
        };

        var createCmd = new CreateAnnotationCommand(
            this._model,
            this._fileId,
            this._annotation,
            callbacks);
        createCmd.executeAsync();
    },

    idsMap: function () {
        var map = AnnotationCommand.prototype.idsMap.apply(this, arguments);
        map.push.apply(map, this._replyIdsMap || []);

        return map;
    },

    _onAnnotationCreated: function (response) {
        this._annotation.guid = response.data.annotationGuid;

        var callbacks = {
            onDone: this._onDone.bind(this),
            onDoFailed: this._onDoFailed.bind(this)
        };

        var restoreRepliesCmd = new RestoreAnnotationRepliesCommand(
            this._model,
            this._fileId,
            this._annotation,
            callbacks,
            this._replies);
        restoreRepliesCmd.executeAsync();
    },

    _onDone: function (response) {
        this._replyIdsMap = [];

        for (var i = 0; i < response.data.ids.length; i++) {
            this._replyIdsMap.push({
                oldId: this._replies[i].guid,
                newId: response.data.ids[i]
            });
        }

        this._idsMap.newId = response.data.annotationGuid;
        AnnotationCommand.prototype._onDone.apply(this, arguments);
    },

    _onDoFailed: function (response) {
        this._idsMap.newId = '';
        AnnotationCommand.prototype._onDoFailed.apply(this, arguments);
    }
});



// Annotation deletion command
DeleteAnnotationCommand = function (model, fileId, annotation, callbacks, replies) {
    AnnotationCommand.prototype.constructor.apply(this, arguments);
    this._replies = replies;
};

$.extend(DeleteAnnotationCommand.prototype, AnnotationCommand.prototype, {
    _replies: null,
    _undoCmd: null,

    executeAsync: function () {
        this._undoCmd = null;
        this._model.deleteAnnotation(
            this._fileId,
            this._annotationId,
            this._onDone.bind(this),
            this._onDoFailed.bind(this));
    },

    undoCommand: function () {
        var callbacks = {
            onDone: this._onUndone.bind(this),
            onDoFailed: this._callbacks.onUndoFailed.bind(this)
        };

        this._undoCmd = new RestoreAnnotationCommand(
            this._model,
            this._fileId,
            this._annotation,
            callbacks,
            this._replies);

        return this._undoCmd;
    },

    idsMap: function () {
        return (this._undoCmd != null ?
            this._undoCmd.idsMap() : AnnotationCommand.prototype.idsMap.apply(this, arguments));
    },

    _onDone: function (response) {
        this._idsMap.newId = '';
        AnnotationCommand.prototype._onDone.apply(this, arguments);
    },

    _onUndone: function (response) {
        this._idsMap.newId = response.data.annotationGuid;
        AnnotationCommand.prototype._onUndone.apply(this, arguments);
    }
});



// Annotation creation command
$.extend(CreateAnnotationCommand.prototype, {
    undoCommand: function () {
        var callbacks = {
            onDone: this._onUndone.bind(this),
            onDoFailed: this._callbacks.onUndoFailed.bind(this)
        };

        return new DeleteAnnotationCommand(
            this._model,
            this._fileId,
            this._annotation,
            callbacks);
    },

    _onDone: function (response) {
        this._idsMap.newId = response.data.annotationGuid;
        AnnotationCommand.prototype._onDone.apply(this, arguments);
    },

    _onUndone: function (response) {
        this._idsMap.newId = '';
        AnnotationCommand.prototype._onUndone.apply(this, arguments);
    }
});



// Move annotation command
MoveAnnotationCommand = function (model, fileId, annotation, callbacks, newPosition, oldPosition) {
    AnnotationCommand.prototype.constructor.apply(this, arguments);

    this._newPosition = newPosition;
    this._oldPosition = oldPosition;
};

$.extend(MoveAnnotationCommand.prototype, AnnotationCommand.prototype, {
    _newPosition: null,
    _oldPosition: null,

    executeAsync: function () {
        this._model.moveAnnotationMarker(
            this._fileId,
            this._annotation.guid,
            this._newPosition.x,
            this._newPosition.y,
            this._annotation.pageNumber,
            this._onDone.bind(this),
            this._onDoFailed.bind(this));
    },

    undoCommand: function () {
        var callbacks = {
            onDone: this._callbacks.onUndone.bind(this),
            onDoFailed: this._callbacks.onUndoFailed.bind(this)
        };

        return new MoveAnnotationCommand(
            this._model,
            this._fileId,
            this._annotation,
            callbacks,
            this._oldPosition,
            null);
    }
});


// Resize annotation command
ResizeAnnotationCommand = function (model, fileId, annotation, callbacks, newSize, oldSize) {
    AnnotationCommand.prototype.constructor.apply(this, arguments);

    this._newSize = newSize;
    this._oldSize = oldSize;
};

$.extend(ResizeAnnotationCommand.prototype, AnnotationCommand.prototype, {
    _newSize: null,
    _oldSize: null,

    executeAsync: function () {
        this._model.resizeAnnotation(
            this._fileId,
            this._annotation.guid,
            this._newSize.width,
            this._newSize.height,
            this._onDone.bind(this),
            this._onDoFailed.bind(this));
    },

    undoCommand: function () {
        var callbacks = {
            onDone: this._callbacks.onUndone.bind(this),
            onDoFailed: this._callbacks.onUndoFailed.bind(this)
        };

        return new ResizeAnnotationCommand(
            this._model,
            this._fileId,
            this._annotation,
            callbacks,
            this._oldSize,
            null);
    }
});



// Set annotation color command
SetAnnotationColorCommand = function (model, fileId, annotation, callbacks, newColor, oldColor) {
    AnnotationCommand.prototype.constructor.apply(this, arguments);

    this._newColor = newColor;
    this._oldColor = oldColor;
};

$.extend(SetAnnotationColorCommand.prototype, AnnotationCommand.prototype, {
    _newColor: null,
    _oldColor: null,

    executeAsync: function () {
        this._model.setTextFieldColor(
            this._fileId,
            this._annotation.guid,
            this._newColor,
            this._onDone.bind(this),
            this._onDoFailed.bind(this));
    },

    undoCommand: function () {
        var callbacks = {
            onDone: this._callbacks.onUndone.bind(this),
            onDoFailed: this._callbacks.onUndoFailed.bind(this)
        };

        return new SetAnnotationColorCommand(
            this._model,
            this._fileId,
            this._annotation,
            callbacks,
            this._oldColor,
            null);
    }
});





// Annotation reply command
AnnotationReplyCommand = function (model, fileId, annotation, callbacks, reply) {
    AnnotationCommand.prototype.constructor.apply(this, arguments);

    this._reply = reply;
    this._replyId = (reply && reply.guid ? reply.guid() : '');
    this._idsMap.newId = this._idsMap.oldId = this._replyId;
};

$.extend(AnnotationReplyCommand.prototype, AnnotationCommand.prototype, {
    _reply: null,
    _replyId: null,

    fixupIds: function (ids, preserveIdsMap) {
        if (AnnotationCommand.prototype.fixupIds.apply(this, [ids, true])) {
            return true;
        }

        if (this._replyId != ids.oldId)
            return (this._replyId == ids.newId);

        this._replyId = ids.newId;
        this._reply.guid(ids.newId);

        if (!preserveIdsMap)
            this._idsMap.newId = this._idsMap.oldId = ids.newId;

        return true;
    }
});



// Annotation reply deletion command
DeleteAnnotationReplyCommand = function (model, fileId, annotation, callbacks, reply) {
    AnnotationReplyCommand.prototype.constructor.apply(this, arguments);

    this._replyDescendants = [];

    this._replyDescendants.push({
        guid: reply.guid(),
        message: reply.text(),
        userGuid: reply.userGuid,
        parentReplyGuid: reply.parentReplyGuid(),
        repliedOn: reply.repliedOn
    });

    if (annotation.getReplyDescendants) {
        var replyDescendants = annotation.getReplyDescendants(this._replyId);

        for (var i = 0; i < replyDescendants.length; i++) {
            var rd = replyDescendants[i];
            this._replyDescendants.push({
                guid: rd.guid(),
                message: rd.text(),
                userGuid: rd.userGuid,
                parentReplyGuid: rd.parentReplyGuid(),
                repliedOn: rd.repliedOn
            });
        }
    }
};

$.extend(DeleteAnnotationReplyCommand.prototype, AnnotationReplyCommand.prototype, {
    _replyDescendants: null,
    _descendantIdsMap: null,

    executeAsync: function () {
        this._model.deleteAnnotationReply(
            this._fileId,
            this._annotationId,
            this._replyId,
            this._onDone.bind(this),
            this._onDoFailed.bind(this));
    },

    fixupIds: function (ids, preserveIdsMap) {
        var result = AnnotationReplyCommand.prototype.fixupIds.apply(this, arguments);

        for (var i = 0; i < this._replyDescendants.length; i++) {
            if (this._replyDescendants[i].guid == ids.oldId) {
                this._replyDescendants[i].guid = ids.newId;
                result = true;
            }
            else
                if (this._replyDescendants[i].parentReplyGuid == ids.oldId)
                    this._replyDescendants[i].parentReplyGuid = ids.newId;
        }

        return result;
    },

    idsMap: function () {
        var map = AnnotationReplyCommand.prototype.idsMap.apply(this, arguments);
        map.push.apply(map, this._descendantIdsMap || []);

        return map;
    }
});


// Annotation reply creation command
CreateAnnotationReplyCommand = function (model, fileId, annotation, callbacks, reply) {
    AnnotationReplyCommand.prototype.constructor.apply(this, arguments);
};

$.extend(CreateAnnotationReplyCommand.prototype, AnnotationReplyCommand.prototype, {
    executeAsync: function () {
        var text = jGroupdocs.html.toText(this._reply.text());
        this._model.addAnnotationReply(
            this._fileId,
            this._annotationId,
            text,
            this._reply.parentReplyGuid(),
            this._onDone.bind(this),
            this._onDoFailed.bind(this));
    },

    undoCommand: function () {
        var callbacks = {
            onDone: this._onUndone.bind(this),
            onDoFailed: this._callbacks.onUndoFailed.bind(this)
        };

        return new DeleteAnnotationReplyCommand(
            this._model,
            this._fileId,
            this._annotation,
            callbacks,
            this._reply);
    },

    _onDone: function (response) {
        this._idsMap.newId = response.data.replyGuid;
        AnnotationReplyCommand.prototype._onDone.apply(this, arguments);
    },

    _onUndone: function (response) {
        this._idsMap.newId = '';
        AnnotationReplyCommand.prototype._onUndone.apply(this, arguments);
    }
});




// Annotation reply deletion command undo operation
$.extend(DeleteAnnotationReplyCommand.prototype, {
    undoCommand: function () {
        var callbacks = {
            onDone: this._onUndone.bind(this),
            onDoFailed: this._callbacks.onUndoFailed.bind(this)
        };


        return new RestoreAnnotationRepliesCommand(
            this._model,
            this._fileId,
            this._annotation,
            callbacks,
            this._replyDescendants);

        /*return new CreateAnnotationReplyCommand(
        this._model,
        this._fileId,
        this._annotation,
        callbacks,
        this._reply);*/
    },

    _onDone: function (response) {
        this._idsMap.newId = '';
        AnnotationReplyCommand.prototype._onDone.apply(this, arguments);
    },

    _onUndone: function (response) {
        this._idsMap.newId = response.data.replyGuid;
        this._descendantIdsMap = [];

        for (var i = 0; i < response.data.ids.length; i++) {
            this._descendantIdsMap.push({
                oldId: this._replyDescendants[i].guid,
                newId: response.data.ids[i]
            });
        }

        AnnotationReplyCommand.prototype._onUndone.apply(this, arguments);
    }
});



// Annotation reply edit command
EditAnnotationReplyCommand = function (model, fileId, annotation, callbacks, reply, newText, oldText) {
    AnnotationReplyCommand.prototype.constructor.apply(this, arguments);

    this._newText = newText;
    this._oldText = oldText;
};

$.extend(EditAnnotationReplyCommand.prototype, AnnotationReplyCommand.prototype, {
    _newText: null,
    _oldText: null,

    executeAsync: function () {
        var text = jGroupdocs.html.toText(this._newText);
        this._model.editAnnotationReply(
            this._fileId,
            this._annotationId,
            this._replyId,
            text,
            this._onDone.bind(this),
            this._onDoFailed.bind(this));
    },

    undoCommand: function () {
        var callbacks = {
            onDone: this._callbacks.onUndone.bind(this),
            onDoFailed: this._callbacks.onUndoFailed.bind(this)
        };

        return new EditAnnotationReplyCommand(
            this._model,
            this._fileId,
            this._annotation,
            callbacks,
            this._reply,
            this._oldText,
            null);
    }
});
