import React, {useState} from "react";
import "./product-form.css"
import { showToast } from "@/utils/toast";
import { OptionType } from "@/pages/ProductsManager";
import apiInstance from "@/lib/api";
import { useTranslation } from "react-i18next";
import ProductOptions from "./ProductOptions";

const connecter = apiInstance;

const ProdStockForm : React.FC = () => {
    const {t} = useTranslation();
    const [size, setSize] = useState<string | number>('');
    const [quantity, setQuantity] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<OptionType|null>(null);

    const handleOption = async (option: OptionType | null) => {
        setSelectedOption(option);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(selectedOption && size != '' && quantity != 0){
            try{
                const response = await connecter.post('db/product/stock/update/', {
                    productId: selectedOption.value,
                    size: size,
                    quantity: quantity
                });

                if(response.status == 200){ window.location.reload(); }
            } catch {
                showToast(t('admin.product.actionFailed'), "error");
            }
        } else {
            const missing = [
                !selectedOption ? t('product.label') : '',
                size == '' ? t('product.size') : '',
                quantity == 0 ? t('product.quantity') : '',
            ].filter(Boolean).join(', ');
            showToast(t('admin.product.checkFields', { fields: missing }), "error");
        }
    }

    return(<>
        <div className="prodForm">
            <form onSubmit={handleSubmit}>
                <ProductOptions value={selectedOption} handleOption={handleOption}/>
                <div className="pm-field-row">
                    <div className="mb-3">
                        <label className="form-label">{t('product.size')} :</label>
                        <input
                            type="text"
                            className="form-control"
                            id="size"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">{t('product.quantity')} :</label>
                        <input
                            type="number"
                            className="form-control"
                            id="quantity"
                            value={quantity==0?'':quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            required
                            min={1}
                        />
                    </div>
                </div>
                <button type="submit" className="btn btn-primary">{t('form.submit')}</button>
            </form>
        </div>
    </>)
}

export default ProdStockForm;
