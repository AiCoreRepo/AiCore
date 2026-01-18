import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { JobStatus } from '@/constants/queue.constants';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface JobStatusResponse {
    status: JobStatus;
    progress: number;
    data?: any;
    result?: any;
    error?: string;
}

export const useAuraJobPolling = (jobId: string | null, enabled: boolean = true) => {
    const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pollJobStatus = useCallback(async () => {
        if (!jobId || !enabled) return;

        try {
            console.log(` Polling job status for job ID: ${jobId}`);

            // Get auth token
            const token = localStorage.getItem('access_token');

            // Use API_BASE_URL for both local and production
            const response = await axios.get(`${API_BASE_URL}/aura/job/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                withCredentials: true,
            });

            console.log(` Job status response:`, response.data);
            setJobStatus(response.data);

            // Stop polling if job is completed or failed
            if (response.data.status === 'completed' || response.data.status === 'failed') {
                console.log(`Job ${response.data.status}! Stopping polling.`);
                setIsPolling(false);
            }
        } catch (err) {
            console.error(' Error polling job status:', err);
            setError('Failed to check job status');
            setIsPolling(false);
        }
    }, [jobId, enabled]);

    useEffect(() => {
        if (!jobId || !enabled) {
            setIsPolling(false);
            return;
        }

        setIsPolling(true);
        pollJobStatus();

        // Poll every 2 seconds
        const interval = setInterval(pollJobStatus, 2000);

        return () => clearInterval(interval);
    }, [jobId, enabled, pollJobStatus]);

    return {
        jobStatus,
        isPolling,
        error,
        refetch: pollJobStatus,
    };
};
