
package com.school.dolphin.identity.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class InvitationEmailService {

    private final JavaMailSender mailSender;
    private final boolean emailEnabled;
    private final String fromAddress;
    private final String invitationBaseUrl;

    public InvitationEmailService(
            JavaMailSender mailSender,
            @Value("${app.invitation.email.enabled:false}")
            boolean emailEnabled,
            @Value("${app.invitation.email.from:no-reply@example.invalid}")
            String fromAddress,
            @Value("${app.invitation.email.base-url:http://localhost:3000/accept-invitation}")
            String invitationBaseUrl
    ) {
        this.mailSender = mailSender;
        this.emailEnabled = emailEnabled;
        this.fromAddress = fromAddress;
        this.invitationBaseUrl = invitationBaseUrl;
    }

    public void sendInvitation(
            String recipientEmail,
            String firstName,
            String inviterName,
            String roleName,
            String scopeType,
            String rawToken
    ) {
        ensureEmailDeliveryEnabled();

        String invitationUrl = UriComponentsBuilder
                .fromUriString(invitationBaseUrl)
                .queryParam("token", rawToken)
                .build()
                .encode()
                .toUriString();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(recipientEmail);
        message.setSubject("You're invited to Dolphin");

        message.setText("""
                Hello %s,

                %s has invited you to join Dolphin.

                Assigned role: %s
                Organization scope: %s

                Accept your invitation using this link:
                %s

                This invitation expires according to the invitation's validity period.
                If you weren't expecting this invitation, you can ignore this email.

                Dolphin
                """.formatted(
                firstName,
                inviterName,
                roleName,
                scopeType,
                invitationUrl
        ));

        mailSender.send(message);
    }

    public void ensureEmailDeliveryEnabled() {
        if (!emailEnabled) {
            throw new IllegalStateException(
                    "Invitation email delivery is disabled. Configure SMTP before onboarding teachers."
            );
        }
    }
}
