using System;
using System.Collections.Generic;
using System.Web;
using GroupDocs.Web.Annotation.Responses;

namespace GroupDocs.Demo.Annotation.WebForms
{
    public abstract class JsonHttpHandler : IHttpHandler
    {
        public virtual void ProcessRequest(HttpContext context)
        {
            try
            {
                var payload = DeserializeRequest(context);
                ProcessRequest(context, payload);
            }
            catch (Exception e)
            {
                SerializeResponse(context, new FailedResponse { success = false, Reason = e.Message });
            }
        }

        protected abstract void ProcessRequest(HttpContext context, Dictionary<string, object> payload);

        protected Dictionary<string, object> DeserializeRequest(HttpContext context)
        {
            var isJsonP = (context.Request.HttpMethod == "GET" &&
                !String.IsNullOrEmpty(context.Request.Params["data"]));

            if (!isJsonP && (context.Request.InputStream == null || !context.Request.InputStream.CanRead))
            {
                return null;
            }

            using (var sr = isJsonP ? new System.IO.StringReader(context.Request.Params["data"]) :
                (System.IO.TextReader) new System.IO.StreamReader(context.Request.InputStream))
            using (var reader = new Newtonsoft.Json.JsonTextReader(sr))
            {
                var serializer = new Newtonsoft.Json.JsonSerializer();
                return serializer.Deserialize<Dictionary<string, object>>(reader);
            }
        }

        protected void SerializeResponse<R>(HttpContext context, R response)
        {
            var isJsonP = (context.Request.HttpMethod == "GET" &&
                !String.IsNullOrEmpty(context.Request.Params["callback"]));

            context.Response.ContentType = "application/json";
            context.Response.ContentEncoding = System.Text.Encoding.UTF8;

            using (var sw = new System.IO.StreamWriter(context.Response.OutputStream))
            using (var writer = new Newtonsoft.Json.JsonTextWriter(sw))
            {
                if (isJsonP)
                {
                    sw.Write(context.Request.Params["callback"]);
                    sw.Write('(');
                }

                var serializer = new Newtonsoft.Json.JsonSerializer();
                serializer.Serialize(writer, response);

                if (isJsonP)
                {
                    sw.Write(')');
                }
            }
        }

        public virtual bool IsReusable
        {
            get { return true; }
        }
    }
}
