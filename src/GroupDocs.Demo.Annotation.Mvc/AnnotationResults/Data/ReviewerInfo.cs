using System.Runtime.Serialization;
using System.Xml.Serialization;
using GroupDocs.Annotation.Domain;

namespace GroupDocs.Demo.Annotation.Mvc.AnnotationResults.Data
{

    [DataContract(Name = "user")]
    public class ReviewerInfo
    {
        [XmlElement("id")]
        [DataMember(Name = "id")]
        public long? Id { get; set; }

        [XmlElement("guid")]
        [DataMember(Name = "guid")]
        public string Guid { get; set; }

        [XmlElement("primary_email")]
        [DataMember(Name = "primary_email")]
        public string PrimaryEmail { get; set; }

        [XmlElement("firstName")]
        [DataMember(Name = "firstName")]
        public string FirstName { get; set; }

        [XmlElement("lastName")]
        [DataMember(Name = "lastName")]
        public string LastName { get; set; }

        [XmlElement("access_rights")]
        [DataMember(Name = "access_rights")]
        public AnnotationReviewerRights? AccessRights { get; set; }

        [XmlElement("color")]
        [DataMember(Name = "color")]
        public uint? Color { get; set; }

        [XmlElement("avatar")]
        [DataMember(Name = "avatar")]
        public byte[] Avatar { get; set; }
    }
}
