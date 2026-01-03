import { useEffect, useState } from 'react';
import { getAuraStatus } from '@/lib/api';

export default function AuthDebug() {
    const [token, setToken] = useState<string | null>(null);
    const [auraStatus, setAuraStatus] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const accessToken = localStorage.getItem('access_token');
            setToken(accessToken);

            if (accessToken) {
                const status = await getAuraStatus();
                setAuraStatus(status);
            }
        };
        checkAuth();
    }, []);

    return (
        <div className="min-h-screen bg-ivory p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>

                <div className="space-y-4">
                    <div>
                        <h2 className="font-semibold">Access Token:</h2>
                        <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
                            {token || 'No token found'}
                        </pre>
                    </div>

                    <div>
                        <h2 className="font-semibold">Aura Status:</h2>
                        <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
                            {JSON.stringify(auraStatus, null, 2) || 'Not checked'}
                        </pre>
                    </div>

                    <div>
                        <h2 className="font-semibold">Status:</h2>
                        <p className="mt-2">
                            {token ? (
                                <span className="text-green-600 font-semibold">✓ Logged In</span>
                            ) : (
                                <span className="text-red-600 font-semibold">✗ Not Logged In</span>
                            )}
                        </p>
                        {auraStatus && (
                            <p className="mt-2">
                                {auraStatus.hasAura ? (
                                    <span className="text-green-600 font-semibold">✓ Has Aura</span>
                                ) : (
                                    <span className="text-orange-600 font-semibold">○ No Aura</span>
                                )}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
