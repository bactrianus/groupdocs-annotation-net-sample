using System.Web.Mvc;
using GroupDocs.Annotation.Mvc.Sample.Models;

namespace GroupDocs.Annotation.Mvc.Sample.Controllers
{
    public abstract class BaseController : Controller
    {
        /// <summary>
        ///     Sets the information for the system notification.
        /// </summary>
        /// <param name="message">The message to display to the user.</param>
        /// <param name="autoHideNotification">Determines whether the notification will stay visible or auto-hide.</param>
        /// <param name="notifyType">The type of notification to display to the user: Success, Error or Warning.</param>
        public void SetNotification(string message, NotificationEnumeration notifyType, bool autoHideNotification = true)
        {
            TempData["Notification"] = message;
            TempData["NotificationAutoHide"] = (autoHideNotification) ? "true" : "false";

            switch (notifyType)
            {
                case NotificationEnumeration.Success:
                    TempData["NotificationCSS"] = "notificationbox nb-success";
                    break;
                case NotificationEnumeration.Error:
                    TempData["NotificationCSS"] = "notificationbox nb-error";
                    break;
                case NotificationEnumeration.Warning:
                    TempData["NotificationCSS"] = "notificationbox nb-warning";
                    break;
            }
        }
    }
}