using System;
using System.Linq;
using System.Security.Principal;
using GroupDocs.Annotation.Contracts.DataObjects;

namespace GroupDocs.Annotation.DataLayer.Sample.AuthenticationTypes
{
    public class MyPrincipal : IPrincipal
    {
        public MyPrincipal(MyIdentity identity)
        {
            Information = identity;
        }

        public UserDataObject User { get; set; }
        public MyIdentity Information { get; }

        public bool IsUser
        {
            get { return !IsGuest; }
        }

        public bool IsGuest
        {
            get { return IsInRole("Guest"); }
        }

        public bool IsInRole(string role)
        {
            return
                Information.Roles.Any(
                    current => string.Compare(current, role, StringComparison.InvariantCultureIgnoreCase) == 0);
        }

        public IIdentity Identity
        {
            get { return Information; }
        }
    }
}