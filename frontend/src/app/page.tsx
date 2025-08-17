"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MessageCircle, Lightbulb, BookOpen, Sparkles, ArrowRight } from "lucide-react"
import InfiniteScroll from "@/components/InfiniteScroll"
import Link from "next/link";
import DarkVeil from "@/components/DarkVeil";

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
              <span className="text-xl font-bold text-white">Samvaad.AI</span>
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
      <section className="relative isolate overflow-hidden flex items-center h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 w-full h-full -z-10">
          <DarkVeil
            speed={1.5}
            noiseIntensity={0.03}
            warpAmount={0.3}
            hueShift={0.0}
          />
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge className="mb-8 bg-amber-400/10 text-amber-400 border-amber-400/20">
              Character Debate Simulator
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-20 leading-tight">
              Debates That Shouldn't Exist... 
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                {" "}
                Until Now
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-20 max-w-3xl mx-auto leading-relaxed">
              From Socrates to Snoop Dogg, Shakespeare to Shrek, Samvaad.AI throws any 2–6 characters into a live debate, keeps their authentic voices, and lets you join the chaos yourself.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/debate/new">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 hover:from-amber-500 hover:to-amber-700 text-lg px-8 py-3"
              >
                Start Your First Debate
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
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
      </section>

      {/* Character Showcase with Infinite Scroll */}
      <section className="pt-24 pb-0 px-4 sm:px-6 lg:px-8 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Choose Your Council</h2>
            <p className="text-slate-300 text-lg">Pick 2–6 personalities from history, fiction, or pop culture. Any era. Any universe.</p>
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
          
{/* 
          <div className="text-center mt-8">
            <p className="text-slate-400">+ Thousands more characters available</p>
          </div> */}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-300 text-lg">Three steps. Infinite possibilities.  </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-slate-900">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Select Characters</h3>
              <p className="text-slate-300">From Gandhi to Gandalf, choose 2–6 personalities</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-slate-900">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Set the Topic</h3>
              <p className="text-slate-300">Ask a big question, spark a feud, or throw in absurd hypotheticals</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-slate-900">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Join the Debate</h3>
              <p className="text-slate-300">You're not a spectator. You're a council member</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Endless Possibilities</h2>
            <p className="text-slate-300 text-lg">Serious, silly, or somewhere in between.</p>
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
      {/* Background Image Section */}
      <h2 className="text-3xl font-bold text-white mb-4 text-center mb-12">Food Cold. Takes Hot.</h2>
      <section className="relative w-full h-[700px] bg-[#1A2539] flex items-center justify-center">
        <img
          src="/for_esteemed_patron.png"
          alt="Last Supper with custom characters"
          className="max-w-full max-h-full object-contain"
          style={{ opacity: 0.9 }} // tweak if you want it more/less transparent
        />
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1A2539] isolate relative z-0">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Join the Greatest Conversations Ever?</h2>
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
              <span className="text-xl font-bold text-white">Samvaad.AI</span>
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
            <p>&copy; 2025 Samvaad.AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}