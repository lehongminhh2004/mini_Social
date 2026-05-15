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

    // API Bấm nút Repost BÀI VIẾT
    @PostMapping("/post/{postId}")
    public ResponseEntity<String> toggleShare(Principal principal, @PathVariable UUID postId) {
        return ResponseEntity.ok(shareService.toggleShare(principal.getName(), postId));
    }

    // 🔥 API MỚI: Bấm nút Repost BÌNH LUẬN
    @PostMapping("/comment/{commentId}")
    public ResponseEntity<String> toggleCommentShare(Principal principal, @PathVariable UUID commentId) {
        return ResponseEntity.ok(shareService.toggleCommentShare(principal.getName(), commentId));
    }
}