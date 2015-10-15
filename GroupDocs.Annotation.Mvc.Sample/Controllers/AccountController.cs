using System;
using System.Web.Mvc;
using GroupDocs.Annotation.Contracts;
using GroupDocs.Annotation.Contracts.DataObjects;
using GroupDocs.Annotation.DataLayer.Sample;
using GroupDocs.Annotation.DataLayer.Sample.AuthenticationTypes;
using GroupDocs.Annotation.DataLayer.Sample.AuthenticationTypes.Models;
using GroupDocs.Annotation.Mvc.Sample.Models;

namespace GroupDocs.Annotation.Mvc.Sample.Controllers
{
    public class AccountController : BaseController
    {
        private readonly AnnotationFacade annotationFacade;
        private readonly IAnnotationDataLayer resourceManager;

        public AccountController()
        {
            resourceManager = new JsonDataSaver();
            annotationFacade = new AnnotationFacade(resourceManager);
        }

        [AllowAnonymous]
        public ActionResult SignIn()
        {
            return View();
        }

        [AllowAnonymous]
        public ActionResult SignUp()
        {
            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        public ActionResult Login(LoginModel logon)
        {
            UserManager.StoragePath = Server.MapPath("~/App_Data/Storage");
            // Verify the fields.
            if (ModelState.IsValid)
            {
                // Authenticate the user.
                if (UserManager.ValidateUser(logon, Response))
                {
                    return RedirectToAction("Index", "Annotation");
                }
            }

            SetNotification("Wrong login or password", NotificationEnumeration.Error);
            return RedirectToAction("SignIn", "Account");
        }

        public ActionResult Logout()
        {
            // Clear the user session and forms auth ticket.
            UserManager.Logoff(Session, Response);

            return RedirectToAction("SignIn", "Account");
        }

        [HttpPost]
        [AllowAnonymous]
        public ActionResult Register(LoginModel logon)
        {
            resourceManager.SetStoragePath(Server.MapPath("~/App_Data/Storage"));
            UserManager.StoragePath = Server.MapPath("~/App_Data/Storage");
            annotationFacade.CreateUser(
                new UserDataObject {Login = logon.Username, Password = logon.Password},
                new Guid().ToString());
            if (ModelState.IsValid)
            {
                // Authenticate the user.
                if (UserManager.ValidateUser(logon, Response))
                {
                    return RedirectToAction("Index", "Annotation");
                }
            }

            return RedirectToAction("SignIn", "Account");
        }

        [Authorize]
        public ActionResult UserProfile()
        {
            var userId = ((MyIdentity) User.Identity).Id;
            var user = annotationFacade.GetUser(userId, userId);
            return View(user);
        }

        [Authorize]
        public ActionResult EditProfile(UserDataObject user)
        {
            var userId = ((MyIdentity) User.Identity).Id;
            annotationFacade.EditUser(user, userId);
            SetNotification("Success", NotificationEnumeration.Success);
            return RedirectToAction("UserProfile", "Account");
        }
    }
}