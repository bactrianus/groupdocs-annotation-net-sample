using System.Collections.Generic;

namespace GroupDocs.Annotation.DataLayer.Sample.AuthenticationTypes
{
    public class MyCookie
    {
        public MyCookie()
        {
            Roles = new List<string>();
        }

        public string Id { get; set; }
        public string Login { get; set; }
        public string UserName { get; set; }
        public List<string> Roles { get; set; }
    }
}