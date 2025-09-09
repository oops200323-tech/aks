export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      surveys: {
        Row: {
          id: string
          user_id: string
          name: string
          status: 'draft' | 'published'
          settings: {
            npsQuestion: string
            npsExplanation: string
            feedbackQuestion: string
            feedbackExplanation: string
            startLabel: string
            endLabel: string
            colors: {
              detractors: string
              passives: string
              promoters: string
            }
            colorPalette: 'plain' | 'multicolor'
            maxLength: number
            backButtonText: string
            continueButtonText: string
            skipButtonText: string
            thankYouTitle: string
            thankYouDescription: string
            autoFadeOut: boolean
            fadeOutDelay: number
            roundedCorners: boolean
            highlightBorder: boolean
            progressBar: boolean
            closeButton: boolean
            isMandatory: boolean
            feedbackType: 'text' | 'predefined' | 'multiple_choice'
            predefinedOptions: {
              detractors: string[]
              passives: string[]
              promoters: string[]
            }
            multipleChoiceOptions: string[]
            selectorType: 'zero-to-ten' | 'one-to-five' | 'three-emoji' | 'five-emoji'
          }
          responses: number
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          status: 'draft' | 'published'
          settings?: Json | null
          responses?: number
          score?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          status?: 'draft' | 'published'
          settings?: Json | null
          responses?: number
          score?: number
          created_at?: string
        }
      }
      survey_responses: {
        Row: {
          id: string
          survey_id: string
          score: number
          feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          survey_id: string
          score: number
          feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          survey_id?: string
          score?: number
          feedback?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_survey_stats: {
        Args: {
          p_survey_id: string
          new_score: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}