using System.Runtime.Serialization;
using System.Xml.Serialization;

namespace GroupDocs.Demo.Annotation.Mvc.AnnotationResults
{
    [DataContract]
    public class DeleteAnnotationResult : Result
    {
        [XmlElement("id")]
        [DataMember(Name = "id")]
        public long Id { get; set; }

        [XmlElement("guid")]
        [DataMember(Name = "guid")]
        public string Guid { get; set; }
    }
}
