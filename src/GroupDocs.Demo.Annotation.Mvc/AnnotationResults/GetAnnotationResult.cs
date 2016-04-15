using System;
using System.Runtime.Serialization;
using System.Xml.Serialization;
using GroupDocs.Annotation.Contracts;

namespace GroupDocs.Web.Annotation.AnnotationResults
{
    [DataContract()]
    public class GetAnnotationResult : Result
    {
        [XmlElement("id")]
        [DataMember(Name = "id")]
        public long Id
        {
            get; set;
        }

        [XmlElement("annotationGuid")]
        [DataMember(Name = "annotationGuid")]
        public string Guid
        {
            get; set;
        }

        [XmlElement("replyGuid")]
        [DataMember(Name = "replyGuid")]
        public string ReplyGuid
        {
            get; set;
        }

        [XmlElement("documentGuid")]
        [DataMember(Name = "documentGuid")]
        public string DocumentGuid
        {
            get; set;
        }

        [XmlElement("access")]
        [DataMember(Name = "access")]
        public AnnotationAccess Access
        {
            get; set;
        }

        [XmlElement("type")]
        [DataMember(Name = "type")]
        public AnnotationType Type
        {
            get; set;
        }
        
        public AnnotationInfo Annotation
        {
            get; set;
        }
    }
}
