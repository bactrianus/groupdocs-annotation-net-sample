using System;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Web;
using AutoMapper;
using GroupDocs.Annotation.Domain;
using GroupDocs.Annotation.Exception;
using GroupDocs.Annotation.Handler;
using GroupDocs.Annotation.Handler.Input.DataObjects;
using GroupDocs.Annotation.Handler.Input;
using GroupDocs.Demo.Annotation.Mvc.Options;
using GroupDocs.Demo.Annotation.Mvc.SignalR;
using AddReplyResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.AddReplyResult;
using AnnotationInfo = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data.AnnotationInfo;
using AnnotationReplyInfo = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data.AnnotationReplyInfo;
using AnnotationReviewerRights = GroupDocs.Annotation.Domain.AnnotationReviewerRights;
using AnnotationType = GroupDocs.Annotation.Domain.AnnotationType;
using CreateAnnotationResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.CreateAnnotationResult;
using DeleteAnnotationResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DeleteAnnotationResult;
using DeleteReplyResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DeleteReplyResult;
using DocumentType = GroupDocs.Annotation.Domain.DocumentType;
using EditReplyResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.EditReplyResult;
using GetCollaboratorsResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.GetCollaboratorsResult;
using ListAnnotationsResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.ListAnnotationsResult;
using MoveAnnotationResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.MoveAnnotationResult;
using Point = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DataGeometry.Point;
using Rectangle = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DataGeometry.Rectangle;
using ResizeAnnotationResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.ResizeAnnotationResult;
using RestoreRepliesResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.RestoreRepliesResult;
using Result = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Result;
using ReviewerInfo = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data.ReviewerInfo;
using SaveAnnotationTextResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.SaveAnnotationTextResult;
using SetCollaboratorsResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.SetCollaboratorsResult;
using TextFieldInfo = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data.TextFieldInfo;

namespace GroupDocs.Demo.Annotation.Mvc.Service
{
    /// <summary>
    /// Encapsulates methods for annotations management
    /// </summary>
    public class AnnotationService : IAnnotationService
    {
        #region Fields
        private readonly IAnnotationBroadcaster _annotationBroadcaster;
        private readonly IAuthenticationService _authenticationSvc;
        private readonly IUserDataHandler _userSvc;
        private readonly AnnotationImageHandler _annotator;
        private readonly IDocumentDataHandler _documentSvc;
        private readonly IInputDataHandler _fileSvc;
        private string storagePath = AppDomain.CurrentDomain.GetData("DataDirectory").ToString();
        private IMapper _mapper;
        #endregion Fields

        /// <summary>
        /// Initializes a new instance of the AnnotationService class
        /// </summary>
        /// <param name="annotationBroadcaster">The annotation Socket events broadcasting object</param>
        /// <param name="authenticationSvc">The authentication service</param>
        /// <param name="annotator">The annotation management service</param>
        public AnnotationService(IAnnotationBroadcaster annotationBroadcaster, IAuthenticationService authenticationSvc,
            AnnotationImageHandler annotator)
        {
            _annotationBroadcaster = annotationBroadcaster;
            _authenticationSvc = authenticationSvc;
            _userSvc = annotator.GetUserDataHandler();
            _annotator = annotator;
            _documentSvc = annotator.GetDocumentDataHandler();
            _fileSvc = annotator.GetInputDataHandler();
            MapperConfiguration config = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<GroupDocs.Annotation.Domain.Rectangle, Rectangle>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.ReviewerInfo, ReviewerInfo>();
                cfg.CreateMap<ReviewerInfo, GroupDocs.Annotation.Domain.ReviewerInfo>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.AnnotationReplyInfo, AnnotationReplyInfo>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.TextFieldInfo, TextFieldInfo>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.Results.Result, Result>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.Point?, Point>()
                .ForMember(dst => dst.X, opt => opt.MapFrom(src => src.HasValue ? src.Value.X : 0.0))
                .ForMember(dst => dst.Y, opt => opt.MapFrom(src => src.HasValue ? src.Value.Y : 0.0));
                cfg.CreateMap<GroupDocs.Annotation.Domain.AnnotationInfo, AnnotationInfo>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.Results.ListAnnotationsResult, ListAnnotationsResult>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.Results.SetCollaboratorsResult, SetCollaboratorsResult>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.Results.CreateAnnotationResult, CreateAnnotationResult>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.Results.DeleteAnnotationResult, DeleteAnnotationResult>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.Results.AddReplyResult, AddReplyResult>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.Results.DeleteReplyResult, DeleteReplyResult>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.Results.EditReplyResult, EditReplyResult>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.Results.MoveAnnotationResult, MoveAnnotationResult>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.Results.ResizeAnnotationResult, ResizeAnnotationResult>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.Results.SaveAnnotationTextResult, SaveAnnotationTextResult>();
                cfg.CreateMap<GroupDocs.Annotation.Domain.Results.GetCollaboratorsResult, GetCollaboratorsResult>();
            });
            _mapper = config.CreateMapper();
        }

        /// <summary>
        /// Returns a list of annotations for a document
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to get annotations for</param>
        /// <returns>An instance of an object containing information document annotations</returns>
        public ListAnnotationsResult ListAnnotations(string connectionId, string fileId)
        {
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }
            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            var document = GetDocument(fileId, user.Id);
            if(document == null)
            {
                _documentSvc.Add(new Document
                {
                    OwnerId = user.Id,
                    Name = fileId,
                    CreatedOn = DateTime.Now,
                    Guid = Guid.NewGuid().ToString()
                });
                document = _documentSvc.GetDocument(fileId);
            }
            var result = _annotator.GetAnnotations(document.Id, null, user.Id);
            return _mapper.Map<ListAnnotationsResult>(result);
        }

        /// <summary>
        /// Creates a new annotation for a document
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to create the annotation for</param>
        /// <param name="type">The annotation type</param>
        /// <param name="message">The annotation text message</param>
        /// <param name="rectangle">The annotation bounds</param>
        /// <param name="pageNumber">The document page number to create the annotation at</param>
        /// <param name="annotationPosition">The annotation left-top position</param>
        /// <param name="svgPath">The annotation SVG path</param>
        /// <param name="options">The annotation drawing options (pen color, width etc.)</param>
        /// <param name="font">The annotation text font</param>
        /// <returns>An instance of an object containing information about a created annotation</returns>
        public CreateAnnotationResult CreateAnnotation(string connectionId, string fileId, byte type, string message,
            Rectangle rectangle, int pageNumber, Point annotationPosition, string svgPath, DrawingOptions options, FontOptions font)
        {
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }

            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            var document = GetDocument(fileId, user.Id);
            var collaboratorsInfo = _mapper.Map<GetCollaboratorsResult>(_annotator.GetCollaborators(document.Id));
            var caller = collaboratorsInfo.Collaborators.FirstOrDefault(c => c.Guid == reviewer.Value.UserGuid);

            var annotation = new GroupDocs.Annotation.Domain.AnnotationInfo
            {
                Type = (AnnotationType) type,
                Box = new GroupDocs.Annotation.Domain.Rectangle(rectangle.X, rectangle.Y, rectangle.Width, rectangle.Height),
                PageNumber = pageNumber,
                AnnotationPosition = new GroupDocs.Annotation.Domain.Point(annotationPosition.X, annotationPosition.Y),
                SvgPath = svgPath,
                PenColor = options?.PenColor,
                PenWidth = options?.PenWidth,
                PenStyle = options != null ? (byte?) options.DashStyle : null,
                BackgroundColor = options?.BrushColor,
                FontFamily = font?.Family,
                FontSize = font?.Size
            };

            if(!string.IsNullOrWhiteSpace(message))
            {
                annotation.Replies = new[] { new GroupDocs.Annotation.Domain.AnnotationReplyInfo { Message = message } };
            }

            var result = _annotator.CreateAnnotation(annotation, document.Id, user.Id);

            _annotationBroadcaster.CreateAnnotation(
                collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(),
                connectionId,
                reviewer.Value.UserGuid,
                caller != null ? caller.PrimaryEmail : _authenticationSvc.AnonymousUserName,
                fileId,
                annotation.Type,
                result.Guid,
                (byte) result.Access,
                result.ReplyGuid,
                pageNumber,
                _mapper.Map<Rectangle>(rectangle),
                annotationPosition,
                svgPath,
                options,
                font);

            return _mapper.Map<CreateAnnotationResult>(result);
        }

        /// <summary>
        /// Removes an annotation from a document
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to remove the annotation from</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <returns>An instance of an object containing the removed annotation metadata</returns>
        public DeleteAnnotationResult DeleteAnnotation(string connectionId, string fileId, string annotationGuid)
        {
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }

            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            var document = GetDocument(fileId, user.Id);
            var collaboratorsInfo = _mapper.Map<GetCollaboratorsResult>(_annotator.GetCollaborators(document.Id));

            var annotation = _annotator.GetAnnotation(annotationGuid, document.Id, user.Id);

            var result = _annotator.DeleteAnnotation(annotation.Id, document.Id, user.Id);
            _annotationBroadcaster.DeleteAnnotation(collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(), fileId, connectionId, annotationGuid);

            return _mapper.Map<DeleteAnnotationResult>(result);
        }

        /// <summary>
        /// Adds a reply to an annotation
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to add the reply to</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="message">The reply text</param>
        /// <param name="parentReplyGuid">The parent reply global unique identifier</param>
        /// <returns>An instance of an object containing the the added reply metadata</returns>
        public AddReplyResult AddAnnotationReply(string connectionId, string fileId, string annotationGuid, string message, string parentReplyGuid)
        {
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }

            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            var document = GetDocument(fileId, user.Id);
            var annotation = _annotator.GetAnnotation(annotationGuid, document.Id, user.Id);
            var collaboratorsInfo = _annotator.GetCollaborators(document.Id);

            var caller = collaboratorsInfo.Collaborators.FirstOrDefault(c => c.Guid == reviewer.Value.UserGuid);
            var callerName = caller != null && (!string.IsNullOrEmpty(caller.FirstName) || !string.IsNullOrEmpty(caller.LastName)) ?
                string.Format("{0} {1}", caller.FirstName ?? string.Empty, caller.LastName ?? string.Empty).Trim() :
                _authenticationSvc.AnonymousUserName;

            var result = _annotator.CreateAnnotationReply(annotation.Id, message, parentReplyGuid, document.Id, user.Id);
            _annotationBroadcaster.AddAnnotationReply(collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(),
                connectionId, reviewer.Value.UserGuid, callerName, annotationGuid,
                result.ReplyGuid, parentReplyGuid,
                result.ReplyDateTime, message);
            return _mapper.Map<AddReplyResult>(result);
        }

        /// <summary>
        /// Removes a reply from an annotation
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to remove the reply from</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="replyGuid">The reply global unique identifier</param>
        /// <returns>An instance of an object containing information about the removed reply</returns>
        public DeleteReplyResult DeleteAnnotationReply(string connectionId, string fileId, string annotationGuid, string replyGuid)
        {
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }
            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            var document = GetDocument(fileId, user.Id);
            var collaboratorsInfo = _annotator.GetCollaborators(document.Id);

            var result = _annotator.DeleteAnnotationReply(replyGuid, document.Id, user.Id);
            _annotationBroadcaster.DeleteAnnotationReply(collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(), connectionId, annotationGuid, replyGuid, _mapper.Map<AnnotationReplyInfo[]>(result.Replies));

            return _mapper.Map<DeleteReplyResult>(result);
        }

        /// <summary>
        /// Updates a reply text
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to update the reply text for</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="replyGuid">The reply global unique identifier</param>
        /// <param name="message">The text message to update</param>
        /// <returns>An instance of an object containing the operation result</returns>
        public EditReplyResult EditAnnotationReply(string connectionId, string fileId, string annotationGuid, string replyGuid, string message)
        {
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }
            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            var document = GetDocument(fileId, user.Id);
            var collaboratorsInfo = _annotator.GetCollaborators(document.Id);

            var result = _annotator.EditAnnotationReply(replyGuid, message, document.Id, user.Id);
            _annotationBroadcaster.EditAnnotationReply(collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(), connectionId, annotationGuid, replyGuid, message);

            return _mapper.Map<EditReplyResult>(result);
        }


        /// <summary>
        /// Restores a hierarchy of annotation replies
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to update the reply text for</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="replies">The list of annotation replies to restore</param>
        /// <returns>An instance of an object containing the operation result</returns>
        public RestoreRepliesResult RestoreAnnotationReplies(string connectionId, string fileId, string annotationGuid, AnnotationReplyInfo[] replies)
        {
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }
            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            var document = GetDocument(fileId, user.Id);

            _annotator.CheckReviewerPermissions(user.Id, document.Id, AnnotationReviewerRights.CanAnnotate);

            if(replies == null || replies.Length == 0)
            {
                return new RestoreRepliesResult { AnnotationGuid = annotationGuid, ReplyIds = new string[0] };
            }

            var idsMap = new StringDictionary();
            var result = new RestoreRepliesResult { AnnotationGuid = annotationGuid, ReplyIds = new string[replies.Length] };
            var annotation = _mapper.Map<CreateAnnotationResult>(_annotator.GetAnnotation(annotationGuid, document.Id, user.Id));

            for(var i = 0; i < replies.Length; i++)
            {
                var r = replies[i];
                var parentGuid = (!string.IsNullOrEmpty(r.ParentReplyGuid) && idsMap.ContainsKey(r.ParentReplyGuid) ?
                    idsMap[r.ParentReplyGuid] : r.ParentReplyGuid);
                var replyResult = _annotator.CreateAnnotationReply(annotation.Id, r.Message, parentGuid, document.Id, user.Id);

                idsMap[r.Guid] = replyResult.ReplyGuid;
                result.ReplyIds[i] = replyResult.ReplyGuid;
            }

            return result;
        }

        /// <summary>
        /// Resisizes the annotation
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to resize the annotation for</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="width">The new width of the annotation</param>
        /// <param name="height">The new height of the annotation</param>
        /// <returns>An instance of an object containing the operation result</returns>
        public ResizeAnnotationResult ResizeAnnotation(string connectionId, string fileId, string annotationGuid, double width, double height)
        {
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }
            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            var document = GetDocument(fileId, user.Id);
            var collaboratorsInfo = _annotator.GetCollaborators(document.Id);

            var annotation = _annotator.GetAnnotation(annotationGuid, document.Id, user.Id);
            var result = _annotator.ResizeAnnotation(annotation.Id, new AnnotationSizeInfo { Width = width, Height = height }, document.Id, user.Id);

            _annotationBroadcaster.ResizeAnnotation(collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(), fileId, connectionId, annotationGuid, width, height);

            return _mapper.Map<ResizeAnnotationResult>(result);
        }

        /// <summary>
        /// Moves the annotation marker to a new position
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to move the annotation marker for</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="left">The X coordinate of the annotation</param>
        /// <param name="top">The Y coordinate of the annotation</param>
        /// <param name="pageNumber">The document page number to move the annotation to</param>
        /// <returns>An instance of an object containing the operation result and annotation metadata</returns>
        public MoveAnnotationResult MoveAnnotationMarker(string connectionId, string fileId, string annotationGuid, double left, double top, int? pageNumber)
        {
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }
            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            var document = GetDocument(fileId, user.Id);
            var collaboratorsInfo = _annotator.GetCollaborators(document.Id);

            var annotation = _annotator.GetAnnotation(annotationGuid, document.Id, user.Id);
            var position = new Point { X = left, Y = top };
            var result = _annotator.MoveAnnotationMarker(annotation.Id, new GroupDocs.Annotation.Domain.Point(position.X, position.Y), pageNumber, document.Id, user.Id);

            _annotationBroadcaster.MoveAnnotationMarker(collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(), connectionId, annotationGuid, position, pageNumber);

            return _mapper.Map<MoveAnnotationResult>(result);
        }

        /// <summary>
        /// Updates the text field information
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to update the text field information for</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="text">The text of the annotation</param>
        /// <param name="fontFamily">The font family used to render the text</param>
        /// <param name="fontSize">The font size used to render the text</param>
        /// <returns>An instance of an object containing the operation result</returns>
        public SaveAnnotationTextResult SaveTextField(string connectionId, string fileId, string annotationGuid, string text, string fontFamily, double fontSize)
        {
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }
            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            var document = GetDocument(fileId, user.Id);
            var collaboratorsInfo = _annotator.GetCollaborators(document.Id);

            var annotation = _annotator.GetAnnotation(annotationGuid, document.Id, user.Id);
            var result = _annotator.SaveTextField(annotation.Id, new GroupDocs.Annotation.Domain.TextFieldInfo { FieldText = text, FontFamily = fontFamily, FontSize = fontSize }, document.Id, user.Id);

            _annotationBroadcaster.UpdateTextField(collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(), connectionId, annotationGuid, text, fontFamily, fontSize);

            return _mapper.Map<SaveAnnotationTextResult>(result);
        }

        /// <summary>
        /// Updates the text field color
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to update the text field color for</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="fontColor">The font color of the text</param>
        /// <returns>An instance of an object containing the operation result</returns>
        public SaveAnnotationTextResult SetTextFieldColor(string connectionId, string fileId, string annotationGuid, int fontColor)
        {
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }
            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            var document = GetDocument(fileId, user.Id);
            var collaboratorsInfo = _annotator.GetCollaborators(document.Id);

            var annotation = _annotator.GetAnnotation(annotationGuid, document.Id, user.Id);
            var result = _annotator.SetTextFieldColor(annotation.Id, fontColor, document.Id, user.Id);

            _annotationBroadcaster.SetTextFieldColor(collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(), fileId, connectionId, annotationGuid, fontColor);

            return _mapper.Map<SaveAnnotationTextResult>(result);
        }

        /// <summary>
        /// Updates the background color of the annotation
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to update the background color for</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="color">The background color of the annotation</param>
        /// <returns>An instance of an object containing the operation result</returns>
        public SaveAnnotationTextResult SetAnnotationBackgroundColor(string connectionId, string fileId, string annotationGuid, int color)
        {
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }
            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            var document = GetDocument(fileId, user.Id);
            var collaboratorsInfo = _annotator.GetCollaborators(document.Id);

            var annotation = _annotator.GetAnnotation(annotationGuid, document.Id, user.Id);
            var result = _annotator.SetAnnotationBackgroundColor(annotation.Id, color, document.Id, user.Id);

            _annotationBroadcaster.SetAnnotationBackgroundColor(collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(), fileId, connectionId, annotationGuid, color);

            return _mapper.Map<SaveAnnotationTextResult>(result);
        }

        /// <summary>
        /// Adds document collaborator
        /// </summary>
        /// <param name="fileId">The document path to add the collaborator to</param>
        /// <param name="reviewerEmail">The email address of the collaborator</param>
        /// <param name="reviewerFirstName">The first name of the collaborator</param>
        /// <param name="reviewerLastName">The last name of the collaborator</param>
        /// <param name="reviewerInvitationMessage">The invitation text message to be sent to the collaborator</param>
        /// <param name="avatar">The file stream of the collaborator's avatar</param>
        /// <returns>An instance of an object containing the operation result and collaborators details</returns>
        public SetCollaboratorsResult AddCollaborator(string fileId, string reviewerEmail, string reviewerFirstName, string reviewerLastName, string reviewerInvitationMessage, Stream avatar = null)
        {
            return AddCollaborator(fileId, reviewerEmail, reviewerFirstName, reviewerLastName, reviewerInvitationMessage, AnnotationReviewerRights.All, avatar);
        }

        /// <summary>
        /// Adds document collaborator
        /// </summary>
        /// <param name="fileId">The document path to add the collaborator to</param>
        /// <param name="reviewerEmail">The email address of the collaborator</param>
        /// <param name="reviewerFirstName">The first name of the collaborator</param>
        /// <param name="reviewerLastName">The last name of the collaborator</param>
        /// <param name="reviewerInvitationMessage">The invitation text message to be sent to the collaborator</param>
        /// <param name="rights">The annotation permissions for the collaborator</param>
        /// <param name="avatar">The file stream of the collaborator's avatar</param>
        /// <returns>An instance of an object containing the operation result and collaborators details</returns>
        public SetCollaboratorsResult AddCollaborator(string fileId, string reviewerEmail, string reviewerFirstName, string reviewerLastName, string reviewerInvitationMessage, AnnotationReviewerRights rights, Stream avatar = null)
        {
            MemoryStream memoryStream = (MemoryStream) avatar;
            var reviewer = new GroupDocs.Annotation.Domain.ReviewerInfo
            {
                PrimaryEmail = reviewerEmail,
                FirstName = reviewerFirstName,
                LastName = reviewerLastName,
                AccessRights = rights,
                Avatar = memoryStream?.ToArray() ?? new byte[0]
            };
            User user = _userSvc.GetUserByEmail(reviewerEmail);
            if(user == null)
            {
                _userSvc.Add(new User
                {
                    Email = reviewer.PrimaryEmail,
                    Guid = Guid.NewGuid().ToString(),
                    Photo = reviewer.Avatar,
                    FirstName = reviewer.FirstName,
                    LastName = reviewer.LastName
                });
                user = _userSvc.GetUserByEmail(reviewerEmail);
            }
            var document = GetDocument(fileId, user.Id);
            var result = _mapper.Map<SetCollaboratorsResult>(_annotator.AddCollaborator(document.Id, reviewer));
            return result;
        }

        /// <summary>
        /// Removes the document collaborator
        /// </summary>
        /// <param name="fileId">The document path to remove the collaborator from</param>
        /// <param name="reviewerEmail">The email address of the collaborator</param>
        /// <returns>An instance of an object containing the operation result and collaborators details</returns>
        public SetCollaboratorsResult DeleteCollaborator(string fileId, string reviewerEmail)
        {
            var document = _documentSvc.GetDocument(fileId);
            var result = _mapper.Map<SetCollaboratorsResult>(_annotator.DeleteCollaborator(document.Id, reviewerEmail));
            return result;
        }

        /// <summary>
        /// Returns the document collaborators information
        /// </summary>
        /// <param name="fileId">The document path to get collaborators for</param>
        /// <returns>An instance of an object containing the operation result and collaborators details</returns>
        public GetCollaboratorsResult GetCollaborators(string fileId)
        {
            var document = _documentSvc.GetDocument(fileId);
            return _mapper.Map<GetCollaboratorsResult>(_annotator.GetCollaborators(document.Id));
        }

        /// <summary>
        /// Returns the collaborator's metadata
        /// </summary>
        /// <param name="userId">The collaborator global unique identifier</param>
        /// <returns>An instance of an object containing the collaborator's details</returns>
        public ReviewerInfo GetCollaboratorMetadata(string userId)
        {
            return _mapper.Map<ReviewerInfo>(_annotator.GetCollaboratorMetadata(userId));
        }

        /// <summary>
        /// Returns an annotation document collaborator's metadata
        /// </summary>
        /// <param name="fileId">The document path to get collaborator for</param>
        /// <param name="userName">The collaborator name</param>
        /// <returns>An instance of an object containing the collaborator's details</returns>
        public ReviewerInfo GetDocumentCollaborator(string fileId, string userName)
        {
            var document = _documentSvc.GetDocument(fileId);
            return _mapper.Map<ReviewerInfo>(_annotator.GetDocumentCollaborator(document.Id, userName));
        }

        /// <summary>
        /// Updates a collaborator display color
        /// </summary>
        /// <param name="fileId">The document path to update the collaborator display color for</param>
        /// <param name="userName">The collaborator name</param>
        /// <param name="color">The display color</param>
        /// <returns>An instance of an object containing the collaborator's details</returns>
        public ReviewerInfo SetCollaboratorColor(string fileId, string userName, uint color)
        {
            var document = _documentSvc.GetDocument(fileId);
            var collaborator = _annotator.GetDocumentCollaborator(document.Id, userName);
            collaborator.Color = color;

            var result = _annotator.UpdateCollaborator(document.Id, collaborator);
            var reviewer = result.Collaborators.FirstOrDefault(c => c.PrimaryEmail == userName);

            _annotationBroadcaster.SetReviewersColors(result.Collaborators.Select(c => c.Guid).ToList(), null, _mapper.Map<ReviewerInfo[]>(result.Collaborators));

            return _mapper.Map<ReviewerInfo>(reviewer);
        }

        /// <summary>
        /// Updates collaborator annotation permissions
        /// </summary>
        /// <param name="fileId">The document path to update the collaborator permission for</param>
        /// <param name="userName">The collaborator name</param>
        /// <param name="rights">The collaborator's annotation permissions</param>
        /// <returns>An instance of an object containing the collaborator's details</returns>
        public ReviewerInfo SetCollaboratorRights(string fileId, string userName, AnnotationReviewerRights rights)
        {
            var document = _documentSvc.GetDocument(fileId);
            var collaborator = _annotator.GetDocumentCollaborator(document.Id, userName);
            collaborator.AccessRights = rights;

            var result = _annotator.UpdateCollaborator(document.Id, collaborator);
            _annotationBroadcaster.SetReviewersColors(result.Collaborators.Select(c => c.Guid).ToList(), null, _mapper.Map<ReviewerInfo[]>(result.Collaborators));

            return _mapper.Map<ReviewerInfo>(result.Collaborators.FirstOrDefault(c => c.PrimaryEmail == userName));
        }

        /// <summary>
        /// Updates the document global annotation permissions
        /// </summary>
        /// <param name="fileId">The document path to update the permissions for</param>
        /// <param name="rights">The annotation permissions</param>
        public void SetDocumentAccessRights(string fileId, AnnotationReviewerRights rights)
        {
            var document = _documentSvc.GetDocument(fileId);
            long documentId = document?.Id ?? _annotator.CreateDocument(fileId);
            _annotator.SetDocumentAccessRights(documentId, rights);
        }

        /// <summary>
        /// Removes document annotations
        /// </summary>
        /// <param name="fileId">The document path to remove annotations from</param>
        public void DeleteAnnotations(string fileId)
        {
            var document = _documentSvc.GetDocument(fileId);
            _annotator.DeleteAnnotations(document.Id);
        }

        /// <summary>
        /// Imports annotations from a document into the internal storage
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to import annotations from</param>
        public void ImportAnnotations(string connectionId, string fileId)
        {
            var document = _documentSvc.GetDocument(fileId);
            if(document == null)
            {
                var newDocument = new Document
                {
                    Name = fileId,
                    CreatedOn = DateTime.Now,
                    Guid = Guid.NewGuid().ToString()
                };
                _documentSvc.Add(newDocument);
                document = _documentSvc.GetDocument(fileId);
            }
            long userId = 1;
            if(connectionId == null)
            {
                AddCollaborator(fileId, _authenticationSvc.AnonymousUserName, null, null, null);
            }
            else
            {
                var connectionUser = _annotationBroadcaster.GetConnectionUser(connectionId);
                if(connectionUser == null)
                {
                    throw new AnnotatorException("Connection user is null.");
                }
                var user = _userSvc.GetUserByGuid(connectionUser.Value.UserGuid);
                userId = user.Id;
                _annotator.AddCollaborator(document.Id,
                        new GroupDocs.Annotation.Domain.ReviewerInfo
                        {
                            PrimaryEmail = user.Email,
                            FirstName = user.FirstName,
                            LastName = user.LastName
                        });
            }

            Import(document.Id, fileId, userId);
            CleanDocument(fileId);
        }
        //TODO Clean word document
        private void CleanDocument(string fileId)
        {
            DocumentType docType;

            switch (Path.GetExtension(fileId).ToUpper())
            {
                case ".DOCX":
                    docType = DocumentType.Words;
                    break;
                case ".DOC":
                    docType = DocumentType.Words;
                    break;
                case ".PPTX":
                    docType = DocumentType.Slides;
                    break;
                case ".PPT":
                    docType = DocumentType.Slides;
                    break;
                case ".XLSX":
                    docType = DocumentType.Cells;
                    break;
                case ".XLS":
                    docType = DocumentType.Cells;
                    break;
                default:
                    docType = DocumentType.Pdf;
                    break;
            }
            using (Stream inputDoc = _annotator.GetFile(fileId).Stream)
            {
                SaveCleanDocument(inputDoc, fileId, docType);
            }
        }

        /// <summary>
        /// Exports annotations from the internal storage to the original document
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to export annotations to</param>
        /// <param name="docType">Type of the document.</param>
        /// <returns>
        /// A path to the result file containing exported annotations
        /// </returns>
        public string ExportAnnotations(string connectionId, string fileId, string docType)
        {
            var document = _documentSvc.GetDocument(fileId);
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }
            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            _annotator.CheckReviewerPermissions(user.Id, document.Id, AnnotationReviewerRights.CanExport);
            return Export(document.Id, fileId, user.Id, docType);
        }

        /// <summary>
        /// Converts a document to PDF format
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to convert</param>
        /// <returns>A path to the converted file</returns>
        public string GetAsPdf(string connectionId, string fileId)
        {
            var document = _documentSvc.GetDocument(fileId);
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }
            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            _annotator.CheckReviewerPermissions(user.Id, document.Id, AnnotationReviewerRights.CanDownload);
            //var tempStorage = AppDomain.CurrentDomain.GetData("DataDirectory").ToString();
            var fileName = Path.ChangeExtension(Path.GetRandomFileName(), "pdf");
            using(Stream inputDoc = _annotator.GetPdfFile(fileId).Stream)
            using(var tempDoc = new FileStream(Path.Combine(storagePath, fileName), FileMode.Create))
            {
                inputDoc.Position = 0;
                inputDoc.CopyTo(tempDoc);
                return fileName;
            }
        }

        private Document GetDocument(string fileName, long userId)
        {
            var document = _documentSvc.GetDocument(fileName);
            if(document == null)
            {
                _annotator.CreateDocument(fileName, DocumentType.Pdf, userId);
                var doc = _documentSvc.GetDocument(fileName);
                return doc;
            }
            return document;
        }

        public string Export(long documentId, string fileId, long userId, string format)
        {
            var docType = DocumentType.Pdf;
            string extension = "pdf";
            Stream inputDoc;
            switch (format)
            {
                case "words":
                    docType = DocumentType.Words;
                    extension = "docx";
                    inputDoc = _annotator.GetFile(fileId).Stream;
                    break;
                case "slides":
                    docType = DocumentType.Slides;
                    extension = "pptx";
                    inputDoc = _annotator.GetFile(fileId).Stream;
                    break;
                default:
                    inputDoc = _annotator.GetPdfFile(fileId).Stream;
                    break;
            }
            var resultStream = _annotator.ExportAnnotationsToDocument(documentId, inputDoc, docType, userId);
            inputDoc.Dispose();
            string fileName = string.Format("{0}_WithComments_{1}.{2}",
                Path.GetFileNameWithoutExtension(fileId),
                DateTime.UtcNow.ToString("yyyy-MM-dd HH-mm-ss"),
                extension);
            string tempFilePath = Path.Combine(storagePath, fileName);
            try
            {
                using(var fs = new FileStream(tempFilePath, FileMode.Create))
                {
                    resultStream.Position = 0;
                    resultStream.CopyTo(fs);
                }
            }
            catch(Exception e)
            {
                throw new AnnotatorException("Failed to save output file to the storage.");
            }
            
            return fileName;
        }

        /// <summary>
        /// Import annotations with merge functionality
        /// </summary>
        /// <param name="documentId"></param>
        /// <param name="fileId"></param>
        /// <param name="userId"></param>
        private void Import(long documentId, string fileId, long userId)
        {
            DocumentType docType;
            
            switch (Path.GetExtension(fileId).ToUpper())
            {
                case ".DOCX":
                    docType = DocumentType.Words;
                    break;
                case ".DOC":
                    docType = DocumentType.Words;
                    break;
                case ".PPTX":
                    docType = DocumentType.Slides;
                    break;
                case ".PPT":
                    docType = DocumentType.Slides;
                    break;
                case ".XLSX":
                    docType = DocumentType.Cells;
                    break;
                case ".XLS":
                    docType = DocumentType.Cells;
                    break;
                default:
                    docType = DocumentType.Pdf;
                    break;
            }
            using(Stream inputDoc = _annotator.GetFile(fileId).Stream)
            {
                _annotator.ImportAnnotations(documentId, inputDoc, docType, userId);
            }
        }

        private void SaveCleanDocument(Stream inputDoc, string fileId, DocumentType docType)
        {
            
            Stream resultClean = _annotator.RemoveAnnotationStream(inputDoc, docType);
            resultClean.Seek(0, SeekOrigin.Begin);
            var uploadDir = HttpContext.Current.Server.MapPath("~/App_Data");
            
            var filePath = Path.Combine(uploadDir, fileId);
            
            if(!Directory.Exists(uploadDir))
            {
                Directory.CreateDirectory(uploadDir);
            }
            using(var stream = File.Create(filePath))
            {
                resultClean.Seek(0, SeekOrigin.Begin);
                resultClean.CopyTo(stream);
            }
            inputDoc.Dispose();
            resultClean.Dispose();
        }
    }
}
