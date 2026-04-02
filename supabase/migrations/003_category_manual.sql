-- Track manually overridden categories so sync doesn't overwrite them
ALTER TABLE transactions ADD COLUMN category_manual BOOLEAN DEFAULT FALSE;
