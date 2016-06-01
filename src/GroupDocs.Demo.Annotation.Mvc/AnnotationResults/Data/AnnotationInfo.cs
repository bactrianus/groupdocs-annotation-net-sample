using System;
using System.Runtime.Serialization;
using System.Xml.Serialization;
using GroupDocs.Annotation.Domain;
using Point = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DataGeometry.Point;
using Rectangle = GroupDocs.Demo.Annotation.Mvc.AnnotationResults.DataGeometry.Rectangle;

namespace GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data
{
    [DataContract(Name = "annotation")]
    public class AnnotationInfo : TextFieldInfo
    {
        [XmlElement("guid")]
        [DataMember(Name = "guid")]
        public string Guid { get; set; }

        [XmlElement("documentGuid")]
        [DataMember(Name = "documentGuid")]
        public string DocumentGuid { get; set; }

        [XmlElement("text")]
        [DataMember(Name = "text")]
        public string Text { get; set; }

        [XmlElement("layerId")]
        [DataMember(Name = "layerId")]
        public long LayerId { get; set; }
        
        [XmlElement("creatorGuid")]
        [DataMember(Name = "creatorGuid")]
        public string CreatorGuid { get; set; }

        [XmlElement("creatorName")]
        [DataMember(Name = "creatorName")]
        public string CreatorName { get; set; }

        [XmlElement("creatorEmail")]
        [DataMember(Name = "creatorEmail")]
        public string CreatorEmail { get; set; }

        [XmlElement("box")]
        [DataMember(Name = "box")]
        public Rectangle Box { get; set; }

        [XmlElement("pageNumber")]
        [DataMember(Name = "pageNumber")]
        public int? PageNumber { get; set; }

        [XmlElement("annotationPosition")]
        [DataMember(Name = "annotationPosition")]
        public Point AnnotationPosition {get; set;}

        [XmlElement("svgPath")]
        [DataMember(Name = "svgPath")]
        public string SvgPath { get; set; }

        [XmlElement("type")]
        [DataMember(Name = "type")]
        public AnnotationType Type { get; set; }

        [XmlElement("access")]
        [DataMember(Name = "access")]
        public AnnotationAccess? Access { get; set; }

        [XmlElement("replies")]
        [DataMember(Name = "replies")]
        public AnnotationReplyInfo[] Replies { get; set; }

        public DateTime CreatedOn { get; set; }

        [XmlElement("fontColor")]
        [DataMember(Name = "fontColor")]
        public int FontColor { get; set; }

        [XmlElement("penColor")]
        [DataMember(Name = "penColor")]
        public int? PenColor { get; set; }

        [XmlElement("penWidth")]
        [DataMember(Name = "penWidth")]
        public byte? PenWidth { get; set; }

        [XmlElement("penStyle")]
        [DataMember(Name = "penStyle")]
        public byte? PenStyle { get; set; }


        [XmlElement("backgroundColor")]
        [DataMember(Name = "backgroundColor")]
        public int? BackgroundColor { get; set; }
    }
}
