// API client for messaging endpoints

export interface SendMessageParams {
  vendorId: string
  content: string
  messageType?: 'text' | 'image' | 'document'
  threadId?: string
  attachments?: Array<{
    url: string
    name: string
    size: number
    type: string
  }>
  metadata?: Record<string, any>
}

export interface UpdateMessageParams {
  messageId: string
  content: string
}

export interface UploadFileParams {
  file: File
  vendorId: string
  messageId?: string
  onProgress?: (progress: number) => void
}

export class MessagingAPI {
  private baseUrl = '/api/messages'

  // Get all conversations
  async getConversations() {
    const response = await fetch(`${this.baseUrl}/conversations`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch conversations')
    }

    return response.json()
  }

  // Get messages for a vendor
  async getVendorMessages(vendorId: string, beforeMessageId?: string) {
    const url = new URL(`${this.baseUrl}/${vendorId}`, window.location.origin)
    
    if (beforeMessageId) {
      url.searchParams.append('before', beforeMessageId)
    }

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages')
    }

    return response.json()
  }

  // Send a message
  async sendMessage(params: SendMessageParams) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send message')
    }

    return response.json()
  }

  // Update a message
  async updateMessage({ messageId, content }: UpdateMessageParams) {
    const response = await fetch(`${this.baseUrl}/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update message')
    }

    return response.json()
  }

  // Delete a message
  async deleteMessage(messageId: string) {
    const response = await fetch(`${this.baseUrl}/${messageId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete message')
    }

    return response.json()
  }

  // Mark message as read
  async markAsRead(messageId: string) {
    const response = await fetch(`${this.baseUrl}/${messageId}/read`, {
      method: 'POST'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to mark as read')
    }

    return response.json()
  }

  // Update typing status
  async updateTypingStatus(vendorId: string, isTyping: boolean) {
    const response = await fetch(`${this.baseUrl}/typing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vendorId, isTyping })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update typing status')
    }

    return response.json()
  }

  // Upload a file with progress tracking
  async uploadFile({ file, vendorId, messageId, onProgress }: UploadFileParams): Promise<any> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('vendorId', vendorId)
      if (messageId) {
        formData.append('messageId', messageId)
      }

      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100
          onProgress(Math.round(percentComplete))
        }
      })

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response.data)
          } catch (error) {
            reject(new Error('Invalid response format'))
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.error || 'Upload failed'))
          } catch {
            reject(new Error('Upload failed'))
          }
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'))
      })

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'))
      })

      // Send request
      xhr.open('POST', `${this.baseUrl}/upload`)
      xhr.send(formData)
    })
  }
}

// Export singleton instance
export const messagingAPI = new MessagingAPI()