export interface Product {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    category?: string;    // El ? lo hace opcional
    description?: string; // El ? lo hace opcional
    inStock?: boolean;    // El ? lo hace opcional
    stock?: number;       // cantidad disponible (0 = agotado)
}