package com.comsysto.kitchen.duty.rest;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import com.atlassian.sal.api.transaction.TransactionCallback;
import com.atlassian.sal.api.user.UserManager;
import com.comsysto.kitchen.duty.ao.KitchenDutyActiveObjectHelper;
import com.comsysto.kitchen.duty.ao.User;
import com.comsysto.kitchen.duty.ao.UserToWeek;
import com.comsysto.kitchen.duty.ao.Week;
import net.java.ao.DBParam;
import net.java.ao.Query;

import javax.inject.Inject;
import javax.inject.Named;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;

@Named
@Path("/planning")
public class KitchenDutyPlanningResource extends BaseResource {

    @Inject
    public KitchenDutyPlanningResource(ActiveObjects activeObjects,
                                       UserManager userManager) {
        this.activeObjects = activeObjects;
        this.userManager = userManager;
    }

    public KitchenDutyPlanningResource() {
    }


    /*
     * Get all Users assigned to the isoWeekNumber.
     */
    @GET
    @Path("/week/{isoWeekNumber}/users")
    @Produces({MediaType.APPLICATION_JSON})
    @AnonymousAllowed
    public Response getUsersForWeek(@PathParam("isoWeekNumber") final Integer isoWeekNumber) {
        // AUTHENTICATION
        if (!this.isUserLoggedIn()) {
            return getUnauthorizedErrorResponse();
        }
        // AUTHORIZATION
        if (this.isUserNotAdmin()) {
            return getForbiddenErrorResponse();
        }
        // BUSINESS LOGIC
        Week week = activeObjects.executeInTransaction(new TransactionCallback<Week>() {
            @Override
            public Week doInTransaction() {
                Week[] weeks = activeObjects.find(Week.class, Query.select().where("WEEK = ?", isoWeekNumber));
                if (weeks != null && weeks.length > 0) {
                    return weeks[0];
                }
                return null;
            }
        });
        List<KitchenDutyPlanningResourceUserModel> users = new ArrayList<>();
        if (week != null) {
            UserToWeek[] relationships = activeObjects.executeInTransaction(new TransactionCallback<UserToWeek[]>() {
                @Override
                public UserToWeek[] doInTransaction() {
                    return KitchenDutyActiveObjectHelper.findAllRelationships(activeObjects, week);
                }
            });
            if (relationships != null) {
                for (UserToWeek userToWeek : relationships) {
                    users.add(new KitchenDutyPlanningResourceUserModel(userToWeek.getUser().getID(), userToWeek.getUser().getName()));
                }
            }
        }
        return Response.ok(users).build();
    }

    /*
     * Add the Users to the Week
     */
    @PUT
    @Path("/week/{isoWeekNumber}/users")
    @Produces({MediaType.APPLICATION_JSON})
    @AnonymousAllowed
    public Response addUserToWeek(@PathParam("isoWeekNumber") final Integer isoWeekNumber,
                                  final List<KitchenDutyPlanningResourceUserModel> userParams) {
        // AUTHENTICATION
        if (!this.isUserLoggedIn()) {
            return getUnauthorizedErrorResponse();
        }
        // AUTHORIZATION
        if (this.isUserNotAdmin()) {
            return getForbiddenErrorResponse();
        }
        // BUSINESS LOGIC
        activeObjects.executeInTransaction(new TransactionCallback<Void>() {
            @Override
            public Void doInTransaction() {
                //
                // WEEK
                //
                Week week = KitchenDutyActiveObjectHelper.findUniqueWeek(activeObjects, isoWeekNumber);
                if (week == null) {
                    week = activeObjects.create(Week.class, new DBParam("WEEK", isoWeekNumber));
                    week.save();
                    activeObjects.flush(week);
                }

                //
                // CLEANUP EXISTING RELATIONSHIPS
                //
                UserToWeek[] existingRelationships = KitchenDutyActiveObjectHelper.findAllRelationships(activeObjects, week);
                if (existingRelationships != null) {
                    for (UserToWeek existingRelationship : existingRelationships) {
                        activeObjects.delete(existingRelationship);
                        activeObjects.flush(existingRelationship);
                    }
                }

                //
                // USER
                //
                for (KitchenDutyPlanningResourceUserModel userParam : userParams) {
                    User user = KitchenDutyActiveObjectHelper.findUniqueUser(activeObjects, userParam.getUsername());
                    if (user == null) {
                        user = activeObjects.create(User.class, new DBParam("NAME", userParam.getUsername()));
                        user.save();
                        activeObjects.flush(user);
                    }
                    //
                    // Establish ManyToMany Relationship
                    //
                    UserToWeek relationship = KitchenDutyActiveObjectHelper.findRelationship(activeObjects, user, week);
                    if (relationship == null) {
                        relationship = activeObjects.create(UserToWeek.class);
                        relationship.setUser(user);
                        relationship.setWeek(week);
                        relationship.save();
                        activeObjects.flush(relationship);
                    }
                }

                return null;
            }
        });
        return Response.ok().build();
    }


    /*
     * Remove the User from Week
     */
    @DELETE
    @Path("/week/{isoWeekNumber}/users")
    @Produces({MediaType.APPLICATION_JSON})
    @AnonymousAllowed
    public Response deleteUserFomWeek(@PathParam("isoWeekNumber") final Integer isoWeekNumber,
                                  final KitchenDutyPlanningResourceUserModel userParam) {
        // AUTHENTICATION
        if (!this.isUserLoggedIn()) {
            return getUnauthorizedErrorResponse();
        }
        // AUTHORIZATION
        if (this.isUserNotAdmin()) {
            return getForbiddenErrorResponse();
        }
        // BUSINESS LOGIC
        activeObjects.executeInTransaction(new TransactionCallback<Void>() {
            @Override
            public Void doInTransaction() {
                //
                // WEEK
                //
                Week week = KitchenDutyActiveObjectHelper.findUniqueWeek(activeObjects, isoWeekNumber);
                if (week == null) {
                    // week does not exist => no relation to delete
                    return null;
                }

                //
                // USER
                //
                User user = KitchenDutyActiveObjectHelper.findUniqueUser(activeObjects, userParam.getUsername());
                if (user == null) {
                    // user does not exist => no relation to delete
                    return null;
                }

                //
                // Delete ManyToMany Relationship
                //
                UserToWeek relationship = KitchenDutyActiveObjectHelper.findRelationship(activeObjects, user, week);
                if (relationship != null) {
                    activeObjects.delete(relationship);
                }

                return null;
            }
        });
        return Response.ok().build();
    }

    /*
     * Get the Weeks assigned to the User.
     */
    @GET
    @Path("/user/{username}/weeks")
    @Produces({MediaType.APPLICATION_JSON})
    @AnonymousAllowed
    public Response getWeeksForUser(@PathParam("username") final String username) {
        // AUTHENTICATION
        if (!this.isUserLoggedIn()) {
            return getUnauthorizedErrorResponse();
        }
        // AUTHORIZATION
        if (this.isUserNotAdmin()) {
            return getForbiddenErrorResponse();
        }
        // BUSINESS LOGIC
        User[] users = activeObjects.executeInTransaction(new TransactionCallback<User[]>() {
            @Override
            public User[] doInTransaction() {
                return activeObjects.find(User.class, Query.select().where("NAME = ?", username));
            }
        });
        List<KitchenDutyPlanningResourceWeekModel> weeks = new ArrayList<>();
        if (users != null && users.length > 0) {
            for (Week week : users[0].getWeeks()) {
                weeks.add(new KitchenDutyPlanningResourceWeekModel(week.getID(), week.getWeek()));
            }
        }
        return Response.ok(weeks).build();
    }


    @GET
    @Path("/health")
    @Produces({MediaType.APPLICATION_JSON})
    @AnonymousAllowed
    public Response health() {
        return Response.ok("ok").build();
    }

}
