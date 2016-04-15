using System.Runtime.Serialization;
using System.Xml.Serialization;

namespace GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data
{
    [DataContract(Name = "annotationSizeInfo")]
    public class AnnotationSizeInfo
    {
        [XmlElement("width")]
        [DataMember(Name = "width")]
        public double Width { get; set; }

        [XmlElement("height")]
        [DataMember(Name = "height")]
        public double Height { get; set; }
    }
}
