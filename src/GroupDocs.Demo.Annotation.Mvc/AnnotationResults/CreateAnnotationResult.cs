using System;
using System.Runtime.Serialization;
using System.Xml.Serialization;
using GroupDocs.Annotation.Domain;

namespace GroupDocs.Demo.Annotation.Mvc.AnnotationResults
{
    [DataContract()]
    public class CreateAnnotationResult : Result
    {
        [XmlElement("id")]
        [DataMember(Name = "id")]
        public long Id { get; set; }

        [XmlElement("annotationGuid")]
        [DataMember(Name = "annotationGuid")]
        public string Guid { get; set; }

        [XmlElement("replyGuid")]
        [DataMember(Name = "replyGuid")]
        public string ReplyGuid { get; set; }

        /// <summary>
        /// Gets or sets the document unique identifier.
        /// </summary>
        /// <value>
        /// The document unique identifier.
        /// </value>
        [XmlElement("documentGuid")]
        [DataMember(Name = "documentGuid")]
        public string DocumentGuid { get; set; }

        [XmlElement("access")]
        [DataMember(Name = "access")]
        public AnnotationAccess Access { get; set; }

        [XmlElement("type")]
        [DataMember(Name = "type")]
        public AnnotationType Type { get; set; }

        public DateTime CreationTime { get; set; }
    }
}
