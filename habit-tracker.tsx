"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useAnimation, useInView } from "framer-motion"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

// Types
type Habit = {
  id: string
  name: string
  icon: string
  target: number
  unit: string
  frequency: "daily" | "weekly"
  streak: number
  progress: number
  color: string
  history: { date: string; value: number }[]
}
type NewHabit = {
  name: string
  target: number
  unit: string
  frequency: "daily" | "weekly"
}
type User = {
  name: string
  email: string
  avatar: string
  joinDate: string
  preferences: {
    darkMode: boolean
    notifications: boolean
    reminderTime: string
    nightMode: boolean
  }
}

type Analytics = {
  sleepData: { date: string; hours: number }[]
  waterData: { date: string; glasses: number }[]
  screenTimeData: { date: string; hours: number }[]
  moodData: { date: string; value: number }[]
  weeklyCompletion: { name: string; completed: number; target: number }[]
  streakDistribution: { name: string; value: number }[]
}

// Mock Data
const generateMockHabits = (): Habit[] => {
  const today = new Date()

  const generateHistory = (days: number, min: number, max: number, trend: "up" | "down" | "stable" = "stable") => {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(today.getDate() - (days - i - 1))

      let baseValue: number
      if (trend === "up") {
        baseValue = min + ((max - min) * i) / days
      } else if (trend === "down") {
        baseValue = max - ((max - min) * i) / days
      } else {
        baseValue = min + Math.random() * (max - min)
      }

      // Add some randomness
      const value = Math.round(baseValue + (Math.random() * 2 - 1))
      return {
        date: date.toISOString().split("T")[0],
        value: Math.max(min, Math.min(max, value)),
      }
    })
  }

  return [
    {
      id: "1",
      name: "Sleep",
      icon: "😴",
      target: 8,
      unit: "hours",
      frequency: "daily",
      streak: 5,
      progress: 7.5,
      color: "#8884d8",
      history: generateHistory(14, 5, 9, "up").map((h) => ({ date: h.date, value: h.value })),
    },
    {
      id: "2",
      name: "Water",
      icon: "💧",
      target: 8,
      unit: "glasses",
      frequency: "daily",
      streak: 12,
      progress: 6,
      color: "#82ca9d",
      history: generateHistory(14, 4, 10, "stable").map((h) => ({ date: h.date, value: h.value })),
    },
    {
      id: "3",
      name: "Exercise",
      icon: "🏃",
      target: 30,
      unit: "minutes",
      frequency: "daily",
      streak: 3,
      progress: 15,
      color: "#ffc658",
      history: generateHistory(14, 0, 60, "up").map((h) => ({ date: h.date, value: h.value })),
    },
    {
      id: "4",
      name: "Meditation",
      icon: "🧘",
      target: 10,
      unit: "minutes",
      frequency: "daily",
      streak: 7,
      progress: 10,
      color: "#ff8042",
      history: generateHistory(14, 0, 20, "stable").map((h) => ({ date: h.date, value: h.value })),
    },
    {
      id: "5",
      name: "Reading",
      icon: "📚",
      target: 20,
      unit: "pages",
      frequency: "daily",
      streak: 4,
      progress: 15,
      color: "#0088fe",
      history: generateHistory(14, 0, 40, "stable").map((h) => ({ date: h.date, value: h.value })),
    },
    {
      id: "6",
      name: "Screen Time",
      icon: "📱",
      target: 2,
      unit: "hours",
      frequency: "daily",
      streak: 0,
      progress: 3.5,
      color: "#ff5252",
      history: generateHistory(14, 1, 6, "down").map((h) => ({ date: h.date, value: h.value })),
    },
  ]
}

const generateMockAnalytics = (): Analytics => {
  const today = new Date()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(today.getDate() - (6 - i))
    return date.toISOString().split("T")[0]
  })

  return {
    sleepData: last7Days.map((date) => ({
      date,
      hours: 5 + Math.random() * 4,
    })),
    waterData: last7Days.map((date) => ({
      date,
      glasses: Math.floor(4 + Math.random() * 6),
    })),
    screenTimeData: last7Days.map((date) => ({
      date,
      hours: 1 + Math.random() * 5,
    })),
    moodData: last7Days.map((date) => ({
      date,
      value: 1 + Math.floor(Math.random() * 5),
    })),
    weeklyCompletion: [
      { name: "Sleep", completed: 6, target: 7 },
      { name: "Water", completed: 7, target: 7 },
      { name: "Exercise", completed: 4, target: 7 },
      { name: "Meditation", completed: 5, target: 7 },
      { name: "Reading", completed: 3, target: 7 },
      { name: "Screen Time", completed: 2, target: 7 },
    ],
    streakDistribution: [
      { name: "0-7 days", value: 2 },
      { name: "8-14 days", value: 1 },
      { name: "15-30 days", value: 2 },
      { name: "30+ days", value: 1 },
    ],
  }
}

const mockUser: User = {
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  joinDate: "2023-01-15",
  preferences: {
    darkMode: false,
    notifications: true,
    reminderTime: "20:00",
    nightMode: false,
  },
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
}

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const pulseAnimation = {
  scale: [1, 1.02, 1],
  transition: { duration: 2, repeat: Number.POSITIVE_INFINITY },
}

// Custom hook for animations when element is in view
function useAnimateOnInView() {
  const controls = useAnimation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  return { ref, controls, variants: fadeIn }
}

// Main Component
export default function HabitTracker() {
  // State
  const [habits, setHabits] = useState<Habit[]>(generateMockHabits())
  const [analytics, setAnalytics] = useState<Analytics>(generateMockAnalytics())
  const [user, setUser] = useState<User>(mockUser)
  const [activeView, setActiveView] = useState<"home" | "dashboard" | "analytics" | "settings">("home")
  const [darkMode, setDarkMode] = useState<boolean>(false)
  const [nightMode, setNightMode] = useState<boolean>(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
  const [showAddHabitModal, setShowAddHabitModal] = useState<boolean>(false)
  const [newHabit, setNewHabit] = useState<NewHabit>({
    name: "",
    target: 1,
    unit: "times",
    frequency: "daily",   // now typing allows both "daily" and "weekly"
  })
  
  const [showHumorModal, setShowHumorModal] = useState<boolean>(false)
  const [humorModalContent, setHumorModalContent] = useState<{ title: string; content: string }>({
    title: "",
    content: "",
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSavedMessage, setShowSavedMessage] = useState(false)

  // Refs
  const headerRef = useRef<HTMLDivElement>(null)

  // Effects
  useEffect(() => {
    // Apply dark mode
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    // Apply night mode
    if (nightMode) {
      document.documentElement.classList.add("night-mode")
    } else {
      document.documentElement.classList.remove("night-mode")
    }
  }, [darkMode, nightMode])

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Handlers
  const handleHabitProgress = (id: string, value: number) => {
    setHabits((prevHabits) => {
      const updatedHabits = prevHabits.map((habit) => (habit.id === id ? { ...habit, progress: value } : habit))

      // Update the analytics data based on the new habit progress
      const updatedWeeklyCompletion = analytics.weeklyCompletion.map((item) => {
        const matchingHabit = updatedHabits.find((h) => h.name === item.name)
        if (matchingHabit && matchingHabit.id === id) {
          return {
            ...item,
            completed: matchingHabit.progress >= matchingHabit.target ? item.completed : item.completed - 1,
          }
        }
        return item
      })

      setAnalytics((prev) => ({
        ...prev,
        weeklyCompletion: updatedWeeklyCompletion,
      }))

      return updatedHabits
    })
  }

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev)
    setUser((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        darkMode: !prev.preferences.darkMode,
      },
    }))
  }

  const handleToggleNightMode = () => {
    setNightMode((prev) => !prev)
    setUser((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        nightMode: !prev.preferences.nightMode,
      },
    }))
  }

  const handleAddHabit = () => {
    if (newHabit.name.trim() === "") return

    const newHabitItem: Habit = {
      id: Date.now().toString(),
      name: newHabit.name,
      icon: "✅",
      target: newHabit.target,
      unit: newHabit.unit,
      frequency: newHabit.frequency,
      streak: 0,
      progress: 0,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      history: Array.from({ length: 14 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (13 - i))
        return {
          date: date.toISOString().split("T")[0],
          value: 0,
        }
      }),
    }

    setHabits((prev) => [...prev, newHabitItem])
    setNewHabit({
      name: "",
      target: 1,
      unit: "times",
      frequency: "daily",
    })
    setShowAddHabitModal(false)
  }

  const handleDeleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== id))
    if (selectedHabit?.id === id) {
      setSelectedHabit(null)
    }
  }

  const handleSaveSettings = (updatedUser: User) => {
    setUser(updatedUser)
    setDarkMode(updatedUser.preferences.darkMode)
    setNightMode(updatedUser.preferences.nightMode)
  }

  const handleViewChange = (view: "home" | "dashboard" | "analytics" | "settings") => {
    setActiveView(view)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Helper Functions
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  const calculateCompletionPercentage = (habit: Habit): number => {
    return Math.min(100, Math.round((habit.progress / habit.target) * 100))
  }

  const getStreakEmoji = (streak: number): string => {
    if (streak >= 30) return "🔥🔥🔥"
    if (streak >= 14) return "🔥🔥"
    if (streak >= 7) return "🔥"
    return "✨"
  }

  const showHumorousContent = (title: string, content: string) => {
    setHumorModalContent({ title, content })
    setShowHumorModal(true)
  }

  // Components
  const LoadingScreen = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
      <div className="text-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="text-5xl mb-4 inline-block"
        >
          <img src="/logo.svg" alt="HabitSync Logo" className="w-20 h-20 mx-auto" />
        </motion.div>
        <motion.h2
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="text-xl font-bold text-gray-800 dark:text-white"
        >
          Loading HabitSync...
        </motion.h2>
      </div>
    </div>
  )

  const Navbar = () => (
    <motion.header
      ref={headerRef}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        darkMode
          ? "bg-gray-900 text-white shadow-[0_0_20px_rgba(0,0,0,0.3)]"
          : nightMode
          ? "bg-gray-900 bg-opacity-90 text-blue-100 shadow-[0_0_25px_rgba(30,58,138,0.3)]"
          : "bg-white text-gray-800"
      } shadow-md backdrop-blur-sm`}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <motion.div className="flex items-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: 0 }}
             className="mr-2 inline-block"
          >
           <img src="/logo.svg" alt="HabitSync Logo" className="w-10 h-10" />
          </motion.div>
          <motion.h1 className={`text-xl font-bold ${nightMode ? "text-blue-300" : ""}`}>HabitSync</motion.h1>
        </motion.div>

        <nav className="hidden md:flex items-center space-x-6">
          {["home", "dashboard", "analytics", "settings"].map((view) => (
            <motion.button
              key={view}
              onClick={() => handleViewChange(view as any)}
              className={`font-medium transition-colors relative ${
                activeView === view
                  ? nightMode
                    ? "text-blue-300"
                    : "text-blue-600 dark:text-blue-400"
                  : nightMode
                    ? "text-blue-100 hover:text-blue-200"
                    : ""
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
              {activeView === view && (
                <motion.div
                  layoutId="navIndicator"
                  className={`absolute -bottom-1 left-0 right-0 h-0.5 ${
                    nightMode ? "bg-blue-300" : "bg-blue-600 dark:bg-blue-400"
                  }`}
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </nav>

        <div className="flex items-center">
          <motion.button
            onClick={handleToggleDarkMode}
            className={`p-2 rounded-full ${
              nightMode ? "hover:bg-blue-800" : "hover:bg-gray-200 dark:hover:bg-gray-700"
            } transition-colors mr-2`}
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle dark mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </motion.button>

          <div className="relative">
            <motion.button
              className="flex items-center focus:outline-none"
              onClick={() => handleViewChange("settings")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.img
                src={user.avatar || "/placeholder.svg"}
                alt={user.name}
                className={`w-8 h-8 rounded-full object-cover border-2 ${
                  nightMode ? "border-blue-500" : "border-blue-500"
                }`}
                whileHover={{ boxShadow: "0 0 8px rgba(59, 130, 246, 0.6)" }}
              />
            </motion.button>
          </div>

          <motion.button
            className="ml-4 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden ${
              darkMode ? "bg-gray-800" : nightMode ? "bg-gray-800 bg-opacity-90 backdrop-blur-sm" : "bg-gray-50"
            }`}
          >
            <div className="container mx-auto px-4 py-2">
              <nav className="flex flex-col space-y-3">
                {["home", "dashboard", "analytics", "settings"].map((view) => (
                  <motion.button
                    key={view}
                    onClick={() => handleViewChange(view as any)}
                    className={`py-2 px-4 rounded-md ${
                      activeView === view
                        ? nightMode
                          ? "bg-blue-900 text-blue-300"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                        : ""
                    }`}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </motion.button>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )

  const Footer = () => {
    const { ref, controls } = useAnimateOnInView()

    return (
      <motion.footer
        ref={ref}
        initial="hidden"
        animate={controls}
        variants={fadeIn}
        className={`py-6 ${
          darkMode
            ? "bg-gray-900 text-gray-300"
            : nightMode
              ? "bg-gray-900 bg-opacity-90 text-blue-100"
              : "bg-gray-100 text-gray-600"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div variants={slideUp}>
              <h3 className={`text-lg font-semibold mb-4 ${nightMode ? "text-blue-300" : ""}`}>HabitSync</h3>
              <p className="text-sm">
                Track your habits, improve your life, and achieve your goals with our powerful analytics.
              </p>
            </motion.div>

            <motion.div variants={slideUp}>
              <h3 className={`text-lg font-semibold mb-4 ${nightMode ? "text-blue-300" : ""}`}>Quick Links</h3>
              <ul className="space-y-2 text-sm">
                {["home", "dashboard", "analytics", "settings"].map((view) => (
                  <li key={view}>
                    <motion.button
                      onClick={() => handleViewChange(view as any)}
                      className="hover:underline"
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </motion.button>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={slideUp}>
              <h3 className={`text-lg font-semibold mb-4 ${nightMode ? "text-blue-300" : ""}`}>Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <motion.button
                    onClick={() =>
                      showHumorousContent(
                        "Our Blog",
                        "Welcome to our blog, where we write about habits so good they're practically illegal. Today's top post: 'I Drank 8 Glasses of Water Every Day for a Week and Now I'm Basically Aquaman'",
                      )
                    }
                    className="hover:underline"
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Blog
                  </motion.button>
                </li>
                <li>
                  <motion.button
                    onClick={() =>
                      showHumorousContent(
                        "Help Center",
                        "Need help? Have you tried turning your habits off and on again? No? Well, that's our only suggestion. Good luck!",
                      )
                    }
                    className="hover:underline"
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Help Center
                  </motion.button>
                </li>
                <li>
                  <motion.button
                    onClick={() =>
                      showHumorousContent(
                        "Contact Support",
                        "Our support team is currently busy developing their own good habits. Please try again when they've achieved enlightenment (estimated wait time: 7-10 business lifetimes).",
                      )
                    }
                    className="hover:underline"
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Contact Support
                  </motion.button>
                </li>
                <li>
                  <motion.button
                    onClick={() =>
                      showHumorousContent(
                        "Privacy Policy",
                        "We promise not to tell anyone about that weird habit you're tracking. Your secret '3 AM Dance Party' habit is safe with us!",
                      )
                    }
                    className="hover:underline"
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Privacy Policy
                  </motion.button>
                </li>
              </ul>
            </motion.div>

            <motion.div variants={slideUp}>
              <h3 className={`text-lg font-semibold mb-4 ${nightMode ? "text-blue-300" : ""}`}>Connect</h3>
              <div className="flex space-x-4">
                {[
                  {
                    icon: "🐦",
                    label: "Twitter",
                    content:
                      "We would show you our Twitter feed, but all our tweets are just 'Remember to drink water!' 280 times.",
                  },
                  {
                    icon: "📘",
                    label: "Facebook",
                    content:
                      "Join our Facebook community where we post inspirational quotes over stock photos of people looking way too happy while meditating.",
                  },
                  {
                    icon: "📷",
                    label: "Instagram",
                    content:
                      "Our Instagram is just perfectly arranged habit trackers next to cups of coffee that no one actually drinks.",
                  },
                  {
                    icon: "💼",
                    label: "LinkedIn",
                    content:
                      "Connect with us on LinkedIn where we pretend that tracking our habits is somehow related to professional development.",
                  },
                ].map((social) => (
                  <motion.button
                    key={social.label}
                    onClick={() => showHumorousContent(social.label, social.content)}
                    className={`text-xl ${nightMode ? "hover:text-blue-300" : "hover:text-blue-500"} transition-colors`}
                    whileHover={{
                      scale: 1.2,
                      rotate: 5,
                      textShadow: nightMode ? "0 0 8px rgba(147, 197, 253, 0.7)" : "0 0 8px rgba(59, 130, 246, 0.7)",
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span role="img" aria-label={social.label}>
                      {social.icon}
                    </span>
                  </motion.button>
                ))}
              </div>
              <div className="mt-4">
                <h4 className={`text-sm font-medium mb-2 ${nightMode ? "text-blue-200" : ""}`}>
                  Subscribe to our newsletter
                </h4>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Your email"
                    className={`px-3 py-2 text-sm rounded-l-md border ${
                      nightMode
                        ? "bg-gray-800 border-gray-700 text-blue-100"
                        : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    } flex-grow`}
                  />
                  <motion.button
                    onClick={() =>
                      showHumorousContent(
                        "Subscribed!",
                        "Thanks for subscribing! We'll send you daily reminders about habits you already know you should be doing but somehow still need us to tell you about.",
                      )
                    }
                    className={`${
                      nightMode ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"
                    } text-white px-4 py-2 text-sm rounded-r-md transition-colors`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Subscribe
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} HabitSync. All rights reserved.</p>
          </div>
        </div>
      </motion.footer>
    )
  }

  const HomePage = () => {
    const featureAnimation = useAnimateOnInView()
    const trackAnimation = useAnimateOnInView()
    const testimonialAnimation = useAnimateOnInView()

    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <section className="relative py-20 md:py-32 overflow-hidden">
            <div
              className={`absolute inset-0 ${
                nightMode
                  ? "bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900"
                  : darkMode
                    ? "bg-gradient-to-br from-gray-900 to-gray-800"
                    : "bg-gradient-to-br from-blue-50 to-indigo-100"
              }`}
            >
              {nightMode && (
                <>
                  <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                  <div className="absolute top-40 right-40 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                  <div className="absolute bottom-40 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </>
              )}
            </div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 mb-10 md:mb-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.h1
                      className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight ${
                        nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                    >
                      Track Your Habits, <br />
                      <motion.span
                        className={nightMode ? "text-blue-300" : "text-blue-600 dark:text-blue-400"}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                      >
                        Transform Your Life
                      </motion.span>
                    </motion.h1>
                    <motion.p
                      className={`text-lg md:text-xl ${
                        nightMode ? "text-blue-200" : "text-gray-700 dark:text-gray-300"
                      } mb-8 max-w-lg`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.6 }}
                    >
                      Monitor your daily habits, visualize your progress, and achieve your personal goals with powerful
                      analytics.
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.8 }}
                    >
                      <motion.button
                        onClick={() => handleViewChange("dashboard")}
                        className={`px-8 py-3 ${
                          nightMode
                            ? "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                            : darkMode
                              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                        } rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200`}
                        whileHover={{
                          scale: 1.05,
                          boxShadow: nightMode
                            ? "0 0 15px rgba(37, 99, 235, 0.5)"
                            : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Get Started
                      </motion.button>
                    </motion.div>
                  </motion.div>
                </div>
                <div className="md:w-1/2">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative"
                  >
                    <div className="relative mx-auto w-full max-w-md">
                      <motion.div
                        className={`${
                          nightMode ? "bg-gray-800 shadow-[0_0_25px_rgba(37,99,235,0.2)]" : "bg-white dark:bg-gray-800"
                        } rounded-2xl shadow-2xl overflow-hidden`}
                        whileHover={{ y: -5 }}
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-6">
                            <h3
                              className={`text-lg font-semibold ${
                                nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"
                              }`}
                            >
                              Today's Progress
                            </h3>
                            <span
                              className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}
                            >
                              {new Date().toLocaleDateString()}
                            </span>
                          </div>
                          <div className="space-y-4">
                            {habits.slice(0, 3).map((habit, index) => (
                              <motion.div
                                key={habit.id}
                                className={`${
                                  nightMode ? "bg-gray-700" : "bg-gray-50 dark:bg-gray-700"
                                } p-4 rounded-lg`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center">
                                    <span className="text-2xl mr-2">{habit.icon}</span>
                                    <span
                                      className={`font-medium ${
                                        nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"
                                      }`}
                                    >
                                      {habit.name}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-sm font-medium ${
                                      nightMode ? "text-blue-300" : "text-blue-600 dark:text-blue-400"
                                    }`}
                                  >
                                    {habit.progress}/{habit.target} {habit.unit}
                                  </span>
                                </div>
                                <div
                                  className={`w-full ${
                                    nightMode ? "bg-gray-600" : "bg-gray-200 dark:bg-gray-600"
                                  } rounded-full h-2.5`}
                                >
                                  <motion.div
                                    className={`${nightMode ? "bg-blue-500" : "bg-blue-600"} h-2.5 rounded-full`}
                                    style={{ width: `${calculateCompletionPercentage(habit)}%` }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${calculateCompletionPercentage(habit)}%` }}
                                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                  ></motion.div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          <motion.button
                            onClick={() => handleViewChange("dashboard")}
                            className={`mt-6 w-full py-2 ${
                              nightMode
                                ? "bg-gray-700 text-blue-100 hover:bg-gray-600"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                            } rounded-lg font-medium transition-colors text-center`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            View All Habits
                          </motion.button>
                        </div>
                      </motion.div>
                      <motion.div
                        className={`absolute -bottom-6 -right-6 w-24 h-24 ${
                          nightMode ? "bg-blue-900" : "bg-blue-300 dark:bg-blue-900"
                        } rounded-full z-0`}
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [0, 5, 0],
                        }}
                        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
                      ></motion.div>
                      <motion.div
                        className={`absolute -top-6 -left-6 w-16 h-16 ${
                          nightMode ? "bg-indigo-900" : "bg-indigo-300 dark:bg-indigo-900"
                        } rounded-full z-0`}
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, -5, 0],
                        }}
                        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
                      ></motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          <section className={`py-16 ${nightMode ? "bg-gray-900" : "bg-white dark:bg-gray-900"}`}>
            <div className="container mx-auto px-4">
              <motion.div
                className="text-center mb-12"
                ref={featureAnimation.ref}
                initial="hidden"
                animate={featureAnimation.controls}
                variants={staggerContainer}
              >
                <motion.h2
                  className={`text-3xl font-bold ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"} mb-4`}
                  variants={slideUp}
                >
                  Why Choose HabitSync?
                </motion.h2>
                <motion.p
                  className={`text-lg ${
                    nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"
                  } max-w-2xl mx-auto`}
                  variants={slideUp}
                >
                  Our powerful features help you build lasting habits and achieve your personal goals.
                </motion.p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: "📊",
                    title: "Visual Analytics",
                    description:
                      "Track your progress with beautiful charts and visualizations that make it easy to see your improvements.",
                    color: "blue",
                  },
                  {
                    icon: "🔥",
                    title: "Streak Tracking",
                    description:
                      "Stay motivated with streak counters that show your consistency and help build momentum.",
                    color: "green",
                  },
                  {
                    icon: "🔔",
                    title: "Smart Reminders",
                    description:
                      "Never miss a habit with customizable reminders that help you stay on track with your goals.",
                    color: "purple",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className={`${
                      nightMode ? "bg-gray-800 hover:bg-gray-750" : "bg-gray-50 dark:bg-gray-800"
                    } p-8 rounded-xl shadow-lg`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    whileHover={{
                      y: -10,
                      boxShadow: nightMode
                        ? `0 0 20px rgba(37, 99, 235, 0.2)`
                        : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <motion.div
                      className={`w-14 h-14 ${
                        nightMode ? `bg-${feature.color}-900` : `bg-${feature.color}-100 dark:bg-${feature.color}-900`
                      } rounded-lg flex items-center justify-center text-2xl mb-6`}
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3
                      className={`text-xl font-semibold mb-3 ${
                        nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {feature.title}
                    </h3>
                    <p className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}>
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className={`py-16 ${nightMode ? "bg-gray-800" : "bg-gray-50 dark:bg-gray-800"}`}>
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 mb-10 md:mb-0">
                  <motion.div
                    ref={trackAnimation.ref}
                    initial="hidden"
                    animate={trackAnimation.controls}
                    variants={staggerContainer}
                  >
                    <motion.h2
                      className={`text-3xl font-bold ${
                        nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"
                      } mb-6`}
                      variants={slideUp}
                    >
                      Track What Matters to You
                    </motion.h2>
                    <div className="space-y-4 mb-8">
                      {[
                        {
                          title: "Sleep Quality",
                          description: "Monitor your sleep patterns and improve your rest.",
                        },
                        {
                          title: "Water Intake",
                          description: "Stay hydrated with daily water tracking.",
                        },
                        {
                          title: "Screen Time",
                          description: "Reduce digital distractions and be more present.",
                        },
                        {
                          title: "Exercise & Meditation",
                          description: "Build a healthier body and mind with consistent practice.",
                        },
                      ].map((item, index) => (
                        <motion.div key={item.title} className="flex items-start" variants={slideUp} custom={index}>
                          <motion.div
                            className={`flex-shrink-0 w-6 h-6 rounded-full ${
                              nightMode ? "bg-blue-600" : "bg-blue-500"
                            } flex items-center justify-center text-white mt-1`}
                            whileHover={{ scale: 1.2 }}
                          >
                            ✓
                          </motion.div>
                          <div className="ml-4">
                            <h3
                              className={`text-xl font-medium ${
                                nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {item.title}
                            </h3>
                            <p className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}>
                              {item.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => handleViewChange("dashboard")}
                      className={`px-6 py-3 ${
                        nightMode ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-600 hover:bg-blue-700"
                      } text-white rounded-lg font-medium transition-colors shadow-lg`}
                      variants={slideUp}
                      custom={4}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: nightMode
                          ? "0 0 15px rgba(37, 99, 235, 0.5)"
                          : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Start Tracking Now
                    </motion.button>
                  </motion.div>
                </div>

                <div className="md:w-1/2">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    <motion.div
                      className={`${
                        nightMode ? "bg-gray-900 shadow-[0_0_25px_rgba(37,99,235,0.2)]" : "bg-white dark:bg-gray-900"
                      } rounded-xl shadow-xl p-6 max-w-md mx-auto`}
                      whileHover={{ y: -5 }}
                    >
                      <h3
                        className={`text-xl font-semibold mb-4 ${
                          nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"
                        }`}
                      >
                        Weekly Progress
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={habits[0].history.slice(-7)}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={nightMode ? "#3b82f6" : "#8884d8"} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={nightMode ? "#3b82f6" : "#8884d8"} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="date"
                              tickFormatter={(date) => new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                              stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"}
                            />
                            <YAxis stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"} />
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={nightMode ? "#1e3a8a" : darkMode ? "#374151" : "#e5e7eb"}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: nightMode ? "#1e3a8a" : darkMode ? "#1f2937" : "#ffffff",
                                color: nightMode ? "#dbeafe" : darkMode ? "#ffffff" : "#000000",
                                border: `1px solid ${nightMode ? "#3b82f6" : darkMode ? "#374151" : "#e5e7eb"}`,
                              }}
                              formatter={(value) => [`${value} hours`, "Sleep"]}
                              labelFormatter={(date) => formatDate(date)}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke={nightMode ? "#3b82f6" : "#8884d8"}
                              fillOpacity={1}
                              fill="url(#colorSleep)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <motion.div
                          className={`${
                            nightMode ? "bg-blue-900/30" : "bg-blue-50 dark:bg-blue-900/30"
                          } p-3 rounded-lg`}
                          whileHover={{ scale: 1.03 }}
                        >
                          <p className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
                            Average Sleep
                          </p>
                          <p
                            className={`text-xl font-semibold ${
                              nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"
                            }`}
                          >
                            7.2 hours
                          </p>
                        </motion.div>
                        <motion.div
                          className={`${
                            nightMode ? "bg-green-900/30" : "bg-green-50 dark:bg-green-900/30"
                          } p-3 rounded-lg`}
                          whileHover={{ scale: 1.03 }}
                        >
                          <p className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
                            Best Day
                          </p>
                          <p
                            className={`text-xl font-semibold ${
                              nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"
                            }`}
                          >
                            8.5 hours
                          </p>
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          <section className={`py-16 ${nightMode ? "bg-gray-900" : "bg-white dark:bg-gray-900"}`}>
            <div className="container mx-auto px-4">
              <motion.div
                className="text-center mb-12"
                ref={testimonialAnimation.ref}
                initial="hidden"
                animate={testimonialAnimation.controls}
                variants={staggerContainer}
              >
                <motion.h2
                  className={`text-3xl font-bold ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"} mb-4`}
                  variants={slideUp}
                >
                  What Our Users Say
                </motion.h2>
                <motion.p
                  className={`text-lg ${
                    nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"
                  } max-w-2xl mx-auto`}
                  variants={slideUp}
                >
                  Join thousands of people who have transformed their habits with HabitSync.
                </motion.p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    name: "Sarah J.",
                    role: "Fitness Coach",
                    image: "https://randomuser.me/api/portraits/women/32.jpg",
                    testimonial:
                      "HabitSync has completely changed how I track my clients' progress. The visual analytics make it easy to show improvements over time.",
                    rating: 5,
                  },
                  {
                    name: "Michael T.",
                    role: "Software Developer",
                    image: "https://randomuser.me/api/portraits/men/45.jpg",
                    testimonial:
                      "I've tried many habit trackers, but this one stands out. The streak feature keeps me motivated, and I love seeing my progress charts.",
                    rating: 5,
                  },
                  {
                    name: "Elena R.",
                    role: "Medical Student",
                    image: "https://randomuser.me/api/portraits/women/68.jpg",
                    testimonial:
                      "As a busy student, HabitSync helps me maintain a healthy balance. The reminders are gentle but effective, and I can see my improvement over time.",
                    rating: 4,
                  },
                ].map((testimonial, index) => (
                  <motion.div
                    key={testimonial.name}
                    className={`${
                      nightMode ? "bg-gray-800 hover:bg-gray-750" : "bg-gray-50 dark:bg-gray-800"
                    } p-6 rounded-xl shadow-lg`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    whileHover={{
                      y: -5,
                      boxShadow: nightMode
                        ? `0 0 20px rgba(37, 99, 235, 0.2)`
                        : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <div className="flex items-center mb-4">
                      <motion.div className="w-12 h-12 rounded-full overflow-hidden mr-4" whileHover={{ scale: 1.1 }}>
                        <img
                          src={testimonial.image || "/placeholder.svg"}
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                      <div>
                        <h4 className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"}`}>
                          {testimonial.name}
                        </h4>
                        <p className={`text-sm ${nightMode ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                    <motion.p className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-300"}>
                      "{testimonial.testimonial}"
                    </motion.p>
                    <motion.div
                      className="mt-4 flex text-yellow-400"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      {"★".repeat(testimonial.rating) + "☆".repeat(5 - testimonial.rating)}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section
            className={`py-16 ${
              nightMode
                ? "bg-gradient-to-r from-blue-900 to-indigo-900 text-blue-50 shadow-lg"
                : darkMode
                  ? "bg-gradient-to-r from-blue-800 to-indigo-900 text-white"
                  : "bg-blue-600 text-white"
            }`}
          >
            <div className="container mx-auto px-4 text-center">
              <motion.h2
                className="text-3xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                Ready to Transform Your Habits?
              </motion.h2>
              <motion.p
                className="text-xl mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Join thousands of users who have improved their lives with HabitSync.
              </motion.p>
              <motion.button
                onClick={() => handleViewChange("dashboard")}
                className={`px-8 py-3 ${
                  nightMode ? "bg-white text-blue-600 hover:bg-gray-100" : "bg-white text-blue-600 hover:bg-gray-100"
                } rounded-lg font-medium transition-colors shadow-lg transform hover:-translate-y-1 duration-200`}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                Get Started Now
              </motion.button>
            </div>
          </section>
        </main>
      </div>
    )
  }

  const DashboardView = () => {
    const { ref, controls } = useAnimateOnInView()

    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className={`text-2xl font-bold ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"}`}>
              Your Habits Dashboard
            </h1>
            <p className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}>
              Track and manage your daily habits
            </p>
          </div>
          <motion.button
            onClick={() => setShowAddHabitModal(true)}
            className={`mt-4 md:mt-0 px-4 py-2 ${
              nightMode ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-600 hover:bg-blue-700"
            } text-white rounded-lg transition-colors flex items-center`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-2">+</span> Add New Habit
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            className={`${
              nightMode
                ? "bg-gray-800 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                : darkMode
                  ? "bg-gray-800 shadow-[0_0_15px_rgba(30,41,59,0.5)]"
                  : "bg-white"
            } rounded-xl shadow-lg p-6 transition-all duration-300`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"}`}>
                Today's Progress
              </h3>
              <span className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <motion.div className="space-y-4" variants={staggerContainer} initial="hidden" animate="visible">
              {habits.map((habit, index) => (
                <motion.div
                  key={habit.id}
                  className={`${nightMode ? "bg-gray-700" : "bg-gray-50 dark:bg-gray-700"} p-4 rounded-lg`}
                  variants={slideUp}
                  custom={index}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{habit.icon}</span>
                      <span className={`font-medium ${nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"}`}>
                        {habit.name}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        nightMode ? "text-blue-300" : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {habit.progress}/{habit.target} {habit.unit}
                    </span>
                  </div>
                  <div
                    className={`w-full ${
                      nightMode ? "bg-gray-600" : "bg-gray-200 dark:bg-gray-600"
                    } rounded-full h-2.5 mb-2`}
                  >
                    <motion.div
                      className={`${
                        nightMode
                          ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                          : darkMode
                            ? "bg-blue-600 shadow-[0_0_5px_rgba(37,99,235,0.3)]"
                            : "bg-blue-600"
                      } h-2.5 rounded-full`}
                      style={{ width: `${calculateCompletionPercentage(habit)}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${calculateCompletionPercentage(habit)}%` }}
                      transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                    ></motion.div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={habit.target * 2}
                    step="0.5"
                    value={habit.progress}
                    onChange={(e) => handleHabitProgress(habit.id, Number.parseFloat(e.target.value))}
                    className={`w-full h-2 ${
                      nightMode ? "bg-gray-600" : "bg-gray-200 dark:bg-gray-700"
                    } rounded-lg appearance-none cursor-pointer`}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className={`${
              nightMode ? "bg-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-white dark:bg-gray-800"
            } rounded-xl shadow-lg p-6`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -5 }}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"}`}
            >
              Weekly Overview
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.weeklyCompletion} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={nightMode ? "#3b82f6" : "#8884d8"} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={nightMode ? "#3b82f6" : "#8884d8"} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={nightMode ? "#10b981" : "#82ca9d"} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={nightMode ? "#10b981" : "#82ca9d"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={nightMode ? "#1e3a8a" : darkMode ? "#374151" : "#e5e7eb"}
                  />
                  <XAxis dataKey="name" stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"} />
                  <YAxis stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: nightMode ? "#1e3a8a" : darkMode ? "#1f2937" : "#ffffff",
                      color: nightMode ? "#dbeafe" : darkMode ? "#ffffff" : "#000000",
                      border: `1px solid ${nightMode ? "#3b82f6" : darkMode ? "#374151" : "#e5e7eb"}`,
                    }}
                    formatter={(value) => [`${value} days`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke={nightMode ? "#3b82f6" : "#8884d8"}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    name="Target"
                    stroke={nightMode ? "#10b981" : "#82ca9d"}
                    fillOpacity={1}
                    fill="url(#colorTarget)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <p className={`text-sm ${nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}`}>
                You've completed{" "}
                <span className={`font-semibold ${nightMode ? "text-blue-300" : "text-blue-600 dark:text-blue-400"}`}>
                  27
                </span>{" "}
                out of <span className="font-semibold">42</span> habit check-ins this week.
              </p>
            </div>
          </motion.div>

          <motion.div
            className={`${
              nightMode ? "bg-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-white dark:bg-gray-800"
            } rounded-xl shadow-lg p-6`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -5 }}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"}`}
            >
              Streak Leaders
            </h3>
            <motion.div className="space-y-4" variants={staggerContainer} initial="hidden" animate="visible">
              {habits
                .sort((a, b) => b.streak - a.streak)
                .map((habit, index) => (
                  <motion.div
                    key={habit.id}
                    className={`flex items-center justify-between p-3 ${
                      nightMode ? "bg-gray-700" : "bg-gray-50 dark:bg-gray-700"
                    } rounded-lg`}
                    variants={slideUp}
                    custom={index}
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{habit.icon}</span>
                      <div>
                        <h4 className={`font-medium ${nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"}`}>
                          {habit.name}
                        </h4>
                        <p className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
                          {habit.frequency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <motion.span className="text-xl mr-2" animate={pulseAnimation}>
                        {getStreakEmoji(habit.streak)}
                      </motion.span>
                      <span className={`font-bold ${nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"}`}>
                        {habit.streak}
                      </span>
                    </div>
                  </motion.div>
                ))}
            </motion.div>
            <div className="mt-6">
              <h4 className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"} mb-2`}>
                Streak Distribution
              </h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.streakDistribution} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorStreak" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={nightMode ? "#3b82f6" : "#8884d8"} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={nightMode ? "#3b82f6" : "#8884d8"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={nightMode ? "#1e3a8a" : darkMode ? "#374151" : "#e5e7eb"}
                    />
                    <XAxis dataKey="name" stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"} />
                    <YAxis stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: nightMode ? "#1e3a8a" : darkMode ? "#1f2937" : "#ffffff",
                        color: nightMode ? "#dbeafe" : darkMode ? "#ffffff" : "#000000",
                        border: `1px solid ${nightMode ? "#3b82f6" : darkMode ? "#374151" : "#e5e7eb"}`,
                    }}
                    formatter={(value) => [`${value} habits`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={nightMode ? "#3b82f6" : "#8884d8"}
                    fillOpacity={1}
                    fill="url(#colorStreak)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className={`${
            nightMode ? "bg-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-white dark:bg-gray-800"
          } rounded-xl shadow-lg p-6 mb-8`}
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={fadeIn}
          whileHover={{ y: -5 }}
        >
          <h3 className={`text-lg font-semibold mb-6 ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"}`}>
            Habit Details
          </h3>
          <div className="overflow-x-auto">
            <table
              className={`min-w-full divide-y ${
                nightMode ? "divide-gray-700" : "divide-gray-200 dark:divide-gray-700"
              }`}
            >
              <thead className={nightMode ? "bg-gray-700" : "bg-gray-50 dark:bg-gray-700"}>
                <tr>
                  <th
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-300"
                    } uppercase tracking-wider`}
                  >
                    Habit
                  </th>
                  <th
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-300"
                    } uppercase tracking-wider`}
                  >
                    Target
                  </th>
                  <th
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-300"
                    } uppercase tracking-wider`}
                  >
                    Progress
                  </th>
                  <th
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-300"
                    } uppercase tracking-wider`}
                  >
                    Streak
                  </th>
                  <th
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-300"
                    } uppercase tracking-wider`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`${nightMode ? "bg-gray-800" : "bg-white dark:bg-gray-800"} divide-y ${
                  nightMode ? "divide-gray-700" : "divide-gray-200 dark:divide-gray-700"
                }`}
              >
                {habits.map((habit, index) => (
                  <motion.tr
                    key={habit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    whileHover={{
                      backgroundColor: nightMode
                        ? "rgba(59, 130, 246, 0.2)"
                        : darkMode
                          ? "rgba(55, 65, 81, 0.7)"
                          : "rgba(243, 244, 246, 1)",
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{habit.icon}</div>
                        <div>
                          <div
                            className={`text-sm font-medium ${
                              nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {habit.name}
                          </div>
                          <div
                            className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}
                          >
                            {habit.frequency}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"}`}>
                        {habit.target} {habit.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`w-full max-w-xs ${
                            nightMode ? "bg-gray-600" : "bg-gray-200 dark:bg-gray-600"
                          } rounded-full h-2.5 mr-2`}
                        >
                          <motion.div
                            className={`${nightMode ? "bg-blue-500" : "bg-blue-600"} h-2.5 rounded-full`}
                            style={{ width: `${calculateCompletionPercentage(habit)}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${calculateCompletionPercentage(habit)}%` }}
                            transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                          ></motion.div>
                        </div>
                        <span className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
                          {calculateCompletionPercentage(habit)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <motion.span className="text-xl mr-2" animate={pulseAnimation}>
                          {getStreakEmoji(habit.streak)}
                        </motion.span>
                        <span
                          className={`text-sm font-medium ${
                            nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {habit.streak} days
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <motion.button
                        onClick={() => setSelectedHabit(habit)}
                        className={`${
                          nightMode
                            ? "text-blue-400 hover:text-blue-300"
                            : "text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        } mr-4`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        View
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className={`${
                          nightMode
                            ? "text-red-400 hover:text-red-300"
                            : "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        Delete
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedHabit && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={`${
                  nightMode ? "bg-gray-800 shadow-[0_0_25px_rgba(37,99,235,0.3)]" : "bg-white dark:bg-gray-800"
                } rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <motion.span
                        className="text-3xl mr-3"
                        animate={{ rotate: [0, 10, -10, 10, 0] }}
                        transition={{ duration: 1, delay: 0.5 }}
                      >
                        {selectedHabit.icon}
                      </motion.span>
                      <h2
                        className={`text-2xl font-bold ${
                          nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {selectedHabit.name}
                      </h2>
                    </div>
                    <motion.button
                      onClick={() => setSelectedHabit(null)}
                      className={`${
                        nightMode
                          ? "text-gray-400 hover:text-gray-200"
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ✕
                    </motion.button>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}>
                        Current Progress
                      </span>
                      <span className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"}`}>
                        {selectedHabit.progress}/{selectedHabit.target} {selectedHabit.unit}
                      </span>
                    </div>
                    <div
                      className={`w-full ${
                        nightMode ? "bg-gray-600" : "bg-gray-200 dark:bg-gray-600"
                      } rounded-full h-2.5 mb-4`}
                    >
                      <motion.div
                        className={`${nightMode ? "bg-blue-500" : "bg-blue-600"} h-2.5 rounded-full`}
                        style={{ width: `${calculateCompletionPercentage(selectedHabit)}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${calculateCompletionPercentage(selectedHabit)}%` }}
                        transition={{ duration: 1 }}
                      ></motion.div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={selectedHabit.target * 2}
                      step="0.5"
                      value={selectedHabit.progress}
                      onChange={(e) => handleHabitProgress(selectedHabit.id, Number.parseFloat(e.target.value))}
                      className={`w-full h-2 ${
                        nightMode ? "bg-gray-600" : "bg-gray-200 dark:bg-gray-700"
                      } rounded-lg appearance-none cursor-pointer`}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <motion.div
                      className={`${nightMode ? "bg-gray-700" : "bg-gray-50 dark:bg-gray-700"} p-4 rounded-lg`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <h3
                        className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"} mb-2`}
                      >
                        Streak
                      </h3>
                      <div className="flex items-center">
                        <motion.span className="text-2xl mr-2" animate={pulseAnimation}>
                          {getStreakEmoji(selectedHabit.streak)}
                        </motion.span>
                        <span
                          className={`text-3xl font-bold ${
                            nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {selectedHabit.streak}
                        </span>
                        <span className={`ml-2 ${nightMode ? "text-blue-200" : "text-gray-600 dark:text-gray-400"}`}>
                          days
                        </span>
                      </div>
                    </motion.div>
                    <motion.div
                      className={`${nightMode ? "bg-gray-700" : "bg-gray-50 dark:bg-gray-700"} p-4 rounded-lg`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <h3
                        className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"} mb-2`}
                      >
                        Frequency
                      </h3>
                      <p
                        className={`text-lg ${
                          nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"
                        } capitalize`}
                      >
                        {selectedHabit.frequency}
                      </p>
                    </motion.div>
                  </div>

                  <div className="mb-6">
                    <h3 className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"} mb-4`}>
                      History (Last 14 Days)
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={selectedHabit.history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <defs>
                            <linearGradient id="colorHabitHistory" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={selectedHabit.color} stopOpacity={0.8} />
                              <stop offset="95%" stopColor={selectedHabit.color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={nightMode ? "#1e3a8a" : darkMode ? "#374151" : "#e5e7eb"}
                          />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(date) => new Date(date).toLocaleDateString("en-US", { day: "2-digit" })}
                            stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"}
                          />
                          <YAxis stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: nightMode ? "#1e3a8a" : darkMode ? "#1f2937" : "#ffffff",
                              color: nightMode ? "#dbeafe" : darkMode ? "#ffffff" : "#000000",
                              border: `1px solid ${nightMode ? "#3b82f6" : darkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                            formatter={(value) => [`${value} ${selectedHabit.unit}`, selectedHabit.name]}
                            labelFormatter={(date) => formatDate(date)}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={selectedHabit.color}
                            fillOpacity={1}
                            fill="url(#colorHabitHistory)"
                            activeDot={{ r: 8 }}
                          />
                          <ReferenceLine y={selectedHabit.target} stroke="red" strokeDasharray="3 3" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <motion.button
                      onClick={() => setSelectedHabit(null)}
                      className={`px-4 py-2 border ${
                        nightMode
                          ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                          : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      } rounded-lg transition-colors`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Close
                    </motion.button>
                    <motion.button
                      onClick={() => handleDeleteHabit(selectedHabit.id)}
                      className={`px-4 py-2 ${
                        nightMode ? "bg-red-600 hover:bg-red-500" : "bg-red-600 hover:bg-red-700"
                      } text-white rounded-lg transition-colors`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Delete Habit
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAddHabitModal && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={`${
                  nightMode ? "bg-gray-800 shadow-[0_0_25px_rgba(37,99,235,0.3)]" : "bg-white dark:bg-gray-800"
                } rounded-xl shadow-2xl max-w-md w-full`}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2
                      className={`text-xl font-bold ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"}`}
                    >
                      Add New Habit
                    </h2>
                    <motion.button
                      onClick={() => setShowAddHabitModal(false)}
                      className={`${
                        nightMode
                          ? "text-gray-400 hover:text-gray-200"
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ✕
                    </motion.button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleAddHabit()
                    }}
                  >
                    <div className="mb-4">
                      <label
                        htmlFor="habitName"
                        className={`block text-sm font-medium ${
                          nightMode ? "text-blue-200" : "text-gray-700 dark:text-gray-300"
                        } mb-2`}
                      >
                        Habit Name
                      </label>
                      <input
                        type="text"
                        id="habitName"
                        value={newHabit.name}
                        onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                        className={`w-full px-3 py-2 border ${
                          nightMode
                            ? "bg-gray-700 border-gray-600 text-blue-100 focus:border-blue-500"
                            : "border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        } rounded-md shadow-sm`}
                        placeholder="e.g., Meditation"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="habitTarget"
                        className={`block text-sm font-medium ${
                          nightMode ? "text-blue-200" : "text-gray-700 dark:text-gray-300"
                        } mb-2`}
                      >
                        Target Amount
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          id="habitTarget"
                          value={newHabit.target}
                          onChange={(e) => setNewHabit({ ...newHabit, target: Number.parseInt(e.target.value) || 1 })}
                          min="1"
                          className={`w-full px-3 py-2 border ${
                            nightMode
                              ? "bg-gray-700 border-gray-600 text-blue-100 focus:border-blue-500"
                              : "border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          } rounded-l-md shadow-sm`}
                          required
                        />
                        <input
                          type="text"
                          value={newHabit.unit}
                          onChange={(e) => setNewHabit({ ...newHabit, unit: e.target.value })}
                          className={`px-3 py-2 border ${
                            nightMode
                              ? "bg-gray-700 border-gray-600 text-blue-100 focus:border-blue-500 border-l-0"
                              : "border-gray-300 dark:border-gray-600 border-l-0 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          } rounded-r-md shadow-sm`}
                          placeholder="unit"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label
                        className={`block text-sm font-medium ${
                          nightMode ? "text-blue-200" : "text-gray-700 dark:text-gray-300"
                        } mb-2`}
                      >
                        Frequency
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="frequency"
                            value="daily"
                            checked={newHabit.frequency === "daily"}
                            onChange={() => setNewHabit({ ...newHabit, frequency: "daily" })}
                            className={`h-4 w-4 ${
                              nightMode
                                ? "text-blue-600 focus:ring-blue-500 border-gray-600"
                                : "text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                            }`}
                          />
                          <span className={`ml-2 ${nightMode ? "text-blue-100" : "text-gray-700 dark:text-gray-300"}`}>
                            Daily
                          </span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="frequency"
                            value="weekly"
                            checked={newHabit.frequency === "weekly"}
                            onChange={() => setNewHabit({ ...newHabit, frequency: "weekly" })}
                            className={`h-4 w-4 ${
                              nightMode
                                ? "text-blue-600 focus:ring-blue-500 border-gray-600"
                                : "text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                            }`}
                          />
                          <span className={`ml-2 ${nightMode ? "text-blue-100" : "text-gray-700 dark:text-gray-300"}`}>
                            Weekly
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <motion.button
                        type="button"
                        onClick={() => setShowAddHabitModal(false)}
                        className={`px-4 py-2 border ${
                          nightMode
                            ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        } rounded-lg transition-colors`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        className={`px-4 py-2 ${
                          nightMode ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-600 hover:bg-blue-700"
                        } text-white rounded-lg transition-colors`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Add Habit
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const AnalyticsView = () => {
    const ref = useRef(null);
    const controls = useAnimation();
    const inView = useInView(ref, { once: true, amount: 0.2 });

    useEffect(() => {
        if (inView) {
            controls.start("visible");
        }
    }, [controls, inView]);

    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={`text-2xl font-bold ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"} mb-2`}>
            Analytics Dashboard
          </h1>
          <p className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}>
            Detailed insights into your habits and progress
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Total Habits",
              icon: "📊",
              value: habits.length,
              subtext: `${habits.filter((h) => calculateCompletionPercentage(h) >= 100).length} completed today`,
            },
            {
              title: "Longest Streak",
              icon: "🔥",
              value: `${Math.max(...habits.map((h) => h.streak))} days`,
              subtext: habits.find((h) => h.streak === Math.max(...habits.map((h) => h.streak)))?.name,
            },
            {
              title: "Completion Rate",
              icon: "✅",
              value: `${Math.round(
                (analytics.weeklyCompletion.reduce((acc, curr) => acc + curr.completed, 0) /
                  analytics.weeklyCompletion.reduce((acc, curr) => acc + curr.target, 0)) *
                  100,
              )}%`,
              subtext: "Last 7 days",
            },
            {
              title: "Average Sleep",
              icon: "😴",
              value: `${(analytics.sleepData.reduce((acc, curr) => acc + curr.hours, 0) / analytics.sleepData.length).toFixed(1)} hrs`,
              subtext: "Last 7 days",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              className={`${
                nightMode ? "bg-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-white dark:bg-gray-800"
              } rounded-xl shadow-lg p-6`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"}`}>
                  {stat.title}
                </h3>
                <motion.span className="text-2xl" whileHover={{ scale: 1.2, rotate: 5 }}>
                  {stat.icon}
                </motion.span>
              </div>
              <p className={`text-3xl font-bold ${nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"}`}>
                {stat.value}
              </p>
              <p className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"} mt-2`}>
                {stat.subtext}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            className={`${
              nightMode ? "bg-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-white dark:bg-gray-800"
            } rounded-xl shadow-lg p-6`}
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={fadeIn}
            whileHover={{ y: -5 }}
          >
            <h3
              className={`text-lg font-semibold mb-6 ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"}`}
            >
              Sleep Patterns
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.sleepData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSleepAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={nightMode ? "#3b82f6" : "#8884d8"} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={nightMode ? "#3b82f6" : "#8884d8"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                    stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"}
                  />
                  <YAxis stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"} />
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={nightMode ? "#1e3a8a" : darkMode ? "#374151" : "#e5e7eb"}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: nightMode ? "#1e3a8a" : darkMode ? "#1f2937" : "#ffffff",
                      color: nightMode ? "#dbeafe" : darkMode ? "#ffffff" : "#000000",
                      border: `1px solid ${nightMode ? "#3b82f6" : darkMode ? "#374151" : "#e5e7eb"}`,
                    }}
                    formatter={(value) => [`${value} hours`, "Sleep"]}
                    labelFormatter={(date) => formatDate(date)}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke={nightMode ? "#3b82f6" : "#8884d8"}
                    fillOpacity={1}
                    fill="url(#colorSleepAnalytics)"
                  />
                  <ReferenceLine y={8} stroke="green" strokeDasharray="3 3" label="Target" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <motion.div
                className={`${nightMode ? "bg-purple-900/30" : "bg-purple-50 dark:bg-purple-900/30"} p-3 rounded-lg`}
                whileHover={{ scale: 1.03 }}
              >
                <p className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>Average</p>
                <p className={`text-xl font-semibold ${nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"}`}>
                  {(
                    analytics.sleepData.reduce((acc, curr) => acc + curr.hours, 0) / analytics.sleepData.length
                  ).toFixed(1)}{" "}
                  hrs
                </p>
              </motion.div>
              <motion.div
                className={`${nightMode ? "bg-green-900/30" : "bg-green-50 dark:bg-green-900/30"} p-3 rounded-lg`}
                whileHover={{ scale: 1.03 }}
              >
                <p className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>Best</p>
                <p className={`text-xl font-semibold ${nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"}`}>
                  {Math.max(...analytics.sleepData.map((d) => d.hours)).toFixed(1)} hrs
                </p>
              </motion.div>
              <motion.div
                className={`${nightMode ? "bg-red-900/30" : "bg-red-50 dark:bg-red-900/30"} p-3 rounded-lg`}
                whileHover={{ scale: 1.03 }}
              >
                <p className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>Worst</p>
                <p className={`text-xl font-semibold ${nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"}`}>
                  {Math.min(...analytics.sleepData.map((d) => d.hours)).toFixed(1)} hrs
                </p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className={`${
              nightMode ? "bg-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-white dark:bg-gray-800"
            } rounded-xl shadow-lg p-6`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <h3
              className={`text-lg font-semibold mb-6 ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"}`}
            >
              Water Intake
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.waterData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={nightMode ? "#10b981" : "#82ca9d"} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={nightMode ? "#10b981" : "#82ca9d"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={nightMode ? "#1e3a8a" : darkMode ? "#374151" : "#e5e7eb"}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                    stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"}
                  />
                  <YAxis stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: nightMode ? "#1e3a8a" : darkMode ? "#1f2937" : "#ffffff",
                      color: nightMode ? "#dbeafe" : darkMode ? "#ffffff" : "#000000",
                      border: `1px solid ${nightMode ? "#3b82f6" : darkMode ? "#374151" : "#e5e7eb"}`,
                    }}
                    formatter={(value) => [`${value} glasses`, "Water"]}
                    labelFormatter={(date) => formatDate(date)}
                  />
                  <Area
                    type="monotone"
                    dataKey="glasses"
                    stroke={nightMode ? "#10b981" : "#82ca9d"}
                    fillOpacity={1}
                    fill="url(#colorWater)"
                  />
                  <ReferenceLine y={8} stroke="green" strokeDasharray="3 3" label="Target" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <motion.div
                className={`${nightMode ? "bg-blue-900/30" : "bg-blue-50 dark:bg-blue-900/30"} p-3 rounded-lg`}
                whileHover={{ scale: 1.03 }}
              >
                <p className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>Average</p>
                <p className={`text-xl font-semibold ${nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"}`}>
                  {Math.round(
                    analytics.waterData.reduce((acc, curr) => acc + curr.glasses, 0) / analytics.waterData.length,
                  )}{" "}
                  glasses
                </p>
              </motion.div>
              <motion.div
                className={`${nightMode ? "bg-green-900/30" : "bg-green-50 dark:bg-green-900/30"} p-3 rounded-lg`}
                whileHover={{ scale: 1.03 }}
              >
                <p className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>Best</p>
                <p className={`text-xl font-semibold ${nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"}`}>
                  {Math.max(...analytics.waterData.map((d) => d.glasses))} glasses
                </p>
              </motion.div>
              <motion.div
                className={`${nightMode ? "bg-red-900/30" : "bg-red-50 dark:bg-red-900/30"} p-3 rounded-lg`}
                whileHover={{ scale: 1.03 }}
              >
                <p className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>Worst</p>
                <p className={`text-xl font-semibold ${nightMode ? "text-blue-100" : "text-gray-900 dark:text-white"}`}>
                  {Math.min(...analytics.waterData.map((d) => d.glasses))} glasses
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            className={`${
              nightMode ? "bg-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-white dark:bg-gray-800"
            } rounded-xl shadow-lg p-6`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <h3
              className={`text-lg font-semibold mb-6 ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"}`}
            >
              Screen Time
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.screenTimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={nightMode ? "#f43f5e" : "#ff5252"} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={nightMode ? "#f43f5e" : "#ff5252"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={nightMode ? "#1e3a8a" : darkMode ? "#374151" : "#e5e7eb"}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                    stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"}
                  />
                  <YAxis stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: nightMode ? "#1e3a8a" : darkMode ? "#1f2937" : "#ffffff",
                      color: nightMode ? "#dbeafe" : darkMode ? "#ffffff" : "#000000",
                      border: `1px solid ${nightMode ? "#3b82f6" : darkMode ? "#374151" : "#e5e7eb"}`,
                    }}
                    formatter={(value) => [`${value} hours`, "Screen Time"]}
                    labelFormatter={(date) => formatDate(date)}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke={nightMode ? "#f43f5e" : "#ff5252"}
                    fillOpacity={1}
                    fill="url(#colorScreen)"
                  />
                  <ReferenceLine y={2} stroke="red" strokeDasharray="3 3" label="Target" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <p className={`text-sm ${nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}`}>
                Your average screen time is{" "}
                <span className={`font-semibold ${nightMode ? "text-red-300" : "text-red-600 dark:text-red-400"}`}>
                  {(
                    analytics.screenTimeData.reduce((acc, curr) => acc + curr.hours, 0) /
                    analytics.screenTimeData.length
                  ).toFixed(1)}
                </span>{" "}
                hours per day. Try to keep it under 2 hours for better productivity.
              </p>
            </div>
          </motion.div>

          <motion.div
            className={`${
              nightMode ? "bg-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-white dark:bg-gray-800"
            } rounded-xl shadow-lg p-6`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <h3
              className={`text-lg font-semibold mb-6 ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"}`}
            >
              Mood Tracker
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.moodData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={nightMode ? "#f59e0b" : "#ffc658"} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={nightMode ? "#f59e0b" : "#ffc658"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={nightMode ? "#1e3a8a" : darkMode ? "#374151" : "#e5e7eb"}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                    stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"}
                  />
                  <YAxis
                    stroke={nightMode ? "#93c5fd" : darkMode ? "#9ca3af" : "#6b7280"}
                    domain={[0, 5]}
                    tickFormatter={(value) => {
                      const moods = ["", "Very Bad", "Bad", "Neutral", "Good", "Excellent"]
                      return moods[value] || ""
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: nightMode ? "#1e3a8a" : darkMode ? "#1f2937" : "#ffffff",
                      color: nightMode ? "#dbeafe" : darkMode ? "#ffffff" : "#000000",
                      border: `1px solid ${nightMode ? "#3b82f6" : darkMode ? "#374151" : "#e5e7eb"}`,
                    }}
                    formatter={(value) => {
                      const moods = ["", "Very Bad", "Bad", "Neutral", "Good", "Excellent"]
                      let idx: number
    if (Array.isArray(value)) {
      // grab the first element
      const first = value[0]
      idx = typeof first === "number" ? first : parseInt(first, 10)
    } else if (typeof value === "string") {
      idx = parseInt(value, 10)
    } else {
      idx = value
    }

    // guard out‐of‐bounds just in case
    const label = moods[idx] ?? ""
    return [label, "Mood"]
  }}
  labelFormatter={(date) => formatDate(date)}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={nightMode ? "#f59e0b" : "#ffc658"}
                    fillOpacity={1}
                    fill="url(#colorMood)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <p className={`text-sm ${nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}`}>
                Your average mood this week is{" "}
                <span
                  className={`font-semibold ${nightMode ? "text-yellow-300" : "text-yellow-600 dark:text-yellow-400"}`}
                >
                  {(() => {
                    const avg = Math.round(
                      analytics.moodData.reduce((acc, curr) => acc + curr.value, 0) / analytics.moodData.length,
                    )
                    const moods = ["", "Very Bad", "Bad", "Neutral", "Good", "Excellent"]
                    return moods[avg]
                  })()}
                </span>
                . Habits like meditation and exercise can help improve your mood.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          className={`${
            nightMode ? "bg-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-white dark:bg-gray-800"
          } rounded-xl shadow-lg p-6 mb-8`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          whileHover={{ y: -5 }}
        >
          <h3 className={`text-lg font-semibold mb-6 ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"}`}>
            Habit Correlation Analysis
          </h3>
          <p className={`mb-6 ${nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}`}>
            We've analyzed your habits to find correlations between them. Here are some insights:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              className={`${nightMode ? "bg-gray-700" : "bg-gray-50 dark:bg-gray-700"} p-4 rounded-lg`}
              whileHover={{ scale: 1.02 }}
            >
              <h4 className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"} mb-2`}>
                Sleep & Mood
              </h4>
              <p className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}>
                On days when you sleep more than 7 hours, your mood is typically 30% better than average.
              </p>
            </motion.div>
            <motion.div
              className={`${nightMode ? "bg-gray-700" : "bg-gray-50 dark:bg-gray-700"} p-4 rounded-lg`}
              whileHover={{ scale: 1.02 }}
            >
              <h4 className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"} mb-2`}>
                Exercise & Sleep
              </h4>
              <p className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}>
                Days with at least 30 minutes of exercise correlate with 15% better sleep quality the following night.
              </p>
            </motion.div>
            <motion.div
              className={`${nightMode ? "bg-gray-700" : "bg-gray-50 dark:bg-gray-700"} p-4 rounded-lg`}
              whileHover={{ scale: 1.02 }}
            >
              <h4 className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"} mb-2`}>
                Screen Time & Productivity
              </h4>
              <p className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}>
                Lower screen time days (under 2 hours) show a 25% increase in reading and meditation completion.
              </p>
            </motion.div>
            <motion.div
              className={`${nightMode ? "bg-gray-700" : "bg-gray-50 dark:bg-gray-700"} p-4 rounded-lg`}
              whileHover={{ scale: 1.02 }}
            >
              <h4 className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"} mb-2`}>
                Water & Energy
              </h4>
              <p className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}>
                Days when you drink 8+ glasses of water correlate with higher completion rates across all habits.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    )
  }

  const SettingsView = () => {
    const [editedUser, setEditedUser] = useState<User>(user)
    const [isSaving, setIsSaving] = useState(false)
    const [showSavedMessage, setShowSavedMessage] = useState(false)

    const handleSave = () => {
      setIsSaving(true)
      // Simulate API call
      setTimeout(() => {
        handleSaveSettings(editedUser)
        setIsSaving(false)
        setShowSavedMessage(true)
        setTimeout(() => setShowSavedMessage(false), 3000)
      }, 1000)
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={`text-2xl font-bold ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"} mb-2`}>
            Settings
          </h1>
          <p className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}>
            Customize your HabitSync experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <motion.div
              className={`${
                nightMode ? "bg-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-white dark:bg-gray-800"
              } rounded-xl shadow-lg p-6 sticky top-24`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex flex-col items-center">
                <motion.div
                  className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-blue-500"
                  whileHover={{ scale: 1.05, borderColor: nightMode ? "#60a5fa" : "#3b82f6" }}
                >
                  <img
                    src={editedUser.avatar || "/placeholder.svg"}
                    alt={editedUser.name}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <h2
                  className={`text-xl font-bold ${nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"} mb-1`}
                >
                  {editedUser.name}
                </h2>
                <p className={`text-sm ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"} mb-4`}>
                  {editedUser.email}
                </p>
                <p className={`text-xs ${nightMode ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
                  Member since {new Date(editedUser.joinDate).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3
                  className={`text-sm font-medium ${
                    nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"
                  } mb-4`}
                >
                  Account Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}>
                      Total Habits
                    </span>
                    <span className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"}`}>
                      {habits.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}>
                      Longest Streak
                    </span>
                    <span className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"}`}>
                      {Math.max(...habits.map((h) => h.streak))} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={nightMode ? "text-blue-100" : "text-gray-600 dark:text-gray-400"}>
                      Completion Rate
                    </span>
                    <span className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"}`}>
                      {Math.round(
                        (analytics.weeklyCompletion.reduce((acc, curr) => acc + curr.completed, 0) /
                          analytics.weeklyCompletion.reduce((acc, curr) => acc + curr.target, 0)) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="md:col-span-2">
            <motion.div
              className={`${
                nightMode ? "bg-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-white dark:bg-gray-800"
              } rounded-xl shadow-lg p-6 mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -5 }}
            >
              <h3
                className={`text-lg font-semibold mb-6 ${
                  nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"
                }`}
              >
                Profile Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className={`block text-sm font-medium ${
                      nightMode ? "text-blue-200" : "text-gray-700 dark:text-gray-300"
                    } mb-2`}
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={editedUser.name}
                    onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                    className={`w-full px-3 py-2 border ${
                      nightMode
                        ? "bg-gray-700 border-gray-600 text-blue-100 focus:border-blue-500"
                        : "border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    } rounded-md shadow-sm`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className={`block text-sm font-medium ${
                      nightMode ? "text-blue-200" : "text-gray-700 dark:text-gray-300"
                    } mb-2`}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    className={`w-full px-3 py-2 border ${
                      nightMode
                        ? "bg-gray-700 border-gray-600 text-blue-100 focus:border-blue-500"
                        : "border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    } rounded-md shadow-sm`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="avatar"
                    className={`block text-sm font-medium ${
                      nightMode ? "text-blue-200" : "text-gray-700 dark:text-gray-300"
                    } mb-2`}
                  >
                    Avatar URL
                  </label>
                  <input
                    type="text"
                    id="avatar"
                    value={editedUser.avatar}
                    onChange={(e) => setEditedUser({ ...editedUser, avatar: e.target.value })}
                    className={`w-full px-3 py-2 border ${
                      nightMode
                        ? "bg-gray-700 border-gray-600 text-blue-100 focus:border-blue-500"
                        : "border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    } rounded-md shadow-sm`}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              className={`${
                nightMode ? "bg-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-white dark:bg-gray-800"
              } rounded-xl shadow-lg p-6 mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              <h3
                className={`text-lg font-semibold mb-6 ${
                  nightMode ? "text-blue-300" : "text-gray-900 dark:text-white"
                }`}
              >
                Preferences
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"}`}>
                      Dark Mode
                    </h4>
                    <p className={`text-sm ${nightMode ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                      Enable dark mode for a darker color scheme
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                    <input
                      type="checkbox"
                      id="darkMode"
                      className="absolute w-6 h-6 opacity-0"
                      checked={editedUser.preferences.darkMode}
                      onChange={(e) => {
                        setEditedUser({
                          ...editedUser,
                          preferences: {
                            ...editedUser.preferences,
                            darkMode: e.target.checked,
                          },
                        });
                        // Apply dark mode immediately for better user feedback
                        setDarkMode(e.target.checked);
                      }}
                    />
                    <label
                      htmlFor="darkMode"
                      className={`block w-full h-full overflow-hidden rounded-full cursor-pointer ${
                        editedUser.preferences.darkMode ? "bg-blue-600" : nightMode ? "bg-gray-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute block w-6 h-6 rounded-full transform transition-transform duration-200 ease-in-out bg-white ${
                          editedUser.preferences.darkMode ? "translate-x-6" : "translate-x-0"
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"}`}>
                      Night Mode
                    </h4>
                    <p className={`text-sm ${nightMode ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                      Enable night mode for a blue-tinted dark theme
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                    <input
                      type="checkbox"
                      id="nightMode"
                      className="absolute w-6 h-6 opacity-0"
                      checked={editedUser.preferences.nightMode}
                      onChange={(e) => {
                        setEditedUser({
                          ...editedUser,
                          preferences: {
                            ...editedUser.preferences,
                            nightMode: e.target.checked,
                          },
                        });
                        // Apply night mode immediately for better user feedback
                        setNightMode(e.target.checked);
                      }}
                    />
                    <label
                      htmlFor="nightMode"
                      className={`block w-full h-full overflow-hidden rounded-full cursor-pointer ${
                        editedUser.preferences.nightMode ? "bg-blue-600" : nightMode ? "bg-gray-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute block w-6 h-6 rounded-full transform transition-transform duration-200 ease-in-out bg-white ${
                          editedUser.preferences.nightMode ? "translate-x-6" : "translate-x-0"
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${nightMode ? "text-blue-200" : "text-gray-900 dark:text-white"}`}>
                      Notifications
                    </h4>
                    <p className={`text-sm ${nightMode ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                      Enable notifications for habit reminders
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                    <input
                      type="checkbox"
                      id="notifications"
                      className="absolute w-6 h-6 opacity-0"
                      checked={editedUser.preferences.notifications}
                      onChange={(e) =>
                        setEditedUser({
                          ...editedUser,
                          preferences: {
                            ...editedUser.preferences,
                            notifications: e.target.checked,
                          },
                        })
                      }
                    />
                    <label
                      htmlFor="notifications"
                      className={`block w-full h-full overflow-hidden rounded-full cursor-pointer ${
                        editedUser.preferences.notifications ? "bg-blue-600" : nightMode ? "bg-gray-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute block w-6 h-6 rounded-full transform transition-transform duration-200 ease-in-out bg-white ${
                          editedUser.preferences.notifications ? "translate-x-6" : "translate-x-0"
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reminderTime"
                    className={`block text-sm font-medium ${
                      nightMode ? "text-blue-200" : "text-gray-700 dark:text-gray-300"
                    } mb-2`}
                  >
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    id="reminderTime"
                    value={editedUser.preferences.reminderTime}
                    onChange={(e) =>
                      setEditedUser({
                        ...editedUser,
                        preferences: {
                          ...editedUser.preferences,
                          reminderTime: e.target.value,
                        },
                      })
                    }
                    className={`px-3 py-2 border ${
                      nightMode
                        ? "bg-gray-700 border-gray-600 text-blue-100 focus:border-blue-500"
                        : "border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    } rounded-md shadow-sm`}
                  />
                </div>
              </div>
            </motion.div>

            <div className="flex justify-end">
              <motion.button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-6 py-3 ${
                  nightMode ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-600 hover:bg-blue-700"
                } text-white rounded-lg font-medium transition-colors shadow-lg relative`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
                <AnimatePresence>
                  {showSavedMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute -top-10 right-0 bg-green-500 text-white px-3 py-1 rounded-md text-sm"
                    >
                      Settings saved!
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render the appropriate view based on activeView
  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />
      case "analytics":
        return <AnalyticsView />
      case "settings":
        return <SettingsView />
      default:
        return <HomePage />
    }
  }

  return (
    <div
      className={`min-h-screen pt-16 ${
        darkMode ? "bg-gray-900 text-white" : nightMode ? "bg-gray-900 text-blue-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Navbar />

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {renderView()}
          <Footer />
        </>
      )}

      <AnimatePresence>
        {showHumorModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`${
                nightMode ? "bg-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-white dark:bg-gray-800"
              } rounded-xl shadow-lg p-6 mb-8`}
            >
              {/* Modal content would go here */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
