export interface Education {
  institution: string
  degree: string
  field: string
  start_year: string
  end_year: string
  grade?: string
}

export interface Experience {
  company: string
  role: string
  start_date: string
  end_date: string
  current: boolean
  description: string
}

export interface Project {
  name: string
  description: string
  tech_stack: string
  github_url?: string
  live_url?: string
}

export interface Profile {
  full_name: string
  email: string
  phone: string
  location: string
  linkedin?: string
  github?: string
  education: Education[]
  experience: Experience[]
  skills: string[]
  projects: Project[]
}

export interface Resume {
  id: string
  type: 'base' | 'jd_tailored'
  s3_url: string
  ats_score: number
  match_score?: number
  created_at: string
}