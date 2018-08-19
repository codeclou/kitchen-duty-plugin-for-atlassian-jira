package com.comsysto.kitchen.duty.rest;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import com.atlassian.sal.api.user.UserManager;
import com.comsysto.kitchen.duty.ao.KitchenDutyActiveObjectHelper;
import com.comsysto.kitchen.duty.ao.User;
import com.comsysto.kitchen.duty.ao.Week;

import javax.inject.Inject;
import javax.inject.Named;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Named
@Path("/overview_page")
public class KitchenDutyOverviewPageResource extends BaseResource {

    @Inject
    public KitchenDutyOverviewPageResource(ActiveObjects activeObjects,
                                           UserManager userManager) {
        this.activeObjects = activeObjects;
        this.userManager = userManager;
    }
    public KitchenDutyOverviewPageResource() { }

    @GET
    @Path("/year/{year}/month/{month}")
    @Produces({MediaType.APPLICATION_JSON})
    @AnonymousAllowed
    public Response getUsersForWeek(@PathParam("year") final Long year,
                                    @PathParam("month") final Long month) {
        // AUTHENTICATION
        if (!this.isUserLoggedIn()) {
            return getUnauthorizedErrorResponse();
        }
        // BUSINESS LOGIC
        List<KitchenDutyOverviewPageMonthDutyModel> responseList = new ArrayList<>();
        List<Long> isoWeeksInMonth = getIsoWeeksOfMonth(year, month);
        for (Long isoWeek : isoWeeksInMonth) {
            Week week = KitchenDutyActiveObjectHelper.getWeekByIsoWeekInTransaction(activeObjects, isoWeek);
            List<User> usersForWeek = KitchenDutyActiveObjectHelper.getUsersAssignedToWeekInTransaction(activeObjects, week);
            List<String> usernames = usersForWeek.stream().map(user -> user.getName()).collect(Collectors.toList());
            responseList.add(new KitchenDutyOverviewPageMonthDutyModel(
                isoWeek,
                getFirstDayOfWeekOfYear(year, isoWeek).toString(),
                getLastDayOfWeekOfYear(year, isoWeek).toString(),
                usernames)
            );
        }

        return Response.ok(responseList).build();
    }

}
