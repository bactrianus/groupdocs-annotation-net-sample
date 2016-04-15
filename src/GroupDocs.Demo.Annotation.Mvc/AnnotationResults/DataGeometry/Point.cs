using System.Runtime.Serialization;
using System.Xml.Serialization;

namespace GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DataGeometry
{
    [DataContract(Name = "point")]
    public struct Point
    {
        public Point(double x, double y)
        {
            X = x;
            Y = y;
        }

        [XmlElement("x")]
        [DataMember(Name = "x")]
        public double X { get; set; }

        [XmlElement("y")]
        [DataMember(Name = "y")]
        public double Y { get; set; }
    }
}
