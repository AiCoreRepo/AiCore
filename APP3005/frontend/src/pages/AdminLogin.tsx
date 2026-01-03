import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Secret Admin Login Page
 * Access via: /admin-login?email=admin@aivestire.com&password=Admin@123456
 * 
 * This is a development-only route for quick admin access
 */
const AdminLogin = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const autoLogin = async () => {
            const email = searchParams.get('email') || 'admin@aivestire.com';
            const password = searchParams.get('password') || 'Admin@123456';

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                if (!response.ok) {
                    throw new Error('Login failed');
                }

                const data = await response.json();

                // Store token
                localStorage.setItem('access_token', data.access_token);

                // Redirect to admin dashboard
                setTimeout(() => {
                    navigate('/admin-dashboard');
                }, 500);

            } catch (error) {
                console.error('Auto-login failed:', error);
                alert('Admin login failed. Please check credentials.');
                navigate('/');
            }
        };

        autoLogin();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
            <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto" />
                <h2 className="text-2xl font-bold text-neutral-100">
                    Logging in as Admin...
                </h2>
                <p className="text-neutral-400">Please wait</p>
            </div>
        </div>
    );
};

export default AdminLogin;
