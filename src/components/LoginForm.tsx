import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useThemeStore } from '../stores/themeStore';

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => void;
  error?: string;
}

export default function LoginForm({ onSubmit, error }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { darkMode } = useThemeStore();

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-anthea opacity-90 mix-blend-multiply" />
        <img
          src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80"
          alt="Équipe professionnelle"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-20"
        />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white max-w-xl">
            <img 
              src="https://dev.anthea-rh.com/wp-content/uploads/2022/12/logtransp.png"
              alt="Anthea RH" 
              className="h-16 w-auto mb-8 brightness-0 invert"
              style={{ width: '180px', height: 'auto' }}
            />
            <p className="text-xl text-white/90">
              Votre partenaire de confiance pour l'emploi et le reclassement professionnel
            </p>
          </div>
        </div>
      </div>

      <div className={`flex-1 flex items-center justify-center p-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-start mb-6 lg:hidden">
              {darkMode ? (
                <img 
                  src="https://dev.anthea-rh.com/wp-content/uploads/2022/12/logtransp.png"
                  alt="Anthea RH"
                  className="brightness-0 invert"
                  style={{ width: '150px', height: 'auto' }}
                />
              ) : (
                <img 
                  src="https://www.anthea-rh.com/wp-content/uploads/7yx2.jpeg"
                  alt="Anthea RH"
                  style={{ width: '150px', height: 'auto' }}
                />
              )}
              <span className="text-lg font-bold text-anthea-lime ml-2">CRM Emploi</span>
            </div>
            <h2 className="text-3xl font-bold text-anthea-lime">
              CRM Emploi
            </h2>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  {...register("email", { 
                    required: "L'email est requis",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email invalide"
                    }
                  })}
                  type="email"
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    darkMode 
                      ? 'border-gray-700 bg-gray-800 text-gray-200 focus:ring-anthea-blue focus:border-anthea-blue' 
                      : 'border-gray-300 focus:ring-anthea-blue focus:border-anthea-blue'
                  } rounded-2xl focus:outline-none focus:ring-2`}
                  placeholder="exemple@anthea-rh.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message as string}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  {...register("password", { 
                    required: "Le mot de passe est requis",
                    minLength: {
                      value: 6,
                      message: "Le mot de passe doit contenir au moins 6 caractères"
                    }
                  })}
                  type={showPassword ? "text" : "password"}
                  className={`appearance-none block w-full pl-10 pr-12 py-2 border ${
                    darkMode 
                      ? 'border-gray-700 bg-gray-800 text-gray-200 focus:ring-anthea-blue focus:border-anthea-blue' 
                      : 'border-gray-300 focus:ring-anthea-blue focus:border-anthea-blue'
                  } rounded-2xl focus:outline-none focus:ring-2`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message as string}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-medium text-white bg-gradient-anthea hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-anthea-blue"
            >
              Se connecter
            </button>

            <div className="text-center">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Contactez l'administrateur pour créer un compte ou réinitialiser votre mot de passe
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}