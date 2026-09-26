export type QuestionType = 'single' | 'multi' | 'boolean' | 'fill' | 'scenario' | 'code'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface QuestionOption {
  id: string
  label: string
}

export interface BaseQuestion {
  id: string
  type: QuestionType
  prompt: string
  explanation: string
  sourceNote: string
  sourceAnchor?: string
  tags?: string[]
  difficulty?: Difficulty
}

export interface SingleQuestion extends BaseQuestion {
  type: 'single'
  options: QuestionOption[]
  answer: string
}

export interface MultiQuestion extends BaseQuestion {
  type: 'multi'
  options: QuestionOption[]
  answer: string[]
}

export interface BooleanQuestion extends BaseQuestion {
  type: 'boolean'
  answer: boolean
}

export interface FillQuestion extends BaseQuestion {
  type: 'fill'
  answer: string[]
  caseSensitive?: boolean
  placeholder?: string
}

export interface ScenarioQuestion extends BaseQuestion {
  type: 'scenario'
  context: string
  options: QuestionOption[]
  answer: string
}

export interface CodeQuestion extends BaseQuestion {
  type: 'code'
  language: string
  starter?: string
  answer: string[]
  match: 'normalize_whitespace'
  runner: 'string'
}

export type Question =
  | SingleQuestion
  | MultiQuestion
  | BooleanQuestion
  | FillQuestion
  | ScenarioQuestion
  | CodeQuestion

export interface UnitLesson {
  markdown: string
}

export interface Unit {
  id: string
  moduleId: string
  title: string
  order: number
  summary: string
  sourceNote: string
  tags: string[]
  difficulty: Difficulty
  lesson: UnitLesson
  questions: Question[]
}

export interface CurriculumModule {
  id: string
  title: string
  order: number
  unitIds: string[]
  emoji?: string
  blurb?: string
}

export interface Curriculum {
  title: string
  subtitle?: string
  modules: CurriculumModule[]
}

export type UserAnswer =
  | string
  | string[]
  | boolean
  | null

export interface GradeResult {
  correct: boolean
  expected: UserAnswer
  explanation: string
}

export interface QuestionAttempt {
  questionId: string
  unitId: string
  correct: boolean
  answer: UserAnswer
  at: string
}

export interface UnitProgress {
  unitId: string
  attempts: number
  bestScore: number
  bestTotal: number
  completed: boolean
  lastAttemptAt?: string
  wrongQuestionIds: string[]
}

export interface ModuleCertificate {
  moduleId: string
  name: string
  serial: string
  completedAt: string
}

export interface ProgressState {
  unitProgress: Record<string, UnitProgress>
  wrongBook: QuestionAttempt[]
  certificates: Record<string, ModuleCertificate>
  learnerName: string
}
