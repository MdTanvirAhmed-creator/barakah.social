-- Say exactly who may do what with public_profiles, in every environment.
--
-- Revoking SELECT from anon in migration 31 fixed production, and revealed
-- that staging had drifted much further: anon also held INSERT, UPDATE,
-- DELETE and TRUNCATE on this view, and authenticated held all of them too.
--
-- That is worse than it sounds. The view is auto-updatable (is_updatable =
-- YES), and being SECURITY DEFINER it runs as its owner, who is not subject
-- to RLS on profiles. A write through the view therefore bypasses every
-- policy on the underlying table. On staging an anonymous caller could have
-- rewritten or deleted every profile in the database without an account.
-- Staging has no real members, so nothing was lost; the drift is the defect.
--
-- Production only ever had authenticated:SELECT. Rather than patch staging by
-- hand and leave the two to drift again, the grants are stated here in full,
-- so any environment this migration runs against ends up identical.
REVOKE ALL ON public_profiles FROM anon, authenticated;

-- Reading, and only reading, and only for members. Writes go to profiles
-- itself, where RLS applies and the owner cannot be impersonated.
GRANT SELECT ON public_profiles TO authenticated;
