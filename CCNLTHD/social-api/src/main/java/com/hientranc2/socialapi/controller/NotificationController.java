package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.model.Notification;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.UserRepository;
import com.hientranc2.socialapi.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin("*")
public class NotificationController {
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(Principal principal) {
        User user = userRepository.findByUsername(principal.getName()).orElseThrow();
        return ResponseEntity.ok(notificationService.getMyNotifications(user));
    }
}