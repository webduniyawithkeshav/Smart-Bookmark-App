'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface Bookmark {
    id: string
    title: string
    url: string
    created_at: string
}

interface BookmarkItemProps {
    bookmark: Bookmark
    onDeleted: () => void
}

export default function BookmarkItem({ bookmark, onDeleted }: BookmarkItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(bookmark.title)
    const [editUrl, setEditUrl] = useState(bookmark.url)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState('')

    const supabase = createClient()

    const handleEdit = () => {
        setIsEditing(true)
        setEditTitle(bookmark.title)
        setEditUrl(bookmark.url)
        setError('')
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditTitle(bookmark.title)
        setEditUrl(bookmark.url)
        setError('')
    }

    const handleSaveEdit = async () => {
        // Validate
        if (!editTitle.trim() || !editUrl.trim()) {
            setError('Title and URL are required')
            return
        }

        try {
            new URL(editUrl)
        } catch {
            setError('Please enter a valid URL')
            return
        }

        setSaving(true)
        setError('')

        const { error: updateError } = await supabase
            .from('bookmarks')
            .update({
                title: editTitle.trim(),
                url: editUrl.trim(),
            })
            .eq('id', bookmark.id)

        if (updateError) {
            console.error('Update error:', updateError)
            setError('Failed to update bookmark')
            setSaving(false)
            return
        }

        setSaving(false)
        setIsEditing(false)
        // Real-time will handle the UI update
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this bookmark?')) {
            return
        }

        setDeleting(true)

        const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('id', bookmark.id)

        if (error) {
            console.error('Delete error:', error)
            alert('Failed to delete bookmark')
            setDeleting(false)
            return
        }

        onDeleted()
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    // Edit mode UI
    if (isEditing) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Edit Bookmark</h4>

                {error && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                        {error}
                    </div>
                )}

                <div className="space-y-2 mb-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            URL
                        </label>
                        <input
                            type="url"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="flex-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )
    }

    // View mode UI
    return (
        <div className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-200 ease-in-out">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 truncate">
                        {bookmark.title}
                    </h4>
                    <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block"
                    >
                        {bookmark.url}
                    </a>
                    <p className="text-xs text-gray-500 mt-2">
                        Added {formatDate(bookmark.created_at)}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Open in new tab"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>

                    <button
                        onClick={handleEdit}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Edit bookmark"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>

                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Delete bookmark"
                    >
                        {deleting ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
