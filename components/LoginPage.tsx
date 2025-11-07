
import React, { useState, useContext } from 'react';
import { FirebaseContext } from '../index'; // Import Firebase context
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';

export const LoginPage: React.FC = () => {
  const { auth } = useContext(FirebaseContext); // Get auth from context
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      let errorMessage = "An unknown error occurred.";
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-email':
            errorMessage = "Invalid email address.";
            break;
          case 'auth/user-not-found':
            errorMessage = "User not found. Please register or check your email.";
            break;
          case 'auth/wrong-password':
            errorMessage = "Incorrect password.";
            break;
          case 'auth/email-already-in-use':
            errorMessage = "Email already in use. Please sign in.";
            break;
          case 'auth/weak-password':
            errorMessage = "Password should be at least 6 characters.";
            break;
          default:
            errorMessage = `Authentication failed: ${err.message}`;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Sign-In error:", err);
      setError(`Google Sign-In failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="ml-3 text-3xl font-bold text-white">Vertex Vision</h1>
        </div>
        <h2 className="text-xl font-semibold text-center text-white mb-6">
          {isRegistering ? 'Register' : 'Sign In'} to your account
        </h2>

        {error && (
          <div className="bg-red-900 text-red-300 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              isRegistering ? 'Register' : 'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400">
          <p>Or</p>
          <button
            onClick={handleGoogleSignIn}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M24 4.5C14.77 4.5 7.15 11.53 7.15 20.25c0 7.21 4.67 13.31 11.45 15.42.84.15 1.15-.36 1.15-.79V30.5c-4.5.98-5.45-2.17-5.45-2.17-1.12-2.85-2.75-3.6-2.75-3.6-.9-.63.07-.61.07-.61 1.0.07 1.53 1.03 1.53 1.03.89 1.57 2.34 1.11 2.91.85.09-.66.35-1.11.64-1.36-2.22-.26-4.55-1.11-4.55-4.95 0-1.1.39-2 .99-2.7-.1-.26-.43-1.29.09-2.69 0 0 .81-.27 2.64 1.02.77-.21 1.59-.32 2.42-.32.83 0 1.65.11 2.42.32 1.83-1.29 2.64-1.02 2.64-1.02.52 1.4.19 2.43.09 2.69.6.7.99 1.6.99 2.7 0 3.89-2.33 4.69-4.56 4.95.36.31.68.91.68 1.84v2.73c0 .43.3.94 1.15.79C40.18 33.56 44.85 27.46 44.85 20.25 44.85 11.53 37.23 4.5 28 4.5h-4z" fill="currentColor"/><path d="M48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24Z" fill="url(#paint0_linear_291_10)"/><defs><linearGradient id="paint0_linear_291_10" x1="0" y1="24" x2="48" y2="24" gradientUnits="userSpaceOnUse"><stop stopColor="#34A853"/><stop offset="0.5" stopColor="#EA4335"/><stop offset="1" stopColor="#FBBC04"/></linearGradient></defs></svg>
                Sign In with Google
              </>
            )}
          </button>
        </div >

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-400 hover:text-blue-300 text-sm"
            disabled={isLoading}
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </div >
    </div >
  );
};
