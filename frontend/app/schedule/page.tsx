"use client"

import { useState, useEffect } from "react"

interface SuggestedSlot {
  datetime: string
  confidence?: number
  reasoning?: string
  estimatedDuration?: number
  isFrequent?: boolean
}

export default function AppointmentPage() {
  const [doctors, setDoctors] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [suggestedSlots, setSuggestedSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [problem, setProblem] = useState("")
  const [reasoning, setReasoning] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")

  // Fetch doctors and patients on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsInitialLoading(true)
      try {
        const [doctorsRes, patientsRes] = await Promise.all([
          fetch("http://localhost:5002/api/doctors"),
          fetch("http://localhost:5002/api/patients"),
        ])

        if (!doctorsRes.ok || !patientsRes.ok) {
          throw new Error("Failed to fetch initial data")
        }

        const doctorsData = await doctorsRes.json()
        const patientsData = await patientsRes.json()

        setDoctors(doctorsData)
        setPatients(patientsData)

        // Set default selections if data is available
        if (doctorsData.length > 0) setSelectedDoctorId(doctorsData[0].id)
        if (patientsData.length > 0) setSelectedPatientId(patientsData[0].id)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setIsInitialLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId)
  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  const handleSuggestSlots = async () => {
    if (!selectedDoctorId || !selectedPatientId) {
      setError("Please select both doctor and patient")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuggestedSlots([])
    setBookingSuccess(false)

    try {
      const response = await fetch("http://localhost:5002/api/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: selectedDoctorId,
          patient_id: selectedPatientId,
          problem: problem,
          date: selectedDate || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setSuggestedSlots(data.slots || [])
      setReasoning(data.reasoning || null)

      if (!data.slots || data.slots.length === 0) {
        setError("No available slots found for the selected doctor and patient")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get suggestions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookAppointment = async (slot: string) => {
    setIsLoading(true)
    try {
      // You can implement booking API call here if your backend supports it
      // const response = await fetch("http://localhost:5002/api/book", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     doctor_id: selectedDoctorId,
      //     patient_id: selectedPatientId,
      //     slot: slot
      //   }),
      // })

      // For now, just simulate booking
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSelectedSlot(slot)
      setBookingSuccess(true)
    } catch (err) {
      setError("Failed to book appointment")
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "chronic":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-green-100 text-green-800 border-green-200"
    }
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Healthcare Data</h2>
          <p className="text-gray-600">Fetching doctors and patients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">AI Appointment Scheduler</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Intelligent scheduling 
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Banner */}
        {bookingSuccess && (
          <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 mb-1">Appointment Successfully Booked!</h3>
                <p className="text-green-700">
                  Your appointment is confirmed for{" "}
                  <span className="font-medium">
                    {new Date(selectedSlot!).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(selectedSlot!).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left Panel - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Schedule Appointment
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Doctor Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Select Doctor</label>
                  <div className="relative">
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white appearance-none cursor-pointer"
                      disabled={doctors.length === 0}
                    >
                      <option value="">Choose a doctor...</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.name} - {doctor.specialty}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {selectedDoctor && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-900">Dr. {selectedDoctor.name}</p>
                          <p className="text-sm text-blue-700">{selectedDoctor.specialty}</p>
                        </div>
                      </div>
                      {selectedDoctor.availability && (
                        <div className="text-sm text-blue-800">
                          <span className="font-medium">Available:</span>{" "}
                          {Array.isArray(selectedDoctor.availability)
                            ? selectedDoctor.availability.join(", ")
                            : selectedDoctor.availability}
                        </div>
                      )}
                      {selectedDoctor.avgConsultationTime && (
                        <div className="text-sm text-blue-800">
                          <span className="font-medium">Avg. Consultation:</span> {selectedDoctor.avgConsultationTime}{" "}
                          min
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Patient Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Select Patient</label>
                  <div className="relative">
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white appearance-none cursor-pointer"
                      disabled={patients.length === 0}
                    >
                      <option value="">Choose a patient...</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {selectedPatient && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{selectedPatient.name}</p>
                          </div>
                        </div>
                        {selectedPatient.priority && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(selectedPatient.priority)}`}
                          >
                            {selectedPatient.priority.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                        {selectedPatient.last_appointment && (
                          <div>
                            <span className="font-medium">Last Visit:</span>{" "}
                            {new Date(selectedPatient.last_appointment).toLocaleDateString()}
                          </div>
                        )}
                        {selectedPatient.frequentBookings && selectedPatient.frequentBookings.length > 0 && (
                          <div>
                            <span className="font-medium">Frequent Times:</span>{" "}
                            {selectedPatient.frequentBookings.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Problem Description */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Problem / Symptoms</label>
                  <textarea
                    rows={4}
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="Describe the patient's symptoms or reason for visit..."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 resize-none"
                  />
                </div>

                {/* Date Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Preferred Date (Optional)</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
                  />
                </div>

                {/* Action Button */}
                <button
                  onClick={handleSuggestSlots}
                  disabled={isLoading || !selectedDoctorId || !selectedPatientId}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Getting AI Suggestions...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span>Get AI Recommendations</span>
                    </>
                  )}
                </button>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-red-800 font-medium">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - AI Suggestions */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Recommendations
                </h2>
              </div>

              <div className="p-6">
                {suggestedSlots.length > 0 ? (
                  <div className="space-y-4">
                    {suggestedSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {new Date(slot).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </h3>
                            <p className="text-2xl font-bold text-blue-600">
                              {new Date(slot).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                              AI Optimized
                            </span>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Optimal timing
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={() => handleBookAppointment(slot)}
                            disabled={isLoading || bookingSuccess}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center space-x-2"
                          >
                            {isLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Booking...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                <span>Book This Slot</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}

                    {reasoning && (
                      <div className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-amber-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-amber-800 mb-2">AI Reasoning</h4>
                            <p className="text-amber-700 text-sm leading-relaxed whitespace-pre-wrap">{reasoning}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    {isLoading ? (
                      <div className="space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                        <p className="text-lg text-gray-600">AI is analyzing optimal appointment times...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                          <svg
                            className="w-12 h-12 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready for AI Analysis</h3>
                          <p className="text-gray-600">
                            Select a doctor and patient, then click "Get AI Recommendations" to see intelligent
                            scheduling suggestions
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  )
}
