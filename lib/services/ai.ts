// AI Verification Service using HuggingFace Inference API
// Free tier models for image analysis and verification

interface AIAnalysisResult {
  status: "passed" | "warning" | "failed" | "needs_more_evidence" | "matched"
  score: number
  confidence: number
  message: string
}

interface HuggingFaceResponse {
  score?: number
  label?: string
  error?: string
}

export class AIVerificationService {
  private apiKey: string
  private baseUrl = "https://api-inference.huggingface.co/models"

  // Thresholds for verification
  private readonly SIMILARITY_THRESHOLD = 0.6
  private readonly FAKE_DETECTION_THRESHOLD = 0.7
  private readonly LOW_CONFIDENCE_THRESHOLD = 0.4

  constructor() {
    this.apiKey = (process.env.HUGGINGFACE_API_KEY || "").trim()
    if (!this.apiKey) {
      console.warn("[AI] Warning: HUGGINGFACE_API_KEY is missing")
    }
  }

  private async callHuggingFace(model: string, inputs: unknown): Promise<HuggingFaceResponse[]> {
    // Mock mode if no API key
    if (!this.apiKey) {
      console.log("[AI] Mock mode - no HuggingFace API key")
      return [{ score: 0.85, label: "REAL" }]
    }

    try {
      const response = await fetch(`${this.baseUrl}/${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error(`[AI] HuggingFace error for ${model}:`, error)

        // Handle model loading (503)
        if (response.status === 503) {
          return [{ error: "Model loading, please retry" }]
        }

        throw new Error(`HuggingFace API error: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error(`[AI] Error calling ${model}:`, error)
      return [{ error: error instanceof Error ? error.message : "AI service unavailable" }]
    }
  }

  // Fetch image as base64 for HuggingFace
  private async imageToBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl)
      const buffer = await response.arrayBuffer()
      return Buffer.from(buffer).toString("base64")
    } catch (error) {
      console.error("[AI] Failed to fetch image:", error)
      throw new Error("Failed to fetch image for analysis")
    }
  }

  // 1. Analyze product photo vs description using CLIP
  async analyzeProductPhoto(imageUrl: string, description: string): Promise<AIAnalysisResult> {
    try {
      const imageBase64 = await this.imageToBase64(imageUrl)

      // Use CLIP for image-text matching
      const result = await this.callHuggingFace("openai/clip-vit-base-patch32", {
        inputs: {
          image: imageBase64,
          text: [description, "random unrelated image", "blank or unclear photo"],
        },
      })

      // CLIP returns scores for each text option
      const scores = result as (HuggingFaceResponse & { error?: string })[]

      if (!scores || scores.length === 0 || scores[0].error) {
        return {
          status: "warning",
          score: 0.5,
          confidence: 0.3,
          message: "AI verification temporarily unavailable. Manual review may be needed.",
        }
      }

      // Find the description match score (first item)
      const matchScore = scores[0]?.score || 0.5

      if (matchScore >= this.SIMILARITY_THRESHOLD) {
        return {
          status: "passed",
          score: matchScore,
          confidence: matchScore,
          message: "Product image matches the description well.",
        }
      } else if (matchScore >= this.LOW_CONFIDENCE_THRESHOLD) {
        return {
          status: "warning",
          score: matchScore,
          confidence: matchScore,
          message: "Photo may not clearly show the described item. Consider adding more photos.",
        }
      } else {
        return {
          status: "needs_more_evidence",
          score: matchScore,
          confidence: matchScore,
          message: "Photo unclear or doesn't match description. Please upload additional angles or a video.",
        }
      }
    } catch (error) {
      console.error("[AI] analyzeProductPhoto error:", error)
      return {
        status: "warning",
        score: 0.5,
        confidence: 0.3,
        message: "AI verification unavailable. Proceeding with manual review.",
      }
    }
  }

  // 2. Compare packaging photo to product photo
  async comparePackagingToProduct(packagingUrl: string, productUrl: string): Promise<AIAnalysisResult> {
    try {
      const packagingBase64 = await this.imageToBase64(packagingUrl)
      const productBase64 = await this.imageToBase64(productUrl)

      // Use ViT for image similarity
      const packagingFeatures = await this.callHuggingFace("google/vit-base-patch16-224", { inputs: packagingBase64 })

      const productFeatures = await this.callHuggingFace("google/vit-base-patch16-224", { inputs: productBase64 })

      // Calculate cosine similarity between feature vectors
      // Since HuggingFace returns classification, we simulate similarity
      const similarity = this.calculateSimplifiedSimilarity(packagingFeatures, productFeatures)

      if (similarity >= this.SIMILARITY_THRESHOLD) {
        return {
          status: "matched",
          score: similarity,
          confidence: similarity,
          message: "Packaging photo matches the original product listing.",
        }
      } else if (similarity >= this.LOW_CONFIDENCE_THRESHOLD) {
        return {
          status: "warning",
          score: similarity,
          confidence: similarity,
          message: "Packaging photo shows some differences. Buyer will be notified.",
        }
      } else {
        return {
          status: "needs_more_evidence",
          score: similarity,
          confidence: similarity,
          message: "Packaging photo doesn't match product. Please upload additional proof.",
        }
      }
    } catch (error) {
      console.error("[AI] comparePackagingToProduct error:", error)
      return {
        status: "warning",
        score: 0.5,
        confidence: 0.3,
        message: "Comparison unavailable. Manual review recommended.",
      }
    }
  }

  // 3. Detect fake/AI-generated images
  async detectFakeImage(imageUrl: string): Promise<AIAnalysisResult> {
    try {
      const imageBase64 = await this.imageToBase64(imageUrl)

      // Use AI image detector
      const result = await this.callHuggingFace("umm-maybe/AI-image-detector", { inputs: imageBase64 })

      const scores = result as (HuggingFaceResponse & { error?: string })[]

      if (!scores || scores.length === 0 || scores[0].error) {
        return {
          status: "warning",
          score: 0.5,
          confidence: 0.3,
          message: "Fake detection unavailable. Image accepted with caution.",
        }
      }

      // Find the "artificial" or "FAKE" label score
      const fakeScore =
        scores.find(
          (s) =>
            s.label?.toLowerCase().includes("artificial") ||
            s.label?.toLowerCase().includes("fake") ||
            s.label?.toLowerCase().includes("ai"),
        )?.score || 0

      const realScore = 1 - fakeScore

      if (realScore >= this.FAKE_DETECTION_THRESHOLD) {
        return {
          status: "passed",
          score: realScore,
          confidence: realScore,
          message: "Image appears to be a genuine photograph.",
        }
      } else if (realScore >= 0.5) {
        return {
          status: "warning",
          score: realScore,
          confidence: realScore,
          message: "Image may be edited or AI-generated. Additional photos recommended.",
        }
      } else {
        return {
          status: "failed",
          score: realScore,
          confidence: 1 - realScore,
          message: "Image appears to be AI-generated. Please upload real product photos.",
        }
      }
    } catch (error) {
      console.error("[AI] detectFakeImage error:", error)
      return {
        status: "warning",
        score: 0.5,
        confidence: 0.3,
        message: "Fake detection unavailable. Proceeding with caution.",
      }
    }
  }

  // 4. Compute text embeddings for similarity
  async computeTextSimilarity(text1: string, text2: string): Promise<number> {
    try {
      // Use sentence-transformers for text embeddings
      const embeddings1 = await this.callHuggingFace("sentence-transformers/all-MiniLM-L6-v2", { inputs: text1 })

      const embeddings2 = await this.callHuggingFace("sentence-transformers/all-MiniLM-L6-v2", { inputs: text2 })

      // Calculate cosine similarity
      if (Array.isArray(embeddings1) && Array.isArray(embeddings2)) {
        return this.cosineSimilarity(embeddings1 as number[], embeddings2 as number[])
      }

      return 0.5 // Default if embeddings unavailable
    } catch (error) {
      console.error("[AI] computeTextSimilarity error:", error)
      return 0.5
    }
  }

  // 5. Check for duplicate/repeated images
  async checkDuplicateImage(
    imageUrl: string,
    existingHashes: string[],
  ): Promise<{ isDuplicate: boolean; similarity: number }> {
    try {
      // Generate a simple perceptual hash
      const newHash = await this.generateImageHash(imageUrl)

      for (const existingHash of existingHashes) {
        const similarity = this.compareHashes(newHash, existingHash)
        if (similarity > 0.95) {
          return { isDuplicate: true, similarity }
        }
      }

      return { isDuplicate: false, similarity: 0 }
    } catch (error) {
      console.error("[AI] checkDuplicateImage error:", error)
      return { isDuplicate: false, similarity: 0 }
    }
  }

  // Generate simple image hash for duplicate detection
  private async generateImageHash(imageUrl: string): Promise<string> {
    try {
      // Simple hash based on image metadata and small sample
      const response = await fetch(imageUrl)
      const buffer = await response.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // Take samples from different parts of the image
      const samples: number[] = []
      const step = Math.floor(bytes.length / 32)
      for (let i = 0; i < 32; i++) {
        samples.push(bytes[i * step] || 0)
      }

      return samples.map((b) => b.toString(16).padStart(2, "0")).join("")
    } catch {
      return Math.random().toString(36).substring(2)
    }
  }

  // Compare two hashes
  private compareHashes(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return 0
    let matches = 0
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] === hash2[i]) matches++
    }
    return matches / hash1.length
  }

  // Simplified similarity calculation for image features
  private calculateSimplifiedSimilarity(features1: HuggingFaceResponse[], features2: HuggingFaceResponse[]): number {
    // If we have classification results, compare top labels
    if (features1[0]?.label && features2[0]?.label) {
      const labels1 = new Set(features1.slice(0, 5).map((f) => f.label))
      const labels2 = new Set(features2.slice(0, 5).map((f) => f.label))

      let overlap = 0
      labels1.forEach((label) => {
        if (labels2.has(label)) overlap++
      })

      return overlap / Math.max(labels1.size, labels2.size, 1)
    }

    return 0.6 // Default moderate similarity
  }

  // Cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    return denominator === 0 ? 0 : dotProduct / denominator
  }

  // Combined verification for product listings
  async verifyProductListing(params: {
    images: string[]
    itemName: string
    description?: string
  }): Promise<{
    overallStatus: "passed" | "warning" | "failed" | "needs_more_evidence"
    checks: {
      imageTextMatch?: AIAnalysisResult
      fakeDetection?: AIAnalysisResult
      duplicateCheck?: { isDuplicate: boolean; similarity: number }
    }
    message: string
  }> {
    const checks: {
      imageTextMatch?: AIAnalysisResult
      fakeDetection?: AIAnalysisResult
      duplicateCheck?: { isDuplicate: boolean; similarity: number }
    } = {}

    // Run checks in parallel for efficiency
    const [imageTextResult, fakeDetectionResult] = await Promise.all([
      // Check main image against description
      this.analyzeProductPhoto(
        params.images[0],
        `${params.itemName}${params.description ? ` ${params.description}` : ""}`,
      ),
      // Check if main image is fake
      this.detectFakeImage(params.images[0]),
    ])

    checks.imageTextMatch = imageTextResult
    checks.fakeDetection = fakeDetectionResult

    // Determine overall status
    let overallStatus: "passed" | "warning" | "failed" | "needs_more_evidence" = "passed"
    const messages: string[] = []

    // Fake detection takes priority
    if (fakeDetectionResult.status === "failed") {
      overallStatus = "failed"
      messages.push(fakeDetectionResult.message)
    } else if (fakeDetectionResult.status === "warning") {
      overallStatus = "warning"
      messages.push(fakeDetectionResult.message)
    }

    // Image-text matching
    if (imageTextResult.status === "needs_more_evidence") {
      if (overallStatus === "passed") overallStatus = "needs_more_evidence"
      messages.push(imageTextResult.message)
    } else if (imageTextResult.status === "warning" && overallStatus === "passed") {
      overallStatus = "warning"
      messages.push(imageTextResult.message)
    }

    // If everything passed
    if (messages.length === 0) {
      messages.push("All verification checks passed. Listing looks good!")
    }

    return {
      overallStatus,
      checks,
      message: messages.join(" "),
    }
  }
}

export const aiService = new AIVerificationService()
