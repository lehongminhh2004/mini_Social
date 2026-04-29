package com.hientranc2.socialapi.repository;

import com.hientranc2.socialapi.model.Share;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShareRepository extends JpaRepository<Share, UUID> {
    // Tự động sinh câu lệnh: Tìm tất cả lượt share của 1 bài viết
    List<Share> findAllByPostId(UUID postId);
    int countByPostId(UUID postId);
}