package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.model.Post;
import com.hientranc2.socialapi.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.hientranc2.socialapi.dto.PostResponseDTO;
import com.hientranc2.socialapi.dto.ShareResponseDTO; 
import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin("*")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @Data
    public static class CreatePostRequest {
        private String content;
        private List<String> mediaUrls;
    }

    @PostMapping
    public ResponseEntity<Post> createPost(Principal principal, @RequestBody CreatePostRequest request) {
        String username = principal.getName(); 
        Post savedPost = postService.createPost(username, request.getContent(), request.getMediaUrls());
        return ResponseEntity.ok(savedPost);
    }

    // 🔥 API MỚI: CẬP NHẬT BÀI VIẾT
    @PutMapping("/{postId}")
    public ResponseEntity<PostResponseDTO> updatePost(Principal principal, @PathVariable UUID postId, @RequestBody CreatePostRequest request) {
        String username = principal.getName();
        return ResponseEntity.ok(postService.updatePost(postId, username, request.getContent(), request.getMediaUrls()));
    }

    // 🔥 API MỚI: XÓA BÀI VIẾT
    @DeleteMapping("/{postId}")
    public ResponseEntity<String> deletePost(Principal principal, @PathVariable UUID postId) {
        String username = principal.getName();
        postService.deletePost(postId, username);
        return ResponseEntity.ok("Xóa bài viết thành công");
    }

    @GetMapping
    public ResponseEntity<List<PostResponseDTO>> getNewsFeed(
            Principal principal, 
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String username = (principal != null) ? principal.getName() : null;
        return ResponseEntity.ok(postService.getNewsFeed(username, page, size));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<PostResponseDTO> getPostById(Principal principal, @PathVariable UUID postId) {
        String username = (principal != null) ? principal.getName() : null;
        return ResponseEntity.ok(postService.getPostById(username, postId));
    }

    @GetMapping("/user/{targetUsername}/shares")
    public ResponseEntity<List<ShareResponseDTO>> getSharedPostsByUser(
            Principal principal, 
            @PathVariable String targetUsername,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String username = (principal != null) ? principal.getName() : null;
        return ResponseEntity.ok(postService.getSharedPostsByUser(username, targetUsername, page, size));
    }
    
    @GetMapping("/user/{targetUsername}")
    public ResponseEntity<List<PostResponseDTO>> getPostsByUser(
            Principal principal, 
            @PathVariable String targetUsername,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String username = (principal != null) ? principal.getName() : null;
        return ResponseEntity.ok(postService.getPostsByUser(username, targetUsername, page, size));
    }
}