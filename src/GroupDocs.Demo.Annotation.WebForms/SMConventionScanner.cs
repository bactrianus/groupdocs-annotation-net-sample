using System;
using StructureMap.Configuration.DSL;
using StructureMap.Graph;
using StructureMap.TypeRules;

namespace GroupDocs.Demo.Annotation.WebForms
{
    public class SMConventionScanner : DefaultConventionScanner
    {
        private const string _jsonRepoNsPrefix = "GroupDocs.Data.Json.";

        public override void Process(Type type, Registry registry)
        {
            if (!type.IsConcrete() || !type.FullName.StartsWith(_jsonRepoNsPrefix))
            {
                base.Process(type, registry);
                return;
            }

            var pluginType = FindPluginType(type);
            if (pluginType != null)
            {
                registry.AddType(pluginType, type);
                ConfigureFamily(registry.For(pluginType).Singleton());
            }
        }
    }
}
