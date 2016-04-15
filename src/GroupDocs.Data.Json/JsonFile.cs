using System;
using System.IO;
using Newtonsoft.Json;

namespace GroupDocs.Data.Json
{

    public class JsonFile<T>
        where T : new()
    {
        #region Fields
        protected readonly object _syncRoot = new object();

        private string _filePath;
        private T _data;
        #endregion Fields

        public JsonFile(string filePath)
        {
            if (String.IsNullOrWhiteSpace(filePath))
            {
                throw new ArgumentNullException("filePath");
            }

            _filePath = filePath;
        }

        protected virtual void Serialize()
        {
            if (_data == null)
            {
                return;
            }

            lock (_syncRoot)
            {
                if (_data != null)
                {
                    try
                    {
                        using (var stream = File.OpenWrite(_filePath))
                        using (var writer = new StreamWriter(stream))
                        using (JsonWriter jwriter = new JsonTextWriter(writer) {Formatting = Formatting.Indented})
                        {
                            JsonSerializer serializer = new JsonSerializer();
                            serializer.Serialize(jwriter, _data);
                        }
                    }
                    catch (Exception e)
                    {
                        throw new Exception("Failed to serialize an object to file: '{0}'.", e);
                    }
                }
            }
        }

        protected virtual void Deserialize()
        {
            lock (_syncRoot)
            {
                try
                {
                    if (!File.Exists(_filePath))
                    {
                        var fileStream = File.Create(_filePath);
                        fileStream.Close();
                        _data = new T();
                        return;
                    }

                    using (var stream = File.OpenRead(_filePath))
                    using (var reader = new StreamReader(stream))
                    using (JsonReader jreader = new JsonTextReader(reader))
                    {
                        JsonSerializer serializer = new JsonSerializer();
                        _data = serializer.Deserialize<T>(jreader);
                    }
                }
                catch (Exception e)
                {
                    throw new Exception("Failed to deserialize an object from file: '{0}'.", e);
                }

                if(_data == null)
                {
                    _data = new T();
                }
            }
        }

        protected T Data
        {
            get
            {
                lock (_syncRoot)
                {
                    if (_data == null)
                    {
                        Deserialize();
                    }

                    return _data;
                }
            }
        }
    }
}
