using GroupDocs.Annotation.Domain;

namespace GroupDocs.Demo.Annotation.Mvc.Options
{

    /// <summary>
    /// Encapsulate a set of properties used to draw graphics annotations
    /// </summary>
    public class DrawingOptions
    {
        public DrawingOptions()
        {
            PenWidth = 1;
        }

        /// <summary>
        /// Stroke width in pixels, default is 1
        /// </summary>
        public byte PenWidth { get; set; }

        /// <summary>
        /// Stroke color, the reviewer color is used by default
        /// </summary>
        public int? PenColor { get; set; }

        /// <summary>
        /// The style used for dashed lines
        /// </summary>
        public DashStyle DashStyle { get; set; }

        /// <summary>
        /// The color of the brush used to fill the entire area
        /// </summary>
        public int? BrushColor { get; set; }

        public byte PenStyle
        {
            get { return (byte) this.DashStyle; }
            set { this.DashStyle = (DashStyle) value; }
        }
    }
}
