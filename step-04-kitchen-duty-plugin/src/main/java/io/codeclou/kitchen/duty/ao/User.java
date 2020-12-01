package io.codeclou.kitchen.duty.ao;

import net.java.ao.Entity;
import net.java.ao.ManyToMany;
import net.java.ao.Preload;
import net.java.ao.schema.NotNull;
import net.java.ao.schema.Unique;

@Preload
public interface User extends Entity {

    @NotNull
    @Unique
    String getName();
    void setName(String week);

    @ManyToMany(value = UserToWeek.class)
    Week[] getWeeks();
}
