// app/debate/new/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import Link from "next/link";

const apiUrl = process.env.NEXT_PUBLIC_API_URL; 
export default function NewDebatePage() {
  const [userName, setUserName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [topic, setTopic] = useState("");
  const [characters, setCharacters] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addCharacter = () => setCharacters([...characters, ""]);
  const removeCharacter = (index: number) => {
    if (characters.length <= 2) return;
    setCharacters(characters.filter((_, i) => i !== index));
  };
  const updateCharacter = (index: number, value: string) => {
    const newChars = [...characters];
    newChars[index] = value;
    setCharacters(newChars);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userName.trim()) return setError("Your name is required.");
    if (!apiKey.trim()) return setError("GROQ API Key is required.");
    if (!topic.trim()) return setError("Debate topic is required.");
    const validChars = characters.filter(c => c.trim());
    if (validChars.length < 2) return setError("At least 2 characters are required.");

    setLoading(true);
    console.log("Attempting to fetch from API URL:", apiUrl);
    try {
      const existingSessionToken = localStorage.getItem("SESSION_TOKEN");
      const res = await fetch(`${apiUrl}/debates/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: userName,
          groq_api_key: apiKey,
          topic,
          character_names: validChars,
          session_token: existingSessionToken,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to start debate");
      }

      const data = await res.json();
      const sessionId = data.session_id;
      const sessionToken = data.session_token;
      // Pass API key via localStorage (⚠️ for dev only)
      localStorage.setItem("GROQ_API_KEY", apiKey);
      localStorage.setItem("SESSION_TOKEN", sessionToken);
      // Redirect to the debate room
      window.location.href = `/debate/${sessionId}`;
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Start a New Debate</CardTitle>
          <CardDescription className="text-slate-400">
            Choose your council and topic to begin a philosophical debate.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="userName" className="text-slate-300">Your Name</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Alex"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-slate-300">GROQ API Key</Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                placeholder="sk-..."
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic" className="text-slate-300">Debate Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. The meaning of suffering"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Characters (2–6)</Label>
              <div className="space-y-2">
                {characters.map((char, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={char}
                      onChange={(e) => updateCharacter(index, e.target.value)}
                      placeholder={`e.g. Socrates`}
                      className="bg-slate-700 border-slate-600 text-white flex-1"
                    />
                    {characters.length > 2 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeCharacter(index)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCharacter}
                disabled={characters.length >= 6}
                className="text-slate-300 border-slate-600 hover:bg-slate-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Character
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Link href="/">
              <Button variant="ghost" className="text-slate-400">Cancel</Button>
            </Link>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-slate-900"
              disabled={loading}
            >
              {loading ? "Starting Debate..." : "Start Debate"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}