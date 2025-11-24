export declare class RegisterDto {
    email: string;
    password: string;
    role: 'buyer' | 'creator' | 'admin';
    store_name?: string;
    store_slug?: string;
    about?: string;
}
