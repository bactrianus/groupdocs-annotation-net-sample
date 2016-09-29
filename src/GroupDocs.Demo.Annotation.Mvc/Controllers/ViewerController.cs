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
using System.Text;
using System.Web.Routing;

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
            result.docType = docInfo.DocumentType.ToLower();
            result.fileType = docInfo.FileType.ToLower();

            /*List<PageImage> imagePages = annotator.GetPages(request.Path);

            // Provide images urls
            List<string> urls = new List<string>();

            // If no cache - save images to temp folder
            string tempFolderPath = Path.Combine(HttpContext.Server.MapPath("~"), "Content", "TempStorage");

            foreach (PageImage pageImage in imagePages)
            {
                string docFoldePath = Path.Combine(tempFolderPath, request.Path);

                if (!Directory.Exists(docFoldePath))
                    Directory.CreateDirectory(docFoldePath);

                string pageImageName = string.Format("{0}\\{1}.png", docFoldePath, pageImage.PageNumber);

                using (Stream stream = pageImage.Stream)
                using (FileStream fileStream = new FileStream(pageImageName, FileMode.Create))
                {
                    stream.Seek(0, SeekOrigin.Begin);
                    stream.CopyTo(fileStream);
                }

                string baseUrl = Request.Url.Scheme + "://" + Request.Url.Authority + Request.ApplicationPath.TrimEnd('/') + "/";
                urls.Add(string.Format("{0}Content/TempStorage/{1}/{2}.png", baseUrl, request.Path, pageImage.PageNumber));
            }*/
            string applicationHost = Request.Url.Scheme + "://" + Request.Url.Authority + Request.ApplicationPath.TrimEnd('/');
            var preloadCount = request.PreloadPagesCount;
            int pageCount = preloadCount ?? 1;
            int[] pageNumbers = new int[docInfo.Pages.Count];
            for (int i = 0; i < pageNumbers.Length; i++)
            {
                pageNumbers[i] = i;
            }
            GetImageUrlsParameters imageUrlParameters = new GetImageUrlsParameters()
            {
                Path = request.Path, FirstPage = 0, PageCount = pageNumbers.Length, UsePdf = true, Width = 150, SupportPageRotation = false, UseHtmlBasedEngine = false
            };

            result.imageUrls = GetImageUrls(applicationHost, pageNumbers, imageUrlParameters);
            //result.imageUrls = urls.ToArray();

            JavaScriptSerializer serializer = new JavaScriptSerializer { MaxJsonLength = int.MaxValue };

            string serializedData = serializer.Serialize(result);

            // invoke event
            new DocumentOpenSubscriber().HandleEvent(request.Path);

            return Content(serializedData, "application/json");
        }

        public ActionResult LoadFileBrowserTreeData(LoadFileBrowserTreeDataParameters parameters)
        {
            string path = AppDomain.CurrentDomain.GetData("DataDirectory") + "\\";
            if (!string.IsNullOrEmpty(parameters.Path))
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
                return ToJsonResult(new GetImageUrlsResponse(new string[0]));
            }
            int pageCountPreload = GetDocumentPages(parameters.Path);
            int[] pageNumber = new int[pageCountPreload];
            for(int i = 0; i < pageNumber.Length; i++)
            {
                pageNumber[i] = i;
            }
            string baseUrl = Request.Url.Scheme + "://" + Request.Url.Authority + Request.ApplicationPath.TrimEnd('/');
            string[] array = GetImageUrls(baseUrl, pageNumber, parameters);
            return ToJsonResult(new GetImageUrlsResponse(array));
        }

        private int GetDocumentPages(string path)
        {
            int countPage = 0;
            DocumentInfoContainer docInfo = annotator.GetDocumentInfo(path);
            countPage = docInfo.Pages.Count;
            return countPage;
        }

        private ActionResult ToJsonResult(object result)
        {
            var serializer = new JavaScriptSerializer { MaxJsonLength = int.MaxValue };
            var serializedData = serializer.Serialize(result);
            return Content(serializedData, "application/json");
        }

        public static string[] GetImageUrls(string applicationHost, int[] pageNumbers, GetImageUrlsParameters parameters)
        {
            return GetImageUrls(applicationHost, parameters.Path, parameters.FirstPage, pageNumbers.Length, parameters.Width,
                parameters.Quality, true/*parameters.UsePdf*/,
                parameters.WatermarkText, parameters.WatermarkColor,
                parameters.WatermarkPosition,
                parameters.WatermarkWidth,
                parameters.IgnoreDocumentAbsence,
                parameters.UseHtmlBasedEngine, parameters.SupportPageRotation,
                parameters.InstanceIdToken,
                null,
                pageNumbers);
        }

        private static string[] GetImageUrls(string applicationHost, string path, int startingPageNumber, int pageCount, int? pageWidth, int? quality, bool usePdf = true,
                                             string watermarkText = null, int? watermarkColor = null,
                                             WatermarkPosition? watermarkPosition = WatermarkPosition.Diagonal, float? watermarkWidth = 0,
                                             bool ignoreDocumentAbsence = false,
                                             bool useHtmlBasedEngine = false,
                                             bool supportPageRotation = false,
                                             string instanceId = null,
                                             string locale = null,
                                             int[] pageNumbers = null)
        {
            string[] pageUrls = new string[pageCount];

            RouteValueDictionary routeValueDictionary = new RouteValueDictionary
                {
                    {"path", path},
                    {"width", pageWidth},
                    {"quality", quality},
                    {"usePdf", usePdf},
                    {"useHtmlBasedEngine", useHtmlBasedEngine},
                    {"rotate", supportPageRotation}
                };

            if (!string.IsNullOrWhiteSpace(locale))
                routeValueDictionary.Add("locale", locale);

            if (!string.IsNullOrEmpty(watermarkText))
            {
                routeValueDictionary.Add("watermarkText", watermarkText);
                routeValueDictionary.Add("watermarkColor", watermarkColor);
                routeValueDictionary.Add("watermarkPosition", watermarkPosition);
                routeValueDictionary.Add("watermarkWidth", watermarkWidth);
            }

            if (!string.IsNullOrWhiteSpace(instanceId))
                routeValueDictionary.Add("instanceIdToken", instanceId);
            if (ignoreDocumentAbsence)
                routeValueDictionary.Add("ignoreDocumentAbsence", ignoreDocumentAbsence);

            if (pageNumbers != null)
            {
                for (int i = 0; i < pageCount; i++)
                {
                    routeValueDictionary["pageIndex"] = pageNumbers[i];
                    pageUrls[i] = ConvertUrlToAbsolute(applicationHost, CreateRelativeRequestUrl("GetDocumentPageImage", routeValueDictionary));
                }
            }
            else
            {
                for (int i = 0; i < pageCount; i++)
                {
                    routeValueDictionary["pageIndex"] = startingPageNumber + i;
                    pageUrls[i] = ConvertUrlToAbsolute(applicationHost, CreateRelativeRequestUrl("GetDocumentPageImage", routeValueDictionary));
                }
            }

            return pageUrls;
        }

        public ActionResult GetDocumentPageImage(GetDocumentPageImageParameters parameters)
        {
            var guid = parameters.Path;
            var pageIndex = parameters.PageIndex;
            var pageNumber = pageIndex + 1;

            var imageOptions = new ImageOptions
            {
                //ConvertImageFileType = _convertImageFileType,
                /*Watermark = Utils.GetWatermark(parameters.WatermarkText, parameters.WatermarkColor,
                parameters.WatermarkPosition, parameters.WatermarkWidth),*/
                //Transformations = parameters.Rotate ? Transformation.Rotate : Transformation.None,
                PageNumbersToConvert = new List<int>() { parameters.PageIndex},
                PageNumber = pageNumber,
                //JpegQuality = parameters.Quality.GetValueOrDefault()
            };
            DocumentInfoContainer documentInfoContainer = annotator.GetDocumentInfo(guid);
            if (parameters.Rotate && parameters.Width.HasValue)
            {
                int pageAngle = documentInfoContainer.Pages[pageIndex].Angle;
                var isHorizontalView = pageAngle == 90 || pageAngle == 270;

                int sideLength = parameters.Width.Value;
                if (isHorizontalView)
                    imageOptions.Height = sideLength;
                else
                    imageOptions.Width = sideLength;
            }
            else if (parameters.Width.HasValue)
            {
                imageOptions.Width = parameters.Width.Value;
            }

            var pageImage = annotator.GetPages(guid, imageOptions).Single();
            pageImage.Stream.Position = 0;
            return File(pageImage.Stream, String.Format("image/{0}", "png"));
        }



        private static string CreateRelativeRequestUrl(string actionName, RouteValueDictionary routeValueDictionary)
        {
            StringBuilder urlBuilder = new StringBuilder("/document-viewer/");
            urlBuilder.Append(actionName);
            if (routeValueDictionary.Count == 0)
            {
                return urlBuilder.ToString();
            }
            urlBuilder.Append("?");
            foreach (KeyValuePair<string, object> oneRoute in routeValueDictionary)
            {
                if (string.IsNullOrWhiteSpace(oneRoute.Key)
                    || oneRoute.Value == null
                    || string.IsNullOrWhiteSpace(oneRoute.Value.ToString()))
                {
                    continue;
                }
                urlBuilder.Append(oneRoute.Key);
                urlBuilder.Append("=");
                string originalValue = oneRoute.Value.ToString();
                string encodedValue = HttpUtility.UrlEncode(originalValue);
                urlBuilder.Append(encodedValue);
                urlBuilder.Append("&");
            }
            urlBuilder.Remove(urlBuilder.Length - 1, 1);//remove last character '&'
            return urlBuilder.ToString();
        }

        private static string ConvertUrlToAbsolute(string applicationHost, string inputUrl)
        {
            string result = string.Format("{0}{1}", applicationHost, inputUrl);
            return result;
        }

        public ActionResult GetFile(GetFileParameters parameters)
        {
            string displayName = string.IsNullOrEmpty(parameters.DisplayName) ?
                Path.GetFileName(parameters.Path) : Uri.EscapeDataString(parameters.DisplayName);

            Stream fileStream = annotator.GetFile(parameters.Path).Stream;
            //jquery.fileDownload uses this cookie to determine that a file download has completed successfully
            Response.SetCookie(new HttpCookie("jqueryFileDownloadJSForGD", "true") { Path = "/" });

            return File(GetBytes(fileStream), "application/octet-stream", displayName);
        }

        private List<FileBrowserTreeNode> ToFileTreeNodes(string path, List<FileDescription> nodes)
        {
            return nodes.Select(_ =>
                new FileBrowserTreeNode
                {
                    path = string.IsNullOrEmpty(path) ? _.Name : string.Format("{0}\\{1}", path, _.Name),
                    docType = string.IsNullOrEmpty(_.DocumentType) ? _.DocumentType : _.DocumentType.ToLower(),
                    fileType = string.IsNullOrEmpty(_.FileType) ? _.FileType : _.FileType.ToLower(),
                    name = _.Name,
                    size = _.Size,
                    modifyTime = (long)(_.LastModificationDate - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds,
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
            if (!isPrintable)
            {
                queryString["getPdf"] = getPdf.ToString().ToLower();
                if (fileDisplayName != null)
                    queryString["displayName"] = fileDisplayName;
            }

            if (ignoreDocumentAbsence)
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

            using (MemoryStream ms = new MemoryStream())
            {
                input.CopyTo(ms);
                return ms.ToArray();
            }
        }
    }
}