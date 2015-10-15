using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using GroupDocs.Annotation.Contracts;
using GroupDocs.Annotation.DataLayer.Sample;
using GroupDocs.Annotation.DataLayer.Sample.AuthenticationTypes;
using GroupDocs.Annotation.Mvc.Sample.Models;

namespace GroupDocs.Annotation.Mvc.Sample.Controllers
{
    public class AdminController : BaseController
    {
        private readonly AnnotationFacade annotationFacade;
        private readonly IAnnotationDataLayer resourceManager;

        public AdminController()
        {
            resourceManager = new JsonDataSaver();
            annotationFacade = new AnnotationFacade(resourceManager);
        }

        public ActionResult ManageUsers()
        {
            var userId = ((MyIdentity) User.Identity).Id;
            try
            {
                var model = new UsersRolesModel();
                model.Users = annotationFacade.GetUsers(userId).ToList();
                var roles = annotationFacade.GetRoles(userId);
                foreach (var role in roles)
                {
                    model.Roles.Add(role.Name);
                }

                return View(model);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("Index", "Annotation");
            }
        }

        public ActionResult AddUserRole(string roleName, Guid userId)
        {
            try
            {
                annotationFacade.AddRoleToUser(roleName, userId.ToString(), ((MyIdentity) User.Identity).Id);
                SetNotification("Success", NotificationEnumeration.Success);
                return RedirectToAction("ManageUsers");
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("ManageUsers");
            }
        }

        public ActionResult DeleteUserRole(string roleName, Guid userId)
        {
            try
            {
                annotationFacade.DeleteRoleFromUser(roleName, userId.ToString(), ((MyIdentity) User.Identity).Id);
                SetNotification("Success", NotificationEnumeration.Success);
                return RedirectToAction("ManageUsers");
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("ManageUsers");
            }
        }

        public ActionResult ManageRoles()
        {
            var model = new RolePermissionModel();
            try
            {
                var roles = annotationFacade.GetRoles(((MyIdentity) User.Identity).Id).ToList();
                foreach (var role in roles)
                {
                    var itemsToRemove = new HashSet<string>(role.Permissions);
                    var permissions = annotationFacade.GetPermissions(((MyIdentity) User.Identity).Id);
                    permissions.RemoveAll(x => itemsToRemove.Contains(x));
                    model.Roles.Add(role, permissions);
                }

                model.Permissions = annotationFacade.GetPermissions(((MyIdentity) User.Identity).Id);
                return View(model);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("Index", "Annotation");
            }
        }

        public ActionResult CreateRole(Role role)
        {
            try
            {
                annotationFacade.CreateUserRole(role, ((MyIdentity) User.Identity).Id);
                SetNotification("Success", NotificationEnumeration.Success);
                return RedirectToAction("ManageRoles");
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("ManageRoles");
            }
        }

        public ActionResult DeleteRole(string role)
        {
            try
            {
                annotationFacade.DeleteUserRole(role, ((MyIdentity) User.Identity).Id);
                SetNotification("Success", NotificationEnumeration.Success);
                return RedirectToAction("ManageRoles");
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("ManageRoles");
            }
        }

        public ActionResult AddRolePermission(string roleName, string newPermission)
        {
            try
            {
                annotationFacade.AddRolePermission(roleName, newPermission, ((MyIdentity) User.Identity).Id);
                SetNotification("Success", NotificationEnumeration.Success);
                return RedirectToAction("ManageRoles");
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("ManageRoles");
            }
        }

        public ActionResult DeleteRolePermission(string roleName, string deletedPermission)
        {
            try
            {
                annotationFacade.RemoveRolePermission(roleName, deletedPermission, ((MyIdentity) User.Identity).Id);
                SetNotification("Success", NotificationEnumeration.Success);
                return RedirectToAction("ManageRoles");
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("ManageRoles");
            }
        }

        public ActionResult ManagePermissions()
        {
            try
            {
                var permissions = annotationFacade.GetPermissions(((MyIdentity) User.Identity).Id);
                return View(permissions);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("Index", "Annotation");
            }
        }

        public ActionResult CreatePermission(string permission)
        {
            try
            {
                annotationFacade.CreatePermission(permission, ((MyIdentity) User.Identity).Id);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("ManagePermissions");
            }

            SetNotification("Success", NotificationEnumeration.Success);
            return RedirectToAction("ManagePermissions");
        }

        public ActionResult DeletePermission(string permission)
        {
            try
            {
                annotationFacade.DeletePermission(permission, ((MyIdentity) User.Identity).Id);
            }
            catch (AnnotatorException e)
            {
                SetNotification(e.Message, NotificationEnumeration.Error);
                return RedirectToAction("ManagePermissions");
            }

            SetNotification("Success", NotificationEnumeration.Success);
            return RedirectToAction("ManagePermissions");
        }
    }
}