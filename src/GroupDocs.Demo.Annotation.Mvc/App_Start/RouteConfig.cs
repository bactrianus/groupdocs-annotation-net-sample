using System.Web.Mvc;
using System.Web.Routing;

namespace GroupDocs.Demo.Annotation.Mvc
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.MapRoute(
                name: "document-viewer",
                url: "document-viewer/{action}/{id}",
                defaults: new
                {
                    controller = "Viewer",
                    action = "Index",
                    id = UrlParameter.Optional
                });

            routes.MapRoute(
               null,
               "document-annotation/CSS/GetCss",
               new
               {
                   controller = "Annotation",
                   action = "GetCss"
               },
               new[] { "GroupDocs.Web.Annotation.Mvc" }
            );

            routes.MapRoute(
                null,
                "document-annotation/images/{name}",
                new
                {
                    controller = "Annotation",
                    action = "GetEmbeddedImage"
                },
                new[] { "GroupDocs.Web.Annotation.Mvc" }
            );

            routes.MapRoute(
               null,
               "document-annotation/{action}",
               new
               {
                   controller = "Annotation"
               },
               new[] { "GroupDocs.Web.Annotation.Mvc" }
            );

            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute(
                "Default",
                "{controller}/{action}/{id}",
                new
                {
                    controller = "Home",
                    action = "Index",
                    id = UrlParameter.Optional
                }
            );
        }
    }
}