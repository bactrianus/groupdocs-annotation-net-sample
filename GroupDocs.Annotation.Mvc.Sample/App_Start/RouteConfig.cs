using System.Web.Mvc;
using System.Web.Routing;

namespace GroupDocs.Annotation.Mvc.Sample
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute("Default", "{controller}/{action}/{id}",
                new {controller = "Account", action = "SignIn", id = UrlParameter.Optional});
        }
    }
}