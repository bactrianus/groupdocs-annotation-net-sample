using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Security;
using GroupDocs.Annotation.Contracts.DataObjects;
using GroupDocs.Annotation.DataLayer.Sample.AuthenticationTypes;
using GroupDocs.Annotation.DataLayer.Sample.AuthenticationTypes.Models;
using Newtonsoft.Json;

namespace GroupDocs.Annotation.DataLayer.Sample
{
    public static class UserManager
    {
        public static string StoragePath { get; set; }

        /// <summary>
        ///     Returns the User from the Context.User.Identity by decrypting the forms auth ticket and returning the user object.
        /// </summary>
        public static UserDataObject User
        {
            get
            {
                if (HttpContext.Current.User.Identity.IsAuthenticated)
                {
                    // The user is authenticated. Return the user from the forms auth ticket.
                    return ((MyPrincipal) (HttpContext.Current.User)).User;
                }
                if (HttpContext.Current.Items.Contains("User"))
                {
                    // The user is not authenticated, but has successfully logged in.
                    return (UserDataObject) HttpContext.Current.Items["User"];
                }
                return null;
            }
        }

        /// <summary>
        ///     Authenticates a user.
        /// </summary>
        /// <param name="username">Username</param>
        /// <param name="password">Password</param>
        /// <returns>User</returns>
        public static UserDataObject AuthenticateUser(string username, string password)
        {
            var filePath = StoragePath + "\\Users\\Users.json";
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

            return usersList.FirstOrDefault(a => a.Login == username && a.Password == password);
        }

        /// <summary>
        ///     Authenticates a user via the MembershipProvider and creates the associated forms authentication ticket.
        /// </summary>
        /// <param name="logon">Logon</param>
        /// <param name="response">HttpResponseBase</param>
        /// <returns>The result of the operation</returns>
        public static bool ValidateUser(LoginModel logon, HttpResponseBase response)
        {
            var result = false;
            var user = AuthenticateUser(logon.Username, logon.Password);
            if (user != null)
            {
                HttpContext.Current.Items.Add("User", user);
                // Create the authentication ticket with custom user data.
                var cookie = new MyCookie
                {
                    Id = user.Id,
                    Login = user.Login,
                    UserName = user.Name,
                    Roles = user.Roles ?? new List<string> {"User"}
                };
                var userData = JsonConvert.SerializeObject(cookie);
                var ticket = new FormsAuthenticationTicket(
                    1,
                    logon.Username,
                    DateTime.Now,
                    DateTime.Now.AddDays(30),
                    true,
                    userData,
                    FormsAuthentication.FormsCookiePath);
                var encTicket = FormsAuthentication.Encrypt(ticket);
                response.Cookies.Add(new HttpCookie(FormsAuthentication.FormsCookieName, encTicket));

                result = true;
            }

            return result;
        }

        /// <summary>
        ///     Clears the user session, clears the forms auth ticket, expires the forms auth cookie.
        /// </summary>
        /// <param name="session">HttpSessionStateBase</param>
        /// <param name="response">HttpResponseBase</param>
        public static void Logoff(HttpSessionStateBase session, HttpResponseBase response)
        {
            // Delete the user details from cache.
            session.Abandon();

            // Delete the authentication ticket and sign out.
            FormsAuthentication.SignOut();

            // Clear authentication cookie.
            var cookie = new HttpCookie(FormsAuthentication.FormsCookieName, "");
            cookie.Expires = DateTime.Now.AddYears(-1);
            response.Cookies.Add(cookie);
        }
    }
}