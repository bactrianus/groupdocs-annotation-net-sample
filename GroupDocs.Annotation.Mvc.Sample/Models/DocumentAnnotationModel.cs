using System;
using System.Collections.Generic;
using GroupDocs.Annotation.Contracts;

namespace GroupDocs.Annotation.Mvc.Sample.Models
{
    public class DocumentAnnotationModel
    {
        public Dictionary<Guid, string> annotationsDictionary = new Dictionary<Guid, string>();

        public DocumentAnnotationModel(DocumentMetadata documentMetadata, Dictionary<Guid, string> annotations)
        {
            annotationsDictionary = annotations;
            this.documentMetadata = documentMetadata;
        }

        public DocumentMetadata documentMetadata { get; set; }
    }
}