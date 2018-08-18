package com.comsysto.kitchen.duty.ao;

import com.atlassian.activeobjects.external.ActiveObjects;
import net.java.ao.Query;

public class KitchenDutyActiveObjectHelper {

    public static Week findUniqueWeek(ActiveObjects activeObjects, Integer isoWeekNumber) {
        Week[] weekRes = activeObjects.find(Week.class, Query.select().where("WEEK = ?", isoWeekNumber));
        if ((weekRes != null && weekRes.length > 0)) {
            return weekRes[0];
        }
        return null;
    }

    public static User findUniqueUser(ActiveObjects activeObjects, String username) {
        User[] userRes = activeObjects.find(User.class, Query.select().where("NAME = ?", username));
        if ((userRes != null && userRes.length > 0)) {
            return userRes[0];
        }
        return null;
    }

    public static UserToWeek findRelationship(ActiveObjects activeObjects, User user, Week week) {
        UserToWeek[] relationships = activeObjects.find(UserToWeek.class, Query.select().where("USER_ID = ? AND WEEK_ID = ?", user.getID(), week.getID()));
        if ((relationships != null && relationships.length > 0)) {
            return relationships[0];
        }
        return null;
    }

    public static UserToWeek[] findAllRelationships(ActiveObjects activeObjects, Week week) {
        UserToWeek[] relationships = activeObjects.find(UserToWeek.class, Query.select().where("WEEK_ID = ?", week.getID()));
        if ((relationships != null && relationships.length > 0)) {
            return relationships;
        }
        return null;
    }
}
