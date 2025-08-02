'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw } from 'lucide-react'

interface SimpleCaptchaProps {
  onVerify: (isValid: boolean) => void
  isDisabled?: boolean
}

export default function SimpleCaptcha({ onVerify, isDisabled = false }: SimpleCaptchaProps) {
  const [challenge, setChallenge] = useState({ question: '', answer: '' })
  const [userAnswer, setUserAnswer] = useState('')
  const [error, setError] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const generateChallenge = () => {
    const challenges = [
      { question: 'What is 5 + 3?', answer: '8' },
      { question: 'What is 10 - 4?', answer: '6' },
      { question: 'What is 3 × 2?', answer: '6' },
      { question: 'What is 12 ÷ 3?', answer: '4' },
      { question: 'What is the first letter of "Wedding"?', answer: 'W' },
      { question: 'What is the last letter of "Love"?', answer: 'e' },
      { question: 'How many letters in "RSVP"?', answer: '4' },
      { question: 'Type the word: LOVE', answer: 'LOVE' },
      { question: 'What color is the sky? (blue)', answer: 'blue' },
      { question: 'Complete: Black and ___ (white)', answer: 'white' },
    ]
    
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)]
    setChallenge(randomChallenge)
    setUserAnswer('')
    setError(false)
  }

  useEffect(() => {
    generateChallenge()
  }, [])

  const handleVerify = () => {
    const isCorrect = userAnswer.trim().toLowerCase() === challenge.answer.toLowerCase()
    
    if (isCorrect) {
      setError(false)
      onVerify(true)
    } else {
      setError(true)
      setAttempts(prev => prev + 1)
      setUserAnswer('')
      
      // Generate new challenge after failed attempt
      setTimeout(() => {
        generateChallenge()
      }, 1500)
      
      onVerify(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDisabled) {
      handleVerify()
    }
  }

  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="captcha" className="text-base font-medium">
              Security Verification
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={generateChallenge}
              disabled={isDisabled}
              className="h-8 w-8 p-0"
              title="Generate new challenge"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 select-none">
            <p className="text-lg font-medium text-center">{challenge.question}</p>
          </div>
          
          <div className="space-y-2">
            <Input
              id="captcha"
              type="text"
              placeholder="Your answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isDisabled}
              className={error ? 'border-red-500' : ''}
              autoComplete="off"
            />
            {error && (
              <p className="text-sm text-red-500">
                Incorrect answer. Please try again.
                {attempts >= 3 && ' Need help? Contact the couple.'}
              </p>
            )}
          </div>
          
          <Button
            type="button"
            onClick={handleVerify}
            disabled={isDisabled || !userAnswer.trim()}
            className="w-full"
          >
            Verify
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}