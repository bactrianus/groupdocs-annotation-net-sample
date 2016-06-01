using System;
using System.Web;
using GroupDocs.Annotation.Config;
using GroupDocs.Annotation.Handler;
using GroupDocs.Annotation.Handler.Input;
using GroupDocs.Demo.Annotation.Mvc.Security;
using GroupDocs.Demo.Annotation.Mvc.Service;
using GroupDocs.Demo.Annotation.Mvc.SignalR;
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

            string repositoryFolder = AppDomain.CurrentDomain.GetData("DataDirectory") + "/";
            var annotator = new AnnotationImageHandler(
               new AnnotationConfig { StoragePath = repositoryFolder } ,
                new Data.Json.Repositories.UserRepository(repositoryFolder),
                new Data.Json.Repositories.DocumentRepository(repositoryFolder),
                new Data.Json.Repositories.AnnotationRepository(repositoryFolder),
                new Data.Json.Repositories.AnnotationReplyRepository(repositoryFolder),
                new Data.Json.Repositories.AnnotationCollaboratorRepository(repositoryFolder));

            
            container.RegisterInstance(typeof(IUserDataHandler), annotator.GetUserDataHandler());


            #region Instances
            //container.RegisterInstance(typeof (IDocumentDataHandler), new DocumentRepository(repositoryFolder));
            //container.RegisterInstance(typeof(IAnnotationCollaboratorDataHandler), new AnnotationCollaboratorRepository(repositoryFolder));
            //container.RegisterInstance(typeof(IAnnotationReplyDataHandler), new AnnotationReplyRepository(repositoryFolder));
            //container.RegisterInstance(typeof(IAnnotationDataHandler), new AnnotationRepository(repositoryFolder));
            //container.RegisterInstance(typeof(IInputDataHandler), new InputDataHandler(repositoryFolder));
            //container.RegisterInstance(typeof(IFileDataStore), new FileStore(repositoryFolder));
            #endregion Instances


            container.RegisterInstance(typeof(AnnotationImageHandler), annotator);

            container.RegisterType<IAnnotationService, AnnotationService>();
            container.RegisterType<IAuthenticationService, AuthenticationService>();
            container.RegisterType<IAnnotationBroadcaster, AnnotationBroadcaster>();
            container.RegisterType<IAnnotationHub, AnnotationHub>();
        }
    }
}
