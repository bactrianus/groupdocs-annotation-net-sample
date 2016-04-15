(function ($) {
    var setCollaboratorsViewModel = function (options) {
        $.extend(this, options);
        this._create(options);
    };

    $.extend(setCollaboratorsViewModel.prototype, inputTokenizerViewModel.prototype, {
        busy: null,
        invited: null,
        dialogElement: null,

        _create: function (options) {
            this._model = new setCollaboratorsModel(options);
            this.busy = ko.observable(false);
            this.invited = ko.observable(false);
            this.callback = this.setDocumentCollaborators;
            this.getDocumentCollaborators();
            this._init(options);
        },

        _init: function (options) {
            inputTokenizerViewModel.prototype._init.call(this, options);
        },

        feedResults: function (successCallback) {
            $.ui.inputTokenizer.prototype.feedResults.call(this);
            this.successCallback = successCallback;
        },

        reload: function (fileId) {
            this.fileId = fileId;
            this.getDocumentCollaborators(this.fileId);
        },

        getDocumentCollaborators: function () {
            if (this.fileId) {
                this._model.getDocumentCollaborators(this.fileId, function(response) {
                    var newItems = [];
                    $.each(response.data.collaborators, function(index, value) {
                        newItems.push(value.primary_email);
                    });
                    this.setItems(newItems);
                }.bind(this));
            }
        },

        setDocumentCollaborators: function () {
            this.busy(true);
            this._model.setDocumentCollaborators(this.fileId, this.getItems(),
                function (response) {
                    this.busy(false);
                    this.invited(true);
                } .bind(this),
                function (error) {
                    this.busy(false);
                    this.invited(false);
                    jerror(error);
                } .bind(this)
            );
        },

        addOnEnter: function (viewModel, event) {
            this.invited(false);
            return inputTokenizerViewModel.prototype.addOnEnter.call(this, viewModel, event);
        },

        hideDialog: function () {
            this.dialogElement.modal("hide");
        }
    });


    var setCollaboratorsModel = function (options) {
        $.extend(this, options);
        this._init();
    };

    $.extend(setCollaboratorsModel.prototype, inputTokenizerModel.prototype, {
        _init: function () {
            this._portalService = Container.Resolve("PortalService");
        },

        getDocumentCollaborators: function (fileId, successCallback) {
            this._portalService.getDocumentCollaboratorsAsync(this.userId, this.userKey, fileId,
                function (response) {
                    successCallback.apply(this, [response]);
                },
                function (error) {
                    jerror("An error has occurred: " + error.Reason);
                });
        },

        setDocumentCollaborators: function (fileId, collaboratorNames, successCallback, errorCallback) {
            this._portalService.setDocumentCollaboratorsAsync(this.userId, this.userKey, fileId, "1", collaboratorNames,
                function (response) {
                    successCallback.apply(this, [response]);
                } .bind(this),
                function (error) {
                    errorCallback.apply(this, [error.Reason]);
                });
        }

    });

    $.widget("ui.setCollaborators", $.ui.inputTokenizer, {
        _viewModel: null,
        options: {
            fileId: 0,
            userId: 0,
            userKey: null,
            portalService: null,
            boundElements: null,
            dialogElement: null
        },

        _create: function () {
            ko.applyBindings(this.getViewModel(), this.options.dialogElement[0]);
            $.ui.inputTokenizer.prototype._create.call(this);
        },

        getViewModel: function () {
            if (this._viewModel == null) {
                this._viewModel = this._createViewModel();
            }

            return this._viewModel;
        },

        _createViewModel: function () {
            var vm = new setCollaboratorsViewModel(this.options);
            return vm;
        }

    });
})(jQuery);
