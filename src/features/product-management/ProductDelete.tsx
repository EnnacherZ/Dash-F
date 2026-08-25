import React, {useState} from "react";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import "@/components/modals/modals.css";
import "./product-form.css";
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
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const handleOption = (option: OptionType | null) => {
        setSelectedOption(option)
    };

    const handleSubmit = async () => {
        if(selectedOption){
            const prodId = selectedOption.value;
            setIsDeleting(true);
            try {
                const response = await connecter.delete(`db/products/manager/${prodId}/`)
                if(response.status === 200 || response.status === 204){
                    showToast(t('admin.product.deleteSuccess'), "success");
                    setIsModal(false);
                    window.setTimeout(() => window.location.reload(), 650);
                }
            } catch {
                showToast(t('admin.product.deleteError'), "error");
            } finally {
                setIsDeleting(false);
            }
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
        <ConfirmDeleteModal
            open={isModal}
            title={t('admin.product.deleteProductTitle')}
            message={t('admin.product.deleteWarning')}
            itemLabel={selectedOption?.label}
            requireText={selectedOption?.label}
            requireTextLabel={t('admin.product.typeProductToDelete')}
            confirmLabel={t('confirm.delete')}
            cancelLabel={t('ui.cancel')}
            loading={isDeleting}
            onConfirm={handleSubmit}
            onClose={() => !isDeleting && setIsModal(false)}
        />
    </>)
};

export default ProdDelete;
