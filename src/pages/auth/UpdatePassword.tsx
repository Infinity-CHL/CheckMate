import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/api/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="p-4 text-center">
        <div className="text-green-600 mb-2">✅ Пароль успешно обновлен!</div>
        <div>Перенаправление на страницу входа...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Создание нового пароля</h1>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Новый пароль</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Подтвердите пароль</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Сохранение...' : 'Сохранить пароль'}
          </Button>
        </form>
      </div>
    </div>
  );
};