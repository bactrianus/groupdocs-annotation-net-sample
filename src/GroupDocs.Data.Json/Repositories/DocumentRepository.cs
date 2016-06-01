using System;
using System.IO;
using GroupDocs.Annotation.Handler.Input;
using GroupDocs.Annotation.Handler.Input.DataObjects;

namespace GroupDocs.Data.Json.Repositories
{
    public class DocumentRepository : JsonRepository<Document>, IDocumentDataHandler
    {
        private const string _repoName = "GroupDocs.annotation.documents.json";

        public DocumentRepository(string repositoryFolder)
            : base(Path.Combine(repositoryFolder, _repoName))
        {
        }

        
        public Document GetDocument(string name)
        {
            lock (_syncRoot)
            {
                try
                {
                    return Data.Find(x => x.Name == name);
                }
                catch(Exception e)
                {
                    throw new DataJsonException("Failed to get document by id.", e);
                }
            }
        }
    }
}
