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

    // API Bấm nút Repost (Đăng lại)
    @PostMapping("/post/{postId}")
    public ResponseEntity<String> toggleShare(Principal principal, @PathVariable UUID postId) {
        // Gọi hàm toggleShare mới viết
        return ResponseEntity.ok(shareService.toggleShare(principal.getName(), postId));
    }
}