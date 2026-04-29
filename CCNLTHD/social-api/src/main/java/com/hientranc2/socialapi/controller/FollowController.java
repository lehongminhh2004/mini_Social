package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    // API: POST /api/users/follow/{targetUserId}
    @PostMapping("/follow/{targetUserId}")
    public ResponseEntity<String> followUser(Principal principal, @PathVariable UUID targetUserId) {
        String result = followService.toggleFollow(principal.getName(), targetUserId);
        return ResponseEntity.ok(result);
    }
}