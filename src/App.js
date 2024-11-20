import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  isPast,
  isFuture,
  startOfToday,
  startOfDay,
  addDays
} from 'date-fns';
import { ReactComponent as LogoV } from './Logo-V.svg'; // Import as React component

const supabaseUrl = 'https://ehgfrephppdiipnyulsq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoZ2ZyZXBocHBkaWlwbnl1bHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4ODYxNzcsImV4cCI6MjA0NzQ2MjE3N30.j6TucW-RnuDgPaBvl74pnX2PMQQFM1fjxavf20k3Gwc';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Move AuthForm outside of App component
const AuthForm = ({ 
  authMode, 
  setAuthMode, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  handleSignIn, 
  handleSignUp, 
  authError,
  name,
  setName 
}) => {
  // Update name extraction to get the full name from email
  useEffect(() => {
    if (authMode === 'signup' && email) {
      // Only set the default name if there isn't already a manually entered name
      // or if we're switching to signup mode
      const defaultName = email.split('@')[0]
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      setName(defaultName);
    }
  }, [email, authMode]); // Remove name and setName from dependencies

  // Update mode switch to handle name properly
  const handleModeSwitch = () => {
    const newMode = authMode === 'signin' ? 'signup' : 'signin';
    setAuthMode(newMode);
    
    // Reset name when switching to signin, set default name when switching to signup
    if (newMode === 'signin') {
      setName('');
    } else if (email) {
      const defaultName = email.split('@')[0]
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      setName(defaultName);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B365D] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center items-center">
          <h1 className="text-center text-5xl font-extrabold text-white mb-4">
            a·<span className="text-[#FF4B12]">V</span>·lblity
          </h1>
        </div>
        <h2 className="text-center text-xl text-gray-300">
          {authMode === 'signin' ? 'Sign in to your account' : 'Create new account'}
        </h2>
        <form className="mt-8 space-y-6" onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {authMode === 'signup' && (
              <div>
                <input
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <input
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${
                  authMode === 'signup' ? '' : 'rounded-b-md'
                } focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {authError && (
            <div className="text-[#FF4B12] text-sm text-center">
              {authError}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {authMode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={handleModeSwitch}
            className="text-sm text-[#FF4B12] hover:text-[#FF6B35]"
          >
            {authMode === 'signin' 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add this function at the top level to generate distinct colors
const generateDistinctColors = (count) => {
  const hueStep = 360 / count;
  return Array.from({ length: count }, (_, i) => {
    const hue = i * hueStep;
    return `hsl(${hue}, 70%, 85%)`; // Light pastel colors
  });
};

function App() {
  const [session, setSession] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [presenceData, setPresenceData] = useState({});
  const [userProfiles, setUserProfiles] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [name, setName] = useState('');
  const [userColors, setUserColors] = useState({});
  const [confirmDate, setConfirmDate] = useState(null);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      // Initial data fetch
      Promise.all([
        fetchPresenceData(),
        fetchAllUserProfiles()
      ]);

      // Set up real-time subscription
      const channel = supabase
        .channel('office_presence_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'office_presence'
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            
            if (payload.eventType === 'DELETE') {
              setPresenceData(current => {
                const newData = { ...current };
                const { date, user_id } = payload.old;
                if (newData[date]?.[user_id]) {
                  delete newData[date][user_id];
                }
                return newData;
              });
            } else {
              setPresenceData(current => {
                const newData = { ...current };
                const { date, user_id } = payload.new;
                if (!newData[date]) {
                  newData[date] = {};
                }
                newData[date][user_id] = payload.new;
                return newData;
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });

      // Check if user has seen the welcome guide
      const hasSeenGuide = localStorage.getItem('hasSeenWelcomeGuide');
      if (!hasSeenGuide) {
        setShowWelcomeGuide(true);
      }

      return () => {
        console.log('Cleaning up subscription');
        channel.unsubscribe();
      };
    }
  }, [session]);

  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return;
    }

    if (data) {
      setName(data.name);
    }
  };

  const fetchAllUserProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email');

    if (error) {
      console.error('Error fetching user profiles:', error);
      return;
    }

    const profileMap = {};
    data.forEach(profile => {
      profileMap[profile.id] = profile;
    });
    setUserProfiles(profileMap);
  };

  // Add this function to assign colors to users
  const assignColorsToActiveUsers = (presenceData) => {
    // Get unique users who are present in the current week
    const activeUsers = new Set();
    Object.values(presenceData).forEach(dayPresence => {
      Object.entries(dayPresence).forEach(([userId, presence]) => {
        if (presence.in_office) {
          activeUsers.add(userId);
        }
      });
    });

    const colors = generateDistinctColors(activeUsers.size);
    const newUserColors = {};
    [...activeUsers].forEach((userId, index) => {
      newUserColors[userId] = colors[index];
    });
    setUserColors(newUserColors);
  };

  const fetchPresenceData = async () => {
    // Get start of current month and end of next month
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(addMonths(currentMonth, 1)), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('office_presence')
      .select('*')
      .gte('date', start)
      .lte('date', end);

    if (error) {
      console.error('Error fetching presence data:', error);
      return;
    }

    const organized = {};
    data.forEach(record => {
      if (!organized[record.date]) {
        organized[record.date] = {};
      }
      organized[record.date][record.user_id] = record;
    });
    setPresenceData(organized);
    assignColorsToActiveUsers(organized);
  };

  const togglePresence = async (date) => {
    if (!session?.user) return;
    
    const today = startOfDay(new Date());
    const targetDate = startOfDay(date);
    if (targetDate < today) {
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const currentPresence = presenceData[dateStr]?.[session.user.id];

    try {
      if (currentPresence) {
        // Delete presence
        const { error } = await supabase
          .from('office_presence')
          .delete()
          .match({ user_id: session.user.id, date: dateStr });

        if (error) throw error;

        // Optimistically update local state
        setPresenceData(current => {
          const newData = { ...current };
          if (newData[dateStr]) {
            delete newData[dateStr][session.user.id];
          }
          return newData;
        });
      } else {
        // Insert presence
        const { error } = await supabase
          .from('office_presence')
          .insert({
            user_id: session.user.id,
            date: dateStr,
            in_office: true,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        // Optimistically update local state
        setPresenceData(current => {
          const newData = { ...current };
          if (!newData[dateStr]) {
            newData[dateStr] = {};
          }
          newData[dateStr][session.user.id] = {
            user_id: session.user.id,
            date: dateStr,
            in_office: true,
            updated_at: new Date().toISOString()
          };
          return newData;
        });
      }
    } catch (error) {
      console.error('Error toggling presence:', error);
      // Refresh data in case of error
      fetchPresenceData();
    }
  };

  const renderMonth = (date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex justify-between items-center p-2 sm:p-4">
          <h2 className="text-lg sm:text-xl font-bold">
            {format(date, 'MMMM yyyy')}
          </h2>
        </div>

        <div className="grid grid-cols-7 gap-px border-t border-gray-200">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-semibold">
              {day}
            </div>
          ))}

          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayPresence = presenceData[dateStr] || {};
            const inOfficeUsers = Object.entries(dayPresence)
              .filter(([_, presence]) => presence.in_office)
              .map(([userId]) => ({
                name: userProfiles[userId]?.name || 'Unknown',
                color: userColors[userId]
              }));
            const isPastDay = isPast(day) && !isToday(day);
            const isCurrentUserPresent = dayPresence[session?.user?.id]?.in_office;

            return (
              <div
                key={dateStr}
                className={`
                  min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 border-t border-l relative
                  ${isToday(day) ? 'bg-blue-100 ring-2 ring-blue-400' : ''}
                  ${!isSameMonth(day, date) ? 'bg-gray-100' : 'bg-white'}
                  ${isPastDay ? 'bg-gray-200 opacity-50' : ''}
                  ${isCurrentUserPresent && !isPastDay ? 'bg-green-50' : ''}
                  ${isPastDay ? 'cursor-not-allowed' : 'cursor-pointer'}
                  group
                `}
                onDoubleClick={() => {
                  if (!isPastDay && !isQuickActionOpen) {
                    togglePresence(day);
                  }
                }}
              >
                <div className={`
                  relative z-10
                  text-xs sm:text-sm font-semibold mb-1 
                  ${isPastDay ? 'text-gray-500' : ''}
                  ${isToday(day) ? 'text-blue-700' : ''}
                `}>
                  {format(day, 'd')}
                </div>
                
                <div className="relative z-10">
                  <div className="space-y-0.5 sm:space-y-1 overflow-y-auto max-h-[50px] sm:max-h-[80px] relative">
                    {inOfficeUsers.slice(0, 3).map(({ name, color }, i) => (
                      <div 
                        key={i}
                        className="text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate"
                        style={{ 
                          backgroundColor: color || 'rgb(220, 252, 231)',
                          opacity: isPastDay ? 0.5 : 1
                        }}
                        title={name}
                      >
                        {name}
                      </div>
                    ))}
                    {inOfficeUsers.length > 3 && (
                      <div 
                        className="text-[10px] sm:text-xs text-gray-500 font-medium overflow-area cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        +{inOfficeUsers.length - 3} more
                      </div>
                    )}
                  </div>
                  
                  {inOfficeUsers.length > 3 && (
                    <div 
                      className="absolute left-0 top-0 mt-1 hidden group-hover:block bg-white border rounded-lg shadow-lg p-2 z-20 w-48 overflow-area"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-xs font-medium mb-1">All present:</div>
                      {inOfficeUsers.map(({ name, color }, i) => (
                        <div 
                          key={i}
                          className="text-xs p-0.5 rounded mb-1"
                          style={{ 
                            backgroundColor: color || 'rgb(220, 252, 231)',
                            opacity: isPastDay ? 0.5 : 1
                          }}
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-center items-center space-x-4 p-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="px-3 py-1 rounded text-white hover:bg-[#FF4B12]"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1 rounded text-white hover:bg-[#FF4B12]"
          >
            Today
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="px-3 py-1 rounded text-white hover:bg-[#FF4B12]"
          >
            →
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderMonth(currentMonth)}
          {renderMonth(addMonths(currentMonth, 1))}
        </div>
      </div>
    );
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (!name.trim()) {
      setAuthError('Please enter your name');
      return;
    }

    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setAuthError(signUpError.message);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, email, name }]);

    if (profileError) {
      console.error('Error creating profile:', profileError);
      setAuthError('Error creating profile');
    } else {
      setAuthError('Check your email for the confirmation link.');
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  const handleDayClick = (day, isCurrentUserPresent) => {
    if (isPast(startOfDay(day)) && !isToday(day)) return;
    
    if (isCurrentUserPresent) {
      setConfirmDate(day);
    } else {
      togglePresence(day);
    }
  };

  const ConfirmDialog = () => {
    if (!confirmDate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">
            Remove office presence?
          </h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to remove your presence for {format(confirmDate, 'MMMM d, yyyy')}?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmDate(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                togglePresence(confirmDate);
                setConfirmDate(null);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add Quick Action Menu component
  const QuickActionMenu = () => {
    if (!isQuickActionOpen) return null;

    const today = new Date();
    const dates = Array.from({ length: 5 }, (_, i) => addDays(today, i));

    return (
      <div className="fixed inset-0 bg-black bg-opacity-25 flex items-end sm:items-center justify-center z-50">
        <div className="bg-white rounded-t-lg sm:rounded-lg p-4 w-full sm:w-96 max-w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Quick Toggle Presence</h3>
            <button
              onClick={() => setIsQuickActionOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {dates.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isPresent = presenceData[dateStr]?.[session?.user?.id]?.in_office;
              
              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    togglePresence(date);
                    // Don't close menu to allow multiple toggles
                  }}
                  className={`
                    w-full p-3 rounded-lg flex items-center justify-between
                    ${isPresent ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-100 hover:bg-gray-200'}
                    transition-colors
                  `}
                >
                  <span className="font-medium">
                    {isToday(date) ? 'Today' : format(date, 'EEEE, MMM d')}
                  </span>
                  <span className={`text-sm ${isPresent ? 'text-green-600' : 'text-gray-500'}`}>
                    {isPresent ? 'Will be in office' : 'Not in office'}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setIsQuickActionOpen(false)}
            className="w-full mt-4 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  // Add Floating Action Button
  const FloatingActionButton = () => (
    <button
      onClick={() => setIsQuickActionOpen(true)}
      className="fixed bottom-4 right-4 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center z-40"
    >
      <span className="text-2xl">+</span>
    </button>
  );

  // Keep the simple WelcomeGuide component
  const WelcomeGuide = () => {
    if (!showWelcomeGuide) return null;

    const handleClose = () => {
      localStorage.setItem('hasSeenWelcomeGuide', 'true');
      setShowWelcomeGuide(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold">Welcome to Office Presence!</h3>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="mt-4 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                1
              </div>
              <p className="text-gray-600">
                Double-click/tap any date to toggle your presence for that day
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                2
              </div>
              <p className="text-gray-600">
                Days highlighted in green are those where people will be in the office
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                3
              </div>
              <p className="text-gray-600">
                Hover over busy days to see everyone who'll be present
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="mt-6 w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Got it!
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#1B365D] min-h-screen">
      <div className="container mx-auto px-1 sm:px-4 py-2 sm:py-4">
        {!session ? (
          <AuthForm 
            authMode={authMode}
            setAuthMode={setAuthMode}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            handleSignIn={handleSignIn}
            handleSignUp={handleSignUp}
            authError={authError}
            name={name}
            setName={setName}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">a·<span className="text-[#FF4B12]">V</span>·lblity</h1>
                <p className="text-sm sm:text-base text-gray-300">
                  Welcome, {userProfiles[session.user.id]?.name || 'Loading...'}
                </p>
              </div>
              <div className="flex w-full sm:w-auto space-x-2">
                <button
                  onClick={() => setShowWelcomeGuide(true)}
                  className="px-4 py-2 text-white border border-white rounded hover:bg-[#FF4B12] hover:text-white"
                >
                  Help
                </button>
                <button 
                  onClick={handleSignOut}
                  className="w-full sm:w-auto bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm sm:text-base"
                >
                  Sign Out
                </button>
              </div>
            </div>
            {renderCalendar()}
            <FloatingActionButton />
            <QuickActionMenu />
            <ConfirmDialog />
            <WelcomeGuide />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
