DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('admin','teacher','student')),
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_number  VARCHAR(50) UNIQUE NOT NULL,
    date_of_birth   DATE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active','inactive','graduated','withdrawn'))
);

CREATE TABLE teachers (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department  VARCHAR(100),
    hire_date   DATE
);

CREATE TABLE courses (
    id          SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    credits     INTEGER DEFAULT 3,
    teacher_id  INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE enrollments (
    id          SERIAL PRIMARY KEY,
    student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    status      VARCHAR(20) DEFAULT 'active'
                CHECK (status IN ('active','completed','dropped')),
    UNIQUE (student_id, course_id)
);

CREATE TABLE attendance (
    id              SERIAL PRIMARY KEY,
    enrollment_id   INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status          VARCHAR(20) NOT NULL
                    CHECK (status IN ('present','absent','late','excused')),
    recorded_by     INTEGER REFERENCES teachers(id),
    UNIQUE (enrollment_id, attendance_date)
);

CREATE TABLE assessments (
    id              SERIAL PRIMARY KEY,
    course_id       INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    assessment_type VARCHAR(50) NOT NULL
                    CHECK (assessment_type IN ('quiz','assignment','midterm','final','project')),
    max_score       DECIMAL(5,2) NOT NULL,
    weight          DECIMAL(5,2) DEFAULT 1.0,
    due_date        DATE
);

CREATE TABLE grades (
    id            SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    score         DECIMAL(5,2),
    graded_by     INTEGER REFERENCES teachers(id),
    graded_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (assessment_id, enrollment_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course  ON enrollments(course_id);
CREATE INDEX idx_attendance_enroll   ON attendance(enrollment_id);
CREATE INDEX idx_grades_enroll       ON grades(enrollment_id);