
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'technician');
CREATE TYPE public.asset_status AS ENUM ('active', 'maintenance', 'down', 'critical');
CREATE TYPE public.fault_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.fault_status AS ENUM ('open', 'investigating', 'resolved', 'closed');
CREATE TYPE public.urgency_level AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE public.workflow_stage AS ENUM (
  'submitted','review','inspection','visual_analysis','engineering_review',
  'manufacturing','quality_control','shipping','delivered','closed'
);

-- =========================
-- COMPANIES
-- =========================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  country TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================
-- USER ROLES
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_company()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- =========================
-- ASSET CATEGORIES
-- =========================
CREATE TABLE public.asset_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_categories TO authenticated;
GRANT ALL ON public.asset_categories TO service_role;
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;

-- =========================
-- ASSETS
-- =========================
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.asset_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  serial_number TEXT,
  model TEXT,
  manufacturer TEXT,
  purchase_date DATE,
  location TEXT,
  status public.asset_status NOT NULL DEFAULT 'active',
  photo_url TEXT,
  qr_code TEXT UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- =========================
-- FAULT REPORTS
-- =========================
CREATE TABLE public.fault_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity public.fault_severity NOT NULL DEFAULT 'medium',
  status public.fault_status NOT NULL DEFAULT 'open',
  fault_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fault_reports TO authenticated;
GRANT ALL ON public.fault_reports TO service_role;
ALTER TABLE public.fault_reports ENABLE ROW LEVEL SECURITY;

-- =========================
-- FAULT IMAGES
-- =========================
CREATE TABLE public.fault_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fault_id UUID NOT NULL REFERENCES public.fault_reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  angle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fault_images TO authenticated;
GRANT ALL ON public.fault_images TO service_role;
ALTER TABLE public.fault_images ENABLE ROW LEVEL SECURITY;

-- =========================
-- SPARE PART REQUESTS
-- =========================
CREATE TABLE public.spare_part_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  fault_id UUID REFERENCES public.fault_reports(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id),
  part_name TEXT NOT NULL,
  description TEXT,
  urgency public.urgency_level NOT NULL DEFAULT 'normal',
  quantity INT NOT NULL DEFAULT 1,
  stage public.workflow_stage NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spare_part_requests TO authenticated;
GRANT ALL ON public.spare_part_requests TO service_role;
ALTER TABLE public.spare_part_requests ENABLE ROW LEVEL SECURITY;

-- =========================
-- WORKFLOW EVENTS
-- =========================
CREATE TABLE public.workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.spare_part_requests(id) ON DELETE CASCADE,
  stage public.workflow_stage NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_events TO authenticated;
GRANT ALL ON public.workflow_events TO service_role;
ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =========================
-- POLICIES
-- =========================

-- companies
CREATE POLICY "Authenticated can read companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update companies" ON public.companies FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin can delete companies" ON public.companies FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- profiles
CREATE POLICY "Users see own profile or same company" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR company_id = public.current_company() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- user_roles
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manages roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- asset_categories (shared reference data)
CREATE POLICY "All read categories" ON public.asset_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create categories" ON public.asset_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update categories" ON public.asset_categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete categories" ON public.asset_categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- assets
CREATE POLICY "Read own company assets" ON public.assets FOR SELECT TO authenticated
  USING (company_id = public.current_company() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Insert assets for own company" ON public.assets FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Update assets in own company" ON public.assets FOR UPDATE TO authenticated
  USING (company_id = public.current_company() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Delete assets admin/manager" ON public.assets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- fault_reports
CREATE POLICY "Read company faults" ON public.fault_reports FOR SELECT TO authenticated
  USING (company_id = public.current_company() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Insert company faults" ON public.fault_reports FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Update company faults" ON public.fault_reports FOR UPDATE TO authenticated
  USING (company_id = public.current_company() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Delete faults admin" ON public.fault_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- fault_images (via parent fault)
CREATE POLICY "Read images of company faults" ON public.fault_images FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fault_reports f WHERE f.id = fault_id AND (f.company_id = public.current_company() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Insert images of company faults" ON public.fault_images FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.fault_reports f WHERE f.id = fault_id AND (f.company_id = public.current_company() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Delete images of company faults" ON public.fault_images FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fault_reports f WHERE f.id = fault_id AND (f.company_id = public.current_company() OR public.has_role(auth.uid(),'admin'))));

-- spare_part_requests
CREATE POLICY "Read company requests" ON public.spare_part_requests FOR SELECT TO authenticated
  USING (company_id = public.current_company() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Insert company requests" ON public.spare_part_requests FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Update company requests" ON public.spare_part_requests FOR UPDATE TO authenticated
  USING (company_id = public.current_company() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Delete requests admin" ON public.spare_part_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- workflow_events
CREATE POLICY "Read company workflow events" ON public.workflow_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.spare_part_requests r WHERE r.id = request_id AND (r.company_id = public.current_company() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Insert workflow events" ON public.workflow_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.spare_part_requests r WHERE r.id = request_id AND (r.company_id = public.current_company() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))));

-- notifications
CREATE POLICY "Read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- =========================
-- TRIGGERS
-- =========================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_assets_touch BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_faults_touch BEFORE UPDATE ON public.fault_reports FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_parts_touch BEFORE UPDATE ON public.spare_part_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile + technician role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'technician');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Log workflow stage changes
CREATE OR REPLACE FUNCTION public.log_workflow_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.workflow_events (request_id, stage, changed_by)
    VALUES (NEW.id, NEW.stage, auth.uid());
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (NEW.requested_by, 'Spare part request updated',
            'Stage changed to ' || NEW.stage::text || ' for ' || NEW.part_name,
            '/parts/' || NEW.id::text);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_log_workflow AFTER UPDATE ON public.spare_part_requests
FOR EACH ROW EXECUTE FUNCTION public.log_workflow_change();

-- Seed categories
INSERT INTO public.asset_categories (name, icon) VALUES
  ('Generator','zap'),
  ('Pump','droplets'),
  ('Printer','printer'),
  ('Compressor','wind'),
  ('Conveyor','move-horizontal'),
  ('CNC Machine','cog'),
  ('Boiler','flame'),
  ('HVAC','thermometer')
ON CONFLICT DO NOTHING;
