using System;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using AutoMapper;
using Groupdocs.Engine.Documents;
using Groupdocs.Web.UI;
using GroupDocs.Annotation;
using GroupDocs.Annotation.Contracts;
using GroupDocs.Annotation.Data.Contracts.DataObjects;
using GroupDocs.Annotation.Data.Contracts.Repositories;
using GroupDocs.Demo.Annotation.WebForms.SignalR;
using GroupDocs.Web.Annotation;
using GroupDocs.Web.Annotation.Options;
using AddReplyResult = GroupDocs.Web.Annotation.AnnotationResults.AddReplyResult;
using AnnotationInfo = GroupDocs.Web.Annotation.AnnotationResults.Data.AnnotationInfo;
using AnnotationReplyInfo = GroupDocs.Web.Annotation.AnnotationResults.Data.AnnotationReplyInfo;
using AnnotationReviewerRights = GroupDocs.Annotation.Contracts.AnnotationReviewerRights;
using AnnotationType = GroupDocs.Annotation.Contracts.AnnotationType;
using CreateAnnotationResult = GroupDocs.Web.Annotation.AnnotationResults.CreateAnnotationResult;
using DeleteAnnotationResult = GroupDocs.Web.Annotation.AnnotationResults.DeleteAnnotationResult;
using DeleteReplyResult = GroupDocs.Web.Annotation.AnnotationResults.DeleteReplyResult;
using DocumentType = GroupDocs.Annotation.Contracts.DocumentType;
using EditReplyResult = GroupDocs.Web.Annotation.AnnotationResults.EditReplyResult;
using FileType = Groupdocs.Common.FileType;
using GetCollaboratorsResult = GroupDocs.Web.Annotation.AnnotationResults.GetCollaboratorsResult;
using ListAnnotationsResult = GroupDocs.Web.Annotation.AnnotationResults.ListAnnotationsResult;
using MoveAnnotationResult = GroupDocs.Web.Annotation.AnnotationResults.MoveAnnotationResult;
using Point = GroupDocs.Web.Annotation.AnnotationResults.DataGeometry.Point;
using Rectangle = GroupDocs.Web.Annotation.AnnotationResults.DataGeometry.Rectangle;
using ResizeAnnotationResult = GroupDocs.Web.Annotation.AnnotationResults.ResizeAnnotationResult;
using RestoreRepliesResult = GroupDocs.Web.Annotation.AnnotationResults.RestoreRepliesResult;
using Result = GroupDocs.Web.Annotation.AnnotationResults.Result;
using ReviewerInfo = GroupDocs.Web.Annotation.AnnotationResults.Data.ReviewerInfo;
using SaveAnnotationTextResult = GroupDocs.Web.Annotation.AnnotationResults.SaveAnnotationTextResult;
using SetCollaboratorsResult = GroupDocs.Web.Annotation.AnnotationResults.SetCollaboratorsResult;
using TextFieldInfo = GroupDocs.Web.Annotation.AnnotationResults.Data.TextFieldInfo;

namespace GroupDocs.Demo.Annotation.WebForms.Service
{
    /// <summary>
    /// Encapsulates methods for annotations management
    /// </summary>
    public class AnnotationService : IAnnotationService
    {
        #region Fields
        private readonly IAnnotationBroadcaster _annotationBroadcaster;
        private readonly IAuthenticationService _authenticationSvc;
        private readonly IUserRepository _userSvc;
        private readonly IAnnotator _annotator;
        private readonly IDocumentRepository _documentSvc;
        #endregion Fields

        /// <summary>
        /// Initializes a new instance of the AnnotationService class
        /// </summary>
        /// <param name="annotationBroadcaster">The annotation Socket events broadcasting object</param>
        /// <param name="authenticationSvc">The authentication service</param>
        /// <param name="userSvc">The user management service</param>
        /// <param name="annotator">The annotation management service</param>
        /// <param name="documentSvc">The document management service</param>
        public AnnotationService(IAnnotationBroadcaster annotationBroadcaster, IAuthenticationService authenticationSvc, IUserRepository userSvc,
            IAnnotator annotator, IDocumentRepository documentSvc)
        {
            _annotationBroadcaster = annotationBroadcaster;
            _authenticationSvc = authenticationSvc;
            _userSvc = userSvc;
            _annotator = annotator;
            _documentSvc = documentSvc;
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Results.Result, Result>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Point?, Point>()
                .ForMember(dst => dst.X, opt => opt.MapFrom(src => src.HasValue ? src.Value.X : 0.0))
                .ForMember(dst => dst.Y, opt => opt.MapFrom(src => src.HasValue ? src.Value.Y : 0.0));
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Rectangle, Rectangle>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.ReviewerInfo, ReviewerInfo>();
            Mapper.CreateMap<ReviewerInfo, GroupDocs.Annotation.Contracts.ReviewerInfo>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.AnnotationReplyInfo, AnnotationReplyInfo>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.TextFieldInfo, TextFieldInfo>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.AnnotationInfo, AnnotationInfo>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Results.ListAnnotationsResult, ListAnnotationsResult>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Results.SetCollaboratorsResult, SetCollaboratorsResult>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Results.CreateAnnotationResult, CreateAnnotationResult>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Results.DeleteAnnotationResult, DeleteAnnotationResult>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Results.AddReplyResult, AddReplyResult>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Results.DeleteReplyResult, DeleteReplyResult>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Results.EditReplyResult, EditReplyResult>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Results.MoveAnnotationResult, MoveAnnotationResult>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Results.ResizeAnnotationResult, ResizeAnnotationResult>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Results.SaveAnnotationTextResult, SaveAnnotationTextResult>();
            Mapper.CreateMap<GroupDocs.Annotation.Contracts.Results.GetCollaboratorsResult, GetCollaboratorsResult>();
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

            return Mapper.Map<ListAnnotationsResult>(_annotator.GetAnnotations(document.Id, null, user.Id));
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
            var collaboratorsInfo = Mapper.Map<GetCollaboratorsResult>(_annotator.GetCollaborators(document.Id));
            var caller = collaboratorsInfo.Collaborators.FirstOrDefault(c => c.Guid == reviewer.Value.UserGuid);

            var annotation = new GroupDocs.Annotation.Contracts.AnnotationInfo
            {
                Type = (AnnotationType) type,
                Box = new GroupDocs.Annotation.Contracts.Rectangle(rectangle.X, rectangle.Y, rectangle.Width, rectangle.Height),
                PageNumber = pageNumber,
                AnnotationPosition = new GroupDocs.Annotation.Contracts.Point(annotationPosition.X, annotationPosition.Y),
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
                annotation.Replies = new[] { new GroupDocs.Annotation.Contracts.AnnotationReplyInfo { Message = message } };
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
                Mapper.Map<Rectangle>(rectangle),
                annotationPosition,
                svgPath,
                options,
                font);

            return Mapper.Map<CreateAnnotationResult>(result);
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
            var collaboratorsInfo = Mapper.Map<GetCollaboratorsResult>(_annotator.GetCollaborators(document.Id));

            var annotation = _annotator.GetAnnotation(annotationGuid, document.Id, user.Id);

            var result = _annotator.DeleteAnnotation(annotation.Id, document.Id, user.Id);
            _annotationBroadcaster.DeleteAnnotation(collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(), fileId, connectionId, annotationGuid);

            return Mapper.Map<DeleteAnnotationResult>(result);
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
            return Mapper.Map<AddReplyResult>(result);
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
            _annotationBroadcaster.DeleteAnnotationReply(collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(), connectionId, annotationGuid, replyGuid, Mapper.Map<AnnotationReplyInfo[]>(result.Replies));

            return Mapper.Map<DeleteReplyResult>(result);
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

            return Mapper.Map<EditReplyResult>(result);
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
            var annotation = Mapper.Map<CreateAnnotationResult>(_annotator.GetAnnotation(annotationGuid, document.Id, user.Id));

            for(var i = 0; i < replies.Length; i++)
            {
                var r = replies[i];
                var parentGuid = (!string.IsNullOrEmpty(r.ParentReplyGuid) && idsMap.ContainsKey(r.ParentReplyGuid) ?
                    idsMap[r.ParentReplyGuid] : r.ParentReplyGuid);
                var replyUser = _userSvc.GetUserByGuid(r.UserGuid);
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

            return Mapper.Map<ResizeAnnotationResult>(result);
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
            var result = _annotator.MoveAnnotationMarker(annotation.Id, new GroupDocs.Annotation.Contracts.Point(position.X, position.Y), pageNumber, document.Id, user.Id);

            _annotationBroadcaster.MoveAnnotationMarker(collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(), connectionId, annotationGuid, position, pageNumber);

            return Mapper.Map<MoveAnnotationResult>(result);
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
            var result = _annotator.SaveTextField(annotation.Id, new GroupDocs.Annotation.Contracts.TextFieldInfo { FieldText = text, FontFamily = fontFamily, FontSize = fontSize }, document.Id, user.Id);

            _annotationBroadcaster.UpdateTextField(collaboratorsInfo.Collaborators.Select(c => c.Guid).ToList(), connectionId, annotationGuid, text, fontFamily, fontSize);

            return Mapper.Map<SaveAnnotationTextResult>(result);
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

            return Mapper.Map<SaveAnnotationTextResult>(result);
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

            return Mapper.Map<SaveAnnotationTextResult>(result);
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
            var image = (byte[]) null;
            if(avatar != null)
            {
                using(var img = Groupdocs.Auxiliary.JpegHelper.ResizeImage(avatar, 32, 32, true, false, null, null))
                using(var ms = new MemoryStream())
                {
                    img.Save(ms, System.Drawing.Imaging.ImageFormat.Jpeg);
                    image = ms.ToArray();
                }
            }
            var reviewer = new GroupDocs.Annotation.Contracts.ReviewerInfo { PrimaryEmail = reviewerEmail, FirstName = reviewerFirstName, LastName = reviewerLastName, AccessRights = rights, Avatar = image };
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
            var result = Mapper.Map<SetCollaboratorsResult>(_annotator.AddCollaborator(document.Id, reviewer));
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
            var result = Mapper.Map<SetCollaboratorsResult>(_annotator.DeleteCollaborator(document.Id, reviewerEmail));
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
            return Mapper.Map<GetCollaboratorsResult>(_annotator.GetCollaborators(document.Id));
        }

        /// <summary>
        /// Returns the collaborator's metadata
        /// </summary>
        /// <param name="userId">The collaborator global unique identifier</param>
        /// <returns>An instance of an object containing the collaborator's details</returns>
        public ReviewerInfo GetCollaboratorMetadata(string userId)
        {
            return Mapper.Map<ReviewerInfo>(_annotator.GetCollaboratorMetadata(userId));
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
            return Mapper.Map<ReviewerInfo>(_annotator.GetDocumentCollaborator(document.Id, userName));
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

            _annotationBroadcaster.SetReviewersColors(result.Collaborators.Select(c => c.Guid).ToList(), null, Mapper.Map<ReviewerInfo[]>(result.Collaborators));

            return Mapper.Map<ReviewerInfo>(reviewer);
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
            _annotationBroadcaster.SetReviewersColors(result.Collaborators.Select(c => c.Guid).ToList(), null, Mapper.Map<ReviewerInfo[]>(result.Collaborators));

            return Mapper.Map<ReviewerInfo>(result.Collaborators.FirstOrDefault(c => c.PrimaryEmail == userName));
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
            long userId = 0;
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
                        new GroupDocs.Annotation.Contracts.ReviewerInfo
                        {
                            PrimaryEmail = user.Email,
                            FirstName = user.FirstName,
                            LastName = user.LastName
                        });
            }

            AnnotationsExporter.Import(document.Id, fileId, userId);
            ImportAnnotationWithCleaning(fileId);
        }

        public void ImportAnnotationWithCleaning(string fileId)
        {

            using(Stream inputDoc = AnnotationsExporter.GetStreamOfDocument(fileId))
            {
                AnnotationsExporter.SaveCleanDocument(inputDoc, fileId);
            }
        }

        /// <summary>
        /// Exports annotations from the internal storage to the original document
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to export annotations to</param>
        /// <param name="outputType">The output document type</param>
        /// <returns>A path to the result file containing exported annotations</returns>
        public string ExportAnnotations(string connectionId, string fileId, DocumentType outputType)
        {
            var document = _documentSvc.GetDocument(fileId);
            var reviewer = _annotationBroadcaster.GetConnectionUser(connectionId);
            if(reviewer == null)
            {
                throw new AnnotatorException("There is no such reviewer.");
            }
            var user = _userSvc.GetUserByGuid(reviewer.Value.UserGuid);
            _annotator.CheckReviewerPermissions(user.Id, document.Id, AnnotationReviewerRights.CanExport);
            return AnnotationsExporter.Perform(document.Id, fileId, user.Id, outputType);
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

            IRootPathFinder pathFinder = new RootPathFinder();
            string storagePath = pathFinder.GetRootStoragePath();
            string filePath = Path.Combine(storagePath, fileId);

            var tempStorage = Groupdocs.Storage.TempFileStorage.Instance;

            using(var inputDoc = DocumentsFactory.CreateDocument(filePath, FileType.Pdf))
            {
                var fileName = Path.ChangeExtension(Path.GetRandomFileName(), "pdf");
                inputDoc.SaveAs(tempStorage.MapFilePath(fileName), FileType.Pdf);
                return fileName;
            }
        }

        private Document GetDocument(string fileName, long userId)
        {
            var document = _documentSvc.GetDocument(fileName);
            if(document == null)
            {
                _annotator.CreateDocument(fileName, DocumentType.Pdf, userId);
                return _documentSvc.GetDocument(fileName);
            }
            return document;
        }
    }
}
