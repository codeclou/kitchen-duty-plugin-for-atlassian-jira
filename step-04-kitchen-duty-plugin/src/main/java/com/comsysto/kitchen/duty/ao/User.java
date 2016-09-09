package com.comsysto.kitchen.duty.ao;

import net.java.ao.Entity;
import net.java.ao.ManyToMany;
import net.java.ao.Preload;

@Preload
public interface User extends Entity {
    String getName();
    void setName(String week);

    @ManyToMany(value = UserToWeek.class)
    Week[] getWeeks();
}
