using System.Web.Mvc;
using GroupDocs.Annotation.DataLayer.Sample.AuthenticationTypes.Attributes;

namespace GroupDocs.Annotation.Mvc.Sample
{
    public class FilterConfig
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
            filters.Add(new LogonAuthorize());
        }
    }
}