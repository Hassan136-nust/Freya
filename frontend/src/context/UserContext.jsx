import { createContext, useState, useEffect } from 'react'
import axios from '../config/axios'

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken && !user) {
        try {
          const res = await axios.get('/users/profile')
          setUser(res.data.user)
        } catch (err) {
          console.log('Failed to fetch user profile:', err)
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  const login = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('token', userToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1a1a1a', color: '#f5f5f5' }}>Loading...</div>
  }

  return (
    <UserContext.Provider value={{ user, token, login, logout, setUser }}>
      {children}
    </UserContext.Provider>
  )
}
