namespace GroupDocs.Demo.Annotation.Mvc.Responses
{
    public class UrlResponse : FailedResponse
    {
        public UrlResponse()
        {
        }

        public UrlResponse(string url)
        {
            success = true;
            this.url = url;
        }

        public string url { get; set; }
    }
}
