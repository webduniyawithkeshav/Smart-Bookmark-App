import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'

/**
 * Protected Dashboard Layout
 * Ensures user is authenticated before showing dashboard
 * Redirects to login if not authenticated
 */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Redirect to login if not authenticated
    if (!user) {
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">Smart Bookmarks</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt={user.user_metadata.full_name || 'User'}
                                    className="w-8 h-8 rounded-full border-2 border-gray-200"
                                />
                                <div className="hidden sm:block text-sm">
                                    <p className="font-medium text-gray-900">{user.user_metadata.full_name}</p>
                                    <p className="text-gray-500">{user.email}</p>
                                </div>
                            </div>
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
