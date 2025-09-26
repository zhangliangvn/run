// ============================================
// TRAINING DATA CONFIGURATION
// Chỉnh sửa file này để thay đổi lịch tập luyện
// ============================================

const TRAINING_CONFIG = {
  program: {
    name: "Marathon Sub 4:30",
    target: "Sub 4 hours 30 minutes",
    startDate: "26/09/2025",
    raceDate: "30/11/2025",
    totalWeeks: 10,
    description: "Chương trình tập luyện Marathon cho mục tiêu dưới 4:30"
  },
  
  workouts: [
    {
      date: "26/09/2025",
      day: "Friday",
      workout: "Easy",
      distance: 6,
      description: "6 km @6:30/km",
      notes: "Shake-out before weekend long run"
    },
    {
      date: "27/09/2025",
      day: "Saturday",
      workout: "Rest",
      distance: 0,
      description: "Rest day",
      notes: ""
    },
    {
      date: "28/09/2025",
      day: "Sunday",
      workout: "Long run",
      distance: 20,
      description: "20 km @6:20—6:30/km",
      notes: "2 gels, salt GU 1 cap/45—60', fluids 500—750 ml/10—12 km."
    },
    {
      date: "29/09/2025",
      day: "Monday",
      workout: "Core",
      distance: 2,
      description: "Run 2—3 km + Core workout",
      notes: ""
    },
    {
      date: "30/09/2025",
      day: "Tuesday",
      workout: "Interval",
      distance: 8,
      description: "6 × 800m @4:40—4:50/km | Rest 2:30 jog",
      notes: "High intensity VO2max session"
    },
    {
      date: "01/10/2025",
      day: "Wednesday",
      workout: "Easy",
      distance: 7,
      description: "7 km @6:30/km",
      notes: ""
    },
    {
      date: "02/10/2025",
      day: "Thursday",
      workout: "Core",
      distance: 2,
      description: "Run 2—3 km + Core workout",
      notes: ""
    },
    {
      date: "03/10/2025",
      day: "Friday",
      workout: "Tempo",
      distance: 8,
      description: "8 km @5:45—6:10/km",
      notes: ""
    },
    {
      date: "04/10/2025",
      day: "Saturday",
      workout: "Rest",
      distance: 0,
      description: "Rest day",
      notes: ""
    },
    {
      date: "05/10/2025",
      day: "Sunday",
      workout: "Long run",
      distance: 24,
      description: "24 km @6:15—6:25/km",
      notes: "Hydration and gels every 8—10 km"
    },
    {
      date: "06/10/2025",
      day: "Monday",
      workout: "Core",
      distance: 3,
      description: "Run 3 km + Core workout",
      notes: ""
    },
    {
      date: "07/10/2025",
      day: "Tuesday",
      workout: "Interval",
      distance: 10,
      description: "8 × 600m @4:30—4:40/km | Rest 2:00 jog",
      notes: ""
    },
    {
      date: "08/10/2025",
      day: "Wednesday",
      workout: "Easy",
      distance: 8,
      description: "8 km @6:30/km",
      notes: ""
    },
    {
      date: "09/10/2025",
      day: "Thursday",
      workout: "Core",
      distance: 3,
      description: "Run 3 km + Core workout",
      notes: ""
    },
    {
      date: "10/10/2025",
      day: "Friday",
      workout: "Tempo",
      distance: 10,
      description: "10 km @5:40—6:00/km",
      notes: "Steady effort"
    },
    {
      date: "11/10/2025",
      day: "Saturday",
      workout: "Rest",
      distance: 0,
      description: "Rest day",
      notes: ""
    },
    {
      date: "12/10/2025",
      day: "Sunday",
      workout: "Long run",
      distance: 26,
      description: "26 km @6:10—6:20/km",
      notes: "Practice race nutrition strategy"
    },
    {
      date: "13/10/2025",
      day: "Monday",
      workout: "Core",
      distance: 3,
      description: "Run 3 km + Core workout",
      notes: ""
    },
    {
      date: "14/10/2025",
      day: "Tuesday",
      workout: "Interval",
      distance: 12,
      description: "5 × 1km @4:45—4:55/km | Rest 2:30 jog",
      notes: ""
    },
    {
      date: "15/10/2025",
      day: "Wednesday",
      workout: "Easy",
      distance: 8,
      description: "8 km @6:30/km",
      notes: ""
    },
    {
      date: "16/10/2025",
      day: "Thursday",
      workout: "Core",
      distance: 4,
      description: "Run 4 km + Core workout",
      notes: ""
    },
    {
      date: "17/10/2025",
      day: "Friday",
      workout: "Tempo",
      distance: 12,
      description: "12 km @5:35—5:55/km",
      notes: "Progressive tempo"
    },
    {
      date: "18/10/2025",
      day: "Saturday",
      workout: "Rest",
      distance: 0,
      description: "Rest day",
      notes: ""
    },
    {
      date: "19/10/2025",
      day: "Sunday",
      workout: "Long run",
      distance: 28,
      description: "28 km @6:05—6:15/km",
      notes: "Full race simulation with nutrition"
    },
    {
      date: "20/10/2025",
      day: "Monday",
      workout: "Core",
      distance: 4,
      description: "Run 4 km + Core workout",
      notes: ""
    },
    {
      date: "21/10/2025",
      day: "Tuesday",
      workout: "Interval",
      distance: 12,
      description: "4 × 1200m @4:50—5:00/km | Rest 3:00 jog",
      notes: ""
    },
    {
      date: "22/10/2025",
      day: "Wednesday",
      workout: "Easy",
      distance: 9,
      description: "9 km @6:30/km",
      notes: ""
    },
    {
      date: "23/10/2025",
      day: "Thursday",
      workout: "Core",
      distance: 4,
      description: "Run 4 km + Core workout",
      notes: ""
    },
    {
      date: "24/10/2025",
      day: "Friday",
      workout: "Tempo",
      distance: 14,
      description: "14 km @5:30—5:50/km",
      notes: "Marathon pace practice"
    },
    {
      date: "25/10/2025",
      day: "Saturday",
      workout: "Rest",
      distance: 0,
      description: "Rest day",
      notes: ""
    },
    {
      date: "26/10/2025",
      day: "Sunday",
      workout: "Long run",
      distance: 30,
      description: "30 km @6:00—6:10/km",
      notes: "Peak long run - full nutrition practice"
    },
    {
      date: "27/10/2025",
      day: "Monday",
      workout: "Core",
      distance: 4,
      description: "Run 4 km + Core workout",
      notes: ""
    },
    {
      date: "28/10/2025",
      day: "Tuesday",
      workout: "Interval",
      distance: 10,
      description: "6 × 800m @4:40—4:50/km | Rest 2:30 jog",
      notes: "Maintain speed"
    },
    {
      date: "29/10/2025",
      day: "Wednesday",
      workout: "Easy",
      distance: 10,
      description: "10 km @6:30/km",
      notes: ""
    },
    {
      date: "30/10/2025",
      day: "Thursday",
      workout: "Core",
      distance: 4,
      description: "Run 4 km + Core workout",
      notes: ""
    },
    {
      date: "31/10/2025",
      day: "Friday",
      workout: "Tempo",
      distance: 12,
      description: "12 km @5:35—5:55/km",
      notes: ""
    },
    {
      date: "01/11/2025",
      day: "Saturday",
      workout: "Rest",
      distance: 0,
      description: "Rest day",
      notes: ""
    },
    {
      date: "02/11/2025",
      day: "Sunday",
      workout: "Long run",
      distance: 32,
      description: "32 km @5:55—6:05/km",
      notes: "Last peak long run"
    },
    {
      date: "03/11/2025",
      day: "Monday",
      workout: "Core",
      distance: 4,
      description: "Run 4 km + Core workout",
      notes: ""
    },
    {
      date: "04/11/2025",
      day: "Tuesday",
      workout: "Interval",
      distance: 8,
      description: "5 × 600m @4:30—4:40/km | Rest 2:00 jog",
      notes: "Speed maintenance"
    },
    {
      date: "05/11/2025",
      day: "Wednesday",
      workout: "Easy",
      distance: 8,
      description: "8 km @6:30/km",
      notes: ""
    },
    {
      date: "06/11/2025",
      day: "Thursday",
      workout: "Core",
      distance: 3,
      description: "Run 3 km + Core workout",
      notes: ""
    },
    {
      date: "07/11/2025",
      day: "Friday",
      workout: "Tempo",
      distance: 10,
      description: "10 km @5:40—6:00/km",
      notes: ""
    },
    {
      date: "08/11/2025",
      day: "Saturday",
      workout: "Rest",
      distance: 0,
      description: "Rest day",
      notes: ""
    },
    {
      date: "09/11/2025",
      day: "Sunday",
      workout: "Long run",
      distance: 25,
      description: "25 km @6:00—6:10/km",
      notes: "Taper begins - reduced volume"
    },
    {
      date: "10/11/2025",
      day: "Monday",
      workout: "Core",
      distance: 3,
      description: "Run 3 km + Core workout",
      notes: ""
    },
    {
      date: "11/11/2025",
      day: "Tuesday",
      workout: "Interval",
      distance: 6,
      description: "4 × 400m @4:20—4:30/km | Rest 2:00 jog",
      notes: "Sharp but short"
    },
    {
      date: "12/11/2025",
      day: "Wednesday",
      workout: "Easy",
      distance: 6,
      description: "6 km @6:30/km",
      notes: ""
    },
    {
      date: "13/11/2025",
      day: "Thursday",
      workout: "Core",
      distance: 2,
      description: "Run 2 km + Light core",
      notes: ""
    },
    {
      date: "14/11/2025",
      day: "Friday",
      workout: "Tempo",
      distance: 8,
      description: "8 km @5:45—6:10/km",
      notes: "Race pace feel"
    },
    {
      date: "15/11/2025",
      day: "Saturday",
      workout: "Rest",
      distance: 0,
      description: "Rest day",
      notes: ""
    },
    {
      date: "16/11/2025",
      day: "Sunday",
      workout: "Long run",
      distance: 20,
      description: "20 km @6:00—6:10/km",
      notes: "Last long run before race"
    },
    {
      date: "17/11/2025",
      day: "Monday",
      workout: "Core",
      distance: 2,
      description: "Run 2 km + Light core",
      notes: ""
    },
    {
      date: "18/11/2025",
      day: "Tuesday",
      workout: "Interval",
      distance: 5,
      description: "3 × 400m @4:20—4:30/km | Rest 2:00 jog",
      notes: "Stay sharp"
    },
    {
      date: "19/11/2025",
      day: "Wednesday",
      workout: "Easy",
      distance: 5,
      description: "5 km @6:30/km",
      notes: ""
    },
    {
      date: "20/11/2025",
      day: "Thursday",
      workout: "Rest",
      distance: 0,
      description: "Rest day",
      notes: ""
    },
    {
      date: "21/11/2025",
      day: "Friday",
      workout: "Easy",
      distance: 6,
      description: "6 km @6:30/km",
      notes: "Pre-race shakeout"
    },
    {
      date: "22/11/2025",
      day: "Saturday",
      workout: "Rest",
      distance: 0,
      description: "Rest day",
      notes: ""
    },
    {
      date: "23/11/2025",
      day: "Sunday",
      workout: "Long run",
      distance: 15,
      description: "15 km @6:10—6:20/km",
      notes: "Final tune-up"
    },
    {
      date: "24/11/2025",
      day: "Monday",
      workout: "Rest",
      distance: 0,
      description: "Rest day",
      notes: ""
    },
    {
      date: "25/11/2025",
      day: "Tuesday",
      workout: "Easy",
      distance: 4,
      description: "4 km @6:30/km",
      notes: "Stay loose"
    },
    {
      date: "26/11/2025",
      day: "Wednesday",
      workout: "Easy",
      distance: 3,
      description: "3 km @6:30/km + 4 × 100m strides",
      notes: "Race week"
    },
    {
      date: "27/11/2025",
      day: "Thursday",
      workout: "Rest",
      distance: 0,
      description: "Rest day",
      notes: "Hydrate well"
    },
    {
      date: "28/11/2025",
      day: "Friday",
      workout: "Easy",
      distance: 2,
      description: "2 km @6:30/km",
      notes: "Final shakeout"
    },
    {
      date: "29/11/2025",
      day: "Saturday",
      workout: "Rest",
      distance: 0,
      description: "Rest day",
      notes: "Race prep - early bed"
    },
    {
      date: "30/11/2025",
      day: "Sunday",
      workout: "RACE",
      distance: 42.195,
      description: "MARATHON RACE DAY",
      notes: "Target: Sub 4:30 - Good luck!"
    }
  ]
};

// Export cho sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TRAINING_CONFIG;
}