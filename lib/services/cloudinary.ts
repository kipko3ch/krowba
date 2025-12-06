// Cloudinary upload service for Krowba
// Uses signed uploads for security

export interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  bytes: number
}

export interface UploadSignature {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  folder: string
}

// Get upload signature from our API
export async function getUploadSignature(folder: string): Promise<UploadSignature> {
  const response = await fetch("/api/upload/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  })

  if (!response.ok) {
    throw new Error("Failed to get upload signature")
  }

  return response.json()
}

// Upload file to Cloudinary using signed upload
export async function uploadToCloudinary(
  file: File,
  folder: string,
  onProgress?: (progress: number) => void,
): Promise<CloudinaryUploadResult> {
  const signature = await getUploadSignature(folder)

  const formData = new FormData()
  formData.append("file", file)
  formData.append("signature", signature.signature)
  formData.append("timestamp", signature.timestamp.toString())
  formData.append("api_key", signature.apiKey)
  formData.append("folder", signature.folder)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`))
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"))
    })

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`)
    xhr.send(formData)
  })
}

// Upload multiple files
export async function uploadMultipleToCloudinary(
  files: File[],
  folder: string,
  onProgress?: (fileIndex: number, progress: number) => void,
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = []

  for (let i = 0; i < files.length; i++) {
    const result = await uploadToCloudinary(files[i], folder, (progress) => onProgress?.(i, progress))
    results.push(result)
  }

  return results
}

// Generate optimized Cloudinary URL
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: "auto" | "webp" | "avif"
  } = {},
): string {
  const { width, height, quality = 80, format = "auto" } = options

  // Parse Cloudinary URL
  const cloudinaryRegex = /\/upload\/(.+)/
  const match = url.match(cloudinaryRegex)

  if (!match) return url

  const transformations = [
    format && `f_${format}`,
    quality && `q_${quality}`,
    width && `w_${width}`,
    height && `h_${height}`,
    "c_limit", // Limit to max dimensions without cropping
  ]
    .filter(Boolean)
    .join(",")

  return url.replace("/upload/", `/upload/${transformations}/`)
}
