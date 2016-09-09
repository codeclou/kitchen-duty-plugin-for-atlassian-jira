package com.comsysto.kitchen.duty.rest;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.jira.bc.user.search.UserSearchService;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import com.atlassian.sal.api.transaction.TransactionCallback;
import com.comsysto.kitchen.duty.ao.User;
import com.comsysto.kitchen.duty.ao.UserToWeek;
import com.comsysto.kitchen.duty.ao.Week;
import net.java.ao.DBParam;

import javax.inject.Inject;
import javax.inject.Named;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;

@Named
@Path("/planning")
public class KitchenDutyPlanningResource {

    private ActiveObjects activeObjects;

    @Inject
    public KitchenDutyPlanningResource(ActiveObjects activeObjects) {
        this.activeObjects = activeObjects;
    }

    public KitchenDutyPlanningResource() {
    }


    @GET
    @Path("/persistTest")
    @Produces({MediaType.APPLICATION_JSON})
    @AnonymousAllowed
    public Response persistTest() {
        activeObjects.executeInTransaction(new TransactionCallback<Week>() {
            @Override
            public Week doInTransaction() {
                final Week testWeek = activeObjects.create(
                    Week.class,
                    new DBParam("WEEK", 42));
                testWeek.save();

                final User user = activeObjects.create(
                    User.class,
                    new DBParam("NAME", "ichiban"));
                user.save();

                final UserToWeek relationship = activeObjects.create(UserToWeek.class);
                relationship.setUser(user);
                relationship.setWeek(testWeek);
                relationship.save();

                return testWeek;
            }
        });
        return Response.ok("ok").build();
    }


    @GET
    @Path("/health")
    @Produces({MediaType.APPLICATION_JSON})
    @AnonymousAllowed
    public Response health() {
        return Response.ok("ok").build();
    }

}
