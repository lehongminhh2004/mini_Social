package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.service.ShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/shares")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ShareController {

    private final ShareService shareService;

    // API Bấm nút Share
    @PostMapping("/post/{postId}")
    public ResponseEntity<String> sharePost(Principal principal, @PathVariable UUID postId) {
        return ResponseEntity.ok(shareService.sharePost(principal.getName(), postId));
    }
}