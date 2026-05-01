package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.model.Post;
import com.hientranc2.socialapi.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.hientranc2.socialapi.dto.PostResponseDTO;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID; // Nhớ import UUID nhé

@RestController
@RequestMapping("/api/posts")
@CrossOrigin("*")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // API Đăng bài mới
    @PostMapping
    public ResponseEntity<Post> createPost(Principal principal, @RequestBody Map<String, String> request) {
        String username = principal.getName(); 
        String content = request.get("content");
        String mediaUrl = request.get("mediaUrl"); 

        Post savedPost = postService.createPost(username, content, mediaUrl);
        return ResponseEntity.ok(savedPost);
    }

    // API Lấy danh sách bài viết (Bảng tin)
    @GetMapping
    public ResponseEntity<List<PostResponseDTO>> getNewsFeed(
            Principal principal, 
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        return ResponseEntity.ok(postService.getNewsFeed(principal.getName(), page, size));
    }

    // THÊM MỚI: API Lấy chi tiết 1 bài viết
    @GetMapping("/{postId}")
    public ResponseEntity<PostResponseDTO> getPostById(Principal principal, @PathVariable UUID postId) {
        return ResponseEntity.ok(postService.getPostById(principal.getName(), postId));
    }
    // THÊM MỚI: API lấy danh sách bài "Đăng lại" của 1 user
    @GetMapping("/user/{targetUsername}/shares")
    public ResponseEntity<List<PostResponseDTO>> getSharedPostsByUser(
            Principal principal, 
            @PathVariable String targetUsername,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        return ResponseEntity.ok(postService.getSharedPostsByUser(principal.getName(), targetUsername, page, size));
    }
}