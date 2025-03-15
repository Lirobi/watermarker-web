'use client';

import { useState, useCallback } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Slider } from '@heroui/slider';
import { useDropzone } from 'react-dropzone';

export default function WatermarkerTool() {
    const [image, setImage] = useState<string | null>(null);
    const [watermarkText, setWatermarkText] = useState('');
    const [opacity, setOpacity] = useState(50);
    const [position, setPosition] = useState({ x: 50, y: 50 });
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const reader = new FileReader();

            reader.onload = () => {
                setImage(reader.result as string);
            };

            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        maxFiles: 1
    });

    const handleDownload = () => {
        // In a real implementation, this would apply the watermark and download the image
        setIsProcessing(true);
        setTimeout(() => {
            alert('In a real implementation, this would download the watermarked image.');
            setIsProcessing(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col gap-6">
            <div
                {...getRootProps()}
                className={`flex items-center justify-center h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary-50' : 'border-default-200'
                    }`}
            >
                <input {...getInputProps()} />
                {image ? (
                    <div className="relative w-full h-full">
                        <img
                            src={image}
                            alt="Uploaded"
                            className="w-full h-full object-contain"
                        />
                        {watermarkText && (
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    top: `${position.y}%`,
                                    left: `${position.x}%`,
                                    transform: 'translate(-50%, -50%)',
                                    opacity: opacity / 100,
                                }}
                            >
                                <p className="text-xl font-bold text-white drop-shadow-md">
                                    {watermarkText}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center p-6">
                        <svg className="w-12 h-12 text-default-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <p className="text-default-400 font-medium">
                            {isDragActive ? 'Drop the image here' : 'Drag and drop your image here'}
                        </p>
                        <p className="text-default-400 text-sm mt-1">
                            or <span className="text-primary">browse files</span>
                        </p>
                        <p className="text-default-400 text-xs mt-2">
                            Supported formats: JPEG, PNG, GIF, WebP
                        </p>
                    </div>
                )}
            </div>

            {image && (
                <div className="flex flex-col gap-4 p-4 bg-default-50 rounded-lg border border-default-200">
                    <h3 className="text-lg font-semibold">Watermark Settings</h3>

                    <div>
                        <label htmlFor="watermark-text" className="block text-sm font-medium mb-1">Watermark Text</label>
                        <Input
                            id="watermark-text"
                            value={watermarkText}
                            onChange={(e) => setWatermarkText(e.target.value)}
                            placeholder="Enter watermark text"
                            className="w-full"
                            size="lg"
                        />
                    </div>

                    <div>
                        <label htmlFor="opacity-slider" className="block text-sm font-medium mb-1">Opacity: {opacity}%</label>
                        <Slider
                            id="opacity-slider"
                            value={opacity}
                            onChange={(value) => setOpacity(value as number)}
                            minValue={10}
                            maxValue={100}
                            step={5}
                            className="max-w-md"
                        />
                    </div>

                    <Button
                        color="primary"
                        onClick={handleDownload}
                        isLoading={isProcessing}
                        isDisabled={!watermarkText || isProcessing}
                        size="lg"
                        className="mt-2"
                    >
                        {isProcessing ? 'Processing...' : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                                Download Watermarked Image
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
} 