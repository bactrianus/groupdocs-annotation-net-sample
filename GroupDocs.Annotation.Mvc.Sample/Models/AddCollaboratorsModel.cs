using System;
using System.Collections.Generic;
using GroupDocs.Annotation.Contracts;
using GroupDocs.Annotation.Contracts.DataObjects;

namespace GroupDocs.Annotation.Mvc.Sample.Models
{
    public class AddCollaboratorsModel
    {
        public Guid FileId { get; set; }
        public List<UserDataObject> Users { get; set; }
        public List<Role> Roles { get; set; }
    }
}