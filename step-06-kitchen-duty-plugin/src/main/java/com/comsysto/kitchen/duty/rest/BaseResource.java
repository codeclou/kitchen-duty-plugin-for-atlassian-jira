package com.comsysto.kitchen.duty.rest;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.sal.api.user.UserProfile;

import javax.ws.rs.core.Response;
import java.time.LocalDate;
import java.time.temporal.ChronoField;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.List;

public class BaseResource {

    protected com.atlassian.sal.api.user.UserManager userManager;
    protected ActiveObjects activeObjects;

    protected Boolean isUserLoggedIn() {
        UserProfile user = userManager.getRemoteUser();
        if (user != null) {
            return true;
        } else {
            return false;
        }
    }

    public Boolean isUserNotAdmin() {
        UserProfile user = userManager.getRemoteUser();;
        return (user == null || !userManager.isAdmin(user.getUserKey()));
    }

    protected Response getUnauthorizedErrorResponse() {
        return Response.serverError()
            .entity(new RestError(
                RestError.errorText401,
                401001,
                Response.Status.UNAUTHORIZED.getStatusCode()))
            .status(Response.Status.UNAUTHORIZED)
            .build();
    }

    protected Response getForbiddenErrorResponse() {
        return Response.serverError()
            .entity(new RestError(
                RestError.errorText403,
                403001,
                Response.Status.FORBIDDEN.getStatusCode()))
            .status(Response.Status.FORBIDDEN)
            .build();
    }

    // See unit test
    public static List<Long> getIsoWeeksOfMonth(Integer year, Integer month) {
        List<Long> isoWeeks = new ArrayList<>();
        isoWeeks.add(getWeekOfMonth(year, month, 1));
        isoWeeks.add(getWeekOfMonth(year, month, 2));
        isoWeeks.add(getWeekOfMonth(year, month, 3));
        isoWeeks.add(getWeekOfMonth(year, month, 4));
        isoWeeks.add(getWeekOfMonth(year, month, 5));
        return isoWeeks;
    }

    protected static Long getWeekOfMonth(Integer year, Integer month, Integer weekInMonth) {
        // https://docs.oracle.com/javase/8/docs/api/java/time/temporal/WeekFields.html
        WeekFields weekFields = WeekFields.ISO;
        return (long) LocalDate.now().with(weekFields.weekBasedYear(), year)
            .with(ChronoField.MONTH_OF_YEAR, month)
            .with(ChronoField.ALIGNED_WEEK_OF_MONTH, weekInMonth)
            .get(ChronoField.ALIGNED_WEEK_OF_YEAR);
    }
}
