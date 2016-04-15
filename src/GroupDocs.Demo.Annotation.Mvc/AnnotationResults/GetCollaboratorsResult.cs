using System.Runtime.Serialization;
using System.Xml.Serialization;
using GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data;

namespace GroupDocs.Demo.Annotation.Mvc.AnnotationResults
{
    [DataContract]
    public class GetCollaboratorsResult : Result
    {
        [XmlElement("documentGuid")]
        [DataMember(Name = "documentGuid")]
        public string DocumentGuid { get; set; }

        [XmlElement("owner")]
        [DataMember(Name = "owner")]
        public ReviewerInfo Owner { get; set; }

        [XmlElement("collaborators")]
        [DataMember(Name = "collaborators")]
        public ReviewerInfo[] Collaborators { get; set; }

        [XmlElement("shared_link_access_rights")]
        [DataMember(Name = "shared_link_access_rights")]
        public uint? SharedLinkAccessRights { get; set; }
    }
}
