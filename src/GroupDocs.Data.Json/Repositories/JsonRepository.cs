using System;
using System.Collections.Generic;
using System.Linq;
using GroupDocs.Annotation.Handler.Input;
using GroupDocs.Annotation.Handler.Input.DataObjects;

namespace GroupDocs.Data.Json.Repositories
{
    public class JsonRepository<TEntity> : JsonFile<List<TEntity>>, IRepository<TEntity>
        where TEntity : class, IEntity
    {
        #region Fields
        private static readonly string _entityName = typeof(TEntity).Name;
        #endregion Fields

        public JsonRepository(string filePath)
            : base(filePath)
        {
        }

        public void Commit()
        {
            Serialize();
        }

        public void Refresh(TEntity entity)
        {
            Deserialize();
        }

        public bool Add(TEntity entity)
        {
            lock (_syncRoot)
            {
                try
                {
                    var data = this.Data;

                    entity.Id = GetNextId();
                    data.Add(entity);

                    Commit();
                    return true;
                }
                catch (Exception e)
                {
                    throw new DataJsonException(
                        String.Format("Unable to add entity: {0}", _entityName), e);
                }
            }
        }

        public bool Remove(TEntity entity)
        {
            lock (_syncRoot)
            {
                try
                {
                    Data.RemoveAll(e => e.Id == entity.Id);
                    Commit();

                    return true;
                }
                catch (Exception e)
                {
                    throw new DataJsonException(
                       String.Format("Unable to remove entity: {0}", _entityName), e);
                }
            }
        }

        public bool Update(TEntity entity)
        {
            lock (_syncRoot)
            {
                try
                {
                    var data = this.Data;
                    var index = data.FindIndex(x => x.Id == entity.Id);

                    if (index >= 0)
                    {
                        data[index] = entity;
                        Commit();

                        return true;
                    }

                    return false;
                }
                catch (Exception e)
                {
                    throw new DataJsonException(
                        String.Format("Unable to update entity: {0}", _entityName), e);
                }
            }
        }

        public bool Add(IEnumerable<TEntity> entities)
        {
            lock (_syncRoot)
            {
                try
                {
                    Data.AddRange(entities);
                    Commit();

                    return true;
                }
                catch (Exception e)
                {
                    throw new DataJsonException(
                       String.Format("Unable to add entities: {0}", _entityName), e);
                }
            }
        }

        public bool Remove(IEnumerable<TEntity> entities)
        {
            lock (_syncRoot)
            {
                try
                {
                    var data = this.Data;

                    foreach (var e in entities)
                    {
                        data.Remove(e);
                    }

                    Commit();
                    return true;
                }
                catch (Exception e)
                {
                    throw new DataJsonException(
                        String.Format("Unable to remove entities: {0}", _entityName), e);
                }
            }
        }

        public bool Update(IEnumerable<TEntity> entities)
        {
            lock (_syncRoot)
            {
                try
                {
                    var data = this.Data;

                    foreach (var e in entities)
                    {
                        var index = data.FindIndex(x => x.Id == e.Id);
                        if (index >= 0)
                        {
                            data[index] = e;
                        }
                    }

                    Commit();
                    return true;
                }
                catch (Exception e)
                {
                    throw new DataJsonException(
                        String.Format("Unable to update entities: {0}", _entityName), e);
                }
            }
        }

        public TEntity Get(decimal id)
        {
            lock (_syncRoot)
            {
                try
                {
                    return Data.Find(e => e.Id == id);
                }
                catch (Exception e)
                {
                    throw new DataJsonException(
                        String.Format("Unable to get entity: ID = {0}", id), e);
                }
            }
        }

        public TEntity Get(long id)
        {
            return Get((decimal) id);
        }

        protected virtual long GetNextId(int increment = 1)
        {
            var data = Data;
            var lastId = (data.Any() ? data.Max(e => e.Id) : 0L);
            return (lastId + increment);
        }

        #region Private members
        #endregion Private members
    }
}
