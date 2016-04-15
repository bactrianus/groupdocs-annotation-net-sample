using System;
using System.Configuration;
using System.IO;
using System.Web;
using Groupdocs.Engine.Documents;
using Groupdocs.Web.UI;
using GroupDocs.Annotation;
using GroupDocs.Annotation.Contracts;
using StructureMap;

namespace GroupDocs.Demo.Annotation.WebForms.Service
{
    public static class AnnotationsExporter
    {
        private const string _storageBasePathKey = "StorageBasePath";

        public static string Perform(long documentId, string fileId, long userId, DocumentType outputType = DocumentType.Pdf)
        {
            IRootPathFinder pathFinder = new RootPathFinder
            {
                RootStoragePath = ConfigurationManager.AppSettings[_storageBasePathKey]
            };
            string storagePath = pathFinder.GetRootStoragePath();
            string filePath = Path.Combine(storagePath, fileId);

            using(Stream inputDoc = File.Open(filePath, FileMode.Open))
            {
                var annotator = ObjectFactory.GetInstance<IAnnotator>();
                var resultStream = annotator.ExportAnnotationsToDocument(documentId, inputDoc, outputType, userId);
                var document = DocumentsFactory.CreateDocument(resultStream);
                var tempStorage = Groupdocs.Storage.TempFileStorage.Instance;
                var fileName = string.Format("{0}_WithComments_{1}.{2}",
                    Path.GetFileNameWithoutExtension(fileId),
                    DateTime.UtcNow.ToString("yyyy-MM-dd HH-mm-ss"),
                    "pdf");
                string tempFilePath = Path.Combine(string.Empty, fileName);
                if(!document.SaveAs(tempStorage.MapFilePath(tempFilePath)))
                {
                    throw new AnnotatorException("Failed to save output file to the storage.");
                }
                return fileName;
            }
        }

        /// <summary>
        /// Import annotations with merge functionality
        /// </summary>
        /// <param name="documentId"></param>
        /// <param name="fileId"></param>
        /// <param name="userId"></param>
        public static void Import(long documentId, string fileId, long userId)
        {
            var annotator = ObjectFactory.GetInstance<IAnnotator>();

            IRootPathFinder pathFinder = new RootPathFinder
            {
                RootStoragePath = ConfigurationManager.AppSettings[_storageBasePathKey]
            };
            string storagePath = pathFinder.GetRootStoragePath();
            string filePath = Path.Combine(storagePath, fileId);

            using(Stream inputDoc = File.Open(filePath, FileMode.Open))
            {
                annotator.ImportAnnotations(documentId, inputDoc, DocumentType.Pdf, userId);
            }
        }

        public static Stream GetStreamOfDocument(string fileId)
        {
            var annotator = ObjectFactory.GetInstance<IAnnotator>();
            IRootPathFinder pathFinder = new RootPathFinder
            {
                RootStoragePath = ConfigurationManager.AppSettings[_storageBasePathKey]
            };
            string storagePath = pathFinder.GetRootStoragePath();
            string filePath = Path.Combine(storagePath, fileId);
            Stream inputDoc = File.Open(filePath, FileMode.Open);
            return inputDoc;
        }

        public static void SaveCleanDocument(Stream inputDoc, string fileId)
        {
            var annotator = ObjectFactory.GetInstance<IAnnotator>();
            Stream resultClean = annotator.RemoveAnnotationStream(inputDoc, DocumentType.Pdf);
            var uploadDir = Path.Combine(HttpContext.Current.Server.MapPath("~/App_Data"), "Uploads");
            var fileName = string.Format("{0}.{1}",
               Path.GetFileNameWithoutExtension(fileId),
               "pdf");
            var filePath = Path.Combine(uploadDir, fileName);
            inputDoc.Dispose();
            using(var stream = File.Create(filePath))
            {
                resultClean.CopyTo(stream);
            }
            resultClean.Dispose();
        }
    }
}
