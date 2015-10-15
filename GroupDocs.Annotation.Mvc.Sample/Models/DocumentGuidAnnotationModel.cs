using System;
using GroupDocs.Annotation.Contracts.DataObjects;

namespace GroupDocs.Annotation.Mvc.Sample.Models
{
    public class DocumentGuidAnnotationModel
    {
        public DocumentGuidAnnotationModel(Guid fileId, AnnotationDataObject annotation)
        {
            FileId = fileId;
            Annotation = annotation;
        }

        public Guid FileId { get; set; }
        public AnnotationDataObject Annotation { get; set; }
    }
}