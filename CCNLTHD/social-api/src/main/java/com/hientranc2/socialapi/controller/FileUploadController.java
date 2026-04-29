package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin("*")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileUploadService fileUploadService;

    // API: POST /api/upload/image
    @PostMapping("/image")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        String imageUrl = fileUploadService.uploadImage(file);
        return ResponseEntity.ok(imageUrl);
    }
}