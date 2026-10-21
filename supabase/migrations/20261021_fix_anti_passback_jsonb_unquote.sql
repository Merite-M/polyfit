-- Migration: Fix check_anti_passback JSONB setting unquoting
-- Handles both string and integer JSONB representations of anti_passback_window_minutes

CREATE OR REPLACE FUNCTION public.check_anti_passback(
    p_employee_id uuid,
    p_provider_location_id uuid,
    p_window_minutes integer DEFAULT NULL::integer
)
RETURNS TABLE(
    allowed boolean,
    last_visit_at timestamp with time zone,
    cooldown_window_minutes integer,
    minutes_remaining numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_window INT;
    v_last_checkin TIMESTAMPTZ;
    v_elapsed_minutes NUMERIC;
BEGIN
    IF p_window_minutes IS NOT NULL THEN
        v_window := p_window_minutes;
    ELSE
        SELECT COALESCE(NULLIF(TRIM(BOTH '"' FROM value::text), '')::int, 30)
        INTO v_window
        FROM public.platform_settings
        WHERE key = 'anti_passback_window_minutes';
        IF v_window IS NULL THEN v_window := 30; END IF;
    END IF;

    SELECT check_in_at
    INTO v_last_checkin
    FROM public.visits
    WHERE employee_id = p_employee_id
      AND provider_location_id = p_provider_location_id
      AND status = 'verified'
      AND check_in_at > (clock_timestamp() - (v_window || ' minutes')::interval)
    ORDER BY check_in_at DESC
    LIMIT 1;

    IF v_last_checkin IS NULL THEN
        RETURN QUERY SELECT TRUE, NULL::TIMESTAMPTZ, v_window, 0::NUMERIC;
    ELSE
        v_elapsed_minutes := EXTRACT(EPOCH FROM (clock_timestamp() - v_last_checkin)) / 60.0;
        RETURN QUERY SELECT 
            FALSE, 
            v_last_checkin, 
            v_window, 
            ROUND(GREATEST(0, v_window - v_elapsed_minutes)::numeric, 1);
    END IF;
END;
$function$;
