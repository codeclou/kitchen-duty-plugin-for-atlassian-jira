package com.comsysto.kitchen.duty.rest;

import javax.xml.bind.annotation.*;
@XmlRootElement(name = "message")
@XmlAccessorType(XmlAccessType.FIELD)
public class UserSearchResourceModel {

    @XmlElement(name = "value")
    private String message;

    public UserSearchResourceModel() {
    }

    public UserSearchResourceModel(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}