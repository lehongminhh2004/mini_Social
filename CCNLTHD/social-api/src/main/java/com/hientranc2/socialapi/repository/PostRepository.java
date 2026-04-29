package com.hientranc2.socialapi.repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.hientranc2.socialapi.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    
    // Thay đổi từ List sang Page, thêm tham số Pageable
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
}