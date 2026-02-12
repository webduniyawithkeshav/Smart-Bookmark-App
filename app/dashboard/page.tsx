'use client'

import AddBookmarkForm from '@/components/bookmarks/AddBookmarkForm'
import BookmarkList from '@/components/bookmarks/BookmarkList'

/**
 * Dashboard Page
 * Protected by layout.tsx - only authenticated users can access
 * Shows bookmark management interface with real-time updates
 */
export default function DashboardPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">My Bookmarks</h2>
                <p className="text-gray-600 mt-1">Save and organize your favorite links</p>
            </div>

            <AddBookmarkForm onBookmarkAdded={() => { }} />

            <BookmarkList />
        </div>
    )
}
