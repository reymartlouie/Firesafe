-- Drop old function if it exists (handles old param names: p_risk_level, p_smoke_ppm, etc.)
DROP FUNCTION IF EXISTS insert_simulated_fire_event(
  int, text, numeric, numeric, numeric, numeric, numeric, int, text
);
DROP FUNCTION IF EXISTS insert_simulated_fire_event(
  int, text, numeric, numeric, numeric, text
);

-- Recreate with corrected parameter names aligned to fire_events table columns
CREATE OR REPLACE FUNCTION insert_simulated_fire_event(
  p_node_number  int,
  p_risk         text,
  p_temperature  numeric DEFAULT NULL,
  p_humidity     numeric DEFAULT NULL,
  p_smoke_gas    numeric DEFAULT NULL,
  p_description  text    DEFAULT NULL
)
RETURNS SETOF fire_events
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_temperature  numeric;
  v_humidity     numeric;
  v_smoke_gas    numeric;
  v_servo_angle  int;
  v_new_event    fire_events;
BEGIN
  -- Apply default sensor values per risk level if not provided
  IF p_risk = 'HIGH' THEN
    v_temperature := COALESCE(p_temperature, 36);
    v_humidity    := COALESCE(p_humidity,    35);
    v_smoke_gas   := COALESCE(p_smoke_gas,   150);
    v_servo_angle := 45;
  ELSIF p_risk = 'CRITICAL' THEN
    v_temperature := COALESCE(p_temperature, 39);
    v_humidity    := COALESCE(p_humidity,    25);
    v_smoke_gas   := COALESCE(p_smoke_gas,   300);
    v_servo_angle := 90;
  ELSIF p_risk = 'FIRE_DETECTED' THEN
    v_temperature := COALESCE(p_temperature, 45);
    v_humidity    := COALESCE(p_humidity,    20);
    v_smoke_gas   := COALESCE(p_smoke_gas,   500);
    v_servo_angle := 180;
  ELSE
    v_temperature := COALESCE(p_temperature, 30);
    v_humidity    := COALESCE(p_humidity,    50);
    v_smoke_gas   := COALESCE(p_smoke_gas,   100);
    v_servo_angle := 0;
  END IF;

  INSERT INTO fire_events (
    node,
    risk,
    temperature,
    humidity,
    smoke_gas,
    servo_angle,
    notified,
    event_timestamp
  )
  VALUES (
    p_node_number,
    p_risk,
    v_temperature,
    v_humidity,
    v_smoke_gas,
    v_servo_angle,
    false,
    now()
  )
  RETURNING * INTO v_new_event;

  RETURN NEXT v_new_event;
END;
$$;
