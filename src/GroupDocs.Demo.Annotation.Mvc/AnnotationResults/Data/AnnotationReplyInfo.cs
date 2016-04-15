using System;
using System.Runtime.Serialization;
using System.Xml.Serialization;

namespace GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data
{
    [DataContract(Name = "reply")]
    public class AnnotationReplyInfo
    {
        [XmlElement("guid")]
        [DataMember(Name = "guid")]
        public string Guid { get; set; }

        [XmlElement("userGuid")]
        [DataMember(Name = "userGuid")]
        public string UserGuid { get; set; }

        [XmlElement("userName")]
        [DataMember(Name = "userName")]
        public string UserName { get; set; }

        [XmlElement("userEmail")]
        [DataMember(Name = "userEmail")]
        public string UserEmail { get; set; }

        [XmlElement("text")]
        [DataMember(Name = "text")]
        public string Message { get; set; }
     
        public DateTime RepliedOn { get; set; }

        [XmlElement("parentReplyGuid")]
        [DataMember(Name = "parentReplyGuid")]
        public string ParentReplyGuid { get; set; }

        [XmlElement("isAvatarExist")]
        [DataMember(Name = "isAvatarExist")]
        public bool IsAvatarExist { get; set; }
    }
}
