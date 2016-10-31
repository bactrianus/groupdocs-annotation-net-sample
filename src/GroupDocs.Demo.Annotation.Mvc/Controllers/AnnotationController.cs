using System;
using System.IO;
using System.Web;
using System.Web.Mvc;
using GroupDocs.Annotation;
using GroupDocs.Annotation.Domain;
using GroupDocs.Annotation.Exception;
using GroupDocs.Annotation.Handler;
using GroupDocs.Annotation.Handler.Input.DataObjects;
using GroupDocs.Demo.Annotation.Mvc.App_Start;
using GroupDocs.Demo.Annotation.Mvc.Options;
using GroupDocs.Demo.Annotation.Mvc.Responses;
using Microsoft.Practices.Unity;
using AnnotationReplyInfo = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data.AnnotationReplyInfo;
using DeleteReplyResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DeleteReplyResult;
using Point = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DataGeometry.Point;
using Rectangle = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DataGeometry.Rectangle;
using RestoreRepliesResult = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.RestoreRepliesResult;

namespace GroupDocs.Demo.Annotation.Mvc.Controllers
{
    public class AnnotationController : Controller
    {
        #region Fields
        private readonly EmbeddedResourceManager _resourceManager;
        private readonly IAnnotationService _annotationSvc;
        #endregion Fields
        
        public AnnotationController(IAnnotationService annotationSvc)
        {
            _resourceManager = new EmbeddedResourceManager();
            _annotationSvc = annotationSvc;
            
            //Here you should apply proper GroupDocs.Annotation license (in case you want to
            //use this sample without trial limits)
            //new License().SetLicense("C:/annotation.net/resources/licenses/GroupDocs.Annotation_26_06_2015.lic");
        }

        #region Annotation members
        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult CreateAnnotation(string connectionId, string userId, string privateKey,
            string fileId, byte type, string message, Rectangle rectangle, int pageNumber, Point annotationPosition, string svgPath,
            DrawingOptions drawingOptions, FontOptions font, string callback = null)
        {
            try
            {
                var result = _annotationSvc.CreateAnnotation(connectionId, fileId, type, message, rectangle, pageNumber, annotationPosition, svgPath, drawingOptions, font);
                return this.JsonOrJsonP(result, callback);
            }
            catch(AnnotatorException e)
            {
                return this.JsonOrJsonP(new FailedResponse { Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult DeleteAnnotation(string connectionId, string userId, string privateKey, string fileId, string annotationGuid, string callback = null)
        {
            try
            {
                var result = _annotationSvc.DeleteAnnotation(connectionId, fileId, annotationGuid);
                return this.JsonOrJsonP(result, callback);
            }
            catch(AnnotatorException e)
            {
                return this.JsonOrJsonP(new FailedResponse { Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult AddAnnotationReply(string connectionId, string userId, string privateKey, string fileId, string annotationGuid, string message, string parentReplyGuid, string callback = null)
        {
            try
            {
                var result = _annotationSvc.AddAnnotationReply(connectionId, fileId, annotationGuid, message, parentReplyGuid);
                return this.JsonOrJsonP(result, callback);
            }
            catch(AnnotatorException e)
            {
                return this.JsonOrJsonP(new FailedResponse { Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult DeleteAnnotationReply(string connectionId, string userId, string privateKey, string fileId, string annotationGuid, string replyGuid, string callback = null)
        {
            try
            {
                DeleteReplyResult result = _annotationSvc.DeleteAnnotationReply(connectionId, fileId, annotationGuid, replyGuid);
                return this.JsonOrJsonP(result, callback);
            }
            catch(AnnotatorException e)
            {
                return this.JsonOrJsonP(new FailedResponse { Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult EditAnnotationReply(string connectionId, string userId, string privateKey, string fileId, string annotationGuid, string replyGuid, string message, string callback = null)
        {
            try
            {
                var result = _annotationSvc.EditAnnotationReply(connectionId, fileId, annotationGuid, replyGuid, message);
                return this.JsonOrJsonP(result, callback);
            }
            catch(AnnotatorException e)
            {
                return this.JsonOrJsonP(new FailedResponse { Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult RestoreAnnotationReplies(string connectionId, string fileId, string annotationGuid, AnnotationReplyInfo[] replies, string callback = null)
        {
            try
            {
                var result = (replies == null || replies.Length == 0 ?
                    new RestoreRepliesResult { AnnotationGuid = annotationGuid, ReplyIds = new string[0] } :
                    _annotationSvc.RestoreAnnotationReplies(connectionId, fileId, annotationGuid, replies));
                return this.JsonOrJsonP(result, callback);
            }
            catch(AnnotatorException e)
            {
                return this.JsonOrJsonP(new FailedResponse { Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult ListAnnotations(string connectionId, string userId, string privateKey, string fileId, string callback = null)
        {
            try
            {
                var result = _annotationSvc.ListAnnotations(connectionId, fileId);
                return this.JsonOrJsonP(result, callback);
            }
            catch(AnnotatorException e)
            {
                return this.JsonOrJsonP(new FailedResponse { Reason = e.Message }, callback);
            }
        }
        
        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult ResizeAnnotation(string connectionId, string fileId, string annotationGuid, double width, double height, string callback = null)
        {
            try
            {
                var result = _annotationSvc.ResizeAnnotation(connectionId, fileId, annotationGuid, width, height);
                return this.JsonOrJsonP(result, callback);
            }
            catch(AnnotatorException e)
            {
                return this.JsonOrJsonP(new FailedResponse { Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult MoveAnnotationMarker(string connectionId, string userId, string privateKey, string fileId,
                                                 string annotationGuid, double left, double top, int? pageNumber, string callback = null)
        {
            try
            {
                var result = _annotationSvc.MoveAnnotationMarker(connectionId, fileId, annotationGuid, left, top, pageNumber);
                return this.JsonOrJsonP(result, callback);
            }
            catch(AnnotatorException e)
            {
                return this.JsonOrJsonP(new FailedResponse { Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult SaveTextField(string connectionId, string userId, string privateKey, string fileId,
                                                       string annotationGuid, string text, string fontFamily, double fontSize, string callback = null)
        {
            try
            {
                var result = _annotationSvc.SaveTextField(connectionId, fileId, annotationGuid, text, fontFamily, fontSize);
                return this.JsonOrJsonP(result, callback);
            }
            catch(AnnotatorException e)
            {
                return this.JsonOrJsonP(new FailedResponse { Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult SetTextFieldColor(string connectionId, string fileId, string annotationGuid, int fontColor, string callback = null)
        {
            try
            {
                var result = _annotationSvc.SetTextFieldColor(connectionId, fileId, annotationGuid, fontColor);
                return this.JsonOrJsonP(new FailedResponse { success = true }, callback);
            }
            catch(AnnotatorException e)
            {
                return this.JsonOrJsonP(new FailedResponse { Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult SetAnnotationBackgroundColor(string connectionId, string fileId, string annotationGuid, int color, string callback = null)
        {
            try
            {
                var result = _annotationSvc.SetAnnotationBackgroundColor(connectionId, fileId, annotationGuid, color);
                return this.JsonOrJsonP(new FailedResponse { success = true }, callback);
            }
            catch(AnnotatorException e)
            {
                return this.JsonOrJsonP(new FailedResponse { Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult GetDocumentCollaborators(string userId, string privateKey, string fileId, string callback = null)
        {
            var result = _annotationSvc.GetCollaborators(fileId);
            return this.JsonOrJsonP(result, callback);
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult AddDocumentReviewer(string userId, string privateKey,
            string fileId, string reviewerEmail, string reviewerFirstName, string reviewerLastName, string reviewerInvitationMessage, string callback = null)
        {
            var result = _annotationSvc.AddCollaborator(fileId, reviewerEmail, reviewerFirstName, reviewerLastName, reviewerInvitationMessage);
            return this.JsonOrJsonP(result, callback);
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult ExportAnnotations(string connectionId, string fileId, string format, string mode, string callback = null)
        {
            try
            {
                string fileName = _annotationSvc.ExportAnnotations(connectionId, fileId, format);

                var url = Url.Action("DownloadFile", new
                {
                    path = new HtmlString(fileName)
                });

                return this.JsonOrJsonP(new UrlResponse(url), callback);
            }
            catch(Exception e)
            {
                return this.JsonOrJsonP(new FailedResponse { success = false, Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult ImportAnnotations(string connectionId, string fileGuid, string callback = null)
        {
            try
            {
                _annotationSvc.ImportAnnotations(connectionId, fileGuid);
                return this.JsonOrJsonP(new FileResponse(fileGuid), callback);
            }
            catch(Exception e)
            {
                return this.JsonOrJsonP(new FailedResponse { success = false, Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult GetPdfVersionOfDocument(string connectionId, string fileId, string callback = null)
        {
            try
            {
                var fileName = _annotationSvc.GetAsPdf(connectionId, fileId);
                var url = this.Url.Action("DownloadFile", new
                {
                    path = fileName
                });

                return this.JsonOrJsonP(new UrlResponse(url), callback);
            }
            catch(Exception e)
            {
                return this.JsonOrJsonP(new FailedResponse { success = false, Reason = e.Message }, callback);
            }
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult DownloadFile(string path)
        {
            var filePath = AppDomain.CurrentDomain.GetData("DataDirectory") + "/" + path;

            return File(filePath, "application/pdf", Path.GetFileName(path));
        }

        [AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult UploadFile(string user_id, string fld, string fileName, bool? multiple = false, string callback = null)
        {
            var user = UnityConfig.GetConfiguredContainer().Resolve<AnnotationImageHandler>().GetUserDataHandler().GetUserByGuid(user_id) ??
                       new User();
            try
            {
                var files = HttpContext.Request.Files;
                var uploadDir = Path.Combine(Server.MapPath("~/App_Data"), fld);
                var filePath = Path.Combine(uploadDir, fileName ?? files[0].FileName);

                Directory.CreateDirectory(uploadDir);

                using (var stream = System.IO.File.Create(filePath))
                {
                    ((multiple ?? false) ? HttpContext.Request.InputStream : files[0].InputStream).CopyTo(stream);
                }

                var fileId = Path.Combine(fld, fileName ?? files[0].FileName);
                AnnotationImageHandler annotator = UnityConfig.GetConfiguredContainer().Resolve<AnnotationImageHandler>();
                try
                {
                    annotator.CreateDocument(fileId, DocumentType.Pdf, user.Id);
                }
                catch (AnnotatorException e)
                {
                    if (annotator.RemoveDocument(fileId))
                    {
                        annotator.CreateDocument(fileId, DocumentType.Pdf, user.Id);
                    }
                }
                return this.JsonOrJsonP(new FileResponse(fileId), callback);
            }
            catch (IOException e)
            {
                return this.JsonOrJsonP(new FailedResponse {success = false, Reason = e.Message}, callback);
            }
        }

        
        #endregion Annotation members
        public ActionResult GetScript(string name)
        {
            string script = _resourceManager.GetScript(name);
            return new JavaScriptResult { Script = script };
        }

        public ActionResult GetCss(string name)
        {
            string css = _resourceManager.GetCss(name);
            return Content(css, "text/css");
        }

        public ActionResult GetEmbeddedImage(string name)
        {
            byte[] imageBody = _resourceManager.GetBinaryResource(name);
            string mimeType = "image/png";
            return File(imageBody, mimeType);
        }

        public ActionResult GetAvatar(string userId)
        {
            var collaborator = _annotationSvc.GetCollaboratorMetadata(userId);
            if(collaborator == null || collaborator.Avatar == null)
            {
                return new EmptyResult();
            }

            const string mimeType = "image/png";
            return File(collaborator.Avatar, mimeType);
        }
    }
}
