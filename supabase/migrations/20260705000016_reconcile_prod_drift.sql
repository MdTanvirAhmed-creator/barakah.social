-- Reconcile drift between production and the migration chain.
--
-- Production was originally provisioned by running MASTER_MIGRATION_SCRIPT.sql
-- by hand. A schema comparison (2026-07-05) found exactly one object present in
-- production but missing from the per-feature migrations: the
-- validate_content_relationship() function and its trigger on
-- content_relationships (MASTER script lines ~4331-4380). Everything else
-- (tables, columns, views, policies) matches exactly.
--
-- Definition below is taken verbatim from production (pg_get_functiondef).

CREATE OR REPLACE FUNCTION public.validate_content_relationship()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Validate source content exists
    IF NEW.source_content_type = 'content_submission' THEN
        IF NOT EXISTS (SELECT 1 FROM content_submissions WHERE id = NEW.source_content_id) THEN
            RAISE EXCEPTION 'Source content_submission with id % does not exist', NEW.source_content_id;
        END IF;
    ELSIF NEW.source_content_type = 'imported_content' THEN
        IF NOT EXISTS (SELECT 1 FROM imported_content WHERE id = NEW.source_content_id) THEN
            RAISE EXCEPTION 'Source imported_content with id % does not exist', NEW.source_content_id;
        END IF;
    ELSIF NEW.source_content_type = 'learning_path' THEN
        IF NOT EXISTS (SELECT 1 FROM learning_paths WHERE id = NEW.source_content_id) THEN
            RAISE EXCEPTION 'Source learning_path with id % does not exist', NEW.source_content_id;
        END IF;
    ELSIF NEW.source_content_type = 'study_group' THEN
        IF NOT EXISTS (SELECT 1 FROM study_groups WHERE id = NEW.source_content_id) THEN
            RAISE EXCEPTION 'Source study_group with id % does not exist', NEW.source_content_id;
        END IF;
    END IF;

    -- Validate target content exists
    IF NEW.target_content_type = 'content_submission' THEN
        IF NOT EXISTS (SELECT 1 FROM content_submissions WHERE id = NEW.target_content_id) THEN
            RAISE EXCEPTION 'Target content_submission with id % does not exist', NEW.target_content_id;
        END IF;
    ELSIF NEW.target_content_type = 'imported_content' THEN
        IF NOT EXISTS (SELECT 1 FROM imported_content WHERE id = NEW.target_content_id) THEN
            RAISE EXCEPTION 'Target imported_content with id % does not exist', NEW.target_content_id;
        END IF;
    ELSIF NEW.target_content_type = 'learning_path' THEN
        IF NOT EXISTS (SELECT 1 FROM learning_paths WHERE id = NEW.target_content_id) THEN
            RAISE EXCEPTION 'Target learning_path with id % does not exist', NEW.target_content_id;
        END IF;
    ELSIF NEW.target_content_type = 'study_group' THEN
        IF NOT EXISTS (SELECT 1 FROM study_groups WHERE id = NEW.target_content_id) THEN
            RAISE EXCEPTION 'Target study_group with id % does not exist', NEW.target_content_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS validate_content_relationship_trigger ON content_relationships;
CREATE TRIGGER validate_content_relationship_trigger
    BEFORE INSERT OR UPDATE ON content_relationships
    FOR EACH ROW
    EXECUTE FUNCTION validate_content_relationship();
