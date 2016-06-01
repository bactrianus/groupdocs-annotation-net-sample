using System.IO;
using GroupDocs.Annotation.Domain;
using GroupDocs.Demo.Annotation.Mvc.AnnotationResults;
using GroupDocs.Demo.Annotation.Mvc.Options;
using AnnotationReplyInfo = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data.AnnotationReplyInfo;
using Point = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DataGeometry.Point;
using Rectangle = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DataGeometry.Rectangle;
using ReviewerInfo = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data.ReviewerInfo;

namespace GroupDocs.Demo.Annotation.Mvc
{
    /// <summary>
    /// Encapsulates methods for annotations management
    /// </summary>
    public interface IAnnotationService
    {
        /// <summary>
        /// Returns a list of annotations for a document
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to get annotations for</param>
        /// <returns>An instance of an object containing information document annotations</returns>
        ListAnnotationsResult ListAnnotations(string connectionId, string fileId);

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
        /// <param name="font">The annotation font options (size and family)</param>
        /// <returns>An instance of an object containing information about a created annotation</returns>
        CreateAnnotationResult CreateAnnotation(string connectionId, string fileId, byte type, string message, Rectangle rectangle, int pageNumber, Point annotationPosition, string svgPath, DrawingOptions options, FontOptions font);

        /// <summary>
        /// Removes an annotation from a document
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to remove the annotation from</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <returns>An instance of an object containing the removed annotation metadata</returns>
        DeleteAnnotationResult DeleteAnnotation(string connectionId, string fileId, string annotationGuid);

        /// <summary>
        /// Adds a reply to an annotation
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to add the reply to</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="message">The reply text</param>
        /// <param name="parentReplyGuid">The parent reply global unique identifier</param>
        /// <returns>An instance of an object containing the the added reply metadata</returns>
        AddReplyResult AddAnnotationReply(string connectionId, string fileId, string annotationGuid, string message, string parentReplyGuid);

        /// <summary>
        /// Removes a reply from an annotation
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to remove the reply from</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="replyGuid">The reply global unique identifier</param>
        /// <returns>An instance of an object containing information about the removed reply</returns>
        DeleteReplyResult DeleteAnnotationReply(string connectionId, string fileId, string annotationGuid, string replyGuid);

        /// <summary>
        /// Updates a reply text
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to update the reply text for</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="replyGuid">The reply global unique identifier</param>
        /// <param name="message">The text message to update</param>
        /// <returns>An instance of an object containing the operation result</returns>
        EditReplyResult EditAnnotationReply(string connectionId, string fileId, string annotationGuid, string replyGuid, string message);

        /// <summary>
        /// Restores a hierarchy of annotation replies
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to update the reply text for</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="replies">The list of annotation replies to restore</param>
        /// <returns>An instance of an object containing the operation result</returns>
        RestoreRepliesResult RestoreAnnotationReplies(string connectionId, string fileId, string annotationGuid, AnnotationReplyInfo[] replies);
        
        /// <summary>
        /// Resisizes the annotation
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to resize the annotation for</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="width">The new width of the annotation</param>
        /// <param name="height">The new height of the annotation</param>
        /// <returns>An instance of an object containing the operation result</returns>
        ResizeAnnotationResult ResizeAnnotation(string connectionId, string fileId, string annotationGuid, double width, double height);

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
        MoveAnnotationResult MoveAnnotationMarker(string connectionId, string fileId, string annotationGuid, double left, double top, int? pageNumber);

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
        SaveAnnotationTextResult SaveTextField(string connectionId, string fileId, string annotationGuid, string text, string fontFamily, double fontSize);

        /// <summary>
        /// Updates the text field color
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to update the text field color for</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="fontColor">The font color of the text</param>
        /// <returns>An instance of an object containing the operation result</returns>
        SaveAnnotationTextResult SetTextFieldColor(string connectionId, string fileId, string annotationGuid, int fontColor);

        /// <summary>
        /// Updates the background color of the annotation
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to update the background color for</param>
        /// <param name="annotationGuid">The annotation global unique identifier</param>
        /// <param name="color">The background color of the annotation</param>
        /// <returns>An instance of an object containing the operation result</returns>
        SaveAnnotationTextResult SetAnnotationBackgroundColor(string connectionId, string fileId, string annotationGuid, int color);

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
        SetCollaboratorsResult AddCollaborator(string fileId, string reviewerEmail, string reviewerFirstName, string reviewerLastName, string reviewerInvitationMessage, AnnotationReviewerRights rights, Stream avatar = null);

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
        SetCollaboratorsResult AddCollaborator(string fileId, string reviewerEmail, string reviewerFirstName, string reviewerLastName, string reviewerInvitationMessage, Stream avatar = null);

        /// <summary>
        /// Removes the document collaborator
        /// </summary>
        /// <param name="fileId">The document path to remove the collaborator from</param>
        /// <param name="reviewerEmail">The email address of the collaborator</param>
        /// <returns>An instance of an object containing the operation result and collaborators details</returns>
        SetCollaboratorsResult DeleteCollaborator(string fileId, string reviewerEmail);

        /// <summary>
        /// Returns the document collaborators information
        /// </summary>
        /// <param name="fileId">The document path to get collaborators for</param>
        /// <returns>An instance of an object containing the operation result and collaborators details</returns>
        GetCollaboratorsResult GetCollaborators(string fileId);

        /// <summary>
        /// Returns the collaborator's metadata
        /// </summary>
        /// <param name="userId">The collaborator global unique identifier</param>
        /// <returns>An instance of an object containing the collaborator's details</returns>
        ReviewerInfo GetCollaboratorMetadata(string userId);

        /// <summary>
        /// Returns an annotation document collaborator's metadata
        /// </summary>
        /// <param name="fileId">The document path to get collaborator for</param>
        /// <param name="userName">The collaborator name</param>
        /// <returns>An instance of an object containing the collaborator's details</returns>
        ReviewerInfo GetDocumentCollaborator(string fileId, string userName);

        /// <summary>
        /// Updates a collaborator display color
        /// </summary>
        /// <param name="fileId">The document path to update the collaborator display color for</param>
        /// <param name="userName">The collaborator name</param>
        /// <param name="color">The display color</param>
        /// <returns>An instance of an object containing the collaborator's details</returns>
        ReviewerInfo SetCollaboratorColor(string fileId, string userName, uint color);

        /// <summary>
        /// Updates collaborator annotation permissions
        /// </summary>
        /// <param name="fileId">The document path to update the collaborator permission for</param>
        /// <param name="userName">The collaborator name</param>
        /// <param name="rights">The collaborator's annotation permissions</param>
        /// <returns>An instance of an object containing the collaborator's details</returns>
        ReviewerInfo SetCollaboratorRights(string fileId, string userName, AnnotationReviewerRights rights);

        /// <summary>
        /// Updates the document global annotation permissions
        /// </summary>
        /// <param name="fileId">The document path to update the permissions for</param>
        /// <param name="rights">The annotation permissions</param>
        void SetDocumentAccessRights(string fileId, AnnotationReviewerRights rights);

        /// <summary>
        /// Removes document annotations
        /// </summary>
        /// <param name="fileId">The document path to remove annotations from</param>
        void DeleteAnnotations(string fileId);

        /// <summary>
        /// Imports annotations from a document into the internal storage
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to import annotations from</param>
        void ImportAnnotations(string connectionId, string fileId);

        /// <summary>
        /// Exports annotations from the internal storage to the original document
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to export annotations to</param>
        /// <returns>A path to the result file containing exported annotations</returns>
        string ExportAnnotations(string connectionId, string fileId);

        /// <summary>
        /// Converts a document to PDF format
        /// </summary>
        /// <param name="connectionId">Socket connection identifier to validate user permissions for</param>
        /// <param name="fileId">The document path to convert</param>
        /// <returns>A path to the converted file</returns>
        string GetAsPdf(string connectionId, string fileId);

    }
}
