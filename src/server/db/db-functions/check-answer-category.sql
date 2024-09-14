CREATE OR REPLACE FUNCTION check_answer_category () RETURNS TRIGGER AS $$
DECLARE
  question_category TEXT;
BEGIN
  SELECT category INTO question_category FROM "record-club_question" WHERE id = NEW.question_id;

  IF question_category = 'short-answer' OR question_category = 'long-answer' THEN
    IF NEW.answer_text IS NULL THEN
      RAISE EXCEPTION 'Answer text cannot be null for text questions.';
    END IF;
  ELSIF question_category = 'true-false' THEN
    IF NEW.answer_boolean IS NULL THEN
      RAISE EXCEPTION 'Answer boolean cannot be null for true-false questions.';
    END IF;
  ELSIF question_category = 'number' THEN
    IF NEW.answer_number IS NULL THEN
      RAISE EXCEPTION 'Answer number cannot be null for number questions.';
    END IF;
  ELSIF question_category = 'color-picker' THEN
    IF NEW.answer_color IS NULL THEN
      RAISE EXCEPTION 'Answer color cannot be null for color-picker questions.';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unknown question category.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_answer BEFORE INSERT
OR
UPDATE ON "record-club_answer" FOR EACH ROW
EXECUTE FUNCTION check_answer_category ();