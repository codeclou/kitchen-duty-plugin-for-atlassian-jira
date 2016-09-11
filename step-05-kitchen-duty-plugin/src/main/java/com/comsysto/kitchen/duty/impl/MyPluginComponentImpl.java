package com.comsysto.kitchen.duty.impl;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.jira.bc.user.search.UserSearchService;
import com.atlassian.plugin.spring.scanner.annotation.export.ExportAsService;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.sal.api.ApplicationProperties;
import com.atlassian.webresource.api.assembler.PageBuilderService;
import com.comsysto.kitchen.duty.api.MyPluginComponent;

import javax.inject.Inject;
import javax.inject.Named;

@ExportAsService ({MyPluginComponent.class})
@Named ("myPluginComponent")
public class MyPluginComponentImpl implements MyPluginComponent
{
    @ComponentImport
    private final ApplicationProperties applicationProperties;

    @ComponentImport
    private ActiveObjects activeObjects;

    @ComponentImport
    private UserSearchService userSearchService;

    @ComponentImport
    private PageBuilderService pageBuilderService;

    @Inject
    public MyPluginComponentImpl(final ApplicationProperties applicationProperties)
    {
        this.applicationProperties = applicationProperties;
    }

    public String getName()
    {
        if(null != applicationProperties)
        {
            return "myComponent:" + applicationProperties.getDisplayName();
        }
        
        return "myComponent";
    }
}
