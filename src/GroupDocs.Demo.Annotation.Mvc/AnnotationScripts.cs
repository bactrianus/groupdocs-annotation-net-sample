using System.Text;
using System.Web;

namespace GroupDocs.Demo.Annotation.Mvc
{
    public class AnnotationScripts : IHtmlString
    {
        #region Fields
        private const string _urlPrefix = "document-annotation";
        private readonly string _appPath;
        private readonly string _scriptTemplate;
        private readonly string _stylesheetTemplate;
        private readonly string[] _scriptsViewer =
        {
            "libs/jquery-1.9.1.min.js",
            "libs/jquery-ui-1.10.3.min.js",
            "libs/knockout-3.2.0.js",
            "libs/turn.min.js",
            "libs/modernizr.2.6.2.Transform2d.min.js",
            "installableViewer.js"
        };

        private readonly string[] _scripts =
        {
            "libs/jquery.signalR-1.1.2.min.js",
            "libs/jquery.tinyscrollbar.min.js",
            "libs/jquery.custom-scrollbar.js",
            "libs/jquery.ui.touch-punch.min.js",
            "libs/mousetrap.js",
            "RaphaelJS/raphael-min.js",
            "jGroupDocs.Undo.js",
            "jGroupDocs.Utils.js",
            "jGroupDocs.Printable.js",
            "libs/bootstrap.min.js",
            "AnnotationService.js",
            "AnnotationCommands.js",
            "Annotation2Legacy.js",
            "AreaAnnotation.js",
            "PointAnnotation.js",
            "TextStrikeout.js",
            "PolylineAnnotation.js",
            "TextStrikeout.js",
            "TextField.js",
            "Watermark.js",
            "TextReplacement.js",
            "TextRedaction.js",
            "GraphicsAnnotation.js",
            "MeasurementAnnotation.js",
            "AnnotationWidget.js",
            "AnnotationInitControls.js"
        };
        private readonly string[] _stylesheets =
        {
            "Annotation.css",
            "Annotation.Toolbox.css",
            "bootstrap.css",
            "groupdocsViewer.all.css",
            "bootstrap.css",
            "groupdocsViewer.all.css",
            "jquery-ui-1.10.3.dialog.min.css"
        };
        #endregion Fields

        public AnnotationScripts()
        {
            var pathFinder = new ApplicationPathFinder();
            _appPath = pathFinder.GetApplicationPath();

            _scriptTemplate = string.Format("<script type='text/javascript' src='{0}{1}/GetScript{{0}}?name={{1}}'></script>",
                _appPath, _urlPrefix);
          
            _stylesheetTemplate = string.Format("<link rel='stylesheet' type='text/css' href='{0}{1}/CSS/GetCss{{0}}?name={{1}}' />",
                _appPath, _urlPrefix);
        }

        public override string ToString()
        {
            var html = new StringBuilder();
            
            foreach(var script in _scriptsViewer)
            {
                html.AppendFormat(_scriptTemplate, string.Empty, script);
                html.AppendLine();
            }
            html.AppendFormat("<script type='text/javascript'>$.ui.groupdocsViewer.prototype.applicationPath = '{0}';</script>",
                                             _appPath);

            html.Append("<script type='text/javascript'>$.ui.groupdocsViewer.prototype.useHttpHandlers = false;</script>");

            html.AppendFormat(_scriptTemplate, string.Empty, "libs/GroupdocsViewer.all.js");

            foreach(var script in _scripts)
            {
                html.AppendFormat(_scriptTemplate, string.Empty, script);
                html.AppendLine();
            }

            foreach(var css in _stylesheets)
            {
                html.AppendFormat(_stylesheetTemplate, string.Empty, css);
                html.AppendLine();
            }

            html.AppendFormat(@"<script type=""text/javascript"" src=""{0}signalr1_1_2/hubs""></script>", _appPath);
            html.AppendLine();

            html.AppendLine("<script type='text/javascript'>");

            html.AppendLine("var container = window.Container || new JsInject.Container();");
            html.AppendLine("container.Register('PathProvider', function (c) { return jSaaspose.utils; }, true);");
            html.AppendLine("window.Container = container;");

            html.AppendLine("</script>");

            return html.ToString();
        }

        string IHtmlString.ToHtmlString()
        {
            return ToString();
        }
    }
}