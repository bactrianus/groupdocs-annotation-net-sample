using System;
using System.IO;
using System.Linq;
using GroupDocs.Annotation.Data.Contracts.Repositories;

namespace GroupDocs.Data.Json.Repositories
{
    public class AnnotationRepository : JsonRepository<Annotation.Data.Contracts.DataObjects.Annotation>, IAnnotationRepository
    {
        private const string _repoName = "GroupDocs.annotations.json";

        public AnnotationRepository(string repositoryFolder)
            : base(Path.Combine(repositoryFolder, _repoName))
        {
        }


        public Annotation.Data.Contracts.DataObjects.Annotation GetAnnotation(string guid)
        {
            lock (_syncRoot)
            {
                try
                {
                    return Data.FirstOrDefault(x => x.Guid == guid);
                }
                catch (Exception e)
                {
                    throw new DataJsonException("Failed to get annotation by GUID.", e);
                }
            }
        }
        public Annotation.Data.Contracts.DataObjects.Annotation[] GetDocumentAnnotations(long documentId, int? pageNumber = null)
        {
            lock (_syncRoot)
            {
                try
                {
                    return  Data
                        .Where(x => x.DocumentId == documentId && (pageNumber == null || x.PageNumber == pageNumber))
                        .ToArray();;
                }
                catch (Exception e)
                {
                    throw new DataJsonException("Failed to get document annotations.", e);
                }
            }
        }
    }
}
