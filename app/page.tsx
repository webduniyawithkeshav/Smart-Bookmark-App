import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginButton from '@/components/auth/LoginButton'

/**
 * Landing/Login Page
 * If user is already logged in, redirect to dashboard
 * Otherwise show login with Google button
 */
export default async function Home() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Redirect to dashboard if already logged in
    if (user) {
        redirect('/dashboard')
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-md w-full px-6">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">
                        Smart Bookmarks
                    </h1>
                    <p className="text-gray-600">
                        Save and organize your favorite links with real-time sync
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                Welcome back
                            </h2>
                            <p className="text-sm text-gray-500">
                                Sign in with your Google account to continue
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <LoginButton />
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <span>Your bookmarks are private and secure</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-500 mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </main>
    )
}
