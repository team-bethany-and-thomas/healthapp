"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import SideBar from '@/components/ui/SideBar';
import { 
  Heart, 
  Calendar, 
  CalendarPlus, 
  Pill, 
  FileText, 
  Mail, 
  Bell, 
  ChevronDown, 
  Edit, 
  X, 
  Check, 
  Clock, 
  AlertTriangle, 
  ClipboardCheck,
  Activity
} from 'lucide-react';

interface Appointment {
  id: string;
  title: string;
  doctor: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface HealthMetric {
  name: string;
  value: string;
  status: 'normal' | 'monitor' | 'high';
  lastReading: string;
}

interface Activity {
  id: string;
  title: string;
  time: string;
  type: 'check' | 'file' | 'message' | 'pill';
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const PatientDashboard: React.FC = () => {
  const [notifications, setNotifications] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);

  const appointments: Appointment[] = [
    {
      id: '1',
      title: 'Annual Physical',
      doctor: 'Dr. Sarah Johnson',
      date: 'March 15, 2025',
      time: '2:00 PM',
      status: 'confirmed'
    },
    {
      id: '2',
      title: 'Blood Work Follow-up',
      doctor: 'Dr. Michael Chen',
      date: 'March 22, 2025',
      time: '9:30 AM',
      status: 'pending'
    },
    {
      id: '3',
      title: 'Cardiology Consultation',
      doctor: 'Dr. Emily Rodriguez',
      date: 'April 5, 2025',
      time: '11:00 AM',
      status: 'confirmed'
    }
  ];

  const healthMetrics: HealthMetric[] = [
    {
      name: 'Blood Pressure',
      value: 'Normal',
      status: 'normal',
      lastReading: 'Last reading: 120/80 mmHg'
    },
    {
      name: 'Cholesterol',
      value: 'Monitor',
      status: 'monitor',
      lastReading: 'Last test: 195 mg/dL'
    },
    {
      name: 'BMI',
      value: 'Normal',
      status: 'normal',
      lastReading: 'Current: 23.5'
    }
  ];

  const recentActivities: Activity[] = [
    {
      id: '1',
      title: 'Blood pressure reading uploaded',
      time: '2 hours ago',
      type: 'check'
    },
    {
      id: '2',
      title: 'Lab results available',
      time: 'Yesterday at 3:45 PM',
      type: 'file'
    },
    {
      id: '3',
      title: 'Message from Dr. Johnson',
      time: 'March 10, 2025',
      type: 'message'
    },
    {
      id: '4',
      title: 'Prescription refill completed',
      time: 'March 8, 2025',
      type: 'pill'
    }
  ];

  const pendingTasks: Task[] = [
    {
      id: '1',
      title: 'Complete Pre-Visit Form',
      description: 'Due before March 15th appointment',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Update Insurance Information',
      description: 'Verify current coverage',
      priority: 'medium'
    }
  ];

  const quickStats = [
    { label: 'Visits This Year', value: '12', color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Prescriptions', value: '3', color: 'bg-green-50 text-green-600' },
    { label: 'Completed Forms', value: '5', color: 'bg-purple-50 text-purple-600' },
    { label: 'Pending Tests', value: '2', color: 'bg-amber-50 text-amber-600' }
  ];

  const handleQuickAction = (action: string) => {
    const messages: Record<string, string> = {
      'book': 'Redirecting to appointment booking...',
      'prescriptions': 'Loading your prescriptions...',
      'results': 'Accessing test results...',
      'messages': 'Opening message center...'
    };
    
    showNotificationMessage(messages[action]);
  };

  const showNotificationMessage = (message: string) => {
    setNotifications(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const handleAppointmentEdit = () => {
    showNotificationMessage('Opening appointment editor...');
  };

  const handleAppointmentCancel = () => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      showNotificationMessage('Appointment cancelled successfully');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-amber-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'monitor': return 'text-amber-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'check': return <Check className="w-4 h-4 text-green-600" />;
      case 'file': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'message': return <Mail className="w-4 h-4 text-purple-600" />;
      case 'pill': return <Pill className="w-4 h-4 text-amber-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-base-200" data-theme="light">
      <SideBar />
      <div className="flex-1">
        {/* Navigation */}
        <div className="navbar bg-base-100 shadow-sm border-b border-base-300">
          <div className="navbar-start">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-content" />
              </div>
              <span className="ml-2 text-xl font-bold">HealthCare Connect</span>
            </div>
          </div>
          
          <div className="navbar-end">
            <div className="flex items-center gap-4">
              <button className="btn btn-ghost btn-circle relative" title="Notifications">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
              </button>
              
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost flex items-center gap-2">
                  <div className="avatar placeholder">
                    <div className="bg-primary-content text-primary rounded-full w-8">
                      <span className="text-sm font-semibold">JS</span>
                    </div>
                  </div>
                  <span className="font-medium">Jane Smith</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                  <li><a>Profile</a></li>
                  <li><a>Settings</a></li>
                  <li><a>Logout</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CAUTION Banner */}
        <div className="w-full relative">
          <Image 
            src="/caution-warning-tape-yellow-black-600nw-2502722405.webp" 
            alt="Caution Warning Tape" 
            width={1200}
            height={96}
            className="w-full h-24 object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-black/50 px-6 py-2 rounded-lg">
              <h3 className="text-lg font-bold text-white">Important Notice</h3>
              <p className="text-sm text-white/90">Please review your health information carefully</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Welcome Header */}
          <div className="hero bg-gradient-to-r from-primary to-primary-focus rounded-xl mb-8 text-primary-content">
            <div className="hero-content text-center lg:text-left w-full">
              <div className="flex justify-between items-center w-full">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Welcome back, Jane!</h1>
                  <p className="text-lg opacity-90">Your next appointment is on March 15th at 2:00 PM</p>
                </div>
                <div className="hidden lg:flex gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold">4</div>
                    <div className="text-sm opacity-75">Upcoming Appointments</div>
                  </div>
                  <div className="divider divider-horizontal"></div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">2</div>
                    <div className="text-sm opacity-75">Pending Forms</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="card-body items-center text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <CalendarPlus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="card-title text-lg">Book Appointment</h3>
                <p className="text-sm opacity-70">Schedule your next visit</p>
                <div className="card-actions">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleQuickAction('book')}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="card-body items-center text-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                  <Pill className="w-6 h-6 text-success" />
                </div>
                <h3 className="card-title text-lg">Prescriptions</h3>
                <p className="text-sm opacity-70">View and refill medications</p>
                <div className="card-actions">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => handleQuickAction('prescriptions')}
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="card-body items-center text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <h3 className="card-title text-lg">Test Results</h3>
                <p className="text-sm opacity-70">View lab and imaging results</p>
                <div className="card-actions">
                  <button 
                    className="btn btn-accent btn-sm"
                    onClick={() => handleQuickAction('results')}
                  >
                    View Results
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative">
              <div className="card-body items-center text-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="card-title text-lg">Messages</h3>
                <p className="text-sm opacity-70">Contact your care team</p>
                <div className="card-actions">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleQuickAction('messages')}
                  >
                    Open Messages
                  </button>
                </div>
                <div className="badge badge-error absolute -top-2 -right-2">3</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Upcoming Appointments */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="card-title text-xl flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Upcoming Appointments
                    </h2>
                    <button className="btn btn-ghost btn-sm text-primary">View All</button>
                  </div>
                  
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center p-4 bg-base-200 rounded-lg">
                        <div className={`w-2 h-2 rounded-full mr-4 ${getStatusColor(appointment.status)}`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{appointment.title}</h3>
                            <span className={`badge ${appointment.status === 'confirmed' ? 'badge-success' : appointment.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                              {appointment.status}
                            </span>
                          </div>
                          <p className="text-sm opacity-70">{appointment.doctor}</p>
                          <p className="text-sm opacity-60">{appointment.date} at {appointment.time}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-ghost btn-sm"
                            title="Edit appointment"
                            onClick={() => handleAppointmentEdit()}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm text-error"
                            title="Cancel appointment"
                            onClick={() => handleAppointmentCancel()}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-xl flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-success" />
                    Recent Activity
                  </h2>
                  
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-base-200 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm opacity-60">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Health Summary */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-xl flex items-center gap-2 mb-6">
                    <Activity className="w-5 h-5 text-error" />
                    Health Summary
                  </h2>
                  
                  <div className="space-y-4">
                    {healthMetrics.map((metric, index) => (
                      <div key={index} className="p-4 bg-success/5 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{metric.name}</span>
                          <span className={`font-semibold ${getHealthStatusColor(metric.status)}`}>
                            {metric.value}
                          </span>
                        </div>
                        <p className="text-sm opacity-60 mt-1">{metric.lastReading}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pending Tasks */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-xl flex items-center gap-2 mb-6">
                    <ClipboardCheck className="w-5 h-5 text-accent" />
                    Pending Tasks
                    <div className="badge badge-error">2</div>
                  </h2>
                  
                  <div className="space-y-3">
                    {pendingTasks.map((task) => (
                      <div key={task.id} className={`alert ${task.priority === 'high' ? 'alert-error' : 'alert-warning'}`}>
                        {task.priority === 'high' ? 
                          <AlertTriangle className="w-5 h-5" /> : 
                          <ClipboardCheck className="w-5 h-5" />
                        }
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm opacity-75">{task.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-xl mb-6">Quick Stats</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {quickStats.map((stat, index) => (
                      <div key={index} className={`stats shadow ${stat.color.split(' ')[0]}`}>
                        <div className="stat">
                          <div className={`stat-value text-2xl ${stat.color.split(' ')[1]}`}>
                            {stat.value}
                          </div>
                          <div className="stat-desc text-xs">
                            {stat.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {showNotification && (
          <div className="toast toast-end">
            <div className="alert alert-success">
              <Check className="w-5 h-5" />
              <span>{notifications}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
