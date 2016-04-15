using System.Web;
using Groupdocs.Web.UI.EventHandling;
using GroupDocs.Web.Annotation;
using StructureMap;

namespace GroupDocs.Demo.Annotation.WebForms.Models
{
    internal class DocumentOpenSubscriber : IEventSubscriber
    {
        public void HandleEvent(IEvent eventDesc)
        {
            var documentEvent = (IDocumentProcessingEvent)eventDesc;
            string path = documentEvent.DocumentPath;
            string un = "";
            if(HttpContext.Current.Session != null)
            {
                un = HttpContext.Current.Session["UserName"] != null ? HttpContext.Current.Session["UserName"].ToString() : "";
            }
            if (!string.IsNullOrEmpty(un))
            {
                // add user to the document collaborator list
                var svc = ObjectFactory.GetInstance<IAnnotationService>();
                svc.AddCollaborator(path, un, null, null, null);
            }
            else
            {
                // add anonymous user to the document collaborator list
                var svc = ObjectFactory.GetInstance<IAnnotationService>();
                svc.AddCollaborator(path, "GroupDocs@GroupDocs.com", "Anonym", "A.", null); // allow anonymous users to annotate on a document
            }
        }
    }
}