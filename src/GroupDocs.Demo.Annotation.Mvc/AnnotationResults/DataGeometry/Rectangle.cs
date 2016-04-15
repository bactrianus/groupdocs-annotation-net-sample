using System.Runtime.Serialization;
using System.Xml.Serialization;

namespace GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DataGeometry
{
    [DataContract(Name = "rect")]
    public struct Rectangle
    {
        public Rectangle(float x, float y, float width, float height)
            : this()
        {
            X = x;
            Y = y;
            Width = width;
            Height = height;
        }

        [XmlElement("x")]
        [DataMember(Name = "x")]
        public float X { get; set; }

        [XmlElement("y")]
        [DataMember(Name = "y")]
        public float Y { get; set; }

        [XmlElement("width")]
        [DataMember(Name = "width")]
        public float Width { get; set; }

        [XmlElement("height")]
        [DataMember(Name = "height")]
        public float Height { get; set; }
    }
}
