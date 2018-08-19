package com.comsysto.kitchen.duty.webwork;

import com.atlassian.jira.web.action.JiraWebActionSupport;
import com.atlassian.webresource.api.assembler.PageBuilderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Named;

@Named
public class KitchenDutyOverviewPageWebworkAction extends JiraWebActionSupport
{
    private static final Logger log = LoggerFactory.getLogger(KitchenDutyOverviewPageWebworkAction.class);

    @Inject
    private PageBuilderService pageBuilderService;

    @Override
    public String execute() throws Exception {
        pageBuilderService.assembler().resources()
            .requireWebResource("com.comsysto.kitchen-duty-plugin:kitchen-duty-plugin-resources")
            .requireWebResource("com.comsysto.kitchen-duty-plugin:kitchen-duty-plugin-resources--overview-page");

        return "kitchen-duty-overview-page-success";
    }

    public void setPageBuilderService(PageBuilderService pageBuilderService) {
        this.pageBuilderService = pageBuilderService;
    }
}
