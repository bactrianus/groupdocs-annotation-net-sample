using System;
using System.IO;
using System.Linq;
using GroupDocs.Annotation.Handler.Input;
using GroupDocs.Annotation.Handler.Input.DataObjects;

namespace GroupDocs.Data.Json.Repositories
{
    public class AnnotationCollaboratorRepository : JsonRepository<AnnotationCollaborator>, IAnnotationCollaboratorDataHandler
    {
        private const string _repoName = "GroupDocs.annotation.collaborators.json";

        public AnnotationCollaboratorRepository(string repositoryFolder)
            : base(Path.Combine(repositoryFolder, _repoName))
        {
        }

        public AnnotationCollaborator[] GetDocumentCollaborators(long documentId)
        {
            lock (_syncRoot)
            {
                try
                {
                    return Data.Where(x => x.DocumentId == documentId).ToArray();
                }
                catch (Exception e)
                {
                    throw new DataJsonException("Failed to get document collaborators.", e);
                }
            }
        }
    }
}
