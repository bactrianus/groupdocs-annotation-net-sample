using System;
using System.Collections.Generic;
using System.Security.Principal;
using System.Web.Security;
using GroupDocs.Annotation.Contracts.DataObjects;
using Newtonsoft.Json;

namespace GroupDocs.Annotation.DataLayer.Sample.AuthenticationTypes
{
    public class MyIdentity : IIdentity
    {
        public MyIdentity(FormsAuthenticationTicket ticket)
        {
            if (ticket == null)
            {
                UserName = "Guest";
                Name = "Guest";
                Id = new Guid("00000000-0000-0000-0000-000000000001").ToString();
                Roles = new List<string> {"Guest"};
                return;
            }

            var data = JsonConvert.DeserializeObject<MyCookie>(ticket.UserData);

            if (data == null)
            {
                AsGuest();
                return;
            }

            Id = data.Id;
            UserName = data.UserName;
            Name = data.UserName;
            Login = data.Login;
            Roles = data.Roles ?? new List<string> {"User"};
        }

        public MyIdentity(UserDataObject user)
        {
            if (user == null)
            {
                AsGuest();
                return;
            }

            Name = user.Name;
            Id = user.Id;
            Login = user.Login;
            UserName = user.Name;
            Roles = user.Roles ?? new List<string> {"User"};
        }

        public string Id { get; set; }
        public string Login { get; set; }
        public string UserName { get; set; }
        public bool RememberMe { get; set; }
        public IList<string> Roles { get; set; }

        private void AsGuest()
        {
            UserName = "Guest";
            Roles = new List<string> {"Guest"};
        }

        #region IIdentity Members

        public string AuthenticationType
        {
            get { return "MyForms"; }
        }

        public bool IsAuthenticated
        {
            get
            {
                return true;
                //return !(this.Id == new Guid() || string.IsNullOrWhiteSpace(this.Login));
            }
        }

        public string Name { get; protected set; }

        #endregion
    }
}