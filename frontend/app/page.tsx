"use client";
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Users, 
  MessageCircle, 
  Crown, 
  Sparkles, 
  ArrowRight,
  Plus,
  X,
  Search
} from "lucide-react"

interface SelectedCharacter {
  name: string
  id: string
  colorIndex: number
}

export default function CouncilChamberLanding() {
  const [userName, setUserName] = useState("")
  const [topic, setTopic] = useState("")
  const [characterInput, setCharacterInput] = useState("")
  const [selectedCharacters, setSelectedCharacters] = useState<SelectedCharacter[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Sample character suggestions
  const characterSuggestions = [
    "Socrates", "Albert Einstein", "Marie Curie", "Leonardo da Vinci", 
    "Maya Angelou", "Nelson Mandela", "Frida Kahlo", "Winston Churchill",
    "Cleopatra", "Gandhi", "Shakespeare", "Nikola Tesla", "Rosa Parks",
    "The Joker", "Batman", "Deadpool", "Sherlock Holmes", "Tony Stark",
    "Gordon Ramsay", "Oprah Winfrey", "Steve Jobs", "Elon Musk"
  ]

  const getCharacterColors = (colorIndex: number) => {
    const colorMap = {
      1: { bg: "bg-blue-600", text: "text-white" },
      2: { bg: "bg-green-600", text: "text-white" },
      3: { bg: "bg-purple-600", text: "text-white" },
      4: { bg: "bg-red-600", text: "text-white" },
      5: { bg: "bg-indigo-600", text: "text-white" },
      6: { bg: "bg-pink-600", text: "text-white" },
      7: { bg: "bg-orange-600", text: "text-white" },
      8: { bg: "bg-teal-600", text: "text-white" },
      9: { bg: "bg-cyan-600", text: "text-white" },
    }
    return colorMap[colorIndex as keyof typeof colorMap] || colorMap[1]
  }

  const addCharacter = (name: string) => {
    if (name.trim() && selectedCharacters.length < 6 && !selectedCharacters.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      const newCharacter = {
        name: name.trim(),
        id: name.toLowerCase().replace(/\s+/g, '_'),
        colorIndex: (selectedCharacters.length % 9) + 1
      }
      setSelectedCharacters([...selectedCharacters, newCharacter])
      setCharacterInput("")
    }
  }

  const removeCharacter = (id: string) => {
    setSelectedCharacters(selectedCharacters.filter(c => c.id !== id))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCharacter(characterInput)
    }
  }

  const canStartDebate = userName.trim() && topic.trim() && selectedCharacters.length >= 2

  const handleStartDebate = async () => {
    if (!canStartDebate) return
    
    setIsLoading(true)
    
    try {
      // Import the API client dynamically to avoid SSR issues
      const { apiClient } = await import('@/lib/api')
      
      const response = await apiClient.startDebate({
        user_name: userName,
        character_names: selectedCharacters.map(c => c.name),
        topic: topic
      })
      
      console.log('Debate started successfully:', response)
      
      // Navigate to debate page with session ID
      window.location.href = `/debate/${response.session_id}`
      
    } catch (error) {
      console.error('Failed to start debate:', error)
      alert(`Failed to start debate: ${error.message}`)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-900" />
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Crown className="h-12 w-12 text-amber-500 mr-3" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                CouncilChamber
              </h1>
            </div>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Where history's greatest minds, fictional heroes, and cultural icons gather to debate.
              Create your own philosophical council and participate in authentic discussions.
            </p>
          </div>

          {/* Setup Form */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-white">
                  🏛️ Convene Your Council
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* User Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Your Name</label>
                  <Input
                    placeholder="Enter your name..."
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                {/* Topic */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Debate Topic</label>
                  <Input
                    placeholder="What should they debate? (e.g., 'The meaning of true leadership')"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                {/* Character Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      Council Members ({selectedCharacters.length}/6)
                    </label>
                    {selectedCharacters.length >= 2 && (
                      <Badge className="bg-green-600 text-white">
                        Ready to debate!
                      </Badge>
                    )}
                  </div>

                  {/* Character Input */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        placeholder="Add a character (historical, fictional, celebrity...)"
                        value={characterInput}
                        onChange={(e) => setCharacterInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                        disabled={selectedCharacters.length >= 6}
                      />
                    </div>
                    <Button
                      onClick={() => addCharacter(characterInput)}
                      disabled={!characterInput.trim() || selectedCharacters.length >= 6}
                      className="bg-amber-600 hover:bg-amber-700 text-slate-900"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Character Suggestions */}
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Quick suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {characterSuggestions.slice(0, 12).map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => addCharacter(suggestion)}
                          disabled={selectedCharacters.some(c => c.name === suggestion) || selectedCharacters.length >= 6}
                          className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-full text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Characters */}
                  {selectedCharacters.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-slate-300">Your Council:</p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedCharacters.map((character) => {
                          const colors = getCharacterColors(character.colorIndex)
                          return (
                            <div
                              key={character.id}
                              className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700 border border-slate-600"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`${colors.bg} text-white text-sm`}>
                                  {character.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm truncate">
                                  {character.name}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeCharacter(character.id)}
                                className="text-slate-400 hover:text-red-400 h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {selectedCharacters.length < 2 && (
                    <p className="text-xs text-amber-400">
                      Add at least 2 characters to start a debate
                    </p>
                  )}
                </div>

                {/* Start Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleStartDebate}
                    disabled={!canStartDebate || isLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold py-6 text-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full mr-2" />
                        Convening Council...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Crown className="h-5 w-5 mr-2" />
                        Start Debate
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Highlights */}
          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Any Character</h3>
              <p className="text-slate-400 text-sm">
                From Socrates to Batman, Einstein to The Joker - pick anyone and they'll stay true to their character.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Authentic Voices</h3>
              <p className="text-slate-400 text-sm">
                Each character maintains their unique personality, beliefs, and communication style throughout the debate.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">You Participate</h3>
              <p className="text-slate-400 text-sm">
                You're not just watching - you're an active council member, shaping the discussion with your own input.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}