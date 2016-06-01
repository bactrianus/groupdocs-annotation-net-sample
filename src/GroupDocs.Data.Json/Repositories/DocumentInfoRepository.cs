using System;
using System.IO;
using GroupDocs.Annotation.Domain;
using GroupDocs.Annotation.Domain.Containers;
using GroupDocs.Annotation.Helper;
using Newtonsoft.Json;

namespace GroupDocs.Data.Json.Repositories
{
    public class DocumentInfoRepository : IFileDataStore
    {
        private string repoPath;
        protected readonly object _syncRoot = new object();
        public DocumentInfoRepository(string repoPath)
        {
            this.repoPath = repoPath;
        }
        public void SaveDescription(DocumentInfoContainer description)
        {
            if(description == null)
                return;
            string descriptionFolder = Path.Combine(repoPath, description.Name, description.DocumentType);

            lock (_syncRoot)
            {
                if(!Directory.Exists(descriptionFolder))
                    Directory.CreateDirectory(descriptionFolder);
                try
                {
                    using(var stream = File.OpenWrite(Path.Combine(descriptionFolder, "fd.json")))
                    using(var writer = new StreamWriter(stream))
                    using(JsonWriter jwriter = new JsonTextWriter(writer) { Formatting = Formatting.Indented })
                    {
                        JsonSerializer serializer = new JsonSerializer();
                        serializer.Serialize(jwriter, description);
                    }
                }
                catch(Exception e)
                {
                    throw new Exception("Failed to serialize an object to file: '{0}'.", e);
                }
            }
        }

        public DocumentInfoContainer GetDescription(string guid)
        {
            string descriptionFile = Path.Combine(repoPath, guid, "fd.json");
            lock (_syncRoot)
            {
                try
                {
                    if(!File.Exists(descriptionFile))
                    {
                        return null;
                    }

                    using(var stream = File.OpenRead(descriptionFile))
                    using(var reader = new StreamReader(stream))
                    using(JsonReader jreader = new JsonTextReader(reader))
                    {
                        JsonSerializer serializer = new JsonSerializer();
                        return  serializer.Deserialize<DocumentInfoContainer>(jreader);
                    }
                }
                catch(Exception e)
                {
                    throw new Exception("Failed to deserialize an object from file: '{0}'.", e);
                }
            }
        }

        public FileData GetFileData(FileDescription fileDescription)
        {
            throw new NotImplementedException();
        }

        public void SaveFileData(FileDescription fileDescription, FileData fileData)
        {
            throw new NotImplementedException();
        }
    }
}
