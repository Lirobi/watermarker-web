"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import WatermarkEditor from "@/components/WatermarkEditor";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState("image");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [watermarkText, setWatermarkText] = useState("");
    const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
    const [watermarkImagePreview, setWatermarkImagePreview] = useState<string | null>(null);
    const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
    const [opacity, setOpacity] = useState(70);
    const [scale, setScale] = useState(50);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [mediaType, setMediaType] = useState<"image" | "video">("image");

    // Redirect if not authenticated
    if (status === "unauthenticated") {
        router.push("/auth/signin");
        return null;
    }

    // Load data from localStorage on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem('watermarkData');
            if (savedData) {
                try {
                    const data = JSON.parse(savedData);
                    if (data.preview) setPreview(data.preview);
                    if (data.watermarkText) setWatermarkText(data.watermarkText);
                    if (data.watermarkImagePreview) setWatermarkImagePreview(data.watermarkImagePreview);
                    if (data.watermarkType) setWatermarkType(data.watermarkType);
                    if (data.opacity) setOpacity(data.opacity);
                    if (data.scale) setScale(data.scale);
                    if (data.rotation) setRotation(data.rotation);
                    if (data.position) setPosition(data.position);
                    if (data.selectedTab) setSelectedTab(data.selectedTab);
                    if (data.mediaType) setMediaType(data.mediaType);

                    // If we have video data stored separately, load it
                    if (data.mediaType === 'video' && data.videoDataKey) {
                        const videoData = localStorage.getItem(data.videoDataKey);
                        if (videoData) {
                            console.log("Loaded video data from localStorage");
                            setPreview(videoData);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing saved data:', error);
                }
            }
        }
    }, []);

    // Save data to localStorage whenever relevant state changes
    useEffect(() => {
        if (typeof window !== 'undefined' && preview) {
            // For videos, store the data in a separate localStorage key to avoid size limits
            let videoDataKey = null;

            if (mediaType === 'video' && preview) {
                // Generate a unique key for the video data
                videoDataKey = `video_data_${Date.now()}`;

                // Store the video data separately
                if (preview.length < 5000000) { // Only store if it's not too large (< 5MB)
                    try {
                        localStorage.setItem(videoDataKey, preview);
                        console.log("Stored video data in localStorage with key:", videoDataKey);

                        // Clean up any old video data
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith('video_data_') && key !== videoDataKey) {
                                localStorage.removeItem(key);
                                console.log("Removed old video data:", key);
                            }
                        }
                    } catch (e) {
                        console.error("Failed to store video data in localStorage:", e);
                        videoDataKey = null; // Reset if storage failed
                    }
                } else {
                    console.warn("Video data too large for localStorage");
                    videoDataKey = null;
                }
            }

            const dataToSave = {
                preview: mediaType === 'video' ? null : preview, // Don't store video data in the main object
                watermarkText,
                watermarkImagePreview,
                watermarkType,
                opacity,
                scale,
                rotation,
                position,
                selectedTab,
                mediaType,
                videoDataKey // Store the key to the video data
            };

            localStorage.setItem('watermarkData', JSON.stringify(dataToSave));
        }
    }, [preview, watermarkText, watermarkImagePreview, watermarkType, opacity, scale, rotation, position, selectedTab, mediaType]);

    // Update container size for position buttons
    useEffect(() => {
        const updateContainerSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setContainerSize({ width, height });
            }
        };

        // Initial update
        updateContainerSize();

        // Update on resize
        window.addEventListener('resize', updateContainerSize);

        // Update after a short delay to ensure the container is fully rendered
        const timeoutId = setTimeout(updateContainerSize, 500);

        return () => {
            window.removeEventListener('resize', updateContainerSize);
            clearTimeout(timeoutId);
        };
    }, [preview]);

    // Clean up object URLs when component unmounts or when preview changes
    useEffect(() => {
        return () => {
            // Clean up any object URLs when component unmounts or preview changes
            if (preview && preview.startsWith('blob:')) {
                console.log("Cleaning up object URL:", preview);
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // Update mediaType when selectedTab changes
    useEffect(() => {
        if (!preview) {
            setMediaType(selectedTab === "image" ? "image" : "video");
        }
    }, [selectedTab, preview]);

    // Log mediaType and preview for debugging
    useEffect(() => {
        if (preview) {
            console.log("Current mediaType:", mediaType, "and preview:", preview);
        }
    }, [mediaType, preview]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setFile(file);
            console.log("File dropped:", file.type, file.size, file.name);

            // For videos, create an object URL instead of data URL for better performance
            if (file.type.startsWith('video/')) {
                try {
                    // Set media type first
                    setMediaType('video');

                    // Create object URL directly
                    const objectUrl = URL.createObjectURL(file);
                    console.log("Video object URL created:", objectUrl);
                    console.log("Video MIME type:", file.type);

                    // Set the preview to the object URL
                    setPreview(objectUrl);

                    // Verify the URL is valid in the background
                    const videoTest = document.createElement('video');
                    videoTest.muted = true;
                    videoTest.src = objectUrl;
                    videoTest.onloadedmetadata = () => {
                        console.log("Test video loaded successfully with dimensions:", videoTest.videoWidth, "x", videoTest.videoHeight);
                    };
                    videoTest.onerror = (e) => {
                        console.error("Test video failed to load:", e);
                        // If object URL fails, try data URL as fallback
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const result = reader.result as string;
                            setPreview(result);
                            console.log("Video data URL generated as fallback");
                        };
                        reader.readAsDataURL(file);
                    };
                } catch (error) {
                    console.error("Error creating object URL:", error);
                    alert("Failed to process the video file. Please try again with a different file.");
                }
            } else {
                // For images, use FileReader for data URL
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    setPreview(result);
                    console.log("Image preview generated");

                    // Set media type to image
                    setMediaType('image');
                };
                reader.onerror = (error) => {
                    console.error("Error reading file:", error);
                    alert("Failed to read the file. Please try again with a different file.");
                };
                reader.readAsDataURL(file);
            }
        }
    }, []);

    const onWatermarkImageDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setWatermarkImage(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setWatermarkImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: selectedTab === "image"
            ? { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] }
            : { 'video/*': ['.mp4', '.webm', '.mov'] },
        maxFiles: 1,
    });

    const { getRootProps: getWatermarkRootProps, getInputProps: getWatermarkInputProps } = useDropzone({
        onDrop: onWatermarkImageDrop,
        accept: { 'image/*': ['.png', '.gif', '.webp'] },
        maxFiles: 1,
        maxSize: 2097152, // 2MB
    });

    const handlePositionChange = (newPosition: { x: number; y: number }) => {
        // Only update if the position has actually changed to prevent flickering
        if (newPosition.x !== position.x || newPosition.y !== position.y) {
            setPosition(newPosition);
        }
    };

    const handleDownload = async () => {
        if (!preview || !containerRef.current) return;

        setIsProcessing(true);
        setDownloadSuccess(false);

        try {
            if (selectedTab === "image") {
                // Create a canvas to render the watermarked image
                const canvas = document.createElement('canvas');
                const container = containerRef.current;
                const containerRect = container.getBoundingClientRect();

                // Create a new image to draw on canvas
                const img = new window.Image();
                img.crossOrigin = 'anonymous';

                // Wait for the image to load
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error('Failed to load image'));
                    img.src = preview;
                });

                // Set canvas dimensions to match the original image's aspect ratio
                const originalWidth = img.naturalWidth;
                const originalHeight = img.naturalHeight;

                // Use the original image dimensions for the canvas
                canvas.width = originalWidth;
                canvas.height = originalHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('Could not get canvas context');
                }

                // Draw the background image at its original size
                ctx.drawImage(img, 0, 0, originalWidth, originalHeight);

                // Calculate the scale factor between the container and the original image
                const scaleX = originalWidth / containerRect.width;
                const scaleY = originalHeight / containerRect.height;

                // Draw the watermark
                if (watermarkType === 'text' && watermarkText) {
                    // Apply text watermark
                    ctx.save();

                    // Position at the center point, scaled to match the original image dimensions
                    ctx.translate(position.x * scaleX, position.y * scaleY);

                    // Apply rotation
                    ctx.rotate((rotation * Math.PI) / 180);

                    // Apply scale, adjusted for the image's actual size
                    const scaleFactor = scale / 100;
                    ctx.scale(scaleFactor * scaleX, scaleFactor * scaleX); // Use scaleX for both to maintain text aspect ratio

                    // Apply opacity
                    ctx.globalAlpha = opacity / 100;

                    // Set text properties
                    const fontSize = Math.max(16, 48 * (scale / 100));
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Add text shadow
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;

                    // Draw the text
                    ctx.fillText(watermarkText, 0, 0);

                    ctx.restore();
                } else if (watermarkType === 'image' && watermarkImagePreview) {
                    // Apply image watermark
                    const watermarkImg = new window.Image();
                    watermarkImg.crossOrigin = 'anonymous';

                    // Wait for the watermark image to load
                    await new Promise<void>((resolve, reject) => {
                        watermarkImg.onload = () => resolve();
                        watermarkImg.onerror = () => reject(new Error('Failed to load watermark image'));
                        watermarkImg.src = watermarkImagePreview;
                    });

                    ctx.save();

                    // Position at the center point, scaled to match the original image dimensions
                    ctx.translate(position.x * scaleX, position.y * scaleY);

                    // Apply rotation
                    ctx.rotate((rotation * Math.PI) / 180);

                    // Apply opacity
                    ctx.globalAlpha = opacity / 100;

                    // Get the natural dimensions of the watermark image
                    const watermarkNaturalWidth = watermarkImg.naturalWidth;
                    const watermarkNaturalHeight = watermarkImg.naturalHeight;

                    // Calculate the aspect ratio of the watermark
                    const watermarkAspectRatio = watermarkNaturalWidth / watermarkNaturalHeight;

                    // Base size calculation on the scale factor
                    const baseSize = Math.max(50, 200 * (scale / 100));

                    // Apply a uniform scale factor (use the average of scaleX and scaleY)
                    const uniformScale = (scaleX + scaleY) / 2;

                    // Calculate dimensions while preserving aspect ratio
                    let watermarkWidth = baseSize * uniformScale;
                    let watermarkHeight = watermarkWidth / watermarkAspectRatio;

                    // Draw the watermark image centered
                    ctx.drawImage(
                        watermarkImg,
                        -watermarkWidth / 2,
                        -watermarkHeight / 2,
                        watermarkWidth,
                        watermarkHeight
                    );

                    ctx.restore();
                }

                // Convert canvas to blob
                const blob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob((b) => {
                        if (b) resolve(b);
                        else reject(new Error('Could not create image blob'));
                    }, 'image/png');
                });

                // Create download link
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `watermarked-${new Date().getTime()}.png`;
                document.body.appendChild(a);
                a.click();

                // Clean up
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    setDownloadSuccess(true);

                    // Hide success message after 3 seconds
                    setTimeout(() => {
                        setDownloadSuccess(false);
                    }, 3000);
                }, 100);
            } else {
                // Video watermarking implementation
                const videoElement = containerRef.current.querySelector('video');
                if (!videoElement) {
                    throw new Error('Video element not found');
                }

                // Check if MediaRecorder is supported
                if (typeof window.MediaRecorder === 'undefined') {
                    alert('Your browser does not support the MediaRecorder API needed for video watermarking. Please try using Chrome, Firefox, or Edge.');
                    setIsProcessing(false);
                    return;
                }

                // Pause the video and reset to beginning
                videoElement.pause();
                videoElement.currentTime = 0;

                // Create a canvas to render the watermarked video frames
                const canvas = document.createElement('canvas');
                const container = containerRef.current;
                const containerRect = container.getBoundingClientRect();

                // Set canvas dimensions to match the original video for best quality
                const canvasWidth = videoElement.videoWidth;
                const canvasHeight = videoElement.videoHeight;
                console.log(`Using original video dimensions: ${canvasWidth}x${canvasHeight}`);

                canvas.width = canvasWidth;
                canvas.height = canvasHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('Could not get canvas context');
                }

                // Calculate the scale factor between the container and the video
                const scaleX = canvasWidth / containerRect.width;
                const scaleY = canvasHeight / containerRect.height;

                // Prepare the watermark image if needed
                let watermarkImg: HTMLImageElement | null = null;
                if (watermarkType === 'image' && watermarkImagePreview) {
                    watermarkImg = new window.Image();
                    watermarkImg.src = watermarkImagePreview;
                    // Wait for the watermark image to load
                    await new Promise<void>((resolve) => {
                        watermarkImg!.onload = () => resolve();
                        watermarkImg!.onerror = () => resolve(); // Continue even if error
                    });
                }

                // Pre-render text watermark to an offscreen canvas to prevent flickering
                let textWatermarkCanvas: HTMLCanvasElement | null = null;
                if (watermarkType === 'text' && watermarkText) {
                    textWatermarkCanvas = document.createElement('canvas');
                    const textCtx = textWatermarkCanvas.getContext('2d');
                    if (textCtx) {
                        // Make the canvas large enough for the text
                        textWatermarkCanvas.width = 1000;
                        textWatermarkCanvas.height = 200;

                        // Set text properties
                        const fontSize = Math.max(16, 48 * (scale / 100));
                        textCtx.font = `bold ${fontSize}px sans-serif`;
                        textCtx.fillStyle = 'white';
                        textCtx.textAlign = 'center';
                        textCtx.textBaseline = 'middle';

                        // Add text shadow
                        textCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                        textCtx.shadowBlur = 4;
                        textCtx.shadowOffsetX = 2;
                        textCtx.shadowOffsetY = 2;

                        // Draw the text in the center of the canvas
                        textCtx.fillText(watermarkText, textWatermarkCanvas.width / 2, textWatermarkCanvas.height / 2);
                    }
                }

                // Determine supported MIME types - prioritize MP4
                let mimeType = 'video/mp4';
                let fileExtension = 'mp4';

                // Check if MP4 is supported, otherwise fall back to WebM
                if (!MediaRecorder.isTypeSupported('video/mp4')) {
                    console.log("MP4 not supported, checking WebM options");
                    if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
                        mimeType = 'video/webm;codecs=h264';
                        fileExtension = 'webm';
                    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                        mimeType = 'video/webm;codecs=vp9';
                        fileExtension = 'webm';
                    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                        mimeType = 'video/webm;codecs=vp8';
                        fileExtension = 'webm';
                    } else if (MediaRecorder.isTypeSupported('video/webm')) {
                        mimeType = 'video/webm';
                        fileExtension = 'webm';
                    }
                }

                console.log("Using MIME type:", mimeType, "with extension:", fileExtension);

                // Create a MediaRecorder to capture the canvas as a video
                const fps = 30; // Use higher frame rate for high quality
                const stream = canvas.captureStream(fps);

                // Configure MediaRecorder with optimal settings
                const recorderOptions: MediaRecorderOptions = {
                    mimeType,
                    videoBitsPerSecond: 8000000 // 8 Mbps for high quality
                };

                // Create the MediaRecorder with error handling
                let mediaRecorder: MediaRecorder;
                try {
                    mediaRecorder = new MediaRecorder(stream, recorderOptions);
                    console.log(`Recording at ${fps} FPS with bitrate 8 Mbps using ${mimeType}`);
                } catch (error) {
                    console.error("Failed to create MediaRecorder with specified options:", error);

                    // Try again with default options
                    console.log("Falling back to default MediaRecorder options");
                    mediaRecorder = new MediaRecorder(stream);
                    console.log(`Recording with default settings using ${mediaRecorder.mimeType}`);

                    // Update file extension based on fallback mime type
                    if (mediaRecorder.mimeType.includes('webm')) {
                        fileExtension = 'webm';
                    } else if (mediaRecorder.mimeType.includes('mp4')) {
                        fileExtension = 'mp4';
                    }
                }

                const chunks: Blob[] = [];
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                        console.log("Recorded chunk of size:", e.data.size);
                    }
                };

                // Handle recording completion
                mediaRecorder.onstop = async () => {
                    console.log("MediaRecorder stopped, processing chunks...");
                    if (chunks.length === 0) {
                        console.error("No data was recorded");
                        alert("Failed to record video. Please try again.");
                        setIsProcessing(false);
                        return;
                    }

                    try {
                        // Create a blob from all the chunks
                        const blob = new Blob(chunks, { type: mimeType });
                        console.log("Created final blob of size:", blob.size, "bytes");

                        if (blob.size < 1000) {
                            console.error("Blob size is too small, likely an error occurred");
                            alert("Failed to process video properly. Please try again.");
                            setIsProcessing(false);
                            return;
                        }

                        // Create download link
                        const url = URL.createObjectURL(blob);
                        console.log("Created object URL for download:", url);

                        // Create and trigger download
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `watermarked-${new Date().getTime()}.${fileExtension}`;
                        a.style.display = 'none';
                        document.body.appendChild(a);

                        console.log("Triggering download...");
                        a.click();

                        // Clean up
                        setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            console.log("Download cleanup complete");
                            setDownloadSuccess(true);

                            // Hide success message after 3 seconds
                            setTimeout(() => {
                                setDownloadSuccess(false);
                            }, 3000);
                        }, 100);
                    } catch (error) {
                        console.error("Error creating download:", error);
                        alert("Failed to create download. Please try again.");
                    } finally {
                        setIsProcessing(false);
                    }
                };

                // Function to draw a frame with watermark
                const drawFrame = () => {
                    // Only draw frames when needed
                    if (videoElement.paused || videoElement.ended) {
                        return;
                    }

                    // Clear the canvas
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Set high quality rendering options
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Draw the video frame
                    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                    // Draw the watermark
                    if (watermarkType === 'text' && watermarkText && textWatermarkCanvas) {
                        // Apply text watermark using the pre-rendered canvas
                        ctx.save();

                        // Position at the center point, scaled to match the video dimensions
                        ctx.translate(position.x * scaleX, position.y * scaleY);

                        // Apply rotation
                        ctx.rotate((rotation * Math.PI) / 180);

                        // Apply opacity
                        ctx.globalAlpha = opacity / 100;

                        // Calculate dimensions for the text watermark
                        const scaleFactor = scale / 100;
                        const watermarkWidth = textWatermarkCanvas.width * scaleFactor * scaleX * 0.5;
                        const watermarkHeight = textWatermarkCanvas.height * scaleFactor * scaleX * 0.5;

                        // Draw the pre-rendered text watermark
                        ctx.drawImage(
                            textWatermarkCanvas,
                            -watermarkWidth / 2,
                            -watermarkHeight / 2,
                            watermarkWidth,
                            watermarkHeight
                        );

                        ctx.restore();
                    } else if (watermarkType === 'image' && watermarkImg && watermarkImg.complete) {
                        // Apply image watermark
                        ctx.save();

                        // Position at the center point, scaled to match the video dimensions
                        ctx.translate(position.x * scaleX, position.y * scaleY);

                        // Apply rotation
                        ctx.rotate((rotation * Math.PI) / 180);

                        // Apply opacity
                        ctx.globalAlpha = opacity / 100;

                        // Calculate the aspect ratio of the watermark
                        const watermarkAspectRatio = watermarkImg.naturalWidth / watermarkImg.naturalHeight || 1;

                        // Base size calculation on the scale factor
                        const baseSize = Math.max(50, 200 * (scale / 100));

                        // Apply a uniform scale factor
                        const uniformScale = (scaleX + scaleY) / 2;

                        // Calculate dimensions while preserving aspect ratio
                        let watermarkWidth = baseSize * uniformScale;
                        let watermarkHeight = watermarkWidth / watermarkAspectRatio;

                        // Draw the watermark image centered
                        ctx.drawImage(
                            watermarkImg,
                            -watermarkWidth / 2,
                            -watermarkHeight / 2,
                            watermarkWidth,
                            watermarkHeight
                        );

                        ctx.restore();
                    }

                    // Continue drawing frames
                    requestAnimationFrame(drawFrame);
                };

                // Start recording with a data available event every second
                mediaRecorder.start(1000);
                console.log("MediaRecorder started");

                // Add a progress indicator
                let progressInterval: NodeJS.Timeout | null = null;
                const startTime = Date.now();
                const videoDuration = videoElement.duration;

                // Play the video to start the process
                try {
                    console.log("Starting video playback for processing");
                    videoElement.muted = true; // Ensure video is muted during processing

                    // Update the button text with progress
                    progressInterval = setInterval(() => {
                        if (videoElement.currentTime > 0) {
                            const progress = Math.min(100, Math.round((videoElement.currentTime / videoDuration) * 100));
                            const elapsedTime = Math.round((Date.now() - startTime) / 1000);
                            const remainingTime = videoDuration > 0 ?
                                Math.round((videoDuration - videoElement.currentTime) * (elapsedTime / videoElement.currentTime)) :
                                'unknown';

                            // Update processing text
                            setIsProcessing(true);
                            const processingButton = document.querySelector('button[disabled]');
                            if (processingButton) {
                                processingButton.textContent = `Processing: ${progress}% (${remainingTime}s remaining)`;
                            }
                        }
                    }, 500);

                    // Set up animation frame drawing when video plays
                    videoElement.onplay = () => {
                        console.log("Video playback started, beginning frame capture");
                        drawFrame();
                    };

                    // Handle video ending
                    videoElement.onended = () => {
                        console.log("Video ended naturally");
                        if (mediaRecorder.state !== 'inactive') {
                            console.log("Stopping MediaRecorder");
                            mediaRecorder.stop();
                        }

                        // Clear progress interval
                        if (progressInterval) {
                            clearInterval(progressInterval);
                        }
                    };

                    // Start playback
                    await videoElement.play();

                    // If the video is very short or has issues, ensure we still get a result
                    const processingTimeout = setTimeout(() => {
                        if (mediaRecorder.state !== 'inactive') {
                            console.log('Processing timeout reached, stopping recorder');
                            mediaRecorder.stop();

                            // Clear progress interval
                            if (progressInterval) {
                                clearInterval(progressInterval);
                            }
                        }
                    }, Math.min(120000, (videoElement.duration * 1000) + 10000)); // Max 2 minutes or video duration + 10 seconds

                    // Clean up timeout when done
                    mediaRecorder.addEventListener('stop', () => {
                        clearTimeout(processingTimeout);

                        // Clear progress interval
                        if (progressInterval) {
                            clearInterval(progressInterval);
                        }

                        // Reset processing button text
                        const processingButton = document.querySelector('button[disabled]');
                        if (processingButton) {
                            processingButton.textContent = "Processing...";
                        }
                    });
                } catch (error) {
                    console.error('Error processing video:', error);
                    alert('Failed to process video. Please try again with a different video file.');
                    setIsProcessing(false);

                    // Clear progress interval
                    if (progressInterval) {
                        clearInterval(progressInterval);
                    }

                    // Reset video player
                    if (videoElement) {
                        videoElement.currentTime = 0;
                        videoElement.pause();
                    }
                }
            }

            console.log('Download complete');
        } catch (error) {
            console.error('Error generating watermarked media:', error);
            alert('Failed to generate watermarked media. Please try again or use a different file.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Apply position preset
    const applyPositionPreset = (posName: string) => {
        if (!preview || !containerRef.current) return;

        // Force recalculate container size
        const { width, height } = containerRef.current.getBoundingClientRect();
        const newContainerSize = { width, height };

        // Only update container size if it has changed
        if (newContainerSize.width !== containerSize.width ||
            newContainerSize.height !== containerSize.height) {
            setContainerSize(newContainerSize);
        }

        // Calculate position based on the updated container size
        // Since the watermark is now centered at the position point,
        // we need to adjust the edge positions to account for the centering
        const positions: Record<string, { x: number, y: number }> = {
            "Top Left": { x: 70, y: 50 },
            "Top Center": { x: width / 2, y: 50 },
            "Top Right": { x: width - 70, y: 50 },
            "Middle Left": { x: 70, y: height / 2 },
            "Center": { x: width / 2, y: height / 2 },
            "Middle Right": { x: width - 70, y: height / 2 },
            "Bottom Left": { x: 70, y: height - 50 },
            "Bottom Center": { x: width / 2, y: height - 50 },
            "Bottom Right": { x: width - 70, y: height - 50 }
        };

        const newPosition = positions[posName] || { x: 0, y: 0 };
        console.log(`Applying position for ${posName}:`, newPosition, `Container size:`, newContainerSize);

        // Set the new position directly
        setPosition(newPosition);
    };

    // Clear all data from localStorage
    const handleClearData = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('watermarkData');
            setFile(null);
            setPreview(null);
            setWatermarkText("");
            setWatermarkImage(null);
            setWatermarkImagePreview(null);
            setWatermarkType("text");
            setOpacity(70);
            setScale(50);
            setRotation(0);
            setPosition({ x: 0, y: 0 });
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold mb-6">Watermark Your Media</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Upload/Preview */}
                    <Card className="lg:col-span-2 border border-blue-100">
                        <CardHeader className="flex flex-col gap-2">
                            <h2 className="text-xl font-semibold">{preview ? "Preview" : "Upload Media"}</h2>
                            <Tabs
                                aria-label="Media Type"
                                selectedKey={selectedTab}
                                onSelectionChange={(key) => {
                                    // Only allow changing tabs if no media is loaded
                                    if (!preview) {
                                        setSelectedTab(key as string);
                                    }
                                }}
                                className="w-full"
                                isDisabled={!!preview}
                            >
                                <Tab key="image" title={
                                    <div className={`flex items-center gap-1 ${preview && selectedTab !== "image" ? "opacity-50" : ""}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                        Image
                                    </div>
                                } />
                                <Tab key="video" title={
                                    <div className={`flex items-center gap-1 ${preview && selectedTab !== "video" ? "opacity-50" : ""}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="23 7 16 12 23 17 23 7" />
                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                        </svg>
                                        Video
                                    </div>
                                } />
                            </Tabs>
                        </CardHeader>
                        <CardBody>
                            {!preview ? (
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary/50"
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-12 w-12 text-gray-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                            />
                                        </svg>
                                        <p className="text-lg font-medium">
                                            {isDragActive
                                                ? `Drop your ${selectedTab} here...`
                                                : `Drag & drop your ${selectedTab} here, or click to select`}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {selectedTab === "image"
                                                ? "Supports JPG, PNG, GIF, WebP"
                                                : "Supports MP4, WebM, MOV"}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative" ref={containerRef}>
                                    {/* Log for debugging */}
                                    <WatermarkEditor
                                        mediaType={mediaType}
                                        mediaSrc={preview}
                                        watermarkType={watermarkType}
                                        watermarkContent={watermarkText}
                                        watermarkImageSrc={watermarkImagePreview || undefined}
                                        opacity={opacity}
                                        scale={scale}
                                        rotation={rotation}
                                        onPositionChange={handlePositionChange}
                                        position={position}
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <Button
                                            color="danger"
                                            variant="flat"
                                            size="sm"
                                            onClick={handleClearData}
                                        >
                                            Clear All
                                        </Button>
                                        <Button
                                            color="danger"
                                            variant="flat"
                                            size="sm"
                                            onClick={() => {
                                                setFile(null);
                                                setPreview(null);
                                                localStorage.removeItem('watermarkData');
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardBody>
                        {preview && (
                            <CardFooter className="flex flex-col gap-2">
                                <Button
                                    color="primary"
                                    className="w-full"
                                    isDisabled={isProcessing}
                                    isLoading={isProcessing}
                                    onClick={handleDownload}
                                >
                                    {isProcessing ? "Processing..." : "Download Watermarked Media"}
                                </Button>
                            </CardFooter>
                        )}
                    </Card>

                    {/* Right Panel - Watermark Options */}
                    <Card className="border border-blue-100">
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Watermark Options</h2>
                        </CardHeader>
                        <CardBody className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="watermark-type" className="text-sm font-medium">Watermark Type</label>
                                <div className="flex gap-2" id="watermark-type" role="group" aria-labelledby="watermark-type">
                                    <Button
                                        color={watermarkType === "text" ? "primary" : "default"}
                                        variant={watermarkType === "text" ? "solid" : "flat"}
                                        onClick={() => setWatermarkType("text")}
                                    >
                                        Text
                                    </Button>
                                    <Button
                                        color={watermarkType === "image" ? "primary" : "default"}
                                        variant={watermarkType === "image" ? "solid" : "flat"}
                                        onClick={() => setWatermarkType("image")}
                                    >
                                        Image
                                    </Button>
                                </div>
                            </div>

                            {watermarkType === "text" ? (
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="watermark-text" className="text-sm font-medium">
                                        Watermark Text
                                    </label>
                                    <input
                                        id="watermark-text"
                                        type="text"
                                        value={watermarkText}
                                        onChange={(e) => setWatermarkText(e.target.value)}
                                        placeholder="Enter your watermark text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="watermark-image-upload" className="text-sm font-medium">Watermark Image</label>
                                    {!watermarkImagePreview ? (
                                        <div
                                            {...getWatermarkRootProps()}
                                            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors border-gray-300 hover:border-primary/50"
                                        >
                                            <input {...getWatermarkInputProps()} id="watermark-image-upload" />
                                            <p className="text-sm">
                                                Drag & drop your watermark image, or click to select
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Supports PNG with transparency (max 2MB)
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="relative h-24 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                                                <Image
                                                    src={watermarkImagePreview}
                                                    alt="Watermark Preview"
                                                    fill
                                                    style={{ objectFit: "contain" }}
                                                />
                                            </div>
                                            <Button
                                                color="danger"
                                                variant="flat"
                                                size="sm"
                                                className="absolute top-1 right-1"
                                                onClick={() => {
                                                    setWatermarkImage(null);
                                                    setWatermarkImagePreview(null);
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label htmlFor="opacity" className="text-sm font-medium">
                                    Opacity: {opacity}%
                                </label>
                                <input
                                    id="opacity"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={opacity}
                                    onChange={(e) => setOpacity(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="size" className="text-sm font-medium">
                                    Size: {scale}%
                                </label>
                                <input
                                    id="size"
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={scale}
                                    onChange={(e) => setScale(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="rotation" className="text-sm font-medium">
                                    Rotation: {rotation}°
                                </label>
                                <input
                                    id="rotation"
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={rotation}
                                    onChange={(e) => setRotation(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="watermark-position" className="text-sm font-medium">Position</label>
                                <div id="watermark-position" role="group" aria-labelledby="watermark-position" className="grid grid-cols-3 gap-2">
                                    {[
                                        "Top Left",
                                        "Top Center",
                                        "Top Right",
                                        "Middle Left",
                                        "Center",
                                        "Middle Right",
                                        "Bottom Left",
                                        "Bottom Center",
                                        "Bottom Right"
                                    ].map((posName) => (
                                        <Button
                                            key={posName}
                                            size="sm"
                                            variant="flat"
                                            className="text-xs"
                                            isDisabled={!preview}
                                            onClick={() => {
                                                if (preview && containerRef.current) {
                                                    applyPositionPreset(posName);
                                                }
                                            }}
                                        >
                                            {posName}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Saved Watermarks Section 
                <Card className="mt-6 border border-blue-100">
                    <CardHeader>
                        <h2 className="text-xl font-semibold">Saved Watermarks</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="border rounded-lg p-2 hover:border-primary cursor-pointer transition-colors">
                                    <div className="aspect-square bg-gray-100 rounded flex items-center justify-center mb-2">
                                        <p className="text-lg font-bold text-gray-500">Sample</p>
                                    </div>
                                    <p className="text-sm font-medium truncate">Watermark {i}</p>
                                </div>
                            ))}
                            <div className="border border-dashed rounded-lg p-2 hover:border-primary cursor-pointer transition-colors flex flex-col items-center justify-center aspect-square">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-8 w-8 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                <p className="text-sm font-medium mt-2">Create New</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                */}
            </motion.div>
        </div>
    );
} 