import { useState,useContext } from 'react'
import { Link,useNavigate } from 'react-router-dom'
import axios from '../config/axios'

import { UserContext } from '../context/UserContext'
function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

const {setUser}= useContext(UserContext);

    const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault()
axios.post('/users/login',{
    email,password
}).then((res)=>{

    localStorage.setItem('token',res.data.token)
    setUser(res.data.user)
    
    navigate('/');
    console.log(res.data)
}).catch((err)=>{
    console.log(err)
    const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Login failed. Please try again.'
    alert(errorMessage)
})
    console.log('Login:', { email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="max-w-md w-full space-y-6 md:space-y-8">
        <div className="flex flex-col items-center">
          <img src="./freya2.png" alt="Freya Logo" className="h-17 w-17 md:h-27 md:w-27 object-contain mb-6" />
          <h2 className="text-center text-2xl md:text-3xl font-bold" style={{ color: '#f5f5f5' }}>
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6 p-8 rounded-lg shadow-md" style={{ backgroundColor: '#2a2a2a', border: '1px solid #404040' }} onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: '#f5f5f5' }}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 sm:text-sm"
                style={{ borderColor: '#404040', backgroundColor: '#1a1a1a', color: '#f5f5f5', outlineColor: '#d4af37' }}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: '#f5f5f5' }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 sm:text-sm"
                style={{ borderColor: '#404040', backgroundColor: '#1a1a1a', color: '#f5f5f5', outlineColor: '#d4af37' }}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border-transparent rounded-md shadow-sm text-sm font-medium transition-colors"
              style={{ backgroundColor: '#d4af37', color: '#0a0a0a', border: 'none' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f4cf47'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#d4af37'}
            >
              Sign in
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm" style={{ color: '#d4d4d4' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-medium" style={{ color: '#d4af37' }}>
                Create one
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login