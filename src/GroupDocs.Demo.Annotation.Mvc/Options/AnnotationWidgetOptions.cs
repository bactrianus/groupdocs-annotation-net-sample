using GroupDocs.Annotation.Domain;

namespace GroupDocs.Demo.Annotation.Mvc.Options
{
    /// <summary>
    /// Encapsulates annotation widget properties
    /// </summary>
    public class AnnotationWidgetOptions
    {
        /// <summary>
        /// A default zoom value
        /// </summary>
        public const byte DefZoom = 100;

        /// <summary>
        /// A default quality value
        /// </summary>
        public const byte DefQuality = 90;

        public AnnotationWidgetOptions()
        {
            Zoom = DefZoom;
            Quality = DefQuality;
            ShowThumbnails = true;
            ShowZoom = true;
            ShowPaging = true;
            EnableRightClickMenu = true;
            EnableSidePanel = true;
            ShowHeader = true;
            ShowToolbar = true;
            ScrollOnFocus = true;
            EnableStandardErrorHandling = true;
            UndoEnabled = true;
            Tools = AnnotationTools.All;
            HighlightColor = -1;
            AnyToolSelection = true;
            TooltipsEnabled = true;
	        EnableAnnotationsAutoImport = false;
            SearchForSeparateWords = false;
        }


        #region Properties
        
        /// <summary>
        /// An HTML DOM element identifier
        /// </summary>
        public string ElementId { get; set; }

        /// <summary>
        /// A file path to be opened on application startup
        /// </summary>
        public string FilePath { get; set; }

        /// <summary>
        /// A document global access rights
        /// </summary>
        public AnnotationReviewerRights? AccessRights { get; set; }

        /// <summary>
        /// A width of the container
        /// </summary>
        public int Width { get; set; }

        /// <summary>
        /// A height of the container
        /// </summary>
        public int Height { get; set; }

        /// <summary>
        /// A quality of the page images
        /// </summary>
        public byte Quality { get; set; }

        /// <summary>
        /// Specifies whether a right click is allowed for the container
        /// </summary>
        public bool EnableRightClickMenu { get; set; }

        /// <summary>
        /// Specifies whether the header is visible
        /// </summary>
        public bool ShowHeader { get; set; }

        /// <summary>
        /// Specifies whether the zooming widget is visible
        /// </summary>
        public bool ShowZoom { get; set; }

        /// <summary>
        /// Specifies whether the pagination widget is visible
        /// </summary>
        public bool ShowPaging { get; set; }

        /// <summary>
        /// Specifies whether the file open button is visible
        /// </summary>
        public bool ShowFileExplorer { get; set; }

        /// <summary>
        /// Specifies wheter the thumbnails pane is visible
        /// </summary>
        public bool ShowThumbnails { get; set; }

        /// <summary>
        /// Specifies whether the annotation tools bar is visible
        /// </summary>
        public bool ShowToolbar { get; set; }

        /// <summary>
        /// Specifies whether the thumbnails pane is opened on application startup
        /// </summary>
        public bool OpenThumbnails { get; set; }

        /// <summary>
        /// Specifies whether the page fits the container width on application startup
        /// </summary>
        public bool ZoomToFitWidth { get; set; }

        /// <summary>
        /// Specifies whether the page fits the container height on application startup
        /// </summary>
        public bool ZoomToFitHeight { get; set; }

        /// <summary>
        /// Zoom value on application startup
        /// </summary>
        public byte Zoom { get; set; }

        /// <summary>
        /// A number of pages to load on application start
        /// </summary>
        public int PreloadPageCount { get; set; }

        /// <summary>
        /// Specifies whether the right hand side pane is visible
        /// </summary>
        public bool EnableSidePanel { get; set; }

        /// <summary>
        /// Specifies whether the document should be scrolled up when an annotation receives focus
        /// </summary>
        public bool ScrollOnFocus { get; set; }

        /// <summary>
        /// A color for the text strikeout tool
        /// </summary>
        public int? StrikeOutColor { get; set; }

        /// <summary>
        /// A color for the text underline tool
        /// </summary>
        public int? UnderlineColor { get; set; }

        /// <summary>
        /// A color for the highlight text tool
        /// </summary>
        public int HighlightColor { get; set; }

        /// <summary>
        /// A background color for the text field annotation
        /// </summary>
        public int? TextFieldBackgroundColor { get; set; }

        /// <summary>
        /// Annotation tools allowed for the application
        /// </summary>
        public AnnotationTools Tools { get; set; }

        /// <summary>
        /// A text strikeout tool mode which is used for the annotations export
        /// </summary>
        public StrikeoutToolMode StrikeoutMode { get; set; }

        /// <summary>
        /// A connecting line position used to connect an annotation with its icon on the side bar
        /// </summary>
        public ConnectorPosition ConnectorPos { get; set; }

        /// <summary>
        /// The area annotation tool drawing options
        /// </summary>
        public DrawingOptions AreaToolOptions { get; set; }

        /// <summary>
        /// The polyline annotation tool drawing options
        /// </summary>
        public DrawingOptions PolylineToolOptions { get; set; }

        /// <summary>
        /// The arrow annotation tool drawing options
        /// </summary>
        public DrawingOptions ArrowToolOptions { get; set; }

        /// <summary>
        /// Specifies whether an annotation reply is saved when an input box losses the focus
        /// </summary>
        public bool SaveReplyOnFocusLoss { get; set; }

        /// <summary>
        /// Specifies whether an annotation is activated by clicking on it
        /// </summary>
        public bool ClickableAnnotations { get; set; }

        /// <summary>
        /// Specifies whether a connecting line should be removed for annotations without comments
        /// </summary>
        public bool DisconnectUncommented { get; set; }

        /// <summary>
        /// The flag indicating whether a standard modal window is displayed when an error occurs
        /// </summary>
        public bool EnableStandardErrorHandling { get; set; }

        /// <summary>
        /// Specifies the minimum width of the page images to be loaded from the server
        /// </summary>
        public int MinimumImageWidth { get; set; }

        /// <summary>
        /// The flag indicating whether undo/redo feature is enabled or not
        /// </summary>
        public bool UndoEnabled { get; set; }

        /// <summary>
        /// The font settings for the typewriter tool
        /// </summary>
        public FontOptions TypewriterFont { get; set; }

        /// <summary>
        /// The font settings for the watermark tool
        /// </summary>
        public FontOptions WatermarkFont { get; set; }


        /// <summary>
        /// Gets or sets the flag indicating if annotations can be selected when a tool other than the hand one is active or not
        /// </summary>
        public bool AnyToolSelection { get; set; }

        /// <summary>
        /// Gets or sets the flag indicating if a tab-based navigation is enabled for annotations
        /// </summary>
        public bool TabNavigationEnabled { get; set; }

        /// <summary>
        /// Gets or sets the flag indicating if text selection is enabled when the hand tool is active
        /// </summary>
        public bool TextSelectionEnabled { get; set; }

        /// <summary>
        /// Gets or sets the text selection mode
        /// </summary>
        public bool TextSelectionByCharModeEnabled { get; set; }

        /// <summary>
        /// Gets or sets the flag indicating if a tooltip is enabled for annotations
        /// </summary>
        public bool TooltipsEnabled { get; set; }

        /// <summary>
        /// Gets or sets custom watermark options
        /// </summary>
        public WatermarkOptions Watermark { get; set; }

        /// <summary>
        /// Gets or sets the flag indicating if an active tool is automatically deactivated once an annotation is created
        /// </summary>
        public ToolDeactivationMode ToolDeactivation { get; set; }

		/// <summary>
		/// Gets or sets the flag indicating if annotations will be imported automatically after document opened
		/// (works only with pdf documents)
		/// </summary>
		public bool EnableAnnotationsAutoImport { get; set; }

        /// <summary>
        /// Viewers ability for search symbols
        /// </summary>
        public bool SearchForSeparateWords { get; set; }
        #endregion Properties
    }
}
