using System;
using System.Collections.Generic;
using System.Linq;
using GroupDocs.Demo.Annotation.Mvc.Options;
using Microsoft.AspNet.SignalR;
using AnnotationInfo = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data.AnnotationInfo;
using AnnotationReplyInfo = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data.AnnotationReplyInfo;
using AnnotationReviewerRights = GroupDocs.Annotation.Domain.AnnotationReviewerRights;
using AnnotationType = GroupDocs.Annotation.Domain.AnnotationType;
using Point = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DataGeometry.Point;
using Rectangle = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DataGeometry.Rectangle;
using ReviewerInfo = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data.ReviewerInfo;

namespace GroupDocs.Demo.Annotation.Mvc.SignalR
{
    public class AnnotationBroadcaster : IAnnotationBroadcaster
    {
        private readonly IAnnotationHub _annotationsHub;

        public AnnotationBroadcaster(IAnnotationHub annotationsHub)
        {
            _annotationsHub = annotationsHub;
        }

        public void CreateAnnotation(IList<string> collaboratorGuids,
                                     string connectionIdToExclude,
                                     string userGuid,
                                     string userName,
                                     string documentGuid,
                                     AnnotationType annotationType,
                                     string annotationGuid,
                                     byte access,
                                     string replyGuid,
                                     int pageNumber,
                                     Rectangle box,
                                     Point? annotationPosition,
                                     string svgPath,
                                     DrawingOptions drawingOptions,
                                     FontOptions font)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids), x =>
                          GetClient(x).createAnnotationOnClient(connectionIdToExclude,
                              new
                              {
                                  userName,
                                  pageNumber,
                                  box,
                                  annotationPosition,
                                  documentGuid,
                                  annotationGuid,
                                  access,
                                  annotationType,
                                  replyGuid,
                                  userGuid,
                                  svgPath,
                                  serverTime = GetJavascriptDateTime(DateTime.UtcNow),
                                  drawingOptions = (drawingOptions != null ? new { penColor = drawingOptions.PenColor, penWidth = drawingOptions.PenWidth, penStyle = drawingOptions.PenStyle, brushColor = drawingOptions.BrushColor } : null),
                                  font = (font != null ? new { family = font.Family, size = font.Size } : null)
                              }));
        }

        public void AddAnnotationReply(IList<string> collaboratorGuids,
                                 string connectionIdToExclude,
                                 string userGuid,
                                 string userName,
                                 string annotationGuid,
                                 string replyGuid,
                                 string parentReplyGuid,
                                 DateTime replyDateTime,
                                 string text)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids), x =>
                          GetClient(x).createReplyOnClient(connectionIdToExclude,
                                        new
                                        {
                                            userName,
                                            annotationGuid,
                                            replyGuid,
                                            userGuid,
                                            parentReplyGuid,
                                            text,
                                            repliedOn = replyDateTime,
                                            serverTime = GetJavascriptDateTime(DateTime.UtcNow)
                                        }));
        }

        public void SetReviewersColors(IList<string> collaboratorGuids, string connectionIdToExclude, ReviewerInfo[] reviewerDescriptions)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids), x =>
                          GetClient(x).setReviewersColorsOnClient(connectionIdToExclude,
                            reviewerDescriptions.Select(r => new { emailAddress = r.PrimaryEmail, color = r.Color }).ToArray()));
        }

        public void SetReviewersRights(IList<string> collaboratorGuids, string connectionIdToExclude, ReviewerInfo[] reviewerDescriptions)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids), x =>
                          GetClient(x).setReviewersRightsOnClient(connectionIdToExclude,
                            reviewerDescriptions.Select(r =>
                                new { guid = r.Guid, emailAddress = r.PrimaryEmail, accessRights = (r.AccessRights ?? AnnotationReviewerRights.All) })
                          .ToArray()));
        }

        public void ResizeAnnotation(IList<string> collaboratorGuids, string documentGuid, string connectionIdToExclude, string annotationGuid, double width, double height)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids, documentGuid), x =>
                          GetClient(x).resizeAnnotationOnClient(connectionIdToExclude, annotationGuid, width, height));
        }

        public void SetTextFieldColor(IList<string> collaboratorGuids, string documentGuid, string connectionIdToExclude, string annotationGuid, int fontColor)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids, documentGuid), x =>
                          GetClient(x).setTextFieldColorOnClient(connectionIdToExclude, annotationGuid, fontColor));
        }

        public void SetAnnotationBackgroundColor(IList<string> collaboratorGuids, string documentGuid, string connectionIdToExclude, string annotationGuid, int color)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids, documentGuid), x =>
                          GetClient(x).setAnnotationBackgroundColorOnClient(connectionIdToExclude, annotationGuid, color));
        }

        public void DeleteAnnotation(IList<string> collaboratorGuids, string documentGuid, string connectionIdToExclude, string annotationGuid)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids, documentGuid), x =>
                          GetClient(x).deleteAnnotationOnClient(connectionIdToExclude, annotationGuid));
        }

        public void SetUserGuidForConnection(string connectionGuid, string userGuid)
        {
            _annotationsHub.SetUserGuidForConnection(connectionGuid, userGuid);
        }

        public DocumentReviewer? GetConnectionUser(string connectionId)
        {
            return _annotationsHub.GetConnectionUser(connectionId);
        }

        public void MoveAnnotationMarker(IList<string> collaboratorGuids, string connectionIdToExclude, string annotationGuid, Point position, int? pageNumber)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids), x =>
                          GetClient(x).moveAnnotationMarkerOnClient(connectionIdToExclude, annotationGuid, position, pageNumber));
        }

        public void DeleteAnnotationReply(IList<string> collaboratorGuids, string connectionIdToExclude, string annotationGuid, string replyGuid, AnnotationReplyInfo[] replies)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids), x =>
                          GetClient(x).deleteAnnotationReplyOnClient(connectionIdToExclude, annotationGuid, replyGuid, replies));
        }

        public void EditAnnotationReply(IList<string> collaboratorGuids, string connectionIdToExclude, string annotationGuid, string replyGuid, string message)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids), x =>
                          GetClient(x).editAnnotationReplyOnClient(connectionIdToExclude, annotationGuid, replyGuid, message));
        }

        public void UpdateTextField(IList<string> collaboratorGuids, string connectionIdToExclude, string annotationGuid,
                                      string text, string fontFamily, double? fontSize)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids), x =>
                          GetClient(x).updateTextFieldOnClient(connectionIdToExclude, annotationGuid, text, fontFamily, fontSize));
        }

        public void SetAnnotationAccess(IList<string> collaboratorGuids, string connectionIdToExclude, string annotationGuid, byte annotationAccess, AnnotationInfo annotation)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids), x =>
                          GetClient(x).setAnnotationAccessOnClient(connectionIdToExclude, annotationGuid, annotationAccess, annotation));
        }

        public void MoveAnnotation(IList<string> collaboratorGuids, string connectionIdToExclude, string annotationGuid, int pageNumber, Point position)
        {
            Array.ForEach(
                _annotationsHub.GetConnectionIdsToCall(connectionIdToExclude, collaboratorGuids), x =>
                          GetClient(x).moveAnnotationOnClient(connectionIdToExclude, annotationGuid, pageNumber, position));
        }

        private dynamic GetClient(string connectionId)
        {
            IHubContext hubContext = GlobalHost.ConnectionManager.GetHubContext<AnnotationHub>();
            return hubContext.Clients.Client(connectionId);
        }

        private long GetJavascriptDateTime(DateTime dateTime)
        {
            DateTime epoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var utcDateTime = dateTime.ToUniversalTime();
            var ts = new TimeSpan(utcDateTime.Ticks - epoch.Ticks);
            return (long) ts.TotalSeconds;
        }
    }
}
