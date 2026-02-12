'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface AddBookmarkFormProps {
    onBookmarkAdded: () => void
}

export default function AddBookmarkForm({ onBookmarkAdded }: AddBookmarkFormProps) {
    const [title, setTitle] = useState('')
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Validate URL
        try {
            new URL(url)
        } catch {
            setError('Please enter a valid URL')
            setLoading(false)
            return
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setError('You must be logged in')
            setLoading(false)
            return
        }

        // Insert bookmark
        const { error: insertError } = await supabase
            .from('bookmarks')
            .insert([
                {
                    user_id: user.id,
                    title: title.trim(),
                    url: url.trim(),
                }
            ])

        if (insertError) {
            setError('Failed to add bookmark: ' + insertError.message)
            setLoading(false)
            return
        }

        // Success - clear form
        setTitle('')
        setUrl('')
        setLoading(false)
        onBookmarkAdded()
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Add New Bookmark</h3>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-3">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="My favorite website"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200"
                    />
                </div>

                <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                        URL
                    </label>
                    <input
                        type="url"
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !title.trim() || !url.trim()}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-2.5 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                    {loading ? 'Adding...' : 'Add Bookmark'}
                </button>
            </div>
        </form>
    )
}
