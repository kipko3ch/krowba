"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"

interface ImageUploaderProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  folder?: string
}

export function ImageUploader({ images, onImagesChange, maxImages = 5, folder = "products" }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      if (images.length + files.length > maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`)
        return
      }

      setIsUploading(true)
      const newImages: string[] = []

      try {
        for (const file of Array.from(files)) {
          // Validate file type
          if (!file.type.startsWith("image/")) {
            toast.error(`${file.name} is not an image`)
            continue
          }

          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            toast.error(`${file.name} is too large (max 5MB)`)
            continue
          }

          // Get upload signature from our API
          const signatureRes = await fetch("/api/upload/signature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder }),
          })

          if (!signatureRes.ok) {
            throw new Error("Failed to get upload signature")
          }

          const { signature, timestamp, cloudName, apiKey, uploadPreset } = await signatureRes.json()

          // Upload to Cloudinary
          const formData = new FormData()
          formData.append("file", file)
          formData.append("signature", signature)
          formData.append("timestamp", timestamp.toString())
          formData.append("api_key", apiKey)
          formData.append("upload_preset", uploadPreset)
          formData.append("folder", `krowba/${folder}`)

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
          })

          if (!uploadRes.ok) {
            throw new Error("Failed to upload image")
          }

          const uploadData = await uploadRes.json()
          newImages.push(uploadData.secure_url)
        }

        onImagesChange([...images, ...newImages])
        toast.success(`${newImages.length} image(s) uploaded`)
      } catch (error) {
        console.error("Upload error:", error)
        toast.error("Failed to upload images")
      } finally {
        setIsUploading(false)
      }
    },
    [images, onImagesChange, maxImages, folder],
  )

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <label className="border-2 border-dashed border-border p-8 flex flex-col items-center justify-center cursor-pointer hover:border-foreground/50 transition-colors">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
          disabled={isUploading || images.length >= maxImages}
        />
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click or drag images here</span>
            <span className="text-xs text-muted-foreground mt-1">
              {images.length}/{maxImages} images · Max 5MB each
            </span>
          </>
        )}
      </label>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-square border border-border">
              <img
                src={url || "/placeholder.svg"}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 text-xs bg-foreground text-background px-1">Main</span>
              )}
            </div>
          ))}
          {images.length < maxImages && (
            <label className="aspect-square border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-foreground/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
                disabled={isUploading}
              />
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </label>
          )}
        </div>
      )}
    </div>
  )
}
