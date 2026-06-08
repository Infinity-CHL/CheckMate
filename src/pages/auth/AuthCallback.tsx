import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/api/supabase';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Получаем hash из URL (часть после #)
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken) {
        // Устанавливаем сессию пользователя
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Error setting session:', error);
          setError('Не удалось подтвердить email. Попробуйте снова.');
        } else if (type === 'recovery') {
          // Если это восстановление пароля, редиректим на страницу обновления пароля
          navigate('/update-password');
        } else {
          // Обычное подтверждение email
          navigate('/');
        }
      } else {
        setError('Неверная ссылка подтверждения');
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return <div className="p-4">Подтверждение email... Пожалуйста, подождите.</div>;
};