using System.Security.Principal;
using System.Web;
using System.Web.Security;

namespace GroupDocs.Annotation.DataLayer.Sample.AuthenticationTypes
{
    public class MyPrincipalService
    {
        private readonly HttpContext context;

        public MyPrincipalService(HttpContext context)
        {
            this.context = context;
        }

        #region IPrincipalService Members

        public IPrincipal GetCurrent()
        {
            var user = context.User;
            // if they are already signed in, and conversion has happened
            if (user != null && user is MyPrincipal)
                return user;

            // if they are signed in, but conversion has still not happened
            if (user != null && user.Identity.IsAuthenticated && user.Identity is FormsIdentity)
            {
                var id = (FormsIdentity) context.User.Identity;

                var ticket = id.Ticket;
                if (FormsAuthentication.SlidingExpiration)
                    ticket = FormsAuthentication.RenewTicketIfOld(ticket);

                var fid = new MyIdentity(ticket);
                return new MyPrincipal(fid);
            }

            // not sure what's happening, let's just default here to a Guest
            return new MyPrincipal(new MyIdentity((FormsAuthenticationTicket) null));
        }

        #endregion
    }
}