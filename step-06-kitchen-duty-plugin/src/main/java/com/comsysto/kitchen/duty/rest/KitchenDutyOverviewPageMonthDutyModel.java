package com.comsysto.kitchen.duty.rest;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import java.util.List;

@XmlRootElement(name = "duty")
@XmlAccessorType(XmlAccessType.FIELD)
public class KitchenDutyOverviewPageMonthDutyModel {

    @XmlElement
    private Long isoWeek;

    @XmlElement
    private List<String> users;

    public KitchenDutyOverviewPageMonthDutyModel(Long isoWeek, List<String> users) {
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
}
