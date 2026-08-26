export interface InviteLeadResponse {
    user_exists: boolean;
    email_sent: boolean;
    user_id?: string;
    number_of_candidates_for_role: number;
}