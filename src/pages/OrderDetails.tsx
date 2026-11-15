import React, { useEffect, useState } from "react";
import Sidebar from "@/layout/Sidebar";
import DbHeader from "@/layout/DbHeader";
import "../styles/orderDetails.css";
import { useParams } from "react-router-dom";
import { hideInfos } from "@/utils/general";
import { selectedLang } from "@/utils/i18n";
import { showToast } from "@/utils/toast";
import { useLangContext } from "../contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBan, faCircleCheck, faCircleXmark, faInfoCircle, faSortAmountDown,
    faTriangleExclamation, faUser, faEnvelope, faPhone, faLocationDot,
    faReceipt, faFileArrowDown, faEye, faTruck, faHashtag, faPen,
} from "@fortawesome/free-solid-svg-icons";
import apiInstance from "@/lib/api";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { faWpforms } from "@fortawesome/free-brands-svg-icons";
import DeliveryForm from "../processing/DeliveryForm";
import { useDeliveryMen } from "@/server/users";
import type { DashboardOrder } from "@/server/orders";
import type { Deficiency } from "@/server/deficiencies";
import Select, { StylesConfig } from "react-select";

interface DeliveryManOption {
    value: string;
    label: string;
}

// Aligns react-select's chrome with the app's .form-select look (index.css)
// instead of the library's unstyled defaults.
const deliveryManSelectStyles: StylesConfig<DeliveryManOption, false> = {
    control: (base, state) => ({
        ...base,
        minHeight: 42,
        borderRadius: "var(--db-radius-sm)",
        borderColor: state.isFocused ? "var(--db-brand)" : "var(--db-border)",
        boxShadow: state.isFocused ? "0 0 0 3px rgba(14,146,228,0.15)" : "none",
        "&:hover": { borderColor: "var(--db-brand)" },
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? "var(--db-brand)" : state.isFocused ? "var(--db-bg)" : "transparent",
        color: state.isSelected ? "#fff" : "var(--db-ink)",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

const connecter = apiInstance;

const OrderDetails : React.FC = () => {
    const {orderID} = useParams();
    const {t} = useTranslation();
    const {currentLang} = useLangContext();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFound, setIsFound] = useState<boolean>();
    const [isError, setIsError] = useState<boolean>();
    const [order, setOrder] = useState<DashboardOrder>();
    const [orderDeficiencies, setOrderDeficiencies] = useState<Deficiency[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<{orderedProducts:boolean, deficiencies:boolean}>({orderedProducts:false, deficiencies:false});
    const [selectedDeliveryMan, setSelectedDeliveryMan] = useState<DeliveryManOption | null>(null);
    const [isEditingDeliveryMan, setIsEditingDeliveryMan] = useState<boolean>(false);
    const [reassignValue, setReassignValue] = useState<DeliveryManOption | null>(null);
    const [isReassigning, setIsReassigning] = useState<boolean>(false);
    const { deliveryMen } = useDeliveryMen();
    const deliveryManOptions: DeliveryManOption[] = deliveryMen.map((man) => ({
        value: man.username,
        label: `${man.first_name} ${man.last_name}`,
    }));
    // Falls back to the raw username if the account isn't in the (active)
    // delivery-men list anymore — still shows something instead of blanking.
    const assignedDeliveryManOption: DeliveryManOption | null = order?.delivery_man
        ? deliveryManOptions.find((o) => o.value === order.delivery_man) ?? { value: order.delivery_man, label: order.delivery_man }
        : null;

    const toggleExpand = (product:string) => {
        setIsExpanded((prev)=>({...prev, [product]:!prev[product as keyof {orderedProducts:boolean, deficiencies:boolean}]}));
    };

    useEffect(()=>{
        const getOrder = async() => {
            setIsLoading(true);
            try{
                const response = await apiInstance.get<{
                    error: boolean;
                    found: boolean;
                    order: DashboardOrder;
                    deficiencies: Deficiency[];
                }>(`db/orders/searched/get?orderID=${orderID}`);
                const res = response.data;
                if(!res.error){
                    setIsFound(res.found);
                    setOrder(res.order);
                    setIsError(res.error);
                    setOrderDeficiencies(res.deficiencies);
                }else{
                    setIsError(true);
                }
            } finally {
                setIsLoading(false);
            }
        };
        getOrder();
    }, [orderID])

    const onBack = () => { window.close() }

    const getUrl = async (ord: DashboardOrder) => {
        if(ord.exception){
            showToast(t('admin.deficiency.message'), "warning")
        } else if (!selectedDeliveryMan) {
            showToast(t('admin.orders.deliveryManRequired'), "warning")
        } else {
            const actualDate = new Date();
            const clientInfos = ord.client;
            const items = ord.ordered_products;
            const orderDetails = {
                amount: ord.amount,
                discount: 0,
                shipping: 0,
                paymentMethod: ord.payment_mode ? "Credit Card" : "Cash on delivery",
                shippingMethod: "Colissimo",
                shippingDate: actualDate.toLocaleDateString(),
                date: ord.date,
                order_id: ord.order_id,
            }
            try{
                setIsGenerating(true);
                const pdfUrl = await DeliveryForm(items, orderDetails, clientInfos);
                const deliveryBlob = await (await fetch(pdfUrl)).blob()
                const deliveryFile = new File([deliveryBlob], `${clientInfos.first_name}_${clientInfos.last_name}.pdf`, {type: 'application/pdf'});
                const formData = new FormData();
                const NoWaiting = true;
                formData.append('status', NoWaiting.toString());
                formData.append('delivery_form', deliveryFile);
                formData.append('delivery_man', selectedDeliveryMan!.value);

                const response = await connecter.patch(`db/orders/manager/${ord.id}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if(response.status == 200){
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = `${clientInfos.first_name}_${clientInfos.last_name}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(pdfUrl);

                    // FIX: this used to flip a separate `isOrderTreated` flag
                    // that swapped the ENTIRE page for a bare checkmark screen
                    // with no way back except reloading. Now the fresh server
                    // data (status + the real, durable delivery_form URL) is
                    // merged into `order` in place, so the same details view
                    // stays visible and the new "Preview delivery form" link
                    // below appears immediately, without losing the page.
                    setOrder((prev) => prev ? ({ ...prev, ...response.data }) : prev);
                    showToast(t('admin.orders.treated'), "success");
                }
            } catch(error){
                showToast(String(error), "error");
            } finally {
                setIsGenerating(false);
            }
        }
    }

    const saveReassignment = async () => {
        if (!reassignValue || !order) return;
        setIsReassigning(true);
        try {
            const formData = new FormData();
            formData.append('delivery_man', reassignValue.value);
            const response = await connecter.patch(`db/orders/manager/${order.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.status == 200) {
                setOrder((prev) => prev ? ({ ...prev, ...response.data }) : prev);
                showToast(t('admin.orders.deliveryManUpdated'), "success");
                setIsEditingDeliveryMan(false);
            }
        } catch {
            showToast(t('admin.orders.deliveryManUpdateFailed'), "error");
        } finally {
            setIsReassigning(false);
        }
    };

    const processDeficiency = async(item: Deficiency) => {
        setIsLoading(true);
        const response = await connecter.post(`db/deficiencies/process`, {
            exceptionID: item.exception_id,
            orderID: item.order.order_id
        });
        if(response.status == 200){
            showToast(t("admin.deficiency.success"), "success");
        }
        setIsLoading(false);
        onBack();
    }

    // ── Overall status pill — reflects delivered > processed > awaiting ──────
    const renderStatusPill = () => {
        if (!order) return null;
        if (order.delivered) {
            return <span className="db-status-pill db-status-pill--success"><FontAwesomeIcon icon={faTruck}/>{t('admin.orders.statusDelivered')}</span>;
        }
        if (order.status) {
            return <span className="db-status-pill db-status-pill--info"><FontAwesomeIcon icon={faCircleCheck}/>{t('admin.orders.processed')}</span>;
        }
        return <span className="db-status-pill db-status-pill--warning"><FontAwesomeIcon icon={faTriangleExclamation}/>{t('admin.orders.awaitingProcessing')}</span>;
    };

    return(<>
        <Sidebar/>
        <div className={`db-home ${selectedLang(currentLang)=='ar'&&'rtl'}`}>
            <DbHeader/>
            <hr/>
            <div className="od-page-header">
                <h5 className="d-flex align-items-center fw-bold m-0" style={{color:'var(--db-brand-dark)'}}>
                    <FontAwesomeIcon icon={faInfoCircle} className="mx-2"/>
                    {t('order.details')}
                </h5>
                {renderStatusPill()}
            </div>

            {isLoading ?
                <Loading message={t('ui.loading')}/>
            : isError ?
                <div className="d-flex align-items-center flex-column mt-4">
                    <FontAwesomeIcon icon={faTriangleExclamation} size="6x" shake style={{color:"#ff0000"}}/>
                    <p className="my-3 fw-bold fs-4">{orderID} {t('tracking.noValidId')}</p>
                </div>
            : isFound && order ?
                <>
                    <div className="db-card">
                        <div className="db-card-header">
                            <FontAwesomeIcon icon={faUser}/>
                            {t('admin.orders.clientInfo')}
                        </div>
                        <div className="db-field-grid">
                            <div className="db-field">
                                <div className="db-field-icon"><FontAwesomeIcon icon={faUser}/></div>
                                <div>
                                    <span className="db-field-label">{t('form.fullName')}</span>
                                    <span className="db-field-value">{order.client.last_name + ' ' + order.client.first_name}</span>
                                </div>
                            </div>
                            <div className="db-field">
                                <div className="db-field-icon"><FontAwesomeIcon icon={faEnvelope}/></div>
                                <div>
                                    <span className="db-field-label">{t('form.email.label')}</span>
                                    <span className="db-field-value">{order.client.email}</span>
                                </div>
                            </div>
                            <div className="db-field">
                                <div className="db-field-icon"><FontAwesomeIcon icon={faPhone}/></div>
                                <div>
                                    <span className="db-field-label">{t('form.phone.label')}</span>
                                    <span className="db-field-value">{order.client.phone}</span>
                                </div>
                            </div>
                            <div className="db-field">
                                <div className="db-field-icon"><FontAwesomeIcon icon={faLocationDot}/></div>
                                <div>
                                    <span className="db-field-label">{t('form.address.label')}</span>
                                    <span className="db-field-value">{order.client.address + ' ' + order.client.city}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="db-card">
                        <div className="db-card-header">
                            <FontAwesomeIcon icon={faReceipt}/>
                            {t('admin.orders.orderInfo')}
                        </div>
                        <div className="db-field-grid">
                            <div className="db-field">
                                <div className="db-field-icon"><FontAwesomeIcon icon={faHashtag}/></div>
                                <div>
                                    <span className="db-field-label">{t('order.orderId')}</span>
                                    <span className="db-field-value db-field-value--mono">{orderID}</span>
                                </div>
                            </div>
                            <div className="db-field">
                                <div className="db-field-icon"><FontAwesomeIcon icon={faHashtag}/></div>
                                <div>
                                    <span className="db-field-label">{t('transaction.transactionId')}</span>
                                    <span className="db-field-value db-field-value--mono">{order.transaction_id || '—'}</span>
                                </div>
                            </div>
                            <div className="db-field">
                                <div className="db-field-icon"><FontAwesomeIcon icon={faSortAmountDown}/></div>
                                <div>
                                    <span className="db-field-label">{t('admin.deficiency.title')}</span>
                                    <span className="db-field-value">{orderDeficiencies.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="db-card">
                        <div className="db-card-header">
                            <FontAwesomeIcon icon={faWpforms}/>
                            {t('admin.product.orderedProducts')}
                        </div>
                        {order.ordered_products.length > 0 ? <>
                            <div className="table-responsive">
                                <table className="table orders-table mb-2" style={{width:"100%"}}>
                                    <thead>
                                        <tr>
                                            <th>{t('product.type')}</th>
                                            <th>{t('product.category')}</th>
                                            <th>{t('product.ref')}</th>
                                            <th>{t('product.name')}</th>
                                            <th>{t('product.size')}</th>
                                            <th>{t('product.quantity')}</th>
                                            <th>{t('product.availability')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.isArray(order.ordered_products) && order.ordered_products.slice(0, isExpanded.orderedProducts ? order.ordered_products.length : 3).map((ord, index) => (
                                            <tr key={index}>
                                                <td>{ord.product_type}</td>
                                                <td>{ord.category}</td>
                                                <td>{ord.ref}</td>
                                                <td>{ord.name}</td>
                                                <td>{ord.size}</td>
                                                <td>{ord.quantity}</td>
                                                <td>{ord.available ?
                                                    <FontAwesomeIcon icon={faCircleCheck} color="var(--db-success)" size="lg"/>
                                                    : <FontAwesomeIcon icon={faCircleXmark} color="var(--db-danger)" size="lg"/>
                                                }</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {order.ordered_products.length > 3 && (
                                <div className="text-center">
                                    <button className="btn btn-outline-primary btn-sm" onClick={() => toggleExpand("orderedProducts")}>
                                        {!isExpanded.orderedProducts ? `${t('product.readMore')} (+ ${order.ordered_products.length - 3})` : t('product.readLess')}
                                    </button>
                                </div>
                            )}
                        </> : <EmptyState message={t('admin.orders.noProducts')}/>}
                    </div>

                    <div className="db-card">
                        <div className="db-card-header">
                            <FontAwesomeIcon icon={faSortAmountDown}/>
                            {t('admin.deficiency.title')}
                        </div>
                        {orderDeficiencies.length > 0 ? <>
                            <div className="table-responsive">
                                <table className="table orders-table mb-2" style={{width:"100%"}}>
                                    <thead>
                                        <tr>
                                            <th>{t('order.orderId')}</th>
                                            <th>{t('product.type')}</th>
                                            <th>{t('product.category')}</th>
                                            <th>{t('product.ref')}</th>
                                            <th>{t('product.name')}</th>
                                            <th>{t('product.size')}</th>
                                            <th>{t('admin.deficiency.quantityRequested')}</th>
                                            <th>{t('admin.orders.action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderDeficiencies.slice(0, isExpanded.deficiencies ? orderDeficiencies.length : 3).map((ord, index) => (
                                            <tr key={index}>
                                                <td>{hideInfos(ord.order.order_id, 30)}</td>
                                                <td>{ord.product_type}</td>
                                                <td>{ord.product_category}</td>
                                                <td>{ord.product_ref}</td>
                                                <td>{ord.product_name}</td>
                                                <td>{ord.product_size}</td>
                                                <td>{ord.delta_quantity}</td>
                                                <td>
                                                    <button className="btn btn-primary btn-sm" onClick={() => processDeficiency(ord)} disabled={ord.treated}>
                                                        {ord.treated ? t('admin.orders.treated_label') : t('admin.deficiency.process')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {orderDeficiencies.length > 3 && (
                                <div className="text-center">
                                    <button className="btn btn-outline-primary btn-sm" onClick={() => toggleExpand("deficiencies")}>
                                        {!isExpanded.deficiencies ? `${t('product.readMore')} (+ ${orderDeficiencies.length - 3})` : t('product.readLess')}
                                    </button>
                                </div>
                            )}
                        </> : <EmptyState message={t('admin.deficiency.noFound')}/>}
                    </div>

                    <div className="db-card">
                        <div className="db-card-header">
                            <FontAwesomeIcon icon={faTruck}/>
                            {order.delivery_man ? t('admin.orders.deliveryManAssigned') : t('admin.orders.assignDeliveryMan')}
                        </div>

                        {!order.delivery_man ? (
                            <div className="od-delivery-picker">
                                <label className="form-label">{t('admin.orders.selectDeliveryMan')} :</label>
                                <Select<DeliveryManOption>
                                    classNamePrefix="db-select"
                                    styles={deliveryManSelectStyles}
                                    options={deliveryManOptions}
                                    value={selectedDeliveryMan}
                                    onChange={setSelectedDeliveryMan}
                                    placeholder={t('admin.orders.selectDeliveryMan')}
                                    isClearable
                                    noOptionsMessage={() => t('admin.orders.noDeliveryMen')}
                                />
                            </div>
                        ) : isEditingDeliveryMan ? (
                            <div className="od-delivery-picker">
                                <label className="form-label">{t('admin.orders.change')} :</label>
                                <div className="od-delivery-picker-row">
                                    <Select<DeliveryManOption>
                                        classNamePrefix="db-select"
                                        styles={deliveryManSelectStyles}
                                        options={deliveryManOptions}
                                        value={reassignValue}
                                        onChange={setReassignValue}
                                        placeholder={t('admin.orders.selectDeliveryMan')}
                                        isClearable
                                        autoFocus
                                    />
                                    <div className="od-delivery-picker-actions">
                                        <button
                                            className="btn btn-success"
                                            onClick={saveReassignment}
                                            disabled={!reassignValue || reassignValue.value === order.delivery_man || isReassigning}
                                        >
                                            {isReassigning ? t('ui.loading') : t('ui.save')}
                                        </button>
                                        <button className="btn btn-outline-secondary" onClick={() => setIsEditingDeliveryMan(false)}>
                                            {t('ui.cancel')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <div className="db-field">
                                    <div className="db-field-icon"><FontAwesomeIcon icon={faTruck}/></div>
                                    <div>
                                        <span className="db-field-label">{t('admin.users.deliveryMan')}</span>
                                        <span className="db-field-value">{assignedDeliveryManOption!.label}</span>
                                    </div>
                                </div>
                                {!order.delivered && (
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => { setReassignValue(assignedDeliveryManOption!); setIsEditingDeliveryMan(true); }}
                                    >
                                        <FontAwesomeIcon icon={faPen} className="mx-1"/>
                                        {t('admin.orders.change')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="od-actions">
                        {order.delivery_form && (
                            <a href={order.delivery_form} target="_blank" rel="noreferrer" className="btn btn-outline-primary">
                                <FontAwesomeIcon icon={faEye} className="mx-1"/>
                                {t('admin.orders.previewDeliveryForm')}
                            </a>
                        )}
                        {order.invoice && (
                            <a href={order.invoice} target="_blank" rel="noreferrer" className="btn btn-outline-primary">
                                <FontAwesomeIcon icon={faEye} className="mx-1"/>
                                {t('admin.orders.previewInvoice')}
                            </a>
                        )}
                        <button className="btn btn-success" onClick={() => getUrl(order)} disabled={order.status || isGenerating || !selectedDeliveryMan}>
                            <FontAwesomeIcon icon={faFileArrowDown} className="mx-1"/>
                            {isGenerating ? t('admin.orders.generating') : order.status ? t('admin.orders.alreadyTreated') : t('admin.orders.extractDeliveryForm')}
                        </button>
                        <button className="btn btn-danger" onClick={onBack}>{t('ui.back')}</button>
                    </div>
                </>
            :
                <div className="d-flex align-items-center flex-column mt-5">
                    <FontAwesomeIcon icon={faBan} size="6x" shake style={{color:"#ff0000"}}/>
                    <p className="my-3 fw-bold fs-4">{t('tracking.noOrderFound')}</p>
                    <p className="my-3 fw-bold fs-4">{t('tracking.idProvided')} : {orderID}</p>
                </div>
            }
        </div>
    </>);
}
export default OrderDetails;
