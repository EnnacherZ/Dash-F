import React, {useEffect, useState} from "react";
import "./product-form.css";
import ConfirmActionModal from "@/components/modals/ConfirmActionModal";
import { OptionType } from "@/pages/ProductsManager";
import apiInstance from "@/lib/api";
import { useTranslation } from "react-i18next";
import ProductOptions from "./ProductOptions";
import { showToast } from "@/utils/toast";
import { FaXmark } from "react-icons/fa6";

const connecter = apiInstance;

const ProdModif : React.FC = () => {
    const {t} = useTranslation();
    const [selectedOption, setSelectedOption] = useState<OptionType | null>(null);
    const [isModal, setIsModal] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [ref, setRef] = useState<number | string>('');
    const [name, setName] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [price, setPrice] = useState<number | string>('');
    const [newest, setNewest] = useState<boolean>(false);
    const [newestTouched, setNewestTouched] = useState<boolean>(false);
    const [promo, setPromo] = useState<number | string>('');
    const [imageP, setImageP] = useState<File | null>(null);
    const [images, setImages] = useState<File[]>([]);

    // FIX: the previous version never showed a preview of a NEWLY selected
    // replacement image before submitting — the admin only found out what
    // they'd actually picked after the product was already updated.
    const [imagePreview, setImagePreview] = useState<string>();
    const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);

    useEffect(() => {
        if (!imageP) { setImagePreview(undefined); return; }
        const url = URL.createObjectURL(imageP);
        setImagePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [imageP]);

    useEffect(() => {
        const urls = images.map(f => URL.createObjectURL(f));
        setImagesPreviews(urls);
        return () => urls.forEach(u => URL.revokeObjectURL(u));
    }, [images]);

    const handleOption = (option: OptionType | null) => {
        setSelectedOption(option);
        setRef('');
        setName('');
        setCategory('');
        setPrice('');
        setPromo('');
        setNewest(false);
        setNewestTouched(false);
        setImageP(null);
        setImages([]);
    };

    const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length !== newFiles.length) {
            showToast(t('admin.product.invalidFiles'), "error");
        }
        const totalImages = images.length + imageFiles.length;
        if (totalImages > 4) {
            showToast(t('admin.product.tooManyImages'), "error");
            return;
        }
        setImages(prevImages => [...prevImages, ...imageFiles]);
        e.target.value = '';
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files){ setImageP(e.target.files[0]) }
    }

    const hasChanges = () => !(
        (ref === null || ref === '' || ref === undefined) &&
        (name === null || name.trim() === '' || name === undefined) &&
        (category === null || category.trim() === '' || category === undefined) &&
        (price === null || price === '' || price === undefined) &&
        (promo === null || promo === '' || promo === undefined) &&
        (imageP === null || imageP === undefined) &&
        images.length === 0 &&
        !newestTouched
    );

    const openConfirmation = () => {
        if (!selectedOption) {
            showToast(t('admin.product.checkFields', { fields: t('product.label') }), "error");
            return;
        }
        if (!hasChanges()) {
            showToast(t('admin.product.fillOneField'), "error");
            return;
        }
        setIsModal(true);
    };

    const handleSubmit = async () => {
        const formData = new FormData();
        if(selectedOption){
            const prodId = selectedOption.value;
            if(!(ref === null || ref === '' || ref === undefined)){ formData.append('ref', ref.toString()); }
            if(!(name === null || name.trim() === '' || name === undefined)){ formData.append('name', name); }
            if(!(category === null || category.trim() === '' || category === undefined)){ formData.append('category', category); }
            if(!(price === null || price === '' || price === undefined)){ formData.append('price', price.toString()); }
            if(!(promo === null || promo === '' || promo === undefined)){ formData.append('promo', promo.toString()); }
            if(!(imageP === null || imageP === undefined)){ formData.append('image', imageP); }
            if(!(images === null || images === undefined)){
                images.forEach((image, index) => { formData.append(`image${index + 1}`, image); });
            }
            if (newestTouched) formData.append('newest', newest ? 'true' : 'false');
            setIsSubmitting(true);
            try {
                const response = await connecter.patch(`db/products/manager/${prodId}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if(response.status === 200 || response.status === 201){
                    showToast(t('admin.product.updateSuccess'), "success");
                    setIsModal(false);
                    window.setTimeout(() => window.location.reload(), 650);
                }
            } catch {
                showToast(t('admin.product.updateError'), "error");
            } finally {
                setIsSubmitting(false);
            }
        } else {
            showToast(t('admin.product.checkFields', { fields: t('product.label') }), "error");
        }
    }

    return(<>
        <div className="prodForm">
            <form>
                <ProductOptions value={selectedOption} handleOption={handleOption}/>

                {selectedOption && <>
                    <p className="pm-section-hint">{t('admin.product.fillOneField')}</p>
                    <div className="pm-field-row">
                        <div className="mb-3">
                            <label htmlFor="ref" className="form-label">{t('product.category')} :</label>
                            <input type="text" className="form-control" id="category" value={category} onChange={(e) => setCategory(e.target.value)}/>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="ref" className="form-label">{t('product.ref')} :</label>
                            <input type="text" className="form-control" id="ref" value={ref} onChange={(e) => setRef(e.target.value)}/>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label">{t('product.name')} :</label>
                        <input type="text" className="form-control" id="name" value={name} onChange={(e) => setName(e.target.value)}/>
                    </div>
                    <div className="pm-field-row">
                        <div className="mb-3">
                            <label htmlFor="price" className="form-label">{t('product.price')} :</label>
                            <input type="number" className="form-control" id="price" value={price} onChange={(e) => setPrice(Number(e.target.value))} min="0"/>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="promo" className="form-label">{t('product.promotion')} (%):</label>
                            <input type="number" className="form-control" id="promo" value={promo} onChange={(e) => setPromo(Number(e.target.value))} min="0" max="100"/>
                        </div>
                    </div>
                    <div className="mb-3 form-check form-switch">
                        <input type="checkbox" className="form-check-input" id="newest" checked={newest} onChange={() => { setNewest(!newest); setNewestTouched(true); }}/>
                        <label htmlFor="newest" className="form-check-label">{t('admin.product.newer')} :</label>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="mainImage" className="form-label">{t('admin.product.mainImage')} :</label>
                        <input type="file" accept="image/*" className="form-control" id="mainImage" onChange={handleImageChange}/>
                        {imagePreview && (
                            <div className="pm-image-preview-row">
                                <img src={imagePreview} alt="" className="pm-image-thumb"/>
                            </div>
                        )}
                    </div>
                    <div className="mb-3">
                        <label htmlFor="images" className="form-label">
                            {t('admin.product.additionalImages')} ({images.length}/4) :
                        </label>
                        <input type="file" accept="image/*" className="form-control" id="images" multiple onChange={handleImagesChange} disabled={images.length >= 4}/>
                        {imagesPreviews.length > 0 && (
                            <div className="pm-image-preview-row">
                                {imagesPreviews.map((url, i) => (
                                    <div key={i} className="pm-image-thumb-wrap">
                                        <img src={url} alt="" className="pm-image-thumb"/>
                                        <button type="button" className="pm-image-thumb-remove" onClick={() => removeImage(i)}>
                                            <FaXmark/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button type="button" className="btn btn-primary fw-bold" onClick={openConfirmation}>{t('form.submit')}</button>
                </>}
            </form>
        </div>
        <ConfirmActionModal
            open={isModal}
            title={t('admin.product.updateTitle')}
            message={t('admin.product.updateWarning')}
            targetLabel={selectedOption?.label}
            confirmLabel={t('admin.product.updateConfirm')}
            cancelLabel={t('ui.cancel')}
            loading={isSubmitting}
            onConfirm={handleSubmit}
            onClose={() => !isSubmitting && setIsModal(false)}
        />
    </>)
};

export default ProdModif;
