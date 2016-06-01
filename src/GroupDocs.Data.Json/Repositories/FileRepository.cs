using System;
using System.Collections.Generic;
using System.IO;
using GroupDocs.Annotation.Domain;
using GroupDocs.Annotation.Domain.Containers;
using GroupDocs.Annotation.Domain.Options;
using GroupDocs.Annotation.Handler.Input;
using GroupDocs.Annotation.Helper;

namespace GroupDocs.Data.Json.Repositories
{
    public class FileRepository : IInputDataHandler
    {
        private string _repoPath;
        public FileRepository(string repoPath)
        {
            _repoPath = repoPath;
        }
        public Stream GetFile(string guid)
        {
            string filePath = Path.Combine(_repoPath, guid);
            if(!File.Exists(filePath))
            {
                throw new Exception(string.Format("File {0} is not exist.", guid));
            }
            MemoryStream result = new MemoryStream();
            using(var fs = new FileStream(filePath, FileMode.Open))
            {
                fs.CopyTo(result);
            }
            return result;
        }

        public FileDescription GetFileDescription(string guid)
        {
            throw new NotImplementedException();
        }

        public DateTime GetLastModificationDate(string guid)
        {
            throw new NotImplementedException();
        }

        public List<FileDescription> LoadFileTree(FileTreeOptions fileTreeOptions)
        {
            throw new NotImplementedException();
        }
        

        public bool SaveFile(string guid, Stream file)
        {
            string fileDirectory = Path.Combine(_repoPath, guid);
            string fileName = Path.GetFileName(guid);
            string filePath = Path.Combine(fileDirectory, fileName);
            if(File.Exists(filePath))
            {
                throw new Exception(string.Format("File {0} already exist.", guid));
            }
            if(!Directory.Exists(Path.Combine(_repoPath, guid)))
            {
                Directory.CreateDirectory(fileDirectory);
            }
            using(var fs = new FileStream(filePath, FileMode.Create))
            {
                file.CopyTo(fs);
            }
            return true;
        }
    }
}
