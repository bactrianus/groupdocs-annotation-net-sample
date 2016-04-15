using System;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace GroupDocs.Demo.Annotation.Mvc.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index(string un)
        {
            if (!string.IsNullOrEmpty(un))
            {
                System.Web.HttpContext.Current.Session["UserName"] = un;
                FormsAuthenticationTicket ticket = new FormsAuthenticationTicket(un, true, 1439200);
                string encryptedTicket = FormsAuthentication.Encrypt(ticket);
                HttpCookie cookie = new HttpCookie(FormsAuthentication.FormsCookieName, encryptedTicket);
                cookie.Expires = ticket.Expiration;
                Response.Cookies.Add(cookie);
            }
            else
            {
                System.Web.HttpContext.Current.Session["UserName"] = "";
                var cookie = new HttpCookie(FormsAuthentication.FormsCookieName) { Expires = DateTime.UtcNow.AddDays(-1) };
                Response.Cookies.Add(cookie);
                Session.Abandon();
            }
			
			Membership.ValidateUser(un, null);
            return View();
        }
    }
}
