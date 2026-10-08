"use client"

import Image from "next/image"
import { ArrowDownRight, ArrowRight, Mic2, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"

const speakers = [
  { name: "Socrates", role: "The questioner", image: "/socrates.png", accent: "bg-[#f7b538]", tape: "-rotate-2" },
  { name: "Einstein", role: "The contrarian", image: "/einstein-scientist.png", accent: "bg-[#78c7ff]", tape: "rotate-2" },
  { name: "Muhammad Ali", role: "The challenger", image: "/ali.png", accent: "bg-[#ef6a67]", tape: "-rotate-1" },
  { name: "Gordon Ramsay", role: "The instigator", image: "/gordon-ramsay-chef.png", accent: "bg-[#bbdf63]", tape: "rotate-1" },
  { name: "Light Yagami", role: "The strategist", image: "/light.png", accent: "bg-[#c4a6ff]", tape: "-rotate-2" },
  { name: "Vincent van Gogh", role: "The wild card", image: "/vangogh.png", accent: "bg-[#ff9dc7]", tape: "rotate-2" },
]

const principles = [
  ["01", "PICK A PANEL", "Cast two to six minds from history, fiction, or wherever the good arguments live."],
  ["02", "MAKE A CLAIM", "Bring the question nobody in your group chat can settle."],
  ["03", "ENTER THE RECORD", "Interrupt, challenge, and steer the debate while every voice stays in character."],
]

export default function LandingPage() {
  const goTo = (path: string) => window.location.assign(path)

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5efdf] text-black selection:bg-[#f7b538]">
      <nav className="sticky top-0 z-50 border-b-2 border-black bg-[#f5efdf]/95 px-4 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-3 font-black tracking-[-0.08em]" aria-label="Samvaad AI home">
            <span className="grid size-9 place-items-center border-2 border-black bg-[#f7b538] text-xl shadow-[3px_3px_0_#000]">S</span>
            <span className="text-xl uppercase sm:text-2xl">Samvaad.ai</span>
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs uppercase sm:inline">Issue no. 01</span>
            <Button variant="neutral" size="sm" onClick={() => goTo("/debate")}>Read a debate <ArrowDownRight /></Button>
          </div>
        </div>
      </nav>

      <section id="top" className="relative border-b-2 border-black px-4 py-12 sm:px-8 sm:py-20">
        <div className="pointer-events-none absolute -left-10 top-12 hidden size-36 rotate-12 border-2 border-black bg-[#ff9dc7] lg:block" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <Badge className="mb-7 bg-[#bbdf63] text-sm uppercase tracking-wide">A debate magazine for impossible conversations</Badge>
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.25em]">The council is in session</p>
            <h1 className="max-w-4xl font-serif text-6xl font-black leading-[.82] tracking-[-0.07em] sm:text-8xl lg:text-[8.5rem]">
              BIG MINDS.<br />
              <span className="relative inline-block">LOUD TAKES.<svg aria-hidden="true" className="absolute -bottom-5 left-0 w-full" viewBox="0 0 400 25" fill="none"><path d="M5 18C78 5 187 30 395 6" stroke="currentColor" strokeWidth="4" /></svg></span>
            </h1>
            <p className="mt-10 max-w-xl text-lg font-medium leading-relaxed sm:text-xl">Assemble a council of characters, throw them a question, and see who can defend their point when the room gets interesting.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" onClick={() => goTo("/debate/new")}>Start a council <ArrowRight /></Button>
              <Button size="lg" variant="neutral" onClick={() => goTo("/debate")}>Watch the chaos</Button>
            </div>
            <p className="mt-6 -rotate-1 font-mono text-sm font-bold">↳ No polite panels. No canned answers.</p>
          </div>

          <div className="relative mx-auto w-full max-w-lg pb-7 pr-5 lg:pr-0">
            <div className="rotate-1 border-2 border-black bg-[#78c7ff] p-4 shadow-[8px_8px_0_#000]">
              <div className="flex items-center justify-between border-b-2 border-black pb-3 font-mono text-xs font-bold uppercase"><span>Live from the council floor</span><span>● recording</span></div>
              <div className="mt-5 grid grid-cols-[64px_1fr] gap-3">
                <Image src="/socrates.png" alt="Socrates" width={128} height={128} className="size-16 border-2 border-black object-cover" />
                <Bubble variant="secondary" className="max-w-none"><BubbleContent className="bg-[#fffaf0] text-base font-semibold">Before we decide whether AI should lead, should we not first ask what a leader is?</BubbleContent></Bubble>
              </div>
              <div className="mt-5 grid grid-cols-[1fr_64px] gap-3">
                <Bubble align="end" className="max-w-none"><BubbleContent className="bg-[#f7b538] text-right text-base font-semibold">Good. But can it survive the follow-up questions?</BubbleContent></Bubble>
                <Image src="/einstein-scientist.png" alt="Einstein" width={128} height={128} className="size-16 border-2 border-black object-cover" />
              </div>
              <div className="mt-5 flex items-center justify-between border-t-2 border-black pt-3 font-mono text-xs font-bold uppercase"><span>2 speakers online</span><span>12:04 elapsed</span></div>
            </div>
            <span className="absolute -bottom-2 left-2 rotate-[-8deg] border-2 border-black bg-[#ff9dc7] px-3 py-2 font-mono text-xs font-bold shadow-[3px_3px_0_#000]">HOT MIC ON</span>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-black bg-black px-4 py-3 text-[#f5efdf] sm:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-hidden font-mono text-sm font-bold uppercase tracking-wide"><span className="whitespace-nowrap">Socrates v. Batman</span><span className="hidden sm:inline">•</span><span className="whitespace-nowrap">Should power have rules?</span><span className="hidden sm:inline">•</span><span className="whitespace-nowrap">The floor is open</span></div></section>

      <section className="border-b-2 border-black px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-xs font-bold uppercase tracking-[0.25em]">Cast the conversation</p><h2 className="mt-2 font-serif text-5xl font-black tracking-[-0.06em] sm:text-7xl">PICK YOUR<br />PROBLEM PEOPLE.</h2></div><p className="max-w-xs border-l-2 border-black pl-4 text-sm font-medium">Each voice gets its own color. Pick the people most likely to make your question worse—in the best way.</p></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {speakers.map((speaker) => (
              <button key={speaker.name} type="button" onClick={() => goTo("/debate/new")} className={`group relative flex min-h-48 items-end overflow-hidden border-2 border-black bg-[#fffaf0] text-left shadow-[5px_5px_0_#000] transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black ${speaker.tape}`}>
                <span className={`absolute left-1/2 top-3 h-6 w-24 -translate-x-1/2 -rotate-2 border border-black/20 opacity-80 ${speaker.accent}`} />
                <Image src={speaker.image} alt="" width={320} height={320} className="absolute right-0 top-0 size-48 object-cover object-top grayscale transition duration-300 group-hover:grayscale-0" />
                <span className={`absolute inset-x-0 bottom-0 h-20 ${speaker.accent}`} />
                <span className="relative p-4"><strong className="block font-serif text-3xl font-black leading-none tracking-[-0.06em]">{speaker.name}</strong><small className="mt-1 block font-mono text-xs font-bold uppercase">{speaker.role} · click to cast</small></span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b-2 border-black bg-[#bbdf63] px-4 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-7xl"><div className="mb-10 max-w-3xl"><p className="font-mono text-xs font-bold uppercase tracking-[0.25em]">No moderator required</p><h2 className="mt-2 font-serif text-5xl font-black tracking-[-0.06em] sm:text-7xl">HOW THE FIGHT GETS STARTED.</h2></div><div className="grid gap-5 md:grid-cols-3">{principles.map(([number, title, copy]) => <article key={number} className="border-2 border-black bg-[#fffaf0] p-6 shadow-[6px_6px_0_#000]"><span className="font-mono text-5xl font-black">{number}</span><h3 className="mt-12 font-serif text-3xl font-black tracking-[-0.04em]">{title}</h3><p className="mt-3 font-medium leading-relaxed">{copy}</p></article>)}</div></div></section>

      <section className="border-b-2 border-black px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div><Badge className="bg-[#ff9dc7] text-sm uppercase tracking-wide">From the transcripts</Badge><h2 className="mt-6 font-serif text-5xl font-black leading-[.9] tracking-[-0.06em] sm:text-7xl">THE GOOD PART IS THE INTERRUPTION.</h2><p className="mt-6 max-w-md text-lg font-medium leading-relaxed">Not a chatbot with a costume. A live back-and-forth where every participant can object, redirect, or steal the room.</p></div>
          <div className="border-2 border-black bg-[#fffaf0] p-5 shadow-[7px_7px_0_#000] sm:p-8"><div className="mb-6 flex items-center justify-between border-b-2 border-black pb-3 font-mono text-xs font-bold uppercase"><span>Transcript: 0007</span><span>Topic: ambition</span></div><div className="space-y-5"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center border-2 border-black bg-[#c4a6ff] font-black">L</span><div><p className="mb-1 font-mono text-xs font-bold uppercase">Light Yagami</p><Bubble variant="secondary"><BubbleContent className="bg-[#c4a6ff] text-base font-semibold">If you have the ability to change a broken world, refusing to act is also a choice.</BubbleContent></Bubble></div></div><div className="flex items-start justify-end gap-3"><div className="text-right"><p className="mb-1 font-mono text-xs font-bold uppercase">Vincent van Gogh</p><Bubble align="end"><BubbleContent className="bg-[#ff9dc7] text-right text-base font-semibold">And if your perfect world has no room for the strange, what exactly have you saved?</BubbleContent></Bubble></div><span className="grid size-10 shrink-0 place-items-center border-2 border-black bg-[#ff9dc7] font-black">V</span></div></div><p className="mt-8 rotate-1 text-right font-mono text-sm font-bold">← objection noted</p></div>
        </div>
      </section>

      <section className="bg-black px-4 py-20 text-[#f5efdf] sm:px-8 sm:py-28"><div className="mx-auto max-w-5xl text-center"><Sparkles className="mx-auto mb-6 size-9 text-[#f7b538]" /><p className="font-mono text-xs font-bold uppercase tracking-[0.25em]">Your question deserves witnesses</p><h2 className="mt-5 font-serif text-5xl font-black leading-[.85] tracking-[-0.06em] sm:text-8xl">OPEN THE FLOOR.</h2><p className="mx-auto mt-7 max-w-xl text-lg font-medium text-[#f5efdf]/80">Build a council and make somebody defend their position.</p><Button size="lg" className="mt-9 bg-[#f7b538]" onClick={() => goTo("/debate/new")}>Start your first debate <Mic2 /></Button></div></section>
    </main>
  )
}
