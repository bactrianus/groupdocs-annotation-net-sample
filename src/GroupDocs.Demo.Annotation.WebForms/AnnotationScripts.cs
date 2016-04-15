using System.Text;

namespace GroupDocs.Demo.Annotation.WebForms
{

    public class AnnotationScripts : GroupDocs.Web.Annotation.AnnotationScripts
    {
        public override string ToString()
        {
            var html = new StringBuilder();
            html.AppendLine(base.ToString());
            //todo move signalr script
            html.AppendFormat(@"<script type=""text/javascript"" src=""{0}signalr1_1_2/hubs""></script>", base._appPath);
            html.AppendLine();
            html.AppendLine("<script type='text/javascript'>");
            html.AppendLine("var container = window.Container || new JsInject.Container();");
            html.AppendLine("container.Register('PathProvider', function (c) { return jSaaspose.utils; }, true);");
            html.AppendLine("window.Container = container;");
            html.AppendLine("</script>");
            return html.ToString();
        }
    }
}
