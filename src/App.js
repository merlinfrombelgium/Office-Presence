import React, { useState, useEffect } from 'react';
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
  startOfDay
} from 'date-fns';

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
  // Auto-fill name when email changes, but only if name is empty
  useEffect(() => {
    if (authMode === 'signup' && email && !name) {
      const defaultName = email.split('@')[0];
      setName(defaultName);
    }
  }, [email, authMode, name]);

  // Reset form when switching modes
  const handleModeSwitch = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {authMode === 'signin' ? 'Sign in to your account' : 'Create new account'}
          </h2>
        </div>
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
            <div className="text-red-500 text-sm text-center">
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
            className="text-sm text-blue-600 hover:text-blue-500"
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
  const [isLegendOpen, setIsLegendOpen] = useState(false);

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
                  ${isPastDay ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
                `}
                onClick={() => !isPastDay && togglePresence(day)}
              >
                <div className={`
                  text-xs sm:text-sm font-semibold mb-1 
                  ${isPastDay ? 'text-gray-500' : ''}
                  ${isToday(day) ? 'text-blue-700' : ''}
                `}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5 sm:space-y-1 overflow-y-auto max-h-[50px] sm:max-h-[80px]">
                  {inOfficeUsers.map(({ name, color }, i) => (
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
            className="px-3 py-1 rounded hover:bg-gray-100"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1 rounded hover:bg-gray-100"
          >
            Today
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="px-3 py-1 rounded hover:bg-gray-100"
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

  const renderLegend = () => {
    const activeUsers = new Set();
    Object.values(presenceData).forEach(dayPresence => {
      Object.entries(dayPresence).forEach(([userId, presence]) => {
        if (presence.in_office) {
          activeUsers.add(userId);
        }
      });
    });

    return (
      <div 
        className={`
          fixed top-0 right-0 h-full bg-white shadow-lg w-64 transform transition-transform duration-300 ease-in-out
          ${isLegendOpen ? 'translate-x-0' : 'translate-x-full'}
          z-50
        `}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <button
              onClick={() => setIsLegendOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {Array.from(activeUsers).map(userId => (
              <div 
                key={userId}
                className="flex items-center p-2 rounded"
                style={{ 
                  backgroundColor: userColors[userId] || 'rgb(220, 252, 231)'
                }}
              >
                <span className="text-sm">
                  {userProfiles[userId]?.name || 'Unknown'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-50"></div>
                <span className="text-sm">Today</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-50"></div>
                <span className="text-sm">Your selected days</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 opacity-50"></div>
                <span className="text-sm">Past days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
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
              <h1 className="text-xl sm:text-2xl font-bold">Office Presence Calendar</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Welcome, {userProfiles[session.user.id]?.name || 'Loading...'}
              </p>
            </div>
            <div className="flex w-full sm:w-auto space-x-2">
              <button
                onClick={() => setIsLegendOpen(true)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
              >
                Show Legend
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
          {renderLegend()}
          {isLegendOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
              onClick={() => setIsLegendOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
