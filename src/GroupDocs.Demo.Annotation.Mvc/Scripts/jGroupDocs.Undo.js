(function ($) {
    if (!window.jGroupdocs)
        window.jGroupdocs = {};

    jGroupdocs.UndoManager = function () {
        this._commands = [];
        this._pendingCommands = [];
        this._position = -1;
        this._doing = false;
        this._redoing = false;
    };

    $.extend(jGroupdocs.UndoManager.prototype, {
        _commands: null,
        _pendingCommands: null,
        _position: -1,
        _doing: false,
        _redoing: false,

        canUndo: function () {
            return !this._doing && this._position >= 0;
        },

        canRedo: function () {
            return !this._doing && this._position < this._commands.length - 1;
        },

        executeAsync: function (command) {
            var self = this,
                onDone = command._callbacks.onDone,
                onUndone = command._callbacks.onUndone,
                onDoFailed = command._callbacks.onDoFailed,
                onUndoFailed = command._callbacks.onUndoFailed,
                execChunk = function (cmdCallback, mngrCallback) {
                    return function (response) {
                        if (cmdCallback)
                            cmdCallback(response);

                        if (mngrCallback)
                            mngrCallback(command);
                    }
                },
                callbacks = $.extend(command._callbacks, {
                    onDone: execChunk(onDone, self._onDone.bind(self)),
                    onUndone: execChunk(onUndone, self._onUndone.bind(self)),
                    onDoFailed: execChunk(onDoFailed, self._onDoUndoFailed.bind(self)),
                    onDoFailed: execChunk(onUndoFailed, self._onDoUndoFailed.bind(self))
                });

            if (this._doing) {
                this._pendingCommands.push(command);
                return true;
            }

            this._doing = true;
            command.executeAsync();

            this._onExecuting();
            return true;
        },

        undoAsync: function () {
            if (this.canUndo()) {
                this._doing = true;
                this._commands[this._position].undoAsync();
                this._onExecuting();
            }
        },

        redoAsync: function () {
            if (this.canRedo()) {
                this._doing = true;
                this._redoing = true;

                this._commands[this._position + 1].redoAsync();
                this._onExecuting();
            }
        },

        clear: function () {
            this._commands.length = 0;
            this._position = -1;
        },

        _onExecuting: function () {
        },

        _onDone: function (command) {
            if (!this._redoing) {
                this._clearRedo();
                this._commands.push(command);
            }

            this._position++;

            if (this._pendingCommands.length > 0) {
                var cmd = this._pendingCommands.shift();
                cmd.executeAsync();
                this._onExecuting();
            }
            else {
                this._doing = false;
                this._redoing = false;
            }
        },

        _onUndone: function (command) {
            this._position--;
            this._doing = false;
        },

        _onDoUndoFailed: function (command) {
            this._pendingCommands.splice(0, this._pendingCommands.length);

            this._doing = false;
            this._redoing = false;
        },

        _clearRedo: function () {
            this._commands = this._commands.slice(0, this._position + 1);
        }
    });

    // command that encapsulates its undo command
    jGroupdocs.UndoableCommand = function () {
    };

    $.extend(jGroupdocs.UndoableCommand.prototype, {
        undoCommand: function () {
            throw up;
        }
    });


    // command with async Do and Undo operations
    jGroupdocs.AsyncCommand = function (callbacks) {
        jGroupdocs.UndoableCommand.prototype.constructor.apply(this, arguments);
        this._callbacks = callbacks;
    };

    $.extend(jGroupdocs.AsyncCommand.prototype, jGroupdocs.UndoableCommand.prototype, {
        _callbacks: {
            onDone: null,
            onUndone: null,
            onDoFailed: null,
            onUndoFailed: null,
            onIdsFixedUp: null
        },

        executeAsync: function () {
            throw up;
        },

        undoAsync: function () {
            this.undoCommand().executeAsync();
        },

        redoAsync: function () {
            this.executeAsync();
        },

        _onDone: function (response) {
            if (this._callbacks.onDone)
                this._callbacks.onDone(response);
        },

        _onDoFailed: function (response) {
            if (this._callbacks.onDoFailed)
                this._callbacks.onDoFailed(response);
        },

        _onUndone: function (response) {
            if (this._callbacks.onUndone)
                this._callbacks.onUndone(response);
        },

        _onUndoFailed: function (response) {
            if (this._callbacks.onUndoFailed)
                this._callbacks.onUndoFailed(response);
        }
    });
})(jQuery);