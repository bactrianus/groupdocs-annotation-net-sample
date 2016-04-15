using System;

namespace GroupDocs.Data.Json
{
    public class DataJsonException : Exception
    {
        public DataJsonException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
