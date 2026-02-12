'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import BookmarkItem from './BookmarkItem'

interface Bookmark {
    id: string
    user_id: string
    title: string
    url: string
    created_at: string
}

export default function BookmarkList() {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const supabase = createClient()

    const fetchBookmarks = async () => {
        setLoading(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setError('Not authenticated')
            setLoading(false)
            return
        }

        const { data, error: fetchError } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (fetchError) {
            setError('Failed to load bookmarks: ' + fetchError.message)
            setLoading(false)
            return
        }

        setBookmarks(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchBookmarks()

        // Set up real-time subscription
        const setupRealtimeSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            console.log('Setting up real-time subscription for user:', user.id)

            const channel = supabase
                .channel('bookmarks-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'bookmarks',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        console.log('🔥 Real-time event received:', payload.eventType, payload)

                        if (payload.eventType === 'INSERT') {
                            console.log('➕ Adding bookmark:', payload.new)
                            setBookmarks((prev) => {
                                // Prevent duplicates
                                const exists = prev.some(b => b.id === payload.new.id)
                                if (exists) return prev
                                return [payload.new as Bookmark, ...prev]
                            })
                        } else if (payload.eventType === 'DELETE') {
                            console.log('🗑️ Deleting bookmark:', payload.old.id)
                            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
                        } else if (payload.eventType === 'UPDATE') {
                            console.log('✏️ Updating bookmark:', payload.new)
                            setBookmarks((prev) =>
                                prev.map((b) => (b.id === payload.new.id ? payload.new as Bookmark : b))
                            )
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('Subscription status:', status)
                })

            return channel
        }

        // Call the async function and handle cleanup
        let channel: any
        setupRealtimeSubscription().then((ch) => {
            channel = ch
        })

        return () => {
            if (channel) {
                console.log('Cleaning up real-time subscription')
                supabase.removeChannel(channel)
            }
        }
    }, [])

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading bookmarks...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-700">{error}</p>
                <button
                    onClick={fetchBookmarks}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                    Retry
                </button>
            </div>
        )
    }

    if (bookmarks.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No bookmarks yet
                    </h3>
                    <p className="text-gray-500 text-sm">
                        Add your first bookmark using the form above. It will appear here with real-time sync!
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">
                    {bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
                </p>
                <button
                    onClick={fetchBookmarks}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                    Refresh
                </button>
            </div>

            {bookmarks.map((bookmark) => (
                <BookmarkItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    onDeleted={fetchBookmarks}
                />
            ))}
        </div>
    )
}
