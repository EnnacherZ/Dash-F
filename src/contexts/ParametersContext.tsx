import React, {useCallback, useContext, createContext, ReactNode, useEffect, useRef, useState} from "react";
import connecter from "@/lib/api";
import { Product } from "@/types/product";



export interface ProductTypeDetail {
    id: number;
    name: string;
    title_fr: string;
    title_ar: string;
}

interface ParametersProps {
    productTypes : Array<string> | undefined
    productTypeDetails : Array<ProductTypeDetail>;
    categories : Record<string, string[]>;
    // FIX: this used to be fetched locally inside ProductOptions.tsx, which
    // unmounts/remounts on every tab switch (Search/Stock/Edit/Delete each
    // render their own <ProductOptions>) — so the full product list (a slow
    // endpoint, see get_all_products) was silently re-fetched from scratch
    // every time, with zero loading indicator, making it look permanently
    // broken rather than just slow. Fetching it once here, at the same
    // App-level provider that already never remounts, means it's paid once
    // per session and shared everywhere.
    productsByType : {[key:string]: Product[]} | undefined;
    productsLoading : boolean;
    refetchParameters : () => Promise<void>;
}


const ParametersContext = createContext<ParametersProps | undefined>(undefined);


export const ParametersContextProvider : React.FC<{children:ReactNode}> = ({children}) => {
    const [productTypes, setProductTypes] = useState<Array<string>>()
    const [productTypeDetails, setProductTypeDetails] = useState<Array<ProductTypeDetail>>([])
    const [categories, setCategories] = useState<Record<string, string[]>>({});
    const [productsByType, setProductsByType] = useState<{[key:string]: Product[]}>();
    const [productsLoading, setProductsLoading] = useState<boolean>(true);

    // Guards against React StrictMode's dev-only mount→unmount→remount
    // double-invoke firing this (already slow) fetch twice.
    const didFetchParams = useRef(false);
    const didFetchProducts = useRef(false);

    const fetchParameters = useCallback(async () => {
        try {
            const response = await connecter.get('db/products/parameters/get');
            setCategories(response.data.categories || {});
            setProductTypes(response.data.types || []);
            setProductTypeDetails(response.data.type_details || []);
        } catch (error) {
            console.error('Failed to load product parameters:', error);
            throw error;
        }
    }, []);

    useEffect(()=>{
        if (didFetchParams.current) return;
        didFetchParams.current = true;
        void fetchParameters().catch(() => undefined);
    },[fetchParameters]);

    useEffect(()=>{
        if (didFetchProducts.current) return;
        didFetchProducts.current = true;
        const getProducts = async () => {
            setProductsLoading(true);
            try{
                const response = await connecter.get('api/products/get/all');
                setProductsByType(response.data.products);
            }catch(error){
                console.error('Failed to load products:', error);
            } finally {
                setProductsLoading(false);
            }
        }
        getProducts();
    },[]);


    return(
        <ParametersContext.Provider
        value={{productTypes, productTypeDetails, categories, productsByType, productsLoading, refetchParameters: fetchParameters}}

        >
        {children}
        </ParametersContext.Provider>
    )

}


export const useParametersContext = (): ParametersProps => {
    const context = useContext(ParametersContext);
    if (context === undefined) {
      throw new Error('useParametersContext must be used within a ParametersContextProvider');
    }
    return context;
  };
