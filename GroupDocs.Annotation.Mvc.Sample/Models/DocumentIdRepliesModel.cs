using System;
using System.Collections.Generic;
using GroupDocs.Annotation.Contracts.DataObjects;

namespace GroupDocs.Annotation.Mvc.Sample.Models
{
    public class DocumentIdRepliesModel
    {
        public Guid DocumentId { get; set; }
        public Guid AnnotationId { get; set; }
        public IEnumerable<AnnotationReplyDataObject> Replies { get; set; }
    }
}