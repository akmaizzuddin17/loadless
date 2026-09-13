BEGIN;
CREATE TABLE IF NOT EXISTS public.profiles (
 id text PRIMARY KEY, name text NOT NULL CHECK(length(name) BETWEEN 2 AND 50),
 username text UNIQUE NOT NULL CHECK(username ~ '^[a-z0-9_]{3,24}$'), created bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS public.posts (
 rowid bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 id text PRIMARY KEY, author text NOT NULL REFERENCES public.profiles(id),
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 2000), category text NOT NULL,
 photo text, created bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS public.likes (
 post text REFERENCES public.posts(id) ON DELETE CASCADE,
 "user" text REFERENCES public.profiles(id), PRIMARY KEY(post,"user")
);
CREATE TABLE IF NOT EXISTS public.comments (
 id text PRIMARY KEY, post text NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
 author text NOT NULL REFERENCES public.profiles(id), body text NOT NULL CHECK(length(body) BETWEEN 1 AND 500), created bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS public.follows (
 "user" text REFERENCES public.profiles(id), target text REFERENCES public.profiles(id),
 accepted integer NOT NULL DEFAULT 0 CHECK(accepted IN(0,1)), PRIMARY KEY("user",target), CHECK("user"<>target)
);
CREATE TABLE IF NOT EXISTS public.availability (
 id text PRIMARY KEY, "user" text NOT NULL REFERENCES public.profiles(id), start bigint NOT NULL, "end" bigint NOT NULL CHECK("end">start)
);
CREATE TABLE IF NOT EXISTS public.planner_state (
 "user" text PRIMARY KEY REFERENCES public.profiles(id), data text NOT NULL, revision integer NOT NULL CHECK(revision>0)
);
CREATE TABLE IF NOT EXISTS public.activity_invites (
 id text PRIMARY KEY, sender text NOT NULL REFERENCES public.profiles(id), recipient text NOT NULL REFERENCES public.profiles(id),
 slot text NOT NULL, activity text NOT NULL CHECK(activity IN('Movies','Walk','Study','Meal','Hangout')),
 start bigint NOT NULL, "end" bigint NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','accepted','declined','cancelled'))
);
CREATE INDEX IF NOT EXISTS posts_created ON public.posts(created);
CREATE INDEX IF NOT EXISTS comments_post ON public.comments(post,created);
CREATE INDEX IF NOT EXISTS availability_user_start ON public.availability("user",start);
CREATE INDEX IF NOT EXISTS invites_recipient ON public.activity_invites(recipient,start);
CREATE INDEX IF NOT EXISTS invites_sender ON public.activity_invites(sender,start);
-- Application tables are accessible only through the authenticated server API.
-- No anonymous or direct browser access, including to private plans and availability.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles,public.posts,public.likes,public.comments,public.follows,public.availability,public.planner_state,public.activity_invites FROM anon, authenticated;
COMMIT;
