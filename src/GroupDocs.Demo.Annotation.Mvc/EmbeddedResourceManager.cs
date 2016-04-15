using System.IO;
using System.Reflection;

namespace GroupDocs.Demo.Annotation.Mvc
{
    public class EmbeddedResourceManager
    {
        private const string _namespace = "GroupDocs.Demo.Annotation.Mvc";
        private readonly Assembly _assembly = Assembly.GetExecutingAssembly();

        public string GetScript(string resourceName)
        {
            resourceName = string.Format("{0}.Scripts.{1}", _namespace, resourceName.Replace('/', '.'));
            string text;
            var stream = _assembly.GetManifestResourceStream(resourceName);
            if (stream == null)
            {
                return string.Empty;
            }
            using (var reader = new StreamReader(stream))
            {
                text = reader.ReadToEnd();
            }
            return text;
        }

        public string GetCss(string resourceName)
        {
            resourceName = string.Format("{0}.CSS.{1}", _namespace, resourceName.Replace('/', '.'));
            string text;
            var stream = _assembly.GetManifestResourceStream(resourceName);
            if(stream == null)
            {
                return string.Empty;
            }
            using(var reader = new StreamReader(stream))
            {
                text = reader.ReadToEnd();
            }
            return text;
        }

        public byte[] GetBinaryResource(string resourceName)
        {
            byte[] resource;
            resourceName = string.Format("{0}.Images.{1}", _namespace, resourceName.Replace('/', '.'));
            var stream = _assembly.GetManifestResourceStream(resourceName);
            if (stream == null)
            {
                return null;
            }
            using (var reader = new BinaryReader(stream))
            {
                resource = reader.ReadBytes((int) stream.Length);
            }
            return resource;
        }
    }
}
