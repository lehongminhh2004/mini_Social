package com.hientranc2.socialapi.repository;

import com.hientranc2.socialapi.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    // Lấy danh sách bình luận của một bài viết, cái nào mới nhất hiện lên trên
    List<Comment> findAllByPostIdOrderByCreatedAtDesc(UUID postId);
    int countByPostId(UUID postId);
    org.springframework.data.domain.Page<com.hientranc2.socialapi.model.Comment> findByUserUsernameOrderByCreatedAtDesc(String username, org.springframework.data.domain.Pageable pageable);
    @org.springframework.transaction.annotation.Transactional
    void deleteByPostId(java.util.UUID postId);
}