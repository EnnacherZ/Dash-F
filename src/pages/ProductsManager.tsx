import React, {useState } from "react";
import Sidebar from "@/layout/Sidebar";
import DbHeader from "@/layout/DbHeader";
import ProductForm from "@/features/product-management/ProductForm";
import Loading from "../components/loading";
import ProdStockForm from "@/features/product-management/ProductStockForm";
import ProdDelete from "@/features/product-management/ProductDelete";
import ProdModif from "@/features/product-management/ProdModif";
import { IoSettings } from "react-icons/io5";
import { FaMagnifyingGlass, FaPlus, FaBoxesStacked, FaPen, FaTrash } from "react-icons/fa6";
import apiInstance from "@/lib/api";
import { useLangContext } from "../contexts/LanguageContext";
import { selectedLang } from "@/utils/i18n";
import { showToast } from "@/utils/toast";
import { useTranslation } from "react-i18next";
import { ProductStock } from "@/types/product";
import ProductOptions from "@/features/product-management/ProductOptions";

export interface OptionType {
    label:string,
    value : number,
    picture : string
}

const connecter = apiInstance;

const ProductsManager : React.FC = () => {
    const {t} = useTranslation();
    const {currentLang} = useLangContext();

    return(<>
        <Sidebar/>
        <div className={`db-home ${selectedLang(currentLang)=='ar'&&'rtl'}`}>
            <DbHeader/>
            <hr/>
            <div className="Prod-manage-title m-4 fw-bold">
                <IoSettings size={20}/> <span className="mx-3">{t('admin.product.managementOf')} </span>
            </div>
            <ProductsOperations/>
        </div>
    </>)
};

type TabKey = 'details' | 'add' | 'stock' | 'modify' | 'delete';

const ProductsOperations : React.FC= () => {
    const {t} = useTranslation();
    // FIX: this whole section used to be a single stacked Accordion (all 5
    // actions expandable at once, no sense of "which mode am I in", easy to
    // lose track of while scrolling). Tabs make the 5 distinct actions
    // (look up / add / add stock / edit / delete) each a single deliberate
    // choice, with only the relevant form visible at a time.
    const [tab, setTab] = useState<TabKey>('details');

    const TABS: { key: TabKey; label: string; icon: React.ElementType; danger?: boolean }[] = [
        { key: 'details', label: t('admin.product.searchProduct'), icon: FaMagnifyingGlass },
        { key: 'add',     label: t('admin.product.add'),           icon: FaPlus },
        { key: 'stock',   label: t('admin.product.addStock'),      icon: FaBoxesStacked },
        { key: 'modify',  label: t('admin.product.editProduct'),   icon: FaPen },
        { key: 'delete',  label: t('admin.product.deleteProduct'), icon: FaTrash, danger: true },
    ];

    return (
        <div className="pm-wrap">
            <div className="pm-tabs" role="tablist">
                {TABS.map(({key, label, icon: Icon, danger}) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={tab === key}
                        className={`pm-tab ${tab === key ? 'pm-tab--active' : ''} ${danger ? 'pm-tab--danger' : ''}`}
                        onClick={() => setTab(key)}
                    >
                        <Icon/> <span>{label}</span>
                    </button>
                ))}
            </div>
            <div className="db-card pm-panel">
                {tab === 'details' && <ProductDetails/>}
                {tab === 'add'     && <ProductForm/>}
                {tab === 'stock'   && <ProdStockForm/>}
                {tab === 'modify'  && <ProdModif/>}
                {tab === 'delete'  && <ProdDelete/>}
            </div>
        </div>
    );
}


const ProductDetails : React.FC = () => {
    const {t} = useTranslation();
    const [selectedOption, setSelectedOption] = useState<OptionType | null>(null);
    const [productStock, setProductStock] = useState<ProductStock[]>();
    const [isLoading, setIsLoading] = useState<boolean>();

    const handleOption = async (option: OptionType | null) => {
        setSelectedOption(option);
        if(option?.value){
            setIsLoading(true);
            // FIX: the previous product's stock table used to stay on screen
            // (now silently mislabeled under the newly selected product)
            // until the new fetch resolved, then abruptly swap — clearing it
            // immediately means the loading spinner shows instead of stale data.
            setProductStock(undefined);
            try {
                // FIX: this request previously had no error handling at all —
                // a failed request (network error, 404, 500…) left isLoading
                // stuck at true forever, with the spinner never clearing.
                const res = await connecter.get(`db/product/stock/get?productId=${option.value}`);
                setProductStock(res.data.data);
            } catch {
                setProductStock(undefined);
                showToast(t('admin.product.actionFailed'), "error");
            } finally {
                setIsLoading(false);
            }
        } else {
            setProductStock(undefined)
        }
    };

    return(<>
        <ProductOptions value={selectedOption} handleOption={handleOption}/>
        {selectedOption && (
            <div className="mb-3">
                {!productStock ? (
                    isLoading ? <Loading message={t('ui.loading')}/> : <span className="text-muted">{t('admin.product.noChosen')}</span>
                ) : productStock.length > 0 ? (
                    <table className="table orders-table">
                        <thead>
                            <tr>
                                <th>{t('product.size')}</th>
                                <th>{t('product.quantity')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productStock.map((pro, index) => (
                                <tr key={index}>
                                    <td>{pro.size}</td>
                                    <td>{pro.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <span className="text-muted">{t('admin.product.noData')}</span>}
            </div>
        )}
    </>)
}

export default ProductsManager;
