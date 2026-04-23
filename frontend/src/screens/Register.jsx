import { useState,useContext } from 'react'
import { Link ,useNavigate} from 'react-router-dom'
import axios from '../config/axios'
import { UserContext } from '../context/UserContext'

function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate();

  const {setUser}= useContext(UserContext);

  const handleSubmit = (e) => {
    e.preventDefault()
    axios.post('/users/register',{
    email,password
}).then((res)=>{
    localStorage.setItem('token',res.data.token)
    setUser(res.data.user)
    navigate('/');
    console.log(res.data)
}).catch((err)=>{
    console.log(err)
})
    console.log('Register:', { email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6 bg-slate-100 p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 rounded-md placeholder-slate-400 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-slate-300 rounded-md placeholder-slate-400 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-slate-50 bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
            >
              Create account
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
