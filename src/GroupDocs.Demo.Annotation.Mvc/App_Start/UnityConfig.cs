using System;
using System.Web;
using GroupDocs.Annotation;
using GroupDocs.Annotation.Contracts;
using GroupDocs.Annotation.Data.Contracts.Repositories;
using GroupDocs.Data.Json;
using GroupDocs.Data.Json.Repositories;
using GroupDocs.Demo.Annotation.Mvc.Security;
using GroupDocs.Demo.Annotation.Mvc.Service;
using GroupDocs.Demo.Annotation.Mvc.SignalR;
using GroupDocs.Viewer.Config;
using GroupDocs.Viewer.Handler;
using Microsoft.Practices.Unity;

namespace GroupDocs.Demo.Annotation.Mvc.App_Start
{
    /// <summary>
    /// Specifies the Unity configuration for the main container.
    /// </summary>
    public class UnityConfig
    {
        #region Unity Container
        private static Lazy<IUnityContainer> container = new Lazy<IUnityContainer>(() =>
        {
            var container = new UnityContainer();
            RegisterTypes(container);

            return container;
        });

        /// <summary>
        /// Gets the configured Unity container.
        /// </summary>
        public static IUnityContainer GetConfiguredContainer()
        {
            return container.Value;
        }
        #endregion

        /// <summary>Registers the type mappings with the Unity container.</summary>
        /// <param name="container">The unity container to configure.</param>
        /// <remarks>There is no need to register concrete types such as controllers or API controllers (unless you want to 
        /// change the defaults), as Unity allows resolving a concrete type even if it was not previously registered.</remarks>
        public static void RegisterTypes(IUnityContainer container)
        {
            // NOTE: To load from web.config uncomment the line below. Make sure to add a Microsoft.Practices.Unity.Configuration to the using statements.
            // container.LoadConfiguration();
            container.RegisterType<IHtmlString, AnnotationWidget>("AnnotationWidget");

            ViewerConfig viewerConfig = new ViewerConfig
            {
                StoragePath = AppDomain.CurrentDomain.GetData("DataDirectory") + "/",
                TempPath = AppDomain.CurrentDomain.GetData("DataDirectory") + "\\Temp",
                UseCache = true
            };

            container.RegisterInstance(typeof(ViewerConfig), viewerConfig);
            container.RegisterInstance(typeof (ViewerImageHandler), new ViewerImageHandler(viewerConfig));
            container.RegisterInstance(typeof(ViewerHtmlHandler), new ViewerHtmlHandler(viewerConfig));
            var repositoryFolder = AppDomain.CurrentDomain.GetData("DataDirectory") + "/";
            container.RegisterInstance(typeof (IDocumentRepository), new DocumentRepository(repositoryFolder));
            container.RegisterInstance(typeof(IAnnotationCollaboratorRepository), new AnnotationCollaboratorRepository(repositoryFolder));
            container.RegisterInstance(typeof(IAnnotationReplyRepository), new AnnotationReplyRepository(repositoryFolder));
            container.RegisterInstance(typeof(IAnnotationRepository), new AnnotationRepository(repositoryFolder));
            container.RegisterInstance(typeof(IUserRepository), new UserRepository(repositoryFolder));

            container.RegisterType<IAnnotator, Annotator>();
            container.RegisterType<IAnnotationService, AnnotationService>();
            container.RegisterType<IAuthenticationService, AuthenticationService>();
            container.RegisterType<IAnnotationBroadcaster, AnnotationBroadcaster>();
            container.RegisterType<IAnnotationHub, AnnotationHub>();
        }
    }
}
