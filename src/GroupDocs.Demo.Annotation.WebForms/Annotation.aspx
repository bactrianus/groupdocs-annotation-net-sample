<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Annotation.aspx.cs" Inherits="GroupDocs.Demo.Annotation.WebForms.Annotation" %>
<%@ Import Namespace="GroupDocs.Annotation.Contracts" %>
<%@ Import Namespace="GroupDocs.Web.Annotation" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>GroupDocs.Annotation demo web-page</title>
    <%=  new GroupDocs.Demo.Annotation.WebForms.AnnotationScripts().UseHttpHandlers() %>
</head>
<body>
	<div id="annotation-widget" class="groupdocs_viewer_wrapper grpdx" style="width: 100%; height: 100%;">
    </div>
	
    <%= new AnnotationWidget()
        .ElementId("annotation-widget")
		.ShowFileExplorer(true)
        .FilePath("candy.pdf")
		.ShowToolbar(true)
		.AccessRights(AnnotationReviewerRights.All)
        .Width(600)
        .Height(800)
		.EnableAnnotationsAutoImport(true)
     %>
		
</body>
</html>
