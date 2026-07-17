INSERT OR IGNORE INTO recipes VALUES
('1','Creamy Tuscan Chicken','Golden chicken in a silky sun-dried tomato and spinach sauce.','@themoderncook','Instagram','https://instagram.com/reel/demo','https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',10,28,4,'Italian','Easy','["High protein","Dinner","One pan"]','[{"name":"Chicken breast","quantity":"500 g"},{"name":"Spinach","quantity":"2 cups"},{"name":"Heavy cream","quantity":"1 cup"},{"name":"Sun-dried tomatoes","quantity":"½ cup"},{"name":"Garlic","quantity":"4 cloves"},{"name":"Parmesan","quantity":"½ cup"}]','["Season the chicken.","Sear for 5–6 minutes per side.","Make the cream sauce.","Return chicken and simmer."]','{"calories":486,"protein":42,"carbs":16,"fat":28,"estimated":true}',1,0.94,'[]',datetime('now')),
('2','Miso Butter Noodles','Glossy, savory noodles with a comforting miso butter sauce.','@halfbakedharvest','TikTok','https://tiktok.com/demo','https://images.unsplash.com/photo-1569718212165-3a8278d5f624',5,15,2,'Asian','Easy','["Quick","Vegetarian","Under 20 min"]','[{"name":"Noodles","quantity":"200 g"},{"name":"White miso","quantity":"2 tbsp"},{"name":"Butter","quantity":"2 tbsp"},{"name":"Soy sauce","quantity":"1 tbsp"},{"name":"Spring onion","quantity":"2"}]','["Cook noodles.","Whisk the sauce.","Toss together.","Finish with spring onion."]','{"calories":410,"protein":13,"carbs":61,"fat":14,"estimated":true}',1,0.97,'[]',datetime('now')),
('3','Paneer Tikka Bowl','Smoky paneer and vegetables over fragrant rice.','@spiceandtwice','Instagram','https://instagram.com/reel/paneer','https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8',15,25,2,'Indian','Easy','["Vegetarian","Meal prep","High protein"]','[{"name":"Paneer","quantity":"250 g"},{"name":"Yogurt","quantity":"¾ cup"},{"name":"Basmati rice","quantity":"1 cup"},{"name":"Capsicum","quantity":"1"},{"name":"Red onion","quantity":"1"}]','["Marinate paneer.","Roast until charred.","Make mint yogurt.","Assemble the bowl."]','{"calories":520,"protein":29,"carbs":56,"fat":22,"estimated":true}',0,0.91,'["Spice quantity was inferred from the caption."]',datetime('now'));

INSERT OR IGNORE INTO pantry_items (id,name,quantity,unit,expiry,available,created_at) VALUES
('p1','Chicken breast',500,'g',NULL,1,datetime('now')),
('p2','Spinach',1,'bunch','2026-07-18',1,datetime('now')),
('p3','Heavy cream',1,'cup',NULL,1,datetime('now')),
('p4','Garlic',2,'bulbs',NULL,1,datetime('now')),
('p5','Parmesan',150,'g',NULL,1,datetime('now')),
('p6','Noodles',400,'g',NULL,1,datetime('now')),
('p7','White miso',1,'jar',NULL,1,datetime('now')),
('p8','Butter',200,'g',NULL,1,datetime('now')),
('p9','Soy sauce',1,'bottle',NULL,1,datetime('now')),
('p10','Spring onion',4,'stalks',NULL,1,datetime('now')),
('p11','Paneer',250,'g',NULL,1,datetime('now')),
('p12','Yogurt',500,'g',NULL,1,datetime('now')),
('p13','Basmati rice',1,'kg',NULL,1,datetime('now')),
('p14','Red onion',3,'items',NULL,1,datetime('now'));
