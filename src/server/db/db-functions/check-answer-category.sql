CREATE OR REPLACE FUNCTION check_answer_category () RETURNS TRIGGER AS $$
DECLARE
  question_category TEXT;
BEGIN
  RAISE NOTICE 'NEW NEW NEW New question_id: %', NEW.question_id;

  SELECT "category" INTO question_category FROM "record-club_question" WHERE "id" = NEW.question_id;

  RAISE NOTICE 'Selected question_category: %', question_category;

  IF question_category = 'short-answer'  THEN
    IF NEW.answer_short_text IS NULL THEN
      RAISE EXCEPTION 'Answer short text cannot be null for short-answer questions.';
    END IF;
  ELSIF question_category = 'long-answer' THEN
    IF NEW.answer_long_text IS NULL THEN
      RAISE EXCEPTION 'Answer long text cannot be null for long-answer questions.';
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
    RAISE EXCEPTION 'Unknown question category: %, %', question_category, NEW.question_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER validate_answer BEFORE INSERT
OR
UPDATE ON "record-club_answer" FOR EACH ROW
EXECUTE FUNCTION check_answer_category ();