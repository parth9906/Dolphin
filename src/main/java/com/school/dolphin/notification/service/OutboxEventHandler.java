package com.school.dolphin.notification.service;

import com.school.dolphin.notification.entity.NotificationOutbox;

public interface OutboxEventHandler {

    String eventType();

    void handle(NotificationOutbox event);
}
