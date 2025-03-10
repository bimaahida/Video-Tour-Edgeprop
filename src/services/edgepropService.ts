import axios from 'axios';
import dotenv from 'dotenv';
import { EdgePropPoints, EdgePropUserInfo } from '../models/edgeprop';

/**
 * EdgeProp API Service
 * Handles communication with EdgeProp APIs
 */
class EdgePropService {
    private drupalURL: string;
    private edgepropPointURL: string;

    private drupalInfoUrl: string;
    private pointsApiUrl: string;

    constructor() {
        dotenv.config();

        this.drupalURL = process.env.EDGEPROP_URL || "";
        this.edgepropPointURL = process.env.EDGEPROP_POINT_URL || "";
        if (!this.drupalURL || !this.edgepropPointURL) {
            console.warn('EDGEPROP_URL or EDGEPROP_POINT_URL not set.');
        }
        this.drupalInfoUrl = `${this.drupalURL!}/index.php?option=com_analytica&task=getDrupalInfo`;
        this.pointsApiUrl = `${this.edgepropPointURL}/api/getPoint`;
    }
    async getUserInfo(sessionId: string): Promise<EdgePropUserInfo> {
        try {
            const response = await axios.get(`${this.drupalInfoUrl}&session_id=${sessionId}`, {
                headers: {
                    'Accept': 'application/json',
                    // 'X-API-Key': this.apiKey
                },
                timeout: 10000 // 10s timeout
            });

            if (response.status !== 200) {
                throw new Error(`EdgeProp API returned status code: ${response.status}`);
            }

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const statusCode = error.response?.status || 500;
                const errorMessage = error.response?.data?.message || error.message;
                throw new Error(`Failed to fetch user info: ${errorMessage} (${statusCode})`);
            }

            throw new Error(`Failed to fetch user info: ${(error as Error).message}`);
        }
    }

    async getPoints(agentId: string): Promise<EdgePropPoints> {
        try {
            const response = await axios.get(this.pointsApiUrl, {
                params: {
                    apiKey: 'apiuser',
                    agentId,
                },
                headers: {
                    'Accept': 'application/json',
                },
                timeout: 10000 // 10s timeout
            });

            if (response.status !== 200) {
                throw new Error(`EdgeProp API returned status code: ${response.status}`);
            }

            return response.data?.result;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const statusCode = error.response?.status || 500;
                const errorMessage = error.response?.data?.message || error.message;
                throw new Error(`Failed to fetch points data: ${errorMessage} (${statusCode})`);
            }

            throw new Error(`Failed to fetch points data: ${(error as Error).message}`);
        }
    }

}

// Export a singleton instance
export const edgepropService = new EdgePropService();