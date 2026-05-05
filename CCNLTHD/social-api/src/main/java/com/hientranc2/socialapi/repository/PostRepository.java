package com.hientranc2.socialapi.repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.hientranc2.socialapi.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    
    // Lấy bài viết cho News Feed (Tất cả mọi người)
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    // 🔥 HÀM MỚI: Lấy bài viết của CHÍNH MỘT NGƯỜI CỤ THỂ (Cho trang Profile)
    Page<Post> findByUserUsernameOrderByCreatedAtDesc(String username, Pageable pageable);
}