using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using GroupDocs.Annotation.Handler.Input;
using GroupDocs.Annotation.Handler.Input.DataObjects;

namespace GroupDocs.Data.Json.Repositories
{
    public class AnnotationReplyRepository : JsonRepository<AnnotationReply>, IAnnotationReplyDataHandler
    {
        
        private const string _repoName = "GroupDocs.annotation.replies.json";

        public AnnotationReplyRepository(string repositoryFolder)
            : base(Path.Combine(repositoryFolder, _repoName))
        {
        }
        

        public AnnotationReply GetReply(string guid)
        {
            lock (_syncRoot)
            {
                try
                {
                    return Data.FirstOrDefault(x => x.Guid == guid);
                }
                catch (Exception e)
                {
                    throw new DataJsonException("Failed to get annotation reply by GUID.", e);
                }
            }
        }

        public AnnotationReply[] GetReplies(long annotationId)
        {
            lock (_syncRoot)
            {
                try
                {
                    return Data
                        .Where(x => x.AnnotationId == annotationId)
                        .OrderBy(r => r.RepliedOn)
                        .ToArray();
                }
                catch (Exception e)
                {
                    throw new DataJsonException("Failed to get annotation replies.", e);
                }
            }
        }

        public bool DeleteReplyAndChildReplies(long replyId)
        {
            lock (_syncRoot)
            {
                try
                {
                    var data = this.Data;
                    bool returnValue = true;

                    AnnotationReply reply = data.FirstOrDefault(r => r.Id == replyId);
                    List<AnnotationReply> childReplies = new List<AnnotationReply>();
                    AnnotationReply[] repliesOfCurrentLevel = data.Where(r => r.ParentReplyId == replyId).ToArray();
                    List<AnnotationReply> repliesOfNextLevel = new List<AnnotationReply>();

                    while (repliesOfCurrentLevel.Length > 0)
                    {
                        repliesOfNextLevel.Clear();
                        childReplies.AddRange(repliesOfCurrentLevel);

                        for (int i = 0; i < repliesOfCurrentLevel.Length; i++)
                        {
                            decimal id = repliesOfCurrentLevel[i].Id;
                            repliesOfNextLevel.AddRange(
                                data.Where(r => r.ParentReplyId == id).ToArray());
                        }

                        repliesOfCurrentLevel = repliesOfNextLevel.ToArray();
                    }

                    childReplies.Reverse();
                    childReplies.ForEach(x => returnValue &= base.Remove(x));

                    returnValue &= base.Remove(reply);
                    return returnValue;
                }
                catch (Exception e)
                {
                    throw new DataJsonException("Failed to delete annotation replies.", e);
                }
            }
        }
    }
}
