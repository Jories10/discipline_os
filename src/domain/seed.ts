import type { Category, PersistedState, Priority, Task, Template, TemplateBlock } from './types'
import { addDays, startOfWeek } from './time'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-react', name: 'React Development', color: '#4f46e5', purpose: 'Building React projects' },
  { id: 'cat-js', name: 'JavaScript Learning', color: '#ca8a04', purpose: 'Reviewing JavaScript fundamentals' },
  { id: 'cat-ts', name: 'TypeScript Learning', color: '#0284c7', purpose: 'Studying TypeScript' },
  { id: 'cat-git', name: 'Git and GitHub', color: '#ea580c', purpose: 'Version control practice' },
  { id: 'cat-fitness', name: 'Physical Fitness', color: '#16a34a', purpose: 'Home workouts' },
  { id: 'cat-household', name: 'Household Responsibilities', color: '#78716c', purpose: 'Washing dishes and other chores' },
  { id: 'cat-ai', name: 'AI Content Creation', color: '#9333ea', purpose: 'JavaScript educational content' },
  { id: 'cat-growth', name: 'Personal Development', color: '#0d9488', purpose: 'Reading and learning' },
  { id: 'cat-journal', name: 'Journaling', color: '#db2777', purpose: 'Daily thoughts and reflections' },
  { id: 'cat-rest', name: 'Rest and Recovery', color: '#64748b', purpose: 'Breaks and relaxation' },
]

const h = (hours: number, minutes = 0) => hours * 60 + minutes

interface Block {
  title: string
  start: number
  end: number
  cat: string
  priority: Priority
  description: string
}

/** Weekday template. Wake-up is its own 15-minute block so it never overlaps morning prep. */
export const WEEKDAY_BLOCKS: Block[] = [
  { title: 'Wake up', start: h(6), end: h(6, 15), cat: 'cat-rest', priority: 'medium', description: 'Make my bed. Drink water.' },
  { title: 'Morning preparation', start: h(6, 15), end: h(7), cat: 'cat-household', priority: 'medium', description: 'Hygiene, breakfast, prepare my workspace.' },
  { title: 'React project development', start: h(7), end: h(11), cat: 'cat-react', priority: 'high', description: 'Build features, improve component architecture, debug existing projects.' },
  { title: 'Household and lunch', start: h(11), end: h(13), cat: 'cat-household', priority: 'medium', description: 'Wash dishes, prepare and eat lunch, short rest.' },
  { title: 'JavaScript fundamentals', start: h(13), end: h(14), cat: 'cat-js', priority: 'high', description: 'Active recall and coding exercises before opening the docs. Note knowledge gaps.' },
  { title: 'Break', start: h(14), end: h(14, 15), cat: 'cat-rest', priority: 'low', description: 'Walk around and rest my eyes.' },
  { title: 'TypeScript documentation', start: h(14, 15), end: h(16), cat: 'cat-ts', priority: 'high', description: 'Read the official docs, try examples, write notes, apply in React projects.' },
  { title: 'Git and GitHub', start: h(16), end: h(16, 30), cat: 'cat-git', priority: 'medium', description: 'Practice branching and commits on my React projects.' },
  { title: 'Exercise', start: h(16, 30), end: h(18), cat: 'cat-fitness', priority: 'medium', description: 'Home workout and cool down.' },
  { title: 'Dinner and personal time', start: h(18), end: h(19), cat: 'cat-rest', priority: 'low', description: 'Dinner, shower, recover.' },
  { title: 'AI educational content', start: h(19), end: h(20), cat: 'cat-ai', priority: 'medium', description: 'Create JavaScript teaching material with Google AI Studio.' },
  { title: 'Journaling and reflection', start: h(20), end: h(20, 30), cat: 'cat-journal', priority: 'medium', description: 'What I learned, mistakes, priorities for tomorrow.' },
]

export const WEEKEND_BLOCKS: Record<'sat' | 'sun', Block[]> = {
  sat: [
    { title: 'Personal project or extra React practice', start: h(9), end: h(12), cat: 'cat-react', priority: 'medium', description: 'Optional. Explore a new technology or work on a side project.' },
    { title: 'Reading', start: h(14), end: h(15), cat: 'cat-growth', priority: 'low', description: 'Optional.' },
    { title: 'Physical activity', start: h(16), end: h(17), cat: 'cat-fitness', priority: 'low', description: 'Optional.' },
  ],
  sun: [
    { title: 'Light exercise', start: h(8), end: h(9), cat: 'cat-fitness', priority: 'low', description: 'Optional.' },
    { title: 'Weekly review and planning', start: h(15), end: h(16), cat: 'cat-growth', priority: 'high', description: 'Review achievements, list unfinished tasks, plan next week, prepare the workspace.' },
  ],
}

const toTemplateBlock = (b: Block): TemplateBlock => ({
  title: b.title,
  description: b.description,
  startMin: b.start,
  endMin: b.end,
  categoryId: b.cat,
  priority: b.priority,
})

export const buildDefaultTemplates = (): Template[] => {
  const createdAt = new Date().toISOString()
  const weekday = WEEKDAY_BLOCKS.map(toTemplateBlock)
  return [
    { id: 'tpl-weekday', name: 'Standard Weekday Routine', description: 'Your Monday to Friday schedule.', scope: 'day', days: [weekday], createdAt },
    {
      id: 'tpl-week',
      name: 'Standard Week',
      description: 'Weekday routine Monday to Friday with light weekends.',
      scope: 'week',
      days: [weekday, weekday, weekday, weekday, weekday, WEEKEND_BLOCKS.sat.map(toTemplateBlock), WEEKEND_BLOCKS.sun.map(toTemplateBlock)],
      createdAt,
    },
  ]
}

const makeTask = (block: Block, date: string): Task => ({
  id: crypto.randomUUID(),
  title: block.title,
  description: block.description,
  date,
  startMin: block.start,
  endMin: block.end,
  categoryId: block.cat,
  priority: block.priority,
  completed: false,
  completedAt: null,
  actualMinutes: null,
  createdAt: new Date().toISOString(),
})

/** First-launch data: the current week only. Later weeks are created from templates (Phase 3). */
export const buildInitialState = (todayISO: string): PersistedState => {
  const monday = startOfWeek(todayISO)
  const tasks: Task[] = []
  for (let i = 0; i < 5; i++) for (const b of WEEKDAY_BLOCKS) tasks.push(makeTask(b, addDays(monday, i)))
  for (const b of WEEKEND_BLOCKS.sat) tasks.push(makeTask(b, addDays(monday, 5)))
  for (const b of WEEKEND_BLOCKS.sun) tasks.push(makeTask(b, addDays(monday, 6)))
  return { version: 2, tasks, categories: DEFAULT_CATEGORIES, templates: buildDefaultTemplates(), journal: [] }
}
