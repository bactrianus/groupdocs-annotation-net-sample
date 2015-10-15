using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using GroupDocs.Annotation.Contracts;
using GroupDocs.Annotation.Contracts.AnnotationDataObjects;
using GroupDocs.Annotation.Contracts.DataObjects;
using GroupDocs.Annotation.DataLayer.Sample;
using GroupDocs.Annotation.DataLayer.Sample.AuthenticationTypes;
using GroupDocs.Annotation.Mvc.Sample.Models;
using Newtonsoft.Json;

namespace GroupDocs.Annotation.Mvc.Sample.Controllers
{
    [Authorize]
    public class AnnotationController : BaseController
    {
        private readonly AnnotationFacade annotationFacade;
        private readonly IAnnotationDataLayer resourceManager;

        public AnnotationController()
        {
            resourceManager = new JsonDataSaver();
            annotationFacade = new AnnotationFacade(resourceManager);
        }

        public ActionResult Index()
        {
            resourceManager.SetStoragePath(Server.MapPath("~/App_Data/Storage"));
            try
            {
                var userId = ((MyIdentity) User.Identity).Id;
                var documents = annotationFacade.GetDocumentsInfo(userId);
                return View(documents);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("Login", "Account");
            }
        }

        [HttpPost]
        public ActionResult UploadFile(HttpPostedFileBase file, DocumentMetadata documentMetadata)
        {
            IEnumerable<DocumentMetadata> documents;
            var userId = ((MyIdentity) User.Identity).Id;
            documentMetadata.Name = file.FileName;
            documentMetadata.Author = User.Identity.Name;
            documentMetadata.CreatedOn = DateTime.Now;
            documentMetadata.OwnerId = userId;
            documentMetadata.Extension = Path.GetExtension(file.FileName);
            try
            {
                annotationFacade.LoadDocument(file.InputStream, documentMetadata, userId);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                documents = annotationFacade.GetDocumentsInfo(userId);
                return RedirectToAction("Index", documents);
            }

            SetNotification("Success", NotificationEnumeration.Success);
            documents = annotationFacade.GetDocumentsInfo(userId);
            return RedirectToAction("Index", documents);
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult DeleteDocument(Guid fileId)
        {
            IEnumerable<DocumentMetadata> documents;
            var userId = ((MyIdentity) User.Identity).Id;
            try
            {
                annotationFacade.DeleteDocument(fileId.ToString(), userId);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                documents = annotationFacade.GetDocumentsInfo(userId);
                return RedirectToAction("Index", documents);
            }

            SetNotification("Success", NotificationEnumeration.Success);
            return RedirectToAction("Index");
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult GetPdfVersionOfDocument(Guid fileId)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            try
            {
                var documentMetadata = resourceManager.GetDocumentMetadata(fileId.ToString());
                var workStream = annotationFacade.GetClearDocument(fileId.ToString(), userId);
                workStream.Seek(0, SeekOrigin.Begin);
                var result = new FileStreamResult(workStream, "application")
                {
                    FileDownloadName = "result" + documentMetadata.Extension
                };
                return result;
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("Index");
            }
        }

        public ActionResult DocumentAnnotations(Guid fileId)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            try
            {
                var annotationsList = annotationFacade.GetAnnotations(fileId.ToString(), userId);
                var documentMetadata = annotationFacade.GetDocumentMetadata(fileId.ToString(), userId);
                var annotationsDictionary = new Dictionary<Guid, string>();
                if (annotationsList != null)
                {
                    foreach (var annotation in annotationsList)
                    {
                        annotationsDictionary.Add(
                            new Guid(annotation.Id),
                            JsonConvert.SerializeObject(annotation, Formatting.Indented));
                    }
                }

                var model = new DocumentAnnotationModel(documentMetadata, annotationsDictionary);
                return View(model);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("Index");
            }
        }

        public ActionResult AllVersionsOfAnnotation(Guid fileId, Guid annotationId)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            var documentMetadata = annotationFacade.GetDocumentMetadata(fileId.ToString(), userId);
            var annotationsList = new List<AnnotationDataObject>();
            for (var i = 1;; i++)
            {
                var a1 = annotationFacade.GetAnnotation(fileId.ToString(), annotationId.ToString(), userId, i);
                var a2 = annotationFacade.GetAnnotation(fileId.ToString(), annotationId.ToString(), userId, i + 1);
                annotationsList.Add(a1);
                if (a1.Version == a2.Version)
                {
                    break;
                }
            }

            var annotationsDictionary = new Dictionary<int, string>();

            foreach (var annotation in annotationsList)
            {
                annotationsDictionary.Add(
                    annotation.Version,
                    JsonConvert.SerializeObject(annotation, Formatting.Indented));
            }

            var model = new AnnotationVersionModel(documentMetadata, annotationsDictionary);
            return View(model);
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult AddAnnotation(Guid fileId, AnnotationDataObject annotation)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            annotation.Metadata.Creator = User.Identity.Name;
            try
            {
                annotationFacade.CreateAnnotation(fileId.ToString(), annotation, userId);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("DocumentAnnotations", new {fileId});
            }

            SetNotification("Success", NotificationEnumeration.Success);
            return RedirectToAction("DocumentAnnotations", new {fileId});
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult CreateAnnotation(Guid fileId)
        {
            return View(fileId);
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult DeleteAnnotation(Guid fileId, Guid annotationId)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            var deletedAnnotation = new AnnotationDataObject
            {
                Id = annotationId.ToString(),
                Metadata = new AnnotationMetadata
                {
                    Editor = User.Identity.Name,
                    Status = Status.Deleted
                }
            };
            try
            {
                annotationFacade.DeleteAnnotation(fileId.ToString(), deletedAnnotation, userId);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("DocumentAnnotations", new {fileId});
            }

            SetNotification("Success", NotificationEnumeration.Success);
            return RedirectToAction("DocumentAnnotations", new {fileId});
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult EditAnnotation(Guid fileId, Guid annotationId)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            try
            {
                var annotationObject = annotationFacade.GetAnnotation(fileId.ToString(), annotationId.ToString(), userId);
                var model = new DocumentGuidAnnotationModel(fileId, annotationObject);
                return View(model);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("DocumentAnnotations", new {fileId});
            }
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult SaveEditedAnnotation(Guid fileId, AnnotationDataObject annotation)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            annotation.Metadata.Editor = User.Identity.Name;
            try
            {
                annotationFacade.EditAnnotation(fileId.ToString(), annotation, userId);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("DocumentAnnotations", new {fileId});
            }

            SetNotification("Success", NotificationEnumeration.Success);
            return RedirectToAction("DocumentAnnotations", new {fileId});
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult AnnotationReplies(Guid fileId, Guid annotationId)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            try
            {
                var model = new DocumentIdRepliesModel
                {
                    Replies =
                        annotationFacade.GetAnnotationReplies(
                            fileId.ToString(),
                            annotationId.ToString(),
                            userId),
                    DocumentId = fileId,
                    AnnotationId = annotationId
                };
                return View(model);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("EditAnnotation", new {fileId, annotationId});
            }
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult CreateNewAnnotationReply(Guid fileId, Guid annotationId, AnnotationReplyDataObject reply)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            reply.User = User.Identity.Name;
            try
            {
                annotationFacade.AddAnnotationReply(fileId.ToString(), annotationId.ToString(), reply, userId);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("AnnotationReplies", new {fileId, annotationId});
            }

            SetNotification("Success", NotificationEnumeration.Success);
            return RedirectToAction("AnnotationReplies", new {fileId, annotationId});
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult EditAnnotationReply(Guid fileId, Guid annotationId, AnnotationReplyDataObject reply)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            try
            {
                annotationFacade.EditAnnotationReply(fileId.ToString(), annotationId.ToString(), reply, userId);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("AnnotationReplies", new {fileId, annotationId});
            }

            SetNotification("Success", NotificationEnumeration.Success);
            return RedirectToAction("AnnotationReplies", new {fileId, annotationId});
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult DeleteAnnotationReply(Guid fileId, Guid annotationId, Guid replyId)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            try
            {
                annotationFacade.DeleteAnnotationReply(fileId.ToString(), annotationId.ToString(), replyId.ToString(),
                    userId);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("AnnotationReplies", new {fileId, annotationId});
            }

            SetNotification("Success", NotificationEnumeration.Success);
            return RedirectToAction("AnnotationReplies", new {fileId, annotationId});
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult GetAnnotatedDocument(Guid fileId)
        {
            IEnumerable<DocumentMetadata> documents;
            var documentMetadata = resourceManager.GetDocumentMetadata(fileId.ToString());
            var userId = ((MyIdentity) User.Identity).Id;
            try
            {
                var annotatedDocument = annotationFacade.GetAnnotatedDocument(fileId.ToString(), userId);
                if (annotatedDocument == null)
                {
                    SetNotification("Cant create annotations.", NotificationEnumeration.Error);
                    documents = annotationFacade.GetDocumentsInfo(userId);
                    return RedirectToAction("Index", documents);
                }
                annotatedDocument.Seek(0, SeekOrigin.Begin);
                var result = new FileStreamResult(annotatedDocument, "application")
                {
                    FileDownloadName = "result" + documentMetadata.Extension
                };
                return result;
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                documents = annotationFacade.GetDocumentsInfo(userId);
                return RedirectToAction("Index", documents);
            }
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult ManageDocumentCollaborators(Guid fileId)
        {
            var model = new ManageCollaboratorsModel();
            var userId = ((MyIdentity) User.Identity).Id;
            model.FileId = fileId;
            try
            {
                model.Roles = annotationFacade.GetRoles(userId).ToList();
                var collaborators = annotationFacade.GetDocumentCollaborators(fileId.ToString(), userId).ToList();
                foreach (var collaborator in collaborators)
                {
                    model.CollaboratorUser.Add(new CollaboratorUserModel
                    {
                        Collaborator = collaborator,
                        UserName = annotationFacade.GetUser(collaborator.UserId, userId).Name
                    });
                }
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                var documents = annotationFacade.GetDocumentsInfo(userId);
                return RedirectToAction("Index", documents);
            }

            var users = annotationFacade.GetUsers(userId).ToList();
            var collaboratorsId = new List<Guid>();
            foreach (var collaborator in model.CollaboratorUser)
            {
                collaboratorsId.Add(new Guid(collaborator.Collaborator.UserId));
            }

            var itemsToRemove = new HashSet<Guid>(collaboratorsId);
            users.RemoveAll(x => itemsToRemove.Contains(new Guid(x.Id)));
            model.Users = users;
            return View(model);
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult EditDocumentCollaborator(CollaboratorDataObject collaborator, Guid fileId)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            try
            {
                annotationFacade.EditDocumentCollaborator(fileId.ToString(), collaborator, userId);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("ManageDocumentCollaborators", fileId);
            }

            return RedirectToAction("ManageDocumentCollaborators", new {fileId});
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult DeleteDocumentCollaborator(Guid collaboratorId, Guid fileId)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            try
            {
                annotationFacade.DeleteDocumentCollaborator(fileId.ToString(), collaboratorId.ToString(), userId);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("ManageDocumentCollaborators", fileId);
            }

            return RedirectToAction("ManageDocumentCollaborators", new {fileId});
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult AddDocumentCollaborator(CollaboratorDataObject collaborator, Guid fileId)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            try
            {
                annotationFacade.AddDocumentCollaborator(fileId.ToString(), collaborator, userId);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("ManageDocumentCollaborators", fileId);
            }

            SetNotification("Success", NotificationEnumeration.Success);
            return RedirectToAction("ManageDocumentCollaborators", new {fileId});
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult GetImage(Guid fileId, int pageNumber)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            var image = annotationFacade.GetDocumentAsImage(fileId.ToString(), pageNumber, userId);
            image.Seek(0, SeekOrigin.Begin);
            return new FileStreamResult(image, "image/jpeg");
        }

        [System.Web.Http.AcceptVerbs("GET", "POST", "OPTIONS")]
        public ActionResult GetJavaScriptDescription(Guid fileId)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            var description = annotationFacade.GetJavaScriptDescription(fileId.ToString(), userId);
            description.Seek(0, SeekOrigin.Begin);
            return new FileStreamResult(description, "application/json");
        }
    }
}