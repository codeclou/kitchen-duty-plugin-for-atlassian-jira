package io.codeclou.kitchen.duty.webwork;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.atlassian.jira.web.action.JiraWebActionSupport;

public class KitchenDutyPlanningWebworkAction extends JiraWebActionSupport
{
    private static final Logger log = LoggerFactory.getLogger(KitchenDutyPlanningWebworkAction.class);

    @Override
    public String execute() throws Exception {
        return "kitchen-duty-planning-success";
    }
}
