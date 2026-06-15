import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const prompts: Record<string, (notes: string) => string> = {
  quiz: (notes) =>
    `You are a quiz generator. Based on the following lecture notes, generate 3 multiple-choice quiz questions. Each question must have exactly 4 options and one correct answer.

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": "Option A"
    }
  ]
}

Lecture notes:
${notes}`,

  polls: (notes) =>
    `You are a poll generator for classroom engagement. Based on the following lecture notes, generate 2 discussion or prediction poll questions. Each poll must have exactly 4 options (no correct answer — these are opinion/discussion polls).

Return ONLY valid JSON in this exact format:
{
  "polls": [
    {
      "question": "Poll question here?",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    }
  ]
}

Lecture notes:
${notes}`,

  summary: (notes) =>
    `You are a teaching assistant. Based on the following lecture notes, write a short session summary (2-3 sentences) highlighting the key concepts covered and a recommended follow-up action for the instructor.

Return ONLY valid JSON in this exact format:
{
  "summary": "Summary text here.",
  "recommendation": "Recommendation text here."
}

Lecture notes:
${notes}`,

  trends: (notes) =>
    `You are an educational analyst. Based on the following lecture notes, suggest 3 follow-up poll or activity ideas that would help reinforce the material and identify gaps in student understanding.

Return ONLY valid JSON in this exact format:
{
  "trend": "Brief observation about likely student understanding.",
  "ideas": ["Idea 1", "Idea 2", "Idea 3"]
}

Lecture notes:
${notes}`,
}

export async function POST(req: NextRequest) {
  const { notes, mode } = await req.json()

  if (!notes?.trim()) {
    return NextResponse.json({ error: 'No notes provided' }, { status: 400 })
  }

  if (!prompts[mode]) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompts[mode](notes) }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0].message.content ?? '{}'
  return NextResponse.json(JSON.parse(content))
}
