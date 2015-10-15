using System.Collections.Generic;
using GroupDocs.Annotation.Contracts.DataObjects;

namespace GroupDocs.Annotation.Mvc.Sample.Models
{
    public class UsersRolesModel
    {
        public UsersRolesModel()
        {
            Users = new List<UserDataObject>();
            Roles = new List<string>();
        }

        public List<UserDataObject> Users { get; set; }
        public List<string> Roles { get; set; }
    }
}