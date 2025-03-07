// Define types for the API responses
export interface EdgePropUserInfo {
    user: {
        uid: string;
        name: string;
        mail: string;
        created: string;
        status: string;
        uuid: string;
        isRecurring: boolean;
        level: number;
        isAgent: boolean;
        agent_image?: string;
        pid: string;
        contact: string;
        agent_description?: string;
        agent_link?: string;
        country_code: string;
        agency: string;
        agency_id: string;
        agent_id: string;
        agent_position: string;
        message_enquiries: string;
        source_register: string;
        gender: string;
        birthdate: string;
        agency_logo?: string;
        interest: boolean;
        subscription?: {
            premium?: EdgePropUserSubscription;
        };
        isProToolsAgent: boolean;
        is_allowed_list_agents_prop_points: boolean;
        isConsent: string;
        title: string;
        first_name: string;
        last_name: string;
        address: string;
        post_code: string;
        industry: string;
        watchlist: string;
        pn_malaysia: string;
        pn_singapore: string;
        stock: string;
        financial: string;
        singapore_market: string;
        status_proppoints: string;
    };
    session_name: string;
}

export interface EdgePropUserSubscription {
    id: number;
    user_id: string;
    subscription_start: number;
    subscription_end: number;
    expired: boolean;
    valid: boolean;
    allow_renewal: boolean;
    future: boolean;
    level_id: string;
    level_name: string;
    level_text: string;
    trial: boolean;
    internal: boolean;
}

export interface EdgePropTransaction {
    transaction_id: string;
    amount: number;
    balance_before: number;
    balance_after: number;
    reference_id: string;
    type: string;
    note: string; // You can parse the note JSON string if needed
    date_created: string;
    trx_status: string;
    reports: {
        status: boolean;
        message: string;
        report_status: string;
    };
}

export interface EdgePropPoints {
    status: boolean;
    start_date: string;
    expiry_date: string;
    user_status: string;
    total_rows: number;
    total_amount: number;
    transactions: EdgePropTransaction[];
}
