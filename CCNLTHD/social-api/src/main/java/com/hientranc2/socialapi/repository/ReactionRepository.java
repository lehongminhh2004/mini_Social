package com.hientranc2.socialapi.repository;

import com.hientranc2.socialapi.model.Reaction;
import com.hientranc2.socialapi.model.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReactionRepository extends JpaRepository<Reaction, UUID> {
    Optional<Reaction> findByUserIdAndPostId(UUID userId, UUID postId);
    int countByPostId(UUID postId);

    // Trả về danh sách [ReactionType, count] để build breakdown map
    @Query("SELECT r.type, COUNT(r) FROM Reaction r WHERE r.post.id = :postId GROUP BY r.type")
    List<Object[]> countByPostIdGroupByType(@Param("postId") UUID postId);
}
