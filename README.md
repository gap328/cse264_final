PlatePlan

OVERVIEW
PlatePlan simplifies healthy eating by:
- Letting users choose their diet preferences
- Generating a full weekly meal plan using real recipe data
- Saving ingredients into a relational database
- Allowing single-meal replacements
- Automatically generating a full shopping list
The app is authenticated with session-based login and stores all information per user

FEATURES
User Authentication
- Signup
- Login
- Session tracking with express-session
- Sessions stored in PostgreSQL

Users Preferences:
- Diet type
- Allergies/intolerances
- Calorie target
- Meals per day
Preferences are used to directly generate meal plans

WEEKLY MEAL PLANS
- Users can replace a single meal
- Replacement will adhere to diet/allergy preferences
- Newly fetched recipe is stored in the database

SMART SHOPPING LIST
- Aggregates ingredients from all meals in the plan
- Combines duplicate ingredients
- Returns a clean, sorted, detailed shopping list

FRONTEND UI
- React + Material UI
- Organized navigation system(Login, Preferences, Dashboard, Shopping list)

TECH STACK
Frontend
- React
- React Router
- Material UI
- Fetch API
Backend
- Node.js
- Express.js
- express-session
- connect-pg-simple
- pg(PostgreSQL client)
Database
- PostgreSQL
Key tables:
- users
- preferences
- recipes
- ingredients
- recipe_ingredients
- meal_plans
- meal_plan_items
- shopping_list_items
External API
- Spoonacular API

INSTALLATION & SETUP
1. Clone the repo: git clone https://github.com/gap328/cse264_final.git
cd cse264_final
2. cd server 
npm install
node app.js
3. cd client
npm install
npm start
Runs at http://localhost:3000/

API ENDPOINTS
Auth
- POST /api/users/signup
- POST /api/users/login
- POST /api.users/logout
Meal Plans
- POST /api/mealplan/generate
- GET /api/mealplan/:userId
- PUT /api/mealplan/item/:itemId
- DELETE /api/mealplan/:planId
Shopping List
- GET /api/shoppinglist/:planId

Future Improvements
- Save multiple weekly plans
- Individual meal nutrition breakdowns
- Drag and drop meal reaaranging

Team Members
Matt: Backend Engineer + Database Architect + Full-Stack Integrator
Marc: Frontend Engineer + UI/UX Developer
Gabe: API Developer / Backend Route Engineer

