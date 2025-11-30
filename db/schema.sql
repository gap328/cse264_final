
--   Smart Recipe Meal Planner

--   USERS
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

--   USER PREFERENCES
CREATE TABLE preferences (
    pref_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    diet_type VARCHAR(50),
    calorie_target INT,
    meals_per_day INT,
    allergies TEXT
);

--   RECIPES
CREATE TABLE recipes (
    recipe_id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url TEXT,
    source VARCHAR(50),
    calories INT,
    diet_type VARCHAR(50)
);

--   INGREDIENTS
CREATE TABLE ingredients (
    ingredient_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    category VARCHAR(255)
);

--   RECIPE INGREDIENTS (JOIN TABLE)
CREATE TABLE recipe_ingredients (
    recipe_id INT REFERENCES recipes(recipe_id),
    ingredient_id INT REFERENCES ingredients(ingredient_id),
    amount FLOAT,
    unit VARCHAR(50),
    PRIMARY KEY (recipe_id, ingredient_id)
);

--   MEAL PLANS (1 per week per user)
CREATE TABLE meal_plans (
    plan_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    week_start_date DATE
);

--   MEAL PLAN ITEMS (each meal inside a plan)
CREATE TABLE meal_plan_items (
    item_id SERIAL PRIMARY KEY,
    plan_id INT REFERENCES meal_plans(plan_id),
    day_of_week VARCHAR(10),
    meal_number INT,
    recipe_id INT REFERENCES recipes(recipe_id)
);

--   SHOPPING LIST ITEMS (merged ingredients)
CREATE TABLE shopping_list_items (
    list_item_id SERIAL PRIMARY KEY,
    plan_id INT REFERENCES meal_plans(plan_id),
    ingredient_id INT REFERENCES ingredients(ingredient_id),
    total_amount FLOAT,
    unit VARCHAR(50)
);
