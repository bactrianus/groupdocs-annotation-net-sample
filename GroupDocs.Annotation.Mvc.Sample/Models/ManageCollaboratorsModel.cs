using System;
using System.Collections.Generic;
using GroupDocs.Annotation.Contracts;
using GroupDocs.Annotation.Contracts.DataObjects;

namespace GroupDocs.Annotation.Mvc.Sample.Models
{
    public class ManageCollaboratorsModel
    {
        public ManageCollaboratorsModel()
        {
            CollaboratorUser = new List<CollaboratorUserModel>();
            Users = new List<UserDataObject>();
            Roles = new List<Role>();
        }

        public Guid FileId { get; set; }
        public List<UserDataObject> Users { get; set; }
        public List<Role> Roles { get; set; }
        public List<CollaboratorUserModel> CollaboratorUser { get; set; }
    }

    public class CollaboratorUserModel
    {
        public CollaboratorDataObject Collaborator { get; set; }
        public string UserName { get; set; }
    }
}