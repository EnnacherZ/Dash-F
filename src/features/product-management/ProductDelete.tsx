import React, {useState} from "react";
import Modals from "@/components/modals/ModalSwitcher";
import "@/components/modals/modals.css";
import "./product-form.css";
import { AnimatePresence } from "framer-motion";
import { OptionType } from "@/pages/ProductsManager";
import apiInstance from "@/lib/api";
import { useTranslation } from "react-i18next";
import { showToast } from "@/utils/toast";
import ProductOptions from "./ProductOptions";
import { FaTriangleExclamation } from "react-icons/fa6";

const connecter = apiInstance;

const ProdDelete : React.FC = () => {
    const {t} = useTranslation();
    const [selectedOption, setSelectedOption] = useState<OptionType | null>(null);
    const [isModal, setIsModal] = useState<boolean>(false);

    const handleOption = (option: OptionType | null) => {
        setSelectedOption(option)
    };

    const handleSubmit = async () => {
        if(selectedOption){
            const prodId = selectedOption.value;
            const response = await connecter.delete(`db/products/manager/${prodId}/`)
            if(response.status == 201){ window.location.reload(); }
        } else {
            showToast(t('admin.product.checkFields', { fields: t('product.label') }), "error");
        }
    }

    return(<>
        <div className="prodForm">
            <form>
                <ProductOptions value={selectedOption} handleOption={handleOption}/>
                {selectedOption && (
                    <div className="pm-danger-warning">
                        <FaTriangleExclamation/>
                        <span>{t('admin.product.deleteWarning')}</span>
                    </div>
                )}
                <button type="button" className="btn btn-danger fw-bold" onClick={() => setIsModal(true)} disabled={!selectedOption}>
                    {t('confirm.delete')}
                </button>
            </form>
        </div>
        <AnimatePresence>
            {isModal && <Modals
                message={undefined}
                cible="db/delete"
                item={{}}
                onBack={() => setIsModal(false)}
                onDelete={handleSubmit}
            />}
        </AnimatePresence>
    </>)
};

export default ProdDelete;
