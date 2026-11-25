// Kiểu dữ liệu cho các file JSON trong public/data.

export type Phrase = { tc: string; py: string; vn: string };

export type Word = {
  word: string;
  pinyin: string;
  ipa?: string;
  hanViet: string;
  image?: string;
  radical: string;
  explanation: string;
  compounds?: Phrase[];
  examples?: Phrase[];
  idiom?: string;
  level?: string;
};

export type Trilingual = { zh: string; py?: string; vn?: string };

export type ChoiceOption = string | { zh?: string; vn?: string };

export type ChoiceQuestion = {
  question: string | Trilingual;
  options: ChoiceOption[];
  correct: number;
};

export type ClozeQuestion = {
  sentence: string | Trilingual;
  options: ChoiceOption[];
  correct: number;
};

export type DialogueLine = {
  sp: string;
  gender: string;
  zh: string;
  py: string;
  vn: string;
};

export type Dialogue = {
  title: string;
  lesson: string;
  level?: string;
  content: DialogueLine[];
  quizzes?: ChoiceQuestion[];
  clozes?: ClozeQuestion[];
  reading?: {
    paragraph: { zh: string; py: string; vn: string };
    questions: ChoiceQuestion[];
  };
};

export type ExamOption = { label: string; text?: string; image?: string };

export type ReadingQuestion = {
  id: number;
  type: string; // "text_choice" | "image_choice"
  passage_zh?: string;
  question_image?: string;
  question_zh: string;
  question_vn?: string;
  options: ExamOption[];
  correctAnswer: string;
  explanation: string;
};

export type ReadingSection = {
  part_name: string;
  description_zh: string;
  questions: ReadingQuestion[];
};

export type ListeningQuestion = {
  id: number;
  part: number;
  audio: string;
  question_image?: string;
  options: ExamOption[];
  correctAnswer: string;
  transcript?: string;
  explanation?: string;
};

export type Exam = {
  id: string;
  title: string;
  description: string;
  reading: ReadingSection[];
  listening: ListeningQuestion[];
};

/** Một chủ đề trong public/data/topics.json: chỉ liệt kê `word` của các từ đã có trong từ điển. */
export type Topic = {
  id: string;
  name: string;
  icon: string; // tên icon lucide-react, ánh xạ trong components/topics/topic-icons.ts
  words: string[];
};
