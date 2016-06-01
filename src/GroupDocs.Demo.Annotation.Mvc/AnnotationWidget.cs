using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using GroupDocs.Demo.Annotation.Mvc.Options;
using AnnotationReviewerRights = GroupDocs.Annotation.Domain.AnnotationReviewerRights;

namespace GroupDocs.Demo.Annotation.Mvc
{
    public class AnnotationWidget : IHtmlString
    {
        #region Fields
        private string _storagePath = AppDomain.CurrentDomain.GetData("DataDirectory") + "/"; // App_Data folder path
        private const string _annotationWidgetClass = "groupdocsAnnotation";
        private const string _htmlTemplate = @"
            <script type=""text/javascript"">
                $(function () {{
                    var annotationWidget = $('#{0}').{1}({{
                        {2}
                    }});
                }});
            </script>";

        private readonly IAuthenticationService _authSvc;
        private readonly IAnnotationService _annotationSvc;

        protected AnnotationWidgetOptions _options = new AnnotationWidgetOptions();
        protected InputStream? _stream;
        #endregion Fields
        

        public AnnotationWidget(IAuthenticationService authSvc, IAnnotationService annotationSvc)
        {
            _authSvc = authSvc;
            _annotationSvc = annotationSvc;
        }

        /// <summary>
        /// Sets an HTML DOM element identifier
        /// </summary>
        /// <param name="id">A DOM element identifier</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ElementId(string id)
        {
            _options.ElementId = id;
            return this;
        }

        /// <summary>
        /// Sets a file path to be opened on application startup
        /// </summary>
        /// <param name="path">A file path</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget FilePath(string path)
        {
            _options.FilePath = path;
            return this;
        }

        /// <summary>
        /// Sets a document stream and its name to be opened
        /// </summary>
        /// <param name="stream">The file stream</param>
        /// <param name="fileName">The file name</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget Stream(Stream stream, string fileName)
        {
            //Filename validation
            if(string.IsNullOrWhiteSpace(fileName) == true)
            {
                throw new ArgumentException("Filename cannot be NULL or empty string");
            }
            string tempFilename = fileName.Trim().ToLowerInvariant();
            if(tempFilename.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
            {
                throw new ArgumentException("Filename contains invalid characters");
            }
            string[] illegalFilenames =
            { "CON", "PRN", "AUX", "NUL",
                "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
                "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9" };

            if(illegalFilenames.Contains(tempFilename, StringComparer.InvariantCultureIgnoreCase))
            {
                throw new ArgumentException("Filename is invalid");
            }
            if(tempFilename.Length > 200)
            {
                throw new ArgumentException("Filename is too long");
            }
            //Extension validation
            string extension = Path.GetExtension(tempFilename);
            if(extension == "")
            {
                throw new ArgumentException("Specified filename should contain extension");
            }
            extension = extension.Trim().TrimStart(new char[1] { '.' });

            //Defining a FileType
            string[] supportedExtensions = Enum.GetNames(typeof(FileType));
            string[] cleared = Array.FindAll(supportedExtensions, s => s.Equals("Undefined", StringComparison.OrdinalIgnoreCase) == false).ToArray();

            var definedFileType = FileType.Undefined;

            for(int i = 0; i < cleared.Length; i++)
            {
                string current = cleared[i];
                if(current.Equals(extension, StringComparison.OrdinalIgnoreCase) == true)
                {
                    definedFileType = (FileType) Enum.Parse(typeof(FileType), current, true);
                    break;
                }
            }

            if(definedFileType == FileType.Undefined)
            {
                throw new ArgumentException("Extension '" + extension + "' is unknown or not supported");
            }

            _stream = new InputStream { Stream = stream, FileName = fileName, FileType = definedFileType };
            return this;
        }

        /// <summary>
        /// Sets a document stream and its content type to be opened
        /// </summary>
        /// <param name="stream">The file stream</param>
        /// <param name="fileType">The stream content type</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget Stream(Stream stream, FileType fileType)
        {
            _stream = new InputStream { Stream = stream, FileType = fileType, FileName = Guid.NewGuid().ToString() };
            return this;
        }

        /// <summary>
        /// Sets the document global access rights
        /// </summary>
        /// <param name="rights">The access rights value</param>
        /// <returns></returns>
        public AnnotationWidget AccessRights(AnnotationReviewerRights rights)
        {
            _options.AccessRights = rights;
            return this;
        }

        /// <summary>
        /// Sets a width of the container
        /// </summary>
        /// <param name="width">A width value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget Width(int width)
        {
            _options.Width = width;
            return this;
        }

        /// <summary>
        /// Sets a height of the container
        /// </summary>
        /// <param name="height"></param>
        /// <returns>A height value</returns>
        public AnnotationWidget Height(int height)
        {
            _options.Height = height;
            return this;
        }

        /// <summary>
        /// Sets a quality of the page images
        /// </summary>
        /// <param name="quality">A quality value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget Quality(byte quality)
        {
            _options.Quality = quality;
            return this;
        }

        /// <summary>
        /// Sets a flag specifying whether a right click is allowed for the container
        /// </summary>
        /// <param name="enabled">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget EnableRightClickMenu(bool enabled)
        {
            _options.EnableRightClickMenu = enabled;
            return this;
        }

        /// <summary>
        /// Sets a flag specifying whether the header is visible
        /// </summary>
        /// <param name="show">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ShowHeader(bool show)
        {
            _options.ShowHeader = show;
            return this;
        }

        /// <summary>
        /// Sets a flag specifying whether the zooming widget is visible
        /// </summary>
        /// <param name="show">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ShowZoom(bool show)
        {
            _options.ShowZoom = show;
            return this;
        }

        /// <summary>
        /// Sets a flag specifying whether the pagination widget is visible
        /// </summary>
        /// <param name="show">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ShowPaging(bool show)
        {
            _options.ShowPaging = show;
            return this;
        }


        /// <summary>
        /// Sets a flag specifying whether the file open button is visible
        /// </summary>
        /// <param name="show">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ShowFileExplorer(bool show)
        {
            _options.ShowFileExplorer = show;
            return this;
        }

        /// <summary>
        /// Sets a flag specifying wheter the thumbnails pane is visible
        /// </summary>
        /// <param name="show">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ShowThumbnails(bool show)
        {
            _options.ShowThumbnails = show;
            return this;
        }

        /// <summary>
        /// Specifies whether the annotation tools bar is visible
        /// </summary>
        /// <param name="show">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ShowToolbar(bool show)
        {
            _options.ShowToolbar = show;
            return this;
        }

        /// <summary>
        /// Sets a flag specifying whether the thumbnails pane is opened on application startup
        /// </summary>
        /// <param name="open">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget OpenThumbnails(bool open)
        {
            _options.OpenThumbnails = open;
            return this;
        }

        /// <summary>
        /// Sets a flag specifying whether the page fits the container width on application startup
        /// </summary>
        /// <param name="fit">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ZoomToFitWidth(bool fit)
        {
            _options.ZoomToFitWidth = fit;
            return this;
        }

        /// <summary>
        /// Sets a flag specifying whether the page fits the container height on application startup
        /// </summary>
        /// <param name="fit">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ZoomToFitHeight(bool fit)
        {
            _options.ZoomToFitHeight = fit;
            return this;
        }

        /// <summary>
        /// Sets a zoom value on application startup
        /// </summary>
        /// <param name="factor">A positive integer</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget Zoom(byte factor)
        {
            _options.Zoom = factor;
            return this;
        }

        /// <summary>
        /// Sets a number of pages to load on application start
        /// </summary>
        /// <param name="count">A positive integer</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget PreloadPageCount(int count)
        {
            _options.PreloadPageCount = count;
            return this;
        }

        /// <summary>
        /// Sets a flag specifying whether the right hand side pane is visible
        /// </summary>
        /// <param name="enable">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget EnableSidePanel(bool enable = true)
        {
            _options.EnableSidePanel = enable;
            return this;
        }

        /// <summary>
        /// Sets a flag specifying whether the document is scrolled up when an annotation receives focus
        /// </summary>
        /// <param name="scroll">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ScrollOnFocus(bool scroll = true)
        {
            _options.ScrollOnFocus = scroll;
            return this;
        }

        /// <summary>
        /// Sets a color for the text strikeout tool
        /// </summary>
        /// <param name="color">An integer color value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget StrikeOutColor(int color)
        {
            _options.StrikeOutColor = color;
            return this;
        }

        /// <summary>
        /// Sets a color for the text underline tool
        /// </summary>
        /// <param name="color">An integer color value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget UnderlineColor(int color)
        {
            _options.UnderlineColor = color;
            return this;
        }

        /// <summary>
        /// Sets a color for the highlight text tool
        /// </summary>
        /// <param name="color">An integer color value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget HighlightColor(int color)
        {
            _options.HighlightColor = color;
            return this;
        }

        /// <summary>
        /// Sets a background color for the text field annotation
        /// </summary>
        /// <param name="color">An integer color value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget TextFieldBackgroundColor(int color)
        {
            _options.TextFieldBackgroundColor = color;
            return this;
        }

        /// <summary>
        /// Sets a connecting line position used to connect an annotation with its icon on the side bar
        /// </summary>
        /// <param name="position">One of the allowed position values</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ConnectorPos(ConnectorPosition position = ConnectorPosition.Middle)
        {
            _options.ConnectorPos = position;
            return this;
        }

        /// <summary>
        /// Sets a flag specifying whether an annotation reply is saved when an input box losses the focus
        /// </summary>
        /// <param name="saveReplyOnFocusLoss">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget SaveReplyOnFocusLoss(bool saveReplyOnFocusLoss)
        {
            _options.SaveReplyOnFocusLoss = saveReplyOnFocusLoss;
            return this;
        }

        /// <summary>
        /// Sets a flag specifying whether an annotation is activated by clicking on it
        /// </summary>
        /// <param name="clickable">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ClickableAnnotations(bool clickable)
        {
            _options.ClickableAnnotations = clickable;
            return this;
        }

        /// <summary>
        /// Sets a flag specifying whether a connecting line should be removed for annotations without comments
        /// </summary>
        /// <param name="disconnect">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget DisconnectUncommented(bool disconnect)
        {
            _options.DisconnectUncommented = disconnect;
            return this;
        }

        /// <summary>
        /// Sets a flag indicating whether a standard modal window is displayed when an error occurs
        /// </summary>
        /// <param name="enabled">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget EnableStandardErrorHandling(bool enabled)
        {
            _options.EnableStandardErrorHandling = enabled;
            return this;
        }

        /// <summary>
        /// Sets a flag indicating if annotations will be imported automatically after document opened
        /// (works only with pdf documents)
        /// </summary>
        /// <param name="enabled">A flag value</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget EnableAnnotationsAutoImport(bool enabled)
        {
            _options.EnableAnnotationsAutoImport = enabled;
            return this;
        }

        /// <summary>
        /// Sets annotation tools allowed for the application
        /// </summary>
        /// <param name="tools">A combination of annotation tools</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget Tools(AnnotationTools tools)
        {
            _options.Tools = tools;
            return this;
        }

        /// <summary>
        /// Sets area annotation tool drawing options
        /// </summary>
        /// <param name="options">The drawing options used to display area annotations</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget AreaToolOptions(DrawingOptions options)
        {
            _options.AreaToolOptions = options;
            return this;
        }

        /// <summary>
        /// Sets polyline annotation tool drawing options
        /// </summary>
        /// <param name="options">The drawing options used to display polyline annotations</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget PolylineToolOptions(DrawingOptions options)
        {
            _options.PolylineToolOptions = options;
            return this;
        }

        /// <summary>
        /// Sets arrow annotation tool drawing options
        /// </summary>
        /// <param name="options">The drawing options used to display polyline annotations</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ArrowToolOptions(DrawingOptions options)
        {
            _options.ArrowToolOptions = options;
            return this;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="minWidth">The minimum page image width</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget MinimumImageWidth(int minWidth)
        {
            _options.MinimumImageWidth = minWidth;
            return this;
        }

        /// <summary>
        /// Enables or disables the undo/redo functionality
        /// </summary>
        /// <param name="enabled">The flag indicating whether the undo/redo functionality is enabled or not</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget EnableUndo(bool enabled)
        {
            _options.UndoEnabled = enabled;
            return this;
        }

        /// <summary>
        /// Sets the font settings for the typewriter tool
        /// </summary>
        /// <param name="size">The font size</param>
        /// <param name="family">The font family</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget TypewriterFont(float size, string family = null)
        {
            _options.TypewriterFont = new FontOptions { Size = size, Family = family };
            return this;
        }

        /// <summary>
        /// Sets the font settings for the watermark tool
        /// </summary>
        /// <param name="size">The font size</param>
        /// <param name="family">The font family</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget WatermarkFont(float size, string family = null)
        {
            _options.WatermarkFont = new FontOptions { Size = size, Family = family };
            return this;
        }


        /// <summary>
        /// Sets the flag indicating if annotations can be selected when a tool other than the hand one is active or not
        /// </summary>
        /// <param name="any">The flag indicating the selection mode</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget AnyToolSelection(bool any)
        {
            _options.AnyToolSelection = any;
            return this;
        }

        /// <summary>
        /// Enables or disables the tab-based navigation of annotations
        /// </summary>
        /// <param name="enabled">The flag indicating if the tab-based navigation is enabled or not</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget EnableTabNavigation(bool enabled)
        {
            _options.TabNavigationEnabled = enabled;
            return this;
        }

        /// <summary>
        /// Enables or disables the tooltip for annotations
        /// </summary>
        /// <param name="enabled">The flag indicating if the tooltip is enabled or not</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget EnableTooltips(bool enabled)
        {
            _options.TooltipsEnabled = enabled;
            return this;
        }

        /// <summary>
        /// Enables or disables the text selection feature when the hand tool is active
        /// </summary>
        /// <param name="enabled">The flag indicating if the text selection is enabled or not</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget EnableTextSelection(bool enabled)
        {
            _options.TextSelectionEnabled = enabled;
            return this;
        }

        /// <summary>
        /// Sets text selection mode by words or chars
        /// </summary>
        /// <param name="mode">The parameter which indicates the text selection mode</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget TextSelectionMode(TextSelectionMode mode)
        {
            _options.TextSelectionByCharModeEnabled = (mode == Options.TextSelectionMode.ByChars);
            return this;
        }

        /// <summary>
        /// Sets custom watermark options
        /// </summary>
        /// <param name="watermark">An instance of the object containing the watermark options</param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget Watermark(WatermarkOptions watermark)
        {
            _options.Watermark = watermark;
            return this;
        }

        /// <summary>
        /// Sets the tool deactivation mode
        /// </summary>
        /// <param name="mode"></param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget ToolDeactivationMode(ToolDeactivationMode mode)
        {
            _options.ToolDeactivation = mode;
            return this;
        }

        /// <summary>
        /// Searche for separate words.
        /// </summary>
        /// <param name="value"></param>
        /// <returns>An instance of the widget object</returns>
        public AnnotationWidget SearchForSeparateWords(bool value)
        {
            _options.SearchForSeparateWords = value;
            return this;
        }

        public override string ToString()
        {
            if(_stream != null)
            {
                using(var fileStream = new FileStream(_storagePath +  _stream.Value.FileName, FileMode.Create))
                {
                    _stream.Value.Stream.CopyTo(fileStream);
                }
                _options.FilePath = _stream.Value.FileName;
            }

            if(_options.AccessRights != null && !string.IsNullOrEmpty(_options.FilePath))
            {
                _annotationSvc.SetDocumentAccessRights(
                    System.Text.RegularExpressions.Regex.Replace(_options.FilePath, "\\\\+", "\\"), _options.AccessRights.Value);
            }

            if(_options.EnableAnnotationsAutoImport)
            {
                _annotationSvc.ImportAnnotations(null, System.Text.RegularExpressions.Regex.Replace(_options.FilePath, "\\\\+", "\\"));
            }

            return string.Format(_htmlTemplate,
                                 _options.ElementId,
                                 _annotationWidgetClass,
                                 GetWidgetOptions());
        }

        public string ToHtmlString()
        {
            return ToString();
        }

        #region Private members
        private string GetWidgetOptions()
        {
            StringBuilder sb = new StringBuilder();

            const int minusPosition = 2;
            bool localeSupported;


            sb.Append("localizedStrings : null,");

            sb.AppendFormat("width: {0},", _options.Width);
            sb.AppendLine();

            sb.AppendFormat("height: {0},", _options.Height);
            sb.AppendLine();

            sb.AppendFormat("fileId: '{0}',", _options.FilePath);
            sb.AppendLine();

            sb.AppendFormat("docViewerId: '{0}-doc-viewer',", _options.ElementId);
            sb.AppendLine();

            sb.AppendFormat("quality: {0},", _options.Quality);
            sb.AppendLine();

            sb.AppendFormat("enableRightClickMenu: {0},", _options.EnableRightClickMenu.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("showHeader: {0},", _options.ShowHeader.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("showZoom: {0},", _options.ShowZoom.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("showPaging: {0},", _options.ShowPaging.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("showFileExplorer: {0},", _options.ShowFileExplorer.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("showThumbnails: {0},", _options.ShowThumbnails.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("showToolbar: {0},", _options.ShowToolbar.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("openThumbnails: {0},", _options.OpenThumbnails.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("zoomToFitWidth: {0},", _options.ZoomToFitWidth.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("zoomToFitHeight: {0},", _options.ZoomToFitHeight.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("initialZoom: {0},", _options.Zoom);
            sb.AppendLine();

            sb.AppendFormat("preloadPagesCount: {0},", _options.PreloadPageCount);
            sb.AppendLine();

            sb.AppendFormat("enableSidePanel: {0},", _options.EnableSidePanel.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("scrollOnFocus: {0},", _options.ScrollOnFocus.ToString().ToLower());
            sb.AppendLine();

            if(_options.StrikeOutColor != null)
            {
                sb.AppendFormat("strikeOutColor: '#{0,6:x6}',", _options.StrikeOutColor.Value);
                sb.AppendLine();
            }

            if(_options.UnderlineColor != null)
            {
                sb.AppendFormat("underlineColor: '#{0,6:x6}',", _options.UnderlineColor.Value);
                sb.AppendLine();
            }

            if(_options.HighlightColor >= 0)
            {
                sb.AppendFormat("highlightColor: '#{0,6:x6}',", _options.HighlightColor);
                sb.AppendLine();
            }

            if(_options.TextFieldBackgroundColor != null)
            {
                sb.AppendFormat("textFieldBackgroundColor: '#{0,6:x6}',", _options.TextFieldBackgroundColor.Value);
                sb.AppendLine();
            }

            sb.AppendFormat("enabledTools: {0},", _options.Tools.ToString("d"));
            sb.AppendLine();

            sb.AppendFormat("connectorPosition: {0},", _options.ConnectorPos.ToString("d"));
            sb.AppendLine();

            sb.AppendFormat("saveReplyOnFocusLoss: {0},", _options.SaveReplyOnFocusLoss.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("clickableAnnotations: {0},", _options.ClickableAnnotations.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("disconnectUncommented: {0},", _options.DisconnectUncommented.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("enableStandardErrorHandling: {0},", _options.EnableStandardErrorHandling.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("undoEnabled: {0},", _options.UndoEnabled.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("anyToolSelection: {0},", _options.AnyToolSelection.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("tabNavigationEnabled: {0},", _options.TabNavigationEnabled.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("tooltipsEnabled: {0},", _options.TooltipsEnabled.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("textSelectionEnabled: {0},", _options.TextSelectionEnabled.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("textSelectionByCharModeEnabled: {0},", _options.TextSelectionByCharModeEnabled.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("toolDeactivationMode: {0},", (byte) _options.ToolDeactivation);
            sb.AppendLine();

            if(_options.MinimumImageWidth > 0)
            {
                sb.AppendFormat("minimumImageWidth: {0},", _options.MinimumImageWidth);
                sb.AppendLine();
            }

            if(_options.AreaToolOptions != null)
            {
                sb.AppendFormat("areaToolOptions: {0},", GetToolDrawingOptions(_options.AreaToolOptions));
                sb.AppendLine();
            }

            if(_options.PolylineToolOptions != null)
            {
                sb.AppendFormat("polylineToolOptions: {0},", GetToolDrawingOptions(_options.PolylineToolOptions));
                sb.AppendLine();
            }

            if(_options.ArrowToolOptions != null)
            {
                sb.AppendFormat("arrowToolOptions: {0},", GetToolDrawingOptions(_options.ArrowToolOptions));
                sb.AppendLine();
            }

            if(_options.TypewriterFont != null)
            {
                sb.AppendFormat("typewriterFont: {0},", GetToolFontOptions(_options.TypewriterFont));
                sb.AppendLine();
            }

            if(_options.Watermark != null)
            {
                sb.AppendFormat("watermarkText: '{0}',", _options.Watermark.Text);
                sb.AppendLine();

                if(_options.Watermark.Color != null)
                {
                    sb.AppendFormat("watermarkColor: {0},", _options.Watermark.Color.Value.ToArgb());
                    sb.AppendLine();
                }

                sb.AppendFormat("watermarkPosition: '{0}',", _options.Watermark.Position.ToString());
                sb.AppendLine();
                sb.AppendFormat("watermarkFontSize: {0},", _options.Watermark.FontSize);
                sb.AppendLine();
            }


            if(_options.Watermark != null)
            {
                sb.AppendFormat("textSelectionByCharModeEnabled: {0},", _options.TextSelectionByCharModeEnabled.ToString().ToLower());
                sb.AppendLine();
            }


            sb.AppendLine("sideboarContainerSelector: 'div.comments_sidebar_wrapper',");
            sb.AppendLine("usePageNumberInUrlHash: false,");
            sb.AppendLine("textSelectionSynchronousCalculation: true,");
            sb.AppendLine("variableHeightPageSupport: true,");
            sb.AppendLine("useJavaScriptDocumentDescription: true,");
            sb.AppendLine("isRightPanelEnabled: true,");
            sb.AppendLine("createMarkup: true,");
            sb.AppendLine("use_pdf: 'true',");
            sb.AppendLine("_mode: 'annotatedDocument',");

            sb.AppendLine("selectionContainerSelector: \"[name='selection-content']\",");
            sb.AppendLine();

            sb.AppendLine("graphicsContainerSelector: '.annotationsContainer',");
            sb.AppendLine();

            sb.AppendFormat("searchForSeparateWords: {0},", _options.SearchForSeparateWords.ToString().ToLower());
            sb.AppendLine();

            sb.AppendFormat("userName: '{0}',", _authSvc.UserName);
            sb.AppendFormat("userId: '{0}'", _authSvc.UserKey);
            sb.AppendLine();

            return sb.ToString();
        }

        private static string GetToolDrawingOptions(DrawingOptions options)
        {
            return string.Format("{{ pen: {{ width: {0}, color: {1}, dashStyle: {2} }}, brush: {{ color: {3} }} }}",
                options.PenWidth,
                options.PenColor != null ? options.PenColor.ToString() : "null",
                options.DashStyle.ToString("d"),
                options.BrushColor != null ? options.BrushColor.ToString() : "null");
        }

        private static string GetToolFontOptions(FontOptions options)
        {
            return string.Format("{{ size: {0}, family: {1} }}",
                options.Size,
                string.IsNullOrEmpty(options.Family) ? "null" : string.Format("'{0}'", options.Family));
        }
        #endregion Private members

        #region Nested types
        protected struct InputStream
        {
            public Stream Stream
            {
                get; set;
            }
            public string FileName
            {
                get; set;
            }
            public FileType FileType
            {
                get; set;
            }
        }
        #endregion Nested types
    }
}
