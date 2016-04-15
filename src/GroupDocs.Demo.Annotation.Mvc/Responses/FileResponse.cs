namespace GroupDocs.Demo.Annotation.Mvc.Responses
{
    public class FileResponse : FailedResponse
    {
        public FileResponse()
        {
        }

        public FileResponse(string path)
        {
            success = true;
            this.fileId = path;
        }

        public string fileId { get; set; }
    }
}
