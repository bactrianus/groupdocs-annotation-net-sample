using System;

namespace GroupDocs.Annotation.DataLayer.Sample.AuthenticationTypes.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public sealed class AllowAnonymousAttribute : Attribute
    {
    }
}