package com.comsysto.kitchen.duty.rest;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.sal.api.user.UserProfile;

import javax.ws.rs.core.Response;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;
import java.time.temporal.ChronoField;
import java.time.temporal.TemporalField;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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
    public static List<Long> getWeeksOfMonth(Long year, Long month) {
        List<Long> weeks = new ArrayList<>();
        weeks.add(getWeekOfMonth(year, month, 1L));
        weeks.add(getWeekOfMonth(year, month, 2L));
        weeks.add(getWeekOfMonth(year, month, 3L));
        weeks.add(getWeekOfMonth(year, month, 4L));
        weeks.add(getWeekOfMonth(year, month, 5L));
        return weeks;
    }

    protected static Long getWeekOfMonth(Long year, Long month, Long weekInMonth) {
        // https://docs.oracle.com/javase/8/docs/api/java/time/temporal/WeekFields.html
        // For locale en_US weeks start on sunday
        WeekFields weekFields = WeekFields.of(Locale.forLanguageTag("en_US"));
        LocalDate origin  = LocalDate.of(1970, 1, 1);
        LocalDate reference = origin
            .with(weekFields.weekBasedYear(), year)
            .with(ChronoField.YEAR, year)
            .with(ChronoField.MONTH_OF_YEAR, month)
            .with(ChronoField.ALIGNED_DAY_OF_WEEK_IN_MONTH, 1)
            .with(ChronoField.ALIGNED_WEEK_OF_MONTH, weekInMonth);
        return (long) reference.get(weekFields.weekOfYear());
    }

    public static LocalDate getFirstDayOfWeekOfYear(Long year, Long week) {
        // https://docs.oracle.com/javase/8/docs/api/java/time/temporal/WeekFields.html
        WeekFields weekFields = WeekFields.of(Locale.forLanguageTag("en_US"));
        return LocalDate.now()
            .with(weekFields.weekBasedYear(), year)
            .with(ChronoField.ALIGNED_WEEK_OF_YEAR, week)
            .with(ChronoField.DAY_OF_WEEK, 1).minusDays(1);
    }

    public static LocalDate getLastDayOfWeekOfYear(Long year, Long week) {
        return getFirstDayOfWeekOfYear(year, week).plusDays(6);
    }
}
