package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.model.Comment;
import com.hientranc2.socialapi.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@CrossOrigin("*")
public class CommentController {

    private final CommentService commentService;

    // API Đăng bình luận mới
    @PostMapping("/post/{postId}")
    public ResponseEntity<Comment> addComment(Principal principal, @PathVariable UUID postId, @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(commentService.addComment(principal.getName(), postId, request.get("content")));
    }

    // API Xem danh sách bình luận của 1 bài viết
    @GetMapping("/post/{postId}")
    public ResponseEntity<List<Comment>> getComments(@PathVariable UUID postId) {
        return ResponseEntity.ok(commentService.getCommentsByPost(postId));
    }
}