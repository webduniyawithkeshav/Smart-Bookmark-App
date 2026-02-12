'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Logout Button
 * Signs out user and redirects to login page
 */
export default function LogoutButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        setLoading(true)
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? 'Signing out...' : 'Sign out'}
        </button>
    )
}
