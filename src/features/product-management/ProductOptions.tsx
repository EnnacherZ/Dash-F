import React, { useMemo, useState } from "react";
import Select from "react-select";
import "./product-form.css";
import { OptionType } from "@/pages/ProductsManager";
import { useTranslation } from "react-i18next";
import { useParametersContext } from "@/contexts/ParametersContext";
import { FaMagnifyingGlass, FaBoxOpen, FaExpand } from "react-icons/fa6";
import ModalBackdrop from "@/components/modals/modalBackdrop";

interface ProductOptionsProps {
    value: OptionType | null,
    handleOption: (option: OptionType | null) => void,
}

/**
 * Shared "find a product" picker, used by every product-management action
 * that needs to target an existing product (stock lookup, add stock, edit,
 * delete). Also owns the "selected product" preview card, which used to be
 * a bare, unstyled <img> duplicated identically across all 4 consumers.
 *
 * The full product list itself now comes from ParametersContext (fetched
 * once, app-wide) instead of being fetched locally here — this component
 * unmounts/remounts every time its tab is switched away from and back to,
 * and the products endpoint is slow (see get_all_products), so refetching
 * it locally on every remount, with no loading indicator, made the picker
 * look permanently broken rather than just slow.
 */
const ProductOptions: React.FC<ProductOptionsProps> = ({value, handleOption}) => {
    const {t} = useTranslation();
    const {productTypes, productsByType, productsLoading} = useParametersContext();
    const [selectedType, setSelectedType] = useState<string>();
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const _options = useMemo((): OptionType[] => {
        if (!selectedType || !productsByType?.[selectedType]) return [];
        return productsByType[selectedType].map((product) => ({
            label: product.category + " " + product.name + " " + product.ref,
            value: product.id,
            picture: product.image,
        }));
    }, [selectedType, productsByType]);

    return(
        // FIX: everything used to stack in one narrow (max 720px) column,
        // leaving most of the panel's actual width empty, and the selected
        // product's picture was a small 56px thumbnail easy to miss. Putting
        // the fields and a large product preview side by side fills the
        // available space and makes the picture the visual anchor it should
        // be for an admin picking a product to act on.
        <div className="pm-finder">
            <div className="pm-finder-fields">
                <div className="pm-search-hint">
                    <FaMagnifyingGlass/>
                    <span>{t('admin.product.searchPrompt')}</span>
                </div>
                <div className="mb-3">
                    <label className="form-label">{t('product.type')} :</label>
                    <select
                        className="form-select"
                        value={selectedType}
                        onChange={(e) => { setSelectedType(e.target.value); handleOption(null); }}
                        required
                    >
                        <option value="">{t('admin.product.selectType')}</option>
                        {!productTypes || productTypes.length === 0
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <option key={i} className="desktop-cat-btn-skeleton" aria-hidden />
                            ))
                        : productTypes.map((type_, index) => (
                            <option value={type_} key={index}>
                                {type_}
                            </option>
                            ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">{t('product.label')} :</label>
                    <Select
                        options={_options}
                        value={value}
                        onChange={handleOption}
                        placeholder={productsLoading ? t('ui.loading') : t('admin.product.select')}
                        isClearable
                        isLoading={productsLoading}
                        isDisabled={!selectedType || productsLoading}
                    />
                    {/* Same gap as the category dropdown: a type with zero products
                        left the searchable select silently empty with no explanation. */}
                    {selectedType && !productsLoading && _options.length === 0 && (
                        <div className="pm-inline-hint pm-inline-hint--warning">{t('admin.product.noProductsForType')}</div>
                    )}
                </div>
            </div>

            <div className={`pm-finder-preview ${!value ? 'pm-finder-preview--empty' : ''}`}>
                {value ? (<>
                    {value.picture
                        ? (
                            // FIX: the picture was static — no way to see it
                            // any larger than the small preview card itself.
                            <button
                                type="button"
                                className="pm-finder-preview__img-btn"
                                onClick={() => setIsLightboxOpen(true)}
                                aria-label={t('admin.product.viewFullImage')}
                            >
                                <img src={value.picture} alt="" className="pm-finder-preview__img"/>
                                <span className="pm-finder-preview__expand"><FaExpand/></span>
                            </button>
                        )
                        : <div className="pm-finder-preview__img pm-finder-preview__img--empty"><FaBoxOpen/></div>
                    }
                    <span className="pm-finder-preview__label">{t('admin.product.selectedProduct')}</span>
                    <span className="pm-finder-preview__name">{value.label}</span>
                </>) : (<>
                    <div className="pm-finder-preview__img pm-finder-preview__img--empty"><FaBoxOpen/></div>
                    <span className="pm-finder-preview__label">{t('admin.product.noChosen')}</span>
                </>)}
            </div>

            {value?.picture && (
                <ModalBackdrop onOpen={isLightboxOpen} onClose={() => setIsLightboxOpen(false)}>
                    <div className="pm-lightbox">
                        <img src={value.picture} alt="" className="pm-lightbox__img"/>
                    </div>
                </ModalBackdrop>
            )}
        </div>
    )
}

export default ProductOptions;
