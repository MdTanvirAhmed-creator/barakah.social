-- public_profiles is for members, not for the open internet.
--
-- The view shows the few fields a signed-in member needs in order to know who
-- wrote something: username, display name, avatar, scholar status. It is
-- SECURITY DEFINER on purpose — its entire job is to show those fields to
-- someone whose own RLS on profiles would return nothing, which is what makes
-- a stranger's name readable on the minbar.
--
-- What was not on purpose is that SELECT had been granted to `anon`. The
-- profiles table itself correctly returns nothing to a signed-out caller, and
-- the view walked straight past that: a request with no account at all came
-- back with every member's real display name. Supabase's linter flags the
-- SECURITY DEFINER property; the property is fine, the grant was not.
--
-- This is the same decision as migration 29, where public posts were made
-- readable only to signed-in members rather than to the web. A platform whose
-- posts are members-only should not publish its membership list.
REVOKE SELECT ON public_profiles FROM anon;

COMMENT ON VIEW public_profiles IS
  'The publicly-visible slice of a profile, for signed-in members only. '
  'SECURITY DEFINER is deliberate: it exists to show these few columns to '
  'members who are not companions of the person, which RLS on profiles would '
  'otherwise refuse. Never GRANT this to anon — that publishes the membership '
  'list to anyone who asks. Adding a column here bypasses RLS by design, so '
  'add only what every member may see.';
