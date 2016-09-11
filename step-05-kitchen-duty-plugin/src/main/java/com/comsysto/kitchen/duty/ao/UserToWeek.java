package com.comsysto.kitchen.duty.ao;

import net.java.ao.Entity;

public interface UserToWeek extends Entity {

    void setUser(User user);
    User getUser();

    void setWeek(Week week);
    Week getWeek();
}
