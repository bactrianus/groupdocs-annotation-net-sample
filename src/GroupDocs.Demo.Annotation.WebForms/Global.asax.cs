using System;
using System.Web.Routing;
using Groupdocs.Web.UI;
using Groupdocs.Web.UI.EventHandling;
using GroupDocs.Demo.Annotation.WebForms.Models;
using GroupDocs.Demo.Annotation.WebForms.Security;
using GroupDocs.Demo.Annotation.WebForms.SignalR;
using Microsoft.AspNet.SignalR;
using StructureMap;

namespace GroupDocs.Demo.Annotation.WebForms
{
    public class Global : System.Web.HttpApplication
    {

        protected void Application_Start(object sender, EventArgs e)
        {
            var scanPath = Context.Server.MapPath("~/bin");
            ObjectFactory.Initialize(x =>
            {
                x.Scan(scan =>
                {
                    scan.AssembliesFromPath(scanPath, a => a.FullName.Contains("Saaspose") || a.FullName.Contains("GroupDocs"));
                    scan.TheCallingAssembly();
                    scan.Convention<SMConventionScanner>();
                });
            });
            var path = Context.Server.MapPath(@"~/App_Data");
            // Set Json repo storage path
            Context.Application[GroupDocs.Data.Json.RepositoryPathFinder.RepoBasePathKey] = path;
            // Set viewer storage path
            Viewer.SetRootStoragePath(path);
            // Map signalr routes
            RouteTable.Routes.MapHubs("/signalr1_1_2", new HubConfiguration { EnableCrossDomain = true });
            GlobalHost.Configuration.DisconnectTimeout = TimeSpan.FromSeconds(300);
            GlobalHost.DependencyResolver.Register(
                typeof(AnnotationHub),
                () => new AnnotationHub(new AuthenticationService()));
            Viewer.Subscribe<DocumentOpenedEvent>(new DocumentOpenSubscriber());
        }

        protected void Session_Start(object sender, EventArgs e)
        {

        }

        protected void Application_BeginRequest(object sender, EventArgs e)
        {

        }

        protected void Application_AuthenticateRequest(object sender, EventArgs e)
        {

        }

        protected void Application_Error(object sender, EventArgs e)
        {

        }

        protected void Session_End(object sender, EventArgs e)
        {

        }

        protected void Application_End(object sender, EventArgs e)
        {

        }
    }
}