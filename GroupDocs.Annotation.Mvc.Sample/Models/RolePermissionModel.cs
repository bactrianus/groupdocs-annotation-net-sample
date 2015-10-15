using System.Collections.Generic;
using GroupDocs.Annotation.Contracts;

namespace GroupDocs.Annotation.Mvc.Sample.Models
{
    public class RolePermissionModel
    {
        public RolePermissionModel()
        {
            Roles = new Dictionary<Role, List<string>>();
            Permissions = new List<string>();
        }

        public Dictionary<Role, List<string>> Roles { get; set; }
        public List<string> Permissions { get; set; }
    }
}