using System;
using System.Runtime.Serialization;
using System.Xml.Serialization;

namespace GroupDocs.Demo.Annotation.Mvc.AnnotationResults
{
    [DataContract]
    public class AddReplyResult : Result
    {
        [XmlElement("replyGuid")]
        [DataMember(Name = "replyGuid")]
        public string ReplyGuid { get; set; }

        [XmlElement("annotationGuid")]
        [DataMember(Name = "annotationGuid")]
        public string AnnotationGuid { get; set; }

        [XmlElement("replyDateTime")]
        [DataMember(Name = "replyDateTime")]
        public DateTime ReplyDateTime { get; set; }
    }
}
