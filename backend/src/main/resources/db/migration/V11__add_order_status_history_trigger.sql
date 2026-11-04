-- ============================================================================
-- VARELLION E-Commerce Database Migration
-- Migration: V11__add_order_status_history_trigger.sql
-- Description: Automatically append status transitions to order_status_history
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_order_status_transition()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.order_status IS DISTINCT FROM NEW.order_status) THEN
        -- Prevent duplicate entries if the application layer or another trigger already logged this transition
        IF NOT EXISTS (
            SELECT 1 FROM public.order_status_history
            WHERE order_id = NEW.order_id
              AND new_status = NEW.order_status
              AND created_at >= NOW() - INTERVAL '2 seconds'
        ) THEN
            INSERT INTO public.order_status_history (
                order_id,
                previous_status,
                new_status,
                reason,
                actor_id,
                created_at
            ) VALUES (
                NEW.order_id,
                OLD.order_status,
                NEW.order_status,
                'Status updated to ' || NEW.order_status,
                NULL,
                NOW()
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_status_history ON public.orders;

CREATE TRIGGER trg_orders_status_history
AFTER UPDATE OF order_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_transition();
