using System.Web.Mvc;
using GroupDocs.Demo.Annotation.Mvc.App_Start;
using Microsoft.Practices.Unity;

namespace GroupDocs.Demo.Annotation.Mvc
{
    public static class HtmlHelperExtensions
    {
        /// <summary>
        /// Creates an instance of an object rendering annotation JavaScript code
        /// </summary>
        /// <returns>An instance of the JavaScript rendering object</returns>
        public static AnnotationScripts AnnotationScripts(this HtmlHelper self)
        {
            return new AnnotationScripts();
        }

        /// <summary>
        /// Creates an instance of an object creating annotation widget HTML code
        /// </summary>
        /// <returns>An instance of the HTML code creation object</returns>
        public static AnnotationWidget Annotation(this HtmlHelper self)
        {
            return UnityConfig.GetConfiguredContainer().Resolve<AnnotationWidget>();
        }
    }
}
