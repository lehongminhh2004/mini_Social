package com.hientranc2.socialapi.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file) throws IOException {
        // Tạo tên file ngẫu nhiên để không bị trùng
        String fileName = UUID.randomUUID().toString();
        
        // Gửi lên Cloudinary
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap("public_id", "social_network/" + fileName));
                
        // Trả về cái Link ảnh (secure_url)
        return uploadResult.get("secure_url").toString();
    }
}