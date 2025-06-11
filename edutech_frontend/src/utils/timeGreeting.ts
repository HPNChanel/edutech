export interface TimeGreeting {
  greeting: string
  timeOfDay: 'morning' | 'afternoon' | 'evening'
}

export const getTimeBasedGreeting = (): TimeGreeting => {
  const currentHour = new Date().getHours()
  
  if (currentHour < 12) {
    return {
      greeting: 'Good Morning',
      timeOfDay: 'morning'
    }
  } else if (currentHour < 17) {
    return {
      greeting: 'Good Afternoon', 
      timeOfDay: 'afternoon'
    }
  } else {
    return {
      greeting: 'Good Evening',
      timeOfDay: 'evening'
    }
  }
}

export const motivationalQuotes = [
  "Are you ready to conquer your learning goals today?",
  "Every expert was once a beginner. Keep learning!",
  "The only way to do great work is to love what you do.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Learning never exhausts the mind. Let's dive in!",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Education is the most powerful weapon which you can use to change the world.",
  "Live as if you were to die tomorrow. Learn as if you were to live forever.",
  "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
  "Invest in yourself. Your career is the engine of your wealth.",
  "Knowledge is power, but enthusiasm pulls the switch.",
  "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
  "Learning is a treasure that will follow its owner everywhere.",
  "Today is a great day to learn something new!",
  "Your potential is endless. Let's unlock it together!",
  "Small steps every day lead to big breakthroughs.",
  "Curiosity is the engine of achievement.",
  "The future belongs to those who learn more skills and combine them in creative ways.",
  "Progress, not perfection. Every step counts!",
  "Knowledge is like a garden: if it is not cultivated, it cannot be harvested."
]

export const getRandomQuote = (): string => {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
}

export const getPersonalizedWelcome = (userName?: string): { greeting: string; quote: string } => {
  const { greeting } = getTimeBasedGreeting()
  const quote = getRandomQuote()
  
  return {
    greeting: `${greeting}, ${userName || 'Learner'}!`,
    quote
  }
} 