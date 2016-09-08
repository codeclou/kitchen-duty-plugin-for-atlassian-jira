package com.comsysto.kitchen.duty.ao;


import net.java.ao.Entity;
import net.java.ao.Preload;

@Preload
public interface Week extends Entity {
    Integer getWeek();

    void setWeek(Integer week);
}
