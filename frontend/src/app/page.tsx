"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MessageCircle, Lightbulb, BookOpen, Sparkles, ArrowRight } from "lucide-react"
import InfiniteScroll from "@/components/InfiniteScroll"

export default function LandingPage() {
  const characters = [
    { name: "Socrates", era: "Philosophy", image: "/socrates.png" },
    { name: "Einstein", era: "Modern Physics", image: "/einstein-scientist.png" },
    { name: "Muhammad Ali", era: "Sports", image: "/ali.png" },
    { name: "Batman", era: "Comics", image: "/batman-superhero.png" },
    { name: "Gordon Ramsay", era: "Culinary", image: "/gordon-ramsay-chef.png" },
    { name: "Light Yagami", era: "Anime", image: "/light.png" },
    { name: "Winston Churchill", era: "Politics", image: "/churchill-leader.png" },
    { name: "Mahatma Gandhi", era: "Activism", image: "/gandhi-peaceful-leader.png" },
    { name: "Peter Griffin", era: "Animation", image: "/peter.png" },
    { name: "Nikola Tesla", era: "Innovation", image: "/tesla.png" },
    { name: "Steve Jobs", era: "Technology", image: "/jobs.png" },
    { name: "Vincent van Gogh", era: "Art", image: "/vangogh.png" },
  ]

  // Create infinite scroll items from characters
  const infiniteScrollItems = characters.map((character, index) => ({
    content: (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
        <img
          src={character.image || "/placeholder.svg"}
          alt={character.name}
          className="w-24 h-24 rounded-full mb-4 object-cover border-3 border-slate-500 shadow-lg"
        />
        <h3 className="font-bold text-white text-lg mb-2 leading-tight">{character.name}</h3>
        <p className="text-slate-300 text-sm font-medium">{character.era}</p>
      </div>
    )
  }))

  const useCases = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Educational Exploration",
      description: "Philosophy student debates justice theories with Kant, Mill, and Rawls",
      example: "Gain multiple perspectives for your academic papers",
    },
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: "Personal Reflection",
      description: "Process life decisions with Marcus Aurelius, Alexander the Great, and Eikichi Onizuka",
      example: "Explore different frameworks for handling failure and building resilience",
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Roast Sessions & Comebacks",
      description: "Get roasted by Gordon Ramsay, Deadpool, and The Joker, then learn comebacks from Tyrion Lannister",
      example: "Build thicker skin through legendary insult masters and witty retorts",
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "Reality Check Councils",
      description: "Present your dating problems to Cleopatra, Barney Stinson, and Jane Austen",
      example: "Ancient seduction mastery meets modern pickup culture and romantic literature",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-slate-900" />
              </div>
              <span className="text-xl font-bold text-white">CouncilChamber</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 bg-transparent"
                onClick={() => (window.location.href = "/debate")}
              >
                View Demo
              </Button>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge className="mb-6 bg-amber-400/10 text-amber-400 border-amber-400/20">
              Character Debate Simulator
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
              Debate with
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                {" "}
                History's Greatest Minds
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Create custom debate councils with any characters—from Socrates to Batman, Einstein to Gordon Ramsay.
              Engage in authentic philosophical discussions where you're not just watching, but actively participating
              alongside history's most fascinating personalities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 hover:from-amber-500 hover:to-amber-700 text-lg px-8 py-3"
                onClick={() => (window.location.href = "/debate")}
              >
                Start Your First Debate
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8 py-3 bg-transparent"
                onClick={() => (window.location.href = "/debate")}
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Character Avatars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 opacity-20">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
          </div>
          <div className="absolute top-40 right-20 opacity-20">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600"></div>
          </div>
          <div className="absolute bottom-40 left-20 opacity-20">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600"></div>
          </div>
        </div>
      </section>

      {/* Character Showcase with Infinite Scroll */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Choose Your Council</h2>
            <p className="text-slate-300 text-lg">Select 2-6 characters from an unlimited pool of personalities</p>
          </div>
          
          {/* Infinite Scroll Container */}
          <div className="flex justify-center">
            <div className="w-full max-w-7xl h-[500px] relative">
              <InfiniteScroll
                items={infiniteScrollItems}
                width="100%"
                itemMinHeight={280}
                isTilted={true}
                tiltDirection="left"
                autoplay={true}
                autoplaySpeed={0.5}
                autoplayDirection="left"
                pauseOnHover={true}
                negativeMargin="-1.5em"
                maxHeight="100%"
              />
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-slate-400">+ Thousands more characters available</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-300 text-lg">Three simple steps to start your intellectual journey</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-slate-900">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Select Characters</h3>
              <p className="text-slate-300">Choose 2-6 personalities from history, fiction, or pop culture</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-slate-900">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Set the Topic</h3>
              <p className="text-slate-300">Define your debate question or philosophical inquiry</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-slate-900">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Join the Debate</h3>
              <p className="text-slate-300">Participate actively as each character maintains their authentic voice</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Endless Possibilities</h2>
            <p className="text-slate-300 text-lg">From academic research to creative entertainment</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/70 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                      {useCase.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{useCase.title}</h3>
                      <p className="text-slate-300 mb-2">{useCase.description}</p>
                      <p className="text-amber-400 text-sm italic">{useCase.example}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Example Debate Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">See It In Action</h2>
            <p className="text-slate-300 text-lg">A glimpse into a debate on "The Nature of Leadership"</p>
          </div>
          <Card className="bg-slate-800/80 border-slate-600">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <img src="/churchill-leader.png" alt="Churchill" className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-white">Winston Churchill</span>
                      <Badge variant="outline" className="text-xs">
                        Historical
                      </Badge>
                    </div>
                    <p className="text-slate-300">
                      "Leadership is the capacity to translate vision into reality. In my experience, true leaders must
                      be willing to make the hard decisions that others cannot."
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <img src="/gandhi-peaceful-leader.png" alt="Gandhi" className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-white">Mahatma Gandhi</span>
                      <Badge variant="outline" className="text-xs">
                        Historical
                      </Badge>
                    </div>
                    <p className="text-slate-300">
                      "I must respectfully disagree, Winston. True leadership lies not in making hard decisions for
                      others, but in inspiring them to find the strength within themselves."
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <span className="text-slate-900 font-bold text-sm">You</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-white">Your Response</span>
                      <Badge variant="outline" className="text-xs">
                        Participant
                      </Badge>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-3">
                      <p className="text-slate-300 italic">
                        What if leadership requires both? The vision to inspire and the courage to act when inspiration
                        alone isn't enough?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-amber-400/10 to-amber-600/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Join the Greatest Conversations in History?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Whether you're exploring philosophy, testing ideas, or just curious about how Einstein would react to modern
            memes—your council awaits.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 hover:from-amber-500 hover:to-amber-700 text-xl px-12 py-4"
            onClick={() => (window.location.href = "/debate")}
          >
            Create Your First Council
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
          <p className="text-slate-400 mt-4">Free to start • No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-slate-900" />
              </div>
              <span className="text-xl font-bold text-white">CouncilChamber</span>
            </div>
            <div className="flex space-x-6 text-slate-400">
              <a href="#" className="hover:text-white transition-colors">
                About
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700 text-center text-slate-400">
            <p>&copy; 2024 CouncilChamber. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}