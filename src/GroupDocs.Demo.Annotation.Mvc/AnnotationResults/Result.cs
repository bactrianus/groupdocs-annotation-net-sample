using System.Runtime.Serialization;

namespace GroupDocs.Demo.Annotation.Mvc.AnnotationResults
{
    public interface IResult
    {
    }

    [DataContract()]
    public class Result : IResult
    {
    }
}