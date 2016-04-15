using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using Groupdocs.Web.UI;
using GroupDocs.Annotation.Contracts;
using GroupDocs.Web.Annotation;
using GroupDocs.Web.Annotation.Options;
using GroupDocs.Web.Annotation.Responses;
using Newtonsoft.Json.Linq;
using StructureMap;
using Point = GroupDocs.Web.Annotation.AnnotationResults.DataGeometry.Point;
using Rectangle = GroupDocs.Web.Annotation.AnnotationResults.DataGeometry.Rectangle;

namespace GroupDocs.Demo.Annotation.WebForms
{
    public class AnnotationHandler : JsonHttpHandler
    {
        private const string _namespace = "GroupDocs.Web.Annotation";
        private const string _fileUploadOperation = "UploadFileHandler";

        private readonly GroupDocs.Web.Annotation.EmbeddedResourceManager _resourceManager;
        private readonly Dictionary<string, Action<HttpContext, Dictionary<string, object>>> _operationHandlers;
        private readonly IAnnotationService _annotationSvc;
        private readonly IApplicationPathFinder _pathFinder;

        public AnnotationHandler()
            : this(ObjectFactory.GetInstance<IAnnotationService>())
        {
        }

        public AnnotationHandler(IAnnotationService annotationSvc)
        {
            _resourceManager = new GroupDocs.Web.Annotation.EmbeddedResourceManager();
            _annotationSvc = annotationSvc;
            _pathFinder = new ApplicationPathFinder();
            _operationHandlers = new Dictionary<string, Action<HttpContext, Dictionary<string, object>>>
            {
                { "GetScriptHandler", ProcessScriptRequest },
                { "GetCssHandler", ProcessCssRequest },
                { "GetDocumentCollaboratorsHandler", ProcessGetCollaboratorsRequest },
                { "ListAnnotationsHandler", ProcessListAnnotationsRequest },
                { "CreateAnnotationHandler", ProcessCreateAnnotationRequest },
                { "DeleteAnnotationHandler", ProcessDeleteAnnotationRequest },
                { "AddAnnotationReplyHandler", ProcessAddReplyRequest },
                { "DeleteAnnotationReplyHandler", ProcessDeleteReplyRequest },
                { "EditAnnotationReplyHandler", ProcessEditReplyRequest },
                { "RestoreAnnotationRepliesHandler", ProcessRestoreRepliesRequest },
                { "ResizeAnnotationHandler", ProcessResizeAnnotationRequest },
                { "MoveAnnotationMarkerHandler", ProcessMoveMarkerRequest },
                { "SaveTextFieldHandler", ProcessSaveTextFieldRequest },
                { "SetTextFieldColorHandler", ProcessSetTextFieldColorRequest },
                { "SetAnnotationBackgroundColorHandler", ProcessSetAnnotationBgColorRequest },
                { "ImportAnnotationsHandler", ProcessImportRequest },
                { "ExportAnnotationsHandler", ProcessExportRequest },
                { "GetPdfVersionOfDocumentHandler", ProcessGetAsPdfRequest },
                { "DownloadFileHandler", ProcessDownloadFileRequest },
                { "GetAvatarHandler", ProcessGetAvatarRequest }
            };
        }

        public override void ProcessRequest(HttpContext context)
        {
            try
            {
                var operation = context.Request.Url.Segments.Last();
                if(_operationHandlers.ContainsKey(operation))
                {
                    base.ProcessRequest(context);
                }
                else
                    if(String.Compare(operation, _fileUploadOperation, true) == 0)
                {
                    ProcessUploadFileRequest(context);
                }
                else
                {
                    ProcessImageRequest(context);
                }
            }
            catch(Exception e)
            {
                SerializeResponse(context, new FailedResponse { success = false, Reason = e.Message });
            }
        }

        protected override void ProcessRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var operation = context.Request.Url.Segments.Last();
            _operationHandlers[operation](context, payload);
        }

        #region Private members
        private void ProcessImageRequest(HttpContext context)
        {
            var queryParams = HttpUtility.ParseQueryString(context.Request.Url.Query);
            string imageName = context.Request.Url.Segments.Last();
            byte[] imageBody = _resourceManager.GetBinaryResource(imageName);
            string mimeType = "image/png";

            context.Response.ContentType = mimeType;
            context.Response.OutputStream.Write(imageBody, 0, imageBody.Length);
        }

        private void ProcessScriptRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var queryParams = HttpUtility.ParseQueryString(context.Request.Url.Query);
            var script = _resourceManager.GetScript(queryParams["name"]);

            context.Response.ContentType = "text/javascript";
            context.Response.Write(script);
        }

        private void ProcessCssRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var queryParams = HttpUtility.ParseQueryString(context.Request.Url.Query);
            var css = _resourceManager.GetCss(queryParams["name"]);

            context.Response.ContentType = "text/css";
            context.Response.Write(css);
        }

        private void ProcessGetCollaboratorsRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var result = _annotationSvc.GetCollaborators((string) payload["fileId"]);
            SerializeResponse(context, result);
        }

        private void ProcessListAnnotationsRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var result = _annotationSvc.ListAnnotations((string) payload["connectionId"], (string) payload["fileId"]);
            SerializeResponse(context, result);
        }

        private void ProcessCreateAnnotationRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var rect = (JObject) payload["rectangle"];
            var pos = (JObject) payload["annotationPosition"];
            var range = (payload.ContainsKey("textRange") ? (JObject) payload["textRange"] : null);
            var options = (payload.ContainsKey("drawingOptions") ? (JObject) payload["drawingOptions"] : null);
            var font = (payload.ContainsKey("font") ? (JObject) payload["font"] : null);

            var result = _annotationSvc.CreateAnnotation(
                (string) payload["connectionId"],
                (string) payload["fileId"],
                (byte) (long) payload["type"],
                payload.ContainsKey("message") ? (string) payload["message"] : null,
                new Rectangle((float) rect["x"], (float) rect["y"], (float) rect["width"], (float) rect["height"]),
                (int) (long) payload["pageNumber"],
                new Point((float) pos["x"], (float) pos["y"]),
                (string) payload["svgPath"],
                options != null ?
                    new DrawingOptions
                    {
                        PenColor = options["penColor"] != null ? (int?) options["penColor"] : null,
                        PenWidth = options["penWidth"] != null ? (byte) options["penWidth"] : (byte) 1,
                        DashStyle = options["penStyle"] != null ? (DashStyle) (byte) options["penStyle"] : DashStyle.Solid,
                        BrushColor = options["brushColor"] != null ? (int?) options["brushColor"] : null
                    } : null,
                font != null ?
                    new FontOptions
                    {
                        Size = font["size"] != null ? (float?) font["size"] : null,
                        Family = font["family"] != null ? (string) font["family"] : null
                    } : null);

            SerializeResponse(context, result);
        }

        private void ProcessDeleteAnnotationRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var result = _annotationSvc.DeleteAnnotation((string) payload["connectionId"], (string) payload["fileId"], (string) payload["annotationGuid"]);
            SerializeResponse(context, result);
        }

        private void ProcessAddReplyRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var result = _annotationSvc.AddAnnotationReply(
                (string) payload["connectionId"],
                (string) payload["fileId"],
                (string) payload["annotationGuid"],
                (string) payload["message"],
                payload.ContainsKey("parentReplyGuid") ? (string) payload["parentReplyGuid"] : null);

            SerializeResponse(context, result);
        }

        private void ProcessDeleteReplyRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var result = _annotationSvc.DeleteAnnotationReply(
                (string) payload["connectionId"],
                (string) payload["fileId"],
                (string) payload["annotationGuid"],
                (string) payload["replyGuid"]);

            SerializeResponse(context, result);
        }

        private void ProcessEditReplyRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var result = _annotationSvc.EditAnnotationReply(
                (string) payload["connectionId"],
                (string) payload["fileId"],
                (string) payload["annotationGuid"],
                (string) payload["replyGuid"],
                (string) payload["message"]);

            SerializeResponse(context, result);
        }

        private void ProcessRestoreRepliesRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var replies = (JArray) payload["replies"];
            var result = _annotationSvc.RestoreAnnotationReplies(
                (string) payload["connectionId"],
                (string) payload["fileId"],
                (string) payload["annotationGuid"],
                replies.Select(r => new GroupDocs.Web.Annotation.AnnotationResults.Data.AnnotationReplyInfo
                {
                    Guid = (string) r["guid"],
                    Message = (string) r["message"],
                    UserGuid = (string) r["userGuid"]
                }).ToArray());

            SerializeResponse(context, result);
        }

        private void ProcessResizeAnnotationRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var result = _annotationSvc.ResizeAnnotation(
                (string) payload["connectionId"],
                (string) payload["fileId"],
                (string) payload["annotationGuid"],
                (double) payload["width"],
                (double) payload["height"]);

            SerializeResponse(context, result);
        }

        private void ProcessMoveMarkerRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var result = _annotationSvc.MoveAnnotationMarker(
                (string) payload["connectionId"],
                (string) payload["fileId"],
                (string) payload["annotationGuid"],
                Convert.ToDouble(payload["left"]),
                Convert.ToDouble(payload["top"]),
                payload.ContainsKey("pageNumber") ? new int?(Convert.ToInt32(payload["pageNumber"])) : null);

            SerializeResponse(context, result);
        }

        private void ProcessSaveTextFieldRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var result = _annotationSvc.SaveTextField(
                (string) payload["connectionId"],
                (string) payload["fileId"],
                (string) payload["annotationGuid"],
                (string) payload["text"],
                (string) payload["fontFamily"],
                Double.Parse(payload["fontSize"].ToString()));

            SerializeResponse(context, result);
        }

        private void ProcessSetTextFieldColorRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var result = _annotationSvc.SetTextFieldColor(
                (string) payload["connectionId"],
                (string) payload["fileId"],
                (string) payload["annotationGuid"],
                Int32.Parse(payload["fontColor"].ToString()));

            SerializeResponse(context, result);
        }

        private void ProcessSetAnnotationBgColorRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var result = _annotationSvc.SetAnnotationBackgroundColor(
                (string) payload["connectionId"],
                (string) payload["fileId"],
                (string) payload["annotationGuid"],
                Int32.Parse(payload["color"].ToString()));

            SerializeResponse(context, result);
        }

        private void ProcessImportRequest(HttpContext context, Dictionary<string, object> payload)
        {
            try
            {
                var fileId = (string) payload["fileGuid"];
                _annotationSvc.ImportAnnotations((string) payload["connectionId"], fileId);
                SerializeResponse(context, new FileResponse(fileId));
            }
            catch(Exception e)
            {
                SerializeResponse(context, new FailedResponse { Reason = e.Message });
            }
        }

        private void ProcessExportRequest(HttpContext context, Dictionary<string, object> payload)
        {
            try
            {
                var outputType = DocumentType.Pdf;
                if(!payload.ContainsKey("format") || !Enum.TryParse<DocumentType>((string) payload["format"], true, out outputType))
                {
                    outputType = DocumentType.Pdf;
                }

                var mode = 0;
                Int32.TryParse(payload["mode"].ToString(), out mode);

                var fileName = _annotationSvc.ExportAnnotations((string) payload["connectionId"], (string) payload["fileId"], outputType);
                var url = String.Format("{0}document-annotation/DownloadFileHandler?path={1}",
                    _pathFinder.GetApplicationPath(),
                    fileName);

                SerializeResponse(context, new
                {
                    success = true,
                    url
                });
            }
            catch(Exception e)
            {
                SerializeResponse(context, new
                {
                    success = false,
                    Reason = e.Message
                });
            }
        }

        private void ProcessGetAsPdfRequest(HttpContext context, Dictionary<string, object> payload)
        {
            try
            {
                var fileName = _annotationSvc.GetAsPdf((string) payload["connectionId"], (string) payload["fileId"]);
                var url = String.Format("{0}document-annotation/DownloadFileHandler?path={1}",
                    _pathFinder.GetApplicationPath(),
                    fileName);

                SerializeResponse(context, new
                {
                    success = true,
                    url
                });
            }
            catch(Exception e)
            {
                SerializeResponse(context, new
                {
                    success = false,
                    Reason = e.Message
                });
            }
        }

        private void ProcessDownloadFileRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var queryParams = HttpUtility.ParseQueryString(context.Request.Url.Query);
            var tempStorage = Groupdocs.Storage.TempFileStorage.Instance;
            var path = queryParams["path"];
            var filePath = tempStorage.MapFilePath(path);

            context.Response.AddHeader("Content-Disposition", String.Format("attachment;filename=\"{0}\"", System.IO.Path.GetFileName(path)));
            context.Response.ContentType = "application/pdf";
            context.Response.WriteFile(filePath);
        }

        private void ProcessUploadFileRequest(HttpContext context)
        {
            try
            {
                var queryParams = HttpUtility.ParseQueryString(context.Request.Url.Query);
                bool multiple = false;
                string fld = queryParams["fld"];
                string fileName = queryParams["fileName"];

                Boolean.TryParse(queryParams["multiple"], out multiple);

                var files = context.Request.Files;
                var uploadDir = Path.Combine(context.Server.MapPath("~/App_Data"), fld);
                var filePath = Path.Combine(uploadDir, fileName ?? files[0].FileName);

                Directory.CreateDirectory(uploadDir);

                using(var stream = System.IO.File.Create(filePath))
                {
                    (multiple ? context.Request.InputStream : files[0].InputStream).CopyTo(stream);
                }

                var fileId = Path.Combine(fld, fileName ?? files[0].FileName);
                SerializeResponse(context, new FileResponse(fileId));
            }
            catch(IOException e)
            {
                SerializeResponse(context, new FailedResponse { Reason = e.Message });
            }
        }

        private void ProcessGetAvatarRequest(HttpContext context, Dictionary<string, object> payload)
        {
            var queryParams = HttpUtility.ParseQueryString(context.Request.Url.Query);
            var collaborator = _annotationSvc.GetCollaboratorMetadata(queryParams["userId"]);

            if(collaborator != null)
            {
                context.Response.ContentType = "image/png";
                context.Response.OutputStream.Write(collaborator.Avatar, 0, collaborator.Avatar.Length);
            }
            else
            {
                context.Response.Clear();
            }
        }

       
        #endregion Private members
    }
}
