using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Script.Serialization;
using GroupDocs.Annotation.Domain;
using GroupDocs.Annotation.Domain.Containers;
using GroupDocs.Annotation.Domain.Image;
using GroupDocs.Annotation.Domain.Options;
using GroupDocs.Annotation.Handler;
using GroupDocs.Demo.Annotation.Mvc.Models;
using MvcSample.Controllers;

namespace GroupDocs.Demo.Annotation.Mvc.Controllers
{
    public class ViewerController : Controller
    {
        private readonly AnnotationImageHandler annotator;

        public ViewerController(AnnotationImageHandler annotator)
        {
            this.annotator = annotator;
        }

        // GET: /Viewer/
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public ActionResult ViewDocument(ViewDocumentParameters request)
        {
            string fileName = Path.GetFileName(request.Path);

            ViewDocumentResponse result = new ViewDocumentResponse
            {
                pageCss = new string[] { },
                lic = true,
                pdfDownloadUrl = GetPdfDownloadUrl(request),
                url = GetFileUrl(request),
                path = request.Path,
                name = fileName
            };

            DocumentInfoContainer docInfo = annotator.GetDocumentInfo(request.Path);
            result.documentDescription = new FileDataJsonSerializer(docInfo.Pages).Serialize(true);
            result.docType = docInfo.DocumentType;
            result.fileType = docInfo.FileType;

            List<PageImage> imagePages = annotator.GetPages(request.Path);

            // Provide images urls
            List<string> urls = new List<string>();

            // If no cache - save images to temp folder
            string tempFolderPath = Path.Combine(HttpContext.Server.MapPath("~"), "Content", "TempStorage");

            foreach(PageImage pageImage in imagePages)
            {
                string docFoldePath = Path.Combine(tempFolderPath, request.Path);

                if(!Directory.Exists(docFoldePath))
                    Directory.CreateDirectory(docFoldePath);

                string pageImageName = string.Format("{0}\\{1}.png", docFoldePath, pageImage.PageNumber);

                using(Stream stream = pageImage.Stream)
                using(FileStream fileStream = new FileStream(pageImageName, FileMode.Create))
                {
                    stream.Seek(0, SeekOrigin.Begin);
                    stream.CopyTo(fileStream);
                }

                string baseUrl = Request.Url.Scheme + "://" + Request.Url.Authority + Request.ApplicationPath.TrimEnd('/') + "/";
                urls.Add(string.Format("{0}Content/TempStorage/{1}/{2}.png", baseUrl, request.Path, pageImage.PageNumber));
            }

            result.imageUrls = urls.ToArray();

            JavaScriptSerializer serializer = new JavaScriptSerializer { MaxJsonLength = int.MaxValue };

            string serializedData = serializer.Serialize(result);

            // invoke event
            new DocumentOpenSubscriber().HandleEvent(request.Path);

            return Content(serializedData, "application/json");
        }

        public ActionResult LoadFileBrowserTreeData(LoadFileBrowserTreeDataParameters parameters)
        {
            string path = AppDomain.CurrentDomain.GetData("DataDirectory") + "/";
            if(!string.IsNullOrEmpty(parameters.Path))
                path = Path.Combine(path, parameters.Path);

            FileTreeContainer tree = annotator.LoadFileTree(new FileTreeOptions(path));
            List<FileDescription> treeNodes = tree.FileTree;
            FileBrowserTreeDataResponse data = new FileBrowserTreeDataResponse
            {
                nodes = ToFileTreeNodes(parameters.Path, treeNodes).ToArray(),
                count = tree.FileTree.Count
            };

            JavaScriptSerializer serializer = new JavaScriptSerializer();

            string serializedData = serializer.Serialize(data);
            return Content(serializedData, "application/json");
        }


        public ActionResult GetImageUrls(GetImageUrlsParameters parameters)
        {
            if(string.IsNullOrEmpty(parameters.Path))
            {
                GetImageUrlsResponse empty = new GetImageUrlsResponse { imageUrls = new string[0] };

                string serialized = new JavaScriptSerializer().Serialize(empty);
                return Content(serialized, "application/json");
            }

            List<PageImage> imagePages = annotator.GetPages(parameters.Path);

            // Save images some where and provide urls
            List<string> urls = new List<string>();
            string tempFolderPath = Path.Combine(Server.MapPath("~"), "Content", "TempStorage");

            foreach(PageImage pageImage in imagePages)
            {
                string docFoldePath = Path.Combine(tempFolderPath, parameters.Path);

                if(!Directory.Exists(docFoldePath))
                    Directory.CreateDirectory(docFoldePath);

                string pageImageName = string.Format("{0}\\{1}.png", docFoldePath, pageImage.PageNumber);

                using(Stream stream = pageImage.Stream)
                using(FileStream fileStream = new FileStream(pageImageName, FileMode.Create))
                {
                    stream.Seek(0, SeekOrigin.Begin);
                    stream.CopyTo(fileStream);
                }

                string baseUrl = Request.Url.Scheme + "://" + Request.Url.Authority + Request.ApplicationPath.TrimEnd('/') + "/";
                urls.Add(string.Format("{0}Content/TempStorage/{1}/{2}.png", baseUrl, parameters.Path, pageImage.PageNumber));
            }

            GetImageUrlsResponse result = new GetImageUrlsResponse { imageUrls = urls.ToArray() };

            string serializedData = new JavaScriptSerializer().Serialize(result);
            return Content(serializedData, "application/json");
        }

        public ActionResult GetFile(GetFileParameters parameters)
        {
            string displayName = string.IsNullOrEmpty(parameters.DisplayName) ?
                Path.GetFileName(parameters.Path) : Uri.EscapeDataString(parameters.DisplayName);

            Stream fileStream =  annotator.GetFile(parameters.Path).Stream;
            //jquery.fileDownload uses this cookie to determine that a file download has completed successfully
            Response.SetCookie(new HttpCookie("jqueryFileDownloadJSForGD", "true") { Path = "/" });

            return File(GetBytes(fileStream), "application/octet-stream", displayName);
        }
        
        private List<FileBrowserTreeNode> ToFileTreeNodes(string path, List<FileDescription> nodes)
        {
            return nodes.Select(_ =>
                new FileBrowserTreeNode
                {
                    path = string.IsNullOrEmpty(path) ? _.Name : string.Format("{0}/{1}", path, _.Name),
                    docType = string.IsNullOrEmpty(_.DocumentType) ? _.DocumentType : _.DocumentType.ToLower(),
                    fileType = string.IsNullOrEmpty(_.FileType) ? _.FileType : _.FileType.ToLower(),
                    name = _.Name,
                    size = _.Size,
                    modifyTime = (long) (_.LastModificationDate - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds,
                    type = _.IsDirectory ? "folder" : "file"

                })
                .ToList();
        }
        private string GetFileUrl(ViewDocumentParameters request)
        {
            return GetFileUrl(request.Path, false, false, request.FileDisplayName);
        }

        private string GetPdfDownloadUrl(ViewDocumentParameters request)
        {
            return GetFileUrl(request.Path, true, false, request.FileDisplayName,
                request.IgnoreDocumentAbsence,
                request.UseHtmlBasedEngine);
        }

        public string GetFileUrl(string path, bool getPdf, bool isPrintable, string fileDisplayName = null,
                               bool ignoreDocumentAbsence = false,
                               bool useHtmlBasedEngine = false)
        {
            NameValueCollection queryString = HttpUtility.ParseQueryString(string.Empty);
            queryString["path"] = path;
            if(!isPrintable)
            {
                queryString["getPdf"] = getPdf.ToString().ToLower();
                if(fileDisplayName != null)
                    queryString["displayName"] = fileDisplayName;
            }

            if(ignoreDocumentAbsence)
            {
                queryString["ignoreDocumentAbsence"] = ignoreDocumentAbsence.ToString().ToLower();
            }

            queryString["useHtmlBasedEngine"] = useHtmlBasedEngine.ToString().ToLower();

            string handlerName = isPrintable ? "GetPdfWithPrintDialog" : "GetFile";

            string baseUrl = Request.Url.Scheme + "://" + Request.Url.Authority + Request.ApplicationPath.TrimEnd('/') + "/document-viewer/";

            string fileUrl = string.Format("{0}{1}?{2}", baseUrl, handlerName, queryString);
            return fileUrl;
        }

        private byte[] GetBytes(Stream input)
        {
            input.Position = 0;

            using(MemoryStream ms = new MemoryStream())
            {
                input.CopyTo(ms);
                return ms.ToArray();
            }
        }
    }
}