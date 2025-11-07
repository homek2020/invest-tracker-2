import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { accessToken, refreshToken, email, setTokens } = useAuthStore();

  useEffect(() => {
    async function bootstrap() {
      if (accessToken) {
        axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        return;
      }
      try {
        const otpResponse = await axios.post('/api/v1/auth/request-otp', { email });
        const code = otpResponse.data.code;
        const verifyResponse = await axios.post('/api/v1/auth/verify-otp', { email, code });
        setTokens(verifyResponse.data.accessToken, verifyResponse.data.refreshToken);
        axios.defaults.headers.common.Authorization = `Bearer ${verifyResponse.data.accessToken}`;
      } catch (error) {
        console.error('Auth bootstrap failed', error);
      }
    }

    void bootstrap();
  }, [accessToken, email, refreshToken, setTokens]);
}
