export interface InviteLeadResponse {
    user_exists: boolean;
    email_sent: boolean;
    userId?: string;
    number_of_candidates_for_role: number;
}