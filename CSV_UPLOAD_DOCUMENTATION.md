# Course CSV Upload with Bunny CDN Integration

## Overview

This enhanced CSV upload functionality allows you to create complete courses with modules, lessons, and associated media files by uploading a single CSV file. The system automatically:

- Creates courses with thumbnails uploaded to Bunny CDN
- Creates modules within each course
- Creates lessons with videos uploaded to Bunny Stream
- Uploads helper files to Bunny CDN Storage
- Creates Shopify products for each course
- Handles all database operations with proper error handling and rollback

## CSV Format

The CSV file should contain the following columns:

### Required Columns
- `CourseName` - Name of the course
- `ModuleName` - Name of the module within the course
- `LessonName` - Name of the lesson within the module
- `LessonOrder` - Order number of the lesson within the module

### Optional Columns
- `CourseDescription` - Description of the course (defaults to "Default Description")
- `CourseThumbnail` - URL of the course thumbnail image
- `CoursePrice` - Price of the course (defaults to "0.00")
- `ModuleDescription` - Description of the module (defaults to empty string)
- `LessonVideoURL` - URL of the lesson video file
- `LessonHelperFiles` - Comma-separated URLs of helper files (PDFs, ZIPs, images, etc.)

## Sample CSV Structure

```csv
CourseName,CourseDescription,CourseThumbnail,CoursePrice,ModuleName,ModuleDescription,LessonName,LessonOrder,LessonVideoURL,LessonHelperFiles
"JavaScript Fundamentals","Learn the basics of JavaScript programming","https://example.com/js-course-thumbnail.jpg","99.99","Introduction to JavaScript","Get started with JavaScript basics","Variables and Data Types",1,"https://example.com/videos/variables-intro.mp4","https://example.com/files/variables-cheatsheet.pdf,https://example.com/files/exercises.zip"
"JavaScript Fundamentals","Learn the basics of JavaScript programming","https://example.com/js-course-thumbnail.jpg","99.99","Introduction to JavaScript","Get started with JavaScript basics","Functions and Scope",2,"https://example.com/videos/functions-intro.mp4","https://example.com/files/functions-examples.js"
```

## How It Works

### 1. Data Processing
- The CSV is parsed and grouped by course name
- Each course contains modules, and each module contains lessons
- Lessons are sorted by their order number within each module

### 2. Media Upload Process
- **Course Thumbnails**: Uploaded to Bunny CDN Storage from remote URLs
- **Lesson Videos**: Uploaded to Bunny Stream from remote URLs with automatic processing
- **Helper Files**: Uploaded to Bunny CDN Storage with automatic type detection

### 3. Database Operations
- All operations are wrapped in database transactions for data integrity
- Courses, modules, lessons, and files are created with proper relationships
- Automatic cleanup of all resources if any step fails

### 4. Shopify Integration
- Each course creates a corresponding Shopify product
- Product images are set to the uploaded thumbnail URL
- Products are configured as digital goods (no shipping required)

### 5. Bunny CDN Integration
- **Storage**: Used for thumbnails and helper files
- **Stream**: Used for video hosting and playback
- **Collections**: Created for each course to organize videos

## Error Handling and Rollback

The system includes comprehensive error handling:

1. **Transaction Safety**: All database operations are transactional
2. **Resource Cleanup**: If any step fails, all created resources are cleaned up:
   - Shopify products are deleted
   - Bunny collections are removed
   - Uploaded files are deleted from Bunny CDN
   - Database records are removed
3. **Retry Logic**: Upload operations include retry logic with exponential backoff
4. **Size Limits**: File size limits are enforced (10MB for thumbnails, 500MB for videos, 100MB for files)

## API Endpoint

```
POST /api/courses/bulkupload
Content-Type: multipart/form-data

Body:
- file: CSV file
- (Authentication via Shopify session)
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Processed CSV: 2 courses created successfully, 0 courses failed.",
  "createdCourses": [
    {
      "course": {
        "id": "uuid",
        "title": "JavaScript Fundamentals",
        "description": "Learn the basics of JavaScript programming",
        "thumbnail": "https://cdn.example.com/Coursethumbnails/1234567890-abc123.webp",
        "price": "99.99",
        "shopifyProductId": 123456789,
        "shopifyHandle": "javascript-fundamentals"
      },
      "modulesCount": 2,
      "lessonsCount": 4
    }
  ],
  "failedCourses": []
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing the failure"
}
```

## File Type Support

### Videos
- Supported formats: MP4, MOV, AVI, WebM, etc.
- Max size: 500MB
- Processing: Automatic transcoding and optimization by Bunny Stream

### Images (Thumbnails)
- Supported formats: JPG, PNG, WebP, GIF
- Max size: 10MB
- Processing: Automatic optimization by Bunny CDN

### Helper Files
- **PDFs**: Automatically detected and categorized
- **ZIP/RAR**: Archive files for downloadable resources
- **Images**: PNG, JPG, etc. for visual aids
- **Other**: Generic file type support
- Max size: 100MB per file

## Best Practices

1. **URL Accessibility**: Ensure all remote URLs are publicly accessible and don't require authentication
2. **File Sizes**: Keep files within recommended size limits for faster processing
3. **Video Quality**: Use high-quality source videos for best transcoding results
4. **CSV Structure**: Maintain consistent course/module/lesson naming across rows
5. **Testing**: Test with a small CSV file before processing large datasets

## Troubleshooting

### Common Issues

1. **Upload Failures**
   - Check URL accessibility
   - Verify file size limits
   - Ensure proper authentication credentials

2. **Processing Errors**
   - Monitor console logs for detailed error messages
   - Check Bunny CDN and Stream API status
   - Verify Shopify API credentials

3. **Database Issues**
   - Ensure database connection is active
   - Check for duplicate course names
   - Verify merchant account setup

### Logging

The system provides detailed logging for:
- CSV parsing progress
- Upload operations status
- Database operations
- Error details with stack traces
- Resource cleanup operations

## Security Considerations

1. **URL Validation**: All remote URLs are validated before processing
2. **File Type Detection**: Content-Type headers are verified
3. **Size Limits**: Strict file size enforcement prevents abuse
4. **Authentication**: Requires valid Shopify session
5. **Cleanup**: Automatic cleanup prevents orphaned resources

## Performance Notes

- Processing time varies based on file sizes and network conditions
- Large videos may take several minutes to process in Bunny Stream
- Multiple files are uploaded in parallel where possible
- System includes timeout handling for long-running operations
