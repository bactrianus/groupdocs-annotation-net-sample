using System;

namespace GroupDocs.Demo.Annotation.Mvc.Options
{
    [Flags]
    public enum AnnotationTools
    {
        /// <summary>
        /// The text selection tool
        /// </summary>
        Text = 1,

        /// <summary>
        /// The rectangular area drawing tool
        /// </summary>
        Area = Text << 1,

        /// <summary>
        /// The pointer tool
        /// </summary>
        Point = Area << 1,

        /// <summary>
        /// The text strikout tool
        /// </summary>
        TextStrikeout = Point << 1,

        /// <summary>
        /// The polyline drawing tool
        /// </summary>
        Polyline = TextStrikeout << 1,

        /// <summary>
        /// The text field tool
        /// </summary>
        TextField = Polyline << 1,

        /// <summary>
        /// The watermark tool
        /// </summary>
        Watermark = TextField << 1,

        /// <summary>
        /// The text replacement tool
        /// </summary>
        TextReplacement = Watermark << 1,

        /// <summary>
        /// The line drawing tool
        /// </summary>
        Arrow = TextReplacement << 1,

        /// <summary>
        /// The text redaction tool
        /// </summary>
        TextRedaction = Arrow << 1,

        /// <summary>
        /// The resources redaction tool
        /// </summary>
        ResourceRedaction = TextRedaction << 1,

        /// <summary>
        /// The underline text tool
        /// </summary>
        TextUnderline = ResourceRedaction  << 1,

        /// <summary>
        /// The distance tool to measure the distance between two points
        /// </summary>
        Distance = TextUnderline << 1,

        /// <summary>
        /// All the available tools
        /// </summary>
        All = (Text | Area | Point | TextStrikeout | Polyline | TextField | Watermark | TextReplacement | Arrow | TextRedaction | ResourceRedaction | TextUnderline | Distance)
    }
}
