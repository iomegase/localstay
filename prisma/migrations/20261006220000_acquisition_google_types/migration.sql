-- Spec 073 : acquisition guidée par les types Google (additive + valeurs par défaut).
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "google_types" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SubCategory" ADD COLUMN IF NOT EXISTS "google_types" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PoiAcquisitionCandidate" ADD COLUMN IF NOT EXISTS "primary_type" TEXT;
ALTER TABLE "PoiAcquisitionCandidate" ADD COLUMN IF NOT EXISTS "type_match" TEXT;

-- Valeurs par défaut (BR-04), seulement si aucune valeur n'a encore été saisie.
UPDATE "Category" SET "google_types" = ARRAY['restaurant','*_restaurant','bistro']::TEXT[] WHERE "slug" = 'diner' AND cardinality("google_types") = 0;
UPDATE "Category" SET "google_types" = ARRAY['cafe','coffee_shop','tea_house','bakery','pastry_shop','breakfast_restaurant','brunch_restaurant']::TEXT[] WHERE "slug" = 'cafes' AND cardinality("google_types") = 0;
UPDATE "Category" SET "google_types" = ARRAY['bar','wine_bar','pub','lounge_bar','cocktail_bar']::TEXT[] WHERE "slug" = 'bars' AND cardinality("google_types") = 0;
UPDATE "Category" SET "google_types" = ARRAY['spa','massage','sauna']::TEXT[] WHERE "slug" = 'soin' AND cardinality("google_types") = 0;
UPDATE "Category" SET "google_types" = ARRAY['store','clothing_store','gift_shop','grocery_store','food_store','market','book_store','sporting_goods_store']::TEXT[] WHERE "slug" = 'shopping' AND cardinality("google_types") = 0;
UPDATE "Category" SET "google_types" = ARRAY['museum','art_gallery','historical_landmark','church','library']::TEXT[] WHERE "slug" = 'culture' AND cardinality("google_types") = 0;
UPDATE "Category" SET "google_types" = ARRAY['tourist_attraction','amusement_center','bowling_alley','ski_resort','swimming_pool','movie_theater']::TEXT[] WHERE "slug" = 'loisirs' AND cardinality("google_types") = 0;
UPDATE "Category" SET "google_types" = ARRAY['taxi_stand','parking','train_station','bus_station','car_rental']::TEXT[] WHERE "slug" = 'mobilite' AND cardinality("google_types") = 0;
UPDATE "Category" SET "google_types" = ARRAY['playground','park','amusement_park','zoo','swimming_pool']::TEXT[] WHERE "slug" = 'famille' AND cardinality("google_types") = 0;
UPDATE "Category" SET "google_types" = ARRAY['pharmacy','doctor','hospital','veterinary_care']::TEXT[] WHERE "slug" = 'urgences' AND cardinality("google_types") = 0;
UPDATE "SubCategory" SET "google_types" = ARRAY['breakfast_restaurant','brunch_restaurant','bakery']::TEXT[] WHERE "slug" = 'petit-dejeuner' AND cardinality("google_types") = 0;
UPDATE "SubCategory" SET "google_types" = ARRAY['cafe','coffee_shop']::TEXT[] WHERE "slug" = 'cafe' AND cardinality("google_types") = 0;
UPDATE "SubCategory" SET "google_types" = ARRAY['tea_house','pastry_shop']::TEXT[] WHERE "slug" = 'salon-de-the' AND cardinality("google_types") = 0;
UPDATE "SubCategory" SET "google_types" = ARRAY['sporting_goods_store']::TEXT[] WHERE "slug" = 'location-de-ski' AND cardinality("google_types") = 0;
UPDATE "SubCategory" SET "google_types" = ARRAY['gift_shop']::TEXT[] WHERE "slug" = 'souvenirs' AND cardinality("google_types") = 0;
UPDATE "SubCategory" SET "google_types" = ARRAY['grocery_store','food_store','market']::TEXT[] WHERE "slug" = 'produits-regionaux' AND cardinality("google_types") = 0;
UPDATE "SubCategory" SET "google_types" = ARRAY['pharmacy']::TEXT[] WHERE "slug" = 'pharmacie' AND cardinality("google_types") = 0;
UPDATE "SubCategory" SET "google_types" = ARRAY['doctor']::TEXT[] WHERE "slug" = 'medecin' AND cardinality("google_types") = 0;
UPDATE "SubCategory" SET "google_types" = ARRAY['veterinary_care']::TEXT[] WHERE "slug" = 'veterinaire' AND cardinality("google_types") = 0;
