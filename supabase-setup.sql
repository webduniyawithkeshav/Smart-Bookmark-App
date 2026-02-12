-- ============================================
-- Smart Bookmark App - Database Setup
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- This is PRODUCTION-SAFE and privacy-compliant
-- ============================================

-- ============================================
-- 1. CREATE BOOKMARKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for filtering by user (used in every query)
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id 
ON bookmarks(user_id);

-- Index for sorting bookmarks by creation date
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at 
ON bookmarks(user_id, created_at DESC);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. DROP EXISTING POLICIES (for re-runs)
-- ============================================

DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can update own bookmarks" ON bookmarks;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================

-- POLICY 1: SELECT - Users can only view their own bookmarks
CREATE POLICY "Users can view own bookmarks"
ON bookmarks
FOR SELECT
USING (auth.uid() = user_id);

-- POLICY 2: INSERT - Users can only insert bookmarks for themselves
CREATE POLICY "Users can insert own bookmarks"
ON bookmarks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- POLICY 3: DELETE - Users can only delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
ON bookmarks
FOR DELETE
USING (auth.uid() = user_id);

-- POLICY 4: UPDATE - Users can only update their own bookmarks (future-proofing)
CREATE POLICY "Users can update own bookmarks"
ON bookmarks
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users only
GRANT ALL ON bookmarks TO authenticated;

-- Explicitly revoke access from anonymous users
REVOKE ALL ON bookmarks FROM anon;

-- ============================================
-- 7. ENABLE REALTIME (for live updates)
-- ============================================

-- Enable realtime replication for the bookmarks table
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after setup to verify everything works:

-- 1. Check table exists and structure is correct
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'bookmarks';

-- 2. Check RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename = 'bookmarks';

-- 3. Check policies exist
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'bookmarks';

-- 4. Check indexes exist
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'bookmarks';

-- ============================================
-- SECURITY GUARANTEES
-- ============================================
-- ✅ Users can ONLY see their own bookmarks (auth.uid() = user_id)
-- ✅ Users can ONLY insert bookmarks with their own user_id
-- ✅ Users can ONLY delete their own bookmarks
-- ✅ Anonymous users have ZERO access (REVOKE anon)
-- ✅ Deleting a user automatically deletes all their bookmarks (ON DELETE CASCADE)
-- ✅ No cross-user data leakage possible (enforced at database level)
-- ✅ Real-time updates respect RLS policies
-- ============================================
