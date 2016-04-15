namespace GroupDocs.Demo.Annotation.Mvc
{
    /// <summary>
    /// Encapsulates properties returning an authenticated and anonymous user names and keys
    /// </summary>
    public interface IAuthenticationService
    {
        /// <summary>
        /// Gets an authenticated user key
        /// </summary>
        string UserKey { get; }

        /// <summary>
        /// Gets an authenticated user name
        /// </summary>
        string UserName { get; }

        /// <summary>
        /// Gets an anonymous user key
        /// </summary>
        string AnonymousUserKey { get; }

        /// <summary>
        /// Gets an anonymous user name
        /// </summary>
        string AnonymousUserName { get; }
    }
}
