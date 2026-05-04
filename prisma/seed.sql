INSERT INTO categories (id, slug, name, emoji, description, "isPublic", status, "createdAt", "updatedAt", "authorId")
VALUES
  ('cat_travel', 'travel-destinations', 'Travel Destinations', '✈️', 'The world''s most iconic places to visit.', true, 'ACTIVE', now(), now(), null),
  ('cat_food',   'foods',               'Foods',               '🍽️', 'The greatest dishes on the planet.',         true, 'ACTIVE', now(), now(), null),
  ('cat_movies', 'movie-genres',        'Movie Genres',        '🎬', 'Pick your favourite type of film.',         true, 'ACTIVE', now(), now(), null)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO items (id, name, emoji, color, description, "createdAt", "categoryId")
VALUES
  -- Travel Destinations
  ('itm_t1', 'Tokyo',     '🗼', '#6366F1', 'Electric streets, ramen at 3am, endless exploration.',                    now(), 'cat_travel'),
  ('itm_t2', 'Paris',     '🗺️', '#EC4899', 'Golden light, croissants, the world''s most romantic boulevards.',        now(), 'cat_travel'),
  ('itm_t3', 'New York',  '🗽', '#F59E0B', 'The city that never sleeps — raw, alive, overwhelming.',                  now(), 'cat_travel'),
  ('itm_t4', 'Kyoto',     '⛩️', '#10B981', 'Bamboo groves, ancient temples, lantern-lit evenings.',                   now(), 'cat_travel'),
  ('itm_t5', 'Barcelona', '🏛️', '#F97316', 'Gaudí''s dreamscapes, tapas in the sun, sea breezes.',                   now(), 'cat_travel'),
  ('itm_t6', 'Lisbon',    '🎭', '#8B5CF6', 'Fado echoes on cobblestones, pastel façades, salt air.',                  now(), 'cat_travel'),
  ('itm_t7', 'Sydney',    '🦘', '#06B6D4', 'Harbour sunsets, great whites, and a relaxed roar.',                      now(), 'cat_travel'),
  ('itm_t8', 'Marrakech', '🕌', '#EF4444', 'Spice markets, medina mazes, rooftop mint tea.',                         now(), 'cat_travel'),
  -- Foods
  ('itm_f1', 'Sushi',     '🍣', '#6366F1', 'Pristine fish, seasoned rice, pure umami.',                              now(), 'cat_food'),
  ('itm_f2', 'Pizza',     '🍕', '#EC4899', 'Crispy crust, molten cheese, endless variations.',                       now(), 'cat_food'),
  ('itm_f3', 'Tacos',     '🌮', '#F59E0B', 'Street-level joy in a handmade corn shell.',                             now(), 'cat_food'),
  ('itm_f4', 'Ramen',     '🍜', '#10B981', 'Twelve-hour broth, silky noodles, marbled pork.',                        now(), 'cat_food'),
  ('itm_f5', 'Croissant', '🥐', '#F97316', 'Laminated butter, shattering flakes, golden morning.',                   now(), 'cat_food'),
  ('itm_f6', 'Biryani',   '🍛', '#8B5CF6', 'Fragrant basmati, slow-cooked spice, saffron gold.',                    now(), 'cat_food'),
  ('itm_f7', 'Pho',       '🫕', '#06B6D4', 'Beef bone broth, rice noodles, fresh herbs, a Hanoi morning.',           now(), 'cat_food'),
  ('itm_f8', 'Dumplings', '🥟', '#EF4444', 'Pleated parcels of joy, steamed or fried, endlessly filling.',           now(), 'cat_food'),
  -- Movie Genres
  ('itm_m1', 'Thriller',    '🔪', '#6366F1', 'Edge-of-your-seat tension, unreliable narrators.',             now(), 'cat_movies'),
  ('itm_m2', 'Sci-Fi',      '🚀', '#EC4899', 'Vast universes, moral dilemmas, wonder and dread.',            now(), 'cat_movies'),
  ('itm_m3', 'Romance',     '💘', '#F59E0B', 'Longing glances, missed connections, tender resolution.',      now(), 'cat_movies'),
  ('itm_m4', 'Comedy',      '😂', '#10B981', 'Timing is everything. Absurdity is a gift.',                   now(), 'cat_movies'),
  ('itm_m5', 'Horror',      '👻', '#F97316', 'Jump scares are cheap. Dread is eternal.',                     now(), 'cat_movies'),
  ('itm_m6', 'Documentary', '🎥', '#8B5CF6', 'Truth is stranger and richer than fiction.',                   now(), 'cat_movies'),
  ('itm_m7', 'Action',      '💥', '#06B6D4', 'Car chases, explosions, heroes who never miss.',               now(), 'cat_movies'),
  ('itm_m8', 'Drama',       '🎭', '#EF4444', 'Quiet devastation, slow burns, characters you won''t forget.', now(), 'cat_movies')
ON CONFLICT (id) DO NOTHING;
