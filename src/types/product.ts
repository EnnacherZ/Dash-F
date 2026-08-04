export interface ProductStock {
    id: number;
    product: number;
    size: string | number;
    quantity: number;
}

export interface Product {
    id: number;
    product_type : string;
    category: string;
    ref: string;
    name: string;
    price: number;
    promo: number;
    image: string;
    image1: string;
    image2: string;
    image3: string;
    image4: string;
    newest: boolean;
    stock: ProductStock[];
}

export interface ProductReviews{
    product_type:string;
    product_id:number;
    name:string;
    email:string;
    review:string;
    stars:number;
    date:string;
    id:number
}
