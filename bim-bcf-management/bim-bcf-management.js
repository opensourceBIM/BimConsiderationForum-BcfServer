BIMBCFManagement = function() {};
BIMBCFManagement = BIMBCFManagement.prototype = function() {};

// Store the list of projects for a picked server in this global
BIMBCFManagement.projectList = new Array();
// Store the currently selected BIMsie server id
BIMBCFManagement.serverId = -1;
// Username and password remembered for now
BIMBCFManagement.username = "";
BIMBCFManagement.password = "";

jQuery( document ).ready( function() {
	if( document.getElementById( "update-issue-revision-table" ) ) {
		BIMBCFManagement.issueUpdate();
	}
} );

BIMBCFManagement.issueUpdate = function() {
	var nextIssue = jQuery( "#update-issue-revision-table .issue-pending:first" );
	
	if( nextIssue.length > 0 ) {
		// There is still a pending issue
		if( nextIssue.find( ".project" ).html() == "" ) {
			// No project is set
			nextIssue.find( ".project" ).html( bimBCFManagementSettings.loadingImage );
			BIMBCFManagement.showProjectList();
		} else if( nextIssue.find( ".revision" ).html() == "" ) {
			nextIssue.find( ".revision" ).html( bimBCFManagementSettings.loadingImage );
			BIMBCFManagement.showRevisionList();
		}
	}
};

BIMBCFManagement.showRevisionList = function() {
	//if( BIMBCFManagement.revisionList.length > 0 ) {
		// TODO: Show dropdown with revisions
	//} else {
		// TODO: project does not contain revisions or no project selected, handle it here
	//}
};

BIMBCFManagement.showProjectList = function() {
	if( BIMBCFManagement.projectList.length > 0 ) {
		// TODO: Show dropdown with projects and other server button next to it
		var overlay = BIMBCFManagement.showOverlay();
		overlay.find( ".title" ).html( bimBCFManagementSettings.text.selectProjectTitle );
		var html = "";
		for( var p = 0; p < bimBCFManagementSettings.ifcProjects.length; p ++ ) {
			html += "<div class=\"project\"><label class=\"wide-label\" for=\"project-" + p + "\">" + bimBCFManagementSettings.ifcProjects[p] + "</label><div class=\"clear\"></div>";
			html += "<select id=\"project-" + p + "\" class=\"select-project\"><option value=\"\"> - </option>";
			for( var i = 0; i < BIMBCFManagement.projectList.length; i ++ ) {
				html += "<option value=\"" + BIMBCFManagement.projectList[i].oid + "\">" + BIMBCFManagement.projectList[i].name + "</option>";
			}
			html += "</select></div>";
		}
		html += "<input type=\"button\" value=\"submit\" id=\"submit-project-link\" />";
		overlay.find( ".content" ).html( html );
		jQuery( ".select-project" ).change( function() {
			jQuery( this ).parent().find( ".revisions" ).remove();
		} );
		jQuery( "#submit-project-link" ).click( function() {
			// TODO: check if we are submitting revisions or projects
			var revisions = "";
			var allRevisions = true;
			jQuery( ".project" ).each( function() {
				var select = jQuery( this ).find( "select.revisions" );
				if( select.length > 0 ) {
					if( revisions != "" ) {
						revisions += ",";
					}
					revisions += jQuery( select ).val();
				} else {
					allRevisions = false;
				}
			} );
			var projects = "";
			var names = "";
			jQuery( ".select-project" ).each( function() {
				if( projects != "" ) {
					projects += ",";
					names += ",";
				}
				projects += jQuery( this ).val();
				names += jQuery( this ).find( "option:selected" ).text();
			} );
			jQuery.ajax( {
				type: "POST", 
				url: bimBCFManagementSettings.ajaxURI, 
				data: "method=submitProjects&projects=" + projects + "&names=" + names + "&revisions=" + revisions + "&serverId=" + BIMBCFManagement.serverId + "&username=" + BIMBCFManagement.username + "&password=" + BIMBCFManagement.password, 
				success: function( response ) {
					if( response && response.projects && response.projects.length > 0 ) {
						jQuery( ".project .revisions" ).remove();
						jQuery( ".project .select-project" ).each( function() {
							for( var i = 0; i < response.projects.length; i ++ ) {
								if( jQuery( this ).val() == response.projects[i].oid && response.projects[i].revisions ) {
									// Set the revisions for this selected project
									var options = "<option value=\"\"> - </option>";
									for( var p = 0; p < response.projects[i].revisions.length; p ++ ) {
										options += "<option value=\"" + response.projects[i].revisions[p].lastConcreteRevisionId + "\">" + response.projects[i].revisions[p].comment + "</option>";
									}
									jQuery( this ).parent().append( "<br class=\"revisions\" /><label class=\"revisions\" for=\"revisions-for-" + response.projects[i].oid + "\">" + bimBCFManagementSettings.text.revision + "</label><select class=\"revisions\" id=\"revisions-for-" + response.projects[i].oid + "\">" + options + "</select>" );
								}
							}
						} );
					} else if( response && response.projects && response.projects.length == 0 ) {
						// setting revisions is done!
						location.reload(); 
					}
				},
				dataType: "json"
			} );
		} );
	} else {
		// TODO: handle server connection here
		BIMBCFManagement.showServerSelection();
	}
};

BIMBCFManagement.showServerSelection = function() {
	// shows a dropdown with existing servers and option to add new URI
	var overlay = BIMBCFManagement.showOverlay();
	overlay.find( ".title" ).html( bimBCFManagementSettings.text.selectServerTitle );
	var serverOptions = "";
	for( var i = 0; i < bimBCFManagementSettings.bimsieServers.length; i ++ ) {
		serverOptions += "<option value=\"" + i + "\">" + bimBCFManagementSettings.bimsieServers[i].uri + ( bimBCFManagementSettings.bimsieServers[i].username ? ( " - " + bimBCFManagementSettings.bimsieServers[i].username ) : "" ) + "</option>";
	}
	overlay.find( ".content" ).html( ( serverOptions != "" ? "<label for=\"server-selection\">" + bimBCFManagementSettings.text.selectServerLabel + 
			"</label> <select id=\"server-selection\" onchange=\"BIMBCFManagement.serverSelected();\"><option value=\"\">" + bimBCFManagementSettings.text.noServerOption + "</option>" + serverOptions + "</select><br />" : "" ) +
			"<div class=\"new-server-container\"><label for=\"new-bimsie-server\">" + bimBCFManagementSettings.text.newServerLabel + 
			"</label> <input id=\"new-bimsie-server\" type=\"text\" /></div><br />" +
			"<div class=\"toggle-server-info hidden\">" +
				"<input type=\"checkbox\" id=\"server-remember-user\" /> <label for=\"server-remember-user\">" + bimBCFManagementSettings.text.rememberServerLabel +
				"</label><div class=\"clear\"></div><br />" +
				"<label for=\"bimsie-username\">" + bimBCFManagementSettings.text.serverUserLabel + 
				"</label> <input id=\"bimsie-username\" type=\"text\" /><br />" +
				"<label for=\"bimsie-password\">" + bimBCFManagementSettings.text.serverPasswordLabel + 
				"</label> <input id=\"bimsie-password\" type=\"password\" /><br />" +
			"</div>" + 
			"<input type=\"button\" value=\"" + bimBCFManagementSettings.text.submitServer + "\" onclick=\"BIMBCFManagement.submitServerSelection();\" />"
	);
	
	jQuery( "#new-bimsie-server" ).on( "keyup keypress blur click", function() {
		// TODO: maybe add some validation for the URI
		if( this.value.length > 4 ) {
			jQuery( "#bim-bcf-management-overlay .toggle-server-info" ).removeClass( "hidden" );
		} else {
			jQuery( "#bim-bcf-management-overlay .toggle-server-info" ).addClass( "hidden" );
		}
	} );
};

BIMBCFManagement.serverSelected = function() {
	if( jQuery( "#server-selection" ).val() != "" ) {
		jQuery( "#bim-bcf-management-overlay .new-server-container" ).addClass( "hidden" );
		for( var i = 0; i < bimBCFManagementSettings.bimsieServers.length; i ++ ) {
			if( jQuery( "#server-selection" ).val() == i ) {
				if( bimBCFManagementSettings.bimsieServers[i].remember == 0 ) {
					// We still need a username and or password
					jQuery( "#bim-bcf-management-overlay .toggle-server-info" ).removeClass( "hidden" );
				} else {
					jQuery( "#bim-bcf-management-overlay .toggle-server-info" ).addClass( "hidden" );
				}
				break;
			}
		}
	} else {
		jQuery( "#bim-bcf-management-overlay .new-server-container" ).removeClass( "hidden" );
	}
};

BIMBCFManagement.submitServerSelection = function() {
	var valid = false;
	if( jQuery( "#new-bimsie-server" ).val() != "" && jQuery( "#bimsie-username" ).val() != "" && jQuery( "#bimsie-password" ).val() != "" ) {
		valid = true;
	}
	if( jQuery( "#server-selection" ).length > 0 ) {
		var serverId = jQuery( "#server-selection" ).val();
		if( serverId != "" && bimBCFManagementSettings.bimsieServers[serverId] ) {
			if( bimBCFManagementSettings.bimsieServers[serverId].remember ) {
				valid = true;
			} else if( jQuery( "#bimsie-username" ).val() != "" && jQuery( "#bimsie-password" ).val() != "" ) {
				valid = true;
			}
		}
	}
	
	if( valid ) {
		// add selected server to data and if needed password and username
		var data = "method=selectServer";
		if( jQuery( "#server-selection" ).length > 0 && jQuery( "#server-selection" ).val() != "" ) {
			data += "&serverId=" + jQuery( "#server-selection" ).val();
		} else {
			data += "&serverURI=" + jQuery( "#new-bimsie-server" ).val();
		}
		if( jQuery( "#bimsie-username" ).val() != "" && jQuery( "#bimsie-password" ).val() != "" ) {
			data += "&username=" + jQuery( "#bimsie-username" ).val() + 
				"&password=" + jQuery( "#bimsie-password" ).val();
			if( jQuery( "#server-remember-user:checked" ).length == 1 ) {
				data += "&remember=true";
			}
		}
		jQuery.ajax( {
			type: "POST", 
			url: bimBCFManagementSettings.ajaxURI, 
			data: data, 
			success: BIMBCFManagement.selectServer,
			dataType: "json"
		} );
	} else {
		jQuery( "#bim-bcf-management-overlay .status" ).html( bimBCFManagementSettings.text.serverSubmitError );
	}
};

BIMBCFManagement.selectServer = function( response ) {
	// ajax callback for server selection, gives us a list of projects
	if( response.error ) {
		jQuery( "#bim-bcf-management-overlay .status" ).html( response.error );
	}
	if( response.projects ) {
		BIMBCFManagement.projectList = response.projects;
		if( BIMBCFManagement.projectList.length == 0 ) {
			jQuery( "#bim-bcf-management-overlay .status" ).html( bimBCFManagementSettings.text.noProjectsFoundMessage );
			return false;
		}
	}
	if( null != response.serverId ) {
		BIMBCFManagement.serverId = response.serverId;
	}
	BIMBCFManagement.showProjectList();
};

BIMBCFManagement.showOverlay = function() {
	var overlay = jQuery( "#bim-bcf-management-overlay" );
	if( overlay.length == 0 ) {
		jQuery( "body" ).append( "<div id=\"bim-bcf-management-overlay\"><div class=\"title\"></div><div class=\"status\"></div><div class=\"content\"></div></div>" );
		overlay = jQuery( "#bim-bcf-management-overlay" );
	}
	overlay.css( { 
		"top": Math.abs( ( jQuery( window ).height() - jQuery( overlay ).outerHeight() ) * 0.5 ) + jQuery( window ).scrollTop(),
		"left": Math.abs( ( jQuery( window ).width() - jQuery( overlay ).outerWidth() ) * 0.5 ) + jQuery( window ).scrollLeft()
	} );
	return overlay;
};

BIMBCFManagement.hideOverlay = function() {
	jQuery( "#bim-bcf-management-overlay" ).addClass( "hidden" );
};
