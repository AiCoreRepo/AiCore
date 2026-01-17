// ============================================================================
// AI RECOMMENDATION API Functions
// ============================================================================

export interface RecommendationRequest {
    occasion: 'Formal' | 'Party' | 'Wedding' | 'Casual luxury' | 'Resort';
    top_k?: number;
    body_shape?: string;
    skin_tone?: string;
    size?: string;
    age?: number;
}

export interface RecommendationItem {
    id: string;
    score: number;
    final_score: number;
    score_label: string;
    description?: string;
    image?: string;
    title?: string;
    price_cents?: number;
}

export interface RecommendationsResponse {
    perfect_for_you: RecommendationItem[];
    good_for_you: RecommendationItem[];
    you_can_also_try: RecommendationItem[];
    count: number;
    warnings?: string[];
}

// Get AI-powered outfit recommendations
export async function getAIRecommendations(data: RecommendationRequest): Promise<RecommendationsResponse> {
    const token = localStorage.getItem('access_token');
    if (!token) {
        throw new Error('Please login to get AI recommendations');
    }

    const res = await fetch(`${BASE_URL}/api/recommendations/ai-decide`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const bodyText = await res.text();
        try {
            const err = JSON.parse(bodyText);
            throw new Error(err.message || 'Failed to get recommendations');
        } catch {
            throw new Error(bodyText || 'Failed to get recommendations');
        }
    }
    return res.json();
}
