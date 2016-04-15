using System.Runtime.Serialization;
using System.Xml.Serialization;

namespace GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data
{
    [DataContract(Name = "textFieldInfo")]
    public class TextFieldInfo
    {
        [XmlElement("fieldText")]
        [DataMember(Name = "fieldText")]
        public string FieldText { get; set; }

        [XmlElement("fontFamily")]
        [DataMember(Name = "fontFamily")]
        public string FontFamily { get; set; }

        [XmlElement("fontSize")]
        [DataMember(Name = "fontSize")]
        public double? FontSize { get; set; }
    }
}
