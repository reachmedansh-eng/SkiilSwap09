-- Create skill_listings table
CREATE TABLE public.skill_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_offered TEXT NOT NULL,
  skill_wanted TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'matched')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exchanges table
CREATE TABLE public.exchanges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.skill_listings(id) ON DELETE SET NULL,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_sessions INTEGER DEFAULT 5,
  completed_sessions INTEGER DEFAULT 0,
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.skill_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skill_listings
CREATE POLICY "Listings are viewable by everyone"
ON public.skill_listings FOR SELECT
USING (true);

CREATE POLICY "Users can create own listings"
ON public.skill_listings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
ON public.skill_listings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings"
ON public.skill_listings FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for exchanges
CREATE POLICY "Users can view exchanges they're part of"
ON public.exchanges FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = provider_id);

CREATE POLICY "Users can create exchanges"
ON public.exchanges FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Exchange participants can update"
ON public.exchanges FOR UPDATE
USING (auth.uid() = requester_id OR auth.uid() = provider_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_skill_listings_updated_at
BEFORE UPDATE ON public.skill_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exchanges_updated_at
BEFORE UPDATE ON public.exchanges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.skill_listings (user_id, skill_offered, skill_wanted, category, description) 
SELECT 
  id,
  'UI/UX Design',
  'Photography',
  'Design',
  'Experienced designer offering mentorship in exchange for photography lessons'
FROM public.profiles
LIMIT 1;