using System;
using System.Web.Security;
using GroupDocs.Annotation.Handler.Input;

namespace GroupDocs.Demo.Annotation.Mvc.Security
{
    /// <summary>
    /// Encapsulates properties returning an authenticated and anonymous user names and keys
    /// </summary>
    public class AuthenticationService : IAuthenticationService
    {
        private static readonly string _anonymousUserName = "GroupDocs@GroupDocs.com";
        private static readonly string _anonymousUserKey = String.Empty;

        private IUserDataHandler _userSvc;

        /// <summary>
        /// Creates an instance of the AuthenticationService class
        /// </summary>
        public AuthenticationService(IUserDataHandler userRepository)
        {
            _userSvc = userRepository;
        }

        /// <summary>
        /// Gets an authenticated user key
        /// </summary>
        public virtual string UserKey
        {
            get
            {
                try
                {
                    var user = Membership.GetUser();
                    var userName = ( user != null && !string.IsNullOrEmpty(user.UserName) ? user.UserName : AnonymousUserName);
                    return GetUserKey(userName);
                }
                catch
                {
                    return AnonymousUserKey;
                }
            }
        }

        /// <summary>
        /// Gets an authenticated user name
        /// </summary>
        public virtual string UserName
        {
            get
            {
                var name = System.Web.HttpContext.Current.Request["un"];
                return (String.IsNullOrWhiteSpace(name) ? AnonymousUserName : name);
            }
        }

        private string GetAnonymousUserName()
        {
            try
            {
                var user = _userSvc.GetUserByEmail(AnonymousUserName);
                if (user != null)
                {
                    return user.ToString();
                }
                return AnonymousUserName;
            }
            catch
            {
                return AnonymousUserName;
            }
        }

        /// <summary>
        /// Gets an anonymous user key
        /// </summary>
        public virtual string AnonymousUserKey
        {
            get { return GetUserKey(this.AnonymousUserName); }
        }

        /// <summary>
        /// Gets an anonymous user name
        /// </summary>
        public virtual string AnonymousUserName
        {
            get { return _anonymousUserName; }
        }

        /// <summary>
        /// Returns a key for a given user by its name
        /// </summary>
        /// <param name="userName">The user name to return the key for</param>
        /// <returns>The user key</returns>
        protected string GetUserKey(string userName)
        {
            var user = _userSvc.GetUserByEmail(userName);
            return (user != null ? user.Guid : null);
        }
    }
}
