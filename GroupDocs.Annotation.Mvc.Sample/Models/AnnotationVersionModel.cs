using System.Collections.Generic;
using GroupDocs.Annotation.Contracts;

namespace GroupDocs.Annotation.Mvc.Sample.Models
{
    public class AnnotationVersionModel
    {
        public Dictionary<int, string> annotationsDictionary = new Dictionary<int, string>();

        public AnnotationVersionModel(DocumentMetadata documentMetadata, Dictionary<int, string> annotations)
        {
            annotationsDictionary = annotations;
            this.documentMetadata = documentMetadata;
        }

        public DocumentMetadata documentMetadata { get; set; }
    }
}