CREATE TABLE users (name TEXT PRIMARY KEY);

CREATE TABLE hobbies (id SERIAL PRIMARY KEY,
                      user_name TEXT REFERENCES users,
                      hobby TEXT);

INSERT INTO users VALUES ('elie'), ('matt');

INSERT INTO hobbies (user_name, hobby) VALUES
    ('elie', 'dancing'),
    ('elie', 'javascript'),
    ('matt', 'math'),
    ('matt', 'cooking');

