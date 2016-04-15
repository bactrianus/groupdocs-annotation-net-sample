using System;
using System.Web.Mvc;
using System.Web.Routing;
using GroupDocs.Demo.Annotation.Mvc.App_Start;
using GroupDocs.Demo.Annotation.Mvc.SignalR;
using Microsoft.AspNet.SignalR;
using Microsoft.Practices.Unity;

namespace GroupDocs.Demo.Annotation.Mvc
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            // Map signalr routes
            RouteTable.Routes.MapHubs("/signalr1_1_2", new HubConfiguration { EnableCrossDomain = true });
            GlobalHost.Configuration.DisconnectTimeout = TimeSpan.FromSeconds(300);
            GlobalHost.DependencyResolver.Register(
                typeof(AnnotationHub),
                () => new AnnotationHub(UnityConfig.GetConfiguredContainer().Resolve<IAuthenticationService>()));

            AreaRegistration.RegisterAllAreas();
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
        }
    }
}