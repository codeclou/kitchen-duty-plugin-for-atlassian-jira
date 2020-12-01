package io.codeclou.kitchen.duty.rest;

import javax.xml.bind.annotation.*;
@XmlRootElement(name = "users")
@XmlAccessorType(XmlAccessType.FIELD)
public class UserSearchResourceModel {

    @XmlElement
    private String text;

    @XmlElement
    private String id;

    public UserSearchResourceModel() {
    }

    public UserSearchResourceModel(String text, String id) {
        this.text = text;
        this.id = id;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
