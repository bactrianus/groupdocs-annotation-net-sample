using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using GroupDocs.Annotation.Contracts;
using GroupDocs.Annotation.Contracts.DataObjects;
using Newtonsoft.Json;

namespace GroupDocs.Annotation.DataLayer.Sample
{
    public class JsonDataSaver : IAnnotationDataLayer
    {
        /// <summary>
        ///     Path to storage.
        /// </summary>
        private static string storagePath;

        public IEnumerable<DocumentMetadata> GetDocumentsInfo()
        {
            var documents = new List<DocumentMetadata>();
            var folders = Directory.EnumerateDirectories(storagePath + "\\Documents\\").ToList();
            foreach (var doc in folders)
            {
                using (var file = File.OpenText(doc + "/" + "Description.json"))
                {
                    var serializer = new JsonSerializer();
                    var documentMetadata = (DocumentMetadata) serializer.Deserialize(file, typeof (DocumentMetadata));
                    documents.Add(documentMetadata);
                }
            }

            return documents;
        }

        public DocumentMetadata GetDocumentMetadata(string fileId)
        {
            var descPath = storagePath + "\\Documents\\" + fileId + "\\Description.json";
            using (var file = File.OpenText(descPath))
            {
                var serializer = new JsonSerializer();
                return (DocumentMetadata) serializer.Deserialize(file, typeof (DocumentMetadata));
            }
        }

        public bool DeleteDocument(string fileId)
        {
            var docPath = storagePath + "\\Documents\\" + fileId;
            if (!Directory.Exists(docPath))
            {
                return true;
            }

            Directory.Delete(docPath, true);
            return true;
        }

        public void SetStoragePath(string path)
        {
            storagePath = path;
        }

        /// <summary>
        ///     Save new document to the Database
        /// </summary>
        /// <param name="documentStream">
        ///     The document stream.
        /// </param>
        /// <param name="documentInfo">
        ///     The document info.
        /// </param>
        /// <returns>
        ///     The <see cref="Guid" />.
        /// </returns>
        public string SaveDocument(Stream documentStream, DocumentMetadata documentInfo)
        {
            documentInfo.DocumentId = Guid.NewGuid().ToString();
            try
            {
                if (Directory.Exists(storagePath + documentInfo.DocumentId))
                {
                    throw new Exception("Directory already exists");
                }

                Directory.CreateDirectory(storagePath + "/Documents/" + documentInfo.DocumentId);
            }
            catch (Exception)
            {
                throw new Exception("Failed to create directory");
            }

            var docPath = storagePath + "/Documents/" + documentInfo.DocumentId;
            var fileName = documentInfo.Name;
            const string fileDescriptionName = "Description.json";

            // Save document
            using (var fileStream = new FileStream(docPath + "/" + fileName, FileMode.Create))
            {
                var data = new byte[documentStream.Length];
                documentStream.Seek(0, SeekOrigin.Begin);
                documentStream.Read(data, 0, data.Length);
                fileStream.Write(data, 0, data.Length);
                fileStream.Close();
            }

            // Save document description
            using (var fs = File.Open(docPath + "/" + fileDescriptionName, FileMode.CreateNew))
            using (var sw = new StreamWriter(fs))
            using (var jw = new JsonTextWriter(sw))
            {
                jw.Formatting = Formatting.Indented;
                var serializer = new JsonSerializer();
                serializer.Serialize(jw, documentInfo);
            }

            return documentInfo.DocumentId;
        }

        /// <summary>
        ///     Returns stream with document
        /// </summary>
        /// <returns>
        ///     The <see cref="Stream" />.
        /// </returns>
        public Stream GetClearDocument(string documentId)
        {
            var path = storagePath + "\\Documents\\" + documentId;
            DocumentMetadata documentMetadata;
            Stream document;
            using (var file = File.OpenText(path + "/" + "Description.json"))
            {
                var serializer = new JsonSerializer();
                documentMetadata = (DocumentMetadata) serializer.Deserialize(file, typeof (DocumentMetadata));
            }

            try
            {
                document = new FileStream(path + "\\" + documentMetadata.Name, FileMode.Open);
            }
            catch (Exception)
            {
                throw new Exception("File reading exception");
            }

            var tempDocument = new MemoryStream();
            document.CopyTo(tempDocument);
            document.Dispose();
            return tempDocument;
        }

        public IEnumerable<AnnotationDataObject> GetDocumentAnnotations(string documentId)
        {
            var annotationsDictionary = GetDictionaryFromFile(documentId);
            return annotationsDictionary == null
                ? null
                : annotationsDictionary.Keys.Select(id => annotationsDictionary[id])
                    .Select(versionDictionary => versionDictionary.Values.Last())
                    .ToList();
        }

        public AnnotationDataObject GetDocumentAnnotation(string documentId, string annotationId, int version)
        {
            var annotationsDictionary = GetDictionaryFromFile(documentId);
            var versionList = annotationsDictionary[annotationId];
            if (versionList.ContainsKey(version))
            {
                return versionList[version];
            }

            return versionList.Values.Last();
        }

        /// <summary>
        ///     Create new annotation
        /// </summary>
        /// <param name="documentId"></param>
        /// <param name="newAnnotation">
        ///     The new annotation.
        /// </param>
        /// <returns>
        ///     The Id of new annotation.
        /// </returns>
        /// <exception cref="Exception">
        ///     File open exception
        /// </exception>
        public string CreateAnnotation(string documentId, AnnotationDataObject newAnnotation)
        {
            var path = storagePath + "\\Documents\\" + documentId;
            var annotationsDictionary = GetDictionaryFromFile(documentId)
                                        ?? new SortedDictionary<string, SortedDictionary<int, AnnotationDataObject>>();
            var versionDictionary = new SortedDictionary<int, AnnotationDataObject>
            {
                {newAnnotation.Version, newAnnotation}
            };
            annotationsDictionary.Add(newAnnotation.Id, versionDictionary);
            var annotationJson = JsonConvert.SerializeObject(annotationsDictionary, Formatting.Indented);

            using (var sw = File.CreateText(path + "/" + "Annotations.json"))
            {
                sw.Write(annotationJson);
                sw.Close();
            }

            return newAnnotation.Id;
        }

        public AnnotationDataObject EditAnnotation(string documentId, AnnotationDataObject annotation)
        {
            var path = storagePath + "\\Documents\\" + documentId;
            var annotationsDictionary = GetDictionaryFromFile(documentId)
                                        ?? new SortedDictionary<string, SortedDictionary<int, AnnotationDataObject>>();
            var versionDictionary = annotationsDictionary[annotation.Id];
            versionDictionary.Add(annotation.Version, annotation);
            annotationsDictionary.Remove(annotation.Id);
            annotationsDictionary.Add(annotation.Id, versionDictionary);
            var annotationsDictionaryJson = JsonConvert.SerializeObject(annotationsDictionary, Formatting.Indented);
            using (var sw = File.CreateText(path + "/" + "Annotations.json"))
            {
                sw.Write(annotationsDictionaryJson);
                sw.Close();
            }

            return annotation;
        }

        public bool DeleteAnnotation(string documentId, AnnotationDataObject deletedAnnotation)
        {
            var path = storagePath + "\\Documents\\" + documentId;
            var annotationsDictionary = GetDictionaryFromFile(documentId)
                                        ?? new SortedDictionary<string, SortedDictionary<int, AnnotationDataObject>>();
            var versionDictionary = annotationsDictionary[deletedAnnotation.Id];
            versionDictionary.Add(deletedAnnotation.Version, deletedAnnotation);
            annotationsDictionary.Remove(deletedAnnotation.Id);
            annotationsDictionary.Add(deletedAnnotation.Id, versionDictionary);
            var annotationsDictionaryJson = JsonConvert.SerializeObject(annotationsDictionary, Formatting.Indented);
            using (var sw = File.CreateText(path + "/" + "Annotations.json"))
            {
                sw.Write(annotationsDictionaryJson);
            }

            return true;
        }

        public string CreateAnnotationReply(string documentId, string annotationId, AnnotationReplyDataObject reply)
        {
            var path = storagePath + "\\Documents\\" + documentId;
            var annotationsDictionary = GetDictionaryFromFile(documentId)
                                        ?? new SortedDictionary<string, SortedDictionary<int, AnnotationDataObject>>();

            var versionDictionary = annotationsDictionary[annotationId];
            var annotation = versionDictionary.Values.Last();
            if (annotation.AnnotationReplies == null)
            {
                annotation.AnnotationReplies = new List<AnnotationReplyDataObject>();
            }

            // Add reply to annotation
            annotation.AnnotationReplies.Add(reply);
            annotationsDictionary.Remove(annotationId);
            annotationsDictionary.Add(annotationId, versionDictionary);

            // Save new collection to the file
            var annotationJson = JsonConvert.SerializeObject(annotationsDictionary, Formatting.Indented);

            using (var sw = File.CreateText(path + "/" + "Annotations.json"))
            {
                sw.Write(annotationJson);
            }

            return reply.Id;
        }

        public IEnumerable<AnnotationReplyDataObject> GetAnnotationReplies(string documentId, string annotationId)
        {
            var annotationsDictionary = GetDictionaryFromFile(documentId);
            var versionList = annotationsDictionary[annotationId];
            var annotation = versionList.Values.Last();
            return annotation.AnnotationReplies ?? new List<AnnotationReplyDataObject>();
        }

        public AnnotationReplyDataObject GetAnnotationReply(string documentId, string annotationId, string replyId)
        {
            var annotationsDictionary = GetDictionaryFromFile(documentId);
            var versionList = annotationsDictionary[annotationId];
            var annotation = versionList.Values.Last();
            return annotation.AnnotationReplies.Any() ? annotation.AnnotationReplies.Single(a => a.Id == replyId) : null;
        }

        public AnnotationReplyDataObject EditAnnotationReply(string documentId, string annotationId,
            AnnotationReplyDataObject newReply)
        {
            var path = storagePath + "\\Documents\\" + documentId;
            var annotationsDictionary = GetDictionaryFromFile(documentId);
            var versionDictionary = annotationsDictionary[annotationId];
            var annotation = versionDictionary.Values.Last();

            // Delete old reply
            annotation.AnnotationReplies = annotation.AnnotationReplies.Where(a => a.Id != newReply.Id).ToList();

            // Add new reply to annotation
            annotation.AnnotationReplies.Add(newReply);
            versionDictionary.Remove(annotation.Version);
            versionDictionary.Add(annotation.Version, annotation);
            annotationsDictionary.Remove(annotation.Id);
            annotationsDictionary.Add(annotation.Id, versionDictionary);
            var annotationsDictionaryJson = JsonConvert.SerializeObject(annotationsDictionary, Formatting.Indented);
            using (var sw = File.CreateText(path + "/" + "Annotations.json"))
            {
                sw.Write(annotationsDictionaryJson);
            }

            return newReply;
        }

        public bool DeleteAnnotationReply(string documentId, string annotationId, string annotationReplyId)
        {
            var path = storagePath + "\\Documents\\" + documentId;
            var annotationsDictionary = GetDictionaryFromFile(documentId);
            var versionDictionary = annotationsDictionary[annotationId];
            var annotation = versionDictionary.Values.Last();

            // Delete old reply
            annotation.AnnotationReplies = annotation.AnnotationReplies.Where(a => a.Id != annotationReplyId).ToList();
            versionDictionary.Remove(annotation.Version);
            versionDictionary.Add(annotation.Version, annotation);
            annotationsDictionary.Remove(annotation.Id);
            annotationsDictionary.Add(annotation.Id, versionDictionary);
            var annotationsDictionaryJson = JsonConvert.SerializeObject(annotationsDictionary, Formatting.Indented);
            using (var sw = File.CreateText(path + "/" + "Annotations.json"))
            {
                sw.Write(annotationsDictionaryJson);
            }

            return true;
        }

        public IEnumerable<CollaboratorDataObject> GetDocumentCollaborators(string documentId)
        {
            var documentMetadata = GetDocumentMetadata(documentId);
            return documentMetadata.Collaborators;
        }

        public string AddDocumentCollaborator(string documentId, CollaboratorDataObject collaborator)
        {
            var documentMetadata = GetDocumentMetadata(documentId);
            var collaborators = documentMetadata.Collaborators.ToList();
            collaborator.Id = Guid.NewGuid().ToString();
            collaborators.Add(collaborator);
            documentMetadata.Collaborators = collaborators;
            using (
                var fs = File.Open(storagePath + "/Documents/" + documentId + "/Description.json", FileMode.OpenOrCreate)
                )
            using (var sw = new StreamWriter(fs))
            using (var jw = new JsonTextWriter(sw))
            {
                jw.Formatting = Formatting.Indented;
                var serializer = new JsonSerializer();
                serializer.Serialize(jw, documentMetadata);
            }

            return collaborator.Id;
        }

        public CollaboratorDataObject EditDocumentCollaborator(string documentId, CollaboratorDataObject collaborator)
        {
            var documentMetadata = GetDocumentMetadata(documentId);
            var collaborators = documentMetadata.Collaborators ?? new List<CollaboratorDataObject>();
            var newCollaborators = collaborators.Where(a => a.Id != collaborator.Id).ToList();
            newCollaborators.Add(collaborator);
            documentMetadata.Collaborators = newCollaborators;
            using (
                var fs = File.Open(storagePath + "/Documents/" + documentId + "/Description.json", FileMode.OpenOrCreate)
                )
            using (var sw = new StreamWriter(fs))
            using (var jw = new JsonTextWriter(sw))
            {
                jw.Formatting = Formatting.Indented;
                var serializer = new JsonSerializer();
                serializer.Serialize(jw, documentMetadata);
            }

            return collaborator;
        }

        public bool RemoveDocumentCollaborator(string documentId, string collaboratorId)
        {
            var documentMetadata = GetDocumentMetadata(documentId);
            var collaborators = documentMetadata.Collaborators;
            if (collaborators != null)
            {
                var newCollaborators = collaborators.Where(a => a.Id != collaboratorId).ToList();
                documentMetadata.Collaborators = newCollaborators;
            }
            else
            {
                return false;
            }

            using (
                var fs = File.Open(storagePath + "/Documents/" + documentId + "/Description.json", FileMode.OpenOrCreate)
                )
            using (var sw = new StreamWriter(fs))
            using (var jw = new JsonTextWriter(sw))
            {
                jw.Formatting = Formatting.Indented;
                var serializer = new JsonSerializer();
                serializer.Serialize(jw, documentMetadata);
            }

            return true;
        }

        public IEnumerable<Role> GetRoles()
        {
            var path = storagePath;
            if (!File.Exists(path + "/" + "Roles.json"))
            {
                File.Create(path + "/" + "Roles.json");
                return null;
            }

            List<Role> roles;
            using (var stream = File.OpenRead(path + "/" + "Roles.json"))
            using (var reader = new StreamReader(stream))
            {
                var s = reader.ReadToEnd();
                if (s == string.Empty)
                {
                    return null;
                }

                roles = JsonConvert.DeserializeObject<List<Role>>(s);
            }

            return roles;
        }

        public List<string> GetRolePermissions(string roleName)
        {
            var path = storagePath;
            if (!File.Exists(path + "/" + "Roles.json"))
            {
                File.Create(path + "/" + "Roles.json");
                return new List<string>();
            }

            List<Role> roles;
            using (var stream = File.OpenRead(path + "/" + "Roles.json"))
            using (var reader = new StreamReader(stream))
            {
                var s = reader.ReadToEnd();
                if (s == string.Empty)
                {
                    return new List<string>();
                }

                roles = JsonConvert.DeserializeObject<List<Role>>(s);
            }

            var role = roles.FirstOrDefault(a => a.Name == roleName);
            return role == null ? new List<string>() : role.Permissions;
        }

        public string CreateUserRole(Role role)
        {
            var path = storagePath;
            if (!File.Exists(path + "/" + "Roles.json"))
            {
                File.Create(path + "/" + "Roles.json");
            }

            List<Role> roles;
            using (var stream = File.OpenRead(path + "/" + "Roles.json"))
            using (var reader = new StreamReader(stream))
            {
                var s = reader.ReadToEnd();
                roles = JsonConvert.DeserializeObject<List<Role>>(s);
            }

            if (roles == null)
            {
                roles = new List<Role>();
            }

            if (roles.Any(a => a.Name == role.Name))
            {
                return role.Name;
            }

            roles.Add(role);
            using (var sw = File.CreateText(path + "/" + "Roles.json"))
            {
                var rolesString = JsonConvert.SerializeObject(roles, Formatting.Indented);
                sw.Write(rolesString);
            }

            return role.Name;
        }

        public bool DeleteRoleFromUser(string roleName, string userId)
        {
            var user = GetUser(userId);
            user.Roles = user.Roles.Where(a => a != roleName).ToList();
            EditUser(user);
            return true;
        }

        public bool AddRoleToUser(string roleName, string userId)
        {
            var user = GetUser(userId);
            user.Roles.Add(roleName);
            EditUser(user);
            return true;
        }

        public bool AddRolePermission(string role, string permission)
        {
            var path = storagePath;
            if (!File.Exists(path + "/" + "Roles.json"))
            {
                File.Create(path + "/" + "Roles.json");
                return false;
            }

            List<Role> roles;
            using (var stream = File.OpenRead(path + "/" + "Roles.json"))
            using (var reader = new StreamReader(stream))
            {
                var s = reader.ReadToEnd();
                roles = JsonConvert.DeserializeObject<List<Role>>(s);
                if (roles == null)
                {
                    return false;
                }
            }

            var oldRole = roles.FirstOrDefault(a => a.Name == role) ?? new Role();
            oldRole.Permissions.Add(permission);
            roles = roles.Where(a => a.Name != role).ToList();
            roles.Add(oldRole);
            var rolesString = JsonConvert.SerializeObject(roles, Formatting.Indented);
            using (var sw = File.CreateText(path + "/" + "Roles.json"))
            {
                sw.Write(rolesString);
            }

            return true;
        }

        public bool RemoveRolePermission(string role, string permission)
        {
            var path = storagePath;
            if (!File.Exists(path + "/" + "Roles.json"))
            {
                File.Create(path + "/" + "Roles.json");
                return false;
            }

            List<Role> roles;
            using (var stream = File.OpenRead(path + "/" + "Roles.json"))
            using (var reader = new StreamReader(stream))
            {
                var s = reader.ReadToEnd();
                roles = JsonConvert.DeserializeObject<List<Role>>(s);
                if (roles == null)
                {
                    return false;
                }
            }

            var oldRole = roles.FirstOrDefault(a => a.Name == role);
            oldRole.Permissions = oldRole.Permissions.Where(a => a != permission).ToList();
            roles = roles.Where(a => a.Name != role).ToList();
            roles.Add(oldRole);
            var rolesString = JsonConvert.SerializeObject(roles, Formatting.Indented);
            using (var sw = File.CreateText(path + "/" + "Roles.json"))
            {
                sw.Write(rolesString);
            }

            return true;
        }

        public bool DeleteUserRole(string roleName)
        {
            var path = storagePath;
            if (!File.Exists(path + "/" + "Roles.json"))
            {
                File.Create(path + "/" + "Roles.json");
                return true;
            }

            List<Role> roles;
            using (var stream = File.OpenRead(path + "/" + "Roles.json"))
            using (var reader = new StreamReader(stream))
            {
                var s = reader.ReadToEnd();
                roles = JsonConvert.DeserializeObject<List<Role>>(s);
                if (roles == null)
                {
                    return true;
                }
            }

            roles = roles.Where(a => a.Name != roleName).ToList();

            var rolesString = JsonConvert.SerializeObject(roles, Formatting.Indented);
            using (var sw = File.CreateText(path + "/" + "Roles.json"))
            {
                sw.Write(rolesString);
            }

            return true;
        }

        public List<string> GetPermissions()
        {
            var path = storagePath;
            if (!File.Exists(path + "/" + "Permissions.json"))
            {
                File.Create(path + "/" + "Permissions.json");
                return new List<string>();
            }

            List<string> permissions;
            using (var stream = File.OpenRead(path + "/" + "Permissions.json"))
            using (var reader = new StreamReader(stream))
            {
                var s = reader.ReadToEnd();
                if (s == string.Empty)
                {
                    return new List<string>();
                }

                permissions = JsonConvert.DeserializeObject<List<string>>(s);
            }

            return permissions;
        }

        public string CreatePermission(string permissionName)
        {
            var path = storagePath;
            if (!File.Exists(path + "/" + "Permissions.json"))
            {
                File.Create(path + "/" + "Permissions.json");
            }

            List<string> permissions;
            using (var stream = File.OpenRead(path + "/" + "Permissions.json"))
            using (var reader = new StreamReader(stream))
            {
                var s = reader.ReadToEnd();
                permissions = JsonConvert.DeserializeObject<List<string>>(s);
            }

            if (permissions == null)
            {
                permissions = new List<string>();
            }

            if (permissions.Any(a => a == permissionName))
            {
                return permissionName;
            }

            permissions.Add(permissionName);
            var rolesString = JsonConvert.SerializeObject(permissions, Formatting.Indented);
            using (var sw = File.CreateText(path + "/" + "Permissions.json"))
            {
                sw.Write(rolesString);
            }

            return permissionName;
        }

        public bool DeletePermission(string permissionName)
        {
            var path = storagePath;
            if (!File.Exists(path + "/" + "Permissions.json"))
            {
                File.Create(path + "/" + "Permissions.json");
            }

            List<string> permissions;
            using (var stream = File.OpenRead(path + "/" + "Permissions.json"))
            using (var reader = new StreamReader(stream))
            {
                var s = reader.ReadToEnd();
                permissions = JsonConvert.DeserializeObject<List<string>>(s);
            }
            permissions = permissions.Where(a => a != permissionName).ToList();

            var permissionsString = JsonConvert.SerializeObject(permissions, Formatting.Indented);
            using (var sw = File.CreateText(path + "/" + "Permissions.json"))
            {
                sw.Write(permissionsString);
            }

            return true;
        }

        public IEnumerable<UserDataObject> GetUsers()
        {
            var filePath = storagePath + "\\Users\\Users.json";
            var usersList = new List<UserDataObject>();
            if (!File.Exists(filePath))
            {
                return null;
            }

            using (var file = File.OpenText(filePath))
            {
                var serializer = new JsonSerializer();
                usersList = (List<UserDataObject>) serializer.Deserialize(file, typeof (List<UserDataObject>));
            }

            return usersList;
        }

        public UserDataObject GetUser(string userId)
        {
            var filePath = storagePath + "\\Users\\Users.json";
            List<UserDataObject> usersList;
            using (var file = File.OpenText(filePath))
            {
                var serializer = new JsonSerializer();
                usersList = (List<UserDataObject>) serializer.Deserialize(file, typeof (List<UserDataObject>));
            }

            var user = usersList.FirstOrDefault(a => a.Id == userId);
            if (user == null)
            {
                throw new AnnotatorException("User not found");
            }

            return user;
        }

        public string CreateUser(UserDataObject user)
        {
            var filePath = storagePath + "\\Users\\Users.json";
            var usersList = new List<UserDataObject>();
            if (File.Exists(filePath))
            {
                using (var file = File.OpenText(filePath))
                {
                    var serializer = new JsonSerializer();
                    usersList = (List<UserDataObject>) serializer.Deserialize(file, typeof (List<UserDataObject>));
                }
            }
            else
            {
                File.Create(filePath);
            }

            if (usersList == null)
            {
                usersList = new List<UserDataObject>();
            }

            if (usersList.Any(s => s.Name == user.Login))
            {
                return GetUserId(user.Login);
            }

            usersList.Add(user);
            var users = JsonConvert.SerializeObject(usersList, Formatting.Indented);
            using (var sw = File.CreateText(filePath))
            {
                sw.Write(users);
            }

            return user.Id;
        }

        public bool EditUser(UserDataObject user)
        {
            var filePath = storagePath + "\\Users\\Users.json";
            List<UserDataObject> usersList;
            if (File.Exists(filePath))
            {
                using (var file = File.OpenText(filePath))
                {
                    var serializer = new JsonSerializer();
                    usersList = (List<UserDataObject>) serializer.Deserialize(file, typeof (List<UserDataObject>));
                }
            }
            else
            {
                return false;
            }

            if (usersList == null)
            {
                return false;
            }

            usersList = usersList.Where(s => s.Id != user.Id).ToList();
            usersList.Add(user);
            var users = JsonConvert.SerializeObject(usersList, Formatting.Indented);
            using (var sw = File.CreateText(filePath))
            {
                sw.Write(users);
            }

            return true;
        }

        public bool DeleteUser(UserDataObject user)
        {
            var filePath = storagePath + "\\Users\\Users.json";
            List<UserDataObject> usersList;
            if (File.Exists(filePath))
            {
                using (var file = File.OpenText(filePath))
                {
                    var serializer = new JsonSerializer();
                    usersList = (List<UserDataObject>) serializer.Deserialize(file, typeof (List<UserDataObject>));
                }
            }
            else
            {
                return false;
            }

            if (usersList == null)
            {
                return false;
            }

            usersList = usersList.Where(s => s.Id != user.Id).ToList();
            var users = JsonConvert.SerializeObject(usersList, Formatting.Indented);
            using (var sw = File.CreateText(filePath))
            {
                sw.Write(users);
            }

            return true;
        }

        public string GetUserId(string login)
        {
            var filePath = storagePath + "\\Users\\Users.json";
            List<UserDataObject> usersList;
            using (var file = File.OpenText(filePath))
            {
                var serializer = new JsonSerializer();
                usersList = (List<UserDataObject>) serializer.Deserialize(file, typeof (List<UserDataObject>));
            }

            var firstOrDefault = usersList.FirstOrDefault(a => a.Login == login);
            if (firstOrDefault == null)
            {
                return null;
            }

            return firstOrDefault.Id;
        }

        public AnnotationDataObject GetDocumentAnnotation(string documentId, string annotationId)
        {
            var annotationsDictionary = GetDictionaryFromFile(documentId);
            var versionList = annotationsDictionary[annotationId];


            return versionList.Values.Last();
        }

        private SortedDictionary<string, SortedDictionary<int, AnnotationDataObject>> GetDictionaryFromFile(
            string documentId)
        {
            var path = storagePath + "\\Documents\\" + documentId;
            if (!File.Exists(path + "/" + "Annotations.json"))
            {
                var file = File.Create(path + "/" + "Annotations.json");
                file.Close();
                return null;
            }

            SortedDictionary<string, SortedDictionary<int, AnnotationDataObject>> annotationsDictionary;
            using (var stream = File.OpenRead(path + "/" + "Annotations.json"))
            using (var reader = new StreamReader(stream))
            {
                var s = reader.ReadToEnd();
                if (s == string.Empty)
                {
                    return null;
                }

                annotationsDictionary =
                    JsonConvert.DeserializeObject<SortedDictionary<string, SortedDictionary<int, AnnotationDataObject>>>
                        (s);
            }

            return annotationsDictionary;
        }
    }
}