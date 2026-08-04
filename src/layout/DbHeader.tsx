import React, { useEffect, useMemo, useState } from "react";
import "./DbHeader.css"
import { GrOverview } from "react-icons/gr";
import {useOrders} from "@/server/orders";
import { FaWpforms, FaSackDollar, FaCalculator, FaBoxesPacking, FaTruckFast } from "react-icons/fa6";
import { FaSortAmountDown } from "react-icons/fa";
import {useDeficiencies} from "@/server/deficiencies";
import { useTranslation } from "react-i18next";
import SidebarPhoneNav from "./SidebarPhoneNav";
import { useAuth } from "@/contexts/Authentication";
import { Rings } from "react-loader-spinner";

const DbHeader : React.FC = () => {
    const {t} = useTranslation();
    const {user} = useAuth();
    // FIX: both counts default to an empty array while their request is
    // still in flight, so `.length` read 0 and flashed a real-looking "0"
    // before suddenly jumping to the actual count. `loading` was already
    // returned by both hooks but unused here — using it to show a small
    // spinner instead removes that misleading flash.
    const {remainingOrders, allOrders, deliveredOrders, waitingDeliveryOrders, loading: ordersLoading} = useOrders();
    const {deficiencies, loading: deficienciesLoading} = useDeficiencies();
    const [isPhone, setIsPhone] = useState<boolean>();

    // Revenue and average order value for the current calendar month, computed
    // client-side from allOrders (already fetched by useOrders — no extra
    // request). Only orders that represent real/expected income count:
    // "confirmed" (paid online) and "cod" (cash on delivery); "pending" and
    // "failed" are excluded.
    const monthRevenue = useMemo(() => {
        if (!allOrders || allOrders.length === 0) return { total: 0, count: 0, currency: undefined as string | undefined };
        const now = new Date();
        const qualifying = allOrders.filter((o) => {
            if (o.is_paid !== 'confirmed' && o.is_paid !== 'cod') return false;
            if (!o.date) return false;
            const d = new Date(o.date);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
        const total = qualifying.reduce((sum, o) => sum + (o.amount || 0), 0);
        return { total, count: qualifying.length, currency: qualifying[0]?.currency };
    }, [allOrders]);
    const avgOrderValue = monthRevenue.count > 0 ? Math.round(monthRevenue.total / monthRevenue.count) : 0;



    useEffect(()=>{
        const handleResize = () =>{
            if(window.innerWidth <= 855){ setIsPhone(true); }
            else { setIsPhone(false); }
        }
        handleResize();
        window.addEventListener("resize", handleResize);
        return ()=>window.removeEventListener("resize", handleResize)
    },[])

    return(<>
        {isPhone && <SidebarPhoneNav/>}
        <div className={`db-header d-flex flex-column ${isPhone ? 'db-header--phone' : ''}`}>
            <div className="fw-bold my-1 text-center" style={{color:"#0e92e4"}}>
                {t('auth.welcomeBack')} {user?.username}
            </div>
            <div className="db-home-overview m-1 fs-5 mb-3 fw-bold"><GrOverview className="mx-2"/>{t('admin.overview.general')}</div>
            <div className="d-flex flex-wrap">
                <div className={`m-1 border db-notConfirmed ${ordersLoading ? 'db-notConfirmed--loading' : (!remainingOrders || remainingOrders.length == 0 ? 'null border-warning' : 'border-danger')} fw-bold rounded d-flex flex-row p-1 align-items-center`}>
                    <div className={`db-notConfirmed-lg ${ordersLoading ? 'db-notConfirmed--loading' : (!remainingOrders || remainingOrders.length == 0 ? 'null' : '')} rounded mx-2`}>
                        <FaWpforms className="p-1" size={50} color={ordersLoading ? '#94a3b8' : (!remainingOrders || remainingOrders.length == 0 ? '#ffc107' : 'red')}/>
                    </div>
                    <div className="mx-1 text-muted">{t('admin.orders.notConfirmed')} :</div>
                    <div className="mx-1 db-stat-value" style={{color: ordersLoading ? '#94a3b8' : (!remainingOrders || remainingOrders.length == 0 ? '#ffc107' : 'red')}}>
                        {ordersLoading
                            ? <Rings height="20" width="20" color="#94a3b8" ariaLabel="loading" wrapperStyle={{display:'inline-flex'}}/>
                            : remainingOrders?.length}
                    </div>
                </div>
                <div className={`m-1 border db-notConfirmed ${deficienciesLoading ? 'db-notConfirmed--loading' : (!deficiencies || deficiencies.length == 0 ? 'null border-warning' : 'border-danger')} fw-bold rounded d-flex flex-row p-1 align-items-center`}>
                    <div className={`db-notConfirmed-lg ${deficienciesLoading ? 'db-notConfirmed--loading' : (!deficiencies || deficiencies.length == 0 ? 'null' : '')} rounded mx-2`}>
                        <FaSortAmountDown className="p-1" size={50} color={deficienciesLoading ? '#94a3b8' : (!deficiencies || deficiencies.length == 0 ? '#ffc107' : 'red')}/>
                    </div>
                    <div className="mx-1 text-muted">{t('admin.deficiency.current')} :</div>
                    <div className="mx-1 db-stat-value" style={{color: deficienciesLoading ? '#94a3b8' : (!deficiencies || deficiencies?.length == 0 ? '#ffc107' : 'red')}}>
                        {deficienciesLoading
                            ? <Rings height="20" width="20" color="#94a3b8" ariaLabel="loading" wrapperStyle={{display:'inline-flex'}}/>
                            : deficiencies?.length}
                    </div>
                </div>

                <div className={`m-1 border db-notConfirmed ${ordersLoading ? 'db-notConfirmed--loading' : 'db-notConfirmed--brand'} fw-bold rounded d-flex flex-row p-1 align-items-center`}>
                    <div className={`db-notConfirmed-lg ${ordersLoading ? 'db-notConfirmed--loading' : 'db-notConfirmed--brand'} rounded mx-2`}>
                        <FaSackDollar className="p-1" size={50} color={ordersLoading ? '#94a3b8' : '#0e92e4'}/>
                    </div>
                    <div className="mx-1 text-muted">{t('admin.overview.revenueThisMonth')} :</div>
                    <div className="mx-1 db-stat-value" style={{color: ordersLoading ? '#94a3b8' : '#0e92e4'}}>
                        {ordersLoading
                            ? <Rings height="20" width="20" color="#94a3b8" ariaLabel="loading" wrapperStyle={{display:'inline-flex'}}/>
                            : `${monthRevenue.total.toLocaleString()}${monthRevenue.currency ? ' ' + monthRevenue.currency : ''}`}
                    </div>
                </div>

                <div className={`m-1 border db-notConfirmed ${ordersLoading ? 'db-notConfirmed--loading' : 'db-notConfirmed--brand'} fw-bold rounded d-flex flex-row p-1 align-items-center`}>
                    <div className={`db-notConfirmed-lg ${ordersLoading ? 'db-notConfirmed--loading' : 'db-notConfirmed--brand'} rounded mx-2`}>
                        <FaCalculator className="p-1" size={50} color={ordersLoading ? '#94a3b8' : '#0e92e4'}/>
                    </div>
                    <div className="mx-1 text-muted">{t('admin.overview.avgOrderValue')} :</div>
                    <div className="mx-1 db-stat-value" style={{color: ordersLoading ? '#94a3b8' : '#0e92e4'}}>
                        {ordersLoading
                            ? <Rings height="20" width="20" color="#94a3b8" ariaLabel="loading" wrapperStyle={{display:'inline-flex'}}/>
                            : `${avgOrderValue.toLocaleString()}${monthRevenue.currency ? ' ' + monthRevenue.currency : ''}`}
                    </div>
                </div>

                <div className={`m-1 border db-notConfirmed ${ordersLoading ? 'db-notConfirmed--loading' : 'db-notConfirmed--success'} fw-bold rounded d-flex flex-row p-1 align-items-center`}>
                    <div className={`db-notConfirmed-lg ${ordersLoading ? 'db-notConfirmed--loading' : 'db-notConfirmed--success'} rounded mx-2`}>
                        <FaBoxesPacking className="p-1" size={50} color={ordersLoading ? '#94a3b8' : '#16a34a'}/>
                    </div>
                    <div className="mx-1 text-muted">{t('admin.orders.delivered')} :</div>
                    <div className="mx-1 db-stat-value" style={{color: ordersLoading ? '#94a3b8' : '#16a34a'}}>
                        {ordersLoading
                            ? <Rings height="20" width="20" color="#94a3b8" ariaLabel="loading" wrapperStyle={{display:'inline-flex'}}/>
                            : deliveredOrders?.length}
                    </div>
                </div>

                <div className={`m-1 border db-notConfirmed ${ordersLoading ? 'db-notConfirmed--loading' : 'db-notConfirmed--brand'} fw-bold rounded d-flex flex-row p-1 align-items-center`}>
                    <div className={`db-notConfirmed-lg ${ordersLoading ? 'db-notConfirmed--loading' : 'db-notConfirmed--brand'} rounded mx-2`}>
                        <FaTruckFast className="p-1" size={50} color={ordersLoading ? '#94a3b8' : '#0e92e4'}/>
                    </div>
                    <div className="mx-1 text-muted">{t('admin.orders.waitingDelivery')} :</div>
                    <div className="mx-1 db-stat-value" style={{color: ordersLoading ? '#94a3b8' : '#0e92e4'}}>
                        {ordersLoading
                            ? <Rings height="20" width="20" color="#94a3b8" ariaLabel="loading" wrapperStyle={{display:'inline-flex'}}/>
                            : waitingDeliveryOrders?.length}
                    </div>
                </div>
            </div>
        </div>
    </>)
};

export default DbHeader;
