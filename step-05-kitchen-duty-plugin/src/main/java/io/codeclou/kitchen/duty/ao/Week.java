package io.codeclou.kitchen.duty.ao;

import net.java.ao.Entity;
import net.java.ao.ManyToMany;
import net.java.ao.Preload;
import net.java.ao.schema.NotNull;
import net.java.ao.schema.Unique;

@Preload
public interface Week extends Entity {

    @NotNull
    @Unique
    Integer getWeek();
    void setWeek(Integer week);

    @ManyToMany(value = UserToWeek.class)
    User[] getUsers();
}
