package com.comsysto.kitchen.duty.rest;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import java.util.List;

/*
 * We want this entity to be directly usable as full calendar event object
 * https://fullcalendar.io/docs/event-object
 */
@XmlRootElement(name = "duty")
@XmlAccessorType(XmlAccessType.FIELD)
public class KitchenDutyOverviewPageMonthDutyModel {

    @XmlElement
    private Long isoWeek;

    @XmlElement
    private String start; /* Date String - First day of week (Sunday) */
    @XmlElement
    private String end; /* Date String - Last day of week (Monday) */

    @XmlElement
    private List<String> users;

    public KitchenDutyOverviewPageMonthDutyModel(Long isoWeek, String start, String end, List<String> users) {
        this.start = start;
        this.end = end;
        this.isoWeek = isoWeek;
        this.users = users;
    }

    public Long getIsoWeek() {
        return isoWeek;
    }

    public void setIsoWeek(Long isoWeek) {
        this.isoWeek = isoWeek;
    }

    public List<String> getUsers() {
        return users;
    }

    public void setUsers(List<String> users) {
        this.users = users;
    }

    public String getStart() {
        return start;
    }

    public void setStart(String start) {
        this.start = start;
    }

    public String getEnd() {
        return end;
    }

    public void setEnd(String end) {
        this.end = end;
    }
}
