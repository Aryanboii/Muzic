"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown, Play, Plus, Flame, Music, Share, Check, SkipForward, Trash2 } from "lucide-react"
import Image from "next/image"

interface QueueItem {
  id: string
  title: string
  thumbnail: string
  videoId: string
  votes: number
  addedBy: string
  duration: string
  author?: string
}

// Default songs to populate the queue
const defaultSongs: QueueItem[] = [
  {
    id: "default-1",
    title: "Hanumankind - Run It Up (Prod. By Kalmi) | (Official Music Video)",
    thumbnail: "https://img.youtube.com/vi/MbJ72KO5khs/mqdefault.jpg",
    videoId: "MbJ72KO5khs",
    votes: 5,
    addedBy: "vibe check",
    duration: "Unknown",
    author: "Hanumankind",
  },
  {
    id: "default-2",
    title: "Shubh - Together (Official Music Video)",
    thumbnail: "https://img.youtube.com/vi/7iy8iB8tu5c/mqdefault.jpg",
    videoId: "7iy8iB8tu5c",
    votes: 3,
    addedBy: "vibe check",
    duration: "Unknown",
    author: "SHUBH",
  },
  {
    id: "default-3",
    title: "Shubh - Supreme (Official Music Video)",
    thumbnail: "https://img.youtube.com/vi/QRwLbf3PwO8/mqdefault.jpg",
    videoId: "QRwLbf3PwO8",
    votes: 7,
    addedBy: "vibe check",
    duration: "Unknown",
    author: "SHUBH",
  },
]

export default function StreamSongQueue() {
  const [currentVideo, setCurrentVideo] = useState<QueueItem | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [newVideoUrl, setNewVideoUrl] = useState("")
  const [previewVideo, setPreviewVideo] = useState<QueueItem | null>(null)
  const [userName, setUserName] = useState("Anonymous")
  const [shareClicked, setShareClicked] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem("songQueue")
      const savedCurrentVideo = localStorage.getItem("currentVideo")
      const savedUserName = localStorage.getItem("userName")
      const hasVisitedBefore = localStorage.getItem("hasVisitedBefore")

      if (savedQueue) {
        const parsedQueue = JSON.parse(savedQueue)
        setQueue(parsedQueue)
      } else if (!hasVisitedBefore) {
        // Only use default songs on first visit
        setQueue(defaultSongs)
        localStorage.setItem("hasVisitedBefore", "true")
      } else {
        // Returning user with no saved queue - start with empty queue
        setQueue([])
      }

      if (savedCurrentVideo) {
        const parsedCurrentVideo = JSON.parse(savedCurrentVideo)
        setCurrentVideo(parsedCurrentVideo)
      }

      if (savedUserName) {
        setUserName(savedUserName)
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
      // Only fallback to default songs if it's the first visit
      const hasVisitedBefore = localStorage.getItem("hasVisitedBefore")
      if (!hasVisitedBefore) {
        setQueue(defaultSongs)
        localStorage.setItem("hasVisitedBefore", "true")
      } else {
        setQueue([])
      }
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("songQueue", JSON.stringify(queue))
      } catch (error) {
        console.error("Error saving queue to localStorage:", error)
      }
    }
  }, [queue, isLoaded])

  // Save current video to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        if (currentVideo) {
          localStorage.setItem("currentVideo", JSON.stringify(currentVideo))
        } else {
          localStorage.removeItem("currentVideo")
        }
      } catch (error) {
        console.error("Error saving current video to localStorage:", error)
      }
    }
  }, [currentVideo, isLoaded])

  // Save username to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && userName !== "Anonymous") {
      try {
        localStorage.setItem("userName", userName)
      } catch (error) {
        console.error("Error saving username to localStorage:", error)
      }
    }
  }, [userName, isLoaded])

  // Extract YouTube video ID from URL
  const extractVideoId = (url: string): string | null => {
    if (!url) return null

    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /(?:youtu\.be\/)([^&\n?#]+)/,
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
      /(?:youtube\.com\/v\/)([^&\n?#]+)/,
      /(?:youtube\.com\/watch\?.*&v=)([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  // Fetch video details using YouTube oEmbed API
  const getVideoDetails = async (videoId: string, fullUrl: string): Promise<QueueItem | null> => {
    try {
      setIsLoadingPreview(true)

      // Get basic video info from oEmbed
      const oembedResponse = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(fullUrl)}&format=json`,
      )

      if (!oembedResponse.ok) {
        throw new Error("Failed to fetch video details")
      }

      const oembedData = await oembedResponse.json()

      return {
        id: Date.now().toString(),
        title: oembedData.title || `Video ${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        videoId,
        votes: 0,
        addedBy: userName,
        duration: "Unknown", // Default duration
        author: oembedData.author_name || "Unknown Channel",
      }
    } catch (error) {
      console.error("Error fetching video details:", error)

      // Fallback to basic info if oEmbed fails
      return {
        id: Date.now().toString(),
        title: `YouTube Video ${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        videoId,
        votes: 0,
        addedBy: userName,
        duration: "Unknown", // Default duration
        author: "Unknown Channel",
      }
    } finally {
      setIsLoadingPreview(false)
    }
  }

  // Handle URL input change and preview
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const videoId = extractVideoId(newVideoUrl)
      if (videoId && newVideoUrl.trim()) {
        console.log("Extracting video ID:", videoId)
        try {
          const video = await getVideoDetails(videoId, newVideoUrl)
          if (video) {
            setPreviewVideo(video)
          }
        } catch (error) {
          console.error("Error getting video details:", error)
          setPreviewVideo(null)
        }
      } else {
        setPreviewVideo(null)
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timeoutId)
  }, [newVideoUrl, userName])

  // Sort queue by votes
  const sortedQueue = [...queue].sort((a, b) => b.votes - a.votes)

  const handleVote = (id: string, increment: number) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, votes: Math.max(0, item.votes + increment) } : item)),
    )
  }

  const addToQueue = () => {
    if (previewVideo) {
      setQueue((prev) => [...prev, previewVideo])
      setNewVideoUrl("")
      setPreviewVideo(null)
    }
  }

  const playNext = () => {
    if (sortedQueue.length > 0) {
      const nextVideo = sortedQueue[0]
      setCurrentVideo(nextVideo)
      setQueue((prev) => prev.filter((item) => item.id !== nextVideo.id))
    }
  }

  const playVideo = (video: QueueItem) => {
    setCurrentVideo(video)
    setQueue((prev) => prev.filter((item) => item.id !== video.id))
  }

  const deleteSong = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
  }

  const clearQueue = () => {
    setQueue([])
    setCurrentVideo(null)
    localStorage.removeItem("songQueue")
    localStorage.removeItem("currentVideo")
  }

  const handleShare = async () => {
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: "vibe check - Song Queue",
          text: "Vote for the next song on my stream!",
          url: url,
        })
      } catch (err) {
        // Fallback to clipboard
        copyToClipboard(url)
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setShareClicked(true)
      setTimeout(() => setShareClicked(false), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  // Show loading state while data is being loaded from localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-zinc-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-lg">loading your queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0 flex gap-2">
            {(queue.length > 0 || currentVideo) && (
              <Button
                onClick={clearQueue}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 rounded-full px-4 py-2 font-medium border-none flex items-center gap-2"
              >
                <span className="hidden sm:inline">clear all</span>
                <span className="sm:hidden">🗑️</span>
              </Button>
            )}
            <Button
              onClick={handleShare}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-full px-4 py-2 font-medium border-none flex items-center gap-2"
            >
              {shareClicked ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">copied!</span>
                </>
              ) : (
                <>
                  <Share className="w-4 h-4" />
                  <span className="hidden sm:inline">share with fans</span>
                </>
              )}
            </Button>
          </div>
          <h1 className="text-6xl font-black text-white mb-2 flex items-center justify-center gap-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">
              vibe check
            </span>{" "}
            🎵
          </h1>
          <p className="text-zinc-200 text-lg">drop ur song & let the crowd decide</p>
          {(queue.length > 0 || currentVideo) && (
            <p className="text-zinc-400 text-sm mt-2">✨ your queue will be next</p>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Main Video Player */}
          <div>
            <Card className="bg-zinc-900 border-none rounded-xl overflow-hidden shadow-[0_0_15px_rgba(149,0,255,0.15)]">
              <CardContent className="p-0">
                {currentVideo ? (
                  <>
                    <div className="aspect-video bg-black">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1`}
                        title={currentVideo.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    {/* Play Next Song Button - Always visible when there's a current video and queue has items */}
                    {currentVideo && sortedQueue.length > 0 && (
                      <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                        <Button
                          onClick={playNext}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 rounded-full px-6 py-3 font-bold text-white border-none flex items-center justify-center gap-2 text-lg transition-all duration-200 hover:scale-105"
                        >
                          <SkipForward className="w-5 h-5" />
                          <span>play next song</span>
                          <Badge className="bg-black/30 text-white border-none rounded-full px-2 py-1 text-sm">
                            {sortedQueue.length} waiting
                          </Badge>
                        </Button>
                        <p className="text-center text-zinc-400 text-xs mt-2">
                          next up: {sortedQueue[0]?.title.slice(0, 50)}...
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="aspect-video bg-zinc-950 flex items-center justify-center">
                    <div className="text-center text-zinc-300">
                      <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">no track playing rn</p>
                      <Button
                        onClick={playNext}
                        className="mt-6 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-full px-6 py-2 font-medium border-none"
                        disabled={sortedQueue.length === 0}
                      >
                        play next in queue
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Song Form */}
            <Card className="bg-zinc-900 border-none rounded-xl overflow-hidden shadow-[0_0_15px_rgba(149,0,255,0.15)] mt-6">
              <CardHeader className="border-b border-zinc-800 bg-zinc-950 px-6">
                <CardTitle className="text-white flex items-center gap-2 text-xl">
                  <Plus className="w-5 h-5 text-cyan-400" />
                  <span>add ur track</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div>
                  <Input
                    placeholder="ur name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <Input
                    placeholder="paste youtube link here..."
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                {newVideoUrl && extractVideoId(newVideoUrl) && (isLoadingPreview || !previewVideo) && (
                  <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
                      <span className="ml-2 text-zinc-300">loading video info...</span>
                    </div>
                  </div>
                )}

                {previewVideo && extractVideoId(newVideoUrl) && !isLoadingPreview && (
                  <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
                    <div className="flex gap-3">
                      <div className="relative flex-shrink-0 group">
                        <Image
                          src={previewVideo.thumbnail || "/placeholder.svg"}
                          alt={previewVideo.title}
                          width={80}
                          height={45}
                          className="rounded-lg object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-medium line-clamp-2 mb-1">{previewVideo.title}</h4>
                        <p className="text-zinc-300 text-xs mb-1">by {previewVideo.author}</p>
                        <p className="text-zinc-400 text-xs">Duration: {previewVideo.duration}</p>
                      </div>
                    </div>
                    <Button
                      onClick={addToQueue}
                      className="w-full mt-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-full font-medium border-none"
                    >
                      add to queue ✨
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Now Playing + Queue */}
          <div className="space-y-6">
            {/* Now Playing Info */}
            {currentVideo && (
              <Card className="bg-zinc-900 border-none rounded-xl overflow-hidden shadow-[0_0_15px_rgba(149,0,255,0.15)]">
                <CardHeader className="border-b border-zinc-800 bg-zinc-950 px-6">
                  <CardTitle className="text-white flex items-center gap-2 text-xl">
                    <Flame className="w-5 h-5 text-pink-500" />
                    <span>now playing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      <Image
                        src={currentVideo.thumbnail || "/placeholder.svg"}
                        alt={currentVideo.title}
                        width={120}
                        height={68}
                        className="rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-lg line-clamp-2 mb-1">{currentVideo.title}</h3>
                      <p className="text-zinc-300 text-sm">added by @{currentVideo.addedBy}</p>
                      {currentVideo.author && <p className="text-zinc-400 text-xs">by {currentVideo.author}</p>}
                      <p className="text-zinc-400 text-xs">Duration: {currentVideo.duration}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Queue */}
            <Card className="bg-zinc-900 border-none rounded-xl overflow-hidden shadow-[0_0_15px_rgba(149,0,255,0.15)]">
              <CardHeader className="border-b border-zinc-800 bg-zinc-950 px-6">
                <CardTitle className="text-white flex items-center justify-between text-xl">
                  <span>upcoming tracks</span>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none rounded-full px-3">
                    {sortedQueue.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                  {sortedQueue.map((video, index) => (
                    <div key={video.id} className="border-b border-zinc-800 p-4 hover:bg-zinc-800/50 transition-colors">
                      <div className="flex gap-4">
                        <div className="relative flex-shrink-0 group">
                          <Image
                            src={video.thumbnail || "/placeholder.svg"}
                            alt={video.title}
                            width={120}
                            height={68}
                            className="rounded-lg object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <Play className="w-8 h-8 text-white" />
                          </div>
                          <Badge className="absolute -top-2 -left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none rounded-full h-6 w-6 flex items-center justify-center p-0">
                            {index + 1}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-lg font-bold line-clamp-2 mb-1">{video.title}</h4>
                          <p className="text-zinc-200 text-sm mb-1 flex items-center gap-1">
                            <span>@{video.addedBy}</span>
                            {video.author && (
                              <>
                                <span className="inline-block w-1 h-1 rounded-full bg-zinc-400 mx-1"></span>
                                <span>by {video.author}</span>
                              </>
                            )}
                          </p>
                          <p className="text-zinc-400 text-xs mb-3">Duration: {video.duration}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleVote(video.id, 1)}
                                className="relative h-8 px-3 text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 rounded-l-full flex items-center gap-1 border-none"
                              >
                                <ChevronUp className="w-4 h-4" />
                                <span className="text-white text-sm font-bold">{video.votes}</span>
                                <span className="sr-only">Upvote</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleVote(video.id, -1)}
                                className="h-8 w-8 p-0 text-white bg-zinc-800 hover:bg-zinc-700 rounded-r-full border-none"
                              >
                                <ChevronDown className="w-4 h-4" />
                                <span className="sr-only">Downvote</span>
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => playVideo(video)}
                                className="h-8 px-4 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-full border-none"
                              >
                                play now
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => deleteSong(video.id)}
                                className="h-8 w-8 p-0 text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 rounded-full border-none"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="sr-only">Delete song</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {sortedQueue.length === 0 && (
                    <div className="text-center py-12 px-4">
                      <p className="text-zinc-100 text-lg mb-2 font-medium">no tracks in queue yet</p>
                      <p className="text-zinc-300">add a youtube link to get the party started! 🎉</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
