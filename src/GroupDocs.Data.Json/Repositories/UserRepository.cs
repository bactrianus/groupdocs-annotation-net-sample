using System;
using System.IO;
using GroupDocs.Annotation.Handler.Input;
using GroupDocs.Annotation.Handler.Input.DataObjects;

namespace GroupDocs.Data.Json.Repositories
{
    public class UserRepository : JsonRepository<User>, IUserDataHandler
    {
        private const string _repoName = "GroupDocs.users.json";

        public UserRepository(string repositoryFolder)
            : base(Path.Combine(repositoryFolder, _repoName))
        {
        }

        public User GetUserByEmail(string email)
        {
            lock (_syncRoot)
            {
                try
                {
                    return Data.Find(x => x.Email == email);
                }
                catch(Exception e)
                {
                    throw new DataJsonException("Failed to get user by email address.", e);
                }
            }
        }

        public User GetUserByGuid(string guid)
        {
            lock (_syncRoot)
            {
                try
                {
                    return Data.Find(x => x.Guid == guid);
                }
                catch(Exception e)
                {
                    throw new DataJsonException("Failed to get user by GUID.", e);
                }
            }
        }
    }
}
