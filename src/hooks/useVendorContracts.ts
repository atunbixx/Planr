'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToastContext } from '@/contexts/ToastContext'

export interface VendorDocument {
  id: string
  vendor_id: string
  couple_id: string
  document_type: string
  document_name: string
  file_path: string
  file_size?: number
  mime_type?: string
  uploaded_by?: string
  is_signed: boolean
  signed_date?: string
  expiration_date?: string
  notes?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export interface ContractMilestone {
  id: string
  vendor_id: string
  couple_id: string
  milestone_type: string
  title: string
  description?: string
  due_date: string
  amount?: number
  is_completed: boolean
  completed_date?: string
  reminder_days: number
  reminder_sent: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface ContractTerm {
  id: string
  vendor_id: string
  couple_id: string
  term_category: string
  term_title: string
  term_description: string
  is_negotiable: boolean
  is_agreed: boolean
  importance: 'low' | 'medium' | 'high' | 'critical'
  notes?: string
  created_at: string
  updated_at: string
}

export interface VendorReview {
  id: string
  vendor_id: string
  couple_id: string
  overall_rating: number
  quality_rating?: number
  value_rating?: number
  communication_rating?: number
  professionalism_rating?: number
  review_title?: string
  review_text?: string
  would_recommend: boolean
  review_date: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export const CONTRACT_STATUSES = [
  { value: 'draft', label: 'Draft', color: '#6b7280' },
  { value: 'sent', label: 'Sent', color: '#3b82f6' },
  { value: 'negotiating', label: 'Negotiating', color: '#f59e0b' },
  { value: 'signed', label: 'Signed', color: '#10b981' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' }
]

export const DOCUMENT_TYPES = [
  { value: 'contract', label: 'Contract', icon: '📄' },
  { value: 'invoice', label: 'Invoice', icon: '🧾' },
  { value: 'receipt', label: 'Receipt', icon: '🧾' },
  { value: 'proposal', label: 'Proposal', icon: '📋' },
  { value: 'insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'license', label: 'License', icon: '📜' },
  { value: 'portfolio', label: 'Portfolio', icon: '🎨' },
  { value: 'correspondence', label: 'Correspondence', icon: '✉️' },
  { value: 'other', label: 'Other', icon: '📎' }
]

export const MILESTONE_TYPES = [
  { value: 'deposit_due', label: 'Deposit Due', icon: '💰' },
  { value: 'payment_due', label: 'Payment Due', icon: '💳' },
  { value: 'final_payment', label: 'Final Payment', icon: '💵' },
  { value: 'service_date', label: 'Service Date', icon: '📅' },
  { value: 'meeting', label: 'Meeting', icon: '🤝' },
  { value: 'tasting', label: 'Tasting', icon: '🍽️' },
  { value: 'fitting', label: 'Fitting', icon: '👗' },
  { value: 'rehearsal', label: 'Rehearsal', icon: '🎭' },
  { value: 'delivery', label: 'Delivery', icon: '📦' },
  { value: 'setup', label: 'Setup', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📌' }
]

export function useVendorContracts(vendorId?: string) {
  const { couple, user } = useAuth()
  const { addToast } = useToastContext()
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<VendorDocument[]>([])
  const [milestones, setMilestones] = useState<ContractMilestone[]>([])
  const [terms, setTerms] = useState<ContractTerm[]>([])
  const [reviews, setReviews] = useState<VendorReview[]>([])

  // Load vendor contract data
  const loadContractData = useCallback(async () => {
    if (!couple?.id) return

    try {
      setLoading(true)

      // Build queries based on whether we're loading for a specific vendor or all
      const documentsQuery = supabase
        .from('vendor_documents')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })

      const milestonesQuery = supabase
        .from('contract_milestones')
        .select('*')
        .eq('couple_id', couple.id)
        .order('due_date', { ascending: true })

      const termsQuery = supabase
        .from('contract_terms')
        .select('*')
        .eq('couple_id', couple.id)
        .order('importance', { ascending: false })

      const reviewsQuery = supabase
        .from('vendor_reviews')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })

      // Add vendor filter if specified
      if (vendorId) {
        documentsQuery.eq('vendor_id', vendorId)
        milestonesQuery.eq('vendor_id', vendorId)
        termsQuery.eq('vendor_id', vendorId)
        reviewsQuery.eq('vendor_id', vendorId)
      }

      // Execute all queries in parallel
      const [docsResult, milestonesResult, termsResult, reviewsResult] = await Promise.all([
        documentsQuery,
        milestonesQuery,
        termsQuery,
        reviewsQuery
      ])

      if (docsResult.error) throw docsResult.error
      if (milestonesResult.error) throw milestonesResult.error
      if (termsResult.error) throw termsResult.error
      if (reviewsResult.error) throw reviewsResult.error

      setDocuments(docsResult.data || [])
      setMilestones(milestonesResult.data || [])
      setTerms(termsResult.data || [])
      setReviews(reviewsResult.data || [])

    } catch (error: any) {
      console.error('Error loading contract data:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load contract data',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [couple?.id, vendorId, addToast])

  // Load data on mount
  useEffect(() => {
    loadContractData()
  }, [loadContractData])

  // Upload document
  const uploadDocument = async (
    vendorId: string,
    file: File,
    documentType: string,
    documentData: Partial<VendorDocument>
  ) => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required')
    }

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${couple.id}/${vendorId}/${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(fileName)

      // Create document record
      const { data, error } = await supabase
        .from('vendor_documents')
        .insert({
          vendor_id: vendorId,
          couple_id: couple.id,
          document_type: documentType,
          document_name: documentData.document_name || file.name,
          file_path: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
          ...documentData
        })
        .select()
        .single()

      if (error) throw error

      setDocuments(prev => [data, ...prev])
      
      addToast({
        title: 'Success',
        description: 'Document uploaded successfully',
        type: 'success'
      })

      return data
    } catch (error: any) {
      console.error('Error uploading document:', error)
      throw error
    }
  }

  // Delete document
  const deleteDocument = async (documentId: string) => {
    if (!couple?.id) {
      throw new Error('Authentication required')
    }

    try {
      // Find the document to get file path
      const doc = documents.find(d => d.id === documentId)
      if (!doc) throw new Error('Document not found')

      // Delete from storage if it's a Supabase storage URL
      if (doc.file_path.includes('supabase')) {
        const path = doc.file_path.split('/').slice(-3).join('/')
        await supabase.storage
          .from('vendor-documents')
          .remove([path])
      }

      // Delete database record
      const { error } = await supabase
        .from('vendor_documents')
        .delete()
        .eq('id', documentId)
        .eq('couple_id', couple.id)

      if (error) throw error

      setDocuments(prev => prev.filter(d => d.id !== documentId))
      
      addToast({
        title: 'Success',
        description: 'Document deleted successfully',
        type: 'success'
      })
    } catch (error: any) {
      console.error('Error deleting document:', error)
      throw error
    }
  }

  // Add milestone
  const addMilestone = async (milestoneData: Omit<ContractMilestone, 'id' | 'created_at' | 'updated_at'>) => {
    if (!couple?.id) {
      throw new Error('Authentication required')
    }

    try {
      const { data, error } = await supabase
        .from('contract_milestones')
        .insert({
          ...milestoneData,
          couple_id: couple.id
        })
        .select()
        .single()

      if (error) throw error

      setMilestones(prev => [...prev, data].sort((a, b) => 
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      ))
      
      addToast({
        title: 'Success',
        description: 'Milestone added successfully',
        type: 'success'
      })

      return data
    } catch (error: any) {
      console.error('Error adding milestone:', error)
      throw error
    }
  }

  // Update milestone
  const updateMilestone = async (milestoneId: string, updates: Partial<ContractMilestone>) => {
    if (!couple?.id) {
      throw new Error('Authentication required')
    }

    try {
      const { data, error } = await supabase
        .from('contract_milestones')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', milestoneId)
        .eq('couple_id', couple.id)
        .select()
        .single()

      if (error) throw error

      setMilestones(prev => 
        prev.map(m => m.id === milestoneId ? data : m)
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      )
      
      addToast({
        title: 'Success',
        description: 'Milestone updated successfully',
        type: 'success'
      })

      return data
    } catch (error: any) {
      console.error('Error updating milestone:', error)
      throw error
    }
  }

  // Delete milestone
  const deleteMilestone = async (milestoneId: string) => {
    if (!couple?.id) {
      throw new Error('Authentication required')
    }

    try {
      const { error } = await supabase
        .from('contract_milestones')
        .delete()
        .eq('id', milestoneId)
        .eq('couple_id', couple.id)

      if (error) throw error

      setMilestones(prev => prev.filter(m => m.id !== milestoneId))
      
      addToast({
        title: 'Success',
        description: 'Milestone deleted successfully',
        type: 'success'
      })
    } catch (error: any) {
      console.error('Error deleting milestone:', error)
      throw error
    }
  }

  // Add contract term
  const addTerm = async (termData: Omit<ContractTerm, 'id' | 'created_at' | 'updated_at'>) => {
    if (!couple?.id) {
      throw new Error('Authentication required')
    }

    try {
      const { data, error } = await supabase
        .from('contract_terms')
        .insert({
          ...termData,
          couple_id: couple.id
        })
        .select()
        .single()

      if (error) throw error

      setTerms(prev => [...prev, data])
      
      addToast({
        title: 'Success',
        description: 'Contract term added successfully',
        type: 'success'
      })

      return data
    } catch (error: any) {
      console.error('Error adding term:', error)
      throw error
    }
  }

  // Update contract term
  const updateTerm = async (termId: string, updates: Partial<ContractTerm>) => {
    if (!couple?.id) {
      throw new Error('Authentication required')
    }

    try {
      const { data, error } = await supabase
        .from('contract_terms')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', termId)
        .eq('couple_id', couple.id)
        .select()
        .single()

      if (error) throw error

      setTerms(prev => prev.map(t => t.id === termId ? data : t))
      
      addToast({
        title: 'Success',
        description: 'Contract term updated successfully',
        type: 'success'
      })

      return data
    } catch (error: any) {
      console.error('Error updating term:', error)
      throw error
    }
  }

  // Add vendor review
  const addReview = async (reviewData: Omit<VendorReview, 'id' | 'created_at' | 'updated_at'>) => {
    if (!couple?.id) {
      throw new Error('Authentication required')
    }

    try {
      const { data, error } = await supabase
        .from('vendor_reviews')
        .insert({
          ...reviewData,
          couple_id: couple.id
        })
        .select()
        .single()

      if (error) throw error

      setReviews(prev => [data, ...prev])
      
      addToast({
        title: 'Success',
        description: 'Review added successfully',
        type: 'success'
      })

      return data
    } catch (error: any) {
      console.error('Error adding review:', error)
      throw error
    }
  }

  return {
    loading,
    documents,
    milestones,
    terms,
    reviews,
    uploadDocument,
    deleteDocument,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addTerm,
    updateTerm,
    addReview,
    refresh: loadContractData
  }
}