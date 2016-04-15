using System;
using System.Web;
using System.Web.Security;

namespace GroupDocs.Demo.Annotation.WebForms
{
    public partial class Annotation : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            string un = Request.QueryString["un"] ?? "";
            if(!string.IsNullOrEmpty(un))
            {
                HttpContext.Current.Session["UserName"] = un;
                FormsAuthenticationTicket ticket = new FormsAuthenticationTicket(un, true, 1439200);
                string encryptedTicket = FormsAuthentication.Encrypt(ticket);
                HttpCookie cookie = new HttpCookie(FormsAuthentication.FormsCookieName, encryptedTicket);
                cookie.Expires = ticket.Expiration;
                Response.Cookies.Add(cookie);
            }
            else
            {
                HttpContext.Current.Session["UserName"] = "";
                var cookie = new HttpCookie(FormsAuthentication.FormsCookieName) { Expires = DateTime.UtcNow.AddDays(-1) };
                Response.Cookies.Add(cookie);
                Session.Abandon();
            }

            Membership.ValidateUser(un, null);
        }
    }
}