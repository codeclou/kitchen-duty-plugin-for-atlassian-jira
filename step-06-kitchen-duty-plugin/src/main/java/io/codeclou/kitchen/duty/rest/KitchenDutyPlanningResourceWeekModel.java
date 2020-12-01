package io.codeclou.kitchen.duty.rest;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "weeks")
@XmlAccessorType(XmlAccessType.FIELD)
public class KitchenDutyPlanningResourceWeekModel {

    @XmlElement
    private Integer id;

    @XmlElement
    private Integer week;

    KitchenDutyPlanningResourceWeekModel() { }

    KitchenDutyPlanningResourceWeekModel(Integer id, Integer week) {
        this.id = id;
        this.week = week;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getWeek() {
        return week;
    }

    public void setWeek(Integer week) {
        this.week = week;
    }
}
