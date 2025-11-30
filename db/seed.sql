

DELETE FROM shopping_list_items;
DELETE FROM meal_plan_items;
DELETE FROM meal_plans;
DELETE FROM recipe_ingredients;
DELETE FROM ingredients;
DELETE FROM recipes;
DELETE FROM preferences;
DELETE FROM users;

--  USERS
INSERT INTO users (email, password_hash)
VALUES 
('testuser@example.com', 'hashed_password_123');

--  USER PREFERENCES
INSERT INTO preferences (user_id, diet_type, calorie_target, meals_per_day, allergies)
VALUES 
(1, 'High Protein', 2200, 3, 'Peanuts');

--  RECIPES
INSERT INTO recipes (title, image_url, source, calories, diet_type)
VALUES
('Chicken Stir Fry', 'https://example.com/stirfry.jpg', 'local', 500, 'High Protein'),
('Avocado Toast', 'https://example.com/avocado.jpg', 'local', 350, 'Vegetarian'),
('Beef Bowl', 'https://example.com/beef.jpg', 'local', 700, 'High Protein');

--  INGREDIENTS
INSERT INTO ingredients (name, category)
VALUES
('Chicken Breast', 'Meat'),
('Soy Sauce', 'Condiments'),
('Broccoli', 'Vegetables'),
('Bread', 'Bakery'),
('Avocado', 'Produce'),
('Ground Beef', 'Meat'),
('Rice', 'Grains');

--  RECIPE INGREDIENTS (JOIN)

-- Chicken Stir Fry (recipe_id = 1)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
VALUES
(1, 1, 1.0, 'lb'),
(1, 2, 2.0, 'tbsp'),
(1, 3, 1.0, 'cup');

-- Avocado Toast (recipe_id = 2)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
VALUES
(2, 4, 2.0, 'slices'),
(2, 5, 1.0, 'whole');

-- Beef Bowl (recipe_id = 3)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
VALUES
(3, 6, 0.5, 'lb'),
(3, 7, 1.0, 'cup');

--  MEAL PLAN (one week)
INSERT INTO meal_plans (user_id, week_start_date)
VALUES 
(1, '2025-01-01');

--  MEAL PLAN ITEMS (use recipe_ids above)
INSERT INTO meal_plan_items (plan_id, day_of_week, meal_number, recipe_id)
VALUES
(1, 'Mon', 1, 1),
(1, 'Mon', 2, 2),
(1, 'Mon', 3, 3),
(1, 'Tue', 1, 2),
(1, 'Tue', 2, 1);

--  SHOPPING LIST ITEMS (merged totals)
INSERT INTO shopping_list_items (plan_id, ingredient_id, total_amount, unit)
VALUES
(1, 1, 1.0, 'lb'),   -- Chicken
(1, 2, 2.0, 'tbsp'), -- Soy sauce
(1, 3, 1.0, 'cup'),  -- Broccoli
(1, 4, 2.0, 'slices'), -- Bread
(1, 5, 1.0, 'whole'); -- Avocado


SELECT * FROM users;
SELECT * FROM recipes;
SELECT * FROM meal_plan_items;
SELECT * FROM shopping_list_items;
